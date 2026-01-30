from unipile_manager import UnipileUniqueManager

if __name__ == "__main__":
    # Test with a dummy user
    manager = UnipileUniqueManager()
    
    user_id = "vanessa_test_123"
    print(f"Attempting to generate link for {user_id}...")
    
    link = manager.create_hosted_auth_link(user_id)
    
    if link == "MOCK_LINK_MISSING_KEY":
        print("\n[!] MISSING API KEY: Please update UNIPILE_API_KEY in .env")
        print("    The system is ready, just needs the key.")
    elif link:
        print(f"\n[SUCCESS] Send this link to Vanessa: {link}")
    else:
        print("\n[ERROR] Failed to generate link. Check logs.")
