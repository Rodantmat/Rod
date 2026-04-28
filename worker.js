// AlphaDog v1.2.52 - Raw Sentinel compatible worker
// RFI GUARDED TIER CAP ACTIVE
const SYSTEM_VERSION = "v1.2.52 - Raw Sentinel";
const SYSTEM_CODENAME = "Raw Sentinel";
const PRIMARY_MODEL = "gemini-2.5-pro";
const FALLBACK_MODEL = "gemini-2.5-flash";
const SCRAPE_MODEL = "gemini-2.5-flash";
const SCRAPE_FALLBACK_MODEL = "gemini-2.5-pro";
const JOB_DISPLAY_LABELS = {
  run_full_pipeline: "SCRAPE > FULL RUN",
  scheduled_full_pipeline_plus_board_queue: "SCRAPE > FULL RUN + Board Queue Pipeline",
  daily_mlb_slate: "SCRAPE > Markets",
  scrape_games_markets: "SCRAPE > Markets",
  board_sifter_preview: "SCRAPE > Board Sifter Preview",
  board_queue_preview: "SCRAPE > Board Queue Preview",
  board_queue_build: "SCRAPE > Board Queue Build",
  run_board_queue_pipeline: "SCRAPE > Board Queue Pipeline",
  board_queue_mine_one: "SCRAPE > Board Queue Mine One Raw",
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
  scrape_recent_usage: "SCRAPE > Usage"
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
    note: "materializes board-derived factor queue rows for supported single-player lines; no Gemini calls"
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
    allowed: ["game_id", "team_id", "starter_name", "throws", "era", "whip", "strikeouts", "innings_pitched", "walks", "hits_allowed", "hr_allowed", "days_rest", "source", "confidence"],
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

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method === "OPTIONS") {
        return new Response(null, { headers: CORS_HEADERS });
      }

      if (url.pathname === "/health") return json(health(env));
      if (url.pathname === "/health/daily") return withCors(await handleDailyHealth(request, env));
      if (url.pathname === "/debug/sql" && request.method === "POST") return await handleDebugSQL(request, env);
      if (url.pathname === "/board/factor-results/inspect") return withCors(await handleBoardFactorResultInspect(request, env));
      if (url.pathname === "/board/queue-payload/inspect") return withCors(await handleBoardQueuePayloadInspect(request, env));
      if (url.pathname === "/tasks/run" && request.method === "POST") return withCors(await handleTaskRun(request, env));
      if (url.pathname === "/packet/leg" && request.method === "POST") return withCors(await handleLegPacket(request, env));
      if (url.pathname === "/score/leg" && request.method === "POST") return withCors(await handleScoreLeg(request, env));
      if (url.pathname === "/ingest/upsert" && request.method === "POST") return withCors(await handleUpsert(request, env));

      return json({ ok: false, error: "Not found", path: url.pathname }, { status: 404 });
    } catch (err) {
      return json({ ok: false, error: String(err?.message || err), stack: String(err?.stack || "") }, { status: 500 });
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runScheduled(event, env));
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
    worker: "alphadog-phase3-starter-groups",
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
    "scrape_players_mlb_api",
    "scrape_players",
    "scrape_players_mlb_api_g1",
    "scrape_players_mlb_api_g2",
    "scrape_players_mlb_api_g3",
    "scrape_players_mlb_api_g4",
    "scrape_players_mlb_api_g5",
    "scrape_players_mlb_api_g6"
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
  const input = { job: "run_full_pipeline", cron: event?.cron || null, slate_mode: "AUTO", trigger: "scheduled" };

  await env.DB.prepare(`
    INSERT INTO task_runs (task_id, job_name, status, started_at, input_json)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
  `).bind(taskId, "run_full_pipeline", "running", JSON.stringify(input)).run();

  try {
    const fullPipeline = await runFullPipeline(input, env);
    let boardQueue = null;
    try {
      boardQueue = await runBoardQueuePipeline({ ...input, job: "run_board_queue_pipeline" }, env);
    } catch (boardErr) {
      boardQueue = { ok: false, job: "run_board_queue_pipeline", error: String(boardErr?.message || boardErr) };
    }
    const result = {
      ok: Boolean(fullPipeline?.ok) && Boolean(boardQueue?.ok),
      version: SYSTEM_VERSION,
      job: "scheduled_full_pipeline_plus_board_queue",
      cron: event?.cron || null,
      full_pipeline: fullPipeline,
      board_queue_pipeline: boardQueue,
      note: "Scheduled handler now also materializes the board_factor_queue after the regular full pipeline. No Gemini calls are made by the board queue step."
    };
    await env.DB.prepare(`
      UPDATE task_runs
      SET status = ?, finished_at = CURRENT_TIMESTAMP, output_json = ?
      WHERE task_id = ?
    `).bind(result.ok ? "success" : "failed", JSON.stringify(result), taskId).run();
  } catch (err) {
    await env.DB.prepare(`
      UPDATE task_runs
      SET status = ?, finished_at = CURRENT_TIMESTAMP, error = ?
      WHERE task_id = ?
    `).bind("failed", String(err?.message || err), taskId).run();
  }
}

