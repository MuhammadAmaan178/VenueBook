from groq import Groq
import os
import re
import json
from utils.db import get_db_connection
from utils.schema_docs import get_schema_docs, get_sql_rules, get_confidential_fields

# Configure Groq
api_key = os.getenv('GROQ_API_KEY')
groq_client = Groq(api_key=api_key) if api_key else None

CONFIDENTIAL_FIELDS = get_confidential_fields()


def detect_language(text):
    """
    Detect the language of user input.
    Returns: 'urdu', 'hindi', 'roman_urdu', or 'english'
    """
    # Check for Urdu/Hindi Unicode characters
    urdu_hindi_chars = 0
    for char in text:
        if '\u0600' <= char <= '\u06FF' or '\u0900' <= char <= '\u097F':  # Urdu/Hindi Unicode ranges
            urdu_hindi_chars += 1
    
    # If more than 30% of non-space chars are Urdu/Hindi, it's native script
    non_space_chars = len([c for c in text if not c.isspace()])
    if non_space_chars > 0 and (urdu_hindi_chars / non_space_chars) > 0.3:
        return 'urdu'  # Could be Hindi too, but we'll treat similarly
    
    # Check for common Roman Urdu/Hindi words
    roman_urdu_keywords = [
        'kya', 'hai', 'hain', 'mein', 'ko', 'ka', 'ki', 'ke', 'se', 'ne',
        'kitne', 'kahan', 'kaise', 'kyun', 'venue', 'booking', 'price',
        'shaadi', 'mehngai', 'sasti', 'acchi', 'kitna', 'dikhao', 'batao'
    ]
    
    text_lower = text.lower()
    roman_urdu_count = sum(1 for keyword in roman_urdu_keywords if keyword in text_lower)
    
    if roman_urdu_count >= 2:
        return 'roman_urdu'
    
    return 'english'


def get_conversation_history(conversation_id, limit=3):
    """
    Retrieve recent conversation history for context.
    Limited to 3 messages to avoid token overflow.
    """
    if not conversation_id:
        return ""
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT sender_id, content 
            FROM messages 
            WHERE conversation_id = %s 
            ORDER BY created_at DESC 
            LIMIT %s
        """, (conversation_id, limit))
        
        messages = cursor.fetchall()
        conn.close()
        
        if not messages:
            return ""
        
        # Build context string
        history = "Recent conversation:\n"
        for msg in reversed(messages):
            sender = "Bot" if msg['sender_id'] == 4 else "User"
            history += f"{sender}: {msg['content']}\n"
        
        return history
        
    except Exception as e:
        print(f"AI Utils: Error fetching conversation history: {e}")
        return ""


def detect_comparison_query(user_question):
    """
    Detect if user wants to compare venues.
    Returns (is_comparison, venue_names) tuple.
    """
    comparison_patterns = [
        r'compare (.*?) (?:vs|versus|and|with) (.*?)(?:\?|$)',
        r'difference between (.*?) and (.*?)(?:\?|$)',
        r'(.*?) or (.*?)(?:\?|\s+which)',
    ]
    
    question_lower = user_question.lower()
    
    for pattern in comparison_patterns:
        match = re.search(pattern, question_lower)
        if match:
            venue1 = match.group(1).strip()
            venue2 = match.group(2).strip()
            return True, (venue1, venue2)
    
    return False, None


def handle_comparison_query(venue1, venue2):
    """
    Handle venue comparison requests.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Search for both venues
        query = """
            SELECT venue_id, name, city, address, capacity, base_price, rating, type, description
            FROM venues
            WHERE LOWER(name) LIKE %s OR LOWER(name) LIKE %s
            AND status = 'active'
            LIMIT 2
        """
        
        cursor.execute(query, (f'%{venue1}%', f'%{venue2}%'))
        venues = cursor.fetchall()
        conn.close()
        
        if len(venues) < 2:
            return f"I found {len(venues)} venue(s), but I need at least 2 to compare. Could you be more specific with the venue names? You can ask 'Show me venues in [city]' to see available options first!"
        
        # Format comparison
        v1, v2 = venues[0], venues[1]
        
        comparison = f"""Here's a comparison of **{v1['name']}** vs **{v2['name']}**: 📊\n\n"""
        comparison += f"| Feature | {v1['name']} | {v2['name']} |\n"
        comparison += f"|---------|{'---'*len(v1['name'])}|{'---'*len(v2['name'])}|\n"
        comparison += f"| **Location** | {v1['city']} | {v2['city']} |\n"
        comparison += f"| **Capacity** | {v1['capacity']} guests | {v2['capacity']} guests |\n"
        comparison += f"| **Price** | Rs. {v1['base_price']:,.0f} | Rs. {v2['base_price']:,.0f} |\n"
        comparison += f"| **Rating** | ⭐ {v1['rating']}/5 | ⭐ {v2['rating']}/5 |\n"
        comparison += f"| **Type** | {v1['type']} | {v2['type']} |\n\n"
        
        # Add recommendation
        if v1['rating'] > v2['rating']:
            comparison += f"💡 **{v1['name']}** has a higher rating!"
        elif v2['rating'] > v1['rating']:
            comparison += f"💡 **{v2['name']}** has a higher rating!"
        
        if v1['base_price'] < v2['base_price']:
            comparison += f" **{v1['name']}** is more budget-friendly."
        elif v2['base_price'] < v1['base_price']:
            comparison += f" **{v2['name']}** is more budget-friendly."
        
        return comparison
        
    except Exception as e:
        print(f"AI Utils: Error in comparison: {e}")
        return "Sorry, I had trouble comparing those venues. Could you try again with the exact venue names?"


