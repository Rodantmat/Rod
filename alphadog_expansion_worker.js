const SYSTEM_VERSION = 'v0.1.14 - Phase 1 Internal Score Scaffold';
const EMBEDDED_EXPANSION_ADMIN_TOKEN = 'alphadog-xp-v014-admin-1a9e5c7b-6b2d-44f6-8bb3-e2c14d0f7b91';
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

const CONTROL_ROOM_HTML = "<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\" />\n  <title>AlphaDog Expansion Control Room</title>\n  <style>\n    :root { color-scheme: dark; --bg:#070b11; --panel:#050505; --line:#2a3340; --green:#59ff92; --muted:#aab0bb; --purple:#6d35d9; --gold:#c89119; --teal:#0d756e; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }\n    * { box-sizing:border-box; }\n    body { margin:0; background:var(--bg); color:var(--green); font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }\n    main { width:100%; max-width:1040px; margin:0 auto; padding:16px 12px 30px; }\n    h1 { color:#19ff82; margin:0; font-size:24px; line-height:1.12; letter-spacing:.7px; text-transform:uppercase; font-weight:900; }\n    h2 { color:#f7f2ea; margin:0 0 10px; font-size:18px; letter-spacing:.7px; text-transform:uppercase; }\n    .version { color:#bff7cc; font-size:14px; line-height:1.3; margin-top:8px; font-weight:700; }\n    .top { padding-bottom:14px; border-bottom:2px solid var(--line); }\n    .section { padding:14px 0; border-bottom:2px solid var(--line); }\n    .desc { margin:0 0 10px; color:var(--green); font-size:16px; line-height:1.35; }\n    .small { color:var(--muted); font-size:13px; line-height:1.35; margin:8px 0 0; }\n    .status { color:#f7f2ea; border:2px solid var(--line); border-radius:9px; background:#101010; padding:8px 10px; margin-top:10px; min-height:36px; font-size:13px; line-height:1.3; }\n    .button-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:12px; }\n    .sql-buttons { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:8px; }\n    button { border:0; border-radius:9px; padding:8px 7px; color:white; background:var(--purple); font-size:14px; font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif; min-height:42px; cursor:pointer; font-weight:700; }\n    button.gold { background:var(--gold); }\n    button.green { background:#188336; }\n    button.teal { background:var(--teal); }\n    button.full { width:100%; margin-top:10px; letter-spacing:1.6px; text-transform:uppercase; min-height:44px; }\n    button:active { transform:translateY(1px); }\n    select, textarea { width:100%; border:2px solid var(--line); border-radius:9px; background:#101010; color:var(--green); font-family:inherit; font-size:14px; outline:none; }\n    select { padding:10px; min-height:42px; }\n    textarea { min-height:118px; max-height:260px; padding:10px; line-height:1.32; resize:vertical; }\n    pre { white-space:pre-wrap; word-break:break-word; background:var(--panel); color:var(--green); border:2px solid var(--line); border-radius:9px; padding:10px; min-height:185px; max-height:520px; overflow:auto; font-size:13.5px; line-height:1.3; margin:0; }\n    .sample-row { display:grid; grid-template-columns:1fr 1fr; gap:8px; align-items:end; }\n    .pill { border:2px solid var(--line); border-radius:9px; background:#111; color:var(--muted); padding:9px; font-size:12.5px; line-height:1.35; }\n    @media (min-width:760px) { main { padding:18px 16px 34px; } .button-grid { grid-template-columns:repeat(6,minmax(0,1fr)); } .sample-row { grid-template-columns:1fr 180px; } pre { max-height:620px; } }\n    @media (max-width:390px) { h1 { font-size:22px; } button { font-size:13px; min-height:40px; } .button-grid, .sql-buttons { gap:7px; } pre { font-size:13px; } }\n  </style>\n</head>\n<body>\n  <main>\n    <div class=\"top\">\n      <h1>AlphaDog Expansion Control Room</h1>\n      <div class=\"version\">v0.1.14 - Phase 1 Internal Score Scaffold</div>\n      <div class=\"small\" id=\"originStatus\">Starting UI...</div>\n      <div class=\"status\" id=\"actionStatus\">Ready.</div>\n    </div>\n\n    <section class=\"section\">\n      <p class=\"desc\">Isolated expansion room. Reads the current PrizePicks board. Writes only to xp_* tables. Bridge/context prep plus internal-only Phase 1 score scaffold. Production scoring and Main UI stay untouched. No market/final betting score yet.</p>\n      <div class=\"pill\" id=\"bridgeStatus\">Worker bridge loading...</div>\n      <div class=\"button-grid\">\n        <button id=\"btnHealth\">Health</button>\n        <button id=\"btnSchema\" class=\"gold\">Apply Schema</button>\n        <button id=\"btnRefresh\">Refresh Board</button>\n        <button id=\"btnCounts\">Counts</button>\n        <button id=\"btnBridgeBuild\" class=\"green\">Build Bridge</button>\n        <button id=\"btnBridgeCounts\" class=\"teal\">Bridge Counts</button>\n        <button id=\"btnBridgeUnmatched\">Unmatched</button>\n        <button id=\"btnBridgeSample\">Bridge Sample</button>\n        <button id=\"btnContextBuild\" class=\"green\">Build Context</button>\n        <button id=\"btnContextCounts\" class=\"teal\">Context Counts</button>\n        <button id=\"btnContextMissing\">Missing Metrics</button>\n        <button id=\"btnContextComplete\">Completeness</button>\n        <button id=\"btnContextSample\">Context Sample</button>\n        <button id=\"btnScoreBuild\" class=\"green\">Build Score</button>\n        <button id=\"btnScoreCounts\" class=\"teal\">Score Counts</button>\n        <button id=\"btnScoreSample\">Score Sample</button>\n        <button id=\"btnJobs\">Jobs</button>\n        <button id=\"btnLogs\">Logs</button>\n      </div>\n    </section>\n\n    <section class=\"section\">\n      <h2>Sample Prop</h2>\n      <div class=\"sample-row\">\n        <select id=\"sampleProp\"><option>Hitter Strikeouts</option><option>Walks</option><option>Singles</option><option>Doubles</option><option>Home Runs</option><option>Runs</option><option>Hits+Runs+RBIs</option><option>Hitter Fantasy Score</option><option>Triples</option><option>Stolen Bases</option><option>Hits</option><option>Total Bases</option><option>RBIs</option></select>\n        <button id=\"btnSample\">Load Sample</button>\n      </div>\n    </section>\n\n    <section class=\"section\">\n      <h2>Manual SQL</h2>\n      <p class=\"small\">Read-only guard active. Supports SELECT, WITH, and PRAGMA. Use bridge/context buttons for xp_* prep diagnostics.</p>\n      <textarea id=\"manualSql\">SELECT stat_type, odds_type, target_status, expansion_phase, COUNT(*) AS rows_count, MIN(line_score) AS min_line, MAX(line_score) AS max_line FROM xp_prop_lines_current GROUP BY stat_type, odds_type, target_status, expansion_phase ORDER BY expansion_phase ASC, stat_type ASC, odds_type ASC LIMIT 100</textarea>\n      <div class=\"sql-buttons\"><button id=\"btnRunSql\" class=\"gold\">Run SQL</button><button id=\"btnClearSql\">Clear SQL</button><button id=\"btnSelectSql\">Select SQL</button></div>\n    </section>\n\n    <section class=\"section\" id=\"outputSection\"><pre id=\"output\">Ready.</pre><button id=\"btnCopy\" class=\"full\">COPY OUTPUT</button></section>\n  </main>\n\n  <script>\n    (function() {\n      'use strict';\n      var VERSION = \"v0.1.14 - Phase 1 Internal Score Scaffold\";\n      var HARD_CODED_WORKER_BASE = \"https://alphadog-expansion-v001.rodolfoaamattos.workers.dev\";\n      var EMBEDDED_TOKEN = \"alphadog-xp-v014-admin-1a9e5c7b-6b2d-44f6-8bb3-e2c14d0f7b91\";\n      var OUTPUT_CHAR_LIMIT = 120000;\n      var DEFAULT_SQL_MAX_ROWS = 500;\n      var output = document.getElementById('output');\n      var outputSection = document.getElementById('outputSection');\n      var originStatus = document.getElementById('originStatus');\n      var bridgeStatus = document.getElementById('bridgeStatus');\n      var actionStatus = document.getElementById('actionStatus');\n      function fromGithubPages() { return /(^|\\.)github\\.io$/i.test(location.hostname); }\n      function apiBase() { return fromGithubPages() ? HARD_CODED_WORKER_BASE : location.origin; }\n      function withToken(path) { return path + (path.indexOf('?') >= 0 ? '&' : '?') + 'xp_token=' + encodeURIComponent(EMBEDDED_TOKEN); }\n      function apiUrl(path) { return apiBase().replace(/\\/$/, '') + withToken(path); }\n      var ACTION_META = {\n        '/xp/health':'Health / handleHealth',\n        '/xp/schema/apply':'Apply Schema / handleApplySchema',\n        '/xp/board/refresh':'Refresh Board / handleRefreshBoard',\n        '/xp/board/counts':'Counts / handleCounts',\n        '/xp/bridge/build':'Build Bridge / handleBuildGameBridge',\n        '/xp/bridge/counts':'Bridge Counts / handleBridgeCounts',\n        '/xp/bridge/unmatched':'Unmatched / handleBridgeUnmatched',\n        '/xp/bridge/sample':'Bridge Sample / handleBridgeSample',\n        '/xp/context/build':'Build Context / handleBuildPhase1Context',\n        '/xp/context/counts':'Context Counts / handleContextCounts',\n        '/xp/context/missing-metrics':'Missing Metrics / handleContextMissingMetrics',\n        '/xp/context/completeness':'Completeness / handleContextCompleteness',\n        '/xp/context/sample':'Context Sample / handleContextSample',\n        '/xp/score/build':'Build Score / handleBuildPhase1Score',\n        '/xp/score/counts':'Score Counts / handleScoreCounts',\n        '/xp/score/sample':'Score Sample / handleScoreSample',\n        '/xp/jobs':'Jobs / handleJobs',\n        '/xp/logs':'Logs / handleLogs',\n        '/xp/manual-sql':'Manual SQL / handleManualSql'\n      };\n      function actionLabel(path) { var clean = String(path || '').split('?')[0]; return ACTION_META[clean] || ('Load Sample / handleSampleProp'); }\n      function setStatus(msg) { actionStatus.textContent = msg; }\n      function jumpOutput() { setTimeout(function() { var copy = document.getElementById('btnCopy'); if (copy) copy.scrollIntoView({ behavior:'smooth', block:'end' }); else outputSection.scrollIntoView({ behavior:'smooth', block:'end' }); }, 80); }\n      function safeText(value) {\n        var s = String(value == null ? '' : value);\n        if (s.indexOf('There isn') !== -1 && s.indexOf('GitHub Pages') !== -1) return JSON.stringify({ ok:false, connection_issue:'WRONG_ORIGIN_OR_BAD_WORKER_URL', diagnosis:'Request returned GitHub Pages 404 HTML instead of Worker JSON. The UI is working; the Worker URL/deployment/route is wrong.', worker_base:apiBase() }, null, 2);\n        if (/^\\s*</.test(s)) return JSON.stringify({ ok:false, connection_issue:'HTML_RESPONSE_NOT_JSON', http_preview:s.replace(/<[^>]*>/g,' ').replace(/\\s+/g,' ').trim().slice(0,900), worker_base:apiBase() }, null, 2);\n        return s.length > OUTPUT_CHAR_LIMIT ? s.slice(0, OUTPUT_CHAR_LIMIT) + '\\n...[truncated by control room output lens at ' + OUTPUT_CHAR_LIMIT + ' chars]' : s;\n      }\n      function show(data) { if (typeof data === 'string') output.textContent = safeText(data); else output.textContent = safeText(JSON.stringify(data, null, 2)); }\n      async function callApi(path, method, body) {\n        var label = actionLabel(path);\n        setStatus('Running ' + label);\n        show({ action:label.split(' / ')[0], function_name:label.split(' / ')[1], route:path, method:method, version:VERSION, worker_base:apiBase(), status:'RUNNING' });\n        jumpOutput();\n        try {\n          var opts = { method:method };\n          if (method === 'POST') { opts.headers = { 'Content-Type':'text/plain;charset=UTF-8' }; opts.body = JSON.stringify(body || {}); }\n          var res = await fetch(apiUrl(path), opts);\n          var text = await res.text();\n          var response;\n          try { response = JSON.parse(text); } catch(e) { response = safeText(text); }\n          show({ action:label.split(' / ')[0], function_name:label.split(' / ')[1], route:path, http_status:res.status, version:VERSION, worker_base:apiBase(), response:response });\n          jumpOutput();\n          setStatus('Finished ' + label + ' \u2022 HTTP ' + res.status);\n        } catch(err) {\n          show({ ok:false, action:label.split(' / ')[0], function_name:label.split(' / ')[1], route:path, version:VERSION, worker_base:apiBase(), error:String(err && err.message ? err.message : err), diagnosis:'Network/CORS/route failure. UI buttons are bound. Confirm the Worker is deployed at the hardcoded worker_base and workers.dev route is active.' });\n          jumpOutput();\n          setStatus('Failed ' + label);\n        }\n      }\n      function clearSql() { document.getElementById('manualSql').value = ''; setStatus('SQL box cleared. Output preserved.'); }\n      function selectSql() { var el = document.getElementById('manualSql'); el.focus(); el.select(); setStatus('SQL selected. Output preserved.'); }\n      function runManualSql() { callApi('/xp/manual-sql','POST',{ sql:document.getElementById('manualSql').value || '', max_rows:DEFAULT_SQL_MAX_ROWS }); }\n      function sampleProp() { callApi('/xp/board/sample?stat_type=' + encodeURIComponent(document.getElementById('sampleProp').value) + '&limit=100','GET'); }\n      async function copyOutput() { try { await navigator.clipboard.writeText(output.textContent || ''); setStatus('Output copied. Output preserved.'); } catch(err) { setStatus('Copy failed. Long-press/select the output manually.'); } }\n      function bind(id, fn) { var el = document.getElementById(id); if (el) el.addEventListener('click', fn); }\n      bind('btnHealth', function() { callApi('/xp/health','GET'); });\n      bind('btnSchema', function() { callApi('/xp/schema/apply','POST'); });\n      bind('btnRefresh', function() { callApi('/xp/board/refresh','POST',{ include_started:false }); });\n      bind('btnCounts', function() { callApi('/xp/board/counts','GET'); });\n      bind('btnBridgeBuild', function() { callApi('/xp/bridge/build','POST',{ expansion_phase:1, time_tolerance_minutes:15 }); });\n      bind('btnBridgeCounts', function() { callApi('/xp/bridge/counts','GET'); });\n      bind('btnBridgeUnmatched', function() { callApi('/xp/bridge/unmatched','GET'); });\n      bind('btnBridgeSample', function() { callApi('/xp/bridge/sample?limit=100','GET'); });\n      bind('btnContextBuild', function() { callApi('/xp/context/build','POST',{ expansion_phase:1 }); });\n      bind('btnContextCounts', function() { callApi('/xp/context/counts','GET'); });\n      bind('btnContextMissing', function() { callApi('/xp/context/missing-metrics','GET'); });\n      bind('btnContextComplete', function() { callApi('/xp/context/completeness','GET'); });\n      bind('btnContextSample', function() { callApi('/xp/context/sample?limit=100','GET'); });\n      bind('btnScoreBuild', function() { callApi('/xp/score/build','POST',{ expansion_phase:1 }); });\n      bind('btnScoreCounts', function() { callApi('/xp/score/counts','GET'); });\n      bind('btnScoreSample', function() { callApi('/xp/score/sample?limit=100','GET'); });\n      bind('btnJobs', function() { callApi('/xp/jobs','GET'); });\n      bind('btnLogs', function() { callApi('/xp/logs','GET'); });\n      bind('btnSample', sampleProp);\n      bind('btnRunSql', runManualSql);\n      bind('btnClearSql', clearSql);\n      bind('btnSelectSql', selectSql);\n      bind('btnCopy', copyOutput);\n      originStatus.textContent = fromGithubPages() ? 'GitHub-hosted UI detected. Using CORS-safe hardcoded Worker bridge.' : 'Worker-hosted UI detected. Using same-origin Worker routes.';\n      bridgeStatus.textContent = 'API Base: ' + apiBase(); setStatus('Ready.'); show('Ready.');\n    })();\n  </script>\n</body>\n</html>\n";

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

