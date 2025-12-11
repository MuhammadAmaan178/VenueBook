@bookings_bp.route('/<int:booking_id>/review', methods=['GET'])
@token_required
def check_review(booking_id):
    """Check if review exists for a booking"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if booking belongs to user
        cursor.execute("""
            SELECT user_id, status FROM bookings 
            WHERE booking_id = %s
        """, (booking_id,))
        booking = cursor.fetchone()
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        if booking['user_id'] != request.user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Check if review exists
        cursor.execute("""
            SELECT review_id, rating, review_text, notes_date 
            FROM booking_reviews 
            WHERE booking_id = %s
        """, (booking_id,))
        review = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if review:
            return jsonify({
                'has_review': True,
                'review': review
            }), 200
        else:
            return jsonify({
                'has_review': False,
                'can_review': booking['status'] == 'completed'
            }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
