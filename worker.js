const PRIMARY_MODEL = "gemini-2.5-pro";
const FALLBACK_MODEL = "gemini-2.5-flash";

const PROMPT_FILES = {
  ks: "score_ks_v1.txt",
  k: "score_ks_v1.txt",
  strikeouts: "score_ks_v1.txt",
  hits: "score_hits_v1.txt",
  hit: "score_hits_v1.txt",
  default: "score_default_v1.txt"
};

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (url.pathname === "/health") {
        return Response.json({
          ok: true,
          worker: "prop-ingestion-v2",
          db_bound: !!env.DB,
          ingest_token_bound: !!env.INGEST_TOKEN,
          gemini_key_bound: !!env.GEMINI_API_KEY,
          prompt_base_url_bound: !!env.PROMPT_BASE_URL,
          time: new Date().toISOString()
        });
      }

      if (url.pathname === "/ingest/run-slate" && request.method === "POST") {
        return await handleRunSlate(request, env);
      }

      if ((url.pathname === "/ingest/games" || url.pathname === "/ingest/slate") && request.method === "POST") {
        return await handleGames(request, env);
      }

      if (url.pathname === "/ingest/players" && request.method === "POST") {
        return await handlePlayers(request, env);
      }

      if (url.pathname === "/ingest/markets" && request.method === "POST") {
        return await handleMarkets(request, env);
      }

      if (url.pathname === "/ingest/upsert" && request.method === "POST") {
        return await handleUpsert(request, env);
      }

      if (url.pathname === "/packet/leg" && request.method === "POST") {
        return await handleLegPacket(request, env);
      }

      if (url.pathname === "/score/leg" && request.method === "POST") {
        return await handleScoreLeg(request, env);
      }

      if (url.pathname === "/tasks/run" && request.method === "POST") {
      return await handleTaskRun(request, env);
      }

      return Response.json({ ok: false, error: "Not found", path: url.pathname }, { status: 404 });
    } catch (err) {
      return Response.json({
        ok: false,
        error: String(err?.message || err),
        stack: String(err?.stack || "")
      }, { status: 500 });
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(event, env));
  }
};

async function handleScheduled(event, env) {
  const runId = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO ingestion_runs (run_id, job_name, started_at, status, notes)
    VALUES (?, ?, datetime('now'), ?, ?)
  `).bind(runId, "scheduled_slate_run", "running", `cron=${event.cron}`).run();

  await env.DB.prepare(`
    UPDATE ingestion_runs
    SET finished_at=datetime('now'), status=?, notes=?
    WHERE run_id=?
  `).bind("success", "scheduled hook fired; automated Gemini ingestion will be attached later", runId).run();
}

function isAuthorized(request, env) {
  return request.headers.get("x-ingest-token") === env.INGEST_TOKEN;
}

function unauthorized() {
  return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

function val(obj, key) {
  return obj && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : null;
}

async function handleRunSlate(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();

  const runId = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO ingestion_runs (run_id, job_name, started_at, status, notes)
    VALUES (?, ?, datetime('now'), ?, ?)
  `).bind(runId, "manual_slate_run", "running", "manual trigger").run();

  return Response.json({
    ok: true,
    run_id: runId,
    message: "Slate run initialized"
  });
}

async function handleGames(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();

  const body = await request.json();
  const games = Array.isArray(body.games) ? body.games : [];
  let inserted = 0;

  for (const g of games) {
    await env.DB.prepare(`
      INSERT INTO games (
        game_id, game_date, away_team, home_team,
        start_time_utc, venue, series_game, getaway_day, status, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(game_id) DO UPDATE SET
        game_date=excluded.game_date,
        away_team=excluded.away_team,
        home_team=excluded.home_team,
        start_time_utc=excluded.start_time_utc,
        venue=excluded.venue,
        series_game=excluded.series_game,
        getaway_day=excluded.getaway_day,
        status=excluded.status,
        updated_at=CURRENT_TIMESTAMP
    `).bind(
      val(g, "game_id"),
      val(g, "game_date"),
      val(g, "away_team"),
      val(g, "home_team"),
      val(g, "start_time_utc"),
      val(g, "venue"),
      val(g, "series_game"),
      g.getaway_day ? 1 : 0,
      val(g, "status") || "scheduled"
    ).run();

    inserted++;
  }

  return Response.json({ ok: true, inserted });
}