def detect_recommendation_query(user_question):
    """
    Detect if user wants recommendations/suggestions.
    """
    recommendation_keywords = [
        'recommend', 'suggest', 'best venue', 'good venue', 'which venue',
        'help me find', 'looking for', 'need a venue', 'want a venue'
    ]
    
    return any(keyword in user_question.lower() for keyword in recommendation_keywords)


def generate_sql_from_question(user_question, conversation_history=""):
    """
    Step 1: Generate SQL query from natural language question using Groq.
    Returns SQL query string or None if generation fails.
    """
    if not api_key or not groq_client:
        return None
    
    schema_docs = get_schema_docs()
    sql_rules = get_sql_rules()
    
    context_note = ""
    if conversation_history:
        context_note = f"\n\nConversation context (use if relevant):\n{conversation_history}"
    
    prompt = f"""You are a SQL expert for the VenueBook database.

{schema_docs}

{sql_rules}{context_note}

User Question: {user_question}

Generate a SQL query to answer this question.
Return ONLY the SQL query, nothing else. No explanations, no markdown, just the SQL.
"""
    
    try:
        print(f"AI Utils: Generating SQL for question: {user_question}")
        
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.1,  # Low temperature for consistent SQL
            max_tokens=500
        )
        
        sql_query = chat_completion.choices[0].message.content.strip()
        
        # Remove markdown code blocks if present
        sql_query = re.sub(r'```sql\n?', '', sql_query)
        sql_query = re.sub(r'```\n?', '', sql_query)
        sql_query = sql_query.strip()
        
        print(f"AI Utils: Generated SQL: {sql_query}")
        return sql_query
        
    except Exception as e:
        print(f"AI Utils: Error generating SQL: {e}")
        return None


def validate_sql_security(sql_query):
    """
    Step 2: Validate SQL query for security.
    Returns (is_safe: bool, error_message: str)
    """
    if not sql_query:
        return False, "Empty query"
    
    sql_upper = sql_query.upper().strip()
    
    # Check 1: Must be SELECT only
    if not sql_upper.startswith('SELECT'):
        return False, "Only SELECT queries are allowed"
    
    # Check 2: No destructive operations
    destructive_keywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE', 'REPLACE']
    for keyword in destructive_keywords:
        if keyword in sql_upper:
            return False, f"Destructive operation '{keyword}' is not allowed"
    
    # Check 3: No confidential fields
    sql_lower = sql_query.lower()
    for field in CONFIDENTIAL_FIELDS:
        # Check for field name in various contexts
        patterns = [
            f'{field}',           # Direct field name
            f'.{field}',          # table.field
            f' {field} ',         # spaced field
            f' {field},',         # field in SELECT list
            f',{field},',         # field in middle of list
            f',{field} ',         # field at end
        ]
        for pattern in patterns:
            if pattern in sql_lower:
                return False, f"Confidential field '{field}' cannot be queried"
    
    # Check 4: Ensure LIMIT exists (add if missing)
    if 'LIMIT' not in sql_upper:
        # Will add LIMIT in execute function
        pass
    
    return True, "Query is safe"


