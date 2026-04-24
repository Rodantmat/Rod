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
    gameDate: "2026-04-24",
    gameGroupIndex: 0,
    gameGroupSize: 5
  },
  scrape_starters_group_2: {
    prompt: "scrape_starters_group_v1.txt",
    tables: ["starters_current"],
    note: "starter profile group 2",
    gameDate: "2026-04-24",
    gameGroupIndex: 1,
    gameGroupSize: 5
  },
  scrape_starters_group_3: {
    prompt: "scrape_starters_group_v1.txt",
    tables: ["starters_current"],
    note: "starter profile group 3",
    gameDate: "2026-04-24",
    gameGroupIndex: 2,
    gameGroupSize: 5
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

    const statements = sql
      .split(";")
      .map(s => s.trim())
      .filter(Boolean);

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
  const result = await runJob(body || {}, env);
  return Response.json(result, { status: result.ok ? 200 : 500 });
}

async function runJob(input, env) {
  const jobName = input.job || "scrape_games_markets";
  const job = JOBS[jobName];
  if (!job) return { ok: false, error: `Unknown job: ${jobName}`, valid_jobs: Object.keys(JOBS) };

  const taskId = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO task_runs (task_id, job_name, status, started_at, input_json) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`)
    .bind(taskId, jobName, "running", JSON.stringify(input)).run();

  try {
    const basePrompt = await fetchPrompt(env, job.prompt);
    const prompt = await augmentPromptForJob(env, jobName, job, basePrompt);
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
    return { ok: true, task_id: taskId, job: jobName, prompt: job.prompt, inserted: results };
  } catch (err) {
    await env.DB.prepare(`UPDATE task_runs SET status=?, finished_at=CURRENT_TIMESTAMP, error=? WHERE task_id=?`)
      .bind("failed", String(err?.message || err), taskId).run();
    return { ok: false, task_id: taskId, job: jobName, error: String(err?.message || err) };
  }
}

async function augmentPromptForJob(env, jobName, job, basePrompt) {
  if (job.gameGroupIndex === undefined || job.gameGroupIndex === null) return basePrompt;

  const date = job.gameDate || "2026-04-24";
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

async function handleUpsert(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();
  const body = await safeJson(request);
  const table = body?.table;
  const rows = Array.isArray(body?.rows) ? body.rows : [];
  if (!TABLES[table]) return Response.json({ ok: false, error: "Table not allowed" }, { status: 400 });
  const validated = validateRows(table, rows);
  if (!validated.ok) return Response.json({ ok: false, error: validated.error }, { status: 400 });
  const inserted = await upsertRows(env, table, validated.rows);
  return Response.json({ ok: true, table, inserted });
}

function validateRows(table, rows) {
  const config = TABLES[table];
  if (!config) return { ok: false, error: `Unknown table ${table}` };
  if (!Array.isArray(rows)) return { ok: false, error: "rows must be array" };
  const cleaned = [];
  const skipped = [];

  for (let i = 0; i < rows.length; i++) {
    const row = normalizeRow(table, rows[i] || {});

    if (row.away_team_id !== undefined || row.home_team_id !== undefined) {
      return { ok: false, error: `row ${i} uses forbidden away_team_id/home_team_id` };
    }

    let missingRequired = false;
    for (const required of config.required) {
      if (row[required] === undefined || row[required] === null || row[required] === "") {
        skipped.push({ row: i, reason: `missing required ${required}` });
        missingRequired = true;
      }
    }
    if (missingRequired) continue;

    if (row.game_id !== undefined && !validGameId(row.game_id)) {
      skipped.push({ row: i, reason: `malformed game_id ${row.game_id}` });
      continue;
    }
    if (row.game_date !== undefined && !String(row.game_date).startsWith("2026-")) {
      skipped.push({ row: i, reason: `invalid game_date ${row.game_date}` });
      continue;
    }
    if (row.team_id !== undefined && !validTeamId(row.team_id)) {
      skipped.push({ row: i, reason: `invalid team_id ${row.team_id}` });
      continue;
    }
    if (row.away_team !== undefined && !validTeamId(row.away_team)) {
      skipped.push({ row: i, reason: `invalid away_team ${row.away_team}` });
      continue;
    }
    if (row.home_team !== undefined && !validTeamId(row.home_team)) {
      skipped.push({ row: i, reason: `invalid home_team ${row.home_team}` });
      continue;
    }
    if (row.slot !== undefined) {
      const n = Number(row.slot);
      if (!Number.isInteger(n) || n < 1 || n > 9) {
        skipped.push({ row: i, reason: `invalid slot ${row.slot}` });
        continue;
      }
    }

    if (table === "teams_current" && !hasAnyValue(row, ["avg", "obp", "slg", "ops", "k_rate", "runs_per_game"])) {
      skipped.push({ row: i, reason: `team shell row rejected ${row.team_id}` });
      continue;
    }

    if (table === "starters_current" && !hasAllValues(row, ["era", "whip", "strikeouts", "innings_pitched"])) {
      skipped.push({ row: i, reason: `starter missing core stats rejected ${row.game_id}/${row.team_id}` });
      continue;
    }

    if (table === "starters_current" && (
      !validPositiveNumber(row.era) ||
      !validPositiveNumber(row.whip) ||
      !validPositiveNumber(row.strikeouts) ||
      !validPositiveNumber(row.innings_pitched)
    )) {
      skipped.push({ row: i, reason: `starter zero/invalid core stats rejected ${row.game_id}/${row.team_id}` });
      continue;
    }

    if (table === "starters_current" && looksLikePlaceholderStarter(row.starter_name)) {
      skipped.push({ row: i, reason: `placeholder starter rejected ${row.game_id}/${row.team_id}/${row.starter_name}` });
      continue;
    }

    const out = {};
    for (const col of config.allowed) if (row[col] !== undefined) out[col] = row[col];
    if (config.allowed.includes("source") && out.source === undefined) out.source = "gemini_split_job";
    if (config.allowed.includes("confidence") && out.confidence === undefined) out.confidence = "low";
    cleaned.push(out);
  }

  if (!cleaned.length && rows.length) {
    return { ok: false, error: `all ${table} rows rejected: ${JSON.stringify(skipped).slice(0, 900)}` };
  }
  return { ok: true, rows: cleaned, skipped };
}


function looksLikePlaceholderStarter(name) {
  const n = String(name || "").trim().toUpperCase();
  if (!n) return true;
  const badExact = new Set([
    "ACE",
    "STARTER",
    "PROBABLE STARTER",
    "TBD",
    "TBA",
    "UNKNOWN",
    "TEAM ACE",
    "HOME ACE",
    "AWAY ACE"
  ]);
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

function normalizeRow(table, input) {
  const row = { ...input };
  for (const key of ["team_id", "away_team", "home_team"]) {
    if (row[key] !== undefined && row[key] !== null) row[key] = canonicalTeamId(row[key]);
  }
  if (row.game_id !== undefined && row.game_id !== null) row.game_id = canonicalGameId(row.game_id);
  if (row.throws !== undefined && row.throws !== null) row.throws = normalizeHand(row.throws);
  return row;
}

function canonicalTeamId(value) {
  const raw = String(value || "").trim().toUpperCase();
  const aliases = { CHW: "CWS", KCR: "KC", SDP: "SD", SF: "SFG", TBR: "TB", WSH: "WSN" };
  return aliases[raw] || raw;
}

function canonicalGameId(value) {
  const raw = String(value || "").trim().toUpperCase();
  const parts = raw.split("_");
  if (parts.length !== 3) return raw;
  return `${parts[0]}_${canonicalTeamId(parts[1])}_${canonicalTeamId(parts[2])}`;
}

function normalizeHand(value) {
  const raw = String(value || "").trim().toUpperCase();
  if (raw === "RIGHT" || raw === "RHP") return "R";
  if (raw === "LEFT" || raw === "LHP") return "L";
  return raw === "R" || raw === "L" ? raw : null;
}

function hasAnyValue(row, keys) {
  return keys.some(k => row[k] !== undefined && row[k] !== null && row[k] !== "");
}

function hasAllValues(row, keys) {
  return keys.every(k => row[k] !== undefined && row[k] !== null && row[k] !== "");
}

function validGameId(gameId) {
  return /^2026-\d{2}-\d{2}_[A-Z]{2,3}_[A-Z]{2,3}$/.test(String(gameId));
}

function validTeamId(teamId) {
  return /^[A-Z]{2,3}$/.test(String(teamId));
}

async function upsertRows(env, table, rows) {
  if (!rows.length) return 0;
  const config = TABLES[table];
  let inserted = 0;

  for (const row of rows) {
    const cols = config.allowed.filter(c => row[c] !== undefined);
    if (!cols.length) continue;

    if (config.deleteInsert) {
      const where = config.conflict.map(c => `${c}=?`).join(" AND ");
      await env.DB.prepare(`DELETE FROM ${table} WHERE ${where}`).bind(...config.conflict.map(c => row[c])).run();
      const placeholders = cols.map(() => "?").join(",");
      const sql = `INSERT INTO ${table} (${cols.join(",")}) VALUES (${placeholders})`;
      await env.DB.prepare(sql).bind(...cols.map(c => row[c])).run();
      inserted++;
      continue;
    }

    const placeholders = cols.map(() => "?").join(",");
    const conflict = config.conflict.join(",");
    const updates = cols.filter(c => !config.conflict.includes(c)).map(c => `${c}=excluded.${c}`);
    const updateClause = updates.length ? `DO UPDATE SET ${updates.join(",")}` : "DO NOTHING";
    const sql = `INSERT INTO ${table} (${cols.join(",")}) VALUES (${placeholders}) ON CONFLICT(${conflict}) ${updateClause}`;
    await env.DB.prepare(sql).bind(...cols.map(c => row[c])).run();
    inserted++;
  }
  return inserted;
}

async function handleLegPacket(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();
  const body = await safeJson(request);
  const result = await buildLegPacket(body, env);
  return Response.json(result, { status: result.ok ? 200 : (result.status || 400) });
}

async function buildLegPacket(body, env) {
  const playerName = body.player_name;
  const teamId = body.team_id;
  const gameId = body.game_id;
  const propType = body.prop_type;
  const line = body.line;
  const side = body.side;
  if (!playerName || !teamId || !gameId || !propType) return { ok: false, status: 400, error: "Missing required fields: player_name, team_id, game_id, prop_type" };

  const game = await env.DB.prepare(`SELECT * FROM games WHERE game_id = ?`).bind(gameId).first();
  if (!game) return { ok: false, status: 404, error: "Game not found" };

  const opponentTeam = teamId === game.away_team ? game.home_team : teamId === game.home_team ? game.away_team : null;
  if (!opponentTeam) return { ok: false, status: 400, error: "team_id does not match game away_team or home_team" };

  const player = await env.DB.prepare(`SELECT * FROM players_current WHERE player_name = ?`).bind(playerName).first();
  const usage = await env.DB.prepare(`SELECT * FROM player_recent_usage WHERE player_name = ?`).bind(playerName).first();
  const market = await env.DB.prepare(`SELECT * FROM markets_current WHERE game_id = ?`).bind(gameId).first();
  const playerTeamProfile = await env.DB.prepare(`SELECT * FROM teams_current WHERE team_id = ?`).bind(teamId).first();
  const opponentTeamProfile = await env.DB.prepare(`SELECT * FROM teams_current WHERE team_id = ?`).bind(opponentTeam).first();
  const opponentStarter = await env.DB.prepare(`SELECT * FROM starters_current WHERE game_id = ? AND team_id = ?`).bind(gameId, opponentTeam).first();
  const opponentBullpen = await env.DB.prepare(`SELECT * FROM bullpens_current WHERE game_id = ? AND team_id = ?`).bind(gameId, opponentTeam).first();
  const lineup = await env.DB.prepare(`SELECT * FROM lineups_current WHERE game_id = ? AND team_id = ? ORDER BY slot ASC`).bind(gameId, opponentTeam).all();

  return {
    ok: true,
    leg: { player_name: playerName, team_id: teamId, opponent_team: opponentTeam, game_id: gameId, prop_type: propType, line, side },
    packet: {
      player,
      usage,
      game,
      market,
      player_team_profile: playerTeamProfile,
      opponent_team_profile: opponentTeamProfile,
      opponent_starter: opponentStarter,
      opponent_bullpen: opponentBullpen,
      opponent_lineup: lineup.results || []
    }
  };
}

async function handleScoreLeg(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();
  const body = await safeJson(request);
  const packetResult = await buildLegPacket(body, env);
  if (!packetResult.ok) return Response.json(packetResult, { status: packetResult.status || 400 });
  const prompt = await buildScoringPromptFromRemote(packetResult, env);
  let modelUsed = PRIMARY_MODEL;
  let modelResult;
  try {
    modelResult = await callGemini(env, PRIMARY_MODEL, prompt, { scrape: false });
  } catch (err) {
    modelUsed = FALLBACK_MODEL;
    modelResult = await callGemini(env, FALLBACK_MODEL, prompt, { scrape: false });
  }
  return Response.json({ ok: true, model_used: modelUsed, leg: packetResult.leg, packet: packetResult.packet, score_output: modelResult });
}

async function buildScoringPromptFromRemote(packetResult, env) {
  const fileName = promptFileForProp(packetResult.leg.prop_type);
  const template = await fetchPrompt(env, fileName);
  if (!template.includes("{{PACKET_JSON}}")) throw new Error(`Prompt file missing {{PACKET_JSON}} placeholder: ${fileName}`);
  return template.replace("{{PACKET_JSON}}", JSON.stringify(packetResult, null, 2));
}

function promptFileForProp(propType) {
  const normalized = String(propType || "").trim().toLowerCase();
  return PROMPT_FILES[normalized] || PROMPT_FILES.default;
}

async function fetchPrompt(env, fileName) {
  const base = String(env.PROMPT_BASE_URL || "").replace(/\/+$/, "");
  if (!base) throw new Error("Missing PROMPT_BASE_URL variable");
  const url = `${base}/${fileName}`;
  const res = await fetch(url, { headers: { "user-agent": "alphadog-worker" } });
  if (!res.ok) throw new Error(`Prompt fetch failed: ${res.status} ${url}`);
  return await res.text();
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
