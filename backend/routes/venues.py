"""
Public venue routes blueprint.

Handles venue browsing and venue details for public users.
"""
from flask import Blueprint, request, jsonify

from utils.db import get_db_connection
from utils.decorators import token_required
from utils.log_utils import log_review_action
from utils.notification_utils import notify_new_review

venues_bp = Blueprint('venues', __name__, url_prefix='/api/venues')


@venues_bp.route('', methods=['GET'])
def get_venues():
    """List all venues with advanced filters"""
    try:
        # Get query parameters
        search = request.args.get('search', '')
        city = request.args.get('city', 'Karachi')
        venue_type = request.args.get('type', '')
        capacity_min = request.args.get('capacity_min', type=int)
        capacity_max = request.args.get('capacity_max', type=int)
        price_min = request.args.get('price_min', type=float)
        price_max = request.args.get('price_max', type=float)
        sort_by = request.args.get('sort_by', 'rating')
        sort_order = request.args.get('sort_order', 'desc')
        page = request.args.get('page', 1, type=int)
        per_page = 15
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build query
        query = """
            SELECT v.venue_id, v.name, v.city, v.type, v.capacity, v.base_price, 
                   v.rating, v.address, v.status,
                   (SELECT image_url FROM venue_images WHERE venue_id = v.venue_id LIMIT 1) as image_url
            FROM venues v
            WHERE v.status = 'active'
        """
        params = []
        
        if search:
            query += " AND (v.name LIKE %s OR v.address LIKE %s)"
            params.extend([f'%{search}%', f'%{search}%'])
        
        if city:
            query += " AND v.city = %s"
            params.append(city)
        
        if venue_type:
            query += " AND v.type = %s"
            params.append(venue_type)
        
        if capacity_min:
            query += " AND v.capacity >= %s"
            params.append(capacity_min)
        
        if capacity_max:
            query += " AND v.capacity <= %s"
            params.append(capacity_max)
        
        if price_min:
            query += " AND v.base_price >= %s"
            params.append(price_min)
        
        if price_max:
            query += " AND v.base_price <= %s"
            params.append(price_max)
        
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query}) as subquery"
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']
        total_pages = (total + per_page - 1) // per_page
        
        # Add sorting
        valid_sort = ['rating', 'base_price', 'capacity', 'name']
        if sort_by not in valid_sort:
            sort_by = 'rating'
        if sort_order not in ['asc', 'desc']:
            sort_order = 'desc'
        
        query += f" ORDER BY v.{sort_by} {sort_order.upper()}"
        
        # Add pagination
        offset = (page - 1) * per_page
        query += " LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        venues = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'venues': venues,
            'total_pages': total_pages,
            'current_page': page,
            'total_venues': total
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@venues_bp.route('/<int:venue_id>', methods=['GET'])
def get_venue_details(venue_id):
    """Get single venue details"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get venue details
        cursor.execute("""
            SELECT v.*, o.business_name as owner_name, u.phone as owner_phone, u.user_id as owner_user_id
            FROM venues v
            LEFT JOIN owners o ON v.owner_id = o.owner_id
            LEFT JOIN users u ON o.user_id = u.user_id
            WHERE v.venue_id = %s
        """, (venue_id,))
        venue = cursor.fetchone()
        
        if not venue:
            return jsonify({'error': 'Venue not found'}), 404
        
        # Get images
        cursor.execute("SELECT * FROM venue_images WHERE venue_id = %s", (venue_id,))
        venue['images'] = cursor.fetchall()
        
        # Get facilities
        cursor.execute("""
            SELECT vf.facility_name, vf.extra_price, vfm.availability, vfm.facility_id
            FROM venue_facility_map vfm
            JOIN venue_facilities vf ON vfm.facility_id = vf.facility_id
            WHERE vfm.venue_id = %s
        """, (venue_id,))
        venue['facilities'] = cursor.fetchall()
        
        # Get reviews
        cursor.execute("""
            SELECT vr.*, u.name as user_name
            FROM venue_reviews vr
            JOIN users u ON vr.user_id = u.user_id
            WHERE vr.venue_id = %s
            ORDER BY vr.review_date DESC
            LIMIT 10
        """, (venue_id,))
        venue['reviews'] = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(venue), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@venues_bp.route('/<int:venue_id>/booking-data', methods=['GET'])
def get_booking_data(venue_id):
    """Get booking form data (facilities, availability)"""
    try:
        event_date = request.args.get('event_date')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get venue basic info
        cursor.execute("""
            SELECT venue_id, name, base_price, capacity
            FROM venues WHERE venue_id = %s
        """, (venue_id,))
        venue = cursor.fetchone()
        
        if not venue:
            return jsonify({'error': 'Venue not found'}), 404
        
        # Get available facilities
        cursor.execute("""
            SELECT vf.facility_id, vf.facility_name, vf.extra_price, vfm.availability
            FROM venue_facility_map vfm
            JOIN venue_facilities vf ON vfm.facility_id = vf.facility_id
            WHERE vfm.venue_id = %s AND vfm.availability = 'yes'
        """, (venue_id,))
        facilities = cursor.fetchall()
        
        # Get availability for specific date if provided
        # Use a map to ensure unique slots and handle overrides
        availability_map = {
            'morning': True,
            'evening': True,
            'full-day': True
        }
        
        if event_date:
            cursor.execute("""
                SELECT slot, is_available
                FROM venue_availability
                WHERE venue_id = %s AND date = %s
            """, (venue_id, event_date))
            results = cursor.fetchall()
            
            for row in results:
                if row['slot'] in availability_map:
                    # If any record identifies slot as unavailable, mark it so
                    if not row['is_available']:
                        availability_map[row['slot']] = False

        # Convert back to list format
        availability = [{'slot': slot, 'is_available': 1 if is_active else 0} 
                       for slot, is_active in availability_map.items()]
        
        # Get payment info
        cursor.execute("""
            SELECT account_holder_name, account_number, contact_number
            FROM venue_payment_info
            WHERE venue_id = %s
        """, (venue_id,))
        payment_info = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'venue': venue,
            'facilities': facilities,
            'availability': availability,
            'payment_info': payment_info
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@venues_bp.route('/reviews/recent', methods=['GET'])
def get_recent_reviews():
    """Get recent high-rated reviews for homepage testimonials"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Fetch 3 most recent reviews with rating >= 4
        cursor.execute("""
            SELECT 
                vr.review_text, 
                vr.rating, 
                vr.review_date,
                u.name as customer_name,
                v.name as venue_name
            FROM venue_reviews vr
            JOIN users u ON vr.user_id = u.user_id
            JOIN venues v ON vr.venue_id = v.venue_id
            WHERE vr.rating >= 4 
                AND vr.review_text IS NOT NULL 
                AND vr.review_text != ''
            ORDER BY vr.review_date DESC
            LIMIT 3
        """)
        reviews = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'reviews': reviews,
            'count': len(reviews)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@venues_bp.route('/<int:venue_id>/reviews', methods=['POST'])
