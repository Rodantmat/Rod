import os
from curl_cffi import requests

# Pulling the IDs you just found from GitHub Secrets
TOKEN = os.getenv("CF_API_TOKEN")
ACC_ID = os.getenv("CF_ACCOUNT_ID")
DB_ID = os.getenv("CF_DATABASE_ID")
PROXY = os.getenv("PROXY_URL")

def run_scraper():
    # 1. Get MLB data from PrizePicks
    url = "https://partner-api.prizepicks.com/projections?league_id=2&per_page=500"
    proxies = {"http": PROXY, "https": PROXY}
    
    print("🛰️ Requesting data through California Proxy...")
    res = requests.get(url, impersonate="chrome", proxies=proxies, timeout=30)
    
    if res.status_code != 200:
        print(f"❌ Connection Failed: {res.status_code}")
        return

    data = res.json()
    
    # Map player IDs to names (handling names like O'Neill)
    players = {
        obj['id']: obj['attributes']['name'].replace("'", "''") 
        for obj in data.get('included', []) 
        if obj['type'] == 'new_player'
    }
    
    # 2. Build the database rows
    rows = []
    for item in data.get('data', []):
        attr = item.get('attributes', {})
        p_id = item.get('relationships', {}).get('new_player', {}).get('data', {}).get('id')
        
        # We only want MLB projections
        rows.append(f"('{item['id']}', '{players.get(p_id, 'Unknown')}', '{attr.get('stat_type')}', {attr.get('line_score')}, '{attr.get('odds_type', 'standard')}', {1 if attr.get('is_promo') else 0})")
    
    if not rows:
        print("⚠️ No data found.")
        return

    # 3. Push to Cloudflare D1
    cf_url = f"https://api.cloudflare.com/client/v4/accounts/{ACC_ID}/d1/database/{DB_ID}/query"
    sql = f"INSERT OR REPLACE INTO mlb_stats (line_id, player_name, stat_type, line_score, odds_type, is_promo) VALUES {', '.join(rows)};"
    
    response = requests.post(
        cf_url, 
        headers={"Authorization": f"Bearer {TOKEN}"}, 
        json={"sql": sql}
    )
    
    if response.status_code == 200:
        print(f"✅ Success! {len(rows)} MLB rows synced to your cloud database.")
    else:
        print(f"❌ Database Error: {response.text}")

if __name__ == "__main__":
    run_scraper()
