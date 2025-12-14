# utils/notification_utils.py
"""
Notification utility functions for VenueBook
Provides centralized notification creation and management
"""

from utils.db import get_db_connection
from datetime import datetime
from extensions import socketio

def create_notification(user_id, title, message, notification_type='system', booking_id=None, venue_id=None):
    """
    Create a new notification for a user
    
    Args:
        user_id (int): User to notify
        title (str): Notification title
        message (str): Notification message
        notification_type (str): Type - 'booking', 'system', or 'verification'
        booking_id (int, optional): Related booking ID
        venue_id (int, optional): Related venue ID
    
    Returns:
        int: notification_id of created notification, or None if failed
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            INSERT INTO notifications (user_id, title, message, type, booking_id, venue_id, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
        """
        
        # Note: Added NOW() explicit insert to match retrieval if needed, 
        # though DB usually handles default CURRENT_TIMESTAMP.
        # But for socket emission we need the time.
        
        cursor.execute(query, (user_id, title, message, notification_type, booking_id, venue_id))
        conn.commit()
        
        notification_id = cursor.lastrowid
        
        cursor.close()
        conn.close()
        
        # Emit Real-time Notification
        try:
            notification_data = {
                'notification_id': notification_id, # Frontend expects id or notification_id? Checked Navbar, it uses .id in some places but .notification_id in API? 
                # Navbar.jsx uses: n.id in handleMarkRead(n.id) BUT API returns notification_id.
                # Let's check api.js or Navbar map.
                # Navbar map: key={n.id}.
                # Let's provide both to be safe or check existing API response.
                'id': notification_id, 
                'notification_id': notification_id,
                'title': title,
                'message': message,
                'type': notification_type,
                'booking_id': booking_id,
                'venue_id': venue_id,
                'is_read': 0,
                'created_at': datetime.now().isoformat()
            }
            
            # Emit to user's private room
            socketio.emit('new_notification', notification_data, room=f"user_{user_id}")
            print(f"Emitted notification to user_{user_id}")
            
        except Exception as socket_error:
            print(f"Socket emit failed: {str(socket_error)}")
        
        return notification_id
        
    except Exception as e:
        print(f"Error creating notification: {str(e)}")
        return None


def notify_booking_created(booking_id):
    """
    Notify venue owner when a new booking is created
    
    Args:
        booking_id (int): Booking ID
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get booking and venue details
        query = """
            SELECT b.booking_id, b.event_type, b.event_date, b.slot,
                   v.venue_id, v.venue_name, v.owner_id,
                   u.fullname as customer_name
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            JOIN users u ON b.user_id = u.user_id
            WHERE b.booking_id = %s
        """
        
        cursor.execute(query, (booking_id,))
        booking = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if booking:
            title = "New Booking Request"
            message = f"New {booking['event_type']} booking for {booking['venue_name']} on {booking['event_date']} ({booking['slot']}) by {booking['customer_name']}"
            
            return create_notification(
                user_id=booking['owner_id'],
                title=title,
                message=message,
                notification_type='booking',
                booking_id=booking_id,
                venue_id=booking['venue_id']
            )
    
    except Exception as e:
        print(f"Error notifying booking created: {str(e)}")
        return None


def notify_booking_status_changed(booking_id, new_status):
    """
    Notify customer when booking status changes
    
    Args:
        booking_id (int): Booking ID
        new_status (str): New booking status
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get booking details
        query = """
            SELECT b.booking_id, b.user_id, b.event_type, b.event_date,
                   v.venue_id, v.venue_name
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE b.booking_id = %s
        """
        
        cursor.execute(query, (booking_id,))
        booking = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if booking:
            status_messages = {
                'confirmed': f"Your booking for {booking['venue_name']} on {booking['event_date']} has been confirmed!",
                'cancelled': f"Your booking for {booking['venue_name']} on {booking['event_date']} has been cancelled.",
                'completed': f"Your booking for {booking['venue_name']} is now complete. Thank you for choosing us!"
            }
            
            title = f"Booking {new_status.capitalize()}"
            message = status_messages.get(new_status, f"Your booking status has been updated to {new_status}")
            
            return create_notification(
                user_id=booking['user_id'],
                title=title,
                message=message,
                notification_type='booking',
                booking_id=booking_id,
                venue_id=booking['venue_id']
            )
    
    except Exception as e:
        print(f"Error notifying booking status change: {str(e)}")
        return None


