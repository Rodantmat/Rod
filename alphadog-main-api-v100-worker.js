const WORKER_VERSION = "alphadog-main-api-v100.2 - Matrix Fill Cache Layer";
const DEFAULT_SLATE_DATE = "2026-04-25";
const SUPPLEMENTAL_TABLE = "main_supplemental_leg_cache";

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

function n(value, fallback = null) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function clamp(value, min = 0, max = 100) {
  const num = n(value, 0);
  return Math.max(min, Math.min(max, num));
}

function nowSql() {
  return new Date().toISOString();
}

function normalizeDateFromRequest(request) {
  const url = new URL(request.url);
  return url.searchParams.get("slate_date") || DEFAULT_SLATE_DATE;
}

async function readJson(request) {
  try { return await request.json(); } catch (_err) { return {}; }
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

async function run(db, sql, bindings = []) {
  const stmt = db.prepare(sql);
  const bound = bindings.length ? stmt.bind(...bindings) : stmt;
  return await bound.run();
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
    purpose: "isolated_main_app_api_matrix_fill_controlled_cache",
    no_cron: true,
    no_scheduled_handler: true,
    no_task_runner: true,
    no_candidate_builders: true,
    no_bulk_scraping: true,
    controlled_d1_writes: true,
    writes_only_to: [SUPPLEMENTAL_TABLE],
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

  let supplemental = { ok: true, table: SUPPLEMENTAL_TABLE, mode: "not_checked_until_first_leg_run" };
  try {
    const count = await countTable(env.DB, SUPPLEMENTAL_TABLE, "", []);
    supplemental = typeof count === "object" && count.error
      ? { ok: false, table: SUPPLEMENTAL_TABLE, rows: null, error: count.error, note: "Table will be created lazily on first leg packet if D1 allows it." }
      : { ok: true, table: SUPPLEMENTAL_TABLE, rows: count, error: null };
  } catch (err) {
    supplemental = { ok: false, table: SUPPLEMENTAL_TABLE, rows: null, error: err?.message || String(err) };
  }

  const pass = checks.filter(c => c.ok).length;
  const error = checks.filter(c => c.status === "ERROR").length;
  const review = checks.filter(c => c.status === "REVIEW").length;
  const ok = error === 0 && review === 0;

  return jsonResponse({
    ok,
    version: WORKER_VERSION,
    worker: "alphadog-main-api-v100",
    job: "main_health_matrix_fill_cache",
    slate_date: slateDate,
    status: ok ? "pass" : "review",
    table_checks: checks,
    supplemental_cache: supplemental,
    summary: { pass, review, error, total: checks.length },
    note: "Main API health. No cron, no task runner, no candidate builders. Controlled writes only to supplemental cache table."
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
  return await one(env.DB, `
    SELECT * FROM games
    WHERE game_id LIKE ?
      AND ((away_team = ? AND home_team = ?) OR (away_team = ? AND home_team = ?))
    ORDER BY game_id DESC
    LIMIT 1
  `, [`${slateDate}_%`, teamId, opponentTeam, opponentTeam, teamId]);
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
  return await one(env.DB, `SELECT * FROM starters_current WHERE game_id = ? AND team_id = ? LIMIT 1`, [gameId, opponentTeam]);
}

async function findBullpen(env, gameId, opponentTeam) {
  if (!gameId) return null;
  return await one(env.DB, `SELECT * FROM bullpens_current WHERE game_id = ? AND team_id = ? LIMIT 1`, [gameId, opponentTeam]);
}

async function findRecentUsage(env, playerName, teamId) {
  const name = safeText(playerName).trim();
  if (!name) return [];
  try {
    return await all(env.DB, `
      SELECT * FROM player_recent_usage
      WHERE LOWER(player_name) = LOWER(?) AND team_id = ?
      ORDER BY game_date DESC
      LIMIT 5
    `, [name, teamId]);
  } catch (_err) {
    return [];
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

function factor(key, label, value, score, source = "packet", status = null) {
  const s = value === null || value === undefined || value === "" || value === "MISSING" ? 0 : clamp(score);
  return { key, label, value: value === null || value === undefined || value === "" ? "MISSING" : value, score: Math.round(s), source, status: status || (s >= 80 ? "STRONG" : s >= 65 ? "REVIEW" : "RISK") };
}

function scoreLineupSlot(slot) {
  const s = n(slot, null);
  if (!s) return 0;
  if (s <= 1) return 94;
  if (s === 2) return 90;
  if (s === 3) return 86;
  if (s === 4) return 80;
  if (s === 5) return 74;
  if (s === 6) return 68;
  return 58;
}

function scoreAvg(avg) {
  const v = n(avg, null);
  if (v === null) return 0;
  if (v >= 0.280) return 90;
  if (v >= 0.250) return 80;
  if (v >= 0.230) return 70;
  return 58;
}

function scoreObp(obp) {
  const v = n(obp, null);
  if (v === null) return 0;
  if (v >= 0.370) return 90;
  if (v >= 0.340) return 82;
  if (v >= 0.315) return 72;
  return 58;
}

function scoreSlg(slg) {
  const v = n(slg, null);
  if (v === null) return 0;
  if (v >= 0.500) return 90;
  if (v >= 0.430) return 78;
  if (v >= 0.380) return 68;
  return 56;
}

function scoreStarterWhip(whip) {
  const v = n(whip, null);
  if (v === null) return 0;
  if (v >= 1.35) return 88;
  if (v >= 1.20) return 78;
  if (v >= 1.05) return 68;
  return 56;
}

function scoreStarterEra(era) {
  const v = n(era, null);
  if (v === null) return 0;
  if (v >= 4.50) return 86;
  if (v >= 3.75) return 76;
  if (v >= 3.00) return 68;
  return 58;
}

function scoreTier(tier) {
  const t = safeText(tier).toUpperCase();
  if (["A_POOL", "YES_RFI"].includes(t)) return 88;
  if (["B_POOL", "LEAN_YES"].includes(t)) return 72;
  if (["WATCHLIST"].includes(t)) return 62;
  return t ? 58 : 0;
}

function last5HitsString(recentUsage) {
  const rows = Array.isArray(recentUsage) ? recentUsage : [];
  const values = rows.map(r => n(r.hits ?? r.H ?? r.hit ?? r.last_game_hits, null)).filter(v => v !== null).slice(0, 5);
  return values.length ? values.join(" / ") : null;
}

function buildMatrixFactors(packet) {
  const p = packet.player || {};
  const c = packet.candidate || {};
  const l = packet.lineup || {};
  const st = packet.opposing_starter || {};
  const bp = packet.bullpen || {};
  const m = packet.market || {};
  const recent = Array.isArray(packet.recent_usage) ? packet.recent_usage : [];
  const last5 = last5HitsString(recent);
  const completeness = 100 - Math.min((packet.missing || []).length * 14, 70);
  const starterHitsPerIp = st.innings_pitched ? n(st.hits_allowed, 0) / Math.max(n(st.innings_pitched, 1), 1) : null;
  const starterHitsPerIpScore = starterHitsPerIp === null ? 0 : (starterHitsPerIp >= 1.10 ? 86 : starterHitsPerIp >= 0.90 ? 76 : starterHitsPerIp >= 0.75 ? 66 : 56);
  const bullpenFatigue = safeText(bp.fatigue || c.bullpen_fatigue_tier).toLowerCase();
  const bullpenScore = bullpenFatigue === "high" ? 78 : bullpenFatigue === "medium" ? 68 : bullpenFatigue === "low" ? 58 : 0;
  const lastGameHits = n(c.last_game_hits, null);
  const lastGameScore = lastGameHits === null ? 0 : lastGameHits >= 2 ? 86 : lastGameHits === 1 ? 74 : 58;

  return {
    identity: [
      factor("player_identity", "Player Identity", p.player_name || packet.leg.player_name, p.player_name ? 100 : 70, p.source || "payload"),
      factor("team_match", "Team / Opponent", `${packet.leg.team_id || "MISSING"} vs/@ ${packet.leg.opponent_team || "MISSING"}`, packet.game ? 100 : 65, "games"),
      factor("prop_family", "Prop Family", packet.leg.prop_family, packet.leg.prop_family !== "UNKNOWN" ? 92 : 0, "parser")
    ],
    trend: [
      factor("last5_hits", "Last 5 Hits", last5 || (lastGameHits !== null ? `Last game: ${lastGameHits}` : "MISSING"), last5 ? 81 : lastGameScore, last5 ? "player_recent_usage" : "candidate"),
      factor("season_avg", "Season AVG", p.avg ?? c.player_avg, scoreAvg(p.avg ?? c.player_avg), p.source || c.source),
      factor("season_obp", "Season OBP", p.obp ?? c.player_obp, scoreObp(p.obp ?? c.player_obp), p.source || c.source),
      factor("season_slg", "Season SLG", p.slg ?? c.player_slg, scoreSlg(p.slg ?? c.player_slg), p.source || c.source)
    ],
    matchup: [
      factor("opposing_starter", "Opposing Starter", st.starter_name || c.opposing_starter, (st.starter_name || c.opposing_starter) ? 90 : 0, st.source || c.source),
      factor("starter_throws", "Starter Hand", st.throws || c.opposing_throws, (st.throws || c.opposing_throws) ? 84 : 0, st.source || c.source),
      factor("starter_whip", "Starter WHIP", st.whip, scoreStarterWhip(st.whip), st.source),
      factor("starter_era", "Starter ERA", st.era, scoreStarterEra(st.era), st.source),
      factor("starter_hits_per_ip", "Starter H/IP", starterHitsPerIp === null ? "MISSING" : starterHitsPerIp.toFixed(2), starterHitsPerIpScore, st.source)
    ],
    role_usage: [
      factor("lineup_slot", "Lineup Slot", l.slot || c.lineup_slot, scoreLineupSlot(l.slot || c.lineup_slot), l.source || c.source),
      factor("lineup_confirmed", "Lineup Confirmed", l.is_confirmed ? "YES" : "NO / MISSING", l.is_confirmed ? 88 : 45, l.source),
      factor("role_type", "Role Type", p.role || "MISSING", p.role ? 86 : 0, p.source),
      factor("recent_ab_volume", "Recent AB Volume", c.last_game_ab !== undefined ? `Last game AB: ${c.last_game_ab}` : "MISSING", c.last_game_ab >= 4 ? 84 : c.last_game_ab >= 3 ? 74 : c.last_game_ab >= 1 ? 62 : 0, c.source)
    ],
    market: [
      factor("game_total", "Game Total", m.current_total ?? m.game_total, (m.current_total ?? m.game_total) ? 76 : 0, m.source),
      factor("implied_runs", "Team Implied Runs", packet.leg.team_id === packet.game?.home_team ? m.home_implied_runs : m.away_implied_runs, (m.home_implied_runs || m.away_implied_runs) ? 76 : 0, m.source),
      factor("market_source", "Market Source", m.source || "MISSING", m.source ? 66 : 0, m.confidence || "markets_current")
    ],
    environment: [
      factor("venue", "Venue / Park", packet.game?.venue || "MISSING", packet.game?.venue ? 84 : 0, "games"),
      factor("park_run_factor", "Park Run Factor", c.park_factor_run, c.park_factor_run ? 72 : 0, c.source),
      factor("park_hr_factor", "Park HR Factor", c.park_factor_hr, c.park_factor_hr ? 72 : 0, c.source),
      factor("bullpen_fatigue", "Opponent Bullpen Fatigue", bullpenFatigue || "MISSING", bullpenScore, bp.source || c.source)
    ],
    risk: [
      factor("packet_completeness", "Packet Completeness", (packet.missing || []).length ? `Missing: ${(packet.missing || []).join(", ")}` : "Complete", completeness, "packet"),
      factor("candidate_tier", "Candidate Tier", c.candidate_tier || "MISSING", scoreTier(c.candidate_tier), c.source),
      factor("lineup_context", "Lineup Context", c.lineup_context_status || "MISSING", c.lineup_context_status === "complete" ? 86 : c.lineup_context_status === "partial" ? 70 : 0, c.source),
      factor("warnings", "Warnings", (packet.warnings || []).length ? packet.warnings.join(" | ") : "NONE", (packet.warnings || []).length ? 45 : 96, "packet")
    ]
  };
}

function flattenFactors(matrixFactors) {
  return Object.values(matrixFactors || {}).flat();
}

async function writeSupplementalCache(env, packet) {
  const cacheKey = [packet.slate_date, packet.game_id || "no_game", packet.leg.team_id, packet.leg.player_name, packet.leg.prop_family].join("|");
  const payload = JSON.stringify({
    version: WORKER_VERSION,
    slate_date: packet.slate_date,
    game_id: packet.game_id,
    leg: packet.leg,
    game: packet.game,
    player: packet.player,
    lineup: packet.lineup,
    opposing_starter: packet.opposing_starter,
    bullpen: packet.bullpen,
    candidate: packet.candidate,
    matrix_factors: packet.matrix_factors,
    missing: packet.missing,
    warnings: packet.warnings
  });
  try {
    await run(env.DB, `
      CREATE TABLE IF NOT EXISTS ${SUPPLEMENTAL_TABLE} (
        cache_key TEXT PRIMARY KEY,
        slate_date TEXT,
        game_id TEXT,
        player_name TEXT,
        team_id TEXT,
        prop_family TEXT,
        source TEXT,
        confidence TEXT,
        packet_json TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT
      )
    `);
    await run(env.DB, `
      INSERT INTO ${SUPPLEMENTAL_TABLE}
        (cache_key, slate_date, game_id, player_name, team_id, prop_family, source, confidence, packet_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(cache_key) DO UPDATE SET
        slate_date = excluded.slate_date,
        game_id = excluded.game_id,
        player_name = excluded.player_name,
        team_id = excluded.team_id,
        prop_family = excluded.prop_family,
        source = excluded.source,
        confidence = excluded.confidence,
        packet_json = excluded.packet_json,
        updated_at = excluded.updated_at
    `, [
      cacheKey,
      packet.slate_date,
      packet.game_id || null,
      packet.leg.player_name,
      packet.leg.team_id,
      packet.leg.prop_family,
      "main_api_incremental_leg_packet_cache",
      "controlled_small_write",
      payload,
      nowSql()
    ]);
    return { ok: true, table: SUPPLEMENTAL_TABLE, cache_key: cacheKey, mode: "upsert_small_leg_packet", rows_written: 1 };
  } catch (err) {
    return { ok: false, table: SUPPLEMENTAL_TABLE, cache_key: cacheKey, error: err?.message || String(err), mode: "cache_write_failed_non_blocking" };
  }
}

async function buildLegPacket(payload, env, options = {}) {
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
    mode: "d1_packet_plus_matrix_fill_controlled_cache",
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
  packet.matrix_factors = buildMatrixFactors(packet);
  packet.matrix_factor_summary = summarizeFactors(packet.matrix_factors);

  if (options.writeCache !== false) {
    packet.incremental_cache = await writeSupplementalCache(env, packet);
    if (packet.incremental_cache && packet.incremental_cache.ok === false) {
      packet.derived_flags.push("incremental_cache_write_failed_non_blocking");
    }
  } else {
    packet.incremental_cache = { ok: true, mode: "disabled_for_this_request" };
  }

  return packet;
}

function summarizeFactors(matrixFactors) {
  const factors = flattenFactors(matrixFactors);
  const total = factors.length;
  const strong = factors.filter(f => Number(f.score) >= 80).length;
  const review = factors.filter(f => Number(f.score) >= 65 && Number(f.score) < 80).length;
  const risk = factors.filter(f => Number(f.score) < 65).length;
  const avg = total ? Math.round(factors.reduce((sum, f) => sum + Number(f.score || 0), 0) / total) : 0;
  return { total, strong, review, risk, average_factor_score: avg };
}

async function handlePacketLeg(request, env) {
  const payload = await readJson(request);
  const packet = await buildLegPacket(payload, env, { writeCache: true });
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

  const factorAvg = packet.matrix_factor_summary?.average_factor_score ?? 50;
  const missingPenalty = Math.min(packet.missing.length * 4, 20);
  const finalScore = Math.max(0, Math.min(100, Math.round((base * 0.65) + (factorAvg * 0.35) - missingPenalty)));
  const hitProbability = Math.max(0, Math.min(99, Math.round(finalScore * 0.82)));

  if (packet.missing.length >= 4) {
    confidence = "LOW";
    verdict = "DATA_REVIEW";
  }

  return {
    ok: true,
    source: "alphadog-main-api-v100",
    mode: "matrix_fill_candidate_adapter_placeholder",
    family,
    final_score: finalScore,
    hit_probability: hitProbability,
    confidence,
    verdict,
    formula_source: "matrix-fill placeholder only; final scoring formula not locked; no Gemini call",
    warnings: packet.warnings || [],
    missing: packet.missing || [],
    reasons,
    matrix_factor_summary: packet.matrix_factor_summary,
    factor_scores: {
      identity: packet.player ? 1 : 0,
      trend: packet.recent_usage?.length ? 1 : 0,
      matchup: packet.opposing_starter ? 1 : 0,
      role_usage: packet.lineup ? 1 : 0,
      market: packet.market ? 1 : 0,
      environment: packet.game ? 1 : 0,
      risk: packet.missing.length
    },
    note: "Matrix fill and wiring proof only. Final scoring logic comes later."
  };
}

async function handleScoreLeg(request, env) {
  const payload = await readJson(request);
  const packet = await buildLegPacket(payload, env, { writeCache: true });
  const score = scoreFromCandidate(packet);
  return jsonResponse({ ok: true, version: WORKER_VERSION, packet, score });
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
        available_routes: ["GET /main/debug/routes", "GET /main/health?slate_date=YYYY-MM-DD", "POST /main/packet/leg", "POST /main/score/leg"]
      }, 404);
    } catch (err) {
      return jsonResponse({ ok: false, worker: "alphadog-main-api-v100", error: err?.message || String(err), stack: err?.stack || null }, 500);
    }
  }
};
