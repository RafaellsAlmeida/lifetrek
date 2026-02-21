"""
Advanced Lead Scraper using Google Places API (New v1)
Features:
- Multi-City Support (Major Brazilian Hubs)
- Expanded Keyword List (Medical/Dental focus)
- Deduplication against Master List
- Automatic pagination
"""

import requests
import pandas as pd
import time
import os
import json

# ================= CONFIGURATION =================
# Uses env var for API key
API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

if not API_KEY:
    raise SystemExit("Missing GOOGLE_MAPS_API_KEY environment variable.")

OUTPUT_FILE = "../../.tmp/new_leads_advanced.csv"
MASTER_FILE = "../../.tmp/MASTER_ENRICHED_LEADS.csv"

# Major Economic Hubs in Brazil
CITIES = [
    "São Paulo, SP",
    "Rio de Janeiro, RJ",
    "Belo Horizonte, MG",
    "Curitiba, PR",
    "Porto Alegre, RS",
    "Campinas, SP",
    "Florianópolis, SC",
    "Salvador, BA",
    "Recife, PE",
    "Brasília, DF",
    "Goiânia, GO",
    "Vitória, ES",
    "Joinville, SC",
    "Ribeirão Preto, SP"
]

# Expanded Keywords for Medical/Dental/Hospital Industry
KEYWORDS = [
    # General Manufacturers
    "Fabricante de Equipamentos Médicos",
    "Indústria de Materiais Hospitalares",
    "Fabricante de Produtos Odontológicos",
    
    # Specific High-Value Niches
    "Fabricante de Implantes Dentários",
    "Fabricante de Implantes Ortopédicos",
    "Fabricante de Instrumentos Cirúrgicos",
    "Fabricante de Próteses",
    "Fabricante de Móveis Hospitalares",
    "Indústria Farmacêutica",
    
    # Supply Chain
    "Distribuidora de Medicamentos e Correlatos",
    "Importadora de Produtos para Saúde",
    "Logística Hospitalar",
    
    # Labs & Tech
    "Laboratório de Prótese Dentária Digital",
    "Empresa de Tecnologia em Saúde",
    "Healthtech"
]

# ================= UTILS =================

def load_existing_companies():
    """Load existing company names to avoid duplicates"""
    if os.path.exists(MASTER_FILE):
        try:
            df = pd.read_csv(MASTER_FILE)
            # Normalize names for comparison (lowercase)
            if 'Nome Empresa' in df.columns:
                return set(df['Nome Empresa'].fillna('').str.lower().str.strip())
            elif 'Company' in df.columns:
                return set(df['Company'].fillna('').str.lower().str.strip())
        except Exception as e:
            print(f"Warning: Could not read master file: {e}")
    return set()

def search_google_places(query, api_key, max_pages=3):
    """Search using Places API (New)"""
    url = "https://places.googleapis.com/v1/places:searchText"
    
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': api_key,
        # Request essential fields
        'X-Goog-FieldMask': 'places.displayName,places.websiteUri,places.formattedAddress,places.rating,places.userRatingCount,places.internationalPhoneNumber,places.id,places.types,places.editorialSummary'
    }
    
    payload = {
        "textQuery": query,
        "maxResultCount": 20 # Max per page
    }
    
    results = []
    
    for page in range(max_pages):
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=20)
            data = response.json()
            
            if 'places' in data:
                results.extend(data['places'])
            elif 'error' in data:
                print(f"  ❌ API Error: {data['error'].get('message', 'Unknown')}")
                break
                
            token = data.get('nextPageToken')
            if not token:
                break
                
            payload['pageToken'] = token
            time.sleep(2) # Polite delay between pages
            
        except Exception as e:
            print(f"  ❌ Request failed: {e}")
            break
            
    return results

# ================= HISTORY TRACKING =================
HISTORY_FILE = "../../.tmp/scraped_queries_history.json"

def load_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, 'r') as f:
                return set(json.load(f))
        except:
            return set()
    return set()

def save_history(history_set):
    with open(HISTORY_FILE, 'w') as f:
        json.dump(list(history_set), f)

# ================= MAIN =================

def main():
    print(f"=== ADVANCED LEAD SCRAPING ===")
    print(f"Targeting {len(CITIES)} cities x {len(KEYWORDS)} keywords")
    
    existing_companies = load_existing_companies()
    print(f"Loaded {len(existing_companies)} existing companies to ignore.")
    
    # Load History
    scraped_keys = load_history()
    print(f"Loaded {len(scraped_keys)} previously scraped queries (skipping to save $$$).\n")
    
    all_new_leads = []
    seen_ids = set() 
    
    total_found = 0
    new_found = 0
    
    start_time = time.time()
    
    try:
        for city in CITIES:
            print(f"\n🏙️  Processing City: {city.upper()}")
            
            for keyword in KEYWORDS:
                # Unique key for this search
                query_key = f"{city}|{keyword}"
                
                if query_key in scraped_keys:
                    print(f"   ⏭️  Skipping (Already scraped): {keyword} in {city}")
                    continue
                
                query = f"{keyword} in {city}"
                print(f"   🔎 Searching: {query}...")
                
                places = search_google_places(query, API_KEY)
                
                # ... existing processing loop ...
                
                for place in places:
                    pid = place.get('id')
                    name = place.get('displayName', {}).get('text', '').strip()
                    
                    if not name: continue
                    if pid in seen_ids: continue
                    if name.lower() in existing_companies: continue
                    
                    seen_ids.add(pid)
                    existing_companies.add(name.lower()) 
                    
                    lead = {
                        'Nome Empresa': name,
                        'Website': place.get('websiteUri'),
                        'Address': place.get('formattedAddress'),
                        'Rating': place.get('rating'),
                        'Reviews': place.get('userRatingCount'),
                        'Phone': place.get('internationalPhoneNumber'),
                        'Types': ", ".join(place.get('types', [])),
                        'Summary': place.get('editorialSummary', {}).get('text'),
                        'Source': 'Google Places Advanced',
                        'Search_Query': query,
                        'City_Scope': city,
                        'Keyword_Scope': keyword
                    }
                    
                    all_new_leads.append(lead)
                    new_found += 1
                    print(f"      + Found: {name}")
                
                total_found += len(places)
                
                # Mark as done
                scraped_keys.add(query_key)
                save_history(scraped_keys)
                
                time.sleep(0.5) 
            
            # Save progress after each city
            if all_new_leads:
                pd.DataFrame(all_new_leads).to_csv(OUTPUT_FILE, index=False)
                print(f"   💾 Checkpoint saved ({len(all_new_leads)} leads total)")
                
    except KeyboardInterrupt:
        print("\n🛑 Execution interrupted by user. Saving current progress...")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        
    # Final Stats
    duration = time.time() - start_time
    print(f"\n{'='*50}")
    print(f"SCRAPING COMPLETE in {duration:.1f}s")
    print(f"Total Raw Results: {total_found}")
    print(f"New Unique Leads:  {new_found}")
    
    if all_new_leads:
        df = pd.DataFrame(all_new_leads)
        df.to_csv(OUTPUT_FILE, index=False)
        print(f"✅ Saved to {OUTPUT_FILE}")
    else:
        print("⚠️ No new leads found.")

if __name__ == "__main__":
    main()
