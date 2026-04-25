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
  scrape_recent_usage: {
    prompt: "scrape_recent_usage_v1.txt",
    tables: ["player_recent_usage"],
    note: "recent usage only"
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
    conflict: ["player_name"]
  },
  player_recent_usage: {
    allowed: ["player_name", "team_id", "last_pitch_count", "last_innings", "days_rest", "last_game_ab", "last_game_hits", "lineup_slot", "source", "confidence"],
    required: ["player_name"],
    conflict: ["player_name"]
  }
};


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
  const job = event?.cron === "0 12 * * *" ? "scrape_games_markets" : "scrape_games_markets";
  await runJob({ job, cron: event?.cron || null }, env);
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

async function handleTaskRun(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();
  const body = await safeJson(request);
  const slate = resolveSlateDate(body || {});
  const result = await runJob({ ...(body || {}), slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  return Response.json(result, { status: result.ok ? 200 : 500 });
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

    for (const table of job.tables) {
      const rows = Array.isArray(data[table]) ? data[table] : [];
      const validated = validateRows(table, rows);
      if (!validated.ok) throw new Error(`${table} validation failed: ${validated.error}`);
      results[table] = await upsertRows(env, table, validated.rows);
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
