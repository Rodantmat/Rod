import os
from curl_cffi import requests

# Load Secrets
TOKEN = os.getenv("CF_API_TOKEN")
ACC_ID = os.getenv("CF_ACCOUNT_ID")
DB_ID = os.getenv("CF_DATABASE_ID")
PROXY = os.getenv("PROXY_URL")

def start():
    print("🛰️ Connecting via Proxy...")
    url = "https://partner-api.prizepicks.com/projections?league_id=2&per_page=5000"
    
    try:
        res = requests.get(url, impersonate="chrome", proxies={"http": PROXY, "https": PROXY}, timeout=30)
        if res.status_code != 200:
            return print(f"❌ PrizePicks Error: {res.status_code}")
        data = res.json()
    except Exception as e:
        return print(f"❌ Connection Failed: {e}")

    players = {obj['id']: obj['attributes']['name'].replace("'", "''") for obj in data.get('included', []) if obj['type'] == 'new_player'}
    
    rows = []
    for item in data.get('data', []):
        attr = item.get('attributes', {})
        p_id = item.get('relationships', {}).get('new_player', {}).get('data', {}).get('id')
        rows.append(f"('{item['id']}', '{players.get(p_id, 'Unknown')}', '{attr.get('stat_type')}', {attr.get('line_score')}, '{attr.get('odds_type', 'standard')}', {1 if attr.get('is_promo') else 0})")

    if not rows:
        return print("⚠️ No MLB lines found.")

    print(f"📦 Found {len(rows)} lines. Sending to Cloudflare in chunks...")

    # --- CHUNKING LOGIC ---
    chunk_size = 100  # Send 100 lines at a time to stay under SQLITE_TOOBIG limit
    cf_url = f"https://api.cloudflare.com/client/v4/accounts/{ACC_ID}/d1/database/{DB_ID}/query"
    headers = {"Authorization": f"Bearer {TOKEN}"}

    for i in range(0, len(rows), chunk_size):
        chunk = rows[i:i + chunk_size]
        sql = f"INSERT OR REPLACE INTO mlb_stats (line_id, player_name, stat_type, line_score, odds_type, is_promo) VALUES {', '.join(chunk)};"
        
        cf_res = requests.post(cf_url, headers=headers, json={"sql": sql})
        
        if cf_res.status_code == 200:
            print(f"✅ Chunk {i//chunk_size + 1} synced ({len(chunk)} lines).")
        else:
            print(f"❌ Error on Chunk {i//chunk_size + 1}: {cf_res.text}")
            break

if __name__ == "__main__":
    start()
