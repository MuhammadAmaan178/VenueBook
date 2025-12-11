"""
Booking routes blueprint.

Handles booking creation and review submission.
"""
from flask import Blueprint, request, jsonify

from utils.db import get_db_connection
from utils.decorators import token_required
from utils.log_utils import log_booking_action, log_review_action
from utils.notification_utils import notify_booking_created, notify_new_review

bookings_bp = Blueprint('bookings', __name__, url_prefix='/api/bookings')


@bookings_bp.route('', methods=['POST'])
@token_required
def create_booking():
    """Submit booking form"""
    try:
        data = request.json
        
        venue_id = data.get('venue_id')
        event_date = data.get('event_date')
        slot = data.get('slot')
        event_type = data.get('event_type')
        special_requirements = data.get('special_requirements', '')
        
        # Customer details
        fullname = data.get('fullname')
        email = data.get('email')
        phone_primary = data.get('phone_primary')
        phone_secondary = data.get('phone_secondary')
        
        # Facilities
        facility_ids = data.get('facility_ids', [])
        
        # Payment details
        amount = data.get('amount')
        payment_method = data.get('payment_method')
        trx_id = data.get('trx_id', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check venue availability
        cursor.execute("""
            SELECT is_available FROM venue_availability
            WHERE venue_id = %s AND date = %s AND slot = %s
        """, (venue_id, event_date, slot))
        availability = cursor.fetchone()
        
        if availability and not availability['is_available']:
            return jsonify({'error': 'Slot not available'}), 400
        
        # Create booking
        cursor.execute("""
            INSERT INTO bookings (user_id, venue_id, event_date, slot, event_type, 
                                 special_requirements, total_price, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending', NOW())
        """, (request.user_id, venue_id, event_date, slot, event_type, 
              special_requirements, amount))
        
        booking_id = cursor.lastrowid
        
        # Add customer details
        cursor.execute("""
            INSERT INTO booking_customer_details 
            (booking_id, fullname, email, phone_primary, phone_secondary)
            VALUES (%s, %s, %s, %s, %s)
        """, (booking_id, fullname, email, phone_primary, phone_secondary))
        
        # Add facilities
        for facility_id in facility_ids:
            cursor.execute("""
                INSERT INTO booking_facilities (booking_id, facility_id)
                VALUES (%s, %s)
            """, (booking_id, facility_id))
        
        # Add payment
        cursor.execute("""
            INSERT INTO booking_payments 
            (booking_id, amount, method, trx_id, payment_status, payment_date)
            VALUES (%s, %s, %s, %s, 'pending', NOW())
        """, (booking_id, amount, payment_method, trx_id))
        
        # Update venue availability
        cursor.execute("""
            INSERT INTO venue_availability (venue_id, date, slot, is_available)
            VALUES (%s, %s, %s, 0)
            ON DUPLICATE KEY UPDATE is_available = 0
        """, (venue_id, event_date, slot))
        
        # Create notification for owner
        cursor.execute("SELECT owner_id FROM venues WHERE venue_id = %s", (venue_id,))
        owner = cursor.fetchone()
        if owner:
            cursor.execute("SELECT user_id FROM owners WHERE owner_id = %s", (owner['owner_id'],))
            owner_user = cursor.fetchone()
            if owner_user:
                cursor.execute("""
                    INSERT INTO notifications 
                    (user_id, title, message, type, booking_id, venue_id, is_read, created_at)
                    VALUES (%s, %s, %s, 'booking', %s, %s, 0, NOW())
                """, (owner_user['user_id'], 'New Booking Request', 
                      f'New booking request for {event_type}', booking_id, venue_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        # Log booking creation
        log_booking_action(request.user_id, 'create', booking_id, f"Created {event_type} booking for venue #{venue_id}")
        
        # Send notification to owner
        notify_booking_created(booking_id)
        
        return jsonify({
            'message': 'Booking created successfully',
            'booking_id': booking_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bookings_bp.route('/<int:booking_id>/review', methods=['POST'])
@token_required
def submit_review(booking_id):
    """Submit review for completed booking"""
    try:
        data = request.json
        rating = data.get('rating')
        review_text = data.get('review_text', '')
        
        if not rating or rating < 1 or rating > 5:
            return jsonify({'error': 'Invalid rating'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if booking exists and is completed
        cursor.execute("""
            SELECT venue_id, user_id, status 
            FROM bookings 
            WHERE booking_id = %s
        """, (booking_id,))
        booking = cursor.fetchone()
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        if booking['user_id'] != request.user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if booking['status'] != 'completed':
            return jsonify({'error': 'Can only review completed bookings'}), 400
        
        # Check if review already exists
        cursor.execute("""
            SELECT review_id FROM booking_reviews 
            WHERE booking_id = %s
        """, (booking_id,))
        if cursor.fetchone():
            return jsonify({'error': 'Review already submitted'}), 400
        
        # Insert review
        cursor.execute("""
            INSERT INTO booking_reviews 
            (booking_id, user_id, venue_id, rating, review_text, review_date)
            VALUES (%s, %s, %s, %s, %s, NOW())
        """, (booking_id, request.user_id, booking['venue_id'], rating, review_text))
        
        # Update venue rating
        cursor.execute("""
            UPDATE venues 
            SET rating = (
                SELECT AVG(rating) 
                FROM booking_reviews 
                WHERE venue_id = %s
            )
            WHERE venue_id = %s
        """, (booking['venue_id'], booking['venue_id']))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        review_id = cursor.lastrowid
        
        # Log review submission
        log_review_action(request.user_id, 'create', review_id, f"Submitted {rating}-star review for booking #{booking_id}")
        
        # Notify owner of new review
        notify_new_review(booking['venue_id'], rating)
        
        return jsonify({'message': 'Review submitted successfully'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