@token_required
def create_review(venue_id):
    """Submit a review for a venue"""
    try:
        data = request.json
        rating = data.get('rating')
        review_text = data.get('review_text', '')
        
        if not rating or rating < 1 or rating > 5:
            return jsonify({'error': 'Invalid rating'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if venue exists
        cursor.execute("SELECT venue_id FROM venues WHERE venue_id = %s", (venue_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Venue not found'}), 404
        
        # Insert review
        cursor.execute("""
            INSERT INTO venue_reviews 
            (user_id, venue_id, rating, review_text, review_date)
            VALUES (%s, %s, %s, %s, NOW())
        """, (request.user_id, venue_id, rating, review_text))
        
        # Update venue rating
        cursor.execute("""
            UPDATE venues 
            SET rating = (
                SELECT AVG(rating) 
                FROM venue_reviews 
                WHERE venue_id = %s
            )
            WHERE venue_id = %s
        """, (venue_id, venue_id))
        
        conn.commit()
        review_id = cursor.lastrowid
        cursor.close()
        conn.close()
        
        # Log and notify
        log_review_action(request.user_id, 'create', review_id, f"Submitted {rating}-star review for venue #{venue_id}")
        notify_new_review(venue_id, rating)
        
        return jsonify({
            'message': 'Review submitted successfully',
            'review_id': review_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@venues_bp.route('/stats/public', methods=['GET'])
def get_public_stats():
    """Get public statistics for homepage"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total venues
        cursor.execute("SELECT COUNT(*) as total FROM venues WHERE status = 'active'")
        total_venues = cursor.fetchone()['total']
        
        # Get total users
        cursor.execute("SELECT COUNT(*) as total FROM users WHERE role = 'user'")
        total_users = cursor.fetchone()['total']
        
        # Get total owners
        cursor.execute("SELECT COUNT(*) as total FROM owners")
        total_owners = cursor.fetchone()['total']
        
        # Get average rating
        cursor.execute("SELECT AVG(rating) as avg_rating FROM venues WHERE rating IS NOT NULL")
        result = cursor.fetchone()
        avg_rating = round(result['avg_rating'], 1) if result['avg_rating'] else 0.0
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'total_venues': total_venues,
            'total_users': total_users,
            'total_owners': total_owners,
            'average_rating': avg_rating
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@venues_bp.route('/filters', methods=['GET'])
def get_filters():
    """Get dynamic filter options for search"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get distinct cities
        cursor.execute("SELECT DISTINCT city FROM venues WHERE status = 'active' ORDER BY city")
        cities = [row['city'] for row in cursor.fetchall() if row['city']]
        
        # Get distinct types
        cursor.execute("SELECT DISTINCT type FROM venues WHERE status = 'active' ORDER BY type")
        types = [row['type'] for row in cursor.fetchall() if row['type']]
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'cities': cities,
            'types': types
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
