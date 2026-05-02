const MAIN_ALPHADOG_UI_VERSION = "v1.0.01 - Independent Main UI - Deploy Test";
const ACTIVE_PROP_FAMILIES = ["HITS", "RBI", "TOTAL_BASES"];

const TEAM_NAMES = {
  ARI:"Arizona Diamondbacks", ATL:"Atlanta Braves", BAL:"Baltimore Orioles", BOS:"Boston Red Sox",
  CHC:"Chicago Cubs", CWS:"Chicago White Sox", CHW:"Chicago White Sox", CIN:"Cincinnati Reds",
  CLE:"Cleveland Guardians", COL:"Colorado Rockies", DET:"Detroit Tigers", HOU:"Houston Astros",
  KC:"Kansas City Royals", KCR:"Kansas City Royals", LAA:"Los Angeles Angels", LAD:"Los Angeles Dodgers",
  MIA:"Miami Marlins", MIL:"Milwaukee Brewers", MIN:"Minnesota Twins", NYM:"New York Mets",
  NYY:"New York Yankees", ATH:"Athletics", OAK:"Athletics", PHI:"Philadelphia Phillies",
  PIT:"Pittsburgh Pirates", SD:"San Diego Padres", SDP:"San Diego Padres", SEA:"Seattle Mariners",
  SF:"San Francisco Giants", SFG:"San Francisco Giants", STL:"St. Louis Cardinals", TB:"Tampa Bay Rays",
  TBR:"Tampa Bay Rays", TEX:"Texas Rangers", TOR:"Toronto Blue Jays", WSH:"Washington Nationals",
  WAS:"Washington Nationals"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*"
    }
  });
}

function text(data, status = 200) {
  return new Response(data, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
  });
}

function safeJsonParse(value, fallback = {}) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

function normalizePropFamily(value) {
  const v = String(value || "").toUpperCase();
  if (v === "TOTAL BASES" || v === "TB" || v === "TOTAL_BASES") return "TOTAL_BASES";
  if (v === "RBIS" || v === "RBI") return "RBI";
  if (v === "HIT" || v === "HITS") return "HITS";
  return v;
}

function propToPrizePicksStat(prop) {
  if (prop === "TOTAL_BASES") return "Total Bases";
  if (prop === "RBI") return "RBIs";
  if (prop === "HITS") return "Hits";
  return prop;
}

function normalizeOddsType(row, risk) {
  const gate = risk?.pickability_gate || {};
  const fromGate = String(gate.matched_odds_type || "").toLowerCase();
  if (["goblin", "demon", "standard"].includes(fromGate)) return fromGate === "standard" ? "regular" : fromGate;
  const fromRow = String(row.line_type || "").toLowerCase();
  if (["goblin", "demon"].includes(fromRow)) return fromRow;
  return "regular";
}

async function chooseSlate(db, requestedSlate) {
  if (requestedSlate) return requestedSlate;
  const row = await db.prepare(`
    SELECT slate_date
    FROM score_candidate_board
    WHERE COALESCE(slate_date,'') <> ''
    GROUP BY slate_date
    ORDER BY slate_date DESC
    LIMIT 1
  `).first();
  return row?.slate_date || null;
}

async function loadPrizePicksMatch(db, row, risk, activeSlate) {
  const gate = risk?.pickability_gate || {};
  const lineId = gate.matched_line_id;
  if (lineId) {
    const byId = await db.prepare(`
      SELECT line_id, player_name, team, opponent, stat_type, line_score, odds_type, start_time, slate_date, status
      FROM prizepicks_current_market_context
      WHERE line_id = ?
      LIMIT 1
    `).bind(String(lineId)).first().catch(() => null);
    if (byId) return byId;
  }

  const statType = propToPrizePicksStat(row.prop_family);
  const normalized = String(row.normalized_player_name || row.player_name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!normalized) return null;

  return await db.prepare(`
    SELECT line_id, player_name, team, opponent, stat_type, line_score, odds_type, start_time, slate_date, status
    FROM prizepicks_current_market_context
    WHERE status = 'ACTIVE'
      AND slate_date = ?
      AND lower(replace(replace(replace(player_name, ' ', ''), '.', ''), '''', '')) = ?
      AND stat_type = ?
      AND ABS(COALESCE(line_score, -999) - ?) < 0.001
    ORDER BY board_updated_at DESC
    LIMIT 1
  `).bind(activeSlate, normalized, statType, Number(row.line_number || 0)).first().catch(() => null);
}