function isAuthorized(request, env) {
  const expected = env.INGEST_TOKEN;
  if (!expected) return true;
  return request.headers.get("x-ingest-token") === expected;
}

function unauthorized() {
  return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
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

  try {
    const body = await safeJson(request);
    const sql = String(body?.sql || "").trim();
    if (!sql) return json({ ok: false, error: "Missing SQL" }, { status: 400 });

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

    return json({ ok: true, version: SYSTEM_VERSION, manual_sql_output_guard: { enabled: true, default_max_rows: 50, hard_max_rows: 100 }, outputs });
  } catch (err) {
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

  const singleWhere = boardSingleRowWhere();
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
      last_error TEXT,
      payload_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_board_factor_queue_slate_type_status ON board_factor_queue (slate_date, queue_type, status)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_board_factor_queue_scope ON board_factor_queue (scope_type, scope_key)`).run();
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

function boardFactorPromptForQueueRow(queueRow, retryMode = false, validationError = "") {
  const payload = buildCompactBoardPayloadForGemini(queueRow);
  const def = boardPromptDefinitionForQueueType(queueRow.queue_type);
  const retryText = retryMode ? `\nRETRY REPAIR MODE:\n- Previous output failed validation: ${String(validationError || "unknown").slice(0, 500)}\n- Return smaller valid JSON.\n- Do not use markdown.\n- Do not trail off.\n- Do not include nested board_props arrays.\n- raw_data must be a compact object with no more than 8 primitive fields.\n` : "";
  return `You are AlphaDog's controlled MLB raw factor miner. Return JSON only. No markdown.${retryText}

ARCHITECTURE LOCK:
- You do NOT score props.
- You do NOT rank props.
- You do NOT make picks.
- You do NOT calculate final scores.
- You do NOT invent missing MLB, weather, lineup, injury, or news facts.
- Your job is raw factor extraction only, correlated to the current PrizePicks board queue row.
- Keep the locked prompt family and factor IDs.
- If a factor has usable raw system data, echo compact raw evidence and mark it AVAILABLE.
- If a factor is unavailable, mark it MISSING and list missing fields.
- If a factor is partly supported, mark it PARTIAL and include exactly what is present.
- Never include score_0_100, signal, confidence_0_100, avg_score, min_score, max_score, green/yellow/red, recommendations, pick language, or scoring math.

LOCKED PROMPT FAMILY:
${JSON.stringify(def)}

COMPACT QUEUE PAYLOAD:
${JSON.stringify(payload)}

OUTPUT JSON SCHEMA, EXACT SHAPE:
{
  "ok": true,
  "raw_mode": true,
  "prompt_id": "${def.prompt_id}",
  "queue_id": "${queueRow.queue_id}",
  "queue_type": "${queueRow.queue_type}",
  "scope_type": "${queueRow.scope_type}",
  "slate_date": "${queueRow.slate_date}",
  "factor_family": "${def.family}",
  "items": [
    {
      "target_key": "player name + team OR game_key",
      "target_type": "${def.target_type}",
      "raw_factors": [
        {
          "factor_id": "A01/B01/D01/E01 etc",
          "factor_name": "locked factor name",
          "source_type": "SYSTEM_DATA|GEMINI_EXTRACTED|MISSING",
          "availability": "AVAILABLE|PARTIAL|MISSING",
          "raw_data": {},
          "note": "short raw evidence note, no pick language",
          "missing_data": []
        }
      ],
      "missing_data": [],
      "warnings": []
    }
  ],
  "summary": {
    "raw_mode": true,
    "item_count": 0,
    "factor_family": "${def.family}",
    "missing_data": [],
    "warnings": [],
    "ready_for_system_json": true
  }
}

TARGET RULES:
- PLAYER_BATCH_4: return exactly one item per player in payload.players.
- GAME: return exactly one item for payload.game_key.
- Include locked factor IDs for this family.
- Use compact raw evidence from supplied payload only.
- Missing is acceptable. Invalid JSON is not acceptable.`;
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

async function callGeminiRawWithValidation(env, queueRow) {
  const compactPayload = buildCompactBoardPayloadForGemini(queueRow);
  const attempts = [];
  let lastError = "";
  for (let i = 0; i < 2; i++) {
    const prompt = boardFactorPromptForQueueRow(queueRow, i > 0, lastError);
    let raw = "";
    try {
      raw = await callGeminiWithFallback(env, prompt);
      const parsed = parseStrictJson(cleanJsonText(raw));
      const validation = validateRawGeminiPayload(parsed, queueRow, compactPayload);
      attempts.push({ attempt: i + 1, parsed_ok: true, validation_ok: validation.ok, error: validation.error || null, raw_length: String(raw || "").length });
      if (!validation.ok) {
        lastError = validation.error || "validation failed";
        continue;
      }
      return { parsed, attempts };
    } catch (err) {
      lastError = String(err?.message || err).slice(0, 900);
      attempts.push({ attempt: i + 1, parsed_ok: false, validation_ok: false, error: lastError, raw_length: String(raw || "").length });
    }
  }
  const err = new Error(`Raw Gemini payload failed validation after retry: ${lastError}`);
  err.validation_attempts = attempts;
  throw err;
}

async function runBoardQueueMineOne(input, env) {
  await ensureBoardFactorQueueTable(env);
  await ensureBoardFactorResultsTable(env);
  const slateDate = String(input.slate_date || resolveSlateDate(input).slate_date);
  const preferredType = String(input.queue_type || "").trim();
  const binds = preferredType ? [slateDate, preferredType] : [slateDate];
  const typeWhere = preferredType ? "AND queue_type = ?" : "";
  const next = await env.DB.prepare(`
    SELECT * FROM board_factor_queue
    WHERE slate_date = ? ${typeWhere} AND status = 'PENDING'
    ORDER BY CASE queue_type WHEN 'PLAYER_A_ROLE_RECENT_MATCHUP' THEN 1 WHEN 'PLAYER_D_ADVANCED_FORM_CONTACT' THEN 2 WHEN 'GAME_B_TEAM_BULLPEN_ENVIRONMENT' THEN 3 WHEN 'GAME_WEATHER_CONTEXT' THEN 4 WHEN 'GAME_NEWS_INJURY_CONTEXT' THEN 5 ELSE 99 END, batch_index ASC, queue_id ASC
    LIMIT 1
  `).bind(...binds).first();

  if (!next) {
    const health = await boardRows(env, `SELECT queue_type, status, COUNT(*) AS rows_count FROM board_factor_queue WHERE slate_date = ? GROUP BY queue_type, status ORDER BY queue_type, status`, [slateDate]);
    return { ok: true, job: "board_queue_mine_one", version: SYSTEM_VERSION, status: "empty", slate_date: slateDate, message: "No pending board factor queue row found.", queue_health: health.rows, note: "No Gemini call made." };
  }

  await env.DB.prepare(`UPDATE board_factor_queue SET status='RUNNING', attempt_count=attempt_count+1, last_error=NULL, updated_at=CURRENT_TIMESTAMP WHERE queue_id=?`).bind(next.queue_id).run();
  const model = SCRAPE_MODEL;
  try {
    const hydratedNext = await hydrateQueueRowPayloadIfNeeded(env, next);
    const hydratedPayload = parseStoredBoardPayload(hydratedNext.payload_json);
    const mined = await callGeminiRawWithValidation(env, hydratedNext);
    const parsed = mined.parsed;
    parsed.validation = { ok: true, attempts: mined.attempts };
    parsed.queue_id = next.queue_id; parsed.queue_type = next.queue_type; parsed.scope_type = next.scope_type; parsed.slate_date = next.slate_date;
    const summary = summarizeRawFactorPayload(parsed);
    const resultId = `${next.queue_id}|RESULT|${Date.now()}`;
    await env.DB.prepare(`INSERT INTO board_factor_results (result_id, queue_id, slate_date, queue_type, scope_type, scope_key, batch_index, status, model, factor_count, min_score, max_score, avg_score, raw_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(resultId, next.queue_id, next.slate_date, next.queue_type, next.scope_type, next.scope_key, next.batch_index, model, summary.factor_count, null, null, null, JSON.stringify(parsed)).run();
    await env.DB.prepare(`UPDATE board_factor_queue SET status='COMPLETED', last_error=NULL, updated_at=CURRENT_TIMESTAMP WHERE queue_id=?`).bind(next.queue_id).run();
    const queueHealth = await boardRows(env, `SELECT queue_type, status, COUNT(*) AS rows_count FROM board_factor_queue WHERE slate_date = ? GROUP BY queue_type, status ORDER BY queue_type, status`, [slateDate]);
    return { ok: true, job: "board_queue_mine_one", version: SYSTEM_VERSION, status: "pass", slate_date: slateDate, mined_queue: { queue_id: next.queue_id, queue_type: next.queue_type, scope_type: next.scope_type, batch_index: next.batch_index, player_count: next.player_count, game_count: next.game_count, payload_injected_before_gemini: isBoardQueuePayloadEnriched(hydratedPayload, hydratedNext.queue_type) }, result_id: resultId, model, raw_factor_summary: summary, validation: parsed.validation, queue_health: queueHealth.rows, note: "Mined exactly one queue row as raw factor extraction. Raw Gemini/system-correlated factor data stored after validation. If first Gemini output fails JSON/schema validation, the miner retries once with a stricter compact prompt. No backend scoring, no prop scoring, no ranking, no candidate logic." };
  } catch (err) {
    const msg = String(err?.message || err).slice(0, 900);
    const validationAttempts = Array.isArray(err?.validation_attempts) ? err.validation_attempts : [];
    await env.DB.prepare(`UPDATE board_factor_queue SET status='ERROR', last_error=?, updated_at=CURRENT_TIMESTAMP WHERE queue_id=?`).bind(msg, next.queue_id).run();
    return { ok: false, job: "board_queue_mine_one", version: SYSTEM_VERSION, status: "failed", slate_date: slateDate, failed_queue: { queue_id: next.queue_id, queue_type: next.queue_type, batch_index: next.batch_index }, error: msg, validation_attempts: validationAttempts, note: "One queue row failed only after raw JSON/schema validation and one compact retry. It was marked ERROR. No backend scoring, prop scoring, or ranking was attempted." };
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
      AND ${boardSingleRowWhere()}
    ORDER BY updated_at DESC, stat_type ASC, odds_type ASC
    LIMIT 20
  `, [slateDate, playerName, team]);
  const fallbackProps = propRows.rows.length ? propRows : await boardRows(env, `
    SELECT line_id, player_name, team, opponent, stat_type, line_score, odds_type, is_promo, start_time, updated_at
    FROM mlb_stats
    WHERE LOWER(TRIM(player_name)) = LOWER(TRIM(?))
      AND UPPER(TRIM(team)) = ?
      AND ${boardSingleRowWhere()}
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
      AND ${boardSingleRowWhere()}
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
  const singleWhere = boardSingleRowWhere();
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

  const queueRows = [];
  const playerBatchSize = 4;
  const playerChunks = boardChunkRows(players.rows, playerBatchSize);
  const playerQueueTypes = [
    "PLAYER_A_ROLE_RECENT_MATCHUP",
    "PLAYER_D_ADVANCED_FORM_CONTACT"
  ];
  for (const queueType of playerQueueTypes) {
    for (let index = 0; index < playerChunks.length; index += 1) {
      const chunk = playerChunks[index];
      const scopeKey = chunk.map(r => `${r.team}:${r.player_name}`).join("|");
      const enrichedPayload = await enrichBoardQueuePlayerPayload(env, slateDate, queueType, playerBatchSize, chunk);
      queueRows.push({
        queue_id: boardQueueId(slateDate, queueType, index + 1, scopeKey),
        slate_date: slateDate,
        queue_type: queueType,
        scope_type: "PLAYER_BATCH_4",
        scope_key: scopeKey,
        batch_index: index + 1,
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
    for (let index = 0; index < games.rows.length; index += 1) {
      const row = games.rows[index];
      const scopeKey = `${row.game_key}|${row.start_time}`;
      const enrichedPayload = await enrichBoardQueueGamePayload(env, slateDate, queueType, row);
      queueRows.push({
        queue_id: boardQueueId(slateDate, queueType, index + 1, scopeKey),
        slate_date: slateDate,
        queue_type: queueType,
        scope_type: "GAME",
        scope_key: scopeKey,
        batch_index: index + 1,
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
    player_batch_size: playerBatchSize,
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

async function runBoardQueueBuild(input, env) {
  await ensureBoardFactorQueueTable(env);
  const built = await buildBoardQueueRows(input, env);
  if (!built.ok) return built;
  const slateDate = built.slate_date;
  const allowedTypes = [
    "PLAYER_A_ROLE_RECENT_MATCHUP",
    "PLAYER_D_ADVANCED_FORM_CONTACT",
    "GAME_B_TEAM_BULLPEN_ENVIRONMENT",
    "GAME_WEATHER_CONTEXT",
    "GAME_NEWS_INJURY_CONTEXT"
  ];
  await env.DB.prepare(`DELETE FROM board_factor_queue WHERE slate_date = ? AND queue_type IN (${allowedTypes.map(() => "?").join(",")})`).bind(slateDate, ...allowedTypes).run();

  const stmt = env.DB.prepare(`
    INSERT INTO board_factor_queue (
      queue_id, slate_date, queue_type, scope_type, scope_key, batch_index,
      player_count, game_count, source_rows, player_names, team_id, game_key,
      team_a, team_b, start_time, status, attempt_count, last_error, payload_json,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, NULL, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  let inserted = 0;
  for (const r of built.queue_rows) {
    await stmt.bind(
      r.queue_id, r.slate_date, r.queue_type, r.scope_type, r.scope_key, r.batch_index,
      r.player_count, r.game_count, r.source_rows, r.player_names, r.team_id, r.game_key,
      r.team_a, r.team_b, r.start_time, r.payload_json
    ).run();
    inserted += 1;
  }

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
    status: built.warnings.length ? "review" : "pass",
    slate_date: slateDate,
    table: "board_factor_queue",
    mode: "materialize_supported_board_factor_queue_with_enriched_payload_no_gemini_no_scoring",
    deleted_previous_types: allowedTypes,
    inserted_queue_rows: inserted,
    counts: {
      supported_unique_players: built.supported_unique_players,
      normalized_supported_games: built.normalized_supported_games,
      player_batch_size: built.player_batch_size
    },
    queue_estimate: built.queue_estimate,
    queue_health: queueHealth.rows,
    warnings: built.warnings,
    note: "Queue rows include enriched payload context. No Gemini calls, no factor scoring, no prop ranking. Combo lines remain deferred."
  };
}

async function runBoardQueuePipeline(input, env) {
  const result = await runBoardQueueBuild({ ...input, job: "run_board_queue_pipeline" }, env);
  return {
    ok: Boolean(result && result.ok),
    job: "run_board_queue_pipeline",
    version: SYSTEM_VERSION,
    status: result && result.ok ? "pass" : "review",
    slate_date: result?.slate_date || resolveSlateDate(input).slate_date,
    board_queue_build: result,
    note: "Scheduled board queue pipeline prepared enriched queue payloads only. No Gemini calls, no factor scoring, no prop ranking."
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
  if (jobName === "run_board_queue_pipeline") {
    return await runBoardQueuePipeline({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "board_queue_mine_one") {
    return await runBoardQueueMineOne({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "scrape_games_markets" || jobName === "daily_mlb_slate") {
    return await syncMlbApiGamesMarkets({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "scrape_starters_mlb_api" || jobName === "repair_starters_mlb_api") {
    return await syncMlbApiProbableStarters({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
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
  return await runJob({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
}

async function handleTaskRun(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();
  const body = await safeJson(request);
  const slate = resolveSlateDate(body || {});
  const jobName = String((body || {}).job || "scrape_games_markets");
  const taskId = crypto.randomUUID();
  const input = { ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, trigger: "manual" };

  if (!isExecutableJobName(jobName)) {
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
  return Response.json(result, { status: result.ok ? 200 : 500 });
}

async function countScalar(env, sql, bindValue) {
  const stmt = bindValue !== undefined ? env.DB.prepare(sql).bind(bindValue) : env.DB.prepare(sql);
  const result = await stmt.first();
  const values = Object.values(result || {});
  return Number(values[0] || 0);
}

async function runFullPipeline(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;
  const startedAt = new Date().toISOString();
  const steps = [];
  const groupsRun = [];

  async function step(label, job) {
    const result = (job === "scrape_games_markets" || job === "daily_mlb_slate")
      ? await syncMlbApiGamesMarkets({ ...(input || {}), job, slate_date: slateDate, slate_mode: slate.slate_mode }, env)
      : await runJob({ ...(input || {}), job, slate_date: slateDate, slate_mode: slate.slate_mode }, env);
    steps.push({ label, job, result });
    return result;
  }

  async function stepWithRetry(label, job, maxAttempts, successCheck) {
    let last = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = (job === "scrape_games_markets" || job === "daily_mlb_slate")
        ? await syncMlbApiGamesMarkets({ ...(input || {}), job, slate_date: slateDate, slate_mode: slate.slate_mode }, env)
        : await runJob({ ...(input || {}), job, slate_date: slateDate, slate_mode: slate.slate_mode }, env);
      last = result;
      steps.push({ label, job, attempt, result });

      if (result.ok && (!successCheck || await successCheck(result))) {
        return result;
      }
    }
    return last || { ok: false, error: "No attempts executed" };
  }

  await env.DB.prepare("DELETE FROM starters_current WHERE game_id LIKE ?").bind(`${slateDate}_%`).run();
  await env.DB.prepare("DELETE FROM bullpens_current WHERE game_id LIKE ?").bind(`${slateDate}_%`).run();
  await env.DB.prepare("DELETE FROM lineups_current WHERE game_id LIKE ?").bind(`${slateDate}_%`).run();
  await env.DB.prepare("DELETE FROM markets_current WHERE game_id LIKE ?").bind(`${slateDate}_%`).run();
  await env.DB.prepare("DELETE FROM games WHERE game_date = ?").bind(slateDate).run();
  steps.push({ label: "Clean Slate", job: "internal_clean", result: { ok: true, slate_date: slateDate } });

  const markets = await stepWithRetry("Markets", "scrape_games_markets", 3, async () => {
    const gameCount = await countScalar(env, "SELECT COUNT(*) AS c FROM games WHERE game_date = ?", slateDate);
    return gameCount > 0;
  });

  const games = await countScalar(env, "SELECT COUNT(*) AS c FROM games WHERE game_date = ?", slateDate);

  if (!markets.ok || games <= 0) {
    return {
      ok: false,
      status: "FAILED",
      failed_step: "Markets",
      slate_date: slateDate,
      games,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      steps
    };
  }
  let groupPlan = "MLB_API_PRIMARY";

  const mlbApi = await syncMlbApiProbableStarters({ ...(input || {}), job: "scrape_starters_mlb_api", slate_date: slateDate, slate_mode: slate.slate_mode }, env);
  steps.push({ label: "MLB API Starters", job: "scrape_starters_mlb_api", result: mlbApi });
  groupsRun.push("MLB_API");

  if (!mlbApi.ok) {
    return { ok: false, status: "FAILED", failed_step: "MLB_API_STarters", slate_date: slateDate, games, group_plan: groupPlan, steps };
  }

  const bullpenResult = await syncMlbApiBullpens({ ...(input || {}), job: "scrape_bullpens_mlb_api", slate_date: slateDate, slate_mode: slate.slate_mode }, env);
  steps.push({ label: "MLB API Bullpens", job: "scrape_bullpens_mlb_api", result: bullpenResult });

  const lineupResult = await syncMlbApiLineups({ ...(input || {}), job: "scrape_lineups_mlb_api", slate_date: slateDate, slate_mode: slate.slate_mode }, env);
  steps.push({ label: "MLB API Lineups", job: "scrape_lineups_mlb_api", result: lineupResult });

  const startersAfterApi = await countScalar(env, "SELECT COUNT(*) AS c FROM starters_current WHERE game_id LIKE ?", `${slateDate}_%`);

  if (startersAfterApi < games * 2) {
    const missingRepair = await step("Gemini Missing Fallback", "scrape_starters_missing");
    groupsRun.push("MISSING_FALLBACK");
    if (!missingRepair.ok) {
      return { ok: false, status: "FAILED", failed_step: "Missing", slate_date: slateDate, games, group_plan: groupPlan, steps };
    }
  }

  const startersTotal = await countScalar(env, "SELECT COUNT(*) AS c FROM starters_current WHERE game_id LIKE ?", `${slateDate}_%`);
  const bullpensTotal = await countScalar(env, "SELECT COUNT(*) AS c FROM bullpens_current WHERE game_id LIKE ?", `${slateDate}_%`);
  const lineupsTotal = await countScalar(env, "SELECT COUNT(*) AS c FROM lineups_current WHERE game_id LIKE ?", `${slateDate}_%`);
  const recentUsageTotal = await countScalar(env, "SELECT COUNT(*) AS c FROM player_recent_usage");
  const playersTotal = await countScalar(env, "SELECT COUNT(*) AS c FROM players_current");
  const badRows = await countScalar(env, `
    SELECT COUNT(*) AS c
    FROM starters_current
    WHERE game_id LIKE ?
      AND (
        starter_name LIKE '%Ace%'
        OR starter_name IN ('TBD','TBA','Unknown','Starter')
        OR (
          source != 'mlb_statsapi_probable_pitcher'
          AND (
            era IS NULL OR era <= 0
            OR whip IS NULL OR whip <= 0
            OR strikeouts IS NULL OR strikeouts <= 0
            OR innings_pitched IS NULL OR innings_pitched <= 0
          )
        )
      )
  `, `${slateDate}_%`);

  const missingGames = await countScalar(env, `
    SELECT COUNT(*) AS c FROM (
      SELECT g.game_id, COUNT(s.team_id) AS starters_found
      FROM games g
      LEFT JOIN starters_current s ON g.game_id = s.game_id
      WHERE g.game_date = ?
      GROUP BY g.game_id
      HAVING starters_found < 2
    )
  `, slateDate);

  const teamMismatch = await countScalar(env, `
    SELECT COUNT(*) AS c
    FROM starters_current s
    JOIN games g ON s.game_id = g.game_id
    WHERE g.game_date = ?
      AND s.team_id NOT IN (g.away_team, g.home_team)
  `, slateDate);

  const duplicateStarters = await countScalar(env, `
    SELECT COUNT(*) AS c FROM (
      SELECT starter_name
      FROM starters_current
      WHERE game_id LIKE ?
      GROUP BY starter_name
      HAVING COUNT(*) > 1
    )
  `, `${slateDate}_%`);

  const stalePairs = await countScalar(env, `
    SELECT COUNT(*) AS c
    FROM starters_current
    WHERE game_id LIKE ?
      AND (
        (starter_name='Justin Verlander' AND team_id IN ('HOU','NYM'))
        OR (starter_name='Chris Sale' AND team_id IN ('BOS','CHW'))
        OR (starter_name='Corbin Burnes' AND team_id='MIL')
        OR (starter_name='Clayton Kershaw' AND team_id='LAD')
        OR (starter_name='Max Scherzer' AND team_id IN ('NYM','TEX','WSN'))
        OR (starter_name='Zack Greinke' AND team_id IN ('KC','HOU','ARI','LAD'))
      )
  `, `${slateDate}_%`);

  const statsMissing = await countScalar(env, `
    SELECT COUNT(*) AS c
    FROM starters_current
    WHERE game_id LIKE ?
      AND (
        era IS NULL OR era <= 0
        OR whip IS NULL OR whip <= 0
        OR strikeouts IS NULL OR strikeouts <= 0
        OR innings_pitched IS NULL OR innings_pitched <= 0
      )
  `, `${slateDate}_%`);

  const expectedStarters = games * 2;
  const success = games > 0 && startersTotal === expectedStarters && bullpensTotal === expectedStarters && badRows === 0 && missingGames === 0 && teamMismatch === 0 && duplicateStarters === 0 && stalePairs === 0;

  return {
    ok: success,
    status: success ? "SUCCESS" : "FAILED_AUDIT",
    slate_date: slateDate,
    slate_mode: slate.slate_mode,
    games,
    expected_starters: expectedStarters,
    starters_total: startersTotal,
    bullpens_total: bullpensTotal,
    lineups_total: null,
    recent_usage_total: null,
    players_total: null,
    players_layer_mode: "separate_buttons_to_avoid_worker_request_limit",
    groups_run: groupsRun,
    group_plan: groupPlan,
    bad_rows: badRows,
    missing_games: missingGames,
    team_mismatch: teamMismatch,
    duplicate_starters: duplicateStarters,
    stale_pairs: stalePairs,
    stats_missing: statsMissing,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    steps
  };
}



const MLB_TEAM_ABBR = {
  109: "ARI", 144: "ATL", 110: "BAL", 111: "BOS", 112: "CHC", 113: "CIN",
  114: "CLE", 115: "COL", 145: "CWS", 116: "DET", 117: "HOU", 118: "KC",
  108: "LAA", 119: "LAD", 146: "MIA", 158: "MIL", 142: "MIN", 121: "NYM",
  147: "NYY", 133: "OAK", 143: "PHI", 134: "PIT", 135: "SD", 136: "SEA",
  137: "SFG", 138: "STL", 139: "TB", 140: "TEX", 141: "TOR", 120: "WSN"
};

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
    const res = await fetch(url, { headers: { "accept": "application/json" } });
    if (!res.ok) continue;

    const data = await res.json();
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
    confidence: "official_probable"
  };
}

async function fetchMlbScheduleProbables(slateDate) {
  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(slateDate)}&hydrate=probablePitcher(stats(group=[pitching],type=[season]))`;
  const res = await fetch(url, { headers: { "accept": "application/json" } });
  if (!res.ok) throw new Error(`MLB schedule fetch failed: ${res.status}`);
  return await res.json();
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
  const res = await fetch(url, { headers: { "accept": "application/json" } });
  if (!res.ok) return [];
  const data = await res.json();
  const games = [];
  for (const d of (data.dates || [])) for (const g of (d.games || [])) games.push(g);
  return games;
}

async function fetchMlbBoxscore(gamePk) {
  const res = await fetch(`https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`, { headers: { "accept": "application/json" } });
  if (!res.ok) return null;
  return await res.json();
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

  const schedule = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(slateDate)}`, {
    headers: { "accept": "application/json" }
  });
  const scheduleJson = schedule.ok ? await schedule.json() : { dates: [] };

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
  if (group === 1) {
    await env.DB.prepare("DELETE FROM players_current").run();
  }
  const rows = [];

  for (const t of selectedTeams) {
    const r = await fetch(`https://statsapi.mlb.com/api/v1/teams/${encodeURIComponent(t.mlbId)}/roster?rosterType=active&hydrate=person(stats(group=[hitting,pitching],type=[season],season=${encodeURIComponent(String(slateDate).slice(0,4))}))`, {
      headers: { "accept": "application/json" }
    });
    if (!r.ok) continue;
    const rosterJson = await r.json();
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

  const validated = validateRows("players_current", rowsToWrite);
  if (!validated.ok) throw new Error(`MLB player identity validation failed: ${validated.error}`);
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
    fetched_rows: deduped.length,
    written_rows: inserted,
    deferred_rows: deferred,
    write_cap: maxWrites,
    inserted: { players_current: inserted },
    skipped_count: validated.skipped?.length || 0,
    skipped: (validated.skipped || []).slice(0, 20),
    complete: deferred === 0
  };
}


async function syncMlbApiRecentUsage(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;
  const previousDate = addDaysISO(slateDate, -1);

  const slateGames = await env.DB.prepare("SELECT game_id, away_team, home_team FROM games WHERE game_date = ? ORDER BY game_id").bind(slateDate).all();
  const slateTeams = [...new Set((slateGames.results || []).flatMap(g => [g.away_team, g.home_team]))];

  const schedule = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(previousDate)}`, { headers: { "accept": "application/json" } });
  const scheduleJson = schedule.ok ? await schedule.json() : { dates: [] };

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
    slate_date: slateDate,
    source: "mlb_statsapi_boxscore_lineup",
    games_checked: gamesChecked,
    fetched_rows: rows.length,
    inserted: { lineups_current: inserted },
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

  const schedule = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(previousDate)}`, { headers: { "accept": "application/json" } });
  const scheduleJson = schedule.ok ? await schedule.json() : { dates: [] };

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

  const validated = validateRows("starters_current", rows);
  if (!validated.ok) throw new Error(`MLB starter validation failed: ${validated.error}`);
  const inserted = await upsertRows(env, "starters_current", validated.rows);

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
    source: "mlb_statsapi_schedule_probablePitcher_people_stats",
    fetched_rows: rows.length,
    stats_filled: statsFilled,
    stats_missing: validated.rows.length - statsFilled,
    inserted: { starters_current: inserted },
    skipped_count: validated.skipped?.length || 0,
    skipped: (validated.skipped || []).slice(0, 20)
  };
}


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

  for (const row of rows) {
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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
  const generationConfig = options.scrape
    ? { temperature: 0, topP: 0, maxOutputTokens: 8192, responseMimeType: "application/json" }
    : { temperature: 0, topP: 0, maxOutputTokens: 8192 };

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
