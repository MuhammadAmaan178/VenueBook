"""
Authentication and authorization decorators.

Provides decorators for protecting routes and enforcing role-based access control.
"""
from functools import wraps
from flask import request, jsonify, current_app
import jwt


def token_required(f):
    """
    Decorator to require a valid JWT token for route access.
    
    Extracts and validates the JWT token from the Authorization header.
    Sets request.user_id and request.role for use in the route handler.
    
    Args:
        f: The route handler function to decorate.
        
    Returns:
        The decorated function.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        try:
            token = token.split(' ')[1] if ' ' in token else token
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            request.user_id = data['user_id']
            request.role = data['role']
        except:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated


def owner_required(f):
    """
    Decorator to require owner role for route access.
    
    Must be used after @token_required decorator.
    Checks if the authenticated user has the 'owner' role.
    
    Args:
        f: The route handler function to decorate.
        
    Returns:
        The decorated function.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.role != 'owner':
            return jsonify({'error': 'Owner access required'}), 403
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """
    Decorator to require admin role for route access.
    
    Must be used after @token_required decorator.
    Checks if the authenticated user has the 'admin' role.
    
    Args:
        f: The route handler function to decorate.
        
    Returns:
        The decorated function.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated
