import os
import sys
import uuid

SCRIPT_VERSION = "v1.5.04.5 - Dispatch Observation Hard Gate"
from datetime import datetime, timezone
from curl_cffi import requests

# Secrets
TOKEN = os.getenv("CF_API_TOKEN")
ACC_ID = os.getenv("CF_ACCOUNT_ID")
DB_ID = os.getenv("CF_DATABASE_ID")
PROXY = os.getenv("PROXY_URL")
RUN_ID = os.getenv("GITHUB_DISPATCH_ID") or os.getenv("ALPHADOG_DISPATCH_ID") or os.getenv("DISPATCH_ID") or os.getenv("GITHUB_RUN_ID") or str(uuid.uuid4())
RUN_STARTED_AT = datetime.now(timezone.utc).isoformat()

REQUIRED_ENV = {
    "CF_API_TOKEN": TOKEN,
    "CF_ACCOUNT_ID": ACC_ID,
    "CF_DATABASE_ID": DB_ID,
    "PROXY_URL": PROXY,
}


def utc_now():
    return datetime.now(timezone.utc).isoformat()


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


def ensure_audit_table(cf_url, headers):
    d1_query(
        cf_url,
        headers,
        """
        CREATE TABLE IF NOT EXISTS mlb_stats_refresh_audit (
          run_id TEXT PRIMARY KEY,
          status TEXT,
          started_at TEXT,
          finished_at TEXT,
          rows_fetched INTEGER,
          rows_temp INTEGER,
          rows_main INTEGER,
          error_message TEXT,
          source TEXT,
          script_version TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        """,
        "Create mlb_stats_refresh_audit"
    )
    # Existing D1 tables are not changed by CREATE TABLE IF NOT EXISTS.
    # Keep this migration additive so old audit tables gain the columns the Worker reads.
    for column_sql in [
        "ALTER TABLE mlb_stats_refresh_audit ADD COLUMN script_version TEXT",
        "ALTER TABLE mlb_stats_refresh_audit ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP",
        "ALTER TABLE mlb_stats_refresh_audit ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP",
    ]:
        try:
            d1_query(cf_url, headers, column_sql + ";", "Migrate mlb_stats_refresh_audit")
        except Exception as e:
            if "duplicate column" not in str(e).lower():
                raise


def write_audit(cf_url, headers, status, rows_fetched=None, rows_temp=None, rows_main=None, error_message=None):
    try:
        ensure_audit_table(cf_url, headers)
        d1_query(
            cf_url,
            headers,
            f"""
            INSERT OR REPLACE INTO mlb_stats_refresh_audit
              (run_id, status, started_at, finished_at, rows_fetched, rows_temp, rows_main, error_message, source, script_version, updated_at)
            VALUES
              ({sql_text(RUN_ID)}, {sql_text(status)}, {sql_text(RUN_STARTED_AT)}, {sql_text(utc_now())},
               {sql_number(rows_fetched)}, {sql_number(rows_temp)}, {sql_number(rows_main)},
               {sql_text(error_message)}, 'github_actions_prizepicks_main_py', {sql_text(SCRIPT_VERSION)}, {sql_text(utc_now())});
            """,
            f"Write audit {status}"
        )
    except Exception as audit_error:
        print(f"⚠️ Audit write failed: {audit_error}")


