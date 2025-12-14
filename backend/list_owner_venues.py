from app import create_app
from utils.db import get_db_connection

def list_owner_venues():
    app, _ = create_app()
    with app.app_context():
        conn = get_db_connection()
        cursor = conn.cursor()
        
        owner_id = 175
        
        print(f"=== Listing ALL venues for Owner {owner_id} ===\n")
        
        cursor.execute("""
            SELECT venue_id, name, city, type, status, owner_id
            FROM venues
            WHERE owner_id = %s
            ORDER BY venue_id
        """, (owner_id,))
        
        venues = cursor.fetchall()
        
        if venues:
            print(f"Found {len(venues)} venue(s):")
            for v in venues:
                print(f"  - ID: {v['venue_id']}, Name: {v['name']}, City: {v['city']}, Status: {v['status']}")
        else:
            print(f"⚠ No venues found for owner {owner_id}")
            print("\nLet's check if owner exists...")
            cursor.execute("SELECT * FROM owners WHERE owner_id = %s", (owner_id,))
            owner = cursor.fetchone()
            if owner:
                print(f"✓ Owner {owner_id} exists: {owner['business_name']}")
            else:
                print(f"✗ Owner {owner_id} does NOT exist in database")
        
        conn.close()

if __name__ == '__main__':
    list_owner_venues()
