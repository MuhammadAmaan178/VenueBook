"""
Socket.IO Event Handlers

Manages real-time communication events:
- connection/disconnection
- joining rooms
- sending/receiving messages
"""
from flask import request, current_app
from flask_socketio import emit, join_room, leave_room, disconnect
from datetime import datetime
import jwt

from utils.db import get_db_connection
from utils.ai_utils import generate_venuebot_response

# Dictionary to store connected users {user_id: [sid1, sid2]}
connected_users = {}
# Dictionary to store sid to user mapping {sid: user_id}
sid_to_user = {}

def register_socket_handlers(socketio):
    
    @socketio.on('connect')
    def handle_connect():
        """Handle client connection"""
        token = request.args.get('token')
        if not token:
            print("Socket connection refused: No token")
            disconnect()
            return

        try:
            # Decode token
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            user_id = data['user_id']
            
            # Store connection
            if user_id not in connected_users:
                connected_users[user_id] = []
            connected_users[user_id].append(request.sid)
            sid_to_user[request.sid] = user_id
            
            # Join a room specific to this user for private notifications
            join_room(f"user_{user_id}")
            
            print(f"User {user_id} connected [SID: {request.sid}]")
            emit('connection_response', {'status': 'connected', 'user_id': user_id})
            
            # Broadcast status online
            emit('user_status', {'user_id': user_id, 'status': 'online'}, broadcast=True)
            
        except Exception as e:
            print(f"Socket connection error: {str(e)}")
            disconnect()

    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection"""
        # Remove from sid_to_user
        if request.sid in sid_to_user:
            user_id = sid_to_user[request.sid]
            del sid_to_user[request.sid]
            
            # Remove from connected_users
            if user_id in connected_users and request.sid in connected_users[user_id]:
                connected_users[user_id].remove(request.sid)
                if not connected_users[user_id]:
                    del connected_users[user_id]
                    # Broadcast status offline only if no sessions left
                    emit('user_status', {'user_id': user_id, 'status': 'offline'}, broadcast=True)
            
            print(f"User {user_id} disconnected [SID: {request.sid}]")

    @socketio.on('request_status')
    def handle_request_status(data):
        """Check status of a specific user"""
        target_id = data.get('user_id')
        if target_id:
            is_online = target_id in connected_users
            emit('user_status', {'user_id': target_id, 'status': 'online' if is_online else 'offline'})

    @socketio.on('join_conversation')
    def handle_join_conversation(data):
        """Join a specific conversation room"""
        conversation_id = data.get('conversation_id')
        if conversation_id:
            join_room(f"conversation_{conversation_id}")
            print(f"Socket {request.sid} joined conversation {conversation_id}")

    @socketio.on('send_message')
    def handle_send_message(data):
        """Handle sending a message"""
        conn = None
        try:
            conversation_id = data.get('conversation_id')
            content = data.get('content')
            
            # Identify sender safely from socket context
            sender_id = sid_to_user.get(request.sid)
            
            if not all([conversation_id, content, sender_id]):
                print(f"Update failed: Missing data. sender identified: {sender_id}")
                return

            print(f"New message in conv {conversation_id} from {sender_id}: {content}")

            # Save to database
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Check conversation type/participants to see if it's a Bot chat
            # We do this first or during insertion.
            cursor.execute("SELECT admin_id FROM conversations WHERE conversation_id = %s", (conversation_id,))
            conv_data = cursor.fetchone()
            is_bot_chat = False
            if conv_data and conv_data.get('admin_id') == 4:
                is_bot_chat = True

            cursor.execute("""
                INSERT INTO messages (conversation_id, sender_id, content) 
                VALUES (%s, %s, %s)
            """, (conversation_id, sender_id, content))
            
            message_id = cursor.lastrowid
            
            # Update conversation timestamp
            cursor.execute("""
                UPDATE conversations 
                SET last_message_at = CURRENT_TIMESTAMP 
                WHERE conversation_id = %s
            """, (conversation_id,))
            
            # Fetch created message details for broadcast
            cursor.execute("""
                SELECT message_id, conversation_id, sender_id, content, is_read, created_at 
                FROM messages WHERE message_id = %s
            """, (message_id,))
            new_message = cursor.fetchone()
            
            if new_message and new_message.get('created_at'):
                new_message['created_at'] = new_message['created_at'].isoformat()
            
            conn.commit()
            
            # Broadcast user message
            emit('new_message', new_message, room=f"conversation_{conversation_id}")
            
            # VENUEBOT AI LOGIC
            if is_bot_chat and sender_id != 4:
                # Calculate response
                ai_text = generate_venuebot_response(content, conversation_id)
                
                # Insert AI Response
                cursor.execute("""
                    INSERT INTO messages (conversation_id, sender_id, content) 
                    VALUES (%s, %s, %s)
                """, (conversation_id, 4, ai_text))
                
                ai_msg_id = cursor.lastrowid
                
                # Update timestamp again
                cursor.execute("""
                    UPDATE conversations 
                    SET last_message_at = CURRENT_TIMESTAMP 
                    WHERE conversation_id = %s
                """, (conversation_id,))
                
                conn.commit()
                
                # Fetch AI message for broadcast
                cursor.execute("""
                    SELECT message_id, conversation_id, sender_id, content, is_read, created_at 
                    FROM messages WHERE message_id = %s
                """, (ai_msg_id,))
                ai_message = cursor.fetchone()
                
                if ai_message and ai_message.get('created_at'):
                    ai_message['created_at'] = ai_message['created_at'].isoformat()
                    
                # Broadcast AI message
                emit('new_message', ai_message, room=f"conversation_{conversation_id}")

            cursor.close()
            conn.close()
            
        except Exception as e:
            import traceback
            print(f"Error sending message: {str(e)}")
            traceback.print_exc()
            emit('error', {'message': f"Failed to send message: {str(e)}"})
            if conn:
                conn.close()
