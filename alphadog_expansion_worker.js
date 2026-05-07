const SYSTEM_VERSION = 'v0.1.23 - Phase 2 Home Run Score Scaffold';
const EMBEDDED_EXPANSION_ADMIN_TOKEN = 'alphadog-xp-v013-admin-2f7c9d41-6b30-4bc8-a2d9-28f41c0e5a73';
const SOURCE_TABLE = 'prizepicks_current_market_context';

const TARGET_STAT_TYPES = [
  'Hitter Strikeouts','Walks','Singles','Doubles','Home Runs','Runs','Hits+Runs+RBIs','Hitter Fantasy Score','Triples','Stolen Bases','Hits','Total Bases','RBIs'
];
const PHASE1_STAT_TYPES = ['Hitter Strikeouts','Walks'];
const PHASE2_STAT_TYPES = ['Singles','Doubles','Home Runs'];

const CONTROL_ROOM_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<title>AlphaDog Expansion Control Room</title>
<style>
:root{color-scheme:dark;--bg:#070b11;--panel:#050505;--line:#2a3340;--green:#59ff92;--muted:#aab0bb;--purple:#6d35d9;--gold:#c89119;--teal:#0d756e;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--green);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}main{width:100%;max-width:1060px;margin:0 auto;padding:16px 12px 30px}h1{color:#19ff82;margin:0;font-size:24px;line-height:1.12;letter-spacing:.7px;text-transform:uppercase;font-weight:900}h2{color:#f7f2ea;margin:0 0 10px;font-size:18px;letter-spacing:.7px;text-transform:uppercase}.version{color:#bff7cc;font-size:14px;line-height:1.3;margin-top:8px;font-weight:700}.top,.section{padding-bottom:14px;border-bottom:2px solid var(--line)}.section{padding:14px 0}.desc{margin:0 0 10px;color:var(--green);font-size:16px;line-height:1.35}.small{color:var(--muted);font-size:13px;line-height:1.35;margin:8px 0 0}.status{color:#f7f2ea;border:2px solid var(--line);border-radius:9px;background:#101010;padding:8px 10px;margin-top:10px;min-height:36px;font-size:13px;line-height:1.3}.button-grid,.sql-buttons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}button{border:0;border-radius:9px;padding:8px 7px;color:white;background:var(--purple);font-size:14px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;min-height:42px;cursor:pointer;font-weight:800}button.gold{background:var(--gold)}button.green{background:#188336}button.teal{background:var(--teal)}button.full{width:100%;margin-top:10px;letter-spacing:1.6px;text-transform:uppercase;min-height:44px}button:active{transform:translateY(1px)}select,textarea{width:100%;border:2px solid var(--line);border-radius:9px;background:#101010;color:var(--green);font-family:inherit;font-size:14px;outline:none}select{padding:10px;min-height:42px}textarea{min-height:118px;max-height:260px;padding:10px;line-height:1.32;resize:vertical}pre{white-space:pre-wrap;word-break:break-word;background:var(--panel);color:var(--green);border:2px solid var(--line);border-radius:9px;padding:10px;min-height:185px;max-height:620px;overflow:auto;font-size:13.5px;line-height:1.3;margin:0}.sample-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:end}.pill{border:2px solid var(--line);border-radius:9px;background:#111;color:var(--muted);padding:9px;font-size:12.5px;line-height:1.35}@media(min-width:760px){main{padding:18px 16px 34px}.button-grid{grid-template-columns:repeat(6,minmax(0,1fr))}.sample-row{grid-template-columns:1fr 180px}.sql-buttons{grid-template-columns:repeat(6,minmax(0,1fr))}}@media(max-width:390px){h1{font-size:22px}button{font-size:13px;min-height:40px}.button-grid,.sql-buttons{gap:7px}pre{font-size:13px}}
</style></head><body><main>
<div class="top"><h1>AlphaDog Expansion Control Room</h1><div class="version">v0.1.23 - Phase 2 Home Run Score Scaffold</div><div class="small" id="originStatus">Starting UI...</div><div class="status" id="actionStatus">Ready.</div></div>
<section class="section"><p class="desc">Isolated expansion room. Reads prepared production data, writes only xp_* tables. Production scoring and Main UI stay untouched.</p><div class="pill" id="bridgeStatus">Worker bridge loading...</div><div class="button-grid"><button id="btnHealth">Health</button><button id="btnSchema" class="gold">Apply Schema</button><button id="btnRefresh">Refresh Board</button><button id="btnCounts">Board Counts</button><button id="btnJobs">Jobs</button><button id="btnLogs">Logs</button></div></section>
<section class="section"><h2>Phase 1 Pipeline</h2><p class="small">Use RUN PHASE 1 FULL PIPELINE for normal work. It auto-applies schema, refreshes board, builds bridge, builds context, builds score, and returns audit flags. Individual buttons stay available for debugging only.</p><button id="btnPhase1RunAll" class="full green">RUN PHASE 1 FULL PIPELINE</button><div class="button-grid"><button id="btnBridgeBuild" class="teal">Build Bridge</button><button id="btnBridgeCounts">Bridge Counts</button><button id="btnBridgeUnmatched">Unmatched</button><button id="btnContextBuild" class="teal">Build Context</button><button id="btnContextCounts">Context Counts</button><button id="btnContextCompleteness">Completeness</button><button id="btnScoreBuild" class="green">Build Score</button><button id="btnScoreCounts">Score Counts</button><button id="btnScoreAudit" class="gold">Score Audit</button><button id="btnScoreSample">Score Sample</button><button id="btnContextSample">Context Sample</button></div></section>
<section class="section"><h2>Phase 2 Gate</h2><p class="small">Readiness gate for Singles, Doubles, and Home Runs. Home Runs can now run a basic internal score scaffold only. Singles and Doubles stay blocked until native component metrics exist.</p><button id="btnPhase2Audit" class="full gold">RUN PHASE 2 READINESS GATE</button><button id="btnPhase2HrScore" class="full green">RUN PHASE 2 HOME RUN SCORE SCAFFOLD</button></section>
<section class="section"><h2>Sample Prop</h2><div class="sample-row"><select id="sampleProp"><option>Hitter Strikeouts</option><option>Walks</option><option>Singles</option><option>Doubles</option><option>Home Runs</option><option>Runs</option><option>Hits+Runs+RBIs</option><option>Hitter Fantasy Score</option><option>Triples</option><option>Stolen Bases</option><option>Hits</option><option>Total Bases</option><option>RBIs</option></select><button id="btnSample">Load Sample</button></div></section>
<section class="section"><h2>Manual SQL</h2><p class="small">Read-only guard active. Supports SELECT, WITH, and PRAGMA. Up to 500 returned rows and larger output copy buffer.</p><textarea id="manualSql">SELECT stat_type, odds_type, score_status, internal_grade, COUNT(*) AS rows_count, MIN(internal_score_0_100) AS min_score, MAX(internal_score_0_100) AS max_score, AVG(internal_score_0_100) AS avg_score FROM xp_phase1_score_current GROUP BY stat_type, odds_type, score_status, internal_grade ORDER BY stat_type, odds_type, max_score DESC LIMIT 100</textarea><div class="sql-buttons"><button id="btnRunSql" class="gold">Run SQL</button><button id="btnClearSql">Clear SQL</button><button id="btnSelectSql">Select SQL</button></div></section>
<section class="section" id="outputSection"><pre id="output">Ready.</pre><button id="btnCopy" class="full">COPY OUTPUT</button></section>
</main><script>(function(){'use strict';var VERSION='v0.1.23 - Phase 2 Home Run Score Scaffold';var HARD_CODED_WORKER_BASE='https://alphadog-expansion-v001.rodolfoaamattos.workers.dev';var EMBEDDED_TOKEN='alphadog-xp-v013-admin-2f7c9d41-6b30-4bc8-a2d9-28f41c0e5a73';var OUTPUT_CHAR_LIMIT=150000;var DEFAULT_SQL_MAX_ROWS=500;var output=document.getElementById('output');var outputSection=document.getElementById('outputSection');var originStatus=document.getElementById('originStatus');var bridgeStatus=document.getElementById('bridgeStatus');var actionStatus=document.getElementById('actionStatus');function fromGithubPages(){return /(^|\.)github\.io$/i.test(location.hostname)}function apiBase(){return fromGithubPages()?HARD_CODED_WORKER_BASE:location.origin}function withToken(path){return path+(path.indexOf('?')>=0?'&':'?')+'xp_token='+encodeURIComponent(EMBEDDED_TOKEN)}function apiUrl(path){return apiBase().replace(/\/$/,'')+withToken(path)}var ACTION_META={'/xp/health':'Health / handleHealth','/xp/schema/apply':'Apply Schema / handleApplySchema','/xp/board/refresh':'Refresh Board / handleRefreshBoard','/xp/board/counts':'Board Counts / handleCounts','/xp/jobs':'Jobs / handleJobs','/xp/logs':'Logs / handleLogs','/xp/manual-sql':'Manual SQL / handleManualSql','/xp/phase1/run-all':'Run Phase 1 Full Pipeline / handlePhase1RunAll','/xp/phase2/readiness-gate':'Run Phase 2 Readiness Gate / handlePhase2ReadinessGate','/xp/phase2/home-runs/score-scaffold':'Run Phase 2 Home Run Score Scaffold / handlePhase2HomeRunScoreScaffold','/xp/bridge/build':'Build Bridge / handleBuildGameBridge','/xp/bridge/counts':'Bridge Counts / handleBridgeCounts','/xp/bridge/unmatched':'Unmatched / handleBridgeUnmatched','/xp/context/build':'Build Context / handleBuildPhase1Context','/xp/context/counts':'Context Counts / handleContextCounts','/xp/context/completeness':'Completeness / handleContextCompleteness','/xp/context/sample':'Context Sample / handleContextSample','/xp/score/build':'Build Score / handleBuildPhase1Score','/xp/score/counts':'Score Counts / handleScoreCounts','/xp/score/sample':'Score Sample / handleScoreSample','/xp/score/audit':'Score Audit / handleScoreAudit'};function actionLabel(path){var clean=String(path||'').split('?')[0];return ACTION_META[clean]||'Load Sample / handleSampleProp'}function setStatus(msg){actionStatus.textContent=msg}function jumpOutput(){setTimeout(function(){var copy=document.getElementById('btnCopy');if(copy)copy.scrollIntoView({behavior:'smooth',block:'end'});else outputSection.scrollIntoView({behavior:'smooth',block:'end'})},80)}function safeText(value){var s=String(value==null?'':value);if(/^\s*</.test(s))return JSON.stringify({ok:false,connection_issue:'HTML_RESPONSE_NOT_JSON',http_preview:s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,900),worker_base:apiBase()},null,2);return s.length>OUTPUT_CHAR_LIMIT?s.slice(0,OUTPUT_CHAR_LIMIT)+'\n...[truncated by control room output lens at '+OUTPUT_CHAR_LIMIT+' chars]':s}function show(data){output.textContent=typeof data==='string'?safeText(data):safeText(JSON.stringify(data,null,2))}async function callApi(path,method,body){var label=actionLabel(path);setStatus('Running '+label);show({action:label.split(' / ')[0],function_name:label.split(' / ')[1],route:path,method:method,version:VERSION,worker_base:apiBase(),status:'RUNNING'});jumpOutput();try{var opts={method:method};if(method==='POST'){opts.headers={'Content-Type':'text/plain;charset=UTF-8'};opts.body=JSON.stringify(body||{})}var res=await fetch(apiUrl(path),opts);var text=await res.text();var response;try{response=JSON.parse(text)}catch(e){response=safeText(text)}show({action:label.split(' / ')[0],function_name:label.split(' / ')[1],route:path,http_status:res.status,version:VERSION,worker_base:apiBase(),response:response});jumpOutput();setStatus('Finished '+label+' • HTTP '+res.status)}catch(err){show({ok:false,action:label.split(' / ')[0],function_name:label.split(' / ')[1],route:path,version:VERSION,worker_base:apiBase(),error:String(err&&err.message?err.message:err)});jumpOutput();setStatus('Failed '+label)}}function bind(id,fn){var el=document.getElementById(id);if(el)el.addEventListener('click',fn)}function runManualSql(){callApi('/xp/manual-sql','POST',{sql:document.getElementById('manualSql').value||'',max_rows:DEFAULT_SQL_MAX_ROWS})}function sampleProp(){callApi('/xp/board/sample?stat_type='+encodeURIComponent(document.getElementById('sampleProp').value)+'&limit=100','GET')}async function copyOutput(){try{await navigator.clipboard.writeText(output.textContent||'');setStatus('Output copied.')}catch(err){setStatus('Copy failed. Long-press/select output manually.')}}bind('btnHealth',function(){callApi('/xp/health','GET')});bind('btnPhase1RunAll',function(){callApi('/xp/phase1/run-all','POST',{expansion_phase:1,time_tolerance_minutes:15,include_started:false,audit_limit:50})});bind('btnPhase2Audit',function(){callApi('/xp/phase2/readiness-gate','POST',{expansion_phase:2,time_tolerance_minutes:15,include_started:false})});bind('btnPhase2HrScore',function(){callApi('/xp/phase2/home-runs/score-scaffold','POST',{expansion_phase:2,time_tolerance_minutes:15,include_started:false,audit_limit:50})});bind('btnSchema',function(){callApi('/xp/schema/apply','POST')});bind('btnRefresh',function(){callApi('/xp/board/refresh','POST',{include_started:false})});bind('btnCounts',function(){callApi('/xp/board/counts','GET')});bind('btnJobs',function(){callApi('/xp/jobs','GET')});bind('btnLogs',function(){callApi('/xp/logs','GET')});bind('btnBridgeBuild',function(){callApi('/xp/bridge/build','POST',{expansion_phase:1,time_tolerance_minutes:15})});bind('btnBridgeCounts',function(){callApi('/xp/bridge/counts','GET')});bind('btnBridgeUnmatched',function(){callApi('/xp/bridge/unmatched','GET')});bind('btnContextBuild',function(){callApi('/xp/context/build','POST',{expansion_phase:1})});bind('btnContextCounts',function(){callApi('/xp/context/counts','GET')});bind('btnContextCompleteness',function(){callApi('/xp/context/completeness','GET')});bind('btnContextSample',function(){callApi('/xp/context/sample?limit=100','GET')});bind('btnScoreBuild',function(){callApi('/xp/score/build','POST',{expansion_phase:1})});bind('btnScoreCounts',function(){callApi('/xp/score/counts','GET')});bind('btnScoreSample',function(){callApi('/xp/score/sample?limit=100','GET')});bind('btnScoreAudit',function(){callApi('/xp/score/audit?limit=100','GET')});bind('btnSample',sampleProp);bind('btnRunSql',runManualSql);bind('btnClearSql',function(){document.getElementById('manualSql').value='';setStatus('SQL box cleared.')});bind('btnSelectSql',function(){var el=document.getElementById('manualSql');el.focus();el.select();setStatus('SQL selected.')});bind('btnCopy',copyOutput);originStatus.textContent=fromGithubPages()?'GitHub-hosted UI detected. Using CORS-safe hardcoded Worker bridge.':'Worker-hosted UI detected. Using same-origin Worker routes.';bridgeStatus.textContent='API Base: '+apiBase();setStatus('Ready.');show('Ready.')})();</script></body></html>`;

const SCHEMA_SQL = `DROP TABLE IF EXISTS xp_prop_definitions;

