from config import Config
import pymysql
import bcrypt

def create_bot_user():
    print("Connecting to database...")
    try:
        conn = pymysql.connect(
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            host=Config.DB_HOST,
            database=Config.DB_NAME,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        cursor = conn.cursor()

        # Check if bot already exists
        cursor.execute("SELECT * FROM users WHERE email = 'bot@venuefinder.com'")
        bot = cursor.fetchone()

        if bot:
            print("VenueBot already exists.")
            print(f"Bot ID: {bot['user_id']}")
            if bot['user_id'] != 4:
                print("WARNING: Bot ID is not 4 as expected!")
        else:
            print("Creating VenueBot user...")
            # Create bot user
            password = 'bot_secret_password'
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Use 'password' instead of 'password_hash'
            query = """
                INSERT INTO users (user_id, name, email, password, role, phone, created_at)
                VALUES (4, %s, %s, %s, %s, %s, NOW())
            """
            # Including user_id=4 explicitly if possible, or we might need to adjust AUTO_INCREMENT if we really want to force it.
            # However, since we are just updating existing code to 'reflect' the change, we assume the user might have done it manually.
            # But to be safe, if we run this on a fresh DB, let's try to insert with ID 4 if the schema allows or just let it auto-increment and hope/check.
            # Actually, standard INSERT with auto-increment ID usually doesn't take ID.
            # If the user FORCED ID 4, we should probably respect that if we were creating it from scratch.
            # USE CAUTION: The user said "I have change user _id 4 to bot".
            # So I will just update the query to be standard but print the ID.
            
            cursor.execute(query, ('VenueBot 🤖', 'bot@venuefinder.com', hashed_password, 'admin', '0000000000'))
            conn.commit()
            print("VenueBot created successfully!")
            
            # Get the new ID
            cursor.execute("SELECT user_id FROM users WHERE email = 'bot@venuefinder.com'")
            new_bot = cursor.fetchone()
            print(f"New Bot ID: {new_bot['user_id']}")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_bot_user()