async function handlePlayers(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();

  const body = await request.json();
  const players = Array.isArray(body.players) ? body.players : [];
  let inserted = 0;

  for (const p of players) {
    if (!p.player_name) {
      return Response.json({ ok: false, error: "Missing player_name" }, { status: 400 });
    }

    await env.DB.prepare(`
      INSERT INTO players_current (
        player_name, team_id, role,
        games, innings_pitched, strikeouts,
        walks, hits_allowed, era,
        k_per_9, whip,
        ab, hits, avg, obp, slg,
        age, position, bats, throws,
        source, confidence, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(player_name) DO UPDATE SET
        team_id=excluded.team_id,
        role=excluded.role,
        games=excluded.games,
        innings_pitched=excluded.innings_pitched,
        strikeouts=excluded.strikeouts,
        walks=excluded.walks,
        hits_allowed=excluded.hits_allowed,
        era=excluded.era,
        k_per_9=excluded.k_per_9,
        whip=excluded.whip,
        ab=excluded.ab,
        hits=excluded.hits,
        avg=excluded.avg,
        obp=excluded.obp,
        slg=excluded.slg,
        age=excluded.age,
        position=excluded.position,
        bats=excluded.bats,
        throws=excluded.throws,
        source=excluded.source,
        confidence=excluded.confidence,
        updated_at=CURRENT_TIMESTAMP
    `).bind(
      val(p, "player_name"),
      val(p, "team_id"),
      val(p, "role"),
      val(p, "games"),
      val(p, "innings_pitched"),
      val(p, "strikeouts"),
      val(p, "walks"),
      val(p, "hits_allowed"),
      val(p, "era"),
      val(p, "k_per_9"),
      val(p, "whip"),
      val(p, "ab"),
      val(p, "hits"),
      val(p, "avg"),
      val(p, "obp"),
      val(p, "slg"),
      val(p, "age"),
      val(p, "position"),
      val(p, "bats"),
      val(p, "throws"),
      val(p, "source") || "manual",
      val(p, "confidence") || "manual"
    ).run();

    inserted++;
  }

  return Response.json({ ok: true, inserted });
}

async function handleMarkets(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();

  const body = await request.json();
  const markets = Array.isArray(body.markets) ? body.markets : [];
  let inserted = 0;

  for (const m of markets) {
    await env.DB.prepare(`
      INSERT INTO markets_current (
        game_id, game_total, open_total, current_total,
        away_moneyline, home_moneyline,
        away_implied_runs, home_implied_runs,
        runline, source, confidence, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(game_id) DO UPDATE SET
        game_total=excluded.game_total,
        open_total=excluded.open_total,
        current_total=excluded.current_total,
        away_moneyline=excluded.away_moneyline,
        home_moneyline=excluded.home_moneyline,
        away_implied_runs=excluded.away_implied_runs,
        home_implied_runs=excluded.home_implied_runs,
        runline=excluded.runline,
        source=excluded.source,
        confidence=excluded.confidence,
        updated_at=CURRENT_TIMESTAMP
    `).bind(
      val(m, "game_id"),
      val(m, "game_total"),
      val(m, "open_total"),
      val(m, "current_total"),
      val(m, "away_moneyline"),
      val(m, "home_moneyline"),
      val(m, "away_implied_runs"),
      val(m, "home_implied_runs"),
      val(m, "runline"),
      val(m, "source") || "manual",
      val(m, "confidence") || "manual"
    ).run();

    inserted++;
  }

  return Response.json({ ok: true, inserted });
}

