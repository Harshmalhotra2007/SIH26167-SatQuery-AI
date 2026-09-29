import os
from dotenv import load_dotenv
load_dotenv()
from google import genai

c = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

models = [
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
]
for m in models:
    try:
        r = c.models.generate_content(model=m, contents='say ok')
        print(m, '-> OK')
    except Exception as e:
        msg = str(e)
        print(m, '-> FAIL:', type(e).__name__, msg[:120])