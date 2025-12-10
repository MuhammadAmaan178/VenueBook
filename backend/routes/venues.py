"""
Public venue routes blueprint.

Handles venue browsing and venue details for public users.
"""
from flask import Blueprint, request, jsonify

from utils.db import get_db_connection

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
            SELECT v.*, o.business_name as owner_name
            FROM venues v
            LEFT JOIN owners o ON v.owner_id = o.owner_id
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
            SELECT br.*, u.name as user_name
            FROM booking_reviews br
            JOIN users u ON br.user_id = u.user_id
            WHERE br.venue_id = %s
            ORDER BY br.review_date DESC
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
        availability = None
        if event_date:
            cursor.execute("""
                SELECT slot, is_available
                FROM venue_availability
                WHERE venue_id = %s AND date = %s
            """, (venue_id, event_date))
            availability = cursor.fetchall()
        
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
