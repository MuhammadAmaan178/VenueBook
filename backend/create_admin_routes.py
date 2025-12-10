"""
Script to extract admin routes from app.py and create admin.py blueprint
"""
import re

# Read the original app.py
with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract admin section (from line 1687 to 2814)
lines = content.split('\n')
admin_section = '\n'.join(lines[1686:2814])  # 0-indexed

# Create header
header = '''"""
Admin panel routes blueprint.

Handles all admin-specific functionality including dashboard, user management,
owner management, venue management, bookings, payments, and system logs.
"""
from flask import Blueprint, request, jsonify

from utils.db import get_db_connection
from utils.decorators import token_required, admin_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


'''

# Replace @app.route with @admin_bp.route
admin_section = admin_section.replace('@app.route(\'/api/admin/', '@admin_bp.route(\'/')

# Write to admin.py
with open('routes/admin.py', 'w', encoding='utf-8') as f:
    f.write(header + admin_section)

print('Admin routes created successfully!')
