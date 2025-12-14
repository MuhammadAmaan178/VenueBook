import cloudinary
import cloudinary.uploader
from flask import current_app

def configure_cloudinary(app):
    cloudinary.config(
        cloud_name=app.config.get('CLOUDINARY_CLOUD_NAME'),
        api_key=app.config.get('CLOUDINARY_API_KEY'),
        api_secret=app.config.get('CLOUDINARY_API_SECRET')
    )

def upload_image(file_obj, folder="venues"):
    """
    Uploads a file object to Cloudinary.
    Returns the secure_url of the uploaded image or None if failed.
    """
    if not file_obj:
        return None
    
    try:
        upload_result = cloudinary.uploader.upload(
            file_obj,
            folder=folder,
            resource_type="auto"
        )
        return upload_result.get('secure_url')
    except Exception as e:
        print(f"Cloudinary upload error: {str(e)}")
        # In production, use current_app.logger.error(f"Cloudinary upload error: {str(e)}")
        return None
