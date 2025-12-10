"""
Database connection utilities.

Provides helper functions for establishing and managing database connections.
"""
import pymysql
from flask import current_app


def get_db_connection():
    """
    Create and return a database connection using the current app configuration.
    
    Returns:
        pymysql.Connection: A database connection object with DictCursor.
    """
    return pymysql.connect(
        host=current_app.config['DB_HOST'],
        user=current_app.config['DB_USER'],
        password=current_app.config['DB_PASSWORD'],
        database=current_app.config['DB_NAME'],
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
