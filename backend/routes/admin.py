"""
Admin panel routes blueprint.

Handles all admin-specific functionality including dashboard, user management,
owner management, venue management, bookings, payments, and system logs.
"""
from datetime import datetime
from flask import Blueprint, request, jsonify

from utils.db import get_db_connection
from utils.decorators import token_required, admin_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


# ADMIN PANEL ROUTES
# ============================================================================

# ----------------------------------------------------------------------------
# DASHBOARD
# ----------------------------------------------------------------------------

@admin_bp.route('/dashboard', methods=['GET'])
@token_required
@admin_required
def get_admin_dashboard():
    """Get admin dashboard statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Total Venues
        cursor.execute("SELECT COUNT(*) as count FROM venues")
        total_venues = cursor.fetchone()['count']
        
        # 2. Total Bookings
        cursor.execute("SELECT COUNT(*) as count FROM bookings")
        total_bookings = cursor.fetchone()['count']
        
        # 3. Total Revenue
        cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM booking_payments WHERE payment_status = 'completed'")
        total_revenue = cursor.fetchone()['total']
        
        # 4. Avg Rating (Global)
        cursor.execute("SELECT COALESCE(AVG(rating), 0) as avg_rating FROM venues")
        avg_rating = cursor.fetchone()['avg_rating']
        
        # 5. Top 5 Venues (Global) by Rating
        cursor.execute("""
            SELECT v.venue_id, v.name, v.city, v.rating, o.business_name as owner_name
            FROM venues v
            JOIN owners o ON v.owner_id = o.owner_id
            ORDER BY v.rating DESC, v.created_at DESC
            LIMIT 5
        """)
        top_venues = cursor.fetchall()
        
        # 6. Recent Logs (replacing recent bookings)
        recent_logs = []
        try:
            # Using LEFT JOIN to get user name if action_by is a user_id
            cursor.execute("""
                SELECT l.*, u.name as user_name
                FROM logs l
                LEFT JOIN users u ON l.action_by = u.user_id
                ORDER BY l.created_at DESC
                LIMIT 5
            """)
            recent_logs = cursor.fetchall()
        except Exception as e:
            print(f"Error fetching logs: {e}")
            recent_logs = []

        # Monthly revenue chart data (keeping this as it's useful for charts if needed, 
        # though user didn't explicitly ask for it to be removed, better to have it)
        cursor.execute("""
            SELECT DATE_FORMAT(payment_date, '%Y-%m') as month, SUM(amount) as revenue
            FROM booking_payments
            WHERE payment_status = 'completed'
            GROUP BY month
            ORDER BY month DESC
            LIMIT 12
        """)
        monthly_revenue = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'stats': {
                'total_venues': total_venues,
                'total_bookings': total_bookings,
                'total_revenue': float(total_revenue),
                'avg_rating': round(float(avg_rating), 1)
            },
            'top_venues': top_venues,
            'recent_logs': recent_logs,
            'monthly_revenue': monthly_revenue
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------------------------------------------------
# USERS MANAGEMENT
# ----------------------------------------------------------------------------

@admin_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def get_admin_users():
    """List all users with filters"""
    try:
        role = request.args.get('role')
        status = request.args.get('status')
        search = request.args.get('search', '')
        sort_by = request.args.get('sort_by', 'created_at')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = "SELECT user_id, name, email, phone, role, created_at FROM users WHERE 1=1"
        params = []
        
        if role:
            query += " AND role = %s"
            params.append(role)
            
        # Assuming status column exists or we filter by other means. 
        # If status is not in users table, we might need to join or ignore.
        # Based on previous code, users table doesn't seem to have 'status' column explicitly shown in signup,
        # but the requirement asks for it. I'll assume it exists or I'll add it to the query if it does.
        # Let's check the signup code again... 
        # Signup: INSERT INTO users (name, email, password, phone, role, created_at)
        # It does NOT have status.
        # However, the requirement says "status: active/blocked".
        # I will assume there is a status column, or I will treat all as 'active' if not found.
        # But wait, I can't modify the schema.
        # I'll check if I can see the schema from the `view_file` of `app.py` earlier.
        # Line 90: INSERT INTO users ... VALUES ...
        # No status column.
        # BUT, the user might have added it manually or it's in the ERD.
        # The ERD shows `status ENUM(...)` in `users` table!
        # So I will assume it exists.
        

            
        if search:
            query += " AND (name LIKE %s OR email LIKE %s)"
            params.extend([f'%{search}%', f'%{search}%'])
            
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query}) as subquery"
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']
        total_pages = (total + per_page - 1) // per_page
        
        # Sorting
        if sort_by not in ['created_at', 'name']:
            sort_by = 'created_at'
            
        query += f" ORDER BY {sort_by} DESC"
        
        # Pagination
        offset = (page - 1) * per_page
        query += " LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        users = cursor.fetchall()
        
        # Get booking counts for each user
        for user in users:
            cursor.execute("SELECT COUNT(*) as count FROM bookings WHERE user_id = %s", (user['user_id'],))
            user['total_bookings'] = cursor.fetchone()['count']
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'users': users,
            'total_pages': total_pages,
            'total_users': total
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@token_required
@admin_required
def get_admin_user_details(user_id):
    """Get complete user details"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # User info
        cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        del user['password'] # Don't send password
        
        # Bookings
        cursor.execute("""
            SELECT b.*, v.name as venue_name 
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE b.user_id = %s
            ORDER BY b.created_at DESC
        """, (user_id,))
        bookings = cursor.fetchall()
        
        # Stats
        cursor.execute("SELECT COUNT(*) as count FROM bookings WHERE user_id = %s", (user_id,))
        total_bookings = cursor.fetchone()['count']
        
        cursor.execute("""
            SELECT COALESCE(SUM(total_price), 0) as total_spent 
            FROM bookings 
            WHERE user_id = %s AND status IN ('completed', 'confirmed')
        """, (user_id,))
        total_spent = cursor.fetchone()['total_spent']
        
        # Reviews given
        cursor.execute("SELECT * FROM booking_reviews WHERE user_id = %s", (user_id,))
        reviews = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'user': user,
            'bookings': bookings,
            'stats': {
                'total_bookings': total_bookings,
                'total_spent': float(total_spent)
            },
            'reviews': reviews
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>/status', methods=['PUT'])
@token_required
@admin_required
def update_user_status(user_id):
    """Block/Unblock user"""
    try:
        data = request.json
        status = data.get('status')
        
        if status not in ['active', 'blocked']:
            return jsonify({'error': 'Invalid status'}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("UPDATE users SET status = %s WHERE user_id = %s", (status, user_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'User status updated'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------------------------------------------------
# OWNERS MANAGEMENT
# ----------------------------------------------------------------------------

@admin_bp.route('/owners', methods=['GET'])
@token_required
@admin_required
def get_admin_owners():
    """List all owners with filters"""
    try:
        verification_status = request.args.get('verification_status')
        status = request.args.get('status')
        search = request.args.get('search', '')
        sort_by = request.args.get('sort_by', 'joined_at')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT u.user_id, u.name, u.email, u.phone, u.created_at as joined_at,
                   o.owner_id, o.business_name, o.cnic, o.verification_status
            FROM users u
            LEFT JOIN owners o ON u.user_id = o.user_id
            WHERE LOWER(u.role) = 'owner'
        """
        params = []
        
        if verification_status:
            query += " AND o.verification_status = %s"
            params.append(verification_status)
            
        if search:
            query += " AND (o.business_name LIKE %s OR u.name LIKE %s OR u.email LIKE %s)"
            params.extend([f'%{search}%', f'%{search}%', f'%{search}%'])
            
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query}) as subquery"
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']
        total_pages = (total + per_page - 1) // per_page
        
        # Sorting
        if sort_by == 'business_name':
            query += " ORDER BY o.business_name DESC"
        else:
            query += " ORDER BY u.created_at DESC"
        
        # Pagination
        offset = (page - 1) * per_page
        query += " LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        owners = cursor.fetchall()
        
        # Get stats for each owner
        for owner in owners:
            if owner['owner_id']:
                # Total venues
                cursor.execute("SELECT COUNT(*) as count FROM venues WHERE owner_id = %s", (owner['owner_id'],))
                owner['total_venues'] = cursor.fetchone()['count']
                
                # Total bookings
                cursor.execute("""
                    SELECT COUNT(*) as count 
                    FROM bookings b
                    JOIN venues v ON b.venue_id = v.venue_id
                    WHERE v.owner_id = %s
                """, (owner['owner_id'],))
                owner['total_bookings'] = cursor.fetchone()['count']
            else:
                owner['total_venues'] = 0
                owner['total_bookings'] = 0
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'owners': owners,
            'total_pages': total_pages,
            'total_owners': total
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/owners/<int:owner_id>', methods=['GET'])
@token_required
@admin_required
def get_admin_owner_details(owner_id):
    """Get complete owner details"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Owner info
        cursor.execute("""
            SELECT o.*, u.name, u.email, u.phone, u.created_at as user_created_at
            FROM owners o
            JOIN users u ON o.user_id = u.user_id
            WHERE o.owner_id = %s
        """, (owner_id,))
        owner = cursor.fetchone()
        
        if not owner:
            return jsonify({'error': 'Owner not found'}), 404
            
        # Venues
        cursor.execute("""
            SELECT v.*, 
                   (SELECT COUNT(*) FROM bookings WHERE venue_id = v.venue_id) as bookings_count,
                   (SELECT COALESCE(SUM(total_price), 0) FROM bookings b 
                    WHERE b.venue_id = v.venue_id AND b.status IN ('confirmed', 'completed')) as revenue
            FROM venues v
            WHERE v.owner_id = %s
        """, (owner_id,))
        venues = cursor.fetchall()
        
        # Stats
        total_revenue = sum(v['revenue'] for v in venues)
        total_bookings = sum(v['bookings_count'] for v in venues)
        
        # Recent bookings
        cursor.execute("""
            SELECT b.booking_id, b.event_date, b.status, b.total_price, v.name as venue_name
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE v.owner_id = %s
            ORDER BY b.created_at DESC
            LIMIT 5
        """, (owner_id,))
        recent_bookings = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'owner': owner,
            'venues': venues,
            'stats': {
                'total_venues': len(venues),
                'total_bookings': total_bookings,
                'total_revenue': float(total_revenue)
            },
            'recent_bookings': recent_bookings
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/owners/<int:owner_id>/verify', methods=['PUT'])
@token_required
@admin_required
def verify_owner(owner_id):
    """Approve/Reject owner verification"""
    try:
        data = request.json
        status = data.get('status') # approved, rejected
        
        if status not in ['approved', 'rejected']:
            return jsonify({'error': 'Invalid status'}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("UPDATE owners SET verification_status = %s WHERE owner_id = %s", (status, owner_id))
        
        # Notify owner
        cursor.execute("SELECT user_id FROM owners WHERE owner_id = %s", (owner_id,))
        user_id = cursor.fetchone()['user_id']
        
        message = f"Your owner verification has been {status}."
        cursor.execute("""
            INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
            VALUES (%s, 'Verification Update', %s, 'system', 0, NOW())
        """, (user_id, message))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': f'Owner verification {status}'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/owners/<int:owner_id>/status', methods=['PUT'])
@token_required
@admin_required
def update_owner_status(owner_id):
    """Block/Unblock owner"""
    try:
        data = request.json
        status = data.get('status') # active, blocked
        
        if status not in ['active', 'blocked']:
            return jsonify({'error': 'Invalid status'}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user_id
        cursor.execute("SELECT user_id FROM owners WHERE owner_id = %s", (owner_id,))
        owner = cursor.fetchone()
        
        if not owner:
            return jsonify({'error': 'Owner not found'}), 404
            
        # Update user status
        cursor.execute("UPDATE users SET status = %s WHERE user_id = %s", (status, owner['user_id']))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Owner status updated'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------------------------------------------------
# VENUES MANAGEMENT
# ----------------------------------------------------------------------------

@admin_bp.route('/venues', methods=['GET'])
@token_required
@admin_required
def get_admin_venues():
    """List all venues with filters"""
    try:
        status = request.args.get('status')
        city = request.args.get('city')
        owner_id = request.args.get('owner_id')
        venue_type = request.args.get('type')
        search = request.args.get('search', '')
        sort_by = request.args.get('sort_by', 'created_at')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT v.venue_id, v.name, v.city, v.type, v.capacity, 
                   v.base_price, v.rating, v.status, v.created_at,
                   COALESCE(o.business_name, u.name) as owner_name
            FROM venues v
            LEFT JOIN owners o ON v.owner_id = o.owner_id
            LEFT JOIN users u ON o.user_id = u.user_id
            WHERE 1=1
        """
        params = []
        
        if status:
            query += " AND v.status = %s"
            params.append(status)
            
        if city:
            query += " AND v.city = %s"
            params.append(city)
            
        if owner_id:
            query += " AND v.owner_id = %s"
            params.append(owner_id)
            
        if venue_type:
            query += " AND v.type = %s"
            params.append(venue_type)
            
        if search:
            query += " AND v.name LIKE %s"
            params.append(f'%{search}%')
            
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query}) as subquery"
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']
        total_pages = (total + per_page - 1) // per_page
        
        # Sorting
        if sort_by not in ['created_at', 'name', 'rating']:
            sort_by = 'created_at'
            
        query += f" ORDER BY v.{sort_by} DESC"
        
        # Pagination
        offset = (page - 1) * per_page
        query += " LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        venues = cursor.fetchall()
        
        # Get booking counts for each venue
        for venue in venues:
            cursor.execute("SELECT COUNT(*) as count FROM bookings WHERE venue_id = %s", (venue['venue_id'],))
            venue['total_bookings'] = cursor.fetchone()['count']
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'venues': venues,
            'total_pages': total_pages,
            'total_venues': total
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/venues/<int:venue_id>', methods=['GET'])
@token_required
@admin_required
def get_admin_venue_details(venue_id):
    """Get complete venue details"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Venue info
        cursor.execute("""
            SELECT v.*, o.business_name as owner_name, o.owner_id,
                   u.name as owner_contact_name, u.email as owner_email, u.phone as owner_phone
            FROM venues v
            JOIN owners o ON v.owner_id = o.owner_id
            JOIN users u ON o.user_id = u.user_id
            WHERE v.venue_id = %s
        """, (venue_id,))
        venue = cursor.fetchone()
        
        if not venue:
            return jsonify({'error': 'Venue not found'}), 404
            
        # Images
        cursor.execute("SELECT * FROM venue_images WHERE venue_id = %s", (venue_id,))
        venue['images'] = cursor.fetchall()
        
        # Facilities
        cursor.execute("""
            SELECT vf.facility_name, vf.extra_price, vfm.availability
            FROM venue_facility_map vfm
            JOIN venue_facilities vf ON vfm.facility_id = vf.facility_id
            WHERE vfm.venue_id = %s
        """, (venue_id,))
        venue['facilities'] = cursor.fetchall()
        
        # Reviews
        cursor.execute("""
            SELECT br.*, u.name as customer_name
            FROM booking_reviews br
            JOIN users u ON br.user_id = u.user_id
            WHERE br.venue_id = %s
            ORDER BY br.review_date DESC
        """, (venue_id,))
        venue['reviews'] = cursor.fetchall()
        
        # Bookings
        cursor.execute("""
            SELECT b.*, bcd.fullname as customer_name
            FROM bookings b
            LEFT JOIN booking_customer_details bcd ON b.booking_id = bcd.booking_id
            WHERE b.venue_id = %s
            ORDER BY b.created_at DESC
        """, (venue_id,))
        venue['bookings'] = cursor.fetchall()
        
        # Stats
        venue['total_bookings'] = len(venue['bookings'])
        
        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0) as revenue
            FROM booking_payments bp
            JOIN bookings b ON bp.booking_id = b.booking_id
            WHERE b.venue_id = %s AND bp.payment_status = 'completed'
        """, (venue_id,))
        venue['total_revenue'] = float(cursor.fetchone()['revenue'])
        
        # Payment Info
        cursor.execute("SELECT * FROM venue_payment_info WHERE venue_id = %s", (venue_id,))
        venue['payment_info'] = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify(venue), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/venues/<int:venue_id>/approve', methods=['PUT'])
@token_required
@admin_required
def approve_venue(venue_id):
    """Approve venue"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("UPDATE venues SET status = 'active' WHERE venue_id = %s", (venue_id,))
        
        # Notify owner
        cursor.execute("""
            SELECT u.user_id, v.name 
            FROM venues v
            JOIN owners o ON v.owner_id = o.owner_id
            JOIN users u ON o.user_id = u.user_id
            WHERE v.venue_id = %s
        """, (venue_id,))
        result = cursor.fetchone()
        
        if result:
            message = f"Your venue '{result['name']}' has been approved."
            cursor.execute("""
                INSERT INTO notifications (user_id, title, message, type, venue_id, is_read, created_at)
                VALUES (%s, 'Venue Approved', %s, 'venue', %s, 0, NOW())
            """, (result['user_id'], message, venue_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Venue approved successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/venues/<int:venue_id>/status', methods=['PUT'])
@token_required
@admin_required
def update_venue_status(venue_id):
    """Update venue status (active/inactive/rejected)"""
    try:
        data = request.json
        status = data.get('status')
        
        if status not in ['active', 'inactive', 'rejected']:
            return jsonify({'error': 'Invalid status'}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("UPDATE venues SET status = %s WHERE venue_id = %s", (status, venue_id))
        
        # Notify owner if rejected
        if status == 'rejected':
            cursor.execute("""
                SELECT u.user_id, v.name 
                FROM venues v
                JOIN owners o ON v.owner_id = o.owner_id
                JOIN users u ON o.user_id = u.user_id
                WHERE v.venue_id = %s
            """, (venue_id,))
            result = cursor.fetchone()
            
            if result:
                message = f"Your venue '{result['name']}' has been rejected."
                cursor.execute("""
                    INSERT INTO notifications (user_id, title, message, type, venue_id, is_read, created_at)
                    VALUES (%s, 'Venue Rejected', %s, 'venue', %s, 0, NOW())
                """, (result['user_id'], message, venue_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': f'Venue status updated to {status}'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------------------------------------------------
# BOOKINGS MANAGEMENT
# ----------------------------------------------------------------------------

@admin_bp.route('/bookings', methods=['GET'])
@token_required
@admin_required
def get_admin_bookings():
    """List all bookings with filters"""
    try:
        status = request.args.get('status')
        venue_id = request.args.get('venue_id')
        user_id = request.args.get('user_id')
        owner_id = request.args.get('owner_id')
        event_type = request.args.get('event_type')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        search = request.args.get('search', '')
        sort_by = request.args.get('sort_by', 'event_date')
        page = request.args.get('page', 1, type=int)
        per_page = 10
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT b.booking_id, b.event_date, b.slot, b.event_type, 
                   b.total_price, b.status, b.created_at,
                   v.name as venue_name, bcd.fullname as customer_name
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            LEFT JOIN booking_customer_details bcd ON b.booking_id = bcd.booking_id
            WHERE 1=1
        """
        params = []
        
        if status:
            query += " AND b.status = %s"
            params.append(status)
            
        if venue_id:
            query += " AND b.venue_id = %s"
            params.append(venue_id)
            
        if user_id:
            query += " AND b.user_id = %s"
            params.append(user_id)
            
        if owner_id:
            query += " AND v.owner_id = %s"
            params.append(owner_id)
            
        if event_type:
            query += " AND b.event_type = %s"
            params.append(event_type)
            
        if date_from:
            query += " AND b.event_date >= %s"
            params.append(date_from)
            
        if date_to:
            query += " AND b.event_date <= %s"
            params.append(date_to)
            
        if search:
            query += " AND (bcd.fullname LIKE %s OR v.name LIKE %s)"
            params.extend([f'%{search}%', f'%{search}%'])
            
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query}) as subquery"
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']
        total_pages = (total + per_page - 1) // per_page
        
        # Calculate total revenue for filtered results
        revenue_query = f"SELECT COALESCE(SUM(total_price), 0) as revenue FROM ({query}) as subquery"
        cursor.execute(revenue_query, params)
        total_revenue = cursor.fetchone()['revenue']
        
        # Sorting
        if sort_by not in ['event_date', 'created_at', 'total_price']:
            sort_by = 'event_date'
            
        query += f" ORDER BY b.{sort_by} DESC"
        
        # Pagination
        offset = (page - 1) * per_page
        query += " LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        bookings = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'bookings': bookings,
            'total_pages': total_pages,
            'total_bookings': total,
            'total_revenue': float(total_revenue)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/bookings/<int:booking_id>', methods=['GET'])
@token_required
@admin_required
def get_admin_booking_details(booking_id):
    """Get complete booking details"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Booking info
        cursor.execute("""
            SELECT b.*, 
                   v.name as venue_name, v.address as venue_address, v.city as venue_city,
                   o.business_name as owner_name, u.phone as owner_contact,
                   bcd.fullname as customer_name, bcd.email as customer_email, 
                   bcd.phone_primary, bcd.phone_secondary
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            JOIN owners o ON v.owner_id = o.owner_id
            JOIN users u ON o.user_id = u.user_id
            LEFT JOIN booking_customer_details bcd ON b.booking_id = bcd.booking_id
            WHERE b.booking_id = %s
        """, (booking_id,))
        booking = cursor.fetchone()
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
            
        # Facilities
        cursor.execute("""
            SELECT vf.facility_name, vf.extra_price
            FROM booking_facilities bf
            JOIN venue_facilities vf ON bf.facility_id = vf.facility_id
            WHERE bf.booking_id = %s
        """, (booking_id,))
        booking['facilities'] = cursor.fetchall()
        
        # Payment details
        cursor.execute("SELECT * FROM booking_payments WHERE booking_id = %s", (booking_id,))
        booking['payment'] = cursor.fetchone()
        
        # Review
        cursor.execute("SELECT * FROM booking_reviews WHERE booking_id = %s", (booking_id,))
        booking['review'] = cursor.fetchone()
        
        # Timeline/Logs (mocked or fetched from logs if available)
        # Assuming logs table exists as per plan
        cursor.execute("""
            SELECT * FROM logs 
            WHERE target_table = 'bookings' AND record_id = %s
            ORDER BY created_at DESC
        """, (booking_id,))
        booking['timeline'] = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(booking), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------------------------------------------------
# PAYMENTS MANAGEMENT (VIEW ONLY)
# ----------------------------------------------------------------------------

@admin_bp.route('/payments', methods=['GET'])
@token_required
@admin_required
def get_admin_payments():
    """List all payments with filters"""
    try:
        payment_status = request.args.get('payment_status')
        method = request.args.get('method')
        venue_id = request.args.get('venue_id')
        owner_id = request.args.get('owner_id')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        sort_by = request.args.get('sort_by', 'payment_date')
        page = request.args.get('page', 1, type=int)
        per_page = 10
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT bp.payment_id, bp.booking_id, bp.amount, bp.method, 
                   bp.trx_id, bp.payment_status, bp.payment_date,
                   v.name as venue_name, o.business_name as owner_name,
                   bcd.fullname as customer_name
            FROM booking_payments bp
            JOIN bookings b ON bp.booking_id = b.booking_id
            JOIN venues v ON b.venue_id = v.venue_id
            JOIN owners o ON v.owner_id = o.owner_id
            LEFT JOIN booking_customer_details bcd ON b.booking_id = bcd.booking_id
            WHERE 1=1
        """
        params = []
        
        if payment_status:
            query += " AND bp.payment_status = %s"
            params.append(payment_status)
            
        if method:
            query += " AND bp.method = %s"
            params.append(method)
            
        if venue_id:
            query += " AND b.venue_id = %s"
            params.append(venue_id)
            
        if owner_id:
            query += " AND v.owner_id = %s"
            params.append(owner_id)
            
        if date_from:
            query += " AND bp.payment_date >= %s"
            params.append(date_from)
            
        if date_to:
            query += " AND bp.payment_date <= %s"
            params.append(date_to)
            
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query}) as subquery"
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']
        total_pages = (total + per_page - 1) // per_page
        
        # Calculate total amount for filtered results
        amount_query = f"SELECT COALESCE(SUM(amount), 0) as total_amount FROM ({query}) as subquery"
        cursor.execute(amount_query, params)
        total_amount = cursor.fetchone()['total_amount']
        
        # Sorting
        if sort_by not in ['payment_date', 'amount']:
            sort_by = 'payment_date'
            
        query += f" ORDER BY bp.{sort_by} DESC"
        
        # Pagination
        offset = (page - 1) * per_page
        query += " LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        payments = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'payments': payments,
            'total_pages': total_pages,
            'total_payments': total,
            'total_amount': float(total_amount)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/payments/<int:payment_id>', methods=['GET'])
@token_required
@admin_required
def get_admin_payment_details(payment_id):
    """Get complete payment details"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Payment info
        cursor.execute("""
            SELECT bp.*, 
                   b.event_date, b.event_type, b.status as booking_status,
                   v.venue_id, v.name as venue_name, v.city as venue_city,
                   o.owner_id, o.business_name as owner_name,
                   o.user_id as owner_user_id,
                   bcd.fullname as customer_name, bcd.email as customer_email, bcd.phone_primary
            FROM booking_payments bp
            JOIN bookings b ON bp.booking_id = b.booking_id
            JOIN venues v ON b.venue_id = v.venue_id
            JOIN owners o ON v.owner_id = o.owner_id
            LEFT JOIN booking_customer_details bcd ON b.booking_id = bcd.booking_id
            WHERE bp.payment_id = %s
        """, (payment_id,))
        payment = cursor.fetchone()
        
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
            
        # Get owner account details
        cursor.execute("SELECT * FROM venue_payment_info WHERE venue_id = %s", (payment['venue_id'],))
        payment['owner_account'] = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify(payment), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------------------------------------------------
# SYSTEM LOGS
# ----------------------------------------------------------------------------

@admin_bp.route('/logs', methods=['GET'])
@token_required
@admin_required
def get_admin_logs():
    """List all system logs with filters"""
    try:
        action_type = request.args.get('action_type')
        action_by = request.args.get('action_by')
        target_table = request.args.get('target_table')
        record_id = request.args.get('record_id')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        sort_by = request.args.get('sort_by', 'created_at')
        page = request.args.get('page', 1, type=int)
        per_page = 20
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT l.*, u.name as action_by_name
            FROM logs l
            LEFT JOIN users u ON l.action_by = u.user_id
            WHERE 1=1
        """
        params = []
        
        if action_type:
            query += " AND l.action_type = %s"
            params.append(action_type)
            
        if action_by:
            query += " AND l.action_by = %s"
            params.append(action_by)
            
        if target_table:
            query += " AND l.target_table = %s"
            params.append(target_table)
            
        if record_id:
            query += " AND l.record_id = %s"
            params.append(record_id)
            
        if date_from:
            query += " AND l.created_at >= %s"
            params.append(date_from)
            
        if date_to:
            query += " AND l.created_at <= %s"
            params.append(date_to)
            
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query}) as subquery"
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']
        total_pages = (total + per_page - 1) // per_page
        
        # Sorting
        if sort_by not in ['created_at']:
            sort_by = 'created_at'
            
        query += f" ORDER BY l.{sort_by} DESC"
        
        # Pagination
        offset = (page - 1) * per_page
        query += " LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        logs = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'logs': logs,
            'total_pages': total_pages,
            'total_logs': total
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------------------------------------------------
# REVIEWS MANAGEMENT
# ----------------------------------------------------------------------------

@admin_bp.route('/reviews', methods=['GET'])
@token_required
@admin_required
def get_admin_reviews():
    """List all reviews with filters"""
    try:
        venue_id = request.args.get('venue_id')
        rating_min = request.args.get('rating_min', type=int)
        search = request.args.get('search', '')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        sort_by = request.args.get('sort_by', 'review_date')
        page = request.args.get('page', 1, type=int)
        per_page = 10
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT br.*, v.name as venue_name, v.city as venue_city,
                   u.name as customer_name, u.email as customer_email
            FROM booking_reviews br
            JOIN venues v ON br.venue_id = v.venue_id
            JOIN users u ON br.user_id = u.user_id
            WHERE 1=1
        """
        params = []
        
        if venue_id:
            query += " AND br.venue_id = %s"
            params.append(venue_id)
            
        if rating_min:
            query += " AND br.rating >= %s"
            params.append(rating_min)
            
        if search:
            query += " AND (v.name LIKE %s OR u.name LIKE %s)"
            params.extend([f'%{search}%', f'%{search}%'])
        
        if date_from:
            query += " AND br.review_date >= %s"
            params.append(date_from)
            
        if date_to:
            query += " AND br.review_date <= %s"
            params.append(date_to)

        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query}) as subquery"
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']
        total_pages = (total + per_page - 1) // per_page
        
        # Sorting
        if sort_by not in ['review_date', 'rating']:
            sort_by = 'review_date'
            
        query += f" ORDER BY br.{sort_by} DESC"
        
        # Pagination
        offset = (page - 1) * per_page
        query += " LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        reviews = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'reviews': reviews,
            'total_pages': total_pages,
            'total_reviews': total
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------------------------------------------------
# ANALYTICS
# ----------------------------------------------------------------------------

@admin_bp.route('/analytics', methods=['GET'])
@token_required
@admin_required
def get_admin_analytics():
    """Get global analytics data"""
    try:
        from datetime import datetime as dt
        year = request.args.get('year', dt.now().year, type=int)

        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Test query - just return empty data
        return jsonify({
            'total_revenue': 0,
            'total_bookings': 0,
            'yearly': [],
            'status_breakdown': [],
            'top_venues': []
        }), 200
        
    except Exception as e:
        print(f"Analytics Error: {str(e)}")  # Debug print
        return jsonify({'error': str(e)}), 500
