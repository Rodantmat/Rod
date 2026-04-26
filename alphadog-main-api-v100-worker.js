const WORKER_VERSION = "alphadog-main-api-v100.1 - Schema Column Alignment";
const DEFAULT_SLATE_DATE = "2026-04-25";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization"
    }
  });
}

function safeText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function normalizeDateFromRequest(request) {
  const url = new URL(request.url);
  return url.searchParams.get("slate_date") || DEFAULT_SLATE_DATE;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (_err) {
    return {};
  }
}

async function one(db, sql, bindings = []) {
  const stmt = db.prepare(sql);
  const bound = bindings.length ? stmt.bind(...bindings) : stmt;
  return await bound.first();
}

async function all(db, sql, bindings = []) {
  const stmt = db.prepare(sql);
  const bound = bindings.length ? stmt.bind(...bindings) : stmt;
  const res = await bound.all();
  return res.results || [];
}

async function countTable(db, tableName, whereSql = "", bindings = []) {
  try {
    const row = await one(db, `SELECT COUNT(*) AS value FROM ${tableName} ${whereSql}`, bindings);
    return Number(row?.value || 0);
  } catch (err) {
    return { error: err?.message || String(err) };
  }
}

async function handleDebugRoutes() {
  return jsonResponse({
    ok: true,
    worker: "alphadog-main-api-v100",
    version: WORKER_VERSION,
    purpose: "isolated_main_app_read_only_api",
    no_cron: true,
    no_scheduled_handler: true,
    no_task_runner: true,
    no_candidate_builders: true,
    no_scraping: true,
    no_manual_sql: true,
    no_d1_writes: true,
    routes: [
      "GET /main/debug/routes",
      "GET /main/health?slate_date=YYYY-MM-DD",
      "POST /main/packet/leg",
      "POST /main/score/leg"
    ]
  });
}

async function handleMainHealth(request, env) {
  const slateDate = normalizeDateFromRequest(request);
  const gamePrefix = `${slateDate}_%`;

  const checks = [];
  async function addCheck(name, tableName, whereSql = "", bindings = [], passFn = v => v > 0) {
    const value = await countTable(env.DB, tableName, whereSql, bindings);
    if (typeof value === "object" && value.error) {
      checks.push({ check: name, value: null, status: "ERROR", ok: false, error: value.error });
      return;
    }
    const ok = passFn(Number(value));
    checks.push({ check: name, value: Number(value), status: ok ? "PASS" : "REVIEW", ok, error: null });
  }

  await addCheck("GAMES_TODAY", "games", "WHERE game_id LIKE ?", [gamePrefix], v => v > 0);
  await addCheck("STARTERS_TODAY", "starters_current", "WHERE game_id LIKE ?", [gamePrefix], v => v >= 20);
  await addCheck("LINEUPS_TODAY", "lineups_current", "WHERE game_id LIKE ?", [gamePrefix], v => v >= 100);
  await addCheck("BULLPENS_TODAY", "bullpens_current", "WHERE game_id LIKE ?", [gamePrefix], v => v >= 20);
  await addCheck("MARKETS_TODAY", "markets_current", "WHERE game_id LIKE ?", [gamePrefix], v => v > 0);
  await addCheck("PLAYERS_CURRENT", "players_current", "", [], v => v >= 700);
  await addCheck("RFI_CANDIDATES", "edge_candidates_rfi", "WHERE slate_date = ?", [slateDate], v => v > 0);
  await addCheck("RBI_CANDIDATES", "edge_candidates_rbi", "", [], v => v > 0);
  await addCheck("HITS_CANDIDATES", "edge_candidates_hits", "", [], v => v > 0);

  const pass = checks.filter(c => c.ok).length;
  const error = checks.filter(c => c.status === "ERROR").length;
  const review = checks.filter(c => c.status === "REVIEW").length;
  const ok = error === 0 && review === 0;

  return jsonResponse({
    ok,
    version: WORKER_VERSION,
    worker: "alphadog-main-api-v100",
    job: "main_health_read_only",
    slate_date: slateDate,
    status: ok ? "pass" : "review",
    table_checks: checks,
    summary: {
      pass,
      review,
      error,
      total: checks.length
    },
    note: "Read-only main app health. No cron, no task runner, no candidate logic, no database writes."
  });
}

function normalizeFamily(propType) {
  const raw = safeText(propType).toLowerCase();
  if (raw.includes("hit")) return "HITS";
  if (raw.includes("rbi") || raw.includes("batted")) return "RBI";
  if (raw.includes("rfi") || raw.includes("first inning")) return "RFI";
  if (raw.includes("strikeout") || raw === "ks" || raw.includes(" k")) return "KS";
  return "UNKNOWN";
}

async function findGame(env, slateDate, teamId, opponentTeam) {
  const like = `${slateDate}_%`;
  return await one(env.DB, `
    SELECT * FROM games
    WHERE game_id LIKE ?
      AND ((away_team = ? AND home_team = ?) OR (away_team = ? AND home_team = ?))
    ORDER BY game_id DESC
    LIMIT 1
  `, [like, teamId, opponentTeam, opponentTeam, teamId]);
}

