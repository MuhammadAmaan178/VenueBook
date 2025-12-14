"""
VenueBook Backend Application

Main entry point for the Flask application.
Registers all route blueprints and configures the application.
"""
from flask import Flask, jsonify
from flask_cors import CORS

from extensions import socketio
from config import Config
from routes.auth import auth_bp
from routes.venues import venues_bp
from routes.bookings import bookings_bp
from routes.users import users_bp
from routes.notifications import notifications_bp
from routes.owner import owner_bp
from routes.admin import admin_bp
from routes.ai_routes import ai_bp
from socket_handlers import register_socket_handlers


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(Config)
    
    # Initialize CORS
    CORS(app, origins=Config.CORS_ORIGINS)
    
    # Initialize SocketIO with eventlet
    # cors_allowed_origins="*" might be needed if Config.CORS_ORIGINS causes issues, 
    # but sticking to Config is safer first.
    socketio.init_app(app, cors_allowed_origins=Config.CORS_ORIGINS, async_mode='eventlet')
    
    # Configure Cloudinary
    from utils.image_utils import configure_cloudinary
    configure_cloudinary(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(venues_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(owner_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(ai_bp, url_prefix='/api/chat')
    
    # Register socket handlers
    register_socket_handlers(socketio)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    return app, socketio


# Create the application instance
app, socketio = create_app()


if __name__ == '__main__':
    # Use socketio.run instead of app.run
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)