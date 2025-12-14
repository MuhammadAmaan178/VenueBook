from utils.db import get_db_connection
from app import create_app

def cleanup_duplicates():
    app, _ = create_app()
    with app.app_context():
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print("Cleaning up duplicate images...")
        
        # 1. Get all venue IDs
        cursor.execute("SELECT DISTINCT venue_id FROM venue_images")
        venues = cursor.fetchall()
        
        total_deleted = 0
        
        for venue in venues:
            v_id = venue['venue_id']
            # Get images for this venue ordered by ID descending (newest first)
            cursor.execute("SELECT image_id FROM venue_images WHERE venue_id = %s ORDER BY image_id DESC", (v_id,))
            images = cursor.fetchall()
            
            if len(images) > 3:
                # Keep first 3, delete rest
                to_delete = [img['image_id'] for img in images[3:]]
                
                # Convert list to tuple for SQL IN clause
                if len(to_delete) == 1:
                    placeholder = "(%s)"
                else:
                    placeholder = str(tuple(to_delete))
                
                # Execute deletion (had to jump through hoops for tuple formatting)
                format_strings = ','.join(['%s'] * len(to_delete))
                cursor.execute(f"DELETE FROM venue_images WHERE image_id IN ({format_strings})", tuple(to_delete))
                
                print(f"Venue {v_id}: Deleted {len(to_delete)} duplicates. Keeping {images[0]['image_id']}, {images[1]['image_id']}, {images[2]['image_id']}")
                total_deleted += len(to_delete)
        
        conn.commit()
        cursor.close()
        conn.close()
        print(f"\nCleanup complete. Total deleted images: {total_deleted}")

if __name__ == "__main__":
    cleanup_duplicates()
