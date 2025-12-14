from flask import Blueprint, request, jsonify
from utils.ai_utils import generate_venuebot_response
import os

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/ask', methods=['POST'])
def ask_ai():
    # Helper to check API key indirectly (optional, handled in util)
    if not os.getenv('GEMINI_API_KEY'):
         return jsonify({'error': 'Gemini API Key not configured'}), 503

    data = request.json
    user_message = data.get('message', '')

    try:
        # Use centralized logic
        response_text = generate_venuebot_response(user_message, conversation_id=None)
        
        return jsonify({'response': response_text})

    except Exception as e:
        print(f"AI Error: {e}")
        return jsonify({'error': 'Failed to get response from AI'}), 500
