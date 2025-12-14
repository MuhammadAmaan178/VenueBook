import requests
import json

url = 'http://localhost:5000/api/chat/ask'
headers = {'Content-Type': 'application/json'}
data = {'message': 'Hello, are you working?'}

print(f"Sending request to {url}...")
try:
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
