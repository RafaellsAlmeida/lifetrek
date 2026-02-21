"""
Generate New Leads using Google Places API (New v1)
Requires: GOOGLE_MAPS_API_KEY (Places API New enabled)
"""

import requests
import pandas as pd
import time
import json
import os

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

if not API_KEY:
    raise SystemExit("Missing GOOGLE_MAPS_API_KEY environment variable.")

def search_google_places_new(query, api_key):
    """Search using Places API (New)"""
    url = "https://places.googleapis.com/v1/places:searchText"
    
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': api_key,
        # Request essential fields
        'X-Goog-FieldMask': 'places.displayName,places.websiteUri,places.formattedAddress,places.rating,places.userRatingCount,places.internationalPhoneNumber,places.id,places.types'
    }
    
    payload = {
        "textQuery": query,
        "maxResultCount": 20 # Max for this API per page is 20
    }
    
    results = []
    
    # 3 Pages Max (60 results)
    for _ in range(3):
        try:
            response = requests.post(url, headers=headers, json=payload)
            data = response.json()
            
            if 'places' in data:
                results.extend(data['places'])
            else:
                if 'error' in data:
                    print(f"Error: {data['error']}")
                break
                
            # Pagination
            # Using next page token? V1 uses usually no token for text search? 
            # Actually V1 Text Search doesn't support pagination easily in the same way?
            # It DOES support 'nextPageToken' in response, and we send it in payload as 'pageToken'? No?
            # V1 doc says: "If the number of places exceeds maxResultCount, a nextPageToken is returned."
            # We must pass it as `pageToken` in next request.
            # However, V1 Text Search is slightly different. Let's check.
            # Yes, standard pagination.
            
            token = data.get('nextPageToken')
            if not token:
                break
                
            payload['pageToken'] = token
            time.sleep(2) # Friendly delay
            
        except Exception as e:
            print(f"Req failed: {e}")
            break
            
    return results

# Define Search Queries
QUERIES = [
    "Fabricante de Implantes Dentários Brasil",
    "Medical Device Manufacturer Sao Paulo",
    "Orthopedic Implants Manufacturer Brazil",
    "Dental Equipment Supplier Curitiba",
    "Indústria de Materiais Médicos",
    "Fabricante de instrumentos cirurgicos",
    "Fabricante equipamentos médicos Rio de Janeiro",
    "Indústria produtos odontológicos Santa Catarina",
    "Medical Manufacturer Minas Gerais",
    "Fabricante implantes ortopédicos SP",
    "Distribuidora materiais medico hospitalares Brasil",
    "Importadora produtos saúde Brasil",
    "Dental Implants Manufacturer Santa Catarina",
    "Medical Equipment Supplier Porto Alegre",
    "Indústria Farmacêutica e Hospitalar",
    "Logística Hospitalar Brasil"
]

if __name__ == "__main__":
    all_leads = []
    seen_ids = set()
    
    print(f"=== GOOGLE PLACES LEAD GEN (New API) ===")
    
    for query in QUERIES:
        print(f"Runnning query: {query}...")
        results = search_google_places_new(query, API_KEY)
        print(f"Found {len(results)} places")
        
        for place in results:
            pid = place.get('id')
            if pid in seen_ids:
                continue
            seen_ids.add(pid)
            
            lead = {
                'Nome Empresa': place.get('displayName', {}).get('text'),
                'Website': place.get('websiteUri'),
                'Address': place.get('formattedAddress'),
                'Rating': place.get('rating'),
                'Reviews': place.get('userRatingCount'),
                'Phone': place.get('internationalPhoneNumber'),
                'Types': ", ".join(place.get('types', [])),
                'Source': 'Google Places API',
                'Search_Query': query
            }
            
            # Simple Filter: Must be manufacturer/industrial usually
            # But let's keep all for now to filter later
            
            all_leads.append(lead)
            print(f"  + {lead['Nome Empresa']} ({lead.get('Website', 'No web')})")
            
    # Save
    df = pd.DataFrame(all_leads)
    df.to_csv('../../.tmp/new_leads_google_places.csv', index=False)
    print(f"\n✅ Generated {len(df)} NEW leads in new_leads_google_places.csv")