async function board(request, env) {
  if (!env.DB) return json({ ok: false, data_ok: false, version: MAIN_ALPHADOG_UI_VERSION, error: "Missing DB binding named DB" }, 500);
  const url = new URL(request.url);
  const requestedSlate = url.searchParams.get("slate_date") || "";
  const scoreMin = Number(url.searchParams.get("score_min") || 0);
  const slateDate = await chooseSlate(env.DB, requestedSlate);
  if (!slateDate) return json({ ok: true, data_ok: false, version: MAIN_ALPHADOG_UI_VERSION, rows: [], error: "No score_candidate_board slate found" });

  const rows = (await env.DB.prepare(`
    SELECT candidate_key, score_id, run_id, sport, slate_date, player_name, normalized_player_name,
           team, opponent, prop_family, line_type, line_number, line_direction, no_vig_prob,
           final_score, confidence_grade, recommendation_status, market_confidence,
           candidate_status, candidate_rank, risk_notes, audit_payload, model_version, updated_at
    FROM score_candidate_board
    WHERE slate_date = ?
      AND final_score >= ?
      AND prop_family IN ('HITS','RBI','TOTAL_BASES')
    ORDER BY CASE candidate_status WHEN 'QUALIFIED' THEN 1 WHEN 'PLAYABLE' THEN 2 WHEN 'WATCHLIST' THEN 3 ELSE 9 END,
             COALESCE(candidate_rank, 9999) ASC,
             final_score DESC
    LIMIT 250
  `).bind(slateDate, scoreMin).all()).results || [];

  const hydrated = [];
  for (const row of rows) {
    const risk = safeJsonParse(row.risk_notes, {});
    const pp = await loadPrizePicksMatch(env.DB, row, risk, slateDate);
    const oddsType = pp?.odds_type ? String(pp.odds_type).toLowerCase() : normalizeOddsType(row, risk);
    const propFamily = normalizePropFamily(row.prop_family);
    hydrated.push({
      ...row,
      prop_family: propFamily,
      team: TEAM_NAMES[row.team] || row.team || pp?.team || "",
      opponent: TEAM_NAMES[row.opponent] || row.opponent || pp?.opponent || "",
      team_abbrev: row.team || pp?.team || "",
      opponent_abbrev: row.opponent || pp?.opponent || "",
      line_type: oddsType === "standard" ? "regular" : oddsType,
      board_line_id: pp?.line_id || risk?.pickability_gate?.matched_line_id || null,
      board_status: pp?.status || null,
      board_slate_date: pp?.slate_date || null,
      start_time: pp?.start_time || null,
      game_datetime_utc: pp?.start_time || null,
      risk_notes_parsed: risk
    });
  }

  const propCounts = hydrated.reduce((acc, r) => { acc[r.prop_family] = (acc[r.prop_family] || 0) + 1; return acc; }, {});
  const typeCounts = hydrated.reduce((acc, r) => { acc[r.line_type] = (acc[r.line_type] || 0) + 1; return acc; }, {});

  return json({
    ok: true,
    data_ok: hydrated.length > 0,
    version: MAIN_ALPHADOG_UI_VERSION,
    worker: "main_alphadog_worker",
    slate_date: slateDate,
    requested_slate_date: requestedSlate || slateDate,
    mode: "read_only_main_ui_selected_slate_no_cron_no_scheduled_jobs_no_writes",
    rows_count: hydrated.length,
    prop_families_active: ACTIVE_PROP_FAMILIES,
    prop_counts: propCounts,
    line_type_counts: typeCounts,
    rows: hydrated,
    note: "Independent AlphaDog main UI worker. Reads D1 only. Does not run scoring, cron, scheduled tasks, external APIs, Gemini, or database writes."
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS", "access-control-allow-headers": "content-type" } });
    if (url.pathname === "/main_alphadog_health") return json({ ok: true, version: MAIN_ALPHADOG_UI_VERSION, worker: "main_alphadog_worker", db_bound: Boolean(env.DB), assets_bound: Boolean(env.ASSETS) });
    if (url.pathname === "/main_alphadog_board" || url.pathname === "/ui/board") return board(request, env);

    if (env.ASSETS) {
      if (url.pathname === "/") {
        const indexUrl = new URL(request.url);
        indexUrl.pathname = "/index.html";
        return env.ASSETS.fetch(new Request(indexUrl, request));
      }
      if (["/index.html", "/main_alphadog_logo.png", "/main_alphadog_favicon.png", "/main_alphadog_apple_touch_icon.png"].includes(url.pathname)) {
        return env.ASSETS.fetch(request);
      }
    }
    return text("AlphaDog main UI route not found", 404);
  }
};
