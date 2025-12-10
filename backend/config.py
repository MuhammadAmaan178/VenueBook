"""
Configuration settings for the VenueBook backend application.

Loads configuration from environment variables with sensible defaults.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration class."""
    
    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Database Configuration
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_USER = os.environ.get('DB_USER', 'root')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'Amaan@27665')
    DB_NAME = os.environ.get('DB_NAME', 'db_project')
    
    # CORS Configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173').split(',')
 