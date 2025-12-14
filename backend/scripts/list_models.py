import google.generativeai as genai
import os

key = os.getenv('GEMINI_API_KEY')
if not key:
    # Fallback to reading from .env manually if os.getenv fails due to load order
    try:
        with open('.env', 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith('GEMINI_API_KEY='):
                    key = line.strip().split('=', 1)[1]
                    break
    except:
        pass

if key:
    genai.configure(api_key=key)
    print("Listing available models...")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
else:
    print("No API Key found.")
