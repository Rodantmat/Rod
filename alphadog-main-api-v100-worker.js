const WORKER_VERSION = "alphadog-main-api-v100.3 - Full DB Matrix Expansion";
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

async function findTeamLineup(env, gameId, teamId) {
  if (!gameId || !teamId) return [];
  try {
    return await all(env.DB, `
      SELECT * FROM lineups_current
      WHERE game_id = ? AND team_id = ?
      ORDER BY slot ASC, player_name ASC
      LIMIT 14
    `, [gameId, teamId]);
  } catch (_err) { return []; }
}

async function findGameStarters(env, gameId) {
  if (!gameId) return [];
  try {
    return await all(env.DB, `
      SELECT * FROM starters_current
      WHERE game_id = ?
      ORDER BY team_id ASC
      LIMIT 4
    `, [gameId]);
  } catch (_err) { return []; }
}

async function findGameBullpens(env, gameId) {
  if (!gameId) return [];
  try {
    return await all(env.DB, `
      SELECT * FROM bullpens_current
      WHERE game_id = ?
      ORDER BY team_id ASC
      LIMIT 4
    `, [gameId]);
  } catch (_err) { return []; }
}

async function findTeamPlayers(env, teamId) {
  if (!teamId) return [];
  try {
    return await all(env.DB, `
      SELECT player_name, team_id, role, position, bats, throws, games, ab, hits, avg, obp, slg, innings_pitched, strikeouts, era, whip, source, confidence, updated_at
      FROM players_current
      WHERE team_id = ?
      ORDER BY CASE WHEN role = 'BAT' THEN 0 ELSE 1 END, ab DESC, games DESC, player_name ASC
      LIMIT 40
    `, [teamId]);
  } catch (_err) { return []; }
}

async function findRelatedCandidates(env, family, playerName, teamId, gameId, slateDate) {
  const out = { hits: [], rbi: [], rfi: [] };
  try {
    out.hits = await all(env.DB, `
      SELECT * FROM edge_candidates_hits
      WHERE LOWER(player_name) = LOWER(?) OR team_id = ? OR game_id = ?
      ORDER BY CASE WHEN LOWER(player_name)=LOWER(?) THEN 0 ELSE 1 END, candidate_tier ASC, lineup_slot ASC
      LIMIT 12
    `, [playerName, teamId, gameId, playerName]);
  } catch (_err) {}
  try {
    out.rbi = await all(env.DB, `
      SELECT * FROM edge_candidates_rbi
      WHERE LOWER(player_name) = LOWER(?) OR team_id = ? OR game_id = ?
      ORDER BY CASE WHEN LOWER(player_name)=LOWER(?) THEN 0 ELSE 1 END, candidate_tier ASC, lineup_slot ASC
      LIMIT 12
    `, [playerName, teamId, gameId, playerName]);
  } catch (_err) {}
  try {
    out.rfi = await all(env.DB, `
      SELECT * FROM edge_candidates_rfi
      WHERE slate_date = ? AND game_id = ?
      LIMIT 4
    `, [slateDate, gameId]);
  } catch (_err) {}
  return out;
}

function summarizeLineup(rows = []) {
  return rows.map(r => '#' + (r.slot || '?') + ' ' + (r.player_name || 'UNKNOWN')).join(' / ') || null;
}

function average(values) {
  const nums = values.map(v => n(v, null)).filter(v => v !== null);
  return nums.length ? nums.reduce((a,b)=>a+b,0)/nums.length : null;
}

