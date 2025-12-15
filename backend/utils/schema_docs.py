"""
Database Schema Documentation for AI
Provides clean, formatted schema information for SQL generation
"""

SCHEMA_DOCUMENTATION = """
DATABASE: VenueBook
Total Tables: 16

=== CORE TABLES ===

1. users
   - user_id (PK), name, email, phone, role (user/owner/admin/bot), created_at

2. owners  
   - owner_id (PK), user_id (FK), business_name, verification_status, joined_at

3. venues
   - venue_id (PK), owner_id (FK), name, type, address, city, capacity
   - base_price, rating, description, status (active/inactive/pending/rejected), created_at

4. bookings
   - booking_id (PK), user_id (FK), venue_id (FK), event_date, slot (full-day/morning/evening)
   - event_type, special_requirements, total_price, status (pending/confirmed/rejected/completed), created_at

5. booking_payments
   - payment_id (PK), booking_id (FK), amount, method (bank-transfer/cash)
   - trx_id, payment_status (pending/completed/failed), payment_date

6. venue_reviews
   - review_id (PK), user_id (FK), venue_id (FK), rating (1-5), review_text, review_date

=== VENUE DETAILS ===

7. venue_images
   - image_id (PK), venue_id (FK), image_url, uploaded_at

8. venue_facilities
   - facility_id (PK), facility_name, extra_price

9. venue_facility_map
   - map_id (PK), venue_id (FK), facility_id (FK), availability (yes/no)

10. venue_availability
    - availability_id (PK), venue_id (FK), date, slot, is_available

=== BOOKING DETAILS ===

11. booking_customer_details
    - id (PK), booking_id (FK), fullname, email, phone_primary, phone_secondary

12. booking_facilities
    - booking_facility_id (PK), booking_id (FK), facility_id (FK)

=== COMMUNICATION ===

13. conversations
    - conversation_id (PK), user_id (FK), owner_id (FK), admin_id (FK), venue_id (FK)
    - conversation_type (customer_owner/customer_admin/owner_admin/with_bot)
    - title, last_message_at, created_at, is_active

14. messages
    - message_id (PK), conversation_id (FK), sender_id (FK), content, is_read, created_at

15. notifications
    - notification_id (PK), user_id (FK), title, message, type (booking/system/verification)
    - booking_id (FK), venue_id (FK), is_read, created_at

=== SYSTEM ===

16. logs
    - log_id (PK), action_by (FK), action_type, target_table, details, created_at

=== IMPORTANT RELATIONSHIPS ===
- users ← owners (user_id)
- owners ← venues (owner_id)
- users ← bookings → venues
- bookings ← booking_payments, booking_customer_details, booking_facilities
- venues ← venue_images, venue_facility_map, venue_availability, venue_reviews
- users ← conversations → owners/admins
- conversations ← messages

=== CONFIDENTIAL FIELDS (NEVER SELECT) ===
- users.password
- owners.cnic
- venue_payment_info.account_number
"""

CONFIDENTIAL_FIELDS = ['password', 'cnic', 'account_number']

SQL_GENERATION_RULES = """
RULES FOR SQL GENERATION:
1. Generate ONLY SELECT queries
2. NEVER include password, cnic, or account_number fields
3. Use proper JOINs when querying multiple tables
4. Always add LIMIT clause (default 100, max 1000)
5. Use aggregate functions (COUNT, AVG, SUM, MAX, MIN) for statistics
6. Use WHERE clauses for filtering
7. Use ORDER BY for sorting
8. Format dates properly
9. Return syntactically correct MySQL/MariaDB SQL
10. DO NOT include explanations, ONLY the SQL query
"""

def get_schema_docs():
    """Returns formatted schema documentation for AI."""
    return SCHEMA_DOCUMENTATION

def get_sql_rules():
    """Returns SQL generation rules."""
    return SQL_GENERATION_RULES

def get_confidential_fields():
    """Returns list of confidential field names."""
    return CONFIDENTIAL_FIELDS
