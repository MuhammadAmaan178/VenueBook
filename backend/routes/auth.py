from flask import Blueprint, request, jsonify
import pymysql
import bcrypt
import jwt
import datetime
from app import get_db_connection

auth_bp = Blueprint('auth', __name__)

# Helper function to generate JWT token
def generate_token(user_id, role):
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, 'your-secret-key', algorithm='HS256')

# User Registration
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    phone = data.get('phone')
    role = data.get('role', 'user')
    business_name = data.get('business_name')
    cnic = data.get('cnic')

    # Validation
    if not all([name, email, password]):
        return jsonify({"error": "Name, email, and password are required"}), 400

    connection = get_db_connection()
    if not connection:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        with connection.cursor() as cursor:
            # Check if email already exists
            cursor.execute("SELECT user_id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                return jsonify({"error": "Email already registered"}), 409

            # Hash password
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

            # Insert into users table
            cursor.execute("""
                INSERT INTO users (name, email, password, phone, role, created_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
            """, (name, email, hashed_password.decode('utf-8'), phone, role))
            
            user_id = cursor.lastrowid

            # If user is owner, insert into owners table
            if role == 'owner' and business_name and cnic:
                cursor.execute("""
                    INSERT INTO owners (user_id, business_name, cnic, joined_at)
                    VALUES (%s, %s, %s, NOW())
                """, (user_id, business_name, cnic))

            connection.commit()

            # Generate token
            token = generate_token(user_id, role)

            return jsonify({
                "message": "User registered successfully",
                "token": token,
                "user": {
                    "user_id": user_id,
                    "name": name,
                    "email": email,
                    "role": role
                }
            }), 201

    except pymysql.MySQLError as e:
        connection.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        connection.close()

# User Login
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({"error": "Email and password are required"}), 400

    connection = get_db_connection()
    if not connection:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        with connection.cursor() as cursor:
            # Get user by email
            cursor.execute("""
                SELECT user_id, name, email, password, role, phone 
                FROM users WHERE email = %s
            """, (email,))
            user = cursor.fetchone()

            if not user:
                return jsonify({"error": "Invalid email or password"}), 401

            # Verify password
            if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
                return jsonify({"error": "Invalid email or password"}), 401

            # Generate token
            token = generate_token(user['user_id'], user['role'])

            return jsonify({
                "message": "Login successful",
                "token": token,
                "user": {
                    "user_id": user['user_id'],
                    "name": user['name'],
                    "email": user['email'],
                    "role": user['role'],
                    "phone": user['phone']
                }
            }), 200

    except pymysql.MySQLError as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        connection.close()