"""
User profile and booking routes blueprint.

Handles user profile management and user booking history.
"""
from flask import Blueprint, request, jsonify

from utils.db import get_db_connection
from utils.decorators import token_required
from utils.phone_validation import validate_phone_format

users_bp = Blueprint('users', __name__, url_prefix='/api/users')



@users_bp.route('/<int:user_id>/profile', methods=['PUT'])
@token_required
def update_user_profile(user_id):
    """Update user profile"""
    try:
        if request.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.json
        name = data.get('name')
        phone = data.get('phone')

        # Validate phone
        if phone:
            is_valid, error = validate_phone_format(phone)
            if not is_valid:
                return jsonify({'error': error}), 400
        
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


@users_bp.route('/<int:user_id>/profile', methods=['GET'])
@token_required
def get_user_profile_complete(user_id):
    """Get user profile with complete information"""
    try:
        # Verify user can only access their own profile (unless admin)
        if request.user_id != user_id and request.user_role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get basic user info
        cursor.execute("""
            SELECT user_id, name, email, phone, role, created_at
            FROM users WHERE user_id = %s
        """, (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # If user is an owner, get owner-specific information
        if user['role'] == 'owner':
            cursor.execute("""
                SELECT business_name, cnic, verification_status
                FROM owners WHERE user_id = %s
            """, (user_id,))
            owner_info = cursor.fetchone()
            
            if owner_info:
                # Merge owner info with user info
                user.update(owner_info)
        
        cursor.close()
        conn.close()
        
        return jsonify(user), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@users_bp.route('/<int:user_id>/bookings', methods=['GET'])
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


@users_bp.route('/<int:user_id>/bookings/<int:booking_id>', methods=['GET'])
@token_required
def get_user_booking_details(user_id, booking_id):
    """Get complete booking details for user"""
    try:
        if request.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
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
            WHERE b.booking_id = %s AND b.user_id = %s
        """, (booking_id, user_id))
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
        

        
        # Timeline (Logs)
        search_pattern = f"Booking #{booking_id}:%"
        cursor.execute("""
            SELECT * FROM logs 
            WHERE target_table = 'bookings' AND details LIKE %s
            ORDER BY created_at DESC
        """, (search_pattern,))
        booking['timeline'] = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(booking), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@users_bp.route('/<int:user_id>/conversations', methods=['GET'])
@token_required
def get_user_conversations(user_id):
    """Get all conversations for a user (as customer, owner, or admin)"""
    try:
        if request.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user is also an owner
        cursor.execute("SELECT owner_id FROM owners WHERE user_id = %s", (user_id,))
        owner_data = cursor.fetchone()
        owner_id = owner_data['owner_id'] if owner_data else None
        
        # Fetch conversations where user is participating as customer, owner, or admin
        # We need to handle NULLs due to different conversation types
        query = """
            SELECT c.*, 
                   v.name as venue_name,
                   o.business_name as owner_name,
                   u.name as customer_name,
                   admin.name as admin_name,
                   o.user_id as owner_user_id,
                   (SELECT content FROM messages WHERE conversation_id = c.conversation_id ORDER BY created_at DESC LIMIT 1) as last_message,
                   (SELECT created_at FROM messages WHERE conversation_id = c.conversation_id ORDER BY created_at DESC LIMIT 1) as last_message_time,
                   (SELECT COUNT(*) FROM messages WHERE conversation_id = c.conversation_id AND is_read = 0 AND sender_id != %s) as unread_count
            FROM conversations c
            LEFT JOIN venues v ON c.venue_id = v.venue_id
            LEFT JOIN owners o ON c.owner_id = o.owner_id
            LEFT JOIN users u ON c.user_id = u.user_id
            LEFT JOIN users admin ON c.admin_id = admin.user_id
            WHERE c.user_id = %s 
               OR (c.owner_id IS NOT NULL AND c.owner_id = %s)
               OR (c.admin_id IS NOT NULL AND c.admin_id = %s)
            ORDER BY last_message_time DESC
        """
        
        # user_id matches request.user_id (checked at start)
        # We check if this user is involved as:
        # 1. The customer (c.user_id)
        # 2. The owner (c.owner_id)
        # 3. The admin (c.admin_id) - assuming current user ID can be an admin ID
        
        cursor.execute(query, (user_id, user_id, owner_id, user_id))
        conversations = cursor.fetchall()
        
        # Format for frontend
        results = []
        for conv in conversations:
            display_name = "Unknown"
            
            # Logic to determine display name
            if conv['conversation_type'] == 'customer_owner':
                if str(conv['user_id']) == str(user_id):
                    # I am customer -> Show Venue Name (or Owner Name if no Venue)
                    display_name = conv['venue_name'] or conv['owner_name']
                else:
                    # I am owner -> Show Customer Name
                    display_name = conv['customer_name']
                    
            elif conv['conversation_type'] == 'customer_admin':
                if str(conv['user_id']) == str(user_id):
                    # I am customer -> Show Admin Name
                    display_name = conv['admin_name']
                else:
                    # I am admin -> Show Customer Name
                    display_name = conv['customer_name']
            
            results.append({
                'conversation_id': conv['conversation_id'],
                'name': display_name,
                'last_message': conv['last_message'] or 'No messages yet',
                'unread': conv['unread_count'],
                'venue_id': conv['venue_id'],
                'owner_id': conv['owner_id'],
                'admin_id': conv['admin_id'],
                'conversation_type': conv['conversation_type'],
                'user_id': conv['user_id'], # Customer's user_id
                'owner_user_id': conv['owner_user_id'] # Owner's user_id (for socket status if owner chat)
            })
            
        cursor.close()
        conn.close()
        
        return jsonify(results), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@users_bp.route('/conversations', methods=['POST'])
@token_required
def create_conversation():
    """Create or retrieve a conversation"""
    try:
        data = request.json
        user_id = request.user_id
        owner_id = data.get('owner_id')
        venue_id = data.get('venue_id')
        admin_id = data.get('admin_id')
        
        # Determine conversation type
        conv_type = 'customer_owner'
        if admin_id:
            conv_type = 'customer_admin'
            owner_id = None # Ensure clear separation
            venue_id = None
        elif owner_id:
            # Venue ID implies owner chat usually, but is technically optional in schema if we wanted general owner chat.
            # But legacy logic & current frontend sends venue_id.
            conv_type = 'customer_owner'
        else:
            return jsonify({'error': 'Must provide owner_id or admin_id'}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if conversation already exists
        if conv_type == 'customer_admin':
            query = """
                SELECT conversation_id FROM conversations
                WHERE user_id = %s AND admin_id = %s AND conversation_type = 'customer_admin'
            """
            params = (user_id, admin_id)
        else:
            # customer_owner
            if venue_id:
                query = """
                    SELECT conversation_id FROM conversations
                    WHERE user_id = %s AND owner_id = %s AND venue_id = %s AND conversation_type = 'customer_owner'
                """
                params = (user_id, owner_id, venue_id)
            else:
                 # Legacy fallback or direct owner chat (if supported)
                 query = """
                    SELECT conversation_id FROM conversations
                    WHERE user_id = %s AND owner_id = %s AND venue_id IS NULL AND conversation_type = 'customer_owner'
                """
                 params = (user_id, owner_id)
        
        cursor.execute(query, params)
        existing = cursor.fetchone()
        
        if existing:
            # Return existing
            cursor.close()
            conn.close()
            return jsonify({'conversation_id': existing['conversation_id'], 'status': 'exists'}), 200
            
        # Create new
        if conv_type == 'customer_admin':
             insert_sql = """
                INSERT INTO conversations (user_id, admin_id, conversation_type)
                VALUES (%s, %s, 'customer_admin')
            """
             insert_params = (user_id, admin_id)
        else:
             insert_sql = """
                INSERT INTO conversations (user_id, owner_id, venue_id, conversation_type)
                VALUES (%s, %s, %s, 'customer_owner')
            """
             insert_params = (user_id, owner_id, venue_id)
             
        cursor.execute(insert_sql, insert_params)
        
        new_id = cursor.lastrowid
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'conversation_id': new_id, 'status': 'created'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@users_bp.route('/conversations/<int:conversation_id>/messages', methods=['GET'])
@token_required
def get_conversation_messages(conversation_id):
    """Get messages for a conversation"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify access rights (User must be participant)
        cursor.execute("""
            SELECT user_id, owner_id, admin_id FROM conversations 
            WHERE conversation_id = %s
        """, (conversation_id,))
        conv = cursor.fetchone()
        
        if not conv:
            return jsonify({'error': 'Conversation not found'}), 404
            
        # Check if requester is user, owner, or admin
        is_participant = False
        
        # 1. Requester is the Customer
        if conv['user_id'] == request.user_id:
            is_participant = True
            
        # 2. Requester is the Admin
        elif conv['admin_id'] == request.user_id:
             is_participant = True
             
        # 3. Requester is the Owner
        elif conv['owner_id']:
            # Check if user owns the owner_id
            cursor.execute("SELECT owner_id FROM owners WHERE user_id = %s", (request.user_id,))
            owner_data = cursor.fetchone()
            if owner_data and owner_data['owner_id'] == conv['owner_id']:
                is_participant = True
                
        if not is_participant:
             return jsonify({'error': 'Unauthorized'}), 403

        # Fetch messages
        cursor.execute("""
            SELECT * FROM messages
            WHERE conversation_id = %s
            ORDER BY created_at ASC
        """, (conversation_id,))
        messages = cursor.fetchall()

        # Mark as read for this user (where sender != user_id)
        # Note: If I am the owner, my sender_id in this table matches my user_id.
        # So we just mark all messages NOT sent by me as read.
        cursor.execute("""
            UPDATE messages 
            SET is_read = 1 
            WHERE conversation_id = %s AND sender_id != %s AND is_read = 0
        """, (conversation_id, request.user_id))
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify(messages), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# NOTIFICATIONS
# ============================================================================

@users_bp.route('/<int:user_id>/notifications', methods=['GET'])
@token_required
def get_user_notifications(user_id):
    """Get user notifications"""
    try:
        if request.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all notifications for user, ordered by most recent
        cursor.execute("""
            SELECT notification_id, title, message, type, booking_id, 
                   venue_id, is_read, created_at
            FROM notifications
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 50
        """, (user_id,))
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


@users_bp.route('/<int:user_id>/notifications/read-all', methods=['PUT'])
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
            WHERE user_id = %s AND is_read = 0
        """, (user_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'All notifications marked as read'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@users_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@token_required
def mark_notification_read(notification_id):
    """Mark single notification as read"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify notification belongs to user
        cursor.execute("""
            SELECT user_id FROM notifications
            WHERE notification_id = %s
        """, (notification_id,))
        notification = cursor.fetchone()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        if notification['user_id'] != request.user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Mark as read
        cursor.execute("""
            UPDATE notifications
            SET is_read = 1
            WHERE notification_id = %s
        """, (notification_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Notification marked as read'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
