const SYSTEM_VERSION = 'v0.1.6 - Expansion UI Brace Repair Certified';
const EMBEDDED_EXPANSION_ADMIN_TOKEN = 'alphadog-xp-v013-admin-2f7c9d41-6b30-4bc8-a2d9-28f41c0e5a73';
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

const CONTROL_ROOM_HTML = '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />\n  <title>AlphaDog Expansion Control Room</title>\n  <style>\n    :root { color-scheme: dark; --bg:#070b11; --panel:#050505; --line:#2a3340; --green:#59ff92; --muted:#aab0bb; --purple:#7c3df0; --gold:#dfa51c; --teal:#0d756e; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }\n    * { box-sizing:border-box; }\n    body { margin:0; background:var(--bg); color:var(--green); font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }\n    main { width:100%; max-width:980px; margin:0 auto; padding:22px 20px 34px; }\n    h1 { color:#19ff82; margin:0; font-size:30px; line-height:1.15; letter-spacing:1px; text-transform:uppercase; font-weight:900; }\n    h2 { color:#f7f2ea; margin:0 0 14px; font-size:22px; letter-spacing:1px; text-transform:uppercase; }\n    .version { color:#bff7cc; font-size:17px; line-height:1.35; margin-top:12px; font-weight:700; }\n    .top { padding-bottom:20px; border-bottom:2px solid var(--line); }\n    .section { padding:22px 0; border-bottom:2px solid var(--line); }\n    .desc { margin:0 0 12px; color:var(--green); font-size:21px; line-height:1.35; }\n    .small { color:var(--muted); font-size:16px; line-height:1.35; margin:12px 0 0; }\n    .status { color:#f7f2ea; border:2px solid var(--line); border-radius:10px; background:#101010; padding:10px 12px; margin-top:14px; min-height:42px; font-size:15px; line-height:1.35; }\n    .button-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:18px; }\n    .sql-buttons { display:flex; flex-wrap:wrap; gap:12px; margin-top:12px; }\n    button { border:0; border-radius:13px; padding:16px 12px; color:white; background:var(--purple); font-size:19px; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; min-height:58px; cursor:pointer; }\n    button.gold { background:var(--gold); }\n    button.green { background:#188336; }\n    button.teal { background:var(--teal); }\n    button.full { width:100%; margin-top:18px; letter-spacing:2px; text-transform:uppercase; }\n    button:active { transform:translateY(1px); }\n    select, textarea { width:100%; border:2px solid var(--line); border-radius:13px; background:#101010; color:var(--green); font-family:inherit; font-size:17px; outline:none; }\n    select { padding:16px 14px; }\n    textarea { min-height:150px; padding:16px; line-height:1.35; resize:vertical; }\n    pre { white-space:pre-wrap; word-break:break-word; background:var(--panel); color:var(--green); border:2px solid var(--line); border-radius:13px; padding:16px; min-height:170px; max-height:330px; overflow:auto; font-size:16px; line-height:1.35; margin:0; }\n    .sample-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; align-items:end; }\n    .pill { border:2px solid var(--line); border-radius:12px; background:#111; color:var(--muted); padding:12px; font-size:14px; line-height:1.35; }\n    @media (min-width:700px) { .button-grid { grid-template-columns:repeat(3,minmax(0,1fr)); } }\n    @media (max-width:520px) { main { padding:18px 14px 30px; } h1 { font-size:27px; } .desc { font-size:20px; } .sample-row { grid-template-columns:1fr; } button { font-size:18px; } }\n  </style>\n</head>\n<body>\n  <main>\n    <div class="top">\n      <h1>AlphaDog Expansion Control Room</h1>\n      <div class="version">v0.1.6 - Expansion UI Brace Repair Certified</div>\n      <div class="small" id="originStatus">Starting UI...</div>\n      <div class="status" id="actionStatus">Ready.</div>\n    </div>\n\n    <section class="section">\n      <p class="desc">Fresh isolated expansion room. Writes only to xp_* tables. Current production scoring/database tables are read-only inputs.</p>\n      <div class="pill" id="bridgeStatus">Worker bridge loading...</div>\n      <div class="button-grid">\n        <button id="btnHealth">Health</button>\n        <button id="btnSchema" class="gold">Apply Schema</button>\n        <button id="btnRefresh">Refresh Board</button>\n        <button id="btnCounts">Counts</button>\n        <button id="btnJobs">Jobs</button>\n        <button id="btnLogs">Logs</button>\n      </div>\n    </section>\n\n    <section class="section">\n      <h2>Sample Prop</h2>\n      <div class="sample-row">\n        <select id="sampleProp"><option>Hitter Strikeouts</option><option>Walks</option><option>Singles</option><option>Doubles</option><option>Home Runs</option><option>Runs</option><option>Hits+Runs+RBIs</option><option>Hitter Fantasy Score</option><option>Triples</option><option>Stolen Bases</option><option>Hits</option><option>Total Bases</option><option>RBIs</option></select>\n        <button id="btnSample">Load Sample</button>\n      </div>\n    </section>\n\n    <section class="section">\n      <h2>Manual SQL</h2>\n      <p class="small">Output guard active: max 50 rows, long text cells truncated to prevent browser/app crashes.</p>\n      <textarea id="manualSql">SELECT stat_type, odds_type, target_status, expansion_phase, COUNT(*) AS rows_count, MIN(line_score) AS min_line, MAX(line_score) AS max_line FROM xp_prop_lines_current GROUP BY stat_type, odds_type, target_status, expansion_phase ORDER BY expansion_phase ASC, stat_type ASC, odds_type ASC LIMIT 50</textarea>\n      <div class="sql-buttons"><button id="btnRunSql" class="gold">Run SQL</button><button id="btnClearSql">Clear SQL</button><button id="btnSelectSql">Select SQL</button></div>\n    </section>\n\n    <section class="section" id="outputSection"><pre id="output">Ready.</pre><button id="btnCopy" class="full">COPY OUTPUT</button></section>\n  </main>\n\n  <script>\n    (function() {\n      \'use strict\';\n      var VERSION = "v0.1.6 - Expansion UI Brace Repair Certified";\n      var HARD_CODED_WORKER_BASE = "https://alphadog-expansion-v001.rodantmat.workers.dev";\n      var EMBEDDED_TOKEN = "alphadog-xp-v013-admin-2f7c9d41-6b30-4bc8-a2d9-28f41c0e5a73";\n      var output = document.getElementById(\'output\');\n      var outputSection = document.getElementById(\'outputSection\');\n      var originStatus = document.getElementById(\'originStatus\');\n      var bridgeStatus = document.getElementById(\'bridgeStatus\');\n      var actionStatus = document.getElementById(\'actionStatus\');\n      function fromGithubPages() { return /(^|\\.)github\\.io$/i.test(location.hostname); }\n      function apiBase() { return fromGithubPages() ? HARD_CODED_WORKER_BASE : location.origin; }\n      function withToken(path) { return path + (path.indexOf(\'?\') >= 0 ? \'&\' : \'?\') + \'xp_token=\' + encodeURIComponent(EMBEDDED_TOKEN); }\n      function apiUrl(path) { return apiBase().replace(/\\/$/, \'\') + withToken(path); }\n      function setStatus(msg) { actionStatus.textContent = msg; }\n      function jumpOutput() { setTimeout(function() { outputSection.scrollIntoView({ behavior:\'smooth\', block:\'start\' }); }, 50); }\n      function safeText(value) {\n        var s = String(value == null ? \'\' : value);\n        if (s.indexOf(\'There isn\') !== -1 && s.indexOf(\'GitHub Pages\') !== -1) return JSON.stringify({ ok:false, connection_issue:\'WRONG_ORIGIN_OR_BAD_WORKER_URL\', diagnosis:\'Request returned GitHub Pages 404 HTML instead of Worker JSON. The UI is working; the Worker URL/deployment/route is wrong.\', worker_base:apiBase() }, null, 2);\n        if (/^\\s*</.test(s)) return JSON.stringify({ ok:false, connection_issue:\'HTML_RESPONSE_NOT_JSON\', http_preview:s.replace(/<[^>]*>/g,\' \').replace(/\\s+/g,\' \').trim().slice(0,360), worker_base:apiBase() }, null, 2);\n        return s.length > 1800 ? s.slice(0,1800) + \'\\n...[truncated by control room]\' : s;\n      }\n      function show(data) { if (typeof data === \'string\') output.textContent = safeText(data); else output.textContent = safeText(JSON.stringify(data, null, 2)); }\n      async function callApi(path, method, body) {\n        setStatus(\'Running \' + method + \' \' + path);\n        show(\'Running \' + method + \' \' + path + \'\\nBase: \' + apiBase());\n        jumpOutput();\n        try {\n          var opts = { method:method };\n          if (method === \'POST\') { opts.headers = { \'Content-Type\':\'text/plain;charset=UTF-8\' }; opts.body = JSON.stringify(body || {}); }\n          var res = await fetch(apiUrl(path), opts);\n          var text = await res.text();\n          var response;\n          try { response = JSON.parse(text); } catch(e) { response = safeText(text); }\n          show({ http_status:res.status, version:VERSION, worker_base:apiBase(), response:response });\n          setStatus(\'Finished \' + method + \' \' + path + \' • HTTP \' + res.status);\n        } catch(err) {\n          show({ ok:false, version:VERSION, worker_base:apiBase(), error:String(err && err.message ? err.message : err), diagnosis:\'Network/CORS/route failure. UI buttons are bound. Confirm the Worker is deployed at the hardcoded worker_base and workers.dev route is active.\' });\n          setStatus(\'Failed \' + method + \' \' + path);\n        }\n      }\n      function clearSql() { document.getElementById(\'manualSql\').value = \'\'; setStatus(\'SQL box cleared. Output preserved.\'); }\n      function selectSql() { var el = document.getElementById(\'manualSql\'); el.focus(); el.select(); setStatus(\'SQL selected. Output preserved.\'); }\n      function runManualSql() { callApi(\'/xp/manual-sql\',\'POST\',{ sql:document.getElementById(\'manualSql\').value || \'\', max_rows:50 }); }\n      function sampleProp() { callApi(\'/xp/board/sample?stat_type=\' + encodeURIComponent(document.getElementById(\'sampleProp\').value) + \'&limit=50\',\'GET\'); }\n      async function copyOutput() { try { await navigator.clipboard.writeText(output.textContent || \'\'); setStatus(\'Output copied. Output preserved.\'); } catch(err) { setStatus(\'Copy failed. Long-press/select the output manually.\'); } }\n      function bind(id, fn) { var el = document.getElementById(id); if (el) el.addEventListener(\'click\', fn); }\n      bind(\'btnHealth\', function() { callApi(\'/xp/health\',\'GET\'); }); bind(\'btnSchema\', function() { callApi(\'/xp/schema/apply\',\'POST\'); }); bind(\'btnRefresh\', function() { callApi(\'/xp/board/refresh\',\'POST\',{ include_started:false }); }); bind(\'btnCounts\', function() { callApi(\'/xp/board/counts\',\'GET\'); }); bind(\'btnJobs\', function() { callApi(\'/xp/jobs\',\'GET\'); }); bind(\'btnLogs\', function() { callApi(\'/xp/logs\',\'GET\'); }); bind(\'btnSample\', sampleProp); bind(\'btnRunSql\', runManualSql); bind(\'btnClearSql\', clearSql); bind(\'btnSelectSql\', selectSql); bind(\'btnCopy\', copyOutput);\n      originStatus.textContent = fromGithubPages() ? \'GitHub-hosted UI detected. Using CORS-safe hardcoded Worker bridge.\' : \'Worker-hosted UI detected. Using same-origin Worker routes.\';\n      bridgeStatus.textContent = \'API Base: \' + apiBase(); setStatus(\'Ready.\'); show(\'Ready.\');\n    })();\n  </script>\n</body>\n</html>\n';

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
VALUES ('v0.1.6', 'Expansion clean output and worker-origin guard with read-only manual SQL', CURRENT_TIMESTAMP);
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
  const url = new URL(request.url);
  const queryToken = url.searchParams.get('xp_token') || url.searchParams.get('admin_token') || '';
  if (queryToken) return queryToken;
  const auth = request.headers.get('Authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return request.headers.get('X-Admin-Token') || request.headers.get('X-Expansion-Token') || '';
}

function requireAdmin(request, env) {
  const validTokens = [env.EXPANSION_ADMIN_TOKEN, env.INGEST_TOKEN, EMBEDDED_EXPANSION_ADMIN_TOKEN].filter(Boolean);
  const got = tokenFromRequest(request);
  if (got && validTokens.includes(got)) return { ok: true };
  return { ok: false, error: 'Unauthorized expansion admin request. The control room must be deployed from the matching v0.1.6 build.' };
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