def execute_safe_query(sql_query):
    """
    Step 3: Execute validated SQL query in read-only mode.
    Returns (results: list, error: str)
    """
    try:
        # Add LIMIT if not present
        if 'LIMIT' not in sql_query.upper():
            sql_query += " LIMIT 100"
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print(f"AI Utils: Executing query: {sql_query}")
        cursor.execute(sql_query)
        results = cursor.fetchall()
        conn.close()
        
        print(f"AI Utils: Query returned {len(results)} rows")
        return results, None
        
    except Exception as e:
        print(f"AI Utils: Query execution error: {e}")
        return None, str(e)


def format_query_results(user_question, results, sql_query, is_recommendation=False, language='english'):
    """
    Step 4: Format SQL results into natural language using Groq.
    Supports multiple languages.
    """
    if not api_key or not groq_client:
        return "I am not fully configured yet (Missing API Key)."
    
    if results is None:
        return "Sorry, there was an error executing the query."
    
    if len(results) == 0:
        if language == 'urdu':
            return "Hmm, mujhe is sawaal ka koi data nahi mila. Kya aap isko dusre tareeqe se pooch sakte hain? Main yahan madad ke liye hoon! 😊"
        elif language == 'roman_urdu':
            return "Hmm, mujhe iska koi data nahi mila. Kya aap isse dusre tarah se puchh sakte hain? Main help ke liye hazir hoon! 😊"
        else:
            return "Hmm, I couldn't find any data for that. Could you try asking in a different way, or maybe check the spelling? I'm here to help! 😊"
    
    # Format results for AI consumption
    # Limit to first 50 rows to prevent payload issues
    limited_results = results[:50]
    
    # Convert to simple format
    if len(limited_results) == 1 and len(limited_results[0]) == 1:
        # Single value result (like COUNT, SUM, AVG)
        result_data = f"Result: {list(limited_results[0].values())[0]}"
    else:
        # Multiple rows/columns
        result_data = []
        for row in limited_results:
            result_data.append(dict(row))
        
        result_data = json.dumps(result_data, default=str, indent=2)
    
    # Language-specific instructions
    language_instructions = {
        'english': """Now, provide a natural, conversational answer. Be friendly and helpful!

Guidelines:
- Talk naturally like you're chatting with a friend, not writing a formal report
- Use contractions (I've, you're, there's) to sound more human
- Be enthusiastic and helpful without being overly formal
- Use markdown formatting (**bold** for important info, lists for multiple items)
- If showing numbers, provide context or insights when helpful
- Keep it concise but friendly
- Feel free to add helpful suggestions or related info
- Don't mention SQL or technical details unless specifically asked
- Sound like an AI assistant (Gemini/ChatGPT style), not a database bot""",
        
        'urdu': """اب ایک قدرتی، دوستانہ جواب دیں! اردو میں جواب دیں۔

رہنمائی:
- دوستانہ انداز میں بات کریں، رسمی رپورٹ نہیں
- پرجوش اور مددگار رہیں
- اہم معلومات کو **bold** میں لکھیں
- اگر نمبرز دکھا رہے ہیں تو سیاق و سباق فراہم کریں
- مختصر لیکن دوستانہ رہیں
- مددگار تجاویز شامل کریں
- SQL یا تکنیکی تفصیلات کا ذکر نہ کریں
- AI assistant کی طرح بات کریں، database bot کی طرح نہیں""",
        
        'roman_urdu': """Ab ek natural, friendly jawab dein! Roman Urdu mein respond karein.

Guidelines:
- Dostana andaaz mein baat karein, formal report nahi
- Enthusiastic aur helpful rahein
- Important info ko **bold** mein likhein
- Agar numbers dikha rahe hain to context provide karein
- Concise lekin friendly rahein
- Helpful suggestions shamil karein
- SQL ya technical details ka zikr na karein
- AI assistant ki tarah baat karein, database bot ki tarah nahi"""
    }
    
    recommendation_note = ""
    if is_recommendation:
        if language == 'urdu':
            recommendation_note = "\n\nاہم: صارف سفارش چاہتا ہے، صرف ڈیٹا نہیں۔ نتائج کا تجزیہ کریں اور بہترین آپشن تجویز کریں اور وجوہات بتائیں!"
        elif language == 'roman_urdu':
            recommendation_note = "\n\nIMPORTANT: User recommendation chahta hai, sirf data nahi. Results ka analysis karein aur BEST option suggest karein wajoohat ke saath!"
        else:
            recommendation_note = "\n\nIMPORTANT: The user wants a RECOMMENDATION, not just data. Analyze the results and suggest the BEST option with reasons why!"
    
    lang_instruction = language_instructions.get(language, language_instructions['english'])
    
    prompt = f"""You are VenueBot, a friendly and helpful AI assistant for VenueBook.

User asked: {user_question}

I've retrieved this data from the database:
{result_data}{recommendation_note}

{lang_instruction}

Example good responses:
- "I found 15 venues in Karachi! They include..."
- "Great question! The average rating is 4.3 stars, which is pretty solid."
- "Here are the top 5 rated venues you asked about..."
- "Looking at the data, wedding hall bookings are super popular - they make up about 60% of all bookings!"
"""
    
    try:
        print(f"AI Utils: Formatting results in {language}...")
        
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.8,  # Higher for natural, conversational tone
            max_tokens=800
        )
        
        response = chat_completion.choices[0].message.content
        
        # Add context if results were limited
        if len(results) > 50:
            if language in ['urdu', 'roman_urdu']:
                response += f"\n\n*(Pehle 50 results dikha rahe hain, total {len(results)} hain)*"
            else:
                response += f"\n\n*(Showing first 50 of {len(results)} total results)*"
        
        print(f"AI Utils: Successfully formatted response in {language}")
        return response
        
    except Exception as e:
        print(f"AI Utils: Error formatting results: {e}")
        # Fallback: return raw results
        if len(results) == 1 and len(results[0]) == 1:
            return f"Result: {list(results[0].values())[0]}"
        else:
            return f"Found {len(results)} results."
    """
    Step 4: Format SQL results into natural language using Groq.
    """
    if not api_key or not groq_client:
        return "I am not fully configured yet (Missing API Key)."
    
    if results is None:
        return "Sorry, there was an error executing the query."
    
    if len(results) == 0:
        return "Hmm, I couldn't find any data for that. Could you try asking in a different way, or maybe check the spelling? I'm here to help! 😊"
    
    # Format results for AI consumption
    # Limit to first 50 rows to prevent payload issues
    limited_results = results[:50]
    
    # Convert to simple format
    if len(limited_results) == 1 and len(limited_results[0]) == 1:
        # Single value result (like COUNT, SUM, AVG)
        result_data = f"Result: {list(limited_results[0].values())[0]}"
    else:
        # Multiple rows/columns
        result_data = []
        for row in limited_results:
            result_data.append(dict(row))
        
        result_data = json.dumps(result_data, default=str, indent=2)
    
    recommendation_note = ""
    if is_recommendation:
        recommendation_note = "\n\nIMPORTANT: The user wants a RECOMMENDATION, not just data. Analyze the results and suggest the BEST option with reasons why!"
    
    prompt = f"""You are VenueBot, a friendly and helpful AI assistant for VenueBook.

User asked: {user_question}

I've retrieved this data from the database:
{result_data}{recommendation_note}

Now, provide a natural, conversational answer. Be friendly and helpful!

Guidelines:
- Talk naturally like you're chatting with a friend, not writing a formal report
- Use contractions (I've, you're, there's) to sound more human
- Be enthusiastic and helpful without being overly formal
- Use markdown formatting (**bold** for important info, lists for multiple items)
- If showing numbers, provide context or insights when helpful
- Keep it concise but friendly
- Feel free to add helpful suggestions or related info
- Don't mention SQL or technical details unless specifically asked
- Sound like an AI assistant (Gemini/ChatGPT style), not a database bot

Example good responses:
- "I found 15 venues in Karachi! They include..."
- "Great question! The average rating is 4.3 stars, which is pretty solid."
- "Here are the top 5 rated venues you asked about..."
- "Looking at the data, wedding hall bookings are super popular - they make up about 60% of all bookings!"
"""
    
    try:
        print(f"AI Utils: Formatting results...")
        
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.8,  # Higher for natural, conversational tone
            max_tokens=800
        )
        
        response = chat_completion.choices[0].message.content
        
        # Add context if results were limited
        if len(results) > 50:
            response += f"\n\n*(Showing first 50 of {len(results)} total results)*"
        
        print(f"AI Utils: Successfully formatted response")
        return response
        
    except Exception as e:
        print(f"AI Utils: Error formatting results: {e}")
        # Fallback: return raw results
        if len(results) == 1 and len(results[0]) == 1:
            return f"Result: {list(results[0].values())[0]}"
        else:
            return f"Found {len(results)} results."


