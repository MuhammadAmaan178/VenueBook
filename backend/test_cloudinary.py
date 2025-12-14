import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

def test_upload():
    print("Testing locally...")
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
    if not cloud_name:
        print("ERROR: CLOUDINARY_CLOUD_NAME not found in .env")
        return

    print(f"Found Cloudinary config for: {cloud_name}")
    print("Attempting to upload a test image...")

    # Create a dummy file to upload
    dummy_filename = "test_image.txt"
    with open(dummy_filename, "w") as f:
        f.write("This is a test file for Cloudinary upload verification.")

    try:
        # Upload
        response = cloudinary.uploader.upload(dummy_filename, resource_type="raw")
        print("\nSUCCESS! Upload successful.")
        print(f"Public ID: {response.get('public_id')}")
        print(f"URL: {response.get('secure_url')}")
        
        # Cleanup
        try:
            cloudinary.uploader.destroy(response.get('public_id'), resource_type="raw")
            print("Test file deleted from cloud.")
        except:
            pass

    except Exception as e:
        print(f"\nFAILED: {str(e)}")
        print("Please check your API Key and Secret.")

    finally:
        if os.path.exists(dummy_filename):
            os.remove(dummy_filename)

if __name__ == "__main__":
    test_upload()