async function handleUpsert(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();

  const body = await request.json();
  const table = body.table;
  const rows = Array.isArray(body.rows) ? body.rows : [];

  const allowed = {
    teams_current: ["team_id","avg","obp","slg","ops","k_rate","bb_rate","runs_per_game","hr","rbi","total_bases","run_diff","games_played","errors","dp","fielding_pct","source","confidence"],
    starters_current: ["game_id","team_id","starter_name","throws","era","whip","strikeouts","innings_pitched","walks","hits_allowed","hr_allowed","days_rest","source","confidence"],
    bullpens_current: ["game_id","team_id","bullpen_era","bullpen_whip","last_game_ip","last3_ip","fatigue","source","confidence"],
    lineups_current: ["game_id","team_id","slot","player_name","bats","k_rate","is_confirmed","source","confidence"],
    markets_current: ["game_id","game_total","open_total","current_total","away_moneyline","home_moneyline","away_implied_runs","home_implied_runs","runline","source","confidence"],
    players_current: ["player_name","team_id","role","games","innings_pitched","strikeouts","walks","hits_allowed","era","k_per_9","whip","ab","hits","avg","obp","slg","age","position","bats","throws","source","confidence"],
    player_recent_usage: ["player_name","team_id","last_pitch_count","last_innings","days_rest","last_game_ab","last_game_hits","lineup_slot"],
    games: ["game_id","game_date","away_team","home_team","start_time_utc","venue","series_game","getaway_day","status"]
  };

  if (!allowed[table]) {
    return Response.json({ ok: false, error: "Table not allowed" }, { status: 400 });
  }

  let inserted = 0;
  const cols = allowed[table];

  for (const row of rows) {
    const usedCols = cols.filter(c => row[c] !== undefined);
    if (usedCols.length === 0) continue;

    const placeholders = usedCols.map(() => "?").join(",");
    const updates = usedCols.map(c => `${c}=excluded.${c}`).join(",");

    const sql = `
      INSERT INTO ${table} (${usedCols.join(",")}, updated_at)
      VALUES (${placeholders}, CURRENT_TIMESTAMP)
      ON CONFLICT DO UPDATE SET ${updates}, updated_at=CURRENT_TIMESTAMP
    `;

    await env.DB.prepare(sql).bind(...usedCols.map(c => row[c])).run();
    inserted++;
  }

  return Response.json({ ok: true, table, inserted });
}

async function handleLegPacket(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();

  const body = await request.json();
  const result = await buildLegPacket(body, env);

  if (!result.ok) {
    return Response.json(result, { status: result.status || 400 });
  }

  return Response.json(result);
}

async function buildLegPacket(body, env) {
  const playerName = body.player_name;
  const teamId = body.team_id;
  const gameId = body.game_id;
  const propType = body.prop_type;
  const line = body.line;
  const side = body.side;

  if (!playerName || !teamId || !gameId || !propType) {
    return {
      ok: false,
      status: 400,
      error: "Missing required fields: player_name, team_id, game_id, prop_type"
    };
  }

  const game = await env.DB.prepare(`SELECT * FROM games WHERE game_id = ?`).bind(gameId).first();

  if (!game) {
    return { ok: false, status: 404, error: "Game not found" };
  }

  const opponentTeam =
    teamId === game.away_team ? game.home_team :
    teamId === game.home_team ? game.away_team :
    null;

  if (!opponentTeam) {
    return {
      ok: false,
      status: 400,
      error: "team_id does not match game away_team or home_team"
    };
  }

  const player = await env.DB.prepare(`SELECT * FROM players_current WHERE player_name = ?`).bind(playerName).first();
  const usage = await env.DB.prepare(`SELECT * FROM player_recent_usage WHERE player_name = ?`).bind(playerName).first();
  const market = await env.DB.prepare(`SELECT * FROM markets_current WHERE game_id = ?`).bind(gameId).first();
  const playerTeamProfile = await env.DB.prepare(`SELECT * FROM teams_current WHERE team_id = ?`).bind(teamId).first();
  const opponentTeamProfile = await env.DB.prepare(`SELECT * FROM teams_current WHERE team_id = ?`).bind(opponentTeam).first();

  const opponentStarter = await env.DB.prepare(`
    SELECT * FROM starters_current WHERE game_id = ? AND team_id = ?
  `).bind(gameId, opponentTeam).first();

  const opponentBullpen = await env.DB.prepare(`
    SELECT * FROM bullpens_current WHERE game_id = ? AND team_id = ?
  `).bind(gameId, opponentTeam).first();

  const opponentLineup = await env.DB.prepare(`
    SELECT * FROM lineups_current
    WHERE game_id = ? AND team_id = ?
    ORDER BY slot ASC
  `).bind(gameId, opponentTeam).all();

  return {
    ok: true,
    leg: {
      player_name: playerName,
      team_id: teamId,
      opponent_team: opponentTeam,
      game_id: gameId,
      prop_type: propType,
      line,
      side
    },
    packet: {
      player,
      usage,
      game,
      market,
      player_team_profile: playerTeamProfile,
      opponent_team_profile: opponentTeamProfile,
      opponent_starter: opponentStarter,
      opponent_bullpen: opponentBullpen,
      opponent_lineup: opponentLineup.results || []
    }
  };
}

