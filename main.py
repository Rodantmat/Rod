import os
from curl_cffi import requests

# Load Secrets
TOKEN = os.getenv("CF_API_TOKEN")
ACC_ID = os.getenv("CF_ACCOUNT_ID")
DB_ID = os.getenv("CF_DATABASE_ID")
PROXY = os.getenv("PROXY_URL")

def run():
    print(f"🛰️ Attempting connection via Proxy...")
    
    # Try League ID 2 (MLB)
    url = "https://partner-api.prizepicks.com/projections?league_id=2&per_page=500"
    
    try:
        res = requests.get(url, impersonate="chrome", proxies={"http": PROXY, "https": PROXY}, timeout=30)
        print(f"📡 PrizePicks Response Code: {res.status_code}")
        
        if res.status_code != 200:
            print("❌ Access Denied by PrizePicks. Proxy might be flagged.")
            return

        data = res.json()
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        return

    # Map names
    players = {obj['id']: obj['attributes']['name'].replace("'", "''") for obj in data.get('included', []) if obj['type'] == 'new_player'}

    rows = []
    for item in data.get('data', []):
        attr = item.get('attributes', {})
        p_id = item.get('relationships', {}).get('new_player', {}).get('data', {}).get('id')
        rows.append(f"('{item['id']}', '{players.get(p_id, 'Unknown')}', '{attr.get('stat_type')}', {attr.get('line_score')}, '{attr.get('odds_type', 'standard')}', {1 if attr.get('is_promo') else 0})")

    if not rows:
        print("⚠️ Board is empty. No MLB lines found for ID 2.")
        return

    print(f"📦 Found {len(rows)} lines. Sending to Cloudflare...")
    cf_url = f"https://api.cloudflare.com/client/v4/accounts/{ACC_ID}/d1/database/{DB_ID}/query"
    sql = f"INSERT OR REPLACE INTO mlb_stats (line_id, player_name, stat_type, line_score, odds_type, is_promo) VALUES {', '.join(rows)};"
    
    cf_res = requests.post(cf_url, headers={"Authorization": f"Bearer {TOKEN}"}, json={"sql": sql})
    
    if cf_res.status_code == 200:
        print(f"✅ DONE! {len(rows)} rows synced.")
    else:
        print(f"❌ Cloudflare Error: {cf_res.text}")

if __name__ == "__main__":
    run()
