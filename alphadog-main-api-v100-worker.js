const SYSTEM_VERSION = "alphadog-main-api-v100.6 - Main-1M Priority 1 Matrix Bridge";
const WORKER_NAME = "alphadog-main-api-v100";
const MLB_BASE = "https://statsapi.mlb.com";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization"
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...CORS, "content-type": "application/json; charset=utf-8" }
  });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function safeNumber(v, fallback = null) {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, lo = 0, hi = 100) {
  const x = safeNumber(n, 0);
  return Math.max(lo, Math.min(hi, x));
}

function light(score) {
  const s = clamp(score);
  if (s >= 80) return "🟢";
  if (s >= 65) return "🟡";
  return "🔴";
}

function factor(label, value, score, source = "system", confidence = "controlled", detail = "") {
  const s = clamp(score);
  return {
    label,
    value: value === null || value === undefined || value === "" ? "N/A" : String(value),
    score: s,
    light: light(s),
    display: `${value === null || value === undefined || value === "" ? "N/A" : String(value)} - ${s}/100 ${light(s)}`,
    source,
    confidence,
    detail
  };
}

function normalizeTeam(t) {
  return String(t || "").trim().toUpperCase();
}

function normalizeName(n) {
  return String(n || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
}

async function one(env, sql, binds = []) {
  return await env.DB.prepare(sql).bind(...binds).first();
}

async function all(env, sql, binds = []) {
  const out = await env.DB.prepare(sql).bind(...binds).all();
  return out && Array.isArray(out.results) ? out.results : [];
}

async function tableCount(env, table) {
  try {
    const row = await one(env, `SELECT COUNT(*) AS n FROM ${table}`);
    return { check: table.toUpperCase(), value: row ? row.n : 0, status: (row && row.n > 0) ? "PASS" : "REVIEW", ok: !!(row && row.n > 0), error: null };
  } catch (e) {
    return { check: table.toUpperCase(), value: 0, status: "ERROR", ok: false, error: String(e && e.message || e) };
  }
}

async function getSlateDate(env, payload = {}) {
  if (payload.slate_date) return payload.slate_date;
  try {
    const g = await one(env, `SELECT game_date FROM games ORDER BY game_date DESC LIMIT 1`);
    if (g && g.game_date) return g.game_date;
  } catch (_) {}
  return todayIso();
}

async function handleHealth(env) {
  const tables = [
    ["games", "GAMES_TODAY"],
    ["starters_current", "STARTERS_TODAY"],
    ["lineups_current", "LINEUPS_TODAY"],
    ["bullpens_current", "BULLPENS_TODAY"],
    ["markets_current", "MARKETS_TODAY"],
    ["players_current", "PLAYERS_CURRENT"],
    ["edge_candidates_rfi", "RFI_CANDIDATES"],
    ["edge_candidates_rbi", "RBI_CANDIDATES"],
    ["edge_candidates_hits", "HITS_CANDIDATES"]
  ];
  const checks = [];
  for (const [table, label] of tables) {
    const c = await tableCount(env, table);
    c.check = label;
    checks.push(c);
  }
  const summary = checks.reduce((a, c) => {
    a.total += 1;
    if (c.status === "PASS") a.pass += 1;
    else if (c.status === "ERROR") a.error += 1;
    else a.review += 1;
    return a;
  }, { pass: 0, review: 0, error: 0, total: 0 });
  const status = summary.error ? "error" : summary.review ? "review" : "pass";
  const slate = await getSlateDate(env, {});
  return json({ ok: summary.error === 0, version: SYSTEM_VERSION, worker: WORKER_NAME, job: "main_health_read_plus_priority_1", slate_date: slate, status, table_checks: checks, summary, note: "Main API with controlled Priority 1 matrix bridge. Scheduled backend remains separate." });
}

async function findGame(env, payload, slateDate) {
  const team = normalizeTeam(payload.team_id || payload.team);
  const opp = normalizeTeam(payload.opponent_team || payload.opponent);
  const binds = [slateDate, team, opp, opp, team];
  let g = null;
  try {
    g = await one(env, `SELECT * FROM games WHERE game_date = ? AND ((home_team = ? AND away_team = ?) OR (home_team = ? AND away_team = ?)) LIMIT 1`, binds);
  } catch (_) {}
  if (!g) {
    try {
      g = await one(env, `SELECT * FROM games WHERE ((home_team = ? AND away_team = ?) OR (home_team = ? AND away_team = ?)) ORDER BY game_date DESC LIMIT 1`, [team, opp, opp, team]);
    } catch (_) {}
  }
  return g || null;
}

async function getMarket(env, gameId) {
  try { return await one(env, `SELECT * FROM markets_current WHERE game_id = ? LIMIT 1`, [gameId]); } catch (_) { return null; }
}

async function getPlayer(env, playerName, teamId) {
  try {
    return await one(env, `SELECT * FROM players_current WHERE team_id = ? AND lower(player_name) = lower(?) LIMIT 1`, [teamId, playerName]);
  } catch (_) {}
  try {
    const rows = await all(env, `SELECT * FROM players_current WHERE team_id = ?`, [teamId]);
    const target = normalizeName(playerName);
    return rows.find(r => normalizeName(r.player_name) === target) || rows.find(r => normalizeName(r.player_name).includes(target) || target.includes(normalizeName(r.player_name))) || null;
  } catch (_) { return null; }
}

async function getLineup(env, gameId, teamId, playerName) {
  try { return await one(env, `SELECT * FROM lineups_current WHERE game_id = ? AND team_id = ? AND lower(player_name) = lower(?) LIMIT 1`, [gameId, teamId, playerName]); } catch (_) { return null; }
}

async function getStarter(env, gameId, oppTeam) {
  try { return await one(env, `SELECT * FROM starters_current WHERE game_id = ? AND team_id = ? LIMIT 1`, [gameId, oppTeam]); } catch (_) { return null; }
}

async function getBullpen(env, gameId, oppTeam) {
  try { return await one(env, `SELECT * FROM bullpens_current WHERE game_id = ? AND team_id = ? LIMIT 1`, [gameId, oppTeam]); } catch (_) { return null; }
}

async function getCandidate(env, family, slateDate, gameId, teamId, oppTeam, playerName) {
  const table = family === "RBI" ? "edge_candidates_rbi" : family === "HITS" ? "edge_candidates_hits" : family === "RFI" ? "edge_candidates_rfi" : null;
  if (!table) return null;
  try {
    if (family === "RFI") return await one(env, `SELECT * FROM ${table} WHERE slate_date = ? AND game_id = ? LIMIT 1`, [slateDate, gameId]);
    return await one(env, `SELECT * FROM ${table} WHERE slate_date = ? AND game_id = ? AND team_id = ? AND opponent_team = ? AND lower(player_name) = lower(?) LIMIT 1`, [slateDate, gameId, teamId, oppTeam, playerName]);
  } catch (_) { return null; }
}

async function getTeamLineup(env, gameId, teamId) {
  try { return await all(env, `SELECT * FROM lineups_current WHERE game_id = ? AND team_id = ? ORDER BY slot ASC`, [gameId, teamId]); } catch (_) { return []; }
}

async function getTeamPlayers(env, teamId) {
  try { return await all(env, `SELECT player_name, team_id, role, position, bats, throws, games, ab, hits, avg, obp, slg, innings_pitched, strikeouts, era, whip, source, confidence, updated_at FROM players_current WHERE team_id = ? ORDER BY role ASC, ab DESC LIMIT 40`, [teamId]); } catch (_) { return []; }
}

async function getGameStarters(env, gameId) {
  try { return await all(env, `SELECT * FROM starters_current WHERE game_id = ? ORDER BY team_id`, [gameId]); } catch (_) { return []; }
}

async function getGameBullpens(env, gameId) {
  try { return await all(env, `SELECT * FROM bullpens_current WHERE game_id = ? ORDER BY team_id`, [gameId]); } catch (_) { return []; }
}

async function getRelatedCandidates(env, slateDate, gameId, teamId, oppTeam) {
  const out = { hits: [], rbi: [], rfi: [] };
  try { out.hits = await all(env, `SELECT * FROM edge_candidates_hits WHERE slate_date = ? AND game_id = ? AND team_id = ? ORDER BY CASE candidate_tier WHEN 'A_POOL' THEN 1 ELSE 2 END, lineup_slot ASC LIMIT 12`, [slateDate, gameId, teamId]); } catch (_) {}
  try { out.rbi = await all(env, `SELECT * FROM edge_candidates_rbi WHERE slate_date = ? AND game_id = ? AND team_id = ? ORDER BY CASE candidate_tier WHEN 'A_POOL' THEN 1 ELSE 2 END, lineup_slot ASC LIMIT 12`, [slateDate, gameId, teamId]); } catch (_) {}
  try { out.rfi = await all(env, `SELECT * FROM edge_candidates_rfi WHERE slate_date = ? AND game_id = ? LIMIT 3`, [slateDate, gameId]); } catch (_) {}
  return out;
}

async function ensureSupplementalTables(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS main_supplemental_leg_cache (
    cache_key TEXT PRIMARY KEY,
    slate_date TEXT,
    game_id TEXT,
    team_id TEXT,
    opponent_team TEXT,
    player_name TEXT,
    prop_family TEXT,
    packet_json TEXT,
    matrix_json TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS main_supplemental_mlb_api_cache (
    cache_key TEXT PRIMARY KEY,
    url TEXT,
    body_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

async function cacheGet(env, key) {
  try {
    const row = await one(env, `SELECT body_json FROM main_supplemental_mlb_api_cache WHERE cache_key = ? LIMIT 1`, [key]);
    if (row && row.body_json) return JSON.parse(row.body_json);
  } catch (_) {}
  return null;
}

async function cachePut(env, key, url, body) {
  try {
    await env.DB.prepare(`INSERT INTO main_supplemental_mlb_api_cache (cache_key, url, body_json, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(cache_key) DO UPDATE SET url = excluded.url, body_json = excluded.body_json, updated_at = CURRENT_TIMESTAMP`).bind(key, url, JSON.stringify(body)).run();
  } catch (_) {}
}

async function fetchJsonCached(env, key, url, ttlMode = "daily") {
  await ensureSupplementalTables(env);
  const cached = await cacheGet(env, key);
  if (cached) return { ok: true, from_cache: true, url, body: cached, error: null };
  try {
    const res = await fetch(url, { headers: { "accept": "application/json" } });
    const text = await res.text();
    if (!res.ok) return { ok: false, from_cache: false, url, body: null, error: `HTTP ${res.status}: ${text.slice(0, 300)}` };
    const body = JSON.parse(text);
    await cachePut(env, key, url, body);
    return { ok: true, from_cache: false, url, body, error: null };
  } catch (e) {
    return { ok: false, from_cache: false, url, body: null, error: String(e && e.message || e) };
  }
}

function parseMlbDate(iso) {
  if (!iso) return null;
  return String(iso).slice(0, 10);
}

function dateAdd(dateIso, days) {
  const d = new Date(`${dateIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function findMlbGamePk(scheduleBody, teamId, oppTeam, gameDate) {
  const dates = scheduleBody && scheduleBody.dates || [];
  const team = normalizeTeam(teamId);
  const opp = normalizeTeam(oppTeam);
  for (const d of dates) {
    for (const g of (d.games || [])) {
      const home = normalizeTeam(g.teams && g.teams.home && g.teams.home.team && (g.teams.home.team.abbreviation || g.teams.home.team.teamCode || g.teams.home.team.fileCode));
      const away = normalizeTeam(g.teams && g.teams.away && g.teams.away.team && (g.teams.away.team.abbreviation || g.teams.away.team.teamCode || g.teams.away.team.fileCode));
      if ((home === team && away === opp) || (home === opp && away === team)) return g.gamePk;
    }
  }
  return null;
}

function extractBoxLineup(box, side, teamId, startersOnly = false) {
  const teamBlock = box && box.teams && box.teams[side];
  const players = teamBlock && teamBlock.players || {};
  const rows = [];
  for (const key of Object.keys(players)) {
    const p = players[key];
    const boRaw = p.battingOrder ? Number(p.battingOrder) : null;
    const slot = boRaw ? Math.floor(boRaw / 100) : null;
    const seq = boRaw ? boRaw % 100 : null;
    const isStarter = boRaw !== null && seq === 0;
    if (startersOnly && !isStarter) continue;
    const batting = p.stats && p.stats.batting || {};
    rows.push({
      player_id: p.person && p.person.id || null,
      player_name: p.person && p.person.fullName || null,
      team_id: teamId,
      slot,
      batting_order_raw: boRaw,
      order_sequence: seq,
      is_starter: !!isStarter,
      is_substitution: boRaw !== null && seq > 0,
      position: p.position && (p.position.abbreviation || p.position.code) || null,
      status: p.status && p.status.code || null,
      ab: safeNumber(batting.atBats),
      hits: safeNumber(batting.hits),
      runs: safeNumber(batting.runs),
      rbi: safeNumber(batting.rbi),
      bb: safeNumber(batting.baseOnBalls),
      so: safeNumber(batting.strikeOuts),
      hr: safeNumber(batting.homeRuns),
      doubles: safeNumber(batting.doubles),
      triples: safeNumber(batting.triples),
      total_bases: safeNumber(batting.totalBases)
    });
  }
  rows.sort((a, b) => (a.slot ?? 99) - (b.slot ?? 99) || (a.order_sequence ?? 99) - (b.order_sequence ?? 99));
  return rows;
}

function summarizeRecentPlayer(logs) {
  const safe = logs || [];
  const hits = safe.map(x => safeNumber(x.h, 0));
  const ab = safe.map(x => safeNumber(x.ab, 0));
  const runs = safe.map(x => safeNumber(x.r, 0));
  const rbi = safe.map(x => safeNumber(x.rbi, 0));
  const so = safe.map(x => safeNumber(x.so, 0));
  const totalHits = hits.reduce((a, b) => a + b, 0);
  const totalAb = ab.reduce((a, b) => a + b, 0);
  return {
    games: safe.length,
    last5_hits: hits.join(" / "),
    last5_ab: ab.join(" / "),
    last5_runs: runs.join(" / "),
    last5_rbi: rbi.join(" / "),
    last5_so: so.join(" / "),
    last5_total_hits: totalHits,
    last5_total_ab: totalAb,
    last5_avg: totalAb ? Number((totalHits / totalAb).toFixed(3)) : null,
    last3_hits_total: hits.slice(0, 3).reduce((a, b) => a + b, 0),
    last3_ab_total: ab.slice(0, 3).reduce((a, b) => a + b, 0),
    source: "mlb_statsapi_recent_boxscores"
  };
}

async function getMlbApiBridge(env, packet) {
  const warnings = [];
  const apiRequests = [];
  const slate = packet.slate_date;
  const start = dateAdd(slate, -14);
  const scheduleUrl = `${MLB_BASE}/api/v1/schedule?sportId=1&startDate=${start}&endDate=${slate}&hydrate=probablePitcher,team,linescore`;
  const schedule = await fetchJsonCached(env, `schedule|${start}|${slate}`, scheduleUrl);
  apiRequests.push({ ok: schedule.ok, from_cache: schedule.from_cache, url: schedule.url, error: schedule.error });
  if (!schedule.ok) warnings.push(`MLB schedule fetch failed: ${schedule.error}`);
  const gamePk = schedule.ok ? findMlbGamePk(schedule.body, packet.leg.team_id, packet.leg.opponent_team, slate) : null;
  if (!gamePk) warnings.push("MLB schedule gamePk not found; using D1-only packet.");
  if (!gamePk) return { ok: false, source: "mlb_statsapi_official_safe_enrichment", mode: "d1_only_no_game_pk", game_pk: null, warnings, api_requests: apiRequests };

  const boxUrl = `${MLB_BASE}/api/v1/game/${gamePk}/boxscore`;
  const liveUrl = `${MLB_BASE}/api/v1.1/game/${gamePk}/feed/live`;
  const box = await fetchJsonCached(env, `boxscore|${gamePk}`, boxUrl);
  apiRequests.push({ ok: box.ok, from_cache: box.from_cache, url: box.url, error: box.error });
  if (!box.ok) warnings.push(`MLB boxscore fetch failed: ${box.error}`);
  const live = await fetchJsonCached(env, `live|${gamePk}`, liveUrl);
  apiRequests.push({ ok: live.ok, from_cache: live.from_cache, url: live.url, error: live.error });
  if (!live.ok) warnings.push(`MLB live feed fetch failed: ${live.error}`);

  const teamIsHome = normalizeTeam(packet.game.home_team) === normalizeTeam(packet.leg.team_id);
  const teamSide = teamIsHome ? "home" : "away";
  const oppSide = teamIsHome ? "away" : "home";
  const teamLine = box.ok ? extractBoxLineup(box.body, teamSide, packet.leg.team_id, true) : [];
  const oppLine = box.ok ? extractBoxLineup(box.body, oppSide, packet.leg.opponent_team, true) : [];
  const teamParticipants = box.ok ? extractBoxLineup(box.body, teamSide, packet.leg.team_id, false) : [];
  const oppParticipants = box.ok ? extractBoxLineup(box.body, oppSide, packet.leg.opponent_team, false) : [];
  const subs = teamParticipants.filter(x => x.is_substitution);
  const oppSubs = oppParticipants.filter(x => x.is_substitution);

  const liveData = live.ok ? live.body && live.body.gameData : null;
  const liveStatus = liveData && liveData.status ? {
    abstract_game_state: liveData.status.abstractGameState || null,
    detailed_state: liveData.status.detailedState || null,
    coded_game_state: liveData.status.codedGameState || null,
    status_code: liveData.status.statusCode || null,
    start_time_utc: liveData.datetime && liveData.datetime.dateTime || null,
    current_inning: live.body && live.body.liveData && live.body.liveData.linescore && live.body.liveData.linescore.currentInning || null,
    inning_state: live.body && live.body.liveData && live.body.liveData.linescore && live.body.liveData.linescore.inningState || null,
    away_score: live.body && live.body.liveData && live.body.liveData.linescore && live.body.liveData.linescore.teams && live.body.liveData.linescore.teams.away && live.body.liveData.linescore.teams.away.runs || null,
    home_score: live.body && live.body.liveData && live.body.liveData.linescore && live.body.liveData.linescore.teams && live.body.liveData.linescore.teams.home && live.body.liveData.linescore.teams.home.runs || null
  } : null;

  const recentPlayer = await buildRecentPlayerLogs(env, packet.leg.player_name, packet.leg.team_id, slate, schedule.body);
  const teamRecent = await buildRecentTeamLogs(env, packet.leg.team_id, slate, schedule.body);
  const oppBullpenRecent = await buildRecentBullpenLogs(env, packet.leg.opponent_team, slate, schedule.body);

  return {
    ok: true,
    source: "mlb_statsapi_official_safe_enrichment",
    mode: "main_api_read_through_cache_priority_1",
    game_pk: gamePk,
    schedule_game_found: true,
    live_status: liveStatus,
    boxscore_lineup: teamLine,
    opponent_boxscore_lineup: oppLine,
    boxscore_participants: teamParticipants,
    opponent_boxscore_participants: oppParticipants,
    boxscore_substitutions: subs,
    opponent_boxscore_substitutions: oppSubs,
    player_recent_logs: recentPlayer.logs,
    player_recent_summary: summarizeRecentPlayer(recentPlayer.logs),
    team_recent_games: teamRecent.logs,
    opponent_bullpen_recent: oppBullpenRecent.logs,
    priority_1: buildPriority1Factors({ packet, teamLine, oppLine, teamParticipants, oppParticipants, recentPlayer: recentPlayer.logs, teamRecent: teamRecent.logs, oppBullpenRecent: oppBullpenRecent.logs, liveStatus }),
    cache_summary: { schedule_cached: schedule.from_cache, boxscore_cached: box.from_cache, live_cached: live.from_cache, cache_table: "main_supplemental_mlb_api_cache" },
    api_requests: apiRequests,
    warnings
  };
}

async function buildRecentPlayerLogs(env, playerName, teamId, slate, scheduleBody) {
  const logs = [];
  const normPlayer = normalizeName(playerName);
  const dates = (scheduleBody && scheduleBody.dates || []).slice().reverse();
  for (const d of dates) {
    for (const g of (d.games || [])) {
      if (logs.length >= 5) break;
      const home = normalizeTeam(g.teams && g.teams.home && g.teams.home.team && (g.teams.home.team.abbreviation || g.teams.home.team.teamCode || g.teams.home.team.fileCode));
      const away = normalizeTeam(g.teams && g.teams.away && g.teams.away.team && (g.teams.away.team.abbreviation || g.teams.away.team.teamCode || g.teams.away.team.fileCode));
      const team = normalizeTeam(teamId);
      if (home !== team && away !== team) continue;
      if (parseMlbDate(g.gameDate) >= slate) continue;
      const boxUrl = `${MLB_BASE}/api/v1/game/${g.gamePk}/boxscore`;
      const box = await fetchJsonCached(env, `boxscore|${g.gamePk}`, boxUrl);
      if (!box.ok) continue;
      const side = home === team ? "home" : "away";
      const opp = home === team ? away : home;
      const rows = extractBoxLineup(box.body, side, team, false);
      const row = rows.find(r => normalizeName(r.player_name) === normPlayer);
      if (row) logs.push({ game_date: parseMlbDate(g.gameDate), game_pk: g.gamePk, opponent: opp, is_home: home === team, ab: row.ab, h: row.hits, r: row.runs, rbi: row.rbi, bb: row.bb, so: row.so, hr: row.hr, doubles: row.doubles, total_bases: row.total_bases, source: "mlb_statsapi_boxscore_recent_player" });
    }
    if (logs.length >= 5) break;
  }
  return { logs };
}

async function buildRecentTeamLogs(env, teamId, slate, scheduleBody) {
  const logs = [];
  const dates = (scheduleBody && scheduleBody.dates || []).slice().reverse();
  const team = normalizeTeam(teamId);
  for (const d of dates) {
    for (const g of (d.games || [])) {
      if (logs.length >= 5) break;
      const home = normalizeTeam(g.teams && g.teams.home && g.teams.home.team && (g.teams.home.team.abbreviation || g.teams.home.team.teamCode || g.teams.home.team.fileCode));
      const away = normalizeTeam(g.teams && g.teams.away && g.teams.away.team && (g.teams.away.team.abbreviation || g.teams.away.team.teamCode || g.teams.away.team.fileCode));
      if (home !== team && away !== team) continue;
      if (parseMlbDate(g.gameDate) >= slate) continue;
      const box = await fetchJsonCached(env, `boxscore|${g.gamePk}`, `${MLB_BASE}/api/v1/game/${g.gamePk}/boxscore`);
      if (!box.ok) continue;
      const side = home === team ? "home" : "away";
      const oppSide = side === "home" ? "away" : "home";
      const sideRows = extractBoxLineup(box.body, side, team, false).filter(x => x.ab !== null);
      const oppRows = extractBoxLineup(box.body, oppSide, side === "home" ? away : home, false).filter(x => x.ab !== null);
      logs.push({
        game_date: parseMlbDate(g.gameDate), game_pk: g.gamePk, opponent: side === "home" ? away : home, is_home: side === "home",
        runs_for: sideRows.reduce((a, x) => a + safeNumber(x.runs, 0), 0),
        hits_for: sideRows.reduce((a, x) => a + safeNumber(x.hits, 0), 0),
        strikeouts: sideRows.reduce((a, x) => a + safeNumber(x.so, 0), 0),
        walks: sideRows.reduce((a, x) => a + safeNumber(x.bb, 0), 0),
        runs_against: oppRows.reduce((a, x) => a + safeNumber(x.runs, 0), 0),
        hits_against: oppRows.reduce((a, x) => a + safeNumber(x.hits, 0), 0),
        source: "mlb_statsapi_boxscore_recent_team"
      });
    }
    if (logs.length >= 5) break;
  }
  return { logs };
}

async function buildRecentBullpenLogs(env, teamId, slate, scheduleBody) {
  const logs = [];
  const team = normalizeTeam(teamId);
  const dates = (scheduleBody && scheduleBody.dates || []).slice().reverse();
  for (const d of dates) {
    for (const g of (d.games || [])) {
      if (logs.length >= 3) break;
      const home = normalizeTeam(g.teams && g.teams.home && g.teams.home.team && (g.teams.home.team.abbreviation || g.teams.home.team.teamCode || g.teams.home.team.fileCode));
      const away = normalizeTeam(g.teams && g.teams.away && g.teams.away.team && (g.teams.away.team.abbreviation || g.teams.away.team.teamCode || g.teams.away.team.fileCode));
      if (home !== team && away !== team) continue;
      if (parseMlbDate(g.gameDate) >= slate) continue;
      const side = home === team ? "home" : "away";
      const box = await fetchJsonCached(env, `boxscore|${g.gamePk}`, `${MLB_BASE}/api/v1/game/${g.gamePk}/boxscore`);
      if (!box.ok) continue;
      const players = box.body && box.body.teams && box.body.teams[side] && box.body.teams[side].players || {};
      let bullpenOuts = 0;
      for (const key of Object.keys(players)) {
        const p = players[key];
        const pitching = p.stats && p.stats.pitching || null;
        if (!pitching) continue;
        const gamesStarted = safeNumber(pitching.gamesStarted, 0);
        if (gamesStarted > 0) continue;
        const outs = safeNumber(pitching.outs, 0);
        bullpenOuts += outs;
      }
      const ip = Number((bullpenOuts / 3).toFixed(3));
      logs.push({ game_date: parseMlbDate(g.gameDate), game_pk: g.gamePk, opponent: home === team ? away : home, bullpen_ip: ip, bullpen_ip_text: outsToIpText(bullpenOuts), source: "mlb_statsapi_boxscore_recent_bullpen" });
    }
    if (logs.length >= 3) break;
  }
  return { logs };
}

function outsToIpText(outs) {
  const whole = Math.floor(outs / 3);
  const rem = outs % 3;
  return `${whole}.${rem}`;
}

function buildPriority1Factors({ packet, teamLine, oppLine, teamParticipants, oppParticipants, recentPlayer, teamRecent, oppBullpenRecent, liveStatus }) {
  const out = [];
  const playerRow = teamParticipants.find(r => normalizeName(r.player_name) === normalizeName(packet.leg.player_name));
  const recentSummary = summarizeRecentPlayer(recentPlayer || []);
  const last5HitsScore = recentSummary.games ? clamp(50 + (recentSummary.last5_avg || 0) * 150) : 50;
  out.push(factor("P1 Last 5 Hits", recentSummary.last5_hits || "N/A", last5HitsScore, "mlb_statsapi_recent_boxscores", "official_boxscore", "Recent player hit trend."));
  out.push(factor("P1 Last 5 AB", recentSummary.last5_ab || "N/A", recentSummary.last5_ab ? 75 : 45, "mlb_statsapi_recent_boxscores", "official_boxscore", "Recent opportunity volume."));
  const lineupScore = playerRow && playerRow.slot ? clamp(96 - ((playerRow.slot - 1) * 5)) : packet.lineup && packet.lineup.slot ? clamp(96 - ((packet.lineup.slot - 1) * 5)) : 50;
  out.push(factor("P1 Confirmed Lineup Slot", playerRow && playerRow.slot ? `Slot ${playerRow.slot}` : packet.lineup && packet.lineup.slot ? `Slot ${packet.lineup.slot}` : "N/A", lineupScore, "mlb_statsapi_boxscore_lineup", "official_or_pregame_boxscore", "Starter/substitution aware lineup slot."));
  const starter = packet.opposing_starter || {};
  const starterScore = starter.era !== null && starter.era !== undefined ? clamp(45 + safeNumber(starter.era, 4) * 6 + safeNumber(starter.whip, 1.2) * 10) : 50;
  out.push(factor("P1 Opposing Starter Contact Window", `${starter.starter_name || "N/A"} ERA ${starter.era ?? "N/A"} WHIP ${starter.whip ?? "N/A"}`, starterScore, "D1 starters_current", "official_probable", "Uses official probable starter stats already loaded by scheduled system."));
  const penIp = (oppBullpenRecent || []).map(x => x.bullpen_ip_text || String(x.bullpen_ip ?? "N/A")).join(" / ");
  const penAvg = (oppBullpenRecent || []).length ? (oppBullpenRecent.reduce((a, x) => a + safeNumber(x.bullpen_ip, 0), 0) / oppBullpenRecent.length) : null;
  out.push(factor("P1 Opponent Bullpen Recent IP", penIp || "N/A", penAvg === null ? 50 : clamp(50 + penAvg * 9), "mlb_statsapi_boxscore_recent_bullpen", "official_boxscore", "Recent bullpen workload; main system read-through cache."));
  const teamRuns = (teamRecent || []).map(x => safeNumber(x.runs_for, 0));
  const teamRunsDisplay = teamRuns.join(" / ");
  const teamRunsAvg = teamRuns.length ? teamRuns.reduce((a, b) => a + b, 0) / teamRuns.length : null;
  out.push(factor("P1 Team Last 5 Runs", teamRunsDisplay || "N/A", teamRunsAvg === null ? 50 : clamp(45 + teamRunsAvg * 8), "mlb_statsapi_boxscore_recent_team", "official_boxscore", "Team offense form from recent boxscores."));
  const liveValue = liveStatus ? `${liveStatus.detailed_state || liveStatus.abstract_game_state || "N/A"} ${liveStatus.away_score ?? ""}-${liveStatus.home_score ?? ""}`.trim() : "N/A";
  out.push(factor("P1 Live/Final Game State", liveValue, liveStatus ? 80 : 45, "mlb_statsapi_live_feed", "official_live_or_final", "Official game state used to verify completed/live context."));
  const subs = (teamParticipants || []).filter(x => x.is_substitution).length + (oppParticipants || []).filter(x => x.is_substitution).length;
  out.push(factor("P1 Substitution Cleanup", `${subs} substitutions tracked`, subs >= 0 ? 80 : 50, "mlb_statsapi_boxscore_lineup", "official_boxscore", "Separates starters from substitutions to prevent duplicate lineup slots."));
  return out;
}

function buildMatrix(packet) {
  const p = packet.player || {};
  const candidate = packet.candidate || {};
  const lineup = packet.lineup || {};
  const starter = packet.opposing_starter || {};
  const bullpen = packet.bullpen || {};
  const market = packet.market || {};
  const mlb = packet.mlb_api || {};
  const p1 = mlb.priority_1 || [];
  const groups = {
    identity: [
      factor("Player Identity", `${p.player_name || packet.leg.player_name} | ${p.position || "N/A"} | Bats ${p.bats || candidate.bats || "N/A"}`, p.player_name ? 90 : 55, "D1 players_current", p.confidence || "official_identity"),
      factor("Season AVG/OBP/SLG", `${p.avg ?? candidate.player_avg ?? "N/A"} / ${p.obp ?? candidate.player_obp ?? "N/A"} / ${p.slg ?? candidate.player_slg ?? "N/A"}`, p.avg ? clamp(45 + safeNumber(p.avg, .23) * 100 + safeNumber(p.obp, .32) * 40) : 50, "D1 players_current", p.confidence || "official_stats")
    ],
    role_usage: [
      factor("Lineup Slot", lineup.slot ? `Slot ${lineup.slot}` : candidate.lineup_slot ? `Slot ${candidate.lineup_slot}` : "N/A", lineup.slot || candidate.lineup_slot ? clamp(96 - ((lineup.slot || candidate.lineup_slot) - 1) * 5) : 45, "D1 lineups_current", lineup.confidence || "official_or_pregame"),
      factor("Confirmed Lineup", lineup.is_confirmed === 1 ? "Confirmed" : "Partial/Unknown", lineup.is_confirmed === 1 ? 85 : 60, "D1 lineups_current", lineup.confidence || "lineup_context")
    ],
    trend: [
      factor("Last 5 Hits", mlb.player_recent_summary && mlb.player_recent_summary.last5_hits || "N/A", mlb.player_recent_summary ? clamp(50 + safeNumber(mlb.player_recent_summary.last5_avg, 0) * 150) : 45, "MLB StatsAPI", "official_boxscore"),
      factor("Last 3 Hits Total", mlb.player_recent_summary ? String(mlb.player_recent_summary.last3_hits_total) : "N/A", mlb.player_recent_summary ? clamp(45 + safeNumber(mlb.player_recent_summary.last3_hits_total, 0) * 12) : 45, "MLB StatsAPI", "official_boxscore")
    ],
    matchup: [
      factor("Opposing Starter", `${starter.starter_name || candidate.opposing_starter || "N/A"} | Throws ${starter.throws || candidate.opposing_throws || "N/A"}`, starter.starter_name || candidate.opposing_starter ? 75 : 45, "D1 starters_current", starter.confidence || "official_probable"),
      factor("Starter ERA/WHIP", `${starter.era ?? "N/A"} / ${starter.whip ?? "N/A"}`, starter.era ? clamp(45 + safeNumber(starter.era, 4) * 6 + safeNumber(starter.whip, 1.2) * 10) : 50, "D1 starters_current", starter.confidence || "official_probable")
    ],
    environment: [
      factor("Park Factor Run/HR", `${candidate.park_factor_run ?? "N/A"} / ${candidate.park_factor_hr ?? "N/A"}`, candidate.park_factor_run ? clamp(50 + (safeNumber(candidate.park_factor_run, 1) - 1) * 100 + (safeNumber(candidate.park_factor_hr, 1) - 1) * 40) : 50, "D1 candidate pool", candidate.confidence || "controlled_candidate"),
      factor("Game State", mlb.live_status ? `${mlb.live_status.detailed_state || "N/A"}` : packet.game.status || "N/A", mlb.live_status ? 80 : 60, "MLB StatsAPI/D1", "official_schedule_live")
    ],
    market: [
      factor("Game Total", market.current_total ?? market.game_total ?? "N/A", market.current_total || market.game_total ? 70 : 45, "D1 markets_current", market.confidence || "official_schedule_or_market_shell"),
      factor("Implied Runs", `${market.home_implied_runs ?? "N/A"} / ${market.away_implied_runs ?? "N/A"}`, market.home_implied_runs || market.away_implied_runs ? 70 : 45, "D1 markets_current", market.confidence || "market_shell")
    ],
    bullpen: [
      factor("Bullpen Fatigue", bullpen.fatigue || candidate.bullpen_fatigue_tier || "N/A", bullpen.fatigue === "high" || candidate.bullpen_fatigue_tier === "high" ? 85 : 60, "D1 bullpens_current", bullpen.confidence || "official_usage_lite"),
      factor("Bullpen Recent IP", mlb.priority_1 ? (mlb.priority_1.find(x => x.label === "P1 Opponent Bullpen Recent IP") || {}).value : "N/A", mlb.priority_1 ? ((mlb.priority_1.find(x => x.label === "P1 Opponent Bullpen Recent IP") || {}).score || 50) : 50, "MLB StatsAPI", "official_boxscore")
    ],
    priority_1: p1,
    risk: [
      factor("Missing Fields", (packet.missing || []).length ? packet.missing.join(" | ") : "None", (packet.missing || []).length ? 45 : 90, "packet_validator", "controlled"),
      factor("Warnings", (packet.warnings || []).length ? packet.warnings.join(" | ") : "None", (packet.warnings || []).length ? 45 : 90, "packet_validator", "controlled")
    ]
  };
  const allFactors = Object.values(groups).flat();
  const strong = allFactors.filter(f => f.score >= 80).length;
  const review = allFactors.filter(f => f.score >= 65 && f.score < 80).length;
  const risk = allFactors.filter(f => f.score < 65).length;
  const avg = allFactors.length ? Math.round(allFactors.reduce((a, f) => a + f.score, 0) / allFactors.length) : 0;
  return { groups, summary: { total: allFactors.length, strong, review, risk, average_factor_score: avg }, version: "Main-1M Priority 1 Matrix Bridge" };
}

async function upsertLegCache(env, packet, matrix) {
  try {
    await ensureSupplementalTables(env);
    const key = `${packet.slate_date}|${packet.game_id || "NO_GAME"}|${packet.leg.team_id}|${packet.leg.player_name}|${packet.leg.prop_family}`;
    await env.DB.prepare(`INSERT INTO main_supplemental_leg_cache (cache_key, slate_date, game_id, team_id, opponent_team, player_name, prop_family, packet_json, matrix_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(cache_key) DO UPDATE SET packet_json = excluded.packet_json, matrix_json = excluded.matrix_json, updated_at = CURRENT_TIMESTAMP`)
      .bind(key, packet.slate_date, packet.game_id, packet.leg.team_id, packet.leg.opponent_team, packet.leg.player_name, packet.leg.prop_family, JSON.stringify(packet), JSON.stringify(matrix)).run();
    return { ok: true, table: "main_supplemental_leg_cache", cache_key: key, mode: "upsert_priority_1_leg_packet", rows_written: 1 };
  } catch (e) {
    return { ok: false, table: "main_supplemental_leg_cache", error: String(e && e.message || e) };
  }
}

async function buildLegPacket(env, payload) {
  const slateDate = await getSlateDate(env, payload);
  const leg = {
    leg_id: payload.leg_id || "LEG-1",
    row_index: payload.row_index || 1,
    player_name: payload.player_name,
    team_id: normalizeTeam(payload.team_id),
    opponent_team: normalizeTeam(payload.opponent_team),
    prop_type: payload.prop_type,
    prop_family: payload.prop_family || familyFromProp(payload.prop_type),
    line: payload.line,
    side: payload.side || "More",
    game_time_text: payload.game_time_text || ""
  };
  const warnings = [];
  const missing = [];
  const game = await findGame(env, leg, slateDate);
  if (!game) missing.push("game");
  const gameId = game && game.game_id || null;
  const market = gameId ? await getMarket(env, gameId) : null;
  const player = await getPlayer(env, leg.player_name, leg.team_id);
  if (!player) missing.push("player");
  const lineup = gameId ? await getLineup(env, gameId, leg.team_id, leg.player_name) : null;
  const opposingStarter = gameId ? await getStarter(env, gameId, leg.opponent_team) : null;
  if (!opposingStarter) missing.push("opposing_starter");
  const bullpen = gameId ? await getBullpen(env, gameId, leg.opponent_team) : null;
  const candidate = gameId ? await getCandidate(env, leg.prop_family, slateDate, gameId, leg.team_id, leg.opponent_team, leg.player_name) : null;
  const teamLineup = gameId ? await getTeamLineup(env, gameId, leg.team_id) : [];
  const opponentLineupD1 = gameId ? await getTeamLineup(env, gameId, leg.opponent_team) : [];
  const gameStarters = gameId ? await getGameStarters(env, gameId) : [];
  const gameBullpens = gameId ? await getGameBullpens(env, gameId) : [];
  const teamPlayers = await getTeamPlayers(env, leg.team_id);
  const opponentPlayers = await getTeamPlayers(env, leg.opponent_team);
  const relatedCandidates = gameId ? await getRelatedCandidates(env, slateDate, gameId, leg.team_id, leg.opponent_team) : { hits: [], rbi: [], rfi: [] };
  const packet = { ok: true, source: WORKER_NAME, mode: "d1_packet_plus_priority_1_mlb_api_bridge", slate_date: slateDate, leg, game, game_id: gameId, market, player, lineup, opposing_starter: opposingStarter, bullpen, recent_usage: [], candidate, team_lineup: teamLineup, opponent_lineup: opponentLineupD1, game_starters: gameStarters, game_bullpens: gameBullpens, team_players: teamPlayers, opponent_players: opponentPlayers, related_candidates: relatedCandidates, derived_flags: [], warnings, raw_payload: payload, missing };
  packet.mlb_api = await getMlbApiBridge(env, packet);
  if (packet.mlb_api && packet.mlb_api.opponent_boxscore_lineup && packet.mlb_api.opponent_boxscore_lineup.length) packet.opponent_lineup = packet.mlb_api.opponent_boxscore_lineup;
  if (packet.mlb_api && packet.mlb_api.player_recent_logs) packet.recent_usage = packet.mlb_api.player_recent_logs;
  const matrix = buildMatrix(packet);
  packet.matrix = matrix;
  packet.incremental_cache = await upsertLegCache(env, packet, matrix);
  return packet;
}

function familyFromProp(prop) {
  const p = String(prop || "").toLowerCase();
  if (p.includes("rbi")) return "RBI";
  if (p.includes("hit")) return "HITS";
  if (p.includes("run first") || p.includes("rfi")) return "RFI";
  if (p.includes("strikeout")) return "K";
  if (p.includes("total base")) return "TB";
  return "GENERIC";
}

async function handlePacketLeg(request, env) {
  const payload = await request.json().catch(() => ({}));
  const packet = await buildLegPacket(env, payload);
  return json(packet);
}

function scoreFromMatrix(matrix, candidate) {
  const avg = matrix && matrix.summary ? matrix.summary.average_factor_score : 55;
  const tierBoost = candidate && candidate.candidate_tier === "A_POOL" ? 4 : candidate && candidate.candidate_tier === "B_POOL" ? 1 : 0;
  const finalScore = clamp(Math.round(avg + tierBoost));
  return { final_score: finalScore, hit_probability: clamp(Math.round(finalScore * 0.82)), confidence: finalScore >= 80 ? "HIGH" : finalScore >= 65 ? "MEDIUM" : "LOW", verdict: finalScore >= 65 ? "QUALIFIED_CANDIDATE" : "REVIEW_ONLY" };
}

async function handleScoreLeg(request, env) {
  const payload = await request.json().catch(() => ({}));
  const packet = await buildLegPacket(env, payload);
  const s = scoreFromMatrix(packet.matrix, packet.candidate);
  return json({ ok: true, version: SYSTEM_VERSION, packet, source: WORKER_NAME, mode: "matrix_fill_priority_1_adapter_placeholder", family: packet.leg.prop_family, ...s, formula_source: "Priority 1 matrix-fill placeholder only; final scoring formula not locked; no Gemini call", warnings: packet.warnings || [], missing: packet.missing || [], reasons: [packet.candidate && packet.candidate.candidate_tier ? `Candidate tier ${packet.candidate.candidate_tier}` : "No candidate tier"], matrix_factor_summary: packet.matrix.summary, factor_scores: { identity: 1, trend: 1, matchup: 1, role_usage: 1, market: packet.market ? 1 : 0, environment: 1, risk: (packet.warnings || []).length ? 0 : 1, priority_1: packet.mlb_api && packet.mlb_api.ok ? 1 : 0 }, note: "Matrix fill and Priority 1 wiring proof only. Final scoring logic comes later." });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    const url = new URL(request.url);
    try {
      if (url.pathname === "/" || url.pathname === "/main/health") return await handleHealth(env);
      if (url.pathname === "/main/packet/leg" && request.method === "POST") return await handlePacketLeg(request, env);
      if (url.pathname === "/main/score/leg" && request.method === "POST") return await handleScoreLeg(request, env);
      return json({ ok: false, worker: WORKER_NAME, version: SYSTEM_VERSION, error: "not_found", path: url.pathname }, 404);
    } catch (e) {
      return json({ ok: false, worker: WORKER_NAME, version: SYSTEM_VERSION, error: String(e && e.message || e), stack: e && e.stack || null }, 500);
    }
  }
};
