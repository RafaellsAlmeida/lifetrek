import os
import requests
import json
from dotenv import load_dotenv

# Load env from parent dir if needed, or current
load_dotenv()

# Config
SUPABASE_URL = os.environ.get("SUPABASE_URL") or "https://dlflpvmdzkeouhgqwqba.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

TARGET_EMAIL = "rafacrvg@icloud.com"

def ensure_admin():
    if not SUPABASE_KEY:
        print("Error: SUPABASE_SERVICE_ROLE_KEY not found.")
        return

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    # 1. Check if exists
    url = f"{SUPABASE_URL}/rest/v1/admin_permissions?email=eq.{TARGET_EMAIL}"
    resp = requests.get(url, headers=headers)
    
    if resp.status_code != 200:
        print(f"Error checking admin: {resp.text}")
        return

    data = resp.json()
    
    if data:
        print(f"User {TARGET_EMAIL} is already in admin_permissions. Role: {data[0].get('permission_level')}")
    else:
        print(f"User {TARGET_EMAIL} NOT found. inserting...")
        # 2. Insert
        insert_url = f"{SUPABASE_URL}/rest/v1/admin_permissions"
        payload = {
            "email": TARGET_EMAIL,
            "permission_level": "super_admin"
        }
        post_resp = requests.post(insert_url, headers=headers, json=payload)
        
        if post_resp.status_code in [200, 201]:
             print(f"SUCCESS: Added {TARGET_EMAIL} as super_admin.")
        else:
             print(f"FAILED to add admin: {post_resp.text}")

if __name__ == "__main__":
    ensure_admin()