async function findMarket(env, gameId) {
  if (!gameId) return null;
  return await one(env.DB, `SELECT * FROM markets_current WHERE game_id = ? LIMIT 1`, [gameId]);
}

async function findPlayer(env, playerName, teamId) {
  const name = safeText(playerName).trim();
  if (!name) return null;
  return await one(env.DB, `
    SELECT * FROM players_current
    WHERE LOWER(player_name) = LOWER(?)
       OR (LOWER(player_name) LIKE LOWER(?) AND team_id = ?)
    ORDER BY CASE WHEN team_id = ? THEN 0 ELSE 1 END
    LIMIT 1
  `, [name, `%${name}%`, teamId, teamId]);
}

async function findLineup(env, slateDate, playerName, teamId, gameId) {
  const name = safeText(playerName).trim();
  if (!name) return null;
  if (gameId) {
    const exact = await one(env.DB, `
      SELECT * FROM lineups_current
      WHERE game_id = ? AND team_id = ? AND LOWER(player_name) = LOWER(?)
      LIMIT 1
    `, [gameId, teamId, name]);
    if (exact) return exact;
  }
  return await one(env.DB, `
    SELECT * FROM lineups_current
    WHERE game_id LIKE ? AND team_id = ? AND LOWER(player_name) = LOWER(?)
    ORDER BY game_id DESC
    LIMIT 1
  `, [`${slateDate}_%`, teamId, name]);
}

async function findStarter(env, gameId, opponentTeam) {
  if (!gameId) return null;
  return await one(env.DB, `
    SELECT * FROM starters_current
    WHERE game_id = ? AND team_id = ?
    LIMIT 1
  `, [gameId, opponentTeam]);
}

async function findBullpen(env, gameId, opponentTeam) {
  if (!gameId) return null;
  return await one(env.DB, `
    SELECT * FROM bullpens_current
    WHERE game_id = ? AND team_id = ?
    LIMIT 1
  `, [gameId, opponentTeam]);
}

async function findRecentUsage(env, playerName, teamId) {
  const name = safeText(playerName).trim();
  if (!name) return null;
  try {
    return await one(env.DB, `
      SELECT * FROM player_recent_usage
      WHERE LOWER(player_name) = LOWER(?) AND team_id = ?
      ORDER BY game_date DESC
      LIMIT 5
    `, [name, teamId]);
  } catch (_err) {
    return null;
  }
}

async function findCandidate(env, family, playerName, teamId, gameId, slateDate) {
  try {
    if (family === "HITS") {
      return await one(env.DB, `
        SELECT * FROM edge_candidates_hits
        WHERE LOWER(player_name) = LOWER(?) AND team_id = ?
        ORDER BY candidate_tier ASC
        LIMIT 1
      `, [playerName, teamId]);
    }
    if (family === "RBI") {
      return await one(env.DB, `
        SELECT * FROM edge_candidates_rbi
        WHERE LOWER(player_name) = LOWER(?) AND team_id = ?
        ORDER BY candidate_tier ASC
        LIMIT 1
      `, [playerName, teamId]);
    }
    if (family === "RFI") {
      return await one(env.DB, `
        SELECT * FROM edge_candidates_rfi
        WHERE slate_date = ? AND game_id = ?
        LIMIT 1
      `, [slateDate, gameId]);
    }
  } catch (_err) {
    return null;
  }
  return null;
}

function buildMissing(packet) {
  const missing = [];
  if (!packet.game) missing.push("game");
  if (!packet.player) missing.push("player");
  if (!packet.market) missing.push("market");
  if (!packet.lineup) missing.push("lineup");
  if (!packet.opposing_starter) missing.push("opposing_starter");
  if (!packet.candidate) missing.push("candidate");
  return missing;
}

