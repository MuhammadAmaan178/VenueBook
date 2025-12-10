"""
Owner panel routes blueprint.

Handles all owner-specific functionality including dashboard, venue management,
bookings, payments, reviews, and profile management.
"""
from flask import Blueprint, request, jsonify

from utils.db import get_db_connection
from utils.decorators import token_required, owner_required

owner_bp = Blueprint('owner', __name__, url_prefix='/api/owner')


# ============================================================================
# DASHBOARD & ANALYTICS
# ============================================================================

@owner_bp.route('/<int:owner_id>/dashboard', methods=['GET'])
@token_required
@owner_required
def get_owner_dashboard(owner_id):
    """Get owner dashboard statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Total venues
        cursor.execute("""
            SELECT COUNT(*) as total_venues 
            FROM venues WHERE owner_id = %s
        """, (owner_id,))
        total_venues = cursor.fetchone()['total_venues']
        
        # Total bookings
        cursor.execute("""
            SELECT COUNT(*) as total_bookings 
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE v.owner_id = %s
        """, (owner_id,))
        total_bookings = cursor.fetchone()['total_bookings']
        
        # Total revenue (from completed payments)
        cursor.execute("""
            SELECT COALESCE(SUM(b.total_price), 0) as total_revenue 
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE v.owner_id = %s AND b.status IN ('confirmed', 'completed')
        """, (owner_id,))
        total_revenue = cursor.fetchone()['total_revenue']
        
        # Average rating across all venues
        cursor.execute("""
            SELECT COALESCE(AVG(rating), 0) as avg_rating 
            FROM venues WHERE owner_id = %s
        """, (owner_id,))
        avg_rating = cursor.fetchone()['avg_rating']
        
        # Top 5 venues by rating
        cursor.execute("""
            SELECT venue_id, name, city, base_price, rating, status, capacity, type
            FROM venues 
            WHERE owner_id = %s
            ORDER BY rating DESC, created_at DESC
            LIMIT 5
        """, (owner_id,))
        top_venues = cursor.fetchall()
        
        # Recent bookings (top 5 by date)
        cursor.execute("""
            SELECT b.booking_id, b.event_date, b.status, b.total_price, b.slot,
                   v.name as venue_name, v.venue_id, bcd.fullname as customer_name
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            LEFT JOIN booking_customer_details bcd ON b.booking_id = bcd.booking_id
            WHERE v.owner_id = %s
            ORDER BY b.event_date DESC, b.created_at DESC
            LIMIT 5
        """, (owner_id,))
        recent_bookings = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'total_venues': total_venues,
            'total_bookings': total_bookings,
            'total_revenue': float(total_revenue),
            'avg_rating': round(float(avg_rating), 1),
            'top_venues': top_venues,
            'recent_bookings': recent_bookings
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@owner_bp.route('/<int:owner_id>/analytics', methods=['GET'])
@token_required
@owner_required
def get_owner_analytics(owner_id):
    """Get owner analytics data"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Total Stats
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT b.booking_id) as total_bookings,
                COALESCE(SUM(bp.amount), 0) as total_revenue
            FROM bookings b
            LEFT JOIN booking_payments bp ON b.booking_id = bp.booking_id AND bp.payment_status = 'completed'
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE v.owner_id = %s
        """, (owner_id,))
        total_stats = cursor.fetchone()

        # Yearly revenue
        cursor.execute("""
            SELECT DATE_FORMAT(bp.payment_date, '%%Y') as year,
                   SUM(bp.amount) as revenue
            FROM booking_payments bp
            JOIN bookings b ON bp.booking_id = b.booking_id
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE v.owner_id = %s AND bp.payment_status = 'completed'
            GROUP BY year
            ORDER BY year ASC
        """, (owner_id,))
        yearly_revenue = cursor.fetchall()
        
        # Bookings by status
        cursor.execute("""
            SELECT b.status, COUNT(*) as count
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE v.owner_id = %s
            GROUP BY b.status
        """, (owner_id,))
        bookings_by_status = cursor.fetchall()
        
        # Top venues by revenue and bookings
        cursor.execute("""
            SELECT v.name, 
                   COUNT( DISTINCT b.booking_id) as booking_count,
                   COALESCE(SUM(bp.amount), 0) as revenue
            FROM venues v
            LEFT JOIN bookings b ON v.venue_id = b.venue_id
            LEFT JOIN booking_payments bp ON b.booking_id = bp.booking_id AND bp.payment_status = 'completed'
            WHERE v.owner_id = %s
            GROUP BY v.venue_id, v.name
            ORDER BY revenue DESC
            LIMIT 5
        """, (owner_id,))
        top_venues = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'total_revenue': float(total_stats['total_revenue']),
            'total_bookings': total_stats['total_bookings'],
            'yearly': yearly_revenue,
            'status_breakdown': bookings_by_status,
            'top_venues': top_venues
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# VENUE MANAGEMENT
# ============================================================================

@owner_bp.route('/<int:owner_id>/venues', methods=['GET'])
@token_required
@owner_required
def get_owner_venues(owner_id):
    """List owner's venues with filters"""
    try:
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        city = request.args.get('city', '')
        sort_by = request.args.get('sort_by', 'name')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT v.venue_id, v.name, v.city, v.type, v.capacity, 
                   v.base_price, v.rating, v.status,
                   COUNT(b.booking_id) as bookings_count
            FROM venues v
            LEFT JOIN bookings b ON v.venue_id = b.venue_id
            WHERE v.owner_id = %s
        """
        params = [owner_id]
        
        if search:
            query += " AND v.name LIKE %s"
            params.append(f'%{search}%')
        
        if status:
            query += " AND v.status = %s"
            params.append(status)
        
        if city:
            query += " AND v.city = %s"
            params.append(city)
        
        query += " GROUP BY v.venue_id"
        
        if sort_by in ['name', 'capacity', 'bookings_count']:
            query += f" ORDER BY {sort_by if sort_by != 'bookings_count' else 'bookings_count'} DESC"
        
        cursor.execute(query, params)
        venues = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({'venues': venues}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@owner_bp.route('/<int:owner_id>/venues', methods=['POST'])
@token_required
@owner_required
def add_venue(owner_id):
    """Add new venue"""
    try:
        data = request.json
        
        name = data.get('name')
        venue_type = data.get('type')
        address = data.get('address')
        city = data.get('city')
        capacity = data.get('capacity')
        base_price = data.get('base_price')
        description = data.get('description')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO venues 
            (owner_id, name, type, address, city, capacity, base_price, 
             description, status, rating, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending', 0.00, NOW())
        """, (owner_id, name, venue_type, address, city, capacity, 
              base_price, description))
        
        venue_id = cursor.lastrowid
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'Venue added successfully',
            'venue_id': venue_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@owner_bp.route('/<int:owner_id>/venues/<int:venue_id>', methods=['GET'])
