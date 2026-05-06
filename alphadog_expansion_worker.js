const SYSTEM_VERSION = 'v0.1.2 - Expansion Worker-Hosted Control Room';
const EMBEDDED_EXPANSION_ADMIN_TOKEN = 'alphadog-xp-v012-admin-7d3f5b1e-8a2c-4c78-91ab-2e9f6d41b203';
const SOURCE_TABLE = 'prizepicks_current_market_context';

const TARGET_STAT_TYPES = [
  'Hitter Strikeouts',
  'Walks',
  'Singles',
  'Doubles',
  'Home Runs',
  'Runs',
  'Hits+Runs+RBIs',
  'Hitter Fantasy Score',
  'Triples',
  'Stolen Bases',
  'Hits',
  'Total Bases',
  'RBIs'
];

const CONTROL_ROOM_HTML = '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <title>AlphaDog Expansion Control Room</title>\n  <style>\n    :root { color-scheme: dark; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }\n    body { margin: 0; background: #090b10; color: #f5f7fb; }\n    header { padding: 18px 16px; border-bottom: 1px solid #232734; background: #111520; position: sticky; top: 0; z-index: 2; }\n    h1 { margin: 0; font-size: 21px; }\n    .version { margin-top: 4px; color: #aab3c5; font-size: 13px; }\n    main { padding: 14px; max-width: 980px; margin: 0 auto; }\n    .card { border: 1px solid #252b3a; background: #111520; border-radius: 14px; padding: 14px; margin: 12px 0; }\n    label { display: block; font-size: 12px; color: #aab3c5; margin-bottom: 6px; }\n    select, textarea { width: 100%; box-sizing: border-box; border: 1px solid #2c3447; border-radius: 10px; padding: 11px; background: #090b10; color: #fff; font-size: 14px; }\n    textarea { min-height: 120px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }\n    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; }\n    button { border: 0; border-radius: 12px; padding: 12px; background: #2d6cdf; color: white; font-weight: 700; font-size: 14px; }\n    button.secondary { background: #273044; }\n    button.warn { background: #7c4d15; }\n    button.good { background: #17633a; }\n    button:active { transform: translateY(1px); }\n    pre { white-space: pre-wrap; word-break: break-word; background: #06080c; border: 1px solid #222838; border-radius: 12px; padding: 12px; min-height: 260px; font-size: 12px; line-height: 1.4; color: #d9e2f2; }\n    .note { color: #aab3c5; font-size: 13px; line-height: 1.45; }\n    .pill { display:inline-block; padding: 5px 9px; border-radius:999px; background:#182033; border:1px solid #2b3448; color:#c8d2e5; font-size:12px; margin-top:8px; }\n  </style>\n</head>\n<body>\n  <header>\n    <h1>AlphaDog Expansion Control Room</h1>\n    <div class="version">v0.1.2 - Expansion Worker-Hosted Control Room</div>\n  </header>\n  <main>\n    <section class="card">\n      <div class="note">Fresh isolated control room served by the Expansion Worker itself. It reads PrizePicks from the current database and writes only to <b>xp_*</b> tables. No current scoring buttons, no old control-room logic.</div>\n      <div class="pill">Worker URL locked to this page origin</div>\n      <div class="pill">Embedded admin token active</div>\n    </section>\n\n    <section class="card">\n      <div class="grid">\n        <button onclick="callApi(\'/xp/health\',\'GET\')">Health</button>\n        <button onclick="callApi(\'/xp/schema/apply\',\'POST\')" class="warn">Apply Schema</button>\n        <button onclick="callApi(\'/xp/board/refresh\',\'POST\',{include_started:false})">Refresh Pickable Board</button>\n        <button onclick="callApi(\'/xp/board/counts\',\'GET\')">Counts</button>\n        <button onclick="callApi(\'/xp/jobs\',\'GET\')" class="secondary">Jobs</button>\n        <button onclick="callApi(\'/xp/logs\',\'GET\')" class="secondary">Logs</button>\n      </div>\n    </section>\n\n    <section class="card">\n      <div class="grid">\n        <div>\n          <label>Sample Prop</label>\n          <select id="sampleProp">\n            <option>Hitter Strikeouts</option>\n            <option>Walks</option>\n            <option>Singles</option>\n            <option>Doubles</option>\n            <option>Home Runs</option>\n            <option>Runs</option>\n            <option>Hits+Runs+RBIs</option>\n            <option>Hitter Fantasy Score</option>\n            <option>Triples</option>\n            <option>Stolen Bases</option>\n            <option>Hits</option>\n            <option>Total Bases</option>\n            <option>RBIs</option>\n          </select>\n        </div>\n        <div>\n          <label>&nbsp;</label>\n          <button onclick="sampleProp()">Load Sample</button>\n        </div>\n      </div>\n    </section>\n\n    <section class="card">\n      <label>Manual SQL Output</label>\n      <textarea id="manualSql">SELECT stat_type, odds_type, target_status, expansion_phase, COUNT(*) AS rows_count, MIN(line_score) AS min_line, MAX(line_score) AS max_line FROM xp_prop_lines_current GROUP BY stat_type, odds_type, target_status, expansion_phase ORDER BY expansion_phase ASC, stat_type ASC, odds_type ASC LIMIT 50</textarea>\n      <div class="grid" style="margin-top:10px;">\n        <button onclick="runManualSql()" class="warn">Run Manual SQL</button>\n        <button onclick="copyOutput()" class="good">Copy Output</button>\n        <button onclick="clearOutput()" class="secondary">Clear Output</button>\n      </div>\n      <div class="note" style="margin-top:8px;">Manual SQL is read-only in this expansion room: SELECT, WITH, and PRAGMA only.</div>\n    </section>\n\n    <section class="card">\n      <label>Output</label>\n      <pre id="output">Ready.</pre>\n    </section>\n  </main>\n\n  <script>\n    const VERSION = \'v0.1.2 - Expansion Worker-Hosted Control Room\';\n    const EMBEDDED_EXPANSION_ADMIN_TOKEN = \'alphadog-xp-v012-admin-7d3f5b1e-8a2c-4c78-91ab-2e9f6d41b203\';\n    const output = document.getElementById(\'output\');\n\n    function print(data) {\n      output.textContent = typeof data === \'string\' ? data : JSON.stringify(data, null, 2);\n    }\n\n    async function callApi(path, method, body) {\n      const headers = {\n        \'Content-Type\': \'application/json\',\n        \'Authorization\': \'Bearer \' + EMBEDDED_EXPANSION_ADMIN_TOKEN,\n        \'X-Admin-Token\': EMBEDDED_EXPANSION_ADMIN_TOKEN\n      };\n      print(\'Running \' + method + \' \' + path + \'...\');\n      try {\n        const res = await fetch(path, {\n          method: method,\n          headers: headers,\n          body: method === \'POST\' ? JSON.stringify(body || {}) : undefined\n        });\n        const text = await res.text();\n        let data;\n        try { data = JSON.parse(text); } catch (e) { data = text; }\n        print({ http_status: res.status, version: VERSION, response: data });\n      } catch (err) {\n        print({ ok: false, version: VERSION, error: err.message || String(err) });\n      }\n    }\n\n    function sampleProp() {\n      const stat = encodeURIComponent(document.getElementById(\'sampleProp\').value);\n      callApi(\'/xp/board/sample?stat_type=\' + stat + \'&limit=50\', \'GET\');\n    }\n\n    function runManualSql() {\n      const sql = document.getElementById(\'manualSql\').value || \'\';\n      callApi(\'/xp/manual-sql\', \'POST\', { sql: sql, max_rows: 100 });\n    }\n\n    async function copyOutput() {\n      try {\n        await navigator.clipboard.writeText(output.textContent || \'\');\n        const old = output.textContent;\n        output.textContent = \'Copied output.\\n\\n\' + old;\n      } catch (err) {\n        output.textContent = \'Copy failed. Select the output text and copy manually.\\n\\n\' + output.textContent;\n      }\n    }\n\n    function clearOutput() { output.textContent = \'Ready.\'; }\n  </script>\n</body>\n</html>\n';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS xp_schema_migrations (
  version TEXT PRIMARY KEY,
  description TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS xp_prop_definitions (
  stat_type TEXT PRIMARY KEY,
  prop_family TEXT NOT NULL,
  expansion_phase INTEGER NOT NULL,
  target_status TEXT NOT NULL,
  complexity_tier TEXT NOT NULL,
  source_scope TEXT NOT NULL DEFAULT 'PRIZEPICKS_ONLY',
  scoring_status TEXT NOT NULL DEFAULT 'NOT_BUILT',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS xp_prop_lines_current (
  xp_line_key TEXT PRIMARY KEY,
  source_table TEXT NOT NULL,
  source_projection_key TEXT,
  line_id TEXT,
  player_name TEXT,
  normalized_player_name TEXT,
  team TEXT,
  opponent TEXT,
  stat_type TEXT NOT NULL,
  prop_family TEXT NOT NULL,
  line_score REAL,
  odds_type TEXT,
  start_time TEXT,
  slate_date TEXT,
  board_updated_at TEXT,
  captured_at TEXT,
  source_status TEXT,
  is_supported_single INTEGER DEFAULT 1,
  is_current INTEGER DEFAULT 1,
  is_stale INTEGER DEFAULT 0,
  target_status TEXT,
  expansion_phase INTEGER,
  imported_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  raw_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_xp_lines_stat_start ON xp_prop_lines_current(stat_type, start_time);
CREATE INDEX IF NOT EXISTS idx_xp_lines_slate_stat ON xp_prop_lines_current(slate_date, stat_type);
CREATE INDEX IF NOT EXISTS idx_xp_lines_target ON xp_prop_lines_current(target_status, expansion_phase);
CREATE INDEX IF NOT EXISTS idx_xp_lines_player ON xp_prop_lines_current(normalized_player_name, stat_type);
CREATE TABLE IF NOT EXISTS xp_prop_counts_snapshot (
  snapshot_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  stat_type TEXT NOT NULL,
  odds_type TEXT,
  target_status TEXT,
  expansion_phase INTEGER,
  rows_count INTEGER DEFAULT 0,
  min_line REAL,
  max_line REAL,
  first_start_time TEXT,
  last_start_time TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_xp_counts_run ON xp_prop_counts_snapshot(run_id, stat_type);
CREATE TABLE IF NOT EXISTS xp_job_runs (
  run_id TEXT PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL,
  source_table TEXT,
  rows_read INTEGER DEFAULT 0,
  rows_written INTEGER DEFAULT 0,
  rows_deleted INTEGER DEFAULT 0,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  error TEXT,
  details_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_xp_job_runs_created ON xp_job_runs(started_at DESC);
CREATE TABLE IF NOT EXISTS xp_job_logs (
  log_id TEXT PRIMARY KEY,
  run_id TEXT,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  details_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_xp_logs_run ON xp_job_logs(run_id, created_at DESC);
INSERT OR REPLACE INTO xp_schema_migrations(version, description, applied_at)
VALUES ('v0.1.2', 'Expansion bootstrap xp_* isolated schema with worker-hosted control room and read-only manual SQL', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO xp_prop_definitions(stat_type, prop_family, expansion_phase, target_status, complexity_tier, source_scope, scoring_status, notes, updated_at) VALUES
('Hitter Strikeouts', 'HITTER_STRIKEOUTS', 1, 'READY_PHASE_1', 'LOW', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'First expansion scoring target. Simple count prop with strong board volume.', CURRENT_TIMESTAMP),
('Walks', 'WALKS', 1, 'READY_PHASE_1', 'LOW', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'Second expansion scoring target. Simple count prop.', CURRENT_TIMESTAMP),
('Singles', 'SINGLES', 2, 'READY_PHASE_2', 'MEDIUM', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'Component prop for total bases and fantasy score.', CURRENT_TIMESTAMP),
('Doubles', 'DOUBLES', 2, 'READY_PHASE_2', 'MEDIUM', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'Component prop for total bases and fantasy score.', CURRENT_TIMESTAMP),
('Home Runs', 'HOME_RUNS', 2, 'READY_PHASE_2', 'MEDIUM_HIGH', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'Component prop; weather/park context later.', CURRENT_TIMESTAMP),
('Runs', 'RUNS', 3, 'READY_PHASE_3', 'MEDIUM', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'Needed before HRR and fantasy score.', CURRENT_TIMESTAMP),
('Hits+Runs+RBIs', 'HRR', 4, 'READY_PHASE_4', 'MEDIUM_HIGH', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'Composite after hits, runs, and RBI context exists.', CURRENT_TIMESTAMP),
('Hitter Fantasy Score', 'HITTER_FANTASY_SCORE', 5, 'READY_LATER', 'HIGH', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'Keep, but build after components are proven.', CURRENT_TIMESTAMP),
('Triples', 'TRIPLES', 9, 'PARKED', 'HIGH_VARIANCE', 'PRIZEPICKS_ONLY', 'PARKED', 'Sparse and high variance. Do not build first.', CURRENT_TIMESTAMP),
('Stolen Bases', 'STOLEN_BASES', 9, 'PARKED', 'HIGH_VARIANCE', 'PRIZEPICKS_ONLY', 'PARKED', 'Requires runner/catcher/pitcher context. Park for now.', CURRENT_TIMESTAMP),
('Hits', 'HITS', 0, 'REFERENCE_EXISTING', 'EXISTING', 'PRIZEPICKS_ONLY', 'EXISTING_SYSTEM', 'Existing current-system prop. Copied for visibility only.', CURRENT_TIMESTAMP),
('Total Bases', 'TOTAL_BASES', 0, 'REFERENCE_EXISTING', 'EXISTING', 'PRIZEPICKS_ONLY', 'EXISTING_SYSTEM', 'Existing current-system prop. Copied for visibility only.', CURRENT_TIMESTAMP),
('RBIs', 'RBI', 0, 'REFERENCE_EXISTING', 'EXISTING', 'PRIZEPICKS_ONLY', 'EXISTING_SYSTEM', 'Existing current-system/related prop. Copied for visibility only.', CURRENT_TIMESTAMP);
`;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Admin-Token,X-Expansion-Token',
    'Cache-Control': 'no-store'
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function textResponse(body, status = 200, contentType = 'text/plain; charset=utf-8') {
  return new Response(body, { status, headers: { ...corsHeaders(), 'Content-Type': contentType } });
}

function htmlResponse(body, status = 200) {
  return new Response(body, { status, headers: { ...corsHeaders(), 'Content-Type': 'text/html; charset=utf-8' } });
}

function makeId(prefix) {
  const rand = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${prefix}|${new Date().toISOString()}|${rand}`;
}

function normalizeStat(stat) {
  return TARGET_STAT_TYPES.includes(stat) ? stat : null;
}

function tokenFromRequest(request) {
  const auth = request.headers.get('Authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return request.headers.get('X-Admin-Token') || request.headers.get('X-Expansion-Token') || '';
}

function requireAdmin(request, env) {
  const validTokens = [env.EXPANSION_ADMIN_TOKEN, env.INGEST_TOKEN, EMBEDDED_EXPANSION_ADMIN_TOKEN].filter(Boolean);
  const got = tokenFromRequest(request);
  if (got && validTokens.includes(got)) return { ok: true };
  return { ok: false, error: 'Unauthorized expansion admin request. The control room must be deployed from the matching v0.1.1 build.' };
}

async function log(db, runId, level, message, details = null) {
  try {
    await db.prepare(`INSERT INTO xp_job_logs(log_id, run_id, level, message, details_json) VALUES (?, ?, ?, ?, ?)`)
      .bind(makeId('log'), runId, level, message, details ? JSON.stringify(details) : null)
      .run();
  } catch (_) {}
}

async function applySchema(env) {
  await env.DB.exec(SCHEMA_SQL);
  return { ok: true, version: SYSTEM_VERSION, schema: 'xp_* isolated schema applied' };
}

async function refreshPrizePicks(env, options = {}) {
  const runId = makeId('xp_refresh');
  const includeStarted = options.include_started === true;
  const slateDate = options.slate_date || null;
  const startedAt = new Date().toISOString();

  await env.DB.prepare(`INSERT INTO xp_job_runs(run_id, job_name, status, source_table, started_at, details_json) VALUES (?, ?, 'RUNNING', ?, ?, ?)`)
    .bind(runId, 'refresh_prizepicks_target_props', SOURCE_TABLE, startedAt, JSON.stringify({ include_started: includeStarted, slate_date: slateDate }))
    .run();

  try {
    await applySchema(env);
    await log(env.DB, runId, 'INFO', 'Schema verified before refresh');

    const statPlaceholders = TARGET_STAT_TYPES.map(() => '?').join(',');
    const baseWhere = [
      `is_current = 1`,
      `COALESCE(is_stale, 0) = 0`,
      `COALESCE(status, 'ACTIVE') = 'ACTIVE'`,
      `COALESCE(is_supported_single, 1) = 1`,
      `stat_type IN (${statPlaceholders})`
    ];
    const params = [...TARGET_STAT_TYPES];
    if (!includeStarted) baseWhere.push(`datetime(start_time) > datetime('now')`);
    if (slateDate) {
      baseWhere.push(`slate_date = ?`);
      params.push(slateDate);
    }
    const whereSql = baseWhere.join(' AND ');

    const countBefore = await env.DB.prepare(`SELECT COUNT(*) AS c FROM xp_prop_lines_current`).first();

    await env.DB.prepare(`DELETE FROM xp_prop_lines_current`).run();

    const insertSql = `
      INSERT OR REPLACE INTO xp_prop_lines_current (
        xp_line_key, source_table, source_projection_key, line_id, player_name, normalized_player_name,
        team, opponent, stat_type, prop_family, line_score, odds_type, start_time, slate_date,
        board_updated_at, captured_at, source_status, is_supported_single, is_current, is_stale,
        target_status, expansion_phase, imported_at, expires_at, raw_json
      )
      SELECT
        'pp:' || COALESCE(projection_key, line_id, CAST(id AS TEXT)) AS xp_line_key,
        '${SOURCE_TABLE}' AS source_table,
        projection_key AS source_projection_key,
        line_id,
        player_name,
        lower(replace(replace(replace(trim(COALESCE(player_name,'')), '.', ''), '''', ''), ' ', '')) AS normalized_player_name,
        team,
        opponent,
        p.stat_type,
        COALESCE(d.prop_family,
          CASE p.stat_type
            WHEN 'Hitter Strikeouts' THEN 'HITTER_STRIKEOUTS'
            WHEN 'Hits+Runs+RBIs' THEN 'HRR'
            WHEN 'Hitter Fantasy Score' THEN 'HITTER_FANTASY_SCORE'
            WHEN 'Home Runs' THEN 'HOME_RUNS'
            WHEN 'Total Bases' THEN 'TOTAL_BASES'
            ELSE upper(replace(p.stat_type, ' ', '_'))
          END
        ) AS prop_family,
        line_score,
        odds_type,
        start_time,
        slate_date,
        board_updated_at,
        captured_at,
        status AS source_status,
        is_supported_single,
        is_current,
        is_stale,
        COALESCE(d.target_status, 'UNCLASSIFIED') AS target_status,
        COALESCE(d.expansion_phase, 99) AS expansion_phase,
        CURRENT_TIMESTAMP AS imported_at,
        start_time AS expires_at,
        json_object(
          'id', id,
          'projection_key', projection_key,
          'line_id', line_id,
          'stat_type', p.stat_type,
          'line_score', line_score,
          'odds_type', odds_type,
          'start_time', start_time,
          'slate_date', slate_date,
          'board_updated_at', board_updated_at,
          'captured_at', captured_at,
          'source_table', '${SOURCE_TABLE}',
          'xp_version', '${SYSTEM_VERSION}'
        ) AS raw_json
      FROM ${SOURCE_TABLE} p
      LEFT JOIN xp_prop_definitions d ON d.stat_type = p.stat_type
      WHERE ${whereSql}
    `;
    await env.DB.prepare(insertSql).bind(...params).run();

    const countAfter = await env.DB.prepare(`SELECT COUNT(*) AS c FROM xp_prop_lines_current`).first();
    const rowsDeleted = Number(countBefore?.c || 0);
    const rowsWritten = Number(countAfter?.c || 0);

    const snapshotRows = await env.DB.prepare(`
      SELECT stat_type, odds_type, target_status, expansion_phase, COUNT(*) AS rows_count,
             MIN(line_score) AS min_line, MAX(line_score) AS max_line,
             MIN(start_time) AS first_start_time, MAX(start_time) AS last_start_time
      FROM xp_prop_lines_current
      GROUP BY stat_type, odds_type, target_status, expansion_phase
      ORDER BY expansion_phase ASC, stat_type ASC, odds_type ASC
    `).all();

    const inserts = (snapshotRows.results || []).map((r, idx) => env.DB.prepare(`
      INSERT INTO xp_prop_counts_snapshot(snapshot_id, run_id, stat_type, odds_type, target_status, expansion_phase, rows_count, min_line, max_line, first_start_time, last_start_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(`${runId}|count|${idx}`, runId, r.stat_type, r.odds_type, r.target_status, r.expansion_phase, r.rows_count, r.min_line, r.max_line, r.first_start_time, r.last_start_time));
    if (inserts.length) await env.DB.batch(inserts);

    const byStatus = await env.DB.prepare(`
      SELECT target_status, expansion_phase, COUNT(*) AS rows_count
      FROM xp_prop_lines_current
      GROUP BY target_status, expansion_phase
      ORDER BY expansion_phase ASC, target_status ASC
    `).all();

    const details = {
      version: SYSTEM_VERSION,
      source_table: SOURCE_TABLE,
      include_started: includeStarted,
      slate_date_filter: slateDate,
      current_table_deleted_rows: rowsDeleted,
      rows_written: rowsWritten,
      target_status_counts: byStatus.results || []
    };

    await env.DB.prepare(`UPDATE xp_job_runs SET status='COMPLETED', rows_read=?, rows_written=?, rows_deleted=?, completed_at=CURRENT_TIMESTAMP, details_json=? WHERE run_id=?`)
      .bind(rowsWritten, rowsWritten, rowsDeleted, JSON.stringify(details), runId)
      .run();
    await log(env.DB, runId, 'INFO', 'PrizePicks target props refreshed into xp_prop_lines_current', details);

    return { ok: true, run_id: runId, ...details };
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    await env.DB.prepare(`UPDATE xp_job_runs SET status='ERROR', error=?, completed_at=CURRENT_TIMESTAMP WHERE run_id=?`)
      .bind(message, runId)
      .run();
    await log(env.DB, runId, 'ERROR', 'Refresh failed', { error: message });
    return { ok: false, run_id: runId, error: message, version: SYSTEM_VERSION };
  }
}

async function getCounts(env) {
  const rows = await env.DB.prepare(`
    SELECT stat_type, odds_type, target_status, expansion_phase, COUNT(*) AS rows_count,
           MIN(line_score) AS min_line, MAX(line_score) AS max_line,
           MIN(start_time) AS first_start_time, MAX(start_time) AS last_start_time
    FROM xp_prop_lines_current
    GROUP BY stat_type, odds_type, target_status, expansion_phase
    ORDER BY expansion_phase ASC, stat_type ASC, odds_type ASC
  `).all();
  const totals = await env.DB.prepare(`
    SELECT target_status, expansion_phase, COUNT(*) AS rows_count
    FROM xp_prop_lines_current
    GROUP BY target_status, expansion_phase
    ORDER BY expansion_phase ASC, target_status ASC
  `).all();
  return { ok: true, version: SYSTEM_VERSION, rows: rows.results || [], totals: totals.results || [] };
}

async function getSamples(env, statType = null, limit = 50) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
  const stat = normalizeStat(statType);
  let sql = `
    SELECT stat_type, target_status, expansion_phase, player_name, team, opponent, line_score, odds_type,
           start_time, slate_date, line_id, source_projection_key, imported_at
    FROM xp_prop_lines_current
  `;
  const binds = [];
  if (stat) {
    sql += ` WHERE stat_type = ?`;
    binds.push(stat);
  }
  sql += ` ORDER BY expansion_phase ASC, stat_type ASC, start_time ASC, player_name ASC LIMIT ${safeLimit}`;
  const rows = binds.length ? await env.DB.prepare(sql).bind(...binds).all() : await env.DB.prepare(sql).all();
  return { ok: true, version: SYSTEM_VERSION, stat_type: stat || 'ALL', rows: rows.results || [] };
}

async function getJobs(env) {
  const rows = await env.DB.prepare(`
    SELECT run_id, job_name, status, source_table, rows_read, rows_written, rows_deleted, error, started_at, completed_at, substr(details_json,1,1200) AS details_preview
    FROM xp_job_runs
    ORDER BY datetime(started_at) DESC
    LIMIT 25
  `).all();
  return { ok: true, version: SYSTEM_VERSION, rows: rows.results || [] };
}

async function getLogs(env) {
  const rows = await env.DB.prepare(`
    SELECT log_id, run_id, level, message, substr(details_json,1,1200) AS details_preview, created_at
    FROM xp_job_logs
    ORDER BY datetime(created_at) DESC
    LIMIT 50
  `).all();
  return { ok: true, version: SYSTEM_VERSION, rows: rows.results || [] };
}


function isReadOnlySql(sql) {
  const cleaned = String(sql || '').trim().replace(/^\s*--.*$/gm, '').trim();
  const lowered = cleaned.toLowerCase();
  if (!cleaned) return false;
  if (!(lowered.startsWith('select') || lowered.startsWith('with') || lowered.startsWith('pragma'))) return false;
  const banned = [' insert ', ' update ', ' delete ', ' drop ', ' alter ', ' create ', ' replace ', ' attach ', ' detach ', ' vacuum ', ' reindex ', ' truncate '];
  const padded = ' ' + lowered.replace(/[\n\r\t]+/g, ' ') + ' ';
  return !banned.some(word => padded.includes(word));
}

async function runManualSql(env, body) {
  const sql = String(body?.sql || '').trim();
  const maxRows = Math.max(1, Math.min(Number(body?.max_rows) || 50, 100));
  if (!isReadOnlySql(sql)) {
    return { ok: false, version: SYSTEM_VERSION, error: 'Manual SQL is read-only here. Use SELECT, WITH, or PRAGMA only.' };
  }
  const started = Date.now();
  try {
    const result = await env.DB.prepare(sql).all();
    const rows = result.results || [];
    return {
      ok: true,
      version: SYSTEM_VERSION,
      sql,
      rows: rows.slice(0, maxRows),
      row_count: rows.length,
      returned_rows: Math.min(rows.length, maxRows),
      truncated: rows.length > maxRows,
      duration_ms: Date.now() - started
    };
  } catch (err) {
    return { ok: false, version: SYSTEM_VERSION, sql, error: err && err.message ? err.message : String(err), duration_ms: Date.now() - started };
  }
}

async function parseBody(request) {
  if (request.method !== 'POST') return {};
  const text = await request.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return {}; }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return textResponse('', 204);
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (path === '/') {
      return htmlResponse(CONTROL_ROOM_HTML);
    }

    if (path === '/xp/health') {
      return jsonResponse({
        ok: true,
        version: SYSTEM_VERSION,
        worker: 'alphadog-expansion-v001',
        mode: 'isolated_xp_tables_only',
        source_read_table: SOURCE_TABLE,
        writes_allowed_only_to: 'xp_* tables',
        admin_secret_configured: Boolean(env.EXPANSION_ADMIN_TOKEN || env.INGEST_TOKEN),
        embedded_control_room_token_enabled: true,
        control_room_served_by_worker: true
      });
    }

    if (path === '/xp/props/targets') {
      return jsonResponse({ ok: true, version: SYSTEM_VERSION, target_stat_types: TARGET_STAT_TYPES });
    }

    const admin = requireAdmin(request, env);
    if (!admin.ok) return jsonResponse({ ok: false, version: SYSTEM_VERSION, error: admin.error }, 401);

    try {
      if (path === '/xp/schema/apply' && request.method === 'POST') {
        return jsonResponse({ ...(await applySchema(env)), auth_warning: admin.warning || null });
      }
      if (path === '/xp/board/refresh' && request.method === 'POST') {
        const body = await parseBody(request);
        const result = await refreshPrizePicks(env, body);
        return jsonResponse({ ...result, auth_warning: admin.warning || null }, result.ok ? 200 : 500);
      }
      if (path === '/xp/full-refresh' && request.method === 'POST') {
        const body = await parseBody(request);
        await applySchema(env);
        const result = await refreshPrizePicks(env, body);
        return jsonResponse({ ...result, auth_warning: admin.warning || null }, result.ok ? 200 : 500);
      }
      if (path === '/xp/board/counts') return jsonResponse(await getCounts(env));
      if (path === '/xp/board/sample') return jsonResponse(await getSamples(env, url.searchParams.get('stat_type'), url.searchParams.get('limit')));
      if (path === '/xp/jobs') return jsonResponse(await getJobs(env));
      if (path === '/xp/logs') return jsonResponse(await getLogs(env));
      if (path === '/xp/manual-sql' && request.method === 'POST') {
        const body = await parseBody(request);
        const result = await runManualSql(env, body);
        return jsonResponse(result, result.ok ? 200 : 400);
      }

      return jsonResponse({ ok: false, version: SYSTEM_VERSION, error: `Unknown route: ${path}` }, 404);
    } catch (err) {
      return jsonResponse({ ok: false, version: SYSTEM_VERSION, error: err && err.message ? err.message : String(err) }, 500);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      await applySchema(env);
      await refreshPrizePicks(env, { include_started: false });
    })());
  }
};
