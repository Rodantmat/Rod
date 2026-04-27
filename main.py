import os
from curl_cffi import requests

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

    # 1. Map Teams (ID -> Name)
    teams = {obj['id']: obj['attributes']['name'] for obj in data.get('included', []) if obj['type'] == 'team'}
    
    # 2. Map Players to their Team IDs
    player_team_map = {}
    for obj in data.get('included', []):
        if obj['type'] == 'new_player':
            p_id = obj['id']
            t_id = obj.get('relationships', {}).get('team', {}).get('data', {}).get('id')
            player_team_map[p_id] = {
                "name": obj['attributes']['name'].replace("'", "''"),
                "team_id": t_id
            }

    rows = []
    for item in data.get('data', []):
        attr = item.get('attributes', {})
        rel = item.get('relationships', {})
        
        p_id = rel.get('new_player', {}).get('data', {}).get('id')
        player_info = player_team_map.get(p_id, {"name": "Unknown", "team_id": None})
        
        # Get Team and Opponent
        my_team_id = player_info["team_id"]
        my_team_name = teams.get(my_team_id, "Unknown")
        
        # PrizePicks often puts the opponent in the 'description' field (e.g. "vs NYY" or "@ LAD")
        opponent = attr.get('description', 'Unknown').replace("'", "''")
        
        # Start Time
        start_time = attr.get('start_time', 'Unknown')

        rows.append(f"('{item['id']}', '{player_info['name']}', '{my_team_name}', '{opponent}', '{attr.get('stat_type')}', {attr.get('line_score')}, '{attr.get('odds_type', 'standard')}', {1 if attr.get('is_promo') else 0}, '{start_time}')")

    if not rows:
        return print("⚠️ No MLB lines found.")

    # 3. Sync to Cloudflare
    cf_url = f"https://api.cloudflare.com/client/v4/accounts/{ACC_ID}/d1/database/{DB_ID}/query"
    headers = {"Authorization": f"Bearer {TOKEN}"}

    # FIRST: Erase the table
    print("🧹 Erasing old data...")
    requests.post(cf_url, headers=headers, json={"sql": "DELETE FROM mlb_stats;"})

    # SECOND: Insert in chunks
    print(f"📦 Syncing {len(rows)} fresh lines...")
    chunk_size = 100
    for i in range(0, len(rows), chunk_size):
        chunk = rows[i:i + chunk_size]
        sql = f"INSERT INTO mlb_stats (line_id, player_name, team, opponent, stat_type, line_score, odds_type, is_promo, start_time) VALUES {', '.join(chunk)};"
        cf_res = requests.post(cf_url, headers=headers, json={"sql": sql})
        if cf_res.status_code == 200:
            print(f"✅ Chunk {i//chunk_size + 1} synced.")

if __name__ == "__main__":
    start()
