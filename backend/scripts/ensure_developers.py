from app import app
from utils.db import get_db_connection

def ensure_developers():
    with app.app_context():
        conn = get_db_connection()
        cursor = conn.cursor()
        
        devs = [
            {'id': 1, 'name': 'Muhammad Amaan'},
            {'id': 2, 'name': 'Saad Baseer'},
            {'id': 3, 'name': 'Muhammad Nihal Sheikh'}
        ]
        
        for dev in devs:
            print(f"\nProcessing {dev['name']} (User ID: {dev['id']})...")
            
            # 1. Check if user exists (just to record it, assuming they do because user said so)
            cursor.execute("SELECT user_id FROM users WHERE user_id = %s", (dev['id'],))
            user_exists = cursor.fetchone()
            if not user_exists:
                print(f"WARNING: User ID {dev['id']} does not exist in users table! Skipping.")
                continue

            # 2. Check/Create Owner
            cursor.execute("SELECT owner_id FROM owners WHERE user_id = %s", (dev['id'],))
            owner = cursor.fetchone()
            
            if not owner:
                print(f"Creating Owner profile for {dev['name']}...")
                cursor.execute("""
                    INSERT INTO owners (user_id, business_name)
                    VALUES (%s, %s)
                """, (dev['id'], f"{dev['name']}'s Office"))
                owner_id = cursor.lastrowid
                print(f" -> Created Owner ID: {owner_id}")
            else:
                owner_id = owner['owner_id']
                print(f"Owner profile exists (ID: {owner_id})")
                
            # 3. Check/Create Venue
            cursor.execute("SELECT venue_id FROM venues WHERE owner_id = %s", (owner_id,))
            venue = cursor.fetchone()
            
            if not venue:
                 print(f"Creating Venue for {dev['name']}...")
                 cursor.execute("""
                    INSERT INTO venues (owner_id, name, type, address, city, description, status, base_price, capacity, rating, created_at)
                    VALUES (%s, %s, 'Office', 'Developer HQ', 'Karachi', 'Official Developer Contact', 'active', 0, 10, 5.0, NOW())
                 """, (owner_id, f"{dev['name']}'s Desk"))
                 venue_id = cursor.lastrowid
                 print(f" -> Created Venue ID: {venue_id}")
            else:
                 print(f"Venue exists (ID: {venue['venue_id']})")
                 
        conn.commit()
        cursor.close()
        conn.close()
        print("\nEnsure Developers Script Completed.")

if __name__ == "__main__":
    ensure_developers()
