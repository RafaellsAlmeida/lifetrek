import os
import requests
import logging
import time
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [UNIPILE_SAFE] - %(levelname)s - %(message)s')
logger = logging.getLogger("unipile_safe")

class UnipileUniqueManager:
    def __init__(self):
        self.dsn = os.environ.get("UNIPILE_DSN", "https://api1.unipile.com:13200").rstrip('/')
        self.api_key = os.environ.get("UNIPILE_API_KEY", "")
        # SAFE_MODE is True by default to prevent accidents
        self.safe_mode = os.environ.get("UNIPILE_SAFE_MODE", "true").lower() == "true"
        
        if not self.api_key:
            logger.warning("No UNIPILE_API_KEY found in environment. Running in LIMITED functionality.")

    def _get_headers(self):
        return {
            "Content-Type": "application/json",
            "X-API-KEY": self.api_key
        }

    def create_hosted_auth_link(self, user_id):
        """
        Creates a link for the user to connect their LinkedIn account.
        This is a 'safe' operation (read-only intent), but we still log it.
        """
        endpoint = "/api/v1/hosted/accounts/link"
        url = f"{self.dsn}{endpoint}"
        
        payload = {
            "type": "create",
            "providers": ["linkedin"],
            "api_url": self.dsn,
            "expiresOn": "2030-01-01T00:00:00.000Z", # Long expiry for convenience
            "notify_url": "https://lifetrek.medical.com/webhook/unipile_callback", # Placeholder
            "name": f"Connect LinkedIn for {user_id}",
            "success_redirect_url": "https://lifetrek.medical.com/admin/settings?success=true",
            "failure_redirect_url": "https://lifetrek.medical.com/admin/settings?error=true"
        }

        if self.safe_mode:
            logger.info(f"[SAFE MODE] Generating Auth Link for {user_id}")
            if not self.api_key:
                logger.error("Cannot generate real link without API Key.")
                return "MOCK_LINK_MISSING_KEY"
            
        try:
            logger.info(f"Requesting Auth Link from {url}")
            response = requests.post(url, json=payload, headers=self._get_headers())
            
            if response.status_code == 401:
                logger.error("Authentication failed. Check API Key.")
                return None
            
            response.raise_for_status()
            data = response.json()
            return data.get("url")
            
        except Exception as e:
            logger.error(f"Failed to generate auth link: {e}")
            return None

    def check_connection_status(self, account_id):
        """
        Checks the status of a connected account.
        Safe operation (GET request).
        """
        endpoint = f"/api/v1/accounts/{account_id}"
        return self._make_request("GET", endpoint)

    def send_message(self, conversation_id, text):
        """
        Sends a message. 
        CRITICAL: This is intercepted by SAFE_MODE.
        """
        if self.safe_mode:
            logger.warning(f"[SAFE MODE BLOCKED] Would have sent message to {conversation_id}: '{text}'")
            return {"status": "mock_success", "safe_mode": True}
        
        # Real sending logic would go here
        # return self._make_request("POST", ..., ...)
        pass

    def _make_request(self, method, endpoint, data=None):
        url = f"{self.dsn}{endpoint}"
        
        if self.safe_mode and method not in ["GET"]:
            logger.info(f"[SAFE MODE] Skipping {method} to {url}")
            return None

        try:
            if method == "GET":
                response = requests.get(url, headers=self._get_headers())
            elif method == "POST":
                response = requests.post(url, json=data, headers=self._get_headers())
            
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Request failed: {e}")
            return None

if __name__ == "__main__":
    manager = UnipileUniqueManager()
    print(f"Manager initialized. Safe Mode: {manager.safe_mode}")
    print(f"API Key present: {bool(manager.api_key)}")
