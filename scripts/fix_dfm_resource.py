import urllib.request
import json
import os

SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o"
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/resources?title=ilike.*Checklist%20DFM*", headers=headers)
with urllib.request.urlopen(req) as res:
    data = json.loads(res.read().decode('utf-8'))
    for row in data:
        print(f"ID: {row['id']}, Title: {row['title']}")
        content = row.get("content", "")
        if "\\n" in content:
            print("Found literal \\n. Fixing...")
            new_content = content.replace("\\n", "\n")
            
            patch_req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/resources?id=eq.{row['id']}", data=json.dumps({"content": new_content}).encode('utf-8'), headers=headers, method="PATCH")
            with urllib.request.urlopen(patch_req) as patch_res:
                print(f"Update response code: {patch_res.getcode()}")
        else:
            print("No literal \\n found.")
