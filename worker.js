// RBI BUILDER ACTIVE
const PRIMARY_MODEL = "gemini-2.5-pro";
const FALLBACK_MODEL = "gemini-2.5-flash";
const SCRAPE_MODEL = "gemini-2.5-flash";
const SCRAPE_FALLBACK_MODEL = "gemini-2.5-pro";

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
      if (url.pathname === "/debug/sql" && request.method === "POST") return await handleDebugSQL(request, env);
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
    worker: "alphadog-phase3-starter-groups",
    db_bound: !!env.DB,
    ingest_token_bound: !!env.INGEST_TOKEN,
    gemini_key_bound: !!env.GEMINI_API_KEY,
    prompt_base_url_bound: !!env.PROMPT_BASE_URL,
    jobs: Object.keys(JOBS),
    time: new Date().toISOString()
  };
}

async function runScheduled(event, env) {
  const taskId = crypto.randomUUID();
  const input = { job: "run_full_pipeline", cron: event?.cron || null, slate_mode: "AUTO", trigger: "scheduled" };

  await env.DB.prepare(`
    INSERT INTO task_runs (task_id, job_name, status, started_at, input_json)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
  `).bind(taskId, "run_full_pipeline", "running", JSON.stringify(input)).run();

  try {
    const result = await runFullPipeline(input, env);
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

async function handleDebugSQL(request, env) {
  if (!isAuthorized(request, env)) return json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = await safeJson(request);
    const sql = String(body?.sql || "").trim();
    if (!sql) return json({ ok: false, error: "Missing SQL" }, { status: 400 });

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
        outputs.push({ sql: statement, rows: result.results || [], meta: result.meta || {} });
      } else if (upper.startsWith("DELETE") || upper.startsWith("UPDATE") || upper.startsWith("INSERT")) {
        const result = await env.DB.prepare(statement).run();
        outputs.push({ sql: statement, success: result.success, meta: result.meta || {} });
      } else {
        return json({ ok: false, error: `SQL command not allowed: ${statement.slice(0, 40)}` }, { status: 400 });
      }
    }

    return json({ ok: true, outputs });
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



async function executeTaskJob(jobName, body, slate, env) {
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
