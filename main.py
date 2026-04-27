import os
from curl_cffi import requests

# Secrets
TOKEN = os.getenv("CF_API_TOKEN")
ACC_ID = os.getenv("CF_ACCOUNT_ID")
DB_ID = os.getenv("CF_DATABASE_ID")
PROXY = os.getenv("PROXY_URL")

def start():
    print("🛰️ Connecting via Proxy...")
    url = "https://partner-api.prizepicks.com/projections?league_id=2&per_page=5000"
    
    try:
        res = requests.get(url, impersonate="chrome120", proxies={"http": PROXY, "https": PROXY}, timeout=30)
        res.raise_for_status()
        data = res.json()
    except Exception as e:
        return print(f"❌ Connection Failed: {e}")

    # 1. Map Team IDs to Abbreviations
    teams = {}
    for obj in data.get('included', []):
        if obj['type'] == 'team':
            # Priority: Abbreviation -> Name
            teams[obj['id']] = obj['attributes'].get('abbreviation') or obj['attributes'].get('name')

    # 2. Map Player IDs to their Names and Team Names
    player_data = {}
    for obj in data.get('included', []):
        if obj['type'] == 'new_player':
            p_id = obj['id']
            # ADJUSTED: PrizePicks uses 'team_data' in the relationships block
            t_rel = obj.get('relationships', {}).get('team_data', {}).get('data')
            t_id = t_rel.get('id') if t_rel else None
            
            player_data[p_id] = {
                "name": obj['attributes']['name'].replace("'", "''"),
                "team": teams.get(t_id, "Unknown")
            }

    rows = []
    for item in data.get('data', []):
        attr = item.get('attributes', {})
        rel = item.get('relationships', {})
        
        p_id = rel.get('new_player', {}).get('data', {}).get('id')
        p_info = player_data.get(p_id, {"name": "Unknown", "team": "Unknown"})
        
        # Opponent and Start Time
        opp = attr.get('description', 'Unknown').replace("'", "''")
        start_time = attr.get('start_time', 'Unknown')

        rows.append(f"('{item['id']}', '{p_info['name']}', '{p_info['team']}', '{opp}', '{attr.get('stat_type')}', {attr.get('line_score')}, '{attr.get('odds_type', 'standard')}', {1 if attr.get('is_promo') else 0}, '{start_time}')")

    if not rows:
        return print("⚠️ No MLB lines found.")

    # 3. Sync to Cloudflare
    cf_url = f"https://api.cloudflare.com/client/v4/accounts/{ACC_ID}/d1/database/{DB_ID}/query"
    headers = {"Authorization": f"Bearer {TOKEN}"}

    # Step A: Wipe old data for a fresh batch
    print("🧹 Wiping table for fresh start...")
    requests.post(cf_url, headers=headers, json={"sql": "DELETE FROM mlb_stats;"})

    # Step B: Insert new data in chunks
    print(f"📦 Syncing {len(rows)} lines with Team Names...")
    chunk_size = 100
    for i in range(0, len(rows), chunk_size):
        chunk = rows[i:i + chunk_size]
        sql = f"INSERT INTO mlb_stats (line_id, player_name, team, opponent, stat_type, line_score, odds_type, is_promo, start_time) VALUES {', '.join(chunk)};"
        cf_res = requests.post(cf_url, headers=headers, json={"sql": sql})
        if cf_res.status_code == 200:
            print(f"✅ Chunk {i//chunk_size + 1} complete.")
        else:
            print(f"❌ Error in chunk {i//chunk_size + 1}: {cf_res.text}")

if __name__ == "__main__":
    start()
