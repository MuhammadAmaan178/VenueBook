import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # MySQL Database Configuration
    MYSQL_HOST = 'localhost'
    MYSQL_USER = 'root'
    MYSQL_PASSWORD = 'Amaan@27665'  # Replace with your actual password
    MYSQL_DB = 'db_project'
    MYSQL_PORT = 3306
    
    # CORS
    CORS_ORIGINS = ["http://localhost:5173"] 