CREATE TABLE xp_prop_definitions (
  stat_type TEXT PRIMARY KEY,
  prop_family TEXT,
  expansion_phase INTEGER,
  target_status TEXT,
  priority TEXT,
  source_requirement TEXT,
  score_status TEXT,
  notes TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO xp_prop_definitions(stat_type, prop_family, expansion_phase, target_status, priority, source_requirement, score_status, notes, updated_at) VALUES
('Hitter Strikeouts','HITTER_STRIKEOUTS',1,'READY_PHASE_1','HIGH','PRIZEPICKS_PLUS_INTERNAL_CONTEXT','INTERNAL_SCAFFOLD','Phase 1 internal-only scoring first.',CURRENT_TIMESTAMP),
('Walks','WALKS',1,'READY_PHASE_1','HIGH','PRIZEPICKS_PLUS_INTERNAL_CONTEXT','INTERNAL_SCAFFOLD','Phase 1 internal-only scoring first.',CURRENT_TIMESTAMP),
('Singles','SINGLES',2,'READY_PHASE_2','MEDIUM','PRIZEPICKS_ONLY','NOT_BUILT','Component prop for total bases and fantasy score.',CURRENT_TIMESTAMP),
('Doubles','DOUBLES',2,'READY_PHASE_2','MEDIUM','PRIZEPICKS_ONLY','NOT_BUILT','Component prop for total bases and fantasy score.',CURRENT_TIMESTAMP),
('Home Runs','HOME_RUNS',2,'READY_PHASE_2','MEDIUM','PRIZEPICKS_ONLY','NOT_BUILT','Needs power/batted-ball layer later.',CURRENT_TIMESTAMP),
('Runs','RUNS',3,'READY_PHASE_3','MEDIUM','PRIZEPICKS_ONLY','NOT_BUILT','Needed before HRR and fantasy score.',CURRENT_TIMESTAMP),
('Hits+Runs+RBIs','HRR',4,'READY_LATER','LOW','COMPOSITE','NOT_BUILT','Composite prop after components mature.',CURRENT_TIMESTAMP),
('Hitter Fantasy Score','HITTER_FANTASY_SCORE',4,'READY_LATER','LOW','COMPOSITE','NOT_BUILT','Composite prop after components mature.',CURRENT_TIMESTAMP),
('Triples','TRIPLES',5,'WATCH_ONLY','LOW','PRIZEPICKS_ONLY','NOT_BUILT','Sparse event prop.',CURRENT_TIMESTAMP),
('Stolen Bases','STOLEN_BASES',5,'WATCH_ONLY','LOW','PRIZEPICKS_ONLY','NOT_BUILT','Needs catcher/pitcher/run environment later.',CURRENT_TIMESTAMP),
('Hits','HITS',3,'READY_PHASE_3','MEDIUM','PRIZEPICKS_PLUS_INTERNAL_CONTEXT','NOT_BUILT','Existing production has hits logic - expansion later.',CURRENT_TIMESTAMP),
('Total Bases','TOTAL_BASES',3,'READY_PHASE_3','MEDIUM','PRIZEPICKS_PLUS_INTERNAL_CONTEXT','NOT_BUILT','Needs hit/power context.',CURRENT_TIMESTAMP),
('RBIs','RBIS',3,'READY_PHASE_3','MEDIUM','PRIZEPICKS_PLUS_INTERNAL_CONTEXT','NOT_BUILT','Existing production has RBI logic - expansion later.',CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS xp_prop_lines_current (
  xp_line_key TEXT PRIMARY KEY,
  source_table TEXT,
  source_projection_key TEXT,
  line_id TEXT,
  player_name TEXT,
  normalized_player_name TEXT,
  team TEXT,
  opponent TEXT,
  stat_type TEXT,
  prop_family TEXT,
  line_score REAL,
  odds_type TEXT,
  start_time TEXT,
  slate_date TEXT,
  board_updated_at TEXT,
  captured_at TEXT,
  source_status TEXT,
  is_supported_single INTEGER,
  is_current INTEGER,
  is_stale INTEGER,
  target_status TEXT,
  expansion_phase INTEGER,
  imported_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  raw_json TEXT
);

CREATE TABLE IF NOT EXISTS xp_prop_counts_snapshot (
  snapshot_id TEXT PRIMARY KEY,
  run_id TEXT,
  stat_type TEXT,
  odds_type TEXT,
  target_status TEXT,
  expansion_phase INTEGER,
  rows_count INTEGER,
  min_line REAL,
  max_line REAL,
  first_start_time TEXT,
  last_start_time TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS xp_job_runs (
  run_id TEXT PRIMARY KEY,
  job_name TEXT,
  status TEXT,
  source_table TEXT,
  rows_read INTEGER DEFAULT 0,
  rows_written INTEGER DEFAULT 0,
  rows_deleted INTEGER DEFAULT 0,
  error TEXT,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  details_json TEXT
);

CREATE TABLE IF NOT EXISTS xp_job_logs (
  log_id TEXT PRIMARY KEY,
  run_id TEXT,
  level TEXT,
  message TEXT,
  details_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS xp_phase1_player_metrics_current (
  xp_line_key TEXT PRIMARY KEY,
  stat_type TEXT,
  player_name TEXT,
  normalized_player_name TEXT,
  team TEXT,
  normalized_team TEXT,
  opponent TEXT,
  line_score REAL,
  odds_type TEXT,
  player_id INTEGER,
  metric_team TEXT,
  role TEXT,
  season INTEGER,
  games_logged INTEGER,
  first_game_date TEXT,
  last_game_date TEXT,
  total_pa INTEGER,
  total_ab INTEGER,
  total_hits INTEGER,
  total_rbi INTEGER,
  total_home_runs INTEGER,
  total_walks INTEGER,
  total_strikeouts INTEGER,
  last3_games INTEGER,
  last3_hits INTEGER,
  last3_ab INTEGER,
  last5_games INTEGER,
  last5_hits INTEGER,
  last5_ab INTEGER,
  last10_games INTEGER,
  last10_hits INTEGER,
  last10_ab INTEGER,
  last20_games INTEGER,
  last20_hits INTEGER,
  last20_ab INTEGER,
  season_k_rate REAL,
  season_bb_rate REAL,
  source_confidence TEXT,
  metric_match_status TEXT,
  warning TEXT,
  built_at TEXT DEFAULT CURRENT_TIMESTAMP
);

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
  start_time TEXT,
  slate_date TEXT,
  game_id TEXT,
  away_team TEXT,
  home_team TEXT,
  venue TEXT,
  game_status TEXT,
  lineup_slot INTEGER,
  lineup_bats TEXT,
  lineup_k_rate REAL,
  lineup_is_confirmed INTEGER,
  lineup_match_status TEXT,
  starter_name TEXT,
  starter_throws TEXT,
  starter_era REAL,
  starter_whip REAL,
  starter_strikeouts INTEGER,
  starter_walks INTEGER,
  starter_innings_pitched REAL,
  starter_match_status TEXT,
  player_id INTEGER,
  total_pa INTEGER,
  total_walks INTEGER,
  total_strikeouts INTEGER,
  season_k_rate REAL,
  season_bb_rate REAL,
  bridge_match_status TEXT,
  metric_match_status TEXT,
  context_status TEXT,
  warning_flags TEXT,
  built_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS xp_phase2_data_readiness_current (
  xp_line_key TEXT PRIMARY KEY,
  stat_type TEXT,
  player_name TEXT,
  team TEXT,
  opponent TEXT,
  line_score REAL,
  odds_type TEXT,
  game_id TEXT,
  bridge_match_status TEXT,
  metric_match_status TEXT,
  lineup_match_status TEXT,
  starter_match_status TEXT,
  total_pa INTEGER,
  total_ab INTEGER,
  total_hits INTEGER,
  total_home_runs INTEGER,
  home_run_rate REAL,
  hit_rate REAL,
  data_status TEXT,
  readiness_status TEXT,
  block_reason TEXT,
  warning_flags TEXT,
  built_at TEXT DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE IF NOT EXISTS xp_phase2_score_current (
  xp_line_key TEXT PRIMARY KEY,
  stat_type TEXT,
  player_name TEXT,
  team TEXT,
  opponent TEXT,
  line_score REAL,
  odds_type TEXT,
  game_id TEXT,
  visible_side TEXT,
  data_status TEXT,
  readiness_status TEXT,
  score_status TEXT,
  internal_score_0_100 REAL,
  internal_grade TEXT,
  base_rate REAL,
  line_component REAL,
  lineup_component REAL,
  non_standard_component REAL,
  warning_component REAL,
  cap_applied TEXT,
  formula_json TEXT,
  warning_flags TEXT,
  score_notes TEXT,
  built_at TEXT DEFAULT CURRENT_TIMESTAMP
);

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
  context_status TEXT,
  score_status TEXT,
  internal_score_0_100 REAL,
  internal_grade TEXT,
  base_rate REAL,
  recent_proxy_rate REAL,
  line_component REAL,
  starter_component REAL,
  lineup_component REAL,
  warning_component REAL,
  non_standard_component REAL,
  formula_json TEXT,
  warning_flags TEXT,
  score_notes TEXT,
  built_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: corsHeaders({ 'Content-Type': 'application/json;charset=UTF-8' }) });
}
function htmlResponse(html) { return new Response(html, { headers: corsHeaders({ 'Content-Type': 'text/html;charset=UTF-8' }) }); }
function textResponse(text, status = 200) { return new Response(text, { status, headers: corsHeaders({ 'Content-Type': 'text/plain;charset=UTF-8' }) }); }
function corsHeaders(extra = {}) { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', ...extra }; }
function makeId(prefix) { return `${prefix}|${new Date().toISOString()}|${crypto.randomUUID()}`; }
function normalizeStat(value) { const wanted = String(value || '').trim(); return TARGET_STAT_TYPES.find((x) => x.toLowerCase() === wanted.toLowerCase()) || null; }
function normalizeTeamCode(team) { const t = String(team || '').trim().toUpperCase(); const map = { ATH:'OAK', OAK:'OAK', WSH:'WSN', WSN:'WSN', SF:'SFG', SFG:'SFG', CHW:'CWS', CWS:'CWS', SDP:'SD', SD:'SD', TBR:'TB', TB:'TB', KCR:'KC', KC:'KC', AZ:'ARI', ARI:'ARI' }; return map[t] || t; }
function requireAdmin(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('xp_token') || request.headers.get('x-xp-token') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  const configured = env.EXPANSION_ADMIN_TOKEN || env.INGEST_TOKEN || EMBEDDED_EXPANSION_ADMIN_TOKEN;
  if (token === configured || token === EMBEDDED_EXPANSION_ADMIN_TOKEN) return { ok: true, warning: token === EMBEDDED_EXPANSION_ADMIN_TOKEN ? 'embedded_control_room_token_used' : null };
  return { ok: false, error: 'Unauthorized expansion route. Missing or invalid xp_token.' };
}
async function log(db, runId, level, message, details) { try { await db.prepare(`INSERT INTO xp_job_logs(log_id, run_id, level, message, details_json) VALUES (?, ?, ?, ?, ?)`).bind(makeId('log'), runId, level, message, details ? JSON.stringify(details) : null).run(); } catch (_) {} }
function getSchemaStatements() { return SCHEMA_SQL.split(';').map(s => s.trim()).filter(Boolean); }
async function trySchemaStatement(env, sql, ignoredFragments = []) {
  try { await env.DB.prepare(sql).run(); return { ok:true, sql:sql.slice(0,120) }; }
  catch (err) {
    const msg = err?.message || String(err);
    if (ignoredFragments.some(f => msg.toLowerCase().includes(String(f).toLowerCase()))) return { ok:true, ignored:true, error:msg, sql:sql.slice(0,120) };
    return { ok:false, error:msg, sql:sql.slice(0,240) };
  }
}
async function ensureSchemaCompatibility(env) {
  const applied = [];
  const requiredBase = await trySchemaStatement(env, `CREATE TABLE IF NOT EXISTS xp_prop_definitions (stat_type TEXT PRIMARY KEY)`, []);
  if (!requiredBase.ok) return { ok:false, stage:'base_prop_definitions', error:requiredBase.error, failed_statement_preview:requiredBase.sql };
  const migrations = [
    `ALTER TABLE xp_prop_definitions ADD COLUMN prop_family TEXT`,
    `ALTER TABLE xp_prop_definitions ADD COLUMN expansion_phase INTEGER`,
    `ALTER TABLE xp_prop_definitions ADD COLUMN target_status TEXT`,
    `ALTER TABLE xp_prop_definitions ADD COLUMN priority TEXT`,
    `ALTER TABLE xp_prop_definitions ADD COLUMN source_requirement TEXT`,
    `ALTER TABLE xp_prop_definitions ADD COLUMN score_status TEXT`,
    `ALTER TABLE xp_prop_definitions ADD COLUMN notes TEXT`,
    `ALTER TABLE xp_prop_definitions ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP`
  ];
  for (const sql of migrations) {
    const res = await trySchemaStatement(env, sql, ['duplicate column name']);
    if (!res.ok) return { ok:false, stage:'prop_definition_migration', error:res.error, failed_statement_preview:res.sql, applied };
    applied.push(res);
  }
  return { ok:true, migrations_attempted:migrations.length, applied_or_already_present:applied.length };
}
async function applySchema(env) {
  const compatibility = await ensureSchemaCompatibility(env);
  if (!compatibility.ok) return { ok:false, version:SYSTEM_VERSION, function_name:'handleApplySchema', route:'/xp/schema/apply', error:compatibility.error, failed_statement_preview:compatibility.failed_statement_preview, compatibility_stage:compatibility.stage };
  const statements = getSchemaStatements(); const applied = [];
  for (let i = 0; i < statements.length; i++) {
    try { await env.DB.prepare(statements[i]).run(); applied.push({ index: i + 1, ok: true, preview: statements[i].slice(0, 90) }); }
    catch (err) { return { ok:false, version:SYSTEM_VERSION, function_name:'handleApplySchema', route:'/xp/schema/apply', error: err?.message || String(err), failed_statement_index:i+1, failed_statement_preview:statements[i].slice(0,500), statements_attempted:statements.length, applied_before_failure:applied.length }; }
  }
  return { ok:true, version:SYSTEM_VERSION, function_name:'handleApplySchema', route:'/xp/schema/apply', schema:'xp_* isolated schema applied', schema_mode:'prop_definitions_reset_then_idempotent_xp_tables', statement_runner:'individual_prepare_run_no_exec_multistatement', compatibility_migrations:compatibility, statements_applied:applied.length };
}


async function resetPhase1ContextTables(env) {
  await env.DB.prepare(`DROP TABLE IF EXISTS xp_phase1_player_metrics_current`).run();
  await env.DB.prepare(`DROP TABLE IF EXISTS xp_phase1_game_context_current`).run();
  await env.DB.prepare(`CREATE TABLE xp_phase1_player_metrics_current (
    xp_line_key TEXT PRIMARY KEY,
    stat_type TEXT,
    player_name TEXT,
    normalized_player_name TEXT,
    team TEXT,
    normalized_team TEXT,
    opponent TEXT,
    line_score REAL,
    odds_type TEXT,
    player_id INTEGER,
    metric_team TEXT,
    role TEXT,
    season INTEGER,
    games_logged INTEGER,
    first_game_date TEXT,
    last_game_date TEXT,
    total_pa INTEGER,
    total_ab INTEGER,
    total_hits INTEGER,
    total_rbi INTEGER,
    total_home_runs INTEGER,
    total_walks INTEGER,
    total_strikeouts INTEGER,
    last3_games INTEGER,
    last3_hits INTEGER,
    last3_ab INTEGER,
    last5_games INTEGER,
    last5_hits INTEGER,
    last5_ab INTEGER,
    last10_games INTEGER,
    last10_hits INTEGER,
    last10_ab INTEGER,
    last20_games INTEGER,
    last20_hits INTEGER,
    last20_ab INTEGER,
    season_k_rate REAL,
    season_bb_rate REAL,
    source_confidence TEXT,
    metric_match_status TEXT,
    warning TEXT,
    built_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await env.DB.prepare(`CREATE TABLE xp_phase1_game_context_current (
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
    start_time TEXT,
    slate_date TEXT,
    game_id TEXT,
    away_team TEXT,
    home_team TEXT,
    venue TEXT,
    game_status TEXT,
    lineup_slot INTEGER,
    lineup_bats TEXT,
    lineup_k_rate REAL,
    lineup_is_confirmed INTEGER,
    lineup_match_status TEXT,
    starter_name TEXT,
    starter_throws TEXT,
    starter_era REAL,
    starter_whip REAL,
    starter_strikeouts INTEGER,
    starter_walks INTEGER,
    starter_innings_pitched REAL,
    starter_match_status TEXT,
    player_id INTEGER,
    total_pa INTEGER,
    total_walks INTEGER,
    total_strikeouts INTEGER,
    season_k_rate REAL,
    season_bb_rate REAL,
    bridge_match_status TEXT,
    metric_match_status TEXT,
    context_status TEXT,
    warning_flags TEXT,
    built_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

async function resetPhase1ScoreTable(env) {
  await env.DB.prepare(`DROP TABLE IF EXISTS xp_phase1_score_current`).run();
  await env.DB.prepare(`CREATE TABLE xp_phase1_score_current (
    xp_line_key TEXT PRIMARY KEY,
    stat_type TEXT,
    player_name TEXT,
    team TEXT,
    opponent TEXT,
    line_score REAL,
    odds_type TEXT,
    game_id TEXT,
    visible_side TEXT,
    context_status TEXT,
    score_status TEXT,
    internal_score_0_100 REAL,
    internal_grade TEXT,
    base_rate REAL,
    recent_proxy_rate REAL,
    line_component REAL,
    starter_component REAL,
    lineup_component REAL,
    warning_component REAL,
    non_standard_component REAL,
    formula_json TEXT,
    warning_flags TEXT,
    score_notes TEXT,
    built_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

async function refreshPrizePicks(env, options = {}) {
  const runId = makeId('xp_refresh'); const includeStarted = options.include_started === true; const slateDate = options.slate_date || null;
  await applySchema(env);
  await env.DB.prepare(`INSERT INTO xp_job_runs(run_id, job_name, status, source_table, details_json) VALUES (?, ?, 'RUNNING', ?, ?)`).bind(runId, 'refresh_prizepicks_target_props', SOURCE_TABLE, JSON.stringify({ includeStarted, slateDate })).run();
  try {
    const statPlaceholders = TARGET_STAT_TYPES.map(() => '?').join(',');
    const where = [`p.is_current = 1`, `COALESCE(p.is_stale, 0) = 0`, `COALESCE(p.status, 'ACTIVE') = 'ACTIVE'`, `COALESCE(p.is_supported_single, 1) = 1`, `p.stat_type IN (${statPlaceholders})`];
    const params = [...TARGET_STAT_TYPES];
    if (!includeStarted) where.push(`datetime(p.start_time) > datetime('now')`);
    if (slateDate) { where.push(`p.slate_date = ?`); params.push(slateDate); }
    const countBefore = await env.DB.prepare(`SELECT COUNT(*) AS c FROM xp_prop_lines_current`).first();
    await env.DB.prepare(`DELETE FROM xp_prop_lines_current`).run();
    await env.DB.prepare(`
      INSERT OR REPLACE INTO xp_prop_lines_current (
        xp_line_key, source_table, source_projection_key, line_id, player_name, normalized_player_name, team, opponent, stat_type, prop_family,
        line_score, odds_type, start_time, slate_date, board_updated_at, captured_at, source_status, is_supported_single, is_current, is_stale,
        target_status, expansion_phase, imported_at, expires_at, raw_json
      )
      SELECT 'pp:' || COALESCE(projection_key, line_id, CAST(id AS TEXT)), '${SOURCE_TABLE}', projection_key, line_id, player_name,
        lower(replace(replace(replace(trim(COALESCE(player_name,'')), '.', ''), '''', ''), ' ', '')),
        team, opponent, p.stat_type, COALESCE(d.prop_family, upper(replace(p.stat_type, ' ', '_'))), line_score, odds_type, start_time, slate_date,
        board_updated_at, captured_at, status, is_supported_single, is_current, is_stale, COALESCE(d.target_status, 'UNCLASSIFIED'), COALESCE(d.expansion_phase, 99), CURRENT_TIMESTAMP, start_time,
        json_object('id', id, 'projection_key', projection_key, 'line_id', line_id, 'stat_type', p.stat_type, 'line_score', line_score, 'odds_type', odds_type, 'start_time', start_time, 'slate_date', slate_date, 'xp_version', '${SYSTEM_VERSION}')
      FROM ${SOURCE_TABLE} p LEFT JOIN xp_prop_definitions d ON d.stat_type = p.stat_type
      WHERE ${where.join(' AND ')}
    `).bind(...params).run();
    const countAfter = await env.DB.prepare(`SELECT COUNT(*) AS c FROM xp_prop_lines_current`).first();
    const rowsDeleted = Number(countBefore?.c || 0); const rowsWritten = Number(countAfter?.c || 0);
    const byStatus = await env.DB.prepare(`SELECT target_status, expansion_phase, COUNT(*) AS rows_count FROM xp_prop_lines_current GROUP BY target_status, expansion_phase ORDER BY expansion_phase, target_status`).all();
    await env.DB.prepare(`UPDATE xp_job_runs SET status='COMPLETED', rows_read=?, rows_written=?, rows_deleted=?, completed_at=CURRENT_TIMESTAMP, details_json=? WHERE run_id=?`).bind(rowsWritten, rowsWritten, rowsDeleted, JSON.stringify({ rowsWritten, byStatus: byStatus.results || [] }), runId).run();
    return { ok:true, run_id:runId, version:SYSTEM_VERSION, source_table:SOURCE_TABLE, include_started:includeStarted, slate_date_filter:slateDate, current_table_deleted_rows:rowsDeleted, rows_written:rowsWritten, target_status_counts:byStatus.results || [] };
  } catch (err) { const msg = err?.message || String(err); await env.DB.prepare(`UPDATE xp_job_runs SET status='ERROR', error=?, completed_at=CURRENT_TIMESTAMP WHERE run_id=?`).bind(msg, runId).run(); return { ok:false, run_id:runId, version:SYSTEM_VERSION, error:msg }; }
}

async function buildGameBridge(env, options = {}) {
  const runId = makeId('xp_bridge'); const expansionPhase = Number(options.expansion_phase || 1); const tol = Number(options.time_tolerance_minutes || 15);
  await applySchema(env); await env.DB.prepare(`INSERT INTO xp_job_runs(run_id, job_name, status, source_table, details_json) VALUES (?, 'build_xp_game_bridge_current', 'RUNNING', 'xp_prop_lines_current/games', ?)`).bind(runId, JSON.stringify({ expansionPhase, tol })).run();
  try {
    const del = await env.DB.prepare(`DELETE FROM xp_game_bridge_current`).run();
    const lines = await env.DB.prepare(`SELECT * FROM xp_prop_lines_current WHERE expansion_phase = ? ORDER BY start_time, team, opponent, player_name`).bind(expansionPhase).all();
    let written = 0;
    for (const x of (lines.results || [])) {
      const nt = normalizeTeamCode(x.team); const no = normalizeTeamCode(x.opponent);
      const ppUtc = new Date(x.start_time); const ppIso = isNaN(ppUtc.getTime()) ? null : ppUtc.toISOString().replace('.000Z','Z');
      const games = await env.DB.prepare(`SELECT game_id, away_team, home_team, start_time_utc, status FROM games WHERE game_date = ? AND ((away_team = ? AND home_team = ?) OR (home_team = ? AND away_team = ?))`).bind(x.slate_date, nt, no, nt, no).all();
      const candidates = (games.results || []).map(g => { const diff = ppIso ? Math.abs((new Date(ppIso).getTime() - new Date(g.start_time_utc).getTime()) / 60000) : 999999; return { ...g, diff }; });
      const clean = candidates.filter(g => Number.isFinite(g.diff) && g.diff <= tol);
      let status = 'UNMATCHED', method = 'NO_CLEAN_GAME_MATCH', warning = null, g = null;
      if (clean.length === 1) { g = clean[0]; const exact = String(x.team || '').toUpperCase() === nt && String(x.opponent || '').toUpperCase() === no; status = exact ? 'MATCHED_EXACT' : 'MATCHED_ALIAS'; method = exact ? 'EXACT_TEAM_PAIR' : 'ALIAS_TEAM_PAIR'; }
      else if (clean.length > 1) { status = 'UNSAFE_MULTIPLE_MATCHES'; method = 'MULTIPLE_CLEAN_GAMES'; warning = 'Multiple clean games matched; game_id intentionally not guessed.'; }
      else if (candidates.length > 0) { status = 'UNMATCHED_TIME'; method = 'TEAM_PAIR_FOUND_TIME_MISMATCH'; warning = 'Team pair matched but no game within tolerance.'; }
      await env.DB.prepare(`INSERT OR REPLACE INTO xp_game_bridge_current(xp_line_key, stat_type, player_name, original_team, original_opponent, normalized_team, normalized_opponent, slate_date, pp_start_time, pp_start_time_utc, game_id, away_team, home_team, game_start_time_utc, time_diff_minutes, match_status, match_method, candidate_count, clean_match_count, warning) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(x.xp_line_key, x.stat_type, x.player_name, x.team, x.opponent, nt, no, x.slate_date, x.start_time, ppIso, g?.game_id || null, g?.away_team || null, g?.home_team || null, g?.start_time_utc || null, g ? g.diff : null, status, method, candidates.length, clean.length, warning).run();
      written++;
    }
    const statusCounts = await env.DB.prepare(`SELECT match_status, match_method, COUNT(*) AS rows_count FROM xp_game_bridge_current GROUP BY match_status, match_method ORDER BY rows_count DESC`).all();
    const unmatchedPairs = await env.DB.prepare(`SELECT original_team AS team, original_opponent AS opponent, COUNT(*) AS rows_count FROM xp_game_bridge_current WHERE game_id IS NULL GROUP BY original_team, original_opponent ORDER BY rows_count DESC LIMIT 50`).all();
    await env.DB.prepare(`UPDATE xp_job_runs SET status='COMPLETED', rows_read=?, rows_written=?, rows_deleted=?, completed_at=CURRENT_TIMESTAMP, details_json=? WHERE run_id=?`).bind((lines.results || []).length, written, del.meta?.changes || 0, JSON.stringify({ status_counts: statusCounts.results || [] }), runId).run();
    return { ok:true, run_id:runId, version:SYSTEM_VERSION, expansion_phase:expansionPhase, time_tolerance_minutes:tol, deleted_rows:del.meta?.changes || 0, rows_written:written, status_counts:statusCounts.results || [], unmatched_pairs:unmatchedPairs.results || [] };
  } catch (err) { return { ok:false, run_id:runId, version:SYSTEM_VERSION, error:err?.message || String(err) }; }
}

async function buildPhase1Context(env, options = {}) {
  const runId = makeId('xp_context');
  const expansionPhase = Number(options.expansion_phase || 1);
  await applySchema(env);
  await resetPhase1ContextTables(env);
  await env.DB.prepare(`INSERT INTO xp_job_runs(run_id, job_name, status, source_table, details_json) VALUES (?, 'build_xp_phase1_context_current_set_based', 'RUNNING', 'xp_game_bridge_current', ?)`).bind(runId, JSON.stringify({ expansionPhase, mode:'SET_BASED_NO_PER_ROW_D1_LOOP' })).run();
  try {
    const linesBefore = await env.DB.prepare(`SELECT COUNT(*) AS c FROM xp_prop_lines_current WHERE expansion_phase=? AND stat_type IN ('Hitter Strikeouts','Walks')`).bind(expansionPhase).first();

    await env.DB.prepare(`
      INSERT OR REPLACE INTO xp_phase1_player_metrics_current(
        xp_line_key, stat_type, player_name, normalized_player_name, team, normalized_team, opponent, line_score, odds_type,
        player_id, metric_team, role, season, games_logged, first_game_date, last_game_date,
        total_pa, total_ab, total_hits, total_rbi, total_home_runs, total_walks, total_strikeouts,
        last3_games, last3_hits, last3_ab, last5_games, last5_hits, last5_ab, last10_games, last10_hits, last10_ab, last20_games, last20_hits, last20_ab,
        season_k_rate, season_bb_rate, source_confidence, metric_match_status, warning
      )
      SELECT
        x.xp_line_key, x.stat_type, x.player_name, x.normalized_player_name, x.team, b.normalized_team, x.opponent, x.line_score, x.odds_type,
        m.player_id, m.team_id, m.role, m.season, m.games_logged, m.first_game_date, m.last_game_date,
        m.total_pa, m.total_ab, m.total_hits, m.total_rbi, m.total_home_runs, m.total_walks, m.total_strikeouts,
        m.last3_games, m.last3_hits, m.last3_ab, m.last5_games, m.last5_hits, m.last5_ab, m.last10_games, m.last10_hits, m.last10_ab, m.last20_games, m.last20_hits, m.last20_ab,
        CASE WHEN COALESCE(m.total_pa,0) > 0 THEN 1.0 * COALESCE(m.total_strikeouts,0) / COALESCE(m.total_pa,1) ELSE NULL END,
        CASE WHEN COALESCE(m.total_pa,0) > 0 THEN 1.0 * COALESCE(m.total_walks,0) / COALESCE(m.total_pa,1) ELSE NULL END,
        m.source_confidence,
        CASE WHEN m.player_id IS NULL THEN 'MISSING_METRICS' ELSE 'MATCHED_NAME_TEAM' END,
        CASE WHEN m.player_id IS NULL THEN 'MISSING_METRICS' ELSE NULL END
      FROM xp_prop_lines_current x
      LEFT JOIN xp_game_bridge_current b ON b.xp_line_key = x.xp_line_key
      LEFT JOIN incremental_player_metrics m
        ON lower(replace(replace(replace(trim(COALESCE(m.player_name,'')), '.', ''), '''', ''), ' ', '')) = x.normalized_player_name
       AND UPPER(COALESCE(m.team_id,'')) IN (UPPER(COALESCE(x.team,'')), UPPER(COALESCE(b.normalized_team, x.team, '')))
      WHERE x.expansion_phase = ?
        AND x.stat_type IN ('Hitter Strikeouts','Walks')
    `).bind(expansionPhase).run();

    await env.DB.prepare(`
      INSERT OR REPLACE INTO xp_phase1_game_context_current(
        xp_line_key, stat_type, player_name, normalized_player_name, team, opponent, normalized_team, normalized_opponent,
        line_score, odds_type, start_time, slate_date, game_id, away_team, home_team, venue, game_status,
        lineup_slot, lineup_bats, lineup_k_rate, lineup_is_confirmed, lineup_match_status,
        starter_name, starter_throws, starter_era, starter_whip, starter_strikeouts, starter_walks, starter_innings_pitched, starter_match_status,
        player_id, total_pa, total_walks, total_strikeouts, season_k_rate, season_bb_rate,
        bridge_match_status, metric_match_status, context_status, warning_flags
      )
      SELECT
        x.xp_line_key, x.stat_type, x.player_name, x.normalized_player_name, x.team, x.opponent, b.normalized_team, b.normalized_opponent,
        x.line_score, x.odds_type, x.start_time, x.slate_date, b.game_id, b.away_team, b.home_team, g.venue, g.status,
        l.slot, l.bats, l.k_rate, l.is_confirmed,
        CASE WHEN l.player_name IS NULL THEN 'MISSING_LINEUP' ELSE 'MATCHED_LINEUP' END,
        s.starter_name, s.throws, s.era, s.whip, s.strikeouts, s.walks, s.innings_pitched,
        CASE WHEN s.starter_name IS NULL THEN 'MISSING_STARTER' ELSE 'MATCHED_STARTER' END,
        pm.player_id, pm.total_pa, pm.total_walks, pm.total_strikeouts, pm.season_k_rate, pm.season_bb_rate,
        COALESCE(b.match_status, 'MISSING_BRIDGE'), pm.metric_match_status,
        CASE WHEN pm.metric_match_status = 'MATCHED_NAME_TEAM' THEN 'READY_CONTEXT' ELSE 'WARNING_MISSING_METRICS' END,
        NULLIF(
          TRIM(
            CASE WHEN pm.metric_match_status <> 'MATCHED_NAME_TEAM' THEN 'MISSING_METRICS|' ELSE '' END ||
            CASE WHEN l.player_name IS NULL THEN 'MISSING_LINEUP|' ELSE '' END ||
            CASE WHEN s.starter_name IS NULL THEN 'MISSING_STARTER|' ELSE '' END ||
            CASE WHEN lower(COALESCE(x.odds_type,'standard')) <> 'standard' THEN 'NON_STANDARD_LINE_TYPE|' ELSE '' END,
          '|'),
        '')
      FROM xp_prop_lines_current x
      LEFT JOIN xp_game_bridge_current b ON b.xp_line_key = x.xp_line_key
      LEFT JOIN games g ON g.game_id = b.game_id
      LEFT JOIN xp_phase1_player_metrics_current pm ON pm.xp_line_key = x.xp_line_key
      LEFT JOIN lineups_current l
        ON l.game_id = b.game_id
       AND UPPER(l.team_id) = UPPER(COALESCE(b.normalized_team, x.team))
       AND lower(replace(replace(replace(trim(COALESCE(l.player_name,'')), '.', ''), '''', ''), ' ', '')) = x.normalized_player_name
      LEFT JOIN starters_current s
        ON s.game_id = b.game_id
       AND UPPER(s.team_id) = UPPER(COALESCE(b.normalized_opponent, x.opponent))
      WHERE x.expansion_phase = ?
        AND x.stat_type IN ('Hitter Strikeouts','Walks')
    `).bind(expansionPhase).run();

    const metricCounts = await env.DB.prepare(`SELECT stat_type, metric_match_status, COUNT(*) AS rows_count FROM xp_phase1_player_metrics_current GROUP BY stat_type, metric_match_status ORDER BY stat_type, rows_count DESC`).all();
    const contextCounts = await contextCompleteness(env);
    const metricWrittenRow = await env.DB.prepare(`SELECT COUNT(*) AS c FROM xp_phase1_player_metrics_current`).first();
    const contextWrittenRow = await env.DB.prepare(`SELECT COUNT(*) AS c FROM xp_phase1_game_context_current`).first();
    const rowsRead = Number(linesBefore?.c || 0);
    const metricWritten = Number(metricWrittenRow?.c || 0);
    const contextWritten = Number(contextWrittenRow?.c || 0);
    await env.DB.prepare(`UPDATE xp_job_runs SET status='COMPLETED', rows_read=?, rows_written=?, rows_deleted=0, completed_at=CURRENT_TIMESTAMP, details_json=? WHERE run_id=?`).bind(rowsRead, contextWritten, JSON.stringify({ mode:'SET_BASED_NO_PER_ROW_D1_LOOP', metricWritten, contextWritten }), runId).run();
    return { ok:true, run_id:runId, version:SYSTEM_VERSION, expansion_phase:expansionPhase, builder_mode:'SET_BASED_NO_PER_ROW_D1_LOOP', rows_read:rowsRead, metric_rows_written:metricWritten, context_rows_written:contextWritten, metric_counts:metricCounts.results || [], context_counts:contextCounts.rows || [], warning_flags:contextCounts.warning_flags || [] };
  } catch (err) {
    const msg = err?.message || String(err);
    await env.DB.prepare(`UPDATE xp_job_runs SET status='ERROR', error=?, completed_at=CURRENT_TIMESTAMP WHERE run_id=?`).bind(msg, runId).run();
    return { ok:false, run_id:runId, version:SYSTEM_VERSION, error:msg, builder_mode:'SET_BASED_NO_PER_ROW_D1_LOOP' };
  }
}

function clamp(n, min = 0, max = 100) { return Math.max(min, Math.min(max, n)); }
function grade(score) { if (score == null) return 'BLOCKED'; if (score >= 74) return 'WATCH_HIGH_INTERNAL'; if (score >= 64) return 'WATCH_MEDIUM_INTERNAL'; if (score >= 54) return 'LEAN_INTERNAL'; return 'LOW_INTERNAL'; }
async function buildPhase1Score(env, options = {}) {
  const runId = makeId('xp_score'); await applySchema(env); await resetPhase1ScoreTable(env); await env.DB.prepare(`INSERT INTO xp_job_runs(run_id, job_name, status, source_table) VALUES (?, 'build_xp_phase1_score_current', 'RUNNING', 'xp_phase1_game_context_current')`).bind(runId).run();
  try {
    const del = { meta: { changes: 0 } };
    const rows = await env.DB.prepare(`SELECT * FROM xp_phase1_game_context_current WHERE stat_type IN ('Hitter Strikeouts','Walks') ORDER BY stat_type, player_name, line_score`).all();
    let written = 0;
    for (const r of (rows.results || [])) {
      const blocked = r.metric_match_status !== 'MATCHED_NAME_TEAM';
      const stat = r.stat_type;
      const baseRate = stat === 'Walks' ? Number(r.season_bb_rate || 0) : Number(r.season_k_rate || 0);
      const line = Number(r.line_score || 0.5);
      const lineComponent = stat === 'Walks' ? (baseRate * 220 - line * 10) : (baseRate * 210 - line * 10);
      const starterComponent = stat === 'Walks' ? (Number(r.starter_walks || 0) / Math.max(Number(r.starter_innings_pitched || 50), 1)) * 8 : (Number(r.starter_strikeouts || 0) / Math.max(Number(r.starter_innings_pitched || 50), 1)) * 8;
      const lineupComponent = r.lineup_slot ? clamp((10 - Number(r.lineup_slot)) * 0.8, 0, 8) : -3;
      const warnCount = String(r.warning_flags || '').split('|').filter(Boolean).filter(w => w !== 'NON_STANDARD_LINE_TYPE').length;
      const warningComponent = -4 * warnCount;
      const nonStandard = String(r.odds_type || 'standard').toLowerCase() === 'standard' ? 0 : -2;
      let score = blocked ? null : clamp(48 + lineComponent + starterComponent + lineupComponent + warningComponent + nonStandard, 0, 100);
      if (!blocked && String(r.odds_type || 'standard').toLowerCase() !== 'standard') score = clamp(Math.min(score, 82), 0, 100);
      const scoreStatus = blocked ? 'BLOCKED_CONTEXT_INCOMPLETE' : 'SCORED_INTERNAL';
      const notes = String(r.odds_type || 'standard').toLowerCase() === 'standard' ? 'STANDARD_LINE_INTERNAL_ONLY_NO_MARKET_ODDS' : 'NON_STANDARD_LINE_VARIANT_INTERNAL_ONLY_NO_UNDER_CREATED';
      const formula = { version:SYSTEM_VERSION, base_rate:baseRate, line_component:lineComponent, starter_component:starterComponent, lineup_component:lineupComponent, warning_component:warningComponent, non_standard_component:nonStandard, cap_applied:String(r.odds_type || 'standard').toLowerCase() !== 'standard' ? 'NON_STANDARD_CAP_82' : null, market_odds:'NOT_USED_PHASE_1', external_market:'NOT_USED_PHASE_1' };
      await env.DB.prepare(`INSERT OR REPLACE INTO xp_phase1_score_current(xp_line_key, stat_type, player_name, team, opponent, line_score, odds_type, game_id, visible_side, context_status, score_status, internal_score_0_100, internal_grade, base_rate, recent_proxy_rate, line_component, starter_component, lineup_component, warning_component, non_standard_component, formula_json, warning_flags, score_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(r.xp_line_key, r.stat_type, r.player_name, r.team, r.opponent, r.line_score, r.odds_type, r.game_id, 'VISIBLE_PRIZEPICKS_SIDE_ONLY', r.context_status, scoreStatus, score == null ? null : Number(score.toFixed(2)), grade(score), baseRate, baseRate, Number(lineComponent.toFixed(4)), Number(starterComponent.toFixed(4)), Number(lineupComponent.toFixed(4)), warningComponent, nonStandard, JSON.stringify(formula), r.warning_flags, notes).run();
      written++;
    }
    const counts = await scoreCounts(env);
    await env.DB.prepare(`UPDATE xp_job_runs SET status='COMPLETED', rows_read=?, rows_written=?, rows_deleted=?, completed_at=CURRENT_TIMESTAMP WHERE run_id=?`).bind((rows.results || []).length, written, del.meta?.changes || 0, runId).run();
    return { ok:true, run_id:runId, version:SYSTEM_VERSION, deleted_score_rows:del.meta?.changes || 0, rows_read:(rows.results || []).length, score_rows_written:written, score_counts:counts.rows || [], totals:counts.totals || [] };
  } catch (err) { return { ok:false, run_id:runId, version:SYSTEM_VERSION, error:err?.message || String(err) }; }
}

async function getCounts(env) { const rows = await env.DB.prepare(`SELECT stat_type, odds_type, target_status, expansion_phase, COUNT(*) AS rows_count, MIN(line_score) AS min_line, MAX(line_score) AS max_line, MIN(start_time) AS first_start_time, MAX(start_time) AS last_start_time FROM xp_prop_lines_current GROUP BY stat_type, odds_type, target_status, expansion_phase ORDER BY expansion_phase, stat_type, odds_type`).all(); const totals = await env.DB.prepare(`SELECT target_status, expansion_phase, COUNT(*) AS rows_count FROM xp_prop_lines_current GROUP BY target_status, expansion_phase ORDER BY expansion_phase, target_status`).all(); return { ok:true, version:SYSTEM_VERSION, rows:rows.results || [], totals:totals.results || [] }; }
async function getSamples(env, statType = null, limit = 50) { const safe = Math.max(1, Math.min(Number(limit) || 50, 100)); const stat = normalizeStat(statType); let sql = `SELECT stat_type, target_status, expansion_phase, player_name, team, opponent, line_score, odds_type, start_time, slate_date, line_id, source_projection_key, imported_at FROM xp_prop_lines_current`; const binds = []; if (stat) { sql += ` WHERE stat_type=?`; binds.push(stat); } sql += ` ORDER BY expansion_phase, stat_type, start_time, player_name LIMIT ${safe}`; const rows = binds.length ? await env.DB.prepare(sql).bind(...binds).all() : await env.DB.prepare(sql).all(); return { ok:true, version:SYSTEM_VERSION, stat_type:stat || 'ALL', rows:rows.results || [] }; }
async function bridgeCounts(env) { const rows = await env.DB.prepare(`SELECT match_status, match_method, COUNT(*) AS rows_count FROM xp_game_bridge_current GROUP BY match_status, match_method ORDER BY rows_count DESC`).all(); const totals = await env.DB.prepare(`SELECT COUNT(*) AS rows_count, COUNT(DISTINCT xp_line_key) AS distinct_line_keys, SUM(CASE WHEN game_id IS NOT NULL THEN 1 ELSE 0 END) AS matched_rows FROM xp_game_bridge_current`).all(); return { ok:true, version:SYSTEM_VERSION, totals:totals.results || [], rows:rows.results || [] }; }
async function bridgeUnmatched(env) { const rows = await env.DB.prepare(`SELECT original_team AS team, original_opponent AS opponent, match_status, match_method, COUNT(*) AS rows_count FROM xp_game_bridge_current WHERE game_id IS NULL GROUP BY original_team, original_opponent, match_status, match_method ORDER BY rows_count DESC LIMIT 50`).all(); const samples = await env.DB.prepare(`SELECT xp_line_key, player_name, stat_type, original_team, original_opponent, normalized_team, normalized_opponent, pp_start_time, match_status, match_method, warning FROM xp_game_bridge_current WHERE game_id IS NULL LIMIT 50`).all(); return { ok:true, version:SYSTEM_VERSION, rows:rows.results || [], samples:samples.results || [] }; }
async function contextCounts(env) { const totals = await env.DB.prepare(`SELECT 'player_metrics' AS table_name, COUNT(*) AS rows_count FROM xp_phase1_player_metrics_current UNION ALL SELECT 'game_context', COUNT(*) FROM xp_phase1_game_context_current`).all(); const metricCounts = await env.DB.prepare(`SELECT stat_type, metric_match_status, COUNT(*) AS rows_count FROM xp_phase1_player_metrics_current GROUP BY stat_type, metric_match_status ORDER BY stat_type, rows_count DESC`).all(); const context = await env.DB.prepare(`SELECT stat_type, context_status, COUNT(*) AS rows_count FROM xp_phase1_game_context_current GROUP BY stat_type, context_status ORDER BY stat_type, rows_count DESC`).all(); return { ok:true, version:SYSTEM_VERSION, totals:totals.results || [], metric_counts:metricCounts.results || [], context_counts:context.results || [] }; }
async function contextCompleteness(env) { const rows = await env.DB.prepare(`SELECT stat_type, COUNT(*) AS rows_count, SUM(CASE WHEN bridge_match_status LIKE 'MATCHED%' THEN 1 ELSE 0 END) AS bridge_matched, SUM(CASE WHEN metric_match_status='MATCHED_NAME_TEAM' THEN 1 ELSE 0 END) AS metrics_matched, SUM(CASE WHEN lineup_match_status='MATCHED_LINEUP' THEN 1 ELSE 0 END) AS lineup_matched, SUM(CASE WHEN lineup_is_confirmed=1 THEN 1 ELSE 0 END) AS lineup_confirmed, SUM(CASE WHEN starter_match_status='MATCHED_STARTER' THEN 1 ELSE 0 END) AS starter_matched, SUM(CASE WHEN odds_type <> 'standard' THEN 1 ELSE 0 END) AS non_standard_lines, SUM(CASE WHEN context_status='READY_CONTEXT' THEN 1 ELSE 0 END) AS ready_context, SUM(CASE WHEN context_status <> 'READY_CONTEXT' THEN 1 ELSE 0 END) AS warning_context FROM xp_phase1_game_context_current GROUP BY stat_type ORDER BY stat_type`).all(); const flags = await env.DB.prepare(`SELECT warning_flags, COUNT(*) AS rows_count FROM xp_phase1_game_context_current GROUP BY warning_flags ORDER BY rows_count DESC LIMIT 25`).all(); return { ok:true, version:SYSTEM_VERSION, rows:rows.results || [], warning_flags:flags.results || [] }; }
async function contextSample(env, limit = 100) { const safe = Math.max(1, Math.min(Number(limit) || 100, 200)); const rows = await env.DB.prepare(`SELECT xp_line_key, stat_type, player_name, team, opponent, line_score, odds_type, game_id, lineup_slot, lineup_is_confirmed, starter_name, starter_throws, total_pa, total_walks, total_strikeouts, ROUND(season_k_rate,4) AS season_k_rate, ROUND(season_bb_rate,4) AS season_bb_rate, bridge_match_status, metric_match_status, lineup_match_status, starter_match_status, context_status, warning_flags FROM xp_phase1_game_context_current ORDER BY stat_type, player_name, line_score LIMIT ${safe}`).all(); return { ok:true, version:SYSTEM_VERSION, rows:rows.results || [] }; }
async function scoreCounts(env) { const totals = await env.DB.prepare(`SELECT 'score_rows' AS bucket, COUNT(*) AS rows_count FROM xp_phase1_score_current UNION ALL SELECT 'scored_internal', COUNT(*) FROM xp_phase1_score_current WHERE score_status='SCORED_INTERNAL' UNION ALL SELECT 'blocked_context_incomplete', COUNT(*) FROM xp_phase1_score_current WHERE score_status='BLOCKED_CONTEXT_INCOMPLETE'`).all(); const rows = await env.DB.prepare(`SELECT stat_type, odds_type, score_status, internal_grade, COUNT(*) AS rows_count, MIN(internal_score_0_100) AS min_score, MAX(internal_score_0_100) AS max_score, ROUND(AVG(internal_score_0_100),2) AS avg_score FROM xp_phase1_score_current GROUP BY stat_type, odds_type, score_status, internal_grade ORDER BY stat_type, score_status, max_score DESC`).all(); const top = await env.DB.prepare(`SELECT stat_type, player_name, team, opponent, line_score, odds_type, internal_score_0_100, internal_grade, score_status, warning_flags, score_notes FROM xp_phase1_score_current ORDER BY internal_score_0_100 DESC NULLS LAST, stat_type, player_name LIMIT 30`).all(); return { ok:true, version:SYSTEM_VERSION, totals:totals.results || [], rows:rows.results || [], top_internal:top.results || [] }; }
async function scoreSample(env, limit = 100) { const safe = Math.max(1, Math.min(Number(limit) || 100, 200)); const rows = await env.DB.prepare(`SELECT xp_line_key, stat_type, player_name, team, opponent, line_score, odds_type, visible_side, score_status, internal_score_0_100, internal_grade, base_rate, line_component, starter_component, lineup_component, warning_component, non_standard_component, warning_flags, score_notes FROM xp_phase1_score_current ORDER BY internal_score_0_100 DESC NULLS LAST LIMIT ${safe}`).all(); return { ok:true, version:SYSTEM_VERSION, rows:rows.results || [] }; }
async function scoreAudit(env, limit = 100) { const safe = Math.max(1, Math.min(Number(limit) || 100, 200)); const rows = await env.DB.prepare(`SELECT s.xp_line_key, s.stat_type, s.player_name, s.team, s.opponent, s.line_score, s.odds_type, s.visible_side, s.score_status, s.internal_score_0_100, s.internal_grade, s.base_rate, s.line_component, s.starter_component, s.lineup_component, s.warning_component, s.non_standard_component, s.warning_flags, s.score_notes, s.formula_json, c.context_status, c.lineup_slot, c.lineup_match_status, c.starter_name, c.starter_throws, c.starter_match_status, c.metric_match_status, c.total_pa, c.total_walks, c.total_strikeouts, c.season_k_rate, c.season_bb_rate FROM xp_phase1_score_current s LEFT JOIN xp_phase1_game_context_current c ON c.xp_line_key=s.xp_line_key ORDER BY s.internal_score_0_100 DESC NULLS LAST, s.stat_type, s.player_name LIMIT ${safe}`).all(); const summary = await env.DB.prepare(`SELECT score_notes, warning_flags, COUNT(*) AS rows_count FROM xp_phase1_score_current GROUP BY score_notes, warning_flags ORDER BY rows_count DESC LIMIT 50`).all(); return { ok:true, version:SYSTEM_VERSION, audit_mode:'READ_ONLY_SCORE_MATH_LENS_NO_SCORING_CHANGE', market_odds:'NOT_USED_PHASE_1', rows:rows.results || [], summary:summary.results || [] }; }


async function resetPhase2ReadinessTable(env) {
  await env.DB.prepare(`DROP TABLE IF EXISTS xp_phase2_data_readiness_current`).run();
  await env.DB.prepare(`CREATE TABLE xp_phase2_data_readiness_current (
    xp_line_key TEXT PRIMARY KEY,
    stat_type TEXT,
    player_name TEXT,
    team TEXT,
    opponent TEXT,
    line_score REAL,
    odds_type TEXT,
    game_id TEXT,
    bridge_match_status TEXT,
    metric_match_status TEXT,
    lineup_match_status TEXT,
    starter_match_status TEXT,
    total_pa INTEGER,
    total_ab INTEGER,
    total_hits INTEGER,
    total_home_runs INTEGER,
    home_run_rate REAL,
    hit_rate REAL,
    data_status TEXT,
    readiness_status TEXT,
    block_reason TEXT,
    warning_flags TEXT,
    built_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

async function buildPhase2Readiness(env, options = {}) {
  const runId = makeId('xp_phase2_readiness');
  const expansionPhase = Number(options.expansion_phase || 2);
  await applySchema(env);
  await resetPhase2ReadinessTable(env);
  await env.DB.prepare(`INSERT INTO xp_job_runs(run_id, job_name, status, source_table, details_json) VALUES (?, 'build_xp_phase2_data_readiness_current', 'RUNNING', 'xp_prop_lines_current/incremental_player_metrics', ?)`).bind(runId, JSON.stringify({ expansionPhase, phase2_stats:PHASE2_STAT_TYPES })).run();
  try {
    const placeholders = PHASE2_STAT_TYPES.map(() => '?').join(',');
    await env.DB.prepare(`
      INSERT OR REPLACE INTO xp_phase2_data_readiness_current(
        xp_line_key, stat_type, player_name, team, opponent, line_score, odds_type, game_id,
        bridge_match_status, metric_match_status, lineup_match_status, starter_match_status,
        total_pa, total_ab, total_hits, total_home_runs, home_run_rate, hit_rate,
        data_status, readiness_status, block_reason, warning_flags
      )
      SELECT
        x.xp_line_key, x.stat_type, x.player_name, x.team, x.opponent, x.line_score, x.odds_type, b.game_id,
        COALESCE(b.match_status, 'MISSING_BRIDGE'),
        CASE WHEN m.player_id IS NULL THEN 'MISSING_METRICS' ELSE 'MATCHED_NAME_TEAM' END,
        CASE WHEN l.player_name IS NULL THEN 'MISSING_LINEUP' ELSE 'MATCHED_LINEUP' END,
        CASE WHEN s.starter_name IS NULL THEN 'MISSING_STARTER' ELSE 'MATCHED_STARTER' END,
        m.total_pa, m.total_ab, m.total_hits, m.total_home_runs,
        CASE WHEN COALESCE(m.total_pa,0) > 0 THEN 1.0 * COALESCE(m.total_home_runs,0) / COALESCE(m.total_pa,1) ELSE NULL END,
        CASE WHEN COALESCE(m.total_ab,0) > 0 THEN 1.0 * COALESCE(m.total_hits,0) / COALESCE(m.total_ab,1) ELSE NULL END,
        CASE
          WHEN b.game_id IS NULL THEN 'BLOCKED_MISSING_BRIDGE'
          WHEN m.player_id IS NULL THEN 'BLOCKED_MISSING_METRICS'
          WHEN x.stat_type = 'Home Runs' AND COALESCE(m.total_pa,0) > 0 AND m.total_home_runs IS NOT NULL THEN 'READY_BASIC_POWER_CONTEXT'
          WHEN x.stat_type IN ('Singles','Doubles') AND m.player_id IS NOT NULL THEN 'BLOCKED_NO_NATIVE_COMPONENT_METRIC'
          ELSE 'BLOCKED_INSUFFICIENT_DATA'
        END,
        CASE
          WHEN x.stat_type = 'Home Runs' AND b.game_id IS NOT NULL AND m.player_id IS NOT NULL AND COALESCE(m.total_pa,0) > 0 AND m.total_home_runs IS NOT NULL THEN 'READY_FOR_PHASE2_SCORE_SCAFFOLD'
          WHEN x.stat_type IN ('Singles','Doubles') AND b.game_id IS NOT NULL AND m.player_id IS NOT NULL THEN 'NEEDS_NATIVE_COMPONENT_METRIC_BEFORE_SCORE'
          ELSE 'NOT_READY'
        END,
        CASE
          WHEN b.game_id IS NULL THEN 'Missing game bridge.'
          WHEN m.player_id IS NULL THEN 'Missing incremental player metrics.'
          WHEN x.stat_type IN ('Singles','Doubles') THEN 'Current incremental metrics table has hits/home runs but no certified native singles/doubles columns; do not score by proxy yet.'
          WHEN x.stat_type = 'Home Runs' AND (COALESCE(m.total_pa,0) <= 0 OR m.total_home_runs IS NULL) THEN 'Missing PA or HR total for home-run scaffold.'
          ELSE NULL
        END,
        NULLIF(TRIM(
          CASE WHEN b.game_id IS NULL THEN 'MISSING_BRIDGE|' ELSE '' END ||
          CASE WHEN m.player_id IS NULL THEN 'MISSING_METRICS|' ELSE '' END ||
          CASE WHEN l.player_name IS NULL THEN 'MISSING_LINEUP|' ELSE '' END ||
          CASE WHEN s.starter_name IS NULL THEN 'MISSING_STARTER|' ELSE '' END ||
          CASE WHEN lower(COALESCE(x.odds_type,'standard')) <> 'standard' THEN 'NON_STANDARD_LINE_TYPE|' ELSE '' END ||
          CASE WHEN x.stat_type IN ('Singles','Doubles') THEN 'NO_NATIVE_COMPONENT_METRIC|' ELSE '' END,
        '|'), '')
      FROM xp_prop_lines_current x
      LEFT JOIN xp_game_bridge_current b ON b.xp_line_key = x.xp_line_key
      LEFT JOIN incremental_player_metrics m
        ON lower(replace(replace(replace(trim(COALESCE(m.player_name,'')), '.', ''), '''', ''), ' ', '')) = x.normalized_player_name
       AND UPPER(COALESCE(m.team_id,'')) IN (UPPER(COALESCE(x.team,'')), UPPER(COALESCE(b.normalized_team, x.team, '')))
      LEFT JOIN lineups_current l
        ON l.game_id = b.game_id
       AND UPPER(l.team_id) = UPPER(COALESCE(b.normalized_team, x.team))
       AND lower(replace(replace(replace(trim(COALESCE(l.player_name,'')), '.', ''), '''', ''), ' ', '')) = x.normalized_player_name
      LEFT JOIN starters_current s
        ON s.game_id = b.game_id
       AND UPPER(s.team_id) = UPPER(COALESCE(b.normalized_opponent, x.opponent))
      WHERE x.expansion_phase = ? AND x.stat_type IN (${placeholders})
    `).bind(expansionPhase, ...PHASE2_STAT_TYPES).run();

    const totals = await env.DB.prepare(`SELECT COUNT(*) AS rows_count FROM xp_phase2_data_readiness_current`).all();
    const rows = await env.DB.prepare(`SELECT stat_type, odds_type, readiness_status, data_status, COUNT(*) AS rows_count, MIN(home_run_rate) AS min_hr_rate, MAX(home_run_rate) AS max_hr_rate, ROUND(AVG(home_run_rate),4) AS avg_hr_rate, ROUND(AVG(hit_rate),4) AS avg_hit_rate FROM xp_phase2_data_readiness_current GROUP BY stat_type, odds_type, readiness_status, data_status ORDER BY stat_type, readiness_status, rows_count DESC`).all();
    const summary = await env.DB.prepare(`SELECT readiness_status, data_status, COUNT(*) AS rows_count FROM xp_phase2_data_readiness_current GROUP BY readiness_status, data_status ORDER BY rows_count DESC`).all();
    const warnings = await env.DB.prepare(`SELECT warning_flags, COUNT(*) AS rows_count FROM xp_phase2_data_readiness_current GROUP BY warning_flags ORDER BY rows_count DESC LIMIT 50`).all();
    const sample = await env.DB.prepare(`SELECT stat_type, player_name, team, opponent, line_score, odds_type, readiness_status, data_status, block_reason, total_pa, total_ab, total_hits, total_home_runs, ROUND(home_run_rate,4) AS home_run_rate, ROUND(hit_rate,4) AS hit_rate, warning_flags FROM xp_phase2_data_readiness_current ORDER BY readiness_status, stat_type, player_name LIMIT 50`).all();
    await env.DB.prepare(`UPDATE xp_job_runs SET status='COMPLETED', rows_read=(SELECT COUNT(*) FROM xp_prop_lines_current WHERE expansion_phase=?), rows_written=(SELECT COUNT(*) FROM xp_phase2_data_readiness_current), completed_at=CURRENT_TIMESTAMP WHERE run_id=?`).bind(expansionPhase, runId).run();
    return { ok:true, run_id:runId, version:SYSTEM_VERSION, expansion_phase:expansionPhase, phase2_stats:PHASE2_STAT_TYPES, score_created:false, reason:'PHASE2_READINESS_GATE_ONLY_NO_SCORE_UNTIL_NATIVE_COMPONENT_DATA_IS_CERTIFIED', totals:totals.results || [], rows:rows.results || [], summary:summary.results || [], warning_flags:warnings.results || [], sample:sample.results || [] };
  } catch (err) {
    const msg = err?.message || String(err);
    await env.DB.prepare(`UPDATE xp_job_runs SET status='ERROR', error=?, completed_at=CURRENT_TIMESTAMP WHERE run_id=?`).bind(msg, runId).run();
    return { ok:false, run_id:runId, version:SYSTEM_VERSION, error:msg };
  }
}


async function resetPhase2ScoreTable(env) {
  await env.DB.prepare(`DROP TABLE IF EXISTS xp_phase2_score_current`).run();
  await env.DB.prepare(`CREATE TABLE xp_phase2_score_current (
    xp_line_key TEXT PRIMARY KEY,
    stat_type TEXT,
    player_name TEXT,
    team TEXT,
    opponent TEXT,
    line_score REAL,
    odds_type TEXT,
    game_id TEXT,
    visible_side TEXT,
    data_status TEXT,
    readiness_status TEXT,
    score_status TEXT,
    internal_score_0_100 REAL,
    internal_grade TEXT,
    base_rate REAL,
    line_component REAL,
    lineup_component REAL,
    non_standard_component REAL,
    warning_component REAL,
    cap_applied TEXT,
    formula_json TEXT,
    warning_flags TEXT,
    score_notes TEXT,
    built_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

function phase2Grade(score) {
  if (score == null || Number.isNaN(Number(score))) return 'BLOCKED';
  if (score >= 74) return 'WATCH_HIGH_INTERNAL';
  if (score >= 64) return 'WATCH_MEDIUM_INTERNAL';
  if (score >= 54) return 'LEAN_INTERNAL';
  return 'LOW_INTERNAL';
}

async function buildPhase2HomeRunScore(env, options = {}) {
  const runId = makeId('xp_phase2_hr_score');
  await applySchema(env);
  await resetPhase2ScoreTable(env);
  await env.DB.prepare(`INSERT INTO xp_job_runs(run_id, job_name, status, source_table, details_json) VALUES (?, 'build_xp_phase2_home_run_score_scaffold', 'RUNNING', 'xp_phase2_data_readiness_current', ?)`).bind(runId, JSON.stringify({ stat_type:'Home Runs', scaffold_only:true })).run();
  try {
    const rows = await env.DB.prepare(`
      SELECT xp_line_key, stat_type, player_name, team, opponent, line_score, odds_type, game_id, data_status, readiness_status,
             total_pa, total_ab, total_hits, total_home_runs, home_run_rate, hit_rate, warning_flags
      FROM xp_phase2_data_readiness_current
      WHERE stat_type='Home Runs'
      ORDER BY player_name, line_score
    `).all();
    let written = 0;
    for (const r of rows.results || []) {
      const ready = r.readiness_status === 'READY_FOR_PHASE2_SCORE_SCAFFOLD' && r.data_status === 'READY_BASIC_POWER_CONTEXT';
      const odds = String(r.odds_type || 'standard').toLowerCase();
      const line = Number(r.line_score || 0.5);
      let score = null;
      let grade = 'BLOCKED';
      let scoreStatus = 'BLOCKED_CONTEXT_INCOMPLETE';
      let scoreNotes = 'PHASE2_HR_BLOCKED_MISSING_POWER_CONTEXT';
      let capApplied = null;
      const baseRate = ready ? Number(r.home_run_rate || 0) : null;
      const lineComponent = ready ? Math.max(0, Math.min(60, (baseRate * 950) + (Number(r.hit_rate || 0) * 10) - Math.max(0, line - 0.5) * 8)) : null;
      const lineupComponent = ready ? (String(r.warning_flags || '').includes('MISSING_LINEUP') ? -3 : 4) : null;
      const nonStandardComponent = ready && odds !== 'standard' ? -2 : 0;
      const warningComponent = ready && String(r.warning_flags || '').includes('MISSING_LINEUP') ? -4 : 0;
      if (ready) {
        score = Math.round(Math.max(0, Math.min(100, 35 + lineComponent + lineupComponent + nonStandardComponent + warningComponent)) * 100) / 100;
        if (odds !== 'standard' && score > 82) { score = 82; capApplied = 'NON_STANDARD_CAP_82'; }
        grade = phase2Grade(score);
        scoreStatus = 'SCORED_INTERNAL';
        scoreNotes = 'PHASE2_HOME_RUN_INTERNAL_SCAFFOLD_NO_MARKET_ODDS';
      }
      const formula = ready ? JSON.stringify({ version:SYSTEM_VERSION, stat_type:'Home Runs', base_rate:baseRate, line_component:lineComponent, lineup_component:lineupComponent, non_standard_component:nonStandardComponent, warning_component:warningComponent, cap_applied:capApplied, market_odds:'NOT_USED_PHASE2', external_market:'NOT_USED_PHASE2', scaffold_only:true }) : null;
      await env.DB.prepare(`INSERT OR REPLACE INTO xp_phase2_score_current(
        xp_line_key, stat_type, player_name, team, opponent, line_score, odds_type, game_id, visible_side, data_status, readiness_status,
        score_status, internal_score_0_100, internal_grade, base_rate, line_component, lineup_component, non_standard_component, warning_component,
        cap_applied, formula_json, warning_flags, score_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'VISIBLE_PRIZEPICKS_SIDE_ONLY', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
        r.xp_line_key, r.stat_type, r.player_name, r.team, r.opponent, r.line_score, r.odds_type, r.game_id, r.data_status, r.readiness_status,
        scoreStatus, score, grade, baseRate, lineComponent, lineupComponent, nonStandardComponent, warningComponent, capApplied, formula, r.warning_flags, scoreNotes
      ).run();
      written++;
    }
    const counts = await phase2ScoreCounts(env);
    await env.DB.prepare(`UPDATE xp_job_runs SET status='COMPLETED', rows_read=?, rows_written=?, completed_at=CURRENT_TIMESTAMP WHERE run_id=?`).bind((rows.results || []).length, written, runId).run();
    return { ok:true, run_id:runId, version:SYSTEM_VERSION, score_mode:'PHASE2_HOME_RUN_INTERNAL_SCAFFOLD_ONLY', score_created:true, singles_doubles_scored:false, rows_read:(rows.results || []).length, score_rows_written:written, score_counts:counts.rows || [], totals:counts.totals || [], top_internal:counts.top_internal || [] };
  } catch (err) {
    const msg = err?.message || String(err);
    await env.DB.prepare(`UPDATE xp_job_runs SET status='ERROR', error=?, completed_at=CURRENT_TIMESTAMP WHERE run_id=?`).bind(msg, runId).run();
    return { ok:false, run_id:runId, version:SYSTEM_VERSION, error:msg };
  }
}

async function phase2ScoreCounts(env) {
  const totals = await env.DB.prepare(`SELECT 'score_rows' AS bucket, COUNT(*) AS rows_count FROM xp_phase2_score_current UNION ALL SELECT 'scored_internal', COUNT(*) FROM xp_phase2_score_current WHERE score_status='SCORED_INTERNAL' UNION ALL SELECT 'blocked_context_incomplete', COUNT(*) FROM xp_phase2_score_current WHERE score_status='BLOCKED_CONTEXT_INCOMPLETE'`).all();
  const rows = await env.DB.prepare(`SELECT stat_type, odds_type, score_status, internal_grade, COUNT(*) AS rows_count, MIN(internal_score_0_100) AS min_score, MAX(internal_score_0_100) AS max_score, ROUND(AVG(internal_score_0_100),2) AS avg_score FROM xp_phase2_score_current GROUP BY stat_type, odds_type, score_status, internal_grade ORDER BY stat_type, score_status, max_score DESC`).all();
  const top = await env.DB.prepare(`SELECT stat_type, player_name, team, opponent, line_score, odds_type, internal_score_0_100, internal_grade, score_status, warning_flags, score_notes FROM xp_phase2_score_current ORDER BY internal_score_0_100 DESC NULLS LAST, stat_type, player_name LIMIT 30`).all();
  return { ok:true, version:SYSTEM_VERSION, totals:totals.results || [], rows:rows.results || [], top_internal:top.results || [] };
}

async function runPhase2HomeRunScoreScaffold(env, options = {}) {
  const runId = makeId('xp_phase2_hr_scaffold_pipeline');
  const expansionPhase = Number(options.expansion_phase || 2);
  const tol = Number(options.time_tolerance_minutes || 15);
  const includeStarted = options.include_started === true;
  const steps = [];
  function pushStep(name, result) { const ok = Boolean(result && result.ok); steps.push({ step: steps.length + 1, name, ok, result }); return ok; }
  try {
    let r = await applySchema(env); if (!pushStep('apply_schema_auto_migration', r)) return { ok:false, version:SYSTEM_VERSION, run_id:runId, failed_step:'apply_schema_auto_migration', steps };
    r = await refreshPrizePicks(env, { include_started: includeStarted }); if (!pushStep('refresh_board', r)) return { ok:false, version:SYSTEM_VERSION, run_id:runId, failed_step:'refresh_board', steps };
    r = await getCounts(env); pushStep('board_counts', r);
    r = await buildGameBridge(env, { expansion_phase: expansionPhase, time_tolerance_minutes: tol }); if (!pushStep('build_bridge_phase2', r)) return { ok:false, version:SYSTEM_VERSION, run_id:runId, failed_step:'build_bridge_phase2', steps };
    r = await bridgeCounts(env); pushStep('bridge_counts', r);
    r = await bridgeUnmatched(env); pushStep('bridge_unmatched', r);
    r = await buildPhase2Readiness(env, { expansion_phase: expansionPhase }); if (!pushStep('phase2_readiness_gate', r)) return { ok:false, version:SYSTEM_VERSION, run_id:runId, failed_step:'phase2_readiness_gate', steps };
    r = await buildPhase2HomeRunScore(env, { expansion_phase: expansionPhase }); if (!pushStep('build_home_run_score_scaffold', r)) return { ok:false, version:SYSTEM_VERSION, run_id:runId, failed_step:'build_home_run_score_scaffold', steps };
    return { ok:true, version:SYSTEM_VERSION, function_name:'handlePhase2HomeRunScoreScaffold', route:'/xp/phase2/home-runs/score-scaffold', run_id:runId, mode:'ONE_BUTTON_PHASE2_HOME_RUN_SCORE_SCAFFOLD', production_mutation:'NO_PRODUCTION_TABLE_WRITES_XP_ONLY', expansion_phase:expansionPhase, time_tolerance_minutes:tol, steps_count:steps.length, steps, final_phase2_score:r };
  } catch (err) {
    return { ok:false, version:SYSTEM_VERSION, function_name:'handlePhase2HomeRunScoreScaffold', route:'/xp/phase2/home-runs/score-scaffold', run_id:runId, error:err?.message || String(err), steps };
  }
}

async function runPhase2ReadinessGate(env, options = {}) {
  const runId = makeId('xp_phase2_gate');
  const expansionPhase = Number(options.expansion_phase || 2);
  const tol = Number(options.time_tolerance_minutes || 15);
  const includeStarted = options.include_started === true;
  const steps = [];
  function pushStep(name, result) { const ok = Boolean(result && result.ok); steps.push({ step: steps.length + 1, name, ok, result }); return ok; }
  try {
    let r = await applySchema(env); if (!pushStep('apply_schema_auto_migration', r)) return { ok:false, version:SYSTEM_VERSION, run_id:runId, failed_step:'apply_schema_auto_migration', steps };
    r = await refreshPrizePicks(env, { include_started: includeStarted }); if (!pushStep('refresh_board', r)) return { ok:false, version:SYSTEM_VERSION, run_id:runId, failed_step:'refresh_board', steps };
    r = await getCounts(env); if (!pushStep('board_counts', r)) return { ok:false, version:SYSTEM_VERSION, run_id:runId, failed_step:'board_counts', steps };
    r = await buildGameBridge(env, { expansion_phase: expansionPhase, time_tolerance_minutes: tol }); if (!pushStep('build_bridge_phase2', r)) return { ok:false, version:SYSTEM_VERSION, run_id:runId, failed_step:'build_bridge_phase2', steps };
    r = await bridgeCounts(env); if (!pushStep('bridge_counts', r)) return { ok:false, version:SYSTEM_VERSION, run_id:runId, failed_step:'bridge_counts', steps };
    r = await bridgeUnmatched(env); if (!pushStep('bridge_unmatched', r)) return { ok:false, version:SYSTEM_VERSION, run_id:runId, failed_step:'bridge_unmatched', steps };
    r = await buildPhase2Readiness(env, { expansion_phase: expansionPhase }); if (!pushStep('phase2_readiness_gate', r)) return { ok:false, version:SYSTEM_VERSION, run_id:runId, failed_step:'phase2_readiness_gate', steps };
    return { ok:true, version:SYSTEM_VERSION, function_name:'handlePhase2ReadinessGate', route:'/xp/phase2/readiness-gate', run_id:runId, mode:'ONE_BUTTON_PHASE2_READINESS_GATE_NO_SCORE', production_mutation:'NO_PRODUCTION_TABLE_WRITES_XP_ONLY', expansion_phase:expansionPhase, time_tolerance_minutes:tol, steps_count:steps.length, steps, final_readiness:r };
  } catch (err) {
    return { ok:false, version:SYSTEM_VERSION, function_name:'handlePhase2ReadinessGate', route:'/xp/phase2/readiness-gate', run_id:runId, error:err?.message || String(err), steps };
  }
}

async function runPhase1FullPipeline(env, options = {}) {
  const runId = makeId('xp_phase1_full');
  const expansionPhase = Number(options.expansion_phase || 1);
  const tol = Number(options.time_tolerance_minutes || 15);
  const auditLimit = Math.max(1, Math.min(Number(options.audit_limit) || 50, 100));
  const steps = [];
  const pushStep = (name, result) => { steps.push({ step: steps.length + 1, name, ok: result?.ok !== false, result }); return result?.ok !== false; };
  try {
    let r;
    r = await applySchema(env); if (!pushStep('apply_schema_auto_migration', r)) return { ok:false, version:SYSTEM_VERSION, run_id:runId, failed_step:'apply_schema_auto_migration', steps };
    r = await refreshPrizePicks(env, { include_started: options.include_started === true }); if (!pushStep('refresh_board', r)) return { ok:false, version:SYSTEM_VERSION, run_id:runId, failed_step:'refresh_board', steps };
    r = await getCounts(env); pushStep('board_counts', r);
    r = await buildGameBridge(env, { expansion_phase: expansionPhase, time_tolerance_minutes: tol }); if (!pushStep('build_bridge', r)) return { ok:false, version:SYSTEM_VERSION, run_id:runId, failed_step:'build_bridge', steps };
    r = await bridgeCounts(env); pushStep('bridge_counts', r);
    r = await bridgeUnmatched(env); pushStep('bridge_unmatched', r);
    r = await buildPhase1Context(env, { expansion_phase: expansionPhase }); if (!pushStep('build_context', r)) return { ok:false, version:SYSTEM_VERSION, run_id:runId, failed_step:'build_context', steps };
    r = await contextCounts(env); pushStep('context_counts', r);
    r = await contextCompleteness(env); pushStep('context_completeness', r);
    r = await buildPhase1Score(env, { expansion_phase: expansionPhase }); if (!pushStep('build_score', r)) return { ok:false, version:SYSTEM_VERSION, run_id:runId, failed_step:'build_score', steps };
    const scoreSummary = await scoreCounts(env); pushStep('score_counts', scoreSummary);
    const audit = await scoreAudit(env, auditLimit); pushStep('score_audit', audit);
    return { ok:true, version:SYSTEM_VERSION, function_name:'handlePhase1RunAll', route:'/xp/phase1/run-all', run_id:runId, mode:'ONE_BUTTON_PIPELINE_WITH_SCHEMA_AUTO_MIGRATION', production_mutation:'NO_PRODUCTION_TABLE_WRITES_XP_ONLY', expansion_phase:expansionPhase, time_tolerance_minutes:tol, steps_count:steps.length, steps, final_score_counts:scoreSummary, final_audit:audit };
  } catch (err) {
    return { ok:false, version:SYSTEM_VERSION, function_name:'handlePhase1RunAll', route:'/xp/phase1/run-all', run_id:runId, error:err?.message || String(err), steps };
  }
}

async function getJobs(env) { const rows = await env.DB.prepare(`SELECT run_id, job_name, status, source_table, rows_read, rows_written, rows_deleted, error, started_at, completed_at, substr(details_json,1,1200) AS details_preview FROM xp_job_runs ORDER BY datetime(started_at) DESC LIMIT 25`).all(); return { ok:true, version:SYSTEM_VERSION, rows:rows.results || [] }; }
async function getLogs(env) { const rows = await env.DB.prepare(`SELECT log_id, run_id, level, message, substr(details_json,1,1200) AS details_preview, created_at FROM xp_job_logs ORDER BY datetime(created_at) DESC LIMIT 50`).all(); return { ok:true, version:SYSTEM_VERSION, rows:rows.results || [] }; }
function isReadOnlySql(sql) { const cleaned = String(sql || '').trim().replace(/^\s*--.*$/gm, '').trim(); const lowered = cleaned.toLowerCase(); if (!cleaned) return false; if (!(lowered.startsWith('select') || lowered.startsWith('with') || lowered.startsWith('pragma'))) return false; const banned = [' insert ', ' update ', ' delete ', ' drop ', ' alter ', ' create ', ' replace ', ' attach ', ' detach ', ' vacuum ', ' reindex ', ' truncate ']; const padded = ' ' + lowered.replace(/[\n\r\t]+/g, ' ') + ' '; return !banned.some(word => padded.includes(word)); }
function trimCell(v) { if (typeof v !== 'string') return v; const n = 8000; return v.length > n ? v.slice(0,n) + `...[cell_truncated_at_${n}_chars]` : v; }
async function runManualSql(env, body) { const sql = String(body?.sql || '').trim(); const maxRows = Math.max(1, Math.min(Number(body?.max_rows) || 500, 500)); if (!isReadOnlySql(sql)) return { ok:false, version:SYSTEM_VERSION, error:'Manual SQL is read-only here. Use SELECT, WITH, or PRAGMA only.' }; const started = Date.now(); try { const result = await env.DB.prepare(sql).all(); const rows = (result.results || []).slice(0, maxRows).map(row => Object.fromEntries(Object.entries(row || {}).map(([k,v]) => [k, trimCell(v)]))); return { ok:true, version:SYSTEM_VERSION, sql, rows, row_count:(result.results || []).length, returned_rows:rows.length, truncated:(result.results || []).length > maxRows, duration_ms:Date.now() - started }; } catch (err) { return { ok:false, version:SYSTEM_VERSION, sql, error:err?.message || String(err), duration_ms:Date.now() - started }; } }
async function parseBody(request) { if (request.method !== 'POST') return {}; const text = await request.text(); if (!text) return {}; try { return JSON.parse(text); } catch { return {}; } }

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return textResponse('', 204);
    const url = new URL(request.url); const path = url.pathname.replace(/\/+$/, '') || '/';
    if (path === '/') return htmlResponse(CONTROL_ROOM_HTML);
    if (path === '/health' || path === '/xp/health') return jsonResponse({ ok:true, version:SYSTEM_VERSION, worker:'alphadog-expansion-v001', route:path, function_name:'handleHealth', mode:'isolated_xp_tables_only', source_read_table:SOURCE_TABLE, writes_allowed_only_to:'xp_* tables', admin_secret_configured:Boolean(env.EXPANSION_ADMIN_TOKEN || env.INGEST_TOKEN), embedded_control_room_token_enabled:true, control_room_served_by_worker:true, phase1_audit_lens:true, phase2_readiness_gate:true, phase2_home_run_score_scaffold:true });
    if (path === '/xp/props/targets') return jsonResponse({ ok:true, version:SYSTEM_VERSION, target_stat_types:TARGET_STAT_TYPES });
    const admin = requireAdmin(request, env); if (!admin.ok) return jsonResponse({ ok:false, version:SYSTEM_VERSION, error:admin.error }, 401);
    try {
      if (path === '/xp/schema/apply' && request.method === 'POST') return jsonResponse({ ...(await applySchema(env)), auth_warning:admin.warning || null });
      if (path === '/xp/phase1/run-all' && request.method === 'POST') return jsonResponse({ ...(await runPhase1FullPipeline(env, await parseBody(request))), auth_warning:admin.warning || null });
      if (path === '/xp/phase2/readiness-gate' && request.method === 'POST') return jsonResponse({ ...(await runPhase2ReadinessGate(env, await parseBody(request))), auth_warning:admin.warning || null });
      if (path === '/xp/phase2/home-runs/score-scaffold' && request.method === 'POST') return jsonResponse({ ...(await runPhase2HomeRunScoreScaffold(env, await parseBody(request))), auth_warning:admin.warning || null });
      if (path === '/xp/board/refresh' && request.method === 'POST') return jsonResponse({ ...(await refreshPrizePicks(env, await parseBody(request))), auth_warning:admin.warning || null });
      if (path === '/xp/full-refresh' && request.method === 'POST') { await applySchema(env); return jsonResponse({ ...(await refreshPrizePicks(env, await parseBody(request))), auth_warning:admin.warning || null }); }
      if (path === '/xp/board/counts') return jsonResponse(await getCounts(env));
      if (path === '/xp/board/sample') return jsonResponse(await getSamples(env, url.searchParams.get('stat_type'), url.searchParams.get('limit')));
      if (path === '/xp/bridge/build' && request.method === 'POST') return jsonResponse({ ...(await buildGameBridge(env, await parseBody(request))), auth_warning:admin.warning || null });
      if (path === '/xp/bridge/counts') return jsonResponse(await bridgeCounts(env));
      if (path === '/xp/bridge/unmatched') return jsonResponse(await bridgeUnmatched(env));
      if (path === '/xp/context/build' && request.method === 'POST') return jsonResponse({ ...(await buildPhase1Context(env, await parseBody(request))), auth_warning:admin.warning || null });
      if (path === '/xp/context/counts') return jsonResponse(await contextCounts(env));
      if (path === '/xp/context/completeness') return jsonResponse(await contextCompleteness(env));
      if (path === '/xp/context/sample') return jsonResponse(await contextSample(env, url.searchParams.get('limit')));
      if (path === '/xp/score/build' && request.method === 'POST') return jsonResponse({ ...(await buildPhase1Score(env, await parseBody(request))), auth_warning:admin.warning || null });
      if (path === '/xp/score/counts') return jsonResponse(await scoreCounts(env));
      if (path === '/xp/score/sample') return jsonResponse(await scoreSample(env, url.searchParams.get('limit')));
      if (path === '/xp/score/audit') return jsonResponse(await scoreAudit(env, url.searchParams.get('limit')));
      if (path === '/xp/jobs') return jsonResponse(await getJobs(env));
      if (path === '/xp/logs') return jsonResponse(await getLogs(env));
      if (path === '/xp/manual-sql' && request.method === 'POST') { const result = await runManualSql(env, await parseBody(request)); return jsonResponse(result, result.ok ? 200 : 400); }
      return jsonResponse({ ok:false, version:SYSTEM_VERSION, error:`Unknown route: ${path}` }, 404);
    } catch (err) { return jsonResponse({ ok:false, version:SYSTEM_VERSION, error:err?.message || String(err) }, 500); }
  },
  async scheduled(event, env, ctx) { ctx.waitUntil((async () => { await applySchema(env); await refreshPrizePicks(env, { include_started:false }); })()); }
};
