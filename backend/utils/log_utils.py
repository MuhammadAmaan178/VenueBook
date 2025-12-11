# utils/log_utils.py
"""
Logging utility functions for VenueBook
Provides centralized logging for all system activities
"""

from config import get_db_connection
from datetime import datetime

def log_action(action_by, action_type, target_table, details):
    """
    Main logging function to record all system activities
    
    Args:
        action_by (int): User ID who performed the action (None for system actions)
        action_type (str): Type of action (create, update, delete, login, etc.)
        target_table (str): Database table affected
        details (str): Detailed description of the action
    
    Returns:
        int: log_id of created log entry, or None if failed
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            INSERT INTO logs (action_by, action_type, target_table, details)
            VALUES (%s, %s, %s, %s)
        """
        
        cursor.execute(query, (action_by, action_type, target_table, details))
        conn.commit()
        
        log_id = cursor.lastrowid
        
        cursor.close()
        conn.close()
        
        return log_id
        
    except Exception as e:
        print(f"Error logging action: {str(e)}")
        return None


def log_login(user_id, email, success=True):
    """Log user login attempts"""
    details = f"User {email} {'successfully logged in' if success else 'failed login attempt'}"
    return log_action(user_id if success else None, 'login', 'users', details)


def log_signup(user_id, email, role):
    """Log new user registration"""
    details = f"New {role} account created: {email}"
    return log_action(user_id, 'create', 'users', details)


def log_logout(user_id, email):
    """Log user logout"""
    details = f"User {email} logged out"
    return log_action(user_id, 'logout', 'users', details)


def log_booking_action(user_id, action_type, booking_id, details):
    """
    Log booking-related actions
    
    Args:
        user_id (int): User performing the action
        action_type (str): create, update, delete, cancel
        booking_id (int): Booking ID
        details (str): Action details
    """
    return log_action(user_id, action_type, 'bookings', f"Booking #{booking_id}: {details}")


def log_venue_action(user_id, action_type, venue_id, details):
    """
    Log venue-related actions
    
    Args:
        user_id (int): User performing the action
        action_type (str): create, update, delete
        venue_id (int): Venue ID
        details (str): Action details
    """
    return log_action(user_id, action_type, 'venues', f"Venue #{venue_id}: {details}")


def log_payment_action(user_id, action_type, payment_id, details):
    """Log payment-related actions"""
    return log_action(user_id, action_type, 'payments', f"Payment #{payment_id}: {details}")


def log_review_action(user_id, action_type, review_id, details):
    """Log review-related actions"""
    return log_action(user_id, action_type, 'booking_reviews', f"Review #{review_id}: {details}")


def log_admin_action(admin_id, action_type, target_table, details):
    """
    Log administrative actions
    
    Args:
        admin_id (int): Admin user ID
        action_type (str): Action type
        target_table (str): Table affected
        details (str): Action details
    """
    return log_action(admin_id, action_type, target_table, f"Admin action: {details}")
