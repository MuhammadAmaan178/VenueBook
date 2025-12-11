"""
User profile and booking routes blueprint.

Handles user profile management and user booking history.
"""
from flask import Blueprint, request, jsonify

from utils.db import get_db_connection
from utils.decorators import token_required

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