def notify_booking_completed_review_request(booking_id):
    """
    Notify customer to submit a review after booking is completed
    
    Args:
        booking_id (int): Booking ID
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get booking details
        query = """
            SELECT b.booking_id, b.user_id, b.event_type,
                   v.venue_id, v.venue_name
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE b.booking_id = %s
        """
        
        cursor.execute(query, (booking_id,))
        booking = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if booking:
            title = "Share Your Experience"
            message = f"How was your {booking['event_type']} at {booking['venue_name']}? Click here to leave a review and help others!"
            
            return create_notification(
                user_id=booking['user_id'],
                title=title,
                message=message,
                notification_type='booking',
                booking_id=booking_id,
                venue_id=booking['venue_id']
            )
    
    except Exception as e:
        print(f"Error notifying review request: {str(e)}")
        return None


def notify_venue_status_changed(venue_id, new_status):
    """
    Notify owner when venue status changes (approval/rejection)
    
    Args:
        venue_id (int): Venue ID
        new_status (str): New venue status
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get venue details
        query = """
            SELECT venue_id, venue_name, owner_id
            FROM venues
            WHERE venue_id = %s
        """
        
        cursor.execute(query, (venue_id,))
        venue = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if venue:
            status_messages = {
                'approved': f"Great news! Your venue '{venue['venue_name']}' has been approved and is now live!",
                'rejected': f"Your venue '{venue['venue_name']}' submission needs revision. Please check the details and resubmit.",
                'pending': f"Your venue '{venue['venue_name']}' is under review."
            }
            
            title = f"Venue {new_status.capitalize()}"
            message = status_messages.get(new_status, f"Your venue status has been updated to {new_status}")
            
            return create_notification(
                user_id=venue['owner_id'],
                title=title,
                message=message,
                notification_type='verification',
                venue_id=venue_id
            )
    
    except Exception as e:
        print(f"Error notifying venue status change: {str(e)}")
        return None


def notify_payment_received(payment_id):
    """
    Notify owner when payment is received
    
    Args:
        payment_id (int): Payment ID
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get payment details
        query = """
            SELECT p.payment_id, p.amount, p.payment_method,
                   b.booking_id, v.venue_id, v.venue_name, v.owner_id
            FROM payments p
            JOIN bookings b ON p.booking_id = b.booking_id
            JOIN venues v ON b.venue_id = v.venue_id
            WHERE p.payment_id = %s
        """
        
        cursor.execute(query, (payment_id,))
        payment = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if payment:
            title = "Payment Received"
            message = f"Payment of Rs. {payment['amount']:,.0f} received for {payment['venue_name']} via {payment['payment_method']}"
            
            return create_notification(
                user_id=payment['owner_id'],
                title=title,
                message=message,
                notification_type='booking',
                booking_id=payment['booking_id'],
                venue_id=payment['venue_id']
            )
    
    except Exception as e:
        print(f"Error notifying payment received: {str(e)}")
        return None


def notify_new_review(venue_id, rating):
    """
    Notify owner when they receive a new review
    
    Args:
        venue_id (int): Venue ID
        rating (int): Review rating
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get venue details
        query = """
            SELECT venue_id, venue_name, owner_id
            FROM venues
            WHERE venue_id = %s
        """
        
        cursor.execute(query, (venue_id,))
        venue = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if venue:
            title = "New Review Received"
            stars = "⭐" * rating
            message = f"Your venue '{venue['venue_name']}' received a new {rating}-star review! {stars}"
            
            return create_notification(
                user_id=venue['owner_id'],
                title=title,
                message=message,
                notification_type='system',
                venue_id=venue_id
            )
    
    except Exception as e:
        print(f"Error notifying new review: {str(e)}")
        return None


def notify_admins_new_venue(venue_id):
    """
    Notify all admins when a new venue is submitted for approval
    
    Args:
        venue_id (int): Venue ID
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get venue and owner details
        query = """
            SELECT v.venue_id, v.venue_name, v.city, v.type,
                   u.user_id as owner_id, u.fullname as owner_name
            FROM venues v
            JOIN users u ON v.owner_id = u.user_id
            WHERE v.venue_id = %s
        """
        
        cursor.execute(query, (venue_id,))
        venue = cursor.fetchone()
        
        if not venue:
            cursor.close()
            conn.close()
            return None
        
        # Get all admin users
        cursor.execute("""
            SELECT user_id, fullname
            FROM users
            WHERE role = 'admin'
        """)
        admins = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        if admins:
            title = "New Venue Pending Approval"
            message = f"New {venue['type']} venue '{venue['venue_name']}' in {venue['city']} submitted by {venue['owner_name']} awaits your review"
            
            # Create notification for each admin
            notification_ids = []
            for admin in admins:
                notif_id = create_notification(
                    user_id=admin['user_id'],
                    title=title,
                    message=message,
                    notification_type='verification',
                    venue_id=venue_id
                )
                if notif_id:
                    notification_ids.append(notif_id)
            
            return notification_ids
        
        return None
    
    except Exception as e:
        print(f"Error notifying admins of new venue: {str(e)}")
        return None
