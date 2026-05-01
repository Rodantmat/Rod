// AlphaDog v1.3.38 - Scoring Slate Data Guard compatible worker
// RFI GUARDED TIER CAP ACTIVE
const SYSTEM_VERSION = "v1.3.38 - Scoring Slate Data Guard";
const SYSTEM_CODENAME = "Freshness Audit Only";
const BOARD_QUEUE_BUILD_CHUNK_LIMIT = 12;
const BOARD_QUEUE_AUTO_BUILD_CHUNK_LIMIT = 96;
const BOARD_QUEUE_AUTO_MINE_LIMIT = 12;
const BOARD_QUEUE_RETRY_LIMIT = 5;
const BOARD_QUEUE_RUNTIME_CUTOFF_MS = 25000;
const PHASE3AB_TICK_RUNTIME_CUTOFF_MS = 26000;
const WORKER_DEPLOY_TARGET = "alphadog-phase3-starter-groups";
const PRIMARY_MODEL = "gemini-2.5-pro";
const FALLBACK_MODEL = "gemini-2.5-flash";
const SCRAPE_MODEL = "gemini-2.5-flash";
const SCRAPE_FALLBACK_MODEL = "gemini-2.5-pro";
const SLEEPER_VIDEO_MODEL = "gemini-3.1-pro-preview";
const SLEEPER_RBI_RFI_WINDOW_SPLIT_MINUTES = 13 * 60;
const SLEEPER_RBI_RFI_MORNING_DEBUG_ALL_WINDOWS = true;
const ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4/sports";
const ODDS_API_SPORT_KEY = "baseball_mlb";
const ODDS_API_REGIONS = "us";
const ODDS_API_BOOKMAKERS = "draftkings,fanduel,betmgm,caesars,betrivers,espnbet,fanatics,bovada,betonlineag";
const ODDS_API_GAME_MARKETS = "h2h,spreads,totals";
const ODDS_API_PROP_MARKETS = "batter_hits,batter_rbis,batter_total_bases";
const ODDS_API_HITS_TB_BOOKMAKERS = "draftkings,fanduel,betmgm,fanatics,betrivers,bovada";
const ODDS_API_HITS_TB_PROP_MARKETS = "batter_hits,batter_total_bases";
const ODDS_API_RBI_BOOKMAKERS = "draftkings,fanduel,betmgm,fanatics,betrivers,bovada,espnbet,williamhill_us,betonlineag,betus,lowvig,mybookieag,ballybet,betparx,hardrockbet,rebet";
const ODDS_API_RBI_PROP_MARKETS = "batter_rbis";
const ODDS_API_BATTER_PROP_MARKETS = "batter_hits,batter_rbis,batter_total_bases";
const ODDS_API_ODDS_FORMAT = "american";
const ODDS_API_WINDOW_SPLIT_MINUTES = 13 * 60;
const ODDS_API_START_BUFFER_MINUTES = 15;

const GEMINI_LIMIT_GUARD_ENABLED = true;
const GEMINI_LIMIT_GUARD_RATIO = 0.75;
const GEMINI_LIMIT_GUARD_WAIT_MS = 30000;
const GEMINI_DEFAULT_TOKEN_CAP = 8192;
const BOARD_ACTIONABLE_START_BUFFER_MINUTES = 15;
const BACKEND_PREFILL_PLAYER_FAMILIES = new Set(["PLAYER_A_ROLE_RECENT_MATCHUP", "PLAYER_D_ADVANCED_FORM_CONTACT"]);
const GEMINI_MODEL_LIMITS = {
  "gemini-2.5-pro": { rpm: 1000, tpm: 5000000 },
  "gemini-2.5-flash": { rpm: 2000, tpm: 3000000 },
  "gemini-3-flash": { rpm: 2000, tpm: 3000000 },
  "gemini-3.1-pro": { rpm: 1000, tpm: 5000000 },
  "gemini-3.1-pro-preview": { rpm: 1000, tpm: 5000000 },
  "gemini-3.1-flash-lite": { rpm: 10000, tpm: 10000000 },
  "gemini-2-flash": { rpm: 10000, tpm: 10000000 }
};

const SLEEPER_VIDEO_PARSER_HTML = "<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\" />\n  <title>AlphaDog Sleeper Video Parser</title>\n  <style>\n    :root { color-scheme: dark; --bg:#071018; --card:#101b26; --card2:#132333; --text:#eaf2ff; --muted:#9fb2c8; --line:#26384d; --good:#74f0a7; --bad:#ff7a7a; --warn:#ffd36e; --bar:#74f0a7; }\n    * { box-sizing: border-box; }\n    body { margin:0; font-family:-apple-system,BlinkMacSystemFont,\"SF Pro Display\",\"Segoe UI\",sans-serif; background:radial-gradient(circle at top,#18334b 0,var(--bg) 42%); color:var(--text); }\n    main { max-width:980px; margin:0 auto; padding:22px 14px 44px; }\n    h1 { font-size:26px; margin:0 0 6px; letter-spacing:-.03em; } h2 { margin-top:0; }\n    .sub { color:var(--muted); margin:0 0 18px; line-height:1.35; }\n    .grid { display:grid; gap:14px; }\n    .card { background:rgba(16,27,38,.92); border:1px solid var(--line); border-radius:18px; padding:16px; box-shadow:0 14px 34px rgba(0,0,0,.26); }\n    label { display:block; color:var(--muted); font-size:13px; margin-bottom:8px; }\n    input { width:100%; background:var(--card2); color:var(--text); border:1px solid var(--line); border-radius:12px; padding:11px 12px; font-size:15px; outline:none; }\n    input[type=\"file\"] { padding:14px; }\n    button { border:0; border-radius:14px; padding:13px 16px; font-weight:800; font-size:15px; background:#eaf2ff; color:#071018; cursor:pointer; width:100%; }\n    button:disabled { opacity:.55; cursor:not-allowed; }\n    .status { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; color:var(--muted); white-space:pre-wrap; line-height:1.35; }\n    .pill { display:inline-flex; border:1px solid var(--line); border-radius:999px; padding:5px 9px; color:var(--muted); margin:4px 6px 0 0; font-size:12px; }\n    .lineOut { background:#071018; border:1px solid var(--line); border-radius:12px; padding:10px; margin:8px 0; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; line-height:1.35; }\n    .good { color:var(--good); } .bad { color:var(--bad); } .warn { color:var(--warn); }\n    pre { max-height:420px; overflow:auto; background:#071018; border:1px solid var(--line); border-radius:12px; padding:12px; font-size:12px; line-height:1.35; }\n    .small { font-size:12px; color:var(--muted); }\n    .progressWrap { background:#071018; border:1px solid var(--line); border-radius:999px; overflow:hidden; height:18px; }\n    .progressInner { height:100%; width:0%; background:var(--bar); transition:width .15s ease; }\n    .progressText { display:flex; justify-content:space-between; font-size:12px; color:var(--muted); margin-top:6px; }\n    @media (max-width:720px){ h1{font-size:23px;} }\n  </style>\n</head>\n<body>\n<main>\n  <h1>AlphaDog Sleeper Video Parser</h1>\n  <p class=\"sub\">Upload a Sleeper screen recording. Gemini 3.1 Pro parses RBI and RFI cards and returns: Player - Team - Opponent - Date - Market - Line - Type. No database ingest yet.</p>\n  <section class=\"card grid\">\n    <div><label>Video file</label><input id=\"video\" type=\"file\" accept=\"video/mp4,video/quicktime,video/*\" /></div>\n    <div id=\"meta\" class=\"status\">No video selected.</div>\n    <div>\n      <div class=\"progressWrap\"><div id=\"progressInner\" class=\"progressInner\"></div></div>\n      <div class=\"progressText\"><span id=\"progressStage\">Idle</span><span id=\"progressPercent\">0%</span></div>\n    </div>\n    <button id=\"run\">Upload + Parse With Gemini 3.1 Pro</button>\n    <div id=\"status\" class=\"status\">Ready.</div>\n    <div id=\"configStatus\" class=\"small\">Config will load automatically from the AlphaDog control-room config.</div>\n  </section>\n  <section class=\"card\"><h2>Parsed Lines</h2><div id=\"summary\"><span class=\"pill\">Waiting for parse</span></div><div id=\"lines\"></div></section>\n  <section class=\"card\"><h2>Raw JSON</h2><pre id=\"json\">{}</pre></section>\n  <section class=\"card\"><h2>Event Log</h2><pre id=\"eventLog\">[]</pre></section>\n</main>\n<script>\nconst BASE = \"https://prop-ingestion-git.rodolfoaamattos.workers.dev\";\nconst UPLOAD_URL = BASE + \"/sleeper/video/upload\";\nconst STATUS_URL = BASE + \"/sleeper/video/status\";\nconst GENERATE_URL = BASE + \"/sleeper/video/generate\";\nconst CONFIG_URL = \"https://raw.githubusercontent.com/Rodantmat/Rod/main/config.txt\";\nconst $ = id => document.getElementById(id);\nconst videoInput = $('video'); const runBtn = $('run');\nlet selectedFile = null; let TOKEN = \"\"; let CONFIG_LOADED = false; const EVENTS = [];\nfunction addEvent(stage, detail){ const item={time:new Date().toISOString(),stage,detail:detail||null}; EVENTS.push(item); $('eventLog').textContent=JSON.stringify(EVENTS,null,2); }\nfunction setProgress(p, stage){ const v=Math.max(0,Math.min(100,Number(p)||0)); $('progressInner').style.width=v.toFixed(0)+'%'; $('progressPercent').textContent=v.toFixed(0)+'%'; if(stage) $('progressStage').textContent=stage; }\nfunction tokenFingerprint(){return TOKEN?{loaded:true,length:TOKEN.length,starts_with:TOKEN.slice(0,2),ends_with:TOKEN.slice(-2)}:{loaded:false,length:0}}\nasync function loadConfig(){ addEvent('config_load_start',{url:CONFIG_URL}); try{ const r=await fetch(CONFIG_URL+'?t='+Date.now(),{cache:'no-store'}); const t=await r.text(); const m=t.match(/^\\s*TOKEN\\s*=\\s*(.+?)\\s*$/m); if(m&&m[1].trim()){ TOKEN=m[1].trim().replace(/^[\"']|[\"']$/g,''); CONFIG_LOADED=true; $('configStatus').innerHTML='<span class=\"good\">Config loaded. Token fingerprint: '+JSON.stringify(tokenFingerprint())+'</span>'; addEvent('config_loaded',tokenFingerprint()); } else { TOKEN=''; CONFIG_LOADED=false; $('configStatus').innerHTML='<span class=\"warn\">Config loaded but TOKEN line was not found.</span>'; addEvent('config_missing_token'); } } catch(err){ TOKEN=''; CONFIG_LOADED=false; $('configStatus').innerHTML='<span class=\"bad\">Config load failed: '+String(err&&err.message||err)+'</span>'; addEvent('config_load_error',String(err&&err.message||err)); } }\nvideoInput.addEventListener('change',()=>{ selectedFile=videoInput.files&&videoInput.files[0]?videoInput.files[0]:null; setProgress(0,'Idle'); if(!selectedFile){$('meta').textContent='No video selected.'; addEvent('video_cleared'); return;} const mb=selectedFile.size/1024/1024; const warn=mb>50?'\\nWARNING: file is over 50MB; parsing can take up to 2 minutes or more.':''; $('meta').textContent=`Selected: ${selectedFile.name}\\nType: ${selectedFile.type||'unknown'}\\nSize: ${mb.toFixed(2)} MB${warn}`; addEvent('video_selected',{name:selectedFile.name,type:selectedFile.type||'unknown',size_mb:Number(mb.toFixed(2)),over_50mb:mb>50}); });\nfunction uploadWithProgress(file){ return new Promise((resolve,reject)=>{ const form=new FormData(); form.append('video',file,file.name); form.append('file_name',file.name); form.append('mime_type',file.type||'video/mp4'); const xhr=new XMLHttpRequest(); xhr.open('POST',UPLOAD_URL,true); if(TOKEN) xhr.setRequestHeader('x-ingest-token',TOKEN); xhr.upload.addEventListener('progress',e=>{ if(e.lengthComputable){ const pct=(e.loaded/e.total)*100; setProgress(pct,'Uploading video to Worker/Gemini File API'); }}); xhr.onreadystatechange=()=>{ if(xhr.readyState===4){ let data; try{data=JSON.parse(xhr.responseText||'{}');}catch(e){data={ok:false,error:'Upload response was not JSON',response_preview:(xhr.responseText||'').slice(0,1000)}} if(xhr.status>=200&&xhr.status<300&&data.ok) resolve(data); else reject(new Error(data.error||('Upload failed HTTP '+xhr.status+': '+(xhr.responseText||'').slice(0,500)))); }}; xhr.onerror=()=>reject(new Error('Network upload error')); xhr.send(form); }); }\nasync function pollFileActive(fileName){ const started=Date.now(); let last=null; for(let i=0;i<80;i++){ const elapsed=(Date.now()-started)/1000; setProgress(100,'Processing video file in Gemini: '+Math.round(elapsed)+'s'); const r=await fetch(STATUS_URL+'?file_name='+encodeURIComponent(fileName),{headers:TOKEN?{'x-ingest-token':TOKEN}:{}}); const data=await r.json().catch(()=>({ok:false,error:'status response not json'})); last=data; addEvent('file_status_poll',{try:i+1,state:data.state||null,ok:data.ok}); if(data.state==='ACTIVE') return data; if(data.state==='FAILED') throw new Error('Gemini file processing failed'); await new Promise(res=>setTimeout(res,3000)); } throw new Error('Timed out waiting for Gemini file ACTIVE. Last status: '+JSON.stringify(last)); }\nasync function generateFromFile(uploadData){ setProgress(100,'Asking Gemini to parse cards'); const r=await fetch(GENERATE_URL,{method:'POST',headers:{'content-type':'application/json',...(TOKEN?{'x-ingest-token':TOKEN}:{})},body:JSON.stringify({file_name:uploadData.file_name,file_uri:uploadData.file_uri,mime_type:uploadData.mime_type})}); const text=await r.text(); let data; try{data=JSON.parse(text);}catch(e){data={ok:false,error:'Generate response was not JSON',response_preview:text.slice(0,1200)}} if(!r.ok||!data.ok) throw new Error(JSON.stringify(data)); return data; }\nfunction renderResult(data){ $('json').textContent=JSON.stringify(data,null,2); const legs=Array.isArray(data.legs)?data.legs:[]; $('summary').innerHTML=`<span class=\"pill\">ok: ${data.ok}</span><span class=\"pill\">data_ok: ${data.data_ok}</span><span class=\"pill\">model: ${data.model||'unknown'}</span><span class=\"pill\">parsed: ${legs.length}</span>`; $('lines').innerHTML=''; const lines=Array.isArray(data.lines)?data.lines:legs.map(l=>[l.player_name,l.team,l.opponent,l.date,l.market,l.line,l.type].join(' - ')); if(!lines.length){$('lines').innerHTML='<div class=\"lineOut warn\">No parsed lines returned.</div>'; return;} for(const line of lines){ const div=document.createElement('div'); div.className='lineOut'; div.textContent=line; $('lines').appendChild(div); }}\nrunBtn.addEventListener('click',async()=>{ if(!selectedFile){$('status').innerHTML='<span class=\"bad\">Select a video first.</span>'; addEvent('parse_blocked_no_video'); return;} runBtn.disabled=true; const started=Date.now(); $('json').textContent='{}'; $('lines').innerHTML=''; $('summary').innerHTML='<span class=\"pill\">Running</span>'; try{ if(!CONFIG_LOADED||!TOKEN) await loadConfig(); addEvent('upload_start',{endpoint:UPLOAD_URL,file:selectedFile.name,size_bytes:selectedFile.size}); $('status').textContent='Uploading video with real progress...'; setProgress(0,'Starting upload'); const uploadData=await uploadWithProgress(selectedFile); addEvent('upload_done',{file_name:uploadData.file_name,state:uploadData.state,uri:uploadData.file_uri}); $('status').textContent='Upload complete. Waiting for Gemini file processing...'; const active=uploadData.state==='ACTIVE'?uploadData:await pollFileActive(uploadData.file_name); addEvent('file_active',{file_name:active.file_name||uploadData.file_name,state:active.state}); $('status').textContent='Gemini file is active. Parsing RBI/RFI cards...'; const result=await generateFromFile(uploadData); if(Array.isArray(result.event_log)) for(const e of result.event_log) addEvent('server_'+e.stage,e.detail); renderResult(result); $('status').innerHTML='<span class=\"good\">Parse complete.</span>'; addEvent('parse_complete',{parsed_count:result.parsed_count||0,elapsed_sec:Number(((Date.now()-started)/1000).toFixed(1))}); }catch(err){ const msg=String(err&&err.message||err); $('status').innerHTML='<span class=\"bad\">Parse failed: '+msg+'</span>'; $('json').textContent=JSON.stringify({ok:false,error:msg},null,2); addEvent('parse_error',msg); } finally{ addEvent('parse_finished',{elapsed_sec:Number(((Date.now()-started)/1000).toFixed(1))}); runBtn.disabled=false; }});\naddEvent('page_loaded',{upload_endpoint:UPLOAD_URL,status_endpoint:STATUS_URL,generate_endpoint:GENERATE_URL}); loadConfig();\n</script>\n</body>\n</html>\n";
const JOB_DISPLAY_LABELS = {
  run_full_pipeline: "SCRAPE > FULL RUN",
  scheduled_full_pipeline_plus_board_queue: "SCRAPE > FULL RUN + Board Queue Pipeline",
  daily_mlb_slate: "SCRAPE > Daily MLB Slate",
  scrape_games_markets: "SCRAPE > Markets",
  board_sifter_preview: "SCRAPE > Board Sifter Preview",
  board_queue_preview: "SCRAPE > Board Queue Preview",
  board_queue_build: "SCRAPE > Board Queue Build",
  board_queue_auto_build: "SCRAPE > Board Queue Auto Build",
  run_board_queue_pipeline: "SCRAPE > Board Queue Pipeline",
  board_queue_mine_one: "SCRAPE > Board Queue Mine One Raw",
  board_queue_auto_mine: "SCRAPE > Board Queue Auto Mine Raw",
  board_queue_repair: "REPAIR > Board Queue Raw State",
  build_edge_candidates_hits: "SCRAPE > Build Hits Candidates",
  build_edge_candidates_rbi: "SCRAPE > Build RBI Candidates",
  build_edge_candidates_rfi: "SCRAPE > Build RFI Candidates",
  scrape_teams: "SCRAPE > Teams",
  scrape_starters: "SCRAPE > Starters",
  scrape_starters_group_1: "SCRAPE > G1",
  scrape_starters_group_2: "SCRAPE > G2",
  scrape_starters_group_3: "SCRAPE > G3",
  scrape_starters_missing: "SCRAPE > Missing",
  scrape_starters_mlb_api: "SCRAPE > MLB API",
  repair_starters_mlb_api: "SCRAPE > MLB API",
  scrape_bullpens_mlb_api: "SCRAPE > MLB Bullpen",
  scrape_lineups_mlb_api: "SCRAPE > MLB Lineups",
  scrape_recent_usage_mlb_api: "SCRAPE > MLB Usage",
  scrape_derived_metrics: "SCRAPE > Run Derived Metrics",
  scrape_bullpens: "SCRAPE > Bullpen",
  scrape_lineups: "SCRAPE > Lineups",
  scrape_players: "SCRAPE > Players",
  scrape_players_mlb_api: "SCRAPE > MLB Players",
  scrape_players_mlb_api_g1: "SCRAPE > MLB Players G1",
  scrape_players_mlb_api_g2: "SCRAPE > MLB Players G2",
  scrape_players_mlb_api_g3: "SCRAPE > MLB Players G3",
  scrape_players_mlb_api_g4: "SCRAPE > MLB Players G4",
  scrape_players_mlb_api_g5: "SCRAPE > MLB Players G5",
  scrape_players_mlb_api_g6: "SCRAPE > MLB Players G6",
  scrape_recent_usage: "SCRAPE > Usage",
  scrape_static_venues: "STATIC > Scrape Venues",
  scrape_static_team_aliases: "STATIC > Scrape Team Aliases",
  scrape_static_players: "STATIC > Scrape Players (Legacy All)",
  scrape_static_players_g1: "STATIC > Scrape Players G1",
  scrape_static_players_g2: "STATIC > Scrape Players G2",
  scrape_static_players_g3: "STATIC > Scrape Players G3",
  scrape_static_players_g4: "STATIC > Scrape Players G4",
  scrape_static_players_g5: "STATIC > Scrape Players G5",
  scrape_static_players_g6: "STATIC > Scrape Players G6",
  scrape_static_player_splits_test_5: "STATIC > Scrape Splits Test 5",
  scrape_static_player_splits_g1: "STATIC > Scrape Splits G1",
  scrape_static_player_splits_g2: "STATIC > Scrape Splits G2",
  scrape_static_player_splits_g3: "STATIC > Scrape Splits G3",
  scrape_static_player_splits_g4: "STATIC > Scrape Splits G4",
  scrape_static_player_splits_g5: "STATIC > Scrape Splits G5",
  scrape_static_player_splits_g6: "STATIC > Scrape Splits G6",
  scrape_static_game_logs_g1: "STATIC > Scrape Game Logs G1",
  scrape_static_game_logs_g2: "STATIC > Scrape Game Logs G2",
  scrape_static_game_logs_g3: "STATIC > Scrape Game Logs G3",
  scrape_static_game_logs_g4: "STATIC > Scrape Game Logs G4",
  scrape_static_game_logs_g5: "STATIC > Scrape Game Logs G5",
  scrape_static_game_logs_g6: "STATIC > Scrape Game Logs G6",
  scrape_static_bvp_current_slate: "STATIC > Scrape BvP Current Slate",
  scrape_static_all_fast: "STATIC > Scrape All Fast",
  schedule_static_temp_refresh_once: "STATIC TEMP > Schedule Weekly Refresh Test",
  run_static_temp_refresh_tick: "STATIC TEMP > Run One Refresh Tick",
  check_static_temp_venues: "CHECK TEMP > Static Venues Temp",
  check_static_temp_team_aliases: "CHECK TEMP > Team Aliases Temp",
  check_static_temp_players: "CHECK TEMP > Players Temp",
  check_static_temp_all: "CHECK TEMP > All Static Temp",
  audit_static_temp_certification: "CERTIFY TEMP > Audit Static Temp",
  promote_static_temp_to_live: "CERTIFY TEMP > Promote Temp To Live",
  clean_static_temp_tables: "CERTIFY TEMP > Clean Static Temp",
  weekly_static_temp_refresh_auto: "SCHEDULED > Weekly Static Temp Refresh Auto",
  schedule_incremental_temp_refresh_once: "INCREMENTAL TEMP > Schedule Daily Refresh Test",
  run_incremental_temp_refresh_tick: "INCREMENTAL TEMP > Run One Refresh Tick",
  check_incremental_temp_all: "CHECK TEMP > All Incremental Temp",
  audit_incremental_temp_certification: "CERTIFY TEMP > Audit Incremental Temp",
  promote_incremental_temp_to_live: "CERTIFY TEMP > Promote Incremental Temp To Live",
  clean_incremental_temp_tables: "CERTIFY TEMP > Clean Incremental Temp",
  daily_incremental_temp_refresh_auto: "SCHEDULED > Daily Incremental Temp Refresh Auto",
  incremental_base_game_logs_g1: "INCREMENTAL > Base Game Logs G1",
  incremental_base_game_logs_g2: "INCREMENTAL > Base Game Logs G2",
  incremental_base_game_logs_g3: "INCREMENTAL > Base Game Logs G3",
  incremental_base_game_logs_g4: "INCREMENTAL > Base Game Logs G4",
  incremental_base_game_logs_g5: "INCREMENTAL > Base Game Logs G5",
  incremental_base_game_logs_g6: "INCREMENTAL > Base Game Logs G6",
  incremental_base_splits_g1: "INCREMENTAL > Base Splits G1",
  incremental_base_splits_g2: "INCREMENTAL > Base Splits G2",
  incremental_base_splits_g3: "INCREMENTAL > Base Splits G3",
  incremental_base_splits_g4: "INCREMENTAL > Base Splits G4",
  incremental_base_splits_g5: "INCREMENTAL > Base Splits G5",
  incremental_base_splits_g6: "INCREMENTAL > Base Splits G6",
  incremental_base_derived_metrics: "INCREMENTAL > Build Base Derived Metrics",
  repair_missing_ref_players: "INCREMENTAL > Repair Missing Ref Players",
  check_incremental_game_logs: "CHECK > Incremental Game Logs",
  check_incremental_player_splits: "CHECK > Incremental Player Splits",
  check_incremental_derived_metrics: "CHECK > Incremental Derived Metrics",
  check_incremental_all: "CHECK > Incremental All",
  schedule_everyday_phase1_once: "EVERYDAY PHASE 1 > Schedule Baseline Test",
  run_everyday_phase1_tick: "EVERYDAY PHASE 1 > Run Baseline Tick",
  check_everyday_phase1: "EVERYDAY PHASE 1 > Check Baseline",
  everyday_phase1_all_direct: "EVERYDAY PHASE 1 > Run Direct Baseline",
  scrape_phase2_weather_context: "EVERYDAY PHASE 2A > Run Weather/Roof",
  check_phase2_weather_context: "EVERYDAY PHASE 2A > Check Weather/Roof",
  scrape_phase2_lineup_context: "EVERYDAY PHASE 2B > Run Lineup/Scratch",
  check_phase2_lineup_context: "EVERYDAY PHASE 2B > Check Lineup/Scratch",
  scrape_phase2c_market_context: "EVERYDAY PHASE 2C > Run Market Context",
  check_phase2c_market_context: "EVERYDAY PHASE 2C > Check Market Context",
  schedule_phase3ab_full_run_test: "PHASE 3A/3B > Schedule Full Run Test",
  schedule_phase3ab_daily_4am: "PHASE 3A/3B > Schedule Daily 4AM",
  run_phase3ab_full_run_tick: "PHASE 3A/3B > Run Full Run Tick",
  check_phase3ab_full_run: "PHASE 3A/3B > Check Full Run",
  run_sleeper_rbi_rfi_market_board: "SLEEPER RBI/RFI > Run Board Signal",
  check_sleeper_rbi_rfi_market_board: "SLEEPER RBI/RFI > Check Board Signal",
  schedule_sleeper_rbi_rfi_daily_430: "SLEEPER RBI/RFI > Schedule/Run 6AM",
  run_sleeper_rbi_rfi_window_morning: "SLEEPER RBI/RFI > Run Morning Window",
  run_sleeper_rbi_rfi_window_afternoon: "SLEEPER RBI/RFI > Run Early Afternoon Window",
  check_sleeper_rbi_rfi_window_runner: "SLEEPER RBI/RFI > Check Window Runner",
  run_sleeper_rbi_rfi_prep_morning: "SLEEPER RBI/RFI > Run Morning Prep",
  run_sleeper_rbi_rfi_prep_afternoon: "SLEEPER RBI/RFI > Run Early Afternoon Prep",
  check_sleeper_rbi_rfi_window_prep: "SLEEPER RBI/RFI > Check Window Prep",
  run_odds_api_morning: "ODDS API > Run Morning Odds",
  run_odds_api_afternoon: "ODDS API > Run Early Afternoon Odds",
  check_odds_api_market_intel: "ODDS API > Check Market Intel",
  run_mlb_scoring_v1: "SCORING V1 > Run MLB Scores",
  check_mlb_scoring_v1: "SCORING V1 > Check MLB Scores",
  check_static_venues: "CHECK > Static Venues",
  check_static_team_aliases: "CHECK > Static Team Aliases",
  check_static_players: "CHECK > Static Players",
  check_static_player_splits: "CHECK > Static Player Splits",
  check_static_game_logs: "CHECK > Static Game Logs",
  check_static_bvp: "CHECK > Static BvP",
  check_static_all: "CHECK > All Static Data"
};

function displayLabelForJob(jobName) {
  const key = String(jobName || "").trim();
  return JOB_DISPLAY_LABELS[key] || (key ? `JOB > ${key}` : null);
}

function withDisplayLabel(row) {
  if (!row || typeof row !== "object") return row;
  if (!Object.prototype.hasOwnProperty.call(row, "job_name")) return row;
  return { display_label: displayLabelForJob(row.job_name), ...row };
}

function withDisplayLabels(rows) {
  return Array.isArray(rows) ? rows.map(withDisplayLabel) : [];
}


async function safeEnsureColumn(env, tableName, columnName, columnSpec) {
  try {
    const info = await env.DB.prepare(`PRAGMA table_info(${tableName})`).all();
    const cols = (info.results || []).map(r => String(r.name || '').toLowerCase());
    if (!cols.includes(String(columnName).toLowerCase())) {
      await env.DB.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnSpec}`).run();
      return { column: columnName, added: true };
    }
    return { column: columnName, added: false };
  } catch (err) {
    return { column: columnName, added: false, error: String(err?.message || err) };
  }
}

async function safeTableColumns(env, tableName) {
  try {
    const info = await env.DB.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set((info.results || []).map(r => String(r.name || '').toLowerCase()));
  } catch (_) { return new Set(); }
}

async function ensureStarterCompatibilityColumns(env) {
  const added = [];
  const dataSource = await safeEnsureColumn(env, 'starters_current', 'data_source', 'TEXT');
  added.push(dataSource);
  try {
    await env.DB.prepare(`
      UPDATE starters_current
      SET data_source = COALESCE(data_source, source)
      WHERE data_source IS NULL AND source IS NOT NULL
    `).run();
  } catch (err) {
    added.push({ column: 'data_source_backfill', added: false, error: String(err?.message || err) });
  }
  return { ok: true, table: 'starters_current', columns: added };
}

function normalizeStarterNameForGuard(name) { return String(name || '').trim(); }
function isUnknownStarterName(name) {
  const v = normalizeStarterNameForGuard(name).toLowerCase();
  if (!v) return true;
  return ['tbd','tba','unknown','starter','no probable pitcher','no starter','not available','unavailable','null','none'].includes(v);
}
function starterSourceText(row) { return `${String(row?.source || '')} ${String(row?.data_source || '')} ${String(row?.confidence || '')}`.toLowerCase(); }
function isManualStarterSource(row) { return starterSourceText(row).includes('manual'); }
function isFallbackStarterSource(row) {
  const text = starterSourceText(row);
  return text.includes('fallback') || text.includes('projected') || text.includes('gemini_live_missing_starter') || text.includes('gemini_live_projected_missing_starter') || text.includes('gemini_live_probable_missing_starter');
}
function isOfficialStarterSource(row) {
  const text = starterSourceText(row);
  return text.includes('official') || text.includes('mlb_statsapi_probable_pitcher') || text.includes('probable');
}
function shouldProtectExistingStarter(existing, incoming) {
  if (!existing) return false;
  const existingValid = !isUnknownStarterName(existing.starter_name);
  const incomingValid = !isUnknownStarterName(incoming?.starter_name);
  if (existingValid && !incomingValid) return true;
  if (existingValid && isManualStarterSource(existing) && !isManualStarterSource(incoming)) return true;
  if (existingValid && isOfficialStarterSource(existing) && isFallbackStarterSource(incoming) && !isOfficialStarterSource(incoming)) return true;
  return false;
}
async function sanitizeStarterRowsForProtectedUpsert(env, rows) {
  await ensureStarterCompatibilityColumns(env).catch(() => null);
  const out = [], skipped = [];
  const existingStmt = env.DB.prepare(`SELECT * FROM starters_current WHERE game_id=? AND team_id=? LIMIT 1`);
  for (const raw of rows || []) {
    const row = { ...(raw || {}) };
    row.team_id = String(row.team_id || '').toUpperCase();
    if (!row.data_source && row.source) row.data_source = row.source;
    if (!row.source && row.data_source) row.source = row.data_source;
    if (isUnknownStarterName(row.starter_name)) {
      skipped.push({ game_id: row.game_id || null, team_id: row.team_id || null, starter_name: row.starter_name || null, reason: 'incoming_blank_tbd_unknown_rejected' });
      continue;
    }
    let existing = null;
    try { existing = await existingStmt.bind(row.game_id, row.team_id).first(); } catch (_) { existing = null; }
    if (shouldProtectExistingStarter(existing, row)) {
      skipped.push({ game_id: row.game_id || null, team_id: row.team_id || null, existing_starter: existing?.starter_name || null, incoming_starter: row.starter_name || null, existing_source: existing?.source || existing?.data_source || null, incoming_source: row.source || row.data_source || null, reason: 'protected_existing_starter_preserved' });
      continue;
    }
    out.push(row);
  }
  return { rows: out, skipped };
}
async function stopFutureDuplicateRawResultsForQueue(env, queueId) {
  try {
    await env.DB.prepare(`
      DELETE FROM board_factor_results
      WHERE queue_id = ?
        AND (status <> 'COMPLETED' OR COALESCE(factor_count,0) <= 0 OR raw_json NOT LIKE '%"raw_mode":true%' OR raw_json NOT LIKE '%"raw_factors"%')
    `).bind(queueId).run();
  } catch (_) {}
}
async function writeCanonicalBoardFactorResult(env, queueRow, model, summary, parsed) {
  await stopFutureDuplicateRawResultsForQueue(env, queueRow.queue_id);
  const resultId = `${queueRow.queue_id}|RESULT`;
  const rawJson = JSON.stringify(parsed);
  const existingValid = await validRawResultForQueue(env, queueRow.queue_id);
  if (existingValid) return { result_id: existingValid.result_id, reused_existing: true };
  try {
    await env.DB.prepare(`
      INSERT INTO board_factor_results (result_id, queue_id, slate_date, queue_type, scope_type, scope_key, batch_index, status, model, factor_count, min_score, max_score, avg_score, raw_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(result_id) DO UPDATE SET
        status='COMPLETED', model=excluded.model, factor_count=excluded.factor_count,
        min_score=excluded.min_score, max_score=excluded.max_score, avg_score=excluded.avg_score,
        raw_json=excluded.raw_json, updated_at=CURRENT_TIMESTAMP
    `).bind(resultId, queueRow.queue_id, queueRow.slate_date, queueRow.queue_type, queueRow.scope_type, queueRow.scope_key, queueRow.batch_index, model, summary.factor_count, null, null, null, rawJson).run();
  } catch (_) {
    await env.DB.prepare(`DELETE FROM board_factor_results WHERE result_id=?`).bind(resultId).run().catch(() => null);
    await env.DB.prepare(`INSERT INTO board_factor_results (result_id, queue_id, slate_date, queue_type, scope_type, scope_key, batch_index, status, model, factor_count, min_score, max_score, avg_score, raw_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(resultId, queueRow.queue_id, queueRow.slate_date, queueRow.queue_type, queueRow.scope_type, queueRow.scope_key, queueRow.batch_index, model, summary.factor_count, null, null, null, rawJson).run();
  }
  return { result_id: resultId, reused_existing: false };
}
async function chooseFairBoardQueueType(env, slateDate) {
  const row = await env.DB.prepare(`
    WITH q AS (
      SELECT queue_type,
        SUM(CASE WHEN ((status='PENDING') OR (status='RETRY_LATER' AND updated_at < datetime('now', '-' || ((CASE WHEN COALESCE(retry_count,0) < 1 THEN 1 ELSE COALESCE(retry_count,0) END) * 5) || ' minutes'))) AND COALESCE(attempt_count,0) < ? THEN 1 ELSE 0 END) AS available_rows,
        SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending_rows,
        SUM(CASE WHEN status='RETRY_LATER' THEN 1 ELSE 0 END) AS retry_later_rows,
        SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed_queue_rows,
        COUNT(*) AS total_queue_rows
      FROM board_factor_queue
      WHERE slate_date=?
      GROUP BY queue_type
    ), r AS (
      SELECT queue_type,
        COUNT(DISTINCT CASE WHEN status='COMPLETED' AND COALESCE(factor_count,0) > 0 THEN queue_id ELSE NULL END) AS completed_result_queues
      FROM board_factor_results
      WHERE slate_date=?
      GROUP BY queue_type
    )
    SELECT q.queue_type, q.available_rows, q.pending_rows, q.retry_later_rows,
      q.completed_queue_rows, q.total_queue_rows, COALESCE(r.completed_result_queues,0) AS completed_result_queues,
      CASE q.queue_type
        WHEN 'PLAYER_D_ADVANCED_FORM_CONTACT' THEN 1
        WHEN 'GAME_NEWS_INJURY_CONTEXT' THEN 2
        WHEN 'GAME_WEATHER_CONTEXT' THEN 3
        WHEN 'PLAYER_A_ROLE_RECENT_MATCHUP' THEN 4
        WHEN 'GAME_B_TEAM_BULLPEN_ENVIRONMENT' THEN 5
        ELSE 99
      END AS family_priority
    FROM q LEFT JOIN r ON r.queue_type=q.queue_type
    WHERE q.available_rows > 0
    ORDER BY COALESCE(r.completed_result_queues,0) ASC,
      CAST(COALESCE(r.completed_result_queues,0) AS REAL) / CASE WHEN q.total_queue_rows > 0 THEN q.total_queue_rows ELSE 1 END ASC,
      family_priority ASC,
      q.available_rows DESC
    LIMIT 1
  `).bind(BOARD_QUEUE_RETRY_LIMIT, slateDate, slateDate).first();
  return row?.queue_type ? String(row.queue_type) : '';
}

async function ensurePipelineLocksTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS pipeline_locks (
      lock_id TEXT PRIMARY KEY,
      status TEXT DEFAULT 'IDLE',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      locked_by TEXT,
      note TEXT
    )
  `).run();
  return { ok: true, table: 'pipeline_locks' };
}

async function acquirePipelineLock(env, lockId, lockedBy, staleMinutes = 15) {
  await ensurePipelineLocksTable(env);
  await env.DB.prepare(`
    INSERT OR IGNORE INTO pipeline_locks (lock_id, status, updated_at, locked_by, note)
    VALUES (?, 'IDLE', CURRENT_TIMESTAMP, NULL, 'auto-created')
  `).bind(lockId).run();
  const res = await env.DB.prepare(`
    UPDATE pipeline_locks
    SET status='RUNNING', updated_at=CURRENT_TIMESTAMP, locked_by=?, note='acquired'
    WHERE lock_id=?
      AND (
        status IS NULL OR status <> 'RUNNING'
        OR updated_at < datetime('now', '-' || ? || ' minutes')
      )
  `).bind(lockedBy, lockId, String(staleMinutes)).run();
  const acquired = Number(res?.meta?.changes || 0) > 0;
  const row = await env.DB.prepare(`SELECT * FROM pipeline_locks WHERE lock_id=?`).bind(lockId).first();
  return { acquired, lock_id: lockId, locked_by: lockedBy, current: row || null };
}

async function releasePipelineLock(env, lockId, lockedBy) {
  try {
    const res = await env.DB.prepare(`
      UPDATE pipeline_locks
      SET status='IDLE', updated_at=CURRENT_TIMESTAMP, locked_by=NULL, note='released'
      WHERE lock_id=? AND (locked_by=? OR locked_by IS NULL OR status <> 'RUNNING')
    `).bind(lockId, lockedBy).run();
    return { released: Number(res?.meta?.changes || 0) > 0, lock_id: lockId };
  } catch (err) {
    return { released: false, lock_id: lockId, error: String(err?.message || err) };
  }
}

async function resetStalePipelineRuntime(env, slateDate = null) {
  const audit = { task_runs_reset: 0, queue_rows_reset: 0, locks_reset: 0 };
  try {
    const taskRes = await env.DB.prepare(`
      UPDATE task_runs
      SET status='stale_reset', finished_at=CURRENT_TIMESTAMP, error='v1.2.73 stale running task reset before lock acquisition'
      WHERE status='running'
        AND started_at < datetime('now','-15 minutes')
        AND job_name IN ('run_full_pipeline','scheduled_full_pipeline_plus_board_queue','board_queue_auto_mine','run_board_queue_pipeline')
    `).run();
    audit.task_runs_reset = Number(taskRes?.meta?.changes || 0);
  } catch (err) { audit.task_runs_error = String(err?.message || err); }
  try {
    const lockRes = await env.DB.prepare(`
      UPDATE pipeline_locks
      SET status='IDLE', updated_at=CURRENT_TIMESTAMP, locked_by=NULL, note='v1.2.73 stale lock reset'
      WHERE status='RUNNING'
        AND updated_at < datetime('now','-15 minutes')
    `).run();
    audit.locks_reset = Number(lockRes?.meta?.changes || 0);
  } catch (err) { audit.locks_error = String(err?.message || err); }
  try {
    const queueRes = slateDate
      ? await env.DB.prepare(`
          UPDATE board_factor_queue
          SET status='RETRY_LATER', last_error=COALESCE(last_error,'v1.2.73 stale RUNNING queue reset')
          WHERE slate_date=? AND status='RUNNING'
        `).bind(slateDate).run()
      : await env.DB.prepare(`
          UPDATE board_factor_queue
          SET status='RETRY_LATER', last_error=COALESCE(last_error,'v1.2.73 stale RUNNING queue reset')
          WHERE status='RUNNING'
        `).run();
    audit.queue_rows_reset = Number(queueRes?.meta?.changes || 0);
  } catch (err) { audit.queue_rows_error = String(err?.message || err); }
  return audit;
}

async function boardQueueTotals(env, slateDate) {
  const row = await env.DB.prepare(`
    SELECT COUNT(*) AS total_rows,
      SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending_rows,
      SUM(CASE WHEN status='RETRY_LATER' THEN 1 ELSE 0 END) AS retry_later_rows,
      SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed_rows,
      SUM(CASE WHEN status='RUNNING' THEN 1 ELSE 0 END) AS running_rows,
      SUM(CASE WHEN status='ERROR' THEN 1 ELSE 0 END) AS error_rows
    FROM board_factor_queue WHERE slate_date=?
  `).bind(slateDate).first();
  const total = Number(row?.total_rows || 0);
  const completed = Number(row?.completed_rows || 0);
  return {
    total_rows: total,
    pending_rows: Number(row?.pending_rows || 0),
    retry_later_rows: Number(row?.retry_later_rows || 0),
    completed_rows: completed,
    running_rows: Number(row?.running_rows || 0),
    error_rows: Number(row?.error_rows || 0),
    percent_complete: total > 0 ? Math.round((completed / total) * 1000) / 10 : 100
  };
}


const PROMPT_FILES = {
  ks: "score_ks_v1.txt",
  k: "score_ks_v1.txt",
  strikeouts: "score_ks_v1.txt",
  hits: "score_hits_v1.txt",
  hit: "score_hits_v1.txt",
  default: "score_default_v1.txt"
};

const JOBS = {
  run_full_pipeline: {
    prompt: null,
    tables: [],
    note: "full slate pipeline orchestrator"
  },
  board_sifter_preview: {
    prompt: null,
    tables: ["mlb_stats"],
    note: "PrizePicks board dry-run reader, single-player/game classifier, and prompt queue preview; no writes and no Gemini"
  },
  board_queue_preview: {
    prompt: null,
    tables: ["mlb_stats", "board_factor_queue"],
    note: "read-only preview of board-derived player/game factor queue; no Gemini and no writes"
  },
  board_queue_build: {
    prompt: null,
    tables: ["mlb_stats", "board_factor_queue"],
    note: "materializes one Cloudflare-safe board-derived factor queue slice; no Gemini calls"
  },
  board_queue_auto_build: {
    prompt: null,
    tables: ["mlb_stats", "board_factor_queue"],
    note: "auto-materializes all board-derived factor queue families using lightweight payloads; no Gemini calls"
  },
  run_board_queue_pipeline: {
    prompt: null,
    tables: ["mlb_stats", "board_factor_queue"],
    note: "scheduled board flow: materializes board-derived queue rows after the board table refresh; no Gemini calls"
  },
  board_queue_mine_one: {
    prompt: null,
    tables: ["board_factor_queue", "board_factor_results"],
    note: "mines exactly one pending board factor queue row with Gemini and stores raw factor output; no prop scoring"
  },
  board_queue_auto_mine: {
    prompt: null,
    tables: ["board_factor_queue", "board_factor_results"],
    note: "mines a Cloudflare-safe batch of pending board factor queue rows with Gemini; no prop scoring"
  },
  board_queue_repair: {
    prompt: null,
    tables: ["board_factor_queue", "board_factor_results"],
    note: "repairs queue/result status only: completed raw results win, stale running rows return to pending, optional error reset; no Gemini and no scoring"
  },
  schedule_phase3ab_full_run_test: {
    prompt: null,
    tables: ["deferred_full_run_once", "pipeline_locks", "board_factor_queue", "board_factor_results"],
    note: "schedules the Phase 3A/3B protected full-run test for the next minute; cron/tick mines to queue, promotes valid raw results, and cleans completed queue rows when complete"
  },
  schedule_phase3ab_daily_4am: {
    prompt: null,
    note: "schedules the Phase 3A/3B protected daily full run for current slate; real cron uses 0 11 * * * UTC / 4:00 AM PDT and minute cron continues postponed/partial work"
  },
  run_phase3ab_full_run_tick: {
    prompt: null,
    tables: ["deferred_full_run_once", "pipeline_locks", "board_factor_queue", "board_factor_results"],
    note: "advances one protected Phase 3A/3B full-run test tick with global no-parallel lock and postpone handling"
  },
  check_phase3ab_full_run: {
    prompt: null,
    tables: ["deferred_full_run_once", "pipeline_locks", "board_factor_queue", "board_factor_results"],
    note: "checks latest Phase 3A/3B full-run test request, queue health, result health, certification counts, lock state, and temp cleanup status"
  },
  daily_mlb_slate: {
    prompt: "scrape_daily_mlb_slate_v1.txt",
    tables: ["games", "markets_current"],
    note: "legacy alias locked to games+markets only"
  },
  scrape_games_markets: {
    prompt: "scrape_daily_mlb_slate_v1.txt",
    tables: ["games", "markets_current"],
    note: "games+markets only"
  },
  build_edge_candidates_hits: {
    prompt: null,
    tables: ["edge_candidates_hits"],
    note: "scheduled-task edge prep candidate pool for hits"
  },
  build_edge_candidates_rbi: {
    prompt: null,
    tables: ["edge_candidates_rbi"],
    note: "scheduled-task edge prep candidate pool for RBI"
  },
  build_edge_candidates_rfi: {
    prompt: null,
    tables: ["edge_candidates_rfi"],
    note: "scheduled-task edge prep candidate pool for RFI"
  },
  scrape_teams: {
    prompt: "scrape_teams_v1.txt",
    tables: ["teams_current"],
    note: "team profile only"
  },
  scrape_starters: {
    prompt: "scrape_starters_v1.txt",
    tables: ["starters_current"],
    note: "starter profile only - broad fallback"
  },
  scrape_starters_group_1: {
    prompt: "scrape_starters_group_v1.txt",
    tables: ["starters_current"],
    note: "starter profile group 1",
    gameDate: "{{SLATE_DATE}}",
    gameGroupIndex: 0,
    gameGroupSize: 5
  },
  scrape_starters_group_2: {
    prompt: "scrape_starters_group_v1.txt",
    tables: ["starters_current"],
    note: "starter profile group 2",
    gameDate: "{{SLATE_DATE}}",
    gameGroupIndex: 1,
    gameGroupSize: 5
  },
  scrape_starters_group_3: {
    prompt: "scrape_starters_group_v1.txt",
    tables: ["starters_current"],
    note: "starter profile group 3",
    gameDate: "{{SLATE_DATE}}",
    gameGroupIndex: 2,
    gameGroupSize: 5
  },
  scrape_starters_missing: {
    prompt: "scrape_starters_missing_v1.txt",
    tables: ["starters_current"],
    note: "targeted missing starter repair",
    gameDate: "{{SLATE_DATE}}"
  },
  scrape_starters_mlb_api: {
    prompt: null,
    tables: ["starters_current"],
    note: "MLB Stats API probable pitcher sync"
  },
  scrape_bullpens_mlb_api: {
    prompt: null,
    tables: ["bullpens_current"],
    note: "MLB Stats API bullpen fatigue sync"
  },
  scrape_lineups_mlb_api: {
    prompt: null,
    tables: ["lineups_current"],
    note: "MLB Stats API probable/official lineup sync"
  },
  repair_starters_mlb_api: {
    prompt: null,
    tables: ["starters_current"],
    note: "MLB Stats API missing starter repair"
  },
  scrape_lineups: {
    prompt: "scrape_lineups_v1.txt",
    tables: ["lineups_current"],
    note: "lineups only"
  },
  scrape_bullpens: {
    prompt: "scrape_bullpens_v1.txt",
    tables: ["bullpens_current"],
    note: "bullpens only"
  },
  scrape_players: {
    prompt: "scrape_players_v1.txt",
    tables: ["players_current"],
    note: "player current stats only"
  },
  scrape_players_mlb_api: {
    prompt: null,
    tables: ["players_current"],
    note: "MLB Stats API player identity and handedness"
  },
  scrape_players_mlb_api_g1: {
    prompt: null,
    tables: ["players_current"],
    note: "MLB Stats API player identity and handedness group 1"
  },
  scrape_players_mlb_api_g2: {
    prompt: null,
    tables: ["players_current"],
    note: "MLB Stats API player identity and handedness group 2"
  },
  scrape_players_mlb_api_g3: {
    prompt: null,
    tables: ["players_current"],
    note: "MLB Stats API player identity and handedness group 3"
  },
  scrape_players_mlb_api_g4: {
    prompt: null,
    tables: ["players_current"],
    note: "MLB Stats API player identity and handedness group 4"
  },
  scrape_players_mlb_api_g5: {
    prompt: null,
    tables: ["players_current"],
    note: "MLB Stats API player identity and handedness group 5"
  },
  scrape_players_mlb_api_g6: {
    prompt: null,
    tables: ["players_current"],
    note: "MLB Stats API player identity and handedness group 6"
  },

  scrape_static_venues: {
    prompt: null,
    tables: ["ref_venues"],
    note: "manual static venue reference rebuild from MLB StatsAPI plus controlled supplemental fields"
  },
  scrape_static_team_aliases: {
    prompt: null,
    tables: ["ref_team_aliases"],
    note: "manual static team alias dictionary rebuild from MLB StatsAPI"
  },
  scrape_static_players: {
    prompt: null,
    tables: ["ref_players"],
    note: "legacy all-team static active-player identity rebuild; prefer G1-G6 to avoid subrequest limits"
  },
  scrape_static_players_g1: { prompt: null, tables: ["ref_players"], note: "manual static active-player identity rebuild group 1; wipes ref_players first" },
  scrape_static_players_g2: { prompt: null, tables: ["ref_players"], note: "manual static active-player identity rebuild group 2; append only" },
  scrape_static_players_g3: { prompt: null, tables: ["ref_players"], note: "manual static active-player identity rebuild group 3; append only" },
  scrape_static_players_g4: { prompt: null, tables: ["ref_players"], note: "manual static active-player identity rebuild group 4; append only" },
  scrape_static_players_g5: { prompt: null, tables: ["ref_players"], note: "manual static active-player identity rebuild group 5; append only" },
  scrape_static_players_g6: { prompt: null, tables: ["ref_players"], note: "manual static active-player identity rebuild group 6; append only" },
  scrape_static_player_splits_test_5: { prompt: null, tables: ["ref_player_splits"], note: "safe 5-player static splits smoke test; does not wipe table" },
  scrape_static_player_splits_g1: { prompt: null, tables: ["ref_player_splits"], note: "manual static player standard splits group 1" },
  scrape_static_player_splits_g2: { prompt: null, tables: ["ref_player_splits"], note: "manual static player standard splits group 2" },
  scrape_static_player_splits_g3: { prompt: null, tables: ["ref_player_splits"], note: "manual static player standard splits group 3" },
  scrape_static_player_splits_g4: { prompt: null, tables: ["ref_player_splits"], note: "manual static player standard splits group 4" },
  scrape_static_player_splits_g5: { prompt: null, tables: ["ref_player_splits"], note: "manual static player standard splits group 5" },
  scrape_static_player_splits_g6: { prompt: null, tables: ["ref_player_splits"], note: "manual static player standard splits group 6" },
  scrape_static_game_logs_g1: { prompt: null, tables: ["player_game_logs"], note: "manual static player game logs group 1" },
  scrape_static_game_logs_g2: { prompt: null, tables: ["player_game_logs"], note: "manual static player game logs group 2" },
  scrape_static_game_logs_g3: { prompt: null, tables: ["player_game_logs"], note: "manual static player game logs group 3" },
  scrape_static_game_logs_g4: { prompt: null, tables: ["player_game_logs"], note: "manual static player game logs group 4" },
  scrape_static_game_logs_g5: { prompt: null, tables: ["player_game_logs"], note: "manual static player game logs group 5" },
  scrape_static_game_logs_g6: { prompt: null, tables: ["player_game_logs"], note: "manual static player game logs group 6" },
  scrape_static_bvp_current_slate: {
    prompt: null,
    tables: ["ref_bvp_history"],
    note: "manual on-demand BvP history for current slate batter/probable-pitcher pairs"
  },
  scrape_static_all_fast: {
    prompt: null,
    tables: ["ref_venues", "ref_team_aliases", "ref_players"],
    note: "manual fast static foundation rebuild: venues + team aliases + active player reference"
  },
  schedule_static_temp_refresh_once: { prompt: null, tables: ["ref_venues_temp", "ref_team_aliases_temp", "ref_players_temp"], note: "schedule one protected temp-only weekly static refresh test; live tables are untouched" },
  run_static_temp_refresh_tick: { prompt: null, tables: ["ref_venues_temp", "ref_team_aliases_temp", "ref_players_temp"], note: "manually execute one temp-only refresh step; live tables are untouched" },
  check_static_temp_venues: { prompt: null, tables: ["ref_venues_temp"], note: "check static temp venue staging table" },
  check_static_temp_team_aliases: { prompt: null, tables: ["ref_team_aliases_temp"], note: "check static temp team alias staging table" },
  check_static_temp_players: { prompt: null, tables: ["ref_players_temp"], note: "check static temp player staging table" },
  check_static_temp_all: { prompt: null, tables: ["ref_venues_temp", "ref_team_aliases_temp", "ref_players_temp"], note: "check all static temp staging tables" },
  audit_static_temp_certification: { prompt: null, tables: ["ref_venues_temp", "ref_team_aliases_temp", "ref_players_temp", "static_temp_certification_audits"], note: "certify temp static tables before promotion" },
  promote_static_temp_to_live: { prompt: null, tables: ["ref_venues", "ref_team_aliases", "ref_players", "ref_venues_temp", "ref_team_aliases_temp", "ref_players_temp"], note: "promote certified temp static tables to live trusted tables" },
  clean_static_temp_tables: { prompt: null, tables: ["ref_venues_temp", "ref_team_aliases_temp", "ref_players_temp"], note: "clean temp static staging tables after successful promotion" },
  schedule_incremental_temp_refresh_once: { prompt: null, tables: ["player_game_logs_temp", "ref_player_splits_temp"], note: "schedule protected daily incremental temp pipeline" },
  run_incremental_temp_refresh_tick: { prompt: null, tables: ["player_game_logs_temp", "ref_player_splits_temp"], note: "advance protected daily incremental temp pipeline" },
  check_incremental_temp_all: { prompt: null, tables: ["player_game_logs_temp", "ref_player_splits_temp"], note: "check daily incremental temp staging tables" },
  audit_incremental_temp_certification: { prompt: null, tables: ["player_game_logs_temp", "ref_player_splits_temp", "incremental_temp_certification_audits"], note: "certify daily incremental temp before promotion" },
  promote_incremental_temp_to_live: { prompt: null, tables: ["player_game_logs", "ref_player_splits", "incremental_player_metrics"], note: "promote certified daily incremental temp and rebuild derived after cleanup" },
  clean_incremental_temp_tables: { prompt: null, tables: ["player_game_logs_temp", "ref_player_splits_temp"], note: "clean daily incremental temp staging tables" },
  incremental_base_game_logs_g1: { prompt: null, tables: ["player_game_logs"], note: "incremental history base game logs group 1" },
  incremental_base_game_logs_g2: { prompt: null, tables: ["player_game_logs"], note: "incremental history base game logs group 2" },
  incremental_base_game_logs_g3: { prompt: null, tables: ["player_game_logs"], note: "incremental history base game logs group 3" },
  incremental_base_game_logs_g4: { prompt: null, tables: ["player_game_logs"], note: "incremental history base game logs group 4" },
  incremental_base_game_logs_g5: { prompt: null, tables: ["player_game_logs"], note: "incremental history base game logs group 5" },
  incremental_base_game_logs_g6: { prompt: null, tables: ["player_game_logs"], note: "incremental history base game logs group 6" },
  incremental_base_splits_g1: { prompt: null, tables: ["ref_player_splits"], note: "incremental history base player splits group 1" },
  incremental_base_splits_g2: { prompt: null, tables: ["ref_player_splits"], note: "incremental history base player splits group 2" },
  incremental_base_splits_g3: { prompt: null, tables: ["ref_player_splits"], note: "incremental history base player splits group 3" },
  incremental_base_splits_g4: { prompt: null, tables: ["ref_player_splits"], note: "incremental history base player splits group 4" },
  incremental_base_splits_g5: { prompt: null, tables: ["ref_player_splits"], note: "incremental history base player splits group 5" },
  incremental_base_splits_g6: { prompt: null, tables: ["ref_player_splits"], note: "incremental history base player splits group 6" },
  incremental_base_derived_metrics: { prompt: null, tables: ["incremental_player_metrics"], note: "derive rolling player metrics from game logs" },
  repair_missing_ref_players: { prompt: null, tables: ["ref_players", "player_game_logs", "ref_player_splits"], note: "repair missing reference-player rows for valid historical game-log/split rows" },
  check_incremental_game_logs: { prompt: null, tables: ["player_game_logs"], note: "check incremental game log base coverage" },
  check_incremental_player_splits: { prompt: null, tables: ["ref_player_splits"], note: "check incremental player split base coverage" },
  check_incremental_derived_metrics: { prompt: null, tables: ["incremental_player_metrics"], note: "check derived incremental metrics coverage" },
  check_incremental_all: { prompt: null, tables: ["player_game_logs", "ref_player_splits", "incremental_player_metrics"], note: "check all incremental base tables" },

  schedule_everyday_phase1_once: { prompt: null, tables: ["games", "markets_current", "starters_current", "bullpens_current", "lineups_current", "player_recent_usage", "edge_candidates_hits", "edge_candidates_rbi", "edge_candidates_rfi"], note: "schedule one protected everyday phase 1 baseline pipeline test" },
  run_everyday_phase1_tick: { prompt: null, tables: ["games", "markets_current", "starters_current", "bullpens_current", "lineups_current", "player_recent_usage", "edge_candidates_hits", "edge_candidates_rbi", "edge_candidates_rfi"], note: "advance one protected everyday phase 1 baseline pipeline step" },
  check_everyday_phase1: { prompt: null, tables: ["games", "markets_current", "starters_current", "bullpens_current", "lineups_current", "player_recent_usage", "edge_candidates_hits", "edge_candidates_rbi", "edge_candidates_rfi", "mlb_stats"], note: "check everyday phase 1 baseline readiness" },
  everyday_phase1_all_direct: { prompt: null, tables: ["games", "markets_current", "starters_current", "bullpens_current", "lineups_current", "player_recent_usage", "edge_candidates_hits", "edge_candidates_rbi", "edge_candidates_rfi"], note: "direct one-request phase 1 baseline runner; use scheduled/tick path first on iPhone" },
  scrape_phase2_weather_context: { prompt: null, tables: ["game_weather_context", "games", "ref_venues"], note: "Phase 2A today-slate weather/wind/roof context. OpenWeather primary, Open-Meteo no-key fallback. No scoring." },
  check_phase2_weather_context: { prompt: null, tables: ["game_weather_context", "games"], note: "Check Phase 2A weather/wind/roof context coverage for today slate" },
  scrape_phase2_lineup_context: { prompt: null, tables: ["game_lineup_context", "games", "lineups_current"], note: "Phase 2B today-slate lineup confirmation with last-available lineup fallback, top-order completeness, and late-scratch shell. No scoring and no Gemini." },
  check_phase2_lineup_context: { prompt: null, tables: ["game_lineup_context", "games", "lineups_current"], note: "Check Phase 2B lineup confirmation, last-lineup fallback, and late-scratch shell readiness" },
  scrape_phase2c_market_context: { prompt: null, tables: ["prizepicks_current_market_context", "phase2c_market_context_runs", "mlb_stats"], note: "Phase 2C-I current PrizePicks board market/projection context from latest mlb_stats capture window, processed in bounded chunks. No scoring, no external odds, no Gemini." },
  check_phase2c_market_context: { prompt: null, tables: ["prizepicks_current_market_context", "phase2c_market_context_runs", "mlb_stats"], note: "Check Phase 2C-I current PrizePicks market/projection context readiness and chunk runner state" },

  check_static_venues: { prompt: null, tables: ["ref_venues"], note: "check static venue reference" },
  check_static_team_aliases: { prompt: null, tables: ["ref_team_aliases"], note: "check static team alias dictionary" },
  check_static_players: { prompt: null, tables: ["ref_players"], note: "check static player reference" },
  check_static_player_splits: { prompt: null, tables: ["ref_player_splits"], note: "check static player splits" },
  check_static_game_logs: { prompt: null, tables: ["player_game_logs"], note: "check static game logs" },
  check_static_bvp: { prompt: null, tables: ["ref_bvp_history"], note: "check BvP history" },
  check_static_all: { prompt: null, tables: ["ref_venues", "ref_team_aliases", "ref_players", "ref_player_splits", "player_game_logs", "ref_bvp_history"], note: "check all static data" },
  scrape_recent_usage: {
    prompt: "scrape_recent_usage_v1.txt",
    tables: ["player_recent_usage"],
    note: "recent usage only"
  },
  scrape_recent_usage_mlb_api: {
    prompt: null,
    tables: ["player_recent_usage"],
    note: "MLB Stats API previous-game player usage"
  }
};

const TABLES = {
  games: {
    allowed: ["game_id", "game_date", "away_team", "home_team", "start_time_utc", "venue", "series_game", "getaway_day", "status"],
    required: ["game_id", "game_date", "away_team", "home_team"],
    conflict: ["game_id"]
  },
  markets_current: {
    allowed: ["game_id", "game_total", "open_total", "current_total", "away_moneyline", "home_moneyline", "away_implied_runs", "home_implied_runs", "runline", "source", "confidence"],
    required: ["game_id"],
    conflict: ["game_id"]
  },
  teams_current: {
    allowed: ["team_id", "avg", "obp", "slg", "ops", "k_rate", "bb_rate", "runs_per_game", "hr", "rbi", "total_bases", "run_diff", "games_played", "errors", "dp", "fielding_pct", "source", "confidence"],
    required: ["team_id"],
    conflict: ["team_id"]
  },
  starters_current: {
    allowed: ["game_id", "team_id", "starter_name", "throws", "era", "whip", "strikeouts", "innings_pitched", "walks", "hits_allowed", "hr_allowed", "days_rest", "source", "data_source", "confidence"],
    required: ["game_id", "team_id", "starter_name"],
    conflict: ["game_id", "team_id"]
  },
  bullpens_current: {
    allowed: ["game_id", "team_id", "bullpen_era", "bullpen_whip", "last_game_ip", "last3_ip", "fatigue", "source", "confidence"],
    required: ["game_id", "team_id"],
    conflict: ["game_id", "team_id"]
  },
  lineups_current: {
    allowed: ["game_id", "team_id", "slot", "player_name", "bats", "k_rate", "is_confirmed", "source", "confidence"],
    required: ["game_id", "team_id", "slot", "player_name"],
    conflict: ["game_id", "team_id", "slot"],
    deleteInsert: true
  },
  players_current: {
    allowed: ["player_name", "team_id", "role", "games", "innings_pitched", "strikeouts", "walks", "hits_allowed", "era", "k_per_9", "whip", "ab", "hits", "avg", "obp", "slg", "age", "position", "bats", "throws", "source", "confidence"],
    required: ["player_name"],
    conflict: ["player_name"],
    deleteInsert: true
  },
  player_recent_usage: {
    allowed: ["player_name", "team_id", "last_pitch_count", "last_innings", "days_rest", "last_game_ab", "last_game_hits", "lineup_slot"],
    required: ["player_name"],
    conflict: ["player_name"],
    deleteInsert: true
  }
,
  edge_candidates_hits: {
    allowed: ["candidate_id", "slate_date", "game_id", "team_id", "opponent_team", "player_name", "lineup_slot", "bats", "opposing_starter", "opposing_throws", "player_avg", "player_obp", "player_slg", "last_game_ab", "last_game_hits", "park_factor_run", "park_factor_hr", "bullpen_fatigue_score", "bullpen_fatigue_tier", "lineup_context_status", "candidate_tier", "candidate_reason", "source", "confidence"],
    required: ["candidate_id", "slate_date", "game_id", "team_id", "player_name"],
    conflict: ["candidate_id"]
  }};


const SLEEPER_TEXT_INGEST_HTML = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AlphaDog Sleeper Text Ingest</title><style>body{margin:0;background:#071018;color:#eaf2ff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}main{max-width:1050px;margin:auto;padding:18px}.card{background:#101b26;border:1px solid #26384d;border-radius:16px;padding:14px;margin:12px 0}textarea,input,select{width:100%;box-sizing:border-box;background:#132333;color:#eaf2ff;border:1px solid #26384d;border-radius:10px;padding:10px}textarea{min-height:330px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}button{width:100%;border:0;border-radius:12px;padding:13px;font-weight:800;background:#eaf2ff;color:#071018}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pill{display:inline-block;border:1px solid #26384d;border-radius:999px;padding:5px 8px;color:#9fb2c8;margin:3px;font-size:12px}pre{max-height:380px;overflow:auto;background:#071018;border:1px solid #26384d;border-radius:10px;padding:10px}.good{color:#74f0a7}.bad{color:#ff7a7a}.warn{color:#ffd36e}table{width:100%;border-collapse:collapse;font-size:13px}td,th{border-bottom:1px solid #26384d;padding:7px;text-align:left}.wrap{max-height:500px;overflow:auto}@media(max-width:760px){.grid,.grid2{grid-template-columns:1fr}}</style></head><body><main><h1>AlphaDog Sleeper Text Ingest</h1><p>Paste Gemini app output from Sleeper videos. Saves RBI/RFI board rows. Format: Player - Team - Opponent - Date - Market - Line - Type.</p><section class="card"><div class="grid"><div><label>Slate date</label><input id="slate" type="date"></div><div><label>Source</label><input id="src" value="sleeper_gemini_text"></div><div><label>Replace slate?</label><select id="replace"><option value="0">No</option><option value="1">Yes</option></select></div></div></section><section class="card"><textarea id="txt" placeholder="Colt Keith - DET - @ ATL - Thu 9:15am - RBI - 0.5 - regular"></textarea><div class="grid2" style="margin-top:10px"><button id="parse">Parse Preview</button><button id="save">Parse + Save</button></div><p id="status">Ready.</p><p id="cfg">Loading config...</p></section><section class="card"><h2>Summary</h2><div id="summary"><span class="pill">Waiting</span></div></section><section class="card"><h2>Rows</h2><div id="rows" class="wrap">No rows parsed.</div></section><section class="card"><h2>Raw JSON</h2><pre id="json">{}</pre></section><section class="card"><h2>Event Log</h2><pre id="log">[]</pre></section></main><script>const BASE='https://prop-ingestion-git.rodolfoaamattos.workers.dev',CONFIG='https://raw.githubusercontent.com/Rodantmat/Rod/main/config.txt';let TOKEN='',EVENTS=[];const $=id=>document.getElementById(id);function ev(s,d){EVENTS.push({time:new Date().toISOString(),stage:s,detail:d||null});$('log').textContent=JSON.stringify(EVENTS,null,2)}function day(){let d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}$('slate').value=day();async function cfg(){ev('config_load_start');try{let t=await(await fetch(CONFIG+'?t='+Date.now())).text(),m=t.match(/^\s*TOKEN\s*=\s*(.+?)\s*$/m);TOKEN=m?m[1].trim().replace(/^["']|["']$/g,''):'';$('cfg').innerHTML=TOKEN?'<span class=good>Config loaded</span>':'<span class=warn>No TOKEN found</span>';ev('config_loaded',{loaded:!!TOKEN,length:TOKEN.length})}catch(e){$('cfg').innerHTML='<span class=bad>Config failed</span>';ev('config_error',String(e))}}function payload(){return{slate_date:$('slate').value,source_label:$('src').value,replace_slate:$('replace').value==='1',raw_text:$('txt').value}}async function post(path){if(!TOKEN)await cfg();let r=await fetch(BASE+path,{method:'POST',headers:{'content-type':'application/json','x-ingest-token':TOKEN},body:JSON.stringify(payload())});let j=await r.json().catch(()=>({ok:false,error:'not_json'}));if(!r.ok)throw Error(JSON.stringify(j));return j}function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function render(j){$('json').textContent=JSON.stringify(j,null,2);let rows=j.rows||[];$('summary').innerHTML='<span class=pill>ok: '+j.ok+'</span><span class=pill>parsed: '+(j.parsed_count||0)+'</span><span class=pill>saved: '+(j.saved_count||0)+'</span><span class=pill>RBI: '+((j.counts&&j.counts.RBI)||0)+'</span><span class=pill>RFI: '+((j.counts&&j.counts.RFI)||0)+'</span><span class=pill>errors: '+((j.errors||[]).length)+'</span>';if(!rows.length){$('rows').textContent='No rows parsed.';return}let h='<table><tr><th>#</th><th>Player</th><th>Team</th><th>Opp</th><th>Date</th><th>Market</th><th>Line</th><th>Type</th></tr>';rows.forEach((r,i)=>h+='<tr><td>'+(i+1)+'</td><td>'+esc(r.player_name)+'</td><td>'+esc(r.team)+'</td><td>'+esc(r.opponent)+'</td><td>'+esc(r.date_label)+'</td><td>'+esc(r.market)+'</td><td>'+esc(r.line_score)+'</td><td>'+esc(r.entry_type)+'</td></tr>');$('rows').innerHTML=h+'</table>'}$('parse').onclick=async()=>{try{$('status').textContent='Parsing...';ev('parse_start');let j=await post('/sleeper/text/parse');render(j);$('status').innerHTML='<span class=good>Preview parsed</span>';ev('parse_done',{parsed:j.parsed_count})}catch(e){$('status').innerHTML='<span class=bad>'+String(e.message||e)+'</span>';ev('parse_error',String(e.message||e))}};$('save').onclick=async()=>{try{$('status').textContent='Saving...';ev('save_start');let j=await post('/sleeper/text/save');render(j);$('status').innerHTML='<span class=good>Saved</span>';ev('save_done',{saved:j.saved_count})}catch(e){$('status').innerHTML='<span class=bad>'+String(e.message||e)+'</span>';ev('save_error',String(e.message||e))}};ev('page_loaded');cfg();</script></body></html>`;


const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-ingest-token"
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });
}

function withCors(response) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function isAuthorized(request, env) {
  const expected = env && env.INGEST_TOKEN;
  if (!expected) return true;
  return request.headers.get("x-ingest-token") === expected;
}

function unauthorized() {
  return json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method === "OPTIONS") {
        return new Response(null, { headers: CORS_HEADERS });
      }

      if (url.pathname === "/health") { const h = health(env); await logSystemEvent(env, { trigger_source: "control_room_debug", action_label: "DEBUG > Health", job_name: "health", status: "success", http_status: 200, output_preview: h }); return json(h); }
      if (url.pathname === "/health/daily") return withCors(await handleDailyHealth(request, env));
      if (url.pathname === "/debug/sql" && request.method === "POST") return await handleDebugSQL(request, env);
      if (url.pathname === "/deferred/full-run" && request.method === "POST") return withCors(await handleDeferredFullRunRequest(request, env));
      if (url.pathname === "/board/factor-results/inspect") return withCors(await handleBoardFactorResultInspect(request, env));
      if (url.pathname === "/board/queue-payload/inspect") return withCors(await handleBoardQueuePayloadInspect(request, env));
      if (url.pathname === "/tasks/run" && request.method === "POST") return withCors(await handleTaskRun(request, env));
      if (url.pathname === "/packet/leg" && request.method === "POST") return withCors(await handleLegPacket(request, env));
      if (url.pathname === "/score/leg" && request.method === "POST") return withCors(await handleScoreLeg(request, env));
      if (url.pathname === "/ingest/upsert" && request.method === "POST") return withCors(await handleUpsert(request, env));

      if (url.pathname === "/sleeper/video/upload" && request.method === "POST") return withCors(await handleSleeperVideoUpload(request, env));
      if (url.pathname === "/sleeper/video/status" && request.method === "GET") return withCors(await handleSleeperVideoStatus(request, env));
      if (url.pathname === "/sleeper/video/generate" && request.method === "POST") return withCors(await handleSleeperVideoGenerate(request, env));
      if (url.pathname === "/sleeper/video/parse" && request.method === "POST") return withCors(await handleSleeperVideoParse(request, env));
      if (url.pathname === "/sleeper/video/parser" && request.method === "GET") return withCors(new Response(SLEEPER_VIDEO_PARSER_HTML, { headers: { "content-type": "text/html; charset=utf-8" } }));
      if (url.pathname === "/sleeper/text/ingest" && request.method === "GET") return withCors(new Response(SLEEPER_TEXT_INGEST_HTML, { headers: { "content-type": "text/html; charset=utf-8" } }));
      if (url.pathname === "/sleeper/text/parse" && request.method === "POST") return withCors(await handleSleeperTextParse(request, env));
      if (url.pathname === "/sleeper/text/save" && request.method === "POST") return withCors(await handleSleeperTextSave(request, env));
      if (url.pathname === "/sleeper/text/check" && request.method === "GET") return withCors(await handleSleeperTextCheck(request, env));

      return json({ ok: false, error: "Not found", path: url.pathname }, { status: 404 });
    } catch (err) {
      return json({ ok: false, error: String(err?.message || err), stack: String(err?.stack || "") }, { status: 500 });
    }
  },
  async scheduled(event, env, ctx) {
    // v1.2.82: all old scheduled mining/full-run work stays paused.
    // Allowed cron behavior only:
    //   * * * * *  => advances one protected static-temp pipeline step if a request is due.
    //   0 8 * * 1  => schedules the weekly Monday 1:00 AM PT/PDT static-temp certification pipeline.
    ctx.waitUntil((async () => {
      const cron = String(event?.cron || '').trim();
      let result;
      if (cron === '45 8 * * *') {
        const scheduled = await scheduleIncrementalTempRefreshOnce({ job: 'daily_incremental_temp_refresh_auto', trigger: 'scheduled_daily_cron', cron, daily_schedule: 'Daily 1:45 AM PT/PDT' }, env);
        const tick = await runIncrementalTempScheduledTick({ cron, trigger: 'scheduled_daily_cron_start', job: 'run_incremental_temp_refresh_tick' }, env);
        result = { ok: true, data_ok: !!scheduled.data_ok || scheduled.status === 'already_scheduled_or_running', version: SYSTEM_VERSION, job: 'daily_incremental_temp_refresh_auto', status: 'daily_refresh_scheduled', cron, daily_schedule: 'Daily 1:45 AM PT/PDT', scheduled, first_tick: tick, live_tables_touched: false, note: 'Daily incremental refresh started in _temp only. Minute cron will finish scrape/stage, certify, promote only if A+/A, clean temp, then rebuild derived metrics.' };
      } else if (cron === '0 8 * * 1') {
        const scheduled = await scheduleStaticTempRefreshOnce({ job: 'weekly_static_temp_refresh_auto', trigger: 'scheduled_weekly_cron', cron, weekly_schedule: 'Monday 1:00 AM PT/PDT' }, env);
        const tick = await runStaticTempScheduledTick({ cron, trigger: 'scheduled_weekly_cron_start', job: 'run_static_temp_refresh_tick' }, env);
        result = { ok: true, data_ok: !!scheduled.data_ok || scheduled.status === 'already_scheduled_or_running', version: SYSTEM_VERSION, job: 'weekly_static_temp_refresh_auto', status: 'weekly_refresh_scheduled', cron, weekly_schedule: 'Monday 1:00 AM PT/PDT', scheduled, first_tick: tick, live_tables_touched: false, note: 'Weekly static refresh started in _temp only. Minute cron will finish scrape, certify, promote only if A+/A, then clean temp.' };
      } else if (cron === '0 11 * * *') {
        const scheduled = await schedulePhase3abDaily4am({ job: 'schedule_phase3ab_daily_4am', trigger: 'scheduled_phase3ab_4am_cron', cron, daily_schedule: 'Daily 4:00 AM PDT / 11:00 UTC' }, env);
        const firstTick = await runDuePhase3abFullRun(env);
        result = { ok: true, data_ok: !!scheduled.data_ok || scheduled.status === 'already_scheduled_or_running', version: SYSTEM_VERSION, job: 'schedule_phase3ab_daily_4am', status: 'daily_phase3ab_scheduled', cron, daily_schedule: 'Daily 4:00 AM PDT / 11:00 UTC', scheduled, first_tick: firstTick, postpone_rule: 'If the global Phase 3 lock is busy, the request remains pending and retries 15 minutes later through the minute cron.', note: 'Phase 3A/3B daily full run scheduled. Minute cron continues build/mining ticks until complete; no parallel Phase 3 work is allowed.' };
      } else if (cron === '30 11 * * *') {
        const odds = await runOddsApiMarketIntel({ job: 'run_odds_api_morning', trigger: 'scheduled_odds_api_morning_430am', cron, window_name: 'MORNING', daily_schedule: 'Daily 4:30 AM PDT / 11:30 UTC' }, env);
        const scoring = odds.data_ok ? await runMlbScoringV1({ job:'run_mlb_scoring_v1', trigger:'scheduled_after_odds_api_morning_430am', cron }, env) : { ok:false, status:'skipped' };
        result = { ok: true, data_ok: !!odds.data_ok, version: SYSTEM_VERSION, job: 'scheduled_odds_api_morning_430am', status: odds.data_ok ? 'promoted_and_scored' : 'needs_review', cron, odds, scoring, note: 'Odds API temp-stage -> promote -> clean, then Scoring V1 temp-stage -> promote -> audit -> active board -> clean. No Gemini.' };
      } else if (cron === '0 13 * * *') {
        const board = await runSleeperRbiRfiMarketBoard({ job: 'run_sleeper_rbi_rfi_market_board', trigger: 'scheduled_sleeper_rbi_rfi_6am_cron', cron, daily_schedule: 'Daily 6:00 AM PDT / 13:00 UTC' }, env);
        const morning = await runSleeperRbiRfiWindowRunner({ job: 'run_sleeper_rbi_rfi_window_morning', trigger: 'scheduled_sleeper_rbi_rfi_morning_window', cron, window_name: 'MORNING', daily_schedule: 'Daily 6:00 AM PDT / 13:00 UTC' }, env);
        const odds = await runOddsApiMarketIntel({ job: 'run_odds_api_morning', trigger: 'scheduled_odds_api_morning_6am_refresh', cron, window_name: 'MORNING', daily_schedule: 'Daily 6:00 AM PDT / 13:00 UTC' }, env);
        const scoring = odds.data_ok ? await runMlbScoringV1({ job:'run_mlb_scoring_v1', trigger:'scheduled_after_6am_odds_refresh', cron }, env) : { ok:false, status:'skipped' };
        result = { ok: true, data_ok: !!morning.data_ok || !!odds.data_ok, version: SYSTEM_VERSION, job: 'scheduled_sleeper_plus_odds_api_morning_6am_refresh', status: 'completed', cron, board, morning, odds, scoring, note: 'Sleeper plus Odds API refresh, then Scoring V1 if odds promoted. No Gemini for scoring.' };
      } else if (cron === '0 17 * * *') {
        const window = await runSleeperRbiRfiWindowRunner({ job: 'run_sleeper_rbi_rfi_window_afternoon', trigger: 'scheduled_sleeper_rbi_rfi_afternoon_window', cron, window_name: 'EARLY_AFTERNOON', daily_schedule: 'Daily 10:00 AM PDT / 17:00 UTC' }, env);
        const scoring = await runMlbScoringV1({ job:'run_mlb_scoring_v1', trigger:'scheduled_after_sleeper_afternoon_window', cron }, env);
        result = { ok: true, data_ok: !!window.data_ok || !!scoring.data_ok, version: SYSTEM_VERSION, job: 'scheduled_sleeper_afternoon_window_plus_score', status: 'completed_and_scored', cron, window, scoring, note: 'Sleeper board/window refresh triggered a full Scoring V1 update. Freshness is audit-only. No Gemini for scoring.' };
      } else if (cron === '0 18 * * *') {
        const odds = await runOddsApiMarketIntel({ job: 'run_odds_api_afternoon', trigger: 'scheduled_odds_api_afternoon_11am', cron, window_name: 'EARLY_AFTERNOON', daily_schedule: 'Daily 11:00 AM PDT / 18:00 UTC' }, env);
        const scoring = odds.data_ok ? await runMlbScoringV1({ job:'run_mlb_scoring_v1', trigger:'scheduled_after_odds_api_afternoon_11am', cron }, env) : { ok:false, status:'skipped' };
        result = { ok: true, data_ok: !!odds.data_ok, version: SYSTEM_VERSION, job: 'scheduled_odds_api_afternoon_11am', status: odds.data_ok ? 'promoted_and_scored' : 'needs_review', cron, odds, scoring, note: 'Odds API afternoon temp-stage -> promote -> clean, then Scoring V1. No Gemini.' };
      } else if (cron === '35 11 * * *' || cron === '5 13 * * *' || cron === '5 18 * * *') {
        result = await runMlbScoringV1({ job:'run_mlb_scoring_v1', trigger:'scheduled_scoring_safety_cron', cron }, env);
      } else if (cron === '* * * * *') {
        // v1.3.18: Phase 3A/3B deferred work has priority on minute ticks.
        // This fixes due phase3ab_daily_4am rows staying PENDING while manual ticks still advance mining.
        const phase3DueTick = await runDuePhase3abFullRun(env);
        if (phase3DueTick && phase3DueTick.status !== 'NO_PHASE3AB_DEFERRED_DUE') {
          result = { ok: true, data_ok: !!phase3DueTick.data_ok, version: SYSTEM_VERSION, job: 'phase3ab_minute_due_tick', status: 'phase3ab_advanced', cron, phase3_tick: phase3DueTick, note: 'Minute cron advanced one due Phase 3A/3B protected tick before any other minute work.' };
        } else {
          const fallbackSchedule = await ensurePhase3abDaily4amFromMinuteFallback(env, cron);
          if (fallbackSchedule && fallbackSchedule.status === 'scheduled_due_now') {
            const firstTick = await runDuePhase3abFullRun(env);
            result = { ok: true, data_ok: true, version: SYSTEM_VERSION, job: 'phase3ab_minute_fallback_daily_4am', status: 'scheduled_and_started', cron, fallback_schedule: fallbackSchedule, first_tick: firstTick, note: 'Minute fallback created the missing daily Phase 3A/3B request and advanced one protected tick.' };
          } else {
            const incTick = await runIncrementalTempScheduledTick({ cron, trigger: 'scheduled_minute_tick', job: 'run_incremental_temp_refresh_tick' }, env);
            if (incTick && incTick.status !== 'idle_no_due_temp_refresh') result = incTick;
            else {
              const staticTick = await runStaticTempScheduledTick({ cron, trigger: 'scheduled_minute_tick', job: 'run_static_temp_refresh_tick' }, env);
              if (staticTick && staticTick.status !== 'idle_no_due_static_refresh') result = staticTick;
              else result = phase3DueTick;
            }
          }
        }
      } else {
        result = { ok: true, version: SYSTEM_VERSION, job: 'scheduled_router', status: 'paused_disabled', cron, note: 'Old scheduled tasks remain paused. No mining queues, full-run jobs, slate tables, splits, game logs, or BvP tables were mutated.' };
      }
      console.log(JSON.stringify(result));
    })());
  }
};


function pad2(n) { return String(n).padStart(2, "0"); }

function addDaysISO(dateISO, days) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + Number(days || 0));
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

function getPTParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  }).formatToParts(now);
  const m = {};
  for (const p of parts) m[p.type] = p.value;
  return { date: `${m.year}-${m.month}-${m.day}`, hour: Number(m.hour), time: `${m.hour}:${m.minute}:${m.second}` };
}

function resolveSlateDate(input = {}) {
  const mode = String(input.slate_mode || input.mode || "AUTO").toUpperCase();
  const manual = String(input.manual_slate_date || input.slate_date || "").trim();
  const pt = getPTParts();

  if (mode === "MANUAL" && /^\d{4}-\d{2}-\d{2}$/.test(manual)) {
    return { slate_date: manual, slate_mode: "MANUAL", pt_date: pt.date, pt_time: pt.time };
  }
  if (mode === "TODAY") return { slate_date: pt.date, slate_mode: "TODAY", pt_date: pt.date, pt_time: pt.time };
  if (mode === "TOMORROW") return { slate_date: addDaysISO(pt.date, 1), slate_mode: "TOMORROW", pt_date: pt.date, pt_time: pt.time };

  return { slate_date: pt.hour >= 20 ? addDaysISO(pt.date, 1) : pt.date, slate_mode: "AUTO", pt_date: pt.date, pt_time: pt.time };
}

function hydratePromptTemplate(prompt, slateDate) {
  return String(prompt || "").replaceAll("{{SLATE_DATE}}", slateDate);
}

function health(env) {
  return {
    ok: true,
    version: SYSTEM_VERSION,
    worker: WORKER_DEPLOY_TARGET,
    db_bound: !!env.DB,
    ingest_token_bound: !!env.INGEST_TOKEN,
    gemini_key_bound: !!env.GEMINI_API_KEY,
    prompt_base_url_bound: !!env.PROMPT_BASE_URL,
    jobs: Object.keys(JOBS),
    executable_jobs: executableJobNames(),
    time: new Date().toISOString()
  };
}

function executableJobNames() {
  return Array.from(new Set([
    ...Object.keys(JOBS),
    "scrape_starters_mlb_api",
    "repair_starters_mlb_api",
    "scrape_bullpens_mlb_api",
    "scrape_bullpens",
    "scrape_lineups_mlb_api",
    "scrape_lineups",
    "scrape_recent_usage_mlb_api",
    "scrape_recent_usage",
    "scrape_derived_metrics",
    "board_queue_mine_one",
    "board_queue_auto_mine",
    "board_queue_repair",
    "scrape_players_mlb_api",
    "scrape_players",
    "scrape_players_mlb_api_g1",
    "scrape_players_mlb_api_g2",
    "scrape_players_mlb_api_g3",
    "scrape_players_mlb_api_g4",
    "scrape_players_mlb_api_g5",
    "scrape_players_mlb_api_g6",
    "scrape_static_venues",
    "scrape_static_team_aliases",
    "scrape_static_players",
    "scrape_static_players_g1",
    "scrape_static_players_g2",
    "scrape_static_players_g3",
    "scrape_static_players_g4",
    "scrape_static_players_g5",
    "scrape_static_players_g6",
    "scrape_static_player_splits_test_5",
    "scrape_static_player_splits_g1",
    "scrape_static_player_splits_g2",
    "scrape_static_player_splits_g3",
    "scrape_static_player_splits_g4",
    "scrape_static_player_splits_g5",
    "scrape_static_player_splits_g6",
    "scrape_static_game_logs_g1",
    "scrape_static_game_logs_g2",
    "scrape_static_game_logs_g3",
    "scrape_static_game_logs_g4",
    "scrape_static_game_logs_g5",
    "scrape_static_game_logs_g6",
    "scrape_static_bvp_current_slate",
    "scrape_static_all_fast",
    "schedule_static_temp_refresh_once",
    "run_static_temp_refresh_tick",
    "check_static_temp_venues",
    "check_static_temp_team_aliases",
    "check_static_temp_players",
    "check_static_temp_all",
    "audit_static_temp_certification",
    "promote_static_temp_to_live",
    "clean_static_temp_tables",
    "schedule_incremental_temp_refresh_once",
    "run_incremental_temp_refresh_tick",
    "check_incremental_temp_all",
    "audit_incremental_temp_certification",
    "promote_incremental_temp_to_live",
    "clean_incremental_temp_tables",
    "incremental_base_game_logs_g1",
    "incremental_base_game_logs_g2",
    "incremental_base_game_logs_g3",
    "incremental_base_game_logs_g4",
    "incremental_base_game_logs_g5",
    "incremental_base_game_logs_g6",
    "incremental_base_splits_g1",
    "incremental_base_splits_g2",
    "incremental_base_splits_g3",
    "incremental_base_splits_g4",
    "incremental_base_splits_g5",
    "incremental_base_splits_g6",
    "incremental_base_derived_metrics",
    "repair_missing_ref_players",
    "check_incremental_game_logs",
    "check_incremental_player_splits",
    "check_incremental_derived_metrics",
    "check_incremental_all",
    "schedule_everyday_phase1_once",
    "run_everyday_phase1_tick",
    "check_everyday_phase1",
    "everyday_phase1_all_direct",
    "scrape_phase2_weather_context",
    "check_phase2_weather_context",
    "scrape_phase2_lineup_context",
    "check_phase2_lineup_context",
    "scrape_phase2c_market_context",
    "check_phase2c_market_context",
    "schedule_phase3ab_full_run_test",
    "schedule_phase3ab_daily_4am",
    "run_phase3ab_full_run_tick",
    "check_phase3ab_full_run",
    "run_sleeper_rbi_rfi_market_board",
    "check_sleeper_rbi_rfi_market_board",
    "schedule_sleeper_rbi_rfi_daily_430",
    "run_sleeper_rbi_rfi_window_morning",
    "run_sleeper_rbi_rfi_window_afternoon",
    "check_sleeper_rbi_rfi_window_runner",
    "run_sleeper_rbi_rfi_prep_morning",
    "run_sleeper_rbi_rfi_prep_afternoon",
    "check_sleeper_rbi_rfi_window_prep",
    "run_odds_api_morning",
    "run_odds_api_afternoon",
    "check_odds_api_market_intel",
    "run_mlb_scoring_v1",
    "check_mlb_scoring_v1",
    "check_static_venues",
    "check_static_team_aliases",
    "check_static_players",
    "check_static_player_splits",
    "check_static_game_logs",
    "check_static_bvp",
    "check_static_all"
  ])).sort();
}

function isExecutableJobName(jobName) {
  return executableJobNames().includes(String(jobName || ""));
}

function jobRegistryRequiredAudit() {
  const required = [
    "run_full_pipeline",
    "scrape_games_markets",
    "build_edge_candidates_hits",
    "build_edge_candidates_rbi",
    "build_edge_candidates_rfi"
  ];
  const executable = executableJobNames();
  return required.map(job_name => ({
    job_name,
    registered: executable.includes(job_name),
    route: job_name === "build_edge_candidates_rbi" ? "buildEdgeCandidatesRbi" :
      job_name === "build_edge_candidates_hits" ? "buildEdgeCandidatesHits" :
      job_name === "build_edge_candidates_rfi" ? "buildEdgeCandidatesRfi" :
      job_name === "run_full_pipeline" ? "runFullPipeline" : "executeTaskJob"
  }));
}

function dailyHealthStatus(pass, warn) {
  if (!pass) return "FAIL";
  if (warn) return "WARN";
  return "PASS";
}

async function dailyHealthScalar(env, sql, bindValues = []) {
  try {
    const stmt = bindValues.length ? env.DB.prepare(sql).bind(...bindValues) : env.DB.prepare(sql);
    const row = await stmt.first();
    const values = Object.values(row || {});
    return { ok: true, value: Number(values[0] || 0), row: row || null };
  } catch (err) {
    return { ok: false, value: null, error: String(err?.message || err) };
  }
}

async function dailyHealthRows(env, sql, bindValues = []) {
  try {
    const stmt = bindValues.length ? env.DB.prepare(sql).bind(...bindValues) : env.DB.prepare(sql);
    const res = await stmt.all();
    return { ok: true, rows: Array.isArray(res?.results) ? res.results : [] };
  } catch (err) {
    return { ok: false, rows: [], error: String(err?.message || err) };
  }
}

function slateStartTimestamp(slateDate) {
  return `${slateDate} 00:00:00`;
}

async function latestSuccessfulTaskForSlate(env, checkName, jobNames, slateDate, options = {}) {
  const jobs = Array.isArray(jobNames) ? jobNames.filter(Boolean) : [jobNames].filter(Boolean);
  const required = options.required !== false;
  const minFinishedAt = slateStartTimestamp(slateDate);

  if (!jobs.length) {
    return {
      check: checkName,
      ok: false,
      status: "ERROR",
      required,
      job_names: [],
      latest_success: null,
      error: "No job names supplied"
    };
  }

  const marks = jobs.map(() => "?").join(",");
  const slatePattern = `%${slateDate}%`;

  try {
    const fresh = await dailyHealthRows(env, `
      SELECT task_id, job_name, status, started_at, finished_at,
             substr(COALESCE(output_json, error, ''), 1, 240) AS preview
      FROM task_runs
      WHERE status = 'success'
        AND job_name IN (${marks})
        AND (
          COALESCE(input_json, '') LIKE ?
          OR COALESCE(output_json, '') LIKE ?
          OR COALESCE(error, '') LIKE ?
        )
        AND datetime(COALESCE(finished_at, started_at)) >= datetime(?)
      ORDER BY datetime(COALESCE(finished_at, started_at)) DESC, datetime(started_at) DESC
      LIMIT 1
    `, [...jobs, slatePattern, slatePattern, slatePattern, minFinishedAt]);

    if (fresh.ok && fresh.rows.length) {
      return {
        check: checkName,
        ok: true,
        status: "PASS_FRESH",
        required,
        job_names: jobs,
        slate_date: slateDate,
        min_finished_at: minFinishedAt,
        latest_success: withDisplayLabel(fresh.rows[0]),
        error: null
      };
    }

    const latest = await dailyHealthRows(env, `
      SELECT task_id, job_name, status, started_at, finished_at,
             substr(COALESCE(output_json, error, ''), 1, 240) AS preview
      FROM task_runs
      WHERE status = 'success'
        AND job_name IN (${marks})
      ORDER BY datetime(COALESCE(finished_at, started_at)) DESC, datetime(started_at) DESC
      LIMIT 1
    `, jobs);

    const hasLatest = latest.ok && latest.rows.length > 0;
    const missingStatus = required ? "FAIL_NOT_FRESH" : "WARN_NOT_FRESH";
    return {
      check: checkName,
      ok: required ? false : true,
      status: hasLatest ? missingStatus : (required ? "FAIL_NO_SUCCESS" : "WARN_NO_SUCCESS"),
      required,
      job_names: jobs,
      slate_date: slateDate,
      min_finished_at: minFinishedAt,
      latest_success: hasLatest ? withDisplayLabel(latest.rows[0]) : null,
      error: fresh.error || latest.error || null
    };
  } catch (err) {
    return {
      check: checkName,
      ok: false,
      status: "ERROR",
      required,
      job_names: jobs,
      slate_date: slateDate,
      min_finished_at: minFinishedAt,
      latest_success: null,
      error: String(err?.message || err)
    };
  }
}

async function buildScheduledFreshnessGate(env, slateDate) {
  const checks = [
    await latestSuccessfulTaskForSlate(env, "RFI_BUILD_FRESH", ["build_edge_candidates_rfi"], slateDate),
    await latestSuccessfulTaskForSlate(env, "RBI_BUILD_FRESH", ["build_edge_candidates_rbi"], slateDate),
    await latestSuccessfulTaskForSlate(env, "HITS_BUILD_FRESH", ["build_edge_candidates_hits"], slateDate),
    await latestSuccessfulTaskForSlate(env, "FULL_PIPELINE_OR_SLATE_PREP_FRESH", ["run_full_pipeline", "scrape_games_markets", "daily_mlb_slate"], slateDate)
  ];

  const blockingFailures = checks.filter(row => row.required && row.ok !== true);
  const warnings = checks.filter(row => !row.required && row.status && row.status.startsWith("WARN"));
  return {
    ok: blockingFailures.length === 0,
    mode: "slate_success_since_slate_start",
    slate_date: slateDate,
    min_finished_at: slateStartTimestamp(slateDate),
    expected_checks: checks.length,
    returned_checks: checks.length,
    checks,
    blocking_failures: blockingFailures.length,
    warnings: warnings.length
  };
}

async function buildLatestRequiredJobVisibility(env, slateDate) {
  const definitions = [
    { key: "RUN_FULL_PIPELINE", label: "Latest full pipeline", job_names: ["run_full_pipeline"] },
    { key: "RFI_CANDIDATE_BUILD", label: "Latest RFI candidate build", job_names: ["build_edge_candidates_rfi"] },
    { key: "RBI_CANDIDATE_BUILD", label: "Latest RBI candidate build", job_names: ["build_edge_candidates_rbi"] },
    { key: "HITS_CANDIDATE_BUILD", label: "Latest Hits candidate build", job_names: ["build_edge_candidates_hits"] }
  ];

  const jobs = [];
  for (const def of definitions) {
    const row = await latestSuccessfulTaskForSlate(env, def.key, def.job_names, slateDate);
    jobs.push({
      key: def.key,
      label: def.label,
      job_names: def.job_names,
      ok: row.ok === true,
      status: row.status,
      slate_date: slateDate,
      min_finished_at: row.min_finished_at || slateStartTimestamp(slateDate),
      latest_success: row.latest_success || null,
      error: row.error || null
    });
  }

  const missingOrError = jobs.filter(row => row.ok !== true);
  return {
    ok: missingOrError.length === 0,
    mode: "latest_success_per_required_job",
    slate_date: slateDate,
    expected_jobs: definitions.length,
    returned_jobs: jobs.length,
    jobs,
    missing_or_error: missingOrError.length,
    note: "Visibility-only rollup of the latest successful run per required scheduled job. Freshness gate remains the blocking source of truth."
  };
}

async function reapStaleTaskRuns(env) {
  try {
    const before = await dailyHealthRows(env, `
      SELECT task_id, job_name, status, started_at
      FROM task_runs
      WHERE status = 'running'
        AND started_at <= datetime('now', '-30 minutes')
      ORDER BY started_at ASC
      LIMIT 50
    `);

    if (!before.ok || !before.rows.length) {
      return {
        ok: before.ok,
        reaped_count: 0,
        reaped_rows: [],
        error: before.error || null
      };
    }

    const ids = before.rows.map(row => row.task_id).filter(Boolean);
    if (!ids.length) {
      return { ok: true, reaped_count: 0, reaped_rows: [], error: null };
    }

    const marks = ids.map(() => '?').join(',');
    await env.DB.prepare(`
      UPDATE task_runs
      SET status = 'stale',
          finished_at = COALESCE(finished_at, CURRENT_TIMESTAMP),
          error = COALESCE(error, 'Daily Health stale-task reaper marked this old running task as stale after 30 minutes.')
      WHERE status = 'running'
        AND task_id IN (${marks})
    `).bind(...ids).run();

    return {
      ok: true,
      reaped_count: ids.length,
      reaped_rows: before.rows,
      error: null
    };
  } catch (err) {
    return {
      ok: false,
      reaped_count: 0,
      reaped_rows: [],
      error: String(err?.message || err)
    };
  }
}

async function handleDailyHealth(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();

  const url = new URL(request.url);
  const requestedDate = String(url.searchParams.get("slate_date") || "").trim();
  const slate = resolveSlateDate(requestedDate ? { slate_mode: "MANUAL", manual_slate_date: requestedDate } : {});
  const slateDate = slate.slate_date;
  const likeSlate = `${slateDate}_%`;
  const stale_reaper = await reapStaleTaskRuns(env);
  const freshness_gate = await buildScheduledFreshnessGate(env, slateDate);
  const latest_required_jobs = await buildLatestRequiredJobVisibility(env, slateDate);

  const checks = [];
  async function addCheck(name, sql, bindValues, passFn, warnFn) {
    const q = await dailyHealthScalar(env, sql, bindValues);
    const pass = q.ok && passFn(q.value);
    const warn = q.ok && warnFn ? warnFn(q.value) : false;
    checks.push({
      check: name,
      value: q.value,
      status: q.ok ? dailyHealthStatus(pass, warn) : "ERROR",
      ok: q.ok && pass,
      error: q.error || null
    });
  }

  await addCheck("GAMES_TODAY", "SELECT COUNT(*) FROM games WHERE game_date = ?", [slateDate], v => v === 15, v => v > 0 && v !== 15);
  await addCheck("STARTERS_TODAY", "SELECT COUNT(*) FROM starters_current WHERE game_id LIKE ?", [likeSlate], v => v === 30, v => v > 0 && v !== 30);
  await addCheck("LINEUPS_TODAY", "SELECT COUNT(*) FROM lineups_current WHERE game_id LIKE ?", [likeSlate], v => v >= 200, v => v > 0 && v < 200);
  await addCheck("BULLPENS_TODAY", "SELECT COUNT(*) FROM bullpens_current WHERE game_id LIKE ?", [likeSlate], v => v >= 20, v => v > 0 && v < 20);
  await addCheck("MARKETS_TODAY", "SELECT COUNT(*) FROM markets_current WHERE game_id LIKE ?", [likeSlate], v => v >= 15, v => v > 0 && v < 15);
  await addCheck("PLAYERS_CURRENT", "SELECT COUNT(*) FROM players_current", [], v => v >= 760, v => v > 0 && v < 760);
  await addCheck("RFI_CANDIDATES", "SELECT COUNT(*) FROM edge_candidates_rfi WHERE slate_date = ?", [slateDate], v => v === 15, v => v > 0 && v !== 15);
  await addCheck("RBI_CANDIDATES", "SELECT COUNT(*) FROM edge_candidates_rbi WHERE slate_date = ?", [slateDate], v => v === 119, v => v > 0 && v !== 119);
  await addCheck("HITS_CANDIDATES", "SELECT COUNT(*) FROM edge_candidates_hits WHERE slate_date = ?", [slateDate], v => v > 0, () => false);

  const staleRows = await dailyHealthRows(env, `
    SELECT job_name, status, started_at, finished_at
    FROM task_runs
    WHERE status = 'success'
    ORDER BY finished_at DESC, started_at DESC
    LIMIT 8
  `);

  const stuckRows = await dailyHealthRows(env, `
    SELECT task_id, job_name, status, started_at
    FROM task_runs
    WHERE status = 'running'
      AND started_at <= datetime('now', '-30 minutes')
    ORDER BY started_at ASC
    LIMIT 8
  `);

  const latestFullRun = await dailyHealthRows(env, `
    SELECT task_id, job_name, status, started_at, finished_at, substr(COALESCE(error, output_json, ''), 1, 240) AS preview
    FROM task_runs
    WHERE job_name = 'run_full_pipeline'
    ORDER BY started_at DESC
    LIMIT 3
  `);

  const slateFailureBind = [slateDate, slateDate, slateDate];
  const currentActiveFailures = await dailyHealthRows(env, `
    SELECT task_id, job_name, status, started_at, finished_at, substr(COALESCE(error, output_json, ''), 1, 240) AS preview
    FROM task_runs tr
    WHERE tr.status IN ('failed','stale')
      AND (
        COALESCE(tr.input_json, '') LIKE '%' || ? || '%'
        OR COALESCE(tr.output_json, '') LIKE '%' || ? || '%'
        OR COALESCE(tr.error, '') LIKE '%' || ? || '%'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM task_runs newer_success
        WHERE newer_success.job_name = tr.job_name
          AND newer_success.status = 'success'
          AND datetime(newer_success.started_at) > datetime(tr.started_at)
      )
    ORDER BY started_at DESC
    LIMIT 8
  `, slateFailureBind);

  const historicalResolvedFailures = await dailyHealthRows(env, `
    SELECT task_id, job_name, status, started_at, finished_at, substr(COALESCE(error, output_json, ''), 1, 240) AS preview
    FROM task_runs tr
    WHERE tr.status IN ('failed','stale')
      AND (
        EXISTS (
          SELECT 1
          FROM task_runs newer_success
          WHERE newer_success.job_name = tr.job_name
            AND newer_success.status = 'success'
            AND datetime(newer_success.started_at) > datetime(tr.started_at)
        )
        OR NOT (
          COALESCE(tr.input_json, '') LIKE '%' || ? || '%'
          OR COALESCE(tr.output_json, '') LIKE '%' || ? || '%'
          OR COALESCE(tr.error, '') LIKE '%' || ? || '%'
        )
      )
    ORDER BY started_at DESC
    LIMIT 8
  `, slateFailureBind);

  const executableJobs = executableJobNames();
  const invalidJobMarks = executableJobs.map(() => "?").join(",");
  const invalidJobRows = await dailyHealthRows(env, `
    SELECT task_id, job_name, status, started_at, finished_at, substr(COALESCE(error, output_json, ''), 1, 240) AS preview
    FROM task_runs
    WHERE job_name NOT IN (${invalidJobMarks})
    ORDER BY started_at DESC
    LIMIT 12
  `, executableJobs);

  const requiredJobAudit = jobRegistryRequiredAudit();
  const registryAudit = {
    ok: requiredJobAudit.every(row => row.registered) && invalidJobRows.ok,
    executable_jobs_count: executableJobs.length,
    required_jobs: requiredJobAudit,
    invalid_job_rows: invalidJobRows.ok ? withDisplayLabels(invalidJobRows.rows) : [],
    invalid_job_query_ok: invalidJobRows.ok,
    error: invalidJobRows.error || null
  };

  const scheduled = {
    stale_reaper,
    latest_success_rows: staleRows.ok ? withDisplayLabels(staleRows.rows) : [],
    stuck_running_rows: stuckRows.ok ? withDisplayLabels(stuckRows.rows) : [],
    latest_full_run_rows: latestFullRun.ok ? withDisplayLabels(latestFullRun.rows) : [],
    current_active_failure_rows: currentActiveFailures.ok ? withDisplayLabels(currentActiveFailures.rows) : [],
    historical_resolved_failure_rows: historicalResolvedFailures.ok ? withDisplayLabels(historicalResolvedFailures.rows) : [],
    failed_recent_rows: currentActiveFailures.ok ? withDisplayLabels(currentActiveFailures.rows) : [],
    registry_audit: registryAudit,
    freshness_gate,
    latest_required_jobs,
    stale_query_ok: staleRows.ok,
    stuck_query_ok: stuckRows.ok,
    full_run_query_ok: latestFullRun.ok,
    active_failure_query_ok: currentActiveFailures.ok,
    historical_failure_query_ok: historicalResolvedFailures.ok,
    failed_query_ok: currentActiveFailures.ok
  };

  const errorChecks = checks.filter(c => c.status === "ERROR");
  const failedChecks = checks.filter(c => c.status === "FAIL");
  const warnChecks = checks.filter(c => c.status === "WARN");
  const stuckCount = scheduled.stuck_running_rows.length;
  const reaperError = stale_reaper && stale_reaper.ok === false;
  const registryError = registryAudit && registryAudit.ok === false;
  const freshnessError = freshness_gate && freshness_gate.ok === false;
  const latestRequiredJobsError = latest_required_jobs && latest_required_jobs.ok === false;
  const activeFailureCount = scheduled.current_active_failure_rows.length;
  const status = errorChecks.length || failedChecks.length || stuckCount || activeFailureCount || reaperError || registryError || freshnessError || latestRequiredJobsError ? "review" : (warnChecks.length ? "warn" : "pass");

  return json({
    ok: status === "pass" || status === "warn",
    version: SYSTEM_VERSION,
    job: "daily_health",
    slate_date: slateDate,
    slate_mode: slate.slate_mode,
    status,
    table_checks: checks,
    scheduled,
    summary: {
      pass: checks.filter(c => c.status === "PASS").length,
      warn: warnChecks.length,
      fail: failedChecks.length,
      error: errorChecks.length,
      stuck_running: stuckCount,
      stale_reaped: stale_reaper?.reaped_count || 0,
      stale_reaper_ok: stale_reaper?.ok === true,
      registry_audit_ok: registryAudit?.ok === true,
      freshness_gate_ok: freshness_gate?.ok === true,
      freshness_blocking_failures: freshness_gate?.blocking_failures || 0,
      latest_required_jobs_ok: latest_required_jobs?.ok === true,
      latest_required_jobs_missing_or_error: latest_required_jobs?.missing_or_error || 0,
      active_failures: activeFailureCount,
      historical_resolved_failures: scheduled.historical_resolved_failure_rows.length
    },
    note: "Daily health plus stale task cleanup plus job registry audit plus slate-scoped failure filtering plus scheduled run freshness gate plus freshness visibility expansion only. No scoring logic or candidate logic changed."
  });
}

async function runScheduled(event, env) {
  const taskId = crypto.randomUUID();
  const cron = event?.cron || null;
  const input = { job: "scheduled_router", cron, slate_mode: "AUTO", trigger: "scheduled" };
  const slate = resolveSlateDate(input);
  const cronText = String(cron || "").trim();

  await ensureDeferredFullRunTable(env).catch(() => null);
  await resetStaleDeferredFullRuns(env).catch(() => null);

  if (cronText === "* * * * *") {
    const due = await runDueDeferredFullRun(env);
    return {
      ok: true,
      version: SYSTEM_VERSION,
      job: "scheduled_router",
      routed_job: "deferred_full_run_once_poller",
      cron,
      result: due,
      scheduler_alignment: "v1.2.73 keeps the temporary one-minute one-shot Full Run poller only for deferred Full Run requests. Persistent mining remains handled by the separate */2 cron; static data jobs are manual/control-room only.",
      note: "Temporary one-shot background Full Run poller. Keep for now; remove after scheduler/miner reliability is fully proven."
    };
  }

  let routedJob = "board_queue_auto_mine";
  if (cronText === "0 12 * * *") routedJob = "run_full_pipeline";
  else if (cronText === "*/2 * * * *") routedJob = "board_queue_auto_mine";
  else if (cronText === "0 15 * * *") routedJob = "board_queue_auto_mine";
  else if (cronText === "30 18 * * *") routedJob = "board_queue_auto_mine";

  await resetStalePipelineRuntime(env, slate.slate_date).catch(() => null);
  await ensureStarterCompatibilityColumns(env).catch(() => null);
  await logSystemEvent(env, { trigger_source: "scheduled", action_label: `SCHEDULED > ${displayLabelForJob(routedJob)}`, job_name: routedJob, slate_date: slate.slate_date, slate_mode: slate.slate_mode, status: "started", task_id: taskId, input_json: { ...input, routed_job: routedJob } });

  await env.DB.prepare(`
    INSERT INTO task_runs (task_id, job_name, status, started_at, input_json)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
  `).bind(taskId, routedJob, "running", JSON.stringify({ ...input, routed_job: routedJob })).run();

  try {
    let result;
    if (routedJob === "run_full_pipeline") {
      result = await runFullPipeline({ ...input, job: "run_full_pipeline", slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
    } else if (routedJob === "board_queue_auto_mine") {
      result = await runBoardQueueAutoMine({ ...input, job: "board_queue_auto_mine", slate_date: slate.slate_date, slate_mode: slate.slate_mode, limit: BOARD_QUEUE_AUTO_MINE_LIMIT, retry_errors: false, persistent_miner: true }, env);
    } else {
      result = await executeTaskJob(routedJob, input, slate, env);
    }
    const wrapped = {
      ok: !!result?.ok,
      version: SYSTEM_VERSION,
      job: "scheduled_router",
      routed_job: routedJob,
      cron,
      result,
      scheduler_alignment: "v1.2.73 routes the */2 cron to one bounded persistent miner invocation. No scheduled invocation runs Full Pipeline + Queue Pipeline + Auto Mine together. Static reference scrapers are not scheduled.",
      note: "Persistent miner active: every 2 minutes it mines one family in a 20-second time box, uses independent locks, retries with backoff, and leaves scoring disabled."
    };
    await env.DB.prepare(`
      UPDATE task_runs
      SET status = ?, finished_at = CURRENT_TIMESTAMP, output_json = ?
      WHERE task_id = ?
    `).bind(wrapped.ok ? "success" : "failed", JSON.stringify(wrapped), taskId).run();
    await logSystemEvent(env, { trigger_source: "scheduled", action_label: `SCHEDULED > ${displayLabelForJob(routedJob)}`, job_name: routedJob, slate_date: slate.slate_date, slate_mode: slate.slate_mode, status: wrapped.ok ? "success" : "failed", task_id: taskId, output_preview: wrapped, error: wrapped.ok ? null : "scheduled_routed_job_failed" });
    return wrapped;
  } catch (err) {
    const result = { ok: false, version: SYSTEM_VERSION, job: "scheduled_router", routed_job: routedJob, status: "FAILED_EXCEPTION", cron, error: String(err?.message || err) };
    await env.DB.prepare(`
      UPDATE task_runs SET status='failed', finished_at=CURRENT_TIMESTAMP, error=?, output_json=? WHERE task_id=?
    `).bind(result.error, JSON.stringify(result), taskId).run().catch(() => null);
    await logSystemEvent(env, { trigger_source: "scheduled", action_label: `SCHEDULED > ${displayLabelForJob(routedJob)}`, job_name: routedJob, slate_date: slate.slate_date, slate_mode: slate.slate_mode, status: "failed", task_id: taskId, error: result.error });
    return result;
  }
}

async function ensureDeferredFullRunTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS deferred_full_run_once (
      request_id TEXT PRIMARY KEY,
      job_name TEXT DEFAULT 'run_full_pipeline',
      slate_date TEXT NOT NULL,
      slate_mode TEXT DEFAULT 'AUTO',
      status TEXT DEFAULT 'PENDING',
      requested_at TEXT DEFAULT CURRENT_TIMESTAMP,
      run_after TEXT NOT NULL,
      started_at TEXT,
      finished_at TEXT,
      task_id TEXT,
      requested_by TEXT,
      output_json TEXT,
      error TEXT
    )
  `).run();
}

async function resetStaleDeferredFullRuns(env) {
  await ensureDeferredFullRunTable(env);
  const res = await env.DB.prepare(`
    UPDATE deferred_full_run_once
    SET status='PENDING', started_at=NULL, error='stale deferred run reset to pending'
    WHERE status='RUNNING'
      AND started_at < datetime('now','-15 minutes')
  `).run();
  return { stale_deferred_reset: Number(res?.meta?.changes || 0) };
}


const PHASE3AB_DEFERRED_JOB = 'phase3ab_full_run_test';
const PHASE3AB_GLOBAL_LOCK_ID = 'GLOBAL_PHASE3_SCHEDULED_PIPELINE';
const PHASE3AB_LOCK_STALE_MINUTES = 8;


function phase3abTimestampForSql(date = new Date()) {
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
}

async function resetStalePhase3abGlobalLock(env, staleMinutes = PHASE3AB_LOCK_STALE_MINUTES) {
  await ensurePipelineLocksTable(env);
  const before = await env.DB.prepare(`SELECT * FROM pipeline_locks WHERE lock_id=?`).bind(PHASE3AB_GLOBAL_LOCK_ID).first().catch(() => null);
  const res = await env.DB.prepare(`
    UPDATE pipeline_locks
    SET status='IDLE', locked_by=NULL, updated_at=CURRENT_TIMESTAMP, note='auto-released stale Phase 3A/B lock'
    WHERE lock_id=?
      AND status='RUNNING'
      AND updated_at < datetime('now', '-' || ? || ' minutes')
  `).bind(PHASE3AB_GLOBAL_LOCK_ID, String(staleMinutes)).run();
  const staleLockReset = Number(res?.meta?.changes || 0);
  let staleTasksMarked = 0;
  let staleDeferredReset = 0;
  if (staleLockReset > 0) {
    const taskRes = await env.DB.prepare(`
      UPDATE task_runs
      SET status='STALE_RESET', finished_at=CURRENT_TIMESTAMP, error='v1.3.18 stale Phase 3 lock recovery marked orphan running task stale'
      WHERE job_name='run_phase3ab_full_run_tick'
        AND status='running'
        AND started_at < datetime('now', '-' || ? || ' minutes')
    `).bind(String(staleMinutes)).run().catch(() => ({ meta: { changes: 0 } }));
    staleTasksMarked = Number(taskRes?.meta?.changes || 0);
    const deferredRes = await env.DB.prepare(`
      UPDATE deferred_full_run_once
      SET status='PENDING', started_at=NULL, run_after=CURRENT_TIMESTAMP, error='v1.3.18 stale Phase 3 lock recovery reset deferred request to pending'
      WHERE job_name=?
        AND status='RUNNING'
        AND started_at < datetime('now', '-' || ? || ' minutes')
    `).bind(PHASE3AB_DEFERRED_JOB, String(staleMinutes)).run().catch(() => ({ meta: { changes: 0 } }));
    staleDeferredReset = Number(deferredRes?.meta?.changes || 0);
  }
  const after = await env.DB.prepare(`SELECT * FROM pipeline_locks WHERE lock_id=?`).bind(PHASE3AB_GLOBAL_LOCK_ID).first().catch(() => null);
  return { stale_lock_reset: staleLockReset, stale_tasks_marked: staleTasksMarked, stale_deferred_reset: staleDeferredReset, before, after, stale_minutes: staleMinutes };
}


async function phase3abRows(env, sql, binds = []) {
  const stmt = env.DB.prepare(sql);
  const out = await (binds.length ? stmt.bind(...binds) : stmt).all();
  return out.results || [];
}

async function phase3abQueueTotals(env, slateDate) {
  const row = await env.DB.prepare(`
    SELECT COUNT(*) AS total_rows,
      SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending_rows,
      SUM(CASE WHEN status='PENDING' AND datetime(start_time) > datetime('now', '+' || ? || ' minutes') THEN 1 ELSE 0 END) AS actionable_pending_rows,
      SUM(CASE WHEN status='SKIPPED_STALE' THEN 1 ELSE 0 END) AS skipped_stale_rows,
      SUM(CASE WHEN status='RETRY_LATER' THEN 1 ELSE 0 END) AS retry_later_rows,
      SUM(CASE WHEN status='RUNNING' THEN 1 ELSE 0 END) AS running_rows,
      SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed_rows,
      SUM(CASE WHEN status='ERROR' THEN 1 ELSE 0 END) AS error_rows
    FROM board_factor_queue
    WHERE slate_date=?
  `).bind(BOARD_ACTIONABLE_START_BUFFER_MINUTES, slateDate).first().catch(() => null);
  return {
    total_rows: Number(row?.total_rows || 0),
    pending_rows: Number(row?.pending_rows || 0),
    actionable_pending_rows: Number(row?.actionable_pending_rows || 0),
    skipped_stale_rows: Number(row?.skipped_stale_rows || 0),
    retry_later_rows: Number(row?.retry_later_rows || 0),
    running_rows: Number(row?.running_rows || 0),
    completed_rows: Number(row?.completed_rows || 0),
    error_rows: Number(row?.error_rows || 0)
  };
}

async function phase3abSkipStalePendingRows(env, slateDate) {
  await ensureBoardFactorQueueTable(env);
  const before = await phase3abQueueTotals(env, slateDate);
  const res = await env.DB.prepare(`
    UPDATE board_factor_queue
    SET status='SKIPPED_STALE',
        last_error='skipped_stale_or_too_close_start_time',
        updated_at=CURRENT_TIMESTAMP,
        last_processed_at=CURRENT_TIMESTAMP
    WHERE slate_date=?
      AND status='PENDING'
      AND datetime(start_time) <= datetime('now', '+' || ? || ' minutes')
  `).bind(slateDate, BOARD_ACTIONABLE_START_BUFFER_MINUTES).run();
  const after = await phase3abQueueTotals(env, slateDate);
  return {
    ok: true,
    rule: `PENDING rows with datetime(start_time) <= now + ${BOARD_ACTIONABLE_START_BUFFER_MINUTES} minutes are not actionable and are finalized as SKIPPED_STALE.`,
    skipped_this_pass: Number(res?.meta?.changes || 0),
    before,
    after
  };
}

async function phase3abResultTotals(env, slateDate) {
  const row = await env.DB.prepare(`
    SELECT COUNT(*) AS total_results,
      SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed_results,
      SUM(CASE WHEN status='COMPLETED' AND factor_count > 0 THEN 1 ELSE 0 END) AS certified_a_results,
      SUM(COALESCE(factor_count,0)) AS raw_factor_rows
    FROM board_factor_results
    WHERE slate_date=?
  `).bind(slateDate).first().catch(() => null);
  return {
    total_results: Number(row?.total_results || 0),
    completed_results: Number(row?.completed_results || 0),
    certified_a_results: Number(row?.certified_a_results || 0),
    raw_factor_rows: Number(row?.raw_factor_rows || 0)
  };
}

async function schedulePhase3abFullRunTest(input, env) {
  await ensureDeferredFullRunTable(env);
  await ensurePipelineLocksTable(env);
  const slate = resolveSlateDate(input || {});
  const existing = await env.DB.prepare(`
    SELECT request_id, job_name, status, run_after, requested_at, started_at, finished_at
    FROM deferred_full_run_once
    WHERE job_name=?
      AND slate_date=?
      AND status IN ('PENDING','RUNNING')
    ORDER BY requested_at DESC
    LIMIT 1
  `).bind(PHASE3AB_DEFERRED_JOB, slate.slate_date).first();
  if (existing) {
    return { ok: true, data_ok: false, version: SYSTEM_VERSION, job: input.job || 'schedule_phase3ab_full_run_test', status: 'already_scheduled_or_running', slate_date: slate.slate_date, existing_request: existing, next_action: 'Wait for the minute cron/tick to run, then use PHASE 3A/3B > Check Full Run.', note: 'No duplicate Phase 3A/3B test request was created.' };
  }
  const requestId = `phase3ab_full_run_test|${slate.slate_date}|${Date.now()}|${crypto.randomUUID()}`;
  const runAfter = phase3abTimestampForSql(new Date(Date.now() + 60 * 1000));
  await env.DB.prepare(`
    INSERT INTO deferred_full_run_once (request_id, job_name, slate_date, slate_mode, status, run_after, requested_by)
    VALUES (?, ?, ?, ?, 'PENDING', ?, 'control_room_phase3ab_full_run_test')
  `).bind(requestId, PHASE3AB_DEFERRED_JOB, slate.slate_date, slate.slate_mode, runAfter).run();
  await logSystemEvent(env, { trigger_source: 'control_room_button', action_label: displayLabelForJob(input.job || 'schedule_phase3ab_full_run_test'), job_name: 'schedule_phase3ab_full_run_test', slate_date: slate.slate_date, slate_mode: slate.slate_mode, status: 'scheduled', task_id: requestId, input_json: { request_id: requestId, run_after: runAfter } });
  return { ok: true, data_ok: true, version: SYSTEM_VERSION, job: input.job || 'schedule_phase3ab_full_run_test', status: 'scheduled_for_next_minute', request_id: requestId, slate_date: slate.slate_date, slate_mode: slate.slate_mode, run_after: runAfter, wait_instruction: 'Wait about 2 minutes, then run PHASE 3A/3B > Check Full Run. If it says partial_continue, wait another 2 minutes and check again.', protected_flow: ['acquire global lock', 'auto-build board_factor_queue', 'mine bounded Gemini raw rows', 'write/promote valid raw rows to board_factor_results', 'clean completed queue temp rows only when fully complete', 'release lock'], note: 'This is the one-minute full-run test version. It uses the same queue/results tables as the existing Phase 3A/3B flow and never runs in parallel.' };
}

async function ensurePhase3abDaily4amFromMinuteFallback(env, cron) {
  const now = new Date();
  if (now.getUTCHours() < 11) return { ok: true, status: 'not_due_yet', cron, utc_hour: now.getUTCHours() };
  await ensureDeferredFullRunTable(env);
  const slate = resolveSlateDate({ slate_mode: 'TODAY' });
  const existingDaily = await env.DB.prepare(`
    SELECT request_id, status, requested_at, run_after, started_at, finished_at
    FROM deferred_full_run_once
    WHERE slate_date=?
      AND request_id LIKE ?
    ORDER BY requested_at DESC
    LIMIT 1
  `).bind(slate.slate_date, `phase3ab_daily_4am|${slate.slate_date}|%`).first();
  if (existingDaily) return { ok: true, status: 'daily_request_already_exists', cron, slate_date: slate.slate_date, existing_request: existingDaily };

  const activeAny = await env.DB.prepare(`
    SELECT request_id, status, requested_at, run_after, started_at, finished_at
    FROM deferred_full_run_once
    WHERE job_name=?
      AND slate_date=?
      AND status IN ('PENDING','RUNNING')
    ORDER BY requested_at DESC
    LIMIT 1
  `).bind(PHASE3AB_DEFERRED_JOB, slate.slate_date).first();
  if (activeAny) return { ok: true, status: 'active_phase3ab_request_exists', cron, slate_date: slate.slate_date, existing_request: activeAny };

  return await schedulePhase3abDaily4am({ job: 'schedule_phase3ab_daily_4am', trigger: 'scheduled_minute_fallback_after_4am', cron, daily_schedule: 'Daily 4:00 AM PDT / 11:00 UTC + minute fallback' }, env);
}

async function schedulePhase3abDaily4am(input, env) {
  await ensureDeferredFullRunTable(env);
  await ensurePipelineLocksTable(env);
  const slate = resolveSlateDate(input || {});
  const existing = await env.DB.prepare(`
    SELECT request_id, job_name, status, run_after, requested_at, started_at, finished_at
    FROM deferred_full_run_once
    WHERE job_name=?
      AND slate_date=?
      AND status IN ('PENDING','RUNNING')
    ORDER BY requested_at DESC
    LIMIT 1
  `).bind(PHASE3AB_DEFERRED_JOB, slate.slate_date).first();
  if (existing) {
    return { ok: true, data_ok: false, version: SYSTEM_VERSION, job: input.job || 'schedule_phase3ab_daily_4am', status: 'already_scheduled_or_running', slate_date: slate.slate_date, existing_request: existing, next_action: 'Minute cron will continue the existing Phase 3A/3B request. Use PHASE 3A/3B > Check Full Run to monitor.', note: 'No duplicate daily Phase 3A/3B request was created.' };
  }
  const requestId = `phase3ab_daily_4am|${slate.slate_date}|${Date.now()}|${crypto.randomUUID()}`;
  const runAfter = phase3abTimestampForSql(new Date(Date.now() - 1000));
  await env.DB.prepare(`
    INSERT INTO deferred_full_run_once (request_id, job_name, slate_date, slate_mode, status, run_after, requested_by)
    VALUES (?, ?, ?, ?, 'PENDING', ?, 'scheduled_phase3ab_daily_4am')
  `).bind(requestId, PHASE3AB_DEFERRED_JOB, slate.slate_date, slate.slate_mode, runAfter).run();
  await logSystemEvent(env, { trigger_source: input.trigger || 'scheduled_phase3ab_4am_cron', action_label: displayLabelForJob(input.job || 'schedule_phase3ab_daily_4am'), job_name: 'schedule_phase3ab_daily_4am', slate_date: slate.slate_date, slate_mode: slate.slate_mode, status: 'scheduled', task_id: requestId, input_json: { request_id: requestId, run_after: runAfter, cron: input.cron || null, daily_schedule: input.daily_schedule || 'Daily 4:00 AM PDT / 11:00 UTC' } });
  return { ok: true, data_ok: true, version: SYSTEM_VERSION, job: input.job || 'schedule_phase3ab_daily_4am', status: 'scheduled_due_now', request_id: requestId, slate_date: slate.slate_date, slate_mode: slate.slate_mode, run_after: runAfter, daily_schedule: input.daily_schedule || 'Daily 4:00 AM PDT / 11:00 UTC', protected_flow: ['acquire global lock', 'build all queue families first', 'mine bounded Gemini raw rows', 'write/promote valid raw rows to board_factor_results', 'clean completed queue temp rows only when fully complete', 'release lock'], postpone_rule: 'If another Phase 3 job is running, postpone this request 15 minutes and retry through minute cron.', note: 'Daily Phase 3A/3B run scheduled. It uses the same protected build-first tick loop as the tested manual flow.' };
}

async function postponePhase3abRequest(env, row, reason, minutes = 15) {
  const nextRetry = phase3abTimestampForSql(new Date(Date.now() + Math.max(1, minutes) * 60 * 1000));
  await env.DB.prepare(`
    UPDATE deferred_full_run_once
    SET status='PENDING', run_after=?, error=?, output_json=?, started_at=NULL
    WHERE request_id=?
  `).bind(nextRetry, String(reason || 'postponed'), JSON.stringify({ postponed: true, reason, next_retry_at: nextRetry }), row.request_id).run();
  return { ok: true, status: 'POSTPONED_LOCK_BUSY', request_id: row.request_id, next_retry_at: nextRetry, postpone_minutes: minutes, reason };
}

async function cleanPhase3abCompletedQueueTemp(env, slateDate) {
  const before = await phase3abQueueTotals(env, slateDate);
  const res = await env.DB.prepare(`
    DELETE FROM board_factor_queue
    WHERE slate_date=?
      AND status='COMPLETED'
      AND EXISTS (
        SELECT 1 FROM board_factor_results r
        WHERE r.queue_id = board_factor_queue.queue_id
          AND r.status='COMPLETED'
          AND COALESCE(r.factor_count,0) > 0
      )
  `).bind(slateDate).run();
  const after = await phase3abQueueTotals(env, slateDate);
  return { before, deleted_completed_temp_rows: Number(res?.meta?.changes || 0), after };
}

async function runPhase3abFullRunOnce(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;
  const startedAt = new Date().toISOString();
  const steps = [];
  const beforeQueue = await phase3abQueueTotals(env, slateDate);
  const beforeResults = await phase3abResultTotals(env, slateDate);

  let actionTaken = 'none';
  const initialStaleFinalize = await phase3abSkipStalePendingRows(env, slateDate);
  if (initialStaleFinalize.skipped_this_pass > 0) steps.push({ step: 'finalize_stale_pending_start_of_tick', result: initialStaleFinalize });

  // v1.3.04 throttle fix:
  // v1.3.03 tried repair + up to 10 build passes + 3 mining waves in one Worker invocation.
  // Cloudflare rejected that as too many API/D1 requests. This tick now performs ONE bounded unit:
  // A) one queue build pass, OR B) one mining wave with limit 1, OR C) cleanup/check.
  const build = await runBoardQueueAutoBuild({
    ...(input || {}),
    job: 'board_queue_auto_build',
    slate_date: slateDate,
    slate_mode: slate.slate_mode,
    max_passes: 1,
    auto_passes: 1
  }, env);

  const insertedBuildRows = Number(build?.inserted_queue_rows || build?.final_build?.inserted_queue_rows || 0);
  const buildStillNeedsContinue = !!(build?.needs_continue || build?.status === 'needs_continue' || build?.build_complete === false || build?.final_build?.build_complete === false);

  if (insertedBuildRows > 0 || buildStillNeedsContinue) {
    actionTaken = 'single_queue_build_pass';
    steps.push({ step: 'auto_build_queue_temp_single_pass', result: build });
  } else {
    const postBuildStaleFinalize = await phase3abSkipStalePendingRows(env, slateDate);
    if (postBuildStaleFinalize.skipped_this_pass > 0) steps.push({ step: 'finalize_stale_pending_after_build', result: postBuildStaleFinalize });
    const refreshedQueue = await phase3abQueueTotals(env, slateDate);
    const hasActiveQueue = (refreshedQueue.actionable_pending_rows + refreshedQueue.retry_later_rows + refreshedQueue.running_rows) > 0;

    if (hasActiveQueue) {
      const phase3MineLimit = Math.max(1, Math.min(Number(input?.phase3_mine_limit || input?.limit || 12), BOARD_QUEUE_AUTO_MINE_LIMIT));
      const phase3MaxWaves = Math.max(1, Math.min(Number(input?.phase3_max_waves || 3), 4));
      const mine = await runBoardQueueAutoMineWaves({
        ...(input || {}),
        job: 'board_queue_auto_mine',
        slate_date: slateDate,
        slate_mode: slate.slate_mode,
        trigger: input?.trigger || 'phase3ab_full_run_test',
        limit: phase3MineLimit,
        max_rows: phase3MineLimit,
        max_mines: phase3MineLimit,
        phase3_tick_runtime_cutoff_ms: PHASE3AB_TICK_RUNTIME_CUTOFF_MS
      }, env, slateDate, slate, phase3MaxWaves);
      actionTaken = `multi_wave_mining_limit_${phase3MineLimit}_waves_${phase3MaxWaves}`;
      steps.push({ step: 'queue_build_complete_check', result: { ok: true, build_complete: true, inserted_queue_rows: 0 } });
      steps.push({ step: 'mine_promote_raw_results_single_wave', result: mine });
    } else {
      actionTaken = 'check_cleanup_only';
      steps.push({ step: 'queue_build_complete_check', result: { ok: true, build_complete: true, inserted_queue_rows: 0 } });
    }
  }


  const finalStaleFinalize = await phase3abSkipStalePendingRows(env, slateDate);
  if (finalStaleFinalize.skipped_this_pass > 0) steps.push({ step: 'finalize_stale_pending_before_completion_gate', result: finalStaleFinalize });
  const afterQueue = await phase3abQueueTotals(env, slateDate);
  const afterResults = await phase3abResultTotals(env, slateDate);
  const actionableActiveRows = afterQueue.actionable_pending_rows + afterQueue.retry_later_rows + afterQueue.running_rows;
  const completeNoActionable = actionableActiveRows === 0 && afterQueue.pending_rows === 0;
  const hasErrors = afterQueue.error_rows > 0;
  const hasSkips = afterQueue.skipped_stale_rows > 0;
  let cleanup = null;
  let status = 'partial_continue';
  let dataOk = false;
  if (completeNoActionable && !hasErrors && afterQueue.total_rows > 0) {
    cleanup = await cleanPhase3abCompletedQueueTemp(env, slateDate);
    status = hasSkips ? 'completed_with_skips' : 'completed';
    dataOk = afterResults.certified_a_results > 0;
  } else if (completeNoActionable && hasErrors) {
    status = 'completed_with_errors_review';
    dataOk = afterResults.certified_a_results > 0;
  }

  const finalQueue = await phase3abQueueTotals(env, slateDate);
  return {
    ok: true,
    data_ok: dataOk,
    version: SYSTEM_VERSION,
    job: input.job || 'run_phase3ab_full_run_tick',
    phase: 'Phase 3A/3B Daily Schedule Lock',
    slate_date: slateDate,
    status,
    action_taken: actionTaken,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    before: { queue: beforeQueue, results: beforeResults },
    after: { queue: afterQueue, results: afterResults },
    final: { queue: finalQueue, results: await phase3abResultTotals(env, slateDate) },
    certification_a: {
      certified_a_results: afterResults.certified_a_results,
      rule: 'board_factor_results rows with status COMPLETED and factor_count > 0 are treated as certified raw Phase 3A/3B rows for this test run.'
    },
    completion_gate: {
      total_rows: afterQueue.total_rows,
      completed_rows: afterQueue.completed_rows,
      actionable_pending_rows: afterQueue.actionable_pending_rows,
      pending_rows: afterQueue.pending_rows,
      skipped_stale_rows: afterQueue.skipped_stale_rows,
      retry_later_rows: afterQueue.retry_later_rows,
      running_rows: afterQueue.running_rows,
      error_rows: afterQueue.error_rows,
      final_status: status,
      stale_rule: `PENDING rows at or inside now + ${BOARD_ACTIONABLE_START_BUFFER_MINUTES} minutes are finalized as SKIPPED_STALE and do not keep Phase 3 running.`
    },
    temp_cleanup: cleanup || { skipped: true, reason: status === 'partial_continue' ? 'queue still has actionable pending/retry/running rows or queue build needs continuation' : 'queue has ERROR rows requiring review before temp cleanup' },
    needs_continue: status === 'partial_continue',
    steps,
    next_action: status === 'partial_continue' ? 'Wait for the next minute tick or run PHASE 3A/3B > Run Full Run Tick again, then Check Full Run.' : 'Run PHASE 3A/3B > Check Full Run.',
    note: 'v1.3.20 preserves the v1.3.19 stale-pending finalizer and adds Sleeper RBI/RFI board signal runner. No scoring or final candidate ranking is added.'
  };
}

async function runPhase3abFullRunTick(input, env) {
  await ensureDeferredFullRunTable(env);
  await resetStaleDeferredFullRuns(env);
  const slate = resolveSlateDate(input || {});
  const manualRow = { request_id: `manual_phase3ab_tick|${slate.slate_date}|${Date.now()}|${crypto.randomUUID()}`, slate_date: slate.slate_date, slate_mode: slate.slate_mode || 'AUTO', job_name: PHASE3AB_DEFERRED_JOB };
  return await runPhase3abDeferredRow(env, manualRow, { ...(input || {}), manual_tick: true });
}

async function runPhase3abDeferredRow(env, row, input = {}) {
  const slateDate = row.slate_date;
  const slateMode = row.slate_mode || 'AUTO';
  const lockedBy = `${input?.trigger || 'phase3ab'}:${crypto.randomUUID()}`;
  await resetStalePhase3abGlobalLock(env, PHASE3AB_LOCK_STALE_MINUTES);
  const lock = await acquirePipelineLock(env, PHASE3AB_GLOBAL_LOCK_ID, lockedBy, PHASE3AB_LOCK_STALE_MINUTES);
  if (!lock.acquired) {
    if (row.request_id && !String(row.request_id).startsWith('manual_phase3ab_tick|')) return await postponePhase3abRequest(env, row, 'global phase pipeline lock busy', 15);
    return { ok: true, data_ok: false, version: SYSTEM_VERSION, job: input.job || 'run_phase3ab_full_run_tick', status: 'postponed_lock_busy', lock_status: lock, retry_after_minutes: 15, note: 'Global Phase 3 scheduled pipeline lock is busy. Manual tick exited without work.' };
  }

  const taskId = crypto.randomUUID();
  if (row.request_id && !String(row.request_id).startsWith('manual_phase3ab_tick|')) {
    const claim = await env.DB.prepare(`
      UPDATE deferred_full_run_once
      SET status='RUNNING', started_at=CURRENT_TIMESTAMP, task_id=?
      WHERE request_id=? AND status IN ('PENDING','RUNNING')
    `).bind(taskId, row.request_id).run();
    if (Number(claim?.meta?.changes || 0) === 0) {
      await releasePipelineLock(env, PHASE3AB_GLOBAL_LOCK_ID, lockedBy);
      return { ok: true, status: 'already_claimed_or_completed', request_id: row.request_id };
    }
  }

  const taskInput = { ...(input || {}), job: 'run_phase3ab_full_run_tick', slate_date: slateDate, slate_mode: slateMode, trigger: input?.trigger || 'phase3ab_tick', request_id: row.request_id };
  await env.DB.prepare(`INSERT INTO task_runs (task_id, job_name, status, started_at, input_json) VALUES (?, 'run_phase3ab_full_run_tick', 'running', CURRENT_TIMESTAMP, ?)`).bind(taskId, JSON.stringify(taskInput)).run().catch(() => null);
  await logSystemEvent(env, { trigger_source: taskInput.trigger || 'phase3ab_tick', action_label: displayLabelForJob('run_phase3ab_full_run_tick'), job_name: 'run_phase3ab_full_run_tick', slate_date: slateDate, slate_mode: slateMode, status: 'started', task_id: taskId, input_json: taskInput });

  try {
    const result = await runPhase3abFullRunOnce(taskInput, env);
    const nextRun = phase3abTimestampForSql(new Date(Date.now() + 60 * 1000));
    if (row.request_id && !String(row.request_id).startsWith('manual_phase3ab_tick|')) {
      if (result.needs_continue) {
        await env.DB.prepare(`UPDATE deferred_full_run_once SET status='PENDING', run_after=?, finished_at=CURRENT_TIMESTAMP, output_json=?, error=NULL WHERE request_id=?`).bind(nextRun, JSON.stringify(result), row.request_id).run();
      } else {
        const finalDeferredStatus = result.status === 'completed_with_skips' ? 'COMPLETED_WITH_SKIPS' : (result.data_ok ? 'COMPLETED' : 'COMPLETED_REVIEW');
        await env.DB.prepare(`UPDATE deferred_full_run_once SET status=?, finished_at=CURRENT_TIMESTAMP, output_json=?, error=? WHERE request_id=?`).bind(finalDeferredStatus, JSON.stringify(result), result.data_ok ? null : 'completed but data_ok false or review needed', row.request_id).run();
      }
    }
    await env.DB.prepare(`UPDATE task_runs SET status=?, finished_at=CURRENT_TIMESTAMP, output_json=? WHERE task_id=?`).bind(result.ok ? 'success' : 'failed', JSON.stringify(result), taskId).run().catch(() => null);
    await logSystemEvent(env, { trigger_source: taskInput.trigger || 'phase3ab_tick', action_label: displayLabelForJob('run_phase3ab_full_run_tick'), job_name: 'run_phase3ab_full_run_tick', slate_date: slateDate, slate_mode: slateMode, status: result.ok ? 'success' : 'failed', task_id: taskId, output_preview: result, error: result.ok ? null : String(result.error || result.status || 'phase3ab_failed') });
    return { ...result, task_id: taskId, request_id: row.request_id, deferred_next_run_after: result.needs_continue ? nextRun : null, lock_status: 'RELEASED' };
  } catch (err) {
    const msg = String(err?.message || err);
    await env.DB.prepare(`UPDATE task_runs SET status='failed', finished_at=CURRENT_TIMESTAMP, error=? WHERE task_id=?`).bind(msg, taskId).run().catch(() => null);
    if (row.request_id && !String(row.request_id).startsWith('manual_phase3ab_tick|')) await env.DB.prepare(`UPDATE deferred_full_run_once SET status='FAILED', finished_at=CURRENT_TIMESTAMP, error=? WHERE request_id=?`).bind(msg, row.request_id).run().catch(() => null);
    await logSystemEvent(env, { trigger_source: taskInput.trigger || 'phase3ab_tick', action_label: displayLabelForJob('run_phase3ab_full_run_tick'), job_name: 'run_phase3ab_full_run_tick', slate_date: slateDate, slate_mode: slateMode, status: 'failed', task_id: taskId, error: msg });
    return { ok: false, data_ok: false, version: SYSTEM_VERSION, job: 'run_phase3ab_full_run_tick', status: 'FAILED_EXCEPTION', slate_date: slateDate, error: msg, task_id: taskId };
  } finally {
    await releasePipelineLock(env, PHASE3AB_GLOBAL_LOCK_ID, lockedBy);
  }
}

async function runDuePhase3abFullRun(env) {
  await ensureDeferredFullRunTable(env);
  await resetStaleDeferredFullRuns(env);
  await resetStalePhase3abGlobalLock(env, PHASE3AB_LOCK_STALE_MINUTES);
  const row = await env.DB.prepare(`
    SELECT * FROM deferred_full_run_once
    WHERE job_name=?
      AND status='PENDING'
      AND run_after <= CURRENT_TIMESTAMP
    ORDER BY run_after ASC, requested_at ASC
    LIMIT 1
  `).bind(PHASE3AB_DEFERRED_JOB).first();
  if (!row) return { ok: true, status: 'NO_PHASE3AB_DEFERRED_DUE', checked_at: new Date().toISOString() };
  return await runPhase3abDeferredRow(env, row, { trigger: 'scheduled_phase3ab_deferred_tick', job: 'run_phase3ab_full_run_tick' });
}

async function checkPhase3abFullRun(input, env) {
  await ensureDeferredFullRunTable(env);
  await ensurePipelineLocksTable(env);
  await resetStalePhase3abGlobalLock(env, PHASE3AB_LOCK_STALE_MINUTES);
  const slate = resolveSlateDate(input || {});
  const latest = await env.DB.prepare(`
    SELECT request_id, job_name, slate_date, slate_mode, status, requested_at, run_after, started_at, finished_at, task_id, error, output_json
    FROM deferred_full_run_once
    WHERE job_name=? AND slate_date=?
    ORDER BY requested_at DESC
    LIMIT 1
  `).bind(PHASE3AB_DEFERRED_JOB, slate.slate_date).first().catch(() => null);
  const queue = await phase3abQueueTotals(env, slate.slate_date);
  const results = await phase3abResultTotals(env, slate.slate_date);
  const lock = await env.DB.prepare(`SELECT * FROM pipeline_locks WHERE lock_id=?`).bind(PHASE3AB_GLOBAL_LOCK_ID).first().catch(() => null);
  const queueHealth = await phase3abRows(env, `SELECT queue_type, status, COUNT(*) AS rows_count FROM board_factor_queue WHERE slate_date=? GROUP BY queue_type, status ORDER BY queue_type, status`, [slate.slate_date]);
  const resultHealth = await phase3abRows(env, `SELECT queue_type, status, COUNT(*) AS rows_count, SUM(factor_count) AS raw_factor_rows FROM board_factor_results WHERE slate_date=? GROUP BY queue_type, status ORDER BY queue_type, status`, [slate.slate_date]);
  const tempClean = queue.total_rows === 0 || (queue.pending_rows + queue.retry_later_rows + queue.running_rows + queue.completed_rows + queue.skipped_stale_rows) === 0;
  const status = latest?.status || 'not_scheduled';
  const pass = ['COMPLETED','COMPLETED_REVIEW','COMPLETED_WITH_SKIPS'].includes(status) && results.certified_a_results > 0 && queue.actionable_pending_rows === 0 && queue.pending_rows === 0 && queue.retry_later_rows === 0 && queue.running_rows === 0 && queue.error_rows === 0;
  return {
    ok: pass,
    data_ok: pass,
    version: SYSTEM_VERSION,
    job: input.job || 'check_phase3ab_full_run',
    phase: 'Phase 3A/3B Full Run Test',
    slate_date: slate.slate_date,
    status: pass ? 'pass' : (latest ? 'needs_review_or_continue' : 'not_scheduled'),
    latest_request: latest ? { ...latest, output_json: latest.output_json ? '[stored_output_json_available_in_db]' : null } : null,
    queue_totals: queue,
    result_totals: results,
    temp_cleanup: { temp_rows_cleaned: tempClean, rule: 'board_factor_queue is the Phase 3A/3B temp/working table; board_factor_results is the promoted main raw-result table.' },
    certification_a: { certified_a_results: results.certified_a_results, data_ok: results.certified_a_results > 0 },
    completion_gate: {
      total_rows: queue.total_rows,
      completed_rows: queue.completed_rows,
      actionable_pending_rows: queue.actionable_pending_rows,
      pending_rows: queue.pending_rows,
      skipped_stale_rows: queue.skipped_stale_rows,
      retry_later_rows: queue.retry_later_rows,
      running_rows: queue.running_rows,
      error_rows: queue.error_rows,
      final_status: status,
      pass
    },
    lock_state: lock || null,
    queue_health: queueHealth,
    result_health: resultHealth,
    warnings: [
      ...(queue.error_rows > 0 ? [`${queue.error_rows} queue rows are ERROR and need review or credits/retry before pass`] : []),
      ...(latest && latest.status === 'PENDING' ? ['Deferred test is still pending; wait for minute cron/tick or run Run Full Run Tick.'] : []),
      ...(latest && latest.status === 'RUNNING' ? ['Deferred test is currently running.'] : []),
      ...(results.certified_a_results <= 0 ? ['No certified A raw result rows found yet.'] : [])
    ],
    next_action: pass ? 'Phase 3A/3B full-run test passed. Next: schedule real Phase 3A/3B time window.' : 'If status is pending/partial, wait 2 minutes and check again. If ERROR rows mention Gemini credits, refill Gemini billing before retry.',
    note: 'This check validates Phase 3A/3B queue/result full-run mechanics only. It does not score final candidates.'
  };
}
async function handleDeferredFullRunRequest(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();
  await ensureDeferredFullRunTable(env);
  const body = await safeJson(request);
  const slate = resolveSlateDate(body || {});
  const existing = await env.DB.prepare(`
    SELECT request_id, status, run_after, requested_at
    FROM deferred_full_run_once
    WHERE status IN ('PENDING','RUNNING')
      AND job_name='run_full_pipeline'
      AND slate_date=?
    ORDER BY requested_at DESC
    LIMIT 1
  `).bind(slate.slate_date).first();
  if (existing) {
    return json({ ok: true, version: SYSTEM_VERSION, job: "deferred_full_run_once", status: "ALREADY_SCHEDULED", slate_date: slate.slate_date, existing_request: existing, message: "A one-shot background Full Run is already pending or running. Do not click Full Run again. Check Scheduler Log / Tasks / queue health in about 15 minutes.", note: "Temporary v1.2.73 one-shot Full Run mode." });
  }
  const requestId = `deferred_full_run|${slate.slate_date}|${Date.now()}|${crypto.randomUUID()}`;
  const runAfter = new Date(Date.now() + 60 * 1000).toISOString().replace('T',' ').replace(/\.\d{3}Z$/, '');
  await env.DB.prepare(`
    INSERT INTO deferred_full_run_once (request_id, job_name, slate_date, slate_mode, status, run_after, requested_by)
    VALUES (?, 'run_full_pipeline', ?, ?, 'PENDING', ?, 'control_room_full_run_button')
  `).bind(requestId, slate.slate_date, slate.slate_mode, runAfter).run();
  await logSystemEvent(env, { trigger_source: "control_room_button", action_label: "SCRAPE > FULL RUN scheduled one-shot", job_name: "deferred_full_run_once", slate_date: slate.slate_date, slate_mode: slate.slate_mode, status: "scheduled", http_status: 200, task_id: requestId, input_json: { request_id: requestId, run_after: runAfter } });
  return json({ ok: true, version: SYSTEM_VERSION, job: "deferred_full_run_once", status: "SCHEDULED_ONE_SHOT", request_id: requestId, slate_date: slate.slate_date, slate_mode: slate.slate_mode, run_after: runAfter, message: "Full Run scheduled for the backend in about 1 minute. Do not keep Safari open for this run. Check Scheduler Log, Tasks, Health, or queue health in about 15 minutes.", temporary_test_mode: true, removal_note: "This one-shot scheduling mode is temporary and should be removed after scheduler/miner reliability is fully proven." });
}

async function runDueDeferredFullRun(env) {
  await ensureDeferredFullRunTable(env);
  await resetStaleDeferredFullRuns(env);
  const row = await env.DB.prepare(`
    SELECT * FROM deferred_full_run_once
    WHERE status='PENDING'
      AND run_after <= CURRENT_TIMESTAMP
    ORDER BY run_after ASC, requested_at ASC
    LIMIT 1
  `).first();
  if (!row) return { ok: true, status: "NO_DEFERRED_FULL_RUN_DUE", checked_at: new Date().toISOString() };
  const taskId = crypto.randomUUID();
  const claim = await env.DB.prepare(`
    UPDATE deferred_full_run_once
    SET status='RUNNING', started_at=CURRENT_TIMESTAMP, task_id=?
    WHERE request_id=? AND status='PENDING'
  `).bind(taskId, row.request_id).run();
  if (Number(claim?.meta?.changes || 0) === 0) return { ok: true, status: "DEFERRED_FULL_RUN_ALREADY_CLAIMED", request_id: row.request_id };
  const input = { job: "run_full_pipeline", slate_date: row.slate_date, slate_mode: row.slate_mode || "AUTO", trigger: "deferred_one_shot", request_id: row.request_id };
  await logSystemEvent(env, { trigger_source: "scheduled_deferred_one_shot", action_label: "SCHEDULED ONE-SHOT > FULL RUN", job_name: "run_full_pipeline", slate_date: row.slate_date, slate_mode: row.slate_mode || "AUTO", status: "started", task_id: taskId, input_json: input });
  await env.DB.prepare(`
    INSERT INTO task_runs (task_id, job_name, status, started_at, input_json)
    VALUES (?, 'run_full_pipeline', 'running', CURRENT_TIMESTAMP, ?)
  `).bind(taskId, JSON.stringify(input)).run();
  try {
    const result = await runFullPipeline(input, env);
    const ok = !!result?.ok;
    await env.DB.prepare(`UPDATE task_runs SET status=?, finished_at=CURRENT_TIMESTAMP, output_json=? WHERE task_id=?`).bind(ok ? "success" : "failed", JSON.stringify(result), taskId).run();
    await env.DB.prepare(`UPDATE deferred_full_run_once SET status=?, finished_at=CURRENT_TIMESTAMP, output_json=?, error=? WHERE request_id=?`).bind(ok ? "COMPLETED" : "FAILED", JSON.stringify(result), ok ? null : String(result?.error || result?.status || "full_run_failed"), row.request_id).run();
    await logSystemEvent(env, { trigger_source: "scheduled_deferred_one_shot", action_label: "SCHEDULED ONE-SHOT > FULL RUN", job_name: "run_full_pipeline", slate_date: row.slate_date, slate_mode: row.slate_mode || "AUTO", status: ok ? "success" : "failed", task_id: taskId, output_preview: result, error: ok ? null : String(result?.error || result?.status || "full_run_failed") });
    return { ok, status: ok ? "DEFERRED_FULL_RUN_COMPLETED" : "DEFERRED_FULL_RUN_FAILED", request_id: row.request_id, task_id: taskId, result };
  } catch (err) {
    const msg = String(err?.message || err);
    await env.DB.prepare(`UPDATE task_runs SET status='failed', finished_at=CURRENT_TIMESTAMP, error=? WHERE task_id=?`).bind(msg, taskId).run().catch(() => null);
    await env.DB.prepare(`UPDATE deferred_full_run_once SET status='FAILED', finished_at=CURRENT_TIMESTAMP, error=? WHERE request_id=?`).bind(msg, row.request_id).run().catch(() => null);
    await logSystemEvent(env, { trigger_source: "scheduled_deferred_one_shot", action_label: "SCHEDULED ONE-SHOT > FULL RUN", job_name: "run_full_pipeline", slate_date: row.slate_date, slate_mode: row.slate_mode || "AUTO", status: "failed", task_id: taskId, error: msg });
    return { ok: false, status: "DEFERRED_FULL_RUN_EXCEPTION", request_id: row.request_id, task_id: taskId, error: msg };
  }
}


async function logSystemEvent(env, event = {}) {
  try {
    await ensureSystemEventLog(env);
    await env.DB.prepare(`INSERT INTO system_event_log (event_id, version, trigger_source, action_label, job_name, slate_date, slate_mode, status, http_status, task_id, input_json, output_preview, error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      crypto.randomUUID(), SYSTEM_VERSION, String(event.trigger_source || "unknown"), event.action_label ? String(event.action_label) : null, event.job_name ? String(event.job_name) : null, event.slate_date ? String(event.slate_date) : null, event.slate_mode ? String(event.slate_mode) : null, event.status ? String(event.status) : null, Number.isFinite(Number(event.http_status)) ? Number(event.http_status) : null, event.task_id ? String(event.task_id) : null, event.input_json ? compactLogText(event.input_json) : null, event.output_preview ? compactLogText(event.output_preview) : null, event.error ? compactLogText(event.error) : null
    ).run();
  } catch (_) {}
}

function clampDebugSQLMaxRows(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 50;
  return Math.max(1, Math.min(Math.floor(n), 100));
}

function compactDebugSQLValue(value, maxChars) {
  if (typeof value !== "string") return value;
  if (value.length <= maxChars) return value;
  return value.slice(0, maxChars) + `...[truncated ${value.length - maxChars} chars]`;
}

function compactDebugSQLRows(rows, maxChars) {
  return rows.map(row => {
    const out = {};
    for (const [key, value] of Object.entries(row || {})) {
      out[key] = compactDebugSQLValue(value, maxChars);
    }
    return out;
  });
}


function safeParseJsonText(value) {
  try {
    return { ok: true, value: JSON.parse(String(value || "{}")) };
  } catch (err) {
    return { ok: false, error: String(err?.message || err), value: null };
  }
}

function clampInspectLimit(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(Math.floor(n), 25));
}

function clampInspectRawChars(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 12000;
  return Math.max(1000, Math.min(Math.floor(n), 50000));
}


async function handleBoardQueuePayloadInspect(request, env) {
  if (!isAuthorized(request, env)) return json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    await ensureBoardFactorQueueTable(env);
    const url = new URL(request.url);
    const body = request.method === "POST" ? await safeJson(request) : {};
    const slateDate = String(body?.slate_date || url.searchParams.get("slate_date") || resolveSlateDate({}).slate_date);
    const queueType = String(body?.queue_type || url.searchParams.get("queue_type") || "").trim();
    const queueId = String(body?.queue_id || url.searchParams.get("queue_id") || "").trim();
    const status = String(body?.status || url.searchParams.get("status") || "").trim();
    const limit = clampInspectLimit(body?.limit ?? url.searchParams.get("limit"));
    const rawMaxChars = clampInspectRawChars(body?.raw_max_chars ?? url.searchParams.get("raw_max_chars"));

    const where = ["slate_date = ?"];
    const binds = [slateDate];
    if (queueId) { where.push("queue_id = ?"); binds.push(queueId); }
    if (queueType) { where.push("queue_type = ?"); binds.push(queueType); }
    if (status) { where.push("status = ?"); binds.push(status); }

    const res = await env.DB.prepare(`
      SELECT queue_id, slate_date, queue_type, scope_type, scope_key, batch_index, player_count, game_count, source_rows,
             player_names, team_id, game_key, team_a, team_b, start_time, status, payload_json, created_at, updated_at
      FROM board_factor_queue
      WHERE ${where.join(" AND ")}
      ORDER BY CASE queue_type
        WHEN 'PLAYER_A_ROLE_RECENT_MATCHUP' THEN 1
        WHEN 'PLAYER_D_ADVANCED_FORM_CONTACT' THEN 2
        WHEN 'GAME_B_TEAM_BULLPEN_ENVIRONMENT' THEN 3
        WHEN 'GAME_WEATHER_CONTEXT' THEN 4
        WHEN 'GAME_NEWS_INJURY_CONTEXT' THEN 5
        ELSE 99 END, batch_index ASC, queue_id ASC
      LIMIT ${limit}
    `).bind(...binds).all();

    const rows = res.results || [];
    const inspected = await Promise.all(rows.map(async row => {
      const inspectedPayload = await inspectPayloadForQueueRow(env, row);
      const rawText = inspectedPayload.rawText;
      const parsed = inspectedPayload.parsed;
      const payload = inspectedPayload.payload;
      const playerContexts = Array.isArray(payload?.enriched_player_contexts) ? payload.enriched_player_contexts : [];
      const gameContext = payload?.enriched_game_context || null;
      return {
        queue_id: row.queue_id,
        slate_date: row.slate_date,
        queue_type: row.queue_type,
        scope_type: row.scope_type,
        batch_index: row.batch_index,
        status: row.status,
        player_count: row.player_count,
        game_count: row.game_count,
        payload_parse_ok: parsed.ok,
        payload_parse_error: parsed.ok ? null : parsed.error,
        enrichment_preview_used: inspectedPayload.enrichment_preview_used,
        enrichment_preview_error: inspectedPayload.enrichment_preview_error,
        payload_quality: payload?.payload_quality || null,
        enriched_player_context_count: playerContexts.length,
        enriched_game_context_present: !!gameContext,
        sample_enriched_players: playerContexts.slice(0, 4),
        enriched_game_context: gameContext,
        raw_payload_text: rawText.length > rawMaxChars ? rawText.slice(0, rawMaxChars) + `...[truncated ${rawText.length - rawMaxChars} chars]` : rawText,
        raw_payload_length: rawText.length,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    }));

    return json({
      ok: true,
      version: SYSTEM_VERSION,
      endpoint: "board_queue_payload_inspect",
      slate_date: slateDate,
      filters: { queue_id: queueId || null, queue_type: queueType || null, status: status || null, limit, raw_max_chars: rawMaxChars },
      row_count: rows.length,
      results: inspected,
      note: "Read-only inspection of board queue payloads. Thin stored payloads are enriched in preview for diagnosis only. No queue status changes, no Gemini calls, no scoring."
    });
  } catch (err) {
    return json({ ok: false, version: SYSTEM_VERSION, endpoint: "board_queue_payload_inspect", error: String(err?.message || err) }, { status: 500 });
  }
}

async function handleBoardFactorResultInspect(request, env) {
  if (!isAuthorized(request, env)) return json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    await ensureBoardFactorResultsTable(env);
    const url = new URL(request.url);
    const body = request.method === "POST" ? await safeJson(request) : {};
    const slateDate = String(body?.slate_date || url.searchParams.get("slate_date") || resolveSlateDate({}).slate_date);
    const queueType = String(body?.queue_type || url.searchParams.get("queue_type") || "").trim();
    const queueId = String(body?.queue_id || url.searchParams.get("queue_id") || "").trim();
    const resultId = String(body?.result_id || url.searchParams.get("result_id") || "").trim();
    const limit = clampInspectLimit(body?.limit ?? url.searchParams.get("limit"));
    const rawMaxChars = clampInspectRawChars(body?.raw_max_chars ?? url.searchParams.get("raw_max_chars"));

    const where = ["slate_date = ?"];
    const binds = [slateDate];
    if (resultId) { where.push("result_id = ?"); binds.push(resultId); }
    if (queueId) { where.push("queue_id = ?"); binds.push(queueId); }
    if (queueType) { where.push("queue_type = ?"); binds.push(queueType); }

    const sql = `
      SELECT result_id, queue_id, slate_date, queue_type, scope_type, scope_key, batch_index, status, model,
             factor_count, min_score, max_score, avg_score, raw_json, created_at, updated_at
      FROM board_factor_results
      WHERE ${where.join(" AND ")}
      ORDER BY created_at DESC, result_id DESC
      LIMIT ${limit}
    `;
    const res = await env.DB.prepare(sql).bind(...binds).all();
    const rows = res.results || [];
    const inspected = rows.map(row => {
      const rawText = String(row.raw_json || "");
      const parsed = safeParseJsonText(rawText);
      const normalizedResults = factorRowsFromRawPayload(parsed.value);
      const normalizedItems = Array.isArray(parsed.value?.items) ? parsed.value.items : [];
      const parsedHeader = parsed.value && typeof parsed.value === "object" ? {
        ok: parsed.value.ok ?? null,
        queue_id: parsed.value.queue_id ?? row.queue_id,
        queue_type: parsed.value.queue_type ?? row.queue_type,
        scope_type: parsed.value.scope_type ?? row.scope_type,
        slate_date: parsed.value.slate_date ?? row.slate_date,
        factor_family: parsed.value.factor_family ?? null,
        prompt_id: parsed.value.prompt_id ?? null,
        raw_mode: parsed.value.raw_mode ?? null,
        warnings: Array.isArray(parsed.value.warnings) ? parsed.value.warnings : (Array.isArray(parsed.value?.summary?.warnings) ? parsed.value.summary.warnings : [])
      } : null;
      return {
        result_id: row.result_id,
        queue_id: row.queue_id,
        slate_date: row.slate_date,
        queue_type: row.queue_type,
        scope_type: row.scope_type,
        scope_key: row.scope_key,
        batch_index: row.batch_index,
        status: row.status,
        model: row.model,
        summary_from_table: { factor_count: row.factor_count, min_score: row.min_score, max_score: row.max_score, avg_score: row.avg_score },
        parsed_ok: parsed.ok,
        parsed_error: parsed.ok ? null : parsed.error,
        parsed_header: parsedHeader,
        parsed_items_count: normalizedItems.length,
        parsed_items: normalizedItems,
        parsed_results_count: normalizedResults.length,
        parsed_results: normalizedResults,
        raw_json_text: rawText.length > rawMaxChars ? rawText.slice(0, rawMaxChars) + `...[truncated ${rawText.length - rawMaxChars} chars]` : rawText,
        raw_json_length: rawText.length,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    });

    return json({
      ok: true,
      version: SYSTEM_VERSION,
      endpoint: "board_factor_result_inspect",
      slate_date: slateDate,
      filters: { result_id: resultId || null, queue_id: queueId || null, queue_type: queueType || null, limit, raw_max_chars: rawMaxChars },
      row_count: rows.length,
      results: inspected,
      note: "Read-only inspection of stored raw Gemini/system-correlated factor JSON. No queue changes, no Gemini calls, no scoring."
    });
  } catch (err) {
    return json({ ok: false, version: SYSTEM_VERSION, endpoint: "board_factor_result_inspect", error: String(err?.message || err) }, { status: 500 });
  }
}

async function handleDebugSQL(request, env) {
  if (!isAuthorized(request, env)) return json({ ok: false, error: "Unauthorized" }, { status: 401 });

  let body = null;
  try {
    body = await safeJson(request);
    const sql = String(body?.sql || "").trim();
    await logSystemEvent(env, { trigger_source: "control_room_sql", action_label: "MANUAL/CHECK SQL", job_name: "debug_sql", status: sql ? "started" : "missing_sql", input_json: { sql: sql.slice(0, 1200) } });
    if (!sql) { await logSystemEvent(env, { trigger_source: "control_room_sql", action_label: "MANUAL/CHECK SQL", job_name: "debug_sql", status: "failed", http_status: 400, error: "Missing SQL" }); return json({ ok: false, error: "Missing SQL" }, { status: 400 }); }

    const maxRows = clampDebugSQLMaxRows(body?.max_rows ?? body?.maxRows);
    const maxChars = Math.max(200, Math.min(Number(body?.max_chars ?? body?.maxChars) || 900, 2000));

    const statements = sql.split(";").map(s => s.trim()).filter(Boolean);
    if (!statements.length) return json({ ok: false, error: "No SQL statements found" }, { status: 400 });

    const outputs = [];
    for (const statement of statements) {
      const upper = statement.toUpperCase();
      if (upper.includes("DROP TABLE") || upper.includes("ALTER TABLE") || upper.includes("CREATE TABLE")) {
        return json({ ok: false, error: "DDL blocked in Control Room SQL endpoint" }, { status: 400 });
      }

      if (upper.startsWith("SELECT") || upper.startsWith("PRAGMA")) {
        const result = await env.DB.prepare(statement).all();
        const allRows = result.results || [];
        const visibleRows = allRows.slice(0, maxRows);
        outputs.push({
          sql: statement,
          rows: compactDebugSQLRows(visibleRows, maxChars),
          row_count: allRows.length,
          returned_rows: visibleRows.length,
          truncated: allRows.length > visibleRows.length,
          output_guard: {
            enabled: true,
            max_rows: maxRows,
            max_chars_per_text_cell: maxChars,
            note: "Manual SQL output is capped to prevent browser/app crashes. Add LIMIT in SQL or pass max_rows up to 100 for focused diagnostics."
          },
          meta: result.meta || {}
        });
      } else if (upper.startsWith("DELETE") || upper.startsWith("UPDATE") || upper.startsWith("INSERT")) {
        const result = await env.DB.prepare(statement).run();
        outputs.push({ sql: statement, success: result.success, meta: result.meta || {} });
      } else {
        return json({ ok: false, error: `SQL command not allowed: ${statement.slice(0, 40)}` }, { status: 400 });
      }
    }

    const responseBody = { ok: true, version: SYSTEM_VERSION, manual_sql_output_guard: { enabled: true, default_max_rows: 50, hard_max_rows: 100 }, outputs };
    await logSystemEvent(env, { trigger_source: "control_room_sql", action_label: "MANUAL/CHECK SQL", job_name: "debug_sql", status: "success", http_status: 200, output_preview: responseBody });
    return json(responseBody);
  } catch (err) {
    await logSystemEvent(env, { trigger_source: "control_room_sql", action_label: "MANUAL/CHECK SQL", job_name: "debug_sql", status: "failed", http_status: 500, input_json: body, error: String(err?.message || err) });
    return json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}

function val(obj, key) {
  return obj && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : null;
}


const PARK_CONTEXT_BY_HOME_TEAM = {
  ARI: { venue: "Chase Field", park_factor_run: 1.02, park_factor_hr: 1.03, altitude_tier: "medium", roof_type: "retractable" },
  ATL: { venue: "Truist Park", park_factor_run: 1.01, park_factor_hr: 1.03, altitude_tier: "low", roof_type: "open" },
  BAL: { venue: "Oriole Park at Camden Yards", park_factor_run: 0.98, park_factor_hr: 0.96, altitude_tier: "low", roof_type: "open" },
  BOS: { venue: "Fenway Park", park_factor_run: 1.05, park_factor_hr: 0.98, altitude_tier: "low", roof_type: "open" },
  CHC: { venue: "Wrigley Field", park_factor_run: 1.00, park_factor_hr: 1.02, altitude_tier: "low", roof_type: "open" },
  CIN: { venue: "Great American Ball Park", park_factor_run: 1.04, park_factor_hr: 1.12, altitude_tier: "low", roof_type: "open" },
  CLE: { venue: "Progressive Field", park_factor_run: 0.99, park_factor_hr: 0.98, altitude_tier: "low", roof_type: "open" },
  COL: { venue: "Coors Field", park_factor_run: 1.18, park_factor_hr: 1.12, altitude_tier: "high", roof_type: "open" },
  CWS: { venue: "Rate Field", park_factor_run: 1.00, park_factor_hr: 1.05, altitude_tier: "low", roof_type: "open" },
  DET: { venue: "Comerica Park", park_factor_run: 1.00, park_factor_hr: 0.95, altitude_tier: "low", roof_type: "open" },
  HOU: { venue: "Daikin Park", park_factor_run: 1.00, park_factor_hr: 1.02, altitude_tier: "low", roof_type: "retractable" },
  KC: { venue: "Kauffman Stadium", park_factor_run: 1.01, park_factor_hr: 0.94, altitude_tier: "low", roof_type: "open" },
  LAA: { venue: "Angel Stadium", park_factor_run: 0.99, park_factor_hr: 0.98, altitude_tier: "low", roof_type: "open" },
  LAD: { venue: "Dodger Stadium", park_factor_run: 0.98, park_factor_hr: 1.02, altitude_tier: "low", roof_type: "open" },
  MIA: { venue: "loanDepot park", park_factor_run: 0.97, park_factor_hr: 0.94, altitude_tier: "low", roof_type: "retractable" },
  MIL: { venue: "American Family Field", park_factor_run: 1.01, park_factor_hr: 1.04, altitude_tier: "low", roof_type: "retractable" },
  MIN: { venue: "Target Field", park_factor_run: 0.99, park_factor_hr: 0.98, altitude_tier: "low", roof_type: "open" },
  NYM: { venue: "Citi Field", park_factor_run: 0.98, park_factor_hr: 0.96, altitude_tier: "low", roof_type: "open" },
  NYY: { venue: "Yankee Stadium", park_factor_run: 1.01, park_factor_hr: 1.08, altitude_tier: "low", roof_type: "open" },
  OAK: { venue: "Oakland Coliseum", park_factor_run: 0.97, park_factor_hr: 0.94, altitude_tier: "low", roof_type: "open" },
  PHI: { venue: "Citizens Bank Park", park_factor_run: 1.03, park_factor_hr: 1.08, altitude_tier: "low", roof_type: "open" },
  PIT: { venue: "PNC Park", park_factor_run: 0.99, park_factor_hr: 0.95, altitude_tier: "low", roof_type: "open" },
  SD: { venue: "Petco Park", park_factor_run: 0.95, park_factor_hr: 0.92, altitude_tier: "low", roof_type: "open" },
  SEA: { venue: "T-Mobile Park", park_factor_run: 0.96, park_factor_hr: 0.95, altitude_tier: "low", roof_type: "retractable" },
  SFG: { venue: "Oracle Park", park_factor_run: 0.96, park_factor_hr: 0.90, altitude_tier: "low", roof_type: "open" },
  STL: { venue: "Busch Stadium", park_factor_run: 0.99, park_factor_hr: 0.97, altitude_tier: "low", roof_type: "open" },
  TB: { venue: "Tropicana Field", park_factor_run: 0.98, park_factor_hr: 0.97, altitude_tier: "low", roof_type: "dome" },
  TEX: { venue: "Globe Life Field", park_factor_run: 1.00, park_factor_hr: 1.01, altitude_tier: "low", roof_type: "retractable" },
  TOR: { venue: "Rogers Centre", park_factor_run: 1.01, park_factor_hr: 1.03, altitude_tier: "low", roof_type: "retractable" },
  WSN: { venue: "Nationals Park", park_factor_run: 1.00, park_factor_hr: 1.00, altitude_tier: "low", roof_type: "open" }
};

function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function usablePositiveNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function marketTeamTotals(market) {
  const awayExisting = usablePositiveNumber(market?.away_implied_runs);
  const homeExisting = usablePositiveNumber(market?.home_implied_runs);
  if (awayExisting !== null || homeExisting !== null) {
    return {
      away_implied_runs: awayExisting,
      home_implied_runs: homeExisting,
      source: "market_existing_positive"
    };
  }

  const total = usablePositiveNumber(market?.current_total) ?? usablePositiveNumber(market?.game_total) ?? usablePositiveNumber(market?.open_total);
  if (total !== null) {
    return {
      away_implied_runs: Number((total / 2).toFixed(2)),
      home_implied_runs: Number((total / 2).toFixed(2)),
      source: "market_total_even_split_positive"
    };
  }

  return {
    away_implied_runs: null,
    home_implied_runs: null,
    source: "market_unavailable_null_no_zero_fill"
  };
}

function bullpenFatigueScore(row) {
  const ip = numOrNull(row?.last_game_ip);
  if (ip === null) return { score: null, tier: "unknown" };
  if (ip >= 4.0) return { score: 85, tier: "high" };
  if (ip >= 3.0) return { score: 65, tier: "medium" };
  return { score: 35, tier: "low" };
}

async function ensureDerivedTables(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS game_context_current (
      game_id TEXT PRIMARY KEY,
      game_date TEXT,
      away_team TEXT,
      home_team TEXT,
      venue TEXT,
      park_factor_run REAL,
      park_factor_hr REAL,
      altitude_tier TEXT,
      roof_type TEXT,
      away_implied_runs REAL,
      home_implied_runs REAL,
      implied_source TEXT,
      away_bullpen_fatigue_score REAL,
      home_bullpen_fatigue_score REAL,
      away_bullpen_fatigue_tier TEXT,
      home_bullpen_fatigue_tier TEXT,
      away_lineup_count INTEGER,
      home_lineup_count INTEGER,
      lineup_context_status TEXT,
      source TEXT,
      confidence TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

async function syncDerivedMetrics(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;
  await ensureDerivedTables(env);

  const gamesRes = await env.DB.prepare(`
    SELECT game_id, game_date, away_team, home_team, venue, start_time_utc
    FROM games
    WHERE game_date = ?
    ORDER BY game_id
  `).bind(slateDate).all();

  const rows = [];
  for (const g of (gamesRes.results || [])) {
    const market = await env.DB.prepare(`SELECT * FROM markets_current WHERE game_id = ?`).bind(g.game_id).first();
    const awayBullpen = await env.DB.prepare(`SELECT * FROM bullpens_current WHERE game_id = ? AND team_id = ?`).bind(g.game_id, g.away_team).first();
    const homeBullpen = await env.DB.prepare(`SELECT * FROM bullpens_current WHERE game_id = ? AND team_id = ?`).bind(g.game_id, g.home_team).first();
    const awayLineup = await env.DB.prepare(`SELECT COUNT(*) AS c FROM lineups_current WHERE game_id = ? AND team_id = ?`).bind(g.game_id, g.away_team).first();
    const homeLineup = await env.DB.prepare(`SELECT COUNT(*) AS c FROM lineups_current WHERE game_id = ? AND team_id = ?`).bind(g.game_id, g.home_team).first();

    const park = PARK_CONTEXT_BY_HOME_TEAM[g.home_team] || {};
    const totals = marketTeamTotals(market || {});
    const awayFatigue = bullpenFatigueScore(awayBullpen || {});
    const homeFatigue = bullpenFatigueScore(homeBullpen || {});
    const awayCount = Number(awayLineup?.c || 0);
    const homeCount = Number(homeLineup?.c || 0);

    rows.push({
      game_id: g.game_id,
      game_date: g.game_date,
      away_team: g.away_team,
      home_team: g.home_team,
      venue: park.venue || g.venue || null,
      park_factor_run: park.park_factor_run ?? null,
      park_factor_hr: park.park_factor_hr ?? null,
      altitude_tier: park.altitude_tier || "unknown",
      roof_type: park.roof_type || "unknown",
      away_implied_runs: totals.away_implied_runs,
      home_implied_runs: totals.home_implied_runs,
      implied_source: totals.source,
      away_bullpen_fatigue_score: awayFatigue.score,
      home_bullpen_fatigue_score: homeFatigue.score,
      away_bullpen_fatigue_tier: awayFatigue.tier,
      home_bullpen_fatigue_tier: homeFatigue.tier,
      away_lineup_count: awayCount,
      home_lineup_count: homeCount,
      lineup_context_status: awayCount >= 9 && homeCount >= 9 ? "usable" : "partial",
      source: "derived_metrics_static_park_context",
      confidence: "deterministic_zero_subrequest"
    });
  }

  await env.DB.prepare(`DELETE FROM game_context_current WHERE game_id LIKE ?`).bind(`${slateDate}_%`).run();

  let inserted = 0;
  for (const r of rows) {
    await env.DB.prepare(`
      INSERT INTO game_context_current (
        game_id, game_date, away_team, home_team, venue, park_factor_run, park_factor_hr, altitude_tier, roof_type,
        away_implied_runs, home_implied_runs, implied_source,
        away_bullpen_fatigue_score, home_bullpen_fatigue_score, away_bullpen_fatigue_tier, home_bullpen_fatigue_tier,
        away_lineup_count, home_lineup_count, lineup_context_status, source, confidence, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      r.game_id, r.game_date, r.away_team, r.home_team, r.venue, r.park_factor_run, r.park_factor_hr, r.altitude_tier, r.roof_type,
      r.away_implied_runs, r.home_implied_runs, r.implied_source,
      r.away_bullpen_fatigue_score, r.home_bullpen_fatigue_score, r.away_bullpen_fatigue_tier, r.home_bullpen_fatigue_tier,
      r.away_lineup_count, r.home_lineup_count, r.lineup_context_status, r.source, r.confidence
    ).run();
    inserted++;
  }

  return {
    ok: true,
    job: input.job || "scrape_derived_metrics",
    slate_date: slateDate,
    source: "derived_metrics_static_park_context",
    mode: "zero_subrequest_deterministic",
    fetched_rows: rows.length,
    inserted: { game_context_current: inserted },
    park_context_rows: rows.filter(r => r.park_factor_run !== null && r.park_factor_hr !== null).length,
    implied_rows: rows.filter(r => r.away_implied_runs !== null || r.home_implied_runs !== null).length,
    bullpen_context_rows: rows.filter(r => r.away_bullpen_fatigue_tier !== "unknown" && r.home_bullpen_fatigue_tier !== "unknown").length,
    lineup_context_rows: rows.filter(r => r.lineup_context_status === "usable").length
  };
}


async function ensureEdgeCandidateTables(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS edge_candidates_hits (
      candidate_id TEXT PRIMARY KEY,
      slate_date TEXT,
      game_id TEXT,
      team_id TEXT,
      opponent_team TEXT,
      player_name TEXT,
      lineup_slot INTEGER,
      bats TEXT,
      opposing_starter TEXT,
      opposing_throws TEXT,
      player_avg REAL,
      player_obp REAL,
      player_slg REAL,
      last_game_ab INTEGER,
      last_game_hits INTEGER,
      park_factor_run REAL,
      park_factor_hr REAL,
      bullpen_fatigue_score REAL,
      bullpen_fatigue_tier TEXT,
      lineup_context_status TEXT,
      candidate_tier TEXT,
      candidate_reason TEXT,
      source TEXT,
      confidence TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

function edgeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function edgeTxt(v) {
  return String(v || "").trim();
}

function edgeSafeIdPart(v) {
  return edgeTxt(v).replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80);
}

function hitCandidateTier(row) {
  const slot = Number(row.lineup_slot || 99);
  const avg = edgeNum(row.player_avg);
  const obp = edgeNum(row.player_obp);
  const lastAb = edgeNum(row.last_game_ab);
  const lastHits = edgeNum(row.last_game_hits);
  const parkRun = edgeNum(row.park_factor_run) || 1;
  const bullpenScore = edgeNum(row.bullpen_fatigue_score);

  let points = 0;
  const reasons = [];

  if (slot >= 1 && slot <= 3) { points += 4; reasons.push("premium_lineup_slot"); }
  else if (slot >= 4 && slot <= 5) { points += 3; reasons.push("middle_lineup_slot"); }
  else if (slot >= 6 && slot <= 7) { points += 1; reasons.push("acceptable_lineup_slot"); }

  if (lastAb !== null && lastAb >= 4) { points += 2; reasons.push("strong_recent_ab_volume"); }
  else if (lastAb !== null && lastAb >= 3) { points += 1; reasons.push("recent_ab_volume"); }

  if (lastHits !== null && lastHits >= 2) { points += 2; reasons.push("recent_multi_hit_signal"); }
  else if (lastHits !== null && lastHits >= 1) { points += 1; reasons.push("recent_hit_signal"); }

  if (avg !== null && avg >= 0.275) { points += 3; reasons.push("strong_avg"); }
  else if (avg !== null && avg >= 0.250) { points += 2; reasons.push("solid_avg"); }
  else if (avg !== null && avg >= 0.230) { points += 1; reasons.push("playable_avg"); }
  else if (avg === null) { reasons.push("season_avg_unavailable_no_penalty"); }

  if (obp !== null && obp >= 0.340) { points += 2; reasons.push("strong_on_base_profile"); }
  else if (obp !== null && obp >= 0.310) { points += 1; reasons.push("playable_on_base_profile"); }
  else if (obp === null) { reasons.push("season_obp_unavailable_no_penalty"); }

  if (parkRun >= 1.02) { points += 1; reasons.push("positive_run_environment"); }
  if (bullpenScore !== null && bullpenScore >= 65) { points += 1; reasons.push("opponent_bullpen_pressure"); }

  if (points >= 8) return { tier: "A_POOL", reason: reasons.join("|") };
  if (points >= 5) return { tier: "B_POOL", reason: reasons.join("|") };
  return { tier: "WATCHLIST", reason: reasons.join("|") || "passed_base_filters" };
}


async function insertEdgeCandidatesHitsBatch(env, rows) {
  if (!rows.length) return 0;
  const insertCols = ["candidate_id", "slate_date", "game_id", "team_id", "opponent_team", "player_name", "lineup_slot", "bats", "opposing_starter", "opposing_throws", "player_avg", "player_obp", "player_slg", "last_game_ab", "last_game_hits", "park_factor_run", "park_factor_hr", "bullpen_fatigue_score", "bullpen_fatigue_tier", "lineup_context_status", "candidate_tier", "candidate_reason", "source", "confidence"];
  const placeholders = insertCols.map(() => "?").join(", ");
  const updateCols = insertCols.filter(c => c !== "candidate_id");
  const updateSql = updateCols.map(c => `${c}=excluded.${c}`).join(", ");
  const sql = `INSERT INTO edge_candidates_hits (${insertCols.join(", ")}) VALUES (${placeholders}) ON CONFLICT(candidate_id) DO UPDATE SET ${updateSql}, updated_at=CURRENT_TIMESTAMP`;

  let written = 0;
  const chunkSize = 75;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const statements = chunk.map(r => env.DB.prepare(sql).bind(...insertCols.map(c => r[c] ?? null)));
    await env.DB.batch(statements);
    written += chunk.length;
  }
  return written;
}

async function buildEdgeCandidatesHits(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;
  await ensureEdgeCandidateTables(env);

  const rowsRes = await env.DB.prepare(`
    SELECT
      l.game_id,
      g.game_date,
      l.team_id,
      CASE WHEN l.team_id = g.away_team THEN g.home_team ELSE g.away_team END AS opponent_team,
      l.player_name,
      l.slot AS lineup_slot,
      COALESCE(NULLIF(l.bats,''), NULLIF(p.bats,'')) AS bats,
      s.starter_name AS opposing_starter,
      s.throws AS opposing_throws,
      p.avg AS player_avg,
      p.obp AS player_obp,
      p.slg AS player_slg,
      u.last_game_ab,
      u.last_game_hits,
      gc.park_factor_run,
      gc.park_factor_hr,
      CASE WHEN l.team_id = g.away_team THEN gc.home_bullpen_fatigue_score ELSE gc.away_bullpen_fatigue_score END AS bullpen_fatigue_score,
      CASE WHEN l.team_id = g.away_team THEN gc.home_bullpen_fatigue_tier ELSE gc.away_bullpen_fatigue_tier END AS bullpen_fatigue_tier,
      gc.lineup_context_status
    FROM lineups_current l
    JOIN games g ON g.game_id = l.game_id
    LEFT JOIN players_current p ON p.player_name = l.player_name AND p.team_id = l.team_id
    LEFT JOIN player_recent_usage u ON u.player_name = l.player_name AND u.team_id = l.team_id
    LEFT JOIN game_context_current gc ON gc.game_id = l.game_id
    LEFT JOIN starters_current s
      ON s.game_id = l.game_id
      AND s.team_id = CASE WHEN l.team_id = g.away_team THEN g.home_team ELSE g.away_team END
    WHERE g.game_date = ?
      AND l.slot BETWEEN 1 AND 7
      AND l.player_name IS NOT NULL
      AND l.player_name != ''
      AND COALESCE(u.last_game_ab, 0) >= 2
      AND COALESCE(gc.park_factor_run, 1.0) >= 0.94
    ORDER BY l.game_id, l.team_id, l.slot
  `).bind(slateDate).all();

  const rawRows = rowsRes.results || [];
  const seen = new Set();
  const rows = [];

  for (const r of rawRows) {
    const candidateId = `${slateDate}_${edgeSafeIdPart(r.game_id)}_${edgeSafeIdPart(r.team_id)}_${edgeSafeIdPart(r.player_name)}_HITS`;
    if (seen.has(candidateId)) continue;
    seen.add(candidateId);

    const tier = hitCandidateTier(r);
    if (tier.tier === "WATCHLIST") continue;

    rows.push({
      candidate_id: candidateId,
      slate_date: slateDate,
      game_id: r.game_id,
      team_id: r.team_id,
      opponent_team: r.opponent_team,
      player_name: r.player_name,
      lineup_slot: edgeNum(r.lineup_slot),
      bats: r.bats || null,
      opposing_starter: r.opposing_starter || null,
      opposing_throws: r.opposing_throws || null,
      player_avg: edgeNum(r.player_avg),
      player_obp: edgeNum(r.player_obp),
      player_slg: edgeNum(r.player_slg),
      last_game_ab: edgeNum(r.last_game_ab),
      last_game_hits: edgeNum(r.last_game_hits),
      park_factor_run: edgeNum(r.park_factor_run),
      park_factor_hr: edgeNum(r.park_factor_hr),
      bullpen_fatigue_score: edgeNum(r.bullpen_fatigue_score),
      bullpen_fatigue_tier: r.bullpen_fatigue_tier || "unknown",
      lineup_context_status: r.lineup_context_status || "unknown",
      candidate_tier: tier.tier,
      candidate_reason: tier.reason,
      source: "scheduled_edge_prep_hits_b_aggressive",
      confidence: "deterministic_candidate_pool_not_scored"
    });
  }

  await env.DB.prepare(`DELETE FROM edge_candidates_hits WHERE slate_date = ?`).bind(slateDate).run();
  const inserted = await insertEdgeCandidatesHitsBatch(env, rows);

  const aPool = rows.filter(r => r.candidate_tier === "A_POOL").length;
  const bPool = rows.filter(r => r.candidate_tier === "B_POOL").length;

  return {
    ok: true,
    job: input.job || "build_edge_candidates_hits",
    slate_date: slateDate,
    source: "scheduled_edge_prep_hits_b_aggressive",
    mode: "zero_api_subrequest_deterministic",
    filter_mode: "B_AGGRESSIVE_FALLBACK_SAFE",
    raw_rows: rawRows.length,
    fetched_rows: rows.length,
    inserted: { edge_candidates_hits: inserted },
    a_pool: aPool,
    b_pool: bPool,
    skipped_count: 0,
    skipped: [],
    complete: true,
    note: "Candidate pool only. No probabilities, scores, or betting decisions. Season stats are optional; lineup slot and recent usage drive fallback-safe candidate generation."
  };
}


function rbiCandidateTier(row) {
  const slot = Number(row.lineup_slot || 99);
  const avg = edgeNum(row.player_avg);
  const obp = edgeNum(row.player_obp);
  const slg = edgeNum(row.player_slg);
  const prev1Obp = edgeNum(row.prev1_obp);
  const prev2Obp = edgeNum(row.prev2_obp);
  const prev3Obp = edgeNum(row.prev3_obp);
  const parkRun = edgeNum(row.park_factor_run) || 1;
  const bullpenScore = edgeNum(row.bullpen_fatigue_score);

  let opportunity = 0;
  let lineupSpot = 0;
  let behindRunner = 0;
  const reasons = [];

  if (slot >= 3 && slot <= 5) { lineupSpot += 5; reasons.push("core_rbi_lineup_slot"); }
  else if (slot === 2 || slot === 6) { lineupSpot += 3; reasons.push("playable_rbi_lineup_slot"); }
  else if (slot === 7) { lineupSpot += 1; reasons.push("thin_but_possible_rbi_slot"); }

  if (avg !== null && avg >= 0.270) { opportunity += 3; reasons.push("strong_avg_contact"); }
  else if (avg !== null && avg >= 0.240) { opportunity += 2; reasons.push("playable_avg_contact"); }
  else if (avg !== null && avg >= 0.220) { opportunity += 1; reasons.push("thin_avg_contact"); }
  else if (avg === null) { reasons.push("avg_unavailable_no_penalty"); }

  if (slg !== null && slg >= 0.460) { opportunity += 4; reasons.push("strong_slg_rbi_damage"); }
  else if (slg !== null && slg >= 0.400) { opportunity += 2; reasons.push("playable_slg_rbi_damage"); }
  else if (slg === null) { reasons.push("slg_unavailable_no_penalty"); }

  if (obp !== null && obp >= 0.340) { opportunity += 1; reasons.push("strong_self_onbase_floor"); }

  const tableSetters = [prev1Obp, prev2Obp, prev3Obp].filter(v => v !== null);
  if (tableSetters.length) {
    const tableSetterAvg = tableSetters.reduce((a, b) => a + b, 0) / tableSetters.length;
    if (tableSetterAvg >= 0.340) { behindRunner += 5; reasons.push("strong_runner_onbase_ahead"); }
    else if (tableSetterAvg >= 0.315) { behindRunner += 3; reasons.push("playable_runner_onbase_ahead"); }
    else if (tableSetterAvg >= 0.290) { behindRunner += 1; reasons.push("thin_runner_onbase_ahead"); }
  } else {
    reasons.push("runner_onbase_context_unavailable");
  }

  if (parkRun >= 1.02) { opportunity += 1; reasons.push("positive_run_environment"); }
  if (bullpenScore !== null && bullpenScore >= 65) { opportunity += 1; reasons.push("opponent_bullpen_pressure"); }

  const total = opportunity + lineupSpot + behindRunner;
  const runFlag = parkRun >= 1.02 ? "positive" : (parkRun <= 0.97 ? "suppressive" : "neutral");

  if (total >= 12 && opportunity >= 4) return { tier: "A_POOL", reason: reasons.join("|"), opportunity, lineupSpot, behindRunner, runFlag };
  if (total >= 8) return { tier: "B_POOL", reason: reasons.join("|"), opportunity, lineupSpot, behindRunner, runFlag };
  return { tier: "WATCHLIST", reason: reasons.join("|") || "passed_base_filters", opportunity, lineupSpot, behindRunner, runFlag };
}

async function ensureEdgeCandidatesRbiTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS edge_candidates_rbi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slate_date TEXT,
      game_id TEXT,
      team_id TEXT,
      opponent_team TEXT,
      player_name TEXT,
      lineup_slot INTEGER,
      bats TEXT,
      opposing_starter TEXT,
      opposing_throws TEXT,
      player_avg REAL,
      player_obp REAL,
      player_slg REAL,
      rbi_opportunity_score REAL,
      lineup_rbi_spot_score REAL,
      behind_runner_onbase_score REAL,
      bullpen_fatigue_tier TEXT,
      run_environment_flag TEXT,
      candidate_tier TEXT,
      candidate_reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

async function insertEdgeCandidatesRbiBatch(env, rows) {
  if (!rows.length) return 0;
  const insertCols = [
    "slate_date", "game_id", "team_id", "opponent_team", "player_name",
    "lineup_slot", "bats", "opposing_starter", "opposing_throws",
    "player_avg", "player_obp", "player_slg",
    "rbi_opportunity_score", "lineup_rbi_spot_score", "behind_runner_onbase_score",
    "bullpen_fatigue_tier", "run_environment_flag", "candidate_tier", "candidate_reason"
  ];
  const placeholders = insertCols.map(() => "?").join(", ");
  const sql = `INSERT INTO edge_candidates_rbi (${insertCols.join(", ")}) VALUES (${placeholders})`;

  let written = 0;
  const chunkSize = 75;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const statements = chunk.map(r => env.DB.prepare(sql).bind(...insertCols.map(c => r[c] ?? null)));
    await env.DB.batch(statements);
    written += chunk.length;
  }
  return written;
}

async function buildEdgeCandidatesRbi(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;

  await ensureEdgeCandidatesRbiTable(env);

  const rowsRes = await env.DB.prepare(`
    WITH lineup_base AS (
      SELECT
        l.game_id,
        g.game_date,
        l.team_id,
        CASE WHEN l.team_id = g.away_team THEN g.home_team ELSE g.away_team END AS opponent_team,
        l.player_name,
        l.slot AS lineup_slot,
        COALESCE(NULLIF(l.bats,''), NULLIF(p.bats,'')) AS bats,
        s.starter_name AS opposing_starter,
        s.throws AS opposing_throws,
        p.avg AS player_avg,
        p.obp AS player_obp,
        p.slg AS player_slg,
        prev1.obp AS prev1_obp,
        prev2.obp AS prev2_obp,
        prev3.obp AS prev3_obp,
        gc.park_factor_run,
        CASE WHEN l.team_id = g.away_team THEN gc.home_bullpen_fatigue_score ELSE gc.away_bullpen_fatigue_score END AS bullpen_fatigue_score,
        CASE WHEN l.team_id = g.away_team THEN gc.home_bullpen_fatigue_tier ELSE gc.away_bullpen_fatigue_tier END AS bullpen_fatigue_tier
      FROM lineups_current l
      JOIN games g ON g.game_id = l.game_id
      LEFT JOIN players_current p ON p.player_name = l.player_name AND p.team_id = l.team_id
      LEFT JOIN lineups_current l1 ON l1.game_id = l.game_id AND l1.team_id = l.team_id AND l1.slot = l.slot - 1
      LEFT JOIN players_current prev1 ON prev1.player_name = l1.player_name AND prev1.team_id = l.team_id
      LEFT JOIN lineups_current l2 ON l2.game_id = l.game_id AND l2.team_id = l.team_id AND l2.slot = l.slot - 2
      LEFT JOIN players_current prev2 ON prev2.player_name = l2.player_name AND prev2.team_id = l.team_id
      LEFT JOIN lineups_current l3 ON l3.game_id = l.game_id AND l3.team_id = l.team_id AND l3.slot = l.slot - 3
      LEFT JOIN players_current prev3 ON prev3.player_name = l3.player_name AND prev3.team_id = l.team_id
      LEFT JOIN game_context_current gc ON gc.game_id = l.game_id
      LEFT JOIN starters_current s
        ON s.game_id = l.game_id
        AND s.team_id = CASE WHEN l.team_id = g.away_team THEN g.home_team ELSE g.away_team END
      WHERE g.game_date = ?
        AND l.slot BETWEEN 2 AND 7
        AND l.player_name IS NOT NULL
        AND l.player_name != ''
    )
    SELECT * FROM lineup_base
    ORDER BY game_id, team_id, lineup_slot
  `).bind(slateDate).all();

  const rawRows = rowsRes.results || [];
  const seen = new Set();
  const rows = [];

  for (const r of rawRows) {
    const key = `${slateDate}_${edgeSafeIdPart(r.game_id)}_${edgeSafeIdPart(r.team_id)}_${edgeSafeIdPart(r.player_name)}_RBI`;
    if (seen.has(key)) continue;
    seen.add(key);

    const tier = rbiCandidateTier(r);
    if (tier.tier === "WATCHLIST") continue;

    rows.push({
      slate_date: slateDate,
      game_id: r.game_id,
      team_id: r.team_id,
      opponent_team: r.opponent_team,
      player_name: r.player_name,
      lineup_slot: edgeNum(r.lineup_slot),
      bats: r.bats || null,
      opposing_starter: r.opposing_starter || null,
      opposing_throws: r.opposing_throws || null,
      player_avg: edgeNum(r.player_avg),
      player_obp: edgeNum(r.player_obp),
      player_slg: edgeNum(r.player_slg),
      rbi_opportunity_score: edgeNum(tier.opportunity),
      lineup_rbi_spot_score: edgeNum(tier.lineupSpot),
      behind_runner_onbase_score: edgeNum(tier.behindRunner),
      bullpen_fatigue_tier: r.bullpen_fatigue_tier || "unknown",
      run_environment_flag: tier.runFlag,
      candidate_tier: tier.tier,
      candidate_reason: tier.reason
    });
  }

  await env.DB.prepare(`DELETE FROM edge_candidates_rbi WHERE slate_date = ?`).bind(slateDate).run();
  const inserted = await insertEdgeCandidatesRbiBatch(env, rows);

  const aPool = rows.filter(r => r.candidate_tier === "A_POOL").length;
  const bPool = rows.filter(r => r.candidate_tier === "B_POOL").length;

  return {
    ok: true,
    job: input.job || "build_edge_candidates_rbi",
    slate_date: slateDate,
    source: "scheduled_edge_prep_rbi_b_aggressive",
    mode: "zero_api_subrequest_deterministic",
    filter_mode: "RBI_B_AGGRESSIVE",
    raw_rows: rawRows.length,
    fetched_rows: rows.length,
    inserted: { edge_candidates_rbi: inserted },
    a_pool: aPool,
    b_pool: bPool,
    skipped_count: 0,
    skipped: [],
    complete: true,
    note: "RBI candidate pool only. No probabilities, scores, or betting decisions."
  };
}


function rfiStarterWeakness(prefix, era, whip) {
  const e = edgeNum(era);
  const w = edgeNum(whip);
  let score = 0;
  const reasons = [];
  const warnings = [];

  if (e === null) warnings.push(`${prefix}_starter_era_missing`);
  else if (e >= 5.00) { score += 3; reasons.push(`${prefix}_starter_era_very_attackable`); }
  else if (e >= 4.25) { score += 2; reasons.push(`${prefix}_starter_era_attackable`); }
  else if (e >= 3.75) { score += 1; reasons.push(`${prefix}_starter_era_playable`); }

  if (w === null) warnings.push(`${prefix}_starter_whip_missing`);
  else if (w >= 1.40) { score += 3; reasons.push(`${prefix}_starter_whip_very_attackable`); }
  else if (w >= 1.30) { score += 2; reasons.push(`${prefix}_starter_whip_attackable`); }
  else if (w >= 1.20) { score += 1; reasons.push(`${prefix}_starter_whip_playable`); }

  return { score, reasons, warnings };
}

function rfiTop3Strength(prefix, hitters) {
  const rows = Array.isArray(hitters) ? hitters : [];
  let score = 0;
  const reasons = [];
  const warnings = [];

  if (rows.length < 3) warnings.push(`${prefix}_top3_lineup_incomplete`);
  if (!rows.length) return { score, reasons, warnings, strength: null };

  const obps = rows.map(r => edgeNum(r.obp)).filter(v => v !== null);
  const slgs = rows.map(r => edgeNum(r.slg)).filter(v => v !== null);
  const avgs = rows.map(r => edgeNum(r.avg)).filter(v => v !== null);

  if (!obps.length) warnings.push(`${prefix}_top3_obp_missing`);
  if (!slgs.length) warnings.push(`${prefix}_top3_slg_missing`);

  const avgObp = obps.length ? obps.reduce((a, b) => a + b, 0) / obps.length : null;
  const avgSlg = slgs.length ? slgs.reduce((a, b) => a + b, 0) / slgs.length : null;
  const avgAvg = avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null;

  if (avgObp !== null && avgObp >= 0.340) { score += 3; reasons.push(`${prefix}_top3_strong_obp`); }
  else if (avgObp !== null && avgObp >= 0.320) { score += 2; reasons.push(`${prefix}_top3_playable_obp`); }
  else if (avgObp !== null && avgObp >= 0.300) { score += 1; reasons.push(`${prefix}_top3_thin_obp`); }

  if (avgSlg !== null && avgSlg >= 0.450) { score += 3; reasons.push(`${prefix}_top3_strong_slg`); }
  else if (avgSlg !== null && avgSlg >= 0.410) { score += 2; reasons.push(`${prefix}_top3_playable_slg`); }
  else if (avgSlg !== null && avgSlg >= 0.380) { score += 1; reasons.push(`${prefix}_top3_thin_slg`); }

  const strengthPieces = [avgObp, avgSlg, avgAvg].filter(v => v !== null);
  const strength = strengthPieces.length ? Number((strengthPieces.reduce((a, b) => a + b, 0) / strengthPieces.length).toFixed(4)) : null;
  return { score, reasons, warnings, strength };
}

function rfiParkScore(parkFactorRun) {
  const park = edgeNum(parkFactorRun);
  const reasons = [];
  const warnings = [];
  let score = 0;
  if (park === null) warnings.push("park_factor_run_missing");
  else if (park >= 1.04) { score += 2; reasons.push("strong_first_inning_run_environment"); }
  else if (park >= 1.01) { score += 1; reasons.push("playable_first_inning_run_environment"); }
  else if (park <= 0.96) { score -= 1; reasons.push("suppressive_first_inning_run_environment"); }
  return { score, reasons, warnings };
}

function rfiTier(score) {
  const s = edgeNum(score) || 0;
  if (s >= 14) return "YES_RFI";
  if (s >= 10) return "LEAN_YES";
  if (s <= 4) return "NO_RFI";
  return "WATCHLIST";
}

function rfiApplyLineupCompletenessCap(tier, awayIncomplete, homeIncomplete) {
  if (awayIncomplete && homeIncomplete) {
    return { tier: "WATCHLIST", tag: "cap_critical_data_missing" };
  }
  if (awayIncomplete || homeIncomplete) {
    return { tier: tier === "YES_RFI" ? "LEAN_YES" : tier, tag: "cap_partial_data_missing" };
  }
  return { tier, tag: null };
}

async function ensureEdgeCandidatesRfiTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS edge_candidates_rfi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slate_date TEXT,
      game_id TEXT,
      home_team TEXT,
      away_team TEXT,
      home_starter TEXT,
      away_starter TEXT,
      home_era REAL,
      away_era REAL,
      home_whip REAL,
      away_whip REAL,
      top3_home_strength REAL,
      top3_away_strength REAL,
      park_factor_run REAL,
      rfi_score REAL,
      candidate_tier TEXT,
      candidate_reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

async function insertEdgeCandidatesRfiBatch(env, rows) {
  if (!rows.length) return 0;
  const insertCols = [
    "slate_date", "game_id", "home_team", "away_team", "home_starter", "away_starter",
    "home_era", "away_era", "home_whip", "away_whip",
    "top3_home_strength", "top3_away_strength", "park_factor_run",
    "rfi_score", "candidate_tier", "candidate_reason"
  ];
  const placeholders = insertCols.map(() => "?").join(", ");
  const sql = `INSERT INTO edge_candidates_rfi (${insertCols.join(", ")}) VALUES (${placeholders})`;
  let written = 0;
  const chunkSize = 75;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const statements = chunk.map(r => env.DB.prepare(sql).bind(...insertCols.map(c => r[c] ?? null)));
    await env.DB.batch(statements);
    written += chunk.length;
  }
  return written;
}

async function buildEdgeCandidatesRfi(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;

  await ensureEdgeCandidatesRfiTable(env);

  const gamesRes = await env.DB.prepare(`
    SELECT
      g.game_id,
      g.game_date,
      g.away_team,
      g.home_team,
      hs.starter_name AS home_starter,
      hs.era AS home_era,
      hs.whip AS home_whip,
      ast.starter_name AS away_starter,
      ast.era AS away_era,
      ast.whip AS away_whip,
      gc.park_factor_run
    FROM games g
    LEFT JOIN starters_current hs ON hs.game_id = g.game_id AND hs.team_id = g.home_team
    LEFT JOIN starters_current ast ON ast.game_id = g.game_id AND ast.team_id = g.away_team
    LEFT JOIN game_context_current gc ON gc.game_id = g.game_id
    WHERE g.game_date = ?
    ORDER BY g.game_id
  `).bind(slateDate).all();

  const games = gamesRes.results || [];
  const lineupRes = await env.DB.prepare(`
    SELECT
      l.game_id,
      l.team_id,
      l.slot,
      l.player_name,
      p.avg,
      p.obp,
      p.slg
    FROM lineups_current l
    JOIN games g ON g.game_id = l.game_id
    LEFT JOIN players_current p ON p.player_name = l.player_name AND p.team_id = l.team_id
    WHERE g.game_date = ?
      AND l.slot BETWEEN 1 AND 3
      AND l.player_name IS NOT NULL
      AND l.player_name != ''
    ORDER BY l.game_id, l.team_id, l.slot
  `).bind(slateDate).all();

  const top3ByGameTeam = new Map();
  for (const r of (lineupRes.results || [])) {
    const key = `${r.game_id}|||${r.team_id}`;
    if (!top3ByGameTeam.has(key)) top3ByGameTeam.set(key, []);
    top3ByGameTeam.get(key).push(r);
  }

  const rows = [];
  const warnings = [];

  for (const g of games) {
    const awayTop = rfiTop3Strength("away", top3ByGameTeam.get(`${g.game_id}|||${g.away_team}`) || []);
    const homeTop = rfiTop3Strength("home", top3ByGameTeam.get(`${g.game_id}|||${g.home_team}`) || []);
    const awayStarter = rfiStarterWeakness("away", g.away_era, g.away_whip);
    const homeStarter = rfiStarterWeakness("home", g.home_era, g.home_whip);
    const park = rfiParkScore(g.park_factor_run);

    const gameWarnings = [
      ...awayTop.warnings,
      ...homeTop.warnings,
      ...awayStarter.warnings,
      ...homeStarter.warnings,
      ...park.warnings
    ];
    if (!g.away_starter) gameWarnings.push("away_starter_missing");
    if (!g.home_starter) gameWarnings.push("home_starter_missing");

    let score = awayTop.score + homeTop.score + awayStarter.score + homeStarter.score + park.score;
    score = Math.max(0, Math.min(30, score));
    const baseTier = rfiTier(score);
    const awayTop3Incomplete = awayTop.warnings.includes("away_top3_lineup_incomplete");
    const homeTop3Incomplete = homeTop.warnings.includes("home_top3_lineup_incomplete");
    const cap = rfiApplyLineupCompletenessCap(baseTier, awayTop3Incomplete, homeTop3Incomplete);
    const tier = cap.tier;
    const reasonTags = [
      ...awayTop.reasons,
      ...homeTop.reasons,
      ...awayStarter.reasons,
      ...homeStarter.reasons,
      ...park.reasons,
      ...gameWarnings.map(w => `warn_${w}`)
    ];
    if (cap.tag) reasonTags.push(cap.tag);

    if (gameWarnings.length) warnings.push({ game_id: g.game_id, warnings: gameWarnings });

    rows.push({
      slate_date: slateDate,
      game_id: g.game_id,
      home_team: g.home_team,
      away_team: g.away_team,
      home_starter: g.home_starter || null,
      away_starter: g.away_starter || null,
      home_era: edgeNum(g.home_era),
      away_era: edgeNum(g.away_era),
      home_whip: edgeNum(g.home_whip),
      away_whip: edgeNum(g.away_whip),
      top3_home_strength: homeTop.strength,
      top3_away_strength: awayTop.strength,
      park_factor_run: edgeNum(g.park_factor_run),
      rfi_score: score,
      candidate_tier: tier,
      candidate_reason: reasonTags.length ? reasonTags.join("|") : "neutral_rfi_profile"
    });
  }

  await env.DB.prepare(`DELETE FROM edge_candidates_rfi WHERE slate_date = ?`).bind(slateDate).run();
  const inserted = await insertEdgeCandidatesRfiBatch(env, rows);

  const yes = rows.filter(r => r.candidate_tier === "YES_RFI").length;
  const lean = rows.filter(r => r.candidate_tier === "LEAN_YES").length;
  const watchOrNo = rows.filter(r => r.candidate_tier === "WATCHLIST" || r.candidate_tier === "NO_RFI").length;

  return {
    ok: true,
    job: input.job || "build_edge_candidates_rfi",
    slate_date: slateDate,
    source: "scheduled_edge_prep_rfi_game_level",
    mode: "zero_api_subrequest_deterministic",
    filter_mode: "RFI_GAME_LEVEL_ALL_GAMES",
    raw_games: games.length,
    fetched_rows: rows.length,
    inserted: { edge_candidates_rfi: inserted },
    yes_rfi: yes,
    lean_yes: lean,
    watchlist_or_no: watchOrNo,
    warnings,
    complete: true,
    note: "RFI candidate pool only. Game-level setup rows. No probabilities, scores-as-bets, or betting decisions."
  };
}



async function boardTableExists(env) {
  const row = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='mlb_stats' LIMIT 1").first();
  return !!row;
}

async function boardScalar(env, sql, binds = []) {
  try {
    const row = binds.length ? await env.DB.prepare(sql).bind(...binds).first() : await env.DB.prepare(sql).first();
    const values = Object.values(row || {});
    return { ok: true, value: Number(values[0] || 0), row: row || null };
  } catch (err) {
    return { ok: false, value: 0, error: String(err?.message || err) };
  }
}

async function boardRows(env, sql, binds = []) {
  try {
    const res = binds.length ? await env.DB.prepare(sql).bind(...binds).all() : await env.DB.prepare(sql).all();
    return { ok: true, rows: res.results || [] };
  } catch (err) {
    return { ok: false, rows: [], error: String(err?.message || err) };
  }
}

function boardSlug(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unknown";
}

function boardGameKey(row) {
  const start = String(row.start_time || "").slice(0, 10) || "unknown_date";
  const team = String(row.team || "").trim().toUpperCase() || "UNK";
  const opp = String(row.opponent || "").replace(/^@|^vs\.?/i, "").trim().toUpperCase() || "UNK";
  return `${start}_${team}_${opp}`;
}


function boardSingleRowWhere(alias = "") {
  const p = alias ? `${alias}.` : "";
  return `COALESCE(${p}player_name,'') NOT LIKE '%+%'
    AND COALESCE(${p}team,'') NOT LIKE '%/%'
    AND COALESCE(${p}opponent,'') NOT LIKE '%/%'
    AND TRIM(COALESCE(${p}team,'')) <> ''
    AND TRIM(COALESCE(${p}opponent,'')) <> ''
    AND UPPER(TRIM(${p}team)) <> UPPER(TRIM(${p}opponent))`;
}

function boardActionableStartWhere(alias = "") {
  const p = alias ? `${alias}.` : "";
  return `datetime(${p}start_time) > datetime('now', '+${BOARD_ACTIONABLE_START_BUFFER_MINUTES} minutes')`;
}

function boardActionableSingleRowWhere(alias = "") {
  return `(${boardSingleRowWhere(alias)}) AND (${boardActionableStartWhere(alias)})`;
}

function boardComboRowWhere(alias = "") {
  const p = alias ? `${alias}.` : "";
  return `(COALESCE(${p}player_name,'') LIKE '%+%'
    OR COALESCE(${p}team,'') LIKE '%/%'
    OR COALESCE(${p}opponent,'') LIKE '%/%'
    OR TRIM(COALESCE(${p}team,'')) = ''
    OR TRIM(COALESCE(${p}opponent,'')) = ''
    OR UPPER(TRIM(${p}team)) = UPPER(TRIM(${p}opponent)))`;
}

function boardNormalizedGameKeySql() {
  return `CASE
    WHEN UPPER(TRIM(team)) < UPPER(TRIM(opponent)) THEN UPPER(TRIM(team)) || '_' || UPPER(TRIM(opponent))
    ELSE UPPER(TRIM(opponent)) || '_' || UPPER(TRIM(team))
  END`;
}

async function runBoardSifterPreview(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;
  const sampleLimit = Math.max(1, Math.min(Number(input.sample_limit || 2), 10));
  const exists = await boardTableExists(env);
  if (!exists) {
    return {
      ok: false,
      job: "board_sifter_preview",
      version: SYSTEM_VERSION,
      status: "MISSING_TABLE",
      table: "mlb_stats",
      error: "mlb_stats table not found in this D1 binding",
      note: "Dry-run only. No writes, no Gemini, no existing pipeline changes."
    };
  }

  const totalRows = await boardScalar(env, "SELECT COUNT(*) FROM mlb_stats");
  const latestRow = await boardRows(env, "SELECT MAX(updated_at) AS latest_updated_at, MIN(updated_at) AS oldest_updated_at FROM mlb_stats");
  const slateRows = await boardScalar(env, "SELECT COUNT(*) FROM mlb_stats WHERE substr(start_time, 1, 10) = ?", [slateDate]);
  const activeWhere = slateRows.value > 0 ? "substr(start_time, 1, 10) = ?" : "1=1";
  const activeBinds = slateRows.value > 0 ? [slateDate] : [];
  const activeMode = slateRows.value > 0 ? "slate_date_start_time_match" : "fallback_all_rows_no_slate_match";

  const singleWhere = boardActionableSingleRowWhere();
  const comboWhere = boardComboRowWhere();
  const gameKeySql = boardNormalizedGameKeySql();
  const activeRows = await boardScalar(env, `SELECT COUNT(*) FROM mlb_stats WHERE ${activeWhere}`, activeBinds);
  const singleRows = await boardScalar(env, `SELECT COUNT(*) FROM mlb_stats WHERE ${activeWhere} AND ${singleWhere}`, activeBinds);
  const comboRows = await boardScalar(env, `SELECT COUNT(*) FROM mlb_stats WHERE ${activeWhere} AND ${comboWhere}`, activeBinds);
  const uniquePlayers = await boardScalar(env, `SELECT COUNT(*) FROM (SELECT player_name, team FROM mlb_stats WHERE ${activeWhere} AND ${singleWhere} GROUP BY player_name, team)`, activeBinds);
  const rawUniqueGames = await boardScalar(env, `SELECT COUNT(*) FROM (SELECT team, opponent, start_time FROM mlb_stats WHERE ${activeWhere} GROUP BY team, opponent, start_time)`, activeBinds);
  const normalizedUniqueGames = await boardScalar(env, `SELECT COUNT(*) FROM (SELECT ${gameKeySql} AS game_key, start_time FROM mlb_stats WHERE ${activeWhere} AND ${singleWhere} GROUP BY game_key, start_time)`, activeBinds);
  const uniqueTeams = await boardScalar(env, `SELECT COUNT(*) FROM (SELECT team FROM mlb_stats WHERE ${activeWhere} AND ${singleWhere} GROUP BY team)`, activeBinds);
  const statTypeDistribution = await boardRows(env, `SELECT stat_type, COUNT(*) AS rows_count FROM mlb_stats WHERE ${activeWhere} GROUP BY stat_type ORDER BY rows_count DESC, stat_type LIMIT 30`, activeBinds);
  const oddsTypeDistribution = await boardRows(env, `SELECT odds_type, COUNT(*) AS rows_count FROM mlb_stats WHERE ${activeWhere} GROUP BY odds_type ORDER BY rows_count DESC, odds_type LIMIT 20`, activeBinds);
  const rowClassification = await boardRows(env, `SELECT classification, COUNT(*) AS rows_count FROM (
    SELECT CASE WHEN ${singleWhere} THEN 'single_player_supported' ELSE 'combo_or_unsupported_deferred' END AS classification
    FROM mlb_stats WHERE ${activeWhere}
  ) GROUP BY classification ORDER BY rows_count DESC`, activeBinds);
  const promptQueueEstimate = await boardRows(env, `SELECT 'A_PLAYER_ROLE_RECENT_MATCHUP' AS prompt_group, CAST((COUNT(*) + 3) / 4 AS INTEGER) AS estimated_requests, COUNT(*) AS unique_units FROM (SELECT player_name, team FROM mlb_stats WHERE ${activeWhere} AND ${singleWhere} GROUP BY player_name, team)
    UNION ALL SELECT 'D_ADVANCED_PLAYER_FORM_CONTACT', CAST((COUNT(*) + 3) / 4 AS INTEGER), COUNT(*) FROM (SELECT player_name, team FROM mlb_stats WHERE ${activeWhere} AND ${singleWhere} GROUP BY player_name, team)
    UNION ALL SELECT 'B_GAME_TEAM_BULLPEN_ENVIRONMENT', COUNT(*), COUNT(*) FROM (SELECT ${gameKeySql} AS game_key, start_time FROM mlb_stats WHERE ${activeWhere} AND ${singleWhere} GROUP BY game_key, start_time)
    UNION ALL SELECT 'WEATHER_GAME_LEVEL', COUNT(*), COUNT(*) FROM (SELECT ${gameKeySql} AS game_key, start_time FROM mlb_stats WHERE ${activeWhere} AND ${singleWhere} GROUP BY game_key, start_time)
    UNION ALL SELECT 'NEWS_INJURY_GAME_LEVEL', COUNT(*), COUNT(*) FROM (SELECT ${gameKeySql} AS game_key, start_time FROM mlb_stats WHERE ${activeWhere} AND ${singleWhere} GROUP BY game_key, start_time)
    UNION ALL SELECT 'MARKET_GAME_PROP_FAMILY_LEVEL', COUNT(*), COUNT(*) FROM (SELECT ${gameKeySql} AS game_key, start_time, stat_type FROM mlb_stats WHERE ${activeWhere} AND ${singleWhere} GROUP BY game_key, start_time, stat_type)`, activeBinds);
  const sampleRows = await boardRows(env, `SELECT line_id, player_name, team, opponent, stat_type, line_score, odds_type, is_promo, start_time, updated_at, CASE WHEN ${singleWhere} THEN 'single_player_supported' ELSE 'combo_or_unsupported_deferred' END AS classification FROM mlb_stats WHERE ${activeWhere} ORDER BY updated_at DESC, start_time ASC, player_name ASC LIMIT ?`, [...activeBinds, sampleLimit]);
  const neededPlayersRows = await boardRows(env, `SELECT player_name, team, MIN(start_time) AS first_start_time, COUNT(*) AS leg_rows FROM mlb_stats WHERE ${activeWhere} AND ${singleWhere} GROUP BY player_name, team ORDER BY leg_rows DESC, player_name LIMIT 25`, activeBinds);
  const neededGamesRows = await boardRows(env, `SELECT ${gameKeySql} AS game_key, MIN(CASE WHEN UPPER(TRIM(team)) < UPPER(TRIM(opponent)) THEN UPPER(TRIM(team)) ELSE UPPER(TRIM(opponent)) END) AS team_a, MIN(CASE WHEN UPPER(TRIM(team)) < UPPER(TRIM(opponent)) THEN UPPER(TRIM(opponent)) ELSE UPPER(TRIM(team)) END) AS team_b, MIN(start_time) AS start_time, COUNT(*) AS leg_rows FROM mlb_stats WHERE ${activeWhere} AND ${singleWhere} GROUP BY game_key, start_time ORDER BY start_time ASC, leg_rows DESC LIMIT 25`, activeBinds);
  const deferredComboRows = await boardRows(env, `SELECT line_id, player_name, team, opponent, stat_type, line_score, odds_type, start_time, CASE WHEN COALESCE(player_name,'') LIKE '%+%' THEN 'combo_player_line' WHEN COALESCE(team,'') LIKE '%/%' OR COALESCE(opponent,'') LIKE '%/%' THEN 'combo_team_game_line' WHEN UPPER(TRIM(team)) = UPPER(TRIM(opponent)) THEN 'team_equals_opponent_review' ELSE 'unsupported_or_incomplete' END AS deferred_reason FROM mlb_stats WHERE ${activeWhere} AND ${comboWhere} ORDER BY start_time ASC, player_name ASC LIMIT 25`, activeBinds);

  const dryRunJobs = [];
  for (const row of neededPlayersRows.rows.slice(0, sampleLimit)) {
    dryRunJobs.push({
      job_type: "player_factor_A_D_preview",
      player_name: row.player_name,
      team: row.team,
      first_start_time: row.first_start_time,
      leg_rows: row.leg_rows,
      cache_key_preview: `${slateDate}|${boardSlug(row.team)}|${boardSlug(row.player_name)}|A_D`
    });
  }
  for (const row of neededGamesRows.rows.slice(0, sampleLimit)) {
    dryRunJobs.push({
      job_type: "game_factor_B_weather_news_market_preview",
      game_key: row.game_key,
      team_a: row.team_a,
      team_b: row.team_b,
      start_time: row.start_time,
      leg_rows: row.leg_rows,
      game_key_preview: `${String(row.start_time || "").slice(0, 10)}_${row.game_key}`
    });
  }

  const warnings = [];
  if (activeMode === "fallback_all_rows_no_slate_match") warnings.push(`No mlb_stats rows matched slate_date ${slateDate} by start_time prefix; preview used all rows.`);
  if (Number(totalRows.value || 0) === 0) warnings.push("mlb_stats table is empty.");

  return {
    ok: true,
    job: "board_sifter_preview",
    version: SYSTEM_VERSION,
    status: warnings.length ? "review" : "pass",
    slate_date: slateDate,
    active_mode: activeMode,
    table: "mlb_stats",
    counts: {
      total_rows: totalRows.value,
      slate_rows_by_start_time: slateRows.value,
      active_rows_used: activeRows.value,
      single_player_supported_rows: singleRows.value,
      combo_or_unsupported_deferred_rows: comboRows.value,
      unique_supported_players: uniquePlayers.value,
      raw_unique_team_game_rows: rawUniqueGames.value,
      normalized_unique_supported_games: normalizedUniqueGames.value,
      unique_supported_teams: uniqueTeams.value
    },
    latest_sync: latestRow.rows[0] || null,
    stat_type_distribution: statTypeDistribution.rows,
    odds_type_distribution: oddsTypeDistribution.rows,
    row_classification: rowClassification.rows,
    prompt_queue_estimate: promptQueueEstimate.rows,
    sample_legs: sampleRows.rows,
    needed_players_preview: neededPlayersRows.rows,
    needed_games_preview: neededGamesRows.rows,
    deferred_combo_or_unsupported_preview: deferredComboRows.rows,
    dry_run_jobs_preview: dryRunJobs,
    warnings,
    note: "Read-only Board Harvester preview. Combo lines and combo game rows are intentionally deferred. No Gemini calls. No new tables. No writes."
  };
}

async function ensureBoardFactorQueueTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS board_factor_queue (
      queue_id TEXT PRIMARY KEY,
      slate_date TEXT NOT NULL,
      queue_type TEXT NOT NULL,
      scope_type TEXT NOT NULL,
      scope_key TEXT NOT NULL,
      batch_index INTEGER DEFAULT 0,
      player_count INTEGER DEFAULT 0,
      game_count INTEGER DEFAULT 0,
      source_rows INTEGER DEFAULT 0,
      player_names TEXT,
      team_id TEXT,
      game_key TEXT,
      team_a TEXT,
      team_b TEXT,
      start_time TEXT,
      status TEXT DEFAULT 'PENDING',
      attempt_count INTEGER DEFAULT 0,
      retry_count INTEGER DEFAULT 0,
      last_error TEXT,
      payload_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_processed_at TEXT
    )
  `).run();
  await safeEnsureColumn(env, 'board_factor_queue', 'status', "TEXT DEFAULT 'PENDING'");
  await safeEnsureColumn(env, 'board_factor_queue', 'attempt_count', 'INTEGER DEFAULT 0');
  await safeEnsureColumn(env, 'board_factor_queue', 'retry_count', 'INTEGER DEFAULT 0');
  await safeEnsureColumn(env, 'board_factor_queue', 'last_error', 'TEXT');
  await safeEnsureColumn(env, 'board_factor_queue', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
  await safeEnsureColumn(env, 'board_factor_queue', 'last_processed_at', 'TEXT');
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_board_factor_queue_slate_type_status ON board_factor_queue (slate_date, queue_type, status)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_board_factor_queue_scope ON board_factor_queue (scope_type, scope_key)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_board_factor_queue_state_pick ON board_factor_queue (slate_date, status, attempt_count, updated_at)`).run();
  return { ok: true, table: "board_factor_queue" };
}

async function ensureBoardFactorResultsTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS board_factor_results (
      result_id TEXT PRIMARY KEY,
      queue_id TEXT NOT NULL,
      slate_date TEXT NOT NULL,
      queue_type TEXT NOT NULL,
      scope_type TEXT NOT NULL,
      scope_key TEXT NOT NULL,
      batch_index INTEGER DEFAULT 0,
      status TEXT DEFAULT 'COMPLETED',
      model TEXT,
      factor_count INTEGER DEFAULT 0,
      min_score INTEGER,
      max_score INTEGER,
      avg_score REAL,
      raw_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_board_factor_results_slate_type ON board_factor_results (slate_date, queue_type)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_board_factor_results_queue ON board_factor_results (queue_id)`).run();
  return { ok: true, table: "board_factor_results" };
}

function isBoardQueuePayloadEnriched(payload, queueType) {
  if (!payload || typeof payload !== "object") return false;
  if (String(queueType || "").startsWith("PLAYER_")) {
    return Array.isArray(payload.enriched_player_contexts) && payload.enriched_player_contexts.length > 0;
  }
  if (String(queueType || "").startsWith("GAME_")) {
    return !!payload.enriched_game_context;
  }
  return Array.isArray(payload.enriched_player_contexts) || !!payload.enriched_game_context;
}

function parseStoredBoardPayload(payloadJson) {
  try { return JSON.parse(String(payloadJson || "{}")); } catch (_) { return {}; }
}

async function buildFreshPayloadForQueueRow(env, queueRow) {
  const slateDate = String(queueRow.slate_date || resolveSlateDate({}).slate_date);
  const queueType = String(queueRow.queue_type || "");
  const stored = parseStoredBoardPayload(queueRow.payload_json);

  if (queueType.startsWith("PLAYER_")) {
    let players = Array.isArray(stored.players) ? stored.players : [];
    if (!players.length && queueRow.player_names) {
      players = String(queueRow.player_names).split("|").map(name => ({
        player_name: String(name || "").trim(),
        team: String(queueRow.team_id || "").trim(),
        first_start_time: queueRow.start_time,
        leg_rows: 0
      })).filter(p => p.player_name);
    }
    const chunk = players.map(p => ({
      player_name: String(p.player_name || "").trim(),
      team: normTeam(firstNonEmpty(p.team, queueRow.team_id)),
      first_start_time: firstNonEmpty(p.first_start_time, p.start_time, queueRow.start_time),
      leg_rows: Number(p.leg_rows || 0),
      opponent_sample: p.opponent_sample || ""
    })).filter(p => p.player_name);
    return await enrichBoardQueuePlayerPayload(env, slateDate, queueType, Number(stored.batch_size || queueRow.player_count || chunk.length || 4), chunk);
  }

  if (queueType.startsWith("GAME_")) {
    const gameRow = stored.game || {
      game_key: queueRow.game_key,
      team_a: queueRow.team_a,
      team_b: queueRow.team_b,
      start_time: queueRow.start_time,
      leg_rows: queueRow.source_rows
    };
    return await enrichBoardQueueGamePayload(env, slateDate, queueType, gameRow);
  }

  return stored;
}

async function injectFreshPayloadIntoQueueRow(env, queueRow) {
  const freshPayload = await buildFreshPayloadForQueueRow(env, queueRow);
  const freshJson = JSON.stringify(freshPayload);
  await env.DB.prepare(`UPDATE board_factor_queue SET payload_json = ?, updated_at = CURRENT_TIMESTAMP WHERE queue_id = ?`).bind(freshJson, queueRow.queue_id).run();
  return { ...queueRow, payload_json: freshJson };
}

async function hydrateQueueRowPayloadIfNeeded(env, queueRow) {
  const stored = parseStoredBoardPayload(queueRow.payload_json);
  if (isBoardQueuePayloadEnriched(stored, queueRow.queue_type)) return queueRow;
  return await injectFreshPayloadIntoQueueRow(env, queueRow);
}

async function inspectPayloadForQueueRow(env, row) {
  const rawText = String(row.payload_json || "{}");
  const parsed = safeParseJsonText(rawText);
  let payload = parsed.ok ? parsed.value : null;
  let displayPayload = payload;
  let enrichment_preview_used = false;
  let enrichment_preview_error = null;

  if (parsed.ok && !isBoardQueuePayloadEnriched(payload, row.queue_type)) {
    try {
      displayPayload = await buildFreshPayloadForQueueRow(env, row);
      enrichment_preview_used = true;
    } catch (err) {
      enrichment_preview_error = String(err?.message || err);
    }
  }

  return { rawText, parsed, payload: displayPayload || payload || {}, enrichment_preview_used, enrichment_preview_error };
}

function boardPromptDefinitionForQueueType(queueType) {
  const qt = String(queueType || "");
  if (qt === "PLAYER_A_ROLE_RECENT_MATCHUP") return { prompt_id: "GEMINI_A_PLAYER_ROLE_RECENT_MATCHUP_V2", family: "Player Role Recent Matchup", target_type: "PLAYER", factor_ids: [["A01","Player identity confirmed"],["A02","Lineup slot quality"],["A03","Role stability"],["A04","Recent hit trend last 5"],["A05","Recent plate appearance volume"],["A06","Season hit profile"],["A07","Handedness matchup"],["A08","Opposing starter contact allowance"],["A09","Strikeout pressure risk"],["A10","Walk/on-base support"]] };
  if (qt === "PLAYER_D_ADVANCED_FORM_CONTACT") return { prompt_id: "GEMINI_D_ADVANCED_PLAYER_FORM_CONTACT_V1", family: "Advanced Player Form Contact", target_type: "PLAYER", factor_ids: [["D01","Last 5 hit efficiency"],["D02","Last 3 hit pressure"],["D03","Season batting average stability"],["D04","Season on-base support"],["D05","Season slug/contact damage"],["D06","Hits per game baseline"],["D07","Strikeout drag"],["D08","Recent total-base contact"],["D09","Walk displacement risk"],["D10","Current form vs season baseline"]] };
  if (qt === "GAME_B_TEAM_BULLPEN_ENVIRONMENT") return { prompt_id: "GEMINI_B_GAME_TEAM_BULLPEN_ENVIRONMENT_V1", family: "Game Team Bullpen Environment", target_type: "GAME", factor_ids: [["B01","Game context available"],["B02","Team lineup depth around player"],["B03","Team recent run environment"],["B04","Team recent hit volume"],["B05","Opposing starter run prevention"],["B06","Opposing starter baserunner allowance"],["B07","Opposing starter hit allowance"],["B08","Opposing starter HR/contact damage"],["B09","Opponent bullpen fatigue"],["B10","Opponent bullpen recent workload"],["B11","Park run factor"],["B12","Park HR/contact factor"]] };
  if (qt === "GAME_WEATHER_CONTEXT" || qt === "GAME_NEWS_INJURY_CONTEXT") return { prompt_id: "GEMINI_E_NEWS_INJURY_WEATHER_INTEGRITY_V2", family: qt === "GAME_WEATHER_CONTEXT" ? "Weather Integrity Raw Context" : "News Injury Integrity Raw Context", target_type: "GAME", factor_ids: [["E01","Player injury/news risk"],["E02","Lineup confirmation safety"],["E03","Late scratch risk"],["E04","Team news disruption"],["E05","Weather availability"],["E06","Weather risk"],["E07","Wind risk"],["E08","Precipitation risk"],["E09","Game-state integrity"],["E10","Final integrity readiness"]] };
  return { prompt_id: "GEMINI_RAW_FACTOR_CONTEXT_V1", family: "Raw Factor Context", target_type: "UNKNOWN", factor_ids: [] };
}

function buildCompactBoardPayloadForGemini(queueRow) {
  const payload = (() => { try { return JSON.parse(queueRow.payload_json || "{}"); } catch (_) { return {}; } })();
  const players = Array.isArray(payload.enriched_player_contexts) ? payload.enriched_player_contexts : (Array.isArray(payload.players) ? payload.players : []);
  const compactPlayers = players.slice(0, 4).map(p => {
    const profile = p.player_profile || {};
    const usage = p.recent_usage || {};
    const starter = p.opposing_starter || {};
    const bullpen = p.opposing_bullpen_context || {};
    const props = Array.isArray(p.board_props) ? p.board_props : [];
    return {
      player_key: p.player_key || `${p.player_name || ""} ${p.team || ""}`.trim(),
      player_name: p.player_name,
      team: p.team,
      opponent: p.opponent,
      game_id: p.game_id,
      start_time: p.start_time,
      role: profile.role || null,
      bats: profile.bats || null,
      throws: profile.throws || null,
      position: profile.position || null,
      season: {
        games: profile.games ?? null,
        ab: profile.ab ?? null,
        hits: profile.hits ?? null,
        avg: profile.avg ?? null,
        obp: profile.obp ?? null,
        slg: profile.slg ?? null,
        strikeouts: profile.strikeouts ?? null,
        walks: profile.walks ?? null,
        era: profile.era ?? null,
        whip: profile.whip ?? null,
        innings_pitched: profile.innings_pitched ?? null,
        k_per_9: profile.k_per_9 ?? null
      },
      recent_usage: usage ? {
        last_game_ab: usage.last_game_ab ?? null,
        last_game_hits: usage.last_game_hits ?? null,
        lineup_slot: usage.lineup_slot ?? null,
        last_pitch_count: usage.last_pitch_count ?? null,
        last_innings: usage.last_innings ?? null,
        days_rest: usage.days_rest ?? null
      } : null,
      opposing_starter: starter ? {
        starter_name: starter.starter_name ?? null,
        throws: starter.throws ?? null,
        era: starter.era ?? null,
        whip: starter.whip ?? null,
        strikeouts: starter.strikeouts ?? null,
        innings_pitched: starter.innings_pitched ?? null,
        walks: starter.walks ?? null,
        hits_allowed: starter.hits_allowed ?? null,
        hr_allowed: starter.hr_allowed ?? null
      } : null,
      opposing_bullpen_context: bullpen ? {
        fatigue: bullpen.fatigue ?? null,
        last_game_ip: bullpen.last_game_ip ?? null,
        last3_ip: bullpen.last3_ip ?? null,
        bullpen_era: bullpen.bullpen_era ?? null,
        bullpen_whip: bullpen.bullpen_whip ?? null
      } : null,
      board_stat_type_counts: p.board_stat_type_counts || {},
      board_props_compact: props.slice(0, 28).map(x => ({ stat_type: x.stat_type, line_score: x.line_score, odds_type: x.odds_type, is_promo: x.is_promo }))
    };
  });
  const gamePayload = payload.enriched_game_context || payload.game || payload.game_context || null;
  return {
    queue_id: queueRow.queue_id,
    slate_date: queueRow.slate_date,
    queue_type: queueRow.queue_type,
    scope_type: queueRow.scope_type,
    scope_key: queueRow.scope_key,
    batch_index: queueRow.batch_index,
    player_count: queueRow.player_count,
    game_count: queueRow.game_count,
    player_names: queueRow.player_names,
    game_key: queueRow.game_key,
    team_a: queueRow.team_a,
    team_b: queueRow.team_b,
    start_time: queueRow.start_time,
    payload_quality: payload.payload_quality || null,
    players: compactPlayers,
    game: gamePayload
  };
}

function compactCell(value, max = 220) {
  if (value === undefined || value === null || value === "") return "NULL";
  let text = typeof value === "string" ? value : JSON.stringify(value);
  text = String(text || "").replace(/[|\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max) : text;
}

function compactEvidenceText(value, max = 360) {
  if (value === undefined || value === null || value === "") return "NULL";
  if (typeof value === "object") return compactCell(value, max);
  return compactCell(value, max);
}

function compactBoardPayloadTextForGemini(queueRow, payload, def) {
  const rows = [];
  rows.push(["Q", queueRow.queue_id, queueRow.slate_date, queueRow.queue_type, queueRow.scope_type, queueRow.scope_key, queueRow.batch_index].map(x => compactCell(x)).join("|"));
  rows.push(["F", ...(def.factor_ids || []).map(f => `${f[0]}:${String(f[1] || "").replace(/[|;]+/g, ",")}`)].map(x => compactCell(x, 120)).join("|"));
  const players = Array.isArray(payload.players) ? payload.players : [];
  for (let i = 0; i < players.length; i++) {
    const p = players[i] || {};
    const prof = p.profile || {};
    const season = p.season || {};
    const usage = p.recent_usage || {};
    const sp = p.opposing_starter || {};
    const bp = p.opposing_bullpen_context || {};
    rows.push([
      "P", i + 1,
      p.player_name, p.team, p.opponent || p.opponent_sample, p.start_time || p.first_start_time,
      prof.position || p.position, prof.bats || p.bats, prof.throws || p.throws, season.games ?? prof.games,
      season.ab ?? prof.ab, season.hits ?? prof.hits, season.avg ?? prof.avg, season.obp ?? prof.obp, season.slg ?? prof.slg, season.strikeouts ?? prof.strikeouts, season.walks ?? prof.walks,
      usage.last_game_ab, usage.last_game_hits, usage.lineup_slot,
      sp.starter_name, sp.throws, sp.era, sp.whip, sp.strikeouts, sp.walks, sp.hits_allowed, sp.hr_allowed,
      bp.fatigue, bp.bullpen_era, bp.bullpen_whip,
      compactEvidenceText(p.board_stat_type_counts, 220)
    ].map(x => compactCell(x, 120)).join("|"));
  }
  if (payload.game) {
    const g = payload.game || {};
    rows.push(["G", queueRow.game_key, queueRow.team_a, queueRow.team_b, queueRow.start_time, compactEvidenceText(g, 900)].map(x => compactCell(x, 900)).join("|"));
  }
  return rows.join("\n");
}

function boardFactorPromptForQueueRow(queueRow, retryMode = false, validationError = "") {
  const payload = buildCompactBoardPayloadForGemini(queueRow);
  const def = boardPromptDefinitionForQueueType(queueRow.queue_type);
  const compactPayload = compactBoardPayloadTextForGemini(queueRow, payload, def);
  const retryText = retryMode ? `\nRETRY:${compactCell(validationError, 420)}\n` : "";
  return `AlphaDog raw factor miner. Compact mode. No JSON. No markdown. No labels in returned rows.${retryText}
RULES
- Mine all inflow. Do not skip data. Missing is allowed.
- Use supplied compact payload only. Do not invent MLB, lineup, weather, injury, news, starter, or roster facts.
- No prop scoring. No picks. No recommendations. No probabilities.
- Return pipe-delimited rows only.
- One row per target per locked factor id.
- Exact output row shape:
R|TARGET_KEY|TARGET_TYPE|FACTOR_ID|SOURCE_TYPE|AVAILABILITY|RAW_DATA|NOTE|MISSING
- SOURCE_TYPE only SYSTEM_DATA, GEMINI_EXTRACTED, or MISSING.
- AVAILABILITY only AVAILABLE, PARTIAL, or MISSING.
- RAW_DATA must be short, primitive, and compact. Use comma lists, never JSON.
- If unavailable: RAW_DATA=NULL, SOURCE_TYPE=MISSING, AVAILABILITY=MISSING, MISSING=short missing field list.
- Preserve target names/teams from input. Do not roster-correct.

META
${compactCell(def.prompt_id)}|${compactCell(def.family)}|${compactCell(def.target_type)}|${compactCell(queueRow.queue_id)}|${compactCell(queueRow.queue_type)}|${compactCell(queueRow.scope_type)}|${compactCell(queueRow.slate_date)}

PAYLOAD
${compactPayload}

RETURN ONLY R ROWS.`;
}

function parseCompactBoardGeminiOutput(raw, queueRow, compactPayload) {
  const def = boardPromptDefinitionForQueueType(queueRow.queue_type);
  const factorName = new Map((def.factor_ids || []).map(x => [String(x[0]), String(x[1] || x[0])]));
  const lines = String(raw || "").replace(/```/g, "").split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const itemMap = new Map();
  for (const line of lines) {
    if (!line.startsWith("R|")) continue;
    const parts = line.split("|");
    if (parts.length < 9) continue;
    const targetKey = parts[1].trim();
    const targetType = parts[2].trim() || def.target_type;
    const factorId = parts[3].trim();
    const sourceType = parts[4].trim();
    const availability = parts[5].trim();
    const rawData = parts[6].trim();
    const note = parts[7].trim();
    const missingText = parts.slice(8).join("|").trim();
    if (!targetKey || !factorId) continue;
    if (!itemMap.has(targetKey)) {
      itemMap.set(targetKey, { target_key: targetKey, target_type: targetType, raw_factors: [], missing_data: [], warnings: [] });
    }
    const missing = missingText && missingText !== "NULL" ? missingText.split(",").map(x => x.trim()).filter(Boolean) : [];
    const row = {
      factor_id: factorId,
      factor_name: factorName.get(factorId) || factorId,
      source_type: /^(SYSTEM_DATA|GEMINI_EXTRACTED|MISSING)$/.test(sourceType) ? sourceType : "MISSING",
      availability: /^(AVAILABLE|PARTIAL|MISSING)$/.test(availability) ? availability : "MISSING",
      raw_data: rawData && rawData !== "NULL" ? { compact: rawData } : {},
      note: note && note !== "NULL" ? note : "",
      missing_data: missing
    };
    itemMap.get(targetKey).raw_factors.push(row);
    if (missing.length) itemMap.get(targetKey).missing_data.push(...missing);
  }
  const items = Array.from(itemMap.values());
  return {
    ok: true,
    raw_mode: true,
    compact_mode: true,
    prompt_id: def.prompt_id,
    queue_id: String(queueRow.queue_id || ""),
    queue_type: String(queueRow.queue_type || ""),
    scope_type: String(queueRow.scope_type || ""),
    slate_date: String(queueRow.slate_date || ""),
    factor_family: def.family,
    items,
    summary: {
      raw_mode: true,
      compact_mode: true,
      item_count: items.length,
      factor_family: def.family,
      missing_data: [],
      warnings: [],
      ready_for_system_json: true
    }
  };
}

function factorRowsFromRawPayload(parsed) {
  if (!parsed || typeof parsed !== "object") return [];
  if (Array.isArray(parsed.results)) return parsed.results;
  if (Array.isArray(parsed.factors)) return parsed.factors;
  if (Array.isArray(parsed.raw_factors)) return parsed.raw_factors;
  if (Array.isArray(parsed.items)) {
    const out = [];
    for (const item of parsed.items) {
      const target = item?.target_key || item?.game_key || item?.player_key || null;
      const rows = Array.isArray(item?.raw_factors) ? item.raw_factors : (Array.isArray(item?.factors) ? item.factors : []);
      for (const row of rows) out.push({ target_key: target, ...row });
    }
    return out;
  }
  return [];
}

function summarizeRawFactorPayload(parsed) {
  const rows = factorRowsFromRawPayload(parsed);
  const items = Array.isArray(parsed?.items) ? parsed.items : [];
  return { factor_count: rows.length, item_count: items.length, min_score: null, max_score: null, avg_score: null };
}


function expectedTargetCountForQueuePayload(queueRow, parsedPayload) {
  const payload = parsedPayload || buildCompactBoardPayloadForGemini(queueRow);
  if (String(queueRow.scope_type || "").includes("PLAYER") || String(queueRow.queue_type || "").startsWith("PLAYER_")) {
    const players = Array.isArray(payload.players) ? payload.players : [];
    return Math.max(1, players.length || Number(queueRow.player_count || 0) || 1);
  }
  return 1;
}

function findForbiddenScoringKeys(value, path = "root", out = []) {
  if (!value || typeof value !== "object") return out;
  const forbidden = new Set(["score_0_100", "signal", "confidence_0_100", "final_score", "hit_probability", "avg_score", "min_score", "max_score", "green_count", "yellow_count", "red_count"]);
  if (Array.isArray(value)) {
    value.forEach((v, i) => findForbiddenScoringKeys(v, `${path}[${i}]`, out));
    return out;
  }
  for (const [k, v] of Object.entries(value)) {
    if (forbidden.has(k)) out.push(`${path}.${k}`);
    findForbiddenScoringKeys(v, `${path}.${k}`, out);
  }
  return out;
}

function validateRawGeminiPayload(parsed, queueRow, compactPayload) {
  if (!parsed || typeof parsed !== "object") return { ok: false, error: "parsed payload is not an object" };
  if (parsed.ok !== true) return { ok: false, error: "missing ok=true" };
  if (parsed.raw_mode !== true) return { ok: false, error: "missing raw_mode=true" };
  if (String(parsed.queue_id || "") !== String(queueRow.queue_id || "")) return { ok: false, error: "queue_id mismatch" };
  if (String(parsed.queue_type || "") !== String(queueRow.queue_type || "")) return { ok: false, error: "queue_type mismatch" };
  if (!Array.isArray(parsed.items)) return { ok: false, error: "items array missing" };
  const expected = expectedTargetCountForQueuePayload(queueRow, compactPayload);
  if (parsed.items.length !== expected) return { ok: false, error: `items count mismatch expected ${expected} got ${parsed.items.length}` };
  const scoringKeys = findForbiddenScoringKeys(parsed);
  if (scoringKeys.length) return { ok: false, error: `scoring keys are forbidden in raw mode: ${scoringKeys.slice(0, 5).join(", ")}` };
  const def = boardPromptDefinitionForQueueType(queueRow.queue_type);
  const lockedIds = new Set((def.factor_ids || []).map(x => x[0]));
  for (const item of parsed.items) {
    if (!item || typeof item !== "object") return { ok: false, error: "item is not an object" };
    if (!item.target_key) return { ok: false, error: "item target_key missing" };
    if (!Array.isArray(item.raw_factors)) return { ok: false, error: `raw_factors missing for ${item.target_key}` };
    if (item.raw_factors.length < Math.min(3, lockedIds.size || 3)) return { ok: false, error: `too few raw_factors for ${item.target_key}` };
    for (const f of item.raw_factors) {
      if (!f || typeof f !== "object") return { ok: false, error: `raw factor invalid for ${item.target_key}` };
      if (!f.factor_id) return { ok: false, error: `factor_id missing for ${item.target_key}` };
      if (lockedIds.size && !lockedIds.has(String(f.factor_id))) return { ok: false, error: `unknown factor_id ${f.factor_id}` };
      if (!/^(AVAILABLE|PARTIAL|MISSING)$/.test(String(f.availability || ""))) return { ok: false, error: `invalid availability for ${f.factor_id}` };
      if (!/^(SYSTEM_DATA|GEMINI_EXTRACTED|MISSING)$/.test(String(f.source_type || ""))) return { ok: false, error: `invalid source_type for ${f.factor_id}` };
      if (f.raw_data === undefined) return { ok: false, error: `raw_data missing for ${f.factor_id}` };
    }
  }
  return { ok: true, error: null };
}

function backendCompactValue(value) {
  if (value === undefined || value === null || value === "") return "NULL";
  return compactCell(value, 220);
}

function backendRawFactor(factorId, factorName, valueParts, missing = []) {
  const cleanParts = (Array.isArray(valueParts) ? valueParts : [valueParts]).map(x => backendCompactValue(x)).filter(x => x && x !== "NULL");
  const missingList = (Array.isArray(missing) ? missing : [missing]).map(x => String(x || "").trim()).filter(Boolean);
  const availability = cleanParts.length && !missingList.length ? "AVAILABLE" : cleanParts.length ? "PARTIAL" : "MISSING";
  return {
    factor_id: factorId,
    factor_name: factorName || factorId,
    source_type: availability === "MISSING" ? "MISSING" : "SYSTEM_DATA",
    availability,
    raw_data: cleanParts.length ? { compact: cleanParts.join(",") } : {},
    note: availability === "MISSING" ? "backend_prefill_missing" : "backend_prefill_from_d1_board_payload",
    missing_data: missingList
  };
}

function backendPlayerFactorRows(queueType, player, factorName) {
  const p = player || {};
  const season = p.season || {};
  const usage = p.recent_usage || {};
  const sp = p.opposing_starter || {};
  const team = p.team || null;
  const name = p.player_name || p.player_key || null;
  const role = p.role || null;
  const pos = p.position || null;
  const bats = p.bats || null;
  const avg = season.avg ?? null;
  const obp = season.obp ?? null;
  const slg = season.slg ?? null;
  const ab = season.ab ?? null;
  const hits = season.hits ?? null;
  const k = season.strikeouts ?? null;
  const bb = season.walks ?? null;
  const lgab = usage.last_game_ab ?? null;
  const lgh = usage.last_game_hits ?? null;
  const slot = usage.lineup_slot ?? null;
  const spHand = sp.throws ?? null;
  const spName = sp.starter_name ?? null;
  const rows = [];
  if (queueType === "PLAYER_A_ROLE_RECENT_MATCHUP") {
    rows.push(backendRawFactor("A01", factorName.get("A01"), [name, team, p.game_id], (!name || !team) ? ["identity_or_team"] : []));
    rows.push(backendRawFactor("A02", factorName.get("A02"), [slot ? `slot=${slot}` : null], slot ? [] : ["lineup_slot"]));
    rows.push(backendRawFactor("A03", factorName.get("A03"), [role, pos, season.games != null ? `games=${season.games}` : null], (!role && !pos) ? ["role_position"] : []));
    rows.push(backendRawFactor("A04", factorName.get("A04"), [lgab != null && lgh != null ? `last_game=${lgh}/${lgab}` : null], (lgab == null || lgh == null) ? ["last_game_ab_hits"] : []));
    rows.push(backendRawFactor("A05", factorName.get("A05"), [lgab != null ? `last_game_ab=${lgab}` : null, ab != null ? `season_ab=${ab}` : null], (lgab == null && ab == null) ? ["plate_appearance_volume"] : []));
    rows.push(backendRawFactor("A06", factorName.get("A06"), [avg != null ? `avg=${avg}` : null, obp != null ? `obp=${obp}` : null, slg != null ? `slg=${slg}` : null, hits != null && ab != null ? `hits_ab=${hits}/${ab}` : null], (avg == null && hits == null) ? ["season_hit_profile"] : []));
    rows.push(backendRawFactor("A07", factorName.get("A07"), [bats ? `bats=${bats}` : null, spHand ? `opp_sp_hand=${spHand}` : null], (!bats || !spHand) ? [!bats ? "bats" : "", !spHand ? "opposing_starter_hand" : ""] : []));
    rows.push(backendRawFactor("A08", factorName.get("A08"), [spName, sp.era != null ? `era=${sp.era}` : null, sp.whip != null ? `whip=${sp.whip}` : null, sp.hits_allowed != null ? `h_allowed=${sp.hits_allowed}` : null], (!spName && sp.era == null && sp.whip == null) ? ["opposing_starter_profile"] : []));
    rows.push(backendRawFactor("A09", factorName.get("A09"), [k != null && ab != null ? `k_ab=${k}/${ab}` : null, sp.strikeouts != null ? `sp_k=${sp.strikeouts}` : null], (k == null && sp.strikeouts == null) ? ["strikeout_pressure"] : []));
    rows.push(backendRawFactor("A10", factorName.get("A10"), [bb != null ? `walks=${bb}` : null, obp != null ? `obp=${obp}` : null], (bb == null && obp == null) ? ["walk_obp_support"] : []));
  } else if (queueType === "PLAYER_D_ADVANCED_FORM_CONTACT") {
    rows.push(backendRawFactor("D01", factorName.get("D01"), [hits != null && ab != null ? `season_hits_ab=${hits}/${ab}` : null, lgab != null && lgh != null ? `last_game=${lgh}/${lgab}` : null], (hits == null && lgh == null) ? ["hit_efficiency"] : []));
    rows.push(backendRawFactor("D02", factorName.get("D02"), [lgab != null && lgh != null ? `last_game=${lgh}/${lgab}` : null], (lgab == null || lgh == null) ? ["last3_detail_not_available_in_payload"] : []));
    rows.push(backendRawFactor("D03", factorName.get("D03"), [avg != null ? `avg=${avg}` : null, ab != null ? `ab=${ab}` : null], avg == null ? ["season_avg"] : []));
    rows.push(backendRawFactor("D04", factorName.get("D04"), [obp != null ? `obp=${obp}` : null, bb != null ? `walks=${bb}` : null], obp == null ? ["season_obp"] : []));
    rows.push(backendRawFactor("D05", factorName.get("D05"), [slg != null ? `slg=${slg}` : null, p.board_stat_type_counts ? `board=${backendCompactValue(p.board_stat_type_counts)}` : null], slg == null ? ["season_slg"] : []));
    rows.push(backendRawFactor("D06", factorName.get("D06"), [hits != null && season.games != null ? `hits_games=${hits}/${season.games}` : null], (hits == null || season.games == null) ? ["hits_per_game"] : []));
    rows.push(backendRawFactor("D07", factorName.get("D07"), [k != null && ab != null ? `k_ab=${k}/${ab}` : null], k == null ? ["strikeouts"] : []));
    rows.push(backendRawFactor("D08", factorName.get("D08"), [slg != null ? `slg=${slg}` : null, lgab != null && lgh != null ? `last_game=${lgh}/${lgab}` : null], (slg == null && lgh == null) ? ["total_base_contact"] : []));
    rows.push(backendRawFactor("D09", factorName.get("D09"), [bb != null && ab != null ? `bb_ab=${bb}/${ab}` : null, obp != null ? `obp=${obp}` : null], bb == null ? ["walk_displacement"] : []));
    rows.push(backendRawFactor("D10", factorName.get("D10"), [avg != null ? `season_avg=${avg}` : null, lgab != null && lgh != null ? `last_game=${lgh}/${lgab}` : null], (avg == null && lgh == null) ? ["current_vs_season"] : []));
  }
  return rows;
}

function buildBackendPrefilledPlayerRawPayload(queueRow, compactPayload) {
  const queueType = String(queueRow.queue_type || "");
  if (!BACKEND_PREFILL_PLAYER_FAMILIES.has(queueType)) return null;
  const players = Array.isArray(compactPayload?.players) ? compactPayload.players : [];
  if (!players.length) return null;
  const def = boardPromptDefinitionForQueueType(queueType);
  const factorName = new Map((def.factor_ids || []).map(x => [String(x[0]), String(x[1] || x[0])]));
  const items = players.map(p => {
    const target = p.player_key || `${p.player_name || ""} ${p.team || ""}`.trim();
    const rawFactors = backendPlayerFactorRows(queueType, p, factorName);
    const missing = [];
    for (const f of rawFactors) for (const m of f.missing_data || []) if (m) missing.push(m);
    return { target_key: target, target_type: "PLAYER", raw_factors: rawFactors, missing_data: Array.from(new Set(missing)), warnings: [] };
  });
  return {
    ok: true,
    raw_mode: true,
    backend_prefill_mode: true,
    prompt_id: `${def.prompt_id}_BACKEND_PREFILL`,
    queue_id: String(queueRow.queue_id || ""),
    queue_type: queueType,
    scope_type: String(queueRow.scope_type || ""),
    slate_date: String(queueRow.slate_date || ""),
    factor_family: def.family,
    items,
    summary: { raw_mode: true, backend_prefill_mode: true, item_count: items.length, factor_family: def.family, missing_data: [], warnings: [], ready_for_system_json: true }
  };
}

async function callGeminiRawWithValidation(env, queueRow) {
  const compactPayload = buildCompactBoardPayloadForGemini(queueRow);
  const backendPrefill = buildBackendPrefilledPlayerRawPayload(queueRow, compactPayload);
  if (backendPrefill) {
    const validation = validateRawGeminiPayload(backendPrefill, queueRow, compactPayload);
    if (validation.ok) return { parsed: backendPrefill, attempts: [{ attempt: 1, backend_prefill_mode: true, validation_ok: true, error: null, raw_length: 0 }] };
  }
  const attempts = [];
  let lastError = "";
  for (let i = 0; i < 2; i++) {
    const prompt = boardFactorPromptForQueueRow(queueRow, i > 0, lastError);
    let raw = "";
    try {
      raw = await callGeminiCompactWithFallback(env, prompt);
      const parsed = parseCompactBoardGeminiOutput(raw, queueRow, compactPayload);
      const validation = validateRawGeminiPayload(parsed, queueRow, compactPayload);
      attempts.push({ attempt: i + 1, compact_mode: true, parsed_ok: true, validation_ok: validation.ok, error: validation.error || null, raw_length: String(raw || "").length });
      if (!validation.ok) {
        lastError = validation.error || "validation failed";
        continue;
      }
      return { parsed, attempts };
    } catch (err) {
      lastError = String(err?.message || err).slice(0, 900);
      attempts.push({ attempt: i + 1, compact_mode: true, parsed_ok: false, validation_ok: false, error: lastError, raw_length: String(raw || "").length });
    }
  }
  const err = new Error(`Compact Gemini payload failed validation after retry: ${lastError}`);
  err.validation_attempts = attempts;
  throw err;
}

function isValidRawBoardResultRow(row) {
  if (!row) return false;
  if (String(row.status || "") !== "COMPLETED") return false;
  if (Number(row.factor_count || 0) <= 0) return false;
  const raw = String(row.raw_json || "");
  return raw.includes('"raw_mode":true') && raw.includes('"items"') && raw.includes('"raw_factors"');
}

async function validRawResultForQueue(env, queueId) {
  const row = await env.DB.prepare(`
    SELECT result_id, status, factor_count, raw_json
    FROM board_factor_results
    WHERE queue_id = ? AND status = 'COMPLETED' AND factor_count > 0
    ORDER BY created_at DESC, result_id DESC
    LIMIT 1
  `).bind(queueId).first();
  return isValidRawBoardResultRow(row) ? row : null;
}

function isTransientMiningError(msg) {
  const text = String(msg || "").toLowerCase();
  return [
    "load failed", "fetch", "network", "connection", "timeout", "timed out",
    "too many api requests", "rate limit", "429", "503", "502", "504",
    "temporarily", "overloaded", "deadline", "aborted", "quota"
  ].some(x => text.includes(x));
}

async function repairBoardQueueRawState(env, slateDate, options = {}) {
  await ensureBoardFactorQueueTable(env);
  await ensureBoardFactorResultsTable(env);
  const resetErrors = options.reset_errors === true || options.reset_error_rows === true;

  const completedFromRaw = await env.DB.prepare(`
    UPDATE board_factor_queue
    SET status='COMPLETED', last_error=NULL, updated_at=CURRENT_TIMESTAMP
    WHERE slate_date = ?
      AND queue_id IN (
        SELECT DISTINCT queue_id
        FROM board_factor_results
        WHERE slate_date = ?
          AND status = 'COMPLETED'
          AND factor_count > 0
          AND raw_json LIKE '%"raw_mode":true%'
          AND raw_json LIKE '%"raw_factors"%'
      )
      AND status <> 'COMPLETED'
  `).bind(slateDate, slateDate).run();

  const duplicatePending = await env.DB.prepare(`
    UPDATE board_factor_queue
    SET status='COMPLETED', last_error=NULL, updated_at=CURRENT_TIMESTAMP
    WHERE slate_date = ?
      AND status = 'PENDING'
      AND EXISTS (
        SELECT 1 FROM board_factor_results r
        WHERE r.queue_id = board_factor_queue.queue_id
          AND r.status = 'COMPLETED'
          AND r.factor_count > 0
          AND r.raw_json LIKE '%"raw_mode":true%'
          AND r.raw_json LIKE '%"raw_factors"%'
      )
  `).bind(slateDate).run();

  const staleRunning = await env.DB.prepare(`
    UPDATE board_factor_queue
    SET status='RETRY_LATER', last_error=COALESCE(last_error,'v1.2.73 stale RUNNING queue reset'), updated_at=CURRENT_TIMESTAMP, last_processed_at=CURRENT_TIMESTAMP
    WHERE slate_date = ? AND status = 'RUNNING' AND updated_at < datetime('now', '-10 minutes')
  `).bind(slateDate).run();

  let resetErrorRows = { meta: { changes: 0 } };
  if (resetErrors) {
    resetErrorRows = await env.DB.prepare(`
      UPDATE board_factor_queue
      SET status='RETRY_LATER', attempt_count=0, retry_count=0, last_error=NULL, updated_at=CURRENT_TIMESTAMP
      WHERE slate_date = ?
        AND status = 'ERROR'
        AND NOT EXISTS (
          SELECT 1 FROM board_factor_results r
          WHERE r.queue_id = board_factor_queue.queue_id
            AND r.status = 'COMPLETED'
            AND r.factor_count > 0
            AND r.raw_json LIKE '%"raw_mode":true%'
            AND r.raw_json LIKE '%"raw_factors"%'
        )
    `).bind(slateDate).run();
  }

  const health = await boardRows(env, `
    SELECT queue_type, status, COUNT(*) AS rows_count
    FROM board_factor_queue
    WHERE slate_date = ?
    GROUP BY queue_type, status
    ORDER BY queue_type, status
  `, [slateDate]);

  return {
    ok: true,
    job: "board_queue_repair",
    version: SYSTEM_VERSION,
    status: "pass",
    slate_date: slateDate,
    changes: {
      completed_from_valid_raw_results: Number(completedFromRaw?.meta?.changes || 0),
      duplicate_pending_completed: Number(duplicatePending?.meta?.changes || 0),
      stale_running_returned_to_pending: Number(staleRunning?.meta?.changes || 0),
      error_rows_reset_to_pending: Number(resetErrorRows?.meta?.changes || 0)
    },
    queue_health: health.rows,
    note: "Queue-state repair only. Valid raw results win and protect against duplicate mining. RUNNING rows are returned to PENDING. ERROR rows are reset only when reset_errors=true. No Gemini, no scoring, no ranking."
  };
}

async function runBoardQueueRepair(input, env) {
  const slateDate = String(input.slate_date || resolveSlateDate(input).slate_date);
  return await repairBoardQueueRawState(env, slateDate, input || {});
}

async function runBoardQueueMineOne(input, env) {
  await ensureBoardFactorQueueTable(env);
  await ensureBoardFactorResultsTable(env);
  const slateDate = String(input.slate_date || resolveSlateDate(input).slate_date);
  const preferredType = String(input.queue_type || "").trim();
  await repairBoardQueueRawState(env, slateDate, { reset_errors: false });
  const binds = preferredType ? [slateDate, preferredType, BOARD_QUEUE_RETRY_LIMIT] : [slateDate, BOARD_QUEUE_RETRY_LIMIT];
  const typeWhere = preferredType ? "AND q.queue_type = ?" : "";
  const next = await env.DB.prepare(`
    SELECT q.* FROM board_factor_queue q
    WHERE q.slate_date = ? ${typeWhere}
      AND (
        q.status = 'PENDING'
        OR (
          q.status = 'RETRY_LATER'
          AND q.updated_at < datetime('now', '-' || ((CASE WHEN COALESCE(q.retry_count,0) < 1 THEN 1 ELSE COALESCE(q.retry_count,0) END) * 5) || ' minutes')
        )
      )
      AND COALESCE(q.attempt_count, 0) < ?
      AND NOT EXISTS (
        SELECT 1 FROM board_factor_results r
        WHERE r.queue_id = q.queue_id
          AND r.status = 'COMPLETED'
          AND r.factor_count > 0
          AND r.raw_json LIKE '%"raw_mode":true%'
          AND r.raw_json LIKE '%"raw_factors"%'
      )
    ORDER BY COALESCE(q.attempt_count, 0) ASC,
      CASE q.queue_type
        WHEN 'GAME_B_TEAM_BULLPEN_ENVIRONMENT' THEN 1
        WHEN 'GAME_WEATHER_CONTEXT' THEN 2
        WHEN 'GAME_NEWS_INJURY_CONTEXT' THEN 3
        WHEN 'PLAYER_D_ADVANCED_FORM_CONTACT' THEN 4
        WHEN 'PLAYER_A_ROLE_RECENT_MATCHUP' THEN 5
        ELSE 99
      END,
      COALESCE(q.last_processed_at, q.updated_at, q.created_at) ASC,
      q.batch_index ASC,
      q.queue_id ASC
    LIMIT 1
  `).bind(...binds).first();

  if (!next) {
    const health = await boardRows(env, `SELECT queue_type, status, COUNT(*) AS rows_count FROM board_factor_queue WHERE slate_date = ? GROUP BY queue_type, status ORDER BY queue_type, status`, [slateDate]);
    return { ok: true, job: "board_queue_mine_one", version: SYSTEM_VERSION, status: "empty", slate_date: slateDate, message: "No pending board factor queue row without a valid raw result was found.", queue_health: health.rows, note: "No Gemini call made. Duplicate raw-result protection is active." };
  }

  const alreadyRaw = await validRawResultForQueue(env, next.queue_id);
  if (alreadyRaw) {
    await env.DB.prepare(`UPDATE board_factor_queue SET status='COMPLETED', last_error=NULL, updated_at=CURRENT_TIMESTAMP, last_processed_at=CURRENT_TIMESTAMP WHERE queue_id=?`).bind(next.queue_id).run();
    const health = await boardRows(env, `SELECT queue_type, status, COUNT(*) AS rows_count FROM board_factor_queue WHERE slate_date = ? GROUP BY queue_type, status ORDER BY queue_type, status`, [slateDate]);
    return { ok: true, job: "board_queue_mine_one", version: SYSTEM_VERSION, status: "skipped_existing_raw_result", slate_date: slateDate, skipped_queue: { queue_id: next.queue_id, queue_type: next.queue_type, batch_index: next.batch_index }, existing_result_id: alreadyRaw.result_id, queue_health: health.rows, note: "Skipped this queue row because a valid raw result already exists. No Gemini call made." };
  }

  await env.DB.prepare(`UPDATE board_factor_queue SET status='RUNNING', attempt_count=attempt_count+1, last_error=NULL, updated_at=CURRENT_TIMESTAMP WHERE queue_id=? AND status IN ('PENDING','RETRY_LATER')`).bind(next.queue_id).run();
  const model = SCRAPE_MODEL;
  try {
    const hydratedNext = await hydrateQueueRowPayloadIfNeeded(env, next);
    const hydratedPayload = parseStoredBoardPayload(hydratedNext.payload_json);
    const mined = await callGeminiRawWithValidation(env, hydratedNext);
    const parsed = mined.parsed;
    parsed.validation = { ok: true, attempts: mined.attempts };
    parsed.queue_id = next.queue_id; parsed.queue_type = next.queue_type; parsed.scope_type = next.scope_type; parsed.slate_date = next.slate_date;
    const summary = summarizeRawFactorPayload(parsed);
    const canonicalWrite = await writeCanonicalBoardFactorResult(env, next, model, summary, parsed);
    const resultId = canonicalWrite.result_id;
    await env.DB.prepare(`UPDATE board_factor_queue SET status='COMPLETED', last_error=NULL, updated_at=CURRENT_TIMESTAMP, last_processed_at=CURRENT_TIMESTAMP WHERE queue_id=?`).bind(next.queue_id).run();
    const queueHealth = await boardRows(env, `SELECT queue_type, status, COUNT(*) AS rows_count FROM board_factor_queue WHERE slate_date = ? GROUP BY queue_type, status ORDER BY queue_type, status`, [slateDate]);
    return { ok: true, job: "board_queue_mine_one", version: SYSTEM_VERSION, status: "pass", slate_date: slateDate, mined_queue: { queue_id: next.queue_id, queue_type: next.queue_type, scope_type: next.scope_type, batch_index: next.batch_index, player_count: next.player_count, game_count: next.game_count, payload_injected_before_gemini: isBoardQueuePayloadEnriched(hydratedPayload, hydratedNext.queue_type) }, result_id: resultId, canonical_result_write: true, reused_existing_result: canonicalWrite.reused_existing, model, raw_factor_summary: summary, validation: parsed.validation, queue_health: queueHealth.rows, note: "Mined exactly one queue row as raw factor extraction. v1.2.73 canonical result write is active: future successful writes use one deterministic result row per queue_id. Old duplicate rows are preserved for audit. No backend scoring, no prop scoring, no ranking, no candidate logic." };
  } catch (err) {
    const msg = String(err?.message || err).slice(0, 900);
    const validationAttempts = Array.isArray(err?.validation_attempts) ? err.validation_attempts : [];
    if (isTransientMiningError(msg)) {
      const attemptsUsed = Number(next.attempt_count || 0) + 1;
      if (attemptsUsed >= BOARD_QUEUE_RETRY_LIMIT) {
        const flagged = `retry_exhausted_after_${BOARD_QUEUE_RETRY_LIMIT}_attempts: ${msg}`.slice(0, 900);
        await env.DB.prepare(`UPDATE board_factor_queue SET status='ERROR', last_error=?, updated_at=CURRENT_TIMESTAMP, last_processed_at=CURRENT_TIMESTAMP WHERE queue_id=?`).bind(flagged, next.queue_id).run();
        const queueHealth = await boardRows(env, `SELECT queue_type, status, COUNT(*) AS rows_count FROM board_factor_queue WHERE slate_date = ? GROUP BY queue_type, status ORDER BY queue_type, status`, [slateDate]);
        return { ok: false, job: "board_queue_mine_one", version: SYSTEM_VERSION, status: "retry_exhausted_flagged", slate_date: slateDate, failed_queue: { queue_id: next.queue_id, queue_type: next.queue_type, batch_index: next.batch_index, attempts_used: attemptsUsed }, error: flagged, validation_attempts: validationAttempts, queue_health: queueHealth.rows, note: "Transient/API failure exhausted the per-row retry limit. Queue row was flagged ERROR with last_error so it is visible, and scheduled/full-run repair can reset it for a future retry wave. No scoring, no ranking." };
      }
      await env.DB.prepare(`UPDATE board_factor_queue SET status='RETRY_LATER', retry_count=COALESCE(retry_count,0)+1, last_error=?, updated_at=CURRENT_TIMESTAMP, last_processed_at=CURRENT_TIMESTAMP WHERE queue_id=?`).bind(msg, next.queue_id).run();
      const queueHealth = await boardRows(env, `SELECT queue_type, status, COUNT(*) AS rows_count FROM board_factor_queue WHERE slate_date = ? GROUP BY queue_type, status ORDER BY queue_type, status`, [slateDate]);
      return { ok: false, job: "board_queue_mine_one", version: SYSTEM_VERSION, status: "retry_later", slate_date: slateDate, retry_queue: { queue_id: next.queue_id, queue_type: next.queue_type, batch_index: next.batch_index, attempts_used: attemptsUsed, retry_limit: BOARD_QUEUE_RETRY_LIMIT }, error: msg, validation_attempts: validationAttempts, queue_health: queueHealth.rows, note: "Transient/network/API failure. Queue row was moved to RETRY_LATER with backoff until the per-row retry limit is exhausted. No scoring, no ranking." };
    }
    await env.DB.prepare(`UPDATE board_factor_queue SET status='ERROR', last_error=?, updated_at=CURRENT_TIMESTAMP, last_processed_at=CURRENT_TIMESTAMP WHERE queue_id=?`).bind(msg, next.queue_id).run();
    return { ok: false, job: "board_queue_mine_one", version: SYSTEM_VERSION, status: "failed", slate_date: slateDate, failed_queue: { queue_id: next.queue_id, queue_type: next.queue_type, batch_index: next.batch_index, attempts_used: Number(next.attempt_count || 0) + 1 }, error: msg, validation_attempts: validationAttempts, note: "One queue row failed only after backend raw JSON/schema validation and one compact retry, or another non-transient backend failure. It was marked ERROR. No backend scoring, prop scoring, or ranking was attempted." };
  }
}


async function runBoardQueueAutoMineCore(input, env) {
  await ensureBoardFactorQueueTable(env);
  await ensureBoardFactorResultsTable(env);
  const slateDate = String(input.slate_date || resolveSlateDate(input).slate_date);
  const preferredType = String(input.queue_type || "").trim();
  const requestedLimit = Number(input.limit || input.max_rows || input.max_mines || BOARD_QUEUE_AUTO_MINE_LIMIT);
  const mineLimit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : BOARD_QUEUE_AUTO_MINE_LIMIT, BOARD_QUEUE_AUTO_MINE_LIMIT));
  const retryErrors = input.retry_errors === true || input.reset_errors === true;
  const steps = [];
  const startedMs = Date.now();
  const selectedQueueType = preferredType || await chooseFairBoardQueueType(env, slateDate);
  let minedCount = 0;
  let completedByExisting = 0;
  let retryLaterCount = 0;
  let failedCount = 0;
  let emptyReached = false;

  const repairBefore = await repairBoardQueueRawState(env, slateDate, { reset_errors: retryErrors });
  const beforeTotals = await env.DB.prepare(`
    SELECT COUNT(*) AS total_rows,
      SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending_rows,
      SUM(CASE WHEN status='RETRY_LATER' THEN 1 ELSE 0 END) AS retry_later_rows,
      SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed_rows,
      SUM(CASE WHEN status='RUNNING' THEN 1 ELSE 0 END) AS running_rows,
      SUM(CASE WHEN status='ERROR' THEN 1 ELSE 0 END) AS error_rows
    FROM board_factor_queue WHERE slate_date=?
  `).bind(slateDate).first();

  for (let i = 0; i < mineLimit; i++) {
    if (Date.now() - startedMs > BOARD_QUEUE_RUNTIME_CUTOFF_MS) {
      steps.push({ pass: i + 1, ok: true, status: "runtime_cutoff", selected_queue_type: selectedQueueType, elapsed_ms: Date.now() - startedMs });
      break;
    }
    if (!selectedQueueType) { emptyReached = true; break; }
    const result = await runBoardQueueMineOne({ ...(input || {}), slate_date: slateDate, queue_type: selectedQueueType }, env);
    steps.push({
      pass: i + 1,
      ok: !!result.ok,
      status: result.status,
      mined_queue: result.mined_queue || null,
      skipped_queue: result.skipped_queue || null,
      retry_queue: result.retry_queue || null,
      failed_queue: result.failed_queue || null,
      result_id: result.result_id || result.existing_result_id || null,
      error: result.error || null
    });
    if (result.status === "pass") minedCount++;
    if (result.status === "skipped_existing_raw_result") completedByExisting++;
    if (result.status === "empty") { emptyReached = true; break; }
    if (result.status === "retry_later") { retryLaterCount++; continue; }
    if (!result.ok || result.status === "failed" || result.status === "retry_exhausted_flagged") { failedCount++; continue; }
  }

  const repairAfter = await repairBoardQueueRawState(env, slateDate, { reset_errors: false });
  const queueHealth = await boardRows(env, `SELECT queue_type, status, COUNT(*) AS rows_count FROM board_factor_queue WHERE slate_date = ? GROUP BY queue_type, status ORDER BY queue_type, status`, [slateDate]);
  const resultHealth = await boardRows(env, `SELECT queue_type, status, COUNT(*) AS rows_count, SUM(factor_count) AS raw_factor_rows FROM board_factor_results WHERE slate_date = ? GROUP BY queue_type, status ORDER BY queue_type, status`, [slateDate]);
  const totals = await env.DB.prepare(`
    SELECT COUNT(*) AS total_rows,
      SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending_rows,
      SUM(CASE WHEN status='RETRY_LATER' THEN 1 ELSE 0 END) AS retry_later_rows,
      SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed_rows,
      SUM(CASE WHEN status='RUNNING' THEN 1 ELSE 0 END) AS running_rows,
      SUM(CASE WHEN status='ERROR' THEN 1 ELSE 0 END) AS error_rows
    FROM board_factor_queue WHERE slate_date=?
  `).bind(slateDate).first();
  const totalRows = Number(totals?.total_rows || 0);
  const pending = Number(totals?.pending_rows || 0);
  const completed = Number(totals?.completed_rows || 0);
  const running = Number(totals?.running_rows || 0);
  const retryLater = Number(totals?.retry_later_rows || 0);
  const errors = Number(totals?.error_rows || 0);
  const completedBefore = Number(beforeTotals?.completed_rows || 0);
  const progressPct = totalRows > 0 ? Math.round((completed / totalRows) * 1000) / 10 : 100;
  const status = emptyReached || (pending === 0 && retryLater === 0 && running === 0) ? "pass" : failedCount ? "partial_flagged_continue" : retryLaterCount ? "partial_retry_later" : "partial";

  return {
    ok: true,
    job: "board_queue_auto_mine",
    version: SYSTEM_VERSION,
    status,
    slate_date: slateDate,
    mode: "cloudflare_safe_auto_raw_factor_mining_no_prop_scoring",
    selected_queue_type: selectedQueueType || null,
    family_rotation_policy: "v1.2.73 selects the under-mined family with the fewest completed result queues, honors RETRY_LATER backoff, and runs one family per invocation with no new rotation table.",
    mine_limit: mineLimit,
    progress: {
      total_rows: totalRows,
      completed_before: completedBefore,
      completed_after: completed,
      mined_this_run: minedCount,
      completed_by_existing_raw_result: completedByExisting,
      pending_after: pending,
      retry_later_after: retryLater,
      running_after: running,
      error_after: errors,
      percent_complete: progressPct,
      needs_continue: (pending + retryLater + running) > 0
    },
    repair: { before: repairBefore?.changes || null, after: repairAfter?.changes || null },
    mined_rows: minedCount,
    completed_by_existing_raw_result: completedByExisting,
    retry_later_count: retryLaterCount,
    failed_count: failedCount,
    pending_rows_after: pending,
    retry_later_rows_after: retryLater,
    completed_rows_after: completed,
    running_rows_after: running,
    error_rows_after: errors,
    needs_continue: (pending + retryLater + running) > 0,
    steps,
    queue_health: queueHealth.rows,
    result_health: resultHealth.rows,
    next_action: (pending + retryLater + running) > 0 ? "Run SCRAPE > Board Queue Auto Mine Raw again later, or let the scheduled miner continue. Failed rows are flagged after 5 attempts and visible in queue health." : "Raw board queue mining complete. Next phase can build scored factor summaries/candidates.",
    note: "Auto miner runs a smaller safe batch of Mine One Raw calls, reports progress counters, retries transient rows with backoff up to 5 attempts, flags exhausted rows, and lets scheduled/full-run repair pick them back up. It repairs stale RUNNING rows before and after every batch. No prop scoring, no ranking, no candidate logic."
  };
}

async function runBoardQueueAutoMine(input, env) {
  const slateDate = String(input?.slate_date || resolveSlateDate(input || {}).slate_date);
  const lockId = `BOARD_QUEUE_AUTO_MINE|${slateDate}`;
  const lockedBy = `${input?.trigger || 'manual'}:${crypto.randomUUID()}`;
  await resetStalePipelineRuntime(env, slateDate).catch(() => null);
  const lock = await acquirePipelineLock(env, lockId, lockedBy, 10);
  if (!lock.acquired) {
    const totals = await boardQueueTotals(env, slateDate).catch(() => null);
    return {
      ok: true,
      job: 'board_queue_auto_mine',
      version: SYSTEM_VERSION,
      status: 'LOCKED_SKIP_ALREADY_RUNNING',
      slate_date: slateDate,
      lock_status: lock,
      totals,
      needs_continue: true,
      note: 'Another miner is already active for this slate. This invocation exited cleanly so duplicate UI/Cron clicks do not create overlapping writes.'
    };
  }
  try {
    const result = await runBoardQueueAutoMineCore(input || {}, env);
    result.lock_status = 'RELEASED';
    return result;
  } finally {
    await releasePipelineLock(env, lockId, lockedBy);
  }
}

function boardQueueId(slateDate, queueType, batchIndex, scopeKey) {
  return `${slateDate}|${queueType}|${String(batchIndex).padStart(4, "0")}|${boardSlug(scopeKey)}`;
}

function boardChunkRows(rows, size) {
  const chunks = [];
  for (let i = 0; i < rows.length; i += size) chunks.push(rows.slice(i, i + size));
  return chunks;
}


async function boardNamedTableExists(env, tableName) {
  try {
    const row = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(tableName).first();
    return !!row;
  } catch (_) {
    return false;
  }
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function normTeam(value) {
  return String(value || "").replace(/^@|^vs\.?/i, "").trim().toUpperCase();
}

function boardPayloadQualityForPlayerContext(ctx) {
  const available = [];
  const missing = [];
  if (ctx.player_profile) available.push("player_profile"); else missing.push("player_profile");
  if (ctx.lineup_context) available.push("lineup_context"); else missing.push("lineup_context");
  if (ctx.recent_usage) available.push("recent_usage"); else missing.push("recent_usage");
  if (ctx.opposing_starter) available.push("opposing_starter"); else missing.push("opposing_starter");
  if (ctx.market_context) available.push("market_context"); else missing.push("market_context");
  if (ctx.board_props && ctx.board_props.length) available.push("board_props"); else missing.push("board_props");
  if (ctx.candidate_context) available.push("candidate_context"); else missing.push("candidate_context");
  return { available, missing, completeness_score: Math.round((available.length / (available.length + missing.length || 1)) * 100) };
}

function mergePayloadQuality(items) {
  const available = new Set();
  const missing = new Set();
  let total = 0;
  let count = 0;
  for (const item of items || []) {
    const q = item?.payload_quality || item || {};
    for (const key of q.available || []) available.add(key);
    for (const key of q.missing || []) missing.add(key);
    if (Number.isFinite(Number(q.completeness_score))) { total += Number(q.completeness_score); count += 1; }
  }
  for (const key of available) missing.delete(key);
  return { available: Array.from(available).sort(), missing: Array.from(missing).sort(), avg_completeness_score: count ? Number((total / count).toFixed(2)) : 0 };
}

async function findBoardGameContext(env, slateDate, team, opponent, startTime) {
  const t = normTeam(team);
  const o = normTeam(opponent);
  const startPrefix = String(startTime || "").slice(0, 10);
  if (!await boardNamedTableExists(env, "games")) return null;
  const date = startPrefix || slateDate;
  const row = await env.DB.prepare(`
    SELECT * FROM games
    WHERE game_date = ?
      AND ((UPPER(away_team)=? AND UPPER(home_team)=?) OR (UPPER(away_team)=? AND UPPER(home_team)=?))
    ORDER BY game_id ASC
    LIMIT 1
  `).bind(date, t, o, o, t).first();
  return row || null;
}

async function enrichBoardPlayer(env, slateDate, playerRow) {
  const playerName = String(playerRow.player_name || "").trim();
  const team = normTeam(playerRow.team);
  const startTime = String(playerRow.first_start_time || playerRow.start_time || "").trim();
  const propRows = await boardRows(env, `
    SELECT line_id, player_name, team, opponent, stat_type, line_score, odds_type, is_promo, start_time, updated_at
    FROM mlb_stats
    WHERE substr(start_time, 1, 10) = ?
      AND LOWER(TRIM(player_name)) = LOWER(TRIM(?))
      AND UPPER(TRIM(team)) = ?
      AND ${boardActionableSingleRowWhere()}
    ORDER BY updated_at DESC, stat_type ASC, odds_type ASC
    LIMIT 20
  `, [slateDate, playerName, team]);
  const fallbackProps = propRows.rows.length ? propRows : await boardRows(env, `
    SELECT line_id, player_name, team, opponent, stat_type, line_score, odds_type, is_promo, start_time, updated_at
    FROM mlb_stats
    WHERE LOWER(TRIM(player_name)) = LOWER(TRIM(?))
      AND UPPER(TRIM(team)) = ?
      AND ${boardActionableSingleRowWhere()}
    ORDER BY updated_at DESC, stat_type ASC, odds_type ASC
    LIMIT 20
  `, [playerName, team]);
  const boardProps = fallbackProps.rows || [];
  const opponent = normTeam(firstNonEmpty(boardProps[0]?.opponent, playerRow.opponent_sample));
  const game = opponent ? await findBoardGameContext(env, slateDate, team, opponent, startTime) : null;
  const gameId = game?.game_id || null;

  const playerProfile = await boardNamedTableExists(env, "players_current")
    ? (await env.DB.prepare(`SELECT * FROM players_current WHERE LOWER(TRIM(player_name)) = LOWER(TRIM(?)) AND (UPPER(TRIM(team_id)) = ? OR COALESCE(team_id,'')='') ORDER BY CASE WHEN UPPER(TRIM(team_id)) = ? THEN 0 ELSE 1 END LIMIT 1`).bind(playerName, team, team).first())
    : null;

  const recentUsage = await boardNamedTableExists(env, "player_recent_usage")
    ? (await env.DB.prepare(`SELECT * FROM player_recent_usage WHERE LOWER(TRIM(player_name)) = LOWER(TRIM(?)) AND (UPPER(TRIM(team_id)) = ? OR COALESCE(team_id,'')='') ORDER BY CASE WHEN UPPER(TRIM(team_id)) = ? THEN 0 ELSE 1 END LIMIT 1`).bind(playerName, team, team).first())
    : null;

  const lineupContext = (gameId && await boardNamedTableExists(env, "lineups_current"))
    ? (await env.DB.prepare(`SELECT * FROM lineups_current WHERE game_id = ? AND UPPER(TRIM(team_id)) = ? AND LOWER(TRIM(player_name)) = LOWER(TRIM(?)) LIMIT 1`).bind(gameId, team, playerName).first())
    : null;

  const opposingStarter = (gameId && opponent && await boardNamedTableExists(env, "starters_current"))
    ? (await env.DB.prepare(`SELECT * FROM starters_current WHERE game_id = ? AND UPPER(TRIM(team_id)) = ? LIMIT 1`).bind(gameId, opponent).first())
    : null;

  const marketContext = (gameId && await boardNamedTableExists(env, "markets_current"))
    ? (await env.DB.prepare(`SELECT * FROM markets_current WHERE game_id = ? LIMIT 1`).bind(gameId).first())
    : null;

  const bullpenContext = (gameId && opponent && await boardNamedTableExists(env, "bullpens_current"))
    ? (await env.DB.prepare(`SELECT * FROM bullpens_current WHERE game_id = ? AND UPPER(TRIM(team_id)) = ? LIMIT 1`).bind(gameId, opponent).first())
    : null;

  const hitsCandidate = await boardNamedTableExists(env, "edge_candidates_hits")
    ? (await env.DB.prepare(`SELECT * FROM edge_candidates_hits WHERE slate_date = ? AND LOWER(TRIM(player_name)) = LOWER(TRIM(?)) AND UPPER(TRIM(team_id)) = ? LIMIT 1`).bind(slateDate, playerName, team).first())
    : null;

  const rbiCandidate = await boardNamedTableExists(env, "edge_candidates_rbi")
    ? (await env.DB.prepare(`SELECT * FROM edge_candidates_rbi WHERE slate_date = ? AND LOWER(TRIM(player_name)) = LOWER(TRIM(?)) AND UPPER(TRIM(team_id)) = ? LIMIT 1`).bind(slateDate, playerName, team).first())
    : null;

  const statTypeCounts = {};
  for (const r of boardProps) statTypeCounts[String(r.stat_type || "UNKNOWN")] = (statTypeCounts[String(r.stat_type || "UNKNOWN")] || 0) + 1;

  const ctx = {
    player_key: `${playerName} ${team}`.trim(),
    player_name: playerName,
    team,
    opponent,
    game_id: gameId,
    start_time: firstNonEmpty(startTime, game?.start_time_utc, boardProps[0]?.start_time),
    board_leg_rows: Number(playerRow.leg_rows || boardProps.length || 0),
    board_stat_type_counts: statTypeCounts,
    board_props: boardProps,
    game_context: game,
    player_profile: playerProfile || null,
    lineup_context: lineupContext || null,
    recent_usage: recentUsage || null,
    opposing_starter: opposingStarter || null,
    market_context: marketContext || null,
    opposing_bullpen_context: bullpenContext || null,
    candidate_context: hitsCandidate || rbiCandidate ? { hits: hitsCandidate || null, rbi: rbiCandidate || null } : null
  };
  ctx.payload_quality = boardPayloadQualityForPlayerContext(ctx);
  return ctx;
}

async function enrichBoardGame(env, slateDate, gameRow) {
  const teamA = normTeam(gameRow.team_a);
  const teamB = normTeam(gameRow.team_b);
  const game = await findBoardGameContext(env, slateDate, teamA, teamB, gameRow.start_time);
  const gameId = game?.game_id || null;
  const market = (gameId && await boardNamedTableExists(env, "markets_current")) ? await env.DB.prepare(`SELECT * FROM markets_current WHERE game_id = ? LIMIT 1`).bind(gameId).first() : null;
  const starters = (gameId && await boardNamedTableExists(env, "starters_current")) ? (await boardRows(env, `SELECT * FROM starters_current WHERE game_id = ? ORDER BY team_id`, [gameId])).rows : [];
  const bullpens = (gameId && await boardNamedTableExists(env, "bullpens_current")) ? (await boardRows(env, `SELECT * FROM bullpens_current WHERE game_id = ? ORDER BY team_id`, [gameId])).rows : [];
  const lineups = (gameId && await boardNamedTableExists(env, "lineups_current")) ? (await boardRows(env, `SELECT team_id, COUNT(*) AS lineup_rows, SUM(CASE WHEN is_confirmed THEN 1 ELSE 0 END) AS confirmed_rows FROM lineups_current WHERE game_id = ? GROUP BY team_id ORDER BY team_id`, [gameId])).rows : [];
  const boardProps = await boardRows(env, `
    SELECT team, opponent, stat_type, odds_type, COUNT(*) AS rows_count, MIN(line_score) AS min_line, MAX(line_score) AS max_line
    FROM mlb_stats
    WHERE substr(start_time, 1, 10) = ?
      AND ${boardActionableSingleRowWhere()}
      AND ((UPPER(TRIM(team))=? AND UPPER(TRIM(opponent))=?) OR (UPPER(TRIM(team))=? AND UPPER(TRIM(opponent))=?))
    GROUP BY team, opponent, stat_type, odds_type
    ORDER BY stat_type, odds_type
    LIMIT 80
  `, [slateDate, teamA, teamB, teamB, teamA]);

  const available = [];
  const missing = [];
  if (game) available.push("game_context"); else missing.push("game_context");
  if (market) available.push("market_context"); else missing.push("market_context");
  if (starters.length) available.push("starters"); else missing.push("starters");
  if (bullpens.length) available.push("bullpens"); else missing.push("bullpens");
  if (lineups.length) available.push("lineups"); else missing.push("lineups");
  if (boardProps.rows.length) available.push("board_props"); else missing.push("board_props");

  return {
    game_key: gameRow.game_key,
    team_a: teamA,
    team_b: teamB,
    start_time: gameRow.start_time,
    source_rows: Number(gameRow.leg_rows || 0),
    game_context: game,
    market_context: market || null,
    starters,
    bullpens,
    lineup_coverage: lineups,
    board_prop_distribution: boardProps.rows,
    payload_quality: { available, missing, completeness_score: Math.round((available.length / (available.length + missing.length || 1)) * 100) }
  };
}

async function enrichBoardQueuePlayerPayload(env, slateDate, queueType, playerBatchSize, chunk) {
  const contexts = [];
  for (const player of chunk) contexts.push(await enrichBoardPlayer(env, slateDate, player));
  return {
    slate_date: slateDate,
    queue_type: queueType,
    batch_size: playerBatchSize,
    players: chunk,
    enriched_player_contexts: contexts,
    payload_quality: mergePayloadQuality(contexts)
  };
}

async function enrichBoardQueueGamePayload(env, slateDate, queueType, row) {
  const context = await enrichBoardGame(env, slateDate, row);
  return {
    slate_date: slateDate,
    queue_type: queueType,
    game: row,
    enriched_game_context: context,
    payload_quality: context.payload_quality
  };
}

function boardQueueBuildChunkLimit(input) {
  return input && input.auto_build ? BOARD_QUEUE_AUTO_BUILD_CHUNK_LIMIT : BOARD_QUEUE_BUILD_CHUNK_LIMIT;
}

function boardLightPlayerQueuePayload(slateDate, queueType, playerBatchSize, chunk) {
  return {
    slate_date: slateDate,
    queue_type: queueType,
    batch_size: playerBatchSize,
    payload_mode: "lightweight_hydrate_at_mining",
    players: chunk.map(p => ({
      player_name: String(p.player_name || "").trim(),
      team: normTeam(p.team),
      first_start_time: p.first_start_time || null,
      leg_rows: Number(p.leg_rows || 0),
      opponent_sample: p.opponent_sample || ""
    })),
    payload_quality: {
      available: ["board_identity_stub"],
      missing: ["hydrated_context_deferred_until_mining"],
      avg_completeness_score: 10
    }
  };
}

function boardLightGameQueuePayload(slateDate, queueType, row) {
  return {
    slate_date: slateDate,
    queue_type: queueType,
    payload_mode: "lightweight_hydrate_at_mining",
    game: row,
    payload_quality: {
      available: ["board_game_stub"],
      missing: ["hydrated_context_deferred_until_mining"],
      completeness_score: 10
    }
  };
}

async function buildBoardQueueRows(input, env) {
  const slateDate = String(input.slate_date || resolveSlateDate(input).slate_date);
  const exists = await boardTableExists(env);
  if (!exists) {
    return {
      ok: false,
      job: input.job || "board_queue_preview",
      version: SYSTEM_VERSION,
      status: "failed",
      slate_date: slateDate,
      error: "Missing mlb_stats table. Board queue cannot be prepared."
    };
  }

  const slateRows = await boardScalar(env, "SELECT COUNT(*) FROM mlb_stats WHERE substr(start_time, 1, 10) = ?", [slateDate]);
  const activeWhere = Number(slateRows.value || 0) > 0 ? "substr(start_time, 1, 10) = ?" : "1=1";
  const activeBinds = Number(slateRows.value || 0) > 0 ? [slateDate] : [];
  const activeMode = Number(slateRows.value || 0) > 0 ? "slate_date_start_time_match" : "fallback_all_rows_no_slate_match";
  const singleWhere = boardActionableSingleRowWhere();
  const gameKeySql = boardNormalizedGameKeySql();

  const players = await boardRows(env, `
    SELECT player_name, team, MIN(start_time) AS first_start_time, COUNT(*) AS leg_rows
    FROM mlb_stats
    WHERE ${activeWhere} AND ${singleWhere}
    GROUP BY player_name, team
    ORDER BY team ASC, player_name ASC
  `, activeBinds);

  const games = await boardRows(env, `
    SELECT ${gameKeySql} AS game_key,
           MIN(CASE WHEN UPPER(TRIM(team)) < UPPER(TRIM(opponent)) THEN UPPER(TRIM(team)) ELSE UPPER(TRIM(opponent)) END) AS team_a,
           MIN(CASE WHEN UPPER(TRIM(team)) < UPPER(TRIM(opponent)) THEN UPPER(TRIM(opponent)) ELSE UPPER(TRIM(team)) END) AS team_b,
           MIN(start_time) AS start_time,
           COUNT(*) AS leg_rows
    FROM mlb_stats
    WHERE ${activeWhere} AND ${singleWhere}
    GROUP BY game_key, start_time
    ORDER BY start_time ASC, game_key ASC
  `, activeBinds);

  const requestedQueueType = String(input.queue_type || input.build_queue_type || "").trim() || null;
  const buildOffset = Math.max(0, Number(input.build_offset || input.offset || 0) || 0);
  const buildLimitRaw = Number(input.max_queue_rows || input.limit || 0) || 0;
  const buildLimit = buildLimitRaw > 0 ? Math.max(1, Math.min(buildLimitRaw, boardQueueBuildChunkLimit(input))) : null;
  const queueRows = [];
  const playerBatchSizes = {
    PLAYER_A_ROLE_RECENT_MATCHUP: 2,
    PLAYER_D_ADVANCED_FORM_CONTACT: 2
  };
  const playerQueueTypes = [
    "PLAYER_A_ROLE_RECENT_MATCHUP",
    "PLAYER_D_ADVANCED_FORM_CONTACT"
  ];
  for (const queueType of playerQueueTypes) {
    if (requestedQueueType && queueType !== requestedQueueType) continue;
    const playerBatchSize = playerBatchSizes[queueType] || 4;
    const allPlayerChunks = boardChunkRows(players.rows, playerBatchSize);
    const playerChunks = buildLimit ? allPlayerChunks.slice(buildOffset, buildOffset + buildLimit) : allPlayerChunks;
    for (let index = 0; index < playerChunks.length; index += 1) {
      const absoluteIndex = buildLimit ? buildOffset + index : index;
      const chunk = playerChunks[index];
      const scopeKey = chunk.map(r => `${r.team}:${r.player_name}`).join("|");
      const enrichedPayload = input.light_payload ? boardLightPlayerQueuePayload(slateDate, queueType, playerBatchSize, chunk) : await enrichBoardQueuePlayerPayload(env, slateDate, queueType, playerBatchSize, chunk);
      queueRows.push({
        queue_id: boardQueueId(slateDate, queueType, absoluteIndex + 1, scopeKey),
        slate_date: slateDate,
        queue_type: queueType,
        scope_type: `PLAYER_BATCH_${playerBatchSize}`,
        scope_key: scopeKey,
        batch_index: absoluteIndex + 1,
        player_count: chunk.length,
        game_count: 0,
        source_rows: chunk.reduce((sum, r) => sum + Number(r.leg_rows || 0), 0),
        player_names: chunk.map(r => r.player_name).join(" | "),
        team_id: chunk.map(r => r.team).join(" | "),
        game_key: null,
        team_a: null,
        team_b: null,
        start_time: chunk.map(r => r.first_start_time).filter(Boolean).sort()[0] || null,
        payload_json: JSON.stringify(enrichedPayload)
      });
    }
  }

  const gameQueueTypes = [
    "GAME_B_TEAM_BULLPEN_ENVIRONMENT",
    "GAME_WEATHER_CONTEXT",
    "GAME_NEWS_INJURY_CONTEXT"
  ];
  for (const queueType of gameQueueTypes) {
    if (requestedQueueType && queueType !== requestedQueueType) continue;
    const gameRows = buildLimit ? games.rows.slice(buildOffset, buildOffset + buildLimit) : games.rows;
    for (let index = 0; index < gameRows.length; index += 1) {
      const absoluteIndex = buildLimit ? buildOffset + index : index;
      const row = gameRows[index];
      const scopeKey = `${row.game_key}|${row.start_time}`;
      const enrichedPayload = input.light_payload ? boardLightGameQueuePayload(slateDate, queueType, row) : await enrichBoardQueueGamePayload(env, slateDate, queueType, row);
      queueRows.push({
        queue_id: boardQueueId(slateDate, queueType, absoluteIndex + 1, scopeKey),
        slate_date: slateDate,
        queue_type: queueType,
        scope_type: "GAME",
        scope_key: scopeKey,
        batch_index: absoluteIndex + 1,
        player_count: 0,
        game_count: 1,
        source_rows: Number(row.leg_rows || 0),
        player_names: null,
        team_id: null,
        game_key: row.game_key,
        team_a: row.team_a,
        team_b: row.team_b,
        start_time: row.start_time,
        payload_json: JSON.stringify(enrichedPayload)
      });
    }
  }

  const estimate = {};
  for (const r of queueRows) {
    if (!estimate[r.queue_type]) estimate[r.queue_type] = { queue_type: r.queue_type, requests: 0, source_rows: 0, units: 0 };
    estimate[r.queue_type].requests += 1;
    estimate[r.queue_type].source_rows += Number(r.source_rows || 0);
    estimate[r.queue_type].units += r.scope_type === "GAME" ? 1 : Number(r.player_count || 0);
  }

  return {
    ok: true,
    version: SYSTEM_VERSION,
    slate_date: slateDate,
    active_mode: activeMode,
    player_batch_size: playerBatchSizes,
    supported_unique_players: players.rows.length,
    normalized_supported_games: games.rows.length,
    queue_rows: queueRows,
    queue_estimate: Object.values(estimate),
    warnings: activeMode === "fallback_all_rows_no_slate_match" ? [`No mlb_stats rows matched slate_date ${slateDate}; queue used all board rows.`] : []
  };
}

async function runBoardQueuePreview(input, env) {
  const built = await buildBoardQueueRows(input, env);
  if (!built.ok) return built;
  return {
    ok: true,
    job: "board_queue_preview",
    version: SYSTEM_VERSION,
    status: built.warnings.length ? "review" : "pass",
    slate_date: built.slate_date,
    active_mode: built.active_mode,
    counts: {
      supported_unique_players: built.supported_unique_players,
      normalized_supported_games: built.normalized_supported_games,
      total_queue_rows_preview: built.queue_rows.length,
      player_batch_size: built.player_batch_size
    },
    queue_estimate: built.queue_estimate,
    sample_queue_rows: built.queue_rows.slice(0, 20).map(r => ({
      queue_id: r.queue_id,
      queue_type: r.queue_type,
      scope_type: r.scope_type,
      batch_index: r.batch_index,
      player_count: r.player_count,
      game_count: r.game_count,
      source_rows: r.source_rows,
      player_names: r.player_names,
      game_key: r.game_key,
      team_a: r.team_a,
      team_b: r.team_b,
      start_time: r.start_time
    })),
    warnings: built.warnings,
    note: "Read-only queue preview. No Gemini calls. No writes. Combo lines remain deferred."
  };
}

async function getBoardQueueBuildPlan(input, env, slateDate) {
  const slateRows = await boardScalar(env, "SELECT COUNT(*) FROM mlb_stats WHERE substr(start_time, 1, 10) = ?", [slateDate]);
  const activeWhere = Number(slateRows.value || 0) > 0 ? "substr(start_time, 1, 10) = ?" : "1=1";
  const activeBinds = Number(slateRows.value || 0) > 0 ? [slateDate] : [];
  const singleWhere = boardActionableSingleRowWhere();
  const gameKeySql = boardNormalizedGameKeySql();
  const playerCount = await boardScalar(env, `
    SELECT COUNT(*) FROM (
      SELECT player_name, team
      FROM mlb_stats
      WHERE ${activeWhere} AND ${singleWhere}
      GROUP BY player_name, team
    )
  `, activeBinds);
  const gameCount = await boardScalar(env, `
    SELECT COUNT(*) FROM (
      SELECT ${gameKeySql} AS game_key, MIN(start_time) AS start_time
      FROM mlb_stats
      WHERE ${activeWhere} AND ${singleWhere}
      GROUP BY game_key, start_time
    )
  `, activeBinds);
  const players = Number(playerCount.value || 0);
  const games = Number(gameCount.value || 0);
  return [
    { queue_type: "PLAYER_A_ROLE_RECENT_MATCHUP", desired_rows: Math.ceil(players / 2), scope_type: "PLAYER_BATCH_2" },
    { queue_type: "PLAYER_D_ADVANCED_FORM_CONTACT", desired_rows: Math.ceil(players / 2), scope_type: "PLAYER_BATCH_2" },
    { queue_type: "GAME_B_TEAM_BULLPEN_ENVIRONMENT", desired_rows: games, scope_type: "GAME" },
    { queue_type: "GAME_WEATHER_CONTEXT", desired_rows: games, scope_type: "GAME" },
    { queue_type: "GAME_NEWS_INJURY_CONTEXT", desired_rows: games, scope_type: "GAME" }
  ];
}

async function getBoardQueueExistingCount(env, slateDate, queueType, scopeType) {
  const row = await boardScalar(env, `
    SELECT COUNT(*)
    FROM board_factor_queue
    WHERE slate_date = ? AND queue_type = ? AND scope_type = ?
  `, [slateDate, queueType, scopeType]);
  return Number(row.value || 0);
}

async function runBoardQueueBuild(input, env) {
  await ensureBoardFactorQueueTable(env);
  const slateDate = String(input.slate_date || resolveSlateDate(input).slate_date);

  await env.DB.prepare(`
    DELETE FROM board_factor_results
    WHERE slate_date = ?
      AND queue_id IN (
        SELECT queue_id FROM board_factor_queue
        WHERE slate_date = ?
          AND queue_type IN ('PLAYER_A_ROLE_RECENT_MATCHUP','PLAYER_D_ADVANCED_FORM_CONTACT')
          AND scope_type <> 'PLAYER_BATCH_2'
      )
  `).bind(slateDate, slateDate).run();
  await env.DB.prepare(`
    DELETE FROM board_factor_queue
    WHERE slate_date = ?
      AND queue_type IN ('PLAYER_A_ROLE_RECENT_MATCHUP','PLAYER_D_ADVANCED_FORM_CONTACT')
      AND scope_type <> 'PLAYER_BATCH_2'
  `).bind(slateDate).run();

  const plan = await getBoardQueueBuildPlan(input, env, slateDate);
  let selected = null;
  for (const row of plan) {
    const existing = await getBoardQueueExistingCount(env, slateDate, row.queue_type, row.scope_type);
    row.existing_rows = existing;
    row.remaining_rows = Math.max(0, Number(row.desired_rows || 0) - existing);
    if (!selected && row.remaining_rows > 0) selected = row;
  }

  if (!selected) {
    const queueHealthDone = await boardRows(env, `
      SELECT queue_type, status, COUNT(*) AS rows_count, SUM(source_rows) AS source_rows
      FROM board_factor_queue
      WHERE slate_date = ?
      GROUP BY queue_type, status
      ORDER BY queue_type, status
    `, [slateDate]);
    return {
      ok: true,
      job: "board_queue_build",
      version: SYSTEM_VERSION,
      status: "pass",
      slate_date: slateDate,
      table: "board_factor_queue",
      mode: "cloudflare_safe_chunked_queue_builder_no_gemini_no_scoring",
      inserted_queue_rows: 0,
      build_complete: true,
      build_plan: plan,
      queue_health: queueHealthDone.rows,
      warnings: [],
      note: "Board queue is already fully materialized for supported queue types. No Gemini calls, no factor scoring, no prop ranking."
    };
  }

  const chunkLimit = Math.min(boardQueueBuildChunkLimit(input), selected.remaining_rows);
  const built = await buildBoardQueueRows({
    ...input,
    slate_date: slateDate,
    queue_type: selected.queue_type,
    build_offset: selected.existing_rows,
    max_queue_rows: chunkLimit
  }, env);
  if (!built.ok) return built;

  const stmt = env.DB.prepare(`
    INSERT OR IGNORE INTO board_factor_queue (
      queue_id, slate_date, queue_type, scope_type, scope_key, batch_index,
      player_count, game_count, source_rows, player_names, team_id, game_key,
      team_a, team_b, start_time, status, attempt_count, last_error, payload_json,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, NULL, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  let inserted = 0;
  for (const r of built.queue_rows) {
    const result = await stmt.bind(
      r.queue_id, r.slate_date, r.queue_type, r.scope_type, r.scope_key, r.batch_index,
      r.player_count, r.game_count, r.source_rows, r.player_names, r.team_id, r.game_key,
      r.team_a, r.team_b, r.start_time, r.payload_json
    ).run();
    inserted += Number(result?.meta?.changes || 0);
  }

  const refreshedExisting = await getBoardQueueExistingCount(env, slateDate, selected.queue_type, selected.scope_type);
  selected.existing_rows_after = refreshedExisting;
  selected.remaining_rows_after = Math.max(0, Number(selected.desired_rows || 0) - refreshedExisting);
  const buildComplete = selected.remaining_rows_after === 0 && plan.every(r => {
    if (r.queue_type === selected.queue_type) return true;
    return Number(r.remaining_rows || 0) === 0;
  });

  const queueHealth = await boardRows(env, `
    SELECT queue_type, status, COUNT(*) AS rows_count, SUM(source_rows) AS source_rows
    FROM board_factor_queue
    WHERE slate_date = ?
    GROUP BY queue_type, status
    ORDER BY queue_type, status
  `, [slateDate]);

  return {
    ok: true,
    job: "board_queue_build",
    version: SYSTEM_VERSION,
    status: buildComplete ? "pass" : "partial",
    slate_date: slateDate,
    table: "board_factor_queue",
    mode: "cloudflare_safe_chunked_queue_builder_no_gemini_no_scoring",
    chunk: {
      queue_type: selected.queue_type,
      scope_type: selected.scope_type,
      offset: selected.existing_rows,
      requested_rows: chunkLimit,
      inserted_rows: inserted,
      remaining_rows_after: selected.remaining_rows_after
    },
    inserted_queue_rows: inserted,
    build_complete: buildComplete,
    build_plan: plan,
    queue_estimate: built.queue_estimate,
    queue_health: queueHealth.rows,
    warnings: built.warnings,
    note: "Cloudflare-safe manual chunk build completed one queue slice only. For full automatic materialization, use SCRAPE > Board Queue Auto Build. No Gemini calls, no factor scoring, no prop ranking."
  };
}

async function runBoardQueueAutoBuild(input, env) {
  await ensureBoardFactorQueueTable(env);
  const slateDate = String(input.slate_date || resolveSlateDate(input).slate_date);
  const maxPassesRaw = Number(input.max_passes || input.auto_passes || 8) || 8;
  const maxPasses = Math.max(1, Math.min(maxPassesRaw, 10));
  const steps = [];
  let totalInserted = 0;
  let finalBuild = null;

  for (let pass = 1; pass <= maxPasses; pass += 1) {
    const step = await runBoardQueueBuild({
      ...input,
      job: "board_queue_auto_build",
      slate_date: slateDate,
      auto_build: true,
      light_payload: true,
      max_queue_rows: BOARD_QUEUE_AUTO_BUILD_CHUNK_LIMIT
    }, env);
    finalBuild = step;
    totalInserted += Number(step?.inserted_queue_rows || 0);
    steps.push({
      pass,
      ok: Boolean(step?.ok),
      status: step?.status || "unknown",
      build_complete: Boolean(step?.build_complete),
      inserted_queue_rows: Number(step?.inserted_queue_rows || 0),
      chunk: step?.chunk || null,
      queue_health: step?.queue_health || []
    });
    if (!step || !step.ok) break;
    if (step.build_complete) break;
    if (Number(step.inserted_queue_rows || 0) <= 0 && step.status !== "pass") break;
  }

  const queueHealth = await boardRows(env, `
    SELECT queue_type, status, COUNT(*) AS rows_count, SUM(source_rows) AS source_rows
    FROM board_factor_queue
    WHERE slate_date = ?
    GROUP BY queue_type, status
    ORDER BY queue_type, status
  `, [slateDate]);

  const plan = await getBoardQueueBuildPlan(input, env, slateDate);
  let totalRemaining = 0;
  for (const row of plan) {
    const existing = await getBoardQueueExistingCount(env, slateDate, row.queue_type, row.scope_type);
    row.existing_rows = existing;
    row.remaining_rows = Math.max(0, Number(row.desired_rows || 0) - existing);
    totalRemaining += row.remaining_rows;
  }

  const buildComplete = totalRemaining === 0;
  return {
    ok: true,
    job: "board_queue_auto_build",
    version: SYSTEM_VERSION,
    status: buildComplete ? "pass" : "needs_continue",
    slate_date: slateDate,
    table: "board_factor_queue",
    mode: "auto_lightweight_hydrate_at_mining_no_gemini_no_scoring",
    auto_passes_run: steps.length,
    inserted_queue_rows: totalInserted,
    build_complete: buildComplete,
    needs_continue: !buildComplete,
    remaining_rows_total: totalRemaining,
    build_plan: plan,
    steps,
    queue_health: queueHealth.rows,
    final_build: finalBuild,
    next_action: buildComplete ? "Queue build complete. Next: SCRAPE > Board Queue Mine One Raw or scheduled miner." : "Run SCRAPE > Board Queue Auto Build again, or let scheduled backend continue. It safely paused before forcing another loop.",
    note: "Auto builder materializes every queue family with lightweight payloads. Detailed context is hydrated later at mining time, preventing repeated manual chunk clicking and reducing Worker/D1 pressure. No Gemini calls, no factor scoring, no prop ranking."
  };
}

async function runBoardQueuePipeline(input, env) {
  const result = await runBoardQueueAutoBuild({ ...input, job: "run_board_queue_pipeline", max_passes: input.max_passes || 8 }, env);
  return {
    ok: Boolean(result && result.ok),
    job: "run_board_queue_pipeline",
    version: SYSTEM_VERSION,
    status: result && result.ok ? "pass" : "review",
    slate_date: result?.slate_date || resolveSlateDate(input).slate_date,
    board_queue_auto_build: result,
    note: "Scheduled board queue pipeline auto-prepared lightweight queue payloads across all supported families. No Gemini calls, no factor scoring, no prop ranking."
  };
}


const STATIC_GROUP_COUNT = 6;

function staticGroupFromJob(job, prefix) {
  const re = new RegExp(`^${prefix}_g([1-${STATIC_GROUP_COUNT}])$`);
  const m = String(job || '').match(re);
  return m ? Number(m[1]) : null;
}

function groupSlice(rows, group) {
  const sorted = [...(rows || [])];
  if (!group) return sorted;
  const size = Math.ceil(sorted.length / STATIC_GROUP_COUNT);
  const start = (group - 1) * size;
  return sorted.slice(start, start + size);
}

function selectStaticGroupRows(rows, group) {
  const sorted = [...(rows || [])].sort((a, b) => String(a.player_name || '').localeCompare(String(b.player_name || '')) || Number(a.player_id || 0) - Number(b.player_id || 0));
  if (!group) return sorted;
  const size = Math.ceil(sorted.length / STATIC_GROUP_COUNT);
  const start = (group - 1) * size;
  return sorted.slice(start, start + size);
}

async function tableExists(env, tableName) {
  const row = await env.DB.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE type='table' AND name=?").bind(tableName).first();
  return Number(row?.c || 0) > 0;
}

async function ensureStaticReferenceTables(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ref_venues (
      venue_id INTEGER PRIMARY KEY,
      team_id TEXT,
      mlb_venue_name TEXT,
      city TEXT,
      state TEXT,
      roof_status TEXT,
      surface_type TEXT,
      altitude_ft INTEGER,
      left_field_dimension_ft INTEGER,
      center_field_dimension_ft INTEGER,
      right_field_dimension_ft INTEGER,
      source_name TEXT,
      source_confidence TEXT,
      notes TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ref_team_aliases (
      alias_type TEXT NOT NULL,
      raw_alias TEXT NOT NULL,
      canonical_name TEXT,
      canonical_team_id TEXT,
      mlb_id INTEGER,
      confidence TEXT,
      action TEXT,
      notes TEXT,
      source_name TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (alias_type, raw_alias)
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ref_players (
      player_id INTEGER PRIMARY KEY,
      mlb_id INTEGER,
      player_name TEXT,
      team_id TEXT,
      primary_position TEXT,
      role TEXT,
      bats TEXT,
      throws TEXT,
      birth_date TEXT,
      age INTEGER,
      active INTEGER DEFAULT 1,
      source_name TEXT,
      source_confidence TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ref_player_splits (
      player_id INTEGER NOT NULL,
      season INTEGER NOT NULL,
      group_type TEXT NOT NULL,
      split_code TEXT NOT NULL,
      split_description TEXT,
      pa INTEGER,
      ab INTEGER,
      hits INTEGER,
      doubles INTEGER,
      triples INTEGER,
      home_runs INTEGER,
      strikeouts INTEGER,
      walks INTEGER,
      avg TEXT,
      obp TEXT,
      slg TEXT,
      ops TEXT,
      babip TEXT,
      source_name TEXT,
      source_confidence TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (player_id, season, group_type, split_code)
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS static_scrape_progress (
      scrape_domain TEXT NOT NULL,
      season INTEGER NOT NULL,
      group_no INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      player_name TEXT,
      status TEXT NOT NULL,
      detail TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (scrape_domain, season, group_no, player_id)
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS player_game_logs (
      player_id INTEGER NOT NULL,
      game_pk INTEGER NOT NULL,
      season INTEGER NOT NULL,
      game_date TEXT,
      team_id TEXT,
      opponent_team TEXT,
      group_type TEXT NOT NULL,
      is_home INTEGER,
      pa INTEGER,
      ab INTEGER,
      hits INTEGER,
      doubles INTEGER,
      triples INTEGER,
      home_runs INTEGER,
      strikeouts INTEGER,
      walks INTEGER,
      innings_pitched TEXT,
      raw_json TEXT,
      source_name TEXT,
      source_confidence TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (player_id, game_pk, group_type)
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ref_bvp_history (
      slate_date TEXT NOT NULL,
      batter_id INTEGER NOT NULL,
      pitcher_id INTEGER NOT NULL,
      batter_name TEXT,
      pitcher_name TEXT,
      batter_team TEXT,
      pitcher_team TEXT,
      pa INTEGER,
      ab INTEGER,
      hits INTEGER,
      doubles INTEGER,
      triples INTEGER,
      home_runs INTEGER,
      strikeouts INTEGER,
      walks INTEGER,
      raw_json TEXT,
      source_name TEXT,
      source_confidence TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (slate_date, batter_id, pitcher_id)
    )
  `).run();
}

const STATIC_VENUE_SUPPLEMENT = {
  22: { altitude_ft: 267, left_field_dimension_ft: 330, center_field_dimension_ft: 395, right_field_dimension_ft: 330, notes: "Supplemental controlled venue source; values not independently verified by Gemini." },
  19: { altitude_ft: 5200, left_field_dimension_ft: 347, center_field_dimension_ft: 415, right_field_dimension_ft: 350, notes: "Supplemental controlled venue source; values not independently verified by Gemini." },
  680: { altitude_ft: 10, left_field_dimension_ft: 331, center_field_dimension_ft: 401, right_field_dimension_ft: 326, notes: "Supplemental controlled venue source; values not independently verified by Gemini." },
  14: { altitude_ft: 250, left_field_dimension_ft: 328, center_field_dimension_ft: 400, right_field_dimension_ft: 328, notes: "Supplemental controlled venue source; values not independently verified by Gemini." },
  2530: { altitude_ft: 25, left_field_dimension_ft: 318, center_field_dimension_ft: 408, right_field_dimension_ft: 314, notes: "Supplemental controlled venue source; values not independently verified by Gemini." }
};
const STATIC_TEAM_VENUE_OVERRIDES = {
  TB: { venue_id: 2530, name: "George M. Steinbrenner Field", city: "Tampa", state: "FL", roof_status: "Open", surface_type: "Grass", notes: "Controlled override for Rays temporary home; MLB team endpoint may still report Tropicana Field." }
};


async function fetchMlbTeamsForStatic() {
  const fetched = await fetchJsonWithRetry("https://statsapi.mlb.com/api/v1/teams?sportId=1&activeStatus=Y", {}, 3, "mlb_static_teams");
  if (!fetched.ok) throw new Error(fetched.error || "MLB teams fetch failed");
  return (fetched.data?.teams || []).filter(t => MLB_TEAM_ABBR[t.id]);
}

function normalizeRoleFromPosition(pos, throws) {
  return String(pos || '').toUpperCase() === 'P' ? 'PITCHER' : 'BATTER';
}

async function syncStaticVenues(input, env) {
  await ensureStaticReferenceTables(env);
  const teams = await fetchMlbTeamsForStatic();
  await env.DB.prepare("DELETE FROM ref_venues").run();
  const stmt = env.DB.prepare(`
    INSERT OR REPLACE INTO ref_venues (
      venue_id, team_id, mlb_venue_name, city, state, roof_status, surface_type,
      altitude_ft, left_field_dimension_ft, center_field_dimension_ft, right_field_dimension_ft,
      source_name, source_confidence, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  let inserted = 0;
  const audit = [];
  for (const t of teams) {
    const teamId = MLB_TEAM_ABBR[t.id];
    const venueOverride = STATIC_TEAM_VENUE_OVERRIDES[teamId] || null;
    let venueId = venueOverride?.venue_id ? Number(venueOverride.venue_id) : Number(t?.venue?.id || 0);
    let venue = venueOverride ? {
      id: venueId,
      name: venueOverride.name,
      location: { city: venueOverride.city, state: venueOverride.state, stateAbbrev: venueOverride.state },
      fieldInfo: { roofType: venueOverride.roof_status, turfType: venueOverride.surface_type }
    } : (t.venue || {});
    if (venueId) {
      const vf = await fetchJsonWithRetry(`https://statsapi.mlb.com/api/v1/venues/${venueId}`, {}, 2, `mlb_venue_${venueId}`);
      if (vf.ok && Array.isArray(vf.data?.venues) && vf.data.venues[0]) venue = { ...venue, ...vf.data.venues[0] };
    }
    if (venueOverride) {
      venue = {
        ...venue,
        name: venueOverride.name,
        location: { ...(venue.location || {}), city: venueOverride.city, state: venueOverride.state, stateAbbrev: venueOverride.state },
        fieldInfo: { ...(venue.fieldInfo || {}), roofType: venueOverride.roof_status, turfType: venueOverride.surface_type }
      };
    }
    const sup = STATIC_VENUE_SUPPLEMENT[venueId] || {};
    const fieldInfo = venue.fieldInfo || {};
    const roof = fieldInfo.roofType || fieldInfo.roof || venue.roofType || null;
    const turf = fieldInfo.turfType || fieldInfo.surface || venue.turfType || null;
    const loc = venue.location || t.location || {};
    const res = await stmt.bind(
      venueId || null,
      teamId,
      venue.name || t?.venue?.name || null,
      loc.city || t?.venue?.location?.city || null,
      loc.stateAbbrev || loc.state || null,
      roof,
      turf,
      sup.altitude_ft ?? null,
      sup.left_field_dimension_ft ?? null,
      sup.center_field_dimension_ft ?? null,
      sup.right_field_dimension_ft ?? null,
      sup.altitude_ft ? "mlb_statsapi_plus_controlled_static_venue_source" : "mlb_statsapi_venue_basic",
      sup.altitude_ft ? "HIGH_FOR_API_FIELDS_MEDIUM_FOR_SUPPLEMENTAL" : "HIGH_FOR_API_FIELDS",
      venueOverride?.notes || sup.notes || "MLB StatsAPI venue basic fields; supplemental dimensions not available.",
    ).run();
    inserted += Number(res?.meta?.changes || 0);
    audit.push({ team_id: teamId, venue_id: venueId, venue_name: venue.name || null, supplemental_static: Boolean(sup.altitude_ft), override_applied: Boolean(venueOverride) });
  }
  return { ok: true, job: input.job || "scrape_static_venues", version: SYSTEM_VERSION, status: "pass", table: "ref_venues", fetched_teams: teams.length, inserted_rows: inserted, audit, estimated_seconds: "5-15 seconds", note: "Wiped and rebuilt ref_venues. MLB StatsAPI is source for official venue basics; controlled overrides/supplemental fields are only present where explicitly mapped." };
}

async function syncStaticTeamAliases(input, env) {
  await ensureStaticReferenceTables(env);
  const teams = await fetchMlbTeamsForStatic();
  await env.DB.prepare("DELETE FROM ref_team_aliases").run();
  const stmt = env.DB.prepare(`INSERT OR REPLACE INTO ref_team_aliases (alias_type, raw_alias, canonical_name, canonical_team_id, mlb_id, confidence, action, notes, source_name, updated_at) VALUES ('team', ?, ?, ?, ?, ?, ?, ?, 'mlb_statsapi_team_alias_seed', CURRENT_TIMESTAMP)`);
  let inserted = 0;
  for (const t of teams) {
    const teamId = MLB_TEAM_ABBR[t.id];
    const aliases = [teamId, t.abbreviation, t.teamName, t.name, t.shortName, t.fileCode].filter(Boolean);
    const seen = new Set();
    for (const a of aliases) {
      const raw = String(a).trim();
      if (!raw || seen.has(raw.toLowerCase())) continue;
      seen.add(raw.toLowerCase());
      const res = await stmt.bind(raw, t.name || null, teamId, Number(t.id), "HIGH", "map", "Official or direct MLB StatsAPI team alias.").run();
      inserted += Number(res?.meta?.changes || 0);
    }
  }
  // Ambiguous manual review aliases
  const reviewAliases = [
    ["LA", "Los Angeles Dodgers / Los Angeles Angels", null, null, "MEDIUM", "review", "Ambiguous; requires source context."],
    ["NY", "New York Mets / New York Yankees", null, null, "MEDIUM", "review", "Ambiguous; requires source context."],
    ["AZ", "Arizona Diamondbacks", "ARI", 109, "HIGH", "map", "Common non-MLB shorthand for ARI."]
  ];
  for (const r of reviewAliases) {
    const res = await stmt.bind(...r).run();
    inserted += Number(res?.meta?.changes || 0);
  }
  return { ok: true, job: input.job || "scrape_static_team_aliases", version: SYSTEM_VERSION, status: "pass", table: "ref_team_aliases", teams: teams.length, inserted_rows: inserted, estimated_seconds: "3-10 seconds", note: "Wiped and rebuilt team alias dictionary. Ambiguous aliases are marked review, not forced." };
}

async function syncStaticPlayers(input, env) {
  await ensureStaticReferenceTables(env);
  const season = Number(String(resolveSlateDate(input || {}).slate_date).slice(0,4));
  const allTeams = await fetchMlbTeamsForStatic();
  const groupMatch = String(input?.job || '').match(/scrape_static_players_g([1-6])$/);
  const group = groupMatch ? Number(groupMatch[1]) : null;
  const teams = group ? groupSlice(allTeams, group) : allTeams;
  if (group === 1 || !group) await env.DB.prepare("DELETE FROM ref_players").run();
  const stmt = env.DB.prepare(`
    INSERT OR REPLACE INTO ref_players (player_id, mlb_id, player_name, team_id, primary_position, role, bats, throws, birth_date, age, active, source_name, source_confidence, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'mlb_statsapi_active_roster_reference', 'HIGH', CURRENT_TIMESTAMP)
  `);
  let inserted = 0;
  const audit = [];
  for (const t of teams) {
    const teamId = MLB_TEAM_ABBR[t.id];
    const url = `https://statsapi.mlb.com/api/v1/teams/${encodeURIComponent(t.id)}/roster?rosterType=active&hydrate=person`;
    const fetched = await fetchJsonWithRetry(url, {}, 3, `static_roster_${teamId}`);
    audit.push({ team_id: teamId, ok: fetched.ok, error: fetched.error || null, roster_rows: fetched.data?.roster?.length || 0 });
    if (!fetched.ok) continue;
    for (const entry of (fetched.data?.roster || [])) {
      const person = entry.person || {};
      const pos = entry.position || person.primaryPosition || {};
      const playerId = Number(person.id || 0);
      if (!playerId || !person.fullName) continue;
      const primary = pos.abbreviation || pos.code || null;
      const res = await stmt.bind(
        playerId, playerId, person.fullName, teamId, primary,
        normalizeRoleFromPosition(primary, person?.pitchHand?.code),
        person?.batSide?.code || null,
        person?.pitchHand?.code || null,
        person?.birthDate || null,
        ageFromBirthDate(person?.birthDate),
      ).run();
      inserted += Number(res?.meta?.changes || 0);
    }
  }
  const afterCount = await staticTableCount(env, "ref_players");
  const failedTeams = audit.filter(a => !a.ok).length;
  return {
    ok: inserted > 0 && failedTeams === 0,
    job: input.job || "scrape_static_players",
    version: SYSTEM_VERSION,
    status: failedTeams ? "partial_subrequest_safe_retry_needed" : (inserted > 0 ? "pass" : "empty"),
    table: "ref_players",
    season,
    group,
    teams_total: allTeams.length,
    teams_checked: teams.length,
    inserted_rows: inserted,
    total_ref_players_after: afterCount.rows_count,
    failed_teams: failedTeams,
    team_audit: audit,
    estimated_seconds: group ? "10-25 seconds per group" : "may exceed subrequest limits; prefer G1-G6",
    note: group ? "Chunked static player scrape. G1 wipes ref_players, G2-G6 append. Pitchers are stored with role=PITCHER." : "Legacy all-team static player scrape. Prefer G1-G6 to avoid Cloudflare subrequest limits. Pitchers are stored with role=PITCHER."
  };
}

function extractSplitCode(split) {
  const raw = String(split?.split?.description || split?.split?.code || split?.type?.displayName || '').toLowerCase();
  if (raw.includes('vs left') || raw.includes('left')) return 'vs_left';
  if (raw.includes('vs right') || raw.includes('right')) return 'vs_right';
  if (raw.includes('home')) return 'home';
  if (raw.includes('away')) return 'away';
  return raw ? raw.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') : 'unknown';
}

function splitRowFromStat(player, season, groupType, split) {
  const st = split?.stat || {};
  return {
    player_id: Number(player.player_id), season, group_type: groupType, split_code: extractSplitCode(split),
    split_description: split?.split?.description || split?.split?.code || null,
    pa: st.plateAppearances !== undefined ? Number(st.plateAppearances) : null,
    ab: st.atBats !== undefined ? Number(st.atBats) : null,
    hits: st.hits !== undefined ? Number(st.hits) : null,
    doubles: st.doubles !== undefined ? Number(st.doubles) : null,
    triples: st.triples !== undefined ? Number(st.triples) : null,
    home_runs: st.homeRuns !== undefined ? Number(st.homeRuns) : null,
    strikeouts: st.strikeOuts !== undefined ? Number(st.strikeOuts) : null,
    walks: st.baseOnBalls !== undefined ? Number(st.baseOnBalls) : null,
    avg: st.avg ?? null, obp: st.obp ?? null, slg: st.slg ?? null, ops: st.ops ?? null, babip: st.babip ?? null
  };
}

function splitSitCodesForGroup(groupType) {
  return groupType === 'pitching' ? 'vl,vr' : 'vl,vr';
}

async function markStaticProgress(env, domain, season, groupNo, player, status, detail) {
  await env.DB.prepare(`
    INSERT OR REPLACE INTO static_scrape_progress (scrape_domain, season, group_no, player_id, player_name, status, detail, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(domain, Number(season), Number(groupNo || 0), Number(player.player_id), player.player_name || null, status, detail ? String(detail).slice(0, 500) : null).run();
}

async function staticProgressMap(env, domain, season, groupNo) {
  const rows = await env.DB.prepare("SELECT player_id, status FROM static_scrape_progress WHERE scrape_domain=? AND season=? AND group_no=?").bind(domain, Number(season), Number(groupNo || 0)).all();
  const m = new Map();
  for (const r of (rows.results || [])) m.set(Number(r.player_id), String(r.status || ''));
  return m;
}

function prioritizedSplitTestPlayers(rows) {
  const wanted = new Set(['Shohei Ohtani','Aaron Judge','Paul Goldschmidt','Jose Altuve','Chris Sale']);
  const top = (rows || []).filter(r => wanted.has(String(r.player_name || '')));
  const seen = new Set(top.map(r => Number(r.player_id)));
  for (const r of (rows || [])) {
    if (top.length >= 5) break;
    const id = Number(r.player_id);
    if (!seen.has(id)) { top.push(r); seen.add(id); }
  }
  return top.slice(0, 5);
}

async function syncStaticPlayerSplits(input, env) {
  await ensureStaticReferenceTables(env);
  const season = Number(String(resolveSlateDate(input || {}).slate_date).slice(0,4));
  const isTest = String(input?.job || '') === 'scrape_static_player_splits_test_5';
  const group = isTest ? 0 : (staticGroupFromJob(input.job, 'scrape_static_player_splits') || 1);
  const hardLimit = isTest ? 5 : Math.max(1, Math.min(Number(input?.limit || 10), 15));

  let resetPerformed = false;
  let resetReason = null;
  if (group === 1 && !isTest) {
    const progressCountRow = await env.DB.prepare("SELECT COUNT(*) AS rows_count FROM static_scrape_progress WHERE scrape_domain='player_splits' AND season=? AND group_no=1").bind(season).first();
    const progressRowsBefore = Number(progressCountRow?.rows_count || 0);
    const splitCountBefore = await staticTableCount(env, "ref_player_splits");

    // G1 is both the rebuild starter and the resumable first group.
    // It must wipe only before the first real G1 batch. Repeated G1 clicks must resume.
    if (progressRowsBefore === 0 || (progressRowsBefore > 0 && Number(splitCountBefore.rows_count || 0) === 0)) {
      await env.DB.prepare("DELETE FROM ref_player_splits").run();
      await env.DB.prepare("DELETE FROM static_scrape_progress WHERE scrape_domain='player_splits' AND season=?").bind(season).run();
      resetPerformed = true;
      resetReason = progressRowsBefore === 0
        ? "fresh_group_1_start_no_existing_group_1_progress"
        : "progress_existed_but_split_table_was_empty_forced_clean_restart";
    }
  }

  const all = await env.DB.prepare("SELECT player_id, player_name, team_id, role FROM ref_players WHERE active=1 ORDER BY player_name").all();
  const baseRows = isTest ? prioritizedSplitTestPlayers(all.results || []) : selectStaticGroupRows(all.results || [], group);
  const progress = await staticProgressMap(env, 'player_splits', season, group);
  const eligible = baseRows.filter(p => !['COMPLETED','NO_DATA'].includes(progress.get(Number(p.player_id))));
  const selected = eligible.slice(0, hardLimit);

  const stmt = env.DB.prepare(`
    INSERT OR REPLACE INTO ref_player_splits (player_id, season, group_type, split_code, split_description, pa, ab, hits, doubles, triples, home_runs, strikeouts, walks, avg, obp, slg, ops, babip, source_name, source_confidence, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'mlb_statsapi_statSplits_sitCodes_vl_vr', 'MEDIUM_API_STANDARD_SPLITS', CURRENT_TIMESTAMP)
  `);

  let inserted = 0, successfulFetches = 0, failedFetches = 0, skippedNoSplits = 0, playersCompleted = 0;
  const errors = [];
  const noSplitSamples = [];

  for (const player of selected) {
    const groupType = player.role === 'PITCHER' ? 'pitching' : 'hitting';
    const sitCodes = splitSitCodesForGroup(groupType);
    const url = `https://statsapi.mlb.com/api/v1/people/${encodeURIComponent(player.player_id)}/stats?stats=statSplits&group=${groupType}&season=${season}&sitCodes=${encodeURIComponent(sitCodes)}`;
    const fetched = await fetchJsonWithRetry(url, {}, 1, `static_splits_${player.player_id}_${groupType}`);
    if (!fetched.ok) {
      failedFetches += 1;
      errors.push({ player_id: player.player_id, player_name: player.player_name, group_type: groupType, error: fetched.error });
      await markStaticProgress(env, 'player_splits', season, group, player, 'ERROR_RETRYABLE', fetched.error);
      continue;
    }
    successfulFetches += 1;
    const splits = fetched.data?.stats?.[0]?.splits || [];
    if (!splits.length) {
      skippedNoSplits += 1;
      noSplitSamples.push({ player_id: player.player_id, player_name: player.player_name, group_type: groupType });
      await markStaticProgress(env, 'player_splits', season, group, player, 'NO_DATA', 'StatsAPI returned zero statSplits for explicit sitCodes=vl,vr');
      continue;
    }
    let playerInserted = 0;
    for (const split of splits) {
      const r = splitRowFromStat(player, season, groupType, split);
      if (r.split_code === 'unknown') continue;
      const res = await stmt.bind(r.player_id, r.season, r.group_type, r.split_code, r.split_description, r.pa, r.ab, r.hits, r.doubles, r.triples, r.home_runs, r.strikeouts, r.walks, r.avg, r.obp, r.slg, r.ops, r.babip).run();
      const changes = Number(res?.meta?.changes || 0);
      inserted += changes;
      playerInserted += changes;
    }
    if (playerInserted > 0) {
      playersCompleted += 1;
      await markStaticProgress(env, 'player_splits', season, group, player, 'COMPLETED', `${playerInserted} split rows inserted`);
    } else {
      skippedNoSplits += 1;
      await markStaticProgress(env, 'player_splits', season, group, player, 'NO_INSERT', 'StatsAPI returned splits but no recognized split_code rows inserted');
    }
  }

  const afterCount = await staticTableCount(env, "ref_player_splits");
  const remainingInGroup = Math.max(0, eligible.length - selected.length);
  const status = failedFetches > 0 ? 'partial_retry_needed' : (remainingInGroup > 0 ? 'partial_continue' : (inserted > 0 || afterCount.rows_count > 0 ? 'pass' : 'empty_no_data'));
  const dataOk = Number(afterCount.rows_count || 0) > 0 && failedFetches === 0;
  return {
    ok: failedFetches === 0, data_ok: dataOk, job: input.job || "scrape_static_player_splits_g1", version: SYSTEM_VERSION, status, table: "ref_player_splits", season, group, group_count: STATIC_GROUP_COUNT, selected_players_total: baseRows.length, eligible_before_this_run: eligible.length, batch_limit: hardLimit, attempted_players: selected.length, successful_fetch_count: successfulFetches, failed_fetch_count: failedFetches, inserted_rows: inserted, total_ref_player_splits_after: afterCount.rows_count, players_completed_this_run: playersCompleted, skipped_players_no_splits: skippedNoSplits, remaining_in_group_after: remainingInGroup, needs_continue: remainingInGroup > 0, api_endpoint_pattern: "/api/v1/people/{playerId}/stats?stats=statSplits&group={hitting|pitching}&season={season}&sitCodes=vl,vr", root_cause_fixed: "v1.2.73 used no sitCodes and selected 130 players per group, causing zero-row responses plus Cloudflare subrequest exhaustion. v1.2.74 added sitCodes and small batches. v1.2.75 fixes the G1 resume bug where every G1 click wiped progress before selecting the next batch.", reset_performed: resetPerformed, reset_reason: resetReason, errors: errors.slice(0, 10), no_split_samples: noSplitSamples.slice(0, 10), estimated_seconds: isTest ? "5-15 seconds" : "10-25 seconds per resumable batch", note: isTest ? "Safe 5-player split smoke test. Does not wipe ref_player_splits." : "Resumable static split scrape. Run the same G button until remaining_in_group_after is 0, then move to the next group. G1 wipes only on a fresh G1 start with no existing G1 progress, then resumes safely on repeated clicks."
  };
}

async function syncStaticPlayerGameLogs(input, env) {
  await ensureStaticReferenceTables(env);
  const season = Number(String(resolveSlateDate(input || {}).slate_date).slice(0,4));
  const group = staticGroupFromJob(input.job, 'scrape_static_game_logs') || 1;
  const hardLimit = Math.max(1, Math.min(Number(input?.limit || 5), 5));

  let resetPerformed = false;
  let resetReason = null;
  if (group === 1) {
    const progressCountRow = await env.DB.prepare("SELECT COUNT(*) AS rows_count FROM static_scrape_progress WHERE scrape_domain='player_game_logs' AND season=? AND group_no=1").bind(season).first();
    const progressRowsBefore = Number(progressCountRow?.rows_count || 0);
    const logCountBefore = await staticTableCount(env, "player_game_logs");

    // G1 is both the rebuild starter and the resumable first group.
    // It must wipe only before the first real G1 batch. Repeated G1 clicks must resume.
    if (progressRowsBefore === 0 || (progressRowsBefore > 0 && Number(logCountBefore.rows_count || 0) === 0)) {
      await env.DB.prepare("DELETE FROM player_game_logs").run();
      await env.DB.prepare("DELETE FROM static_scrape_progress WHERE scrape_domain='player_game_logs' AND season=?").bind(season).run();
      resetPerformed = true;
      resetReason = progressRowsBefore === 0
        ? "fresh_group_1_start_no_existing_group_1_progress"
        : "progress_existed_but_game_log_table_was_empty_forced_clean_restart";
    }
  }

  const all = await env.DB.prepare("SELECT player_id, player_name, team_id, role FROM ref_players WHERE active=1 ORDER BY player_name").all();
  const baseRows = selectStaticGroupRows(all.results || [], group);
  const progress = await staticProgressMap(env, 'player_game_logs', season, group);
  const eligible = baseRows.filter(p => !['COMPLETED','NO_DATA'].includes(progress.get(Number(p.player_id))));
  const selected = eligible.slice(0, hardLimit);

  const stmt = env.DB.prepare(`
    INSERT OR REPLACE INTO player_game_logs (player_id, game_pk, season, game_date, team_id, opponent_team, group_type, is_home, pa, ab, hits, doubles, triples, home_runs, strikeouts, walks, innings_pitched, raw_json, source_name, source_confidence, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'mlb_statsapi_gameLog', 'HIGH', CURRENT_TIMESTAMP)
  `);

  let inserted = 0, successfulFetches = 0, failedFetches = 0, skippedNoLogs = 0, playersCompleted = 0;
  const errors = [];
  const noLogSamples = [];

  for (const player of selected) {
    const groupType = player.role === 'PITCHER' ? 'pitching' : 'hitting';
    const url = `https://statsapi.mlb.com/api/v1/people/${encodeURIComponent(player.player_id)}/stats?stats=gameLog&group=${groupType}&season=${season}`;
    const fetched = await fetchJsonWithRetry(url, {}, 1, `static_gamelog_${player.player_id}_${groupType}`);
    if (!fetched.ok) {
      failedFetches += 1;
      errors.push({ player_id: player.player_id, player_name: player.player_name, group_type: groupType, error: fetched.error });
      await markStaticProgress(env, 'player_game_logs', season, group, player, 'ERROR_RETRYABLE', fetched.error);
      continue;
    }
    successfulFetches += 1;
    const logs = fetched.data?.stats?.[0]?.splits || [];
    if (!logs.length) {
      skippedNoLogs += 1;
      noLogSamples.push({ player_id: player.player_id, player_name: player.player_name, group_type: groupType });
      await markStaticProgress(env, 'player_game_logs', season, group, player, 'NO_DATA', 'StatsAPI returned zero gameLog splits for this player/season/group');
      continue;
    }

    let playerInserted = 0;
    for (const split of logs) {
      const st = split.stat || {};
      const gamePk = Number(split?.game?.gamePk || split?.game?.pk || 0);
      if (!gamePk) continue;
      const opponent = split?.opponent?.abbreviation || split?.opponent?.name || null;
      const isHome = split?.isHome === true ? 1 : split?.isHome === false ? 0 : null;
      const res = await stmt.bind(
        Number(player.player_id), gamePk, season, split?.date || null, player.team_id || null, opponent,
        groupType, isHome,
        st.plateAppearances !== undefined ? Number(st.plateAppearances) : null,
        st.atBats !== undefined ? Number(st.atBats) : null,
        st.hits !== undefined ? Number(st.hits) : null,
        st.doubles !== undefined ? Number(st.doubles) : null,
        st.triples !== undefined ? Number(st.triples) : null,
        st.homeRuns !== undefined ? Number(st.homeRuns) : null,
        st.strikeOuts !== undefined ? Number(st.strikeOuts) : null,
        st.baseOnBalls !== undefined ? Number(st.baseOnBalls) : null,
        st.inningsPitched ?? null,
        JSON.stringify(split).slice(0, 10000)
      ).run();
      const changes = Number(res?.meta?.changes || 0);
      inserted += changes;
      playerInserted += changes;
    }

    if (playerInserted > 0) {
      playersCompleted += 1;
      await markStaticProgress(env, 'player_game_logs', season, group, player, 'COMPLETED', `${playerInserted} game log rows inserted`);
    } else {
      skippedNoLogs += 1;
      await markStaticProgress(env, 'player_game_logs', season, group, player, 'NO_INSERT', 'StatsAPI returned logs but no recognized game_pk rows inserted');
    }
  }

  const afterCount = await staticTableCount(env, "player_game_logs");
  const remainingInGroup = Math.max(0, eligible.length - selected.length);
  const status = failedFetches > 0 ? 'partial_retry_needed' : (remainingInGroup > 0 ? 'partial_continue' : (inserted > 0 || Number(afterCount.rows_count || 0) > 0 ? 'pass' : 'empty_no_data'));
  const dataOk = Number(afterCount.rows_count || 0) > 0 && failedFetches === 0;
  return {
    ok: failedFetches === 0,
    data_ok: dataOk,
    job: input.job || "scrape_static_game_logs_g1",
    version: SYSTEM_VERSION,
    status,
    table: "player_game_logs",
    season,
    group,
    group_count: STATIC_GROUP_COUNT,
    selected_players_total: baseRows.length,
    eligible_before_this_run: eligible.length,
    batch_limit: hardLimit,
    attempted_players: selected.length,
    successful_fetch_count: successfulFetches,
    failed_fetch_count: failedFetches,
    inserted_rows: inserted,
    total_player_game_logs_after: afterCount.rows_count,
    players_completed_this_run: playersCompleted,
    skipped_players_no_logs: skippedNoLogs,
    remaining_in_group_after: remainingInGroup,
    needs_continue: remainingInGroup > 0,
    api_endpoint_pattern: "/api/v1/people/{playerId}/stats?stats=gameLog&group={hitting|pitching}&season={season}",
    root_cause_fixed: "v1.2.76 selected a full 130-player static group and fetched until Cloudflare subrequest exhaustion. v1.2.77 added resumable 10-player batches. v1.2.78 reduces game-log batches to 5 players and adds a same-job running guard to stop duplicate Safari retry tasks.",
    reset_performed: resetPerformed,
    reset_reason: resetReason,
    errors: errors.slice(0, 10),
    no_log_samples: noLogSamples.slice(0, 10),
    estimated_seconds: "8-25 seconds per 5-player resumable batch",
    note: "Resumable static game-log scrape. Run the same G button until remaining_in_group_after is 0, then move to the next group. v1.2.78 uses 5-player batches to avoid Safari/Worker load failures. G1 wipes only on a fresh G1 start with no existing G1 progress. Rolling 20/10/5 windows should be derived internally later."
  };
}

function normalizeNameKey(name) { return String(name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim(); }

async function findRefPlayerByNameTeam(env, name, teamId = null) {
  const rows = await env.DB.prepare("SELECT * FROM ref_players WHERE team_id = COALESCE(?, team_id) ORDER BY player_name").bind(teamId).all();
  const target = normalizeNameKey(name);
  return (rows.results || []).find(r => normalizeNameKey(r.player_name) === target) || null;
}

function stablePositiveIntKey(value) {
  const text = String(value || '');
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
}

async function syncStaticBvpCurrentSlate(input, env) {
  await ensureStaticReferenceTables(env);
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;
  const slateKey = Number(String(slateDate).replace(/-/g, ''));
  const hardLimit = Math.max(1, Math.min(Number(input?.limit || 5), 5));

  let resetPerformed = false;
  let resetReason = null;
  const progressCountRow = await env.DB.prepare("SELECT COUNT(*) AS rows_count FROM static_scrape_progress WHERE scrape_domain='bvp_current_slate' AND season=? AND group_no=0").bind(slateKey).first().catch(() => ({ rows_count: 0 }));
  const progressRowsBefore = Number(progressCountRow?.rows_count || 0);
  const existingRows = await env.DB.prepare("SELECT COUNT(*) AS rows_count FROM ref_bvp_history WHERE slate_date=?").bind(slateDate).first().catch(() => ({ rows_count: 0 }));
  if (progressRowsBefore === 0 || (progressRowsBefore > 0 && Number(existingRows?.rows_count || 0) === 0)) {
    await env.DB.prepare("DELETE FROM ref_bvp_history WHERE slate_date=?").bind(slateDate).run();
    await env.DB.prepare("DELETE FROM static_scrape_progress WHERE scrape_domain='bvp_current_slate' AND season=? AND group_no=0").bind(slateKey).run();
    resetPerformed = true;
    resetReason = progressRowsBefore === 0 ? 'fresh_bvp_slate_start_no_existing_progress' : 'progress_existed_but_bvp_table_empty_forced_clean_restart';
  }

  const rawLegs = await env.DB.prepare("SELECT player_name, team, opponent FROM mlb_stats WHERE COALESCE(player_name,'') NOT LIKE '%+%' AND COALESCE(team,'') <> '' GROUP BY player_name, team, opponent ORDER BY player_name LIMIT 500").all().catch(() => ({ results: [] }));
  const candidates = (rawLegs.results || []).map((leg, idx) => {
    const keyText = `${slateDate}|${idx}|${leg.player_name}|${leg.team}|${leg.opponent}`;
    return { ...leg, pair_key: stablePositiveIntKey(keyText), pair_label: `${leg.player_name || 'UNKNOWN'}|${leg.team || ''}|${leg.opponent || ''}` };
  });
  const progress = await staticProgressMap(env, 'bvp_current_slate', slateKey, 0);
  const eligible = candidates.filter(c => !['COMPLETED','NO_DATA','NO_INSERT'].includes(progress.get(Number(c.pair_key))));
  const selected = eligible.slice(0, hardLimit);

  const games = await env.DB.prepare("SELECT * FROM games WHERE game_date=?").bind(slateDate).all().catch(() => ({ results: [] }));
  const starterRows = await env.DB.prepare("SELECT * FROM starters_current WHERE game_id LIKE ? AND starter_name IS NOT NULL AND starter_name NOT IN ('TBD','TBA','Unknown','Starter')").bind(`${slateDate}_%`).all().catch(() => ({ results: [] }));
  const gameByTeams = new Map();
  for (const g of games.results || []) {
    gameByTeams.set(`${g.away_team}|${g.home_team}`, g);
    gameByTeams.set(`${g.home_team}|${g.away_team}`, g);
  }
  const startersByGameTeam = new Map((starterRows.results || []).map(s => [`${s.game_id}|${s.team_id}`, s]));
  const stmt = env.DB.prepare(`
    INSERT OR REPLACE INTO ref_bvp_history (slate_date, batter_id, pitcher_id, batter_name, pitcher_name, batter_team, pitcher_team, pa, ab, hits, doubles, triples, home_runs, strikeouts, walks, raw_json, source_name, source_confidence, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'mlb_statsapi_vsPlayer', 'HIGH_DATA_LOW_SAMPLE_WARNING', CURRENT_TIMESTAMP)
  `);

  let inserted = 0, skipped = 0, attemptedPairs = 0, successfulFetches = 0, failedFetches = 0, pairsCompleted = 0;
  const errors = [];
  const skippedSamples = [];

  for (const leg of selected) {
    attemptedPairs += 1;
    const progressRef = { player_id: leg.pair_key, player_name: leg.pair_label };
    const batter = await findRefPlayerByNameTeam(env, leg.player_name, leg.team);
    if (!batter) { skipped++; skippedSamples.push({ pair: leg.pair_label, reason: 'batter_not_found' }); await markStaticProgress(env, 'bvp_current_slate', slateKey, 0, progressRef, 'NO_DATA', 'batter_not_found'); continue; }
    const g = gameByTeams.get(`${leg.team}|${leg.opponent}`);
    if (!g) { skipped++; skippedSamples.push({ pair: leg.pair_label, reason: 'game_not_found' }); await markStaticProgress(env, 'bvp_current_slate', slateKey, 0, progressRef, 'NO_DATA', 'game_not_found'); continue; }
    const starter = startersByGameTeam.get(`${g.game_id}|${leg.opponent}`);
    if (!starter) { skipped++; skippedSamples.push({ pair: leg.pair_label, reason: 'opponent_starter_not_found' }); await markStaticProgress(env, 'bvp_current_slate', slateKey, 0, progressRef, 'NO_DATA', 'opponent_starter_not_found'); continue; }
    const pitcher = await findRefPlayerByNameTeam(env, starter.starter_name, leg.opponent);
    if (!pitcher) { skipped++; skippedSamples.push({ pair: leg.pair_label, starter: starter.starter_name, reason: 'pitcher_not_found_in_ref_players' }); await markStaticProgress(env, 'bvp_current_slate', slateKey, 0, progressRef, 'NO_DATA', 'pitcher_not_found_in_ref_players'); continue; }

    const url = `https://statsapi.mlb.com/api/v1/people/${encodeURIComponent(batter.player_id)}/stats?stats=vsPlayer&opposingPlayerId=${encodeURIComponent(pitcher.player_id)}`;
    const fetched = await fetchJsonWithRetry(url, {}, 1, `bvp_${batter.player_id}_${pitcher.player_id}`);
    if (!fetched.ok) {
      failedFetches += 1;
      errors.push({ batter: batter.player_name, pitcher: pitcher.player_name, error: fetched.error });
      await markStaticProgress(env, 'bvp_current_slate', slateKey, 0, progressRef, 'ERROR_RETRYABLE', fetched.error);
      continue;
    }
    successfulFetches += 1;
    const split = fetched.data?.stats?.[0]?.splits?.[0] || {};
    const st = split.stat || {};
    const hasAnyHistory = Object.keys(st).length > 0 && (st.plateAppearances !== undefined || st.atBats !== undefined || st.hits !== undefined || st.homeRuns !== undefined || st.strikeOuts !== undefined || st.baseOnBalls !== undefined);
    if (!hasAnyHistory) {
      skipped++;
      skippedSamples.push({ batter: batter.player_name, pitcher: pitcher.player_name, reason: 'no_bvp_history_returned' });
      await markStaticProgress(env, 'bvp_current_slate', slateKey, 0, progressRef, 'NO_DATA', 'StatsAPI returned no BvP history for this pair');
      continue;
    }
    const res = await stmt.bind(
      slateDate, Number(batter.player_id), Number(pitcher.player_id), batter.player_name, pitcher.player_name, leg.team, leg.opponent,
      st.plateAppearances !== undefined ? Number(st.plateAppearances) : null,
      st.atBats !== undefined ? Number(st.atBats) : null,
      st.hits !== undefined ? Number(st.hits) : null,
      st.doubles !== undefined ? Number(st.doubles) : null,
      st.triples !== undefined ? Number(st.triples) : null,
      st.homeRuns !== undefined ? Number(st.homeRuns) : null,
      st.strikeOuts !== undefined ? Number(st.strikeOuts) : null,
      st.baseOnBalls !== undefined ? Number(st.baseOnBalls) : null,
      JSON.stringify(fetched.data || {}).slice(0,10000)
    ).run();
    const changes = Number(res?.meta?.changes || 0);
    inserted += changes;
    if (changes > 0) {
      pairsCompleted += 1;
      await markStaticProgress(env, 'bvp_current_slate', slateKey, 0, progressRef, 'COMPLETED', `${changes} BvP row inserted`);
    } else {
      skipped++;
      await markStaticProgress(env, 'bvp_current_slate', slateKey, 0, progressRef, 'NO_INSERT', 'BvP fetched but no DB change; likely duplicate existing row');
    }
  }

  const afterCount = await env.DB.prepare("SELECT COUNT(*) AS rows_count FROM ref_bvp_history WHERE slate_date=?").bind(slateDate).first().catch(() => ({ rows_count: 0 }));
  const remainingPairs = Math.max(0, eligible.length - selected.length);
  const status = failedFetches > 0 ? 'partial_retry_needed' : (remainingPairs > 0 ? 'partial_continue' : (Number(afterCount?.rows_count || 0) > 0 ? 'pass' : 'empty_no_bvp_history'));
  return {
    ok: failedFetches === 0,
    data_ok: Number(afterCount?.rows_count || 0) > 0 && failedFetches === 0,
    job: input.job || "scrape_static_bvp_current_slate",
    version: SYSTEM_VERSION,
    status,
    table: "ref_bvp_history",
    slate_date: slateDate,
    candidate_pairs: candidates.length,
    eligible_before_this_run: eligible.length,
    batch_limit: hardLimit,
    attempted_pairs: attemptedPairs,
    successful_fetch_count: successfulFetches,
    failed_fetch_count: failedFetches,
    inserted_rows: inserted,
    total_ref_bvp_history_after: Number(afterCount?.rows_count || 0),
    pairs_completed_this_run: pairsCompleted,
    skipped_pairs: skipped,
    remaining_pairs_after: remainingPairs,
    needs_continue: remainingPairs > 0,
    reset_performed: resetPerformed,
    reset_reason: resetReason,
    root_cause_fixed: "v1.2.78 tried up to 250 BvP pairs in one request, hit Cloudflare subrequest limits, and falsely returned pass. v1.2.79 uses 5-pair resumable batches plus same-job guard and scheduler pause.",
    errors: errors.slice(0, 10),
    skipped_samples: skippedSamples.slice(0, 10),
    estimated_seconds: "8-25 seconds per 5-pair resumable batch",
    note: "Resumable current-slate BvP scrape. Run BvP Slate until remaining_pairs_after is 0. BvP is a low-sample tiebreaker source; missing history is normal and marked NO_DATA. Static data is protected from scheduled tasks in v1.2.79."
  };
}

async function syncStaticAllFast(input, env) {
  const venues = await syncStaticVenues({ ...input, job: "scrape_static_venues" }, env);
  const aliases = await syncStaticTeamAliases({ ...input, job: "scrape_static_team_aliases" }, env);
  return {
    ok: Boolean(venues.ok && aliases.ok),
    job: input.job || "scrape_static_all_fast",
    version: SYSTEM_VERSION,
    status: "pass",
    steps: { venues, aliases, players: { skipped: true, reason: "Static players are chunked in v1.2.73. Run Players G1-G6 in order to avoid Cloudflare subrequest limits." } },
    estimated_seconds: "10-25 seconds",
    note: "Fast static foundation only: venues + team aliases. Static players are intentionally separated into Players G1-G6 chunk buttons."
  };
}


async function ensureStaticTempReferenceTables(env) {
  await ensureStaticReferenceTables(env);
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS ref_venues_temp (venue_id INTEGER PRIMARY KEY, team_id TEXT, mlb_venue_name TEXT, city TEXT, state TEXT, roof_status TEXT, surface_type TEXT, altitude_ft INTEGER, left_field_dimension_ft INTEGER, center_field_dimension_ft INTEGER, right_field_dimension_ft INTEGER, source_name TEXT, source_confidence TEXT, notes TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS ref_team_aliases_temp (alias_type TEXT NOT NULL, raw_alias TEXT NOT NULL, canonical_name TEXT, canonical_team_id TEXT, mlb_id INTEGER, confidence TEXT, action TEXT, notes TEXT, source_name TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (alias_type, raw_alias))`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS ref_players_temp (player_id INTEGER PRIMARY KEY, mlb_id INTEGER, player_name TEXT, team_id TEXT, primary_position TEXT, role TEXT, bats TEXT, throws TEXT, birth_date TEXT, age INTEGER, active INTEGER DEFAULT 1, source_name TEXT, source_confidence TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS static_temp_refresh_runs (request_id TEXT PRIMARY KEY, status TEXT NOT NULL, run_after TEXT, current_step TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, started_at TEXT, finished_at TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, output_json TEXT, error TEXT)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS static_temp_certification_audits (audit_id TEXT PRIMARY KEY, grade TEXT NOT NULL, data_ok INTEGER NOT NULL, status TEXT NOT NULL, temp_refresh_request_id TEXT, temp_refresh_finished_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, counts_json TEXT, failures_json TEXT, warnings_json TEXT, output_json TEXT)`).run();
}


async function syncStaticVenuesTemp(input, env) {
  await ensureStaticTempReferenceTables(env);
  const teams = await fetchMlbTeamsForStatic();
  await env.DB.prepare("DELETE FROM ref_venues_temp").run();
  const stmt = env.DB.prepare(`INSERT OR REPLACE INTO ref_venues_temp (venue_id, team_id, mlb_venue_name, city, state, roof_status, surface_type, altitude_ft, left_field_dimension_ft, center_field_dimension_ft, right_field_dimension_ft, source_name, source_confidence, notes, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`);
  let inserted = 0;
  const audit = [];
  for (const t of teams) {
    const teamId = MLB_TEAM_ABBR[t.id];
    const venueOverride = STATIC_TEAM_VENUE_OVERRIDES[teamId] || null;
    let venueId = venueOverride?.venue_id ? Number(venueOverride.venue_id) : Number(t?.venue?.id || 0);
    let venue = venueOverride ? { id: venueId, name: venueOverride.name, location: { city: venueOverride.city, state: venueOverride.state, stateAbbrev: venueOverride.state }, fieldInfo: { roofType: venueOverride.roof_status, turfType: venueOverride.surface_type } } : (t.venue || {});
    if (venueId) {
      const vf = await fetchJsonWithRetry(`https://statsapi.mlb.com/api/v1/venues/${venueId}`, {}, 2, `mlb_venue_temp_${venueId}`);
      if (vf.ok && Array.isArray(vf.data?.venues) && vf.data.venues[0]) venue = { ...venue, ...vf.data.venues[0] };
    }
    if (venueOverride) {
      venue = { ...venue, name: venueOverride.name, location: { ...(venue.location || {}), city: venueOverride.city, state: venueOverride.state, stateAbbrev: venueOverride.state }, fieldInfo: { ...(venue.fieldInfo || {}), roofType: venueOverride.roof_status, turfType: venueOverride.surface_type } };
    }
    const sup = STATIC_VENUE_SUPPLEMENT[venueId] || {};
    const fieldInfo = venue.fieldInfo || {};
    const roof = fieldInfo.roofType || fieldInfo.roof || venue.roofType || null;
    const turf = fieldInfo.turfType || fieldInfo.surface || venue.turfType || null;
    const loc = venue.location || t.location || {};
    const res = await stmt.bind(venueId || null, teamId, venue.name || t?.venue?.name || null, loc.city || t?.venue?.location?.city || null, loc.stateAbbrev || loc.state || null, roof, turf, sup.altitude_ft ?? null, sup.left_field_dimension_ft ?? null, sup.center_field_dimension_ft ?? null, sup.right_field_dimension_ft ?? null, sup.altitude_ft ? "mlb_statsapi_plus_controlled_static_venue_source" : "mlb_statsapi_venue_basic", sup.altitude_ft ? "HIGH_FOR_API_FIELDS_MEDIUM_FOR_SUPPLEMENTAL" : "HIGH_FOR_API_FIELDS", venueOverride?.notes || sup.notes || "MLB StatsAPI venue basic fields; supplemental dimensions not available.").run();
    inserted += Number(res?.meta?.changes || 0);
    audit.push({ team_id: teamId, venue_id: venueId, venue_name: venue.name || null, supplemental_static: Boolean(sup.altitude_ft), override_applied: Boolean(venueOverride) });
  }
  return { ok: true, data_ok: inserted >= 30, job: input.job || "scrape_static_temp_venues", version: SYSTEM_VERSION, status: inserted >= 30 ? "pass" : "needs_review", table: "ref_venues_temp", fetched_teams: teams.length, inserted_rows: inserted, audit, live_tables_touched: false, estimated_seconds: "5-15 seconds", note: "Wiped and rebuilt ref_venues_temp only. Live ref_venues was not touched." };
}

async function syncStaticTeamAliasesTemp(input, env) {
  await ensureStaticTempReferenceTables(env);
  const teams = await fetchMlbTeamsForStatic();
  await env.DB.prepare("DELETE FROM ref_team_aliases_temp").run();
  const stmt = env.DB.prepare(`INSERT OR REPLACE INTO ref_team_aliases_temp (alias_type, raw_alias, canonical_name, canonical_team_id, mlb_id, confidence, action, notes, source_name, updated_at) VALUES ('team', ?, ?, ?, ?, ?, ?, ?, 'mlb_statsapi_team_alias_seed', CURRENT_TIMESTAMP)`);
  let inserted = 0;
  for (const t of teams) {
    const teamId = MLB_TEAM_ABBR[t.id];
    const aliases = [teamId, t.abbreviation, t.teamName, t.name, t.shortName, t.fileCode].filter(Boolean);
    const seen = new Set();
    for (const a of aliases) {
      const raw = String(a).trim();
      if (!raw || seen.has(raw.toLowerCase())) continue;
      seen.add(raw.toLowerCase());
      const res = await stmt.bind(raw, t.name || null, teamId, Number(t.id), "HIGH", "map", "Official or direct MLB StatsAPI team alias.").run();
      inserted += Number(res?.meta?.changes || 0);
    }
  }
  for (const r of [["LA", "Los Angeles Dodgers / Los Angeles Angels", null, null, "MEDIUM", "review", "Ambiguous; requires source context."], ["NY", "New York Mets / New York Yankees", null, null, "MEDIUM", "review", "Ambiguous; requires source context."], ["AZ", "Arizona Diamondbacks", "ARI", 109, "HIGH", "map", "Common non-MLB shorthand for ARI."]]) {
    const res = await stmt.bind(...r).run();
    inserted += Number(res?.meta?.changes || 0);
  }
  return { ok: true, data_ok: inserted >= 100, job: input.job || "scrape_static_temp_team_aliases", version: SYSTEM_VERSION, status: inserted >= 100 ? "pass" : "needs_review", table: "ref_team_aliases_temp", teams: teams.length, inserted_rows: inserted, live_tables_touched: false, estimated_seconds: "3-10 seconds", note: "Wiped and rebuilt ref_team_aliases_temp only. Live ref_team_aliases was not touched." };
}

async function syncStaticPlayersTemp(input, env, group) {
  await ensureStaticTempReferenceTables(env);
  const season = Number(String(resolveSlateDate(input || {}).slate_date).slice(0,4));
  const allTeams = await fetchMlbTeamsForStatic();
  const teams = group ? groupSlice(allTeams, group) : allTeams;
  const stmt = env.DB.prepare(`INSERT OR REPLACE INTO ref_players_temp (player_id, mlb_id, player_name, team_id, primary_position, role, bats, throws, birth_date, age, active, source_name, source_confidence, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'mlb_statsapi_active_roster_reference', 'HIGH', CURRENT_TIMESTAMP)`);
  let inserted = 0;
  const audit = [];
  for (const t of teams) {
    const teamId = MLB_TEAM_ABBR[t.id];
    const url = `https://statsapi.mlb.com/api/v1/teams/${encodeURIComponent(t.id)}/roster?rosterType=active&hydrate=person`;
    const fetched = await fetchJsonWithRetry(url, {}, 3, `static_temp_roster_${teamId}`);
    audit.push({ team_id: teamId, ok: fetched.ok, error: fetched.error || null, roster_rows: fetched.data?.roster?.length || 0 });
    if (!fetched.ok) continue;
    for (const entry of (fetched.data?.roster || [])) {
      const person = entry.person || {};
      const pos = entry.position || person.primaryPosition || {};
      const playerId = Number(person.id || 0);
      if (!playerId || !person.fullName) continue;
      const primary = pos.abbreviation || pos.code || null;
      const res = await stmt.bind(playerId, playerId, person.fullName, teamId, primary, normalizeRoleFromPosition(primary, person?.pitchHand?.code), person?.batSide?.code || null, person?.pitchHand?.code || null, person?.birthDate || null, ageFromBirthDate(person?.birthDate)).run();
      inserted += Number(res?.meta?.changes || 0);
    }
  }
  const afterCount = await staticTableCount(env, "ref_players_temp");
  const failedTeams = audit.filter(a => !a.ok).length;
  return { ok: failedTeams === 0 && inserted > 0, data_ok: failedTeams === 0 && afterCount.rows_count > 0, job: input.job || `scrape_static_temp_players_g${group || 'all'}`, version: SYSTEM_VERSION, status: failedTeams ? "partial_retry_needed" : "pass", table: "ref_players_temp", season, group, teams_total: allTeams.length, teams_checked: teams.length, inserted_rows: inserted, total_ref_players_temp_after: afterCount.rows_count, failed_teams: failedTeams, team_audit: audit, live_tables_touched: false, estimated_seconds: "10-25 seconds per group", note: "Chunked static player scrape into ref_players_temp only. Live ref_players was not touched." };
}

async function scheduleStaticTempRefreshOnce(input, env) {
  await ensureStaticTempReferenceTables(env);
  const existing = await env.DB.prepare(`SELECT request_id, status, current_step, run_after, updated_at FROM static_temp_refresh_runs WHERE status IN ('pending','running') ORDER BY created_at DESC LIMIT 1`).first().catch(() => null);
  if (existing) return { ok: true, data_ok: false, job: input.job || 'schedule_static_temp_refresh_once', version: SYSTEM_VERSION, status: 'already_scheduled_or_running', existing_request: existing, live_tables_touched: false, note: 'A temp-only static refresh is already pending/running. Do not schedule another one.' };
  const requestId = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO static_temp_refresh_runs (request_id, status, run_after, current_step, created_at, updated_at, output_json) VALUES (?, 'pending', datetime('now', '+1 minute'), 'venues', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`).bind(requestId, JSON.stringify({ created_by: 'control_room', requested_job: input.job || 'schedule_static_temp_refresh_once', live_tables_touched: false })).run();
  return { ok: true, data_ok: true, job: input.job || 'schedule_static_temp_refresh_once', version: SYSTEM_VERSION, status: 'scheduled_for_next_minute', request_id: requestId, run_after: 'about 1 minute from now', refresh_steps: ['venues_temp','team_aliases_temp','players_temp_g1','players_temp_g2','players_temp_g3','players_temp_g4','players_temp_g5','players_temp_g6','audit_certification','promote_if_certified','clean_temp','completed'], live_tables_touched: false, estimated_total_minutes: '10-15 minutes after the first cron tick', note: 'Cron will fill only _temp tables, certify them, promote only after A+/A audit, then clean temp. Live trusted tables are protected until certification passes.' };
}

function nextStaticTempStep(step) {
  const order = ['venues','aliases','players_g1','players_g2','players_g3','players_g4','players_g5','players_g6','audit','promote','clean','completed'];
  const i = order.indexOf(String(step || 'venues'));
  return order[Math.min(i + 1, order.length - 1)] || 'completed';
}

function staticTempRefreshReadyForAuditOrPromotion(run) {
  if (!run) return false;
  const status = String(run.status || '');
  const step = String(run.current_step || '');
  return status === 'completed' || (status === 'running' && ['audit','promote','clean','completed'].includes(step));
}

async function runStaticTempScheduledTick(input, env) {
  await ensureStaticTempReferenceTables(env);
  const row = await env.DB.prepare(`SELECT * FROM static_temp_refresh_runs WHERE status IN ('pending','running') AND (run_after IS NULL OR run_after <= CURRENT_TIMESTAMP) ORDER BY created_at ASC LIMIT 1`).first().catch(() => null);
  if (!row) return { ok: true, version: SYSTEM_VERSION, job: input.job || 'run_static_temp_refresh_tick', status: 'idle_no_due_temp_refresh', trigger: input.trigger || 'manual', live_tables_touched: false, note: 'No due temp-only static refresh request was found.' };
  const requestId = row.request_id;
  const step = String(row.current_step || 'venues');
  await env.DB.prepare(`UPDATE static_temp_refresh_runs SET status='running', started_at=COALESCE(started_at, CURRENT_TIMESTAMP), updated_at=CURRENT_TIMESTAMP WHERE request_id=?`).bind(requestId).run();
  let result;
  try {
    if (step === 'venues') {
      await env.DB.prepare('DELETE FROM ref_venues_temp').run();
      await env.DB.prepare('DELETE FROM ref_team_aliases_temp').run();
      await env.DB.prepare('DELETE FROM ref_players_temp').run();
      result = await syncStaticVenuesTemp({ ...input, job: 'scrape_static_temp_venues' }, env);
    } else if (step === 'aliases') {
      result = await syncStaticTeamAliasesTemp({ ...input, job: 'scrape_static_temp_team_aliases' }, env);
    } else if (/^players_g[1-6]$/.test(step)) {
      const group = Number(step.match(/g([1-6])$/)[1]);
      result = await syncStaticPlayersTemp({ ...input, job: `scrape_static_temp_players_g${group}` }, env, group);
    } else if (step === 'audit') {
      result = await auditStaticTempCertification({ ...input, job: 'audit_static_temp_certification', allow_running_refresh: true }, env);
    } else if (step === 'promote') {
      result = await promoteStaticTempToLive({ ...input, job: 'promote_static_temp_to_live', allow_running_refresh: true }, env);
    } else if (step === 'clean') {
      result = await cleanStaticTempTables({ ...input, job: 'clean_static_temp_tables' }, env);
    } else {
      result = { ok: true, data_ok: true, job: input.job || 'run_static_temp_refresh_tick', version: SYSTEM_VERSION, status: 'already_completed', request_id: requestId, live_tables_touched: false };
    }
    if (!result || result.ok === false || result.data_ok === false) {
      const failed = { ok: false, data_ok: false, version: SYSTEM_VERSION, job: input.job || 'run_static_temp_refresh_tick', request_id: requestId, processed_step: step, status: 'pipeline_blocked', step_result: result, live_tables_touched: false, note: 'Weekly static pipeline stopped before promotion/cleanup because this step did not pass. Live trusted tables are protected unless certification and promotion both pass.' };
      await env.DB.prepare(`UPDATE static_temp_refresh_runs SET status='failed', finished_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP, error=?, output_json=? WHERE request_id=?`).bind(String(result?.error || result?.status || 'step_failed'), JSON.stringify(failed), requestId).run().catch(() => null);
      return failed;
    }
    const nextStep = nextStaticTempStep(step);
    const complete = nextStep === 'completed';
    const counts = await staticTempCounts(env).catch(() => null);
    const wrapped = { ok: true, data_ok: true, version: SYSTEM_VERSION, job: input.job || 'run_static_temp_refresh_tick', request_id: requestId, processed_step: step, next_step: nextStep, refresh_complete: complete, step_result: result, counts, live_tables_touched: step === 'promote' ? true : false, note: complete ? 'Weekly static pipeline completed: temp scrape, certification, protected promotion, and temp cleanup finished.' : 'Weekly static pipeline advanced one protected step. Minute cron will continue the next step automatically.' };
    await env.DB.prepare(`UPDATE static_temp_refresh_runs SET status=?, current_step=?, finished_at=CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE finished_at END, updated_at=CURRENT_TIMESTAMP, output_json=? WHERE request_id=?`).bind(complete ? 'completed' : 'running', nextStep, complete ? 1 : 0, JSON.stringify(wrapped), requestId).run();
    return wrapped;
  } catch (err) {
    const failure = { ok: false, data_ok: false, version: SYSTEM_VERSION, job: input.job || 'run_static_temp_refresh_tick', request_id: requestId, processed_step: step, status: 'failed_exception', error: String(err?.message || err), live_tables_touched: false };
    await env.DB.prepare(`UPDATE static_temp_refresh_runs SET status='failed', finished_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP, error=?, output_json=? WHERE request_id=?`).bind(failure.error, JSON.stringify(failure), requestId).run().catch(() => null);
    return failure;
  }
}

async function staticTempCounts(env) {
  return [await staticTableCount(env, 'ref_venues_temp'), await staticTableCount(env, 'ref_team_aliases_temp'), await staticTableCount(env, 'ref_players_temp')];
}

async function checkStaticTempData(input, env, target) {
  await ensureStaticTempReferenceTables(env);
  const targets = target === 'all' ? ['ref_venues_temp','ref_team_aliases_temp','ref_players_temp'] : [target];
  const counts = [];
  for (const t of targets) counts.push(await staticTableCount(env, t));
  const countMap = Object.fromEntries(counts.map(c => [c.table, c.rows_count]));
  const roleRows = await env.DB.prepare(`SELECT role, COUNT(*) AS rows_count FROM ref_players_temp GROUP BY role ORDER BY role`).all().catch(() => ({ results: [] }));
  const duplicatePlayers = await env.DB.prepare(`SELECT player_id, COUNT(*) AS rows_count FROM ref_players_temp GROUP BY player_id HAVING COUNT(*) > 1 LIMIT 20`).all().catch(() => ({ results: [] }));
  const duplicateAliases = await env.DB.prepare(`SELECT alias_type, raw_alias, COUNT(*) AS rows_count FROM ref_team_aliases_temp GROUP BY alias_type, raw_alias HAVING COUNT(*) > 1 LIMIT 20`).all().catch(() => ({ results: [] }));
  const quality = { venues_rows_ok: (countMap.ref_venues_temp || 0) >= 30, aliases_rows_ok: (countMap.ref_team_aliases_temp || 0) >= 120, players_rows_ok: (countMap.ref_players_temp || 0) >= 750, duplicate_players: duplicatePlayers.results || [], duplicate_aliases: duplicateAliases.results || [], player_role_split: roleRows.results || [] };
  const dataOk = counts.every(c => c.exists && c.rows_count > 0) && (target !== 'all' || (quality.venues_rows_ok && quality.aliases_rows_ok && quality.players_rows_ok && quality.duplicate_players.length === 0 && quality.duplicate_aliases.length === 0));
  const samples = {};
  for (const c of counts) {
    if (!c.exists || c.rows_count <= 0) continue;
    const rows = await env.DB.prepare(`SELECT * FROM ${c.table} LIMIT 10`).all();
    samples[c.table] = rows.results || [];
  }
  const latestRun = await env.DB.prepare(`SELECT request_id, status, current_step, created_at, started_at, finished_at, updated_at, error, substr(output_json,1,1200) AS output_preview FROM static_temp_refresh_runs ORDER BY created_at DESC LIMIT 1`).first().catch(() => null);
  return { ok: true, data_ok: dataOk, job: input.job || `check_static_temp_${target}`, version: SYSTEM_VERSION, status: dataOk ? 'pass' : 'needs_scrape_or_review', counts, quality, latest_temp_refresh: latestRun, samples, live_tables_touched: false, note: 'Temp checks are read-only. They validate staging tables only. Use CERTIFY TEMP > Audit Static Temp before promotion.' };
}


function pctDiff(a, b) {
  const x = Number(a || 0), y = Number(b || 0);
  if (!x && !y) return 0;
  const base = Math.max(1, Math.max(Math.abs(x), Math.abs(y)));
  return Math.abs(x - y) / base;
}

async function countFirst(env, sql, binds = []) {
  let q = env.DB.prepare(sql);
  for (const b of binds) q = q.bind(b);
  const row = await q.first().catch(() => null);
  return Number(row?.c || row?.rows_count || 0);
}

async function sampleRows(env, sql, binds = []) {
  let q = env.DB.prepare(sql);
  for (const b of binds) q = q.bind(b);
  const rows = await q.all().catch(() => ({ results: [] }));
  return rows.results || [];
}

function auditGradeFromFailuresWarnings(failures, warnings) {
  if (failures.length > 0) return 'FAIL';
  const serious = warnings.filter(w => w.severity === 'HIGH').length;
  if (serious > 0) return 'B';
  if (warnings.length > 0) return 'A';
  return 'A+';
}

async function auditStaticTempCertification(input, env) {
  await ensureStaticTempReferenceTables(env);
  const latestRun = await env.DB.prepare(`SELECT request_id, status, current_step, created_at, started_at, finished_at, updated_at, error FROM static_temp_refresh_runs ORDER BY created_at DESC LIMIT 1`).first().catch(() => null);
  const counts = {
    ref_venues_temp: await staticTableCount(env, 'ref_venues_temp'),
    ref_team_aliases_temp: await staticTableCount(env, 'ref_team_aliases_temp'),
    ref_players_temp: await staticTableCount(env, 'ref_players_temp'),
    ref_venues_live: await staticTableCount(env, 'ref_venues'),
    ref_team_aliases_live: await staticTableCount(env, 'ref_team_aliases'),
    ref_players_live: await staticTableCount(env, 'ref_players')
  };
  const failures = [];
  const warnings = [];
  const vRows = counts.ref_venues_temp.rows_count;
  const aRows = counts.ref_team_aliases_temp.rows_count;
  const pRows = counts.ref_players_temp.rows_count;
  if (!staticTempRefreshReadyForAuditOrPromotion(latestRun)) failures.push({ code: 'LATEST_TEMP_REFRESH_NOT_READY_FOR_CERTIFICATION', detail: latestRun || null });
  if (!counts.ref_venues_temp.exists || vRows < 30) failures.push({ code: 'VENUES_TEMP_ROW_COUNT_LOW', rows_count: vRows, required_min: 30 });
  if (!counts.ref_team_aliases_temp.exists || aRows < 120) failures.push({ code: 'ALIASES_TEMP_ROW_COUNT_LOW', rows_count: aRows, required_min: 120 });
  if (!counts.ref_players_temp.exists || pRows < 750) failures.push({ code: 'PLAYERS_TEMP_ROW_COUNT_LOW', rows_count: pRows, required_min: 750 });

  const duplicatePlayers = await sampleRows(env, `SELECT player_id, COUNT(*) AS rows_count FROM ref_players_temp GROUP BY player_id HAVING COUNT(*) > 1 LIMIT 20`);
  const duplicateAliases = await sampleRows(env, `SELECT alias_type, raw_alias, COUNT(*) AS rows_count FROM ref_team_aliases_temp GROUP BY alias_type, raw_alias HAVING COUNT(*) > 1 LIMIT 20`);
  const duplicateVenues = await sampleRows(env, `SELECT team_id, COUNT(*) AS rows_count FROM ref_venues_temp GROUP BY team_id HAVING COUNT(*) > 1 LIMIT 20`);
  if (duplicatePlayers.length) failures.push({ code: 'DUPLICATE_PLAYER_IDS', rows: duplicatePlayers });
  if (duplicateAliases.length) failures.push({ code: 'DUPLICATE_ALIASES', rows: duplicateAliases });
  if (duplicateVenues.length) failures.push({ code: 'DUPLICATE_VENUE_TEAM_IDS', rows: duplicateVenues });

  const venueCriticalNulls = await countFirst(env, `SELECT COUNT(*) AS c FROM ref_venues_temp WHERE venue_id IS NULL OR team_id IS NULL OR TRIM(team_id)='' OR mlb_venue_name IS NULL OR TRIM(mlb_venue_name)=''`);
  const aliasCriticalNulls = await countFirst(env, `SELECT COUNT(*) AS c FROM ref_team_aliases_temp WHERE raw_alias IS NULL OR TRIM(raw_alias)='' OR action IS NULL OR TRIM(action)='' OR (action='map' AND (canonical_team_id IS NULL OR TRIM(canonical_team_id)=''))`);
  const playerCriticalNulls = await countFirst(env, `SELECT COUNT(*) AS c FROM ref_players_temp WHERE player_id IS NULL OR player_name IS NULL OR TRIM(player_name)='' OR team_id IS NULL OR TRIM(team_id)='' OR role IS NULL OR TRIM(role)=''`);
  if (venueCriticalNulls) failures.push({ code: 'VENUE_CRITICAL_NULLS', rows_count: venueCriticalNulls });
  if (aliasCriticalNulls) failures.push({ code: 'ALIAS_CRITICAL_NULLS', rows_count: aliasCriticalNulls });
  if (playerCriticalNulls) failures.push({ code: 'PLAYER_CRITICAL_NULLS', rows_count: playerCriticalNulls });

  const invalidRoles = await sampleRows(env, `SELECT role, COUNT(*) AS rows_count FROM ref_players_temp WHERE role NOT IN ('BATTER','PITCHER') OR role IS NULL GROUP BY role LIMIT 20`);
  const invalidPlayerTeams = await sampleRows(env, `SELECT p.team_id, COUNT(*) AS rows_count FROM ref_players_temp p LEFT JOIN ref_team_aliases_temp a ON a.alias_type='team' AND a.raw_alias=p.team_id AND a.action='map' WHERE a.raw_alias IS NULL GROUP BY p.team_id LIMIT 20`);
  if (invalidRoles.length) failures.push({ code: 'INVALID_PLAYER_ROLES', rows: invalidRoles });
  if (invalidPlayerTeams.length) failures.push({ code: 'PLAYER_TEAM_IDS_NOT_IN_TEMP_ALIASES', rows: invalidPlayerTeams });

  const roleSplit = await sampleRows(env, `SELECT role, COUNT(*) AS rows_count FROM ref_players_temp GROUP BY role ORDER BY role`);
  const teamRosterCounts = await sampleRows(env, `SELECT team_id, COUNT(*) AS rows_count FROM ref_players_temp GROUP BY team_id ORDER BY team_id`);
  const lowRosterTeams = teamRosterCounts.filter(r => Number(r.rows_count || 0) < 20);
  const distinctTeams = teamRosterCounts.length;
  if (distinctTeams < 30) failures.push({ code: 'PLAYER_TEAM_COVERAGE_LOW', distinct_teams: distinctTeams, required_min: 30 });
  if (lowRosterTeams.length) warnings.push({ code: 'LOW_ROSTER_TEAM_COUNTS', severity: 'HIGH', rows: lowRosterTeams });
  const batterCount = roleSplit.find(r => r.role === 'BATTER')?.rows_count || 0;
  const pitcherCount = roleSplit.find(r => r.role === 'PITCHER')?.rows_count || 0;
  if (Number(batterCount) < 300 || Number(pitcherCount) < 300) failures.push({ code: 'PLAYER_ROLE_BALANCE_BAD', role_split: roleSplit });

  const venueLiveDiff = Math.abs(vRows - counts.ref_venues_live.rows_count);
  const aliasLiveDiffPct = pctDiff(aRows, counts.ref_team_aliases_live.rows_count);
  const playerLiveDiffPct = pctDiff(pRows, counts.ref_players_live.rows_count);
  if (venueLiveDiff > 0) warnings.push({ code: 'VENUE_TEMP_LIVE_COUNT_DIFF', severity: 'LOW', temp_rows: vRows, live_rows: counts.ref_venues_live.rows_count });
  if (aliasLiveDiffPct > 0.05) warnings.push({ code: 'ALIAS_TEMP_LIVE_COUNT_DIFF_OVER_5_PERCENT', severity: 'MEDIUM', temp_rows: aRows, live_rows: counts.ref_team_aliases_live.rows_count });
  if (playerLiveDiffPct > 0.05) warnings.push({ code: 'PLAYER_TEMP_LIVE_COUNT_DIFF_OVER_5_PERCENT', severity: 'MEDIUM', temp_rows: pRows, live_rows: counts.ref_players_live.rows_count });
  const staleRows = await countFirst(env, `SELECT COUNT(*) AS c FROM ref_players_temp WHERE updated_at IS NULL OR datetime(updated_at) < datetime('now', '-2 days')`);
  if (staleRows) warnings.push({ code: 'STALE_PLAYER_TEMP_TIMESTAMPS', severity: 'MEDIUM', rows_count: staleRows });

  const grade = auditGradeFromFailuresWarnings(failures, warnings);
  const dataOk = grade === 'A+' || grade === 'A';
  const status = dataOk ? 'certified' : 'blocked';
  const auditId = crypto.randomUUID();
  const result = { ok: true, data_ok: dataOk, job: input.job || 'audit_static_temp_certification', version: SYSTEM_VERSION, status, certification_grade: grade, promotion_allowed: dataOk, temp_refresh: latestRun, counts: Object.values(counts), quality: { duplicate_players: duplicatePlayers, duplicate_aliases: duplicateAliases, duplicate_venues: duplicateVenues, role_split: roleSplit, team_roster_counts: teamRosterCounts, failures, warnings }, live_tables_touched: false, note: dataOk ? 'Static temp certification passed. Promotion is allowed in this build.' : 'Static temp certification blocked promotion. Fix failures before promotion.' };
  await env.DB.prepare(`INSERT OR REPLACE INTO static_temp_certification_audits (audit_id, grade, data_ok, status, temp_refresh_request_id, temp_refresh_finished_at, counts_json, failures_json, warnings_json, output_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(auditId, grade, dataOk ? 1 : 0, status, latestRun?.request_id || null, latestRun?.finished_at || null, JSON.stringify(Object.values(counts)), JSON.stringify(failures), JSON.stringify(warnings), JSON.stringify(result)).run();
  return { ...result, audit_id: auditId };
}

async function latestStaticTempAudit(env) {
  await ensureStaticTempReferenceTables(env);
  const row = await env.DB.prepare(`SELECT audit_id, grade, data_ok, status, temp_refresh_request_id, temp_refresh_finished_at, created_at, output_json FROM static_temp_certification_audits ORDER BY created_at DESC LIMIT 1`).first().catch(() => null);
  if (!row) return null;
  let parsed = null;
  try { parsed = JSON.parse(row.output_json || '{}'); } catch (_) {}
  return { ...row, parsed };
}

async function promoteStaticTempToLive(input, env) {
  await ensureStaticTempReferenceTables(env);
  const latestRun = await env.DB.prepare(`SELECT request_id, status, current_step, finished_at FROM static_temp_refresh_runs ORDER BY created_at DESC LIMIT 1`).first().catch(() => null);
  const audit = await latestStaticTempAudit(env);
  if (!staticTempRefreshReadyForAuditOrPromotion(latestRun)) return { ok: false, data_ok: false, job: input.job || 'promote_static_temp_to_live', version: SYSTEM_VERSION, status: 'blocked_temp_refresh_not_ready_for_promotion', latest_temp_refresh: latestRun, live_tables_touched: false };
  if (!audit || !['A+','A'].includes(String(audit.grade || ''))) return { ok: false, data_ok: false, job: input.job || 'promote_static_temp_to_live', version: SYSTEM_VERSION, status: 'blocked_no_certified_audit', latest_audit: audit, live_tables_touched: false };
  if (audit.temp_refresh_request_id !== latestRun.request_id) return { ok: false, data_ok: false, job: input.job || 'promote_static_temp_to_live', version: SYSTEM_VERSION, status: 'blocked_audit_not_for_latest_refresh', latest_temp_refresh: latestRun, latest_audit: audit, live_tables_touched: false };
  const before = [await staticTableCount(env, 'ref_venues'), await staticTableCount(env, 'ref_team_aliases'), await staticTableCount(env, 'ref_players')];
  const tempCounts = [await staticTableCount(env, 'ref_venues_temp'), await staticTableCount(env, 'ref_team_aliases_temp'), await staticTableCount(env, 'ref_players_temp')];
  const tempMap = Object.fromEntries(tempCounts.map(c => [c.table, c.rows_count]));
  if ((tempMap.ref_venues_temp || 0) < 30 || (tempMap.ref_team_aliases_temp || 0) < 120 || (tempMap.ref_players_temp || 0) < 750) return { ok: false, data_ok: false, job: input.job || 'promote_static_temp_to_live', version: SYSTEM_VERSION, status: 'blocked_temp_counts_dropped_after_audit', temp_counts: tempCounts, live_tables_touched: false };
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM ref_venues`),
    env.DB.prepare(`INSERT INTO ref_venues (venue_id, team_id, mlb_venue_name, city, state, roof_status, surface_type, altitude_ft, left_field_dimension_ft, center_field_dimension_ft, right_field_dimension_ft, source_name, source_confidence, notes, updated_at) SELECT venue_id, team_id, mlb_venue_name, city, state, roof_status, surface_type, altitude_ft, left_field_dimension_ft, center_field_dimension_ft, right_field_dimension_ft, source_name, source_confidence, notes, updated_at FROM ref_venues_temp`),
    env.DB.prepare(`DELETE FROM ref_team_aliases`),
    env.DB.prepare(`INSERT INTO ref_team_aliases (alias_type, raw_alias, canonical_name, canonical_team_id, mlb_id, confidence, action, notes, source_name, updated_at) SELECT alias_type, raw_alias, canonical_name, canonical_team_id, mlb_id, confidence, action, notes, source_name, updated_at FROM ref_team_aliases_temp`),
    env.DB.prepare(`DELETE FROM ref_players`),
    env.DB.prepare(`INSERT INTO ref_players (player_id, mlb_id, player_name, team_id, primary_position, role, bats, throws, birth_date, age, active, source_name, source_confidence, updated_at) SELECT player_id, mlb_id, player_name, team_id, primary_position, role, bats, throws, birth_date, age, active, source_name, source_confidence, updated_at FROM ref_players_temp`)
  ]);
  const after = [await staticTableCount(env, 'ref_venues'), await staticTableCount(env, 'ref_team_aliases'), await staticTableCount(env, 'ref_players')];
  return { ok: true, data_ok: true, job: input.job || 'promote_static_temp_to_live', version: SYSTEM_VERSION, status: 'promoted', certification_grade: audit.grade, audit_id: audit.audit_id, temp_refresh_request_id: latestRun.request_id, before_counts: before, temp_counts: tempCounts, after_counts: after, live_tables_touched: true, note: 'Certified temp static tables were promoted to live trusted static tables. Temp tables were not cleaned yet; run Clean Static Temp after confirming promotion.' };
}

async function cleanStaticTempTables(input, env) {
  await ensureStaticTempReferenceTables(env);
  const before = [await staticTableCount(env, 'ref_venues_temp'), await staticTableCount(env, 'ref_team_aliases_temp'), await staticTableCount(env, 'ref_players_temp')];
  await env.DB.batch([env.DB.prepare(`DELETE FROM ref_venues_temp`), env.DB.prepare(`DELETE FROM ref_team_aliases_temp`), env.DB.prepare(`DELETE FROM ref_players_temp`)]);
  const after = [await staticTableCount(env, 'ref_venues_temp'), await staticTableCount(env, 'ref_team_aliases_temp'), await staticTableCount(env, 'ref_players_temp')];
  return { ok: true, data_ok: true, job: input.job || 'clean_static_temp_tables', version: SYSTEM_VERSION, status: 'temp_cleaned', before_counts: before, after_counts: after, live_tables_touched: false, note: 'Only _temp staging tables were cleaned. Certification audit logs and live trusted tables were preserved.' };
}



async function ensureIncrementalTempTables(env) {
  await ensureStaticReferenceTables(env);
  await ensureIncrementalBaseTables(env);
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS player_game_logs_temp AS SELECT * FROM player_game_logs WHERE 1=0`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS ref_player_splits_temp AS SELECT * FROM ref_player_splits WHERE 1=0`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS incremental_temp_refresh_runs (request_id TEXT PRIMARY KEY, status TEXT NOT NULL, run_after TEXT, current_step TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, started_at TEXT, finished_at TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, output_json TEXT, error TEXT)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS incremental_temp_certification_audits (audit_id TEXT PRIMARY KEY, grade TEXT NOT NULL, data_ok INTEGER NOT NULL, status TEXT NOT NULL, temp_refresh_request_id TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, counts_json TEXT, failures_json TEXT, warnings_json TEXT, output_json TEXT)`).run();
}
async function resetIncrementalTempTables(env, options = {}) {
  await ensureStaticReferenceTables(env);
  await ensureIncrementalBaseTables(env);
  const resetLogs = options.logs !== false;
  const resetSplits = options.splits !== false;
  const meta = { reset_logs: resetLogs, reset_splits: resetSplits, method: 'DROP_IF_EXISTS_CREATE_IF_NOT_EXISTS_EMPTY_TEMP_TABLES' };
  if (resetLogs) {
    await env.DB.prepare(`DROP TABLE IF EXISTS player_game_logs_temp`).run();
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS player_game_logs_temp AS SELECT * FROM player_game_logs WHERE 1=0`).run();
  }
  if (resetSplits) {
    await env.DB.prepare(`DROP TABLE IF EXISTS ref_player_splits_temp`).run();
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS ref_player_splits_temp AS SELECT * FROM ref_player_splits WHERE 1=0`).run();
  }
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS incremental_temp_refresh_runs (request_id TEXT PRIMARY KEY, status TEXT NOT NULL, run_after TEXT, current_step TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, started_at TEXT, finished_at TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, output_json TEXT, error TEXT)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS incremental_temp_certification_audits (audit_id TEXT PRIMARY KEY, grade TEXT NOT NULL, data_ok INTEGER NOT NULL, status TEXT NOT NULL, temp_refresh_request_id TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, counts_json TEXT, failures_json TEXT, warnings_json TEXT, output_json TEXT)`).run();
  return meta;
}

async function finalizeStaleIncrementalTaskState(env) {
  await ensureIncrementalTempTables(env);
  const audit = { task_runs_reset: 0, refresh_runs_reset: 0 };
  try {
    const taskRes = await env.DB.prepare(`
      UPDATE task_runs
      SET status='stale_reset', finished_at=CURRENT_TIMESTAMP,
          error=COALESCE(error, 'v1.2.91 stale incremental task finalized before new incremental action')
      WHERE status='running'
        AND started_at < datetime('now','-15 minutes')
        AND job_name IN (
          'schedule_incremental_temp_refresh_once','run_incremental_temp_refresh_tick','check_incremental_temp_all',
          'audit_incremental_temp_certification','promote_incremental_temp_to_live','clean_incremental_temp_tables',
          'incremental_base_derived_metrics','check_incremental_derived_metrics'
        )
    `).run();
    audit.task_runs_reset = Number(taskRes?.meta?.changes || 0);
  } catch (err) { audit.task_runs_error = String(err?.message || err); }
  try {
    const refreshRes = await env.DB.prepare(`
      UPDATE incremental_temp_refresh_runs
      SET status='failed', finished_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP,
          error=COALESCE(error, 'v1.2.91 stale incremental temp refresh finalized')
      WHERE status IN ('pending','running')
        AND updated_at < datetime('now','-30 minutes')
    `).run();
    audit.refresh_runs_reset = Number(refreshRes?.meta?.changes || 0);
  } catch (err) { audit.refresh_runs_error = String(err?.message || err); }
  return audit;
}

async function scheduleIncrementalTempRefreshOnce(input, env) {
  await ensureIncrementalTempTables(env);
  const stale_finalizer = await finalizeStaleIncrementalTaskState(env);
  const existing = await env.DB.prepare(`SELECT request_id, status, current_step, run_after, updated_at, error FROM incremental_temp_refresh_runs WHERE status IN ('pending','running') ORDER BY created_at DESC LIMIT 1`).first().catch(() => null);
  if (existing) return { ok:true, data_ok:false, job:input.job || 'schedule_incremental_temp_refresh_once', version:SYSTEM_VERSION, status:'already_scheduled_or_running', existing_request:existing, stale_finalizer, live_tables_touched:false };
  const requestId = crypto.randomUUID();
  const reset = await resetIncrementalTempTables(env);
  await env.DB.prepare(`INSERT INTO incremental_temp_refresh_runs (request_id, status, run_after, current_step, output_json, error) VALUES (?, 'pending', datetime('now', '+1 minute'), 'stage_logs', ?, NULL)`).bind(requestId, JSON.stringify({ live_tables_touched:false, reset, stale_finalizer })).run();
  return { ok:true, data_ok:true, job:input.job || 'schedule_incremental_temp_refresh_once', version:SYSTEM_VERSION, status:'scheduled_for_next_minute', request_id:requestId, run_after:'about 1 minute from now', refresh_steps:['stage_game_logs_temp','stage_splits_temp','audit','promote','clean','derived','completed'], reset, stale_finalizer, live_tables_touched:false, estimated_total_minutes:'5-10 minutes after first cron tick', note:'Daily incremental pipeline resets temp with DROP/CREATE, stages into temp, audits, promotes, cleans temp, then rebuilds derived metrics.' };
}

async function dedupeIncrementalTempTables(env) {
  await ensureIncrementalTempTables(env);
  const before = [await staticTableCount(env, 'player_game_logs_temp'), await staticTableCount(env, 'ref_player_splits_temp')];
  const logDedupe = await env.DB.prepare(`
    DELETE FROM player_game_logs_temp
    WHERE rowid NOT IN (
      SELECT MIN(rowid)
      FROM player_game_logs_temp
      GROUP BY player_id, game_pk, group_type
    )
  `).run();
  const splitDedupe = await env.DB.prepare(`
    DELETE FROM ref_player_splits_temp
    WHERE rowid NOT IN (
      SELECT MIN(rowid)
      FROM ref_player_splits_temp
      GROUP BY player_id, season, group_type, split_code
    )
  `).run();
  const after = [await staticTableCount(env, 'player_game_logs_temp'), await staticTableCount(env, 'ref_player_splits_temp')];
  return { before_counts: before, after_counts: after, log_dedupe_meta: logDedupe?.meta || null, split_dedupe_meta: splitDedupe?.meta || null };
}

async function stageIncrementalGameLogsTemp(input, env) {
  await ensureIncrementalTempTables(env);
  const reset = await resetIncrementalTempTables(env, { logs:true, splits:false });
  const res = await env.DB.prepare(`
    INSERT INTO player_game_logs_temp
    SELECT * FROM player_game_logs
    WHERE rowid IN (
      SELECT MIN(rowid)
      FROM player_game_logs
      GROUP BY player_id, game_pk, group_type
    )
  `).run();
  const dedupe = await dedupeIncrementalTempTables(env);
  const count = await staticTableCount(env, 'player_game_logs_temp');
  return { ok:true, data_ok:Number(count.rows_count||0)>0, job:input.job || 'run_incremental_temp_refresh_tick', version:SYSTEM_VERSION, status:'pass', table:'player_game_logs_temp', rows_staged:count.rows_count, d1_meta:res.meta || null, reset, dedupe, live_tables_touched:false, note:'Staged current incremental game-log table into rebuilt temp table. Temp rows are deduped by player_id/game_pk/group_type. Live table untouched.' };
}
async function stageIncrementalSplitsTemp(input, env) {
  await ensureIncrementalTempTables(env);
  const reset = await resetIncrementalTempTables(env, { logs:false, splits:true });
  const res = await env.DB.prepare(`
    INSERT INTO ref_player_splits_temp
    SELECT * FROM ref_player_splits
    WHERE rowid IN (
      SELECT MIN(rowid)
      FROM ref_player_splits
      GROUP BY player_id, season, group_type, split_code
    )
  `).run();
  const dedupe = await dedupeIncrementalTempTables(env);
  const count = await staticTableCount(env, 'ref_player_splits_temp');
  return { ok:true, data_ok:Number(count.rows_count||0)>0, job:input.job || 'run_incremental_temp_refresh_tick', version:SYSTEM_VERSION, status:'pass', table:'ref_player_splits_temp', rows_staged:count.rows_count, d1_meta:res.meta || null, reset, dedupe, live_tables_touched:false, note:'Staged current incremental split table into rebuilt temp table. Temp rows are deduped by player_id/season/group_type/split_code. Live table untouched.' };
}
function nextIncrementalTempStep(step) { return ({ stage_logs:'stage_splits', stage_splits:'audit', audit:'promote', promote:'clean', clean:'derived', derived:'completed' })[step] || 'completed'; }
async function runIncrementalTempScheduledTick(input, env) {
  await ensureIncrementalTempTables(env);
  const stale_finalizer = await finalizeStaleIncrementalTaskState(env);
  const row = await env.DB.prepare(`SELECT * FROM incremental_temp_refresh_runs WHERE status IN ('pending','running') AND (run_after IS NULL OR run_after <= CURRENT_TIMESTAMP) ORDER BY created_at ASC LIMIT 1`).first().catch(() => null);
  if (!row) return { ok:true, version:SYSTEM_VERSION, job:input.job || 'run_incremental_temp_refresh_tick', status:'idle_no_due_temp_refresh', trigger:input.trigger || 'manual', stale_finalizer, live_tables_touched:false };
  const requestId = row.request_id; const step = row.current_step || 'stage_logs';
  await env.DB.prepare(`UPDATE incremental_temp_refresh_runs SET status='running', started_at=COALESCE(started_at, CURRENT_TIMESTAMP), updated_at=CURRENT_TIMESTAMP, error=NULL WHERE request_id=?`).bind(requestId).run();
  let result;
  try {
    if (step === 'stage_logs') result = await stageIncrementalGameLogsTemp(input, env);
    else if (step === 'stage_splits') result = await stageIncrementalSplitsTemp(input, env);
    else if (step === 'audit') result = await auditIncrementalTempCertification({ ...input, job:'audit_incremental_temp_certification' }, env);
    else if (step === 'promote') result = await promoteIncrementalTempToLive({ ...input, job:'promote_incremental_temp_to_live' }, env);
    else if (step === 'clean') result = await cleanIncrementalTempTables({ ...input, job:'clean_incremental_temp_tables' }, env);
    else if (step === 'derived') result = await buildIncrementalBaseDerivedMetrics({ ...input, job:'incremental_base_derived_metrics' }, env);
    else result = { ok:true, data_ok:true, status:'already_completed' };
    if (!result?.ok || result?.data_ok === false) {
      const failed = { ok:false, data_ok:false, version:SYSTEM_VERSION, job:input.job || 'run_incremental_temp_refresh_tick', request_id:requestId, processed_step:step, status:'pipeline_blocked', step_result:result, live_tables_touched:false };
      await env.DB.prepare(`UPDATE incremental_temp_refresh_runs SET status='failed', finished_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP, error=?, output_json=? WHERE request_id=?`).bind(String(result?.error || result?.status || 'step_failed'), JSON.stringify(failed), requestId).run();
      return failed;
    }
    const nextStep = nextIncrementalTempStep(step); const complete = nextStep === 'completed';
    const counts = [await staticTableCount(env,'player_game_logs_temp'), await staticTableCount(env,'ref_player_splits_temp'), await staticTableCount(env,'player_game_logs'), await staticTableCount(env,'ref_player_splits'), await staticTableCount(env,'incremental_player_metrics')];
    const wrapped = { ok:true, data_ok:true, version:SYSTEM_VERSION, job:input.job || 'run_incremental_temp_refresh_tick', request_id:requestId, processed_step:step, next_step:nextStep, refresh_complete:complete, step_result:result, counts, stale_finalizer, live_tables_touched:['promote','derived'].includes(step), note:complete ? 'Daily incremental pipeline completed: temp stage, audit, protected promotion, temp cleanup, and derived rebuild finished. Error state cleared on completion.' : 'Daily incremental pipeline advanced one protected step. Minute cron will continue.' };
    await env.DB.prepare(`UPDATE incremental_temp_refresh_runs SET status=?, current_step=?, finished_at=CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE finished_at END, updated_at=CURRENT_TIMESTAMP, error=NULL, output_json=? WHERE request_id=?`).bind(complete ? 'completed' : 'running', nextStep, complete ? 1 : 0, JSON.stringify(wrapped), requestId).run();
    return wrapped;
  } catch (err) {
    const failure = { ok:false, data_ok:false, version:SYSTEM_VERSION, job:input.job || 'run_incremental_temp_refresh_tick', request_id:requestId, processed_step:step, status:'failed_exception', error:String(err?.message || err), live_tables_touched:false };
    await env.DB.prepare(`UPDATE incremental_temp_refresh_runs SET status='failed', finished_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP, error=?, output_json=? WHERE request_id=?`).bind(failure.error, JSON.stringify(failure), requestId).run().catch(() => null);
    return failure;
  }
}
async function checkIncrementalTempData(input, env) {
  await ensureIncrementalTempTables(env);
  const stale_finalizer = await finalizeStaleIncrementalTaskState(env);
  const counts = [await staticTableCount(env,'player_game_logs_temp'), await staticTableCount(env,'ref_player_splits_temp')];
  const duplicateTempLogs = await sampleRows(env, `SELECT player_id, game_pk, group_type, COUNT(*) AS rows_count FROM player_game_logs_temp GROUP BY player_id, game_pk, group_type HAVING COUNT(*) > 1 LIMIT 20`);
  const duplicateTempSplits = await sampleRows(env, `SELECT player_id, season, group_type, split_code, COUNT(*) AS rows_count FROM ref_player_splits_temp GROUP BY player_id, season, group_type, split_code HAVING COUNT(*) > 1 LIMIT 20`);
  const latestRun = await env.DB.prepare(`SELECT request_id, status, current_step, created_at, started_at, finished_at, updated_at, error, substr(output_json,1,1200) AS output_preview FROM incremental_temp_refresh_runs ORDER BY created_at DESC LIMIT 1`).first().catch(() => null);
  const dataOk = duplicateTempLogs.length === 0 && duplicateTempSplits.length === 0;
  return { ok:true, data_ok:dataOk, job:input.job || 'check_incremental_temp_all', version:SYSTEM_VERSION, status:dataOk?'pass':'needs_review', counts, quality:{ duplicate_temp_logs:duplicateTempLogs, duplicate_temp_splits:duplicateTempSplits }, latest_temp_refresh:latestRun, stale_finalizer, live_tables_touched:false };
}
async function auditIncrementalTempCertification(input, env) {
  await ensureIncrementalTempTables(env);
  const stale_finalizer = await finalizeStaleIncrementalTaskState(env);
  const latestRun = await env.DB.prepare(`SELECT request_id, status, current_step, created_at, started_at, finished_at, updated_at, error, output_json FROM incremental_temp_refresh_runs ORDER BY created_at DESC LIMIT 1`).first().catch(() => null);
  const counts = [await staticTableCount(env,'player_game_logs_temp'), await staticTableCount(env,'ref_player_splits_temp'), await staticTableCount(env,'player_game_logs'), await staticTableCount(env,'ref_player_splits'), await staticTableCount(env,'incremental_player_metrics')];
  const m = Object.fromEntries(counts.map(c => [c.table, Number(c.rows_count || 0)])); const failures=[]; const warnings=[];
  const isAuditStep = !!latestRun && latestRun.current_step === 'audit' && latestRun.status === 'running';
  const isCompletedFinalState = !!latestRun && latestRun.status === 'completed' && latestRun.current_step === 'completed' && !latestRun.error;
  const isPostCleanEmptyTemp = isCompletedFinalState && (m.player_game_logs_temp || 0) === 0 && (m.ref_player_splits_temp || 0) === 0;
  if (!latestRun) failures.push({ code:'TEMP_REFRESH_NOT_FOUND' });
  else if (latestRun.error) failures.push({ code:'TEMP_REFRESH_HAS_ERROR', error:latestRun.error, latest_run:{ request_id:latestRun.request_id, status:latestRun.status, current_step:latestRun.current_step, updated_at:latestRun.updated_at } });
  else if (!isAuditStep && !isCompletedFinalState) failures.push({ code:'TEMP_REFRESH_NOT_READY_FOR_AUDIT', latest_run:{ request_id:latestRun.request_id, status:latestRun.status, current_step:latestRun.current_step, updated_at:latestRun.updated_at } });
  if (isAuditStep) {
    if ((m.player_game_logs_temp || 0) < 10000) failures.push({ code:'TEMP_GAME_LOG_ROWS_LOW', rows_count:m.player_game_logs_temp, required_min:10000 });
    if ((m.ref_player_splits_temp || 0) < 1000) failures.push({ code:'TEMP_SPLIT_ROWS_LOW', rows_count:m.ref_player_splits_temp, required_min:1000 });
  } else if (isCompletedFinalState) {
    if ((m.player_game_logs || 0) < 10000) failures.push({ code:'LIVE_GAME_LOG_ROWS_LOW_AFTER_COMPLETED_PIPELINE', rows_count:m.player_game_logs, required_min:10000 });
    if ((m.ref_player_splits || 0) < 1000) failures.push({ code:'LIVE_SPLIT_ROWS_LOW_AFTER_COMPLETED_PIPELINE', rows_count:m.ref_player_splits, required_min:1000 });
    if ((m.incremental_player_metrics || 0) < 700) failures.push({ code:'DERIVED_METRIC_ROWS_LOW_AFTER_COMPLETED_PIPELINE', rows_count:m.incremental_player_metrics, required_min:700 });
    if (isPostCleanEmptyTemp) warnings.push({ code:'TEMP_TABLES_EMPTY_AFTER_SUCCESSFUL_CLEAN', note:'Expected after completed pipeline. Audit used live table counts and final completed state.' });
  }
  const duplicateTempLogs = await sampleRows(env, `SELECT player_id, game_pk, group_type, COUNT(*) AS rows_count FROM player_game_logs_temp GROUP BY player_id, game_pk, group_type HAVING COUNT(*) > 1 LIMIT 20`);
  const duplicateTempSplits = await sampleRows(env, `SELECT player_id, season, group_type, split_code, COUNT(*) AS rows_count FROM ref_player_splits_temp GROUP BY player_id, season, group_type, split_code HAVING COUNT(*) > 1 LIMIT 20`);
  if (duplicateTempLogs.length) failures.push({ code:'DUPLICATE_TEMP_GAME_LOG_KEYS', rows:duplicateTempLogs });
  if (duplicateTempSplits.length) failures.push({ code:'DUPLICATE_TEMP_SPLIT_KEYS', rows:duplicateTempSplits });
  const grade = failures.length ? 'F' : warnings.length ? 'A' : 'A+'; const dataOk = grade === 'A+' || grade === 'A'; const auditId = crypto.randomUUID();
  const result = { ok:true, data_ok:dataOk, job:input.job || 'audit_incremental_temp_certification', version:SYSTEM_VERSION, status:dataOk?'certified':'blocked', certification_grade:grade, promotion_allowed:dataOk && isAuditStep, final_state_certified:dataOk && isCompletedFinalState, audit_mode:isCompletedFinalState?'COMPLETED_FINAL_STATE_LIVE_COUNTS':'ACTIVE_TEMP_PRE_PROMOTION', temp_refresh:latestRun ? { request_id:latestRun.request_id, status:latestRun.status, current_step:latestRun.current_step, created_at:latestRun.created_at, started_at:latestRun.started_at, finished_at:latestRun.finished_at, updated_at:latestRun.updated_at, error:latestRun.error || null } : null, counts, quality:{ failures, warnings }, stale_finalizer, live_tables_touched:false };
  await env.DB.prepare(`INSERT OR REPLACE INTO incremental_temp_certification_audits (audit_id, grade, data_ok, status, temp_refresh_request_id, counts_json, failures_json, warnings_json, output_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(auditId, grade, dataOk?1:0, result.status, latestRun?.request_id || null, JSON.stringify(counts), JSON.stringify(failures), JSON.stringify(warnings), JSON.stringify(result)).run();
  return { ...result, audit_id:auditId };
}
async function latestIncrementalTempAudit(env) {
  await ensureIncrementalTempTables(env);
  return await env.DB.prepare(`SELECT audit_id, grade, data_ok, status, temp_refresh_request_id, created_at, output_json FROM incremental_temp_certification_audits ORDER BY created_at DESC LIMIT 1`).first().catch(()=>null);
}
async function promoteIncrementalTempToLive(input, env) {
  await ensureIncrementalTempTables(env);
  const stale_finalizer = await finalizeStaleIncrementalTaskState(env);
  const latestRun = await env.DB.prepare(`SELECT request_id, status, current_step, finished_at, updated_at FROM incremental_temp_refresh_runs ORDER BY created_at DESC LIMIT 1`).first().catch(()=>null);
  const audit = await latestIncrementalTempAudit(env);
  if (!latestRun || latestRun.current_step !== 'promote') return { ok:false, data_ok:false, job:input.job || 'promote_incremental_temp_to_live', version:SYSTEM_VERSION, status:'blocked_temp_refresh_not_ready_for_promotion', latest_temp_refresh:latestRun, stale_finalizer, live_tables_touched:false };
  if (!audit || !['A+','A'].includes(String(audit.grade || '')) || audit.temp_refresh_request_id !== latestRun.request_id) return { ok:false, data_ok:false, job:input.job || 'promote_incremental_temp_to_live', version:SYSTEM_VERSION, status:'blocked_no_valid_certified_audit', latest_audit:audit, stale_finalizer, live_tables_touched:false };
  const before = [await staticTableCount(env,'player_game_logs'), await staticTableCount(env,'ref_player_splits')];
  const dedupe = await dedupeIncrementalTempTables(env);
  const tempCounts = [await staticTableCount(env,'player_game_logs_temp'), await staticTableCount(env,'ref_player_splits_temp')];
  const logPromote = await env.DB.prepare(`INSERT OR REPLACE INTO player_game_logs SELECT * FROM player_game_logs_temp`).run();
  const splitPromote = await env.DB.prepare(`INSERT OR REPLACE INTO ref_player_splits SELECT * FROM ref_player_splits_temp`).run();
  const after = [await staticTableCount(env,'player_game_logs'), await staticTableCount(env,'ref_player_splits')];
  return { ok:true, data_ok:true, job:input.job || 'promote_incremental_temp_to_live', version:SYSTEM_VERSION, status:'promoted_idempotent', certification_grade:audit.grade, audit_id:audit.audit_id, temp_refresh_request_id:latestRun.request_id, before_counts:before, temp_counts:tempCounts, after_counts:after, dedupe, stale_finalizer, promote_meta:{ game_logs:logPromote?.meta || null, splits:splitPromote?.meta || null }, live_tables_touched:true, note:'Certified incremental temp tables promoted with idempotent INSERT OR REPLACE after temp dedupe. Safe to rerun without UNIQUE crashes. Derived metrics rebuild is next step.' };
}
async function cleanIncrementalTempTables(input, env) {
  await ensureIncrementalTempTables(env);
  const stale_finalizer = await finalizeStaleIncrementalTaskState(env);
  const before=[await staticTableCount(env,'player_game_logs_temp'), await staticTableCount(env,'ref_player_splits_temp')];
  const reset = await resetIncrementalTempTables(env);
  const after=[await staticTableCount(env,'player_game_logs_temp'), await staticTableCount(env,'ref_player_splits_temp')];
  return { ok:true, data_ok:true, job:input.job || 'clean_incremental_temp_tables', version:SYSTEM_VERSION, status:'temp_reset_cleaned', before_counts:before, after_counts:after, reset, stale_finalizer, live_tables_touched:false, note:'Incremental temp tables were cleaned by DROP + CREATE empty tables to avoid D1 timeout from large DELETE operations.' };
}


async function staticTableCount(env, tableName) {
  if (!(await tableExists(env, tableName))) return { table: tableName, exists: false, rows_count: 0 };
  const row = await env.DB.prepare(`SELECT COUNT(*) AS c FROM ${tableName}`).first();
  return { table: tableName, exists: true, rows_count: Number(row?.c || 0) };
}

async function checkStaticData(input, env, target) {
  const targets = target === 'all' ? ['ref_venues','ref_team_aliases','ref_players','ref_player_splits','player_game_logs','ref_bvp_history'] : [target];
  const counts = [];
  for (const t of targets) counts.push(await staticTableCount(env, t));
  const dataOk = counts.every(c => c.exists && c.rows_count > 0);
  const samples = {};
  for (const c of counts) {
    if (!c.exists || c.rows_count <= 0) continue;
    const rows = await env.DB.prepare(`SELECT * FROM ${c.table} LIMIT 10`).all();
    samples[c.table] = rows.results || [];
  }
  return { ok: true, data_ok: dataOk, job: input.job || `check_static_${target}`, version: SYSTEM_VERSION, status: dataOk ? 'pass' : 'needs_scrape', counts, samples, note: "Static checks are read-only. Missing/zero tables are not HTTP failures; fix them with the matching STATIC scrape button." };
}


async function ensureIncrementalBaseTables(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS incremental_player_metrics (player_id INTEGER PRIMARY KEY, player_name TEXT, team_id TEXT, role TEXT, season INTEGER, games_logged INTEGER, first_game_date TEXT, last_game_date TEXT, total_pa INTEGER, total_ab INTEGER, total_hits INTEGER, total_rbi INTEGER, total_home_runs INTEGER, total_walks INTEGER, total_strikeouts INTEGER, last3_games INTEGER, last3_hits INTEGER, last3_ab INTEGER, last5_games INTEGER, last5_hits INTEGER, last5_ab INTEGER, last10_games INTEGER, last10_hits INTEGER, last10_ab INTEGER, last20_games INTEGER, last20_hits INTEGER, last20_ab INTEGER, source_name TEXT, source_confidence TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
}
function incrementalGroupFromJob(jobName, prefix) {
  const m = String(jobName || '').match(new RegExp('^' + prefix + '_g([1-6])$'));
  return m ? Number(m[1]) : 1;
}
async function runIncrementalBaseGameLogs(input, env) {
  const requestedJob = String(input?.job || 'incremental_base_game_logs_g1');
  const group = incrementalGroupFromJob(requestedJob, 'incremental_base_game_logs');
  const result = await syncStaticPlayerGameLogs({ ...(input || {}), job: `scrape_static_game_logs_g${group}` }, env);
  return { ...result, job: requestedJob, mode: 'incremental_history_base_game_logs', source_job: `scrape_static_game_logs_g${group}`, note: 'Run the same Incremental Game Logs G button until remaining_in_group_after is 0, then move to the next group. This is the one-time historical base fill path; future daily updater should only add new deltas.' };
}
async function runIncrementalBaseSplits(input, env) {
  const requestedJob = String(input?.job || 'incremental_base_splits_g1');
  const group = incrementalGroupFromJob(requestedJob, 'incremental_base_splits');
  const result = await syncStaticPlayerSplits({ ...(input || {}), job: `scrape_static_player_splits_g${group}` }, env);
  return { ...result, job: requestedJob, mode: 'incremental_history_base_player_splits', source_job: `scrape_static_player_splits_g${group}`, note: 'Run the same Incremental Splits G button until remaining_in_group_after is 0, then move to the next group. Splits are season-evolving incremental data, not true static data.' };
}
async function buildIncrementalBaseDerivedMetrics(input, env) {
  await ensureStaticReferenceTables(env);
  await ensureIncrementalBaseTables(env);
  const season = Number(String(resolveSlateDate(input || {}).slate_date).slice(0,4));
  const before = await env.DB.prepare(`SELECT COUNT(*) AS rows_count FROM incremental_player_metrics`).first().catch(() => ({ rows_count: 0 }));

  await env.DB.prepare(`DELETE FROM incremental_player_metrics WHERE season = ?`).bind(season).run();

  const insertResult = await env.DB.prepare(`
    INSERT OR REPLACE INTO incremental_player_metrics (
      player_id, player_name, team_id, role, season,
      games_logged, first_game_date, last_game_date,
      total_pa, total_ab, total_hits, total_rbi, total_home_runs, total_walks, total_strikeouts,
      last3_games, last3_hits, last3_ab,
      last5_games, last5_hits, last5_ab,
      last10_games, last10_hits, last10_ab,
      last20_games, last20_hits, last20_ab,
      source_name, source_confidence, updated_at
    )
    WITH ordered_logs AS (
      SELECT
        g.player_id,
        g.season,
        g.game_date,
        g.game_pk,
        COALESCE(g.pa, 0) AS pa,
        COALESCE(g.ab, 0) AS ab,
        COALESCE(g.hits, 0) AS hits,
        COALESCE(g.home_runs, 0) AS home_runs,
        COALESCE(g.walks, 0) AS walks,
        COALESCE(g.strikeouts, 0) AS strikeouts,
        CASE WHEN g.raw_json IS NOT NULL AND json_valid(g.raw_json) THEN COALESCE(json_extract(g.raw_json, '$.stat.rbi'), 0) ELSE 0 END AS rbi,
        ROW_NUMBER() OVER (PARTITION BY g.player_id ORDER BY date(g.game_date) DESC, g.game_pk DESC) AS rn
      FROM player_game_logs g
      WHERE g.season = ?
    ), player_rollups AS (
      SELECT
        player_id,
        COUNT(*) AS games_logged,
        MIN(game_date) AS first_game_date,
        MAX(game_date) AS last_game_date,
        SUM(pa) AS total_pa,
        SUM(ab) AS total_ab,
        SUM(hits) AS total_hits,
        SUM(rbi) AS total_rbi,
        SUM(home_runs) AS total_home_runs,
        SUM(walks) AS total_walks,
        SUM(strikeouts) AS total_strikeouts,
        SUM(CASE WHEN rn <= 3 THEN 1 ELSE 0 END) AS last3_games,
        SUM(CASE WHEN rn <= 3 THEN hits ELSE 0 END) AS last3_hits,
        SUM(CASE WHEN rn <= 3 THEN ab ELSE 0 END) AS last3_ab,
        SUM(CASE WHEN rn <= 5 THEN 1 ELSE 0 END) AS last5_games,
        SUM(CASE WHEN rn <= 5 THEN hits ELSE 0 END) AS last5_hits,
        SUM(CASE WHEN rn <= 5 THEN ab ELSE 0 END) AS last5_ab,
        SUM(CASE WHEN rn <= 10 THEN 1 ELSE 0 END) AS last10_games,
        SUM(CASE WHEN rn <= 10 THEN hits ELSE 0 END) AS last10_hits,
        SUM(CASE WHEN rn <= 10 THEN ab ELSE 0 END) AS last10_ab,
        SUM(CASE WHEN rn <= 20 THEN 1 ELSE 0 END) AS last20_games,
        SUM(CASE WHEN rn <= 20 THEN hits ELSE 0 END) AS last20_hits,
        SUM(CASE WHEN rn <= 20 THEN ab ELSE 0 END) AS last20_ab
      FROM ordered_logs
      GROUP BY player_id
    )
    SELECT
      p.player_id, p.player_name, p.team_id, p.role, ? AS season,
      r.games_logged, r.first_game_date, r.last_game_date,
      r.total_pa, r.total_ab, r.total_hits, r.total_rbi, r.total_home_runs, r.total_walks, r.total_strikeouts,
      r.last3_games, r.last3_hits, r.last3_ab,
      r.last5_games, r.last5_hits, r.last5_ab,
      r.last10_games, r.last10_hits, r.last10_ab,
      r.last20_games, r.last20_hits, r.last20_ab,
      'derived_from_player_game_logs_d1_set_based',
      'HIGH_DETERMINISTIC_FROM_MLB_GAMELOGS_NO_EXTERNAL_CALLS',
      CURRENT_TIMESTAMP
    FROM player_rollups r
    JOIN ref_players p ON p.player_id = r.player_id
    WHERE p.active = 1
  `).bind(season, season).run();

  const count = await env.DB.prepare(`SELECT COUNT(*) AS rows_count FROM incremental_player_metrics WHERE season = ?`).bind(season).first();
  const activePlayers = await env.DB.prepare(`SELECT COUNT(*) AS c FROM ref_players WHERE active=1`).first().catch(() => ({ c: 0 }));
  const skipped = await env.DB.prepare(`SELECT COUNT(*) AS c FROM ref_players p LEFT JOIN incremental_player_metrics m ON m.player_id = p.player_id AND m.season = ? WHERE p.active=1 AND m.player_id IS NULL`).bind(season).first().catch(() => ({ c: 0 }));
  const samples = await env.DB.prepare(`SELECT player_id, player_name, role, games_logged, last_game_date, last10_hits, last10_ab, total_rbi, total_home_runs FROM incremental_player_metrics WHERE season=? ORDER BY games_logged DESC, player_name LIMIT 10`).bind(season).all();

  return { ok:true, data_ok:Number(count?.rows_count || 0) > 0, job:input.job || 'incremental_base_derived_metrics', version:SYSTEM_VERSION, status:'pass', table:'incremental_player_metrics', season, build_mode:'D1_ONLY_SET_BASED_REBUILD', external_api_calls:0, before_rows:Number(before?.rows_count || 0), total_incremental_player_metrics_after:Number(count?.rows_count || 0), active_players:Number(activePlayers?.c || 0), skipped_players_no_logs:Number(skipped?.c || 0), d1_meta:insertResult?.meta || null, samples:samples.results || [], source_tables:['player_game_logs','ref_players'], live_tables_touched:true, note:'v1.2.91 derived metrics are rebuilt with one D1 set-based SQL path. No MLB API calls, no Gemini calls, no per-player Worker loop.' };
}
async function repairMissingRefPlayers(input, env) {
  await ensureStaticReferenceTables(env);
  const season = Number(String(resolveSlateDate(input || {}).slate_date).slice(0,4));
  const limit = Math.max(1, Math.min(50, Number(input?.limit || 25)));
  const beforeDistinct = await env.DB.prepare(`
    SELECT COUNT(*) AS c FROM (
      SELECT DISTINCT g.player_id
      FROM player_game_logs g
      LEFT JOIN ref_players p ON p.player_id = g.player_id
      WHERE g.season = ? AND p.player_id IS NULL
      UNION
      SELECT DISTINCT s.player_id
      FROM ref_player_splits s
      LEFT JOIN ref_players p ON p.player_id = s.player_id
      WHERE s.season = ? AND p.player_id IS NULL
    )
  `).bind(season, season).first().catch(() => ({ c: 0 }));
  const orphans = await env.DB.prepare(`
    SELECT player_id, MAX(game_date) AS latest_game_date, MAX(team_id) AS latest_team_id, MAX(group_type) AS latest_group_type
    FROM player_game_logs
    WHERE season = ?
      AND player_id NOT IN (SELECT player_id FROM ref_players)
    GROUP BY player_id
    UNION
    SELECT s.player_id, NULL AS latest_game_date, NULL AS latest_team_id, MAX(s.group_type) AS latest_group_type
    FROM ref_player_splits s
    WHERE s.season = ?
      AND s.player_id NOT IN (SELECT player_id FROM ref_players)
    GROUP BY s.player_id
    LIMIT ?
  `).bind(season, season, limit).all();
  const rows = orphans.results || [];
  const insertStmt = env.DB.prepare(`
    INSERT OR REPLACE INTO ref_players (
      player_id, mlb_id, player_name, team_id, primary_position, role,
      bats, throws, birth_date, age, active, source_name, source_confidence, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  const repaired = [];
  const failed = [];
  let apiFetches = 0;
  for (const o of rows) {
    const playerId = Number(o.player_id || 0);
    if (!playerId) continue;
    let person = null;
    let sourceName = 'mlb_statsapi_people_orphan_repair';
    let sourceConfidence = 'MEDIUM_REPAIRED_REFERENCE_FOR_HISTORICAL_LOGS';
    try {
      apiFetches++;
      const url = `https://statsapi.mlb.com/api/v1/people/${encodeURIComponent(playerId)}?hydrate=currentTeam`;
      const fetched = await fetchJsonWithRetry(url, {}, 2, `repair_missing_ref_player_${playerId}`);
      if (fetched.ok && fetched.data?.people?.length) {
        person = fetched.data.people[0];
        sourceConfidence = 'HIGH_FOR_MLB_PEOPLE_IDENTITY_MEDIUM_FOR_ACTIVE_STATUS';
      } else {
        failed.push({ player_id: playerId, stage: 'fetch_people', error: fetched.error || 'no_people_row' });
      }
    } catch (e) {
      failed.push({ player_id: playerId, stage: 'fetch_people_exception', error: String(e?.message || e) });
    }

    const fallback = await env.DB.prepare(`
      SELECT team_id, group_type,
             CASE WHEN raw_json IS NOT NULL AND json_valid(raw_json) THEN json_extract(raw_json, '$.player.fullName') ELSE NULL END AS raw_player_name
      FROM player_game_logs
      WHERE player_id = ? AND season = ?
      ORDER BY date(game_date) DESC
      LIMIT 1
    `).bind(playerId, season).first().catch(() => null);

    const primary = person?.primaryPosition?.abbreviation || person?.primaryPosition?.code || null;
    const currentTeamId = person?.currentTeam?.id ? MLB_TEAM_ABBR[Number(person.currentTeam.id)] : null;
    const teamId = currentTeamId || fallback?.team_id || o.latest_team_id || null;
    const role = normalizeRoleFromPosition(primary, person?.pitchHand?.code) || (String(fallback?.group_type || o.latest_group_type || '').toLowerCase() === 'pitching' ? 'PITCHER' : 'BATTER');
    const playerName = person?.fullName || fallback?.raw_player_name || `MLB Player ${playerId}`;
    const active = Number(input?.activate_repaired_players || 0) === 1 ? 1 : 0;

    try {
      const res = await insertStmt.bind(
        playerId,
        playerId,
        playerName,
        teamId,
        primary,
        role,
        person?.batSide?.code || null,
        person?.pitchHand?.code || null,
        person?.birthDate || null,
        ageFromBirthDate(person?.birthDate),
        active,
        sourceName,
        sourceConfidence
      ).run();
      repaired.push({ player_id: playerId, player_name: playerName, team_id: teamId, role, active, changes: Number(res?.meta?.changes || 0), latest_game_date: o.latest_game_date || null });
    } catch (e) {
      failed.push({ player_id: playerId, stage: 'insert_ref_players', error: String(e?.message || e) });
    }
  }

  const afterDistinct = await env.DB.prepare(`
    SELECT COUNT(*) AS c FROM (
      SELECT DISTINCT g.player_id
      FROM player_game_logs g
      LEFT JOIN ref_players p ON p.player_id = g.player_id
      WHERE g.season = ? AND p.player_id IS NULL
      UNION
      SELECT DISTINCT s.player_id
      FROM ref_player_splits s
      LEFT JOIN ref_players p ON p.player_id = s.player_id
      WHERE s.season = ? AND p.player_id IS NULL
    )
  `).bind(season, season).first().catch(() => ({ c: 0 }));
  const afterLogRows = await env.DB.prepare(`
    SELECT COUNT(*) AS c
    FROM player_game_logs g
    LEFT JOIN ref_players p ON p.player_id = g.player_id
    WHERE g.season = ? AND p.player_id IS NULL
  `).bind(season).first().catch(() => ({ c: 0 }));
  const dataOk = Number(afterDistinct?.c || 0) === 0 && failed.length === 0;
  return {
    ok: dataOk,
    data_ok: dataOk,
    job: input.job || 'repair_missing_ref_players',
    version: SYSTEM_VERSION,
    status: dataOk ? 'pass' : 'partial_retry_needed',
    season,
    before_orphan_distinct_players: Number(beforeDistinct?.c || 0),
    repaired_count: repaired.length,
    after_orphan_distinct_players: Number(afterDistinct?.c || 0),
    after_orphan_game_log_rows: Number(afterLogRows?.c || 0),
    external_api_calls: apiFetches,
    repaired,
    errors: failed,
    live_tables_touched: true,
    note: 'Repairs missing ref_players rows for valid historical incremental logs/splits. Repaired rows default active=0 so the active roster universe stays stable; rerun derived metrics after this job.'
  };
}
async function checkIncrementalBaseData(input, env, target = 'all') {
  await ensureStaticReferenceTables(env);
  await ensureIncrementalBaseTables(env);
  const season = Number(String(resolveSlateDate(input || {}).slate_date).slice(0,4));
  const counts = [];
  async function addCount(table, seasonAware = false) {
    try {
      const sql = seasonAware ? `SELECT COUNT(*) AS rows_count FROM ${table} WHERE season = ?` : `SELECT COUNT(*) AS rows_count FROM ${table}`;
      const stmt = seasonAware ? env.DB.prepare(sql).bind(season) : env.DB.prepare(sql);
      const r = await stmt.first();
      counts.push({ table, exists:true, rows_count:Number(r?.rows_count || 0) });
    } catch (e) {
      counts.push({ table, exists:false, rows_count:0, error:String(e?.message || e) });
    }
  }

  // v1.2.85: derived check is intentionally lite. The previous generic checker could run
  // expensive full-table GROUP BY scans and time out D1 after the derived build already passed.
  if (target === 'derived') {
    await addCount('incremental_player_metrics', true);
    const activePlayers = await env.DB.prepare(`SELECT COUNT(*) AS c FROM ref_players WHERE active=1`).first().catch(() => ({ c: 0 }));
    const derivedCoverage = await env.DB.prepare(`
      SELECT
        COUNT(*) AS players_with_metrics,
        MIN(last_game_date) AS oldest_last_game,
        MAX(last_game_date) AS newest_last_game,
        SUM(CASE WHEN games_logged IS NULL OR games_logged <= 0 THEN 1 ELSE 0 END) AS players_with_zero_games,
        SUM(CASE WHEN player_name IS NULL OR TRIM(player_name) = '' THEN 1 ELSE 0 END) AS missing_player_names,
        SUM(CASE WHEN role IS NULL OR TRIM(role) = '' THEN 1 ELSE 0 END) AS missing_roles,
        SUM(CASE WHEN source_confidence IS NULL OR TRIM(source_confidence) = '' THEN 1 ELSE 0 END) AS missing_source_confidence
      FROM incremental_player_metrics
      WHERE season = ?
    `).bind(season).first().catch(() => null);
    const roleSplit = await env.DB.prepare(`
      SELECT role, COUNT(*) AS players_with_metrics
      FROM incremental_player_metrics
      WHERE season = ?
      GROUP BY role
      ORDER BY role
    `).bind(season).all().catch(() => ({ results: [] }));
    const samples = {
      incremental_player_metrics: (await env.DB.prepare(`
        SELECT player_id, player_name, team_id, role, games_logged, first_game_date, last_game_date,
               total_ab, total_hits, total_rbi, total_home_runs, last3_hits, last5_hits, last10_hits, last20_hits,
               source_confidence, updated_at
        FROM incremental_player_metrics
        WHERE season = ?
        ORDER BY updated_at DESC, player_name
        LIMIT 10
      `).bind(season).all().catch(() => ({ results: [] }))).results || []
    };
    const failures = [];
    const warnings = [];
    const active = Number(activePlayers?.c || 0);
    const playersWithMetrics = Number(derivedCoverage?.players_with_metrics || 0);
    const minCov = Math.max(700, Math.floor(active * 0.85));
    if (playersWithMetrics < minCov) failures.push('derived_metric_player_coverage_low');
    if (Number(derivedCoverage?.players_with_zero_games || 0) > 0) failures.push('derived_metrics_zero_game_rows');
    if (Number(derivedCoverage?.missing_player_names || 0) > 0) failures.push('derived_metrics_missing_player_names');
    if (Number(derivedCoverage?.missing_roles || 0) > 0) failures.push('derived_metrics_missing_roles');
    if (Number(derivedCoverage?.missing_source_confidence || 0) > 0) warnings.push('derived_metrics_missing_source_confidence');
    if (playersWithMetrics < active) warnings.push('some_active_players_have_no_derived_metrics_because_no_game_logs');
    const dataOk = failures.length === 0;
    return {
      ok:true,
      data_ok:dataOk,
      job:input.job || 'check_incremental_derived_metrics',
      version:SYSTEM_VERSION,
      status:dataOk ? 'pass' : 'needs_review',
      season,
      check_mode:'DERIVED_LITE_D1_SAFE',
      counts,
      coverage:{ active_players:active, derived_metrics:derivedCoverage, role_split:roleSplit.results || [] },
      quality:{ failures, warnings, full_table_duplicate_scan_skipped:true, reason:'v1.2.91 avoids heavy D1 timeout scans for derived-only check' },
      samples,
      external_api_calls:0,
      live_tables_touched:false,
      note:'v1.2.91 derived check is lightweight: count, coverage, null/zero integrity, role split, and 10-row sample only. No heavy full-table duplicate scan.'
    };
  }

  if (target === 'game_logs' || target === 'all') await addCount('player_game_logs', true);
  if (target === 'splits' || target === 'all') await addCount('ref_player_splits', true);
  if (target === 'all') await addCount('incremental_player_metrics', true);

  const activePlayers = await env.DB.prepare(`SELECT COUNT(*) AS c FROM ref_players WHERE active=1`).first().catch(() => ({ c: 0 }));
  const gameCoverage = (target === 'game_logs' || target === 'all')
    ? await env.DB.prepare(`SELECT COUNT(DISTINCT player_id) AS players_with_logs, COUNT(*) AS log_rows, MIN(game_date) AS first_game_date, MAX(game_date) AS last_game_date FROM player_game_logs WHERE season=?`).bind(season).first().catch(() => null)
    : null;
  const splitCoverage = (target === 'splits' || target === 'all')
    ? await env.DB.prepare(`SELECT COUNT(DISTINCT player_id) AS players_with_splits, COUNT(*) AS split_rows FROM ref_player_splits WHERE season=?`).bind(season).first().catch(() => null)
    : null;
  const derivedCoverage = (target === 'all')
    ? await env.DB.prepare(`SELECT COUNT(*) AS players_with_metrics, MIN(last_game_date) AS oldest_last_game, MAX(last_game_date) AS newest_last_game FROM incremental_player_metrics WHERE season=?`).bind(season).first().catch(() => null)
    : null;

  const duplicateLogs = (target === 'game_logs')
    ? await env.DB.prepare(`SELECT player_id, season, game_pk, COUNT(*) AS rows_count FROM player_game_logs WHERE season=? GROUP BY player_id, season, game_pk HAVING COUNT(*) > 1 LIMIT 20`).bind(season).all().catch(() => ({ results: [] }))
    : { results: [] };
  const duplicateSplits = (target === 'splits')
    ? await env.DB.prepare(`SELECT player_id, season, group_type, split_code, COUNT(*) AS rows_count FROM ref_player_splits WHERE season=? GROUP BY player_id, season, group_type, split_code HAVING COUNT(*) > 1 LIMIT 20`).bind(season).all().catch(() => ({ results: [] }))
    : { results: [] };
  const orphanLogs = (target === 'game_logs')
    ? await env.DB.prepare(`SELECT COUNT(*) AS c FROM player_game_logs g LEFT JOIN ref_players p ON p.player_id=g.player_id WHERE g.season=? AND p.player_id IS NULL`).bind(season).first().catch(() => ({ c: 0 }))
    : { c: 0 };
  const roleSplit = (target === 'game_logs')
    ? await env.DB.prepare(`SELECT p.role, COUNT(DISTINCT g.player_id) AS players_with_logs, COUNT(g.game_pk) AS log_rows FROM player_game_logs g JOIN ref_players p ON p.player_id=g.player_id WHERE g.season=? GROUP BY p.role ORDER BY p.role`).bind(season).all().catch(() => ({ results: [] }))
    : { results: [] };

  const samples = {};
  if (target === 'game_logs' || target === 'all') samples.player_game_logs = (await env.DB.prepare(`SELECT player_id, season, game_date, team_id, opponent_team, group_type, pa, ab, hits, home_runs, strikeouts, walks, source_confidence, updated_at FROM player_game_logs WHERE season=? ORDER BY updated_at DESC LIMIT 10`).bind(season).all().catch(() => ({ results: [] }))).results || [];
  if (target === 'splits' || target === 'all') samples.ref_player_splits = (await env.DB.prepare(`SELECT player_id, season, group_type, split_code, pa, ab, hits, home_runs, strikeouts, walks, avg, obp, slg, ops, source_confidence, updated_at FROM ref_player_splits WHERE season=? ORDER BY updated_at DESC LIMIT 10`).bind(season).all().catch(() => ({ results: [] }))).results || [];
  if (target === 'all') samples.incremental_player_metrics = (await env.DB.prepare(`SELECT player_id, player_name, role, games_logged, last_game_date, total_ab, total_hits, total_rbi, last10_hits, last10_ab, source_confidence, updated_at FROM incremental_player_metrics WHERE season=? ORDER BY updated_at DESC LIMIT 10`).bind(season).all().catch(() => ({ results: [] }))).results || [];

  const failures = [], warnings = [];
  const minCov = Math.max(700, Math.floor(Number(activePlayers?.c || 0) * 0.85));
  if ((target === 'game_logs' || target === 'all') && Number(gameCoverage?.players_with_logs || 0) < minCov) failures.push('game_log_player_coverage_low');
  if ((target === 'splits' || target === 'all') && Number(splitCoverage?.players_with_splits || 0) < minCov) failures.push('split_player_coverage_low');
  if (target === 'all' && Number(derivedCoverage?.players_with_metrics || 0) < minCov) failures.push('derived_metric_player_coverage_low');
  if ((duplicateLogs.results || []).length) failures.push('duplicate_player_game_logs');
  if ((duplicateSplits.results || []).length) failures.push('duplicate_player_splits');
  if (Number(orphanLogs?.c || 0) > 0) failures.push('orphan_game_logs_without_ref_player');
  if (Number(gameCoverage?.players_with_logs || 0) < Number(activePlayers?.c || 0) && (target === 'game_logs' || target === 'all')) warnings.push('some_active_players_have_no_game_logs_this_season');
  if (target === 'all') warnings.push('all_incremental_check_is_lite; run individual checks for deeper duplicate scans');
  const dataOk = failures.length === 0;
  return { ok:true, data_ok:dataOk, job:input.job || `check_incremental_${target}`, version:SYSTEM_VERSION, status:dataOk ? 'pass' : 'needs_review', season, check_mode: target === 'all' ? 'ALL_LITE_D1_SAFE' : 'TARGETED_D1_SAFE', counts, coverage:{ active_players:Number(activePlayers?.c || 0), game_logs:gameCoverage, player_splits:splitCoverage, derived_metrics:derivedCoverage, role_split:roleSplit.results || [] }, quality:{ duplicate_logs:duplicateLogs.results || [], duplicate_splits:duplicateSplits.results || [], orphan_logs_without_ref_player:Number(orphanLogs?.c || 0), failures, warnings }, samples, note:'v1.2.91 incremental checks avoid heavy D1 timeout paths. Derived-only check is lite and safe.' };
}

async function ensureEverydayPhase1Tables(env) {
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS everyday_phase1_runs (" +
    "request_id TEXT PRIMARY KEY, " +
    "slate_date TEXT NOT NULL, " +
    "status TEXT NOT NULL, " +
    "current_step TEXT NOT NULL, " +
    "created_at TEXT DEFAULT CURRENT_TIMESTAMP, " +
    "started_at TEXT, " +
    "finished_at TEXT, " +
    "updated_at TEXT DEFAULT CURRENT_TIMESTAMP, " +
    "error TEXT, " +
    "output_preview TEXT)"
  ).run();
}

const EVERYDAY_PHASE1_STEPS = [
  "games_markets",
  "starters",
  "bullpens",
  "lineups",
  "usage",
  "candidates_hits",
  "candidates_rbi",
  "candidates_rfi",
  "completed"
];

function nextEverydayPhase1Step(step) {
  const idx = EVERYDAY_PHASE1_STEPS.indexOf(String(step || "games_markets"));
  if (idx < 0) return "games_markets";
  return EVERYDAY_PHASE1_STEPS[Math.min(idx + 1, EVERYDAY_PHASE1_STEPS.length - 1)];
}

async function scheduleEverydayPhase1Once(input, env) {
  await ensureEverydayPhase1Tables(env);
  const slate = resolveSlateDate(input || {});
  const existing = await env.DB.prepare("SELECT request_id, status, current_step, created_at, started_at, updated_at FROM everyday_phase1_runs WHERE slate_date=? AND status IN ('pending','running') ORDER BY created_at DESC LIMIT 1").bind(slate.slate_date).first().catch(() => null);
  if (existing) return { ok:true, data_ok:true, job:input.job || "schedule_everyday_phase1_once", version:SYSTEM_VERSION, status:"already_scheduled_or_running", slate_date:slate.slate_date, existing_request:existing, live_tables_touched:false, note:"Everyday Phase 1 baseline already has an active request. Run Baseline Tick to auto-advance the remaining slate-only steps." };
  const requestId = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO everyday_phase1_runs (request_id, slate_date, status, current_step, created_at, updated_at, error, output_preview) VALUES (?, ?, 'pending', 'games_markets', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, NULL)").bind(requestId, slate.slate_date).run();
  return { ok:true, data_ok:true, job:input.job || "schedule_everyday_phase1_once", version:SYSTEM_VERSION, status:"scheduled_for_next_tick", request_id:requestId, slate_date:slate.slate_date, run_after:"run Run Baseline Tick manually or let the scheduler call it", baseline_steps:EVERYDAY_PHASE1_STEPS, live_tables_touched:false, estimated_total_minutes:"usually 10-30 seconds after one auto tick; lineups may return retry_later and not block", note:"Phase 1 baseline uses existing deterministic MLB/API/D1 jobs only. It is today-slate only: no static remine, no incremental history, no Gemini, no weather/news, no final scoring." };
}

function everydayPhase1JobForStep(step) {
  if (step === "games_markets") return "scrape_games_markets";
  if (step === "starters") return "scrape_starters_mlb_api";
  if (step === "bullpens") return "scrape_bullpens_mlb_api";
  if (step === "lineups") return "scrape_lineups_mlb_api";
  if (step === "usage") return "scrape_recent_usage_mlb_api";
  if (step === "candidates_hits") return "build_edge_candidates_hits";
  if (step === "candidates_rbi") return "build_edge_candidates_rbi";
  if (step === "candidates_rfi") return "build_edge_candidates_rfi";
  return null;
}

async function runEverydayPhase1Tick(input, env) {
  await ensureEverydayPhase1Tables(env);
  const slate = resolveSlateDate(input || {});
  const row = await env.DB.prepare("SELECT request_id, slate_date, status, current_step, created_at, started_at, updated_at, error FROM everyday_phase1_runs WHERE slate_date=? AND status IN ('pending','running') ORDER BY created_at ASC LIMIT 1").bind(slate.slate_date).first().catch(() => null);
  if (!row) return { ok:true, data_ok:true, job:input.job || "run_everyday_phase1_tick", version:SYSTEM_VERSION, status:"idle_no_due_phase1_run", slate_date:slate.slate_date, live_tables_touched:false, note:"No pending/running Everyday Phase 1 baseline request." };
  const requestId = row.request_id;
  let currentStep = row.current_step || "games_markets";
  const startedAt = Date.now();
  const maxSteps = Number(input?.max_steps || 8);
  const maxMs = Number(input?.max_ms || 22000);
  const processed = [];
  if (row.status === "pending") await env.DB.prepare("UPDATE everyday_phase1_runs SET status='running', started_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP, error=NULL WHERE request_id=?").bind(requestId).run();
  try {
    for (let i = 0; i < maxSteps; i++) {
      if (currentStep === "completed") break;
      if ((Date.now() - startedAt) > maxMs) break;
      const step = currentStep;
      const jobName = everydayPhase1JobForStep(step);
      if (!jobName) {
        await env.DB.prepare("UPDATE everyday_phase1_runs SET status='failed', finished_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP, error=? WHERE request_id=?").bind("unknown_step_" + step, requestId).run();
        return { ok:false, data_ok:false, job:input.job || "run_everyday_phase1_tick", version:SYSTEM_VERSION, status:"failed_unknown_step", request_id:requestId, step, processed, live_tables_touched:false };
      }
      const t0 = Date.now();
      const result = await executeTaskJob(jobName, { ...(input || {}), job:jobName, slate_date:slate.slate_date, slate_mode:slate.slate_mode, phase1_scope:"TODAY_SLATE_ONLY" }, slate, env);
      const duration_ms = Date.now() - t0;
      if (!result || result.ok === false) throw new Error(String(result?.error || result?.status || "step_failed"));
      const nextStep = nextEverydayPhase1Step(step);
      processed.push({ step, routed_job:jobName, next_step:nextStep, duration_ms, result_status:result.status || (result.data_ok === false ? "needs_review" : "pass"), retry_later:!!result.retry_later, inserted:result.inserted || null, fetched_rows:result.fetched_rows ?? null, live_tables_touched:true });
      currentStep = nextStep;
      const complete = currentStep === "completed";
      await env.DB.prepare("UPDATE everyday_phase1_runs SET current_step=?, status=?, finished_at=CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE finished_at END, updated_at=CURRENT_TIMESTAMP, error=NULL, output_preview=? WHERE request_id=?").bind(currentStep, complete ? "completed" : "running", complete ? 1 : 0, JSON.stringify({ processed, last_result:result }).slice(0,4000), requestId).run();
      if (complete) break;
    }
    const complete = currentStep === "completed";
    const check = await checkEverydayPhase1({ ...(input || {}), job:"check_everyday_phase1", slate_date:slate.slate_date, slate_mode:slate.slate_mode }, env);
    return { ok:true, data_ok:!!check.data_ok, job:input.job || "run_everyday_phase1_tick", version:SYSTEM_VERSION, status:complete ? "completed" : "partial_continue", request_id:requestId, slate_date:slate.slate_date, processed_steps:processed.length, processed, next_step:currentStep, phase1_complete:complete, final_check:check, elapsed_ms:Date.now()-startedAt, live_tables_touched:processed.length>0, note:complete ? "Everyday Phase 1 auto-run completed. Lineups can be retry-later/non-blocking if not posted." : "Everyday Phase 1 auto-run stopped at safety budget. Run Baseline Tick again to continue." };
  } catch (err) {
    const error = String(err?.message || err);
    await env.DB.prepare("UPDATE everyday_phase1_runs SET status='failed', finished_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP, error=?, output_preview=? WHERE request_id=?").bind(error, JSON.stringify({ processed, error }).slice(0,4000), requestId).run().catch(() => null);
    return { ok:false, data_ok:false, job:input.job || "run_everyday_phase1_tick", version:SYSTEM_VERSION, status:"failed_exception", request_id:requestId, slate_date:slate.slate_date, processed, error, live_tables_touched:processed.length>0 };
  }
}

async function runEverydayPhase1Direct(input, env) {
  const slate = resolveSlateDate(input || {});
  const scheduled = await scheduleEverydayPhase1Once({ ...(input || {}), job:"everyday_phase1_all_direct", slate_date:slate.slate_date, slate_mode:slate.slate_mode }, env);
  const tick = await runEverydayPhase1Tick({ ...(input || {}), job:"run_everyday_phase1_tick", slate_date:slate.slate_date, slate_mode:slate.slate_mode, max_steps:8, max_ms:26000 }, env);
  const check = await checkEverydayPhase1({ ...(input || {}), job:"check_everyday_phase1", slate_date:slate.slate_date, slate_mode:slate.slate_mode }, env);
  return { ok:tick.ok !== false && check.ok, data_ok:!!check.data_ok, job:input.job || "everyday_phase1_all_direct", version:SYSTEM_VERSION, status:check.data_ok ? "pass" : "needs_review", slate_date:slate.slate_date, scheduled, tick, check, live_tables_touched:true, warning:"Direct mode runs the same bounded auto-run path. Schedule + Tick is still preferred for iPhone testing." };
}

async function checkEverydayPhase1(input, env) {
  await ensureEverydayPhase1Tables(env);
  const slate = resolveSlateDate(input || {});
  const d = slate.slate_date;
  const counts = {};
  async function c(name, sql, bind) { counts[name] = await countScalar(env, sql, bind).catch(() => 0); }
  await c("games", "SELECT COUNT(*) FROM games WHERE game_date=?", d);
  await c("markets", "SELECT COUNT(*) FROM markets_current WHERE game_id LIKE ?", d + "_%");
  await c("starters", "SELECT COUNT(*) FROM starters_current WHERE game_id LIKE ?", d + "_%");
  await c("bullpens", "SELECT COUNT(*) FROM bullpens_current WHERE game_id LIKE ?", d + "_%");
  await c("lineups", "SELECT COUNT(*) FROM lineups_current WHERE game_id LIKE ?", d + "_%");
  await c("usage_rows", "SELECT COUNT(*) FROM player_recent_usage");
  await c("prizepicks_rows", "SELECT COUNT(*) FROM mlb_stats");
  await c("players_current", "SELECT COUNT(*) FROM players_current");
  await c("hits_candidates", "SELECT COUNT(*) FROM edge_candidates_hits WHERE slate_date=?", d);
  await c("rbi_candidates", "SELECT COUNT(*) FROM edge_candidates_rbi WHERE slate_date=?", d);
  await c("rfi_candidates", "SELECT COUNT(*) FROM edge_candidates_rfi WHERE slate_date=?", d);
  await c("board_queue_rows", "SELECT COUNT(*) FROM board_factor_queue WHERE slate_date=?", d);
  const latestRun = await env.DB.prepare("SELECT request_id, status, current_step, created_at, started_at, finished_at, updated_at, error, substr(output_preview,1,1800) AS output_preview FROM everyday_phase1_runs WHERE slate_date=? ORDER BY created_at DESC LIMIT 1").bind(d).first().catch(() => null);
  const expectedTeams = counts.games * 2;
  const failures = [];
  const warnings = [];
  if (counts.prizepicks_rows <= 0) failures.push("PRIZEPICKS_BOARD_EMPTY");
  if (counts.games <= 0) failures.push("GAMES_EMPTY");
  if (counts.markets <= 0) failures.push("MARKETS_EMPTY");
  if (counts.starters < Math.max(1, expectedTeams - 2)) warnings.push("STARTERS_PARTIAL_OR_EARLY");
  if (counts.bullpens < Math.max(1, expectedTeams - 2)) warnings.push("BULLPENS_PARTIAL_OR_EARLY");
  if (counts.lineups <= 0) warnings.push("LINEUPS_NOT_POSTED_YET");
  if (counts.usage_rows <= 0) warnings.push("RECENT_USAGE_EMPTY");
  if (counts.hits_candidates <= 0) warnings.push("HITS_CANDIDATES_EMPTY");
  if (counts.rbi_candidates <= 0) warnings.push("RBI_CANDIDATES_EMPTY");
  if (counts.rfi_candidates <= 0) warnings.push("RFI_CANDIDATES_EMPTY");
  let phase1AgeSeconds = null;
  if (latestRun?.started_at && !latestRun?.finished_at) {
    const ageRow = await env.DB.prepare("SELECT ROUND((julianday(CURRENT_TIMESTAMP)-julianday(?))*86400,1) AS age_seconds").bind(latestRun.started_at).first().catch(() => null);
    phase1AgeSeconds = Number(ageRow?.age_seconds || 0);
    if (phase1AgeSeconds > 600) warnings.push("PHASE1_RUNNING_LONGER_THAN_EXPECTED_RUN_TICK_AGAIN_OR_PATCH");
  }
  const dataOk = failures.length === 0;
  return { ok:true, data_ok:dataOk, job:input.job || "check_everyday_phase1", version:SYSTEM_VERSION, status:dataOk ? (warnings.length ? "pass_with_warnings" : "pass") : "fail", slate_date:d, check_mode:"EVERYDAY_PHASE1_BASELINE_AUTO_RUNNER", counts, expected_teams:expectedTeams, latest_phase1_run:latestRun, phase1_age_seconds:phase1AgeSeconds, quality:{ failures, warnings }, live_tables_touched:false, note:"Phase 1 validates baseline daily MLB/board data only. Today-slate only; no static remine, no incremental history, no Gemini, no weather/news, no final scoring. Lineups may be retry-later/non-blocking if not posted." };
}



async function ensureGameLineupContextTable(env) {
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS game_lineup_context (" +
    "context_id TEXT PRIMARY KEY, slate_date TEXT NOT NULL, game_id TEXT NOT NULL, team_id TEXT NOT NULL, opponent_team TEXT, side TEXT, " +
    "lineup_rows INTEGER DEFAULT 0, top3_rows INTEGER DEFAULT 0, top5_rows INTEGER DEFAULT 0, top9_rows INTEGER DEFAULT 0, confirmed_rows INTEGER DEFAULT 0, " +
    "is_confirmed INTEGER DEFAULT 0, confirmation_status TEXT, top3_complete INTEGER DEFAULT 0, top5_complete INTEGER DEFAULT 0, lineup_quality TEXT, " +
    "fallback_used INTEGER DEFAULT 0, fallback_game_id TEXT, fallback_game_date TEXT, " +
    "late_scratch_flag INTEGER DEFAULT 0, injury_news_flag INTEGER DEFAULT 0, scratch_context TEXT, warnings_json TEXT, source_name TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)"
  ).run();
  await env.DB.prepare("ALTER TABLE game_lineup_context ADD COLUMN fallback_used INTEGER DEFAULT 0").run().catch(()=>null);
  await env.DB.prepare("ALTER TABLE game_lineup_context ADD COLUMN fallback_game_id TEXT").run().catch(()=>null);
  await env.DB.prepare("ALTER TABLE game_lineup_context ADD COLUMN fallback_game_date TEXT").run().catch(()=>null);
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_game_lineup_context_slate ON game_lineup_context (slate_date, game_id)").run().catch(()=>null);
}

function phase2bLineupQuality(lineupRows, top3Rows, top5Rows, confirmedRows, fallbackUsed) {
  const rows = Number(lineupRows || 0);
  const t3 = Number(top3Rows || 0);
  const t5 = Number(top5Rows || 0);
  const conf = Number(confirmedRows || 0);
  const fb = Number(fallbackUsed || 0) === 1;
  if (fb && rows >= 9) return { status:'LAST_AVAILABLE_FALLBACK_FULL', quality:'FALLBACK_LAST_GAME_FULL' };
  if (fb && t3 >= 3 && t5 >= 5) return { status:'LAST_AVAILABLE_FALLBACK_TOP5', quality:'FALLBACK_LAST_GAME_TOP5' };
  if (fb && t3 >= 3) return { status:'LAST_AVAILABLE_FALLBACK_TOP3', quality:'FALLBACK_LAST_GAME_TOP3' };
  if (fb && rows > 0) return { status:'LAST_AVAILABLE_FALLBACK_PARTIAL', quality:'FALLBACK_LAST_GAME_PARTIAL' };
  if (rows >= 9 && conf >= 9) return { status:'FULL_CONFIRMED', quality:'READY_FULL_CONFIRMED' };
  if (rows >= 9) return { status:'FULL_AVAILABLE', quality:'READY_FULL_AVAILABLE' };
  if (t3 >= 3 && t5 >= 5) return { status:'PARTIAL_TOP5_CONFIRMED', quality:'USABLE_TOP5_PARTIAL' };
  if (t3 >= 3) return { status:'PARTIAL_TOP3_CONFIRMED', quality:'USABLE_TOP3_PARTIAL' };
  if (rows > 0) return { status:'EARLY_PARTIAL', quality:'PARTIAL_UNSAFE' };
  return { status:'NO_LINEUP_POSTED', quality:'MISSING_LINEUP' };
}

function phase2bLineupRowsFromBoxscore(box, side, teamId, targetGameId, sourceGameId, sourceGameDate) {
  const team = box?.teams?.[side];
  const battingOrder = team?.battingOrder || [];
  const players = team?.players || {};
  const rows = [];
  for (let i = 0; i < battingOrder.length && i < 9; i++) {
    const playerKey = `ID${battingOrder[i]}`;
    const player = players[playerKey];
    const person = player?.person || {};
    const playerName = person.fullName || null;
    if (!playerName) continue;
    rows.push({
      game_id: targetGameId,
      team_id: teamId,
      slot: i + 1,
      player_name: playerName,
      bats: player?.battingHand?.code || null,
      k_rate: null,
      is_confirmed: 0,
      source: 'mlb_statsapi_last_available_lineup_fallback',
      confidence: `fallback_from_${sourceGameDate || sourceGameId || 'last_available'}`
    });
  }
  return rows;
}

async function phase2bFindLastAvailableLineup(env, teamId, slateDate, targetGameId) {
  const cleanTeamId = String(teamId || '').toUpperCase();
  const mlbTeamId = MLB_TEAM_ID_BY_ABBR[cleanTeamId];
  if (!mlbTeamId) return { rows: [], fallback_game_id: null, fallback_game_date: null, source: 'team_id_not_mapped' };

  const startDate = addDaysISO(slateDate, -10);
  const endDate = addDaysISO(slateDate, -1);
  const games = await fetchMlbScheduleForTeam(mlbTeamId, startDate, endDate);
  const finals = games
    .filter(g => String(g?.status?.abstractGameState || '').toLowerCase() === 'final')
    .sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate));

  for (const g of finals) {
    const side = Number(g?.teams?.away?.team?.id) === Number(mlbTeamId) ? 'away' : 'home';
    const sourceDate = String((g?.officialDate || g?.gameDate || '').slice(0,10));
    const away = MLB_TEAM_ABBR[g?.teams?.away?.team?.id] || 'UNK';
    const home = MLB_TEAM_ABBR[g?.teams?.home?.team?.id] || 'UNK';
    const sourceGameId = sourceDate ? `${sourceDate}_${away}_${home}` : String(g?.gamePk || 'last_game');
    const box = await fetchMlbBoxscore(g.gamePk);
    if (!box) continue;
    const rows = phase2bLineupRowsFromBoxscore(box, side, cleanTeamId, targetGameId, sourceGameId, sourceDate);
    if (rows.length >= 3) return { rows, fallback_game_id: sourceGameId, fallback_game_date: sourceDate, source: 'mlb_statsapi_last_available_boxscore_lineup' };
  }
  return { rows: [], fallback_game_id: null, fallback_game_date: null, source: 'no_recent_final_lineup_found' };
}

async function phase2bUpsertFallbackLineupRows(env, rows) {
  if (!rows.length) return 0;
  const validated = validateRows('lineups_current', rows);
  if (!validated.ok) return 0;
  return await upsertRows(env, 'lineups_current', validated.rows);
}

async function scrapePhase2LineupContext(input, env) {
  await ensureGameLineupContextTable(env);
  const slate = resolveSlateDate(input || {});
  const d = String(input?.slate_date || slate.slate_date);
  const games = (await env.DB.prepare('SELECT game_id, game_date, away_team, home_team, start_time_utc, venue FROM games WHERE game_date=? ORDER BY game_id').bind(d).all()).results || [];
  const stmtAgg = env.DB.prepare("SELECT COUNT(*) AS lineup_rows, SUM(CASE WHEN slot BETWEEN 1 AND 3 THEN 1 ELSE 0 END) AS top3_rows, SUM(CASE WHEN slot BETWEEN 1 AND 5 THEN 1 ELSE 0 END) AS top5_rows, SUM(CASE WHEN slot BETWEEN 1 AND 9 THEN 1 ELSE 0 END) AS top9_rows, SUM(CASE WHEN COALESCE(is_confirmed,0)=1 THEN 1 ELSE 0 END) AS confirmed_rows, SUM(CASE WHEN source='mlb_statsapi_last_available_lineup_fallback' THEN 1 ELSE 0 END) AS fallback_rows FROM lineups_current WHERE game_id=? AND team_id=?");
  const upsert = env.DB.prepare("INSERT OR REPLACE INTO game_lineup_context (context_id, slate_date, game_id, team_id, opponent_team, side, lineup_rows, top3_rows, top5_rows, top9_rows, confirmed_rows, is_confirmed, confirmation_status, top3_complete, top5_complete, lineup_quality, fallback_used, fallback_game_id, fallback_game_date, late_scratch_flag, injury_news_flag, scratch_context, warnings_json, source_name, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)");
  let inserted = 0;
  let teamsProcessed = 0;
  let fallbackTeams = 0;
  let fallbackRowsInserted = 0;
  const warnings = [];
  const samples = [];
  for (const g of games) {
    const sides = [
      { side:'away', team_id:String(g.away_team || '').toUpperCase(), opponent_team:String(g.home_team || '').toUpperCase() },
      { side:'home', team_id:String(g.home_team || '').toUpperCase(), opponent_team:String(g.away_team || '').toUpperCase() }
    ];
    for (const side of sides) {
      if (!side.team_id) continue;
      teamsProcessed++;
      let fallbackInfo = { rows: [], fallback_game_id: null, fallback_game_date: null, source: null };
      let a = await stmtAgg.bind(g.game_id, side.team_id).first().catch(()=>({}));
      let lineupRows = Number(a?.lineup_rows || 0);
      if (lineupRows <= 0) {
        fallbackInfo = await phase2bFindLastAvailableLineup(env, side.team_id, d, g.game_id);
        if (fallbackInfo.rows.length > 0) {
          const wrote = await phase2bUpsertFallbackLineupRows(env, fallbackInfo.rows);
          fallbackRowsInserted += Number(wrote || 0);
          fallbackTeams++;
          a = await stmtAgg.bind(g.game_id, side.team_id).first().catch(()=>({}));
          lineupRows = Number(a?.lineup_rows || 0);
        }
      }
      const top3Rows = Number(a?.top3_rows || 0);
      const top5Rows = Number(a?.top5_rows || 0);
      const top9Rows = Number(a?.top9_rows || 0);
      const confirmedRows = Number(a?.confirmed_rows || 0);
      const fallbackUsed = Number(a?.fallback_rows || 0) > 0 ? 1 : 0;
      const q = phase2bLineupQuality(lineupRows, top3Rows, top5Rows, confirmedRows, fallbackUsed);
      const rowWarnings = [];
      if (fallbackUsed) rowWarnings.push('CURRENT_LINEUP_MISSING_USED_LAST_AVAILABLE');
      if (lineupRows <= 0) rowWarnings.push('NO_LINEUP_POSTED');
      if (top3Rows < 3) rowWarnings.push('TOP3_INCOMPLETE');
      if (top5Rows < 5) rowWarnings.push('TOP5_INCOMPLETE');
      if (lineupRows > 0 && lineupRows < 9) rowWarnings.push('LINEUP_NOT_FULL_9');
      warnings.push(...rowWarnings.map(w => w + ':' + side.team_id));
      const contextId = d + '|' + g.game_id + '|' + side.team_id;
      const scratchContext = 'SHELL_ONLY_NO_LATE_SCRATCH_NEWS_SOURCE_CONNECTED';
      const sourceName = fallbackUsed ? 'mlb_statsapi_current_or_last_available_lineup_fallback' : 'mlb_statsapi_lineups_current_plus_scratch_shell';
      const res = await upsert.bind(contextId, d, g.game_id, side.team_id, side.opponent_team, side.side, lineupRows, top3Rows, top5Rows, top9Rows, confirmedRows, confirmedRows >= 9 ? 1 : 0, q.status, top3Rows >= 3 ? 1 : 0, top5Rows >= 5 ? 1 : 0, q.quality, fallbackUsed, fallbackUsed ? fallbackInfo.fallback_game_id : null, fallbackUsed ? fallbackInfo.fallback_game_date : null, 0, 0, scratchContext, JSON.stringify(rowWarnings), sourceName).run();
      inserted += Number(res?.meta?.changes || 0);
      if (samples.length < 10) samples.push({ game_id:g.game_id, team_id:side.team_id, side:side.side, lineup_rows:lineupRows, top3_rows:top3Rows, top5_rows:top5Rows, confirmation_status:q.status, lineup_quality:q.quality, fallback_used:fallbackUsed, fallback_game_date:fallbackUsed ? fallbackInfo.fallback_game_date : null, late_scratch_flag:0, scratch_context:scratchContext, warnings:rowWarnings });
    }
  }
  const check = await checkPhase2LineupContext({ ...(input || {}), job:'check_phase2_lineup_context', slate_date:d }, env);
  return { ok:true, data_ok:check.data_ok, job:input.job || 'scrape_phase2_lineup_context', version:SYSTEM_VERSION, status:check.data_ok ? (check.quality?.warnings?.length ? 'pass_with_warnings' : 'pass') : 'fail', slate_date:d, games_checked:games.length, teams_processed:teamsProcessed, inserted:{ game_lineup_context: inserted, fallback_lineups_current: fallbackRowsInserted }, fallback_teams:fallbackTeams, warning_count:warnings.length, warnings:[...new Set(warnings)].slice(0,40), samples, final_check:check, live_tables_touched:true, note:'Phase 2B lineup confirmation with last-available lineup fallback. If today lineup is missing, the system uses the team last available MLB boxscore lineup as non-confirmed fallback. Today slate only. No scoring, no Gemini, no news scraping yet.' };
}

async function checkPhase2LineupContext(input, env) {
  await ensureGameLineupContextTable(env);
  const slate = resolveSlateDate(input || {});
  const d = String(input?.slate_date || slate.slate_date);
  const games = await countScalar(env, 'SELECT COUNT(*) AS c FROM games WHERE game_date=?', d).catch(()=>0);
  const expectedTeams = Number(games || 0) * 2;
  const contextRows = await countScalar(env, 'SELECT COUNT(*) AS c FROM game_lineup_context WHERE slate_date=?', d).catch(()=>0);
  const lineupRows = await countScalar(env, 'SELECT COUNT(*) AS c FROM lineups_current WHERE game_id LIKE ?', d + '_%').catch(()=>0);
  const fallbackTeams = await countScalar(env, 'SELECT COUNT(*) AS c FROM game_lineup_context WHERE slate_date=? AND fallback_used=1', d).catch(()=>0);
  const fallbackLineupRows = await countScalar(env, "SELECT COUNT(*) AS c FROM lineups_current WHERE game_id LIKE ? AND source='mlb_statsapi_last_available_lineup_fallback'", d + '_%').catch(()=>0);
  const fullConfirmedTeams = await countScalar(env, "SELECT COUNT(*) AS c FROM game_lineup_context WHERE slate_date=? AND confirmation_status IN ('FULL_CONFIRMED','FULL_AVAILABLE')", d).catch(()=>0);
  const usableTop3Teams = await countScalar(env, 'SELECT COUNT(*) AS c FROM game_lineup_context WHERE slate_date=? AND top3_complete=1', d).catch(()=>0);
  const missingLineupTeams = await countScalar(env, "SELECT COUNT(*) AS c FROM game_lineup_context WHERE slate_date=? AND confirmation_status='NO_LINEUP_POSTED'", d).catch(()=>0);
  const top3IncompleteTeams = await countScalar(env, 'SELECT COUNT(*) AS c FROM game_lineup_context WHERE slate_date=? AND top3_complete=0', d).catch(()=>0);
  const lateScratchFlags = await countScalar(env, 'SELECT COUNT(*) AS c FROM game_lineup_context WHERE slate_date=? AND late_scratch_flag=1', d).catch(()=>0);
  const staleRows = await countScalar(env, "SELECT COUNT(*) AS c FROM game_lineup_context WHERE slate_date=? AND updated_at < datetime('now','-4 hours')", d).catch(()=>0);
  const statusSplit = (await env.DB.prepare('SELECT confirmation_status, COUNT(*) AS rows_count FROM game_lineup_context WHERE slate_date=? GROUP BY confirmation_status ORDER BY rows_count DESC, confirmation_status').bind(d).all().catch(()=>({results:[]}))).results || [];
  const qualitySplit = (await env.DB.prepare('SELECT lineup_quality, COUNT(*) AS rows_count FROM game_lineup_context WHERE slate_date=? GROUP BY lineup_quality ORDER BY rows_count DESC, lineup_quality').bind(d).all().catch(()=>({results:[]}))).results || [];
  const missingGames = (await env.DB.prepare('SELECT g.game_id, g.away_team, g.home_team, COUNT(c.team_id) AS context_teams FROM games g LEFT JOIN game_lineup_context c ON c.game_id=g.game_id AND c.slate_date=? WHERE g.game_date=? GROUP BY g.game_id HAVING context_teams < 2 ORDER BY g.game_id').bind(d,d).all().catch(()=>({results:[]}))).results || [];
  const samples = (await env.DB.prepare('SELECT game_id, team_id, side, lineup_rows, top3_rows, top5_rows, confirmed_rows, confirmation_status, lineup_quality, fallback_used, fallback_game_date, late_scratch_flag, injury_news_flag, scratch_context, warnings_json, updated_at FROM game_lineup_context WHERE slate_date=? ORDER BY game_id, side LIMIT 12').bind(d).all().catch(()=>({results:[]}))).results || [];
  const failures = [];
  const warnings = [];
  if (games <= 0) failures.push('GAMES_EMPTY');
  if (contextRows < expectedTeams) failures.push('LINEUP_CONTEXT_ROWS_MISSING');
  if (missingGames.length) failures.push('LINEUP_CONTEXT_MISSING_GAMES');
  if (lineupRows <= 0) warnings.push('NO_LINEUPS_AVAILABLE_YET');
  if (fallbackTeams > 0) warnings.push('SOME_TEAMS_USING_LAST_AVAILABLE_LINEUP_FALLBACK');
  if (missingLineupTeams > 0) warnings.push('SOME_TEAMS_HAVE_NO_CURRENT_OR_FALLBACK_LINEUP');
  if (top3IncompleteTeams > 0) warnings.push('SOME_TOP3_LINEUPS_INCOMPLETE');
  if (fullConfirmedTeams < expectedTeams) warnings.push('NOT_ALL_TEAMS_FULL_CONFIRMED');
  if (staleRows > 0) warnings.push('STALE_LINEUP_CONTEXT_OVER_4H');
  const dataOk = failures.length === 0;
  return { ok:true, data_ok:dataOk, job:input.job || 'check_phase2_lineup_context', version:SYSTEM_VERSION, status:dataOk ? (warnings.length ? 'pass_with_warnings' : 'pass') : 'fail', slate_date:d, check_mode:'EVERYDAY_PHASE2B_LINEUP_CONFIRMATION_LAST_AVAILABLE_FALLBACK', counts:{ games, expected_teams:expectedTeams, lineup_context_rows:contextRows, lineups_current_rows:lineupRows, fallback_lineup_teams:fallbackTeams, fallback_lineup_rows:fallbackLineupRows, full_confirmed_teams:fullConfirmedTeams, usable_top3_teams:usableTop3Teams, missing_lineup_teams:missingLineupTeams, top3_incomplete_teams:top3IncompleteTeams, late_scratch_flags:lateScratchFlags, stale_rows_over_4h:staleRows }, status_split:statusSplit, quality_split:qualitySplit, missing_games:missingGames, samples, quality:{ failures, warnings }, live_tables_touched:false, note:'Phase 2B validates current lineup confirmation and fills missing teams with the last available MLB boxscore lineup as non-confirmed fallback. No Gemini/news source is connected yet; late-scratch flags default to 0 until news source work.' };
}

const PHASE2_STADIUM_COORDS = {
  ARI:{lat:33.4455, lon:-112.0667, roof:"RETRACTABLE"}, ATL:{lat:33.8908, lon:-84.4678, roof:"OPEN"}, BAL:{lat:39.2840, lon:-76.6217, roof:"OPEN"}, BOS:{lat:42.3467, lon:-71.0972, roof:"OPEN"}, CHC:{lat:41.9484, lon:-87.6553, roof:"OPEN"}, CWS:{lat:41.8300, lon:-87.6339, roof:"OPEN"}, CIN:{lat:39.0979, lon:-84.5082, roof:"OPEN"}, CLE:{lat:41.4962, lon:-81.6852, roof:"OPEN"}, COL:{lat:39.7561, lon:-104.9942, roof:"OPEN"}, DET:{lat:42.3390, lon:-83.0485, roof:"OPEN"}, HOU:{lat:29.7572, lon:-95.3555, roof:"RETRACTABLE"}, KC:{lat:39.0517, lon:-94.4803, roof:"OPEN"}, LAA:{lat:33.8003, lon:-117.8827, roof:"OPEN"}, LAD:{lat:34.0739, lon:-118.2400, roof:"OPEN"}, MIA:{lat:25.7781, lon:-80.2197, roof:"RETRACTABLE"}, MIL:{lat:43.0280, lon:-87.9712, roof:"RETRACTABLE"}, MIN:{lat:44.9817, lon:-93.2776, roof:"OPEN"}, NYM:{lat:40.7571, lon:-73.8458, roof:"OPEN"}, NYY:{lat:40.8296, lon:-73.9262, roof:"OPEN"}, OAK:{lat:38.5802, lon:-121.5133, roof:"OPEN"}, PHI:{lat:39.9061, lon:-75.1665, roof:"OPEN"}, PIT:{lat:40.4469, lon:-80.0057, roof:"OPEN"}, SD:{lat:32.7073, lon:-117.1566, roof:"OPEN"}, SEA:{lat:47.5914, lon:-122.3325, roof:"RETRACTABLE"}, SFG:{lat:37.7786, lon:-122.3893, roof:"OPEN"}, STL:{lat:38.6226, lon:-90.1928, roof:"OPEN"}, TB:{lat:27.9803, lon:-82.5067, roof:"OPEN"}, TEX:{lat:32.7473, lon:-97.0842, roof:"RETRACTABLE"}, TOR:{lat:43.6414, lon:-79.3894, roof:"RETRACTABLE"}, WSN:{lat:38.8730, lon:-77.0074, roof:"OPEN"}
};

async function ensureGameWeatherContextTable(env) {
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS game_weather_context (" +
    "context_id TEXT PRIMARY KEY, slate_date TEXT NOT NULL, game_id TEXT NOT NULL, away_team TEXT, home_team TEXT, " +
    "venue_id INTEGER, venue_name TEXT, city TEXT, state TEXT, latitude REAL, longitude REAL, roof_type TEXT, roof_context TEXT, " +
    "source_name TEXT, source_status TEXT, temp_f REAL, feels_like_f REAL, humidity_pct REAL, pressure_hpa REAL, wind_speed_mph REAL, wind_direction_deg REAL, " +
    "precipitation_1h_in REAL, cloud_pct REAL, weather_risk TEXT, fetched_at TEXT, raw_json TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)"
  ).run();
}

function phase2WeatherRisk(row) {
  const wind = Number(row.wind_speed_mph || 0);
  const precip = Number(row.precipitation_1h_in || 0);
  const roof = String(row.roof_type || '').toUpperCase();
  if (roof === 'RETRACTABLE' && (precip > 0.01 || wind >= 15)) return 'ROOF_DEPENDENT_WEATHER_ELEVATED';
  if (precip > 0.05) return 'PRECIP_RISK';
  if (wind >= 18) return 'HIGH_WIND';
  if (wind >= 12) return 'MODERATE_WIND';
  return 'NORMAL';
}

function phase2RoofContext(teamId, roofType) {
  const roof = String(roofType || PHASE2_STADIUM_COORDS[String(teamId || '').toUpperCase()]?.roof || 'UNKNOWN').toUpperCase();
  if (roof === 'RETRACTABLE') return 'RETRACTABLE_ROOF_STATUS_NOT_AUTOMATICALLY_CONFIRMED';
  if (roof === 'DOME' || roof === 'FIXED_DOME') return 'FIXED_ROOF_WEATHER_LOW_DIRECT_IMPACT';
  if (roof === 'OPEN') return 'OPEN_AIR_WEATHER_DIRECT_IMPACT';
  return 'ROOF_CONTEXT_UNKNOWN';
}

function getOpenWeatherKey(env) {
  return env.OPENWEATHER_API_KEY || env.OPEN_WEATHER_API_KEY || env.OPENWEATHERMAP_API_KEY || null;
}

async function fetchJsonWithDiagnostics(url, options = {}, retries = 2, label = "fetch_json") {
  let last = { ok:false, status:null, error:label + ' failed', body_preview:null, code:null, message:null };
  for (let attempt = 1; attempt <= Math.max(1, retries); attempt++) {
    try {
      const res = await fetch(url, { headers: { "accept": "application/json", ...(options.headers || {}) }, ...options });
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch (_) { data = null; }
      if (res.ok) return { ok:true, status:res.status, data, attempt };
      last = {
        ok:false,
        status:res.status,
        error: label + ' HTTP ' + res.status,
        body_preview: String(text || '').slice(0, 300),
        code: data?.cod || data?.code || null,
        message: data?.message || data?.error || null,
        attempt
      };
      if (![408, 425, 429, 500, 502, 503, 504].includes(Number(res.status))) break;
    } catch (err) {
      last = { ok:false, status:null, error:String(err?.message || err || label + ' failed'), body_preview:null, code:null, message:null, attempt };
    }
    if (attempt < retries) await sleepMs(250 * attempt);
  }
  return last;
}

function normalizeOpenWeather25(d) {
  return {
    source_name:'openweather_current_2_5', source_status:'primary_success_2_5_weather',
    temp_f: d.main?.temp ?? null, feels_like_f: d.main?.feels_like ?? null, humidity_pct: d.main?.humidity ?? null, pressure_hpa: d.main?.pressure ?? null,
    wind_speed_mph: d.wind?.speed ?? null, wind_direction_deg: d.wind?.deg ?? null, precipitation_1h_in: d.rain?.['1h'] ?? d.snow?.['1h'] ?? 0, cloud_pct: d.clouds?.all ?? null,
    raw_json: JSON.stringify({ provider:'openweather', endpoint:'2.5/weather', sample:{ weather:d.weather, main:d.main, wind:d.wind, rain:d.rain, snow:d.snow, clouds:d.clouds } })
  };
}

function normalizeOpenWeather30(d) {
  const c = d.current || {};
  return {
    source_name:'openweather_onecall_3_0', source_status:'primary_success_3_0_onecall',
    temp_f: c.temp ?? null, feels_like_f: c.feels_like ?? null, humidity_pct: c.humidity ?? null, pressure_hpa: c.pressure ?? null,
    wind_speed_mph: c.wind_speed ?? null, wind_direction_deg: c.wind_deg ?? null, precipitation_1h_in: c.rain?.['1h'] ?? c.snow?.['1h'] ?? 0, cloud_pct: c.clouds ?? null,
    raw_json: JSON.stringify({ provider:'openweather', endpoint:'3.0/onecall', sample:{ current:c, alerts_count:Array.isArray(d.alerts) ? d.alerts.length : 0 } })
  };
}

async function fetchOpenWeatherContext(env, loc) {
  const key = getOpenWeatherKey(env);
  if (!key) return { ok:false, missing_key:true, error:'OPENWEATHER_API_KEY missing' };

  const lat = encodeURIComponent(loc.lat);
  const lon = encodeURIComponent(loc.lon);
  const keyParam = encodeURIComponent(key);
  const failures = [];

  const url25 = 'https://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lon + '&appid=' + keyParam + '&units=imperial';
  const res25 = await fetchJsonWithDiagnostics(url25, {}, 2, 'openweather_2_5_weather');
  if (res25.ok) return { ok:true, data:normalizeOpenWeather25(res25.data || {}), endpoint_used:'2.5/weather' };
  failures.push({ endpoint:'2.5/weather', status:res25.status, code:res25.code, message:res25.message, error:res25.error, body_preview:res25.body_preview });

  const url30 = 'https://api.openweathermap.org/data/3.0/onecall?lat=' + lat + '&lon=' + lon + '&appid=' + keyParam + '&units=imperial&exclude=minutely,hourly,daily,alerts';
  const res30 = await fetchJsonWithDiagnostics(url30, {}, 2, 'openweather_3_0_onecall');
  if (res30.ok) return { ok:true, data:normalizeOpenWeather30(res30.data || {}), endpoint_used:'3.0/onecall', prior_failures:failures };
  failures.push({ endpoint:'3.0/onecall', status:res30.status, code:res30.code, message:res30.message, error:res30.error, body_preview:res30.body_preview });

  return { ok:false, error:'openweather_failed_all_endpoints', failures };
}

async function fetchOpenMeteoContext(loc) {
  const current = 'temperature_2m,relative_humidity_2m,precipitation,rain,pressure_msl,cloud_cover,wind_speed_10m,wind_direction_10m';
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + encodeURIComponent(loc.lat) + '&longitude=' + encodeURIComponent(loc.lon) + '&current=' + current + '&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch';
  const res = await fetchJsonWithRetry(url, {}, 2, 'open_meteo_current');
  if (!res.ok) return { ok:false, error:res.error || 'open_meteo_failed' };
  const c = res.data?.current || {};
  return { ok:true, data:{
    source_name:'open_meteo_current_no_key', source_status:'fallback_success',
    temp_f: c.temperature_2m ?? null, feels_like_f: null, humidity_pct: c.relative_humidity_2m ?? null, pressure_hpa: c.pressure_msl ?? null,
    wind_speed_mph: c.wind_speed_10m ?? null, wind_direction_deg: c.wind_direction_10m ?? null, precipitation_1h_in: c.precipitation ?? c.rain ?? 0, cloud_pct: c.cloud_cover ?? null,
    raw_json: JSON.stringify({ provider:'open-meteo', current:c })
  }};
}

async function scrapePhase2WeatherContext(input, env) {
  await ensureStaticReferenceTables(env).catch(()=>null);
  await ensureGameWeatherContextTable(env);
  const slate = resolveSlateDate(input || {});
  const d = String(input?.slate_date || slate.slate_date);
  const games = (await env.DB.prepare('SELECT game_id, game_date, away_team, home_team, start_time_utc, venue FROM games WHERE game_date=? ORDER BY game_id').bind(d).all()).results || [];
  const venueRows = (await env.DB.prepare('SELECT * FROM ref_venues').all().catch(()=>({results:[]}))).results || [];
  const venueByTeam = new Map(venueRows.map(v => [String(v.team_id || '').toUpperCase(), v]));
  const warnings = [], errors = [], samples = [];
  let inserted = 0, openWeatherCount = 0, openMeteoCount = 0, skipped = 0;
  const stmt = env.DB.prepare(
    'INSERT INTO game_weather_context (context_id, slate_date, game_id, away_team, home_team, venue_id, venue_name, city, state, latitude, longitude, roof_type, roof_context, source_name, source_status, temp_f, feels_like_f, humidity_pct, pressure_hpa, wind_speed_mph, wind_direction_deg, precipitation_1h_in, cloud_pct, weather_risk, fetched_at, raw_json, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP) ' +
    'ON CONFLICT(context_id) DO UPDATE SET away_team=excluded.away_team, home_team=excluded.home_team, venue_id=excluded.venue_id, venue_name=excluded.venue_name, city=excluded.city, state=excluded.state, latitude=excluded.latitude, longitude=excluded.longitude, roof_type=excluded.roof_type, roof_context=excluded.roof_context, source_name=excluded.source_name, source_status=excluded.source_status, temp_f=excluded.temp_f, feels_like_f=excluded.feels_like_f, humidity_pct=excluded.humidity_pct, pressure_hpa=excluded.pressure_hpa, wind_speed_mph=excluded.wind_speed_mph, wind_direction_deg=excluded.wind_direction_deg, precipitation_1h_in=excluded.precipitation_1h_in, cloud_pct=excluded.cloud_pct, weather_risk=excluded.weather_risk, fetched_at=CURRENT_TIMESTAMP, raw_json=excluded.raw_json, updated_at=CURRENT_TIMESTAMP'
  );
  for (const g of games) {
    const home = String(g.home_team || '').toUpperCase();
    const v = venueByTeam.get(home) || {};
    const coords = PHASE2_STADIUM_COORDS[home] || null;
    if (!coords) { skipped++; errors.push({ game_id:g.game_id, home_team:home, error:'missing_static_coordinates' }); continue; }
    let fetched = await fetchOpenWeatherContext(env, { lat:coords.lat, lon:coords.lon });
    if (!fetched.ok) {
      if (fetched.missing_key) warnings.push('OPENWEATHER_API_KEY_MISSING_USED_OPEN_METEO_FALLBACK');
      else { const f=(fetched.failures||[]).map(x => x.endpoint + ':' + (x.status || 'NO_STATUS') + ':' + (x.code || '') + ':' + String(x.message || x.error || '').slice(0,80)).join('|'); warnings.push('OPENWEATHER_FAILED_USED_OPEN_METEO_FALLBACK:' + home + ':' + f); }
      fetched = await fetchOpenMeteoContext({ lat:coords.lat, lon:coords.lon });
    }
    if (!fetched.ok) { skipped++; errors.push({ game_id:g.game_id, home_team:home, error:fetched.error || 'weather_fetch_failed' }); continue; }
    const data = fetched.data || {};
    if (String(data.source_name || '').startsWith('openweather')) openWeatherCount++; else openMeteoCount++;
    const roofType = String(coords.roof || v.roof_status || 'UNKNOWN').toUpperCase();
    const row = { context_id:d + '|' + g.game_id + '|weather', slate_date:d, game_id:g.game_id, away_team:g.away_team, home_team:home, venue_id:v.venue_id ?? null, venue_name:v.mlb_venue_name || g.venue || null, city:v.city || null, state:v.state || null, latitude:coords.lat, longitude:coords.lon, roof_type:roofType, roof_context:phase2RoofContext(home, roofType), ...data };
    row.weather_risk = phase2WeatherRisk(row);
    const res = await stmt.bind(row.context_id, row.slate_date, row.game_id, row.away_team, row.home_team, row.venue_id, row.venue_name, row.city, row.state, row.latitude, row.longitude, row.roof_type, row.roof_context, row.source_name, row.source_status, row.temp_f, row.feels_like_f, row.humidity_pct, row.pressure_hpa, row.wind_speed_mph, row.wind_direction_deg, row.precipitation_1h_in, row.cloud_pct, row.weather_risk, row.raw_json).run();
    inserted += Number(res?.meta?.changes || 0);
    if (samples.length < 5) samples.push({ game_id:row.game_id, home_team:row.home_team, venue_name:row.venue_name, source_name:row.source_name, temp_f:row.temp_f, wind_speed_mph:row.wind_speed_mph, wind_direction_deg:row.wind_direction_deg, roof_type:row.roof_type, weather_risk:row.weather_risk });
  }
  const check = await checkPhase2WeatherContext({ ...(input || {}), job:'check_phase2_weather_context', slate_date:d }, env);
  return { ok:true, data_ok:check.data_ok, job:input.job || 'scrape_phase2_weather_context', version:SYSTEM_VERSION, status:check.data_ok ? 'pass' : 'pass_with_warnings', slate_date:d, source_policy:'OpenWeather primary uses 2.5/weather first, then 3.0/onecall; Open-Meteo no-key fallback', games_checked:games.length, inserted:{ game_weather_context:inserted }, source_counts:{ openweather_any:openWeatherCount, open_meteo_current_no_key:openMeteoCount }, skipped_count:skipped, warnings:[...new Set(warnings)], errors, samples, final_check:check, live_tables_touched:true, note:'Phase 2A weather/roof context only. Today slate only. No scoring, no Gemini, no static/incremental remine. Roof open/closed is not auto-confirmed; retractable parks are marked roof-dependent.' };
}

async function checkPhase2WeatherContext(input, env) {
  await ensureGameWeatherContextTable(env);
  const slate = resolveSlateDate(input || {});
  const d = String(input?.slate_date || slate.slate_date);
  const games = await countScalar(env, 'SELECT COUNT(*) AS c FROM games WHERE game_date=?', d).catch(()=>0);
  const weatherRows = await countScalar(env, 'SELECT COUNT(*) AS c FROM game_weather_context WHERE slate_date=?', d).catch(()=>0);
  const staleRows = await countScalar(env, "SELECT COUNT(*) AS c FROM game_weather_context WHERE slate_date=? AND updated_at < datetime('now','-8 hours')", d).catch(()=>0);
  const missing = (await env.DB.prepare('SELECT g.game_id, g.away_team, g.home_team FROM games g LEFT JOIN game_weather_context w ON w.game_id=g.game_id AND w.slate_date=g.game_date WHERE g.game_date=? AND w.game_id IS NULL ORDER BY g.game_id LIMIT 30').bind(d).all().catch(()=>({results:[]}))).results || [];
  const sourceSplit = (await env.DB.prepare('SELECT source_name, COUNT(*) AS rows_count FROM game_weather_context WHERE slate_date=? GROUP BY source_name ORDER BY rows_count DESC').bind(d).all().catch(()=>({results:[]}))).results || [];
  const riskSplit = (await env.DB.prepare('SELECT weather_risk, COUNT(*) AS rows_count FROM game_weather_context WHERE slate_date=? GROUP BY weather_risk ORDER BY rows_count DESC').bind(d).all().catch(()=>({results:[]}))).results || [];
  const samples = (await env.DB.prepare('SELECT game_id, home_team, venue_name, source_name, temp_f, wind_speed_mph, wind_direction_deg, precipitation_1h_in, roof_type, roof_context, weather_risk, updated_at FROM game_weather_context WHERE slate_date=? ORDER BY game_id LIMIT 10').bind(d).all().catch(()=>({results:[]}))).results || [];
  const failures = [], warnings = [];
  if (games <= 0) failures.push('GAMES_EMPTY_RUN_PHASE1_FIRST');
  if (weatherRows < games) failures.push('WEATHER_CONTEXT_MISSING_GAMES');
  if (staleRows > 0) warnings.push('WEATHER_CONTEXT_STALE_ROWS_OVER_8H');
  if (sourceSplit.some(r => String(r.source_name || '').includes('open_meteo'))) warnings.push('OPEN_METEO_FALLBACK_USED_FOR_SOME_OR_ALL_GAMES');
  const dataOk = failures.length === 0;
  return { ok:true, data_ok:dataOk, job:input.job || 'check_phase2_weather_context', version:SYSTEM_VERSION, status:dataOk ? (warnings.length ? 'pass_with_warnings' : 'pass') : 'fail', slate_date:d, check_mode:'EVERYDAY_PHASE2A_WEATHER_ROOF_CONTEXT', counts:{ games, weather_context_rows:weatherRows, stale_rows_over_8h:staleRows }, source_split:sourceSplit, risk_split:riskSplit, missing_games:missing, samples, quality:{ failures, warnings }, live_tables_touched:false, note:'Phase 2A validates weather/wind/roof context only. Roof state is not confirmed automatically; retractable parks remain roof-dependent until a roof-status source is added.' };
}



function phase2cCleanText(value) {
  return String(value ?? "").trim();
}

function phase2cProjectionKey(row) {
  const lineId = phase2cCleanText(row?.line_id);
  if (lineId) return { projection_key: lineId, identity_method: "line_id", source_confidence: "HIGH" };
  const composite = [row?.player_name, row?.team, row?.opponent, row?.stat_type, row?.line_score, row?.start_time]
    .map(v => phase2cCleanText(v).toLowerCase())
    .join("|");
  return { projection_key: `fallback:${composite}`, identity_method: "fallback_composite", source_confidence: "MEDIUM" };
}

function phase2cIsSupportedSingle(row) {
  const player = phase2cCleanText(row?.player_name);
  const team = phase2cCleanText(row?.team);
  const opponent = phase2cCleanText(row?.opponent);
  if (!player || !team || !opponent) return 0;
  if (player.includes("+") || team.includes("/") || opponent.includes("/")) return 0;
  if (team.toUpperCase() === opponent.toUpperCase()) return 0;
  return 1;
}

function phase2cChunkSize(input) {
  const requested = Number(input?.chunk_size || input?.limit || 400);
  if (!Number.isFinite(requested)) return 400;
  return Math.max(100, Math.min(500, Math.floor(requested)));
}

async function ensurePhase2cMarketContextTables(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS prizepicks_current_market_context (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projection_key TEXT NOT NULL UNIQUE,
      line_id TEXT,
      player_name TEXT,
      team TEXT,
      opponent TEXT,
      stat_type TEXT,
      line_score REAL,
      odds_type TEXT,
      is_promo INTEGER DEFAULT 0,
      start_time TEXT,
      slate_date TEXT,
      board_updated_at TEXT,
      captured_at TEXT NOT NULL,
      is_current INTEGER DEFAULT 1,
      is_stale INTEGER DEFAULT 0,
      source TEXT DEFAULT 'mlb_stats',
      source_confidence TEXT DEFAULT 'HIGH',
      identity_method TEXT DEFAULT 'line_id',
      is_supported_single INTEGER DEFAULT 1,
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_pp_ctx_current ON prizepicks_current_market_context(is_current, slate_date, stat_type)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_pp_ctx_line_id ON prizepicks_current_market_context(line_id)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_pp_ctx_board_updated ON prizepicks_current_market_context(board_updated_at)`).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS phase2c_market_context_runs (
      run_id TEXT PRIMARY KEY,
      slate_date TEXT,
      latest_board_updated_at TEXT,
      board_window_rule TEXT,
      total_rows INTEGER DEFAULT 0,
      processed_rows INTEGER DEFAULT 0,
      remaining_rows INTEGER DEFAULT 0,
      chunk_size INTEGER DEFAULT 400,
      status TEXT DEFAULT 'partial_continue',
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      supersede_done INTEGER DEFAULT 0,
      warnings_json TEXT DEFAULT '[]'
    )
  `).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_phase2c_runs_status ON phase2c_market_context_runs(status, slate_date, latest_board_updated_at)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_phase2c_runs_updated ON phase2c_market_context_runs(updated_at)`).run();
}

async function phase2cLatestBoardMeta(env) {
  const latest = await env.DB.prepare(`SELECT MAX(updated_at) AS latest_updated_at FROM mlb_stats`).first();
  const latestUpdatedAt = latest?.latest_updated_at || null;
  if (!latestUpdatedAt) return { latestUpdatedAt: null, totalRows: 0, oldestInWindow: null, newestInWindow: null };
  const meta = await env.DB.prepare(`
    SELECT COUNT(*) AS total_rows, MIN(updated_at) AS oldest_in_window, MAX(updated_at) AS newest_in_window
    FROM mlb_stats
    WHERE updated_at >= datetime(?, '-10 minutes')
  `).bind(latestUpdatedAt).first();
  return {
    latestUpdatedAt,
    totalRows: Number(meta?.total_rows || 0),
    oldestInWindow: meta?.oldest_in_window || null,
    newestInWindow: meta?.newest_in_window || null
  };
}

async function phase2cGetOrStartRun(env, slateDate, latestUpdatedAt, totalRows, chunkSize, forceNew) {
  if (!forceNew) {
    const existing = await env.DB.prepare(`
      SELECT * FROM phase2c_market_context_runs
      WHERE slate_date=? AND latest_board_updated_at=? AND status IN ('started','partial_continue')
      ORDER BY updated_at DESC
      LIMIT 1
    `).bind(slateDate, latestUpdatedAt).first();
    if (existing?.run_id) return { run: existing, is_new: false };
  }
  const runId = crypto.randomUUID();
  await env.DB.prepare(`
    UPDATE prizepicks_current_market_context
    SET is_current=0, is_stale=1, status='SUPERSEDED', updated_at=CURRENT_TIMESTAMP
    WHERE is_current=1
  `).run();
  await env.DB.prepare(`
    INSERT INTO phase2c_market_context_runs (
      run_id, slate_date, latest_board_updated_at, board_window_rule, total_rows, processed_rows, remaining_rows,
      chunk_size, status, started_at, updated_at, supersede_done
    ) VALUES (?, ?, ?, 'mlb_stats.updated_at >= latest updated_at minus 10 minutes', ?, 0, ?, ?, 'started', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
  `).bind(runId, slateDate, latestUpdatedAt, totalRows, totalRows, chunkSize).run();
  const run = await env.DB.prepare(`SELECT * FROM phase2c_market_context_runs WHERE run_id=?`).bind(runId).first();
  return { run, is_new: true };
}

async function scrapePhase2cMarketContext(input = {}, env) {
  const slateDate = input.slate_date || resolveSlateDate(input).slate_date;
  const job = input.job || "scrape_phase2c_market_context";
  const capturedAt = new Date().toISOString();
  const chunkSize = phase2cChunkSize(input);
  const forceNew = Boolean(input.force_new || input.restart || input.reset_run);
  await ensurePhase2cMarketContextTables(env);
  const boardMeta = await phase2cLatestBoardMeta(env);
  if (!boardMeta.latestUpdatedAt || boardMeta.totalRows <= 0) {
    return { ok: false, data_ok: false, job, version: SYSTEM_VERSION, phase: "Phase 2C-I Market Context Chunk Runner", status: "warn_empty_board", source_table: "mlb_stats", active_window_rule: "latest updated_at minus 10 minutes", slate_date: slateDate, rows_read: 0, rows_processed_this_chunk: 0, warnings: ["mlb_stats is empty or latest capture window returned zero rows"], note: "No scoring, no external odds, no Gemini, no cron." };
  }
  const { run, is_new } = await phase2cGetOrStartRun(env, slateDate, boardMeta.latestUpdatedAt, boardMeta.totalRows, chunkSize, forceNew);
  const offset = Number(run?.processed_rows || 0);
  const rowsRes = await env.DB.prepare(`
    SELECT line_id, player_name, team, opponent, stat_type, line_score, odds_type, is_promo, start_time, updated_at
    FROM mlb_stats
    WHERE updated_at >= datetime(?, '-10 minutes')
    ORDER BY updated_at DESC, start_time ASC, player_name ASC, stat_type ASC, line_id ASC
    LIMIT ? OFFSET ?
  `).bind(boardMeta.latestUpdatedAt, chunkSize, offset).all();
  const rows = Array.isArray(rowsRes?.results) ? rowsRes.results : [];
  const upsertSql = `
    INSERT INTO prizepicks_current_market_context (
      projection_key, line_id, player_name, team, opponent, stat_type, line_score, odds_type, is_promo,
      start_time, slate_date, board_updated_at, captured_at, is_current, is_stale, source, source_confidence,
      identity_method, is_supported_single, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 'mlb_stats', ?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(projection_key) DO UPDATE SET
      line_id=excluded.line_id,
      player_name=excluded.player_name,
      team=excluded.team,
      opponent=excluded.opponent,
      stat_type=excluded.stat_type,
      line_score=excluded.line_score,
      odds_type=excluded.odds_type,
      is_promo=excluded.is_promo,
      start_time=excluded.start_time,
      slate_date=excluded.slate_date,
      board_updated_at=excluded.board_updated_at,
      captured_at=excluded.captured_at,
      is_current=1,
      is_stale=0,
      source='mlb_stats',
      source_confidence=excluded.source_confidence,
      identity_method=excluded.identity_method,
      is_supported_single=excluded.is_supported_single,
      status='ACTIVE',
      updated_at=CURRENT_TIMESTAMP
  `;
  let lineIdRows = 0;
  let fallbackRows = 0;
  let supportedSingleRows = 0;
  const warnings = [];
  const batch = [];
  for (const r of rows) {
    const ident = phase2cProjectionKey(r);
    const supported = phase2cIsSupportedSingle(r);
    if (ident.identity_method === "line_id") lineIdRows++; else fallbackRows++;
    if (supported) supportedSingleRows++;
    batch.push(env.DB.prepare(upsertSql).bind(
      ident.projection_key,
      phase2cCleanText(r.line_id) || null,
      phase2cCleanText(r.player_name) || null,
      phase2cCleanText(r.team) || null,
      phase2cCleanText(r.opponent) || null,
      phase2cCleanText(r.stat_type) || null,
      r.line_score === null || r.line_score === undefined || r.line_score === "" ? null : Number(r.line_score),
      phase2cCleanText(r.odds_type) || null,
      Number(r.is_promo || 0),
      phase2cCleanText(r.start_time) || null,
      slateDate,
      phase2cCleanText(r.updated_at) || boardMeta.latestUpdatedAt,
      capturedAt,
      ident.source_confidence,
      ident.identity_method,
      supported
    ));
  }
  if (batch.length) await env.DB.batch(batch);
  const processedRows = Math.min(offset + rows.length, boardMeta.totalRows);
  const remainingRows = Math.max(boardMeta.totalRows - processedRows, 0);
  const status = remainingRows > 0 ? "partial_continue" : "completed";
  await env.DB.prepare(`
    UPDATE phase2c_market_context_runs
    SET processed_rows=?, remaining_rows=?, chunk_size=?, status=?, updated_at=CURRENT_TIMESTAMP, completed_at=CASE WHEN ?='completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
    WHERE run_id=?
  `).bind(processedRows, remainingRows, chunkSize, status, status, run.run_id).run();
  if (fallbackRows > 0) warnings.push(`${fallbackRows} rows used fallback_composite identity because line_id was missing.`);
  if (rows.length === 0 && remainingRows > 0) warnings.push("Chunk returned zero rows before run completion. Review latest board window ordering/offset.");
  const statCounts = await env.DB.prepare(`
    SELECT stat_type, COUNT(*) AS rows_count
    FROM prizepicks_current_market_context
    WHERE is_current=1
    GROUP BY stat_type
    ORDER BY rows_count DESC, stat_type
    LIMIT 30
  `).all();
  const oddsCounts = await env.DB.prepare(`
    SELECT odds_type, COUNT(*) AS rows_count
    FROM prizepicks_current_market_context
    WHERE is_current=1
    GROUP BY odds_type
    ORDER BY rows_count DESC, odds_type
    LIMIT 20
  `).all();
  const sample = await env.DB.prepare(`
    SELECT projection_key, line_id, player_name, team, opponent, stat_type, line_score, odds_type, is_promo, start_time, slate_date, board_updated_at, source_confidence, identity_method, is_supported_single, status
    FROM prizepicks_current_market_context
    WHERE is_current=1
    ORDER BY board_updated_at DESC, start_time ASC, player_name ASC
    LIMIT 20
  `).all();
  return {
    ok: rows.length > 0 || status === "completed",
    data_ok: rows.length > 0 || status === "completed",
    job,
    version: SYSTEM_VERSION,
    phase: "Phase 2C-I Market Context Chunk Runner",
    status,
    source_table: "mlb_stats",
    active_context_table: "prizepicks_current_market_context",
    run_state_table: "phase2c_market_context_runs",
    slate_date: slateDate,
    run_id: run.run_id,
    new_run_started: is_new,
    latest_board_batch_window: {
      rule: "mlb_stats.updated_at >= latest updated_at minus 10 minutes",
      oldest_updated_at: boardMeta.oldestInWindow,
      latest_updated_at: boardMeta.newestInWindow,
      total_rows: boardMeta.totalRows
    },
    chunk: {
      chunk_size: chunkSize,
      offset_started_at: offset,
      rows_processed_this_chunk: rows.length,
      processed_rows: processedRows,
      remaining_rows: remainingRows
    },
    identity_this_chunk: { line_id_rows: lineIdRows, fallback_composite_rows: fallbackRows, supported_single_rows: supportedSingleRows },
    stat_type_counts_current_so_far: statCounts.results || [],
    odds_type_counts_current_so_far: oddsCounts.results || [],
    sample_current_rows: sample.results || [],
    warnings,
    next_action: status === "partial_continue" ? "Press EVERYDAY PHASE 2C > Run Market Context again until status is completed." : "Run EVERYDAY PHASE 2C > Check Market Context.",
    note: "Current PrizePicks board rows are the active market/projection source. Snapshot/history writes are deferred. No scoring, no external odds, no Gemini, no cron."
  };
}

async function checkPhase2cMarketContext(input = {}, env) {
  const slateDate = input.slate_date || resolveSlateDate(input).slate_date;
  const job = input.job || "check_phase2c_market_context";
  await ensurePhase2cMarketContextTables(env);
  const boardMeta = await phase2cLatestBoardMeta(env);
  const run = await env.DB.prepare(`
    SELECT * FROM phase2c_market_context_runs
    WHERE slate_date=?
    ORDER BY updated_at DESC
    LIMIT 1
  `).bind(slateDate).first();
  const summary = await env.DB.prepare(`
    SELECT
      COUNT(*) AS total_context_rows,
      SUM(CASE WHEN is_current=1 THEN 1 ELSE 0 END) AS active_rows,
      SUM(CASE WHEN is_current=0 THEN 1 ELSE 0 END) AS stale_or_superseded_rows,
      MAX(captured_at) AS latest_captured_at,
      MAX(board_updated_at) AS latest_board_updated_at,
      SUM(CASE WHEN is_current=1 AND (line_id IS NULL OR TRIM(line_id)='') THEN 1 ELSE 0 END) AS active_missing_line_id,
      SUM(CASE WHEN is_current=1 AND (player_name IS NULL OR TRIM(player_name)='') THEN 1 ELSE 0 END) AS active_missing_player,
      SUM(CASE WHEN is_current=1 AND (team IS NULL OR TRIM(team)='') THEN 1 ELSE 0 END) AS active_missing_team,
      SUM(CASE WHEN is_current=1 AND (opponent IS NULL OR TRIM(opponent)='') THEN 1 ELSE 0 END) AS active_missing_opponent,
      SUM(CASE WHEN is_current=1 AND (stat_type IS NULL OR TRIM(stat_type)='') THEN 1 ELSE 0 END) AS active_missing_stat_type,
      SUM(CASE WHEN is_current=1 AND line_score IS NULL THEN 1 ELSE 0 END) AS active_missing_line_score,
      SUM(CASE WHEN is_current=1 AND (start_time IS NULL OR TRIM(start_time)='') THEN 1 ELSE 0 END) AS active_missing_start_time,
      SUM(CASE WHEN is_current=1 AND is_supported_single=1 THEN 1 ELSE 0 END) AS active_supported_single_rows
    FROM prizepicks_current_market_context
  `).first();
  const identityCounts = await env.DB.prepare(`
    SELECT identity_method, source_confidence, COUNT(*) AS rows_count
    FROM prizepicks_current_market_context
    WHERE is_current=1
    GROUP BY identity_method, source_confidence
    ORDER BY rows_count DESC
  `).all();
  const statCounts = await env.DB.prepare(`
    SELECT stat_type, COUNT(*) AS rows_count
    FROM prizepicks_current_market_context
    WHERE is_current=1
    GROUP BY stat_type
    ORDER BY rows_count DESC, stat_type
    LIMIT 30
  `).all();
  const oddsCounts = await env.DB.prepare(`
    SELECT odds_type, COUNT(*) AS rows_count
    FROM prizepicks_current_market_context
    WHERE is_current=1
    GROUP BY odds_type
    ORDER BY rows_count DESC, odds_type
    LIMIT 20
  `).all();
  const sample = await env.DB.prepare(`
    SELECT projection_key, line_id, player_name, team, opponent, stat_type, line_score, odds_type, is_promo, start_time, slate_date, board_updated_at, source_confidence, identity_method, is_supported_single, status
    FROM prizepicks_current_market_context
    WHERE is_current=1
    ORDER BY board_updated_at DESC, start_time ASC, player_name ASC
    LIMIT 25
  `).all();
  const activeRows = Number(summary?.active_rows || 0);
  const missingCritical = ["active_missing_player", "active_missing_team", "active_missing_opponent", "active_missing_stat_type", "active_missing_line_score", "active_missing_start_time"].reduce((n, k) => n + Number(summary?.[k] || 0), 0);
  const runStatus = run?.status || "not_started";
  const warnings = [];
  if (activeRows <= 0) warnings.push("No active current market context rows found. Run EVERYDAY PHASE 2C > Run Market Context.");
  if (runStatus === "partial_continue" || runStatus === "started") warnings.push("Current Phase 2C run is not complete. Keep pressing EVERYDAY PHASE 2C > Run Market Context until status is completed.");
  if (Number(summary?.active_missing_line_id || 0) > 0) warnings.push(`${summary.active_missing_line_id} active rows are missing line_id and use fallback identity.`);
  if (missingCritical > 0) warnings.push(`${missingCritical} active rows are missing critical board fields.`);
  return {
    ok: activeRows > 0 && runStatus === "completed",
    data_ok: activeRows > 0 && runStatus === "completed" && missingCritical === 0,
    job,
    version: SYSTEM_VERSION,
    phase: "Phase 2C-I Market Context Chunk Runner",
    status: activeRows > 0 && runStatus === "completed" && missingCritical === 0 ? "pass" : (activeRows > 0 ? "partial_or_warn_review" : "warn_empty"),
    active_context_table: "prizepicks_current_market_context",
    run_state_table: "phase2c_market_context_runs",
    slate_date: slateDate,
    current_run: run ? {
      run_id: run.run_id,
      status: run.status,
      processed_rows: Number(run.processed_rows || 0),
      remaining_rows: Number(run.remaining_rows || 0),
      total_rows: Number(run.total_rows || 0),
      chunk_size: Number(run.chunk_size || 0),
      latest_board_updated_at: run.latest_board_updated_at,
      started_at: run.started_at,
      updated_at: run.updated_at,
      completed_at: run.completed_at
    } : null,
    latest_board_batch_window: {
      rule: "mlb_stats.updated_at >= latest updated_at minus 10 minutes",
      oldest_updated_at: boardMeta.oldestInWindow,
      latest_updated_at: boardMeta.newestInWindow,
      total_rows: boardMeta.totalRows
    },
    summary: summary || {},
    identity_counts: identityCounts.results || [],
    stat_type_counts: statCounts.results || [],
    odds_type_counts: oddsCounts.results || [],
    sample_current_rows: sample.results || [],
    warnings,
    next_action: runStatus === "completed" ? "Phase 2C-I current market context is ready for later scoring design." : "Press EVERYDAY PHASE 2C > Run Market Context until current_run.status is completed.",
    note: "This check validates current PrizePicks board context only. It does not score legs, call Gemini, read external odds, write snapshots, or run cron."
  };
}

async function executeTaskJob(jobName, body, slate, env) {
  if (jobName === "board_sifter_preview") {
    return await runBoardSifterPreview({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "board_queue_preview") {
    return await runBoardQueuePreview({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "board_queue_build") {
    return await runBoardQueueBuild({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "board_queue_auto_build") {
    return await runBoardQueueAutoBuild({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "run_board_queue_pipeline") {
    return await runBoardQueuePipeline({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "board_queue_mine_one") {
    return await runBoardQueueMineOne({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "board_queue_auto_mine") {
    return await runBoardQueueAutoMine({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "board_queue_repair") {
    return await runBoardQueueRepair({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }

  // v1.2.94: Everyday Phase 1 jobs are deterministic internal runners.
  // Route them before generic prompt/Gemini fallback to avoid "Missing prompt filename".
  if (jobName === "schedule_everyday_phase1_once") return await scheduleEverydayPhase1Once({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "run_everyday_phase1_tick") return await runEverydayPhase1Tick({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, trigger: "manual" }, env);
  if (jobName === "check_everyday_phase1") return await checkEverydayPhase1({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "everyday_phase1_all_direct") return await runEverydayPhase1Direct({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);

  if (jobName === "scrape_phase2_weather_context") return await scrapePhase2WeatherContext({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "check_phase2_weather_context") return await checkPhase2WeatherContext({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "scrape_phase2_lineup_context") return await scrapePhase2LineupContext({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "check_phase2_lineup_context") return await checkPhase2LineupContext({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "scrape_phase2c_market_context") return await scrapePhase2cMarketContext({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "check_phase2c_market_context") return await checkPhase2cMarketContext({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "schedule_phase3ab_daily_4am") return await schedulePhase3abDaily4am({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, trigger: "manual_daily_schedule" }, env);
  if (jobName === "schedule_phase3ab_full_run_test") return await schedulePhase3abFullRunTest({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "run_phase3ab_full_run_tick") return await runPhase3abFullRunTick({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, trigger: "manual" }, env);
  if (jobName === "check_phase3ab_full_run") return await checkPhase3abFullRun({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "run_sleeper_rbi_rfi_market_board") { const board = await runSleeperRbiRfiMarketBoard({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, trigger: "manual" }, env); const scoring = await runMlbScoringV1({ ...(body || {}), job: "run_mlb_scoring_v1", slate_date: slate.slate_date, slate_mode: slate.slate_mode, trigger: "manual_after_sleeper_market_board" }, env); return { ...board, auto_scoring: scoring, note: String(board.note || "") + " Full Scoring V1 update triggered after Sleeper board signal update. Freshness audit-only." }; }
  if (jobName === "schedule_sleeper_rbi_rfi_daily_430") return await runSleeperRbiRfiMarketBoard({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, trigger: "manual_daily_6am_debug" }, env);
  if (jobName === "check_sleeper_rbi_rfi_market_board") return await checkSleeperRbiRfiMarketBoard({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "run_sleeper_rbi_rfi_window_morning") { const window = await runSleeperRbiRfiWindowRunner({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, window_name: "MORNING", trigger: "manual" }, env); const scoring = await runMlbScoringV1({ ...(body || {}), job: "run_mlb_scoring_v1", slate_date: slate.slate_date, slate_mode: slate.slate_mode, trigger: "manual_after_sleeper_morning_window" }, env); return { ...window, auto_scoring: scoring, note: String(window.note || "") + " Full Scoring V1 update triggered after Sleeper morning window update. Freshness audit-only." }; }
  if (jobName === "run_sleeper_rbi_rfi_window_afternoon") { const window = await runSleeperRbiRfiWindowRunner({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, window_name: "EARLY_AFTERNOON", trigger: "manual" }, env); const scoring = await runMlbScoringV1({ ...(body || {}), job: "run_mlb_scoring_v1", slate_date: slate.slate_date, slate_mode: slate.slate_mode, trigger: "manual_after_sleeper_afternoon_window" }, env); return { ...window, auto_scoring: scoring, note: String(window.note || "") + " Full Scoring V1 update triggered after Sleeper afternoon window update. Freshness audit-only." }; }
  if (jobName === "check_sleeper_rbi_rfi_window_runner") return await checkSleeperRbiRfiWindowRunner({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "run_sleeper_rbi_rfi_prep_morning") return await runSleeperRbiRfiWindowMiningPrep({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, window_name: "MORNING", trigger: "manual" }, env);
  if (jobName === "run_sleeper_rbi_rfi_prep_afternoon") return await runSleeperRbiRfiWindowMiningPrep({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, window_name: "EARLY_AFTERNOON", trigger: "manual" }, env);
  if (jobName === "check_sleeper_rbi_rfi_window_prep") return await checkSleeperRbiRfiWindowMiningPrep({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "run_odds_api_morning") { const odds = await runOddsApiMarketIntel({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, window_name: "MORNING", trigger: "manual" }, env); const scoring = odds.data_ok ? await runMlbScoringV1({ ...(body || {}), job: "run_mlb_scoring_v1", slate_date: slate.slate_date, slate_mode: slate.slate_mode, trigger: "manual_after_odds_api_morning" }, env) : { ok:false, status:"skipped_odds_not_promoted" }; return { ...odds, auto_scoring: scoring, note: String(odds.note || "") + " Full Scoring V1 update triggered after Morning Odds API promotion when data_ok. Freshness audit-only." }; }
  if (jobName === "run_odds_api_afternoon") { const odds = await runOddsApiMarketIntel({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, window_name: "EARLY_AFTERNOON", trigger: "manual" }, env); const scoring = odds.data_ok ? await runMlbScoringV1({ ...(body || {}), job: "run_mlb_scoring_v1", slate_date: slate.slate_date, slate_mode: slate.slate_mode, trigger: "manual_after_odds_api_afternoon" }, env) : { ok:false, status:"skipped_odds_not_promoted" }; return { ...odds, auto_scoring: scoring, note: String(odds.note || "") + " Full Scoring V1 update triggered after Afternoon Odds API promotion when data_ok. Freshness audit-only." }; }
  if (jobName === "check_odds_api_market_intel") return await checkOddsApiMarketIntel({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "run_mlb_scoring_v1") return await runMlbScoringV1({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, trigger: "manual" }, env);
  if (jobName === "check_mlb_scoring_v1") return await checkMlbScoringV1({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);

  if (jobName === "schedule_incremental_temp_refresh_once") return await scheduleIncrementalTempRefreshOnce({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "run_incremental_temp_refresh_tick") return await runIncrementalTempScheduledTick({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, trigger: "manual" }, env);
  if (jobName === "check_incremental_temp_all") return await checkIncrementalTempData({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "audit_incremental_temp_certification") return await auditIncrementalTempCertification({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "promote_incremental_temp_to_live") return await promoteIncrementalTempToLive({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "clean_incremental_temp_tables") return await cleanIncrementalTempTables({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);

  if (/^incremental_base_game_logs_g[1-6]$/.test(jobName)) return await runIncrementalBaseGameLogs({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (/^incremental_base_splits_g[1-6]$/.test(jobName)) return await runIncrementalBaseSplits({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "incremental_base_derived_metrics") return await buildIncrementalBaseDerivedMetrics({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "repair_missing_ref_players") return await repairMissingRefPlayers({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "check_incremental_game_logs") return await checkIncrementalBaseData({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env, 'game_logs');
  if (jobName === "check_incremental_player_splits") return await checkIncrementalBaseData({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env, 'splits');
  if (jobName === "check_incremental_derived_metrics") return await checkIncrementalBaseData({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env, 'derived');
  if (jobName === "check_incremental_all") return await checkIncrementalBaseData({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env, 'all');

  if (jobName === "scrape_static_venues") return await syncStaticVenues({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "scrape_static_team_aliases") return await syncStaticTeamAliases({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "scrape_static_players") return await syncStaticPlayers({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (/^scrape_static_players_g[1-6]$/.test(jobName)) return await syncStaticPlayers({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === 'scrape_static_player_splits_test_5' || /^scrape_static_player_splits_g[1-6]$/.test(jobName)) return await syncStaticPlayerSplits({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (/^scrape_static_game_logs_g[1-6]$/.test(jobName)) return await syncStaticPlayerGameLogs({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "scrape_static_bvp_current_slate") return await syncStaticBvpCurrentSlate({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "scrape_static_all_fast") return await syncStaticAllFast({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "schedule_static_temp_refresh_once") return await scheduleStaticTempRefreshOnce({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "run_static_temp_refresh_tick") return await runStaticTempScheduledTick({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, trigger: "manual" }, env);
  if (jobName === "check_static_temp_venues") return await checkStaticTempData({ ...(body || {}), job: jobName }, env, "ref_venues_temp");
  if (jobName === "check_static_temp_team_aliases") return await checkStaticTempData({ ...(body || {}), job: jobName }, env, "ref_team_aliases_temp");
  if (jobName === "check_static_temp_players") return await checkStaticTempData({ ...(body || {}), job: jobName }, env, "ref_players_temp");
  if (jobName === "check_static_temp_all") return await checkStaticTempData({ ...(body || {}), job: jobName }, env, "all");
  if (jobName === "audit_static_temp_certification") return await auditStaticTempCertification({ ...(body || {}), job: jobName }, env);
  if (jobName === "promote_static_temp_to_live") return await promoteStaticTempToLive({ ...(body || {}), job: jobName }, env);
  if (jobName === "clean_static_temp_tables") return await cleanStaticTempTables({ ...(body || {}), job: jobName }, env);
  if (jobName === "check_static_venues") return await checkStaticData({ ...(body || {}), job: jobName }, env, "ref_venues");
  if (jobName === "check_static_team_aliases") return await checkStaticData({ ...(body || {}), job: jobName }, env, "ref_team_aliases");
  if (jobName === "check_static_players") return await checkStaticData({ ...(body || {}), job: jobName }, env, "ref_players");
  if (jobName === "check_static_player_splits") return await checkStaticData({ ...(body || {}), job: jobName }, env, "ref_player_splits");
  if (jobName === "check_static_game_logs") return await checkStaticData({ ...(body || {}), job: jobName }, env, "player_game_logs");
  if (jobName === "check_static_bvp") return await checkStaticData({ ...(body || {}), job: jobName }, env, "ref_bvp_history");
  if (jobName === "check_static_all") return await checkStaticData({ ...(body || {}), job: jobName }, env, "all");
  if (jobName === "scrape_games_markets" || jobName === "daily_mlb_slate") {
    return await syncMlbApiGamesMarkets({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "scrape_starters_mlb_api" || jobName === "repair_starters_mlb_api") {
    return await syncMlbApiProbableStarters({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (/^scrape_starters_group_[123]$/.test(jobName)) {
    const groupJob = JOBS[jobName] || {};
    return await syncMlbApiProbableStarters({
      ...(body || {}),
      job: jobName,
      slate_date: slate.slate_date,
      slate_mode: slate.slate_mode,
      game_group_index: Number(groupJob.gameGroupIndex || 0),
      game_group_size: Number(groupJob.gameGroupSize || 5),
      deterministic_group_sync: true
    }, env);
  }
  if (jobName === "scrape_bullpens_mlb_api" || jobName === "scrape_bullpens") {
    return await syncMlbApiBullpens({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "scrape_lineups_mlb_api" || jobName === "scrape_lineups") {
    return await syncMlbApiLineups({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "scrape_recent_usage_mlb_api" || jobName === "scrape_recent_usage") {
    return await syncMlbApiRecentUsage({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "scrape_derived_metrics") {
    return await syncDerivedMetrics({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "build_edge_candidates_hits") {
    return await buildEdgeCandidatesHits({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "build_edge_candidates_rbi") {
    return await buildEdgeCandidatesRbi({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "build_edge_candidates_rfi") {
    return await buildEdgeCandidatesRfi({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "scrape_players_mlb_api" || jobName === "scrape_players" || /^scrape_players_mlb_api_g[1-6]$/.test(jobName)) {
    return await syncMlbApiPlayersIdentity({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "scrape_starters_missing") {
    return await syncMissingStartersLiveFallback({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  return await runJob({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
}

async function guardLongStaticJobAlreadyRunning(env, jobName) {
  if (!(/^scrape_static_game_logs_g[1-6]$/.test(String(jobName || "")) || /^incremental_base_game_logs_g[1-6]$/.test(String(jobName || "")) || String(jobName || "") === "scrape_static_bvp_current_slate")) return null;
  await env.DB.prepare(`
    UPDATE task_runs
    SET status='stale_reset',
        finished_at=CURRENT_TIMESTAMP,
        error='v1.2.79 static long-job same-job stale reset before new manual run'
    WHERE job_name=?
      AND status='running'
      AND started_at < datetime('now','-2 minutes')
  `).bind(jobName).run().catch(() => null);
  const row = await env.DB.prepare(`
    SELECT task_id, job_name, status, started_at
    FROM task_runs
    WHERE job_name=?
      AND status='running'
    ORDER BY started_at DESC
    LIMIT 1
  `).bind(jobName).first().catch(() => null);
  if (!row) return null;
  return { ok: true, data_ok: false, job: jobName, version: SYSTEM_VERSION, status: 'already_running_wait', active_task_id: row.task_id, active_started_at: row.started_at, retry_instruction: 'Do not tap again yet. Wait 60-90 seconds, then check task_runs or run the same button once.', root_cause_fixed: 'v1.2.79 prevents duplicate static game-log/BvP tasks when Safari/control-room retries after a load failure.', note: 'No new task was started because the same static long job is already running.' };
}

async function handleTaskRun(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();
  const body = await safeJson(request);
  const slate = resolveSlateDate(body || {});
  const jobName = String((body || {}).job || "scrape_games_markets");
  const taskId = crypto.randomUUID();
  const input = { ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, trigger: "manual" };
  await logSystemEvent(env, { trigger_source: "control_room_button", action_label: displayLabelForJob(jobName), job_name: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, status: "started", task_id: taskId, input_json: input });

  if (!isExecutableJobName(jobName)) {
    await logSystemEvent(env, { trigger_source: "control_room_button", action_label: displayLabelForJob(jobName), job_name: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, status: "rejected_unknown_job", http_status: 400, task_id: taskId, input_json: input });
    return Response.json({
      ok: false,
      status: "REJECTED_UNKNOWN_JOB",
      error: `Unknown job: ${jobName}`,
      job: jobName,
      valid_jobs: executableJobNames(),
      registry_audit: jobRegistryRequiredAudit(),
      note: "Rejected before task_runs insert. No failed task_run was created for this invalid job name."
    }, { status: 400 });
  }

  const longStaticGuard = await guardLongStaticJobAlreadyRunning(env, jobName);
  if (longStaticGuard) {
    await logSystemEvent(env, { trigger_source: "control_room_button", action_label: displayLabelForJob(jobName), job_name: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, status: "already_running_wait", http_status: 200, task_id: taskId, input_json: input, output_preview: longStaticGuard });
    return Response.json(longStaticGuard, { status: 200 });
  }

  await env.DB.prepare(`
    INSERT INTO task_runs (task_id, job_name, status, started_at, input_json)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
  `).bind(taskId, jobName, "running", JSON.stringify(input)).run();

  let result;
  try {
    result = jobName === "run_full_pipeline"
      ? await runFullPipeline(input, env)
      : await executeTaskJob(jobName, body, slate, env);

    await env.DB.prepare(`
      UPDATE task_runs
      SET status = ?, finished_at = CURRENT_TIMESTAMP, output_json = ?
      WHERE task_id = ?
    `).bind(result.ok ? "success" : "failed", JSON.stringify(result), taskId).run();
  } catch (err) {
    result = { ok: false, status: "FAILED_EXCEPTION", error: String(err?.message || err), task_id: taskId };
    try {
      await env.DB.prepare(`
        UPDATE task_runs
        SET status = ?, finished_at = CURRENT_TIMESTAMP, error = ?
        WHERE task_id = ?
      `).bind("failed", result.error, taskId).run();
    } catch (_) {}
  }

  if (result && typeof result === "object" && !result.task_id) result.task_id = taskId;
  const httpStatus = result.ok ? 200 : 500;
  await logSystemEvent(env, { trigger_source: "control_room_button", action_label: displayLabelForJob(jobName), job_name: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, status: result.ok ? "success" : "failed", http_status: httpStatus, task_id: taskId, input_json: input, output_preview: result, error: result.ok ? null : (result.error || result.status || "job_failed") });
  return Response.json(result, { status: httpStatus });
}

async function countScalar(env, sql, bindValue) {
  const stmt = bindValue !== undefined ? env.DB.prepare(sql).bind(bindValue) : env.DB.prepare(sql);
  const result = await stmt.first();
  const values = Object.values(result || {});
  return Number(values[0] || 0);
}


async function snapshotReusableStarterOverrides(env, slateDate) {
  try {
    const rows = await env.DB.prepare(`
      SELECT * FROM starters_current
      WHERE game_id LIKE ?
        AND source IN (
          'gemini_live_missing_starter_fallback',
          'gemini_live_projected_missing_starter',
          'gemini_live_probable_missing_starter',
          'manual_projected_missing_starter',
          'manual_probable_missing_starter'
        )
        AND starter_name IS NOT NULL
        AND TRIM(starter_name) <> ''
        AND starter_name NOT IN ('TBD','TBA','Unknown','Starter')
    `).bind(`${slateDate}_%`).all();
    return rows.results || [];
  } catch (_) { return []; }
}

async function restoreReusableStarterOverrides(env, slateDate, rows) {
  if (!Array.isArray(rows) || !rows.length) return { restored: 0, skipped_existing: 0 };
  const existsStmt = env.DB.prepare("SELECT COUNT(*) AS c FROM starters_current WHERE game_id=? AND team_id=?");
  const insertStmt = env.DB.prepare(`
    INSERT OR REPLACE INTO starters_current (
      game_id, team_id, starter_name, throws, era, whip, strikeouts, innings_pitched,
      walks, hits_allowed, hr_allowed, days_rest, source, confidence, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  let restored = 0;
  let skipped = 0;
  for (const r of rows) {
    if (!String(r.game_id || '').startsWith(`${slateDate}_`)) continue;
    const ex = await existsStmt.bind(r.game_id, r.team_id).first();
    if (Number(ex?.c || 0) > 0) { skipped++; continue; }
    const res = await insertStmt.bind(
      r.game_id, r.team_id, r.starter_name, r.throws ?? null,
      r.era ?? null, r.whip ?? null, r.strikeouts ?? null, r.innings_pitched ?? null,
      r.walks ?? null, r.hits_allowed ?? null, r.hr_allowed ?? null, r.days_rest ?? null,
      r.source || 'manual_projected_missing_starter', r.confidence || 'projected'
    ).run();
    restored += Number(res?.meta?.changes || 0);
  }
  return { restored, skipped_existing: skipped };
}

async function countMissingStarterGames(env, slateDate) {
  return await countScalar(env, `
    SELECT COUNT(*) AS c FROM (
      SELECT g.game_id, COUNT(s.team_id) AS starters_found
      FROM games g
      LEFT JOIN starters_current s ON g.game_id = s.game_id
      WHERE g.game_date = ?
      GROUP BY g.game_id
      HAVING starters_found < 2
    )
  `, slateDate);
}

async function repairMissingStartersLockstep(input, env, slateDate, slate, steps, preservedRows) {
  const attempts = [];
  let restored = await restoreReusableStarterOverrides(env, slateDate, preservedRows);
  steps.push({ label: "Restore Reusable Missing Starters", job: "internal_restore_projected_starters", result: { ok: true, ...restored } });
  let remaining = await countMissingStarterGames(env, slateDate);
  for (let attempt = 1; attempt <= 3 && remaining > 0; attempt++) {
    const result = await syncMissingStartersLiveFallback({ ...(input || {}), job: "scrape_starters_missing", slate_date: slateDate, slate_mode: slate.slate_mode }, env);
    attempts.push({ attempt, result });
    steps.push({ label: "Missing Starter Fallback", job: "scrape_starters_missing", attempt, result });
    restored = await restoreReusableStarterOverrides(env, slateDate, preservedRows);
    if (restored.restored || restored.skipped_existing) steps.push({ label: "Restore Reusable Missing Starters After Fallback", job: "internal_restore_projected_starters", attempt, result: { ok: true, ...restored } });
    remaining = await countMissingStarterGames(env, slateDate);
    if (remaining <= 0) break;
    await sleepMs(900 * attempt);
  }
  const stillMissing = await missingStarterTargets(env, slateDate);
  return { ok: true, status: stillMissing.length ? "tolerated_partial_true_missing" : "pass", attempts, still_missing_targets: stillMissing, still_missing_games: await countMissingStarterGames(env, slateDate), note: stillMissing.length ? "Starter fallback exhausted live/override sources. Missing teams are warning-state TBD/projected-unavailable so full run continues mining raw board data." : "All starter pairs filled." };
}

async function runBoardQueueAutoMineWaves(input, env, slateDate, slate, maxWaves = 3) {
  const waves = [];
  const startedMs = Date.now();
  const cutoffMs = Math.max(5000, Number(input?.phase3_tick_runtime_cutoff_ms || PHASE3AB_TICK_RUNTIME_CUTOFF_MS));
  const requestedLimit = Math.max(1, Math.min(Number(input?.limit || input?.max_rows || input?.max_mines || BOARD_QUEUE_AUTO_MINE_LIMIT), BOARD_QUEUE_AUTO_MINE_LIMIT));
  for (let wave = 1; wave <= maxWaves; wave++) {
    const elapsedBefore = Date.now() - startedMs;
    if (elapsedBefore > cutoffMs) {
      waves.push({ wave, skipped: true, status: 'phase3_tick_runtime_cutoff_before_wave', elapsed_ms: elapsedBefore, cutoff_ms: cutoffMs });
      break;
    }
    const result = await runBoardQueueAutoMine({ ...(input || {}), job: "board_queue_auto_mine", slate_date: slateDate, slate_mode: slate.slate_mode, limit: requestedLimit, max_rows: requestedLimit, max_mines: requestedLimit, retry_errors: false, persistent_miner: true }, env);
    const elapsedAfter = Date.now() - startedMs;
    waves.push({ wave, elapsed_ms: elapsedAfter, result });
    if (!result?.needs_continue) break;
    if (result?.mined_rows === 0 && result?.completed_by_existing_raw_result === 0 && result?.retry_later_count === 0 && result?.failed_count === 0) break;
    if (elapsedAfter > cutoffMs) break;
    await sleepMs(150);
  }
  const totals = await env.DB.prepare(`
    SELECT COUNT(*) AS total_rows,
      SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending_rows,
      SUM(CASE WHEN status='RETRY_LATER' THEN 1 ELSE 0 END) AS retry_later_rows,
      SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed_rows,
      SUM(CASE WHEN status='RUNNING' THEN 1 ELSE 0 END) AS running_rows,
      SUM(CASE WHEN status='ERROR' THEN 1 ELSE 0 END) AS error_rows
    FROM board_factor_queue WHERE slate_date=?
  `).bind(slateDate).first();
  return { ok: true, job: "board_queue_auto_mine_waves", version: SYSTEM_VERSION, slate_date: slateDate, waves_run: waves.length, requested_limit_per_wave: requestedLimit, tick_cutoff_ms: cutoffMs, waves, totals: { total_rows: Number(totals?.total_rows || 0), pending_rows: Number(totals?.pending_rows || 0), completed_rows: Number(totals?.completed_rows || 0), retry_later_rows: Number(totals?.retry_later_rows || 0), running_rows: Number(totals?.running_rows || 0), error_rows: Number(totals?.error_rows || 0) }, needs_continue: Number(totals?.pending_rows || 0) > 0 || Number(totals?.retry_later_rows || 0) > 0 || Number(totals?.running_rows || 0) > 0 || Number(totals?.error_rows || 0) > 0, note: "v1.3.18 full run runs multiple bounded mining waves per tick when safe. Remaining rows are normal continuation work for scheduled runs; no data is abandoned." };
}


async function runFullPipelineCore(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;
  const startedAt = new Date().toISOString();
  const steps = [];
  const warnings = [];
  const errors = [];

  const staleRecovery = await resetStalePipelineRuntime(env, slateDate);
  steps.push({ label: "Stale Runtime Recovery", job: "internal_stale_recovery", result: staleRecovery });

  async function safeStep(label, job, runner, required = false) {
    try {
      const result = await runner();
      steps.push({ label, job, result });
      if (result && result.ok === false) {
        const msg = `${label}: ${result.error || result.status || 'not ok'}`;
        (required ? errors : warnings).push(msg);
      }
      return result;
    } catch (err) {
      const result = { ok: false, status: "STEP_EXCEPTION", error: String(err?.message || err) };
      steps.push({ label, job, result });
      const msg = `${label}: ${result.error}`;
      (required ? errors : warnings).push(msg);
      return result;
    }
  }

  const markets = await safeStep("Markets", "scrape_games_markets", async () => {
    let last = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      last = await syncMlbApiGamesMarkets({ ...(input || {}), job: "scrape_games_markets", slate_date: slateDate, slate_mode: slate.slate_mode }, env);
      if (last && last.ok) break;
    }
    return last || { ok: false, error: "No market attempt executed" };
  }, true);

  const games = await countScalar(env, "SELECT COUNT(*) AS c FROM games WHERE game_date = ?", slateDate).catch(() => 0);
  const marketsTotal = await countScalar(env, "SELECT COUNT(*) AS c FROM markets_current WHERE game_id LIKE ?", `${slateDate}_%`).catch(() => 0);

  const boardQueueAutoBuild = await safeStep("Board Queue Auto Build", "board_queue_auto_build", async () => {
    return await runBoardQueueAutoBuild({ ...(input || {}), job: "board_queue_auto_build", slate_date: slateDate, slate_mode: slate.slate_mode, max_passes: 8 }, env);
  }, false);

  const startersTotal = await countScalar(env, "SELECT COUNT(*) AS c FROM starters_current WHERE game_id LIKE ?", `${slateDate}_%`).catch(() => 0);
  const bullpensTotal = await countScalar(env, "SELECT COUNT(*) AS c FROM bullpens_current WHERE game_id LIKE ?", `${slateDate}_%`).catch(() => 0);
  const lineupsTotal = await countScalar(env, "SELECT COUNT(*) AS c FROM lineups_current WHERE game_id LIKE ?", `${slateDate}_%`).catch(() => 0);
  const recentUsageTotal = await countScalar(env, "SELECT COUNT(*) AS c FROM player_recent_usage").catch(() => 0);
  const playersTotal = await countScalar(env, "SELECT COUNT(*) AS c FROM players_current").catch(() => 0);
  const expectedStarters = games * 2;
  const missingGames = games > 0 ? await countScalar(env, `
    SELECT COUNT(*) AS c FROM (
      SELECT g.game_id, COUNT(s.team_id) AS starters_found
      FROM games g
      LEFT JOIN starters_current s ON g.game_id = s.game_id
      WHERE g.game_date = ?
      GROUP BY g.game_id
      HAVING starters_found < 2
    )
  `, slateDate).catch(() => 0) : 0;
  if (missingGames > 0) warnings.push(`${missingGames} games still have one-sided/TBD starters; mining should continue around available contexts and retry missing context later.`);
  if (lineupsTotal === 0) warnings.push("Confirmed lineups are not posted yet; lineup sweep/cron should retry later.");

  const queueTotals = await boardQueueTotals(env, slateDate).catch(() => null);
  const pending = Number(queueTotals?.pending_rows || 0);
  const retryLater = Number(queueTotals?.retry_later_rows || 0);
  const running = Number(queueTotals?.running_rows || 0);
  const errorRows = Number(queueTotals?.error_rows || 0);

  let pipelineStatus = "PASS";
  if (games <= 0 || marketsTotal <= 0 || !markets?.ok) pipelineStatus = "FAIL";
  else if (pending > 0 || retryLater > 0 || running > 0) pipelineStatus = "RETRY_LATER";
  else if (warnings.length || errorRows > 0 || errors.length) pipelineStatus = "PARTIAL_OK";

  return {
    ok: pipelineStatus !== "FAIL",
    status: pipelineStatus,
    pipeline_status: pipelineStatus,
    version: SYSTEM_VERSION,
    job: "run_full_pipeline",
    slate_date: slateDate,
    slate_mode: slate.slate_mode,
    dispatcher_mode: "v1.2.73_full_run_is_lightweight_dispatcher_no_mining_no_starter_sweep",
    games,
    markets: marketsTotal,
    expected_starters: expectedStarters,
    starters_total: startersTotal,
    bullpens_total: bullpensTotal,
    lineups_total: lineupsTotal,
    recent_usage_total: recentUsageTotal,
    players_total: playersTotal,
    queue_totals: queueTotals,
    board_queue_auto_build: boardQueueAutoBuild,
    board_queue_auto_mine: { skipped_in_full_run: true, reason: "Mining is intentionally excluded from FULL RUN to avoid Cloudflare subrequest limits. Scheduled/manual Auto Mine processes the queue in 5-row batches." },
    missing_games: missingGames,
    warnings,
    errors,
    audit_gates: {
      pass: "games/markets refreshed and no queue continuation needed",
      partial_ok: "non-fatal data warnings only",
      retry_later: "queue still has PENDING/RETRY_LATER/RUNNING rows for scheduled miner",
      fail: "games or markets empty after retry"
    },
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    steps
  };
}

async function runFullPipeline(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;
  const lockedBy = `${input?.trigger || 'manual'}:${crypto.randomUUID()}`;
  await resetStalePipelineRuntime(env, slateDate).catch(() => null);
  const lockId = `FULL_PIPELINE|${slateDate}`;
  const lock = await acquirePipelineLock(env, lockId, lockedBy, 15);
  if (!lock.acquired) {
    const totals = await boardQueueTotals(env, slateDate).catch(() => null);
    return {
      ok: true,
      version: SYSTEM_VERSION,
      job: 'run_full_pipeline',
      status: 'LOCKED',
      pipeline_status: 'LOCKED',
      slate_date: slateDate,
      lock_status: lock,
      board_queue_totals: totals,
      note: 'A full pipeline is already active. This request exited cleanly to prevent duplicate Worker subrequest storms. Mining can continue separately.'
    };
  }
  try {
    const result = await runFullPipelineCore(input || {}, env);
    if (result && typeof result === 'object') {
      result.lock_status = 'RELEASED';
      result.state_machine_policy = 'v1.2.73: FULL RUN is a lightweight atomic dispatcher using a slate-scoped FULL_PIPELINE lock. It does not mine rows or run starter/lineup sweeps, preventing Cloudflare subrequest overload.';
    }
    return result;
  } catch (err) {
    return {
      ok: true,
      version: SYSTEM_VERSION,
      job: 'run_full_pipeline',
      status: 'PARTIAL_OK_EXCEPTION_CAPTURED',
      pipeline_status: 'PARTIAL_OK',
      slate_date: slateDate,
      error: String(err?.message || err),
      note: 'Exception captured without HTTP 500 so the control room does not retry into a duplicate FULL RUN. Check system_event_log and let scheduled miner continue.'
    };
  } finally {
    await releasePipelineLock(env, lockId, lockedBy);
  }
}


const MLB_TEAM_ABBR = {
  109: "ARI", 144: "ATL", 110: "BAL", 111: "BOS", 112: "CHC", 113: "CIN",
  114: "CLE", 115: "COL", 145: "CWS", 116: "DET", 117: "HOU", 118: "KC",
  108: "LAA", 119: "LAD", 146: "MIA", 158: "MIL", 142: "MIN", 121: "NYM",
  147: "NYY", 133: "OAK", 143: "PHI", 134: "PIT", 135: "SD", 136: "SEA",
  137: "SFG", 138: "STL", 139: "TB", 140: "TEX", 141: "TOR", 120: "WSN"
};


function sleepMs(ms) {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

async function fetchJsonWithRetry(url, options = {}, retries = 3, label = "fetch_json") {
  let lastError = null;
  for (let attempt = 1; attempt <= Math.max(1, retries); attempt++) {
    try {
      const res = await fetch(url, { headers: { "accept": "application/json", ...(options.headers || {}) }, ...options });
      if (res.ok) return { ok: true, status: res.status, data: await res.json(), attempt };
      lastError = new Error(`${label} HTTP ${res.status}`);
      if (![408, 425, 429, 500, 502, 503, 504].includes(Number(res.status))) break;
    } catch (err) {
      lastError = err;
    }
    if (attempt < retries) await sleepMs(250 * attempt);
  }
  return { ok: false, status: null, data: null, error: String(lastError?.message || lastError || `${label} failed`) };
}

function decimalInnings(ip) {
  if (ip === undefined || ip === null || ip === "") return null;
  const raw = String(ip);
  if (!raw.includes(".")) return Number(raw);
  const [whole, frac] = raw.split(".");
  return Number(`${Number(whole)}.${frac}`);
}

function pitcherSeasonStats(person) {
  const statSplits = person?.stats?.[0]?.splits || [];
  const stat = statSplits?.[0]?.stat || {};
  return {
    throws: person?.pitchHand?.code || null,
    era: stat.era !== undefined ? Number(stat.era) : null,
    whip: stat.whip !== undefined ? Number(stat.whip) : null,
    strikeouts: stat.strikeOuts !== undefined ? Number(stat.strikeOuts) : null,
    innings_pitched: stat.inningsPitched !== undefined ? decimalInnings(stat.inningsPitched) : null,
    walks: stat.baseOnBalls !== undefined ? Number(stat.baseOnBalls) : null,
    hits_allowed: stat.hits !== undefined ? Number(stat.hits) : null,
    hr_allowed: stat.homeRuns !== undefined ? Number(stat.homeRuns) : null
  };
}


async function fetchMlbPitcherStatsMap(pitcherIds, season) {
  const uniqueIds = [...new Set((pitcherIds || []).filter(Boolean))];
  const map = new Map();
  if (!uniqueIds.length) return map;

  for (let i = 0; i < uniqueIds.length; i += 40) {
    const batch = uniqueIds.slice(i, i + 40);
    const url = `https://statsapi.mlb.com/api/v1/people?personIds=${batch.join(",")}&hydrate=stats(group=[pitching],type=[season],season=${encodeURIComponent(season)})`;
    const fetched = await fetchJsonWithRetry(url, {}, 3, "mlb_people_pitcher_stats");
    if (!fetched.ok) continue;

    const data = fetched.data || {};
    for (const person of (data.people || [])) {
      map.set(Number(person.id), pitcherSeasonStats(person));
    }
  }

  return map;
}

function apiStarterRow(gameId, teamId, pitcher, slateDate, statsOverride) {
  if (!pitcher || !pitcher.fullName) return null;
  const stats = statsOverride || pitcherSeasonStats(pitcher);
  return {
    game_id: gameId,
    team_id: teamId,
    starter_name: pitcher.fullName,
    throws: pitcher.pitchHand?.code || stats.throws || null,
    era: stats.era,
    whip: stats.whip,
    strikeouts: stats.strikeouts,
    innings_pitched: stats.innings_pitched,
    walks: stats.walks,
    hits_allowed: stats.hits_allowed,
    hr_allowed: stats.hr_allowed,
    days_rest: null,
    source: "mlb_statsapi_probable_pitcher",
    data_source: "mlb_statsapi_probable_pitcher",
    confidence: "official_probable"
  };
}

async function fetchMlbScheduleProbables(slateDate) {
  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(slateDate)}&hydrate=probablePitcher(stats(group=[pitching],type=[season]))`;
  const fetched = await fetchJsonWithRetry(url, {}, 4, "mlb_schedule_probables");
  if (!fetched.ok) throw new Error(`MLB schedule fetch failed after retry: ${fetched.error}`);
  return fetched.data || { dates: [] };
}

function gameIdFromMlbGame(game, slateDate) {
  const awayId = game?.teams?.away?.team?.id;
  const homeId = game?.teams?.home?.team?.id;
  const away = MLB_TEAM_ABBR[awayId];
  const home = MLB_TEAM_ABBR[homeId];
  if (!away || !home) return null;
  return `${slateDate}_${away}_${home}`;
}



const MLB_TEAM_ID_BY_ABBR = Object.fromEntries(Object.entries(MLB_TEAM_ABBR).map(([id, abbr]) => [abbr, Number(id)]));

function ipToOuts(ip) {
  if (ip === undefined || ip === null || ip === "") return 0;
  const raw = String(ip);
  const [whole, frac = "0"] = raw.split(".");
  const thirds = frac === "1" ? 1 : frac === "2" ? 2 : 0;
  return Number(whole || 0) * 3 + thirds;
}

function outsToIpDecimal(outs) {
  const whole = Math.floor(Number(outs || 0) / 3);
  const rem = Number(outs || 0) % 3;
  return Number(`${whole}.${rem}`);
}

async function fetchMlbScheduleForTeam(teamId, startDate, endDate) {
  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${encodeURIComponent(teamId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
  const fetched = await fetchJsonWithRetry(url, {}, 3, "mlb_schedule_team");
  if (!fetched.ok) return [];
  const data = fetched.data || {};
  const games = [];
  for (const d of (data.dates || [])) for (const g of (d.games || [])) games.push(g);
  return games;
}

async function fetchMlbBoxscore(gamePk) {
  const fetched = await fetchJsonWithRetry(`https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`, {}, 3, "mlb_boxscore");
  if (!fetched.ok) return null;
  return fetched.data || null;
}

function bullpenOutsFromBoxscore(box, teamSide) {
  const team = box?.teams?.[teamSide];
  if (!team?.players) return 0;

  let outs = 0;
  for (const player of Object.values(team.players)) {
    const p = player?.stats?.pitching;
    if (!p) continue;
    const gamesStarted = Number(p.gamesStarted || 0);
    if (gamesStarted > 0) continue;
    outs += ipToOuts(p.inningsPitched);
  }
  return outs;
}

function fatigueFromOuts(lastOuts, last3Outs) {
  const lastIp = lastOuts / 3;
  const last3Ip = last3Outs / 3;
  if (lastIp >= 4 || last3Ip >= 12) return "high";
  if (lastIp >= 3 || last3Ip >= 9) return "medium";
  return "low";
}

async function bullpenUsageForTeam(teamAbbr, slateDate) {
  const teamId = MLB_TEAM_ID_BY_ABBR[teamAbbr];
  if (!teamId) return { last_game_ip: null, last3_ip: null, fatigue: "unknown" };

  const startDate = addDaysISO(slateDate, -7);
  const endDate = addDaysISO(slateDate, -1);
  const games = await fetchMlbScheduleForTeam(teamId, startDate, endDate);
  const finals = games
    .filter(g => String(g?.status?.abstractGameState || "").toLowerCase() === "final")
    .sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate))
    .slice(0, 3);

  let lastOuts = 0;
  let last3Outs = 0;

  for (let i = 0; i < finals.length; i++) {
    const g = finals[i];
    const box = await fetchMlbBoxscore(g.gamePk);
    const side = Number(g?.teams?.away?.team?.id) === Number(teamId) ? "away" : "home";
    const outs = bullpenOutsFromBoxscore(box, side);
    if (i === 0) lastOuts = outs;
    last3Outs += outs;
  }

  return {
    last_game_ip: outsToIpDecimal(lastOuts),
    last3_ip: outsToIpDecimal(last3Outs),
    fatigue: fatigueFromOuts(lastOuts, last3Outs)
  };
}




function battingUsageToRecentRow(teamId, playerObj, lineupSlot) {
  const person = playerObj?.person || {};
  const batting = playerObj?.stats?.batting || {};
  const playerName = person?.fullName || null;
  if (!playerName) return null;

  const ab = batting.atBats ?? null;
  const hits = batting.hits ?? null;

  return {
    player_name: playerName,
    team_id: teamId,
    last_pitch_count: null,
    last_innings: null,
    days_rest: null,
    last_game_ab: ab,
    last_game_hits: hits,
    lineup_slot: lineupSlot || null
  };
}


function ageFromBirthDate(birthDate) {
  if (!birthDate) return null;
  const b = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - b.getUTCFullYear();
  const m = now.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

function playerRoleFromPosition(positionCode, pitchHand) {
  if (positionCode === "1") return "P";
  return "BAT";
}


function firstStatSplitByGroup(person, groupName) {
  const stats = Array.isArray(person?.stats) ? person.stats : [];
  for (const block of stats) {
    const group = String(block?.group?.displayName || block?.group || "").toLowerCase();
    const splits = Array.isArray(block?.splits) ? block.splits : [];
    if (groupName && group && !group.includes(String(groupName).toLowerCase())) continue;
    if (splits[0]?.stat) return splits[0].stat;
  }
  for (const block of stats) {
    const splits = Array.isArray(block?.splits) ? block.splits : [];
    if (splits[0]?.stat) return splits[0].stat;
  }
  return {};
}

function toStatNumber(v) {
  if (v === undefined || v === null || v === "" || v === "-.--") return null;
  const n = Number(String(v).replace(/^0(?=\.)/, ""));
  return Number.isFinite(n) ? n : null;
}

function hitterSeasonStats(person) {
  const stat = firstStatSplitByGroup(person, "hitting");
  return {
    games: toStatNumber(stat.gamesPlayed ?? stat.games),
    ab: toStatNumber(stat.atBats),
    hits: toStatNumber(stat.hits),
    avg: toStatNumber(stat.avg),
    obp: toStatNumber(stat.obp),
    slg: toStatNumber(stat.slg)
  };
}

function pitcherIdentitySeasonStats(person) {
  const stat = firstStatSplitByGroup(person, "pitching");
  return {
    games: toStatNumber(stat.gamesPlayed ?? stat.games),
    innings_pitched: stat.inningsPitched !== undefined ? decimalInnings(stat.inningsPitched) : null,
    strikeouts: toStatNumber(stat.strikeOuts),
    walks: toStatNumber(stat.baseOnBalls),
    hits_allowed: toStatNumber(stat.hits),
    era: toStatNumber(stat.era),
    k_per_9: toStatNumber(stat.strikeoutsPer9Inn ?? stat.strikeOutsPer9Inn),
    whip: toStatNumber(stat.whip)
  };
}


function playerIdentityRowFromRosterEntry(entry, teamId) {
  const person = entry?.person || entry || {};
  const position = entry?.position || person?.primaryPosition || {};
  const playerName = person?.fullName || person?.name || null;
  if (!playerName) return null;

  const bats = person?.batSide?.code || entry?.batSide?.code || null;
  const throws = person?.pitchHand?.code || entry?.pitchHand?.code || null;
  const positionAbbrev = position?.abbreviation || position?.code || null;
  const role = playerRoleFromPosition(position?.code, throws);

  const h = hitterSeasonStats(person);
  const p = pitcherIdentitySeasonStats(person);

  return {
    player_name: playerName,
    team_id: teamId,
    role,
    games: role === "P" ? p.games : h.games,
    innings_pitched: p.innings_pitched,
    strikeouts: p.strikeouts,
    walks: p.walks,
    hits_allowed: p.hits_allowed,
    era: p.era,
    k_per_9: p.k_per_9,
    whip: p.whip,
    ab: h.ab,
    hits: h.hits,
    avg: h.avg,
    obp: h.obp,
    slg: h.slg,
    age: ageFromBirthDate(person?.birthDate),
    position: positionAbbrev,
    bats,
    throws,
    source: "mlb_statsapi_roster_identity_handedness_season_stats",
    confidence: h.avg !== null || p.era !== null ? "official_identity_season_stats" : "official_identity"
  };
}

function extractRosterEntriesFromHydratedTeam(teamNode) {
  const roster =
    teamNode?.team?.roster?.roster ||
    teamNode?.roster?.roster ||
    teamNode?.team?.roster ||
    teamNode?.roster ||
    [];
  return Array.isArray(roster) ? roster : [];
}


function playerIdentityGroupFromJob(job) {
  const match = String(job || "").match(/_g([1-6])$/);
  return match ? Number(match[1]) : null;
}

function selectPlayerIdentityTeams(teamList, group) {
  const sorted = [...teamList].sort((a, b) => a.teamId.localeCompare(b.teamId));
  if (!group) return sorted.slice(0, 5);
  const size = Math.ceil(sorted.length / 6);
  const start = (group - 1) * size;
  return sorted.slice(start, start + size);
}

async function syncMlbApiPlayersIdentity(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;
  const group = playerIdentityGroupFromJob(input.job);
  const maxWrites = 170;

  const games = await env.DB.prepare("SELECT away_team, home_team FROM games WHERE game_date = ? ORDER BY game_id").bind(slateDate).all();
  const teamCodes = [...new Set((games.results || []).flatMap(g => [g.away_team, g.home_team]))].filter(Boolean);

  const scheduleFetch = await fetchJsonWithRetry(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(slateDate)}`, {}, 3, "mlb_players_schedule");
  const scheduleJson = scheduleFetch.ok ? (scheduleFetch.data || { dates: [] }) : { dates: [] };

  const teamMap = new Map();
  for (const d of (scheduleJson.dates || [])) {
    for (const g of (d.games || [])) {
      for (const side of ["away", "home"]) {
        const mlbId = g?.teams?.[side]?.team?.id;
        const teamId = MLB_TEAM_ABBR[mlbId];
        if (mlbId && teamId && teamCodes.includes(teamId)) teamMap.set(teamId, { mlbId: String(mlbId), teamId });
      }
    }
  }

  const selectedTeams = selectPlayerIdentityTeams([...teamMap.values()], group);
  const rows = [];
  const team_fetch_audit = [];

  for (const t of selectedTeams) {
    const rosterUrl = `https://statsapi.mlb.com/api/v1/teams/${encodeURIComponent(t.mlbId)}/roster?rosterType=active&hydrate=person(stats(group=[hitting,pitching],type=[season],season=${encodeURIComponent(String(slateDate).slice(0,4))}))`;
    const fetched = await fetchJsonWithRetry(rosterUrl, {}, 4, `mlb_roster_${t.teamId}`);
    team_fetch_audit.push({ team_id: t.teamId, ok: fetched.ok, attempt: fetched.attempt || null, error: fetched.error || null });
    if (!fetched.ok) continue;
    const rosterJson = fetched.data || {};
    for (const entry of (rosterJson.roster || [])) {
      const row = playerIdentityRowFromRosterEntry(entry, t.teamId);
      if (row) rows.push(row);
    }
  }

  const seen = new Set();
  const deduped = [];
  for (const row of rows) {
    const key = `${row.player_name}|${row.team_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }

  const rowsToWrite = deduped.slice(0, maxWrites);
  const deferred = Math.max(0, deduped.length - rowsToWrite.length);

  if (!selectedTeams.length) {
    return { ok: false, job: input.job || "scrape_players_mlb_api", slate_date: slateDate, status: "no_slate_teams", group, teams_total: teamMap.size, teams_checked: 0, fetched_rows: 0, inserted: { players_current: 0 }, retry_later: true, note: "No slate teams were available. Run SCRAPE > Daily MLB Slate first, then retry this player group." };
  }
  if (!rowsToWrite.length) {
    return { ok: false, job: input.job || "scrape_players_mlb_api", slate_date: slateDate, status: "zero_player_rows", group, teams_total: teamMap.size, teams_checked: selectedTeams.length, fetched_rows: 0, inserted: { players_current: 0 }, retry_later: true, team_fetch_audit, note: "MLB roster calls produced zero rows after retry. Existing players_current was not cleared." };
  }

  const validated = validateRows("players_current", rowsToWrite);
  if (!validated.ok) throw new Error(`MLB player identity validation failed: ${validated.error}`);
  if (group === 1) {
    await env.DB.prepare("DELETE FROM players_current").run();
  }
  const inserted = await upsertRows(env, "players_current", validated.rows);

  return {
    ok: true,
    job: input.job || "scrape_players_mlb_api",
    slate_date: slateDate,
    source: "mlb_statsapi_active_roster_identity_handedness",
    mode: group ? `chunked_group_${group}` : "single_safe_capped",
    group,
    teams_total: teamMap.size,
    teams_checked: selectedTeams.length,
    team_fetch_audit,
    fetched_rows: deduped.length,
    written_rows: inserted,
    deferred_rows: deferred,
    write_cap: maxWrites,
    inserted: { players_current: inserted },
    skipped_count: (validated.skipped?.length || 0) + (protectedFilter.skipped?.length || 0),
    skipped: [...(protectedFilter.skipped || []), ...(validated.skipped || [])].slice(0, 20),
    starter_protection_policy: "v1.2.73 preserves manual/fallback/valid official starters from blank/TBD/unknown API overwrite; valid official API may upgrade fallback rows.",
    complete: deferred === 0
  };
}


async function syncMlbApiRecentUsage(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;
  const previousDate = addDaysISO(slateDate, -1);

  const slateGames = await env.DB.prepare("SELECT game_id, away_team, home_team FROM games WHERE game_date = ? ORDER BY game_id").bind(slateDate).all();
  const slateTeams = [...new Set((slateGames.results || []).flatMap(g => [g.away_team, g.home_team]))];

  const scheduleFetch = await fetchJsonWithRetry(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(previousDate)}`, {}, 3, "mlb_previous_schedule");
  const scheduleJson = scheduleFetch.ok ? (scheduleFetch.data || { dates: [] }) : { dates: [] };

  const previousGames = [];
  for (const d of (scheduleJson.dates || [])) {
    for (const g of (d.games || [])) {
      if (String(g?.status?.abstractGameState || "").toLowerCase() !== "final") continue;
      const away = MLB_TEAM_ABBR[g?.teams?.away?.team?.id];
      const home = MLB_TEAM_ABBR[g?.teams?.home?.team?.id];
      if (!away || !home) continue;
      if (slateTeams.includes(away) || slateTeams.includes(home)) previousGames.push({ gamePk: g.gamePk, away, home });
    }
  }

  const rows = [];
  for (const g of previousGames) {
    const box = await fetchMlbBoxscore(g.gamePk);
    if (!box) continue;

    for (const side of ["away", "home"]) {
      const teamId = side === "away" ? g.away : g.home;
      if (!slateTeams.includes(teamId)) continue;

      const team = box?.teams?.[side];
      const battingOrder = team?.battingOrder || [];
      const slotById = new Map(battingOrder.map((id, idx) => [String(id), idx + 1]));
      const players = Object.values(team?.players || {});

      for (const p of players) {
        const playerId = String(p?.person?.id || "");
        const batting = p?.stats?.batting;
        if (!batting) continue;
        const hasUsage = batting.atBats !== undefined || batting.hits !== undefined || batting.plateAppearances !== undefined;
        if (!hasUsage) continue;

        const row = battingUsageToRecentRow(teamId, p, slotById.get(playerId) || null);
        if (row) rows.push(row);
      }
    }
  }

  const validated = validateRows("player_recent_usage", rows);
  if (!validated.ok) throw new Error(`MLB recent usage validation failed: ${validated.error}`);
  const inserted = await upsertRows(env, "player_recent_usage", validated.rows);

  return {
    ok: true,
    job: input.job || "scrape_recent_usage_mlb_api",
    slate_date: slateDate,
    source: "mlb_statsapi_previous_game_boxscore_usage",
    mode: "previous_day_subrequest_safe",
    teams_checked: slateTeams.length,
    previous_games_checked: previousGames.length,
    fetched_rows: rows.length,
    inserted: { player_recent_usage: inserted },
    write_mode: "existing_schema_no_source_confidence_columns",
    skipped_count: validated.skipped?.length || 0,
    skipped: (validated.skipped || []).slice(0, 20)
  };
}


async function fetchMlbGameLineupRows(gamePk, gameId) {
  const box = await fetchMlbBoxscore(gamePk);
  if (!box) return [];

  const rows = [];
  const sides = [
    { side: "away", teamId: gameId.split("_")[1] },
    { side: "home", teamId: gameId.split("_")[2] }
  ];

  for (const { side, teamId } of sides) {
    const team = box?.teams?.[side];
    const battingOrder = team?.battingOrder || [];
    const players = team?.players || {};

    for (let i = 0; i < battingOrder.length && i < 9; i++) {
      const playerKey = `ID${battingOrder[i]}`;
      const player = players[playerKey];
      const person = player?.person || {};
      rows.push({
        game_id: gameId,
        team_id: teamId,
        slot: i + 1,
        player_name: person.fullName || null,
        bats: player?.battingHand?.code || null,
        k_rate: null,
        is_confirmed: 1,
        source: "mlb_statsapi_boxscore_lineup",
        confidence: "official_or_pregame_boxscore"
      });
    }
  }

  return rows.filter(r => r.player_name);
}

async function syncMlbApiLineups(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;
  const data = await fetchMlbScheduleProbables(slateDate);
  const rows = [];
  let gamesChecked = 0;

  for (const dateBlock of (data.dates || [])) {
    for (const game of (dateBlock.games || [])) {
      const gameId = gameIdFromMlbGame(game, slateDate);
      if (!gameId || !game?.gamePk) continue;
      gamesChecked++;

      const gameRows = await fetchMlbGameLineupRows(game.gamePk, gameId);
      rows.push(...gameRows);
    }
  }

  const validated = validateRows("lineups_current", rows);
  if (!validated.ok) throw new Error(`MLB lineup validation failed: ${validated.error}`);
  const inserted = await upsertRows(env, "lineups_current", validated.rows);

  return {
    ok: true,
    job: input.job || "scrape_lineups_mlb_api",
    status: rows.length > 0 ? "pass" : "no_confirmed_lineups_yet",
    slate_date: slateDate,
    source: "mlb_statsapi_boxscore_lineup",
    games_checked: gamesChecked,
    fetched_rows: rows.length,
    inserted: { lineups_current: inserted },
    retry_later: rows.length === 0,
    note: rows.length > 0 ? "Confirmed/available MLB API lineup rows inserted." : "MLB boxscore batting orders were not posted yet. Scheduled task should retry later after lineups are published.",
    skipped_count: validated.skipped?.length || 0,
    skipped: (validated.skipped || []).slice(0, 20)
  };
}


async function syncMlbApiBullpens(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;
  const previousDate = addDaysISO(slateDate, -1);

  const slateGames = await env.DB.prepare("SELECT game_id, away_team, home_team FROM games WHERE game_date = ? ORDER BY game_id").bind(slateDate).all();
  const slateTeams = [...new Set((slateGames.results || []).flatMap(g => [g.away_team, g.home_team]))];

  const scheduleFetch = await fetchJsonWithRetry(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(previousDate)}`, {}, 3, "mlb_previous_schedule");
  const scheduleJson = scheduleFetch.ok ? (scheduleFetch.data || { dates: [] }) : { dates: [] };

  const previousGames = [];
  for (const d of (scheduleJson.dates || [])) {
    for (const g of (d.games || [])) {
      if (String(g?.status?.abstractGameState || "").toLowerCase() !== "final") continue;
      const away = MLB_TEAM_ABBR[g?.teams?.away?.team?.id];
      const home = MLB_TEAM_ABBR[g?.teams?.home?.team?.id];
      if (!away || !home) continue;
      if (slateTeams.includes(away) || slateTeams.includes(home)) {
        previousGames.push({ gamePk: g.gamePk, away, home });
      }
    }
  }

  const usageByTeam = new Map();
  for (const game of previousGames) {
    const box = await fetchMlbBoxscore(game.gamePk);
    if (!box) continue;

    if (slateTeams.includes(game.away)) {
      const outs = bullpenOutsFromBoxscore(box, "away");
      usageByTeam.set(game.away, {
        last_game_ip: outsToIpDecimal(outs),
        last3_ip: null,
        fatigue: fatigueFromOuts(outs, 0)
      });
    }

    if (slateTeams.includes(game.home)) {
      const outs = bullpenOutsFromBoxscore(box, "home");
      usageByTeam.set(game.home, {
        last_game_ip: outsToIpDecimal(outs),
        last3_ip: null,
        fatigue: fatigueFromOuts(outs, 0)
      });
    }
  }

  const rows = [];
  for (const g of (slateGames.results || [])) {
    for (const teamId of [g.away_team, g.home_team]) {
      const u = usageByTeam.get(teamId) || { last_game_ip: null, last3_ip: null, fatigue: "unknown" };
      rows.push({
        game_id: g.game_id,
        team_id: teamId,
        bullpen_era: null,
        bullpen_whip: null,
        last_game_ip: u.last_game_ip,
        last3_ip: u.last3_ip,
        fatigue: u.fatigue,
        source: "mlb_statsapi_previous_day_boxscore_bullpen_usage",
        confidence: "official_usage_lite"
      });
    }
  }

  const validated = validateRows("bullpens_current", rows);
  if (!validated.ok) throw new Error(`MLB bullpen validation failed: ${validated.error}`);
  const inserted = await upsertRows(env, "bullpens_current", validated.rows);

  return {
    ok: true,
    job: input.job || "scrape_bullpens_mlb_api",
    slate_date: slateDate,
    source: "mlb_statsapi_previous_day_boxscore_bullpen_usage",
    mode: "lite_subrequest_safe",
    fetched_rows: rows.length,
    previous_games_checked: previousGames.length,
    inserted: { bullpens_current: inserted },
    skipped_count: validated.skipped?.length || 0,
    skipped: (validated.skipped || []).slice(0, 20)
  };
}

async function syncMlbApiGamesMarkets(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;
  const data = await fetchMlbScheduleProbables(slateDate);

  const gamesRows = [];
  const marketsRows = [];

  for (const dateBlock of (data.dates || [])) {
    for (const game of (dateBlock.games || [])) {
      const gameId = gameIdFromMlbGame(game, slateDate);
      if (!gameId) continue;

      const away = MLB_TEAM_ABBR[game?.teams?.away?.team?.id];
      const home = MLB_TEAM_ABBR[game?.teams?.home?.team?.id];
      if (!away || !home) continue;

      gamesRows.push({
        game_id: gameId,
        game_date: slateDate,
        away_team: away,
        home_team: home,
        start_time_utc: game.gameDate || null,
        venue: game?.venue?.name || null,
        series_game: null,
        getaway_day: 0,
        status: game?.status?.detailedState || "scheduled"
      });

      marketsRows.push({
        game_id: gameId,
        game_total: null,
        open_total: null,
        current_total: null,
        away_moneyline: null,
        home_moneyline: null,
        away_implied_runs: null,
        home_implied_runs: null,
        runline: null,
        source: "mlb_statsapi_schedule",
        confidence: "official_schedule"
      });
    }
  }

  const gamesValid = validateRows("games", gamesRows);
  if (!gamesValid.ok) throw new Error(`MLB games validation failed: ${gamesValid.error}`);
  const marketsValid = validateRows("markets_current", marketsRows);
  if (!marketsValid.ok) throw new Error(`MLB markets validation failed: ${marketsValid.error}`);

  const insertedGames = await upsertRows(env, "games", gamesValid.rows);
  const insertedMarkets = await upsertRows(env, "markets_current", marketsValid.rows);

  return {
    ok: true,
    job: input.job || "scrape_games_markets",
    prompt: "mlb_statsapi_schedule",
    slate_date: slateDate,
    slate_mode: slate.slate_mode,
    source: "mlb_statsapi_schedule",
    inserted: {
      games: insertedGames,
      markets_current: insertedMarkets
    },
    skipped: {
      games: gamesValid.skipped || [],
      markets_current: marketsValid.skipped || []
    }
  };
}


async function syncMlbApiProbableStarters(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;
  const season = slateDate.slice(0, 4);
  const data = await fetchMlbScheduleProbables(slateDate);
  const rows = [];

  const pitcherIds = [];
  for (const dateBlock of (data.dates || [])) {
    for (const game of (dateBlock.games || [])) {
      const awayPitcher = game?.teams?.away?.probablePitcher || null;
      const homePitcher = game?.teams?.home?.probablePitcher || null;
      if (awayPitcher?.id) pitcherIds.push(Number(awayPitcher.id));
      if (homePitcher?.id) pitcherIds.push(Number(homePitcher.id));
    }
  }

  const statsMap = await fetchMlbPitcherStatsMap(pitcherIds, season);

  for (const dateBlock of (data.dates || [])) {
    for (const game of (dateBlock.games || [])) {
      const gameId = gameIdFromMlbGame(game, slateDate);
      if (!gameId) continue;

      const awayTeam = MLB_TEAM_ABBR[game?.teams?.away?.team?.id];
      const homeTeam = MLB_TEAM_ABBR[game?.teams?.home?.team?.id];

      const awayPitcher = game?.teams?.away?.probablePitcher || null;
      const homePitcher = game?.teams?.home?.probablePitcher || null;

      const awayStats = awayPitcher?.id ? statsMap.get(Number(awayPitcher.id)) : null;
      const homeStats = homePitcher?.id ? statsMap.get(Number(homePitcher.id)) : null;

      const awayRow = apiStarterRow(gameId, awayTeam, awayPitcher, slateDate, awayStats);
      const homeRow = apiStarterRow(gameId, homeTeam, homePitcher, slateDate, homeStats);

      if (awayRow) rows.push(awayRow);
      if (homeRow) rows.push(homeRow);
    }
  }

  let workingRows = rows;
  let groupFilter = null;
  if (input && input.game_group_index !== undefined && input.game_group_index !== null) {
    const groupSize = Math.max(1, Number(input.game_group_size || 5));
    const groupIndex = Math.max(0, Number(input.game_group_index || 0));
    const offset = groupIndex * groupSize;
    const groupResult = await env.DB.prepare(
      "SELECT game_id, away_team, home_team FROM games WHERE game_date = ? ORDER BY game_id ASC LIMIT ? OFFSET ?"
    ).bind(slateDate, groupSize, offset).all();
    const groupGames = groupResult.results || [];
    const allowed = new Set(groupGames.map(g => g.game_id));
    workingRows = rows.filter(r => allowed.has(r.game_id));
    groupFilter = {
      enabled: true,
      group_index: groupIndex,
      group_size: groupSize,
      offset,
      games: groupGames,
      source_rows_before_filter: rows.length,
      source_rows_after_filter: workingRows.length
    };
  }

  await ensureStarterCompatibilityColumns(env).catch(() => null);
  const protectedFilter = await sanitizeStarterRowsForProtectedUpsert(env, workingRows);
  const validated = validateRows("starters_current", protectedFilter.rows);
  if (!validated.ok) throw new Error(`MLB starter validation failed: ${validated.error}`);
  const inserted = await upsertRows(env, "starters_current", validated.rows);

  let missingAfter = [];
  try {
    const missingSql = groupFilter && groupFilter.games && groupFilter.games.length
      ? `
        SELECT g.game_id, g.away_team, g.home_team, COUNT(s.team_id) AS starters_found
        FROM games g
        LEFT JOIN starters_current s ON s.game_id = g.game_id
        WHERE g.game_date = ? AND g.game_id IN (${groupFilter.games.map(() => '?').join(',')})
        GROUP BY g.game_id, g.away_team, g.home_team
        HAVING starters_found < 2
        ORDER BY g.game_id
      `
      : `
        SELECT g.game_id, g.away_team, g.home_team, COUNT(s.team_id) AS starters_found
        FROM games g
        LEFT JOIN starters_current s ON s.game_id = g.game_id
        WHERE g.game_date = ?
        GROUP BY g.game_id, g.away_team, g.home_team
        HAVING starters_found < 2
        ORDER BY g.game_id
      `;
    const binds = groupFilter && groupFilter.games && groupFilter.games.length ? [slateDate, ...groupFilter.games.map(g => g.game_id)] : [slateDate];
    const miss = await env.DB.prepare(missingSql).bind(...binds).all();
    missingAfter = miss.results || [];
  } catch (e) {
    missingAfter = [{ error: String(e?.message || e) }];
  }

  const statsFilled = validated.rows.filter(r =>
    r.era !== null && r.era !== undefined && Number(r.era) > 0 &&
    r.whip !== null && r.whip !== undefined && Number(r.whip) > 0 &&
    r.strikeouts !== null && r.strikeouts !== undefined && Number(r.strikeouts) > 0 &&
    r.innings_pitched !== null && r.innings_pitched !== undefined && Number(r.innings_pitched) > 0
  ).length;

  return {
    ok: true,
    job: input.job || "scrape_starters_mlb_api",
    slate_date: slateDate,
    status: inserted > 0 ? "pass" : (missingAfter.length ? "no_new_probables_missing_remain" : "no_new_rows_already_current"),
    slate_mode: slate.slate_mode,
    source: "mlb_statsapi_schedule_probablePitcher_people_stats",
    mode: groupFilter ? "deterministic_mlb_api_group_sync_no_gemini" : "deterministic_mlb_api_full_sync_no_gemini",
    fetched_rows: workingRows.length,
    source_rows_before_group_filter: rows.length,
    stats_filled: statsFilled,
    stats_missing: validated.rows.length - statsFilled,
    inserted: { starters_current: inserted },
    group_filter: groupFilter,
    missing_starter_games_after: missingAfter,
    note: groupFilter ? "Starter group buttons now use deterministic MLB Stats API data, not Gemini. Zero inserts are not a fake failure; check missing_starter_games_after for truly unresolved official probables." : "Full deterministic MLB Stats API probable starter sync.",
    skipped_count: validated.skipped?.length || 0,
    skipped: (validated.skipped || []).slice(0, 20)
  };
}


function normalizePitcherThrowCode(value){const text=String(value||"").trim().toUpperCase();if(!text)return null;if(text==="R"||text==="RHP"||text.includes("RIGHT"))return"R";if(text==="L"||text==="LHP"||text.includes("LEFT"))return"L";if(text==="S"||text.includes("SWITCH"))return"S";return text.slice(0,1)}
function usableMissingStarterConfidence(value){const c=String(value||"").trim().toLowerCase();return c==="confirmed"||c==="official"||c==="probable"||c==="projected"}
async function missingStarterTargets(env,slateDate){const result=await env.DB.prepare(`SELECT g.game_id,g.away_team,g.home_team,g.start_time_utc,MAX(CASE WHEN s.team_id=g.away_team THEN s.starter_name ELSE NULL END) AS away_starter,MAX(CASE WHEN s.team_id=g.home_team THEN s.starter_name ELSE NULL END) AS home_starter,SUM(CASE WHEN s.team_id=g.away_team THEN 1 ELSE 0 END) AS has_away,SUM(CASE WHEN s.team_id=g.home_team THEN 1 ELSE 0 END) AS has_home,COUNT(s.team_id) AS starters_found FROM games g LEFT JOIN starters_current s ON s.game_id=g.game_id WHERE g.game_date=? GROUP BY g.game_id,g.away_team,g.home_team,g.start_time_utc HAVING starters_found<2 ORDER BY g.start_time_utc,g.game_id`).bind(slateDate).all();const targets=[];for(const g of(result.results||[])){if(!Number(g.has_away||0))targets.push({game_id:g.game_id,away_team:g.away_team,home_team:g.home_team,missing_team:g.away_team,known_team:g.home_team,known_starter:g.home_starter||null,start_time_utc:g.start_time_utc||null});if(!Number(g.has_home||0))targets.push({game_id:g.game_id,away_team:g.away_team,home_team:g.home_team,missing_team:g.home_team,known_team:g.away_team,known_starter:g.away_starter||null,start_time_utc:g.start_time_utc||null})}return targets}
function buildMissingStarterLivePrompt(slateDate,targets){return `You are repairing a deterministic MLB probable-starter database for slate ${slateDate}. Return ONLY valid JSON. No markdown. For each target, use current live MLB probable pitcher context. Prefer official MLB, team pages, reputable previews, Pitcher List, FanGraphs/RosterResource, ESPN, CBS, FOX, Rotowire. Do not invent. If truly TBD/not available, set starter_found=false and leave starter_name/throws empty. Targets: ${JSON.stringify(targets)} Required JSON shape: {"ok":true,"checked_at":"ISO timestamp","games":[{"game_id":"","away_team":"","home_team":"","missing_team":"","starter_found":true,"starter_name":"Full Name","throws":"RHP or LHP or R or L","confidence":"confirmed|official|probable|projected|not_available","source_summary":"short","notes":"short"}],"summary":{"missing_games_checked":0,"starters_found":0,"starters_not_available":0,"should_backend_fill_missing":true}}`}
async function syncMissingStartersLiveFallback(input,env){const slate=resolveSlateDate(input||{});const slateDate=String(input?.slate_date||slate.slate_date);const targets=await missingStarterTargets(env,slateDate);if(!targets.length){return{ok:true,job:"scrape_starters_missing",version:SYSTEM_VERSION,status:"pass_no_missing_starters",slate_date:slateDate,mode:"targeted_live_missing_starter_fallback",missing_games_checked:0,starters_found:0,inserted:{starters_current:0},still_missing_tbd:[],note:"No missing starter team/game pairs were found. No Gemini call made."}}const raw=await callGeminiWithFallback(env,buildMissingStarterLivePrompt(slateDate,targets));const parsed=parseStrictJson(cleanJsonText(raw));const games=Array.isArray(parsed.games)?parsed.games:[];const targetKeys=new Set(targets.map(t=>`${t.game_id}|${t.missing_team}`));const accepted=[];const rejected=[];for(const row of games){const key=`${row.game_id}|${row.missing_team}`;if(!targetKeys.has(key)){rejected.push({game_id:row.game_id||null,missing_team:row.missing_team||null,reason:"not_in_missing_target_list"});continue}const name=String(row.starter_name||"").trim();if(row.starter_found!==true||!name){rejected.push({game_id:row.game_id,missing_team:row.missing_team,reason:"not_available_or_empty",confidence:row.confidence||null,notes:row.notes||null});continue}if(!usableMissingStarterConfidence(row.confidence)){rejected.push({game_id:row.game_id,missing_team:row.missing_team,starter_name:name,reason:"low_or_invalid_confidence",confidence:row.confidence||null});continue}accepted.push({game_id:String(row.game_id),team_id:String(row.missing_team).toUpperCase(),starter_name:name,throws:normalizePitcherThrowCode(row.throws),source:"gemini_live_missing_starter_fallback",data_source:"gemini_live_missing_starter_fallback",confidence:String(row.confidence||"projected").toLowerCase()})}await ensureStarterCompatibilityColumns(env).catch(()=>null);const protectedFilter=await sanitizeStarterRowsForProtectedUpsert(env,accepted);const stmt=env.DB.prepare(`INSERT OR REPLACE INTO starters_current (game_id,team_id,starter_name,throws,era,whip,strikeouts,innings_pitched,walks,hits_allowed,hr_allowed,days_rest,source,data_source,confidence,updated_at) VALUES (?,?,?,?,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,?,?,?,CURRENT_TIMESTAMP)`);let inserted=0;for(const r of protectedFilter.rows){const result=await stmt.bind(r.game_id,r.team_id,r.starter_name,r.throws,r.source,r.data_source||r.source,r.confidence).run();inserted+=Number(result?.meta?.changes||0)}const remainingTargets=await missingStarterTargets(env,slateDate);return{ok:true,job:"scrape_starters_missing",version:SYSTEM_VERSION,status:remainingTargets.length?"partial_missing_tbd_remain":"pass",slate_date:slateDate,mode:"targeted_live_missing_starter_fallback",source:"gemini_live_missing_starter_fallback",requested_targets:targets,missing_games_checked:targets.length,starters_found:accepted.length,starters_inserted:inserted,inserted:{starters_current:inserted},accepted_starters:accepted.map(r=>({game_id:r.game_id,team_id:r.team_id,starter_name:r.starter_name,throws:r.throws,confidence:r.confidence})),rejected_or_tbd:[...rejected,...(protectedFilter?.skipped||[])],still_missing_tbd:remainingTargets,raw_summary:parsed.summary||null,note:"Targeted missing-starter fallback only. Fills probable/projected/confirmed one-sided starters with nullable stats and preserves true TBD as still_missing_tbd. No broad starter rewrite."}}

async function runJob(input, env) {
  const slate = resolveSlateDate(input || {});
  const jobName = input.job || "scrape_games_markets";
  const job = JOBS[jobName];
  if (!job) return { ok: false, error: `Unknown job: ${jobName}`, valid_jobs: Object.keys(JOBS) };

  const taskId = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO task_runs (task_id, job_name, status, started_at, input_json) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`)
    .bind(taskId, jobName, "running", JSON.stringify(input)).run();

  try {
    let basePrompt = await fetchPrompt(env, job.prompt);
    basePrompt = hydratePromptTemplate(basePrompt, slate.slate_date);
    const prompt = await augmentPromptForJob(env, jobName, job, basePrompt, slate.slate_date);
    const raw = await callGeminiWithFallback(env, prompt);
    const clean = cleanJsonText(raw);
    const data = parseStrictJson(clean);
    const results = {};
    const validatedByTable = {};
    const returnedGameIds = new Set();

    for (const table of job.tables) {
      const rows = Array.isArray(data[table]) ? data[table] : [];
      const validated = validateRows(table, rows);
      if (!validated.ok) throw new Error(`${table} validation failed: ${validated.error}`);
      validatedByTable[table] = validated.rows;

      if (table === "games") {
        for (const row of validated.rows) {
          if (row.game_id) returnedGameIds.add(row.game_id);
        }
      }
    }

    for (const table of job.tables) {
      let rows = validatedByTable[table] || [];

      if (table === "markets_current") {
        rows = rows.filter(row => returnedGameIds.has(row.game_id));
      }

      results[table] = await upsertRows(env, table, rows);
    }

    await env.DB.prepare(`UPDATE task_runs SET status=?, finished_at=CURRENT_TIMESTAMP, output_json=? WHERE task_id=?`)
      .bind("success", JSON.stringify(results), taskId).run();
    return { ok: true, task_id: taskId, job: jobName, prompt: job.prompt,
      slate_date: slate.slate_date,
      slate_mode: slate.slate_mode, inserted: results };
  } catch (err) {
    await env.DB.prepare(`UPDATE task_runs SET status=?, finished_at=CURRENT_TIMESTAMP, error=? WHERE task_id=?`)
      .bind("failed", String(err?.message || err), taskId).run();
    return { ok: false, task_id: taskId, job: jobName, error: String(err?.message || err) };
  }
}

async function augmentPromptForJob(env, jobName, job, basePrompt, resolvedSlateDate) {
  const date = resolvedSlateDate || job.gameDate || getPTParts().date;

  if (jobName === "scrape_starters_missing") {
    const result = await env.DB.prepare(`
      SELECT
        g.game_id,
        g.away_team,
        g.home_team,
        CASE WHEN SUM(CASE WHEN s.team_id = g.away_team THEN 1 ELSE 0 END) > 0 THEN 1 ELSE 0 END AS has_away,
        CASE WHEN SUM(CASE WHEN s.team_id = g.home_team THEN 1 ELSE 0 END) > 0 THEN 1 ELSE 0 END AS has_home
      FROM games g
      LEFT JOIN starters_current s ON g.game_id = s.game_id
      WHERE g.game_date = ?
      GROUP BY g.game_id, g.away_team, g.home_team
      HAVING (has_away + has_home) < 2
      ORDER BY g.game_id ASC
    `).bind(date).all();

    const missing = [];
    for (const g of (result.results || [])) {
      if (!g.has_away) missing.push({ game_id: g.game_id, team_id: g.away_team, matchup: `${g.away_team} at ${g.home_team}` });
      if (!g.has_home) missing.push({ game_id: g.game_id, team_id: g.home_team, matchup: `${g.away_team} at ${g.home_team}` });
    }

    if (!missing.length) {
      return `${basePrompt}\n\nRUNTIME MISSING STARTER REPAIR:\nNo missing starters were found in D1 for ${date}. Return exactly {"starters_current":[]}.`;
    }

    const lines = missing.map(m => `- ${m.game_id}: missing ${m.team_id} starter only (${m.matchup})`).join("\n");
    return `${basePrompt}\n\nRUNTIME MISSING STARTER REPAIR:\nReturn starters ONLY for these missing team/game pairs. Do not return already-filled teams.\n${lines}\n\nIf the missing starter is not knowable with real nonzero stats, omit that row. Always return valid JSON.`;
  }

  if (job.gameGroupIndex === undefined || job.gameGroupIndex === null) return basePrompt;

  const size = Number(job.gameGroupSize || 5);
  const offset = Number(job.gameGroupIndex || 0) * size;
  const result = await env.DB.prepare(
    `SELECT game_id, away_team, home_team FROM games WHERE game_date = ? ORDER BY game_id ASC LIMIT ? OFFSET ?`
  ).bind(date, size, offset).all();
  const games = result.results || [];

  if (!games.length) {
    return `${basePrompt}\n\nRUNTIME GAME GROUP FOR ${jobName}:\nNo games were found in D1 for ${date} at this group offset. Return exactly {"starters_current":[]}.`;
  }

  const gameLines = games.map(g => `- ${g.game_id}: ${g.away_team} at ${g.home_team}`).join("\n");
  return `${basePrompt}\n\nRUNTIME GAME GROUP FOR ${jobName}:\nReturn starters ONLY for these games. Do not return any other games.\n${gameLines}\n\nIf a starter is not knowable, omit that starter row. Still return valid JSON.`;
}



async function fetchPrompt(env, filename) {
  if (!filename) throw new Error("Missing prompt filename");
  if (!env.PROMPT_BASE_URL) throw new Error("Missing PROMPT_BASE_URL binding");

  const base = String(env.PROMPT_BASE_URL).replace(/\/+$/, "");
  const url = `${base}/${filename}`;
  const res = await fetch(url, { headers: { "cache-control": "no-cache" } });

  if (!res.ok) {
    throw new Error(`Prompt fetch failed: ${res.status} ${url}`);
  }

  return await res.text();
}

function looksLikePlaceholderStarter(name) {
  const n = String(name || "").trim().toUpperCase();
  if (!n) return true;
  const badExact = new Set(["ACE", "STARTER", "PROBABLE STARTER", "TBD", "TBA", "UNKNOWN", "TEAM ACE", "HOME ACE", "AWAY ACE"]);
  if (badExact.has(n)) return true;
  if (n.endsWith(" ACE")) return true;
  if (n.includes(" UNKNOWN")) return true;
  if (n.includes(" TBD")) return true;
  if (n.includes(" TBA")) return true;
  return false;
}

function validPositiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function hasAllValues(row, keys) {
  return keys.every(k => row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "");
}

function normalizeRow(table, input) {
  const spec = TABLES[table];
  const out = {};
  for (const key of spec.allowed) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      out[key] = input[key];
    }
  }
  return out;
}

function validateRows(table, rows) {
  const spec = TABLES[table];
  if (!spec) return { ok: false, error: `Unknown table ${table}` };

  const canonicalTeams = new Set(["ARI","ATL","BAL","BOS","CHC","CIN","CLE","COL","CWS","DET","HOU","KC","LAA","LAD","MIA","MIL","MIN","NYM","NYY","OAK","PHI","PIT","SD","SEA","SFG","STL","TB","TEX","TOR","WSN"]);
  const forbiddenTeams = new Set(["CHW","KCR","SDP","SF","TBR","WSH"]);
  const clean = [];
  const skipped = [];

  for (let i = 0; i < rows.length; i++) {
    const row = normalizeRow(table, rows[i] || {});

    for (const required of spec.required) {
      if (row[required] === undefined || row[required] === null || String(row[required]).trim() === "") {
        skipped.push({ row: i, reason: `missing required ${required}` });
        continue;
      }
    }

    if (table === "games") {
      if (!row.game_id || !row.game_date || !String(row.game_id).startsWith(`${row.game_date}_`)) {
        skipped.push({ row: i, reason: `game_id/date mismatch ${row.game_id}/${row.game_date}` });
        continue;
      }
      if (!canonicalTeams.has(row.away_team) || !canonicalTeams.has(row.home_team) || forbiddenTeams.has(row.away_team) || forbiddenTeams.has(row.home_team)) {
        skipped.push({ row: i, reason: `non-canonical team in game ${row.game_id}` });
        continue;
      }
    }

    if (table === "markets_current") {
      if (!row.game_id) {
        skipped.push({ row: i, reason: "market missing game_id" });
        continue;
      }
    }

    if (table === "starters_current") {
      if (!canonicalTeams.has(row.team_id) || forbiddenTeams.has(row.team_id)) {
        skipped.push({ row: i, reason: `non-canonical starter team ${row.team_id}` });
        continue;
      }

      const isOfficialMlbApiStarter = String(row.source || "") === "mlb_statsapi_probable_pitcher";

      if (!isOfficialMlbApiStarter) {
        if (!hasAllValues(row, ["era", "whip", "strikeouts", "innings_pitched"])) {
          skipped.push({ row: i, reason: `starter missing core stats rejected ${row.game_id}/${row.team_id}` });
          continue;
        }

        if (!validPositiveNumber(row.era) || !validPositiveNumber(row.whip) || !validPositiveNumber(row.strikeouts) || !validPositiveNumber(row.innings_pitched)) {
          skipped.push({ row: i, reason: `starter zero/invalid core stats rejected ${row.game_id}/${row.team_id}` });
          continue;
        }
      }

      const stalePairs = new Map([
        ["Justin Verlander", new Set(["HOU", "NYM"])],
        ["Chris Sale", new Set(["BOS", "CHW"])],
        ["Corbin Burnes", new Set(["MIL"])],
        ["Clayton Kershaw", new Set(["LAD"])],
        ["Max Scherzer", new Set(["NYM", "TEX", "WSN"])],
        ["Zack Greinke", new Set(["KC", "HOU", "ARI", "LAD"])]
      ]);

      const fictionalStarterNames = new Set([
        "Ethan Miller", "Liam Johnson", "Miguel Rodriguez", "David Chen", "Sophia Lee",
        "Noah Williams", "Olivia Davis", "Lucas Garcia", "Daniel Kim", "Chloe Brown",
        "Noah Davis", "Olivia White", "William Brown", "Sophia Green", "Isabella King",
        "James Taylor", "Emily Chen", "Michael Lee"
      ]);

      if (fictionalStarterNames.has(String(row.starter_name || "").trim())) {
        skipped.push({ row: i, reason: `fictional/generated starter name rejected ${row.game_id}/${row.team_id}/${row.starter_name}` });
        continue;
      }

      const blockedTeams = stalePairs.get(String(row.starter_name || "").trim());
      if (blockedTeams && blockedTeams.has(row.team_id)) {
        skipped.push({ row: i, reason: `stale roster pair rejected ${row.game_id}/${row.team_id}/${row.starter_name}` });
        continue;
      }

      if (looksLikePlaceholderStarter(row.starter_name)) {
        skipped.push({ row: i, reason: `placeholder starter rejected ${row.game_id}/${row.team_id}/${row.starter_name}` });
        continue;
      }
    }

    clean.push(row);
  }

  return { ok: true, rows: clean, skipped };
}

async function upsertRows(env, table, rows) {
  if (!rows.length) return 0;
  const spec = TABLES[table];
  let inserted = 0;

  if (table === "starters_current") await ensureStarterCompatibilityColumns(env).catch(() => null);

  for (const row of rows) {
    if (table === "starters_current") {
      if (!row.data_source && row.source) row.data_source = row.source;
      if (!row.source && row.data_source) row.source = row.data_source;
    }
    const cols = Object.keys(row).filter(c => spec.allowed.includes(c));
    if (!cols.length) continue;

    const placeholders = cols.map(() => "?").join(", ");
    const values = cols.map(c => row[c]);

    if (spec.deleteInsert) {
      const whereSql = spec.conflict.map(c => `${c} = ?`).join(" AND ");
      const whereVals = spec.conflict.map(c => row[c]);
      await env.DB.prepare(`DELETE FROM ${table} WHERE ${whereSql}`).bind(...whereVals).run();
      await env.DB.prepare(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`).bind(...values).run();
      inserted++;
      continue;
    }

    const conflict = spec.conflict.join(", ");
    const updateCols = cols.filter(c => !spec.conflict.includes(c));
    const updateSql = updateCols.length
      ? updateCols.map(c => `${c}=excluded.${c}`).join(", ")
      : `${spec.conflict[0]}=excluded.${spec.conflict[0]}`;

    const sql = `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders}) ON CONFLICT(${conflict}) DO UPDATE SET ${updateSql}`;

    await env.DB.prepare(sql).bind(...values).run();
    inserted++;
  }

  return inserted;
}


function normalizeSleeperVideoLeg(row) {
  const marketRaw = String(row?.market || row?.Market || row?.prop_type || "").trim().toUpperCase();
  let market = marketRaw;
  if (marketRaw.includes("1ST") || marketRaw.includes("INNING") || marketRaw === "RFI") market = "RFI";
  if (marketRaw === "RBI" || marketRaw.includes("RUN BATTED")) market = "RBI";
  const typeRaw = String(row?.type || row?.Type || "").trim().toLowerCase();
  let type = typeRaw.includes("more") && !typeRaw.includes("less") ? "more only" : (typeRaw.includes("regular") || typeRaw.includes("less") ? "regular" : typeRaw || null);
  const lineNumber = Number(row?.line ?? row?.Line ?? row?.line_number ?? NaN);
  return {
    player_name: String(row?.player_name || row?.player || row?.Player || "").trim(),
    team: String(row?.team || row?.Team || "").trim().toUpperCase(),
    opponent: String(row?.opponent || row?.Opponent || "").trim().toUpperCase(),
    date: String(row?.date || row?.Date || row?.time || "").trim(),
    market,
    line: Number.isFinite(lineNumber) ? lineNumber : null,
    type,
    raw_text: String(row?.raw_text || row?.raw_fragment || "").trim() || null
  };
}

function sleeperLineText(leg) {
  const bits = [leg.player_name, leg.team, leg.opponent, leg.date, leg.market, leg.line == null ? "" : String(leg.line), leg.type];
  return bits.map(v => String(v || "").trim()).join(" - ");
}

function buildSleeperVideoPrompt() {
  return `Watch this baseball betting app recording. The user will be scrolling through player cards in two categories: RFI (Runs First Inning) and RBI (Runs Batted In).

Extract all unique player cards visible in the video. Read every card independently. Do not rely only on a page header, because headers may scroll out of view.

Return JSON only.

Required card rules:
1. Market: Identify by reading the text inside or directly below the line number on each individual card. If it says "1st INNING RUNS ALLOWED", market is "RFI". If it says "RBI", market is "RBI".
2. Line: Read the exact number shown for that card. Do not guess 0.5. RBI can be 0.5 or 1.5. RFI is usually 0.5, but still read what is displayed.
3. Team: Use the small clear 3-letter abbreviation shown on the card, for example HOU or BAL. Ignore large stylized background graphics/text behind player photos; never read background art as the team. If background art looks like garbage text such as "Pew i On", ignore it.
4. Opponent: Use the opponent abbreviation shown near the team/date area. Look for date/time strings near the opponent abbreviation; RFI and RBI cards may place date/time in different spots.
5. Date: Read any date/time string near the opponent abbreviation, for example "Thu 9:35am".
6. Type: Output "regular" if a LESS button is visible below the line. Output "more only" if there is no LESS button visible.
7. Layout: Search the whole frame/video. Do not assume a four-box grid, one column, two columns, or any fixed layout.
8. Deduplicate: If the same player/team/opponent/date/market/line/type card appears multiple times while scrolling, return it once.
9. Do not invent missing fields. Use null when not visible.

Return this exact JSON shape:
{
  "ok": true,
  "parser": "SLEEPER_VIDEO_RBI_RFI_V2_FILE_API",
  "video_summary": "short summary",
  "legs": [
    {
      "player_name": "string",
      "team": "AAA",
      "opponent": "BBB",
      "date": "string",
      "market": "RFI_or_RBI",
      "line": 0.5,
      "type": "regular_or_more only",
      "raw_text": "short literal text seen on card or null"
    }
  ],
  "warnings": [],
  "uncertain_cards": []
}

Also ensure each leg can be rendered in this exact format:
Player Name - Team - Opponent - Date - Market - Line - Type`;
}

async function startGeminiResumableUpload(env, { displayName, mimeType, sizeBytes }) {
  if (!env.GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY secret");
  const startUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${env.GEMINI_API_KEY}`;
  const res = await fetch(startUrl, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(sizeBytes || 0),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ file: { display_name: displayName || "sleeper_video" } })
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Gemini upload start failed ${res.status}: ${text.slice(0, 1200)}`);
  const uploadUrl = res.headers.get("x-goog-upload-url") || res.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) throw new Error("Gemini upload start did not return x-goog-upload-url");
  return uploadUrl;
}

async function uploadGeminiFileResumable(env, { fileBlob, displayName, mimeType }) {
  if (!fileBlob || typeof fileBlob.size !== "number") throw new Error("Missing video Blob");
  const uploadUrl = await startGeminiResumableUpload(env, { displayName, mimeType, sizeBytes: fileBlob.size });
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(fileBlob.size),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
      "Content-Type": mimeType
    },
    body: fileBlob
  });
  const data = await res.json().catch(async () => ({ raw_text: await res.text().catch(() => "") }));
  if (!res.ok) throw new Error(`Gemini upload finalize failed ${res.status}: ${JSON.stringify(data).slice(0, 1200)}`);
  return data.file || data;
}

async function getGeminiFile(env, fileName) {
  if (!env.GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY secret");
  const cleanName = String(fileName || "").replace(/^\/+/, "");
  if (!cleanName) throw new Error("Missing Gemini file name");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${cleanName}?key=${env.GEMINI_API_KEY}`);
  const data = await res.json().catch(async () => ({ raw_text: await res.text().catch(() => "") }));
  if (!res.ok) throw new Error(`Gemini file status failed ${res.status}: ${JSON.stringify(data).slice(0, 1200)}`);
  return data.file || data;
}

function summarizeGeminiGenerateResponse(data) {
  const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
  return {
    has_candidates: candidates.length > 0,
    candidate_count: candidates.length,
    finish_reasons: candidates.map(c => c?.finishReason || null),
    safety_ratings: candidates.map(c => c?.safetyRatings || null),
    prompt_feedback: data?.promptFeedback || null,
    usage_metadata: data?.usageMetadata || null,
    response_keys: data && typeof data === "object" ? Object.keys(data) : []
  };
}

function extractGeminiTextParts(data) {
  const out = [];
  const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
  for (const c of candidates) {
    const parts = Array.isArray(c?.content?.parts) ? c.content.parts : [];
    for (const part of parts) {
      if (typeof part?.text === "string" && part.text.trim()) out.push(part.text);
    }
  }
  return out.join("\n").trim();
}

function geminiSafetySettingsBlockNone() {
  return [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
  ];
}

async function callGeminiVideoFromFile(env, { model, prompt, mimeType, fileUri }) {
  if (!env.GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY secret");
  const chosenModel = String(env.SLEEPER_VIDEO_GEMINI_MODEL || model || SLEEPER_VIDEO_MODEL);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${env.GEMINI_API_KEY}`;

  async function runGenerate({ responseMimeType, attemptLabel }) {
    const body = {
      contents: [{
        role: "user",
        parts: [
          { file_data: { mime_type: mimeType, file_uri: fileUri } },
          { text: prompt }
        ]
      }],
      safetySettings: geminiSafetySettingsBlockNone(),
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        maxOutputTokens: 4096
      }
    };
    if (responseMimeType) body.generationConfig.responseMimeType = responseMimeType;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(async () => ({ raw_text: await res.text().catch(() => "") }));
    if (!res.ok) throw new Error(JSON.stringify({ error_type: "GEMINI_GENERATE_HTTP_ERROR", attempt: attemptLabel, status: res.status, response: data }));
    const rawText = extractGeminiTextParts(data);
    return { model: chosenModel, raw_text: rawText, raw_response: data, response_summary: summarizeGeminiGenerateResponse(data), attempt: attemptLabel };
  }

  const first = await runGenerate({ responseMimeType: "application/json", attemptLabel: "json_mime" });
  if (first.raw_text) return first;

  const second = await runGenerate({ responseMimeType: null, attemptLabel: "plain_text_fallback" });
  if (second.raw_text) {
    second.first_empty_response_summary = first.response_summary;
    return second;
  }

  throw new Error(JSON.stringify({
    error_type: "GEMINI_EMPTY_TEXT_RESPONSE",
    model: chosenModel,
    mime_type: mimeType,
    file_uri: fileUri,
    first_attempt: first.response_summary,
    second_attempt: second.response_summary,
    first_raw_response_preview: JSON.stringify(first.raw_response || {}).slice(0, 3000),
    second_raw_response_preview: JSON.stringify(second.raw_response || {}).slice(0, 3000)
  }));
}

async function callGeminiVideoInline(env, { model, prompt, mimeType, base64Data }) {
  if (!env.GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY secret");
  const chosenModel = String(env.SLEEPER_VIDEO_GEMINI_MODEL || model || SLEEPER_VIDEO_MODEL);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { inline_data: { mime_type: mimeType, data: base64Data } },
          { text: prompt }
        ]
      }],
      safetySettings: geminiSafetySettingsBlockNone(),
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        maxOutputTokens: 4096,
        responseMimeType: "application/json"
      }
    })
  });
  const data = await res.json().catch(async () => ({ raw_text: await res.text().catch(() => "") }));
  if (!res.ok) throw new Error(JSON.stringify(data));
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("\n") || JSON.stringify(data);
  return { model: chosenModel, raw_text: text, raw_response: data };
}

function normalizeGeminiFileState(file) {
  return String(file?.state || file?.state?.name || "UNKNOWN").toUpperCase();
}


async function ensureSleeperBoardTables(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sleeper_rbi_rfi_board (sleeper_leg_id TEXT PRIMARY KEY, slate_date TEXT NOT NULL, player_name TEXT NOT NULL, team TEXT NOT NULL, opponent TEXT, opponent_team TEXT, venue_indicator TEXT, date_label TEXT, market TEXT NOT NULL, original_line_score REAL, normalized_line_score REAL DEFAULT 0.5, entry_type TEXT DEFAULT 'regular', target_side TEXT, source_label TEXT DEFAULT 'sleeper_text', raw_line TEXT, validation_status TEXT DEFAULT 'parsed', is_current INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
 await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_sleeper_board_slate_market ON sleeper_rbi_rfi_board (slate_date, market, is_current)`).run();
 await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_sleeper_board_player ON sleeper_rbi_rfi_board (player_name, team, slate_date)`).run();
}
function simpleHashText(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')}
function normSleeperTeam(v){return String(v||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'')}
function parseSleeperOpp(raw){const s=String(raw||'').trim();const m=s.match(/^(@|vs\.?|VS.?)\s+(.+)$/i);if(m)return{opponent:s,venue_indicator:m[1].toLowerCase().startsWith('vs')?'vs':'@',opponent_team:normSleeperTeam(m[2])};return{opponent:s,venue_indicator:'',opponent_team:normSleeperTeam(s)}}
function parseSleeperTextBoard(rawText,slateDate,sourceLabel){const lines=String(rawText||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const rows=[],errors=[],seen=new Set();let n=0;for(const rawLine of lines){n++;const parts=rawLine.split(/\s+-\s+/).map(x=>x.trim());if(parts.length<7){errors.push({line_no:n,raw_line:rawLine,error:'expected_7_fields'});continue}const player_name=parts.slice(0,parts.length-6).join(' - ').trim()||parts[0];const tail=parts.slice(-6);const team=normSleeperTeam(tail[0]);const opp=parseSleeperOpp(tail[1]);const date_label=tail[2];const market=String(tail[3]||'').trim().toUpperCase();const original_line_score=Number(String(tail[4]||'').replace(/[^0-9.\-]/g,''));const entry_type=String(tail[5]||'').trim().toLowerCase().replace(/\s+/g,' ')||'regular';const flags=[];if(!player_name)flags.push('MISSING_PLAYER');if(!team)flags.push('MISSING_TEAM');if(!['RBI','RFI'].includes(market))flags.push('UNSUPPORTED_MARKET');if(!Number.isFinite(original_line_score))flags.push('MISSING_LINE');const normalized_line_score=0.5;const target_side=market==='RBI'?'UNDER_0_5_RBI':market==='RFI'?'NRFI_UNDER_0_5_FIRST_INNING':null;const key=[slateDate,player_name,team,opp.opponent_team,date_label,market,normalized_line_score,entry_type].join('|').toLowerCase();const sleeper_leg_id='sleeper|'+slateDate+'|'+simpleHashText(key);if(seen.has(sleeper_leg_id))continue;seen.add(sleeper_leg_id);rows.push({sleeper_leg_id,slate_date:slateDate,player_name,team,opponent:opp.opponent,opponent_team:opp.opponent_team,venue_indicator:opp.venue_indicator,date_label,market,line_score:Number.isFinite(original_line_score)?original_line_score:null,original_line_score:Number.isFinite(original_line_score)?original_line_score:null,normalized_line_score,entry_type,target_side,source_label:sourceLabel||'sleeper_text',raw_line:rawLine,validation_status:flags.length?'needs_review':'parsed',validation_flags:flags})}const counts=rows.reduce((a,r)=>{a[r.market]=(a[r.market]||0)+1;return a},{});return{rows,errors,counts,line_count:lines.length}}
async function handleSleeperTextParse(request,env){if(!isAuthorized(request,env))return unauthorized();const input=await safeJson(request);const slateDate=String(input.slate_date||'').trim()||getPTParts().date;const parsed=parseSleeperTextBoard(input.raw_text||'',slateDate,String(input.source_label||'sleeper_text'));return json({ok:true,data_ok:parsed.rows.length>0,version:SYSTEM_VERSION,job:'sleeper_text_parse',slate_date:slateDate,parsed_count:parsed.rows.length,saved_count:0,counts:parsed.counts,errors:parsed.errors,rows:parsed.rows,note:'Parse preview only. No database writes.'})}
async function handleSleeperTextSave(request,env){if(!isAuthorized(request,env))return unauthorized();const input=await safeJson(request);const slateDate=String(input.slate_date||'').trim()||getPTParts().date;const sourceLabel=String(input.source_label||'sleeper_text');const replaceSlate=!!input.replace_slate;const parsed=parseSleeperTextBoard(input.raw_text||'',slateDate,sourceLabel);await ensureSleeperBoardTables(env);if(replaceSlate)await env.DB.prepare(`UPDATE sleeper_rbi_rfi_board SET is_current=0, updated_at=CURRENT_TIMESTAMP WHERE slate_date=? AND market IN ('RBI','RFI')`).bind(slateDate).run();let saved=0;const stmts=[];for(const r of parsed.rows){stmts.push(env.DB.prepare(`INSERT INTO sleeper_rbi_rfi_board (sleeper_leg_id,slate_date,player_name,team,opponent,opponent_team,venue_indicator,date_label,market,original_line_score,normalized_line_score,entry_type,target_side,source_label,raw_line,validation_status,is_current,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(sleeper_leg_id) DO UPDATE SET player_name=excluded.player_name,team=excluded.team,opponent=excluded.opponent,opponent_team=excluded.opponent_team,venue_indicator=excluded.venue_indicator,date_label=excluded.date_label,market=excluded.market,original_line_score=excluded.original_line_score,normalized_line_score=excluded.normalized_line_score,entry_type=excluded.entry_type,target_side=excluded.target_side,source_label=excluded.source_label,raw_line=excluded.raw_line,validation_status=excluded.validation_status,is_current=1,updated_at=CURRENT_TIMESTAMP`).bind(r.sleeper_leg_id,r.slate_date,r.player_name,r.team,r.opponent,r.opponent_team,r.venue_indicator,r.date_label,r.market,r.original_line_score,r.normalized_line_score,r.entry_type,r.target_side,r.source_label,r.raw_line,r.validation_status))}for(let i=0;i<stmts.length;i+=40){const chunk=stmts.slice(i,i+40);if(chunk.length){const res=await env.DB.batch(chunk);saved+=res.length}}const check=await sleeperTextCounts(env,slateDate);const board=saved>0?await runSleeperRbiRfiMarketBoard({job:'run_sleeper_rbi_rfi_market_board',slate_date:slateDate,trigger:'sleeper_text_save_auto'},env):{ok:false,status:'skipped_no_saved_rows'};const scoring=saved>0?await runMlbScoringV1({job:'run_mlb_scoring_v1',slate_date:slateDate,trigger:'auto_after_sleeper_text_save'},env):{ok:false,status:'skipped_no_saved_rows'};return json({ok:true,data_ok:saved>0,version:SYSTEM_VERSION,job:'sleeper_text_save',slate_date:slateDate,replace_slate:replaceSlate,parsed_count:parsed.rows.length,saved_count:saved,counts:parsed.counts,db_counts:check.counts,errors:parsed.errors,rows:parsed.rows,auto_market_board:board,auto_scoring:scoring,note:'Saved Sleeper RBI/RFI board rows. Sleeper board signal and full Scoring V1 update were triggered automatically. Freshness is audit-only; no score penalty.'})}
async function sleeperTextCounts(env,slateDate){await ensureSleeperBoardTables(env);const res=await env.DB.prepare(`SELECT market, COUNT(*) AS rows_count FROM sleeper_rbi_rfi_board WHERE slate_date=? AND is_current=1 GROUP BY market ORDER BY market`).bind(slateDate).all();const counts={};for(const r of res.results||[])counts[r.market]=r.rows_count;const recent=await env.DB.prepare(`SELECT sleeper_leg_id,player_name,team,opponent,date_label,market,original_line_score,normalized_line_score,entry_type,target_side,source_label,updated_at FROM sleeper_rbi_rfi_board WHERE slate_date=? AND is_current=1 ORDER BY market,player_name LIMIT 50`).bind(slateDate).all();return{counts,recent:recent.results||[]}}
async function handleSleeperTextCheck(request,env){if(!isAuthorized(request,env))return unauthorized();const url=new URL(request.url);const slateDate=url.searchParams.get('slate_date')||getPTParts().date;const out=await sleeperTextCounts(env,slateDate);return json({ok:true,data_ok:true,version:SYSTEM_VERSION,job:'sleeper_text_check',slate_date:slateDate,counts:out.counts,recent:out.recent})}

async function ensureSleeperMarketSignalTables(env) {
  await ensureSleeperBoardTables(env);
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sleeper_rbi_rfi_market_signals (
    signal_id TEXT PRIMARY KEY,
    slate_date TEXT NOT NULL,
    sleeper_leg_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    team TEXT NOT NULL,
    opponent TEXT,
    opponent_team TEXT,
    venue_indicator TEXT,
    date_label TEXT,
    market TEXT NOT NULL,
    normalized_line_score REAL DEFAULT 0.5,
    entry_type TEXT DEFAULT 'regular',
    target_side TEXT,
    source_label TEXT DEFAULT 'sleeper_board',
    signal_status TEXT NOT NULL,
    usable_for_under INTEGER DEFAULT 0,
    signal_score REAL,
    validation_flags_json TEXT DEFAULT '[]',
    raw_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_sleeper_market_signals_slate_market ON sleeper_rbi_rfi_market_signals (slate_date, market, signal_status)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_sleeper_market_signals_leg ON sleeper_rbi_rfi_market_signals (sleeper_leg_id)`).run();
}

function sleeperSignalStatusForRow(row) {
  const flags = [];
  const market = String(row.market || '').toUpperCase();
  const entryType = String(row.entry_type || 'regular').toLowerCase();
  if (!['RBI', 'RFI'].includes(market)) flags.push('UNSUPPORTED_MARKET');
  const usableForUnder = entryType === 'regular';
  if (!usableForUnder) flags.push('MORE_ONLY_NO_UNDER_AVAILABLE');
  const signalStatus = flags.includes('UNSUPPORTED_MARKET') ? 'REJECT_UNSUPPORTED_MARKET' : (usableForUnder ? 'CERTIFIED_BOARD_PRESENT' : 'REJECT_MORE_ONLY');
  const targetSide = market === 'RBI' ? 'UNDER_0_5_RBI' : market === 'RFI' ? 'NRFI_UNDER_0_5_FIRST_INNING' : null;
  return { signalStatus, usableForUnder, flags, targetSide, signalScore: usableForUnder ? 10.0 : 0.0 };
}

async function runSleeperRbiRfiMarketBoard(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = String((input || {}).slate_date || slate.slate_date || getPTParts().date);
  await ensureSleeperMarketSignalTables(env);
  const sourceRows = await env.DB.prepare(`SELECT * FROM sleeper_rbi_rfi_board WHERE slate_date=? AND is_current=1 AND market IN ('RBI','RFI') ORDER BY market, player_name, sleeper_leg_id`).bind(slateDate).all();
  const rows = sourceRows.results || [];
  let saved = 0;
  const counts = { RBI: 0, RFI: 0 };
  const status_counts = {};
  const stmts = [];
  for (const r of rows) {
    const sig = sleeperSignalStatusForRow(r);
    counts[r.market] = (counts[r.market] || 0) + 1;
    status_counts[sig.signalStatus] = (status_counts[sig.signalStatus] || 0) + 1;
    const signalId = `sleeper_market|${slateDate}|${simpleHashText(String(r.sleeper_leg_id || '') + '|' + String(r.market || ''))}`;
    const rawJson = JSON.stringify({ source: 'sleeper_rbi_rfi_board', rule: 'board_presence_signal_only_no_external_odds_no_gemini', sleeper_leg_id: r.sleeper_leg_id, player_name: r.player_name, team: r.team, opponent: r.opponent, market: r.market, normalized_line_score: 0.5, entry_type: r.entry_type, target_side: sig.targetSide, validation_flags: sig.flags });
    stmts.push(env.DB.prepare(`INSERT INTO sleeper_rbi_rfi_market_signals (signal_id,slate_date,sleeper_leg_id,player_name,team,opponent,opponent_team,venue_indicator,date_label,market,normalized_line_score,entry_type,target_side,source_label,signal_status,usable_for_under,signal_score,validation_flags_json,raw_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,0.5,?,?,'sleeper_board',?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(signal_id) DO UPDATE SET player_name=excluded.player_name,team=excluded.team,opponent=excluded.opponent,opponent_team=excluded.opponent_team,venue_indicator=excluded.venue_indicator,date_label=excluded.date_label,market=excluded.market,normalized_line_score=excluded.normalized_line_score,entry_type=excluded.entry_type,target_side=excluded.target_side,source_label=excluded.source_label,signal_status=excluded.signal_status,usable_for_under=excluded.usable_for_under,signal_score=excluded.signal_score,validation_flags_json=excluded.validation_flags_json,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP`).bind(signalId,slateDate,r.sleeper_leg_id,r.player_name,r.team,r.opponent,r.opponent_team,r.venue_indicator,r.date_label,r.market,r.entry_type||'regular',sig.targetSide,sig.signalStatus,sig.usableForUnder?1:0,sig.signalScore,JSON.stringify(sig.flags),rawJson));
  }
  for (let i = 0; i < stmts.length; i += 40) {
    const chunk = stmts.slice(i, i + 40);
    if (chunk.length) { const res = await env.DB.batch(chunk); saved += res.length; }
  }
  const check = await checkSleeperRbiRfiMarketBoard({ slate_date: slateDate, job: 'check_sleeper_rbi_rfi_market_board' }, env);
  return { ok: true, data_ok: rows.length > 0 && saved > 0, version: SYSTEM_VERSION, job: input.job || 'run_sleeper_rbi_rfi_market_board', slate_date: slateDate, mode: 'sleeper_board_presence_signal_only', source_rows: rows.length, saved_signals: saved, counts, status_counts, check, note: 'Uses Sleeper board rows only. No full-slate Gemini scrape, no external odds, no final scoring.' };
}

async function checkSleeperRbiRfiMarketBoard(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = String((input || {}).slate_date || slate.slate_date || getPTParts().date);
  await ensureSleeperMarketSignalTables(env);
  const sourceCountsRes = await env.DB.prepare(`SELECT market, COUNT(*) AS rows_count FROM sleeper_rbi_rfi_board WHERE slate_date=? AND is_current=1 AND market IN ('RBI','RFI') GROUP BY market ORDER BY market`).bind(slateDate).all();
  const signalCountsRes = await env.DB.prepare(`SELECT market, signal_status, COUNT(*) AS rows_count FROM sleeper_rbi_rfi_market_signals WHERE slate_date=? GROUP BY market, signal_status ORDER BY market, signal_status`).bind(slateDate).all();
  const usableRes = await env.DB.prepare(`SELECT market, COUNT(*) AS usable_rows FROM sleeper_rbi_rfi_market_signals WHERE slate_date=? AND signal_status='CERTIFIED_BOARD_PRESENT' AND usable_for_under=1 GROUP BY market ORDER BY market`).bind(slateDate).all();
  const sampleRes = await env.DB.prepare(`SELECT player_name,team,opponent,date_label,market,normalized_line_score,entry_type,target_side,signal_status,usable_for_under,updated_at FROM sleeper_rbi_rfi_market_signals WHERE slate_date=? ORDER BY market, signal_status, player_name LIMIT 50`).bind(slateDate).all();
  const source_counts = {};
  for (const r of sourceCountsRes.results || []) source_counts[r.market] = r.rows_count;
  const usable_counts = {};
  for (const r of usableRes.results || []) usable_counts[r.market] = r.usable_rows;
  const total_signals = (signalCountsRes.results || []).reduce((a, r) => a + Number(r.rows_count || 0), 0);
  return { ok: true, data_ok: total_signals > 0, version: SYSTEM_VERSION, job: input.job || 'check_sleeper_rbi_rfi_market_board', slate_date: slateDate, source_counts, signal_counts: signalCountsRes.results || [], usable_counts, total_signals, sample: sampleRes.results || [], next_action: total_signals > 0 ? 'Sleeper RBI/RFI board signal table is ready for downstream RBI/RFI jobs.' : 'Run SLEEPER RBI/RFI > Run Board Signal after ingesting Sleeper text board.', note: 'CERTIFIED_BOARD_PRESENT means the row exists on the Sleeper board and is regular/under-capable. REJECT_MORE_ONLY rows are retained but not usable for under-only targets.' };
}


function parseSleeperDateLabelMinutes(dateLabel) {
  const txt = String(dateLabel || '').trim();
  const m = txt.match(/(\d{1,2})\s*:\s*(\d{2})\s*(am|pm)/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = String(m[3]).toLowerCase();
  if (ap === 'pm' && h !== 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  return h * 60 + min;
}
function sleeperWindowNameFromMinutes(minutes) {
  if (minutes == null) return 'UNKNOWN';
  if (minutes < SLEEPER_RBI_RFI_WINDOW_SPLIT_MINUTES) return 'MORNING';
  return 'EARLY_AFTERNOON';
}
function sleeperEligibilityForWindow(row, slateDate, windowName, now = new Date()) {
  const pt = getPTParts(now);
  const nowMinutes = (() => { const a = String(pt.time || '00:00:00').split(':').map(Number); return (a[0] || 0) * 60 + (a[1] || 0); })();
  const startMinutes = parseSleeperDateLabelMinutes(row.date_label);
  const parsedWindow = sleeperWindowNameFromMinutes(startMinutes);
  const flags = [];
  const normalizedWindow = String(windowName || 'MORNING').toUpperCase();
  const morningDebugAll = normalizedWindow === 'MORNING' && SLEEPER_RBI_RFI_MORNING_DEBUG_ALL_WINDOWS === true;
  let status = 'ELIGIBLE';
  if (String(row.signal_status || '') !== 'CERTIFIED_BOARD_PRESENT' || Number(row.usable_for_under || 0) !== 1) { status = 'REJECT_NOT_USABLE'; flags.push('NOT_CERTIFIED_OR_NOT_USABLE'); }
  if (String(row.entry_type || '').toLowerCase() === 'more only') { status = 'REJECT_MORE_ONLY'; flags.push('MORE_ONLY_NOT_UNDER_CAPABLE'); }
  if (!morningDebugAll && parsedWindow !== normalizedWindow) { status = 'SKIPPED_OTHER_WINDOW'; flags.push('OUTSIDE_' + normalizedWindow); }
  if (morningDebugAll) flags.push('MORNING_DEBUG_ALL_WINDOWS_ENABLED');
  if (startMinutes == null) { status = 'SKIPPED_NO_START_TIME'; flags.push('NO_PARSEABLE_START_TIME'); }
  if (slateDate < pt.date) { status = 'SKIPPED_STARTED'; flags.push('SLATE_DATE_BEFORE_TODAY'); }
  if (slateDate === pt.date && startMinutes != null) {
    if (startMinutes <= nowMinutes) { status = 'SKIPPED_STARTED'; flags.push('ALREADY_STARTED'); }
    else if (startMinutes <= nowMinutes + 15) { status = 'SKIPPED_TOO_CLOSE'; flags.push('STARTS_WITHIN_15_MINUTES'); }
  }
  return { status, flags, start_minutes: startMinutes, window_name: parsedWindow, now_pt_date: pt.date, now_pt_time: pt.time, split_minutes: SLEEPER_RBI_RFI_WINDOW_SPLIT_MINUTES, morning_debug_all_windows: morningDebugAll };
}
async function ensureSleeperWindowTables(env) {
  await ensureSleeperMarketSignalTables(env);
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sleeper_rbi_rfi_window_results (
    window_result_id TEXT PRIMARY KEY,
    slate_date TEXT NOT NULL,
    window_name TEXT NOT NULL,
    signal_id TEXT NOT NULL,
    sleeper_leg_id TEXT,
    player_name TEXT,
    team TEXT,
    opponent TEXT,
    date_label TEXT,
    market TEXT,
    normalized_line_score REAL DEFAULT 0.5,
    target_side TEXT,
    entry_type TEXT,
    eligibility_status TEXT NOT NULL,
    usable_for_window INTEGER DEFAULT 0,
    start_minutes INTEGER,
    validation_flags_json TEXT DEFAULT '[]',
    raw_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_sleeper_window_results_slate_window ON sleeper_rbi_rfi_window_results (slate_date, window_name, eligibility_status)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_sleeper_window_results_signal ON sleeper_rbi_rfi_window_results (signal_id)`).run();
}
async function runSleeperRbiRfiWindowRunner(input, env) {
  if (!env.DB) return { ok:false, data_ok:false, version:SYSTEM_VERSION, job:input.job || 'run_sleeper_rbi_rfi_window_runner', error:'Missing DB binding' };
  const slateDate = String(input.slate_date || '').trim() || getPTParts().date;
  const windowName = String(input.window_name || 'MORNING').toUpperCase();
  await ensureSleeperWindowTables(env);
  const signals = await env.DB.prepare(`SELECT * FROM sleeper_rbi_rfi_market_signals WHERE slate_date=? AND market IN ('RBI','RFI') ORDER BY market, player_name, signal_id`).bind(slateDate).all();
  const stmts = [];
  const counts = {};
  const marketCounts = {};
  const sample = [];
  for (const r of signals.results || []) {
    const elig = sleeperEligibilityForWindow(r, slateDate, windowName);
    counts[elig.status] = (counts[elig.status] || 0) + 1;
    const mkey = `${r.market || 'UNKNOWN'}|${elig.status}`;
    marketCounts[mkey] = (marketCounts[mkey] || 0) + 1;
    const usable = elig.status === 'ELIGIBLE' ? 1 : 0;
    const id = `sleeper_window|${slateDate}|${windowName}|${simpleHashText(String(r.signal_id || r.sleeper_leg_id || '') + '|' + windowName)}`;
    const rawJson = JSON.stringify({ source:'sleeper_rbi_rfi_market_signals', rule:'window_filter_no_started_no_within_15_minutes_debug_morning_all_after_1pm_split', slate_date:slateDate, window_name:windowName, signal_id:r.signal_id, player_name:r.player_name, market:r.market, date_label:r.date_label, eligibility:elig });
    stmts.push(env.DB.prepare(`INSERT INTO sleeper_rbi_rfi_window_results (window_result_id,slate_date,window_name,signal_id,sleeper_leg_id,player_name,team,opponent,date_label,market,normalized_line_score,target_side,entry_type,eligibility_status,usable_for_window,start_minutes,validation_flags_json,raw_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,0.5,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(window_result_id) DO UPDATE SET eligibility_status=excluded.eligibility_status,usable_for_window=excluded.usable_for_window,start_minutes=excluded.start_minutes,validation_flags_json=excluded.validation_flags_json,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP`).bind(id,slateDate,windowName,r.signal_id,r.sleeper_leg_id,r.player_name,r.team,r.opponent,r.date_label,r.market,r.target_side,r.entry_type||'regular',elig.status,usable,elig.start_minutes,JSON.stringify(elig.flags),rawJson));
    if (sample.length < 50 && usable) sample.push({ player_name:r.player_name, team:r.team, opponent:r.opponent, date_label:r.date_label, market:r.market, target_side:r.target_side, window_name:windowName, eligibility_status:elig.status });
  }
  let saved = 0;
  for (let i=0;i<stmts.length;i+=40) { const chunk = stmts.slice(i,i+40); if (chunk.length) { const res = await env.DB.batch(chunk); saved += res.length; } }
  const eligible = counts.ELIGIBLE || 0;
  return { ok:true, data_ok: eligible > 0 || saved > 0, version:SYSTEM_VERSION, job:input.job || 'run_sleeper_rbi_rfi_window_runner', slate_date:slateDate, window_name:windowName, mode:'sleeper_board_window_filter_only_debug_morning_all_no_gemini_no_odds_no_scoring', source_signals:(signals.results || []).length, saved_rows:saved, window_policy:{ split_time_pt:'1:00 PM', split_minutes:SLEEPER_RBI_RFI_WINDOW_SPLIT_MINUTES, morning_debug_all_windows:SLEEPER_RBI_RFI_MORNING_DEBUG_ALL_WINDOWS, morning_schedule:'6:00 AM PT/PDT', early_afternoon_schedule:'10:00 AM PT/PDT' }, counts, market_counts:marketCounts, eligible_rows:eligible, sample, rules:['use_sleeper_board_signals_only','morning_window_debug_processes_all_start_times','early_afternoon_window_processes_games_at_or_after_1pm_pt','exclude already-started rows','exclude rows within 15 minutes of start','retain rejected/more-only rows as non-usable','normalize target line to 0.5'], note:'Debug phase: Morning Window processes all not-started/not-too-close Sleeper RBI/RFI rows. Early Afternoon Window processes games at or after 1:00 PM PT. No scrape, Gemini, odds, or scoring.' };
}
async function checkSleeperRbiRfiWindowRunner(input, env) {
  if (!env.DB) return { ok:false, data_ok:false, version:SYSTEM_VERSION, job:input.job || 'check_sleeper_rbi_rfi_window_runner', error:'Missing DB binding' };
  const slateDate = String(input.slate_date || '').trim() || getPTParts().date;
  await ensureSleeperWindowTables(env);
  const countsRes = await env.DB.prepare(`SELECT window_name, eligibility_status, COUNT(*) AS rows_count FROM sleeper_rbi_rfi_window_results WHERE slate_date=? GROUP BY window_name, eligibility_status ORDER BY window_name, eligibility_status`).bind(slateDate).all();
  const marketRes = await env.DB.prepare(`SELECT window_name, market, eligibility_status, COUNT(*) AS rows_count FROM sleeper_rbi_rfi_window_results WHERE slate_date=? GROUP BY window_name, market, eligibility_status ORDER BY window_name, market, eligibility_status`).bind(slateDate).all();
  const usableRes = await env.DB.prepare(`SELECT window_name, market, COUNT(*) AS usable_rows FROM sleeper_rbi_rfi_window_results WHERE slate_date=? AND usable_for_window=1 GROUP BY window_name, market ORDER BY window_name, market`).bind(slateDate).all();
  const sampleRes = await env.DB.prepare(`SELECT player_name,team,opponent,date_label,market,target_side,window_name,eligibility_status,usable_for_window,updated_at FROM sleeper_rbi_rfi_window_results WHERE slate_date=? ORDER BY window_name, eligibility_status, market, player_name LIMIT 60`).bind(slateDate).all();
  const total = (countsRes.results || []).reduce((a,r)=>a+Number(r.rows_count||0),0);
  const usable = (usableRes.results || []).reduce((a,r)=>a+Number(r.usable_rows||0),0);
  return { ok:true, data_ok: total > 0, version:SYSTEM_VERSION, job:input.job || 'check_sleeper_rbi_rfi_window_runner', slate_date:slateDate, counts:countsRes.results || [], market_counts:marketRes.results || [], usable_counts:usableRes.results || [], total_rows:total, usable_rows:usable, sample:sampleRes.results || [], next_action: total ? 'Sleeper RBI/RFI window results ready for downstream jobs.' : 'Run Morning or Early Afternoon window after Board Signal is populated.', note:'Debug phase: Morning Window is ALL windows except started/too-close; Early Afternoon Window is games at or after 1:00 PM PT. Started/within-15-minute rows are always skipped.' };
}
async function ensureSleeperWindowMiningPrepTables(env) {
  await ensureSleeperWindowTables(env);
  await ensureBoardFactorResultsTable(env);
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sleeper_rbi_rfi_window_mining_prep (
    prep_id TEXT PRIMARY KEY,
    slate_date TEXT NOT NULL,
    window_name TEXT NOT NULL,
    window_result_id TEXT NOT NULL,
    signal_id TEXT,
    sleeper_leg_id TEXT,
    player_name TEXT,
    team TEXT,
    opponent TEXT,
    date_label TEXT,
    market TEXT,
    target_side TEXT,
    eligibility_status TEXT,
    source_window_usable INTEGER DEFAULT 0,
    matched_player_a INTEGER DEFAULT 0,
    matched_player_d INTEGER DEFAULT 0,
    matched_game_b INTEGER DEFAULT 0,
    matched_weather INTEGER DEFAULT 0,
    matched_news INTEGER DEFAULT 0,
    phase3_result_count INTEGER DEFAULT 0,
    raw_factor_rows INTEGER DEFAULT 0,
    prep_status TEXT NOT NULL,
    missing_sources_json TEXT DEFAULT '[]',
    raw_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_sleeper_window_prep_slate_window ON sleeper_rbi_rfi_window_mining_prep (slate_date, window_name, prep_status, market)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_sleeper_window_prep_signal ON sleeper_rbi_rfi_window_mining_prep (signal_id)`).run();
}

function sleeperPrepLikeTerm(value) {
  const txt = String(value || '').trim();
  if (!txt) return null;
  return `%${txt.replace(/[%_]/g, '')}%`;
}

async function sleeperPhase3MatchCount(env, slateDate, queueType, row) {
  const playerLike = sleeperPrepLikeTerm(row.player_name);
  const teamLike = sleeperPrepLikeTerm(row.team);
  const opponentClean = String(row.opponent || '').replace(/^(vs|@)\s+/i, '').trim();
  const oppLike = sleeperPrepLikeTerm(opponentClean);
  let where = `slate_date=? AND status='COMPLETED' AND queue_type=?`;
  const binds = [slateDate, queueType];
  if (String(queueType || '').startsWith('PLAYER_') && playerLike) {
    where += ` AND raw_json LIKE ?`;
    binds.push(playerLike);
  } else if (String(queueType || '').startsWith('GAME_')) {
    const parts = [];
    if (teamLike) { parts.push(`raw_json LIKE ?`); binds.push(teamLike); }
    if (oppLike) { parts.push(`raw_json LIKE ?`); binds.push(oppLike); }
    if (parts.length) where += ` AND (` + parts.join(' OR ') + `)`;
  }
  const res = await env.DB.prepare(`SELECT COUNT(*) AS result_count, COALESCE(SUM(factor_count),0) AS raw_factor_rows FROM board_factor_results WHERE ${where}`).bind(...binds).first();
  return { count: Number(res?.result_count || 0), factors: Number(res?.raw_factor_rows || 0) };
}

async function runSleeperRbiRfiWindowMiningPrep(input, env) {
  if (!env.DB) return { ok:false, data_ok:false, version:SYSTEM_VERSION, job:input.job || 'run_sleeper_rbi_rfi_window_mining_prep', error:'Missing DB binding' };
  const slateDate = String(input.slate_date || '').trim() || getPTParts().date;
  const windowName = String(input.window_name || 'MORNING').toUpperCase();
  await ensureSleeperWindowMiningPrepTables(env);
  const rowsRes = await env.DB.prepare(`SELECT * FROM sleeper_rbi_rfi_window_results WHERE slate_date=? AND window_name=? ORDER BY market, date_label, player_name`).bind(slateDate, windowName).all();
  const rows = rowsRes.results || [];
  const stmts = [];
  const counts = {};
  const marketCounts = {};
  const sample = [];
  let eligibleRows = 0, readyRows = 0, notReadyRows = 0, totalMatchedResults = 0, totalRawFactorRows = 0;
  for (const r of rows) {
    const sourceUsable = Number(r.usable_for_window || 0) === 1 && String(r.eligibility_status || '') === 'ELIGIBLE';
    if (sourceUsable) eligibleRows += 1;
    const a = sourceUsable && r.market === 'RBI' ? await sleeperPhase3MatchCount(env, slateDate, 'PLAYER_A_ROLE_RECENT_MATCHUP', r) : {count:0,factors:0};
    const d = sourceUsable && r.market === 'RBI' ? await sleeperPhase3MatchCount(env, slateDate, 'PLAYER_D_ADVANCED_FORM_CONTACT', r) : {count:0,factors:0};
    const b = sourceUsable ? await sleeperPhase3MatchCount(env, slateDate, 'GAME_B_TEAM_BULLPEN_ENVIRONMENT', r) : {count:0,factors:0};
    const w = sourceUsable ? await sleeperPhase3MatchCount(env, slateDate, 'GAME_WEATHER_CONTEXT', r) : {count:0,factors:0};
    const n = sourceUsable ? await sleeperPhase3MatchCount(env, slateDate, 'GAME_NEWS_INJURY_CONTEXT', r) : {count:0,factors:0};
    const missing = [];
    if (!sourceUsable) missing.push('WINDOW_ROW_NOT_ELIGIBLE');
    if (r.market === 'RBI') {
      if (!a.count) missing.push('PLAYER_A_ROLE_RECENT_MATCHUP');
      if (!d.count) missing.push('PLAYER_D_ADVANCED_FORM_CONTACT');
    }
    if (r.market === 'RFI') {
      if (!b.count) missing.push('GAME_B_TEAM_BULLPEN_ENVIRONMENT');
      if (!w.count) missing.push('GAME_WEATHER_CONTEXT');
      if (!n.count) missing.push('GAME_NEWS_INJURY_CONTEXT');
    }
    const phase3Count = a.count + d.count + b.count + w.count + n.count;
    const rawFactors = a.factors + d.factors + b.factors + w.factors + n.factors;
    totalMatchedResults += phase3Count;
    totalRawFactorRows += rawFactors;
    let prepStatus = 'NOT_ELIGIBLE';
    if (sourceUsable) {
      if (r.market === 'RBI') prepStatus = (a.count && d.count) ? 'READY_FOR_DOWNSTREAM' : 'MISSING_PHASE3_FACTORS';
      else if (r.market === 'RFI') prepStatus = (b.count || w.count || n.count) ? 'READY_PARTIAL_GAME_CONTEXT' : 'MISSING_PHASE3_FACTORS';
      else prepStatus = 'UNKNOWN_MARKET';
    }
    if (prepStatus === 'READY_FOR_DOWNSTREAM' || prepStatus === 'READY_PARTIAL_GAME_CONTEXT') readyRows += 1;
    if (sourceUsable && prepStatus === 'MISSING_PHASE3_FACTORS') notReadyRows += 1;
    counts[prepStatus] = (counts[prepStatus] || 0) + 1;
    const mkey = `${r.market || 'UNKNOWN'}|${prepStatus}`;
    marketCounts[mkey] = (marketCounts[mkey] || 0) + 1;
    const prepId = `sleeper_prep|${slateDate}|${windowName}|${simpleHashText(String(r.window_result_id || r.signal_id || '') + '|prep')}`;
    const rawJson = JSON.stringify({ source:'sleeper_rbi_rfi_window_results', slate_date:slateDate, window_name:windowName, window_result_id:r.window_result_id, signal_id:r.signal_id, market:r.market, target_side:r.target_side, phase3_matches:{ player_a:a, player_d:d, game_b:b, weather:w, news:n }, missing_sources:missing, prep_status:prepStatus, no_scoring:true, no_external_odds:true });
    stmts.push(env.DB.prepare(`INSERT INTO sleeper_rbi_rfi_window_mining_prep (prep_id,slate_date,window_name,window_result_id,signal_id,sleeper_leg_id,player_name,team,opponent,date_label,market,target_side,eligibility_status,source_window_usable,matched_player_a,matched_player_d,matched_game_b,matched_weather,matched_news,phase3_result_count,raw_factor_rows,prep_status,missing_sources_json,raw_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(prep_id) DO UPDATE SET eligibility_status=excluded.eligibility_status,source_window_usable=excluded.source_window_usable,matched_player_a=excluded.matched_player_a,matched_player_d=excluded.matched_player_d,matched_game_b=excluded.matched_game_b,matched_weather=excluded.matched_weather,matched_news=excluded.matched_news,phase3_result_count=excluded.phase3_result_count,raw_factor_rows=excluded.raw_factor_rows,prep_status=excluded.prep_status,missing_sources_json=excluded.missing_sources_json,raw_json=excluded.raw_json,updated_at=CURRENT_TIMESTAMP`).bind(prepId,slateDate,windowName,r.window_result_id,r.signal_id,r.sleeper_leg_id,r.player_name,r.team,r.opponent,r.date_label,r.market,r.target_side,r.eligibility_status,sourceUsable?1:0,a.count,d.count,b.count,w.count,n.count,phase3Count,rawFactors,prepStatus,JSON.stringify(missing),rawJson));
    if (sample.length < 40 && sourceUsable) sample.push({ player_name:r.player_name, team:r.team, opponent:r.opponent, date_label:r.date_label, market:r.market, target_side:r.target_side, prep_status:prepStatus, matched_player_a:a.count, matched_player_d:d.count, matched_game_b:b.count, matched_weather:w.count, matched_news:n.count, missing_sources:missing });
  }
  let saved = 0;
  for (let i=0;i<stmts.length;i+=35) { const chunk = stmts.slice(i,i+35); if (chunk.length) { const res = await env.DB.batch(chunk); saved += res.length; } }
  return { ok:true, data_ok:saved > 0, version:SYSTEM_VERSION, job:input.job || 'run_sleeper_rbi_rfi_window_mining_prep', slate_date:slateDate, window_name:windowName, mode:'window_mining_prep_no_scoring_no_external_odds_no_new_gemini', source_window_rows:rows.length, eligible_rows:eligibleRows, saved_rows:saved, ready_rows:readyRows, not_ready_rows:notReadyRows, total_matched_phase3_results:totalMatchedResults, total_raw_factor_rows:totalRawFactorRows, counts, market_counts:marketCounts, sample, rules:['uses sleeper_rbi_rfi_window_results only','uses eligible window rows only for prep readiness','joins existing board_factor_results where available','does not call Gemini','does not fetch odds','does not score'], next_action:'Run SLEEPER RBI/RFI > Check Window Prep. Missing Phase 3 factors should be mined/backfilled before scoring.', note:'This is the mining-prep/coverage layer only. It prepares eligible RBI/RFI rows for downstream scoring by showing which existing Phase 3 raw factor families are present or missing.' };
}

async function checkSleeperRbiRfiWindowMiningPrep(input, env) {
  if (!env.DB) return { ok:false, data_ok:false, version:SYSTEM_VERSION, job:input.job || 'check_sleeper_rbi_rfi_window_mining_prep', error:'Missing DB binding' };
  const slateDate = String(input.slate_date || '').trim() || getPTParts().date;
  await ensureSleeperWindowMiningPrepTables(env);
  const countsRes = await env.DB.prepare(`SELECT window_name, prep_status, COUNT(*) AS rows_count FROM sleeper_rbi_rfi_window_mining_prep WHERE slate_date=? GROUP BY window_name, prep_status ORDER BY window_name, prep_status`).bind(slateDate).all();
  const marketRes = await env.DB.prepare(`SELECT window_name, market, prep_status, COUNT(*) AS rows_count FROM sleeper_rbi_rfi_window_mining_prep WHERE slate_date=? GROUP BY window_name, market, prep_status ORDER BY window_name, market, prep_status`).bind(slateDate).all();
  const coverageRes = await env.DB.prepare(`SELECT window_name, market, COUNT(*) AS source_rows, SUM(source_window_usable) AS eligible_rows, SUM(CASE WHEN prep_status IN ('READY_FOR_DOWNSTREAM','READY_PARTIAL_GAME_CONTEXT') THEN 1 ELSE 0 END) AS ready_rows, SUM(CASE WHEN prep_status='MISSING_PHASE3_FACTORS' THEN 1 ELSE 0 END) AS missing_rows, SUM(raw_factor_rows) AS raw_factor_rows FROM sleeper_rbi_rfi_window_mining_prep WHERE slate_date=? GROUP BY window_name, market ORDER BY window_name, market`).bind(slateDate).all();
  const sampleRes = await env.DB.prepare(`SELECT player_name,team,opponent,date_label,market,target_side,window_name,prep_status,matched_player_a,matched_player_d,matched_game_b,matched_weather,matched_news,raw_factor_rows,missing_sources_json,updated_at FROM sleeper_rbi_rfi_window_mining_prep WHERE slate_date=? ORDER BY window_name, prep_status, market, player_name LIMIT 80`).bind(slateDate).all();
  const total = (countsRes.results || []).reduce((a,r)=>a+Number(r.rows_count||0),0);
  const ready = (coverageRes.results || []).reduce((a,r)=>a+Number(r.ready_rows||0),0);
  const missing = (coverageRes.results || []).reduce((a,r)=>a+Number(r.missing_rows||0),0);
  return { ok:true, data_ok:total > 0, version:SYSTEM_VERSION, job:input.job || 'check_sleeper_rbi_rfi_window_mining_prep', slate_date:slateDate, counts:countsRes.results || [], market_counts:marketRes.results || [], coverage:coverageRes.results || [], total_rows:total, ready_rows:ready, missing_rows:missing, sample:sampleRes.results || [], next_action: missing ? 'Mine/backfill missing Phase 3 families before scoring.' : 'Prep coverage is ready for downstream scoring design.', note:'Read-only check of the window mining-prep table. No scoring, no Gemini, no external odds.' };
}

function oddsApiConfig(env) {
  return {
    regions:String(env?.ODDS_API_REGIONS || ODDS_API_REGIONS),
    bookmakers:String(env?.ODDS_API_BOOKMAKERS || ODDS_API_BOOKMAKERS),
    gameMarkets:String(env?.ODDS_API_GAME_MARKETS || ODDS_API_GAME_MARKETS),
    propMarkets:String(env?.ODDS_API_PROP_MARKETS || ODDS_API_PROP_MARKETS),
    hitsTbBookmakers:String(env?.ODDS_API_HITS_TB_BOOKMAKERS || ODDS_API_HITS_TB_BOOKMAKERS),
    hitsTbPropMarkets:String(env?.ODDS_API_HITS_TB_PROP_MARKETS || ODDS_API_HITS_TB_PROP_MARKETS),
    rbiBookmakers:String(env?.ODDS_API_RBI_BOOKMAKERS || ODDS_API_RBI_BOOKMAKERS),
    rbiPropMarkets:String(env?.ODDS_API_RBI_PROP_MARKETS || ODDS_API_RBI_PROP_MARKETS),
    oddsFormat:String(env?.ODDS_API_ODDS_FORMAT || ODDS_API_ODDS_FORMAT)
  };
}
function oddsPathWithKey(path, apiKey, params = {}) { const u = new URL(ODDS_API_BASE_URL + path); u.searchParams.set('apiKey', apiKey); for (const [k,v] of Object.entries(params)) if (v !== undefined && v !== null && String(v).trim() !== '') u.searchParams.set(k, String(v)); return u; }
function stripApiKeyFromUrl(url) { try { const u = new URL(url); if (u.searchParams.has('apiKey')) u.searchParams.set('apiKey', '[REDACTED]'); return u.toString(); } catch { return '[url_parse_failed]'; } }
function ptFromISO(iso) { if (!iso) return { date:null, time:null, minutes:null, label:null }; const d = new Date(String(iso)); if (Number.isNaN(d.getTime())) return { date:null, time:null, minutes:null, label:null }; const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'America/Los_Angeles', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false }).formatToParts(d); const m = {}; for (const p of parts) m[p.type] = p.value; const minutes = Number(m.hour) * 60 + Number(m.minute); return { date:`${m.year}-${m.month}-${m.day}`, time:`${m.hour}:${m.minute}`, minutes, label:`${m.hour}:${m.minute} PT` }; }
function oddsEventWindow(iso) { const pt = ptFromISO(iso); if (pt.minutes === null) return { bucket:'UNKNOWN', pt }; return { bucket: pt.minutes < ODDS_API_WINDOW_SPLIT_MINUTES ? 'MORNING' : 'EARLY_AFTERNOON', pt }; }
function oddsEventEligibleForWindow(ev, windowName) { const now = Date.now(); const startMs = Date.parse(ev.commence_time || ''); if (!Number.isFinite(startMs)) return { eligible:false, status:'SKIPPED_BAD_START_TIME' }; if (startMs <= now) return { eligible:false, status:'SKIPPED_STARTED' }; if (startMs <= now + ODDS_API_START_BUFFER_MINUTES * 60 * 1000) return { eligible:false, status:'SKIPPED_TOO_CLOSE' }; const w = oddsEventWindow(ev.commence_time); if (String(windowName).toUpperCase() === 'MORNING') return { eligible:true, status:'ELIGIBLE', bucket:w.bucket, pt:w.pt }; if (w.bucket !== 'EARLY_AFTERNOON') return { eligible:false, status:'SKIPPED_OTHER_WINDOW', bucket:w.bucket, pt:w.pt }; return { eligible:true, status:'ELIGIBLE', bucket:w.bucket, pt:w.pt }; }
async function oddsApiFetchJson(url) { const started = Date.now(); const res = await fetch(url.toString(), { method:'GET', headers:{ 'accept':'application/json' } }); const txt = await res.text(); let data; try { data = JSON.parse(txt || 'null'); } catch { data = { parse_error:true, response_preview:txt.slice(0,1000) }; } const usage = { requests_remaining:res.headers.get('x-requests-remaining'), requests_used:res.headers.get('x-requests-used'), requests_last:res.headers.get('x-requests-last') }; return { ok:res.ok, http_status:res.status, data, usage, elapsed_ms:Date.now()-started, redacted_url:stripApiKeyFromUrl(url.toString()) }; }
async function ensureOddsApiTables(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS odds_api_requests (request_id TEXT PRIMARY KEY, slate_date TEXT, window_name TEXT, request_type TEXT, event_id TEXT, endpoint TEXT, redacted_url TEXT, http_status INTEGER, ok INTEGER, regions TEXT, markets TEXT, bookmakers TEXT, x_requests_remaining TEXT, x_requests_used TEXT, x_requests_last TEXT, elapsed_ms INTEGER, payload_json TEXT, error TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS odds_api_requests_temp (run_id TEXT, request_id TEXT PRIMARY KEY, slate_date TEXT, window_name TEXT, request_type TEXT, event_id TEXT, endpoint TEXT, redacted_url TEXT, http_status INTEGER, ok INTEGER, regions TEXT, markets TEXT, bookmakers TEXT, x_requests_remaining TEXT, x_requests_used TEXT, x_requests_last TEXT, elapsed_ms INTEGER, payload_json TEXT, error TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS odds_api_available_markets (sport_key TEXT, market_key TEXT, market_name TEXT, market_description TEXT, raw_json TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (sport_key, market_key))`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_odds_api_requests_slate ON odds_api_requests (slate_date, window_name, request_type, created_at)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_odds_api_requests_temp_run ON odds_api_requests_temp (run_id, slate_date, window_name, request_type)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS odds_api_events (event_id TEXT PRIMARY KEY, slate_date TEXT, commence_time TEXT, commence_date_pt TEXT, commence_time_pt TEXT, window_bucket TEXT, home_team TEXT, away_team TEXT, sport_key TEXT, sport_title TEXT, last_seen_window TEXT, last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP, raw_json TEXT)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS odds_api_events_temp (run_id TEXT, event_id TEXT PRIMARY KEY, slate_date TEXT, commence_time TEXT, commence_date_pt TEXT, commence_time_pt TEXT, window_bucket TEXT, home_team TEXT, away_team TEXT, sport_key TEXT, sport_title TEXT, last_seen_window TEXT, last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP, raw_json TEXT)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_odds_api_events_slate ON odds_api_events (slate_date, window_bucket, commence_time)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_odds_api_events_temp_run ON odds_api_events_temp (run_id, slate_date, window_bucket, commence_time)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS odds_api_game_markets (row_id TEXT PRIMARY KEY, slate_date TEXT, event_id TEXT, commence_time TEXT, commence_time_pt TEXT, window_bucket TEXT, home_team TEXT, away_team TEXT, bookmaker_key TEXT, bookmaker_title TEXT, bookmaker_last_update TEXT, market_key TEXT, outcome_name TEXT, outcome_price REAL, outcome_point REAL, outcome_description TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, raw_json TEXT)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS odds_api_game_markets_temp (run_id TEXT, row_id TEXT PRIMARY KEY, slate_date TEXT, event_id TEXT, commence_time TEXT, commence_time_pt TEXT, window_bucket TEXT, home_team TEXT, away_team TEXT, bookmaker_key TEXT, bookmaker_title TEXT, bookmaker_last_update TEXT, market_key TEXT, outcome_name TEXT, outcome_price REAL, outcome_point REAL, outcome_description TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, raw_json TEXT)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_odds_api_game_markets_slate ON odds_api_game_markets (slate_date, market_key, bookmaker_key)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_odds_api_game_markets_temp_run ON odds_api_game_markets_temp (run_id, slate_date, market_key, bookmaker_key)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS odds_api_player_props (row_id TEXT PRIMARY KEY, slate_date TEXT, event_id TEXT, commence_time TEXT, commence_time_pt TEXT, window_bucket TEXT, home_team TEXT, away_team TEXT, bookmaker_key TEXT, bookmaker_title TEXT, market_key TEXT, player_name TEXT, outcome_name TEXT, outcome_price REAL, outcome_point REAL, outcome_description TEXT, target_side TEXT, prop_family TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, raw_json TEXT)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS odds_api_player_props_temp (run_id TEXT, row_id TEXT PRIMARY KEY, slate_date TEXT, event_id TEXT, commence_time TEXT, commence_time_pt TEXT, window_bucket TEXT, home_team TEXT, away_team TEXT, bookmaker_key TEXT, bookmaker_title TEXT, market_key TEXT, player_name TEXT, outcome_name TEXT, outcome_price REAL, outcome_point REAL, outcome_description TEXT, target_side TEXT, prop_family TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, raw_json TEXT)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_odds_api_player_props_slate ON odds_api_player_props (slate_date, window_bucket, market_key, player_name)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_odds_api_player_props_temp_run ON odds_api_player_props_temp (run_id, slate_date, window_bucket, market_key, player_name)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS odds_api_run_certifications (run_id TEXT PRIMARY KEY, slate_date TEXT, window_name TEXT, status TEXT, certification_grade TEXT, selected_events INTEGER, game_events INTEGER, game_market_rows INTEGER, prop_rows INTEGER, hits_rows INTEGER, rbi_rows INTEGER, total_bases_rows INTEGER, promoted_at TEXT, cleaned_at TEXT, error TEXT, details_json TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_odds_api_run_certifications_slate ON odds_api_run_certifications (slate_date, window_name, created_at)`).run();
}
function propFamilyFromMarket(marketKey) { const k = String(marketKey || ''); if (k.includes('rbi')) return 'RBI'; if (k.includes('hit') && !k.includes('runs')) return 'HITS'; if (k.includes('base')) return 'TOTAL_BASES'; if (k.includes('inning') || k.includes('1st')) return 'RFI_NRFI'; return 'OTHER'; }
function targetSideFromOutcome(marketKey, outcomeName) { const fam = propFamilyFromMarket(marketKey); const n = String(outcomeName || '').toLowerCase(); if (fam === 'RBI') return n.includes('under') ? 'UNDER_RBI' : n.includes('over') ? 'OVER_RBI' : 'RBI_OTHER'; if (fam === 'HITS') return n.includes('under') ? 'UNDER_HITS' : n.includes('over') ? 'OVER_HITS' : 'HITS_OTHER'; if (fam === 'TOTAL_BASES') return n.includes('under') ? 'UNDER_TOTAL_BASES' : n.includes('over') ? 'OVER_TOTAL_BASES' : 'TOTAL_BASES_OTHER'; if (fam === 'RFI_NRFI') return (n === 'no' || n.includes('under')) ? 'NRFI_UNDER_0_5_FIRST_INNING' : (n === 'yes' || n.includes('over')) ? 'YRFI_OVER_0_5_FIRST_INNING' : 'RFI_NRFI_OTHER'; return 'OTHER'; }
function oddsRunId(slateDate, windowName) { return `odds_cert|${slateDate}|${windowName}|${Date.now()}|${simpleHashText(String(Math.random()))}`; }
async function saveOddsApiRequest(env, o) { return await saveOddsApiRequestToTable(env, 'odds_api_requests', null, o); }
async function saveOddsApiRequestToTable(env, tableName, runId, o) {
  const requestId = `odds_api|${o.slateDate}|${o.windowName || 'ALL'}|${o.requestType}|${o.eventId || 'slate'}|${simpleHashText(`${o.endpoint}|${o.redactedUrl}|${Date.now()}|${Math.random()}`)}`;
  if (tableName === 'odds_api_requests_temp') {
    await env.DB.prepare(`INSERT INTO odds_api_requests_temp (run_id,request_id,slate_date,window_name,request_type,event_id,endpoint,redacted_url,http_status,ok,regions,markets,bookmakers,x_requests_remaining,x_requests_used,x_requests_last,elapsed_ms,payload_json,error,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(runId,requestId,o.slateDate,o.windowName,o.requestType,o.eventId || null,o.endpoint,o.redactedUrl,Number(o.result.http_status || 0),o.result.ok?1:0,o.regions,o.markets,o.bookmakers,o.result.usage?.requests_remaining || null,o.result.usage?.requests_used || null,o.result.usage?.requests_last || null,Number(o.result.elapsed_ms || 0),JSON.stringify(o.result.data || null),o.result.ok?null:JSON.stringify(o.result.data || null).slice(0,900)).run();
  } else {
    await env.DB.prepare(`INSERT INTO odds_api_requests (request_id,slate_date,window_name,request_type,event_id,endpoint,redacted_url,http_status,ok,regions,markets,bookmakers,x_requests_remaining,x_requests_used,x_requests_last,elapsed_ms,payload_json,error,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(requestId,o.slateDate,o.windowName,o.requestType,o.eventId || null,o.endpoint,o.redactedUrl,Number(o.result.http_status || 0),o.result.ok?1:0,o.regions,o.markets,o.bookmakers,o.result.usage?.requests_remaining || null,o.result.usage?.requests_used || null,o.result.usage?.requests_last || null,Number(o.result.elapsed_ms || 0),JSON.stringify(o.result.data || null),o.result.ok?null:JSON.stringify(o.result.data || null).slice(0,900)).run();
  }
  return requestId;
}
async function normalizeAndSaveGameOdds(env, slateDate, windowName, events) { return await normalizeAndSaveGameOddsToTable(env, 'odds_api_events', 'odds_api_game_markets', null, slateDate, windowName, events); }
async function normalizeAndSaveGameOddsToTable(env, eventsTable, marketsTable, runId, slateDate, windowName, events) {
  const eventStmts = [], marketStmts = [];
  let gameMarketRows = 0;
  for (const ev of events || []) {
    const win = oddsEventWindow(ev.commence_time);
    const eventId = String(ev.id || '');
    if (!eventId) continue;
    if (eventsTable === 'odds_api_events_temp') {
      eventStmts.push(env.DB.prepare(`INSERT INTO odds_api_events_temp (run_id,event_id,slate_date,commence_time,commence_date_pt,commence_time_pt,window_bucket,home_team,away_team,sport_key,sport_title,last_seen_window,last_seen_at,raw_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?) ON CONFLICT(event_id) DO UPDATE SET run_id=excluded.run_id,slate_date=excluded.slate_date,commence_time=excluded.commence_time,commence_date_pt=excluded.commence_date_pt,commence_time_pt=excluded.commence_time_pt,window_bucket=excluded.window_bucket,home_team=excluded.home_team,away_team=excluded.away_team,sport_key=excluded.sport_key,sport_title=excluded.sport_title,last_seen_window=excluded.last_seen_window,last_seen_at=CURRENT_TIMESTAMP,raw_json=excluded.raw_json`).bind(runId,eventId,slateDate,ev.commence_time || null,win.pt.date,win.pt.time,win.bucket,ev.home_team || null,ev.away_team || null,ev.sport_key || null,ev.sport_title || null,windowName,JSON.stringify(ev)));
    } else {
      eventStmts.push(env.DB.prepare(`INSERT INTO odds_api_events (event_id,slate_date,commence_time,commence_date_pt,commence_time_pt,window_bucket,home_team,away_team,sport_key,sport_title,last_seen_window,last_seen_at,raw_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?) ON CONFLICT(event_id) DO UPDATE SET slate_date=excluded.slate_date,commence_time=excluded.commence_time,commence_date_pt=excluded.commence_date_pt,commence_time_pt=excluded.commence_time_pt,window_bucket=excluded.window_bucket,home_team=excluded.home_team,away_team=excluded.away_team,sport_key=excluded.sport_key,sport_title=excluded.sport_title,last_seen_window=excluded.last_seen_window,last_seen_at=CURRENT_TIMESTAMP,raw_json=excluded.raw_json`).bind(eventId,slateDate,ev.commence_time || null,win.pt.date,win.pt.time,win.bucket,ev.home_team || null,ev.away_team || null,ev.sport_key || null,ev.sport_title || null,windowName,JSON.stringify(ev)));
    }
    for (const b of ev.bookmakers || []) for (const m of b.markets || []) for (const o of m.outcomes || []) {
      const rowId = `odds_game|${eventId}|${b.key}|${m.key}|${simpleHashText(JSON.stringify(o))}`;
      if (marketsTable === 'odds_api_game_markets_temp') {
        marketStmts.push(env.DB.prepare(`INSERT INTO odds_api_game_markets_temp (run_id,row_id,slate_date,event_id,commence_time,commence_time_pt,window_bucket,home_team,away_team,bookmaker_key,bookmaker_title,bookmaker_last_update,market_key,outcome_name,outcome_price,outcome_point,outcome_description,updated_at,raw_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?) ON CONFLICT(row_id) DO UPDATE SET run_id=excluded.run_id,outcome_price=excluded.outcome_price,outcome_point=excluded.outcome_point,bookmaker_last_update=excluded.bookmaker_last_update,updated_at=CURRENT_TIMESTAMP,raw_json=excluded.raw_json`).bind(runId,rowId,slateDate,eventId,ev.commence_time || null,win.pt.time,win.bucket,ev.home_team || null,ev.away_team || null,b.key || null,b.title || null,b.last_update || null,m.key || null,o.name || null,o.price ?? null,o.point ?? null,o.description || null,JSON.stringify(o)));
      } else {
        marketStmts.push(env.DB.prepare(`INSERT INTO odds_api_game_markets (row_id,slate_date,event_id,commence_time,commence_time_pt,window_bucket,home_team,away_team,bookmaker_key,bookmaker_title,bookmaker_last_update,market_key,outcome_name,outcome_price,outcome_point,outcome_description,updated_at,raw_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?) ON CONFLICT(row_id) DO UPDATE SET outcome_price=excluded.outcome_price,outcome_point=excluded.outcome_point,bookmaker_last_update=excluded.bookmaker_last_update,updated_at=CURRENT_TIMESTAMP,raw_json=excluded.raw_json`).bind(rowId,slateDate,eventId,ev.commence_time || null,win.pt.time,win.bucket,ev.home_team || null,ev.away_team || null,b.key || null,b.title || null,b.last_update || null,m.key || null,o.name || null,o.price ?? null,o.point ?? null,o.description || null,JSON.stringify(o)));
      }
      gameMarketRows += 1;
    }
  }
  for (let i=0;i<eventStmts.length;i+=40) await env.DB.batch(eventStmts.slice(i,i+40));
  for (let i=0;i<marketStmts.length;i+=40) await env.DB.batch(marketStmts.slice(i,i+40));
  return { events_saved:eventStmts.length, game_market_rows:gameMarketRows };
}
async function normalizeAndSavePropOdds(env, slateDate, windowName, eventObj) { return await normalizeAndSavePropOddsToTable(env, 'odds_api_player_props', null, slateDate, windowName, eventObj); }
async function normalizeAndSavePropOddsToTable(env, tableName, runId, slateDate, windowName, eventObj) {
  const stmts = [];
  const ev = eventObj || {};
  const eventId = String(ev.id || '');
  const win = oddsEventWindow(ev.commence_time);
  let propRows = 0;
  const marketCounts = {};
  for (const b of ev.bookmakers || []) for (const m of b.markets || []) for (const o of m.outcomes || []) {
    const playerName = o.description || o.name || '';
    const fam = propFamilyFromMarket(m.key);
    const targetSide = targetSideFromOutcome(m.key, o.name);
    const rowId = `odds_prop|${eventId}|${b.key}|${m.key}|${simpleHashText(JSON.stringify(o))}`;
    if (tableName === 'odds_api_player_props_temp') {
      stmts.push(env.DB.prepare(`INSERT INTO odds_api_player_props_temp (run_id,row_id,slate_date,event_id,commence_time,commence_time_pt,window_bucket,home_team,away_team,bookmaker_key,bookmaker_title,market_key,player_name,outcome_name,outcome_price,outcome_point,outcome_description,target_side,prop_family,updated_at,raw_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?) ON CONFLICT(row_id) DO UPDATE SET run_id=excluded.run_id,outcome_price=excluded.outcome_price,outcome_point=excluded.outcome_point,outcome_name=excluded.outcome_name,target_side=excluded.target_side,updated_at=CURRENT_TIMESTAMP,raw_json=excluded.raw_json`).bind(runId,rowId,slateDate,eventId,ev.commence_time || null,win.pt.time,win.bucket,ev.home_team || null,ev.away_team || null,b.key || null,b.title || null,m.key || null,playerName,o.name || null,o.price ?? null,o.point ?? null,o.description || null,targetSide,fam,JSON.stringify(o)));
    } else {
      stmts.push(env.DB.prepare(`INSERT INTO odds_api_player_props (row_id,slate_date,event_id,commence_time,commence_time_pt,window_bucket,home_team,away_team,bookmaker_key,bookmaker_title,market_key,player_name,outcome_name,outcome_price,outcome_point,outcome_description,target_side,prop_family,updated_at,raw_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?) ON CONFLICT(row_id) DO UPDATE SET outcome_price=excluded.outcome_price,outcome_point=excluded.outcome_point,outcome_name=excluded.outcome_name,target_side=excluded.target_side,updated_at=CURRENT_TIMESTAMP,raw_json=excluded.raw_json`).bind(rowId,slateDate,eventId,ev.commence_time || null,win.pt.time,win.bucket,ev.home_team || null,ev.away_team || null,b.key || null,b.title || null,m.key || null,playerName,o.name || null,o.price ?? null,o.point ?? null,o.description || null,targetSide,fam,JSON.stringify(o)));
    }
    propRows += 1;
    marketCounts[m.key || 'UNKNOWN'] = (marketCounts[m.key || 'UNKNOWN'] || 0) + 1;
  }
  for (let i=0;i<stmts.length;i+=40) await env.DB.batch(stmts.slice(i,i+40));
  return { prop_rows:propRows, market_counts:marketCounts };
}
async function certifyOddsApiTempRun(env, runId, slateDate, windowName, gameResultOk, selectedCount) {
  const ev = await env.DB.prepare(`SELECT COUNT(*) AS rows_count FROM odds_api_events_temp WHERE run_id=?`).bind(runId).first();
  const gm = await env.DB.prepare(`SELECT COUNT(*) AS rows_count FROM odds_api_game_markets_temp WHERE run_id=?`).bind(runId).first();
  const pp = await env.DB.prepare(`SELECT prop_family, COUNT(*) AS rows_count FROM odds_api_player_props_temp WHERE run_id=? GROUP BY prop_family`).bind(runId).all();
  const propCounts = {};
  for (const r of pp.results || []) propCounts[String(r.prop_family || 'OTHER')] = Number(r.rows_count || 0);
  const hitsRows = propCounts.HITS || 0;
  const rbiRows = propCounts.RBI || 0;
  const tbRows = propCounts.TOTAL_BASES || 0;
  const propRows = Object.values(propCounts).reduce((a,b)=>a+Number(b||0),0);
  const failures = [];
  if (!gameResultOk) failures.push('GAME_ODDS_REQUEST_FAILED');
  if (Number(ev?.rows_count || 0) <= 0) failures.push('NO_TEMP_EVENTS');
  if (Number(gm?.rows_count || 0) <= 0) failures.push('NO_TEMP_GAME_MARKETS');
  if (selectedCount <= 0) failures.push('NO_SELECTED_EVENTS');
  if (hitsRows <= 0) failures.push('NO_HITS_ROWS');
  if (tbRows <= 0) failures.push('NO_TOTAL_BASES_ROWS');
  const passed = failures.length === 0;
  const grade = passed ? (rbiRows > 0 ? 'A' : 'B_RBI_MARKET_LOW_OR_EMPTY_ALLOWED') : 'FAIL';
  await env.DB.prepare(`INSERT INTO odds_api_run_certifications (run_id,slate_date,window_name,status,certification_grade,selected_events,game_events,game_market_rows,prop_rows,hits_rows,rbi_rows,total_bases_rows,error,details_json,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(run_id) DO UPDATE SET status=excluded.status,certification_grade=excluded.certification_grade,selected_events=excluded.selected_events,game_events=excluded.game_events,game_market_rows=excluded.game_market_rows,prop_rows=excluded.prop_rows,hits_rows=excluded.hits_rows,rbi_rows=excluded.rbi_rows,total_bases_rows=excluded.total_bases_rows,error=excluded.error,details_json=excluded.details_json`).bind(runId,slateDate,windowName,passed?'CERTIFIED':'FAILED',grade,selectedCount,Number(ev?.rows_count || 0),Number(gm?.rows_count || 0),propRows,hitsRows,rbiRows,tbRows,failures.join('|') || null,JSON.stringify({ failures, prop_family_counts:propCounts, rbi_policy:'RBI rows are useful but not fatal; low coverage is allowed and handled later by Gemini/other sources.' })).run();
  return { ok:passed, status:passed?'CERTIFIED':'FAILED', grade, failures, game_events:Number(ev?.rows_count || 0), game_market_rows:Number(gm?.rows_count || 0), prop_rows:propRows, hits_rows:hitsRows, rbi_rows:rbiRows, total_bases_rows:tbRows, prop_family_counts:propCounts };
}
async function promoteOddsApiTempRun(env, runId, slateDate, windowName) {
  await env.DB.prepare(`DELETE FROM odds_api_requests WHERE slate_date=? AND window_name=? AND request_type IN (SELECT DISTINCT request_type FROM odds_api_requests_temp WHERE run_id=?)`).bind(slateDate,windowName,runId).run();
  await env.DB.prepare(`INSERT INTO odds_api_requests (request_id,slate_date,window_name,request_type,event_id,endpoint,redacted_url,http_status,ok,regions,markets,bookmakers,x_requests_remaining,x_requests_used,x_requests_last,elapsed_ms,payload_json,error,created_at) SELECT request_id,slate_date,window_name,request_type,event_id,endpoint,redacted_url,http_status,ok,regions,markets,bookmakers,x_requests_remaining,x_requests_used,x_requests_last,elapsed_ms,payload_json,error,created_at FROM odds_api_requests_temp WHERE run_id=?`).bind(runId).run();
  await env.DB.prepare(`DELETE FROM odds_api_events WHERE slate_date=?`).bind(slateDate).run();
  await env.DB.prepare(`INSERT INTO odds_api_events (event_id,slate_date,commence_time,commence_date_pt,commence_time_pt,window_bucket,home_team,away_team,sport_key,sport_title,last_seen_window,last_seen_at,raw_json) SELECT event_id,slate_date,commence_time,commence_date_pt,commence_time_pt,window_bucket,home_team,away_team,sport_key,sport_title,last_seen_window,last_seen_at,raw_json FROM odds_api_events_temp WHERE run_id=?`).bind(runId).run();
  await env.DB.prepare(`DELETE FROM odds_api_game_markets WHERE slate_date=?`).bind(slateDate).run();
  await env.DB.prepare(`INSERT INTO odds_api_game_markets (row_id,slate_date,event_id,commence_time,commence_time_pt,window_bucket,home_team,away_team,bookmaker_key,bookmaker_title,bookmaker_last_update,market_key,outcome_name,outcome_price,outcome_point,outcome_description,updated_at,raw_json) SELECT row_id,slate_date,event_id,commence_time,commence_time_pt,window_bucket,home_team,away_team,bookmaker_key,bookmaker_title,bookmaker_last_update,market_key,outcome_name,outcome_price,outcome_point,outcome_description,updated_at,raw_json FROM odds_api_game_markets_temp WHERE run_id=?`).bind(runId).run();
  const buckets = await env.DB.prepare(`SELECT DISTINCT window_bucket FROM odds_api_player_props_temp WHERE run_id=?`).bind(runId).all();
  const bucketList = (buckets.results || []).map(r => String(r.window_bucket || '')).filter(Boolean);
  for (const b of bucketList) await env.DB.prepare(`DELETE FROM odds_api_player_props WHERE slate_date=? AND window_bucket=?`).bind(slateDate,b).run();
  await env.DB.prepare(`INSERT INTO odds_api_player_props (row_id,slate_date,event_id,commence_time,commence_time_pt,window_bucket,home_team,away_team,bookmaker_key,bookmaker_title,market_key,player_name,outcome_name,outcome_price,outcome_point,outcome_description,target_side,prop_family,updated_at,raw_json) SELECT row_id,slate_date,event_id,commence_time,commence_time_pt,window_bucket,home_team,away_team,bookmaker_key,bookmaker_title,market_key,player_name,outcome_name,outcome_price,outcome_point,outcome_description,target_side,prop_family,updated_at,raw_json FROM odds_api_player_props_temp WHERE run_id=?`).bind(runId).run();
  await env.DB.prepare(`UPDATE odds_api_run_certifications SET status='PROMOTED', promoted_at=CURRENT_TIMESTAMP WHERE run_id=?`).bind(runId).run();
  return { promoted:true, replaced_slate:slateDate, replaced_prop_buckets:bucketList };
}
async function cleanOddsApiTempRun(env, runId, keepFailed = false) {
  const cert = await env.DB.prepare(`SELECT status FROM odds_api_run_certifications WHERE run_id=?`).bind(runId).first();
  if (keepFailed && cert && String(cert.status || '').includes('FAILED')) return { cleaned:false, reason:'failed_temp_kept_for_debug' };
  await env.DB.prepare(`DELETE FROM odds_api_requests_temp WHERE run_id=?`).bind(runId).run();
  await env.DB.prepare(`DELETE FROM odds_api_events_temp WHERE run_id=?`).bind(runId).run();
  await env.DB.prepare(`DELETE FROM odds_api_game_markets_temp WHERE run_id=?`).bind(runId).run();
  await env.DB.prepare(`DELETE FROM odds_api_player_props_temp WHERE run_id=?`).bind(runId).run();
  await env.DB.prepare(`UPDATE odds_api_run_certifications SET cleaned_at=CURRENT_TIMESTAMP WHERE run_id=?`).bind(runId).run();
  return { cleaned:true };
}
async function runOddsApiMarketIntel(input, env) {
  if (!env.DB) return { ok:false, data_ok:false, version:SYSTEM_VERSION, job:input.job || 'run_odds_api_market_intel', error:'Missing DB binding' };
  if (!env.ODDS_API_KEY) return { ok:false, data_ok:false, version:SYSTEM_VERSION, job:input.job || 'run_odds_api_market_intel', error:'Missing ODDS_API_KEY secret' };
  const slateDate = String(input.slate_date || '').trim() || resolveSlateDate(input || {}).slate_date;
  const windowName = String(input.window_name || 'MORNING').toUpperCase();
  await ensureOddsApiTables(env);
  const runId = oddsRunId(slateDate, windowName);
  await cleanOddsApiTempRun(env, runId).catch(() => null);
  const cfg = oddsApiConfig(env);
  const gameUrl = oddsPathWithKey(`/${ODDS_API_SPORT_KEY}/odds`, env.ODDS_API_KEY, { regions:cfg.regions, markets:cfg.gameMarkets, oddsFormat:cfg.oddsFormat, bookmakers:cfg.bookmakers });
  const gameResult = await oddsApiFetchJson(gameUrl);
  await saveOddsApiRequestToTable(env, 'odds_api_requests_temp', runId, { slateDate, windowName, requestType:'GAME_ODDS', endpoint:`/${ODDS_API_SPORT_KEY}/odds`, eventId:null, redactedUrl:gameResult.redacted_url, result:gameResult, regions:cfg.regions, markets:cfg.gameMarkets, bookmakers:cfg.bookmakers });
  const allEvents = Array.isArray(gameResult.data) ? gameResult.data : [];
  const gameSave = gameResult.ok ? await normalizeAndSaveGameOddsToTable(env, 'odds_api_events_temp', 'odds_api_game_markets_temp', runId, slateDate, windowName, allEvents) : { events_saved:0, game_market_rows:0 };
  const selected = [];
  const skippedCounts = {};
  for (const ev of allEvents) {
    const w = oddsEventWindow(ev.commence_time);
    if (w.pt.date !== slateDate) { skippedCounts.SKIPPED_OTHER_DATE = (skippedCounts.SKIPPED_OTHER_DATE || 0) + 1; continue; }
    const elig = oddsEventEligibleForWindow(ev, windowName);
    if (!elig.eligible) { skippedCounts[elig.status] = (skippedCounts[elig.status] || 0) + 1; continue; }
    selected.push(ev);
  }
  let propRequests = 0, propRows = 0;
  const propMarketCounts = {};
  const propRequestBreakdown = { hits_tb_bundle:0, hits_tb_bundle_ok:0, hits_tb_bundle_failed:0, rbi_expansion:0, rbi_expansion_ok:0, rbi_expansion_failed:0 };
  const eventResults = [];
  async function runPropGroup(ev, groupName, requestType, markets, bookmakers) {
    const propUrl = oddsPathWithKey(`/${ODDS_API_SPORT_KEY}/events/${encodeURIComponent(ev.id)}/odds`, env.ODDS_API_KEY, { regions:cfg.regions, markets, oddsFormat:cfg.oddsFormat, bookmakers });
    const propResult = await oddsApiFetchJson(propUrl);
    propRequests += 1;
    await saveOddsApiRequestToTable(env, 'odds_api_requests_temp', runId, { slateDate, windowName, requestType, endpoint:`/${ODDS_API_SPORT_KEY}/events/${ev.id}/odds`, eventId:ev.id, redactedUrl:propResult.redacted_url, result:propResult, regions:cfg.regions, markets, bookmakers });
    let saved = { prop_rows:0, market_counts:{} };
    if (propResult.ok) saved = await normalizeAndSavePropOddsToTable(env, 'odds_api_player_props_temp', runId, slateDate, windowName, propResult.data);
    propRows += saved.prop_rows || 0;
    for (const [k,v] of Object.entries(saved.market_counts || {})) propMarketCounts[k] = (propMarketCounts[k] || 0) + Number(v || 0);
    return { group:groupName, markets, bookmakers, http_status:propResult.http_status, ok:propResult.ok, prop_rows:saved.prop_rows || 0, usage:propResult.usage, error_preview:propResult.ok ? null : JSON.stringify(propResult.data || null).slice(0,500) };
  }
  for (const ev of selected) {
    const hitsTb = await runPropGroup(ev, 'HITS_TOTAL_BASES_STRONG_6', 'EVENT_PROP_ODDS_HITS_TB_STRONG_6', cfg.hitsTbPropMarkets, cfg.hitsTbBookmakers);
    propRequestBreakdown.hits_tb_bundle += 1;
    if (hitsTb.ok) propRequestBreakdown.hits_tb_bundle_ok += 1; else propRequestBreakdown.hits_tb_bundle_failed += 1;
    const rbi = await runPropGroup(ev, 'RBI_EXPANSION_ALL_BOOKS', 'EVENT_PROP_ODDS_RBI_EXPANSION', cfg.rbiPropMarkets, cfg.rbiBookmakers);
    propRequestBreakdown.rbi_expansion += 1;
    if (rbi.ok) propRequestBreakdown.rbi_expansion_ok += 1; else propRequestBreakdown.rbi_expansion_failed += 1;
    eventResults.push({ event_id:ev.id, home_team:ev.home_team, away_team:ev.away_team, commence_time:ev.commence_time, pt:oddsEventWindow(ev.commence_time).pt, requests:[hitsTb, rbi] });
  }
  const certification = await certifyOddsApiTempRun(env, runId, slateDate, windowName, gameResult.ok, selected.length);
  let promotion = { promoted:false, reason:'certification_failed' };
  let cleanup = { cleaned:false, reason:'not_promoted' };
  if (certification.ok) {
    promotion = await promoteOddsApiTempRun(env, runId, slateDate, windowName);
    cleanup = await cleanOddsApiTempRun(env, runId, false);
  } else {
    cleanup = await cleanOddsApiTempRun(env, runId, true);
  }
  return {
    ok:true,
    data_ok:certification.ok && promotion.promoted,
    version:SYSTEM_VERSION,
    job:input.job || 'run_odds_api_market_intel',
    slate_date:slateDate,
    window_name:windowName,
    run_id:runId,
    mode:'odds_api_temp_stage_certify_promote_hits_tb_strong6_rbi_expansion_no_rfi_no_scoring',
    config:{ regions:cfg.regions, game_bookmakers:cfg.bookmakers, game_markets:cfg.gameMarkets, hits_tb_bookmakers:cfg.hitsTbBookmakers, hits_tb_markets:cfg.hitsTbPropMarkets, rbi_bookmakers:cfg.rbiBookmakers, rbi_markets:cfg.rbiPropMarkets, odds_format:cfg.oddsFormat, rfi_nrfi:'DISABLED_PENDING_VALID_MARKET_KEY_OR_GEMINI_FALLBACK' },
    game_request:{ http_status:gameResult.http_status, ok:gameResult.ok, usage:gameResult.usage, event_count:allEvents.length, staged:gameSave, error_preview:gameResult.ok ? null : JSON.stringify(gameResult.data || null).slice(0,500) },
    selected_events:selected.length,
    skipped_counts:skippedCounts,
    prop_requests:propRequests,
    prop_request_breakdown:propRequestBreakdown,
    prop_rows:propRows,
    prop_market_counts:propMarketCounts,
    certification,
    promotion,
    cleanup,
    sample_events:eventResults.slice(0,25),
    rules:['mine Odds API into temp tables first','certify temp before promotion','promote temp to main only when game odds, selected events, Hits, and Total Bases pass','RBI expanded-book rows are useful but not fatal if low/empty','clean temp after certified promotion','keep failed temp rows for debug','Hits/Total Bases use strongest six books only','RBI uses expansion bookmaker list to find maximum available RBI coverage','fixed bad betonline_ag key to betonlineag','RFI/NRFI Odds API remains disabled after INVALID_MARKET','no Gemini','no scoring'],
    next_action: certification.ok ? 'Run ODDS API > Check Market Intel. If check is clean, move to scoring logic wiring.' : 'Certification failed. Check certification.failures and temp rows before rerunning.',
    note:'v1.3.33 stages Odds API data in temp tables, certifies it, promotes only clean batches to main odds tables, then cleans temp after success. Dedicated cron wiring is locked for 4:30 AM PT morning odds, 6:00 AM PT morning refresh with Sleeper, and 11:00 AM PT early-afternoon odds.'
  };
}
async function checkOddsApiMarketIntel(input, env) {
  if (!env.DB) return { ok:false, data_ok:false, version:SYSTEM_VERSION, job:input.job || 'check_odds_api_market_intel', error:'Missing DB binding' };
  const slateDate = String(input.slate_date || '').trim() || resolveSlateDate(input || {}).slate_date;
  await ensureOddsApiTables(env);
  const reqRes = await env.DB.prepare(`SELECT window_name, request_type, COUNT(*) AS rows_count, SUM(CASE WHEN ok=1 THEN 1 ELSE 0 END) AS ok_count, MAX(created_at) AS latest_at, MIN(x_requests_remaining) AS min_remaining, MAX(x_requests_used) AS max_used FROM odds_api_requests WHERE slate_date=? GROUP BY window_name, request_type ORDER BY window_name, request_type`).bind(slateDate).all();
  const evRes = await env.DB.prepare(`SELECT window_bucket, COUNT(*) AS games_count, MIN(commence_time_pt) AS first_pt, MAX(commence_time_pt) AS last_pt FROM odds_api_events WHERE slate_date=? GROUP BY window_bucket ORDER BY window_bucket`).bind(slateDate).all();
  const gameMarketRes = await env.DB.prepare(`SELECT market_key, bookmaker_key, COUNT(*) AS rows_count FROM odds_api_game_markets WHERE slate_date=? GROUP BY market_key, bookmaker_key ORDER BY market_key, bookmaker_key LIMIT 120`).bind(slateDate).all();
  const propRes = await env.DB.prepare(`SELECT window_bucket, prop_family, market_key, COUNT(*) AS rows_count FROM odds_api_player_props WHERE slate_date=? GROUP BY window_bucket, prop_family, market_key ORDER BY window_bucket, prop_family, market_key`).bind(slateDate).all();
  const propBookRes = await env.DB.prepare(`SELECT market_key, bookmaker_key, COUNT(*) AS rows_count FROM odds_api_player_props WHERE slate_date=? GROUP BY market_key, bookmaker_key ORDER BY market_key, bookmaker_key LIMIT 120`).bind(slateDate).all();
  const sleeperRbiMatchRes = await env.DB.prepare(`SELECT COUNT(DISTINCT s.player_name) AS sleeper_rbi_players, COUNT(DISTINCT p.player_name) AS matched_odds_players FROM sleeper_rbi_rfi_market_signals s LEFT JOIN odds_api_player_props p ON p.slate_date=s.slate_date AND p.prop_family='RBI' AND lower(replace(replace(replace(p.player_name,'.',''),' Jr',''),' jr','')) = lower(replace(replace(replace(s.player_name,'.',''),' Jr',''),' jr','')) WHERE s.slate_date=? AND s.market='RBI' AND s.signal_status='CERTIFIED_BOARD_PRESENT'`).bind(slateDate).all();
  const missingSleeperRbiRes = await env.DB.prepare(`SELECT s.player_name, s.team, s.opponent, s.date_label FROM sleeper_rbi_rfi_market_signals s LEFT JOIN odds_api_player_props p ON p.slate_date=s.slate_date AND p.prop_family='RBI' AND lower(replace(replace(replace(p.player_name,'.',''),' Jr',''),' jr','')) = lower(replace(replace(replace(s.player_name,'.',''),' Jr',''),' jr','')) WHERE s.slate_date=? AND s.market='RBI' AND s.signal_status='CERTIFIED_BOARD_PRESENT' AND p.player_name IS NULL ORDER BY s.date_label, s.player_name LIMIT 50`).bind(slateDate).all();
  const sampleRes = await env.DB.prepare(`SELECT event_id, commence_time_pt, window_bucket, bookmaker_key, market_key, player_name, outcome_name, outcome_price, outcome_point, target_side, prop_family, home_team, away_team, updated_at FROM odds_api_player_props WHERE slate_date=? ORDER BY window_bucket, market_key, player_name, bookmaker_key LIMIT 80`).bind(slateDate).all();
  const certRes = await env.DB.prepare(`SELECT run_id, window_name, status, certification_grade, selected_events, game_events, game_market_rows, prop_rows, hits_rows, rbi_rows, total_bases_rows, promoted_at, cleaned_at, error, created_at FROM odds_api_run_certifications WHERE slate_date=? ORDER BY created_at DESC LIMIT 10`).bind(slateDate).all();
  const tempRes = await env.DB.prepare(`SELECT 'requests_temp' AS table_name, COUNT(*) AS rows_count FROM odds_api_requests_temp WHERE slate_date=? UNION ALL SELECT 'events_temp', COUNT(*) FROM odds_api_events_temp WHERE slate_date=? UNION ALL SELECT 'game_markets_temp', COUNT(*) FROM odds_api_game_markets_temp WHERE slate_date=? UNION ALL SELECT 'player_props_temp', COUNT(*) FROM odds_api_player_props_temp WHERE slate_date=?`).bind(slateDate,slateDate,slateDate,slateDate).all();
  const propRows = (propRes.results || []).reduce((a,r)=>a+Number(r.rows_count||0),0);
  return {
    ok:true,
    data_ok:propRows > 0 || (evRes.results || []).length > 0,
    version:SYSTEM_VERSION,
    job:input.job || 'check_odds_api_market_intel',
    slate_date:slateDate,
    request_counts:reqRes.results || [],
    event_counts:evRes.results || [],
    game_market_counts:gameMarketRes.results || [],
    prop_counts:propRes.results || [],
    prop_book_counts:propBookRes.results || [],
    latest_certifications:certRes.results || [],
    temp_counts:tempRes.results || [],
    scheduler_plan:{
      timezone:'UTC cron / PT labels shown for PDT',
      locked:true,
      crons:[
        { cron:'30 11 * * *', pt_label:'Daily 4:30 AM PT', job:'run_odds_api_morning', path:'Odds API temp-stage -> certify -> promote -> clean', purpose:'first certified morning odds snapshot' },
        { cron:'0 13 * * *', pt_label:'Daily 6:00 AM PT', job:'run_sleeper_rbi_rfi_window_morning + run_odds_api_morning', path:'Sleeper board/window plus Odds API certified morning refresh', purpose:'refresh after more markets open' },
        { cron:'0 18 * * *', pt_label:'Daily 11:00 AM PT', job:'run_odds_api_afternoon', path:'Odds API temp-stage -> certify -> promote -> clean', purpose:'early-afternoon certified odds refresh closer to games' }
      ],
      disabled_market:'RFI/NRFI Odds API probe remains disabled after INVALID_MARKET; later Gemini fallback only.'
    },
    sleeper_rbi_match:sleeperRbiMatchRes.results?.[0] || { sleeper_rbi_players:0, matched_odds_players:0 },
    missing_sleeper_rbi_odds:missingSleeperRbiRes.results || [],
    prop_rows:propRows,
    sample:sampleRes.results || [],
    next_action: propRows ? 'Odds API batter prop data is ready for matching/edge wiring. Compare RBI matched_odds_players and prop_book_counts after the expansion.' : 'Run ODDS API > Run Morning Odds or Run Early Afternoon Odds.',
    note:'v1.3.33 check: certified main odds tables after temp-stage promotion. Shows latest certifications, temp leftovers, and locked cron plan. No RFI probe, no Gemini, no scoring. Scoring freshness is audit-only.'
  };
}


// === v1.3.33 Freshness Audit Only ===
function scoreNormName(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b(jr|sr|ii|iii|iv)\b/g,'').replace(/[^a-z0-9]/g,'');}
function scoreImp(o){o=Number(o); if(!Number.isFinite(o)||o===0)return null; return o>0?100/(o+100):Math.abs(o)/(Math.abs(o)+100);}
function scoreAmerican(p){p=Math.max(.001,Math.min(.999,Number(p||0))); return p>=.5?Math.round(-100*p/(1-p)):Math.round(100*(1-p)/p);}
function scoreBase(p){p=Math.max(0,Math.min(.99,Number(p||0))); let s=p<.5?p*100:55+80*(p-.5); if(s>85)s=85+Math.pow(s-85,.75)*1.10; return Math.max(0,Math.min(98,s));}
function scoreLineType(f,p){p=Number(p); if(!Number.isFinite(p))return 'standard'; if(f==='HITS')return p<=.5?'standard':(p>=2.5?'demon':'alt'); if(f==='TOTAL_BASES')return p<=1.5?'standard':(p>=2.5?'demon':'alt'); if(f==='RBI')return p<=.5?'standard':'demon'; return 'standard';}
function scoreRec(s,blocks){if((blocks||[]).length)return 'BLOCKED'; s=Number(s||0); return s>=90?'QUALIFIED':s>=80?'PLAYABLE':s>=70?'WATCHLIST':s>=60?'WEAK':'REJECTED';}
function scoreGrade(s,c){s=Number(s||0); c=Number(c||0); return s>=90&&c>=.7?'A':s>=80&&c>=.5?'B':s>=70?'C':s>=60?'D':'F';}
function scoreTable(f){return f==='HITS'?'mlb_hits_scores':f==='TOTAL_BASES'?'mlb_total_bases_scores':f==='RBI'?'mlb_rbi_scores':null;}
const SCORE_TEAM_ALIASES={
  "arizona diamondbacks":"ARI","atlanta braves":"ATL","baltimore orioles":"BAL","boston red sox":"BOS","chicago cubs":"CHC","chicago white sox":"CWS","cincinnati reds":"CIN","cleveland guardians":"CLE","colorado rockies":"COL","detroit tigers":"DET","houston astros":"HOU","kansas city royals":"KC","los angeles angels":"LAA","la angels":"LAA","los angeles dodgers":"LAD","miami marlins":"MIA","milwaukee brewers":"MIL","minnesota twins":"MIN","new york mets":"NYM","ny mets":"NYM","new york yankees":"NYY","ny yankees":"NYY","athletics":"OAK","oakland athletics":"OAK","philadelphia phillies":"PHI","pittsburgh pirates":"PIT","san diego padres":"SD","seattle mariners":"SEA","san francisco giants":"SFG","st louis cardinals":"STL","st. louis cardinals":"STL","tampa bay rays":"TB","texas rangers":"TEX","toronto blue jays":"TOR","washington nationals":"WSN",
  "ARI":"ARI","ATL":"ATL","BAL":"BAL","BOS":"BOS","CHC":"CHC","CWS":"CWS","CIN":"CIN","CLE":"CLE","COL":"COL","DET":"DET","HOU":"HOU","KC":"KC","LAA":"LAA","LAD":"LAD","MIA":"MIA","MIL":"MIL","MIN":"MIN","NYM":"NYM","NYY":"NYY","OAK":"OAK","PHI":"PHI","PIT":"PIT","SD":"SD","SEA":"SEA","SF":"SFG","SFG":"SFG","STL":"STL","TB":"TB","TEX":"TEX","TOR":"TOR","WSH":"WSN","WSN":"WSN"
};
function scoreTeamKey(v){const raw=String(v||'').trim(); if(!raw)return null; const low=raw.toLowerCase().replace(/\s+/g,' '); return SCORE_TEAM_ALIASES[low]||SCORE_TEAM_ALIASES[raw.toUpperCase()]||raw.toUpperCase();}
function scoreClamp(v,lo,hi){v=Number(v); if(!Number.isFinite(v))return 0; return Math.max(lo,Math.min(hi,v));}
async function scoreRowsSafe(env,sql,binds=[]){try{return (await env.DB.prepare(sql).bind(...binds).all()).results||[];}catch(_e){return [];}}
async function loadMlbScoringModifierContext(env,slateDate){
  const ctx={lineupsByPlayer:new Map(),rbiByPlayer:new Map(),weatherByHome:new Map(),totalsByEvent:new Map(),source_counts:{lineups:0,rbi_edges:0,weather:0,game_totals:0}};
  const lineups=await scoreRowsSafe(env,`SELECT player_name, team_id, game_id, slot, bats FROM lineups_current`);
  for(const r of lineups){const key=scoreNormName(r.player_name); if(!key)continue; if(!ctx.lineupsByPlayer.has(key))ctx.lineupsByPlayer.set(key,[]); ctx.lineupsByPlayer.get(key).push({team:scoreTeamKey(r.team_id),game_id:r.game_id,slot:Number(r.slot),bats:r.bats||null});}
  ctx.source_counts.lineups=lineups.length;
  const rbis=await scoreRowsSafe(env,`SELECT player_name, team_id, opponent_team, lineup_slot, bats, opposing_throws, player_obp, player_slg, rbi_opportunity_score, lineup_rbi_spot_score, behind_runner_onbase_score, run_environment_flag, candidate_tier FROM edge_candidates_rbi WHERE slate_date=?`,[slateDate]);
  for(const r of rbis){const key=scoreNormName(r.player_name); if(!key)continue; if(!ctx.rbiByPlayer.has(key))ctx.rbiByPlayer.set(key,[]); ctx.rbiByPlayer.get(key).push({team:scoreTeamKey(r.team_id),opponent:scoreTeamKey(r.opponent_team),slot:Number(r.lineup_slot),bats:r.bats||null,throws:r.opposing_throws||null,obp:Number(r.player_obp),slg:Number(r.player_slg),opp:Number(r.rbi_opportunity_score),spot:Number(r.lineup_rbi_spot_score),setter:Number(r.behind_runner_onbase_score),run_flag:r.run_environment_flag||null,tier:r.candidate_tier||null});}
  ctx.source_counts.rbi_edges=rbis.length;
  const weather=await scoreRowsSafe(env,`SELECT home_team, away_team, temp_f, wind_speed_mph, precipitation_1h_in, roof_type, roof_context, weather_risk FROM game_weather_context WHERE slate_date=?`,[slateDate]);
  for(const w of weather){const home=scoreTeamKey(w.home_team); if(!home)continue; ctx.weatherByHome.set(home,{temp:Number(w.temp_f),wind:Number(w.wind_speed_mph),precip:Number(w.precipitation_1h_in),roof_type:w.roof_type||null,roof_context:w.roof_context||null,weather_risk:w.weather_risk||null});}
  ctx.source_counts.weather=weather.length;
  const totals=await scoreRowsSafe(env,`SELECT event_id, outcome_point FROM odds_api_game_markets WHERE slate_date=? AND market_key='totals' AND outcome_point IS NOT NULL`,[slateDate]);
  const tmp=new Map();
  for(const t of totals){const ev=String(t.event_id||''); const pt=Number(t.outcome_point); if(!ev||!Number.isFinite(pt)||pt<=0)continue; if(!tmp.has(ev))tmp.set(ev,[]); tmp.get(ev).push(pt);}
  for(const [ev,arr] of tmp.entries()){ctx.totalsByEvent.set(ev,arr.reduce((a,b)=>a+b,0)/arr.length);}
  ctx.source_counts.game_totals=ctx.totalsByEvent.size;
  return ctx;
}
function scorePickPlayerContext(s,ctx){
  const key=scoreNormName(s.player_name); const home=scoreTeamKey(s.home_team), away=scoreTeamKey(s.away_team); const validTeams=new Set([home,away].filter(Boolean));
  const rbi=(ctx.rbiByPlayer.get(key)||[]).find(x=>!validTeams.size||validTeams.has(x.team))||(ctx.rbiByPlayer.get(key)||[])[0]||null;
  const lu=(ctx.lineupsByPlayer.get(key)||[]).find(x=>!validTeams.size||validTeams.has(x.team))||(ctx.lineupsByPlayer.get(key)||[])[0]||null;
  const team=(rbi&&rbi.team)||(lu&&lu.team)||null; const opponent=team&&home&&away?(team===home?away:home):null;
  return {key,home,away,team,opponent,lineup_slot:(rbi&&Number.isFinite(rbi.slot)?rbi.slot:(lu&&Number.isFinite(lu.slot)?lu.slot:null)),bats:(rbi&&rbi.bats)||(lu&&lu.bats)||null,opposing_throws:rbi&&rbi.throws||null,rbi};
}
function scoreDerivedModifierBundle(fam,dir,s,pairs,lineType,ctx,prob,spread,maxHold){
  const mods=[]; const player=scorePickPlayerContext(s,ctx); const home=player.home; const park=PARK_CONTEXT_BY_HOME_TEAM[home]||{}; const total=ctx.totalsByEvent.get(String(s.event_id||'')); const weather=ctx.weatherByHome.get(home)||null;
  const add=(id,value,reason,source)=>{value=scoreClamp(value,-12,12); if(Math.abs(value)>=0.01)mods.push({id,value:+value.toFixed(2),reason,source});};
  const slot=Number(player.lineup_slot);
  if(Number.isFinite(slot)){
    let v=0;
    if(fam==='RBI'){ if(slot>=3&&slot<=5)v=5; else if(slot===2||slot===6)v=2.5; else if(slot===1)v=-3.5; else if(slot>=7)v=-8; }
    else if(fam==='HITS'){ if(slot<=2)v=3; else if(slot>=3&&slot<=5)v=1.5; else if(slot>=7)v=-4; }
    else if(fam==='TOTAL_BASES'){ if(slot>=1&&slot<=5)v=1.5; else if(slot>=7)v=-3; }
    add('M_LINEUP_SLOT',v,`slot_${slot}`,'lineups_current_or_edge_candidates_rbi');
  } else add('M_LINEUP_SLOT_MISSING',0,'lineup slot unavailable','audit_only');
  if(Number.isFinite(total)){
    let v=0; if(total>=10)v=4; else if(total>=9)v=3; else if(total>=8.5)v=2; else if(total>=8)v=1; else if(total<=6.5)v=-3; else if(total<=7)v=-2;
    if(fam==='RBI')v*=1.35; if(dir==='UNDER')v*=-0.65;
    add('M_GAME_TOTAL',scoreClamp(v,-5,5),`game_total_${total.toFixed(2)}`,'odds_api_game_markets_totals');
  } else add('M_GAME_TOTAL_MISSING',0,'game total unavailable','audit_only');
  const pr=Number(park.park_factor_run), phr=Number(park.park_factor_hr); if(Number.isFinite(pr)||Number.isFinite(phr)){
    let base=fam==='TOTAL_BASES'?(Number.isFinite(phr)?phr:pr):(Number.isFinite(pr)?pr:phr); let v=(base-1)*70; if(fam==='RBI')v=(pr-1)*85; if(dir==='UNDER')v*=-0.75; add('M_PARK',scoreClamp(v,-4,4),`park_${home||'unknown'}_${base.toFixed(2)}`,'static_park_context');
  } else add('M_PARK_MISSING',0,'park factor unavailable','audit_only');
  if(weather){let v=0; const temp=Number(weather.temp), wind=Number(weather.wind), risk=String(weather.weather_risk||'').toLowerCase(); if(Number.isFinite(temp)){if(temp>=82)v+=1.5; else if(temp<=50)v-=2;} if(Number.isFinite(wind)){if(wind>=15)v+=fam==='TOTAL_BASES'?1.5:.75;} if(risk.includes('red'))v-=6; else if(risk.includes('orange'))v-=3; if(dir==='UNDER')v*=-0.5; add('M_WEATHER',scoreClamp(v,-5,4),`temp_${Number.isFinite(temp)?temp:'na'}_wind_${Number.isFinite(wind)?wind:'na'}_risk_${weather.weather_risk||'na'}`,'game_weather_context');}
  else add('M_WEATHER_MISSING',0,'weather unavailable','audit_only');
  const rbi=player.rbi; if(fam==='RBI'&&rbi){let v=0; if(Number.isFinite(rbi.setter))v+=(rbi.setter-3)*0.8; if(String(rbi.tier||'').includes('A_POOL'))v+=3; else if(String(rbi.tier||'').includes('B_POOL'))v+=1.5; if(String(rbi.run_flag||'').includes('positive'))v+=1.5; add('M_RBI_TABLE_SETTER',scoreClamp(v,-5,7),'edge_candidate_rbi_context','edge_candidates_rbi');}
  if(player.bats&&player.opposing_throws){const b=String(player.bats).toUpperCase()[0],t=String(player.opposing_throws).toUpperCase()[0]; if((b==='L'&&t==='R')||(b==='R'&&t==='L'))add('M_PITCHER_HANDEDNESS',fam==='TOTAL_BASES'?2:1.5,'platoon_advantage','edge_candidates_rbi'); else if(b&&t&&b===t)add('M_PITCHER_HANDEDNESS',fam==='TOTAL_BASES'?-1.5:-1,'same_side_matchup','edge_candidates_rbi');}
  else add('M_PITCHER_HANDEDNESS_MISSING',0,'handedness unavailable','audit_only');
  let md=0; if(pairs.length>=5)md=3; else if(pairs.length>=3)md=2; else if(pairs.length===2)md=0.5; else md=-2.5; if(spread>.07)md-=2; if(maxHold>.25)md-=1; add('M_MARKET_DEPTH',scoreClamp(md,-4,4),`${pairs.length}_paired_books_spread_${spread.toFixed(3)}`,'odds_api_player_props');
  if(lineType==='alt')add('M_LINE_TYPE_ALT',-3,'alt_line_conservative_drag','line_type_policy'); else if(lineType==='demon')add('M_LINE_TYPE_DEMON',-12,'demon_tail_risk_drag','line_type_policy');
  let totalMod=mods.reduce((a,m)=>a+Number(m.value||0),0); const maxMod=fam==='RBI'?12:10; if(totalMod>maxMod){mods.push({id:'M_AGGREGATE_POSITIVE_CLAMP',value:+(maxMod-totalMod).toFixed(2),reason:`positive_modifiers_clamped_to_${maxMod}`,source:'anti_inflation_governor'}); totalMod=maxMod;} if(totalMod<-12){mods.push({id:'M_AGGREGATE_NEGATIVE_CLAMP',value:+(-12-totalMod).toFixed(2),reason:'negative_modifiers_clamped_to_-12',source:'anti_inflation_governor'}); totalMod=-12;}
  const confidenceBoost=Math.max(0,Math.min(.25,mods.filter(m=>String(m.id).startsWith('M_')&&Number(m.value)>0).length*.035));
  return {mods,totalMod:+totalMod.toFixed(2),confidenceBoost:+confidenceBoost.toFixed(3),player_context:player,game_total:Number.isFinite(total)?+total.toFixed(2):null,park_context:{home_team:home,park_factor_run:park.park_factor_run??null,park_factor_hr:park.park_factor_hr??null},weather_context:weather||null};
}

async function ensureMlbScoringV1Tables(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS scoring_runs (run_id TEXT PRIMARY KEY, sport TEXT, slate_date TEXT, model_version TEXT, status TEXT, trigger_source TEXT, rows_targeted INTEGER, rows_certified INTEGER, rows_promoted INTEGER, rows_active INTEGER, error TEXT, details_json TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, completed_at TEXT)`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS mlb_scoring_scratchpad (run_id TEXT, scratch_id TEXT PRIMARY KEY, status TEXT, sport TEXT, slate_date TEXT, game_id TEXT, event_id TEXT, game_datetime_utc TEXT, player_name TEXT, normalized_player_name TEXT, player_id TEXT, team TEXT, opponent TEXT, is_home INTEGER, prop_family TEXT, market_key TEXT, line_type TEXT, line_number REAL, line_direction TEXT, source_board TEXT, source_line_id TEXT, market_odds REAL, no_vig_prob REAL, consensus_prob REAL, market_confidence REAL, raw_score REAL, final_score REAL, confidence_grade TEXT, recommendation_status TEXT, scoring_modifiers TEXT, caps TEXT, penalties TEXT, blocks TEXT, audit_payload TEXT, model_version TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
 const cols=`(score_id TEXT PRIMARY KEY, run_id TEXT, status TEXT, sport TEXT, slate_date TEXT, game_id TEXT, event_id TEXT, game_datetime_utc TEXT, player_name TEXT, normalized_player_name TEXT, player_id TEXT, team TEXT, opponent TEXT, is_home INTEGER, prop_family TEXT, market_key TEXT, line_type TEXT, line_number REAL, line_direction TEXT, source_board TEXT, source_line_id TEXT, market_odds REAL, no_vig_prob REAL, consensus_prob REAL, market_confidence REAL, raw_score REAL, final_score REAL, confidence_grade TEXT, recommendation_status TEXT, scoring_modifiers TEXT, caps TEXT, penalties TEXT, blocks TEXT, audit_payload TEXT, model_version TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`;
 for(const t of ['mlb_hits_scores','mlb_total_bases_scores','mlb_rbi_scores']){await env.DB.prepare(`CREATE TABLE IF NOT EXISTS ${t} ${cols}`).run(); await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_${t}_slate ON ${t} (slate_date, final_score, recommendation_status)`).run();}
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS active_score_board (active_key TEXT PRIMARY KEY, score_id TEXT, run_id TEXT, sport TEXT, slate_date TEXT, game_id TEXT, event_id TEXT, game_datetime_utc TEXT, player_name TEXT, normalized_player_name TEXT, team TEXT, opponent TEXT, prop_family TEXT, market_key TEXT, line_type TEXT, line_number REAL, line_direction TEXT, source_board TEXT, source_line_id TEXT, no_vig_prob REAL, final_score REAL, confidence_grade TEXT, recommendation_status TEXT, market_confidence REAL, audit_payload TEXT, model_version TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
 await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_active_score_board_slate ON active_score_board (slate_date, prop_family, final_score DESC)`).run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS scoring_audit_logs (audit_id TEXT PRIMARY KEY, run_id TEXT, score_id TEXT, scratch_id TEXT, slate_date TEXT, prop_family TEXT, source_line_id TEXT, player_name TEXT, status TEXT, message TEXT, audit_payload TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
}
async function resolveScoringSlateDate(env,input={}){
 const requested=String(input.slate_date||'').trim()||resolveSlateDate(input||{}).slate_date;
 const force=input.force_slate_date===true||input.force_empty_slate===true;
 if(!env?.DB)return{slate_date:requested,requested_slate_date:requested,fallback_applied:false,odds_rows_for_requested:0,reason:'no_db'};
 const req=await env.DB.prepare(`SELECT COUNT(*) AS c FROM odds_api_player_props WHERE slate_date=?`).bind(requested).first().catch(()=>({c:0}));
 const reqCount=Number(req?.c||0);
 if(reqCount>0||force)return{slate_date:requested,requested_slate_date:requested,fallback_applied:false,odds_rows_for_requested:reqCount,reason:reqCount>0?'requested_has_odds':'forced_requested'};
 const latest=await env.DB.prepare(`SELECT slate_date, COUNT(*) AS c FROM odds_api_player_props WHERE slate_date IS NOT NULL AND slate_date<>'' GROUP BY slate_date HAVING COUNT(*)>0 ORDER BY slate_date DESC LIMIT 1`).first().catch(()=>null);
 if(latest?.slate_date)return{slate_date:String(latest.slate_date),requested_slate_date:requested,fallback_applied:String(latest.slate_date)!==requested,odds_rows_for_requested:reqCount,odds_rows_for_selected:Number(latest.c||0),reason:'requested_empty_fell_back_to_latest_odds_slate'};
 return{slate_date:requested,requested_slate_date:requested,fallback_applied:false,odds_rows_for_requested:reqCount,odds_rows_for_selected:0,reason:'no_odds_slate_available'};
}

async function runMlbScoringV1(input,env){
 let runId=null;
 let slateDate=null;
 if(!env.DB)return{ok:false,data_ok:false,version:SYSTEM_VERSION,job:input.job||'run_mlb_scoring_v1',error:'Missing DB binding'};
 const runBatch=async(stmts,size=50)=>{let n=0; for(let i=0;i<stmts.length;i+=size){const chunk=stmts.slice(i,i+size); if(chunk.length){await env.DB.batch(chunk); n+=chunk.length;}} return n;};
 try{
  const scoringSlateGuard=await resolveScoringSlateDate(env,input||{});
  slateDate=scoringSlateGuard.slate_date;
  runId=`score_v1|${slateDate}|${Date.now()}|${simpleHashText(String(Math.random()))}`;
  await ensureOddsApiTables(env); await ensureMlbScoringV1Tables(env);
  await env.DB.prepare(`UPDATE scoring_runs SET status='FAILED_STALE_PENDING', error='Superseded by new scoring run before completion', completed_at=CURRENT_TIMESTAMP WHERE slate_date=? AND status IN ('PENDING','RUNNING')`).bind(slateDate).run();
  await env.DB.prepare(`DELETE FROM mlb_scoring_scratchpad WHERE slate_date=?`).bind(slateDate).run();
  await env.DB.prepare(`INSERT INTO scoring_runs (run_id,sport,slate_date,model_version,status,trigger_source,created_at) VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(runId,'MLB',slateDate,SYSTEM_VERSION,'RUNNING',String(input.trigger||'manual')).run();
  const modifierCtx=await loadMlbScoringModifierContext(env,slateDate);
  const res=await env.DB.prepare(`SELECT * FROM odds_api_player_props WHERE slate_date=? AND prop_family IN ('HITS','TOTAL_BASES','RBI') ORDER BY event_id,market_key,player_name,outcome_point,bookmaker_key,outcome_name`).bind(slateDate).all();
  const rows=res.results||[]; const groups=new Map();
  for(const r of rows){const pt=Number(r.outcome_point); if(!Number.isFinite(pt))continue; const k=[r.event_id,r.market_key,scoreNormName(r.player_name),pt].join('|'); if(!groups.has(k))groups.set(k,{over:[],under:[],sample:r}); const g=groups.get(k); const out=String(r.outcome_name||'').toLowerCase(); if(out.includes('over'))g.over.push(r); if(out.includes('under'))g.under.push(r);}
  let scratch=0,cert=0,promoted=0,active=0,blocked=0;
  const scratchStmts=[], scoreStmts=[], activeStmts=[], auditStmts=[];
  for(const [k,g] of groups.entries()){
   const s=g.sample; const fam=String(s.prop_family||propFamilyFromMarket(s.market_key)); const byBook=new Map();
   for(const o of g.over)byBook.set(String(o.bookmaker_key||'').toLowerCase(),{over:o});
   for(const u of g.under){const b=String(u.bookmaker_key||'').toLowerCase(); if(!byBook.has(b))byBook.set(b,{}); byBook.get(b).under=u;}
   const pairs=[];
   for(const [book,p] of byBook.entries()){if(!p.over||!p.under)continue; const io=scoreImp(p.over.outcome_price), iu=scoreImp(p.under.outcome_price); if(io===null||iu===null||io+iu<=0)continue; pairs.push({book,over:p.over,under:p.under,fo:io/(io+iu),fu:iu/(io+iu),hold:io+iu-1,updated:p.over.updated_at||p.under.updated_at||null});}
   if(!pairs.length){blocked++; continue;}
   const avg=x=>pairs.reduce((a,p)=>a+p[x],0)/pairs.length; const probs={OVER:avg('fo'),UNDER:avg('fu')}; const maxHold=Math.max(...pairs.map(p=>p.hold)); const spread=Math.max(...pairs.map(p=>p.fo))-Math.min(...pairs.map(p=>p.fo)); const times=pairs.map(p=>Date.parse(String(p.updated||'').replace(' ','T')+'Z')).filter(Number.isFinite); const stale=times.length?Math.max(0,Math.round((Date.now()-Math.max(...times))/1000)):null;
   for(const dir of ['OVER','UNDER']){
    const prob=probs[dir]; let raw=scoreBase(prob), final=raw, cap=98; const caps=[],pen=[],blocks=[]; const lineType=scoreLineType(fam,s.outcome_point);
    const modBundle=scoreDerivedModifierBundle(fam,dir,s,pairs,lineType,modifierCtx,prob,spread,maxHold);
    final+=modBundle.totalMod;
    if(pairs.length===1){cap=Math.min(cap,60);caps.push('C01_SINGLE_BOOK_60');} else if(pairs.length<3){cap=Math.min(cap,75);caps.push('C01_THIN_UNDER3_75');}
    if(fam==='RBI'){cap=Math.min(cap,92);caps.push('C04_RBI_CAP_92');}
    if(lineType!=='standard'){cap=Math.min(cap,lineType==='demon'?40:85);caps.push(`C_ALT_${lineType.toUpperCase()}`);}
    if(dir==='UNDER'){cap=Math.min(cap,85);caps.push('C_UNDER_CAP_85');}
    // v1.3.38: freshness remains audit-only. Derived modifiers are deterministic and in-house only.
    if(spread>.10)blocks.push('B_DIVERGENCE_10PCT'); else if(spread>.07){final-=10;pen.push('P_SPREAD_7PCT_MINUS10');}
    if(maxHold>.60)blocks.push('B_HOLD_OVER_60PCT'); else if(maxHold>.35){final-=15;pen.push('P_HOLD_35PCT_MINUS15');}
    final=Math.max(0,Math.min(cap,final)); const conf=Math.max(0,Math.min(1,(pairs.length/6)*(spread>.07?.75:1)+modBundle.confidenceBoost)); // freshness audit-only, no confidence drag
    const rec=scoreRec(final,blocks), grade=scoreGrade(final,conf);
    const source=`odds_consensus|${slateDate}|${s.event_id}|${scoreNormName(s.player_name)}|${s.market_key}|${Number(s.outcome_point)}|${dir}`; const scratchId=`scratch|${runId}|${source}`; const scoreId=`score|${runId}|${source}|${simpleHashText(JSON.stringify({prob,final,conf,rec,grade}))}`;
    const audit={book_count:pairs.length,paired_books:pairs.map(p=>({book:p.book,over:p.over.outcome_price,under:p.under.outcome_price,fair_over:+p.fo.toFixed(5),fair_under:+p.fu.toFixed(5),hold:+p.hold.toFixed(5)})),no_vig_prob:+prob.toFixed(5),base_score:+raw.toFixed(2),derived_modifier_total:modBundle.totalMod,derived_modifiers:modBundle.mods,player_context:modBundle.player_context,game_total:modBundle.game_total,park_context:modBundle.park_context,weather_context:modBundle.weather_context,modifier_source_counts:modifierCtx.source_counts,spread:+spread.toFixed(5),max_hold:+maxHold.toFixed(5),odds_age_seconds:stale, freshness_policy:'AUDIT_ONLY_NO_SCORE_EFFECT', caps,penalties:pen,blocks,no_gemini:true,immutable_history:true,batch_governor:true,derived_modifier_calibration:true};
    scratchStmts.push(env.DB.prepare(`INSERT OR REPLACE INTO mlb_scoring_scratchpad (run_id,scratch_id,status,sport,slate_date,game_id,event_id,game_datetime_utc,player_name,normalized_player_name,player_id,team,opponent,is_home,prop_family,market_key,line_type,line_number,line_direction,source_board,source_line_id,market_odds,no_vig_prob,consensus_prob,market_confidence,raw_score,final_score,confidence_grade,recommendation_status,scoring_modifiers,caps,penalties,blocks,audit_payload,model_version,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(runId,scratchId,blocks.length?'BLOCKED':'CERTIFIED','MLB',slateDate,s.event_id,s.event_id,s.commence_time||null,s.player_name,scoreNormName(s.player_name),null,modBundle.player_context.team||s.home_team||null,modBundle.player_context.opponent||s.away_team||null,null,fam,s.market_key,lineType,Number(s.outcome_point),dir,'odds_api_consensus',source,scoreAmerican(prob),prob,prob,conf,raw,final,grade,rec,JSON.stringify(modBundle.mods),JSON.stringify(caps),JSON.stringify(pen),JSON.stringify(blocks),JSON.stringify(audit),SYSTEM_VERSION));
    scratch++; if(blocks.length)continue; cert++;
    const table=scoreTable(fam); if(!table)continue;
    scoreStmts.push(env.DB.prepare(`INSERT OR REPLACE INTO ${table} (score_id,run_id,status,sport,slate_date,game_id,event_id,game_datetime_utc,player_name,normalized_player_name,player_id,team,opponent,is_home,prop_family,market_key,line_type,line_number,line_direction,source_board,source_line_id,market_odds,no_vig_prob,consensus_prob,market_confidence,raw_score,final_score,confidence_grade,recommendation_status,scoring_modifiers,caps,penalties,blocks,audit_payload,model_version,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(scoreId,runId,'PROMOTED','MLB',slateDate,s.event_id,s.event_id,s.commence_time||null,s.player_name,scoreNormName(s.player_name),null,modBundle.player_context.team||s.home_team||null,modBundle.player_context.opponent||s.away_team||null,null,fam,s.market_key,lineType,Number(s.outcome_point),dir,'odds_api_consensus',source,scoreAmerican(prob),prob,prob,conf,raw,final,grade,rec,JSON.stringify(modBundle.mods),JSON.stringify(caps),JSON.stringify(pen),JSON.stringify(blocks),JSON.stringify(audit),SYSTEM_VERSION)); promoted++;
    if(['QUALIFIED','PLAYABLE','WATCHLIST','WEAK'].includes(rec)){activeStmts.push(env.DB.prepare(`INSERT INTO active_score_board (active_key,score_id,run_id,sport,slate_date,game_id,event_id,game_datetime_utc,player_name,normalized_player_name,team,opponent,prop_family,market_key,line_type,line_number,line_direction,source_board,source_line_id,no_vig_prob,final_score,confidence_grade,recommendation_status,market_confidence,audit_payload,model_version,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(active_key) DO UPDATE SET score_id=excluded.score_id,run_id=excluded.run_id,final_score=excluded.final_score,confidence_grade=excluded.confidence_grade,recommendation_status=excluded.recommendation_status,market_confidence=excluded.market_confidence,audit_payload=excluded.audit_payload,model_version=excluded.model_version,updated_at=CURRENT_TIMESTAMP`).bind(source,scoreId,runId,'MLB',slateDate,s.event_id,s.event_id,s.commence_time||null,s.player_name,scoreNormName(s.player_name),modBundle.player_context.team||s.home_team||null,modBundle.player_context.opponent||s.away_team||null,fam,s.market_key,lineType,Number(s.outcome_point),dir,'odds_api_consensus',source,prob,final,grade,rec,conf,JSON.stringify(audit),SYSTEM_VERSION)); active++;}
    auditStmts.push(env.DB.prepare(`INSERT OR REPLACE INTO scoring_audit_logs (audit_id,run_id,score_id,scratch_id,slate_date,prop_family,source_line_id,player_name,status,message,audit_payload,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(`audit|${scoreId}`,runId,scoreId,scratchId,slateDate,fam,source,s.player_name,rec,`Scoring V1 ${rec}: ${s.player_name} ${fam} ${dir} ${s.outcome_point} = ${final.toFixed(2)}`,JSON.stringify(audit)));
   }
  }
  await runBatch(scratchStmts,50); await runBatch(scoreStmts,50); await runBatch(activeStmts,50); await runBatch(auditStmts,50);
  await env.DB.prepare(`DELETE FROM mlb_scoring_scratchpad WHERE run_id=?`).bind(runId).run(); const left=await env.DB.prepare(`SELECT COUNT(*) AS c FROM mlb_scoring_scratchpad WHERE run_id=?`).bind(runId).first();
  await env.DB.prepare(`UPDATE scoring_runs SET status='COMPLETED', rows_targeted=?, rows_certified=?, rows_promoted=?, rows_active=?, details_json=?, completed_at=CURRENT_TIMESTAMP WHERE run_id=?`).bind(scratch,cert,promoted,active,JSON.stringify({blocked_groups:blocked,scratch_left:Number(left?.c||0),batch_governor:true,batches:{scratch:scratchStmts.length,score:scoreStmts.length,active:activeStmts.length,audit:auditStmts.length}}),runId).run();
  const dist=await env.DB.prepare(`SELECT prop_family,recommendation_status,confidence_grade,COUNT(*) AS rows_count,ROUND(AVG(final_score),2) AS avg_score,ROUND(MAX(final_score),2) AS max_score FROM active_score_board WHERE slate_date=? GROUP BY prop_family,recommendation_status,confidence_grade ORDER BY prop_family,max_score DESC`).bind(slateDate).all(); const top=await env.DB.prepare(`SELECT prop_family,player_name,line_direction,line_number,final_score,confidence_grade,recommendation_status,market_confidence,no_vig_prob FROM active_score_board WHERE slate_date=? ORDER BY final_score DESC LIMIT 25`).bind(slateDate).all();
  return{ok:true,data_ok:promoted>0,version:SYSTEM_VERSION,job:input.job||'run_mlb_scoring_v1',slate_date:slateDate,requested_slate_date:scoringSlateGuard?.requested_slate_date||slateDate,slate_guard:scoringSlateGuard,run_id:runId,mode:'scoring_v1_derived_modifier_calibration_no_external_api_no_gemini',rows:{odds_rows:rows.length,groups:groups.size,scratch,certified:cert,promoted,active,blocked_groups:blocked,scratch_left:Number(left?.c||0)},distribution:dist.results||[],top_scores:top.results||[],next_action:'Run SCORING V1 > Check MLB Scores.',note:'v1.3.38 keeps derived modifiers and adds Scoring Slate Data Guard: if the UI sends an empty/tomorrow slate, scoring falls back to the latest Odds API slate with prop rows. Freshness remains audit-only. No external API or Gemini is called by scoring.'};
 }catch(e){
  const msg=String(e&&e.message?e.message:e);
  try{if(runId){await env.DB.prepare(`UPDATE scoring_runs SET status='FAILED_EXCEPTION', error=?, completed_at=CURRENT_TIMESTAMP WHERE run_id=?`).bind(msg,runId).run(); await env.DB.prepare(`DELETE FROM mlb_scoring_scratchpad WHERE run_id=?`).bind(runId).run();}}catch(_e){}
  return{ok:false,data_ok:false,version:SYSTEM_VERSION,job:input.job||'run_mlb_scoring_v1',slate_date:slateDate,run_id:runId,status:'FAILED_EXCEPTION',error:msg,note:'Scoring V1 caught and finalized the failed run instead of leaving it PENDING. No external API or Gemini is called by scoring.'};
 }
}

async function checkMlbScoringV1(input,env){
  if(!env.DB)return{ok:false,data_ok:false,version:SYSTEM_VERSION,job:input.job||'check_mlb_scoring_v1',error:'Missing DB binding'};
  const scoringSlateGuard=await resolveScoringSlateDate(env,input||{});
  const slateDate=scoringSlateGuard.slate_date;
  await ensureMlbScoringV1Tables(env);
  const runs=await env.DB.prepare(`SELECT * FROM scoring_runs WHERE slate_date=? ORDER BY created_at DESC LIMIT 10`).bind(slateDate).all();
  const counts=await env.DB.prepare(`SELECT 'mlb_hits_scores' table_name,COUNT(*) rows_count FROM mlb_hits_scores WHERE slate_date=? UNION ALL SELECT 'mlb_total_bases_scores',COUNT(*) FROM mlb_total_bases_scores WHERE slate_date=? UNION ALL SELECT 'mlb_rbi_scores',COUNT(*) FROM mlb_rbi_scores WHERE slate_date=? UNION ALL SELECT 'active_score_board',COUNT(*) FROM active_score_board WHERE slate_date=? UNION ALL SELECT 'mlb_scoring_scratchpad',COUNT(*) FROM mlb_scoring_scratchpad WHERE slate_date=?`).bind(slateDate,slateDate,slateDate,slateDate,slateDate).all();
  const dist=await env.DB.prepare(`SELECT prop_family,recommendation_status,confidence_grade,COUNT(*) rows_count,ROUND(AVG(final_score),2) avg_score,ROUND(MAX(final_score),2) max_score FROM active_score_board WHERE slate_date=? GROUP BY prop_family,recommendation_status,confidence_grade ORDER BY prop_family,max_score DESC`).bind(slateDate).all();
  const top=await env.DB.prepare(`SELECT prop_family,player_name,line_direction,line_number,line_type,final_score,confidence_grade,recommendation_status,market_confidence,no_vig_prob,updated_at FROM active_score_board WHERE slate_date=? ORDER BY final_score DESC LIMIT 50`).bind(slateDate).all();
  const runRows=runs.results||[];
  const tableRows=counts.results||[];
  const latestRun=runRows[0]||null;
  const tableMap=Object.fromEntries(tableRows.map(r=>[r.table_name,Number(r.rows_count||0)]));
  const latestRunCompleted=!!latestRun&&String(latestRun.status||'').toUpperCase()==='COMPLETED';
  const scratchClean=(tableMap.mlb_scoring_scratchpad||0)===0;
  const activeRows=tableMap.active_score_board||0;
  const activeRowsOk=activeRows>0;
  const scoringEngineOk=latestRunCompleted&&scratchClean&&activeRowsOk;
  const dataOk=scoringEngineOk||(top.results||[]).length>0;
  return{ok:true,data_ok:dataOk,version:SYSTEM_VERSION,job:input.job||'check_mlb_scoring_v1',slate_date:slateDate,requested_slate_date:scoringSlateGuard?.requested_slate_date||slateDate,slate_guard:scoringSlateGuard,scoring_engine_ok:scoringEngineOk,latest_run_completed:latestRunCompleted,scratch_clean:scratchClean,active_rows_ok:activeRowsOk,active_rows:activeRows,check_wrapper_fixed:true,retry_detector_override:'If body.ok=true and latest_run_completed=true, Control Room treats the check as final success, not retry.',modifier_calibration:{ready:true,active:true,applied_fields:['lineup_slot_modifier','team_total_modifier','park_modifier','weather_modifier','pitcher_handedness_modifier_when_available','market_depth_modifier','line_type_cap','rbi_table_setter_modifier_when_available'],rule:'freshness remains audit-only; no stale score penalty or stale hard cap in scoring V1.'},latest_runs:runRows,table_counts:tableRows,active_distribution:dist.results||[],top_active_scores:top.results||[],scheduler_plan:{locked:true,crons:['30 11 odds+score','35 11 score safety','0 13 sleeper+odds+score','5 13 score safety','0 17 sleeper window+score','0 18 odds+score','5 18 score safety']},next_action:activeRowsOk?'Scoring V1 active board exists. Next: run and inspect score distribution/modifier audit.':'Run ODDS API first, then SCORING V1 > Run MLB Scores.',note:'v1.3.38 check: Scoring Slate Data Guard active; if the UI sends an empty/tomorrow slate, check falls back to the latest odds-backed slate. Derived modifier calibration is active. Freshness remains audit-only.'};
}

async function handleSleeperVideoUpload(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();
  const startedAt = new Date().toISOString();
  const eventLog = [{ time: startedAt, stage: "upload_request_received", detail: null }];
  const form = await request.formData();
  const video = form.get("video") || form.get("file");
  if (!video || typeof video.arrayBuffer !== "function") {
    return json({ ok: false, data_ok: false, version: SYSTEM_VERSION, job: "sleeper_video_upload", error: "Missing multipart video field named video" }, { status: 400 });
  }
  const displayName = String(form.get("file_name") || video.name || "sleeper_video.mp4");
  const mimeType = String(form.get("mime_type") || video.type || "video/mp4");
  const sizeBytes = Number(video.size || 0);
  eventLog.push({ time: new Date().toISOString(), stage: "gemini_file_upload_start", detail: { display_name: displayName, mime_type: mimeType, size_bytes: sizeBytes } });
  const file = await uploadGeminiFileResumable(env, { fileBlob: video, displayName, mimeType });
  eventLog.push({ time: new Date().toISOString(), stage: "gemini_file_upload_done", detail: { name: file.name || null, uri: file.uri || null, state: normalizeGeminiFileState(file) } });
  return json({
    ok: true,
    data_ok: true,
    version: SYSTEM_VERSION,
    job: "sleeper_video_upload",
    model: String(env.SLEEPER_VIDEO_GEMINI_MODEL || SLEEPER_VIDEO_MODEL),
    file_name: file.name || null,
    file_uri: file.uri || null,
    mime_type: file.mimeType || file.mime_type || mimeType,
    display_name: displayName,
    size_bytes: sizeBytes,
    state: normalizeGeminiFileState(file),
    event_log: eventLog
  });
}

async function handleSleeperVideoStatus(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();
  const url = new URL(request.url);
  const fileName = url.searchParams.get("file_name") || url.searchParams.get("name") || "";
  const file = await getGeminiFile(env, fileName);
  return json({
    ok: true,
    data_ok: true,
    version: SYSTEM_VERSION,
    job: "sleeper_video_status",
    file_name: file.name || fileName,
    file_uri: file.uri || null,
    mime_type: file.mimeType || file.mime_type || null,
    state: normalizeGeminiFileState(file),
    raw_file: file
  });
}

function finalizeSleeperParsedResult({ parsed, gem, prompt, fileName, fileUri, mimeType, startedAt, eventLog }) {
  const legs = Array.isArray(parsed.legs) ? parsed.legs.map(normalizeSleeperVideoLeg).filter(l => l.player_name || l.team || l.market) : [];
  const seen = new Set();
  const uniqueLegs = [];
  for (const leg of legs) {
    const key = [leg.player_name, leg.team, leg.opponent, leg.date, leg.market, leg.line, leg.type].join("|").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueLegs.push(leg);
  }
  const lines = uniqueLegs.map(sleeperLineText);
  eventLog.push({ time: new Date().toISOString(), stage: "normalization_complete", detail: { parsed_count: uniqueLegs.length, warnings_count: Array.isArray(parsed.warnings) ? parsed.warnings.length : 0 } });
  return {
    ok: true,
    data_ok: uniqueLegs.length > 0,
    version: SYSTEM_VERSION,
    job: "sleeper_video_generate",
    parser: "SLEEPER_VIDEO_RBI_RFI_V2_FILE_API",
    model: gem.model,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    file_name: fileName || null,
    file_uri: fileUri || null,
    mime_type: mimeType,
    parsed_count: uniqueLegs.length,
    lines,
    legs: uniqueLegs,
    warnings: parsed.warnings || [],
    uncertain_cards: parsed.uncertain_cards || [],
    video_summary: parsed.video_summary || null,
    raw_text_preview: String(gem.raw_text || "").slice(0, 2000),
    gemini_response_summary: gem.response_summary || null,
    gemini_attempt: gem.attempt || null,
    raw_response_debug: gem.raw_response ? JSON.stringify(gem.raw_response).slice(0, 6000) : null,
    event_log: eventLog
  };
}

async function handleSleeperVideoGenerate(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();
  const input = await safeJson(request);
  const startedAt = new Date().toISOString();
  const fileName = String(input.file_name || input.name || "");
  let fileUri = String(input.file_uri || input.uri || "");
  let mimeType = String(input.mime_type || input.mimeType || "video/mp4");
  const eventLog = [{ time: startedAt, stage: "generate_request_received", detail: { file_name: fileName || null, has_file_uri: Boolean(fileUri) } }];
  if (fileName) {
    const file = await getGeminiFile(env, fileName);
    const state = normalizeGeminiFileState(file);
    fileUri = file.uri || fileUri || "";
    mimeType = file.mimeType || file.mime_type || mimeType;
    eventLog.push({ time: new Date().toISOString(), stage: "file_metadata_loaded", detail: { state, uri: fileUri || null, mime_type: mimeType || null, name: file.name || fileName } });
    if (state !== "ACTIVE") {
      return json({ ok: false, data_ok: false, version: SYSTEM_VERSION, job: "sleeper_video_generate", error: "Gemini file is not ACTIVE yet", file_state: state, file_name: file.name || fileName, raw_file: file, event_log: eventLog }, { status: 409 });
    }
  }
  if (!fileUri) return json({ ok: false, data_ok: false, version: SYSTEM_VERSION, job: "sleeper_video_generate", error: "Missing file_uri or file_name" }, { status: 400 });
  const prompt = buildSleeperVideoPrompt();
  eventLog.push({ time: new Date().toISOString(), stage: "gemini_generate_start", detail: { model: String(env.SLEEPER_VIDEO_GEMINI_MODEL || SLEEPER_VIDEO_MODEL), parser: "SLEEPER_VIDEO_RBI_RFI_V2_FILE_API", mime_type: mimeType, file_uri_preview: String(fileUri).slice(0, 80) } });
  const gem = await callGeminiVideoFromFile(env, { model: SLEEPER_VIDEO_MODEL, prompt, mimeType, fileUri });
  eventLog.push({ time: new Date().toISOString(), stage: "gemini_generate_done", detail: { model: gem.model, attempt: gem.attempt || null, raw_text_chars: String(gem.raw_text || "").length, response_summary: gem.response_summary || null, first_empty_response_summary: gem.first_empty_response_summary || null } });

  let parsed;
  try {
    parsed = parseStrictJson(cleanJsonText(gem.raw_text));
  } catch (err) {
    eventLog.push({ time: new Date().toISOString(), stage: "json_parse_error", detail: String(err?.message || err) });
    parsed = { ok: false, parser: "SLEEPER_VIDEO_RBI_RFI_V2_FILE_API", legs: [], warnings: [String(err?.message || err)], raw_text: gem.raw_text };
  }
  return json(finalizeSleeperParsedResult({ parsed, gem, prompt, fileName, fileUri, mimeType, startedAt, eventLog }));
}

async function handleSleeperVideoParse(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const uploadResponse = await handleSleeperVideoUpload(request, env);
    const uploadData = await uploadResponse.clone().json().catch(() => null);
    if (!uploadData?.ok) return uploadResponse;
    return handleSleeperVideoGenerate(new Request(request.url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-ingest-token": request.headers.get("x-ingest-token") || "" },
      body: JSON.stringify({ file_name: uploadData.file_name, file_uri: uploadData.file_uri, mime_type: uploadData.mime_type })
    }), env);
  }
  const input = await safeJson(request);
  const mimeType = String(input.mime_type || input.mimeType || "video/mp4");
  let base64Data = String(input.video_base64 || input.base64 || "");
  base64Data = base64Data.replace(/^data:video\/[^;]+;base64,/i, "").replace(/^data:[^;]+;base64,/i, "").trim();
  if (!base64Data) return json({ ok: false, data_ok: false, version: SYSTEM_VERSION, job: "sleeper_video_parse", error: "Missing video_base64. Use /sleeper/video/upload for File API flow." }, { status: 400 });
  const maxBytesEstimate = Math.floor(base64Data.length * 3 / 4);
  if (maxBytesEstimate > 18 * 1024 * 1024) {
    return json({ ok: false, data_ok: false, version: SYSTEM_VERSION, job: "sleeper_video_parse", error: "Inline parser disabled for videos near/over 20MB request size. Use File API upload flow.", estimated_bytes: maxBytesEstimate }, { status: 413 });
  }
  const prompt = buildSleeperVideoPrompt();
  const startedAt = new Date().toISOString();
  const eventLog = [
    { time: startedAt, stage: "inline_request_received", detail: { file_name: input.file_name || null, mime_type: mimeType, estimated_bytes: maxBytesEstimate } },
    { time: new Date().toISOString(), stage: "gemini_inline_request_start", detail: { model: String(env.SLEEPER_VIDEO_GEMINI_MODEL || SLEEPER_VIDEO_MODEL), parser: "SLEEPER_VIDEO_RBI_RFI_V1_INLINE" } }
  ];
  const gem = await callGeminiVideoInline(env, { model: SLEEPER_VIDEO_MODEL, prompt, mimeType, base64Data });
  eventLog.push({ time: new Date().toISOString(), stage: "gemini_response_received", detail: { model: gem.model, raw_text_chars: String(gem.raw_text || "").length } });
  let parsed;
  try {
    parsed = parseStrictJson(cleanJsonText(gem.raw_text));
  } catch (err) {
    eventLog.push({ time: new Date().toISOString(), stage: "json_parse_error", detail: String(err?.message || err) });
    parsed = { ok: false, parser: "SLEEPER_VIDEO_RBI_RFI_V1_INLINE", legs: [], warnings: [String(err?.message || err)], raw_text: gem.raw_text };
  }
  return json(finalizeSleeperParsedResult({ parsed, gem, prompt, fileName: input.file_name, fileUri: null, mimeType, startedAt, eventLog }));
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function geminiMinuteBucket(date = new Date()) {
  return date.toISOString().slice(0, 16);
}

function geminiLimitForModel(model) {
  const key = String(model || "").replace(/^models\//, "");
  if (GEMINI_MODEL_LIMITS[key]) return GEMINI_MODEL_LIMITS[key];
  if (key.includes("2.5-pro")) return GEMINI_MODEL_LIMITS["gemini-2.5-pro"];
  if (key.includes("2.5-flash")) return GEMINI_MODEL_LIMITS["gemini-2.5-flash"];
  if (key.includes("3.1") && key.includes("lite")) return GEMINI_MODEL_LIMITS["gemini-3.1-flash-lite"];
  if (key.includes("3.1") && key.includes("pro")) return GEMINI_MODEL_LIMITS["gemini-3.1-pro"];
  if (key.includes("3") && key.includes("flash")) return GEMINI_MODEL_LIMITS["gemini-3-flash"];
  if (key.includes("2") && key.includes("flash")) return GEMINI_MODEL_LIMITS["gemini-2-flash"];
  return GEMINI_MODEL_LIMITS["gemini-2.5-flash"];
}

function estimateGeminiTokens(prompt, maxOutputTokens = GEMINI_DEFAULT_TOKEN_CAP) {
  return Math.ceil(String(prompt || "").length / 4) + Number(maxOutputTokens || 0);
}

async function ensureGeminiRateUsageTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS gemini_rate_usage (
      bucket TEXT NOT NULL,
      model TEXT NOT NULL,
      requests INTEGER DEFAULT 0,
      estimated_tokens INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (bucket, model)
    )
  `).run();
}

async function reserveGeminiRateBudget(env, model, prompt, options = {}) {
  if (!GEMINI_LIMIT_GUARD_ENABLED || !env?.DB) return { waited_ms: 0, guarded: false };
  await ensureGeminiRateUsageTable(env);
  const limits = geminiLimitForModel(model);
  const rpmCap = Math.max(1, Math.floor(Number(limits.rpm || 1) * GEMINI_LIMIT_GUARD_RATIO));
  const tpmCap = Math.max(1, Math.floor(Number(limits.tpm || 1) * GEMINI_LIMIT_GUARD_RATIO));
  const estimatedTokens = estimateGeminiTokens(prompt, Number(options.maxOutputTokens || GEMINI_DEFAULT_TOKEN_CAP));
  let waitedMs = 0;
  let bucket = geminiMinuteBucket();
  let row = await env.DB.prepare(`SELECT requests, estimated_tokens FROM gemini_rate_usage WHERE bucket=? AND model=?`).bind(bucket, model).first();
  const wouldRequests = Number(row?.requests || 0) + 1;
  const wouldTokens = Number(row?.estimated_tokens || 0) + estimatedTokens;
  if (wouldRequests > rpmCap || wouldTokens > tpmCap) {
    await sleep(GEMINI_LIMIT_GUARD_WAIT_MS);
    waitedMs += GEMINI_LIMIT_GUARD_WAIT_MS;
    bucket = geminiMinuteBucket();
  }
  await env.DB.prepare(`
    INSERT INTO gemini_rate_usage (bucket, model, requests, estimated_tokens, updated_at)
    VALUES (?, ?, 1, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(bucket, model) DO UPDATE SET
      requests = requests + 1,
      estimated_tokens = estimated_tokens + excluded.estimated_tokens,
      updated_at = CURRENT_TIMESTAMP
  `).bind(bucket, model, estimatedTokens).run();
  return { waited_ms: waitedMs, guarded: true, bucket, model, estimated_tokens: estimatedTokens, rpm_cap_75pct: rpmCap, tpm_cap_75pct: tpmCap };
}

async function callGeminiCompactWithFallback(env, prompt) {
  try {
    return await callGemini(env, SCRAPE_MODEL, prompt, { scrape: false, compact: true, maxOutputTokens: 4096 });
  } catch (err) {
    const msg = String(err?.message || err);
    if (msg.includes("UNAVAILABLE") || msg.includes("503") || msg.includes("high demand")) {
      return await callGemini(env, SCRAPE_FALLBACK_MODEL, prompt, { scrape: false, compact: true, maxOutputTokens: 4096 });
    }
    throw err;
  }
}

async function callGeminiWithFallback(env, prompt) {
  try {
    return await callGemini(env, SCRAPE_MODEL, prompt, { scrape: true });
  } catch (err) {
    const msg = String(err?.message || err);
    if (msg.includes("UNAVAILABLE") || msg.includes("503") || msg.includes("high demand")) {
      return await callGemini(env, SCRAPE_FALLBACK_MODEL, prompt, { scrape: true });
    }
    throw err;
  }
}

async function callGemini(env, model, prompt, options = {}) {
  if (!env.GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY secret");
  const maxOutputTokens = Number(options.maxOutputTokens || GEMINI_DEFAULT_TOKEN_CAP);
  await reserveGeminiRateBudget(env, model, prompt, { ...options, maxOutputTokens });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
  const generationConfig = options.scrape
    ? { temperature: 0, topP: 0, maxOutputTokens, responseMimeType: "application/json" }
    : { temperature: 0, topP: 0, maxOutputTokens };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
}

function cleanJsonText(raw) {
  return String(raw || "").replace(/```json/gi, "").replace(/```/g, "").trim();
}

function parseStrictJson(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("Gemini returned invalid JSON: " + String(text).slice(0, 1200));
  }
}

async function safeJson(request) {
  try { return await request.json(); } catch { return {}; }
}


async function buildEdgeCandidatesRBI(env, slateDate) {
  const db = env.DB;

  await db.prepare(`
    DELETE FROM edge_candidates_rbi WHERE slate_date = ?
  `).bind(slateDate).run();

  await db.prepare(`
    INSERT INTO edge_candidates_rbi (
      slate_date, game_id, team_id, opponent_team,
      player_name, lineup_slot, bats,
      opposing_starter, opposing_throws,
      player_avg, player_obp, player_slg,
      bullpen_fatigue_tier, run_environment_flag,
      candidate_tier, candidate_reason
    )
    SELECT
      ?, l.game_id, l.team_id, l.opponent_team,
      l.player_name, l.lineup_slot, p.bats,
      s.starter_name, s.throws,
      p.avg, p.obp, p.slg,
      gc.bullpen_fatigue_tier,
      CASE WHEN gc.park_factor > 1.05 THEN 'positive' ELSE 'neutral' END,
      CASE WHEN l.lineup_slot IN (3,4,5) AND p.slg >= 0.42 THEN 'A_POOL' ELSE 'B_POOL' END,
      (CASE WHEN l.lineup_slot IN (3,4,5) THEN 'premium_rbi_slot|' ELSE '' END ||
       CASE WHEN p.slg >= 0.42 THEN 'strong_power_profile|' ELSE '' END ||
       CASE WHEN gc.bullpen_fatigue_tier = 'high' THEN 'bullpen_pressure|' ELSE '' END)
    FROM lineups_current l
    JOIN players_current p ON p.player_name = l.player_name
    LEFT JOIN starters_current s ON s.team_id = l.opponent_team AND s.game_id = l.game_id
    LEFT JOIN game_context_current gc ON gc.game_id = l.game_id
    WHERE l.game_id LIKE ? AND l.lineup_slot BETWEEN 2 AND 6
  `).bind(slateDate, slateDate + '%').run();

  return { ok: true, job: "build_edge_candidates_rbi", slate_date: slateDate };
}
