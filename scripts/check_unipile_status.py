import os
import requests
import json

# Project A: Legacy? (Has Service Key)
PROJ_A = {
    "name": "Project A (dlfl...)",
    "url": "https://dlflpvmdzkeouhgqwqba.supabase.co",
    "key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o"
}

# Project B: Active/Vite? (Has Anon Key)
PROJ_B = {
    "name": "Project B (iijk...)",
    "url": "https://iijkbhiqcsvtnfernrbs.supabase.co",
    "key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpamtiaGlxY3N2dG5mZXJucmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNTE2MzUsImV4cCI6MjA3NTkyNzYzNX0.HQJ1vRWwn7YXmWDvb9Pf_JgzeyCDOpXdf2NI-76IUbM"
}

def check_project(proj):
    print(f"\n=== Checking {proj['name']} ===")
    headers = {
        "apikey": proj['key'],
        "Authorization": f"Bearer {proj['key']}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    # Check Automation Profiles
    print("--- Automation Profiles ---")
    try:
        url = f"{proj['url']}/rest/v1/automation_profiles?select=*"
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            profiles = resp.json()
            print(f"Found {len(profiles)} profiles.")
            for p in profiles:
                print(f"  User: {p.get('user_id')}, Unipile: {p.get('unipile_account_id', 'NONE')}")
        else:
            print(f"  Status: {resp.status_code} - {resp.text.splitlines()[0]}")
    except Exception as e:
        print(f"  Error: {e}")

    # Check Conversations
    print("--- Conversations ---")
    try:
        url = f"{proj['url']}/rest/v1/conversations?select=external_account_id&limit=50"
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            convs = resp.json()
            ids = set(c.get("external_account_id") for c in convs if c.get("external_account_id"))
            print(f"  Found {len(ids)} unique IDs: {ids}")
        else:
            print(f"  Status: {resp.status_code} - {resp.text.splitlines()[0]}")
    except Exception as e:
        print(f"  Error: {e}")

if __name__ == "__main__":
    check_project(PROJ_A)
    check_project(PROJ_B)