async function buildLegPacket(payload, env) {
  const slateDate = payload.slate_date || DEFAULT_SLATE_DATE;
  const playerName = safeText(payload.player_name || payload.player_id_hint || payload.parsedPlayer).trim();
  const teamId = safeText(payload.team_id || payload.team).trim().toUpperCase();
  const opponentTeam = safeText(payload.opponent_team || payload.opponent).trim().toUpperCase();
  const propType = safeText(payload.prop_type || payload.prop).trim();
  const family = safeText(payload.prop_family || payload.family || normalizeFamily(propType)).toUpperCase();

  const game = await findGame(env, slateDate, teamId, opponentTeam);
  const gameId = game?.game_id || payload.game_id || null;
  const market = await findMarket(env, gameId);
  const player = await findPlayer(env, playerName, teamId);
  const lineup = await findLineup(env, slateDate, playerName, teamId, gameId);
  const opposingStarter = await findStarter(env, gameId, opponentTeam);
  const bullpen = await findBullpen(env, gameId, opponentTeam);
  const recentUsage = await findRecentUsage(env, playerName, teamId);
  const candidate = await findCandidate(env, family, playerName, teamId, gameId, slateDate);

  const packet = {
    ok: true,
    source: "alphadog-main-api-v100",
    mode: "read_only_d1_packet",
    slate_date: slateDate,
    leg: {
      leg_id: payload.leg_id || null,
      row_index: payload.row_index || null,
      player_name: playerName,
      team_id: teamId,
      opponent_team: opponentTeam,
      prop_type: propType,
      prop_family: family,
      line: payload.line ?? null,
      side: payload.side || payload.direction || null,
      game_time_text: payload.game_time_text || null
    },
    game,
    game_id: gameId,
    market,
    player,
    lineup,
    opposing_starter: opposingStarter,
    bullpen,
    recent_usage: recentUsage,
    candidate,
    derived_flags: [],
    warnings: [],
    raw_payload: payload
  };

  packet.missing = buildMissing(packet);
  if (packet.missing.length) packet.warnings.push(`Missing packet sections: ${packet.missing.join(", ")}`);
  if (family === "UNKNOWN") packet.warnings.push("Unsupported or unknown prop family");

  return packet;
}

async function handlePacketLeg(request, env) {
  const payload = await readJson(request);
  const packet = await buildLegPacket(payload, env);
  return jsonResponse(packet);
}

function scoreFromCandidate(packet) {
  const family = packet.leg.prop_family;
  const candidate = packet.candidate;
  let base = 50;
  let verdict = "WATCHLIST";
  let confidence = "LOW";
  const reasons = [];

  if (candidate) {
    const tier = safeText(candidate.candidate_tier).toUpperCase();
    if (["A_POOL", "YES_RFI"].includes(tier)) {
      base = 72;
      verdict = family === "RFI" ? "YES_RFI_CANDIDATE" : "QUALIFIED_CANDIDATE";
      confidence = "MEDIUM";
      reasons.push(`Candidate tier ${tier}`);
    } else if (["B_POOL", "LEAN_YES"].includes(tier)) {
      base = 63;
      verdict = family === "RFI" ? "LEAN_YES_CANDIDATE" : "SECONDARY_CANDIDATE";
      confidence = "LOW_MEDIUM";
      reasons.push(`Candidate tier ${tier}`);
    } else {
      base = 55;
      reasons.push(`Candidate tier ${tier || "UNKNOWN"}`);
    }
  } else {
    reasons.push("No candidate row found for this leg/family");
  }

  const missingPenalty = Math.min(packet.missing.length * 4, 20);
  const finalScore = Math.max(0, Math.min(100, base - missingPenalty));
  const hitProbability = Math.max(0, Math.min(99, Math.round(finalScore * 0.82)));

  if (packet.missing.length >= 4) {
    confidence = "LOW";
    verdict = "DATA_REVIEW";
  }

  return {
    ok: true,
    source: "alphadog-main-api-v100",
    mode: "read_only_candidate_adapter_placeholder",
    family,
    final_score: finalScore,
    hit_probability: hitProbability,
    confidence,
    verdict,
    formula_source: "candidate-tier adapter placeholder; not betting advice; no Gemini call",
    warnings: packet.warnings || [],
    missing: packet.missing || [],
    reasons,
    factor_scores: {
      identity: packet.player ? 1 : 0,
      trend: packet.recent_usage ? 1 : 0,
      matchup: packet.opposing_starter ? 1 : 0,
      role_usage: packet.lineup ? 1 : 0,
      market: packet.market ? 1 : 0,
      environment: packet.game ? 1 : 0,
      risk: packet.missing.length
    },
    note: "This is the first read-only score adapter. It proves wiring and maps candidate/packet data without touching scheduled tasks."
  };
}

async function handleScoreLeg(request, env) {
  const payload = await readJson(request);
  const packet = await buildLegPacket(payload, env);
  const score = scoreFromCandidate(packet);
  return jsonResponse({
    ok: true,
    version: WORKER_VERSION,
    packet,
    score
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return jsonResponse({ ok: true });

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";

    try {
      if (request.method === "GET" && path === "/main/debug/routes") return await handleDebugRoutes();
      if (request.method === "GET" && path === "/main/health") return await handleMainHealth(request, env);
      if (request.method === "POST" && path === "/main/packet/leg") return await handlePacketLeg(request, env);
      if (request.method === "POST" && path === "/main/score/leg") return await handleScoreLeg(request, env);

      return jsonResponse({
        ok: false,
        error: "Not found",
        worker: "alphadog-main-api-v100",
        available_routes: [
          "GET /main/debug/routes",
          "GET /main/health?slate_date=YYYY-MM-DD",
          "POST /main/packet/leg",
          "POST /main/score/leg"
        ]
      }, 404);
    } catch (err) {
      return jsonResponse({
        ok: false,
        worker: "alphadog-main-api-v100",
        error: err?.message || String(err),
        stack: err?.stack || null
      }, 500);
    }
  }
};