def generate_information_bot_response(user_question, conversation_id=None):
    """
    Main function: Comprehensive information bot using SQL generation.
    Supports multiple languages: English, Urdu, Hindi, Roman Urdu.
    
    Process:
    0. Detect language
    1. Get conversation history (if available)
    2. Check if it's casual conversation (greeting/small talk)
    3. Check for how-to/procedural questions
    4. Check for venue comparison
    5. Generate SQL from natural language
    6. Validate SQL for security
    7. Execute query safely
    8. Format results naturally in user's language
    """
    if not api_key or not groq_client:
        return "I am not fully configured yet (Missing API Key)."
    
    # Step 0: Detect language
    detected_language = detect_language(user_question)
    print(f"AI Utils: Detected language: {detected_language}")
    """
    Main function: Comprehensive information bot using SQL generation.
    
    Process:
    0. Get conversation history (if available)
    1. Check if it's casual conversation (greeting/small talk)
    2. Check for how-to/procedural questions
    3. Check for venue comparison
    4. Generate SQL from natural language
    5. Validate SQL for security
    6. Execute query safely
    7. Format results naturally
    """
    if not api_key or not groq_client:
        return "I am not fully configured yet (Missing API Key)."
    
    # Step 0: Get conversation history for context
    conversation_history = get_conversation_history(conversation_id) if conversation_id else ""
    
    # Step 1: Check for casual conversation/greetings
    casual_keywords = [
        'hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 
        'good evening', 'how are you', 'whats up', "what's up", 'sup',
        'thanks', 'thank you', 'bye', 'goodbye', 'see you'
    ]
    
    question_lower = user_question.lower().strip()
    
    # If it's just a greeting or thank you, respond casually without querying DB
    if any(keyword in question_lower for keyword in casual_keywords) and len(user_question.split()) < 8:
        casual_responses = {
            'hello': "Hello! 👋 I'm VenueBot, your venue booking assistant. I can help you find information about our venues, bookings, reviews, and more. What would you like to know?",
            'hi': "Hi there! 😊 I'm here to help you with any questions about our venues and bookings. Just ask away!",
            'hey': "Hey! 👋 What can I help you with today? I can answer questions about venues, bookings, pricing, and more.",
            'thanks': "You're welcome! Happy to help! 😊",
            'thank you': "My pleasure! Let me know if you need anything else.",
            'bye': "Goodbye! Have a great day! 👋",
            'how are you': "I'm doing great, thanks for asking! 😊 How can I assist you today?",
        }
        
        for keyword, response in casual_responses.items():
            if keyword in question_lower:
                return response
        
        return "Hello! 😊 I'm VenueBot. I can help you find information about venues, bookings, reviews, and analytics. What would you like to know?"
    
    # Step 2: Check for how-to/procedural questions
    how_to_patterns = {
        'book': {
            'keywords': ['how to book', 'how do i book', 'how can i book', 'booking process', 'make a booking', 'reserve'],
            'response': """Great question! Here's how to book a venue on VenueBook:

1. **Browse Venues** - Check out available venues on our platform
2. **Select Your Venue** - Click on a venue you like to see full details
3. **Check Availability** - Make sure your preferred date and time slot is available
4. **Fill Booking Form** - Provide your event details (date, event type, guest count, etc.)
5. **Submit Request** - Send your booking request to the venue owner
6. **Wait for Confirmation** - The owner will review and confirm your booking
7. **Make Payment** - Once confirmed, complete the payment to finalize

Need help finding venues? Just ask me "Show me venues in [city]" or "Venues for [event type]"! 🎉"""
        },
        'register': {
            'keywords': ['how to register', 'how do i sign up', 'create account', 'make account', 'registration'],
            'response': """To register on VenueBook:

1. Click the **Sign Up** button on our homepage
2. Choose account type (**Customer** or **Venue Owner**)
3. Fill in your details (name, email, phone, password)
4. Verify your email
5. You're all set! 🎊

**As a Customer**: You can browse and book venues  
**As an Owner**: You can list and manage your venues (requires verification)

Ready to explore? Ask me about our venues! 😊"""
        },
        'pay': {
            'keywords': ['how to pay', 'payment method', 'make payment', 'pay for booking'],
            'response': """Payment on VenueBook is easy! 💳

**Available Methods:**
- 🏦 **Bank Transfer** - Direct transfer to venue owner's account
- 💵 **Cash** - Pay directly to the owner

**Process:**
1. After your booking is **confirmed** by the owner
2. You'll receive payment details
3. Complete payment using your preferred method
4. Upload payment proof (for bank transfers)
5. Done! Your booking is secured

Want to see venue pricing? Just ask "Show me venue prices" or "Venues under [budget]"!"""
        },
        'review': {
            'keywords': ['how to review', 'leave a review', 'write review', 'rate venue'],
            'response': """You can leave a review after your event! ⭐

**Steps:**
1. Complete your booked event
2. You'll receive a notification to review
3. Rate the venue (1-5 stars)
4. Write your experience
5. Submit!

Your reviews help other customers make better choices. Want to see what others are saying? Ask me "Show recent reviews" or "Top rated venues"! 😊"""
        },
        'contact': {
            'keywords': ['contact owner', 'talk to owner', 'message owner', 'reach owner'],
            'response': """You can contact venue owners through our chat system! 💬

**After booking:**
- Go to your booking details
- You'll see owner contact information
- Use our in-app chat to communicate
- Or call them directly using the provided phone number

Want to book a venue first? Ask me to "Show venues in [your city]"!"""
        },
        'help': {
            'keywords': ['help', 'what can you do', 'how do you work', 'features', 'capabilities'],
            'response': """I'm VenueBot, your AI assistant! Here's what I can do: 🤖

**Information I can provide:**
- 📍 Venue locations, prices, and ratings
- 📊 Booking statistics and analytics  
- 💰 Revenue and payment information
- ⭐ Reviews and ratings
- 📅 Availability information

**Questions I can answer:**
- "How many venues in Karachi?"
- "What's the average venue price?"
- "Top 5 rated venues"
- "Compare venue A vs venue B"
- "Recommend a venue for my wedding"

**How-to help:**
- "How to book a venue?"
- "How to register?"
- "How to report an issue?"

Just ask away! I'm here to help. 😊"""
        },
        'report': {
            'keywords': ['report issue', 'report problem', 'complaint', 'file complaint', 'contact support', 'customer support'],
            'response': """I'm sorry you're experiencing an issue! Here's how to report it: 🆘

**For Booking Issues:**
1. Go to your booking details
2. Click "Report Issue"
3. Describe the problem
4. Our team will review within 24 hours

**For Payment Problems:**
- Contact our support team
- Email: support@venuebook.com
- Phone: [Support Number]
- Include your booking ID

**For Other Concerns:**
- Use the "Contact Admin" feature in your dashboard
- Our admins monitor messages 24/7

We're here to help resolve any issues quickly! 💪"""
        }
    }
    
    question_lower = user_question.lower()
    
    # Check for how-to questions
    for category, data in how_to_patterns.items():
        if any(keyword in question_lower for keyword in data['keywords']):
            return data['response']
    
    # Step 3: Check for venue comparison
    is_comparison, venues = detect_comparison_query(user_question)
    if is_comparison and venues:
        return handle_comparison_query(venues[0], venues[1])
    
    # Step 4: Check if it's a recommendation query
    is_recommendation = detect_recommendation_query(user_question)
    
    # Step 5: Generate SQL
    sql_query = generate_sql_from_question(user_question, conversation_history)
    
    if not sql_query:
        return "Hmm, I'm having a bit of trouble understanding that question. Could you rephrase it or give me a bit more detail? 😊"
    
    # Step 6: Validate security
    is_safe, error_msg = validate_sql_security(sql_query)
    
    if not is_safe:
        print(f"AI Utils: Query blocked - {error_msg}")
        return f"Sorry, I can't help with that for security reasons. {error_msg} 🔒"
    
    # Step 7: Execute query
    results, error = execute_safe_query(sql_query)
    
    if error:
        return f"Oops, I ran into a technical issue while looking that up. Could you try asking in a different way? 🤔"
    
    # Step 8: Format results
    response = format_query_results(user_question, results, sql_query, is_recommendation, detected_language)
    
    return response


# Alias for backward compatibility
def generate_venuebot_response(user_message, conversation_id=None):
    """
    Main entry point for chatbot.
    Now uses comprehensive SQL-based information retrieval.
    """
    return generate_information_bot_response(user_message, conversation_id)
