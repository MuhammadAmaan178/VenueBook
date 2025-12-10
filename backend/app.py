"""
VenueBook Backend Application

Main entry point for the Flask application.
Registers all route blueprints and configures the application.
"""
from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from routes.auth import auth_bp
from routes.venues import venues_bp
from routes.bookings import bookings_bp
from routes.users import users_bp
from routes.notifications import notifications_bp
from routes.owner import owner_bp
from routes.admin import admin_bp


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(Config)
    
    # Initialize CORS
    CORS(app, origins=Config.CORS_ORIGINS)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(venues_bp)
    app.register_blueprint(bookings_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(owner_bp)
    app.register_blueprint(admin_bp)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    return app


# Create the application instance
app = create_app()


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)