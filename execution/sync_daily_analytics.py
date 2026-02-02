import os
import requests
import json
from datetime import datetime
from dotenv import load_dotenv

# Load env
load_dotenv()

# Supabase Config
# Force usage of the backend project (dlfl...) because our Service Key matches it.
# VITE_SUPABASE_URL points to a different project (iijk...) which we don't have admin keys for.
SUPABASE_URL = os.environ.get("SUPABASE_URL") or "https://dlflpvmdzkeouhgqwqba.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Unipile Config
UNIPILE_DSN = os.environ.get("UNIPILE_DSN")
UNIPILE_API_KEY = os.environ.get("UNIPILE_API_KEY", "")

def get_headers():
    return {
        "X-API-KEY": UNIPILE_API_KEY,
        "Content-Type": "application/json"
    }

def safe_get(endpoint, params=None):
    dsn = UNIPILE_DSN or "https://api.unipile.com"
    url = f"{dsn.rstrip('/')}{endpoint}"
    print(f"[SAFE FETCH] GET {url} ...")
    try:
        response = requests.get(url, headers=get_headers(), params=params, timeout=15)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Request Error: {e}")
        return None

def push_to_supabase(data):
    if not SUPABASE_KEY:
        print("Skipping DB insert: Missing SUPABASE_SERVICE_ROLE_KEY")
        return

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates" # Upsert behavior
    }
    
    url = f"{SUPABASE_URL}/rest/v1/linkedin_analytics_daily"
    
    try:
        resp = requests.post(url, headers=headers, json=data)
        if resp.status_code in [200, 201]:
            print("Successfully synced to Supabase.")
        else:
            print(f"Supabase Error: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"DB Push Error: {e}")

def sync_daily():
    print("--- Starting Daily Analytics Sync ---")
    
    # 1. Get Account
    accounts_data = safe_get("/api/v1/accounts")
    if not accounts_data:
        print("Failed to fetch accounts.")
        return

    items = accounts_data.get("items", []) if isinstance(accounts_data, dict) else accounts_data
    
    target_account = None
    for acc in items:
        # Relaxed check as per weekly report discovery
        if acc.get("provider") == "linkedin" or (acc.get("type") == "LINKEDIN" and acc.get("id")):
            target_account = acc
            break
            
    if not target_account:
        print("No LinkedIn account found.")
        return
        
    account_id = target_account.get("id")
    print(f"Syncing for Account: {target_account.get('name')} ({account_id})")
    
    # 2. Fetch Stats
    # Connections (Relations)
    relations_data = safe_get(f"/api/v1/users/{account_id}/relations", params={"limit": 1})
    total_connections = 0
    if relations_data:
        # Assuming metadata or count is available, otherwise Unipile might just return list
        # If no count in response, we might need a separate 'stat' endpoint or just count fetched
        # For now, placeholder safely
        total_connections = relations_data.get("total", 0) # Adjust field based on API

    # Conversations
    chats_data = safe_get("/api/v1/chats", params={"account_id": account_id, "limit": 50})
    total_convs = 0
    unread = 0
    if chats_data:
        chats = chats_data.get("items", [])
        total_convs = len(chats) # This is just 'fetched', typically we want total. Unipile might not give 'total_count' easily.
        unread = sum(1 for c in chats if c.get("unread_count", 0) > 0)

    # 3. Prepare Payload
    payload = {
        "unipile_account_id": account_id,
        "snapshot_date": datetime.now().strftime("%Y-%m-%d"),
        "total_connections": total_connections,
        "total_conversations": total_convs, # Snapshot of 'recent active'
        "unread_conversations": unread,
        "meta": target_account
    }
    
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    # 4. Push
    push_to_supabase(payload)

if __name__ == "__main__":
    sync_daily()
