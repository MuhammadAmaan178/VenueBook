"""
Notification routes blueprint.

Handles user notifications and notification management.
"""
from flask import Blueprint, request, jsonify

from utils.db import get_db_connection
from utils.decorators import token_required

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api')


@notifications_bp.route('/users/<int:user_id>/notifications', methods=['GET'])
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


@notifications_bp.route('/notifications/<int:notification_id>', methods=['GET'])
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


@notifications_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
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


@notifications_bp.route('/users/<int:user_id>/notifications/read-all', methods=['PUT'])
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