@token_required
@owner_required
def get_owner_venue_details(owner_id, venue_id):
    """Get single venue details for owner"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify ownership
        cursor.execute("""
            SELECT * FROM venues 
            WHERE venue_id = %s AND owner_id = %s
        """, (venue_id, owner_id))
        
        venue = cursor.fetchone()
        
        if not venue:
            return jsonify({'error': 'Venue not found'}), 404
        
        # Get images
        cursor.execute("SELECT * FROM venue_images WHERE venue_id = %s", (venue_id,))
        venue['images'] = cursor.fetchall()
        
        # Get facilities
        cursor.execute("""
            SELECT vf.facility_id, vf.facility_name, vf.extra_price, vfm.availability
            FROM venue_facility_map vfm
            JOIN venue_facilities vf ON vfm.facility_id = vf.facility_id
            WHERE vfm.venue_id = %s
        """, (venue_id,))
        venue['facilities'] = cursor.fetchall()
        
        # Get payment info
        cursor.execute("""
            SELECT * FROM venue_payment_info WHERE venue_id = %s
        """, (venue_id,))
        venue['payment_info'] = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify(venue), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@owner_bp.route('/<int:owner_id>/venues/<int:venue_id>', methods=['PUT'])
@token_required
@owner_required
def update_venue(owner_id, venue_id):
    """Update venue details"""
    try:
        data = request.json
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify ownership
        cursor.execute("""
            SELECT venue_id FROM venues 
            WHERE venue_id = %s AND owner_id = %s
        """, (venue_id, owner_id))
        
        if not cursor.fetchone():
            return jsonify({'error': 'Venue not found'}), 404
        
        # Update venue
        cursor.execute("""
            UPDATE venues 
            SET name = %s, type = %s, address = %s, city = %s, 
                capacity = %s, base_price = %s, description = %s
            WHERE venue_id = %s
        """, (data.get('name'), data.get('type'), data.get('address'),
              data.get('city'), data.get('capacity'), data.get('base_price'),
              data.get('description'), venue_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Venue updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@owner_bp.route('/<int:owner_id>/venues/<int:venue_id>', methods=['DELETE'])
@token_required
@owner_required
def delete_venue(owner_id, venue_id):
    """Delete venue"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify ownership
        cursor.execute("""
            SELECT venue_id FROM venues 
            WHERE venue_id = %s AND owner_id = %s
        """, (venue_id, owner_id))
        
        if not cursor.fetchone():
            return jsonify({'error': 'Venue not found'}), 404
        
        # Check for active bookings
        cursor.execute("""
            SELECT COUNT(*) as count FROM bookings 
            WHERE venue_id = %s AND status IN ('pending', 'confirmed')
        """, (venue_id,))
        
        if cursor.fetchone()['count'] > 0:
            return jsonify({'error': 'Cannot delete venue with active bookings'}), 400
        
        # Soft delete - set status to inactive
        cursor.execute("""
            UPDATE venues SET status = 'inactive' 
            WHERE venue_id = %s
        """, (venue_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Venue deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@owner_bp.route('/<int:owner_id>/venues/<int:venue_id>/availability', methods=['PUT'])
@token_required
@owner_required
def update_venue_availability(owner_id, venue_id):
    """Update venue availability"""
    try:
        data = request.json
        date = data.get('date')
        slot = data.get('slot')
        is_available = data.get('is_available', 1)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify ownership
        cursor.execute("""
            SELECT venue_id FROM venues 
            WHERE venue_id = %s AND owner_id = %s
        """, (venue_id, owner_id))
        
        if not cursor.fetchone():
            return jsonify({'error': 'Venue not found'}), 404
        
        # Update availability
        cursor.execute("""
            INSERT INTO venue_availability (venue_id, date, slot, is_available)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE is_available = %s
        """, (venue_id, date, slot, is_available, is_available))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Availability updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# BOOKINGS
# ============================================================================

@owner_bp.route('/<int:owner_id>/bookings', methods=['GET'])
@token_required
@owner_required
def get_owner_bookings(owner_id):
    """Get owner's bookings with filters"""
    try:
        venue_id = request.args.get('venue_id', type=int)
        status = request.args.get('status', '')
        date_range = request.args.get('date_range', '')
        date_start = request.args.get('date_start', '')
        date_end = request.args.get('date_end', '')
        search_customer = request.args.get('search_customer', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT b.booking_id, b.event_date, b.slot, b.event_type, 
                   b.total_price, b.status, b.created_at, b.special_requirements,
                   v.name as venue_name, bcd.fullname as customer_name,
                   bcd.email as customer_email, bcd.phone_primary
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            LEFT JOIN booking_customer_details bcd ON b.booking_id = bcd.booking_id
            WHERE v.owner_id = %s
        """
        params = [owner_id]
        
        if venue_id:
            query += " AND b.venue_id = %s"
            params.append(venue_id)
        
        if status:
            query += " AND b.status = %s"
            params.append(status)
        
        if date_range == 'last_7_days':
            query += " AND b.event_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
        elif date_range == 'this_month':
            query += " AND MONTH(b.event_date) = MONTH(CURDATE()) AND YEAR(b.event_date) = YEAR(CURDATE())"
        elif date_range == 'custom' and date_start and date_end:
            query += " AND b.event_date BETWEEN %s AND %s"
            params.extend([date_start, date_end])
        
        if search_customer:
            query += " AND (bcd.fullname LIKE %s OR bcd.email LIKE %s)"
            params.extend([f'%{search_customer}%', f'%{search_customer}%'])
        
        query += " ORDER BY b.created_at DESC"
        
        cursor.execute(query, params)
        bookings = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({'bookings': bookings}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@owner_bp.route('/<int:owner_id>/bookings/<int:booking_id>', methods=['GET'])
@token_required
@owner_required
def get_owner_booking_details(owner_id, booking_id):
    """Get single booking details for owner"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get booking with ownership verification
        cursor.execute("""
            SELECT b.*, v.name as venue_name, bcd.*
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            LEFT JOIN booking_customer_details bcd ON b.booking_id = bcd.booking_id
            WHERE b.booking_id = %s AND v.owner_id = %s
        """, (booking_id, owner_id))
        
        booking = cursor.fetchone()
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Get facilities
        cursor.execute("""
            SELECT vf.facility_name, vf.extra_price
            FROM booking_facilities bf
            JOIN venue_facilities vf ON bf.facility_id = vf.facility_id
            WHERE bf.booking_id = %s
        """, (booking_id,))
        booking['facilities'] = cursor.fetchall()
        
        # Get payment info
        cursor.execute("""
            SELECT * FROM booking_payments 
            WHERE booking_id = %s
        """, (booking_id,))
        booking['payment'] = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify(booking), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@owner_bp.route('/<int:owner_id>/bookings/<int:booking_id>', methods=['PUT'])
@token_required
@owner_required
def update_booking_status(owner_id, booking_id):
    """Update booking status (confirm/reject)"""
    try:
        data = request.json
        new_status = data.get('status')
        
        if new_status not in ['confirmed', 'rejected', 'completed']:
            return jsonify({'error': 'Invalid status'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify ownership
        cursor.execute("""
            SELECT b.booking_id, b.user_id, b.venue_id
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE b.booking_id = %s AND v.owner_id = %s
        """, (booking_id, owner_id))
        
        booking = cursor.fetchone()
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Update booking status
        cursor.execute("""
            UPDATE bookings SET status = %s 
            WHERE booking_id = %s
        """, (new_status, booking_id))
        
        # Create notification for customer
        message = f'Your booking has been {new_status}'
        cursor.execute("""
            INSERT INTO notifications 
            (user_id, title, message, type, booking_id, venue_id, is_read, created_at)
            VALUES (%s, %s, %s, 'booking', %s, %s, 0, NOW())
        """, (booking['user_id'], 'Booking Update', message, 
              booking_id, booking['venue_id']))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Booking status updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# PAYMENTS
# ============================================================================

@owner_bp.route('/<int:owner_id>/payments', methods=['GET'])
@token_required
@owner_required
def get_owner_payments(owner_id):
    """Get owner's payments with filters"""
    try:
        venue_id = request.args.get('venue_id', type=int)
        payment_status = request.args.get('payment_status', '')
        method = request.args.get('method', '')
        date_start = request.args.get('date_start', '')
        date_end = request.args.get('date_end', '')
        sort_by = request.args.get('sort_by', 'payment_date')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT bp.payment_id, bp.booking_id, bp.amount, bp.method, 
                   bp.payment_status, bp.payment_date, bp.trx_id,
                   v.name as venue_name
            FROM booking_payments bp
            JOIN bookings b ON bp.booking_id = b.booking_id
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE v.owner_id = %s
        """
        params = [owner_id]
        
        if venue_id:
            query += " AND b.venue_id = %s"
            params.append(venue_id)
        
        if payment_status:
            query += " AND bp.payment_status = %s"
            params.append(payment_status)
        
        if method:
            query += " AND bp.method = %s"
            params.append(method)
        
        if date_start:
            query += " AND bp.payment_date >= %s"
            params.append(date_start)
        
        if date_end:
            query += " AND bp.payment_date <= %s"
            params.append(date_end)
        
        if sort_by in ['payment_date', 'amount']:
            query += f" ORDER BY bp.{sort_by} DESC"
        else:
            query += " ORDER BY bp.payment_date DESC"
        
        cursor.execute(query, params)
        payments = cursor.fetchall()
        
        # Calculate total revenue for filtered results
        cursor.execute(f"""
            SELECT COALESCE(SUM(bp.amount), 0) as total_revenue
            FROM booking_payments bp
            JOIN bookings b ON bp.booking_id = b.booking_id
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE v.owner_id = %s AND bp.payment_status = 'completed'
            {' AND b.venue_id = %s' if venue_id else ''}
            {' AND bp.payment_date >= %s' if date_start else ''}
            {' AND bp.payment_date <= %s' if date_end else ''}
        """, [p for p in params if p is not None])
        
        total_revenue = cursor.fetchone()['total_revenue']
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'payments': payments,
            'total_revenue': float(total_revenue)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@owner_bp.route('/<int:owner_id>/payments/<int:payment_id>', methods=['GET'])
@token_required
@owner_required
def get_owner_payment_details(owner_id, payment_id):
    """Get single payment details"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT bp.*, v.name as venue_name, b.booking_id
            FROM booking_payments bp
            JOIN bookings b ON bp.booking_id = b.booking_id
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE bp.payment_id = %s AND v.owner_id = %s
        """, (payment_id, owner_id))
        
        payment = cursor.fetchone()
        
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        cursor.close()
        conn.close()
        
        return jsonify(payment), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@owner_bp.route('/<int:owner_id>/payments/<int:payment_id>', methods=['PUT'])
@token_required
@owner_required
def update_payment_status(owner_id, payment_id):
    """Update payment status"""
    try:
        data = request.json
        new_status = data.get('payment_status')
        
        if new_status not in ['completed', 'pending', 'failed']:
            return jsonify({'error': 'Invalid payment status'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify ownership
        cursor.execute("""
            SELECT bp.payment_id
            FROM booking_payments bp
            JOIN bookings b ON bp.booking_id = b.booking_id
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE bp.payment_id = %s AND v.owner_id = %s
        """, (payment_id, owner_id))
        
        if not cursor.fetchone():
            return jsonify({'error': 'Payment not found'}), 404
        
        # Update payment status
        cursor.execute("""
            UPDATE booking_payments 
            SET payment_status = %s 
            WHERE payment_id = %s
        """, (new_status, payment_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Payment status updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# REVIEWS
# ============================================================================

@owner_bp.route('/<int:owner_id>/reviews', methods=['GET'])
@token_required
@owner_required
def get_owner_reviews(owner_id):
    """Get owner's reviews with filters"""
    try:
        venue_id = request.args.get('venue_id', type=int)
        rating_min = request.args.get('rating_min', type=int)
        date_start = request.args.get('date_start', '')
        date_end = request.args.get('date_end', '')
        sort_by = request.args.get('sort_by', 'review_date')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT br.review_id, br.rating, br.review_text, br.review_date,
                   v.name as venue_name, u.name as customer_name
            FROM booking_reviews br
            JOIN venues v ON br.venue_id = v.venue_id
            JOIN users u ON br.user_id = u.user_id
            WHERE v.owner_id = %s
        """
        params = [owner_id]
        
        if venue_id:
            query += " AND br.venue_id = %s"
            params.append(venue_id)
        
        if rating_min:
            query += " AND br.rating >= %s"
            params.append(rating_min)
        
        if date_start:
            query += " AND br.review_date >= %s"
            params.append(date_start)
        
        if date_end:
            query += " AND br.review_date <= %s"
            params.append(date_end)
        
        if sort_by in ['review_date', 'rating']:
            query += f" ORDER BY br.{sort_by} DESC"
        else:
            query += " ORDER BY br.review_date DESC"
        
        cursor.execute(query, params)
        reviews = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({'reviews': reviews}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# PROFILE
# ============================================================================

@owner_bp.route('/<int:owner_id>/profile', methods=['GET'])
@token_required
@owner_required
def get_owner_profile(owner_id):
    """Get owner profile"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT o.*, u.name, u.email, u.phone
            FROM owners o
            JOIN users u ON o.user_id = u.user_id
            WHERE o.owner_id = %s
        """, (owner_id,))
        
        profile = cursor.fetchone()
        
        if not profile:
            return jsonify({'error': 'Owner not found'}), 404
        
        cursor.close()
        conn.close()
        
        return jsonify(profile), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@owner_bp.route('/<int:owner_id>/profile', methods=['PUT'])
@token_required
@owner_required
def update_owner_profile(owner_id):
    """Update owner profile"""
    try:
        data = request.json
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user_id
        cursor.execute("SELECT user_id FROM owners WHERE owner_id = %s", (owner_id,))
        owner = cursor.fetchone()
        
        if not owner:
            return jsonify({'error': 'Owner not found'}), 404
        
        # Update user table
        cursor.execute("""
            UPDATE users 
            SET name = %s, phone = %s
            WHERE user_id = %s
        """, (data.get('name'), data.get('phone'), owner['user_id']))
        
        # Update owner table
        cursor.execute("""
            UPDATE owners 
            SET business_name = %s, cnic = %s
            WHERE owner_id = %s
        """, (data.get('business_name'), data.get('cnic'), owner_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
