import os
from curl_cffi import requests

# Secrets
TOKEN = os.getenv("CF_API_TOKEN")
ACC_ID = os.getenv("CF_ACCOUNT_ID")
DB_ID = os.getenv("CF_DATABASE_ID")
PROXY = os.getenv("PROXY_URL")

def sql_text(value):
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"

def sql_number(value):
    if value is None:
        return "NULL"
    try:
        return str(float(value))
    except Exception:
        return "NULL"

def d1_query(cf_url, headers, sql, label):
    cf_res = requests.post(cf_url, headers=headers, json={"sql": sql}, timeout=60)
    if cf_res.status_code != 200:
        raise RuntimeError(f"{label} failed: {cf_res.text}")

    body = cf_res.json()
    if not body.get("success"):
        raise RuntimeError(f"{label} failed: {body}")

    errors = body.get("errors") or []
    if errors:
        raise RuntimeError(f"{label} failed: {errors}")

    return body

def d1_first_row(cf_url, headers, sql, label):
    body = d1_query(cf_url, headers, sql, label)
    result = (body.get("result") or [{}])[0]
    rows = result.get("results") or []
    return rows[0] if rows else {}

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
                "name": obj['attributes']['name'],
                "team": teams.get(t_id, "Unknown")
            }

    rows = []
    for item in data.get('data', []):
        attr = item.get('attributes', {})
        rel = item.get('relationships', {})
        
        p_id = rel.get('new_player', {}).get('data', {}).get('id')
        p_info = player_data.get(p_id, {"name": "Unknown", "team": "Unknown"})
        
        # Opponent and Start Time
        opp = attr.get('description', 'Unknown')
        start_time = attr.get('start_time', 'Unknown')

        rows.append(
            "("
            f"{sql_text(item.get('id'))}, "
            f"{sql_text(p_info['name'])}, "
            f"{sql_text(p_info['team'])}, "
            f"{sql_text(opp)}, "
            f"{sql_text(attr.get('stat_type'))}, "
            f"{sql_number(attr.get('line_score'))}, "
            f"{sql_text(attr.get('odds_type', 'standard'))}, "
            f"{1 if attr.get('is_promo') else 0}, "
            f"{sql_text(start_time)}"
            ")"
        )

    if not rows:
        return print("⚠️ No MLB lines found.")

    # 3. Sync to Cloudflare
    cf_url = f"https://api.cloudflare.com/client/v4/accounts/{ACC_ID}/d1/database/{DB_ID}/query"
    headers = {"Authorization": f"Bearer {TOKEN}"}

    try:
        # Step A: Prepare and wipe temp table for a fresh certified batch
        print("🧱 Preparing temp table...")
        d1_query(
            cf_url,
            headers,
            "CREATE TABLE IF NOT EXISTS mlb_stats_temp AS SELECT * FROM mlb_stats WHERE 0;",
            "Create mlb_stats_temp"
        )

        print("🧹 Wiping temp table for fresh start...")
        d1_query(cf_url, headers, "DELETE FROM mlb_stats_temp;", "Clear mlb_stats_temp")

        # Step B: Insert new data into temp in chunks
        print(f"📦 Syncing {len(rows)} lines with Team Names into temp...")
        chunk_size = 100
        for i in range(0, len(rows), chunk_size):
            chunk = rows[i:i + chunk_size]
            sql = f"INSERT INTO mlb_stats_temp (line_id, player_name, team, opponent, stat_type, line_score, odds_type, is_promo, start_time) VALUES {', '.join(chunk)};"
            d1_query(cf_url, headers, sql, f"Insert temp chunk {i//chunk_size + 1}")
            print(f"✅ Temp chunk {i//chunk_size + 1} complete.")

        # Step C: Certify temp table before touching main table
        print("🧪 Certifying temp table...")
        cert = d1_first_row(
            cf_url,
            headers,
            """
            SELECT
              COUNT(*) AS temp_rows,
              SUM(CASE WHEN line_id IS NULL OR line_id = '' THEN 1 ELSE 0 END) AS missing_line_id,
              SUM(CASE WHEN player_name IS NULL OR player_name = '' OR player_name = 'Unknown' THEN 1 ELSE 0 END) AS missing_player_name,
              SUM(CASE WHEN stat_type IS NULL OR stat_type = '' THEN 1 ELSE 0 END) AS missing_stat_type,
              SUM(CASE WHEN line_score IS NULL THEN 1 ELSE 0 END) AS missing_line_score,
              SUM(CASE WHEN start_time IS NULL OR start_time = '' OR start_time = 'Unknown' THEN 1 ELSE 0 END) AS missing_start_time
            FROM mlb_stats_temp;
            """,
            "Certify mlb_stats_temp"
        )

        temp_rows = int(cert.get("temp_rows") or 0)
        missing_line_id = int(cert.get("missing_line_id") or 0)
        missing_player_name = int(cert.get("missing_player_name") or 0)
        missing_stat_type = int(cert.get("missing_stat_type") or 0)
        missing_line_score = int(cert.get("missing_line_score") or 0)
        missing_start_time = int(cert.get("missing_start_time") or 0)

        if temp_rows != len(rows):
            raise RuntimeError(f"Temp certification failed: expected {len(rows)} rows, found {temp_rows}")

        if missing_line_id or missing_player_name or missing_stat_type or missing_line_score or missing_start_time:
            raise RuntimeError(
                "Temp certification failed: "
                f"missing_line_id={missing_line_id}, "
                f"missing_player_name={missing_player_name}, "
                f"missing_stat_type={missing_stat_type}, "
                f"missing_line_score={missing_line_score}, "
                f"missing_start_time={missing_start_time}"
            )

        # Step D: Replace main only after certification passes
        print("🧹 Certification passed. Replacing main table...")
        d1_query(cf_url, headers, "DELETE FROM mlb_stats;", "Clear mlb_stats")

        d1_query(
            cf_url,
            headers,
            """
            INSERT INTO mlb_stats
              (line_id, player_name, team, opponent, stat_type, line_score, odds_type, is_promo, start_time)
            SELECT
              line_id, player_name, team, opponent, stat_type, line_score, odds_type, is_promo, start_time
            FROM mlb_stats_temp;
            """,
            "Promote mlb_stats_temp to mlb_stats"
        )

        # Step E: Verify main and clean temp after successful promote
        print("🧪 Verifying main table after promote...")
        verify = d1_first_row(
            cf_url,
            headers,
            "SELECT COUNT(*) AS main_rows FROM mlb_stats;",
            "Verify mlb_stats"
        )

        main_rows = int(verify.get("main_rows") or 0)
        if main_rows != temp_rows:
            raise RuntimeError(f"Main verification failed: expected {temp_rows} rows, found {main_rows}")

        print("🧽 Cleaning temp table after successful promote...")
        d1_query(cf_url, headers, "DELETE FROM mlb_stats_temp;", "Final clean mlb_stats_temp")

        print(f"✅ PrizePicks board refresh complete. Main table now has {main_rows} fresh rows.")

    except Exception as e:
        print(f"❌ Sync Failed: {e}")
        print("⚠️ Main table was not replaced unless temp certification had already passed.")

if __name__ == "__main__":
    start()
