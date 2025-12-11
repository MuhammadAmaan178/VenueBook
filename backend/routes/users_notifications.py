

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
