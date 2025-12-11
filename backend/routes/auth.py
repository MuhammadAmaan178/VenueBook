"""
Authentication routes blueprint.

Handles user registration, login, and logout functionality.
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import jwt
import bcrypt

from utils.db import get_db_connection
from utils.decorators import token_required
from utils.log_utils import log_signup, log_login, log_logout

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/signup', methods=['POST'])
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
        
        # Log the signup action
        log_signup(user_id, email, role)
        
        return jsonify({
            'message': 'User registered successfully',
            'user_id': user_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
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
        
        # Log successful login
        log_login(user['user_id'], email, success=True)
        
        # Generate JWT token
        from flask import current_app
        token = jwt.encode({
            'user_id': user['user_id'],
            'role': user['role'],
            'exp': datetime.utcnow() + timedelta(days=7)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')
        
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


@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """User logout"""
    # Log logout action
    log_logout(current_user['user_id'], current_user.get('email', 'Unknown'))
    return jsonify({'message': 'Logged out successfully'}), 200