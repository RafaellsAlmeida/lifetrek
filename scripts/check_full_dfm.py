import urllib.request
import json
SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o"
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}
req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/resources?title=ilike.*Checklist%20DFM*", headers=headers)
with urllib.request.urlopen(req) as res:
    data = json.loads(res.read().decode('utf-8'))
    for row in data:
        print(f"--- Full Content for {row['title']} ---")
        print(row.get("content", ""))
        print("---------------------------------------")
