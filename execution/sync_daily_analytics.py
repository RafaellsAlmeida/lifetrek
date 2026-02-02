import os
import sys
import time
import json
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

UNIPILE_DSN = os.environ.get("UNIPILE_DSN")
UNIPILE_API_KEY = os.environ.get("UNIPILE_API_KEY", "")

OUTPUT_FILE = "execution/LINKEDIN_WEEKLY_REPORT.md"
SAFE_MODE = True

def get_headers():
    return {
        "X-API-KEY": UNIPILE_API_KEY,
        "Content-Type": "application/json"
    }

def safe_get(endpoint, params=None):
    """
    Wrapper for GET requests to enforce safety and logging.
    """
    # Fallback to api.unipile.com if not set, as it is the most likely cloud gateway
    dsn = UNIPILE_DSN or "https://api.unipile.com"
    
    url = f"{dsn.rstrip('/')}{endpoint}"
    print(f"[SAFE FETCH] GET {url} ...")
    
    try:
        response = requests.get(url, headers=get_headers(), params=params, timeout=15)
        # 404 on api.unipile.com often means "DSN found but route wrong" or "DSN valid but resource missing"
        # We print body to understand
        if not response.ok:
            print(f"  FAILED: {response.status_code}")
            print(f"  Body: {response.text[:200]}")
            
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Request Error: {e}")
        return None

def get_linkedin_account():
    """Fetches key account info. Tries accounts list first, then 'me'."""
    # 1. Try Accounts
    data = safe_get("/api/v1/accounts")
    if data:
        items = data.get("items", []) if isinstance(data, dict) else data
        print(f"Found {len(items)} accounts.")
        for acc in items:
            print(f"RAW ACCOUNT: {json.dumps(acc)}") # Debug print
            # Relaxed check: if we have an ID and a Name, assume it's the right one for now
            if acc.get("id"):
                print(f" -> using account {acc.get('name')} ({acc.get('id')})")
                return acc
    
    # 2. Try Users Me (Alternative)
    print("Trying /users/me fallback...")
    data = safe_get("/api/v1/users/me")
    if data:
         # Mocking account structure from user profile
         return {"id": data.get("id"), "name": data.get("name"), "status": "OK", "provider": "linkedin"}

    return None

def get_recent_chats(account_id, limit=20):
    """
    Fetches recent chats to analyze activity.
    """
    params = {
        "account_id": account_id,
        "limit": limit,
    }
    return safe_get("/api/v1/chats", params)

def generate_report():
    print("--- Starting SAFE LinkedIn Report Generation ---")
    
    # 1. Verify Account
    account = get_linkedin_account()
    if not account:
        print("FAILED: Could not retrieve LinkedIn account. Check connection/DSN.")
        return
        
    account_id = account.get("id")
    account_name = account.get("name")
    print(f"Account Found: {account_name} ({account_id})")
    
    # 2. Fetch Chat Stats (Read-Only)
    print("\nFetching recent conversations...")
    chats_data = get_recent_chats(account_id, limit=50)
    chats = chats_data.get("items", []) if chats_data else []
    
    # Analyze
    total_chats = len(chats)
    unread_chats = sum(1 for c in chats if c.get("unread_count", 0) > 0)
    
    # Determine basic activity (simulated since we don't fetch all messages yet to save requests)
    # We can count how many chats were updated recently
    one_week_ago = datetime.now() - timedelta(days=7)
    recent_active = 0
    
    for c in chats:
        # Unipile 'timestamp' is usually ISO or ms
        ts = c.get("timestamp")
        # Handle format variance if needed, simplistic check
        try:
            if ts:
                # If int/float -> timestamp
                # If string -> iso
                pass # TODO: Parse
                recent_active += 1 # Assume fetched are recent due to default sort?
        except:
            pass
            
    # 3. Generate Markdown
    report_content = f"""# LinkedIn Weekly Report
**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M")}
**Account:** {account_name}

## Account Health
- **Status:** {account.get("status", "Unknown")}
- **Unipile ID:** `{account_id}`

## Communication Snapshot (Last 50 Conversations)
- **Total Active Conversations:** {total_chats}
- **Unread Conversations:** {unread_chats}
- **Recent Activity:** {total_chats} conversations fetched.

> **Note:** This report was generated in SAFE MODE (Read-Only). No messages were sent.

"""
    
    # Write to file
    with open(OUTPUT_FILE, "w") as f:
        f.write(report_content)
        
    print(f"\n[SUCCESS] Report generated at {OUTPUT_FILE}")
    print(report_content)

if __name__ == "__main__":
    generate_report()