async function handleScoreLeg(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();

  const body = await request.json();
  const packetResult = await buildLegPacket(body, env);

  if (!packetResult.ok) {
    return Response.json(packetResult, { status: packetResult.status || 400 });
  }

  if (!env.GEMINI_API_KEY) {
    return Response.json({
      ok: false,
      error: "Missing GEMINI_API_KEY secret",
      packet: packetResult
    }, { status: 500 });
  }

  const prompt = await buildScoringPromptFromRemote(packetResult, env);

  let modelUsed = PRIMARY_MODEL;
  let modelResult;

  try {
    modelResult = await callGemini(env, PRIMARY_MODEL, prompt);
  } catch (err) {
    modelUsed = FALLBACK_MODEL;
    modelResult = await callGemini(env, FALLBACK_MODEL, prompt);
  }

  return Response.json({
    ok: true,
    model_used: modelUsed,
    leg: packetResult.leg,
    packet: packetResult.packet,
    score_output: modelResult
  });
}

async function buildScoringPromptFromRemote(packetResult, env) {
  const fileName = promptFileForProp(packetResult.leg.prop_type);
  const base = String(env.PROMPT_BASE_URL || "").replace(/\/+$/, "");

  if (!base) {
    throw new Error("Missing PROMPT_BASE_URL variable");
  }

  const url = `${base}/${fileName}`;
  const res = await fetch(url, {
    headers: {
      "user-agent": "prop-engine-worker"
    }
  });

  if (!res.ok) {
    throw new Error(`Prompt fetch failed: ${res.status} ${url}`);
  }

  const template = await res.text();

  if (!template.includes("{{PACKET_JSON}}")) {
    throw new Error(`Prompt file missing {{PACKET_JSON}} placeholder: ${fileName}`);
  }

  return template.replace("{{PACKET_JSON}}", JSON.stringify(packetResult, null, 2));
}

function promptFileForProp(propType) {
  const normalized = String(propType || "").trim().toLowerCase();
  return PROMPT_FILES[normalized] || PROMPT_FILES.default;
}

async function callGemini(env, model, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 2048
      }
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
}

async function handleTaskRun(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();

  const body = await request.json();
  const job = body.job || "daily_mlb_slate";
  const taskId = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO task_runs (task_id, job_name, status, input_json)
    VALUES (?, ?, ?, ?)
  `).bind(taskId, job, "running", JSON.stringify(body)).run();

  try {
    const promptUrl = `${String(env.PROMPT_BASE_URL).replace(/\/+$/, "")}/scrape_daily_mlb_slate_v1.txt`;
    const prompt = await fetch(promptUrl).then(r => r.text());

    const raw = await callGemini(env, "gemini-2.5-flash", prompt);
    const clean = raw.replace(/```json|```/g, "").trim();
    const data = JSON.parse(clean);

    const tables = [
      "games",
      "teams_current",
      "starters_current",
      "bullpens_current",
      "markets_current",
      "lineups_current",
      "players_current",
      "player_recent_usage"
    ];

    const results = {};

    for (const table of tables) {
      const rows = Array.isArray(data[table]) ? data[table] : [];
      if (!rows.length) {
        results[table] = 0;
        continue;
      }

      const fakeRequest = new Request("https://internal/ingest/upsert", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-ingest-token": env.INGEST_TOKEN
        },
        body: JSON.stringify({ table, rows })
      });

      const res = await handleUpsert(fakeRequest, env);
      const json = await res.json();
      results[table] = json.inserted || 0;
    }

    await env.DB.prepare(`
      UPDATE task_runs
      SET status=?, finished_at=CURRENT_TIMESTAMP, output_json=?
      WHERE task_id=?
    `).bind("success", JSON.stringify(results), taskId).run();

    return Response.json({
      ok: true,
      task_id: taskId,
      job,
      inserted: results
    });

  } catch (err) {
    await env.DB.prepare(`
      UPDATE task_runs
      SET status=?, finished_at=CURRENT_TIMESTAMP, error=?
      WHERE task_id=?
    `).bind("failed", String(err.message || err), taskId).run();

    return Response.json({
      ok: false,
      task_id: taskId,
      error: String(err.message || err)
    }, { status: 500 });
  }
}
