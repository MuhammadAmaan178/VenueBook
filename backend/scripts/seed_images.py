import os
import sys
import random
import requests
from io import BytesIO

# Add backend directory to path to import utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from utils.db import get_db_connection
from utils.image_utils import upload_image

# Sample images to fetch (Unsplash source)
SAMPLE_IMAGES = [
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80", # Banquet
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80", # Garden
    "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80", # Conference
    "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80"  # Party
]

def seed_images():
    app, _ = create_app()
    
    with app.app_context():
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print("1. Fetching venues...")
        cursor.execute("SELECT venue_id, name FROM venues")
        venues = cursor.fetchall()
        
        if not venues:
            print("No venues found to seed.")
            return

        print(f"Found {len(venues)} venues.")
        
        print("2. Uploading sample images to Cloudinary (this may take a moment)...")
        uploaded_urls = []
        
        for i, img_url in enumerate(SAMPLE_IMAGES):
            try:
                print(f"   Downloading and uploading sample {i+1}...")
                response = requests.get(img_url)
                if response.status_code == 200:
                    # Create a file-like object
                    image_data = BytesIO(response.content)
                    image_data.name = f"sample_venue_{i}.jpg" # Cloudinary needs a filename
                    
                    # Upload to Cloudinary
                    url = upload_image(image_data, folder="samples")
                    if url:
                        uploaded_urls.append(url)
                        print(f"   -> Success: {url}")
                    else:
                        print("   -> Failed to upload to Cloudinary (check credentials?)")
            except Exception as e:
                print(f"   -> Error processing image {i+1}: {e}")

        if not uploaded_urls:
            print("No images were uploaded successfully. Aborting seed.")
            return

        print("3. assigning images to venues...")
        count = 0
        for venue in venues:
            # Check if venue already has images
            cursor.execute("SELECT COUNT(*) as count FROM venue_images WHERE venue_id = %s", (venue['venue_id'],))
            existing = cursor.fetchone()['count']
            
            if existing == 0:
                # Assign 1-3 random images
                num_images = random.randint(1, 3)
                selected_urls = random.sample(uploaded_urls, k=min(num_images, len(uploaded_urls)))
                
                for url in selected_urls:
                    cursor.execute("""
                        INSERT INTO venue_images (venue_id, image_url)
                        VALUES (%s, %s)
                    """, (venue['venue_id'], url))
                
                print(f"   Seeded {len(selected_urls)} images for venue #{venue['venue_id']} ({venue['name']})")
                count += 1
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"\nDone! specific images added to {count} venues.")

if __name__ == "__main__":
    seed_images()