def start():
    missing_env = [name for name, value in REQUIRED_ENV.items() if not value]
    if missing_env:
        print(f"❌ Missing required environment variables: {', '.join(missing_env)}")
        raise SystemExit(1)

    cf_url = f"https://api.cloudflare.com/client/v4/accounts/{ACC_ID}/d1/database/{DB_ID}/query"
    headers = {"Authorization": f"Bearer {TOKEN}"}
    write_audit(cf_url, headers, "started", rows_fetched=0, rows_temp=0, rows_main=0)

    print(f"🛰️ Connecting via Proxy... {SCRIPT_VERSION} run_id={RUN_ID}")
    url = "https://partner-api.prizepicks.com/projections?league_id=2&per_page=5000"

    try:
        res = requests.get(url, impersonate="chrome120", proxies={"http": PROXY, "https": PROXY}, timeout=30)
        res.raise_for_status()
        data = res.json()
    except Exception as e:
        write_audit(cf_url, headers, "failed", error_message=f"connection_failed: {e}")
        print(f"❌ Connection Failed: {e}")
        raise SystemExit(1)

    # 1. Map Team IDs to Abbreviations
    teams = {}
    for obj in data.get('included', []):
        if obj.get('type') == 'team':
            teams[obj['id']] = obj.get('attributes', {}).get('abbreviation') or obj.get('attributes', {}).get('name')

    # 2. Map Player IDs to their Names and Team Names
    player_data = {}
    for obj in data.get('included', []):
        if obj.get('type') == 'new_player':
            p_id = obj.get('id')
            t_rel = obj.get('relationships', {}).get('team_data', {}).get('data')
            t_id = t_rel.get('id') if t_rel else None
            player_data[p_id] = {
                "name": obj.get('attributes', {}).get('name') or "Unknown",
                "team": teams.get(t_id, "Unknown")
            }

    rows = []
    for item in data.get('data', []):
        attr = item.get('attributes', {})
        rel = item.get('relationships', {})

        p_id = rel.get('new_player', {}).get('data', {}).get('id')
        p_info = player_data.get(p_id, {"name": "Unknown", "team": "Unknown"})

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
        write_audit(cf_url, headers, "failed", rows_fetched=0, error_message="no_mlb_lines_found")
        print("⚠️ No MLB lines found.")
        raise SystemExit(1)

    try:
        print("🧱 Preparing temp table...")
        d1_query(
            cf_url,
            headers,
            "CREATE TABLE IF NOT EXISTS mlb_stats_temp AS SELECT * FROM mlb_stats WHERE 0;",
            "Create mlb_stats_temp"
        )

        print("🧹 Wiping temp table for fresh start...")
        d1_query(cf_url, headers, "DELETE FROM mlb_stats_temp;", "Clear mlb_stats_temp")

        print(f"📦 Syncing {len(rows)} lines with Team Names into temp...")
        chunk_size = 100
        for i in range(0, len(rows), chunk_size):
            chunk = rows[i:i + chunk_size]
            sql = f"INSERT INTO mlb_stats_temp (line_id, player_name, team, opponent, stat_type, line_score, odds_type, is_promo, start_time) VALUES {', '.join(chunk)};"
            d1_query(cf_url, headers, sql, f"Insert temp chunk {i//chunk_size + 1}")
            print(f"✅ Temp chunk {i//chunk_size + 1} complete.")

        print("🧪 Certifying temp table...")
        cert = d1_first_row(
            cf_url,
            headers,
            """
            SELECT
              COUNT(*) AS temp_rows,
              COUNT(DISTINCT line_id) AS distinct_line_ids,
              SUM(CASE WHEN line_id IS NULL OR line_id = '' THEN 1 ELSE 0 END) AS missing_line_id,
              SUM(CASE WHEN player_name IS NULL OR player_name = '' OR player_name = 'Unknown' THEN 1 ELSE 0 END) AS missing_player_name,
              SUM(CASE WHEN team IS NULL OR team = '' OR team = 'Unknown' THEN 1 ELSE 0 END) AS missing_team,
              SUM(CASE WHEN opponent IS NULL OR opponent = '' OR opponent = 'Unknown' THEN 1 ELSE 0 END) AS missing_opponent,
              SUM(CASE WHEN stat_type IS NULL OR stat_type = '' THEN 1 ELSE 0 END) AS missing_stat_type,
              SUM(CASE WHEN line_score IS NULL THEN 1 ELSE 0 END) AS missing_line_score,
              SUM(CASE WHEN start_time IS NULL OR start_time = '' OR start_time = 'Unknown' THEN 1 ELSE 0 END) AS missing_start_time,
              SUM(CASE WHEN datetime(start_time) <= datetime('now', '-15 minutes') THEN 1 ELSE 0 END) AS stale_or_started_rows
            FROM mlb_stats_temp;
            """,
            "Certify mlb_stats_temp"
        )

        temp_rows = int(cert.get("temp_rows") or 0)
        distinct_line_ids = int(cert.get("distinct_line_ids") or 0)
        missing_line_id = int(cert.get("missing_line_id") or 0)
        missing_player_name = int(cert.get("missing_player_name") or 0)
        missing_team = int(cert.get("missing_team") or 0)
        missing_opponent = int(cert.get("missing_opponent") or 0)
        missing_stat_type = int(cert.get("missing_stat_type") or 0)
        missing_line_score = int(cert.get("missing_line_score") or 0)
        missing_start_time = int(cert.get("missing_start_time") or 0)
        stale_or_started_rows = int(cert.get("stale_or_started_rows") or 0)

        if temp_rows != len(rows):
            raise RuntimeError(f"Temp certification failed: expected {len(rows)} rows, found {temp_rows}")
        if distinct_line_ids != temp_rows:
            raise RuntimeError(f"Temp certification failed: duplicate line_id rows detected, temp_rows={temp_rows}, distinct_line_ids={distinct_line_ids}")
        if missing_line_id or missing_player_name or missing_team or missing_opponent or missing_stat_type or missing_line_score or missing_start_time:
            raise RuntimeError(
                "Temp certification failed: "
                f"missing_line_id={missing_line_id}, missing_player_name={missing_player_name}, "
                f"missing_team={missing_team}, missing_opponent={missing_opponent}, "
                f"missing_stat_type={missing_stat_type}, missing_line_score={missing_line_score}, "
                f"missing_start_time={missing_start_time}"
            )
        if stale_or_started_rows:
            raise RuntimeError(f"Temp certification failed: stale_or_started_rows={stale_or_started_rows}")

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

        print("🧪 Verifying main table after promote...")
        verify = d1_first_row(
            cf_url,
            headers,
            """
            SELECT
              COUNT(*) AS main_rows,
              COUNT(DISTINCT line_id) AS distinct_line_ids,
              SUM(CASE WHEN datetime(start_time) <= datetime('now', '-15 minutes') THEN 1 ELSE 0 END) AS stale_or_started_rows
            FROM mlb_stats;
            """,
            "Verify mlb_stats"
        )

        main_rows = int(verify.get("main_rows") or 0)
        main_distinct = int(verify.get("distinct_line_ids") or 0)
        main_stale = int(verify.get("stale_or_started_rows") or 0)
        if main_rows != temp_rows:
            raise RuntimeError(f"Main verification failed: expected {temp_rows} rows, found {main_rows}")
        if main_distinct != main_rows:
            raise RuntimeError(f"Main verification failed: duplicate line_id rows detected, main_rows={main_rows}, distinct_line_ids={main_distinct}")
        if main_stale:
            raise RuntimeError(f"Main verification failed: stale_or_started_rows={main_stale}")

        print("🧽 Cleaning temp table after successful promote...")
        d1_query(cf_url, headers, "DELETE FROM mlb_stats_temp;", "Final clean mlb_stats_temp")
        write_audit(cf_url, headers, "completed", rows_fetched=len(rows), rows_temp=temp_rows, rows_main=main_rows)
        print(f"✅ PrizePicks board refresh complete. Main table now has {main_rows} fresh rows.")

    except Exception as e:
        try:
            d1_query(cf_url, headers, "DELETE FROM mlb_stats_temp;", "Failure clean mlb_stats_temp")
        except Exception as clean_error:
            print(f"⚠️ Failure temp cleanup also failed: {clean_error}")
        write_audit(cf_url, headers, "failed", rows_fetched=len(rows), error_message=str(e))
        print(f"❌ Sync Failed: {e}")
        print("⚠️ Main table was not replaced unless temp certification had already passed.")
        raise SystemExit(1)


if __name__ == "__main__":
    start()
