import os
import requests
from dotenv import load_dotenv

load_dotenv()

UNIPILE_KEY = os.environ.get("UNIPILE_API_KEY", "")

DSNS_TO_TEST = [
    "https://3YwYCdzp.unipile.com",
    "https://api.unipile.com",
    "https://api1.unipile.com",
]

def format_dsn(dsn):
    return dsn.rstrip('/')

def check_unipile():
    if not UNIPILE_KEY:
        print("Missing UNIPILE_API_KEY in .env")
        return

    print(f"Testing Unipile with Key: {UNIPILE_KEY[:5]}...")

    for base_url in DSNS_TO_TEST:
        url = f"{format_dsn(base_url)}/api/v1/accounts"
        print(f"\n--- Trying {base_url} ---")
        try:
            resp = requests.get(url, headers={"X-API-KEY": UNIPILE_KEY})
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                accounts = resp.json()
                print(f"SUCCESS! Found {len(accounts)} accounts.")
                if isinstance(accounts, dict) and 'items' in accounts:
                     accounts = accounts['items'] # Handle pagination structure if present
                
                for acc in accounts:
                    print(f"  ID: {acc.get('id')} | Name: {acc.get('name')} | Provider: {acc.get('provider')}")
                
                # If success, update .env with this DSN?
                if accounts:
                    print(f"\n[RECOMMENDATION] Update .env UNIPILE_DSN to {base_url}")
                    break
            else:
                print(f"Response: {resp.text[:100]}...")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    check_unipile()
