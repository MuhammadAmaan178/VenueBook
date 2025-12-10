from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import jwt
import pymysql
from datetime import datetime, timedelta
import os
import bcrypt

app = Flask(__name__)
CORS(app)

# Configuration - Set SECRET_KEY as environment variable
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
app.config['DB_HOST'] = os.environ.get('DB_HOST', 'localhost')
app.config['DB_USER'] = os.environ.get('DB_USER', 'root')
app.config['DB_PASSWORD'] = os.environ.get('DB_PASSWORD', 'Amaan@27665')
app.config['DB_NAME'] = os.environ.get('DB_NAME', 'db_project')

# Database connection helper
def get_db_connection():
    return pymysql.connect(
        host=app.config['DB_HOST'],
        user=app.config['DB_USER'],
        password=app.config['DB_PASSWORD'],
        database=app.config['DB_NAME'],
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        try:
            token = token.split(' ')[1] if ' ' in token else token
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            request.user_id = data['user_id']
            request.role = data['role']
        except:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated

# Owner authorization decorator
def owner_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.role != 'owner':
            return jsonify({'error': 'Owner access required'}), 403
        return f(*args, **kwargs)
    return decorated


# Admin authorization decorator
def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated

# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """User registration"""
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        phone = data.get('phone')
        role = data.get('role', 'customer')
        
        if not all([name, email, password]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if email exists
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'error': 'Email already exists'}), 400
        
        # Hash password with bcrypt
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Insert user
        cursor.execute("""
            INSERT INTO users (name, email, password, phone, role, created_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
        """, (name, email, hashed_password.decode('utf-8'), phone, role))
        
        user_id = cursor.lastrowid
        
        # If role is owner, create owner record
        if role == 'owner':
            business_name = data.get('business_name')
            cnic = data.get('cnic')
            cursor.execute("""
                INSERT INTO owners (user_id, business_name, cnic, verification_status, joined_at)
                VALUES (%s, %s, %s, 'pending', NOW())
            """, (user_id, business_name, cnic))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'User registered successfully',
            'user_id': user_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({'error': 'Missing email or password'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Verify password with bcrypt
        if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            cursor.close()
            conn.close()
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Get owner_id if user is owner
        owner_id = None
        if user['role'] == 'owner':
            cursor.execute("SELECT owner_id FROM owners WHERE user_id = %s", (user['user_id'],))
            owner_record = cursor.fetchone()
            if owner_record:
                owner_id = owner_record['owner_id']
        
        cursor.close()
        conn.close()
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user['user_id'],
            'role': user['role'],
            'exp': datetime.utcnow() + timedelta(days=7)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'token': token,
            'user': {
                'user_id': user['user_id'],
                'name': user['name'],
                'email': user['email'],
                'role': user['role'],
                'owner_id': owner_id
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
@token_required
def logout():
    """User logout"""
    return jsonify({'message': 'Logged out successfully'}), 200

# ============================================================================
# PUBLIC VENUE ROUTES
# ============================================================================

@app.route('/api/venues', methods=['GET'])
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
        per_page = 12
        
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

@app.route('/api/venues/<int:venue_id>', methods=['GET'])
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

# ============================================================================
# BOOKING ROUTES
# ============================================================================

@app.route('/api/venues/<int:venue_id>/booking-data', methods=['GET'])
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

@app.route('/api/bookings', methods=['POST'])
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
        
        return jsonify({
            'message': 'Booking created successfully',
            'booking_id': booking_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bookings/<int:booking_id>/review', methods=['POST'])
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
        
        return jsonify({'message': 'Review submitted successfully'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# USER PROFILE ROUTES
# ============================================================================

@app.route('/api/users/<int:user_id>/profile', methods=['GET'])
@token_required
def get_user_profile(user_id):
    """Get complete user profile"""
    try:
        if request.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user info
        cursor.execute("""
            SELECT user_id, name, email, phone, role, created_at
            FROM users WHERE user_id = %s
        """, (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        cursor.close()
        conn.close()
        
        return jsonify(user), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:user_id>/profile', methods=['PUT'])
@token_required
def update_user_profile(user_id):
    """Update user profile"""
    try:
        if request.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.json
        name = data.get('name')
        phone = data.get('phone')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE users 
            SET name = %s, phone = %s
            WHERE user_id = %s
        """, (name, phone, user_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:user_id>/bookings', methods=['GET'])
@token_required
def get_user_bookings(user_id):
    """Get user bookings with filters"""
    try:
        if request.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get filters
        status = request.args.get('status', '')
        event_type = request.args.get('event_type', '')
        date_start = request.args.get('date_start', '')
        date_end = request.args.get('date_end', '')
        sort_by = request.args.get('sort_by', 'event_date')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT b.booking_id, b.event_date, b.slot, b.event_type, 
                   b.total_price, b.status, b.created_at,
                   v.name as venue_name, v.city, v.address
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE b.user_id = %s
        """
        params = [user_id]
        
        if status:
            query += " AND b.status = %s"
            params.append(status)
        
        if event_type:
            query += " AND b.event_type = %s"
            params.append(event_type)
        
        if date_start:
            query += " AND b.event_date >= %s"
            params.append(date_start)
        
        if date_end:
            query += " AND b.event_date <= %s"
            params.append(date_end)
        
        if sort_by in ['event_date', 'created_at']:
            query += f" ORDER BY b.{sort_by} DESC"
        else:
            query += " ORDER BY b.event_date DESC"
        
        cursor.execute(query, params)
        bookings = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({'bookings': bookings}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# NOTIFICATION ROUTES
# ============================================================================

@app.route('/api/users/<int:user_id>/notifications', methods=['GET'])
@token_required
def get_notifications(user_id):
    """Get user notifications with filters"""
    try:
        if request.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        is_read = request.args.get('is_read', type=int)
        notif_type = request.args.get('type', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT notification_id, title, message, type, booking_id, 
                   venue_id, is_read, created_at
            FROM notifications
            WHERE user_id = %s
        """
        params = [user_id]
        
        if is_read is not None:
            query += " AND is_read = %s"
            params.append(is_read)
        
        if notif_type:
            query += " AND type = %s"
            params.append(notif_type)
        
        query += " ORDER BY created_at DESC"
        
        cursor.execute(query, params)
        notifications = cursor.fetchall()
        
        # Get unread count
        cursor.execute("""
            SELECT COUNT(*) as unread_count 
            FROM notifications 
            WHERE user_id = %s AND is_read = 0
        """, (user_id,))
        unread_count = cursor.fetchone()['unread_count']
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'notifications': notifications,
            'unread_count': unread_count
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/notifications/<int:notification_id>', methods=['GET'])
@token_required
def get_notification_details(notification_id):
    """Get single notification details"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM notifications 
            WHERE notification_id = %s AND user_id = %s
        """, (notification_id, request.user_id))
        
        notification = cursor.fetchone()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        cursor.close()
        conn.close()
        
        return jsonify(notification), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
@token_required
def mark_notification_read(notification_id):
    """Mark notification as read"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE notifications 
            SET is_read = 1 
            WHERE notification_id = %s AND user_id = %s
        """, (notification_id, request.user_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Notification marked as read'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:user_id>/notifications/read-all', methods=['PUT'])
@token_required
def mark_all_notifications_read(user_id):
    """Mark all notifications as read"""
    try:
        if request.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE notifications 
            SET is_read = 1 
            WHERE user_id = %s
        """, (user_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'All notifications marked as read'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# OWNER PANEL - DASHBOARD & ANALYTICS
# ============================================================================

@app.route('/api/owner/<int:owner_id>/dashboard', methods=['GET'])
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
        
        # Pending bookings
        cursor.execute("""
            SELECT COUNT(*) as pending_bookings 
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE v.owner_id = %s AND b.status = 'pending'
        """, (owner_id,))
        pending_bookings = cursor.fetchone()['pending_bookings']
        
        # Total revenue
        cursor.execute("""
            SELECT COALESCE(SUM(bp.amount), 0) as total_revenue 
            FROM booking_payments bp
            JOIN bookings b ON bp.booking_id = b.booking_id
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE v.owner_id = %s AND bp.payment_status = 'completed'
        """, (owner_id,))
        total_revenue = cursor.fetchone()['total_revenue']
        
        # Recent bookings
        cursor.execute("""
            SELECT b.booking_id, b.event_date, b.status, b.total_price,
                   v.name as venue_name, bcd.fullname as customer_name
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            LEFT JOIN booking_customer_details bcd ON b.booking_id = bcd.booking_id
            WHERE v.owner_id = %s
            ORDER BY b.created_at DESC
            LIMIT 5
        """, (owner_id,))
        recent_bookings = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'total_venues': total_venues,
            'total_bookings': total_bookings,
            'pending_bookings': pending_bookings,
            'total_revenue': float(total_revenue),
            'recent_bookings': recent_bookings
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/owner/<int:owner_id>/analytics', methods=['GET'])
@token_required
@owner_required
def get_owner_analytics(owner_id):
    """Get owner analytics data"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Monthly revenue
        cursor.execute("""
            SELECT DATE_FORMAT(bp.payment_date, '%%Y-%%m') as month,
                   SUM(bp.amount) as revenue
            FROM booking_payments bp
            JOIN bookings b ON bp.booking_id = b.booking_id
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE v.owner_id = %s AND bp.payment_status = 'completed'
            GROUP BY month
            ORDER BY month DESC
            LIMIT 12
        """, (owner_id,))
        monthly_revenue = cursor.fetchall()
        
        # Bookings by status
        cursor.execute("""
            SELECT b.status, COUNT(*) as count
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE v.owner_id = %s
            GROUP BY b.status
        """, (owner_id,))
        bookings_by_status = cursor.fetchall()
        
        # Top venues by bookings
        cursor.execute("""
            SELECT v.name, COUNT(b.booking_id) as booking_count
            FROM venues v
            LEFT JOIN bookings b ON v.venue_id = b.venue_id
            WHERE v.owner_id = %s
            GROUP BY v.venue_id, v.name
            ORDER BY booking_count DESC
            LIMIT 5
        """, (owner_id,))
        top_venues = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'monthly_revenue': monthly_revenue,
            'bookings_by_status': bookings_by_status,
            'top_venues': top_venues
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# OWNER PANEL - VENUE MANAGEMENT
# ============================================================================

@app.route('/api/owner/<int:owner_id>/venues', methods=['GET'])
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

@app.route('/api/owner/<int:owner_id>/venues', methods=['POST'])
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

@app.route('/api/owner/<int:owner_id>/venues/<int:venue_id>', methods=['GET'])
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

@app.route('/api/owner/<int:owner_id>/venues/<int:venue_id>', methods=['PUT'])
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

@app.route('/api/owner/<int:owner_id>/venues/<int:venue_id>', methods=['DELETE'])
@token_required
@owner_required
def delete_venue(owner_id, venue_id):
    """Delete venue"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
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

@app.route('/api/owner/<int:owner_id>/venues/<int:venue_id>/availability', methods=['PUT'])
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
        cursor = conn.cursor(dictionary=True)
        
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
# OWNER PANEL - BOOKINGS
# ============================================================================

@app.route('/api/owner/<int:owner_id>/bookings', methods=['GET'])
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
                   b.total_price, b.status, b.created_at,
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

@app.route('/api/owner/<int:owner_id>/bookings/<int:booking_id>', methods=['GET'])
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

@app.route('/api/owner/<int:owner_id>/bookings/<int:booking_id>', methods=['PUT'])
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
        cursor = conn.cursor(dictionary=True)
        
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
# OWNER PANEL - PAYMENTS
# ============================================================================

@app.route('/api/owner/<int:owner_id>/payments', methods=['GET'])
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

@app.route('/api/owner/<int:owner_id>/payments/<int:payment_id>', methods=['GET'])
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

@app.route('/api/owner/<int:owner_id>/payments/<int:payment_id>', methods=['PUT'])
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
# OWNER PANEL - REVIEWS
# ============================================================================

@app.route('/api/owner/<int:owner_id>/reviews', methods=['GET'])
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
# OWNER PANEL - PROFILE
# ============================================================================

@app.route('/api/owner/<int:owner_id>/profile', methods=['GET'])
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

@app.route('/api/owner/<int:owner_id>/profile', methods=['PUT'])
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

# ============================================================================
# ============================================================================
# ADMIN PANEL ROUTES
# ============================================================================

# ----------------------------------------------------------------------------
# DASHBOARD
# ----------------------------------------------------------------------------

@app.route('/api/admin/dashboard', methods=['GET'])
@token_required
@admin_required
def get_admin_dashboard():
    """Get admin dashboard statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Total users
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'customer'")
        total_customers = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'owner'")
        total_owners = cursor.fetchone()['count']
        
        # Total venues by status
        cursor.execute("SELECT status, COUNT(*) as count FROM venues GROUP BY status")
        venues_stats = cursor.fetchall()
        
        # Total bookings by status
        cursor.execute("SELECT status, COUNT(*) as count FROM bookings GROUP BY status")
        bookings_stats = cursor.fetchall()
        
        # Total revenue
        cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM booking_payments WHERE payment_status = 'completed'")
        total_revenue = cursor.fetchone()['total']
        
        # Recent users
        cursor.execute("SELECT user_id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10")
        recent_users = cursor.fetchall()
        
        # Recent bookings
        cursor.execute("""
            SELECT b.booking_id, b.event_date, b.status, b.total_price, v.name as venue_name
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            ORDER BY b.created_at DESC LIMIT 10
        """)
        recent_bookings = cursor.fetchall()
        
        # Pending verifications
        cursor.execute("SELECT COUNT(*) as count FROM owners WHERE verification_status = 'pending'")
        pending_owners = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM venues WHERE status = 'pending'")
        pending_venues = cursor.fetchone()['count']
        
        # Monthly revenue chart data
        cursor.execute("""
            SELECT DATE_FORMAT(payment_date, '%%Y-%%m') as month, SUM(amount) as revenue
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
                'total_customers': total_customers,
                'total_owners': total_owners,
                'total_revenue': float(total_revenue),
                'pending_verifications': pending_owners + pending_venues
            },
            'venues_stats': venues_stats,
            'bookings_stats': bookings_stats,
            'recent_users': recent_users,
            'recent_bookings': recent_bookings,
            'monthly_revenue': monthly_revenue
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------------------------------------------------
# USERS MANAGEMENT
# ----------------------------------------------------------------------------

@app.route('/api/admin/users', methods=['GET'])
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
        per_page = 10
        
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
        
        if status:
            query += " AND status = %s"
            params.append(status)
            
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

@app.route('/api/admin/users/<int:user_id>', methods=['GET'])
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
            WHERE user_id = %s AND status = 'completed'
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

@app.route('/api/admin/users/<int:user_id>/status', methods=['PUT'])
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

@app.route('/api/admin/owners', methods=['GET'])
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
        per_page = 10
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT o.owner_id, o.user_id, o.business_name, o.cnic, 
                   o.verification_status, o.joined_at,
                   u.name, u.email, u.phone, u.status
            FROM owners o
            JOIN users u ON o.user_id = u.user_id
            WHERE 1=1
        """
        params = []
        
        if verification_status:
            query += " AND o.verification_status = %s"
            params.append(verification_status)
            
        if status:
            query += " AND u.status = %s"
            params.append(status)
            
        if search:
            query += " AND (o.business_name LIKE %s OR u.name LIKE %s)"
            params.extend([f'%{search}%', f'%{search}%'])
            
        # Count total
        count_query = f"SELECT COUNT(*) as total FROM ({query}) as subquery"
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']
        total_pages = (total + per_page - 1) // per_page
        
        # Sorting
        if sort_by not in ['joined_at', 'business_name']:
            sort_by = 'joined_at'
            
        query += f" ORDER BY o.{sort_by} DESC"
        
        # Pagination
        offset = (page - 1) * per_page
        query += " LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        owners = cursor.fetchall()
        
        # Get stats for each owner
        for owner in owners:
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
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'owners': owners,
            'total_pages': total_pages,
            'total_owners': total
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/owners/<int:owner_id>', methods=['GET'])
@token_required
@admin_required
def get_admin_owner_details(owner_id):
    """Get complete owner details"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Owner info
        cursor.execute("""
            SELECT o.*, u.name, u.email, u.phone, u.status, u.created_at as user_created_at
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
                   (SELECT COALESCE(SUM(amount), 0) FROM booking_payments bp 
                    JOIN bookings b ON bp.booking_id = b.booking_id 
                    WHERE b.venue_id = v.venue_id AND bp.payment_status = 'completed') as revenue
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

@app.route('/api/admin/owners/<int:owner_id>/verify', methods=['PUT'])
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

@app.route('/api/admin/owners/<int:owner_id>/status', methods=['PUT'])
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

@app.route('/api/admin/venues', methods=['GET'])
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
        per_page = 10
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT v.venue_id, v.name, v.city, v.type, v.capacity, 
                   v.base_price, v.rating, v.status, v.created_at,
                   o.business_name as owner_name
            FROM venues v
            JOIN owners o ON v.owner_id = o.owner_id
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

@app.route('/api/admin/venues/<int:venue_id>', methods=['GET'])
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

@app.route('/api/admin/venues/<int:venue_id>/approve', methods=['PUT'])
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

@app.route('/api/admin/venues/<int:venue_id>/status', methods=['PUT'])
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

@app.route('/api/admin/bookings', methods=['GET'])
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

@app.route('/api/admin/bookings/<int:booking_id>', methods=['GET'])
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

@app.route('/api/admin/payments', methods=['GET'])
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

@app.route('/api/admin/payments/<int:payment_id>', methods=['GET'])
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

@app.route('/api/admin/logs', methods=['GET'])
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

# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ============================================================================
# RUN APPLICATION
# ============================================================================

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)