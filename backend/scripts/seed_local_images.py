import os
import sys
import argparse
# from fuzzywuzzy import process # Optional dependency
import cloudinary.uploader

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from utils.db import get_db_connection
from utils.image_utils import upload_image

def find_venue_id(cursor, identifier):
    # 1. Try treating as Venue ID (if it looks like a number)
    if str(identifier).isdigit():
        cursor.execute("SELECT venue_id, name, type FROM venues WHERE venue_id = %s", (identifier,))
        result = cursor.fetchone()
        if result:
            return result

    # 2. Try exact match by Name
    cursor.execute("SELECT venue_id, name, type FROM venues WHERE name = %s", (identifier,))
    result = cursor.fetchone()
    if result:
        return result

    # 3. Try case-insensitive Name match
    cursor.execute("SELECT venue_id, name, type FROM venues WHERE LOWER(name) = %s", (str(identifier).lower(),))
    result = cursor.fetchone()
    if result:
        return result
    
    return None

def seed_local_images(base_path):
    if not os.path.exists(base_path):
        print(f"Error: Path '{base_path}' does not exist.")
        return

    app, _ = create_app()
    
    # Check for required packages
    try:
        import fuzzywuzzy
        from fuzzywuzzy import process
    except ImportError:
        print("Note: 'fuzzywuzzy' not found. Installing for name matching (if needed)...")
        # Only install if we really end up needing it, or just rely on IDs for now since user specified IDs.
        # Let's skip auto-install to avoid permission issues, user said they have IDs.
        process = None

    with app.app_context():
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print(f"Scanning directory: {base_path}")
        
        for root, dirs, files in os.walk(base_path):
            folder_name = os.path.basename(root)
            
            # Skip root folder itself if it's the base path
            if os.path.abspath(root) == os.path.abspath(base_path):
                continue
                
            image_files = [f for f in files if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
            
            if not image_files:
                continue
                
            print(f"\nProcessing folder: {folder_name} (found {len(image_files)} images)")
            
            # Find venue
            venue = find_venue_id(cursor, folder_name)
            
            if not venue:
                if process:
                     # Fallback to fuzzy search only if we have the library
                    cursor.execute("SELECT venue_id, name FROM venues")
                    all_venues = cursor.fetchall()
                    names = {v['name']: v for v in all_venues}
                    match = process.extractOne(folder_name, list(names.keys()))
                    if match and match[1] > 80:
                        venue = names[match[0]]
                        print(f"   -> Fuzzy matched to: '{venue['name']}' (Score: {match[1]})")
                
                if not venue:
                    print(f"   -> SKIPPING. Could not match '{folder_name}' to any Venue ID or Name.")
                    continue
            
            print(f"   -> Match found: Venue ID {venue['venue_id']} ({venue['name']})")
            print(f"   -> Uploading to folder: venues/{venue['venue_id']}")
            
            for img_file in image_files:
                file_path = os.path.join(root, img_file)
                try:
                    print(f"      Uploading {img_file}...", end='', flush=True)
                    url = upload_image(file_path, folder=f"venues/{venue['venue_id']}")
                    
                    if url:
                        # Save to DB
                        cursor.execute("""
                            INSERT INTO venue_images (venue_id, image_url)
                            VALUES (%s, %s)
                        """, (venue['venue_id'], url))
                        print(" OK")
                    else:
                        print(" Failed")
                except Exception as e:
                    print(f" Error: {e}")
            
            # Commit after each venue to show progress
            conn.commit()

        conn.commit()
        cursor.close()
        conn.close()
        print("\nUpload complete.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python backend/seed_local_images.py <path_to_images_folder>")
        print("Example: python backend/seed_local_images.py 'C:/Users/Downloads/VenueImages'")
    else:
        seed_local_images(sys.argv[1])