CREATE TABLE IF NOT EXISTS xp_team_alias_map (
  alias_team TEXT PRIMARY KEY,
  canonical_team TEXT NOT NULL,
  notes TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_xp_team_alias_canonical ON xp_team_alias_map(canonical_team);
CREATE TABLE IF NOT EXISTS xp_game_bridge_current (
  xp_line_key TEXT PRIMARY KEY,
  stat_type TEXT,
  player_name TEXT,
  original_team TEXT,
  original_opponent TEXT,
  normalized_team TEXT,
  normalized_opponent TEXT,
  slate_date TEXT,
  pp_start_time TEXT,
  pp_start_time_utc TEXT,
  game_id TEXT,
  away_team TEXT,
  home_team TEXT,
  game_start_time_utc TEXT,
  time_diff_minutes REAL,
  match_status TEXT NOT NULL,
  match_method TEXT,
  candidate_count INTEGER DEFAULT 0,
  clean_match_count INTEGER DEFAULT 0,
  warning TEXT,
  built_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_xp_bridge_status ON xp_game_bridge_current(match_status, stat_type);
CREATE INDEX IF NOT EXISTS idx_xp_bridge_game ON xp_game_bridge_current(game_id);
CREATE INDEX IF NOT EXISTS idx_xp_bridge_pair ON xp_game_bridge_current(normalized_team, normalized_opponent, slate_date);

CREATE TABLE IF NOT EXISTS xp_phase1_player_metrics_current (
  xp_line_key TEXT PRIMARY KEY,
  stat_type TEXT,
  player_name TEXT,
  normalized_player_name TEXT,
  team TEXT,
  normalized_team TEXT,
  opponent TEXT,
  normalized_opponent TEXT,
  line_score REAL,
  odds_type TEXT,
  line_type_warning TEXT,
  player_id INTEGER,
  metric_player_name TEXT,
  metric_team_id TEXT,
  metric_normalized_team TEXT,
  season INTEGER,
  games_logged INTEGER,
  first_game_date TEXT,
  last_game_date TEXT,
  total_pa INTEGER,
  total_ab INTEGER,
  total_walks INTEGER,
  total_strikeouts INTEGER,
  last3_games INTEGER,
  last5_games INTEGER,
  last10_games INTEGER,
  last20_games INTEGER,
  season_k_rate REAL,
  season_bb_rate REAL,
  metric_match_status TEXT NOT NULL,
  metric_warning TEXT,
  source_confidence TEXT,
  source_updated_at TEXT,
  built_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_xp_p1_metrics_status ON xp_phase1_player_metrics_current(metric_match_status, stat_type);
CREATE INDEX IF NOT EXISTS idx_xp_p1_metrics_player ON xp_phase1_player_metrics_current(normalized_player_name, normalized_team);

CREATE TABLE IF NOT EXISTS xp_phase1_game_context_current (
  xp_line_key TEXT PRIMARY KEY,
  stat_type TEXT,
  player_name TEXT,
  normalized_player_name TEXT,
  team TEXT,
  opponent TEXT,
  normalized_team TEXT,
  normalized_opponent TEXT,
  line_score REAL,
  odds_type TEXT,
  line_type_warning TEXT,
  start_time TEXT,
  slate_date TEXT,
  game_id TEXT,
  away_team TEXT,
  home_team TEXT,
  venue TEXT,
  game_status TEXT,
  game_start_time_utc TEXT,
  bridge_match_status TEXT,
  bridge_match_method TEXT,
  time_diff_minutes REAL,
  lineup_slot INTEGER,
  lineup_bats TEXT,
  lineup_k_rate REAL,
  lineup_is_confirmed INTEGER,
  lineup_source TEXT,
  lineup_confidence TEXT,
  lineup_match_status TEXT,
  starter_name TEXT,
  starter_throws TEXT,
  starter_era REAL,
  starter_whip REAL,
  starter_strikeouts INTEGER,
  starter_walks INTEGER,
  starter_innings_pitched REAL,
  starter_days_rest INTEGER,
  starter_source TEXT,
  starter_confidence TEXT,
  starter_match_status TEXT,
  player_id INTEGER,
  metric_team_id TEXT,
  total_pa INTEGER,
  total_walks INTEGER,
  total_strikeouts INTEGER,
  season_k_rate REAL,
  season_bb_rate REAL,
  metric_match_status TEXT,
  context_status TEXT NOT NULL,
  warning_flags TEXT,
  built_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_xp_p1_context_status ON xp_phase1_game_context_current(context_status, stat_type);
CREATE INDEX IF NOT EXISTS idx_xp_p1_context_game ON xp_phase1_game_context_current(game_id, normalized_team);
CREATE INDEX IF NOT EXISTS idx_xp_p1_context_flags ON xp_phase1_game_context_current(lineup_match_status, starter_match_status, metric_match_status);


CREATE TABLE IF NOT EXISTS xp_phase1_score_current (
  xp_line_key TEXT PRIMARY KEY,
  stat_type TEXT,
  player_name TEXT,
  team TEXT,
  opponent TEXT,
  line_score REAL,
  odds_type TEXT,
  game_id TEXT,
  visible_side TEXT,
  internal_score_0_100 REAL,
  internal_grade TEXT,
  score_status TEXT NOT NULL,
  score_cap REAL,
  base_component REAL,
  player_component REAL,
  starter_component REAL,
  lineup_component REAL,
  line_component REAL,
  warning_component REAL,
  reliability_component REAL,
  season_k_rate REAL,
  season_bb_rate REAL,
  starter_k_per_ip REAL,
  starter_bb_per_ip REAL,
  lineup_slot INTEGER,
  context_status TEXT,
  warning_flags TEXT,
  score_notes TEXT,
  built_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_xp_p1_score_status ON xp_phase1_score_current(score_status, stat_type);
CREATE INDEX IF NOT EXISTS idx_xp_p1_score_grade ON xp_phase1_score_current(internal_grade, stat_type, internal_score_0_100);
CREATE INDEX IF NOT EXISTS idx_xp_p1_score_game ON xp_phase1_score_current(game_id, team);

INSERT OR REPLACE INTO xp_team_alias_map(alias_team, canonical_team, notes, updated_at) VALUES
('ATH','OAK','PrizePicks Athletics alias to games table Oakland alias',CURRENT_TIMESTAMP),
('OAK','OAK','Identity alias',CURRENT_TIMESTAMP),
('AZ','ARI','PrizePicks Arizona alias to games table ARI alias',CURRENT_TIMESTAMP),
('ARI','ARI','Identity alias',CURRENT_TIMESTAMP),
('WSH','WSN','PrizePicks Washington alias to games table WSN alias',CURRENT_TIMESTAMP),
('WSN','WSN','Identity alias',CURRENT_TIMESTAMP),
('SFG','SF','Common Giants alias',CURRENT_TIMESTAMP),
('SF','SF','Identity alias',CURRENT_TIMESTAMP),
('CHW','CWS','Common White Sox alias',CURRENT_TIMESTAMP),
('CWS','CWS','Identity alias',CURRENT_TIMESTAMP),
('SDP','SD','Common Padres alias',CURRENT_TIMESTAMP),
('SD','SD','Identity alias',CURRENT_TIMESTAMP),
('TBR','TB','Common Rays alias',CURRENT_TIMESTAMP),
('TB','TB','Identity alias',CURRENT_TIMESTAMP),
('KCR','KC','Common Royals alias',CURRENT_TIMESTAMP),
('KC','KC','Identity alias',CURRENT_TIMESTAMP),
('LAD','LAD','Identity alias',CURRENT_TIMESTAMP),
('LAA','LAA','Identity alias',CURRENT_TIMESTAMP),
('NYY','NYY','Identity alias',CURRENT_TIMESTAMP),
('NYM','NYM','Identity alias',CURRENT_TIMESTAMP),
('BOS','BOS','Identity alias',CURRENT_TIMESTAMP),
('BAL','BAL','Identity alias',CURRENT_TIMESTAMP),
('TOR','TOR','Identity alias',CURRENT_TIMESTAMP),
('MIA','MIA','Identity alias',CURRENT_TIMESTAMP),
('PHI','PHI','Identity alias',CURRENT_TIMESTAMP),
('PIT','PIT','Identity alias',CURRENT_TIMESTAMP),
('STL','STL','Identity alias',CURRENT_TIMESTAMP),
('CHC','CHC','Identity alias',CURRENT_TIMESTAMP),
('CIN','CIN','Identity alias',CURRENT_TIMESTAMP),
('CLE','CLE','Identity alias',CURRENT_TIMESTAMP),
('DET','DET','Identity alias',CURRENT_TIMESTAMP),
('MIN','MIN','Identity alias',CURRENT_TIMESTAMP),
('TEX','TEX','Identity alias',CURRENT_TIMESTAMP),
('HOU','HOU','Identity alias',CURRENT_TIMESTAMP),
('SEA','SEA','Identity alias',CURRENT_TIMESTAMP),
('MIL','MIL','Identity alias',CURRENT_TIMESTAMP),
('COL','COL','Identity alias',CURRENT_TIMESTAMP),
('ATL','ATL','Identity alias',CURRENT_TIMESTAMP);
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
VALUES ('v0.1.14', 'Phase 1 internal score scaffold - isolated xp score read-model only', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO xp_prop_definitions(stat_type, prop_family, expansion_phase, target_status, complexity_tier, source_scope, scoring_status, notes, updated_at) VALUES
('Hitter Strikeouts', 'HITTER_STRIKEOUTS', 1, 'READY_PHASE_1', 'LOW', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'First expansion scoring target. Simple count prop with strong board volume.', CURRENT_TIMESTAMP),
('Walks', 'WALKS', 1, 'READY_PHASE_1', 'LOW', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'Second expansion scoring target. Simple count prop.', CURRENT_TIMESTAMP),
('Singles', 'SINGLES', 2, 'READY_PHASE_2', 'MEDIUM', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'Component prop for total bases and fantasy score.', CURRENT_TIMESTAMP),
('Doubles', 'DOUBLES', 2, 'READY_PHASE_2', 'MEDIUM', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'Component prop for total bases and fantasy score.', CURRENT_TIMESTAMP),
('Home Runs', 'HOME_RUNS', 2, 'READY_PHASE_2', 'MEDIUM_HIGH', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'Component prop - weather/park context later.', CURRENT_TIMESTAMP),
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


function normalizeTeamCode(value) {
  const v = String(value || '').trim().toUpperCase();
  const map = {
    ATH: 'OAK', OAK: 'OAK',
    AZ: 'ARI', ARI: 'ARI',
    WSH: 'WSN', WSN: 'WSN',
    SFG: 'SF', SF: 'SF',
    CHW: 'CWS', CWS: 'CWS',
    SDP: 'SD', SD: 'SD',
    TBR: 'TB', TB: 'TB',
    KCR: 'KC', KC: 'KC'
  };
  return map[v] || v;
}

function normalizePersonName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function rate(numerator, denominator) {
  const n = numberOrNull(numerator);
  const d = numberOrNull(denominator);
  if (n === null || d === null || d <= 0) return null;
  return Math.round((n / d) * 10000) / 10000;
}

function compactFlags(flags) {
  return flags.filter(Boolean).join('|') || null;
}


function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function round2(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function inningsToNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const s = String(value);
  if (s.includes('.')) {
    const [whole, frac] = s.split('.');
    const outs = Number(frac || 0);
    return Number(whole || 0) + (outs > 0 ? outs / 3 : 0);
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function gradeInternalScore(score, status) {
  if (status !== 'SCORED_INTERNAL') return 'BLOCKED';
  if (score >= 74) return 'WATCH_HIGH_INTERNAL';
  if (score >= 64) return 'WATCH_MEDIUM_INTERNAL';
  if (score >= 54) return 'LEAN_INTERNAL';
  return 'LOW_INTERNAL';
}

function lineComponentFor(statType, lineScore) {
  const line = Number(lineScore);
  if (!Number.isFinite(line)) return -8;
  if (statType === 'Hitter Strikeouts') {
    if (line <= 0.5) return 16;
    if (line <= 1.5) return 0;
    if (line <= 2.5) return -18;
    return -30;
  }
  if (statType === 'Walks') {
    if (line <= 0.5) return 10;
    if (line <= 1.5) return -12;
    return -25;
  }
  return 0;
}

function lineupComponent(slot) {
  const n = Number(slot);
  if (!Number.isFinite(n)) return -4;
  if (n <= 3) return 6;
  if (n <= 5) return 4;
  if (n <= 7) return 2;
  return 0;
}

function reliabilityComponent(totalPa) {
  const n = Number(totalPa);
  if (!Number.isFinite(n)) return -12;
  if (n >= 120) return 10;
  if (n >= 80) return 7;
  if (n >= 40) return 4;
  return 1;
}

function scorePhase1ContextRow(row) {
  const flags = String(row.warning_flags || '').split('|').filter(Boolean);
  const isStandard = String(row.odds_type || '').toLowerCase() === 'standard';
  const scoreCap = isStandard ? 100 : (String(row.odds_type || '').toLowerCase() === 'goblin' ? 82 : 78);
  const lineComp = lineComponentFor(row.stat_type, row.line_score);
  const lineupComp = lineupComponent(row.lineup_slot);
  const reliabilityComp = reliabilityComponent(row.total_pa);
  const warningComp = -1 * flags.filter((f) => ['MISSING_LINEUP','NON_STANDARD_LINE_TYPE'].includes(f)).length * 3;
  const ip = inningsToNumber(row.starter_innings_pitched);
  const starterKPerIp = ip && ip > 0 ? round2(Number(row.starter_strikeouts || 0) / ip) : null;
  const starterBbPerIp = ip && ip > 0 ? round2(Number(row.starter_walks || 0) / ip) : null;
  const missingMetrics = row.metric_match_status !== 'MATCHED_NAME_TEAM' && row.metric_match_status !== 'MATCHED_NAME_ONLY_TEAM_MISMATCH';
  const missingBridge = !String(row.bridge_match_status || '').startsWith('MATCHED');
  const missingStarter = row.starter_match_status !== 'MATCHED_STARTER';
  if (missingBridge || missingMetrics || missingStarter) {
    const blocked = [];
    if (missingBridge) blocked.push('NO_CLEAN_GAME_BRIDGE');
    if (missingMetrics) blocked.push('MISSING_PLAYER_METRICS');
    if (missingStarter) blocked.push('MISSING_STARTER_CONTEXT');
    return {
      visible_side: 'NO_SIDE_DECISION_INTERNAL_CONTEXT_ONLY',
      internal_score_0_100: null,
      internal_grade: 'BLOCKED',
      score_status: 'BLOCKED_CONTEXT_INCOMPLETE',
      score_cap: scoreCap,
      base_component: 50,
      player_component: null,
      starter_component: null,
      lineup_component: lineupComp,
      line_component: lineComp,
      warning_component: warningComp,
      reliability_component: reliabilityComp,
      starter_k_per_ip: starterKPerIp,
      starter_bb_per_ip: starterBbPerIp,
      score_notes: blocked.join('|')
    };
  }
  let playerComp = 0;
  let starterComp = 0;
  if (row.stat_type === 'Hitter Strikeouts') {
    const kRate = Number(row.season_k_rate || 0);
    playerComp = (kRate - 0.22) * 140;
    if (starterKPerIp !== null) starterComp += starterKPerIp >= 1 ? 8 : starterKPerIp >= 0.8 ? 4 : starterKPerIp <= 0.55 ? -5 : 0;
  } else if (row.stat_type === 'Walks') {
    const bbRate = Number(row.season_bb_rate || 0);
    playerComp = (bbRate - 0.09) * 220;
    if (starterBbPerIp !== null) starterComp += starterBbPerIp >= 0.45 ? 10 : starterBbPerIp >= 0.35 ? 6 : starterBbPerIp <= 0.2 ? -5 : 0;
  }
  let raw = 50 + playerComp + starterComp + lineupComp + lineComp + warningComp + reliabilityComp;
  let capped = Math.min(raw, scoreCap);
  const finalScore = round2(clampNumber(capped, 0, 100));
  return {
    visible_side: 'OVER_ONLY_VISIBLE_BOARD_LINE_INTERNAL',
    internal_score_0_100: finalScore,
    internal_grade: gradeInternalScore(finalScore, 'SCORED_INTERNAL'),
    score_status: 'SCORED_INTERNAL',
    score_cap: scoreCap,
    base_component: 50,
    player_component: round2(playerComp),
    starter_component: round2(starterComp),
    lineup_component: lineupComp,
    line_component: lineComp,
    warning_component: warningComp,
    reliability_component: reliabilityComp,
    starter_k_per_ip: starterKPerIp,
    starter_bb_per_ip: starterBbPerIp,
    score_notes: isStandard ? 'STANDARD_LINE_INTERNAL_ONLY_NO_MARKET_ODDS' : 'NON_STANDARD_LINE_VARIANT_INTERNAL_ONLY_NO_UNDER_CREATED'
  };
}

async function batchRun(db, statements, chunkSize = 50) {
  for (let i = 0; i < statements.length; i += chunkSize) {
    await db.batch(statements.slice(i, i + chunkSize));
  }
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
  return { ok: false, error: 'Unauthorized expansion admin request. Use the matching embedded expansion control room or include xp_token/admin token.' };
}

async function log(db, runId, level, message, details = null) {
  try {
    await db.prepare(`INSERT INTO xp_job_logs(log_id, run_id, level, message, details_json) VALUES (?, ?, ?, ?, ?)`)
      .bind(makeId('log'), runId, level, message, details ? JSON.stringify(details) : null)
      .run();
  } catch (_) {}
}

function getSchemaStatements() {
  return SCHEMA_SQL
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function applySchema(env) {
  const statements = getSchemaStatements();
  const applied = [];
  for (let i = 0; i < statements.length; i += 1) {
    const statement = statements[i];
    try {
      await env.DB.prepare(statement).run();
      applied.push({ index: i + 1, ok: true, preview: statement.slice(0, 90) });
    } catch (err) {
      return {
        ok: false,
        version: SYSTEM_VERSION,
        function_name: 'handleApplySchema',
        route: '/xp/schema/apply',
        error: err && err.message ? err.message : String(err),
        failed_statement_index: i + 1,
        failed_statement_preview: statement.slice(0, 500),
        statements_attempted: statements.length,
        applied_before_failure: applied.length
      };
    }
  }
  return {
    ok: true,
    version: SYSTEM_VERSION,
    function_name: 'handleApplySchema',
    route: '/xp/schema/apply',
    schema: 'xp_* isolated schema applied',
    statement_runner: 'individual_prepare_run_no_exec_multistatement',
    statements_applied: applied.length
  };
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
      `p.is_current = 1`,
      `COALESCE(p.is_stale, 0) = 0`,
      `COALESCE(p.status, 'ACTIVE') = 'ACTIVE'`,
      `COALESCE(p.is_supported_single, 1) = 1`,
      `p.stat_type IN (${statPlaceholders})`
    ];
    const params = [...TARGET_STAT_TYPES];
    if (!includeStarted) baseWhere.push(`datetime(p.start_time) > datetime('now')`);
    if (slateDate) {
      baseWhere.push(`p.slate_date = ?`);
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


async function buildGameBridge(env, body = {}) {
  const runId = makeId('xp_bridge');
  const phase = Math.max(1, Math.min(Number(body?.expansion_phase) || 1, 9));
  const tolerance = Math.max(1, Math.min(Number(body?.time_tolerance_minutes) || 15, 60));
  await applySchema(env);
  await env.DB.prepare(`INSERT INTO xp_job_runs(run_id, job_name, status, source_table) VALUES (?, 'build_phase1_game_bridge', 'RUNNING', 'xp_prop_lines_current')`)
    .bind(runId)
    .run();
  try {
    const before = await env.DB.prepare(`SELECT COUNT(*) AS c FROM xp_game_bridge_current`).first();
    await env.DB.prepare(`DELETE FROM xp_game_bridge_current`).run();
    const sql = `
      INSERT INTO xp_game_bridge_current (
        xp_line_key, stat_type, player_name, original_team, original_opponent,
        normalized_team, normalized_opponent, slate_date, pp_start_time, pp_start_time_utc,
        game_id, away_team, home_team, game_start_time_utc, time_diff_minutes,
        match_status, match_method, candidate_count, clean_match_count, warning, built_at
      )
      WITH phase_lines AS (
        SELECT
          x.xp_line_key,
          x.stat_type,
          x.player_name,
          x.team AS original_team,
          x.opponent AS original_opponent,
          COALESCE(ta.canonical_team, x.team) AS normalized_team,
          COALESCE(oa.canonical_team, x.opponent) AS normalized_opponent,
          x.slate_date,
          x.start_time AS pp_start_time,
          datetime(x.start_time) AS pp_start_time_utc
        FROM xp_prop_lines_current x
        LEFT JOIN xp_team_alias_map ta ON ta.alias_team = x.team
        LEFT JOIN xp_team_alias_map oa ON oa.alias_team = x.opponent
        WHERE x.expansion_phase = ?
      ),
      candidates AS (
        SELECT
          p.*,
          g.game_id,
          g.away_team,
          g.home_team,
          g.start_time_utc AS game_start_time_utc,
          ABS(ROUND((julianday(datetime(p.pp_start_time)) - julianday(datetime(g.start_time_utc))) * 24.0 * 60.0, 2)) AS time_diff_minutes,
          CASE WHEN p.original_team = p.normalized_team AND p.original_opponent = p.normalized_opponent THEN 'EXACT_TEAM_PAIR' ELSE 'ALIAS_TEAM_PAIR' END AS match_method
        FROM phase_lines p
        JOIN games g
          ON g.game_date = p.slate_date
         AND (
              (g.away_team = p.normalized_team AND g.home_team = p.normalized_opponent)
           OR (g.home_team = p.normalized_team AND g.away_team = p.normalized_opponent)
         )
      ),
      ranked AS (
        SELECT
          c.*,
          COUNT(*) OVER (PARTITION BY c.xp_line_key) AS candidate_count,
          SUM(CASE WHEN c.time_diff_minutes <= ? THEN 1 ELSE 0 END) OVER (PARTITION BY c.xp_line_key) AS clean_match_count,
          ROW_NUMBER() OVER (
            PARTITION BY c.xp_line_key
            ORDER BY CASE WHEN c.time_diff_minutes <= ? THEN 0 ELSE 1 END ASC, c.time_diff_minutes ASC, c.game_id ASC
          ) AS rn
        FROM candidates c
      )
      SELECT
        p.xp_line_key,
        p.stat_type,
        p.player_name,
        p.original_team,
        p.original_opponent,
        p.normalized_team,
        p.normalized_opponent,
        p.slate_date,
        p.pp_start_time,
        p.pp_start_time_utc,
        CASE WHEN r.clean_match_count = 1 THEN r.game_id ELSE NULL END AS game_id,
        CASE WHEN r.clean_match_count = 1 THEN r.away_team ELSE NULL END AS away_team,
        CASE WHEN r.clean_match_count = 1 THEN r.home_team ELSE NULL END AS home_team,
        CASE WHEN r.clean_match_count = 1 THEN r.game_start_time_utc ELSE NULL END AS game_start_time_utc,
        r.time_diff_minutes,
        CASE
          WHEN p.pp_start_time_utc IS NULL THEN 'TIME_PARSE_NULL'
          WHEN r.candidate_count IS NULL THEN 'UNMATCHED'
          WHEN r.clean_match_count = 1 AND r.match_method = 'EXACT_TEAM_PAIR' THEN 'MATCHED_EXACT'
          WHEN r.clean_match_count = 1 AND r.match_method = 'ALIAS_TEAM_PAIR' THEN 'MATCHED_ALIAS'
          WHEN r.clean_match_count = 0 THEN 'TIME_MISMATCH'
          ELSE 'MULTIPLE_MATCHES'
        END AS match_status,
        r.match_method,
        COALESCE(r.candidate_count, 0) AS candidate_count,
        COALESCE(r.clean_match_count, 0) AS clean_match_count,
        CASE
          WHEN p.pp_start_time_utc IS NULL THEN 'PrizePicks start_time did not parse with SQLite datetime().'
          WHEN r.candidate_count IS NULL THEN 'No game found after team/opponent alias normalization.'
          WHEN r.clean_match_count = 0 THEN 'Game pair found but no candidate within tolerance minutes.'
          WHEN r.clean_match_count > 1 THEN 'More than one game candidate within tolerance; unsafe bridge.'
          WHEN r.match_method = 'ALIAS_TEAM_PAIR' THEN 'Matched through xp_team_alias_map.'
          ELSE NULL
        END AS warning,
        CURRENT_TIMESTAMP
      FROM phase_lines p
      LEFT JOIN ranked r ON r.xp_line_key = p.xp_line_key AND r.rn = 1
    `;
    await env.DB.prepare(sql).bind(phase, tolerance, tolerance).run();

    const after = await env.DB.prepare(`SELECT COUNT(*) AS c FROM xp_game_bridge_current`).first();
    const counts = await env.DB.prepare(`
      SELECT match_status, match_method, COUNT(*) AS rows_count
      FROM xp_game_bridge_current
      GROUP BY match_status, match_method
      ORDER BY match_status ASC, match_method ASC
    `).all();
    const unmatchedPairs = await env.DB.prepare(`
      SELECT original_team, original_opponent, normalized_team, normalized_opponent, match_status, COUNT(*) AS rows_count
      FROM xp_game_bridge_current
      WHERE match_status NOT IN ('MATCHED_EXACT','MATCHED_ALIAS')
      GROUP BY original_team, original_opponent, normalized_team, normalized_opponent, match_status
      ORDER BY rows_count DESC
      LIMIT 50
    `).all();
    const details = {
      version: SYSTEM_VERSION,
      expansion_phase: phase,
      time_tolerance_minutes: tolerance,
      deleted_rows: Number(before?.c || 0),
      rows_written: Number(after?.c || 0),
      status_counts: counts.results || [],
      unmatched_pairs: unmatchedPairs.results || []
    };
    await env.DB.prepare(`UPDATE xp_job_runs SET status='COMPLETED', rows_written=?, rows_deleted=?, completed_at=CURRENT_TIMESTAMP, details_json=? WHERE run_id=?`)
      .bind(details.rows_written, details.deleted_rows, JSON.stringify(details), runId)
      .run();
    await log(env.DB, runId, 'INFO', 'Phase 1 game bridge built in isolated xp_game_bridge_current', details);
    return { ok: true, run_id: runId, ...details };
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    await env.DB.prepare(`UPDATE xp_job_runs SET status='ERROR', error=?, completed_at=CURRENT_TIMESTAMP WHERE run_id=?`)
      .bind(message, runId)
      .run();
    await log(env.DB, runId, 'ERROR', 'Bridge build failed', { error: message });
    return { ok: false, run_id: runId, version: SYSTEM_VERSION, error: message };
  }
}

async function getBridgeCounts(env) {
  const rows = await env.DB.prepare(`
    SELECT match_status, match_method, COUNT(*) AS rows_count,
           MIN(time_diff_minutes) AS min_time_diff_minutes,
           MAX(time_diff_minutes) AS max_time_diff_minutes
    FROM xp_game_bridge_current
    GROUP BY match_status, match_method
    ORDER BY match_status ASC, match_method ASC
  `).all();
  const pairs = await env.DB.prepare(`
    SELECT original_team, original_opponent, normalized_team, normalized_opponent, match_status, COUNT(*) AS rows_count
    FROM xp_game_bridge_current
    GROUP BY original_team, original_opponent, normalized_team, normalized_opponent, match_status
    ORDER BY rows_count DESC
    LIMIT 100
  `).all();
  return { ok: true, version: SYSTEM_VERSION, rows: rows.results || [], pairs: pairs.results || [] };
}

async function getBridgeUnmatched(env) {
  const rows = await env.DB.prepare(`
    SELECT original_team, original_opponent, normalized_team, normalized_opponent, match_status, warning, COUNT(*) AS rows_count
    FROM xp_game_bridge_current
    WHERE match_status NOT IN ('MATCHED_EXACT','MATCHED_ALIAS')
    GROUP BY original_team, original_opponent, normalized_team, normalized_opponent, match_status, warning
    ORDER BY rows_count DESC
    LIMIT 100
  `).all();
  const samples = await env.DB.prepare(`
    SELECT xp_line_key, stat_type, player_name, original_team, original_opponent, normalized_team, normalized_opponent,
           slate_date, pp_start_time, pp_start_time_utc, time_diff_minutes, match_status, warning
    FROM xp_game_bridge_current
    WHERE match_status NOT IN ('MATCHED_EXACT','MATCHED_ALIAS')
    ORDER BY match_status ASC, original_team ASC, original_opponent ASC, player_name ASC
    LIMIT 100
  `).all();
  return { ok: true, version: SYSTEM_VERSION, rows: rows.results || [], samples: samples.results || [] };
}

async function getBridgeSample(env, limit = 100) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 200));
  const rows = await env.DB.prepare(`
    SELECT xp_line_key, stat_type, player_name, original_team, original_opponent, normalized_team, normalized_opponent,
           slate_date, pp_start_time, pp_start_time_utc, game_id, away_team, home_team, game_start_time_utc,
           time_diff_minutes, match_status, match_method, warning
    FROM xp_game_bridge_current
    ORDER BY match_status ASC, slate_date ASC, original_team ASC, original_opponent ASC, player_name ASC
    LIMIT ${safeLimit}
  `).all();
  return { ok: true, version: SYSTEM_VERSION, rows: rows.results || [] };
}


async function buildPhase1Context(env, body = {}) {
  const runId = makeId('xp_context');
  const phase = Math.max(1, Math.min(Number(body?.expansion_phase) || 1, 9));
  await applySchema(env);
  await env.DB.prepare(`INSERT INTO xp_job_runs(run_id, job_name, status, source_table) VALUES (?, 'build_phase1_context_snapshot', 'RUNNING', 'xp_prop_lines_current|xp_game_bridge_current')`)
    .bind(runId)
    .run();

  try {
    const beforeMetrics = await env.DB.prepare(`SELECT COUNT(*) AS c FROM xp_phase1_player_metrics_current`).first();
    const beforeContext = await env.DB.prepare(`SELECT COUNT(*) AS c FROM xp_phase1_game_context_current`).first();
    await env.DB.prepare(`DELETE FROM xp_phase1_player_metrics_current`).run();
    await env.DB.prepare(`DELETE FROM xp_phase1_game_context_current`).run();

    const linesRes = await env.DB.prepare(`
      SELECT * FROM xp_prop_lines_current
      WHERE expansion_phase = ?
      ORDER BY slate_date ASC, start_time ASC, stat_type ASC, player_name ASC, xp_line_key ASC
    `).bind(phase).all();
    const lines = linesRes.results || [];

    const metricsRes = await env.DB.prepare(`SELECT * FROM incremental_player_metrics`).all();
    const metricRows = metricsRes.results || [];
    const metricsByName = new Map();
    for (const m of metricRows) {
      const key = normalizePersonName(m.player_name);
      if (!key) continue;
      if (!metricsByName.has(key)) metricsByName.set(key, []);
      metricsByName.get(key).push(m);
    }

    const bridgeRes = await env.DB.prepare(`SELECT * FROM xp_game_bridge_current`).all();
    const bridgeByLine = new Map((bridgeRes.results || []).map((b) => [b.xp_line_key, b]));

    const gamesRes = await env.DB.prepare(`SELECT * FROM games`).all();
    const gamesById = new Map((gamesRes.results || []).map((g) => [g.game_id, g]));

    const lineupRes = await env.DB.prepare(`SELECT * FROM lineups_current`).all();
    const lineupByKey = new Map();
    for (const l of lineupRes.results || []) {
      const key = `${l.game_id}|${normalizeTeamCode(l.team_id)}|${normalizePersonName(l.player_name)}`;
      if (!lineupByKey.has(key)) lineupByKey.set(key, []);
      lineupByKey.get(key).push(l);
    }

    const starterRes = await env.DB.prepare(`SELECT * FROM starters_current`).all();
    const starterByKey = new Map();
    for (const s of starterRes.results || []) {
      const key = `${s.game_id}|${normalizeTeamCode(s.team_id)}`;
      if (!starterByKey.has(key)) starterByKey.set(key, []);
      starterByKey.get(key).push(s);
    }

    const metricInserts = [];
    const contextInserts = [];

    for (const x of lines) {
      const normName = normalizePersonName(x.player_name);
      const normTeam = normalizeTeamCode(x.team);
      const normOpp = normalizeTeamCode(x.opponent);
      const flags = [];
      const lineTypeWarning = x.odds_type && String(x.odds_type).toLowerCase() !== 'standard' ? 'NON_STANDARD_LINE_TYPE' : null;
      if (lineTypeWarning) flags.push(lineTypeWarning);

      const metricCandidates = metricsByName.get(normName) || [];
      let metric = null;
      let metricMatchStatus = 'MISSING_METRICS';
      let metricWarning = null;
      if (metricCandidates.length === 1) {
        metric = metricCandidates[0];
        metricMatchStatus = normalizeTeamCode(metric.team_id) === normTeam ? 'MATCHED_NAME_TEAM' : 'MATCHED_NAME_ONLY_TEAM_MISMATCH';
        if (metricMatchStatus !== 'MATCHED_NAME_TEAM') metricWarning = 'TEAM_ALIAS_OR_TEAM_MISMATCH';
      } else if (metricCandidates.length > 1) {
        const teamMatches = metricCandidates.filter((m) => normalizeTeamCode(m.team_id) === normTeam);
        if (teamMatches.length === 1) {
          metric = teamMatches[0];
          metricMatchStatus = 'MATCHED_NAME_TEAM';
        } else if (teamMatches.length > 1) {
          metricMatchStatus = 'AMBIGUOUS_METRICS_TEAM';
          metricWarning = 'MULTIPLE_METRIC_ROWS_FOR_NAME_TEAM';
        } else {
          metricMatchStatus = 'AMBIGUOUS_METRICS_NAME';
          metricWarning = 'MULTIPLE_METRIC_ROWS_FOR_NAME_NO_TEAM_MATCH';
        }
      }
      if (!metric) flags.push(metricMatchStatus);
      if (metricWarning) flags.push(metricWarning);

      const seasonKRate = metric ? rate(metric.total_strikeouts, metric.total_pa) : null;
      const seasonBbRate = metric ? rate(metric.total_walks, metric.total_pa) : null;

      metricInserts.push(env.DB.prepare(`
        INSERT OR REPLACE INTO xp_phase1_player_metrics_current (
          xp_line_key, stat_type, player_name, normalized_player_name, team, normalized_team, opponent, normalized_opponent,
          line_score, odds_type, line_type_warning, player_id, metric_player_name, metric_team_id, metric_normalized_team,
          season, games_logged, first_game_date, last_game_date, total_pa, total_ab, total_walks, total_strikeouts,
          last3_games, last5_games, last10_games, last20_games, season_k_rate, season_bb_rate,
          metric_match_status, metric_warning, source_confidence, source_updated_at, built_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        x.xp_line_key, x.stat_type, x.player_name, normName, x.team, normTeam, x.opponent, normOpp,
        x.line_score, x.odds_type, lineTypeWarning, metric?.player_id || null, metric?.player_name || null, metric?.team_id || null, metric ? normalizeTeamCode(metric.team_id) : null,
        metric?.season || null, metric?.games_logged || null, metric?.first_game_date || null, metric?.last_game_date || null,
        metric?.total_pa || null, metric?.total_ab || null, metric?.total_walks || null, metric?.total_strikeouts || null,
        metric?.last3_games || null, metric?.last5_games || null, metric?.last10_games || null, metric?.last20_games || null,
        seasonKRate, seasonBbRate, metricMatchStatus, metricWarning, metric?.source_confidence || null, metric?.updated_at || null
      ));

      const bridge = bridgeByLine.get(x.xp_line_key) || null;
      let game = bridge?.game_id ? gamesById.get(bridge.game_id) : null;
      let bridgeStatus = bridge?.match_status || 'MISSING_BRIDGE';
      if (!bridge || !String(bridgeStatus).startsWith('MATCHED')) flags.push(bridgeStatus);

      let lineup = null;
      let lineupMatchStatus = 'MISSING_LINEUP';
      if (bridge?.game_id) {
        const lineupCandidates = lineupByKey.get(`${bridge.game_id}|${normTeam}|${normName}`) || [];
        if (lineupCandidates.length === 1) {
          lineup = lineupCandidates[0];
          lineupMatchStatus = 'MATCHED_LINEUP';
        } else if (lineupCandidates.length > 1) {
          const confirmed = lineupCandidates.filter((l) => Number(l.is_confirmed) === 1);
          if (confirmed.length === 1) {
            lineup = confirmed[0];
            lineupMatchStatus = 'MATCHED_LINEUP_MULTIPLE_PICKED_CONFIRMED';
            flags.push('MULTIPLE_LINEUP_ROWS');
          } else {
            lineupMatchStatus = 'MULTIPLE_LINEUP_ROWS_UNSAFE';
            flags.push(lineupMatchStatus);
          }
        } else {
          flags.push(lineupMatchStatus);
        }
      }

      let starter = null;
      let starterMatchStatus = 'MISSING_STARTER';
      if (bridge?.game_id) {
        const starterCandidates = starterByKey.get(`${bridge.game_id}|${normOpp}`) || [];
        if (starterCandidates.length === 1) {
          starter = starterCandidates[0];
          starterMatchStatus = 'MATCHED_STARTER';
        } else if (starterCandidates.length > 1) {
          starterMatchStatus = 'MULTIPLE_STARTER_ROWS_UNSAFE';
          flags.push(starterMatchStatus);
        } else {
          flags.push(starterMatchStatus);
        }
      }

      const contextStatus = (!bridge || !String(bridgeStatus).startsWith('MATCHED')) ? 'BLOCKED_NO_BRIDGE'
        : (!metric ? 'WARNING_MISSING_METRICS' : 'READY_CONTEXT');

      contextInserts.push(env.DB.prepare(`
        INSERT OR REPLACE INTO xp_phase1_game_context_current (
          xp_line_key, stat_type, player_name, normalized_player_name, team, opponent, normalized_team, normalized_opponent,
          line_score, odds_type, line_type_warning, start_time, slate_date, game_id, away_team, home_team, venue, game_status,
          game_start_time_utc, bridge_match_status, bridge_match_method, time_diff_minutes,
          lineup_slot, lineup_bats, lineup_k_rate, lineup_is_confirmed, lineup_source, lineup_confidence, lineup_match_status,
          starter_name, starter_throws, starter_era, starter_whip, starter_strikeouts, starter_walks, starter_innings_pitched, starter_days_rest,
          starter_source, starter_confidence, starter_match_status,
          player_id, metric_team_id, total_pa, total_walks, total_strikeouts, season_k_rate, season_bb_rate,
          metric_match_status, context_status, warning_flags, built_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        x.xp_line_key, x.stat_type, x.player_name, normName, x.team, x.opponent, normTeam, normOpp,
        x.line_score, x.odds_type, lineTypeWarning, x.start_time, x.slate_date, bridge?.game_id || null, bridge?.away_team || null, bridge?.home_team || null,
        game?.venue || null, game?.status || null, bridge?.game_start_time_utc || null, bridgeStatus, bridge?.match_method || null, bridge?.time_diff_minutes ?? null,
        lineup?.slot || null, lineup?.bats || null, lineup?.k_rate || null, lineup?.is_confirmed ?? null, lineup?.source || null, lineup?.confidence || null, lineupMatchStatus,
        starter?.starter_name || null, starter?.throws || null, starter?.era || null, starter?.whip || null, starter?.strikeouts || null, starter?.walks || null,
        starter?.innings_pitched || null, starter?.days_rest || null, starter?.source || starter?.data_source || null, starter?.confidence || null, starterMatchStatus,
        metric?.player_id || null, metric?.team_id || null, metric?.total_pa || null, metric?.total_walks || null, metric?.total_strikeouts || null,
        seasonKRate, seasonBbRate, metricMatchStatus, contextStatus, compactFlags([...new Set(flags)])
      ));
    }

    await batchRun(env.DB, metricInserts);
    await batchRun(env.DB, contextInserts);

    const metricCounts = await env.DB.prepare(`SELECT metric_match_status, COUNT(*) AS rows_count FROM xp_phase1_player_metrics_current GROUP BY metric_match_status ORDER BY rows_count DESC`).all();
    const contextCounts = await env.DB.prepare(`SELECT context_status, COUNT(*) AS rows_count FROM xp_phase1_game_context_current GROUP BY context_status ORDER BY rows_count DESC`).all();
    const completeness = await getContextCompleteness(env);

    const details = {
      version: SYSTEM_VERSION,
      expansion_phase: phase,
      deleted_metric_rows: Number(beforeMetrics?.c || 0),
      deleted_context_rows: Number(beforeContext?.c || 0),
      rows_read: lines.length,
      metric_rows_written: metricInserts.length,
      context_rows_written: contextInserts.length,
      metric_counts: metricCounts.results || [],
      context_counts: contextCounts.rows || completeness.rows || []
    };
    await env.DB.prepare(`UPDATE xp_job_runs SET status='COMPLETED', rows_read=?, rows_written=?, rows_deleted=?, completed_at=CURRENT_TIMESTAMP, details_json=? WHERE run_id=?`)
      .bind(lines.length, contextInserts.length, Number(beforeMetrics?.c || 0) + Number(beforeContext?.c || 0), JSON.stringify(details), runId)
      .run();
    await log(env.DB, runId, 'INFO', 'Phase 1 context snapshot built', details);
    return { ok: true, run_id: runId, ...details };
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    await env.DB.prepare(`UPDATE xp_job_runs SET status='ERROR', error=?, completed_at=CURRENT_TIMESTAMP WHERE run_id=?`)
      .bind(message, runId)
      .run();
    await log(env.DB, runId, 'ERROR', 'Phase 1 context build failed', { error: message });
    return { ok: false, run_id: runId, version: SYSTEM_VERSION, error: message };
  }
}

async function getContextCounts(env) {
  const metricCounts = await env.DB.prepare(`
    SELECT stat_type, metric_match_status, COUNT(*) AS rows_count
    FROM xp_phase1_player_metrics_current
    GROUP BY stat_type, metric_match_status
    ORDER BY stat_type ASC, rows_count DESC
  `).all();
  const contextCounts = await env.DB.prepare(`
    SELECT stat_type, context_status, COUNT(*) AS rows_count
    FROM xp_phase1_game_context_current
    GROUP BY stat_type, context_status
    ORDER BY stat_type ASC, rows_count DESC
  `).all();
  const totals = await env.DB.prepare(`
    SELECT 'player_metrics' AS table_name, COUNT(*) AS rows_count FROM xp_phase1_player_metrics_current
    UNION ALL SELECT 'game_context', COUNT(*) FROM xp_phase1_game_context_current
  `).all();
  return { ok: true, version: SYSTEM_VERSION, totals: totals.results || [], metric_counts: metricCounts.results || [], context_counts: contextCounts.results || [] };
}

async function getContextMissingMetrics(env) {
  const rows = await env.DB.prepare(`
    SELECT stat_type, player_name, team, opponent, line_score, odds_type, metric_match_status, metric_warning
    FROM xp_phase1_player_metrics_current
    WHERE metric_match_status NOT IN ('MATCHED_NAME_TEAM','MATCHED_NAME_ONLY_TEAM_MISMATCH')
    ORDER BY stat_type ASC, team ASC, player_name ASC, line_score ASC
    LIMIT 200
  `).all();
  const summary = await env.DB.prepare(`
    SELECT stat_type, metric_match_status, metric_warning, COUNT(*) AS rows_count
    FROM xp_phase1_player_metrics_current
    GROUP BY stat_type, metric_match_status, metric_warning
    ORDER BY rows_count DESC
  `).all();
  return { ok: true, version: SYSTEM_VERSION, summary: summary.results || [], rows: rows.results || [] };
}

async function getContextCompleteness(env) {
  const rows = await env.DB.prepare(`
    SELECT
      stat_type,
      COUNT(*) AS rows_count,
      SUM(CASE WHEN bridge_match_status IN ('MATCHED_EXACT','MATCHED_ALIAS') THEN 1 ELSE 0 END) AS bridge_matched,
      SUM(CASE WHEN metric_match_status IN ('MATCHED_NAME_TEAM','MATCHED_NAME_ONLY_TEAM_MISMATCH') THEN 1 ELSE 0 END) AS metrics_matched,
      SUM(CASE WHEN lineup_match_status LIKE 'MATCHED_LINEUP%' THEN 1 ELSE 0 END) AS lineup_matched,
      SUM(CASE WHEN lineup_is_confirmed = 1 THEN 1 ELSE 0 END) AS lineup_confirmed,
      SUM(CASE WHEN starter_match_status = 'MATCHED_STARTER' THEN 1 ELSE 0 END) AS starter_matched,
      SUM(CASE WHEN odds_type != 'standard' THEN 1 ELSE 0 END) AS non_standard_lines,
      SUM(CASE WHEN context_status = 'READY_CONTEXT' THEN 1 ELSE 0 END) AS ready_context,
      SUM(CASE WHEN context_status != 'READY_CONTEXT' THEN 1 ELSE 0 END) AS warning_context
    FROM xp_phase1_game_context_current
    GROUP BY stat_type
    ORDER BY stat_type ASC
  `).all();
  const flagRows = await env.DB.prepare(`
    SELECT warning_flags, COUNT(*) AS rows_count
    FROM xp_phase1_game_context_current
    GROUP BY warning_flags
    ORDER BY rows_count DESC
    LIMIT 50
  `).all();
  return { ok: true, version: SYSTEM_VERSION, rows: rows.results || [], warning_flags: flagRows.results || [] };
}

async function getContextSample(env, limit = 100) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 200));
  const rows = await env.DB.prepare(`
    SELECT xp_line_key, stat_type, player_name, team, opponent, line_score, odds_type, game_id,
           lineup_slot, lineup_is_confirmed, starter_name, starter_throws,
           total_pa, total_walks, total_strikeouts, season_k_rate, season_bb_rate,
           bridge_match_status, metric_match_status, lineup_match_status, starter_match_status, context_status, warning_flags
    FROM xp_phase1_game_context_current
    ORDER BY context_status ASC, stat_type ASC, start_time ASC, player_name ASC, line_score ASC
    LIMIT ${safeLimit}
  `).all();
  return { ok: true, version: SYSTEM_VERSION, rows: rows.results || [] };
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



async function buildPhase1Score(env, body = {}) {
  const runId = makeId('xp_score');
  const phase = Math.max(1, Math.min(Number(body?.expansion_phase) || 1, 9));
  await applySchema(env);
  await env.DB.prepare(`INSERT INTO xp_job_runs(run_id, job_name, status, source_table) VALUES (?, 'build_phase1_internal_score_scaffold', 'RUNNING', 'xp_phase1_game_context_current')`)
    .bind(runId)
    .run();
  try {
    const beforeScore = await env.DB.prepare(`SELECT COUNT(*) AS c FROM xp_phase1_score_current`).first();
    await env.DB.prepare(`DELETE FROM xp_phase1_score_current`).run();
    const rowsRes = await env.DB.prepare(`
      SELECT c.*
      FROM xp_phase1_game_context_current c
      JOIN xp_prop_lines_current x ON x.xp_line_key = c.xp_line_key
      WHERE x.expansion_phase = ?
        AND c.stat_type IN ('Hitter Strikeouts','Walks')
      ORDER BY c.stat_type ASC, c.game_id ASC, c.player_name ASC, c.line_score ASC, c.xp_line_key ASC
    `).bind(phase).all();
    const rows = rowsRes.results || [];
    const inserts = [];
    for (const row of rows) {
      const score = scorePhase1ContextRow(row);
      inserts.push(env.DB.prepare(`
        INSERT OR REPLACE INTO xp_phase1_score_current (
          xp_line_key, stat_type, player_name, team, opponent, line_score, odds_type, game_id,
          visible_side, internal_score_0_100, internal_grade, score_status, score_cap,
          base_component, player_component, starter_component, lineup_component, line_component,
          warning_component, reliability_component, season_k_rate, season_bb_rate, starter_k_per_ip,
          starter_bb_per_ip, lineup_slot, context_status, warning_flags, score_notes, built_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        row.xp_line_key, row.stat_type, row.player_name, row.team, row.opponent, row.line_score, row.odds_type, row.game_id,
        score.visible_side, score.internal_score_0_100, score.internal_grade, score.score_status, score.score_cap,
        score.base_component, score.player_component, score.starter_component, score.lineup_component, score.line_component,
        score.warning_component, score.reliability_component, row.season_k_rate, row.season_bb_rate, score.starter_k_per_ip,
        score.starter_bb_per_ip, row.lineup_slot, row.context_status, row.warning_flags, score.score_notes
      ));
    }
    await batchRun(env.DB, inserts);
    const scoreCounts = await getScoreCounts(env);
    const details = {
      version: SYSTEM_VERSION,
      expansion_phase: phase,
      deleted_score_rows: Number(beforeScore?.c || 0),
      rows_read: rows.length,
      score_rows_written: inserts.length,
      counts: scoreCounts.rows || [],
      totals: scoreCounts.totals || []
    };
    await env.DB.prepare(`UPDATE xp_job_runs SET status='COMPLETED', rows_read=?, rows_written=?, rows_deleted=?, completed_at=CURRENT_TIMESTAMP, details_json=? WHERE run_id=?`)
      .bind(rows.length, inserts.length, Number(beforeScore?.c || 0), JSON.stringify(details), runId)
      .run();
    await log(env.DB, runId, 'INFO', 'Phase 1 internal score scaffold built', details);
    return { ok: true, run_id: runId, ...details };
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    await env.DB.prepare(`UPDATE xp_job_runs SET status='ERROR', error=?, completed_at=CURRENT_TIMESTAMP WHERE run_id=?`)
      .bind(message, runId)
      .run();
    await log(env.DB, runId, 'ERROR', 'Phase 1 score build failed', { error: message });
    return { ok: false, run_id: runId, version: SYSTEM_VERSION, error: message };
  }
}

async function getScoreCounts(env) {
  const totals = await env.DB.prepare(`
    SELECT 'score_rows' AS bucket, COUNT(*) AS rows_count FROM xp_phase1_score_current
    UNION ALL SELECT 'scored_internal', COUNT(*) FROM xp_phase1_score_current WHERE score_status = 'SCORED_INTERNAL'
    UNION ALL SELECT 'blocked_context_incomplete', COUNT(*) FROM xp_phase1_score_current WHERE score_status != 'SCORED_INTERNAL'
  `).all();
  const rows = await env.DB.prepare(`
    SELECT stat_type, odds_type, score_status, internal_grade, COUNT(*) AS rows_count,
           MIN(internal_score_0_100) AS min_score,
           MAX(internal_score_0_100) AS max_score,
           ROUND(AVG(internal_score_0_100), 2) AS avg_score
    FROM xp_phase1_score_current
    GROUP BY stat_type, odds_type, score_status, internal_grade
    ORDER BY stat_type ASC, score_status ASC, avg_score DESC, rows_count DESC
  `).all();
  const top = await env.DB.prepare(`
    SELECT stat_type, player_name, team, opponent, line_score, odds_type, internal_score_0_100, internal_grade, score_status, warning_flags, score_notes
    FROM xp_phase1_score_current
    WHERE score_status = 'SCORED_INTERNAL'
    ORDER BY internal_score_0_100 DESC, stat_type ASC, player_name ASC
    LIMIT 25
  `).all();
  return { ok: true, version: SYSTEM_VERSION, totals: totals.results || [], rows: rows.results || [], top_internal: top.results || [] };
}

async function getScoreSample(env, limitParam) {
  const limit = Math.max(1, Math.min(Number(limitParam) || 100, 300));
  const rows = await env.DB.prepare(`
    SELECT xp_line_key, stat_type, player_name, team, opponent, line_score, odds_type, game_id,
           visible_side, internal_score_0_100, internal_grade, score_status, score_cap,
           player_component, starter_component, lineup_component, line_component, warning_component, reliability_component,
           season_k_rate, season_bb_rate, starter_k_per_ip, starter_bb_per_ip, lineup_slot, context_status, warning_flags, score_notes
    FROM xp_phase1_score_current
    ORDER BY score_status ASC, internal_score_0_100 DESC, stat_type ASC, player_name ASC
    LIMIT ?
  `).bind(limit).all();
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

function trimManualSqlCell(value) {
  if (typeof value !== 'string') return value;
  const maxCellChars = 8000;
  return value.length > maxCellChars ? value.slice(0, maxCellChars) + `...[cell_truncated_at_${maxCellChars}_chars]` : value;
}

function trimManualSqlRows(rows) {
  return rows.map((row) => {
    const clean = {};
    for (const [key, value] of Object.entries(row || {})) clean[key] = trimManualSqlCell(value);
    return clean;
  });
}

async function runManualSql(env, body) {
  const sql = String(body?.sql || '').trim();
  const maxRows = Math.max(1, Math.min(Number(body?.max_rows) || 500, 500));
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
      rows: trimManualSqlRows(rows.slice(0, maxRows)),
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

    if (path === '/health' || path === '/xp/health') {
      return jsonResponse({
        ok: true,
        version: SYSTEM_VERSION,
        worker: 'alphadog-expansion-v001',
        route: path,
        function_name: 'handleHealth',
        mode: 'isolated_xp_tables_only',
        source_read_table: SOURCE_TABLE,
        writes_allowed_only_to: 'xp_* tables',
        admin_secret_configured: Boolean(env.EXPANSION_ADMIN_TOKEN || env.INGEST_TOKEN),
        embedded_control_room_token_enabled: true,
        control_room_served_by_worker: true,
        direct_health_alias_enabled: true,
        phase1_bridge_builder_enabled: true,
        phase1_context_snapshot_enabled: true,
        phase1_internal_score_scaffold_enabled: true
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
      if (path === '/xp/bridge/build' && request.method === 'POST') {
        const body = await parseBody(request);
        const result = await buildGameBridge(env, body);
        return jsonResponse({ ...result, auth_warning: admin.warning || null }, result.ok ? 200 : 500);
      }
      if (path === '/xp/bridge/counts') return jsonResponse(await getBridgeCounts(env));
      if (path === '/xp/bridge/unmatched') return jsonResponse(await getBridgeUnmatched(env));
      if (path === '/xp/bridge/sample') return jsonResponse(await getBridgeSample(env, url.searchParams.get('limit')));
      if (path === '/xp/context/build' && request.method === 'POST') {
        const body = await parseBody(request);
        const result = await buildPhase1Context(env, body);
        return jsonResponse({ ...result, auth_warning: admin.warning || null }, result.ok ? 200 : 500);
      }
      if (path === '/xp/context/counts') return jsonResponse(await getContextCounts(env));
      if (path === '/xp/context/missing-metrics') return jsonResponse(await getContextMissingMetrics(env));
      if (path === '/xp/context/completeness') return jsonResponse(await getContextCompleteness(env));
      if (path === '/xp/context/sample') return jsonResponse(await getContextSample(env, url.searchParams.get('limit')));
      if (path === '/xp/score/build' && request.method === 'POST') {
        const body = await parseBody(request);
        const result = await buildPhase1Score(env, body);
        return jsonResponse({ ...result, auth_warning: admin.warning || null }, result.ok ? 200 : 500);
      }
      if (path === '/xp/score/counts') return jsonResponse(await getScoreCounts(env));
      if (path === '/xp/score/sample') return jsonResponse(await getScoreSample(env, url.searchParams.get('limit')));
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