function scoreAverage(value, strong, review, risk = null) {
  const v = n(value, null);
  if (v === null) return 0;
  if (v >= strong) return 88;
  if (v >= review) return 74;
  if (risk !== null && v >= risk) return 65;
  return 56;
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
  const game = packet.game || {};
  const recent = Array.isArray(packet.recent_usage) ? packet.recent_usage : [];
  const teamLineup = Array.isArray(packet.team_lineup) ? packet.team_lineup : [];
  const oppLineup = Array.isArray(packet.opponent_lineup) ? packet.opponent_lineup : [];
  const teamPlayers = Array.isArray(packet.team_players) ? packet.team_players : [];
  const oppPlayers = Array.isArray(packet.opponent_players) ? packet.opponent_players : [];
  const gameStarters = Array.isArray(packet.game_starters) ? packet.game_starters : [];
  const gameBullpens = Array.isArray(packet.game_bullpens) ? packet.game_bullpens : [];
  const related = packet.related_candidates || { hits: [], rbi: [], rfi: [] };
  const last5 = last5HitsString(recent);
  const completeness = 100 - Math.min((packet.missing || []).length * 14, 70);
  const starterHitsPerIp = st.innings_pitched ? n(st.hits_allowed, 0) / Math.max(n(st.innings_pitched, 1), 1) : null;
  const starterHitsPerIpScore = starterHitsPerIp === null ? 0 : (starterHitsPerIp >= 1.10 ? 86 : starterHitsPerIp >= 0.90 ? 76 : starterHitsPerIp >= 0.75 ? 66 : 56);
  const bullpenFatigue = safeText(bp.fatigue || c.bullpen_fatigue_tier).toLowerCase();
  const bullpenScore = bullpenFatigue === "high" ? 78 : bullpenFatigue === "medium" ? 68 : bullpenFatigue === "low" ? 58 : 0;
  const lastGameHits = n(c.last_game_hits, null);
  const lastGameScore = lastGameHits === null ? 0 : lastGameHits >= 2 ? 86 : lastGameHits === 1 ? 74 : 58;
  const top3 = teamLineup.filter(r => n(r.slot, 99) <= 3);
  const top5 = teamLineup.filter(r => n(r.slot, 99) <= 5);
  const teamAvg = average(teamPlayers.filter(r => r.role === 'BAT').map(r => r.avg));
  const teamObp = average(teamPlayers.filter(r => r.role === 'BAT').map(r => r.obp));
  const teamSlg = average(teamPlayers.filter(r => r.role === 'BAT').map(r => r.slg));
  const oppAvg = average(oppPlayers.filter(r => r.role === 'BAT').map(r => r.avg));
  const oppObp = average(oppPlayers.filter(r => r.role === 'BAT').map(r => r.obp));
  const scoreLineText = packet.leg?.side ? `${packet.leg.side} ${packet.leg.line}` : packet.leg?.line;

  return {
    identity: [
      factor("player_identity", "Player Identity", p.player_name || packet.leg.player_name, p.player_name ? 100 : 70, p.source || "payload"),
      factor("team_match", "Team / Opponent", `${packet.leg.team_id || "MISSING"} vs/@ ${packet.leg.opponent_team || "MISSING"}`, packet.game ? 100 : 65, "games"),
      factor("game_id", "Resolved Game ID", packet.game_id, packet.game_id ? 100 : 0, "games"),
      factor("prop_family", "Prop Family", packet.leg.prop_family, packet.leg.prop_family !== "UNKNOWN" ? 92 : 0, "parser"),
      factor("player_role_position", "Role / Position", `${p.role || "MISSING"} / ${p.position || "MISSING"}`, p.role ? 86 : 0, p.source),
      factor("handedness", "Bats / Throws", `${p.bats || "MISSING"} / ${p.throws || "MISSING"}`, (p.bats || p.throws) ? 82 : 0, p.source)
    ],
    trend: [
      factor("last5_hits", "Last 5 Hits", last5 || (lastGameHits !== null ? `Last game: ${lastGameHits}` : "MISSING"), last5 ? 81 : lastGameScore, last5 ? "player_recent_usage" : "candidate"),
      factor("last_game_hits", "Last Game Hits", lastGameHits, lastGameScore, c.source),
      factor("last_game_ab", "Last Game AB", c.last_game_ab, c.last_game_ab >= 4 ? 84 : c.last_game_ab >= 3 ? 74 : c.last_game_ab >= 1 ? 62 : 0, c.source),
      factor("season_avg", "Season AVG", p.avg ?? c.player_avg, scoreAvg(p.avg ?? c.player_avg), p.source || c.source),
      factor("season_obp", "Season OBP", p.obp ?? c.player_obp, scoreObp(p.obp ?? c.player_obp), p.source || c.source),
      factor("season_slg", "Season SLG", p.slg ?? c.player_slg, scoreSlg(p.slg ?? c.player_slg), p.source || c.source),
      factor("season_hits_ab", "Season Hits / AB", (p.hits !== undefined && p.ab !== undefined) ? `${p.hits}/${p.ab}` : "MISSING", p.ab >= 80 ? 82 : p.ab >= 40 ? 72 : p.ab ? 62 : 0, p.source),
      factor("games_played", "Games Played", p.games, p.games >= 20 ? 82 : p.games >= 10 ? 70 : p.games ? 58 : 0, p.source)
    ],
    matchup: [
      factor("opposing_starter", "Opposing Starter", st.starter_name || c.opposing_starter, (st.starter_name || c.opposing_starter) ? 90 : 0, st.source || c.source),
      factor("starter_throws", "Starter Hand", st.throws || c.opposing_throws, (st.throws || c.opposing_throws) ? 84 : 0, st.source || c.source),
      factor("starter_whip", "Starter WHIP", st.whip, scoreStarterWhip(st.whip), st.source),
      factor("starter_era", "Starter ERA", st.era, scoreStarterEra(st.era), st.source),
      factor("starter_hits_per_ip", "Starter H/IP", starterHitsPerIp === null ? "MISSING" : starterHitsPerIp.toFixed(2), starterHitsPerIpScore, st.source),
      factor("starter_hits_allowed", "Starter Hits Allowed", st.hits_allowed, scoreAverage(st.hits_allowed, 35, 20, 10), st.source),
      factor("starter_walks", "Starter Walks", st.walks, scoreAverage(st.walks, 15, 8, 4), st.source),
      factor("starter_hr_allowed", "Starter HR Allowed", st.hr_allowed, scoreAverage(st.hr_allowed, 5, 3, 1), st.source),
      factor("game_starters_rows", "Both Starters Loaded", gameStarters.length, gameStarters.length >= 2 ? 100 : gameStarters.length ? 65 : 0, "starters_current")
    ],
    role_usage: [
      factor("lineup_slot", "Lineup Slot", l.slot || c.lineup_slot, scoreLineupSlot(l.slot || c.lineup_slot), l.source || c.source),
      factor("lineup_confirmed", "Lineup Confirmed", l.is_confirmed ? "YES" : "NO / MISSING", l.is_confirmed ? 88 : 45, l.source),
      factor("team_lineup_rows", "Team Lineup Rows", teamLineup.length, teamLineup.length >= 9 ? 90 : teamLineup.length >= 5 ? 72 : teamLineup.length ? 58 : 0, "lineups_current"),
      factor("opponent_lineup_rows", "Opponent Lineup Rows", oppLineup.length, oppLineup.length >= 9 ? 90 : oppLineup.length >= 5 ? 72 : oppLineup.length ? 58 : 0, "lineups_current"),
      factor("top3_lineup", "Team Top 3", summarizeLineup(top3) || "MISSING", top3.length >= 3 ? 86 : top3.length ? 65 : 0, "lineups_current"),
      factor("top5_lineup", "Team Top 5", summarizeLineup(top5) || "MISSING", top5.length >= 5 ? 86 : top5.length ? 68 : 0, "lineups_current"),
      factor("role_type", "Role Type", p.role || "MISSING", p.role ? 86 : 0, p.source),
      factor("recent_ab_volume", "Recent AB Volume", c.last_game_ab !== undefined ? `Last game AB: ${c.last_game_ab}` : "MISSING", c.last_game_ab >= 4 ? 84 : c.last_game_ab >= 3 ? 74 : c.last_game_ab >= 1 ? 62 : 0, c.source)
    ],
    market: [
      factor("prop_line", "Prop / Line / Direction", `${packet.leg.prop_type || "MISSING"} ${scoreLineText || ""}`, packet.leg.line !== null ? 82 : 0, "screen1_payload"),
      factor("game_total", "Game Total", m.current_total ?? m.game_total, (m.current_total ?? m.game_total) ? 76 : 0, m.source),
      factor("open_total", "Open Total", m.open_total, m.open_total ? 70 : 0, m.source),
      factor("team_implied_runs", "Team Implied Runs", packet.leg.team_id === game.home_team ? m.home_implied_runs : m.away_implied_runs, (m.home_implied_runs || m.away_implied_runs) ? 76 : 0, m.source),
      factor("opponent_implied_runs", "Opponent Implied Runs", packet.leg.team_id === game.home_team ? m.away_implied_runs : m.home_implied_runs, (m.home_implied_runs || m.away_implied_runs) ? 68 : 0, m.source),
      factor("moneyline", "Moneyline", `Away ${m.away_moneyline ?? "MISSING"} / Home ${m.home_moneyline ?? "MISSING"}`, (m.away_moneyline || m.home_moneyline) ? 70 : 0, m.source),
      factor("runline", "Runline", m.runline, m.runline ? 70 : 0, m.source),
      factor("market_source", "Market Source", m.source || "MISSING", m.source ? 66 : 0, m.confidence || "markets_current")
    ],
    environment: [
      factor("venue", "Venue / Park", game.venue || "MISSING", game.venue ? 84 : 0, "games"),
      factor("park_run_factor", "Park Run Factor", c.park_factor_run, c.park_factor_run ? 72 : 0, c.source),
      factor("park_hr_factor", "Park HR Factor", c.park_factor_hr, c.park_factor_hr ? 72 : 0, c.source),
      factor("bullpen_fatigue", "Opponent Bullpen Fatigue", bullpenFatigue || "MISSING", bullpenScore, bp.source || c.source),
      factor("bullpen_last_game_ip", "Opponent Bullpen Last Game IP", bp.last_game_ip, bp.last_game_ip >= 4 ? 82 : bp.last_game_ip >= 2 ? 70 : bp.last_game_ip !== null && bp.last_game_ip !== undefined ? 60 : 0, bp.source),
      factor("bullpen_last3_ip", "Opponent Bullpen Last 3 IP", bp.last3_ip, bp.last3_ip >= 10 ? 82 : bp.last3_ip >= 6 ? 70 : bp.last3_ip ? 60 : 0, bp.source),
      factor("game_bullpen_rows", "Both Bullpens Loaded", gameBullpens.length, gameBullpens.length >= 2 ? 100 : gameBullpens.length ? 65 : 0, "bullpens_current"),
      factor("start_time", "Start Time UTC", game.start_time_utc, game.start_time_utc ? 80 : 0, "games"),
      factor("weather", "Weather", "FUTURE MINER", 0, "future_miner")
    ],
    team_context: [
      factor("team_avg", "Team Batter AVG Avg", teamAvg === null ? "MISSING" : teamAvg.toFixed(3), scoreAvg(teamAvg), "players_current"),
      factor("team_obp", "Team Batter OBP Avg", teamObp === null ? "MISSING" : teamObp.toFixed(3), scoreObp(teamObp), "players_current"),
      factor("team_slg", "Team Batter SLG Avg", teamSlg === null ? "MISSING" : teamSlg.toFixed(3), scoreSlg(teamSlg), "players_current"),
      factor("opponent_avg", "Opponent Batter AVG Avg", oppAvg === null ? "MISSING" : oppAvg.toFixed(3), scoreAvg(oppAvg), "players_current"),
      factor("opponent_obp", "Opponent Batter OBP Avg", oppObp === null ? "MISSING" : oppObp.toFixed(3), scoreObp(oppObp), "players_current"),
      factor("team_players_loaded", "Team Players Loaded", teamPlayers.length, teamPlayers.length >= 20 ? 88 : teamPlayers.length >= 10 ? 74 : teamPlayers.length ? 60 : 0, "players_current"),
      factor("opponent_players_loaded", "Opponent Players Loaded", oppPlayers.length, oppPlayers.length >= 20 ? 88 : oppPlayers.length >= 10 ? 74 : oppPlayers.length ? 60 : 0, "players_current")
    ],
    candidate_context: [
      factor("candidate_tier", "Primary Candidate Tier", c.candidate_tier || "MISSING", scoreTier(c.candidate_tier), c.source),
      factor("candidate_reason", "Primary Candidate Reason", c.candidate_reason || "MISSING", c.candidate_reason ? 80 : 0, c.source),
      factor("related_hits_candidates", "Related Hits Candidates", related.hits?.length || 0, related.hits?.length ? 82 : 0, "edge_candidates_hits"),
      factor("related_rbi_candidates", "Related RBI Candidates", related.rbi?.length || 0, related.rbi?.length ? 82 : 0, "edge_candidates_rbi"),
      factor("related_rfi_candidates", "Related RFI Candidates", related.rfi?.length || 0, related.rfi?.length ? 82 : 0, "edge_candidates_rfi"),
      factor("lineup_context", "Lineup Context", c.lineup_context_status || "MISSING", c.lineup_context_status === "complete" ? 86 : c.lineup_context_status === "partial" ? 70 : 0, c.source)
    ],
    risk: [
      factor("packet_completeness", "Packet Completeness", (packet.missing || []).length ? `Missing: ${(packet.missing || []).join(", ")}` : "Complete", completeness, "packet"),
      factor("db_inventory", "DB Inventory", packet.db_inventory ? JSON.stringify(packet.db_inventory) : "MISSING", packet.db_inventory ? 86 : 0, "packet"),
      factor("warnings", "Warnings", (packet.warnings || []).length ? packet.warnings.join(" | ") : "NONE", (packet.warnings || []).length ? 45 : 96, "packet"),
      factor("source_staleness", "Source Staleness", `game ${game.updated_at || "?"} / player ${p.updated_at || "?"} / candidate ${c.updated_at || "?"}`, (game.updated_at && p.updated_at && c.updated_at) ? 76 : 58, "updated_at_fields")
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
    team_lineup: packet.team_lineup,
    opponent_lineup: packet.opponent_lineup,
    game_starters: packet.game_starters,
    game_bullpens: packet.game_bullpens,
    team_players: packet.team_players,
    opponent_players: packet.opponent_players,
    related_candidates: packet.related_candidates,
    db_inventory: packet.db_inventory,
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
  const teamLineup = await findTeamLineup(env, gameId, teamId);
  const opponentLineup = await findTeamLineup(env, gameId, opponentTeam);
  const gameStarters = await findGameStarters(env, gameId);
  const gameBullpens = await findGameBullpens(env, gameId);
  const teamPlayers = await findTeamPlayers(env, teamId);
  const opponentPlayers = await findTeamPlayers(env, opponentTeam);
  const relatedCandidates = await findRelatedCandidates(env, family, playerName, teamId, gameId, slateDate);

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
    team_lineup: teamLineup,
    opponent_lineup: opponentLineup,
    game_starters: gameStarters,
    game_bullpens: gameBullpens,
    team_players: teamPlayers,
    opponent_players: opponentPlayers,
    related_candidates: relatedCandidates,
    db_inventory: {
      team_lineup_rows: teamLineup.length,
      opponent_lineup_rows: opponentLineup.length,
      game_starter_rows: gameStarters.length,
      game_bullpen_rows: gameBullpens.length,
      team_player_rows: teamPlayers.length,
      opponent_player_rows: opponentPlayers.length,
      related_hits_candidates: relatedCandidates.hits.length,
      related_rbi_candidates: relatedCandidates.rbi.length,
      related_rfi_candidates: relatedCandidates.rfi.length
    },
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
