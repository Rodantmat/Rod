// AlphaDog v1.2.83 - Incremental Base Control compatible worker
// RFI GUARDED TIER CAP ACTIVE
const SYSTEM_VERSION = "v1.2.83 - Incremental Base Control";
const SYSTEM_CODENAME = "Incremental Base Control";
const BOARD_QUEUE_BUILD_CHUNK_LIMIT = 12;
const BOARD_QUEUE_AUTO_BUILD_CHUNK_LIMIT = 96;
const BOARD_QUEUE_AUTO_MINE_LIMIT = 5;
const BOARD_QUEUE_RETRY_LIMIT = 5;
const BOARD_QUEUE_RUNTIME_CUTOFF_MS = 20000;
const WORKER_DEPLOY_TARGET = "alphadog-phase3-starter-groups";
const PRIMARY_MODEL = "gemini-2.5-pro";
const FALLBACK_MODEL = "gemini-2.5-flash";
const SCRAPE_MODEL = "gemini-2.5-flash";
const SCRAPE_FALLBACK_MODEL = "gemini-2.5-pro";
const JOB_DISPLAY_LABELS = {
  run_full_pipeline: "SCRAPE > FULL RUN",
  scheduled_full_pipeline_plus_board_queue: "SCRAPE > FULL RUN + Board Queue Pipeline",
  daily_mlb_slate: "SCRAPE > Daily MLB Slate",
  scrape_games_markets: "SCRAPE > Markets",
  board_sifter_preview: "SCRAPE > Board Sifter Preview",
  board_queue_preview: "SCRAPE > Board Queue Preview",
  board_queue_build: "SCRAPE > Board Queue Build",
  board_queue_auto_build: "SCRAPE > Board Queue Auto Build",
  run_board_queue_pipeline: "SCRAPE > Board Queue Pipeline",
  board_queue_mine_one: "SCRAPE > Board Queue Mine One Raw",
  board_queue_auto_mine: "SCRAPE > Board Queue Auto Mine Raw",
  board_queue_repair: "REPAIR > Board Queue Raw State",
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
  scrape_recent_usage: "SCRAPE > Usage",
  scrape_static_venues: "STATIC > Scrape Venues",
  scrape_static_team_aliases: "STATIC > Scrape Team Aliases",
  scrape_static_players: "STATIC > Scrape Players (Legacy All)",
  scrape_static_players_g1: "STATIC > Scrape Players G1",
  scrape_static_players_g2: "STATIC > Scrape Players G2",
  scrape_static_players_g3: "STATIC > Scrape Players G3",
  scrape_static_players_g4: "STATIC > Scrape Players G4",
  scrape_static_players_g5: "STATIC > Scrape Players G5",
  scrape_static_players_g6: "STATIC > Scrape Players G6",
  scrape_static_player_splits_test_5: "STATIC > Scrape Splits Test 5",
  scrape_static_player_splits_g1: "STATIC > Scrape Splits G1",
  scrape_static_player_splits_g2: "STATIC > Scrape Splits G2",
  scrape_static_player_splits_g3: "STATIC > Scrape Splits G3",
  scrape_static_player_splits_g4: "STATIC > Scrape Splits G4",
  scrape_static_player_splits_g5: "STATIC > Scrape Splits G5",
  scrape_static_player_splits_g6: "STATIC > Scrape Splits G6",
  scrape_static_game_logs_g1: "STATIC > Scrape Game Logs G1",
  scrape_static_game_logs_g2: "STATIC > Scrape Game Logs G2",
  scrape_static_game_logs_g3: "STATIC > Scrape Game Logs G3",
  scrape_static_game_logs_g4: "STATIC > Scrape Game Logs G4",
  scrape_static_game_logs_g5: "STATIC > Scrape Game Logs G5",
  scrape_static_game_logs_g6: "STATIC > Scrape Game Logs G6",
  scrape_static_bvp_current_slate: "STATIC > Scrape BvP Current Slate",
  scrape_static_all_fast: "STATIC > Scrape All Fast",
  schedule_static_temp_refresh_once: "STATIC TEMP > Schedule Weekly Refresh Test",
  run_static_temp_refresh_tick: "STATIC TEMP > Run One Refresh Tick",
  check_static_temp_venues: "CHECK TEMP > Static Venues Temp",
  check_static_temp_team_aliases: "CHECK TEMP > Team Aliases Temp",
  check_static_temp_players: "CHECK TEMP > Players Temp",
  check_static_temp_all: "CHECK TEMP > All Static Temp",
  audit_static_temp_certification: "CERTIFY TEMP > Audit Static Temp",
  promote_static_temp_to_live: "CERTIFY TEMP > Promote Temp To Live",
  clean_static_temp_tables: "CERTIFY TEMP > Clean Static Temp",
  weekly_static_temp_refresh_auto: "SCHEDULED > Weekly Static Temp Refresh Auto",
  incremental_base_game_logs_g1: "INCREMENTAL > Base Game Logs G1",
  incremental_base_game_logs_g2: "INCREMENTAL > Base Game Logs G2",
  incremental_base_game_logs_g3: "INCREMENTAL > Base Game Logs G3",
  incremental_base_game_logs_g4: "INCREMENTAL > Base Game Logs G4",
  incremental_base_game_logs_g5: "INCREMENTAL > Base Game Logs G5",
  incremental_base_game_logs_g6: "INCREMENTAL > Base Game Logs G6",
  incremental_base_splits_g1: "INCREMENTAL > Base Splits G1",
  incremental_base_splits_g2: "INCREMENTAL > Base Splits G2",
  incremental_base_splits_g3: "INCREMENTAL > Base Splits G3",
  incremental_base_splits_g4: "INCREMENTAL > Base Splits G4",
  incremental_base_splits_g5: "INCREMENTAL > Base Splits G5",
  incremental_base_splits_g6: "INCREMENTAL > Base Splits G6",
  incremental_base_derived_metrics: "INCREMENTAL > Build Base Derived Metrics",
  check_incremental_game_logs: "CHECK > Incremental Game Logs",
  check_incremental_player_splits: "CHECK > Incremental Player Splits",
  check_incremental_derived_metrics: "CHECK > Incremental Derived Metrics",
  check_incremental_all: "CHECK > Incremental All",
  check_static_venues: "CHECK > Static Venues",
  check_static_team_aliases: "CHECK > Static Team Aliases",
  check_static_players: "CHECK > Static Players",
  check_static_player_splits: "CHECK > Static Player Splits",
  check_static_game_logs: "CHECK > Static Game Logs",
  check_static_bvp: "CHECK > Static BvP",
  check_static_all: "CHECK > All Static Data"
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


async function safeEnsureColumn(env, tableName, columnName, columnSpec) {
  try {
    const info = await env.DB.prepare(`PRAGMA table_info(${tableName})`).all();
    const cols = (info.results || []).map(r => String(r.name || '').toLowerCase());
    if (!cols.includes(String(columnName).toLowerCase())) {
      await env.DB.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnSpec}`).run();
      return { column: columnName, added: true };
    }
    return { column: columnName, added: false };
  } catch (err) {
    return { column: columnName, added: false, error: String(err?.message || err) };
  }
}

async function safeTableColumns(env, tableName) {
  try {
    const info = await env.DB.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set((info.results || []).map(r => String(r.name || '').toLowerCase()));
  } catch (_) { return new Set(); }
}

async function ensureStarterCompatibilityColumns(env) {
  const added = [];
  const dataSource = await safeEnsureColumn(env, 'starters_current', 'data_source', 'TEXT');
  added.push(dataSource);
  try {
    await env.DB.prepare(`
      UPDATE starters_current
      SET data_source = COALESCE(data_source, source)
      WHERE data_source IS NULL AND source IS NOT NULL
    `).run();
  } catch (err) {
    added.push({ column: 'data_source_backfill', added: false, error: String(err?.message || err) });
  }
  return { ok: true, table: 'starters_current', columns: added };
}

function normalizeStarterNameForGuard(name) { return String(name || '').trim(); }
function isUnknownStarterName(name) {
  const v = normalizeStarterNameForGuard(name).toLowerCase();
  if (!v) return true;
  return ['tbd','tba','unknown','starter','no probable pitcher','no starter','not available','unavailable','null','none'].includes(v);
}
function starterSourceText(row) { return `${String(row?.source || '')} ${String(row?.data_source || '')} ${String(row?.confidence || '')}`.toLowerCase(); }
function isManualStarterSource(row) { return starterSourceText(row).includes('manual'); }
function isFallbackStarterSource(row) {
  const text = starterSourceText(row);
  return text.includes('fallback') || text.includes('projected') || text.includes('gemini_live_missing_starter') || text.includes('gemini_live_projected_missing_starter') || text.includes('gemini_live_probable_missing_starter');
}
function isOfficialStarterSource(row) {
  const text = starterSourceText(row);
  return text.includes('official') || text.includes('mlb_statsapi_probable_pitcher') || text.includes('probable');
}
function shouldProtectExistingStarter(existing, incoming) {
  if (!existing) return false;
  const existingValid = !isUnknownStarterName(existing.starter_name);
  const incomingValid = !isUnknownStarterName(incoming?.starter_name);
  if (existingValid && !incomingValid) return true;
  if (existingValid && isManualStarterSource(existing) && !isManualStarterSource(incoming)) return true;
  if (existingValid && isOfficialStarterSource(existing) && isFallbackStarterSource(incoming) && !isOfficialStarterSource(incoming)) return true;
  return false;
}
async function sanitizeStarterRowsForProtectedUpsert(env, rows) {
  await ensureStarterCompatibilityColumns(env).catch(() => null);
  const out = [], skipped = [];
  const existingStmt = env.DB.prepare(`SELECT * FROM starters_current WHERE game_id=? AND team_id=? LIMIT 1`);
  for (const raw of rows || []) {
    const row = { ...(raw || {}) };
    row.team_id = String(row.team_id || '').toUpperCase();
    if (!row.data_source && row.source) row.data_source = row.source;
    if (!row.source && row.data_source) row.source = row.data_source;
    if (isUnknownStarterName(row.starter_name)) {
      skipped.push({ game_id: row.game_id || null, team_id: row.team_id || null, starter_name: row.starter_name || null, reason: 'incoming_blank_tbd_unknown_rejected' });
      continue;
    }
    let existing = null;
    try { existing = await existingStmt.bind(row.game_id, row.team_id).first(); } catch (_) { existing = null; }
    if (shouldProtectExistingStarter(existing, row)) {
      skipped.push({ game_id: row.game_id || null, team_id: row.team_id || null, existing_starter: existing?.starter_name || null, incoming_starter: row.starter_name || null, existing_source: existing?.source || existing?.data_source || null, incoming_source: row.source || row.data_source || null, reason: 'protected_existing_starter_preserved' });
      continue;
    }
    out.push(row);
  }
  return { rows: out, skipped };
}
async function stopFutureDuplicateRawResultsForQueue(env, queueId) {
  try {
    await env.DB.prepare(`
      DELETE FROM board_factor_results
      WHERE queue_id = ?
        AND (status <> 'COMPLETED' OR COALESCE(factor_count,0) <= 0 OR raw_json NOT LIKE '%"raw_mode":true%' OR raw_json NOT LIKE '%"raw_factors"%')
    `).bind(queueId).run();
  } catch (_) {}
}
async function writeCanonicalBoardFactorResult(env, queueRow, model, summary, parsed) {
  await stopFutureDuplicateRawResultsForQueue(env, queueRow.queue_id);
  const resultId = `${queueRow.queue_id}|RESULT`;
  const rawJson = JSON.stringify(parsed);
  const existingValid = await validRawResultForQueue(env, queueRow.queue_id);
  if (existingValid) return { result_id: existingValid.result_id, reused_existing: true };
  try {
    await env.DB.prepare(`
      INSERT INTO board_factor_results (result_id, queue_id, slate_date, queue_type, scope_type, scope_key, batch_index, status, model, factor_count, min_score, max_score, avg_score, raw_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(result_id) DO UPDATE SET
        status='COMPLETED', model=excluded.model, factor_count=excluded.factor_count,
        min_score=excluded.min_score, max_score=excluded.max_score, avg_score=excluded.avg_score,
        raw_json=excluded.raw_json, updated_at=CURRENT_TIMESTAMP
    `).bind(resultId, queueRow.queue_id, queueRow.slate_date, queueRow.queue_type, queueRow.scope_type, queueRow.scope_key, queueRow.batch_index, model, summary.factor_count, null, null, null, rawJson).run();
  } catch (_) {
    await env.DB.prepare(`DELETE FROM board_factor_results WHERE result_id=?`).bind(resultId).run().catch(() => null);
    await env.DB.prepare(`INSERT INTO board_factor_results (result_id, queue_id, slate_date, queue_type, scope_type, scope_key, batch_index, status, model, factor_count, min_score, max_score, avg_score, raw_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(resultId, queueRow.queue_id, queueRow.slate_date, queueRow.queue_type, queueRow.scope_type, queueRow.scope_key, queueRow.batch_index, model, summary.factor_count, null, null, null, rawJson).run();
  }
  return { result_id: resultId, reused_existing: false };
}
async function chooseFairBoardQueueType(env, slateDate) {
  const row = await env.DB.prepare(`
    WITH q AS (
      SELECT queue_type,
        SUM(CASE WHEN ((status='PENDING') OR (status='RETRY_LATER' AND updated_at < datetime('now', '-' || ((CASE WHEN COALESCE(retry_count,0) < 1 THEN 1 ELSE COALESCE(retry_count,0) END) * 5) || ' minutes'))) AND COALESCE(attempt_count,0) < ? THEN 1 ELSE 0 END) AS available_rows,
        SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending_rows,
        SUM(CASE WHEN status='RETRY_LATER' THEN 1 ELSE 0 END) AS retry_later_rows,
        SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed_queue_rows,
        COUNT(*) AS total_queue_rows
      FROM board_factor_queue
      WHERE slate_date=?
      GROUP BY queue_type
    ), r AS (
      SELECT queue_type,
        COUNT(DISTINCT CASE WHEN status='COMPLETED' AND COALESCE(factor_count,0) > 0 THEN queue_id ELSE NULL END) AS completed_result_queues
      FROM board_factor_results
      WHERE slate_date=?
      GROUP BY queue_type
    )
    SELECT q.queue_type, q.available_rows, q.pending_rows, q.retry_later_rows,
      q.completed_queue_rows, q.total_queue_rows, COALESCE(r.completed_result_queues,0) AS completed_result_queues,
      CASE q.queue_type
        WHEN 'PLAYER_D_ADVANCED_FORM_CONTACT' THEN 1
        WHEN 'GAME_NEWS_INJURY_CONTEXT' THEN 2
        WHEN 'GAME_WEATHER_CONTEXT' THEN 3
        WHEN 'PLAYER_A_ROLE_RECENT_MATCHUP' THEN 4
        WHEN 'GAME_B_TEAM_BULLPEN_ENVIRONMENT' THEN 5
        ELSE 99
      END AS family_priority
    FROM q LEFT JOIN r ON r.queue_type=q.queue_type
    WHERE q.available_rows > 0
    ORDER BY COALESCE(r.completed_result_queues,0) ASC,
      CAST(COALESCE(r.completed_result_queues,0) AS REAL) / CASE WHEN q.total_queue_rows > 0 THEN q.total_queue_rows ELSE 1 END ASC,
      family_priority ASC,
      q.available_rows DESC
    LIMIT 1
  `).bind(BOARD_QUEUE_RETRY_LIMIT, slateDate, slateDate).first();
  return row?.queue_type ? String(row.queue_type) : '';
}

async function ensurePipelineLocksTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS pipeline_locks (
      lock_id TEXT PRIMARY KEY,
      status TEXT DEFAULT 'IDLE',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      locked_by TEXT,
      note TEXT
    )
  `).run();
  return { ok: true, table: 'pipeline_locks' };
}

async function acquirePipelineLock(env, lockId, lockedBy, staleMinutes = 15) {
  await ensurePipelineLocksTable(env);
  await env.DB.prepare(`
    INSERT OR IGNORE INTO pipeline_locks (lock_id, status, updated_at, locked_by, note)
    VALUES (?, 'IDLE', CURRENT_TIMESTAMP, NULL, 'auto-created')
  `).bind(lockId).run();
  const res = await env.DB.prepare(`
    UPDATE pipeline_locks
    SET status='RUNNING', updated_at=CURRENT_TIMESTAMP, locked_by=?, note='acquired'
    WHERE lock_id=?
      AND (
        status IS NULL OR status <> 'RUNNING'
        OR updated_at < datetime('now', '-' || ? || ' minutes')
      )
  `).bind(lockedBy, lockId, String(staleMinutes)).run();
  const acquired = Number(res?.meta?.changes || 0) > 0;
  const row = await env.DB.prepare(`SELECT * FROM pipeline_locks WHERE lock_id=?`).bind(lockId).first();
  return { acquired, lock_id: lockId, locked_by: lockedBy, current: row || null };
}

async function releasePipelineLock(env, lockId, lockedBy) {
  try {
    const res = await env.DB.prepare(`
      UPDATE pipeline_locks
      SET status='IDLE', updated_at=CURRENT_TIMESTAMP, locked_by=NULL, note='released'
      WHERE lock_id=? AND (locked_by=? OR locked_by IS NULL OR status <> 'RUNNING')
    `).bind(lockId, lockedBy).run();
    return { released: Number(res?.meta?.changes || 0) > 0, lock_id: lockId };
  } catch (err) {
    return { released: false, lock_id: lockId, error: String(err?.message || err) };
  }
}

async function resetStalePipelineRuntime(env, slateDate = null) {
  const audit = { task_runs_reset: 0, queue_rows_reset: 0, locks_reset: 0 };
  try {
    const taskRes = await env.DB.prepare(`
      UPDATE task_runs
      SET status='stale_reset', finished_at=CURRENT_TIMESTAMP, error='v1.2.73 stale running task reset before lock acquisition'
      WHERE status='running'
        AND started_at < datetime('now','-15 minutes')
        AND job_name IN ('run_full_pipeline','scheduled_full_pipeline_plus_board_queue','board_queue_auto_mine','run_board_queue_pipeline')
    `).run();
    audit.task_runs_reset = Number(taskRes?.meta?.changes || 0);
  } catch (err) { audit.task_runs_error = String(err?.message || err); }
  try {
    const lockRes = await env.DB.prepare(`
      UPDATE pipeline_locks
      SET status='IDLE', updated_at=CURRENT_TIMESTAMP, locked_by=NULL, note='v1.2.73 stale lock reset'
      WHERE status='RUNNING'
        AND updated_at < datetime('now','-15 minutes')
    `).run();
    audit.locks_reset = Number(lockRes?.meta?.changes || 0);
  } catch (err) { audit.locks_error = String(err?.message || err); }
  try {
    const queueRes = slateDate
      ? await env.DB.prepare(`
          UPDATE board_factor_queue
          SET status='RETRY_LATER', last_error=COALESCE(last_error,'v1.2.73 stale RUNNING queue reset')
          WHERE slate_date=? AND status='RUNNING'
        `).bind(slateDate).run()
      : await env.DB.prepare(`
          UPDATE board_factor_queue
          SET status='RETRY_LATER', last_error=COALESCE(last_error,'v1.2.73 stale RUNNING queue reset')
          WHERE status='RUNNING'
        `).run();
    audit.queue_rows_reset = Number(queueRes?.meta?.changes || 0);
  } catch (err) { audit.queue_rows_error = String(err?.message || err); }
  return audit;
}

async function boardQueueTotals(env, slateDate) {
  const row = await env.DB.prepare(`
    SELECT COUNT(*) AS total_rows,
      SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending_rows,
      SUM(CASE WHEN status='RETRY_LATER' THEN 1 ELSE 0 END) AS retry_later_rows,
      SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed_rows,
      SUM(CASE WHEN status='RUNNING' THEN 1 ELSE 0 END) AS running_rows,
      SUM(CASE WHEN status='ERROR' THEN 1 ELSE 0 END) AS error_rows
    FROM board_factor_queue WHERE slate_date=?
  `).bind(slateDate).first();
  const total = Number(row?.total_rows || 0);
  const completed = Number(row?.completed_rows || 0);
  return {
    total_rows: total,
    pending_rows: Number(row?.pending_rows || 0),
    retry_later_rows: Number(row?.retry_later_rows || 0),
    completed_rows: completed,
    running_rows: Number(row?.running_rows || 0),
    error_rows: Number(row?.error_rows || 0),
    percent_complete: total > 0 ? Math.round((completed / total) * 1000) / 10 : 100
  };
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
    note: "materializes one Cloudflare-safe board-derived factor queue slice; no Gemini calls"
  },
  board_queue_auto_build: {
    prompt: null,
    tables: ["mlb_stats", "board_factor_queue"],
    note: "auto-materializes all board-derived factor queue families using lightweight payloads; no Gemini calls"
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
  board_queue_auto_mine: {
    prompt: null,
    tables: ["board_factor_queue", "board_factor_results"],
    note: "mines a Cloudflare-safe batch of pending board factor queue rows with Gemini; no prop scoring"
  },
  board_queue_repair: {
    prompt: null,
    tables: ["board_factor_queue", "board_factor_results"],
    note: "repairs queue/result status only: completed raw results win, stale running rows return to pending, optional error reset; no Gemini and no scoring"
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

  scrape_static_venues: {
    prompt: null,
    tables: ["ref_venues"],
    note: "manual static venue reference rebuild from MLB StatsAPI plus controlled supplemental fields"
  },
  scrape_static_team_aliases: {
    prompt: null,
    tables: ["ref_team_aliases"],
    note: "manual static team alias dictionary rebuild from MLB StatsAPI"
  },
  scrape_static_players: {
    prompt: null,
    tables: ["ref_players"],
    note: "legacy all-team static active-player identity rebuild; prefer G1-G6 to avoid subrequest limits"
  },
  scrape_static_players_g1: { prompt: null, tables: ["ref_players"], note: "manual static active-player identity rebuild group 1; wipes ref_players first" },
  scrape_static_players_g2: { prompt: null, tables: ["ref_players"], note: "manual static active-player identity rebuild group 2; append only" },
  scrape_static_players_g3: { prompt: null, tables: ["ref_players"], note: "manual static active-player identity rebuild group 3; append only" },
  scrape_static_players_g4: { prompt: null, tables: ["ref_players"], note: "manual static active-player identity rebuild group 4; append only" },
  scrape_static_players_g5: { prompt: null, tables: ["ref_players"], note: "manual static active-player identity rebuild group 5; append only" },
  scrape_static_players_g6: { prompt: null, tables: ["ref_players"], note: "manual static active-player identity rebuild group 6; append only" },
  scrape_static_player_splits_test_5: { prompt: null, tables: ["ref_player_splits"], note: "safe 5-player static splits smoke test; does not wipe table" },
  scrape_static_player_splits_g1: { prompt: null, tables: ["ref_player_splits"], note: "manual static player standard splits group 1" },
  scrape_static_player_splits_g2: { prompt: null, tables: ["ref_player_splits"], note: "manual static player standard splits group 2" },
  scrape_static_player_splits_g3: { prompt: null, tables: ["ref_player_splits"], note: "manual static player standard splits group 3" },
  scrape_static_player_splits_g4: { prompt: null, tables: ["ref_player_splits"], note: "manual static player standard splits group 4" },
  scrape_static_player_splits_g5: { prompt: null, tables: ["ref_player_splits"], note: "manual static player standard splits group 5" },
  scrape_static_player_splits_g6: { prompt: null, tables: ["ref_player_splits"], note: "manual static player standard splits group 6" },
  scrape_static_game_logs_g1: { prompt: null, tables: ["player_game_logs"], note: "manual static player game logs group 1" },
  scrape_static_game_logs_g2: { prompt: null, tables: ["player_game_logs"], note: "manual static player game logs group 2" },
  scrape_static_game_logs_g3: { prompt: null, tables: ["player_game_logs"], note: "manual static player game logs group 3" },
  scrape_static_game_logs_g4: { prompt: null, tables: ["player_game_logs"], note: "manual static player game logs group 4" },
  scrape_static_game_logs_g5: { prompt: null, tables: ["player_game_logs"], note: "manual static player game logs group 5" },
  scrape_static_game_logs_g6: { prompt: null, tables: ["player_game_logs"], note: "manual static player game logs group 6" },
  scrape_static_bvp_current_slate: {
    prompt: null,
    tables: ["ref_bvp_history"],
    note: "manual on-demand BvP history for current slate batter/probable-pitcher pairs"
  },
  scrape_static_all_fast: {
    prompt: null,
    tables: ["ref_venues", "ref_team_aliases", "ref_players"],
    note: "manual fast static foundation rebuild: venues + team aliases + active player reference"
  },
  schedule_static_temp_refresh_once: { prompt: null, tables: ["ref_venues_temp", "ref_team_aliases_temp", "ref_players_temp"], note: "schedule one protected temp-only weekly static refresh test; live tables are untouched" },
  run_static_temp_refresh_tick: { prompt: null, tables: ["ref_venues_temp", "ref_team_aliases_temp", "ref_players_temp"], note: "manually execute one temp-only refresh step; live tables are untouched" },
  check_static_temp_venues: { prompt: null, tables: ["ref_venues_temp"], note: "check static temp venue staging table" },
  check_static_temp_team_aliases: { prompt: null, tables: ["ref_team_aliases_temp"], note: "check static temp team alias staging table" },
  check_static_temp_players: { prompt: null, tables: ["ref_players_temp"], note: "check static temp player staging table" },
  check_static_temp_all: { prompt: null, tables: ["ref_venues_temp", "ref_team_aliases_temp", "ref_players_temp"], note: "check all static temp staging tables" },
  audit_static_temp_certification: { prompt: null, tables: ["ref_venues_temp", "ref_team_aliases_temp", "ref_players_temp", "static_temp_certification_audits"], note: "certify temp static tables before promotion" },
  promote_static_temp_to_live: { prompt: null, tables: ["ref_venues", "ref_team_aliases", "ref_players", "ref_venues_temp", "ref_team_aliases_temp", "ref_players_temp"], note: "promote certified temp static tables to live trusted tables" },
  clean_static_temp_tables: { prompt: null, tables: ["ref_venues_temp", "ref_team_aliases_temp", "ref_players_temp"], note: "clean temp static staging tables after successful promotion" },
  incremental_base_game_logs_g1: { prompt: null, tables: ["player_game_logs"], note: "incremental history base game logs group 1" },
  incremental_base_game_logs_g2: { prompt: null, tables: ["player_game_logs"], note: "incremental history base game logs group 2" },
  incremental_base_game_logs_g3: { prompt: null, tables: ["player_game_logs"], note: "incremental history base game logs group 3" },
  incremental_base_game_logs_g4: { prompt: null, tables: ["player_game_logs"], note: "incremental history base game logs group 4" },
  incremental_base_game_logs_g5: { prompt: null, tables: ["player_game_logs"], note: "incremental history base game logs group 5" },
  incremental_base_game_logs_g6: { prompt: null, tables: ["player_game_logs"], note: "incremental history base game logs group 6" },
  incremental_base_splits_g1: { prompt: null, tables: ["ref_player_splits"], note: "incremental history base player splits group 1" },
  incremental_base_splits_g2: { prompt: null, tables: ["ref_player_splits"], note: "incremental history base player splits group 2" },
  incremental_base_splits_g3: { prompt: null, tables: ["ref_player_splits"], note: "incremental history base player splits group 3" },
  incremental_base_splits_g4: { prompt: null, tables: ["ref_player_splits"], note: "incremental history base player splits group 4" },
  incremental_base_splits_g5: { prompt: null, tables: ["ref_player_splits"], note: "incremental history base player splits group 5" },
  incremental_base_splits_g6: { prompt: null, tables: ["ref_player_splits"], note: "incremental history base player splits group 6" },
  incremental_base_derived_metrics: { prompt: null, tables: ["incremental_player_metrics"], note: "derive rolling player metrics from game logs" },
  check_incremental_game_logs: { prompt: null, tables: ["player_game_logs"], note: "check incremental game log base coverage" },
  check_incremental_player_splits: { prompt: null, tables: ["ref_player_splits"], note: "check incremental player split base coverage" },
  check_incremental_derived_metrics: { prompt: null, tables: ["incremental_player_metrics"], note: "check derived incremental metrics coverage" },
  check_incremental_all: { prompt: null, tables: ["player_game_logs", "ref_player_splits", "incremental_player_metrics"], note: "check all incremental base tables" },

  check_static_venues: { prompt: null, tables: ["ref_venues"], note: "check static venue reference" },
  check_static_team_aliases: { prompt: null, tables: ["ref_team_aliases"], note: "check static team alias dictionary" },
  check_static_players: { prompt: null, tables: ["ref_players"], note: "check static player reference" },
  check_static_player_splits: { prompt: null, tables: ["ref_player_splits"], note: "check static player splits" },
  check_static_game_logs: { prompt: null, tables: ["player_game_logs"], note: "check static game logs" },
  check_static_bvp: { prompt: null, tables: ["ref_bvp_history"], note: "check BvP history" },
  check_static_all: { prompt: null, tables: ["ref_venues", "ref_team_aliases", "ref_players", "ref_player_splits", "player_game_logs", "ref_bvp_history"], note: "check all static data" },
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
    allowed: ["game_id", "team_id", "starter_name", "throws", "era", "whip", "strikeouts", "innings_pitched", "walks", "hits_allowed", "hr_allowed", "days_rest", "source", "data_source", "confidence"],
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

function isAuthorized(request, env) {
  const expected = env && env.INGEST_TOKEN;
  if (!expected) return true;
  return request.headers.get("x-ingest-token") === expected;
}

function unauthorized() {
  return json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method === "OPTIONS") {
        return new Response(null, { headers: CORS_HEADERS });
      }

      if (url.pathname === "/health") { const h = health(env); await logSystemEvent(env, { trigger_source: "control_room_debug", action_label: "DEBUG > Health", job_name: "health", status: "success", http_status: 200, output_preview: h }); return json(h); }
      if (url.pathname === "/health/daily") return withCors(await handleDailyHealth(request, env));
      if (url.pathname === "/debug/sql" && request.method === "POST") return await handleDebugSQL(request, env);
      if (url.pathname === "/deferred/full-run" && request.method === "POST") return withCors(await handleDeferredFullRunRequest(request, env));
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
    // v1.2.82: all old scheduled mining/full-run work stays paused.
    // Allowed cron behavior only:
    //   * * * * *  => advances one protected static-temp pipeline step if a request is due.
    //   0 8 * * 1  => schedules the weekly Monday 1:00 AM PT/PDT static-temp certification pipeline.
    ctx.waitUntil((async () => {
      const cron = String(event?.cron || '').trim();
      let result;
      if (cron === '0 8 * * 1') {
        const scheduled = await scheduleStaticTempRefreshOnce({ job: 'weekly_static_temp_refresh_auto', trigger: 'scheduled_weekly_cron', cron, weekly_schedule: 'Monday 1:00 AM PT/PDT' }, env);
        const tick = await runStaticTempScheduledTick({ cron, trigger: 'scheduled_weekly_cron_start', job: 'run_static_temp_refresh_tick' }, env);
        result = { ok: true, data_ok: !!scheduled.data_ok || scheduled.status === 'already_scheduled_or_running', version: SYSTEM_VERSION, job: 'weekly_static_temp_refresh_auto', status: 'weekly_refresh_scheduled', cron, weekly_schedule: 'Monday 1:00 AM PT/PDT', scheduled, first_tick: tick, live_tables_touched: false, note: 'Weekly static refresh started in _temp only. Minute cron will finish scrape, certify, promote only if A+/A, then clean temp.' };
      } else if (cron === '* * * * *') {
        result = await runStaticTempScheduledTick({ cron, trigger: 'scheduled_minute_tick', job: 'run_static_temp_refresh_tick' }, env);
      } else {
        result = { ok: true, version: SYSTEM_VERSION, job: 'scheduled_router', status: 'paused_disabled', cron, note: 'Old scheduled tasks remain paused. No mining queues, full-run jobs, slate tables, splits, game logs, or BvP tables were mutated.' };
      }
      console.log(JSON.stringify(result));
    })());
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
    worker: WORKER_DEPLOY_TARGET,
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
    "board_queue_auto_mine",
    "board_queue_repair",
    "scrape_players_mlb_api",
    "scrape_players",
    "scrape_players_mlb_api_g1",
    "scrape_players_mlb_api_g2",
    "scrape_players_mlb_api_g3",
    "scrape_players_mlb_api_g4",
    "scrape_players_mlb_api_g5",
    "scrape_players_mlb_api_g6",
    "scrape_static_venues",
    "scrape_static_team_aliases",
    "scrape_static_players",
    "scrape_static_players_g1",
    "scrape_static_players_g2",
    "scrape_static_players_g3",
    "scrape_static_players_g4",
    "scrape_static_players_g5",
    "scrape_static_players_g6",
    "scrape_static_player_splits_test_5",
    "scrape_static_player_splits_g1",
    "scrape_static_player_splits_g2",
    "scrape_static_player_splits_g3",
    "scrape_static_player_splits_g4",
    "scrape_static_player_splits_g5",
    "scrape_static_player_splits_g6",
    "scrape_static_game_logs_g1",
    "scrape_static_game_logs_g2",
    "scrape_static_game_logs_g3",
    "scrape_static_game_logs_g4",
    "scrape_static_game_logs_g5",
    "scrape_static_game_logs_g6",
    "scrape_static_bvp_current_slate",
    "scrape_static_all_fast",
    "schedule_static_temp_refresh_once",
    "run_static_temp_refresh_tick",
    "check_static_temp_venues",
    "check_static_temp_team_aliases",
    "check_static_temp_players",
    "check_static_temp_all",
    "audit_static_temp_certification",
    "promote_static_temp_to_live",
    "clean_static_temp_tables",
    "incremental_base_game_logs_g1",
    "incremental_base_game_logs_g2",
    "incremental_base_game_logs_g3",
    "incremental_base_game_logs_g4",
    "incremental_base_game_logs_g5",
    "incremental_base_game_logs_g6",
    "incremental_base_splits_g1",
    "incremental_base_splits_g2",
    "incremental_base_splits_g3",
    "incremental_base_splits_g4",
    "incremental_base_splits_g5",
    "incremental_base_splits_g6",
    "incremental_base_derived_metrics",
    "check_incremental_game_logs",
    "check_incremental_player_splits",
    "check_incremental_derived_metrics",
    "check_incremental_all",
    "check_static_venues",
    "check_static_team_aliases",
    "check_static_players",
    "check_static_player_splits",
    "check_static_game_logs",
    "check_static_bvp",
    "check_static_all"
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
  const cron = event?.cron || null;
  const input = { job: "scheduled_router", cron, slate_mode: "AUTO", trigger: "scheduled" };
  const slate = resolveSlateDate(input);
  const cronText = String(cron || "").trim();

  await ensureDeferredFullRunTable(env).catch(() => null);
  await resetStaleDeferredFullRuns(env).catch(() => null);

  if (cronText === "* * * * *") {
    const due = await runDueDeferredFullRun(env);
    return {
      ok: true,
      version: SYSTEM_VERSION,
      job: "scheduled_router",
      routed_job: "deferred_full_run_once_poller",
      cron,
      result: due,
      scheduler_alignment: "v1.2.73 keeps the temporary one-minute one-shot Full Run poller only for deferred Full Run requests. Persistent mining remains handled by the separate */2 cron; static data jobs are manual/control-room only.",
      note: "Temporary one-shot background Full Run poller. Keep for now; remove after scheduler/miner reliability is fully proven."
    };
  }

  let routedJob = "board_queue_auto_mine";
  if (cronText === "0 12 * * *") routedJob = "run_full_pipeline";
  else if (cronText === "*/2 * * * *") routedJob = "board_queue_auto_mine";
  else if (cronText === "0 15 * * *") routedJob = "board_queue_auto_mine";
  else if (cronText === "30 18 * * *") routedJob = "board_queue_auto_mine";

  await resetStalePipelineRuntime(env, slate.slate_date).catch(() => null);
  await ensureStarterCompatibilityColumns(env).catch(() => null);
  await logSystemEvent(env, { trigger_source: "scheduled", action_label: `SCHEDULED > ${displayLabelForJob(routedJob)}`, job_name: routedJob, slate_date: slate.slate_date, slate_mode: slate.slate_mode, status: "started", task_id: taskId, input_json: { ...input, routed_job: routedJob } });

  await env.DB.prepare(`
    INSERT INTO task_runs (task_id, job_name, status, started_at, input_json)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
  `).bind(taskId, routedJob, "running", JSON.stringify({ ...input, routed_job: routedJob })).run();

  try {
    let result;
    if (routedJob === "run_full_pipeline") {
      result = await runFullPipeline({ ...input, job: "run_full_pipeline", slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
    } else if (routedJob === "board_queue_auto_mine") {
      result = await runBoardQueueAutoMine({ ...input, job: "board_queue_auto_mine", slate_date: slate.slate_date, slate_mode: slate.slate_mode, limit: BOARD_QUEUE_AUTO_MINE_LIMIT, retry_errors: false, persistent_miner: true }, env);
    } else {
      result = await executeTaskJob(routedJob, input, slate, env);
    }
    const wrapped = {
      ok: !!result?.ok,
      version: SYSTEM_VERSION,
      job: "scheduled_router",
      routed_job: routedJob,
      cron,
      result,
      scheduler_alignment: "v1.2.73 routes the */2 cron to one bounded persistent miner invocation. No scheduled invocation runs Full Pipeline + Queue Pipeline + Auto Mine together. Static reference scrapers are not scheduled.",
      note: "Persistent miner active: every 2 minutes it mines one family in a 20-second time box, uses independent locks, retries with backoff, and leaves scoring disabled."
    };
    await env.DB.prepare(`
      UPDATE task_runs
      SET status = ?, finished_at = CURRENT_TIMESTAMP, output_json = ?
      WHERE task_id = ?
    `).bind(wrapped.ok ? "success" : "failed", JSON.stringify(wrapped), taskId).run();
    await logSystemEvent(env, { trigger_source: "scheduled", action_label: `SCHEDULED > ${displayLabelForJob(routedJob)}`, job_name: routedJob, slate_date: slate.slate_date, slate_mode: slate.slate_mode, status: wrapped.ok ? "success" : "failed", task_id: taskId, output_preview: wrapped, error: wrapped.ok ? null : "scheduled_routed_job_failed" });
    return wrapped;
  } catch (err) {
    const result = { ok: false, version: SYSTEM_VERSION, job: "scheduled_router", routed_job: routedJob, status: "FAILED_EXCEPTION", cron, error: String(err?.message || err) };
    await env.DB.prepare(`
      UPDATE task_runs SET status='failed', finished_at=CURRENT_TIMESTAMP, error=?, output_json=? WHERE task_id=?
    `).bind(result.error, JSON.stringify(result), taskId).run().catch(() => null);
    await logSystemEvent(env, { trigger_source: "scheduled", action_label: `SCHEDULED > ${displayLabelForJob(routedJob)}`, job_name: routedJob, slate_date: slate.slate_date, slate_mode: slate.slate_mode, status: "failed", task_id: taskId, error: result.error });
    return result;
  }
}

async function ensureDeferredFullRunTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS deferred_full_run_once (
      request_id TEXT PRIMARY KEY,
      job_name TEXT DEFAULT 'run_full_pipeline',
      slate_date TEXT NOT NULL,
      slate_mode TEXT DEFAULT 'AUTO',
      status TEXT DEFAULT 'PENDING',
      requested_at TEXT DEFAULT CURRENT_TIMESTAMP,
      run_after TEXT NOT NULL,
      started_at TEXT,
      finished_at TEXT,
      task_id TEXT,
      requested_by TEXT,
      output_json TEXT,
      error TEXT
    )
  `).run();
}

async function resetStaleDeferredFullRuns(env) {
  await ensureDeferredFullRunTable(env);
  const res = await env.DB.prepare(`
    UPDATE deferred_full_run_once
    SET status='PENDING', started_at=NULL, error='stale deferred run reset to pending'
    WHERE status='RUNNING'
      AND started_at < datetime('now','-15 minutes')
  `).run();
  return { stale_deferred_reset: Number(res?.meta?.changes || 0) };
}

async function handleDeferredFullRunRequest(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();
  await ensureDeferredFullRunTable(env);
  const body = await safeJson(request);
  const slate = resolveSlateDate(body || {});
  const existing = await env.DB.prepare(`
    SELECT request_id, status, run_after, requested_at
    FROM deferred_full_run_once
    WHERE status IN ('PENDING','RUNNING')
      AND job_name='run_full_pipeline'
      AND slate_date=?
    ORDER BY requested_at DESC
    LIMIT 1
  `).bind(slate.slate_date).first();
  if (existing) {
    return json({ ok: true, version: SYSTEM_VERSION, job: "deferred_full_run_once", status: "ALREADY_SCHEDULED", slate_date: slate.slate_date, existing_request: existing, message: "A one-shot background Full Run is already pending or running. Do not click Full Run again. Check Scheduler Log / Tasks / queue health in about 15 minutes.", note: "Temporary v1.2.73 one-shot Full Run mode." });
  }
  const requestId = `deferred_full_run|${slate.slate_date}|${Date.now()}|${crypto.randomUUID()}`;
  const runAfter = new Date(Date.now() + 60 * 1000).toISOString().replace('T',' ').replace(/\.\d{3}Z$/, '');
  await env.DB.prepare(`
    INSERT INTO deferred_full_run_once (request_id, job_name, slate_date, slate_mode, status, run_after, requested_by)
    VALUES (?, 'run_full_pipeline', ?, ?, 'PENDING', ?, 'control_room_full_run_button')
  `).bind(requestId, slate.slate_date, slate.slate_mode, runAfter).run();
  await logSystemEvent(env, { trigger_source: "control_room_button", action_label: "SCRAPE > FULL RUN scheduled one-shot", job_name: "deferred_full_run_once", slate_date: slate.slate_date, slate_mode: slate.slate_mode, status: "scheduled", http_status: 200, task_id: requestId, input_json: { request_id: requestId, run_after: runAfter } });
  return json({ ok: true, version: SYSTEM_VERSION, job: "deferred_full_run_once", status: "SCHEDULED_ONE_SHOT", request_id: requestId, slate_date: slate.slate_date, slate_mode: slate.slate_mode, run_after: runAfter, message: "Full Run scheduled for the backend in about 1 minute. Do not keep Safari open for this run. Check Scheduler Log, Tasks, Health, or queue health in about 15 minutes.", temporary_test_mode: true, removal_note: "This one-shot scheduling mode is temporary and should be removed after scheduler/miner reliability is fully proven." });
}

async function runDueDeferredFullRun(env) {
  await ensureDeferredFullRunTable(env);
  await resetStaleDeferredFullRuns(env);
  const row = await env.DB.prepare(`
    SELECT * FROM deferred_full_run_once
    WHERE status='PENDING'
      AND run_after <= CURRENT_TIMESTAMP
    ORDER BY run_after ASC, requested_at ASC
    LIMIT 1
  `).first();
  if (!row) return { ok: true, status: "NO_DEFERRED_FULL_RUN_DUE", checked_at: new Date().toISOString() };
  const taskId = crypto.randomUUID();
  const claim = await env.DB.prepare(`
    UPDATE deferred_full_run_once
    SET status='RUNNING', started_at=CURRENT_TIMESTAMP, task_id=?
    WHERE request_id=? AND status='PENDING'
  `).bind(taskId, row.request_id).run();
  if (Number(claim?.meta?.changes || 0) === 0) return { ok: true, status: "DEFERRED_FULL_RUN_ALREADY_CLAIMED", request_id: row.request_id };
  const input = { job: "run_full_pipeline", slate_date: row.slate_date, slate_mode: row.slate_mode || "AUTO", trigger: "deferred_one_shot", request_id: row.request_id };
  await logSystemEvent(env, { trigger_source: "scheduled_deferred_one_shot", action_label: "SCHEDULED ONE-SHOT > FULL RUN", job_name: "run_full_pipeline", slate_date: row.slate_date, slate_mode: row.slate_mode || "AUTO", status: "started", task_id: taskId, input_json: input });
  await env.DB.prepare(`
    INSERT INTO task_runs (task_id, job_name, status, started_at, input_json)
    VALUES (?, 'run_full_pipeline', 'running', CURRENT_TIMESTAMP, ?)
  `).bind(taskId, JSON.stringify(input)).run();
  try {
    const result = await runFullPipeline(input, env);
    const ok = !!result?.ok;
    await env.DB.prepare(`UPDATE task_runs SET status=?, finished_at=CURRENT_TIMESTAMP, output_json=? WHERE task_id=?`).bind(ok ? "success" : "failed", JSON.stringify(result), taskId).run();
    await env.DB.prepare(`UPDATE deferred_full_run_once SET status=?, finished_at=CURRENT_TIMESTAMP, output_json=?, error=? WHERE request_id=?`).bind(ok ? "COMPLETED" : "FAILED", JSON.stringify(result), ok ? null : String(result?.error || result?.status || "full_run_failed"), row.request_id).run();
    await logSystemEvent(env, { trigger_source: "scheduled_deferred_one_shot", action_label: "SCHEDULED ONE-SHOT > FULL RUN", job_name: "run_full_pipeline", slate_date: row.slate_date, slate_mode: row.slate_mode || "AUTO", status: ok ? "success" : "failed", task_id: taskId, output_preview: result, error: ok ? null : String(result?.error || result?.status || "full_run_failed") });
    return { ok, status: ok ? "DEFERRED_FULL_RUN_COMPLETED" : "DEFERRED_FULL_RUN_FAILED", request_id: row.request_id, task_id: taskId, result };
  } catch (err) {
    const msg = String(err?.message || err);
    await env.DB.prepare(`UPDATE task_runs SET status='failed', finished_at=CURRENT_TIMESTAMP, error=? WHERE task_id=?`).bind(msg, taskId).run().catch(() => null);
    await env.DB.prepare(`UPDATE deferred_full_run_once SET status='FAILED', finished_at=CURRENT_TIMESTAMP, error=? WHERE request_id=?`).bind(msg, row.request_id).run().catch(() => null);
    await logSystemEvent(env, { trigger_source: "scheduled_deferred_one_shot", action_label: "SCHEDULED ONE-SHOT > FULL RUN", job_name: "run_full_pipeline", slate_date: row.slate_date, slate_mode: row.slate_mode || "AUTO", status: "failed", task_id: taskId, error: msg });
    return { ok: false, status: "DEFERRED_FULL_RUN_EXCEPTION", request_id: row.request_id, task_id: taskId, error: msg };
  }
}


async function logSystemEvent(env, event = {}) {
  try {
    await ensureSystemEventLog(env);
    await env.DB.prepare(`INSERT INTO system_event_log (event_id, version, trigger_source, action_label, job_name, slate_date, slate_mode, status, http_status, task_id, input_json, output_preview, error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      crypto.randomUUID(), SYSTEM_VERSION, String(event.trigger_source || "unknown"), event.action_label ? String(event.action_label) : null, event.job_name ? String(event.job_name) : null, event.slate_date ? String(event.slate_date) : null, event.slate_mode ? String(event.slate_mode) : null, event.status ? String(event.status) : null, Number.isFinite(Number(event.http_status)) ? Number(event.http_status) : null, event.task_id ? String(event.task_id) : null, event.input_json ? compactLogText(event.input_json) : null, event.output_preview ? compactLogText(event.output_preview) : null, event.error ? compactLogText(event.error) : null
    ).run();
  } catch (_) {}
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

  let body = null;
  try {
    body = await safeJson(request);
    const sql = String(body?.sql || "").trim();
    await logSystemEvent(env, { trigger_source: "control_room_sql", action_label: "MANUAL/CHECK SQL", job_name: "debug_sql", status: sql ? "started" : "missing_sql", input_json: { sql: sql.slice(0, 1200) } });
    if (!sql) { await logSystemEvent(env, { trigger_source: "control_room_sql", action_label: "MANUAL/CHECK SQL", job_name: "debug_sql", status: "failed", http_status: 400, error: "Missing SQL" }); return json({ ok: false, error: "Missing SQL" }, { status: 400 }); }

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

    const responseBody = { ok: true, version: SYSTEM_VERSION, manual_sql_output_guard: { enabled: true, default_max_rows: 50, hard_max_rows: 100 }, outputs };
    await logSystemEvent(env, { trigger_source: "control_room_sql", action_label: "MANUAL/CHECK SQL", job_name: "debug_sql", status: "success", http_status: 200, output_preview: responseBody });
    return json(responseBody);
  } catch (err) {
    await logSystemEvent(env, { trigger_source: "control_room_sql", action_label: "MANUAL/CHECK SQL", job_name: "debug_sql", status: "failed", http_status: 500, input_json: body, error: String(err?.message || err) });
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
      retry_count INTEGER DEFAULT 0,
      last_error TEXT,
      payload_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_processed_at TEXT
    )
  `).run();
  await safeEnsureColumn(env, 'board_factor_queue', 'status', "TEXT DEFAULT 'PENDING'");
  await safeEnsureColumn(env, 'board_factor_queue', 'attempt_count', 'INTEGER DEFAULT 0');
  await safeEnsureColumn(env, 'board_factor_queue', 'retry_count', 'INTEGER DEFAULT 0');
  await safeEnsureColumn(env, 'board_factor_queue', 'last_error', 'TEXT');
  await safeEnsureColumn(env, 'board_factor_queue', 'updated_at', 'TEXT DEFAULT CURRENT_TIMESTAMP');
  await safeEnsureColumn(env, 'board_factor_queue', 'last_processed_at', 'TEXT');
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_board_factor_queue_slate_type_status ON board_factor_queue (slate_date, queue_type, status)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_board_factor_queue_scope ON board_factor_queue (scope_type, scope_key)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_board_factor_queue_state_pick ON board_factor_queue (slate_date, status, attempt_count, updated_at)`).run();
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
- PLAYER_BATCH_2 or PLAYER_BATCH_4: return exactly one item per player in payload.players.
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

function isValidRawBoardResultRow(row) {
  if (!row) return false;
  if (String(row.status || "") !== "COMPLETED") return false;
  if (Number(row.factor_count || 0) <= 0) return false;
  const raw = String(row.raw_json || "");
  return raw.includes('"raw_mode":true') && raw.includes('"items"') && raw.includes('"raw_factors"');
}

async function validRawResultForQueue(env, queueId) {
  const row = await env.DB.prepare(`
    SELECT result_id, status, factor_count, raw_json
    FROM board_factor_results
    WHERE queue_id = ? AND status = 'COMPLETED' AND factor_count > 0
    ORDER BY created_at DESC, result_id DESC
    LIMIT 1
  `).bind(queueId).first();
  return isValidRawBoardResultRow(row) ? row : null;
}

function isTransientMiningError(msg) {
  const text = String(msg || "").toLowerCase();
  return [
    "load failed", "fetch", "network", "connection", "timeout", "timed out",
    "too many api requests", "rate limit", "429", "503", "502", "504",
    "temporarily", "overloaded", "deadline", "aborted", "quota"
  ].some(x => text.includes(x));
}

async function repairBoardQueueRawState(env, slateDate, options = {}) {
  await ensureBoardFactorQueueTable(env);
  await ensureBoardFactorResultsTable(env);
  const resetErrors = options.reset_errors === true || options.reset_error_rows === true;

  const completedFromRaw = await env.DB.prepare(`
    UPDATE board_factor_queue
    SET status='COMPLETED', last_error=NULL, updated_at=CURRENT_TIMESTAMP
    WHERE slate_date = ?
      AND queue_id IN (
        SELECT DISTINCT queue_id
        FROM board_factor_results
        WHERE slate_date = ?
          AND status = 'COMPLETED'
          AND factor_count > 0
          AND raw_json LIKE '%"raw_mode":true%'
          AND raw_json LIKE '%"raw_factors"%'
      )
      AND status <> 'COMPLETED'
  `).bind(slateDate, slateDate).run();

  const duplicatePending = await env.DB.prepare(`
    UPDATE board_factor_queue
    SET status='COMPLETED', last_error=NULL, updated_at=CURRENT_TIMESTAMP
    WHERE slate_date = ?
      AND status = 'PENDING'
      AND EXISTS (
        SELECT 1 FROM board_factor_results r
        WHERE r.queue_id = board_factor_queue.queue_id
          AND r.status = 'COMPLETED'
          AND r.factor_count > 0
          AND r.raw_json LIKE '%"raw_mode":true%'
          AND r.raw_json LIKE '%"raw_factors"%'
      )
  `).bind(slateDate).run();

  const staleRunning = await env.DB.prepare(`
    UPDATE board_factor_queue
    SET status='RETRY_LATER', last_error=COALESCE(last_error,'v1.2.73 stale RUNNING queue reset'), updated_at=CURRENT_TIMESTAMP, last_processed_at=CURRENT_TIMESTAMP
    WHERE slate_date = ? AND status = 'RUNNING' AND updated_at < datetime('now', '-10 minutes')
  `).bind(slateDate).run();

  let resetErrorRows = { meta: { changes: 0 } };
  if (resetErrors) {
    resetErrorRows = await env.DB.prepare(`
      UPDATE board_factor_queue
      SET status='RETRY_LATER', attempt_count=0, retry_count=0, last_error=NULL, updated_at=CURRENT_TIMESTAMP
      WHERE slate_date = ?
        AND status = 'ERROR'
        AND NOT EXISTS (
          SELECT 1 FROM board_factor_results r
          WHERE r.queue_id = board_factor_queue.queue_id
            AND r.status = 'COMPLETED'
            AND r.factor_count > 0
            AND r.raw_json LIKE '%"raw_mode":true%'
            AND r.raw_json LIKE '%"raw_factors"%'
        )
    `).bind(slateDate).run();
  }

  const health = await boardRows(env, `
    SELECT queue_type, status, COUNT(*) AS rows_count
    FROM board_factor_queue
    WHERE slate_date = ?
    GROUP BY queue_type, status
    ORDER BY queue_type, status
  `, [slateDate]);

  return {
    ok: true,
    job: "board_queue_repair",
    version: SYSTEM_VERSION,
    status: "pass",
    slate_date: slateDate,
    changes: {
      completed_from_valid_raw_results: Number(completedFromRaw?.meta?.changes || 0),
      duplicate_pending_completed: Number(duplicatePending?.meta?.changes || 0),
      stale_running_returned_to_pending: Number(staleRunning?.meta?.changes || 0),
      error_rows_reset_to_pending: Number(resetErrorRows?.meta?.changes || 0)
    },
    queue_health: health.rows,
    note: "Queue-state repair only. Valid raw results win and protect against duplicate mining. RUNNING rows are returned to PENDING. ERROR rows are reset only when reset_errors=true. No Gemini, no scoring, no ranking."
  };
}

async function runBoardQueueRepair(input, env) {
  const slateDate = String(input.slate_date || resolveSlateDate(input).slate_date);
  return await repairBoardQueueRawState(env, slateDate, input || {});
}

async function runBoardQueueMineOne(input, env) {
  await ensureBoardFactorQueueTable(env);
  await ensureBoardFactorResultsTable(env);
  const slateDate = String(input.slate_date || resolveSlateDate(input).slate_date);
  const preferredType = String(input.queue_type || "").trim();
  await repairBoardQueueRawState(env, slateDate, { reset_errors: false });
  const binds = preferredType ? [slateDate, preferredType, BOARD_QUEUE_RETRY_LIMIT] : [slateDate, BOARD_QUEUE_RETRY_LIMIT];
  const typeWhere = preferredType ? "AND q.queue_type = ?" : "";
  const next = await env.DB.prepare(`
    SELECT q.* FROM board_factor_queue q
    WHERE q.slate_date = ? ${typeWhere}
      AND (
        q.status = 'PENDING'
        OR (
          q.status = 'RETRY_LATER'
          AND q.updated_at < datetime('now', '-' || ((CASE WHEN COALESCE(q.retry_count,0) < 1 THEN 1 ELSE COALESCE(q.retry_count,0) END) * 5) || ' minutes')
        )
      )
      AND COALESCE(q.attempt_count, 0) < ?
      AND NOT EXISTS (
        SELECT 1 FROM board_factor_results r
        WHERE r.queue_id = q.queue_id
          AND r.status = 'COMPLETED'
          AND r.factor_count > 0
          AND r.raw_json LIKE '%"raw_mode":true%'
          AND r.raw_json LIKE '%"raw_factors"%'
      )
    ORDER BY COALESCE(q.attempt_count, 0) ASC,
      CASE q.queue_type
        WHEN 'GAME_B_TEAM_BULLPEN_ENVIRONMENT' THEN 1
        WHEN 'GAME_WEATHER_CONTEXT' THEN 2
        WHEN 'GAME_NEWS_INJURY_CONTEXT' THEN 3
        WHEN 'PLAYER_D_ADVANCED_FORM_CONTACT' THEN 4
        WHEN 'PLAYER_A_ROLE_RECENT_MATCHUP' THEN 5
        ELSE 99
      END,
      COALESCE(q.last_processed_at, q.updated_at, q.created_at) ASC,
      q.batch_index ASC,
      q.queue_id ASC
    LIMIT 1
  `).bind(...binds).first();

  if (!next) {
    const health = await boardRows(env, `SELECT queue_type, status, COUNT(*) AS rows_count FROM board_factor_queue WHERE slate_date = ? GROUP BY queue_type, status ORDER BY queue_type, status`, [slateDate]);
    return { ok: true, job: "board_queue_mine_one", version: SYSTEM_VERSION, status: "empty", slate_date: slateDate, message: "No pending board factor queue row without a valid raw result was found.", queue_health: health.rows, note: "No Gemini call made. Duplicate raw-result protection is active." };
  }

  const alreadyRaw = await validRawResultForQueue(env, next.queue_id);
  if (alreadyRaw) {
    await env.DB.prepare(`UPDATE board_factor_queue SET status='COMPLETED', last_error=NULL, updated_at=CURRENT_TIMESTAMP, last_processed_at=CURRENT_TIMESTAMP WHERE queue_id=?`).bind(next.queue_id).run();
    const health = await boardRows(env, `SELECT queue_type, status, COUNT(*) AS rows_count FROM board_factor_queue WHERE slate_date = ? GROUP BY queue_type, status ORDER BY queue_type, status`, [slateDate]);
    return { ok: true, job: "board_queue_mine_one", version: SYSTEM_VERSION, status: "skipped_existing_raw_result", slate_date: slateDate, skipped_queue: { queue_id: next.queue_id, queue_type: next.queue_type, batch_index: next.batch_index }, existing_result_id: alreadyRaw.result_id, queue_health: health.rows, note: "Skipped this queue row because a valid raw result already exists. No Gemini call made." };
  }

  await env.DB.prepare(`UPDATE board_factor_queue SET status='RUNNING', attempt_count=attempt_count+1, last_error=NULL, updated_at=CURRENT_TIMESTAMP WHERE queue_id=? AND status IN ('PENDING','RETRY_LATER')`).bind(next.queue_id).run();
  const model = SCRAPE_MODEL;
  try {
    const hydratedNext = await hydrateQueueRowPayloadIfNeeded(env, next);
    const hydratedPayload = parseStoredBoardPayload(hydratedNext.payload_json);
    const mined = await callGeminiRawWithValidation(env, hydratedNext);
    const parsed = mined.parsed;
    parsed.validation = { ok: true, attempts: mined.attempts };
    parsed.queue_id = next.queue_id; parsed.queue_type = next.queue_type; parsed.scope_type = next.scope_type; parsed.slate_date = next.slate_date;
    const summary = summarizeRawFactorPayload(parsed);
    const canonicalWrite = await writeCanonicalBoardFactorResult(env, next, model, summary, parsed);
    const resultId = canonicalWrite.result_id;
    await env.DB.prepare(`UPDATE board_factor_queue SET status='COMPLETED', last_error=NULL, updated_at=CURRENT_TIMESTAMP, last_processed_at=CURRENT_TIMESTAMP WHERE queue_id=?`).bind(next.queue_id).run();
    const queueHealth = await boardRows(env, `SELECT queue_type, status, COUNT(*) AS rows_count FROM board_factor_queue WHERE slate_date = ? GROUP BY queue_type, status ORDER BY queue_type, status`, [slateDate]);
    return { ok: true, job: "board_queue_mine_one", version: SYSTEM_VERSION, status: "pass", slate_date: slateDate, mined_queue: { queue_id: next.queue_id, queue_type: next.queue_type, scope_type: next.scope_type, batch_index: next.batch_index, player_count: next.player_count, game_count: next.game_count, payload_injected_before_gemini: isBoardQueuePayloadEnriched(hydratedPayload, hydratedNext.queue_type) }, result_id: resultId, canonical_result_write: true, reused_existing_result: canonicalWrite.reused_existing, model, raw_factor_summary: summary, validation: parsed.validation, queue_health: queueHealth.rows, note: "Mined exactly one queue row as raw factor extraction. v1.2.73 canonical result write is active: future successful writes use one deterministic result row per queue_id. Old duplicate rows are preserved for audit. No backend scoring, no prop scoring, no ranking, no candidate logic." };
  } catch (err) {
    const msg = String(err?.message || err).slice(0, 900);
    const validationAttempts = Array.isArray(err?.validation_attempts) ? err.validation_attempts : [];
    if (isTransientMiningError(msg)) {
      const attemptsUsed = Number(next.attempt_count || 0) + 1;
      if (attemptsUsed >= BOARD_QUEUE_RETRY_LIMIT) {
        const flagged = `retry_exhausted_after_${BOARD_QUEUE_RETRY_LIMIT}_attempts: ${msg}`.slice(0, 900);
        await env.DB.prepare(`UPDATE board_factor_queue SET status='ERROR', last_error=?, updated_at=CURRENT_TIMESTAMP, last_processed_at=CURRENT_TIMESTAMP WHERE queue_id=?`).bind(flagged, next.queue_id).run();
        const queueHealth = await boardRows(env, `SELECT queue_type, status, COUNT(*) AS rows_count FROM board_factor_queue WHERE slate_date = ? GROUP BY queue_type, status ORDER BY queue_type, status`, [slateDate]);
        return { ok: false, job: "board_queue_mine_one", version: SYSTEM_VERSION, status: "retry_exhausted_flagged", slate_date: slateDate, failed_queue: { queue_id: next.queue_id, queue_type: next.queue_type, batch_index: next.batch_index, attempts_used: attemptsUsed }, error: flagged, validation_attempts: validationAttempts, queue_health: queueHealth.rows, note: "Transient/API failure exhausted the per-row retry limit. Queue row was flagged ERROR with last_error so it is visible, and scheduled/full-run repair can reset it for a future retry wave. No scoring, no ranking." };
      }
      await env.DB.prepare(`UPDATE board_factor_queue SET status='RETRY_LATER', retry_count=COALESCE(retry_count,0)+1, last_error=?, updated_at=CURRENT_TIMESTAMP, last_processed_at=CURRENT_TIMESTAMP WHERE queue_id=?`).bind(msg, next.queue_id).run();
      const queueHealth = await boardRows(env, `SELECT queue_type, status, COUNT(*) AS rows_count FROM board_factor_queue WHERE slate_date = ? GROUP BY queue_type, status ORDER BY queue_type, status`, [slateDate]);
      return { ok: false, job: "board_queue_mine_one", version: SYSTEM_VERSION, status: "retry_later", slate_date: slateDate, retry_queue: { queue_id: next.queue_id, queue_type: next.queue_type, batch_index: next.batch_index, attempts_used: attemptsUsed, retry_limit: BOARD_QUEUE_RETRY_LIMIT }, error: msg, validation_attempts: validationAttempts, queue_health: queueHealth.rows, note: "Transient/network/API failure. Queue row was moved to RETRY_LATER with backoff until the per-row retry limit is exhausted. No scoring, no ranking." };
    }
    await env.DB.prepare(`UPDATE board_factor_queue SET status='ERROR', last_error=?, updated_at=CURRENT_TIMESTAMP, last_processed_at=CURRENT_TIMESTAMP WHERE queue_id=?`).bind(msg, next.queue_id).run();
    return { ok: false, job: "board_queue_mine_one", version: SYSTEM_VERSION, status: "failed", slate_date: slateDate, failed_queue: { queue_id: next.queue_id, queue_type: next.queue_type, batch_index: next.batch_index, attempts_used: Number(next.attempt_count || 0) + 1 }, error: msg, validation_attempts: validationAttempts, note: "One queue row failed only after backend raw JSON/schema validation and one compact retry, or another non-transient backend failure. It was marked ERROR. No backend scoring, prop scoring, or ranking was attempted." };
  }
}


async function runBoardQueueAutoMineCore(input, env) {
  await ensureBoardFactorQueueTable(env);
  await ensureBoardFactorResultsTable(env);
  const slateDate = String(input.slate_date || resolveSlateDate(input).slate_date);
  const preferredType = String(input.queue_type || "").trim();
  const requestedLimit = Number(input.limit || input.max_rows || input.max_mines || BOARD_QUEUE_AUTO_MINE_LIMIT);
  const mineLimit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : BOARD_QUEUE_AUTO_MINE_LIMIT, BOARD_QUEUE_AUTO_MINE_LIMIT));
  const retryErrors = input.retry_errors === true || input.reset_errors === true;
  const steps = [];
  const startedMs = Date.now();
  const selectedQueueType = preferredType || await chooseFairBoardQueueType(env, slateDate);
  let minedCount = 0;
  let completedByExisting = 0;
  let retryLaterCount = 0;
  let failedCount = 0;
  let emptyReached = false;

  const repairBefore = await repairBoardQueueRawState(env, slateDate, { reset_errors: retryErrors });
  const beforeTotals = await env.DB.prepare(`
    SELECT COUNT(*) AS total_rows,
      SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending_rows,
      SUM(CASE WHEN status='RETRY_LATER' THEN 1 ELSE 0 END) AS retry_later_rows,
      SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed_rows,
      SUM(CASE WHEN status='RUNNING' THEN 1 ELSE 0 END) AS running_rows,
      SUM(CASE WHEN status='ERROR' THEN 1 ELSE 0 END) AS error_rows
    FROM board_factor_queue WHERE slate_date=?
  `).bind(slateDate).first();

  for (let i = 0; i < mineLimit; i++) {
    if (Date.now() - startedMs > BOARD_QUEUE_RUNTIME_CUTOFF_MS) {
      steps.push({ pass: i + 1, ok: true, status: "runtime_cutoff", selected_queue_type: selectedQueueType, elapsed_ms: Date.now() - startedMs });
      break;
    }
    if (!selectedQueueType) { emptyReached = true; break; }
    const result = await runBoardQueueMineOne({ ...(input || {}), slate_date: slateDate, queue_type: selectedQueueType }, env);
    steps.push({
      pass: i + 1,
      ok: !!result.ok,
      status: result.status,
      mined_queue: result.mined_queue || null,
      skipped_queue: result.skipped_queue || null,
      retry_queue: result.retry_queue || null,
      failed_queue: result.failed_queue || null,
      result_id: result.result_id || result.existing_result_id || null,
      error: result.error || null
    });
    if (result.status === "pass") minedCount++;
    if (result.status === "skipped_existing_raw_result") completedByExisting++;
    if (result.status === "empty") { emptyReached = true; break; }
    if (result.status === "retry_later") { retryLaterCount++; continue; }
    if (!result.ok || result.status === "failed" || result.status === "retry_exhausted_flagged") { failedCount++; continue; }
  }

  const repairAfter = await repairBoardQueueRawState(env, slateDate, { reset_errors: false });
  const queueHealth = await boardRows(env, `SELECT queue_type, status, COUNT(*) AS rows_count FROM board_factor_queue WHERE slate_date = ? GROUP BY queue_type, status ORDER BY queue_type, status`, [slateDate]);
  const resultHealth = await boardRows(env, `SELECT queue_type, status, COUNT(*) AS rows_count, SUM(factor_count) AS raw_factor_rows FROM board_factor_results WHERE slate_date = ? GROUP BY queue_type, status ORDER BY queue_type, status`, [slateDate]);
  const totals = await env.DB.prepare(`
    SELECT COUNT(*) AS total_rows,
      SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending_rows,
      SUM(CASE WHEN status='RETRY_LATER' THEN 1 ELSE 0 END) AS retry_later_rows,
      SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed_rows,
      SUM(CASE WHEN status='RUNNING' THEN 1 ELSE 0 END) AS running_rows,
      SUM(CASE WHEN status='ERROR' THEN 1 ELSE 0 END) AS error_rows
    FROM board_factor_queue WHERE slate_date=?
  `).bind(slateDate).first();
  const totalRows = Number(totals?.total_rows || 0);
  const pending = Number(totals?.pending_rows || 0);
  const completed = Number(totals?.completed_rows || 0);
  const running = Number(totals?.running_rows || 0);
  const retryLater = Number(totals?.retry_later_rows || 0);
  const errors = Number(totals?.error_rows || 0);
  const completedBefore = Number(beforeTotals?.completed_rows || 0);
  const progressPct = totalRows > 0 ? Math.round((completed / totalRows) * 1000) / 10 : 100;
  const status = emptyReached || (pending === 0 && retryLater === 0 && running === 0) ? "pass" : failedCount ? "partial_flagged_continue" : retryLaterCount ? "partial_retry_later" : "partial";

  return {
    ok: true,
    job: "board_queue_auto_mine",
    version: SYSTEM_VERSION,
    status,
    slate_date: slateDate,
    mode: "cloudflare_safe_auto_raw_factor_mining_no_prop_scoring",
    selected_queue_type: selectedQueueType || null,
    family_rotation_policy: "v1.2.73 selects the under-mined family with the fewest completed result queues, honors RETRY_LATER backoff, and runs one family per invocation with no new rotation table.",
    mine_limit: mineLimit,
    progress: {
      total_rows: totalRows,
      completed_before: completedBefore,
      completed_after: completed,
      mined_this_run: minedCount,
      completed_by_existing_raw_result: completedByExisting,
      pending_after: pending,
      retry_later_after: retryLater,
      running_after: running,
      error_after: errors,
      percent_complete: progressPct,
      needs_continue: (pending + retryLater + running) > 0
    },
    repair: { before: repairBefore?.changes || null, after: repairAfter?.changes || null },
    mined_rows: minedCount,
    completed_by_existing_raw_result: completedByExisting,
    retry_later_count: retryLaterCount,
    failed_count: failedCount,
    pending_rows_after: pending,
    retry_later_rows_after: retryLater,
    completed_rows_after: completed,
    running_rows_after: running,
    error_rows_after: errors,
    needs_continue: (pending + retryLater + running) > 0,
    steps,
    queue_health: queueHealth.rows,
    result_health: resultHealth.rows,
    next_action: (pending + retryLater + running) > 0 ? "Run SCRAPE > Board Queue Auto Mine Raw again later, or let the scheduled miner continue. Failed rows are flagged after 5 attempts and visible in queue health." : "Raw board queue mining complete. Next phase can build scored factor summaries/candidates.",
    note: "Auto miner runs a smaller safe batch of Mine One Raw calls, reports progress counters, retries transient rows with backoff up to 5 attempts, flags exhausted rows, and lets scheduled/full-run repair pick them back up. It repairs stale RUNNING rows before and after every batch. No prop scoring, no ranking, no candidate logic."
  };
}

async function runBoardQueueAutoMine(input, env) {
  const slateDate = String(input?.slate_date || resolveSlateDate(input || {}).slate_date);
  const lockId = `BOARD_QUEUE_AUTO_MINE|${slateDate}`;
  const lockedBy = `${input?.trigger || 'manual'}:${crypto.randomUUID()}`;
  await resetStalePipelineRuntime(env, slateDate).catch(() => null);
  const lock = await acquirePipelineLock(env, lockId, lockedBy, 10);
  if (!lock.acquired) {
    const totals = await boardQueueTotals(env, slateDate).catch(() => null);
    return {
      ok: true,
      job: 'board_queue_auto_mine',
      version: SYSTEM_VERSION,
      status: 'LOCKED_SKIP_ALREADY_RUNNING',
      slate_date: slateDate,
      lock_status: lock,
      totals,
      needs_continue: true,
      note: 'Another miner is already active for this slate. This invocation exited cleanly so duplicate UI/Cron clicks do not create overlapping writes.'
    };
  }
  try {
    const result = await runBoardQueueAutoMineCore(input || {}, env);
    result.lock_status = 'RELEASED';
    return result;
  } finally {
    await releasePipelineLock(env, lockId, lockedBy);
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

function boardQueueBuildChunkLimit(input) {
  return input && input.auto_build ? BOARD_QUEUE_AUTO_BUILD_CHUNK_LIMIT : BOARD_QUEUE_BUILD_CHUNK_LIMIT;
}

function boardLightPlayerQueuePayload(slateDate, queueType, playerBatchSize, chunk) {
  return {
    slate_date: slateDate,
    queue_type: queueType,
    batch_size: playerBatchSize,
    payload_mode: "lightweight_hydrate_at_mining",
    players: chunk.map(p => ({
      player_name: String(p.player_name || "").trim(),
      team: normTeam(p.team),
      first_start_time: p.first_start_time || null,
      leg_rows: Number(p.leg_rows || 0),
      opponent_sample: p.opponent_sample || ""
    })),
    payload_quality: {
      available: ["board_identity_stub"],
      missing: ["hydrated_context_deferred_until_mining"],
      avg_completeness_score: 10
    }
  };
}

function boardLightGameQueuePayload(slateDate, queueType, row) {
  return {
    slate_date: slateDate,
    queue_type: queueType,
    payload_mode: "lightweight_hydrate_at_mining",
    game: row,
    payload_quality: {
      available: ["board_game_stub"],
      missing: ["hydrated_context_deferred_until_mining"],
      completeness_score: 10
    }
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

  const requestedQueueType = String(input.queue_type || input.build_queue_type || "").trim() || null;
  const buildOffset = Math.max(0, Number(input.build_offset || input.offset || 0) || 0);
  const buildLimitRaw = Number(input.max_queue_rows || input.limit || 0) || 0;
  const buildLimit = buildLimitRaw > 0 ? Math.max(1, Math.min(buildLimitRaw, boardQueueBuildChunkLimit(input))) : null;
  const queueRows = [];
  const playerBatchSizes = {
    PLAYER_A_ROLE_RECENT_MATCHUP: 2,
    PLAYER_D_ADVANCED_FORM_CONTACT: 2
  };
  const playerQueueTypes = [
    "PLAYER_A_ROLE_RECENT_MATCHUP",
    "PLAYER_D_ADVANCED_FORM_CONTACT"
  ];
  for (const queueType of playerQueueTypes) {
    if (requestedQueueType && queueType !== requestedQueueType) continue;
    const playerBatchSize = playerBatchSizes[queueType] || 4;
    const allPlayerChunks = boardChunkRows(players.rows, playerBatchSize);
    const playerChunks = buildLimit ? allPlayerChunks.slice(buildOffset, buildOffset + buildLimit) : allPlayerChunks;
    for (let index = 0; index < playerChunks.length; index += 1) {
      const absoluteIndex = buildLimit ? buildOffset + index : index;
      const chunk = playerChunks[index];
      const scopeKey = chunk.map(r => `${r.team}:${r.player_name}`).join("|");
      const enrichedPayload = input.light_payload ? boardLightPlayerQueuePayload(slateDate, queueType, playerBatchSize, chunk) : await enrichBoardQueuePlayerPayload(env, slateDate, queueType, playerBatchSize, chunk);
      queueRows.push({
        queue_id: boardQueueId(slateDate, queueType, absoluteIndex + 1, scopeKey),
        slate_date: slateDate,
        queue_type: queueType,
        scope_type: `PLAYER_BATCH_${playerBatchSize}`,
        scope_key: scopeKey,
        batch_index: absoluteIndex + 1,
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
    if (requestedQueueType && queueType !== requestedQueueType) continue;
    const gameRows = buildLimit ? games.rows.slice(buildOffset, buildOffset + buildLimit) : games.rows;
    for (let index = 0; index < gameRows.length; index += 1) {
      const absoluteIndex = buildLimit ? buildOffset + index : index;
      const row = gameRows[index];
      const scopeKey = `${row.game_key}|${row.start_time}`;
      const enrichedPayload = input.light_payload ? boardLightGameQueuePayload(slateDate, queueType, row) : await enrichBoardQueueGamePayload(env, slateDate, queueType, row);
      queueRows.push({
        queue_id: boardQueueId(slateDate, queueType, absoluteIndex + 1, scopeKey),
        slate_date: slateDate,
        queue_type: queueType,
        scope_type: "GAME",
        scope_key: scopeKey,
        batch_index: absoluteIndex + 1,
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
    player_batch_size: playerBatchSizes,
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

async function getBoardQueueBuildPlan(input, env, slateDate) {
  const slateRows = await boardScalar(env, "SELECT COUNT(*) FROM mlb_stats WHERE substr(start_time, 1, 10) = ?", [slateDate]);
  const activeWhere = Number(slateRows.value || 0) > 0 ? "substr(start_time, 1, 10) = ?" : "1=1";
  const activeBinds = Number(slateRows.value || 0) > 0 ? [slateDate] : [];
  const singleWhere = boardSingleRowWhere();
  const gameKeySql = boardNormalizedGameKeySql();
  const playerCount = await boardScalar(env, `
    SELECT COUNT(*) FROM (
      SELECT player_name, team
      FROM mlb_stats
      WHERE ${activeWhere} AND ${singleWhere}
      GROUP BY player_name, team
    )
  `, activeBinds);
  const gameCount = await boardScalar(env, `
    SELECT COUNT(*) FROM (
      SELECT ${gameKeySql} AS game_key, MIN(start_time) AS start_time
      FROM mlb_stats
      WHERE ${activeWhere} AND ${singleWhere}
      GROUP BY game_key, start_time
    )
  `, activeBinds);
  const players = Number(playerCount.value || 0);
  const games = Number(gameCount.value || 0);
  return [
    { queue_type: "PLAYER_A_ROLE_RECENT_MATCHUP", desired_rows: Math.ceil(players / 2), scope_type: "PLAYER_BATCH_2" },
    { queue_type: "PLAYER_D_ADVANCED_FORM_CONTACT", desired_rows: Math.ceil(players / 2), scope_type: "PLAYER_BATCH_2" },
    { queue_type: "GAME_B_TEAM_BULLPEN_ENVIRONMENT", desired_rows: games, scope_type: "GAME" },
    { queue_type: "GAME_WEATHER_CONTEXT", desired_rows: games, scope_type: "GAME" },
    { queue_type: "GAME_NEWS_INJURY_CONTEXT", desired_rows: games, scope_type: "GAME" }
  ];
}

async function getBoardQueueExistingCount(env, slateDate, queueType, scopeType) {
  const row = await boardScalar(env, `
    SELECT COUNT(*)
    FROM board_factor_queue
    WHERE slate_date = ? AND queue_type = ? AND scope_type = ?
  `, [slateDate, queueType, scopeType]);
  return Number(row.value || 0);
}

async function runBoardQueueBuild(input, env) {
  await ensureBoardFactorQueueTable(env);
  const slateDate = String(input.slate_date || resolveSlateDate(input).slate_date);

  await env.DB.prepare(`
    DELETE FROM board_factor_results
    WHERE slate_date = ?
      AND queue_id IN (
        SELECT queue_id FROM board_factor_queue
        WHERE slate_date = ?
          AND queue_type IN ('PLAYER_A_ROLE_RECENT_MATCHUP','PLAYER_D_ADVANCED_FORM_CONTACT')
          AND scope_type <> 'PLAYER_BATCH_2'
      )
  `).bind(slateDate, slateDate).run();
  await env.DB.prepare(`
    DELETE FROM board_factor_queue
    WHERE slate_date = ?
      AND queue_type IN ('PLAYER_A_ROLE_RECENT_MATCHUP','PLAYER_D_ADVANCED_FORM_CONTACT')
      AND scope_type <> 'PLAYER_BATCH_2'
  `).bind(slateDate).run();

  const plan = await getBoardQueueBuildPlan(input, env, slateDate);
  let selected = null;
  for (const row of plan) {
    const existing = await getBoardQueueExistingCount(env, slateDate, row.queue_type, row.scope_type);
    row.existing_rows = existing;
    row.remaining_rows = Math.max(0, Number(row.desired_rows || 0) - existing);
    if (!selected && row.remaining_rows > 0) selected = row;
  }

  if (!selected) {
    const queueHealthDone = await boardRows(env, `
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
      status: "pass",
      slate_date: slateDate,
      table: "board_factor_queue",
      mode: "cloudflare_safe_chunked_queue_builder_no_gemini_no_scoring",
      inserted_queue_rows: 0,
      build_complete: true,
      build_plan: plan,
      queue_health: queueHealthDone.rows,
      warnings: [],
      note: "Board queue is already fully materialized for supported queue types. No Gemini calls, no factor scoring, no prop ranking."
    };
  }

  const chunkLimit = Math.min(boardQueueBuildChunkLimit(input), selected.remaining_rows);
  const built = await buildBoardQueueRows({
    ...input,
    slate_date: slateDate,
    queue_type: selected.queue_type,
    build_offset: selected.existing_rows,
    max_queue_rows: chunkLimit
  }, env);
  if (!built.ok) return built;

  const stmt = env.DB.prepare(`
    INSERT OR IGNORE INTO board_factor_queue (
      queue_id, slate_date, queue_type, scope_type, scope_key, batch_index,
      player_count, game_count, source_rows, player_names, team_id, game_key,
      team_a, team_b, start_time, status, attempt_count, last_error, payload_json,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, NULL, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  let inserted = 0;
  for (const r of built.queue_rows) {
    const result = await stmt.bind(
      r.queue_id, r.slate_date, r.queue_type, r.scope_type, r.scope_key, r.batch_index,
      r.player_count, r.game_count, r.source_rows, r.player_names, r.team_id, r.game_key,
      r.team_a, r.team_b, r.start_time, r.payload_json
    ).run();
    inserted += Number(result?.meta?.changes || 0);
  }

  const refreshedExisting = await getBoardQueueExistingCount(env, slateDate, selected.queue_type, selected.scope_type);
  selected.existing_rows_after = refreshedExisting;
  selected.remaining_rows_after = Math.max(0, Number(selected.desired_rows || 0) - refreshedExisting);
  const buildComplete = selected.remaining_rows_after === 0 && plan.every(r => {
    if (r.queue_type === selected.queue_type) return true;
    return Number(r.remaining_rows || 0) === 0;
  });

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
    status: buildComplete ? "pass" : "partial",
    slate_date: slateDate,
    table: "board_factor_queue",
    mode: "cloudflare_safe_chunked_queue_builder_no_gemini_no_scoring",
    chunk: {
      queue_type: selected.queue_type,
      scope_type: selected.scope_type,
      offset: selected.existing_rows,
      requested_rows: chunkLimit,
      inserted_rows: inserted,
      remaining_rows_after: selected.remaining_rows_after
    },
    inserted_queue_rows: inserted,
    build_complete: buildComplete,
    build_plan: plan,
    queue_estimate: built.queue_estimate,
    queue_health: queueHealth.rows,
    warnings: built.warnings,
    note: "Cloudflare-safe manual chunk build completed one queue slice only. For full automatic materialization, use SCRAPE > Board Queue Auto Build. No Gemini calls, no factor scoring, no prop ranking."
  };
}

async function runBoardQueueAutoBuild(input, env) {
  await ensureBoardFactorQueueTable(env);
  const slateDate = String(input.slate_date || resolveSlateDate(input).slate_date);
  const maxPassesRaw = Number(input.max_passes || input.auto_passes || 8) || 8;
  const maxPasses = Math.max(1, Math.min(maxPassesRaw, 10));
  const steps = [];
  let totalInserted = 0;
  let finalBuild = null;

  for (let pass = 1; pass <= maxPasses; pass += 1) {
    const step = await runBoardQueueBuild({
      ...input,
      job: "board_queue_auto_build",
      slate_date: slateDate,
      auto_build: true,
      light_payload: true,
      max_queue_rows: BOARD_QUEUE_AUTO_BUILD_CHUNK_LIMIT
    }, env);
    finalBuild = step;
    totalInserted += Number(step?.inserted_queue_rows || 0);
    steps.push({
      pass,
      ok: Boolean(step?.ok),
      status: step?.status || "unknown",
      build_complete: Boolean(step?.build_complete),
      inserted_queue_rows: Number(step?.inserted_queue_rows || 0),
      chunk: step?.chunk || null,
      queue_health: step?.queue_health || []
    });
    if (!step || !step.ok) break;
    if (step.build_complete) break;
    if (Number(step.inserted_queue_rows || 0) <= 0 && step.status !== "pass") break;
  }

  const queueHealth = await boardRows(env, `
    SELECT queue_type, status, COUNT(*) AS rows_count, SUM(source_rows) AS source_rows
    FROM board_factor_queue
    WHERE slate_date = ?
    GROUP BY queue_type, status
    ORDER BY queue_type, status
  `, [slateDate]);

  const plan = await getBoardQueueBuildPlan(input, env, slateDate);
  let totalRemaining = 0;
  for (const row of plan) {
    const existing = await getBoardQueueExistingCount(env, slateDate, row.queue_type, row.scope_type);
    row.existing_rows = existing;
    row.remaining_rows = Math.max(0, Number(row.desired_rows || 0) - existing);
    totalRemaining += row.remaining_rows;
  }

  const buildComplete = totalRemaining === 0;
  return {
    ok: true,
    job: "board_queue_auto_build",
    version: SYSTEM_VERSION,
    status: buildComplete ? "pass" : "needs_continue",
    slate_date: slateDate,
    table: "board_factor_queue",
    mode: "auto_lightweight_hydrate_at_mining_no_gemini_no_scoring",
    auto_passes_run: steps.length,
    inserted_queue_rows: totalInserted,
    build_complete: buildComplete,
    needs_continue: !buildComplete,
    remaining_rows_total: totalRemaining,
    build_plan: plan,
    steps,
    queue_health: queueHealth.rows,
    final_build: finalBuild,
    next_action: buildComplete ? "Queue build complete. Next: SCRAPE > Board Queue Mine One Raw or scheduled miner." : "Run SCRAPE > Board Queue Auto Build again, or let scheduled backend continue. It safely paused before forcing another loop.",
    note: "Auto builder materializes every queue family with lightweight payloads. Detailed context is hydrated later at mining time, preventing repeated manual chunk clicking and reducing Worker/D1 pressure. No Gemini calls, no factor scoring, no prop ranking."
  };
}

async function runBoardQueuePipeline(input, env) {
  const result = await runBoardQueueAutoBuild({ ...input, job: "run_board_queue_pipeline", max_passes: input.max_passes || 8 }, env);
  return {
    ok: Boolean(result && result.ok),
    job: "run_board_queue_pipeline",
    version: SYSTEM_VERSION,
    status: result && result.ok ? "pass" : "review",
    slate_date: result?.slate_date || resolveSlateDate(input).slate_date,
    board_queue_auto_build: result,
    note: "Scheduled board queue pipeline auto-prepared lightweight queue payloads across all supported families. No Gemini calls, no factor scoring, no prop ranking."
  };
}


const STATIC_GROUP_COUNT = 6;

function staticGroupFromJob(job, prefix) {
  const re = new RegExp(`^${prefix}_g([1-${STATIC_GROUP_COUNT}])$`);
  const m = String(job || '').match(re);
  return m ? Number(m[1]) : null;
}

function groupSlice(rows, group) {
  const sorted = [...(rows || [])];
  if (!group) return sorted;
  const size = Math.ceil(sorted.length / STATIC_GROUP_COUNT);
  const start = (group - 1) * size;
  return sorted.slice(start, start + size);
}

function selectStaticGroupRows(rows, group) {
  const sorted = [...(rows || [])].sort((a, b) => String(a.player_name || '').localeCompare(String(b.player_name || '')) || Number(a.player_id || 0) - Number(b.player_id || 0));
  if (!group) return sorted;
  const size = Math.ceil(sorted.length / STATIC_GROUP_COUNT);
  const start = (group - 1) * size;
  return sorted.slice(start, start + size);
}

async function tableExists(env, tableName) {
  const row = await env.DB.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE type='table' AND name=?").bind(tableName).first();
  return Number(row?.c || 0) > 0;
}

async function ensureStaticReferenceTables(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ref_venues (
      venue_id INTEGER PRIMARY KEY,
      team_id TEXT,
      mlb_venue_name TEXT,
      city TEXT,
      state TEXT,
      roof_status TEXT,
      surface_type TEXT,
      altitude_ft INTEGER,
      left_field_dimension_ft INTEGER,
      center_field_dimension_ft INTEGER,
      right_field_dimension_ft INTEGER,
      source_name TEXT,
      source_confidence TEXT,
      notes TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ref_team_aliases (
      alias_type TEXT NOT NULL,
      raw_alias TEXT NOT NULL,
      canonical_name TEXT,
      canonical_team_id TEXT,
      mlb_id INTEGER,
      confidence TEXT,
      action TEXT,
      notes TEXT,
      source_name TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (alias_type, raw_alias)
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ref_players (
      player_id INTEGER PRIMARY KEY,
      mlb_id INTEGER,
      player_name TEXT,
      team_id TEXT,
      primary_position TEXT,
      role TEXT,
      bats TEXT,
      throws TEXT,
      birth_date TEXT,
      age INTEGER,
      active INTEGER DEFAULT 1,
      source_name TEXT,
      source_confidence TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ref_player_splits (
      player_id INTEGER NOT NULL,
      season INTEGER NOT NULL,
      group_type TEXT NOT NULL,
      split_code TEXT NOT NULL,
      split_description TEXT,
      pa INTEGER,
      ab INTEGER,
      hits INTEGER,
      doubles INTEGER,
      triples INTEGER,
      home_runs INTEGER,
      strikeouts INTEGER,
      walks INTEGER,
      avg TEXT,
      obp TEXT,
      slg TEXT,
      ops TEXT,
      babip TEXT,
      source_name TEXT,
      source_confidence TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (player_id, season, group_type, split_code)
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS static_scrape_progress (
      scrape_domain TEXT NOT NULL,
      season INTEGER NOT NULL,
      group_no INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      player_name TEXT,
      status TEXT NOT NULL,
      detail TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (scrape_domain, season, group_no, player_id)
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS player_game_logs (
      player_id INTEGER NOT NULL,
      game_pk INTEGER NOT NULL,
      season INTEGER NOT NULL,
      game_date TEXT,
      team_id TEXT,
      opponent_team TEXT,
      group_type TEXT NOT NULL,
      is_home INTEGER,
      pa INTEGER,
      ab INTEGER,
      hits INTEGER,
      doubles INTEGER,
      triples INTEGER,
      home_runs INTEGER,
      strikeouts INTEGER,
      walks INTEGER,
      innings_pitched TEXT,
      raw_json TEXT,
      source_name TEXT,
      source_confidence TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (player_id, game_pk, group_type)
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS ref_bvp_history (
      slate_date TEXT NOT NULL,
      batter_id INTEGER NOT NULL,
      pitcher_id INTEGER NOT NULL,
      batter_name TEXT,
      pitcher_name TEXT,
      batter_team TEXT,
      pitcher_team TEXT,
      pa INTEGER,
      ab INTEGER,
      hits INTEGER,
      doubles INTEGER,
      triples INTEGER,
      home_runs INTEGER,
      strikeouts INTEGER,
      walks INTEGER,
      raw_json TEXT,
      source_name TEXT,
      source_confidence TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (slate_date, batter_id, pitcher_id)
    )
  `).run();
}

const STATIC_VENUE_SUPPLEMENT = {
  22: { altitude_ft: 267, left_field_dimension_ft: 330, center_field_dimension_ft: 395, right_field_dimension_ft: 330, notes: "Supplemental controlled venue source; values not independently verified by Gemini." },
  19: { altitude_ft: 5200, left_field_dimension_ft: 347, center_field_dimension_ft: 415, right_field_dimension_ft: 350, notes: "Supplemental controlled venue source; values not independently verified by Gemini." },
  680: { altitude_ft: 10, left_field_dimension_ft: 331, center_field_dimension_ft: 401, right_field_dimension_ft: 326, notes: "Supplemental controlled venue source; values not independently verified by Gemini." },
  14: { altitude_ft: 250, left_field_dimension_ft: 328, center_field_dimension_ft: 400, right_field_dimension_ft: 328, notes: "Supplemental controlled venue source; values not independently verified by Gemini." },
  2530: { altitude_ft: 25, left_field_dimension_ft: 318, center_field_dimension_ft: 408, right_field_dimension_ft: 314, notes: "Supplemental controlled venue source; values not independently verified by Gemini." }
};
const STATIC_TEAM_VENUE_OVERRIDES = {
  TB: { venue_id: 2530, name: "George M. Steinbrenner Field", city: "Tampa", state: "FL", roof_status: "Open", surface_type: "Grass", notes: "Controlled override for Rays temporary home; MLB team endpoint may still report Tropicana Field." }
};


async function fetchMlbTeamsForStatic() {
  const fetched = await fetchJsonWithRetry("https://statsapi.mlb.com/api/v1/teams?sportId=1&activeStatus=Y", {}, 3, "mlb_static_teams");
  if (!fetched.ok) throw new Error(fetched.error || "MLB teams fetch failed");
  return (fetched.data?.teams || []).filter(t => MLB_TEAM_ABBR[t.id]);
}

function normalizeRoleFromPosition(pos, throws) {
  return String(pos || '').toUpperCase() === 'P' ? 'PITCHER' : 'BATTER';
}

async function syncStaticVenues(input, env) {
  await ensureStaticReferenceTables(env);
  const teams = await fetchMlbTeamsForStatic();
  await env.DB.prepare("DELETE FROM ref_venues").run();
  const stmt = env.DB.prepare(`
    INSERT OR REPLACE INTO ref_venues (
      venue_id, team_id, mlb_venue_name, city, state, roof_status, surface_type,
      altitude_ft, left_field_dimension_ft, center_field_dimension_ft, right_field_dimension_ft,
      source_name, source_confidence, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  let inserted = 0;
  const audit = [];
  for (const t of teams) {
    const teamId = MLB_TEAM_ABBR[t.id];
    const venueOverride = STATIC_TEAM_VENUE_OVERRIDES[teamId] || null;
    let venueId = venueOverride?.venue_id ? Number(venueOverride.venue_id) : Number(t?.venue?.id || 0);
    let venue = venueOverride ? {
      id: venueId,
      name: venueOverride.name,
      location: { city: venueOverride.city, state: venueOverride.state, stateAbbrev: venueOverride.state },
      fieldInfo: { roofType: venueOverride.roof_status, turfType: venueOverride.surface_type }
    } : (t.venue || {});
    if (venueId) {
      const vf = await fetchJsonWithRetry(`https://statsapi.mlb.com/api/v1/venues/${venueId}`, {}, 2, `mlb_venue_${venueId}`);
      if (vf.ok && Array.isArray(vf.data?.venues) && vf.data.venues[0]) venue = { ...venue, ...vf.data.venues[0] };
    }
    if (venueOverride) {
      venue = {
        ...venue,
        name: venueOverride.name,
        location: { ...(venue.location || {}), city: venueOverride.city, state: venueOverride.state, stateAbbrev: venueOverride.state },
        fieldInfo: { ...(venue.fieldInfo || {}), roofType: venueOverride.roof_status, turfType: venueOverride.surface_type }
      };
    }
    const sup = STATIC_VENUE_SUPPLEMENT[venueId] || {};
    const fieldInfo = venue.fieldInfo || {};
    const roof = fieldInfo.roofType || fieldInfo.roof || venue.roofType || null;
    const turf = fieldInfo.turfType || fieldInfo.surface || venue.turfType || null;
    const loc = venue.location || t.location || {};
    const res = await stmt.bind(
      venueId || null,
      teamId,
      venue.name || t?.venue?.name || null,
      loc.city || t?.venue?.location?.city || null,
      loc.stateAbbrev || loc.state || null,
      roof,
      turf,
      sup.altitude_ft ?? null,
      sup.left_field_dimension_ft ?? null,
      sup.center_field_dimension_ft ?? null,
      sup.right_field_dimension_ft ?? null,
      sup.altitude_ft ? "mlb_statsapi_plus_controlled_static_venue_source" : "mlb_statsapi_venue_basic",
      sup.altitude_ft ? "HIGH_FOR_API_FIELDS_MEDIUM_FOR_SUPPLEMENTAL" : "HIGH_FOR_API_FIELDS",
      venueOverride?.notes || sup.notes || "MLB StatsAPI venue basic fields; supplemental dimensions not available.",
    ).run();
    inserted += Number(res?.meta?.changes || 0);
    audit.push({ team_id: teamId, venue_id: venueId, venue_name: venue.name || null, supplemental_static: Boolean(sup.altitude_ft), override_applied: Boolean(venueOverride) });
  }
  return { ok: true, job: input.job || "scrape_static_venues", version: SYSTEM_VERSION, status: "pass", table: "ref_venues", fetched_teams: teams.length, inserted_rows: inserted, audit, estimated_seconds: "5-15 seconds", note: "Wiped and rebuilt ref_venues. MLB StatsAPI is source for official venue basics; controlled overrides/supplemental fields are only present where explicitly mapped." };
}

async function syncStaticTeamAliases(input, env) {
  await ensureStaticReferenceTables(env);
  const teams = await fetchMlbTeamsForStatic();
  await env.DB.prepare("DELETE FROM ref_team_aliases").run();
  const stmt = env.DB.prepare(`INSERT OR REPLACE INTO ref_team_aliases (alias_type, raw_alias, canonical_name, canonical_team_id, mlb_id, confidence, action, notes, source_name, updated_at) VALUES ('team', ?, ?, ?, ?, ?, ?, ?, 'mlb_statsapi_team_alias_seed', CURRENT_TIMESTAMP)`);
  let inserted = 0;
  for (const t of teams) {
    const teamId = MLB_TEAM_ABBR[t.id];
    const aliases = [teamId, t.abbreviation, t.teamName, t.name, t.shortName, t.fileCode].filter(Boolean);
    const seen = new Set();
    for (const a of aliases) {
      const raw = String(a).trim();
      if (!raw || seen.has(raw.toLowerCase())) continue;
      seen.add(raw.toLowerCase());
      const res = await stmt.bind(raw, t.name || null, teamId, Number(t.id), "HIGH", "map", "Official or direct MLB StatsAPI team alias.").run();
      inserted += Number(res?.meta?.changes || 0);
    }
  }
  // Ambiguous manual review aliases
  const reviewAliases = [
    ["LA", "Los Angeles Dodgers / Los Angeles Angels", null, null, "MEDIUM", "review", "Ambiguous; requires source context."],
    ["NY", "New York Mets / New York Yankees", null, null, "MEDIUM", "review", "Ambiguous; requires source context."],
    ["AZ", "Arizona Diamondbacks", "ARI", 109, "HIGH", "map", "Common non-MLB shorthand for ARI."]
  ];
  for (const r of reviewAliases) {
    const res = await stmt.bind(...r).run();
    inserted += Number(res?.meta?.changes || 0);
  }
  return { ok: true, job: input.job || "scrape_static_team_aliases", version: SYSTEM_VERSION, status: "pass", table: "ref_team_aliases", teams: teams.length, inserted_rows: inserted, estimated_seconds: "3-10 seconds", note: "Wiped and rebuilt team alias dictionary. Ambiguous aliases are marked review, not forced." };
}

async function syncStaticPlayers(input, env) {
  await ensureStaticReferenceTables(env);
  const season = Number(String(resolveSlateDate(input || {}).slate_date).slice(0,4));
  const allTeams = await fetchMlbTeamsForStatic();
  const groupMatch = String(input?.job || '').match(/scrape_static_players_g([1-6])$/);
  const group = groupMatch ? Number(groupMatch[1]) : null;
  const teams = group ? groupSlice(allTeams, group) : allTeams;
  if (group === 1 || !group) await env.DB.prepare("DELETE FROM ref_players").run();
  const stmt = env.DB.prepare(`
    INSERT OR REPLACE INTO ref_players (player_id, mlb_id, player_name, team_id, primary_position, role, bats, throws, birth_date, age, active, source_name, source_confidence, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'mlb_statsapi_active_roster_reference', 'HIGH', CURRENT_TIMESTAMP)
  `);
  let inserted = 0;
  const audit = [];
  for (const t of teams) {
    const teamId = MLB_TEAM_ABBR[t.id];
    const url = `https://statsapi.mlb.com/api/v1/teams/${encodeURIComponent(t.id)}/roster?rosterType=active&hydrate=person`;
    const fetched = await fetchJsonWithRetry(url, {}, 3, `static_roster_${teamId}`);
    audit.push({ team_id: teamId, ok: fetched.ok, error: fetched.error || null, roster_rows: fetched.data?.roster?.length || 0 });
    if (!fetched.ok) continue;
    for (const entry of (fetched.data?.roster || [])) {
      const person = entry.person || {};
      const pos = entry.position || person.primaryPosition || {};
      const playerId = Number(person.id || 0);
      if (!playerId || !person.fullName) continue;
      const primary = pos.abbreviation || pos.code || null;
      const res = await stmt.bind(
        playerId, playerId, person.fullName, teamId, primary,
        normalizeRoleFromPosition(primary, person?.pitchHand?.code),
        person?.batSide?.code || null,
        person?.pitchHand?.code || null,
        person?.birthDate || null,
        ageFromBirthDate(person?.birthDate),
      ).run();
      inserted += Number(res?.meta?.changes || 0);
    }
  }
  const afterCount = await staticTableCount(env, "ref_players");
  const failedTeams = audit.filter(a => !a.ok).length;
  return {
    ok: inserted > 0 && failedTeams === 0,
    job: input.job || "scrape_static_players",
    version: SYSTEM_VERSION,
    status: failedTeams ? "partial_subrequest_safe_retry_needed" : (inserted > 0 ? "pass" : "empty"),
    table: "ref_players",
    season,
    group,
    teams_total: allTeams.length,
    teams_checked: teams.length,
    inserted_rows: inserted,
    total_ref_players_after: afterCount.rows_count,
    failed_teams: failedTeams,
    team_audit: audit,
    estimated_seconds: group ? "10-25 seconds per group" : "may exceed subrequest limits; prefer G1-G6",
    note: group ? "Chunked static player scrape. G1 wipes ref_players, G2-G6 append. Pitchers are stored with role=PITCHER." : "Legacy all-team static player scrape. Prefer G1-G6 to avoid Cloudflare subrequest limits. Pitchers are stored with role=PITCHER."
  };
}

function extractSplitCode(split) {
  const raw = String(split?.split?.description || split?.split?.code || split?.type?.displayName || '').toLowerCase();
  if (raw.includes('vs left') || raw.includes('left')) return 'vs_left';
  if (raw.includes('vs right') || raw.includes('right')) return 'vs_right';
  if (raw.includes('home')) return 'home';
  if (raw.includes('away')) return 'away';
  return raw ? raw.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') : 'unknown';
}

function splitRowFromStat(player, season, groupType, split) {
  const st = split?.stat || {};
  return {
    player_id: Number(player.player_id), season, group_type: groupType, split_code: extractSplitCode(split),
    split_description: split?.split?.description || split?.split?.code || null,
    pa: st.plateAppearances !== undefined ? Number(st.plateAppearances) : null,
    ab: st.atBats !== undefined ? Number(st.atBats) : null,
    hits: st.hits !== undefined ? Number(st.hits) : null,
    doubles: st.doubles !== undefined ? Number(st.doubles) : null,
    triples: st.triples !== undefined ? Number(st.triples) : null,
    home_runs: st.homeRuns !== undefined ? Number(st.homeRuns) : null,
    strikeouts: st.strikeOuts !== undefined ? Number(st.strikeOuts) : null,
    walks: st.baseOnBalls !== undefined ? Number(st.baseOnBalls) : null,
    avg: st.avg ?? null, obp: st.obp ?? null, slg: st.slg ?? null, ops: st.ops ?? null, babip: st.babip ?? null
  };
}

function splitSitCodesForGroup(groupType) {
  return groupType === 'pitching' ? 'vl,vr' : 'vl,vr';
}

async function markStaticProgress(env, domain, season, groupNo, player, status, detail) {
  await env.DB.prepare(`
    INSERT OR REPLACE INTO static_scrape_progress (scrape_domain, season, group_no, player_id, player_name, status, detail, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(domain, Number(season), Number(groupNo || 0), Number(player.player_id), player.player_name || null, status, detail ? String(detail).slice(0, 500) : null).run();
}

async function staticProgressMap(env, domain, season, groupNo) {
  const rows = await env.DB.prepare("SELECT player_id, status FROM static_scrape_progress WHERE scrape_domain=? AND season=? AND group_no=?").bind(domain, Number(season), Number(groupNo || 0)).all();
  const m = new Map();
  for (const r of (rows.results || [])) m.set(Number(r.player_id), String(r.status || ''));
  return m;
}

function prioritizedSplitTestPlayers(rows) {
  const wanted = new Set(['Shohei Ohtani','Aaron Judge','Paul Goldschmidt','Jose Altuve','Chris Sale']);
  const top = (rows || []).filter(r => wanted.has(String(r.player_name || '')));
  const seen = new Set(top.map(r => Number(r.player_id)));
  for (const r of (rows || [])) {
    if (top.length >= 5) break;
    const id = Number(r.player_id);
    if (!seen.has(id)) { top.push(r); seen.add(id); }
  }
  return top.slice(0, 5);
}

async function syncStaticPlayerSplits(input, env) {
  await ensureStaticReferenceTables(env);
  const season = Number(String(resolveSlateDate(input || {}).slate_date).slice(0,4));
  const isTest = String(input?.job || '') === 'scrape_static_player_splits_test_5';
  const group = isTest ? 0 : (staticGroupFromJob(input.job, 'scrape_static_player_splits') || 1);
  const hardLimit = isTest ? 5 : Math.max(1, Math.min(Number(input?.limit || 10), 15));

  let resetPerformed = false;
  let resetReason = null;
  if (group === 1 && !isTest) {
    const progressCountRow = await env.DB.prepare("SELECT COUNT(*) AS rows_count FROM static_scrape_progress WHERE scrape_domain='player_splits' AND season=? AND group_no=1").bind(season).first();
    const progressRowsBefore = Number(progressCountRow?.rows_count || 0);
    const splitCountBefore = await staticTableCount(env, "ref_player_splits");

    // G1 is both the rebuild starter and the resumable first group.
    // It must wipe only before the first real G1 batch. Repeated G1 clicks must resume.
    if (progressRowsBefore === 0 || (progressRowsBefore > 0 && Number(splitCountBefore.rows_count || 0) === 0)) {
      await env.DB.prepare("DELETE FROM ref_player_splits").run();
      await env.DB.prepare("DELETE FROM static_scrape_progress WHERE scrape_domain='player_splits' AND season=?").bind(season).run();
      resetPerformed = true;
      resetReason = progressRowsBefore === 0
        ? "fresh_group_1_start_no_existing_group_1_progress"
        : "progress_existed_but_split_table_was_empty_forced_clean_restart";
    }
  }

  const all = await env.DB.prepare("SELECT player_id, player_name, team_id, role FROM ref_players WHERE active=1 ORDER BY player_name").all();
  const baseRows = isTest ? prioritizedSplitTestPlayers(all.results || []) : selectStaticGroupRows(all.results || [], group);
  const progress = await staticProgressMap(env, 'player_splits', season, group);
  const eligible = baseRows.filter(p => !['COMPLETED','NO_DATA'].includes(progress.get(Number(p.player_id))));
  const selected = eligible.slice(0, hardLimit);

  const stmt = env.DB.prepare(`
    INSERT OR REPLACE INTO ref_player_splits (player_id, season, group_type, split_code, split_description, pa, ab, hits, doubles, triples, home_runs, strikeouts, walks, avg, obp, slg, ops, babip, source_name, source_confidence, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'mlb_statsapi_statSplits_sitCodes_vl_vr', 'MEDIUM_API_STANDARD_SPLITS', CURRENT_TIMESTAMP)
  `);

  let inserted = 0, successfulFetches = 0, failedFetches = 0, skippedNoSplits = 0, playersCompleted = 0;
  const errors = [];
  const noSplitSamples = [];

  for (const player of selected) {
    const groupType = player.role === 'PITCHER' ? 'pitching' : 'hitting';
    const sitCodes = splitSitCodesForGroup(groupType);
    const url = `https://statsapi.mlb.com/api/v1/people/${encodeURIComponent(player.player_id)}/stats?stats=statSplits&group=${groupType}&season=${season}&sitCodes=${encodeURIComponent(sitCodes)}`;
    const fetched = await fetchJsonWithRetry(url, {}, 1, `static_splits_${player.player_id}_${groupType}`);
    if (!fetched.ok) {
      failedFetches += 1;
      errors.push({ player_id: player.player_id, player_name: player.player_name, group_type: groupType, error: fetched.error });
      await markStaticProgress(env, 'player_splits', season, group, player, 'ERROR_RETRYABLE', fetched.error);
      continue;
    }
    successfulFetches += 1;
    const splits = fetched.data?.stats?.[0]?.splits || [];
    if (!splits.length) {
      skippedNoSplits += 1;
      noSplitSamples.push({ player_id: player.player_id, player_name: player.player_name, group_type: groupType });
      await markStaticProgress(env, 'player_splits', season, group, player, 'NO_DATA', 'StatsAPI returned zero statSplits for explicit sitCodes=vl,vr');
      continue;
    }
    let playerInserted = 0;
    for (const split of splits) {
      const r = splitRowFromStat(player, season, groupType, split);
      if (r.split_code === 'unknown') continue;
      const res = await stmt.bind(r.player_id, r.season, r.group_type, r.split_code, r.split_description, r.pa, r.ab, r.hits, r.doubles, r.triples, r.home_runs, r.strikeouts, r.walks, r.avg, r.obp, r.slg, r.ops, r.babip).run();
      const changes = Number(res?.meta?.changes || 0);
      inserted += changes;
      playerInserted += changes;
    }
    if (playerInserted > 0) {
      playersCompleted += 1;
      await markStaticProgress(env, 'player_splits', season, group, player, 'COMPLETED', `${playerInserted} split rows inserted`);
    } else {
      skippedNoSplits += 1;
      await markStaticProgress(env, 'player_splits', season, group, player, 'NO_INSERT', 'StatsAPI returned splits but no recognized split_code rows inserted');
    }
  }

  const afterCount = await staticTableCount(env, "ref_player_splits");
  const remainingInGroup = Math.max(0, eligible.length - selected.length);
  const status = failedFetches > 0 ? 'partial_retry_needed' : (remainingInGroup > 0 ? 'partial_continue' : (inserted > 0 || afterCount.rows_count > 0 ? 'pass' : 'empty_no_data'));
  const dataOk = Number(afterCount.rows_count || 0) > 0 && failedFetches === 0;
  return {
    ok: failedFetches === 0, data_ok: dataOk, job: input.job || "scrape_static_player_splits_g1", version: SYSTEM_VERSION, status, table: "ref_player_splits", season, group, group_count: STATIC_GROUP_COUNT, selected_players_total: baseRows.length, eligible_before_this_run: eligible.length, batch_limit: hardLimit, attempted_players: selected.length, successful_fetch_count: successfulFetches, failed_fetch_count: failedFetches, inserted_rows: inserted, total_ref_player_splits_after: afterCount.rows_count, players_completed_this_run: playersCompleted, skipped_players_no_splits: skippedNoSplits, remaining_in_group_after: remainingInGroup, needs_continue: remainingInGroup > 0, api_endpoint_pattern: "/api/v1/people/{playerId}/stats?stats=statSplits&group={hitting|pitching}&season={season}&sitCodes=vl,vr", root_cause_fixed: "v1.2.73 used no sitCodes and selected 130 players per group, causing zero-row responses plus Cloudflare subrequest exhaustion. v1.2.74 added sitCodes and small batches. v1.2.75 fixes the G1 resume bug where every G1 click wiped progress before selecting the next batch.", reset_performed: resetPerformed, reset_reason: resetReason, errors: errors.slice(0, 10), no_split_samples: noSplitSamples.slice(0, 10), estimated_seconds: isTest ? "5-15 seconds" : "10-25 seconds per resumable batch", note: isTest ? "Safe 5-player split smoke test. Does not wipe ref_player_splits." : "Resumable static split scrape. Run the same G button until remaining_in_group_after is 0, then move to the next group. G1 wipes only on a fresh G1 start with no existing G1 progress, then resumes safely on repeated clicks."
  };
}

async function syncStaticPlayerGameLogs(input, env) {
  await ensureStaticReferenceTables(env);
  const season = Number(String(resolveSlateDate(input || {}).slate_date).slice(0,4));
  const group = staticGroupFromJob(input.job, 'scrape_static_game_logs') || 1;
  const hardLimit = Math.max(1, Math.min(Number(input?.limit || 5), 5));

  let resetPerformed = false;
  let resetReason = null;
  if (group === 1) {
    const progressCountRow = await env.DB.prepare("SELECT COUNT(*) AS rows_count FROM static_scrape_progress WHERE scrape_domain='player_game_logs' AND season=? AND group_no=1").bind(season).first();
    const progressRowsBefore = Number(progressCountRow?.rows_count || 0);
    const logCountBefore = await staticTableCount(env, "player_game_logs");

    // G1 is both the rebuild starter and the resumable first group.
    // It must wipe only before the first real G1 batch. Repeated G1 clicks must resume.
    if (progressRowsBefore === 0 || (progressRowsBefore > 0 && Number(logCountBefore.rows_count || 0) === 0)) {
      await env.DB.prepare("DELETE FROM player_game_logs").run();
      await env.DB.prepare("DELETE FROM static_scrape_progress WHERE scrape_domain='player_game_logs' AND season=?").bind(season).run();
      resetPerformed = true;
      resetReason = progressRowsBefore === 0
        ? "fresh_group_1_start_no_existing_group_1_progress"
        : "progress_existed_but_game_log_table_was_empty_forced_clean_restart";
    }
  }

  const all = await env.DB.prepare("SELECT player_id, player_name, team_id, role FROM ref_players WHERE active=1 ORDER BY player_name").all();
  const baseRows = selectStaticGroupRows(all.results || [], group);
  const progress = await staticProgressMap(env, 'player_game_logs', season, group);
  const eligible = baseRows.filter(p => !['COMPLETED','NO_DATA'].includes(progress.get(Number(p.player_id))));
  const selected = eligible.slice(0, hardLimit);

  const stmt = env.DB.prepare(`
    INSERT OR REPLACE INTO player_game_logs (player_id, game_pk, season, game_date, team_id, opponent_team, group_type, is_home, pa, ab, hits, doubles, triples, home_runs, strikeouts, walks, innings_pitched, raw_json, source_name, source_confidence, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'mlb_statsapi_gameLog', 'HIGH', CURRENT_TIMESTAMP)
  `);

  let inserted = 0, successfulFetches = 0, failedFetches = 0, skippedNoLogs = 0, playersCompleted = 0;
  const errors = [];
  const noLogSamples = [];

  for (const player of selected) {
    const groupType = player.role === 'PITCHER' ? 'pitching' : 'hitting';
    const url = `https://statsapi.mlb.com/api/v1/people/${encodeURIComponent(player.player_id)}/stats?stats=gameLog&group=${groupType}&season=${season}`;
    const fetched = await fetchJsonWithRetry(url, {}, 1, `static_gamelog_${player.player_id}_${groupType}`);
    if (!fetched.ok) {
      failedFetches += 1;
      errors.push({ player_id: player.player_id, player_name: player.player_name, group_type: groupType, error: fetched.error });
      await markStaticProgress(env, 'player_game_logs', season, group, player, 'ERROR_RETRYABLE', fetched.error);
      continue;
    }
    successfulFetches += 1;
    const logs = fetched.data?.stats?.[0]?.splits || [];
    if (!logs.length) {
      skippedNoLogs += 1;
      noLogSamples.push({ player_id: player.player_id, player_name: player.player_name, group_type: groupType });
      await markStaticProgress(env, 'player_game_logs', season, group, player, 'NO_DATA', 'StatsAPI returned zero gameLog splits for this player/season/group');
      continue;
    }

    let playerInserted = 0;
    for (const split of logs) {
      const st = split.stat || {};
      const gamePk = Number(split?.game?.gamePk || split?.game?.pk || 0);
      if (!gamePk) continue;
      const opponent = split?.opponent?.abbreviation || split?.opponent?.name || null;
      const isHome = split?.isHome === true ? 1 : split?.isHome === false ? 0 : null;
      const res = await stmt.bind(
        Number(player.player_id), gamePk, season, split?.date || null, player.team_id || null, opponent,
        groupType, isHome,
        st.plateAppearances !== undefined ? Number(st.plateAppearances) : null,
        st.atBats !== undefined ? Number(st.atBats) : null,
        st.hits !== undefined ? Number(st.hits) : null,
        st.doubles !== undefined ? Number(st.doubles) : null,
        st.triples !== undefined ? Number(st.triples) : null,
        st.homeRuns !== undefined ? Number(st.homeRuns) : null,
        st.strikeOuts !== undefined ? Number(st.strikeOuts) : null,
        st.baseOnBalls !== undefined ? Number(st.baseOnBalls) : null,
        st.inningsPitched ?? null,
        JSON.stringify(split).slice(0, 10000)
      ).run();
      const changes = Number(res?.meta?.changes || 0);
      inserted += changes;
      playerInserted += changes;
    }

    if (playerInserted > 0) {
      playersCompleted += 1;
      await markStaticProgress(env, 'player_game_logs', season, group, player, 'COMPLETED', `${playerInserted} game log rows inserted`);
    } else {
      skippedNoLogs += 1;
      await markStaticProgress(env, 'player_game_logs', season, group, player, 'NO_INSERT', 'StatsAPI returned logs but no recognized game_pk rows inserted');
    }
  }

  const afterCount = await staticTableCount(env, "player_game_logs");
  const remainingInGroup = Math.max(0, eligible.length - selected.length);
  const status = failedFetches > 0 ? 'partial_retry_needed' : (remainingInGroup > 0 ? 'partial_continue' : (inserted > 0 || Number(afterCount.rows_count || 0) > 0 ? 'pass' : 'empty_no_data'));
  const dataOk = Number(afterCount.rows_count || 0) > 0 && failedFetches === 0;
  return {
    ok: failedFetches === 0,
    data_ok: dataOk,
    job: input.job || "scrape_static_game_logs_g1",
    version: SYSTEM_VERSION,
    status,
    table: "player_game_logs",
    season,
    group,
    group_count: STATIC_GROUP_COUNT,
    selected_players_total: baseRows.length,
    eligible_before_this_run: eligible.length,
    batch_limit: hardLimit,
    attempted_players: selected.length,
    successful_fetch_count: successfulFetches,
    failed_fetch_count: failedFetches,
    inserted_rows: inserted,
    total_player_game_logs_after: afterCount.rows_count,
    players_completed_this_run: playersCompleted,
    skipped_players_no_logs: skippedNoLogs,
    remaining_in_group_after: remainingInGroup,
    needs_continue: remainingInGroup > 0,
    api_endpoint_pattern: "/api/v1/people/{playerId}/stats?stats=gameLog&group={hitting|pitching}&season={season}",
    root_cause_fixed: "v1.2.76 selected a full 130-player static group and fetched until Cloudflare subrequest exhaustion. v1.2.77 added resumable 10-player batches. v1.2.78 reduces game-log batches to 5 players and adds a same-job running guard to stop duplicate Safari retry tasks.",
    reset_performed: resetPerformed,
    reset_reason: resetReason,
    errors: errors.slice(0, 10),
    no_log_samples: noLogSamples.slice(0, 10),
    estimated_seconds: "8-25 seconds per 5-player resumable batch",
    note: "Resumable static game-log scrape. Run the same G button until remaining_in_group_after is 0, then move to the next group. v1.2.78 uses 5-player batches to avoid Safari/Worker load failures. G1 wipes only on a fresh G1 start with no existing G1 progress. Rolling 20/10/5 windows should be derived internally later."
  };
}

function normalizeNameKey(name) { return String(name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim(); }

async function findRefPlayerByNameTeam(env, name, teamId = null) {
  const rows = await env.DB.prepare("SELECT * FROM ref_players WHERE team_id = COALESCE(?, team_id) ORDER BY player_name").bind(teamId).all();
  const target = normalizeNameKey(name);
  return (rows.results || []).find(r => normalizeNameKey(r.player_name) === target) || null;
}

function stablePositiveIntKey(value) {
  const text = String(value || '');
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
}

async function syncStaticBvpCurrentSlate(input, env) {
  await ensureStaticReferenceTables(env);
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;
  const slateKey = Number(String(slateDate).replace(/-/g, ''));
  const hardLimit = Math.max(1, Math.min(Number(input?.limit || 5), 5));

  let resetPerformed = false;
  let resetReason = null;
  const progressCountRow = await env.DB.prepare("SELECT COUNT(*) AS rows_count FROM static_scrape_progress WHERE scrape_domain='bvp_current_slate' AND season=? AND group_no=0").bind(slateKey).first().catch(() => ({ rows_count: 0 }));
  const progressRowsBefore = Number(progressCountRow?.rows_count || 0);
  const existingRows = await env.DB.prepare("SELECT COUNT(*) AS rows_count FROM ref_bvp_history WHERE slate_date=?").bind(slateDate).first().catch(() => ({ rows_count: 0 }));
  if (progressRowsBefore === 0 || (progressRowsBefore > 0 && Number(existingRows?.rows_count || 0) === 0)) {
    await env.DB.prepare("DELETE FROM ref_bvp_history WHERE slate_date=?").bind(slateDate).run();
    await env.DB.prepare("DELETE FROM static_scrape_progress WHERE scrape_domain='bvp_current_slate' AND season=? AND group_no=0").bind(slateKey).run();
    resetPerformed = true;
    resetReason = progressRowsBefore === 0 ? 'fresh_bvp_slate_start_no_existing_progress' : 'progress_existed_but_bvp_table_empty_forced_clean_restart';
  }

  const rawLegs = await env.DB.prepare("SELECT player_name, team, opponent FROM mlb_stats WHERE COALESCE(player_name,'') NOT LIKE '%+%' AND COALESCE(team,'') <> '' GROUP BY player_name, team, opponent ORDER BY player_name LIMIT 500").all().catch(() => ({ results: [] }));
  const candidates = (rawLegs.results || []).map((leg, idx) => {
    const keyText = `${slateDate}|${idx}|${leg.player_name}|${leg.team}|${leg.opponent}`;
    return { ...leg, pair_key: stablePositiveIntKey(keyText), pair_label: `${leg.player_name || 'UNKNOWN'}|${leg.team || ''}|${leg.opponent || ''}` };
  });
  const progress = await staticProgressMap(env, 'bvp_current_slate', slateKey, 0);
  const eligible = candidates.filter(c => !['COMPLETED','NO_DATA','NO_INSERT'].includes(progress.get(Number(c.pair_key))));
  const selected = eligible.slice(0, hardLimit);

  const games = await env.DB.prepare("SELECT * FROM games WHERE game_date=?").bind(slateDate).all().catch(() => ({ results: [] }));
  const starterRows = await env.DB.prepare("SELECT * FROM starters_current WHERE game_id LIKE ? AND starter_name IS NOT NULL AND starter_name NOT IN ('TBD','TBA','Unknown','Starter')").bind(`${slateDate}_%`).all().catch(() => ({ results: [] }));
  const gameByTeams = new Map();
  for (const g of games.results || []) {
    gameByTeams.set(`${g.away_team}|${g.home_team}`, g);
    gameByTeams.set(`${g.home_team}|${g.away_team}`, g);
  }
  const startersByGameTeam = new Map((starterRows.results || []).map(s => [`${s.game_id}|${s.team_id}`, s]));
  const stmt = env.DB.prepare(`
    INSERT OR REPLACE INTO ref_bvp_history (slate_date, batter_id, pitcher_id, batter_name, pitcher_name, batter_team, pitcher_team, pa, ab, hits, doubles, triples, home_runs, strikeouts, walks, raw_json, source_name, source_confidence, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'mlb_statsapi_vsPlayer', 'HIGH_DATA_LOW_SAMPLE_WARNING', CURRENT_TIMESTAMP)
  `);

  let inserted = 0, skipped = 0, attemptedPairs = 0, successfulFetches = 0, failedFetches = 0, pairsCompleted = 0;
  const errors = [];
  const skippedSamples = [];

  for (const leg of selected) {
    attemptedPairs += 1;
    const progressRef = { player_id: leg.pair_key, player_name: leg.pair_label };
    const batter = await findRefPlayerByNameTeam(env, leg.player_name, leg.team);
    if (!batter) { skipped++; skippedSamples.push({ pair: leg.pair_label, reason: 'batter_not_found' }); await markStaticProgress(env, 'bvp_current_slate', slateKey, 0, progressRef, 'NO_DATA', 'batter_not_found'); continue; }
    const g = gameByTeams.get(`${leg.team}|${leg.opponent}`);
    if (!g) { skipped++; skippedSamples.push({ pair: leg.pair_label, reason: 'game_not_found' }); await markStaticProgress(env, 'bvp_current_slate', slateKey, 0, progressRef, 'NO_DATA', 'game_not_found'); continue; }
    const starter = startersByGameTeam.get(`${g.game_id}|${leg.opponent}`);
    if (!starter) { skipped++; skippedSamples.push({ pair: leg.pair_label, reason: 'opponent_starter_not_found' }); await markStaticProgress(env, 'bvp_current_slate', slateKey, 0, progressRef, 'NO_DATA', 'opponent_starter_not_found'); continue; }
    const pitcher = await findRefPlayerByNameTeam(env, starter.starter_name, leg.opponent);
    if (!pitcher) { skipped++; skippedSamples.push({ pair: leg.pair_label, starter: starter.starter_name, reason: 'pitcher_not_found_in_ref_players' }); await markStaticProgress(env, 'bvp_current_slate', slateKey, 0, progressRef, 'NO_DATA', 'pitcher_not_found_in_ref_players'); continue; }

    const url = `https://statsapi.mlb.com/api/v1/people/${encodeURIComponent(batter.player_id)}/stats?stats=vsPlayer&opposingPlayerId=${encodeURIComponent(pitcher.player_id)}`;
    const fetched = await fetchJsonWithRetry(url, {}, 1, `bvp_${batter.player_id}_${pitcher.player_id}`);
    if (!fetched.ok) {
      failedFetches += 1;
      errors.push({ batter: batter.player_name, pitcher: pitcher.player_name, error: fetched.error });
      await markStaticProgress(env, 'bvp_current_slate', slateKey, 0, progressRef, 'ERROR_RETRYABLE', fetched.error);
      continue;
    }
    successfulFetches += 1;
    const split = fetched.data?.stats?.[0]?.splits?.[0] || {};
    const st = split.stat || {};
    const hasAnyHistory = Object.keys(st).length > 0 && (st.plateAppearances !== undefined || st.atBats !== undefined || st.hits !== undefined || st.homeRuns !== undefined || st.strikeOuts !== undefined || st.baseOnBalls !== undefined);
    if (!hasAnyHistory) {
      skipped++;
      skippedSamples.push({ batter: batter.player_name, pitcher: pitcher.player_name, reason: 'no_bvp_history_returned' });
      await markStaticProgress(env, 'bvp_current_slate', slateKey, 0, progressRef, 'NO_DATA', 'StatsAPI returned no BvP history for this pair');
      continue;
    }
    const res = await stmt.bind(
      slateDate, Number(batter.player_id), Number(pitcher.player_id), batter.player_name, pitcher.player_name, leg.team, leg.opponent,
      st.plateAppearances !== undefined ? Number(st.plateAppearances) : null,
      st.atBats !== undefined ? Number(st.atBats) : null,
      st.hits !== undefined ? Number(st.hits) : null,
      st.doubles !== undefined ? Number(st.doubles) : null,
      st.triples !== undefined ? Number(st.triples) : null,
      st.homeRuns !== undefined ? Number(st.homeRuns) : null,
      st.strikeOuts !== undefined ? Number(st.strikeOuts) : null,
      st.baseOnBalls !== undefined ? Number(st.baseOnBalls) : null,
      JSON.stringify(fetched.data || {}).slice(0,10000)
    ).run();
    const changes = Number(res?.meta?.changes || 0);
    inserted += changes;
    if (changes > 0) {
      pairsCompleted += 1;
      await markStaticProgress(env, 'bvp_current_slate', slateKey, 0, progressRef, 'COMPLETED', `${changes} BvP row inserted`);
    } else {
      skipped++;
      await markStaticProgress(env, 'bvp_current_slate', slateKey, 0, progressRef, 'NO_INSERT', 'BvP fetched but no DB change; likely duplicate existing row');
    }
  }

  const afterCount = await env.DB.prepare("SELECT COUNT(*) AS rows_count FROM ref_bvp_history WHERE slate_date=?").bind(slateDate).first().catch(() => ({ rows_count: 0 }));
  const remainingPairs = Math.max(0, eligible.length - selected.length);
  const status = failedFetches > 0 ? 'partial_retry_needed' : (remainingPairs > 0 ? 'partial_continue' : (Number(afterCount?.rows_count || 0) > 0 ? 'pass' : 'empty_no_bvp_history'));
  return {
    ok: failedFetches === 0,
    data_ok: Number(afterCount?.rows_count || 0) > 0 && failedFetches === 0,
    job: input.job || "scrape_static_bvp_current_slate",
    version: SYSTEM_VERSION,
    status,
    table: "ref_bvp_history",
    slate_date: slateDate,
    candidate_pairs: candidates.length,
    eligible_before_this_run: eligible.length,
    batch_limit: hardLimit,
    attempted_pairs: attemptedPairs,
    successful_fetch_count: successfulFetches,
    failed_fetch_count: failedFetches,
    inserted_rows: inserted,
    total_ref_bvp_history_after: Number(afterCount?.rows_count || 0),
    pairs_completed_this_run: pairsCompleted,
    skipped_pairs: skipped,
    remaining_pairs_after: remainingPairs,
    needs_continue: remainingPairs > 0,
    reset_performed: resetPerformed,
    reset_reason: resetReason,
    root_cause_fixed: "v1.2.78 tried up to 250 BvP pairs in one request, hit Cloudflare subrequest limits, and falsely returned pass. v1.2.79 uses 5-pair resumable batches plus same-job guard and scheduler pause.",
    errors: errors.slice(0, 10),
    skipped_samples: skippedSamples.slice(0, 10),
    estimated_seconds: "8-25 seconds per 5-pair resumable batch",
    note: "Resumable current-slate BvP scrape. Run BvP Slate until remaining_pairs_after is 0. BvP is a low-sample tiebreaker source; missing history is normal and marked NO_DATA. Static data is protected from scheduled tasks in v1.2.79."
  };
}

async function syncStaticAllFast(input, env) {
  const venues = await syncStaticVenues({ ...input, job: "scrape_static_venues" }, env);
  const aliases = await syncStaticTeamAliases({ ...input, job: "scrape_static_team_aliases" }, env);
  return {
    ok: Boolean(venues.ok && aliases.ok),
    job: input.job || "scrape_static_all_fast",
    version: SYSTEM_VERSION,
    status: "pass",
    steps: { venues, aliases, players: { skipped: true, reason: "Static players are chunked in v1.2.73. Run Players G1-G6 in order to avoid Cloudflare subrequest limits." } },
    estimated_seconds: "10-25 seconds",
    note: "Fast static foundation only: venues + team aliases. Static players are intentionally separated into Players G1-G6 chunk buttons."
  };
}


async function ensureStaticTempReferenceTables(env) {
  await ensureStaticReferenceTables(env);
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS ref_venues_temp (venue_id INTEGER PRIMARY KEY, team_id TEXT, mlb_venue_name TEXT, city TEXT, state TEXT, roof_status TEXT, surface_type TEXT, altitude_ft INTEGER, left_field_dimension_ft INTEGER, center_field_dimension_ft INTEGER, right_field_dimension_ft INTEGER, source_name TEXT, source_confidence TEXT, notes TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS ref_team_aliases_temp (alias_type TEXT NOT NULL, raw_alias TEXT NOT NULL, canonical_name TEXT, canonical_team_id TEXT, mlb_id INTEGER, confidence TEXT, action TEXT, notes TEXT, source_name TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (alias_type, raw_alias))`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS ref_players_temp (player_id INTEGER PRIMARY KEY, mlb_id INTEGER, player_name TEXT, team_id TEXT, primary_position TEXT, role TEXT, bats TEXT, throws TEXT, birth_date TEXT, age INTEGER, active INTEGER DEFAULT 1, source_name TEXT, source_confidence TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS static_temp_refresh_runs (request_id TEXT PRIMARY KEY, status TEXT NOT NULL, run_after TEXT, current_step TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, started_at TEXT, finished_at TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, output_json TEXT, error TEXT)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS static_temp_certification_audits (audit_id TEXT PRIMARY KEY, grade TEXT NOT NULL, data_ok INTEGER NOT NULL, status TEXT NOT NULL, temp_refresh_request_id TEXT, temp_refresh_finished_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, counts_json TEXT, failures_json TEXT, warnings_json TEXT, output_json TEXT)`).run();
}


async function syncStaticVenuesTemp(input, env) {
  await ensureStaticTempReferenceTables(env);
  const teams = await fetchMlbTeamsForStatic();
  await env.DB.prepare("DELETE FROM ref_venues_temp").run();
  const stmt = env.DB.prepare(`INSERT OR REPLACE INTO ref_venues_temp (venue_id, team_id, mlb_venue_name, city, state, roof_status, surface_type, altitude_ft, left_field_dimension_ft, center_field_dimension_ft, right_field_dimension_ft, source_name, source_confidence, notes, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`);
  let inserted = 0;
  const audit = [];
  for (const t of teams) {
    const teamId = MLB_TEAM_ABBR[t.id];
    const venueOverride = STATIC_TEAM_VENUE_OVERRIDES[teamId] || null;
    let venueId = venueOverride?.venue_id ? Number(venueOverride.venue_id) : Number(t?.venue?.id || 0);
    let venue = venueOverride ? { id: venueId, name: venueOverride.name, location: { city: venueOverride.city, state: venueOverride.state, stateAbbrev: venueOverride.state }, fieldInfo: { roofType: venueOverride.roof_status, turfType: venueOverride.surface_type } } : (t.venue || {});
    if (venueId) {
      const vf = await fetchJsonWithRetry(`https://statsapi.mlb.com/api/v1/venues/${venueId}`, {}, 2, `mlb_venue_temp_${venueId}`);
      if (vf.ok && Array.isArray(vf.data?.venues) && vf.data.venues[0]) venue = { ...venue, ...vf.data.venues[0] };
    }
    if (venueOverride) {
      venue = { ...venue, name: venueOverride.name, location: { ...(venue.location || {}), city: venueOverride.city, state: venueOverride.state, stateAbbrev: venueOverride.state }, fieldInfo: { ...(venue.fieldInfo || {}), roofType: venueOverride.roof_status, turfType: venueOverride.surface_type } };
    }
    const sup = STATIC_VENUE_SUPPLEMENT[venueId] || {};
    const fieldInfo = venue.fieldInfo || {};
    const roof = fieldInfo.roofType || fieldInfo.roof || venue.roofType || null;
    const turf = fieldInfo.turfType || fieldInfo.surface || venue.turfType || null;
    const loc = venue.location || t.location || {};
    const res = await stmt.bind(venueId || null, teamId, venue.name || t?.venue?.name || null, loc.city || t?.venue?.location?.city || null, loc.stateAbbrev || loc.state || null, roof, turf, sup.altitude_ft ?? null, sup.left_field_dimension_ft ?? null, sup.center_field_dimension_ft ?? null, sup.right_field_dimension_ft ?? null, sup.altitude_ft ? "mlb_statsapi_plus_controlled_static_venue_source" : "mlb_statsapi_venue_basic", sup.altitude_ft ? "HIGH_FOR_API_FIELDS_MEDIUM_FOR_SUPPLEMENTAL" : "HIGH_FOR_API_FIELDS", venueOverride?.notes || sup.notes || "MLB StatsAPI venue basic fields; supplemental dimensions not available.").run();
    inserted += Number(res?.meta?.changes || 0);
    audit.push({ team_id: teamId, venue_id: venueId, venue_name: venue.name || null, supplemental_static: Boolean(sup.altitude_ft), override_applied: Boolean(venueOverride) });
  }
  return { ok: true, data_ok: inserted >= 30, job: input.job || "scrape_static_temp_venues", version: SYSTEM_VERSION, status: inserted >= 30 ? "pass" : "needs_review", table: "ref_venues_temp", fetched_teams: teams.length, inserted_rows: inserted, audit, live_tables_touched: false, estimated_seconds: "5-15 seconds", note: "Wiped and rebuilt ref_venues_temp only. Live ref_venues was not touched." };
}

async function syncStaticTeamAliasesTemp(input, env) {
  await ensureStaticTempReferenceTables(env);
  const teams = await fetchMlbTeamsForStatic();
  await env.DB.prepare("DELETE FROM ref_team_aliases_temp").run();
  const stmt = env.DB.prepare(`INSERT OR REPLACE INTO ref_team_aliases_temp (alias_type, raw_alias, canonical_name, canonical_team_id, mlb_id, confidence, action, notes, source_name, updated_at) VALUES ('team', ?, ?, ?, ?, ?, ?, ?, 'mlb_statsapi_team_alias_seed', CURRENT_TIMESTAMP)`);
  let inserted = 0;
  for (const t of teams) {
    const teamId = MLB_TEAM_ABBR[t.id];
    const aliases = [teamId, t.abbreviation, t.teamName, t.name, t.shortName, t.fileCode].filter(Boolean);
    const seen = new Set();
    for (const a of aliases) {
      const raw = String(a).trim();
      if (!raw || seen.has(raw.toLowerCase())) continue;
      seen.add(raw.toLowerCase());
      const res = await stmt.bind(raw, t.name || null, teamId, Number(t.id), "HIGH", "map", "Official or direct MLB StatsAPI team alias.").run();
      inserted += Number(res?.meta?.changes || 0);
    }
  }
  for (const r of [["LA", "Los Angeles Dodgers / Los Angeles Angels", null, null, "MEDIUM", "review", "Ambiguous; requires source context."], ["NY", "New York Mets / New York Yankees", null, null, "MEDIUM", "review", "Ambiguous; requires source context."], ["AZ", "Arizona Diamondbacks", "ARI", 109, "HIGH", "map", "Common non-MLB shorthand for ARI."]]) {
    const res = await stmt.bind(...r).run();
    inserted += Number(res?.meta?.changes || 0);
  }
  return { ok: true, data_ok: inserted >= 100, job: input.job || "scrape_static_temp_team_aliases", version: SYSTEM_VERSION, status: inserted >= 100 ? "pass" : "needs_review", table: "ref_team_aliases_temp", teams: teams.length, inserted_rows: inserted, live_tables_touched: false, estimated_seconds: "3-10 seconds", note: "Wiped and rebuilt ref_team_aliases_temp only. Live ref_team_aliases was not touched." };
}

async function syncStaticPlayersTemp(input, env, group) {
  await ensureStaticTempReferenceTables(env);
  const season = Number(String(resolveSlateDate(input || {}).slate_date).slice(0,4));
  const allTeams = await fetchMlbTeamsForStatic();
  const teams = group ? groupSlice(allTeams, group) : allTeams;
  const stmt = env.DB.prepare(`INSERT OR REPLACE INTO ref_players_temp (player_id, mlb_id, player_name, team_id, primary_position, role, bats, throws, birth_date, age, active, source_name, source_confidence, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'mlb_statsapi_active_roster_reference', 'HIGH', CURRENT_TIMESTAMP)`);
  let inserted = 0;
  const audit = [];
  for (const t of teams) {
    const teamId = MLB_TEAM_ABBR[t.id];
    const url = `https://statsapi.mlb.com/api/v1/teams/${encodeURIComponent(t.id)}/roster?rosterType=active&hydrate=person`;
    const fetched = await fetchJsonWithRetry(url, {}, 3, `static_temp_roster_${teamId}`);
    audit.push({ team_id: teamId, ok: fetched.ok, error: fetched.error || null, roster_rows: fetched.data?.roster?.length || 0 });
    if (!fetched.ok) continue;
    for (const entry of (fetched.data?.roster || [])) {
      const person = entry.person || {};
      const pos = entry.position || person.primaryPosition || {};
      const playerId = Number(person.id || 0);
      if (!playerId || !person.fullName) continue;
      const primary = pos.abbreviation || pos.code || null;
      const res = await stmt.bind(playerId, playerId, person.fullName, teamId, primary, normalizeRoleFromPosition(primary, person?.pitchHand?.code), person?.batSide?.code || null, person?.pitchHand?.code || null, person?.birthDate || null, ageFromBirthDate(person?.birthDate)).run();
      inserted += Number(res?.meta?.changes || 0);
    }
  }
  const afterCount = await staticTableCount(env, "ref_players_temp");
  const failedTeams = audit.filter(a => !a.ok).length;
  return { ok: failedTeams === 0 && inserted > 0, data_ok: failedTeams === 0 && afterCount.rows_count > 0, job: input.job || `scrape_static_temp_players_g${group || 'all'}`, version: SYSTEM_VERSION, status: failedTeams ? "partial_retry_needed" : "pass", table: "ref_players_temp", season, group, teams_total: allTeams.length, teams_checked: teams.length, inserted_rows: inserted, total_ref_players_temp_after: afterCount.rows_count, failed_teams: failedTeams, team_audit: audit, live_tables_touched: false, estimated_seconds: "10-25 seconds per group", note: "Chunked static player scrape into ref_players_temp only. Live ref_players was not touched." };
}

async function scheduleStaticTempRefreshOnce(input, env) {
  await ensureStaticTempReferenceTables(env);
  const existing = await env.DB.prepare(`SELECT request_id, status, current_step, run_after, updated_at FROM static_temp_refresh_runs WHERE status IN ('pending','running') ORDER BY created_at DESC LIMIT 1`).first().catch(() => null);
  if (existing) return { ok: true, data_ok: false, job: input.job || 'schedule_static_temp_refresh_once', version: SYSTEM_VERSION, status: 'already_scheduled_or_running', existing_request: existing, live_tables_touched: false, note: 'A temp-only static refresh is already pending/running. Do not schedule another one.' };
  const requestId = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO static_temp_refresh_runs (request_id, status, run_after, current_step, created_at, updated_at, output_json) VALUES (?, 'pending', datetime('now', '+1 minute'), 'venues', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`).bind(requestId, JSON.stringify({ created_by: 'control_room', requested_job: input.job || 'schedule_static_temp_refresh_once', live_tables_touched: false })).run();
  return { ok: true, data_ok: true, job: input.job || 'schedule_static_temp_refresh_once', version: SYSTEM_VERSION, status: 'scheduled_for_next_minute', request_id: requestId, run_after: 'about 1 minute from now', refresh_steps: ['venues_temp','team_aliases_temp','players_temp_g1','players_temp_g2','players_temp_g3','players_temp_g4','players_temp_g5','players_temp_g6','audit_certification','promote_if_certified','clean_temp','completed'], live_tables_touched: false, estimated_total_minutes: '10-15 minutes after the first cron tick', note: 'Cron will fill only _temp tables, certify them, promote only after A+/A audit, then clean temp. Live trusted tables are protected until certification passes.' };
}

function nextStaticTempStep(step) {
  const order = ['venues','aliases','players_g1','players_g2','players_g3','players_g4','players_g5','players_g6','audit','promote','clean','completed'];
  const i = order.indexOf(String(step || 'venues'));
  return order[Math.min(i + 1, order.length - 1)] || 'completed';
}

function staticTempRefreshReadyForAuditOrPromotion(run) {
  if (!run) return false;
  const status = String(run.status || '');
  const step = String(run.current_step || '');
  return status === 'completed' || (status === 'running' && ['audit','promote','clean','completed'].includes(step));
}

async function runStaticTempScheduledTick(input, env) {
  await ensureStaticTempReferenceTables(env);
  const row = await env.DB.prepare(`SELECT * FROM static_temp_refresh_runs WHERE status IN ('pending','running') AND (run_after IS NULL OR run_after <= CURRENT_TIMESTAMP) ORDER BY created_at ASC LIMIT 1`).first().catch(() => null);
  if (!row) return { ok: true, version: SYSTEM_VERSION, job: input.job || 'run_static_temp_refresh_tick', status: 'idle_no_due_temp_refresh', trigger: input.trigger || 'manual', live_tables_touched: false, note: 'No due temp-only static refresh request was found.' };
  const requestId = row.request_id;
  const step = String(row.current_step || 'venues');
  await env.DB.prepare(`UPDATE static_temp_refresh_runs SET status='running', started_at=COALESCE(started_at, CURRENT_TIMESTAMP), updated_at=CURRENT_TIMESTAMP WHERE request_id=?`).bind(requestId).run();
  let result;
  try {
    if (step === 'venues') {
      await env.DB.prepare('DELETE FROM ref_venues_temp').run();
      await env.DB.prepare('DELETE FROM ref_team_aliases_temp').run();
      await env.DB.prepare('DELETE FROM ref_players_temp').run();
      result = await syncStaticVenuesTemp({ ...input, job: 'scrape_static_temp_venues' }, env);
    } else if (step === 'aliases') {
      result = await syncStaticTeamAliasesTemp({ ...input, job: 'scrape_static_temp_team_aliases' }, env);
    } else if (/^players_g[1-6]$/.test(step)) {
      const group = Number(step.match(/g([1-6])$/)[1]);
      result = await syncStaticPlayersTemp({ ...input, job: `scrape_static_temp_players_g${group}` }, env, group);
    } else if (step === 'audit') {
      result = await auditStaticTempCertification({ ...input, job: 'audit_static_temp_certification', allow_running_refresh: true }, env);
    } else if (step === 'promote') {
      result = await promoteStaticTempToLive({ ...input, job: 'promote_static_temp_to_live', allow_running_refresh: true }, env);
    } else if (step === 'clean') {
      result = await cleanStaticTempTables({ ...input, job: 'clean_static_temp_tables' }, env);
    } else {
      result = { ok: true, data_ok: true, job: input.job || 'run_static_temp_refresh_tick', version: SYSTEM_VERSION, status: 'already_completed', request_id: requestId, live_tables_touched: false };
    }
    if (!result || result.ok === false || result.data_ok === false) {
      const failed = { ok: false, data_ok: false, version: SYSTEM_VERSION, job: input.job || 'run_static_temp_refresh_tick', request_id: requestId, processed_step: step, status: 'pipeline_blocked', step_result: result, live_tables_touched: false, note: 'Weekly static pipeline stopped before promotion/cleanup because this step did not pass. Live trusted tables are protected unless certification and promotion both pass.' };
      await env.DB.prepare(`UPDATE static_temp_refresh_runs SET status='failed', finished_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP, error=?, output_json=? WHERE request_id=?`).bind(String(result?.error || result?.status || 'step_failed'), JSON.stringify(failed), requestId).run().catch(() => null);
      return failed;
    }
    const nextStep = nextStaticTempStep(step);
    const complete = nextStep === 'completed';
    const counts = await staticTempCounts(env).catch(() => null);
    const wrapped = { ok: true, data_ok: true, version: SYSTEM_VERSION, job: input.job || 'run_static_temp_refresh_tick', request_id: requestId, processed_step: step, next_step: nextStep, refresh_complete: complete, step_result: result, counts, live_tables_touched: step === 'promote' ? true : false, note: complete ? 'Weekly static pipeline completed: temp scrape, certification, protected promotion, and temp cleanup finished.' : 'Weekly static pipeline advanced one protected step. Minute cron will continue the next step automatically.' };
    await env.DB.prepare(`UPDATE static_temp_refresh_runs SET status=?, current_step=?, finished_at=CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE finished_at END, updated_at=CURRENT_TIMESTAMP, output_json=? WHERE request_id=?`).bind(complete ? 'completed' : 'running', nextStep, complete ? 1 : 0, JSON.stringify(wrapped), requestId).run();
    return wrapped;
  } catch (err) {
    const failure = { ok: false, data_ok: false, version: SYSTEM_VERSION, job: input.job || 'run_static_temp_refresh_tick', request_id: requestId, processed_step: step, status: 'failed_exception', error: String(err?.message || err), live_tables_touched: false };
    await env.DB.prepare(`UPDATE static_temp_refresh_runs SET status='failed', finished_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP, error=?, output_json=? WHERE request_id=?`).bind(failure.error, JSON.stringify(failure), requestId).run().catch(() => null);
    return failure;
  }
}

async function staticTempCounts(env) {
  return [await staticTableCount(env, 'ref_venues_temp'), await staticTableCount(env, 'ref_team_aliases_temp'), await staticTableCount(env, 'ref_players_temp')];
}

async function checkStaticTempData(input, env, target) {
  await ensureStaticTempReferenceTables(env);
  const targets = target === 'all' ? ['ref_venues_temp','ref_team_aliases_temp','ref_players_temp'] : [target];
  const counts = [];
  for (const t of targets) counts.push(await staticTableCount(env, t));
  const countMap = Object.fromEntries(counts.map(c => [c.table, c.rows_count]));
  const roleRows = await env.DB.prepare(`SELECT role, COUNT(*) AS rows_count FROM ref_players_temp GROUP BY role ORDER BY role`).all().catch(() => ({ results: [] }));
  const duplicatePlayers = await env.DB.prepare(`SELECT player_id, COUNT(*) AS rows_count FROM ref_players_temp GROUP BY player_id HAVING COUNT(*) > 1 LIMIT 20`).all().catch(() => ({ results: [] }));
  const duplicateAliases = await env.DB.prepare(`SELECT alias_type, raw_alias, COUNT(*) AS rows_count FROM ref_team_aliases_temp GROUP BY alias_type, raw_alias HAVING COUNT(*) > 1 LIMIT 20`).all().catch(() => ({ results: [] }));
  const quality = { venues_rows_ok: (countMap.ref_venues_temp || 0) >= 30, aliases_rows_ok: (countMap.ref_team_aliases_temp || 0) >= 120, players_rows_ok: (countMap.ref_players_temp || 0) >= 750, duplicate_players: duplicatePlayers.results || [], duplicate_aliases: duplicateAliases.results || [], player_role_split: roleRows.results || [] };
  const dataOk = counts.every(c => c.exists && c.rows_count > 0) && (target !== 'all' || (quality.venues_rows_ok && quality.aliases_rows_ok && quality.players_rows_ok && quality.duplicate_players.length === 0 && quality.duplicate_aliases.length === 0));
  const samples = {};
  for (const c of counts) {
    if (!c.exists || c.rows_count <= 0) continue;
    const rows = await env.DB.prepare(`SELECT * FROM ${c.table} LIMIT 10`).all();
    samples[c.table] = rows.results || [];
  }
  const latestRun = await env.DB.prepare(`SELECT request_id, status, current_step, created_at, started_at, finished_at, updated_at, error, substr(output_json,1,1200) AS output_preview FROM static_temp_refresh_runs ORDER BY created_at DESC LIMIT 1`).first().catch(() => null);
  return { ok: true, data_ok: dataOk, job: input.job || `check_static_temp_${target}`, version: SYSTEM_VERSION, status: dataOk ? 'pass' : 'needs_scrape_or_review', counts, quality, latest_temp_refresh: latestRun, samples, live_tables_touched: false, note: 'Temp checks are read-only. They validate staging tables only. Use CERTIFY TEMP > Audit Static Temp before promotion.' };
}


function pctDiff(a, b) {
  const x = Number(a || 0), y = Number(b || 0);
  if (!x && !y) return 0;
  const base = Math.max(1, Math.max(Math.abs(x), Math.abs(y)));
  return Math.abs(x - y) / base;
}

async function countFirst(env, sql, binds = []) {
  let q = env.DB.prepare(sql);
  for (const b of binds) q = q.bind(b);
  const row = await q.first().catch(() => null);
  return Number(row?.c || row?.rows_count || 0);
}

async function sampleRows(env, sql, binds = []) {
  let q = env.DB.prepare(sql);
  for (const b of binds) q = q.bind(b);
  const rows = await q.all().catch(() => ({ results: [] }));
  return rows.results || [];
}

function auditGradeFromFailuresWarnings(failures, warnings) {
  if (failures.length > 0) return 'FAIL';
  const serious = warnings.filter(w => w.severity === 'HIGH').length;
  if (serious > 0) return 'B';
  if (warnings.length > 0) return 'A';
  return 'A+';
}

async function auditStaticTempCertification(input, env) {
  await ensureStaticTempReferenceTables(env);
  const latestRun = await env.DB.prepare(`SELECT request_id, status, current_step, created_at, started_at, finished_at, updated_at, error FROM static_temp_refresh_runs ORDER BY created_at DESC LIMIT 1`).first().catch(() => null);
  const counts = {
    ref_venues_temp: await staticTableCount(env, 'ref_venues_temp'),
    ref_team_aliases_temp: await staticTableCount(env, 'ref_team_aliases_temp'),
    ref_players_temp: await staticTableCount(env, 'ref_players_temp'),
    ref_venues_live: await staticTableCount(env, 'ref_venues'),
    ref_team_aliases_live: await staticTableCount(env, 'ref_team_aliases'),
    ref_players_live: await staticTableCount(env, 'ref_players')
  };
  const failures = [];
  const warnings = [];
  const vRows = counts.ref_venues_temp.rows_count;
  const aRows = counts.ref_team_aliases_temp.rows_count;
  const pRows = counts.ref_players_temp.rows_count;
  if (!staticTempRefreshReadyForAuditOrPromotion(latestRun)) failures.push({ code: 'LATEST_TEMP_REFRESH_NOT_READY_FOR_CERTIFICATION', detail: latestRun || null });
  if (!counts.ref_venues_temp.exists || vRows < 30) failures.push({ code: 'VENUES_TEMP_ROW_COUNT_LOW', rows_count: vRows, required_min: 30 });
  if (!counts.ref_team_aliases_temp.exists || aRows < 120) failures.push({ code: 'ALIASES_TEMP_ROW_COUNT_LOW', rows_count: aRows, required_min: 120 });
  if (!counts.ref_players_temp.exists || pRows < 750) failures.push({ code: 'PLAYERS_TEMP_ROW_COUNT_LOW', rows_count: pRows, required_min: 750 });

  const duplicatePlayers = await sampleRows(env, `SELECT player_id, COUNT(*) AS rows_count FROM ref_players_temp GROUP BY player_id HAVING COUNT(*) > 1 LIMIT 20`);
  const duplicateAliases = await sampleRows(env, `SELECT alias_type, raw_alias, COUNT(*) AS rows_count FROM ref_team_aliases_temp GROUP BY alias_type, raw_alias HAVING COUNT(*) > 1 LIMIT 20`);
  const duplicateVenues = await sampleRows(env, `SELECT team_id, COUNT(*) AS rows_count FROM ref_venues_temp GROUP BY team_id HAVING COUNT(*) > 1 LIMIT 20`);
  if (duplicatePlayers.length) failures.push({ code: 'DUPLICATE_PLAYER_IDS', rows: duplicatePlayers });
  if (duplicateAliases.length) failures.push({ code: 'DUPLICATE_ALIASES', rows: duplicateAliases });
  if (duplicateVenues.length) failures.push({ code: 'DUPLICATE_VENUE_TEAM_IDS', rows: duplicateVenues });

  const venueCriticalNulls = await countFirst(env, `SELECT COUNT(*) AS c FROM ref_venues_temp WHERE venue_id IS NULL OR team_id IS NULL OR TRIM(team_id)='' OR mlb_venue_name IS NULL OR TRIM(mlb_venue_name)=''`);
  const aliasCriticalNulls = await countFirst(env, `SELECT COUNT(*) AS c FROM ref_team_aliases_temp WHERE raw_alias IS NULL OR TRIM(raw_alias)='' OR action IS NULL OR TRIM(action)='' OR (action='map' AND (canonical_team_id IS NULL OR TRIM(canonical_team_id)=''))`);
  const playerCriticalNulls = await countFirst(env, `SELECT COUNT(*) AS c FROM ref_players_temp WHERE player_id IS NULL OR player_name IS NULL OR TRIM(player_name)='' OR team_id IS NULL OR TRIM(team_id)='' OR role IS NULL OR TRIM(role)=''`);
  if (venueCriticalNulls) failures.push({ code: 'VENUE_CRITICAL_NULLS', rows_count: venueCriticalNulls });
  if (aliasCriticalNulls) failures.push({ code: 'ALIAS_CRITICAL_NULLS', rows_count: aliasCriticalNulls });
  if (playerCriticalNulls) failures.push({ code: 'PLAYER_CRITICAL_NULLS', rows_count: playerCriticalNulls });

  const invalidRoles = await sampleRows(env, `SELECT role, COUNT(*) AS rows_count FROM ref_players_temp WHERE role NOT IN ('BATTER','PITCHER') OR role IS NULL GROUP BY role LIMIT 20`);
  const invalidPlayerTeams = await sampleRows(env, `SELECT p.team_id, COUNT(*) AS rows_count FROM ref_players_temp p LEFT JOIN ref_team_aliases_temp a ON a.alias_type='team' AND a.raw_alias=p.team_id AND a.action='map' WHERE a.raw_alias IS NULL GROUP BY p.team_id LIMIT 20`);
  if (invalidRoles.length) failures.push({ code: 'INVALID_PLAYER_ROLES', rows: invalidRoles });
  if (invalidPlayerTeams.length) failures.push({ code: 'PLAYER_TEAM_IDS_NOT_IN_TEMP_ALIASES', rows: invalidPlayerTeams });

  const roleSplit = await sampleRows(env, `SELECT role, COUNT(*) AS rows_count FROM ref_players_temp GROUP BY role ORDER BY role`);
  const teamRosterCounts = await sampleRows(env, `SELECT team_id, COUNT(*) AS rows_count FROM ref_players_temp GROUP BY team_id ORDER BY team_id`);
  const lowRosterTeams = teamRosterCounts.filter(r => Number(r.rows_count || 0) < 20);
  const distinctTeams = teamRosterCounts.length;
  if (distinctTeams < 30) failures.push({ code: 'PLAYER_TEAM_COVERAGE_LOW', distinct_teams: distinctTeams, required_min: 30 });
  if (lowRosterTeams.length) warnings.push({ code: 'LOW_ROSTER_TEAM_COUNTS', severity: 'HIGH', rows: lowRosterTeams });
  const batterCount = roleSplit.find(r => r.role === 'BATTER')?.rows_count || 0;
  const pitcherCount = roleSplit.find(r => r.role === 'PITCHER')?.rows_count || 0;
  if (Number(batterCount) < 300 || Number(pitcherCount) < 300) failures.push({ code: 'PLAYER_ROLE_BALANCE_BAD', role_split: roleSplit });

  const venueLiveDiff = Math.abs(vRows - counts.ref_venues_live.rows_count);
  const aliasLiveDiffPct = pctDiff(aRows, counts.ref_team_aliases_live.rows_count);
  const playerLiveDiffPct = pctDiff(pRows, counts.ref_players_live.rows_count);
  if (venueLiveDiff > 0) warnings.push({ code: 'VENUE_TEMP_LIVE_COUNT_DIFF', severity: 'LOW', temp_rows: vRows, live_rows: counts.ref_venues_live.rows_count });
  if (aliasLiveDiffPct > 0.05) warnings.push({ code: 'ALIAS_TEMP_LIVE_COUNT_DIFF_OVER_5_PERCENT', severity: 'MEDIUM', temp_rows: aRows, live_rows: counts.ref_team_aliases_live.rows_count });
  if (playerLiveDiffPct > 0.05) warnings.push({ code: 'PLAYER_TEMP_LIVE_COUNT_DIFF_OVER_5_PERCENT', severity: 'MEDIUM', temp_rows: pRows, live_rows: counts.ref_players_live.rows_count });
  const staleRows = await countFirst(env, `SELECT COUNT(*) AS c FROM ref_players_temp WHERE updated_at IS NULL OR datetime(updated_at) < datetime('now', '-2 days')`);
  if (staleRows) warnings.push({ code: 'STALE_PLAYER_TEMP_TIMESTAMPS', severity: 'MEDIUM', rows_count: staleRows });

  const grade = auditGradeFromFailuresWarnings(failures, warnings);
  const dataOk = grade === 'A+' || grade === 'A';
  const status = dataOk ? 'certified' : 'blocked';
  const auditId = crypto.randomUUID();
  const result = { ok: true, data_ok: dataOk, job: input.job || 'audit_static_temp_certification', version: SYSTEM_VERSION, status, certification_grade: grade, promotion_allowed: dataOk, temp_refresh: latestRun, counts: Object.values(counts), quality: { duplicate_players: duplicatePlayers, duplicate_aliases: duplicateAliases, duplicate_venues: duplicateVenues, role_split: roleSplit, team_roster_counts: teamRosterCounts, failures, warnings }, live_tables_touched: false, note: dataOk ? 'Static temp certification passed. Promotion is allowed in this build.' : 'Static temp certification blocked promotion. Fix failures before promotion.' };
  await env.DB.prepare(`INSERT OR REPLACE INTO static_temp_certification_audits (audit_id, grade, data_ok, status, temp_refresh_request_id, temp_refresh_finished_at, counts_json, failures_json, warnings_json, output_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(auditId, grade, dataOk ? 1 : 0, status, latestRun?.request_id || null, latestRun?.finished_at || null, JSON.stringify(Object.values(counts)), JSON.stringify(failures), JSON.stringify(warnings), JSON.stringify(result)).run();
  return { ...result, audit_id: auditId };
}

async function latestStaticTempAudit(env) {
  await ensureStaticTempReferenceTables(env);
  const row = await env.DB.prepare(`SELECT audit_id, grade, data_ok, status, temp_refresh_request_id, temp_refresh_finished_at, created_at, output_json FROM static_temp_certification_audits ORDER BY created_at DESC LIMIT 1`).first().catch(() => null);
  if (!row) return null;
  let parsed = null;
  try { parsed = JSON.parse(row.output_json || '{}'); } catch (_) {}
  return { ...row, parsed };
}

async function promoteStaticTempToLive(input, env) {
  await ensureStaticTempReferenceTables(env);
  const latestRun = await env.DB.prepare(`SELECT request_id, status, current_step, finished_at FROM static_temp_refresh_runs ORDER BY created_at DESC LIMIT 1`).first().catch(() => null);
  const audit = await latestStaticTempAudit(env);
  if (!staticTempRefreshReadyForAuditOrPromotion(latestRun)) return { ok: false, data_ok: false, job: input.job || 'promote_static_temp_to_live', version: SYSTEM_VERSION, status: 'blocked_temp_refresh_not_ready_for_promotion', latest_temp_refresh: latestRun, live_tables_touched: false };
  if (!audit || !['A+','A'].includes(String(audit.grade || ''))) return { ok: false, data_ok: false, job: input.job || 'promote_static_temp_to_live', version: SYSTEM_VERSION, status: 'blocked_no_certified_audit', latest_audit: audit, live_tables_touched: false };
  if (audit.temp_refresh_request_id !== latestRun.request_id) return { ok: false, data_ok: false, job: input.job || 'promote_static_temp_to_live', version: SYSTEM_VERSION, status: 'blocked_audit_not_for_latest_refresh', latest_temp_refresh: latestRun, latest_audit: audit, live_tables_touched: false };
  const before = [await staticTableCount(env, 'ref_venues'), await staticTableCount(env, 'ref_team_aliases'), await staticTableCount(env, 'ref_players')];
  const tempCounts = [await staticTableCount(env, 'ref_venues_temp'), await staticTableCount(env, 'ref_team_aliases_temp'), await staticTableCount(env, 'ref_players_temp')];
  const tempMap = Object.fromEntries(tempCounts.map(c => [c.table, c.rows_count]));
  if ((tempMap.ref_venues_temp || 0) < 30 || (tempMap.ref_team_aliases_temp || 0) < 120 || (tempMap.ref_players_temp || 0) < 750) return { ok: false, data_ok: false, job: input.job || 'promote_static_temp_to_live', version: SYSTEM_VERSION, status: 'blocked_temp_counts_dropped_after_audit', temp_counts: tempCounts, live_tables_touched: false };
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM ref_venues`),
    env.DB.prepare(`INSERT INTO ref_venues (venue_id, team_id, mlb_venue_name, city, state, roof_status, surface_type, altitude_ft, left_field_dimension_ft, center_field_dimension_ft, right_field_dimension_ft, source_name, source_confidence, notes, updated_at) SELECT venue_id, team_id, mlb_venue_name, city, state, roof_status, surface_type, altitude_ft, left_field_dimension_ft, center_field_dimension_ft, right_field_dimension_ft, source_name, source_confidence, notes, updated_at FROM ref_venues_temp`),
    env.DB.prepare(`DELETE FROM ref_team_aliases`),
    env.DB.prepare(`INSERT INTO ref_team_aliases (alias_type, raw_alias, canonical_name, canonical_team_id, mlb_id, confidence, action, notes, source_name, updated_at) SELECT alias_type, raw_alias, canonical_name, canonical_team_id, mlb_id, confidence, action, notes, source_name, updated_at FROM ref_team_aliases_temp`),
    env.DB.prepare(`DELETE FROM ref_players`),
    env.DB.prepare(`INSERT INTO ref_players (player_id, mlb_id, player_name, team_id, primary_position, role, bats, throws, birth_date, age, active, source_name, source_confidence, updated_at) SELECT player_id, mlb_id, player_name, team_id, primary_position, role, bats, throws, birth_date, age, active, source_name, source_confidence, updated_at FROM ref_players_temp`)
  ]);
  const after = [await staticTableCount(env, 'ref_venues'), await staticTableCount(env, 'ref_team_aliases'), await staticTableCount(env, 'ref_players')];
  return { ok: true, data_ok: true, job: input.job || 'promote_static_temp_to_live', version: SYSTEM_VERSION, status: 'promoted', certification_grade: audit.grade, audit_id: audit.audit_id, temp_refresh_request_id: latestRun.request_id, before_counts: before, temp_counts: tempCounts, after_counts: after, live_tables_touched: true, note: 'Certified temp static tables were promoted to live trusted static tables. Temp tables were not cleaned yet; run Clean Static Temp after confirming promotion.' };
}

async function cleanStaticTempTables(input, env) {
  await ensureStaticTempReferenceTables(env);
  const before = [await staticTableCount(env, 'ref_venues_temp'), await staticTableCount(env, 'ref_team_aliases_temp'), await staticTableCount(env, 'ref_players_temp')];
  await env.DB.batch([env.DB.prepare(`DELETE FROM ref_venues_temp`), env.DB.prepare(`DELETE FROM ref_team_aliases_temp`), env.DB.prepare(`DELETE FROM ref_players_temp`)]);
  const after = [await staticTableCount(env, 'ref_venues_temp'), await staticTableCount(env, 'ref_team_aliases_temp'), await staticTableCount(env, 'ref_players_temp')];
  return { ok: true, data_ok: true, job: input.job || 'clean_static_temp_tables', version: SYSTEM_VERSION, status: 'temp_cleaned', before_counts: before, after_counts: after, live_tables_touched: false, note: 'Only _temp staging tables were cleaned. Certification audit logs and live trusted tables were preserved.' };
}


async function staticTableCount(env, tableName) {
  if (!(await tableExists(env, tableName))) return { table: tableName, exists: false, rows_count: 0 };
  const row = await env.DB.prepare(`SELECT COUNT(*) AS c FROM ${tableName}`).first();
  return { table: tableName, exists: true, rows_count: Number(row?.c || 0) };
}

async function checkStaticData(input, env, target) {
  const targets = target === 'all' ? ['ref_venues','ref_team_aliases','ref_players','ref_player_splits','player_game_logs','ref_bvp_history'] : [target];
  const counts = [];
  for (const t of targets) counts.push(await staticTableCount(env, t));
  const dataOk = counts.every(c => c.exists && c.rows_count > 0);
  const samples = {};
  for (const c of counts) {
    if (!c.exists || c.rows_count <= 0) continue;
    const rows = await env.DB.prepare(`SELECT * FROM ${c.table} LIMIT 10`).all();
    samples[c.table] = rows.results || [];
  }
  return { ok: true, data_ok: dataOk, job: input.job || `check_static_${target}`, version: SYSTEM_VERSION, status: dataOk ? 'pass' : 'needs_scrape', counts, samples, note: "Static checks are read-only. Missing/zero tables are not HTTP failures; fix them with the matching STATIC scrape button." };
}


async function ensureIncrementalBaseTables(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS incremental_player_metrics (player_id INTEGER PRIMARY KEY, player_name TEXT, team_id TEXT, role TEXT, season INTEGER, games_logged INTEGER, first_game_date TEXT, last_game_date TEXT, total_pa INTEGER, total_ab INTEGER, total_hits INTEGER, total_rbi INTEGER, total_home_runs INTEGER, total_walks INTEGER, total_strikeouts INTEGER, last3_games INTEGER, last3_hits INTEGER, last3_ab INTEGER, last5_games INTEGER, last5_hits INTEGER, last5_ab INTEGER, last10_games INTEGER, last10_hits INTEGER, last10_ab INTEGER, last20_games INTEGER, last20_hits INTEGER, last20_ab INTEGER, source_name TEXT, source_confidence TEXT, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
}
function incrementalGroupFromJob(jobName, prefix) {
  const m = String(jobName || '').match(new RegExp('^' + prefix + '_g([1-6])$'));
  return m ? Number(m[1]) : 1;
}
async function runIncrementalBaseGameLogs(input, env) {
  const requestedJob = String(input?.job || 'incremental_base_game_logs_g1');
  const group = incrementalGroupFromJob(requestedJob, 'incremental_base_game_logs');
  const result = await syncStaticPlayerGameLogs({ ...(input || {}), job: `scrape_static_game_logs_g${group}` }, env);
  return { ...result, job: requestedJob, mode: 'incremental_history_base_game_logs', source_job: `scrape_static_game_logs_g${group}`, note: 'Run the same Incremental Game Logs G button until remaining_in_group_after is 0, then move to the next group. This is the one-time historical base fill path; future daily updater should only add new deltas.' };
}
async function runIncrementalBaseSplits(input, env) {
  const requestedJob = String(input?.job || 'incremental_base_splits_g1');
  const group = incrementalGroupFromJob(requestedJob, 'incremental_base_splits');
  const result = await syncStaticPlayerSplits({ ...(input || {}), job: `scrape_static_player_splits_g${group}` }, env);
  return { ...result, job: requestedJob, mode: 'incremental_history_base_player_splits', source_job: `scrape_static_player_splits_g${group}`, note: 'Run the same Incremental Splits G button until remaining_in_group_after is 0, then move to the next group. Splits are season-evolving incremental data, not true static data.' };
}
async function buildIncrementalBaseDerivedMetrics(input, env) {
  await ensureStaticReferenceTables(env);
  await ensureIncrementalBaseTables(env);
  const season = Number(String(resolveSlateDate(input || {}).slate_date).slice(0,4));
  const players = await env.DB.prepare(`SELECT player_id, player_name, team_id, role FROM ref_players WHERE active=1 ORDER BY player_name`).all();
  const upsert = env.DB.prepare(`INSERT OR REPLACE INTO incremental_player_metrics (player_id, player_name, team_id, role, season, games_logged, first_game_date, last_game_date, total_pa, total_ab, total_hits, total_rbi, total_home_runs, total_walks, total_strikeouts, last3_games, last3_hits, last3_ab, last5_games, last5_hits, last5_ab, last10_games, last10_hits, last10_ab, last20_games, last20_hits, last20_ab, source_name, source_confidence, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'derived_from_player_game_logs', 'HIGH_DETERMINISTIC_FROM_MLB_GAMELOGS', CURRENT_TIMESTAMP)`);
  let inserted = 0, skippedNoLogs = 0;
  const samples = [];
  for (const p of (players.results || [])) {
    const logs = await env.DB.prepare(`SELECT game_date, COALESCE(pa,0) AS pa, COALESCE(ab,0) AS ab, COALESCE(hits,0) AS hits, COALESCE(home_runs,0) AS home_runs, COALESCE(walks,0) AS walks, COALESCE(strikeouts,0) AS strikeouts, raw_json FROM player_game_logs WHERE player_id=? AND season=? ORDER BY date(game_date) DESC, game_pk DESC`).bind(p.player_id, season).all();
    const rows = logs.results || [];
    if (!rows.length) { skippedNoLogs++; continue; }
    const total = { pa:0, ab:0, hits:0, rbi:0, hr:0, walks:0, k:0 };
    const win = { 3:{g:0,h:0,ab:0}, 5:{g:0,h:0,ab:0}, 10:{g:0,h:0,ab:0}, 20:{g:0,h:0,ab:0} };
    for (let i=0;i<rows.length;i++) {
      const r = rows[i];
      let rbi = 0;
      try { rbi = Number(JSON.parse(r.raw_json || '{}')?.stat?.rbi || 0); } catch (_) { rbi = 0; }
      total.pa += Number(r.pa || 0); total.ab += Number(r.ab || 0); total.hits += Number(r.hits || 0); total.rbi += rbi; total.hr += Number(r.home_runs || 0); total.walks += Number(r.walks || 0); total.k += Number(r.strikeouts || 0);
      for (const n of [3,5,10,20]) if (i < n) { win[n].g += 1; win[n].h += Number(r.hits || 0); win[n].ab += Number(r.ab || 0); }
    }
    const first = rows[rows.length-1]?.game_date || null;
    const last = rows[0]?.game_date || null;
    await upsert.bind(p.player_id, p.player_name, p.team_id, p.role, season, rows.length, first, last, total.pa, total.ab, total.hits, total.rbi, total.hr, total.walks, total.k, win[3].g, win[3].h, win[3].ab, win[5].g, win[5].h, win[5].ab, win[10].g, win[10].h, win[10].ab, win[20].g, win[20].h, win[20].ab).run();
    inserted++;
    if (samples.length < 10) samples.push({ player_id:p.player_id, player_name:p.player_name, role:p.role, games_logged:rows.length, last_game_date:last, last10_hits:win[10].h, last10_ab:win[10].ab });
  }
  const count = await env.DB.prepare(`SELECT COUNT(*) AS rows_count FROM incremental_player_metrics`).first();
  return { ok:true, data_ok:Number(count?.rows_count || 0) > 0, job:input.job || 'incremental_base_derived_metrics', version:SYSTEM_VERSION, status:'pass', table:'incremental_player_metrics', season, players_processed:inserted, skipped_players_no_logs:skippedNoLogs, total_incremental_player_metrics_after:Number(count?.rows_count || 0), samples, source_tables:['player_game_logs','ref_players'], live_tables_touched:true, note:'Derived incremental metrics were rebuilt from MLB game logs already stored in D1. No Gemini calls. No external subrequests.' };
}
async function checkIncrementalBaseData(input, env, target = 'all') {
  await ensureStaticReferenceTables(env);
  await ensureIncrementalBaseTables(env);
  const season = Number(String(resolveSlateDate(input || {}).slate_date).slice(0,4));
  const counts = [];
  async function addCount(table) {
    try { const r = await env.DB.prepare(`SELECT COUNT(*) AS rows_count FROM ${table}`).first(); counts.push({ table, exists:true, rows_count:Number(r?.rows_count || 0) }); }
    catch (e) { counts.push({ table, exists:false, rows_count:0, error:String(e?.message || e) }); }
  }
  if (target === 'game_logs' || target === 'all') await addCount('player_game_logs');
  if (target === 'splits' || target === 'all') await addCount('ref_player_splits');
  if (target === 'derived' || target === 'all') await addCount('incremental_player_metrics');
  const activePlayers = await env.DB.prepare(`SELECT COUNT(*) AS c FROM ref_players WHERE active=1`).first().catch(() => ({ c: 0 }));
  const gameCoverage = await env.DB.prepare(`SELECT COUNT(DISTINCT player_id) AS players_with_logs, COUNT(*) AS log_rows, MIN(game_date) AS first_game_date, MAX(game_date) AS last_game_date FROM player_game_logs WHERE season=?`).bind(season).first().catch(() => null);
  const splitCoverage = await env.DB.prepare(`SELECT COUNT(DISTINCT player_id) AS players_with_splits, COUNT(*) AS split_rows FROM ref_player_splits WHERE season=?`).bind(season).first().catch(() => null);
  const derivedCoverage = await env.DB.prepare(`SELECT COUNT(*) AS players_with_metrics, MIN(last_game_date) AS oldest_last_game, MAX(last_game_date) AS newest_last_game FROM incremental_player_metrics WHERE season=?`).bind(season).first().catch(() => null);
  const duplicateLogs = await env.DB.prepare(`SELECT player_id, season, game_pk, COUNT(*) AS rows_count FROM player_game_logs GROUP BY player_id, season, game_pk HAVING COUNT(*) > 1 LIMIT 20`).all().catch(() => ({ results: [] }));
  const duplicateSplits = await env.DB.prepare(`SELECT player_id, season, group_type, split_code, COUNT(*) AS rows_count FROM ref_player_splits GROUP BY player_id, season, group_type, split_code HAVING COUNT(*) > 1 LIMIT 20`).all().catch(() => ({ results: [] }));
  const orphanLogs = await env.DB.prepare(`SELECT COUNT(*) AS c FROM player_game_logs g LEFT JOIN ref_players p ON p.player_id=g.player_id WHERE p.player_id IS NULL`).first().catch(() => ({ c: 0 }));
  const roleSplit = await env.DB.prepare(`SELECT p.role, COUNT(DISTINCT g.player_id) AS players_with_logs, COUNT(g.game_pk) AS log_rows FROM player_game_logs g JOIN ref_players p ON p.player_id=g.player_id WHERE g.season=? GROUP BY p.role ORDER BY p.role`).bind(season).all().catch(() => ({ results: [] }));
  const samples = {};
  if (target === 'game_logs' || target === 'all') samples.player_game_logs = (await env.DB.prepare(`SELECT player_id, season, game_date, team_id, opponent_team, group_type, pa, ab, hits, home_runs, strikeouts, walks, source_confidence, updated_at FROM player_game_logs ORDER BY updated_at DESC LIMIT 10`).all().catch(() => ({ results: [] }))).results || [];
  if (target === 'splits' || target === 'all') samples.ref_player_splits = (await env.DB.prepare(`SELECT player_id, season, group_type, split_code, pa, ab, hits, home_runs, strikeouts, walks, avg, obp, slg, ops, source_confidence, updated_at FROM ref_player_splits ORDER BY updated_at DESC LIMIT 10`).all().catch(() => ({ results: [] }))).results || [];
  if (target === 'derived' || target === 'all') samples.incremental_player_metrics = (await env.DB.prepare(`SELECT player_id, player_name, role, games_logged, last_game_date, total_ab, total_hits, total_rbi, last10_hits, last10_ab, source_confidence, updated_at FROM incremental_player_metrics ORDER BY updated_at DESC LIMIT 10`).all().catch(() => ({ results: [] }))).results || [];
  const failures = [], warnings = [];
  const minCov = Math.max(700, Math.floor(Number(activePlayers?.c || 0) * 0.85));
  if ((target === 'game_logs' || target === 'all') && Number(gameCoverage?.players_with_logs || 0) < minCov) failures.push('game_log_player_coverage_low');
  if ((target === 'splits' || target === 'all') && Number(splitCoverage?.players_with_splits || 0) < minCov) failures.push('split_player_coverage_low');
  if ((target === 'derived' || target === 'all') && Number(derivedCoverage?.players_with_metrics || 0) < minCov) failures.push('derived_metric_player_coverage_low');
  if ((duplicateLogs.results || []).length) failures.push('duplicate_player_game_logs');
  if ((duplicateSplits.results || []).length) failures.push('duplicate_player_splits');
  if (Number(orphanLogs?.c || 0) > 0) failures.push('orphan_game_logs_without_ref_player');
  if (Number(gameCoverage?.players_with_logs || 0) < Number(activePlayers?.c || 0)) warnings.push('some_active_players_have_no_game_logs_this_season');
  const dataOk = failures.length === 0;
  return { ok:true, data_ok:dataOk, job:input.job || `check_incremental_${target}`, version:SYSTEM_VERSION, status:dataOk ? 'pass' : 'needs_review', season, counts, coverage:{ active_players:Number(activePlayers?.c || 0), game_logs:gameCoverage, player_splits:splitCoverage, derived_metrics:derivedCoverage, role_split:roleSplit.results || [] }, quality:{ duplicate_logs:duplicateLogs.results || [], duplicate_splits:duplicateSplits.results || [], orphan_logs_without_ref_player:Number(orphanLogs?.c || 0), failures, warnings }, samples, note:'Incremental checks are read-only and avoid large raw_json payloads. Build derived metrics after game logs/splits are fully mined.' };
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
  if (jobName === "board_queue_auto_build") {
    return await runBoardQueueAutoBuild({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "run_board_queue_pipeline") {
    return await runBoardQueuePipeline({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "board_queue_mine_one") {
    return await runBoardQueueMineOne({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "board_queue_auto_mine") {
    return await runBoardQueueAutoMine({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "board_queue_repair") {
    return await runBoardQueueRepair({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }

  if (/^incremental_base_game_logs_g[1-6]$/.test(jobName)) return await runIncrementalBaseGameLogs({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (/^incremental_base_splits_g[1-6]$/.test(jobName)) return await runIncrementalBaseSplits({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "incremental_base_derived_metrics") return await buildIncrementalBaseDerivedMetrics({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "check_incremental_game_logs") return await checkIncrementalBaseData({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env, 'game_logs');
  if (jobName === "check_incremental_player_splits") return await checkIncrementalBaseData({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env, 'splits');
  if (jobName === "check_incremental_derived_metrics") return await checkIncrementalBaseData({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env, 'derived');
  if (jobName === "check_incremental_all") return await checkIncrementalBaseData({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env, 'all');

  if (jobName === "scrape_static_venues") return await syncStaticVenues({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "scrape_static_team_aliases") return await syncStaticTeamAliases({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "scrape_static_players") return await syncStaticPlayers({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (/^scrape_static_players_g[1-6]$/.test(jobName)) return await syncStaticPlayers({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === 'scrape_static_player_splits_test_5' || /^scrape_static_player_splits_g[1-6]$/.test(jobName)) return await syncStaticPlayerSplits({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (/^scrape_static_game_logs_g[1-6]$/.test(jobName)) return await syncStaticPlayerGameLogs({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "scrape_static_bvp_current_slate") return await syncStaticBvpCurrentSlate({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "scrape_static_all_fast") return await syncStaticAllFast({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "schedule_static_temp_refresh_once") return await scheduleStaticTempRefreshOnce({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  if (jobName === "run_static_temp_refresh_tick") return await runStaticTempScheduledTick({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, trigger: "manual" }, env);
  if (jobName === "check_static_temp_venues") return await checkStaticTempData({ ...(body || {}), job: jobName }, env, "ref_venues_temp");
  if (jobName === "check_static_temp_team_aliases") return await checkStaticTempData({ ...(body || {}), job: jobName }, env, "ref_team_aliases_temp");
  if (jobName === "check_static_temp_players") return await checkStaticTempData({ ...(body || {}), job: jobName }, env, "ref_players_temp");
  if (jobName === "check_static_temp_all") return await checkStaticTempData({ ...(body || {}), job: jobName }, env, "all");
  if (jobName === "audit_static_temp_certification") return await auditStaticTempCertification({ ...(body || {}), job: jobName }, env);
  if (jobName === "promote_static_temp_to_live") return await promoteStaticTempToLive({ ...(body || {}), job: jobName }, env);
  if (jobName === "clean_static_temp_tables") return await cleanStaticTempTables({ ...(body || {}), job: jobName }, env);
  if (jobName === "check_static_venues") return await checkStaticData({ ...(body || {}), job: jobName }, env, "ref_venues");
  if (jobName === "check_static_team_aliases") return await checkStaticData({ ...(body || {}), job: jobName }, env, "ref_team_aliases");
  if (jobName === "check_static_players") return await checkStaticData({ ...(body || {}), job: jobName }, env, "ref_players");
  if (jobName === "check_static_player_splits") return await checkStaticData({ ...(body || {}), job: jobName }, env, "ref_player_splits");
  if (jobName === "check_static_game_logs") return await checkStaticData({ ...(body || {}), job: jobName }, env, "player_game_logs");
  if (jobName === "check_static_bvp") return await checkStaticData({ ...(body || {}), job: jobName }, env, "ref_bvp_history");
  if (jobName === "check_static_all") return await checkStaticData({ ...(body || {}), job: jobName }, env, "all");
  if (jobName === "scrape_games_markets" || jobName === "daily_mlb_slate") {
    return await syncMlbApiGamesMarkets({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (jobName === "scrape_starters_mlb_api" || jobName === "repair_starters_mlb_api") {
    return await syncMlbApiProbableStarters({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  if (/^scrape_starters_group_[123]$/.test(jobName)) {
    const groupJob = JOBS[jobName] || {};
    return await syncMlbApiProbableStarters({
      ...(body || {}),
      job: jobName,
      slate_date: slate.slate_date,
      slate_mode: slate.slate_mode,
      game_group_index: Number(groupJob.gameGroupIndex || 0),
      game_group_size: Number(groupJob.gameGroupSize || 5),
      deterministic_group_sync: true
    }, env);
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
  if (jobName === "scrape_starters_missing") {
    return await syncMissingStartersLiveFallback({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
  }
  return await runJob({ ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode }, env);
}

async function guardLongStaticJobAlreadyRunning(env, jobName) {
  if (!(/^scrape_static_game_logs_g[1-6]$/.test(String(jobName || "")) || /^incremental_base_game_logs_g[1-6]$/.test(String(jobName || "")) || String(jobName || "") === "scrape_static_bvp_current_slate")) return null;
  await env.DB.prepare(`
    UPDATE task_runs
    SET status='stale_reset',
        finished_at=CURRENT_TIMESTAMP,
        error='v1.2.79 static long-job same-job stale reset before new manual run'
    WHERE job_name=?
      AND status='running'
      AND started_at < datetime('now','-2 minutes')
  `).bind(jobName).run().catch(() => null);
  const row = await env.DB.prepare(`
    SELECT task_id, job_name, status, started_at
    FROM task_runs
    WHERE job_name=?
      AND status='running'
    ORDER BY started_at DESC
    LIMIT 1
  `).bind(jobName).first().catch(() => null);
  if (!row) return null;
  return { ok: true, data_ok: false, job: jobName, version: SYSTEM_VERSION, status: 'already_running_wait', active_task_id: row.task_id, active_started_at: row.started_at, retry_instruction: 'Do not tap again yet. Wait 60-90 seconds, then check task_runs or run the same button once.', root_cause_fixed: 'v1.2.79 prevents duplicate static game-log/BvP tasks when Safari/control-room retries after a load failure.', note: 'No new task was started because the same static long job is already running.' };
}

async function handleTaskRun(request, env) {
  if (!isAuthorized(request, env)) return unauthorized();
  const body = await safeJson(request);
  const slate = resolveSlateDate(body || {});
  const jobName = String((body || {}).job || "scrape_games_markets");
  const taskId = crypto.randomUUID();
  const input = { ...(body || {}), job: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, trigger: "manual" };
  await logSystemEvent(env, { trigger_source: "control_room_button", action_label: displayLabelForJob(jobName), job_name: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, status: "started", task_id: taskId, input_json: input });

  if (!isExecutableJobName(jobName)) {
    await logSystemEvent(env, { trigger_source: "control_room_button", action_label: displayLabelForJob(jobName), job_name: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, status: "rejected_unknown_job", http_status: 400, task_id: taskId, input_json: input });
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

  const longStaticGuard = await guardLongStaticJobAlreadyRunning(env, jobName);
  if (longStaticGuard) {
    await logSystemEvent(env, { trigger_source: "control_room_button", action_label: displayLabelForJob(jobName), job_name: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, status: "already_running_wait", http_status: 200, task_id: taskId, input_json: input, output_preview: longStaticGuard });
    return Response.json(longStaticGuard, { status: 200 });
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
  const httpStatus = result.ok ? 200 : 500;
  await logSystemEvent(env, { trigger_source: "control_room_button", action_label: displayLabelForJob(jobName), job_name: jobName, slate_date: slate.slate_date, slate_mode: slate.slate_mode, status: result.ok ? "success" : "failed", http_status: httpStatus, task_id: taskId, input_json: input, output_preview: result, error: result.ok ? null : (result.error || result.status || "job_failed") });
  return Response.json(result, { status: httpStatus });
}

async function countScalar(env, sql, bindValue) {
  const stmt = bindValue !== undefined ? env.DB.prepare(sql).bind(bindValue) : env.DB.prepare(sql);
  const result = await stmt.first();
  const values = Object.values(result || {});
  return Number(values[0] || 0);
}


async function snapshotReusableStarterOverrides(env, slateDate) {
  try {
    const rows = await env.DB.prepare(`
      SELECT * FROM starters_current
      WHERE game_id LIKE ?
        AND source IN (
          'gemini_live_missing_starter_fallback',
          'gemini_live_projected_missing_starter',
          'gemini_live_probable_missing_starter',
          'manual_projected_missing_starter',
          'manual_probable_missing_starter'
        )
        AND starter_name IS NOT NULL
        AND TRIM(starter_name) <> ''
        AND starter_name NOT IN ('TBD','TBA','Unknown','Starter')
    `).bind(`${slateDate}_%`).all();
    return rows.results || [];
  } catch (_) { return []; }
}

async function restoreReusableStarterOverrides(env, slateDate, rows) {
  if (!Array.isArray(rows) || !rows.length) return { restored: 0, skipped_existing: 0 };
  const existsStmt = env.DB.prepare("SELECT COUNT(*) AS c FROM starters_current WHERE game_id=? AND team_id=?");
  const insertStmt = env.DB.prepare(`
    INSERT OR REPLACE INTO starters_current (
      game_id, team_id, starter_name, throws, era, whip, strikeouts, innings_pitched,
      walks, hits_allowed, hr_allowed, days_rest, source, confidence, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  let restored = 0;
  let skipped = 0;
  for (const r of rows) {
    if (!String(r.game_id || '').startsWith(`${slateDate}_`)) continue;
    const ex = await existsStmt.bind(r.game_id, r.team_id).first();
    if (Number(ex?.c || 0) > 0) { skipped++; continue; }
    const res = await insertStmt.bind(
      r.game_id, r.team_id, r.starter_name, r.throws ?? null,
      r.era ?? null, r.whip ?? null, r.strikeouts ?? null, r.innings_pitched ?? null,
      r.walks ?? null, r.hits_allowed ?? null, r.hr_allowed ?? null, r.days_rest ?? null,
      r.source || 'manual_projected_missing_starter', r.confidence || 'projected'
    ).run();
    restored += Number(res?.meta?.changes || 0);
  }
  return { restored, skipped_existing: skipped };
}

async function countMissingStarterGames(env, slateDate) {
  return await countScalar(env, `
    SELECT COUNT(*) AS c FROM (
      SELECT g.game_id, COUNT(s.team_id) AS starters_found
      FROM games g
      LEFT JOIN starters_current s ON g.game_id = s.game_id
      WHERE g.game_date = ?
      GROUP BY g.game_id
      HAVING starters_found < 2
    )
  `, slateDate);
}

async function repairMissingStartersLockstep(input, env, slateDate, slate, steps, preservedRows) {
  const attempts = [];
  let restored = await restoreReusableStarterOverrides(env, slateDate, preservedRows);
  steps.push({ label: "Restore Reusable Missing Starters", job: "internal_restore_projected_starters", result: { ok: true, ...restored } });
  let remaining = await countMissingStarterGames(env, slateDate);
  for (let attempt = 1; attempt <= 3 && remaining > 0; attempt++) {
    const result = await syncMissingStartersLiveFallback({ ...(input || {}), job: "scrape_starters_missing", slate_date: slateDate, slate_mode: slate.slate_mode }, env);
    attempts.push({ attempt, result });
    steps.push({ label: "Missing Starter Fallback", job: "scrape_starters_missing", attempt, result });
    restored = await restoreReusableStarterOverrides(env, slateDate, preservedRows);
    if (restored.restored || restored.skipped_existing) steps.push({ label: "Restore Reusable Missing Starters After Fallback", job: "internal_restore_projected_starters", attempt, result: { ok: true, ...restored } });
    remaining = await countMissingStarterGames(env, slateDate);
    if (remaining <= 0) break;
    await sleepMs(900 * attempt);
  }
  const stillMissing = await missingStarterTargets(env, slateDate);
  return { ok: true, status: stillMissing.length ? "tolerated_partial_true_missing" : "pass", attempts, still_missing_targets: stillMissing, still_missing_games: await countMissingStarterGames(env, slateDate), note: stillMissing.length ? "Starter fallback exhausted live/override sources. Missing teams are warning-state TBD/projected-unavailable so full run continues mining raw board data." : "All starter pairs filled." };
}

async function runBoardQueueAutoMineWaves(input, env, slateDate, slate, maxWaves = 3) {
  const waves = [];
  for (let wave = 1; wave <= maxWaves; wave++) {
    const result = await runBoardQueueAutoMine({ ...(input || {}), job: "board_queue_auto_mine", slate_date: slateDate, slate_mode: slate.slate_mode, limit: BOARD_QUEUE_AUTO_MINE_LIMIT, retry_errors: false, persistent_miner: true }, env);
    waves.push({ wave, result });
    if (!result?.needs_continue) break;
    if (result?.mined_rows === 0 && result?.retry_later_count === 0 && result?.failed_count === 0) break;
    await sleepMs(700);
  }
  const totals = await env.DB.prepare(`
    SELECT COUNT(*) AS total_rows,
      SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending_rows,
      SUM(CASE WHEN status='RETRY_LATER' THEN 1 ELSE 0 END) AS retry_later_rows,
      SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed_rows,
      SUM(CASE WHEN status='RUNNING' THEN 1 ELSE 0 END) AS running_rows,
      SUM(CASE WHEN status='ERROR' THEN 1 ELSE 0 END) AS error_rows
    FROM board_factor_queue WHERE slate_date=?
  `).bind(slateDate).first();
  return { ok: true, job: "board_queue_auto_mine_waves", version: SYSTEM_VERSION, slate_date: slateDate, waves_run: waves.length, waves, totals: { total_rows: Number(totals?.total_rows || 0), pending_rows: Number(totals?.pending_rows || 0), completed_rows: Number(totals?.completed_rows || 0), retry_later_rows: Number(totals?.retry_later_rows || 0), running_rows: Number(totals?.running_rows || 0), error_rows: Number(totals?.error_rows || 0) }, needs_continue: Number(totals?.pending_rows || 0) > 0 || Number(totals?.retry_later_rows || 0) > 0 || Number(totals?.running_rows || 0) > 0 || Number(totals?.error_rows || 0) > 0, note: "Full run runs bounded mining waves only. Remaining rows are normal continuation work for scheduled runs; no data is abandoned." };
}

async function runFullPipelineCore(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;
  const startedAt = new Date().toISOString();
  const steps = [];
  const warnings = [];
  const errors = [];

  const staleRecovery = await resetStalePipelineRuntime(env, slateDate);
  steps.push({ label: "Stale Runtime Recovery", job: "internal_stale_recovery", result: staleRecovery });

  async function safeStep(label, job, runner, required = false) {
    try {
      const result = await runner();
      steps.push({ label, job, result });
      if (result && result.ok === false) {
        const msg = `${label}: ${result.error || result.status || 'not ok'}`;
        (required ? errors : warnings).push(msg);
      }
      return result;
    } catch (err) {
      const result = { ok: false, status: "STEP_EXCEPTION", error: String(err?.message || err) };
      steps.push({ label, job, result });
      const msg = `${label}: ${result.error}`;
      (required ? errors : warnings).push(msg);
      return result;
    }
  }

  const markets = await safeStep("Markets", "scrape_games_markets", async () => {
    let last = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      last = await syncMlbApiGamesMarkets({ ...(input || {}), job: "scrape_games_markets", slate_date: slateDate, slate_mode: slate.slate_mode }, env);
      if (last && last.ok) break;
    }
    return last || { ok: false, error: "No market attempt executed" };
  }, true);

  const games = await countScalar(env, "SELECT COUNT(*) AS c FROM games WHERE game_date = ?", slateDate).catch(() => 0);
  const marketsTotal = await countScalar(env, "SELECT COUNT(*) AS c FROM markets_current WHERE game_id LIKE ?", `${slateDate}_%`).catch(() => 0);

  const boardQueueAutoBuild = await safeStep("Board Queue Auto Build", "board_queue_auto_build", async () => {
    return await runBoardQueueAutoBuild({ ...(input || {}), job: "board_queue_auto_build", slate_date: slateDate, slate_mode: slate.slate_mode, max_passes: 8 }, env);
  }, false);

  const startersTotal = await countScalar(env, "SELECT COUNT(*) AS c FROM starters_current WHERE game_id LIKE ?", `${slateDate}_%`).catch(() => 0);
  const bullpensTotal = await countScalar(env, "SELECT COUNT(*) AS c FROM bullpens_current WHERE game_id LIKE ?", `${slateDate}_%`).catch(() => 0);
  const lineupsTotal = await countScalar(env, "SELECT COUNT(*) AS c FROM lineups_current WHERE game_id LIKE ?", `${slateDate}_%`).catch(() => 0);
  const recentUsageTotal = await countScalar(env, "SELECT COUNT(*) AS c FROM player_recent_usage").catch(() => 0);
  const playersTotal = await countScalar(env, "SELECT COUNT(*) AS c FROM players_current").catch(() => 0);
  const expectedStarters = games * 2;
  const missingGames = games > 0 ? await countScalar(env, `
    SELECT COUNT(*) AS c FROM (
      SELECT g.game_id, COUNT(s.team_id) AS starters_found
      FROM games g
      LEFT JOIN starters_current s ON g.game_id = s.game_id
      WHERE g.game_date = ?
      GROUP BY g.game_id
      HAVING starters_found < 2
    )
  `, slateDate).catch(() => 0) : 0;
  if (missingGames > 0) warnings.push(`${missingGames} games still have one-sided/TBD starters; mining should continue around available contexts and retry missing context later.`);
  if (lineupsTotal === 0) warnings.push("Confirmed lineups are not posted yet; lineup sweep/cron should retry later.");

  const queueTotals = await boardQueueTotals(env, slateDate).catch(() => null);
  const pending = Number(queueTotals?.pending_rows || 0);
  const retryLater = Number(queueTotals?.retry_later_rows || 0);
  const running = Number(queueTotals?.running_rows || 0);
  const errorRows = Number(queueTotals?.error_rows || 0);

  let pipelineStatus = "PASS";
  if (games <= 0 || marketsTotal <= 0 || !markets?.ok) pipelineStatus = "FAIL";
  else if (pending > 0 || retryLater > 0 || running > 0) pipelineStatus = "RETRY_LATER";
  else if (warnings.length || errorRows > 0 || errors.length) pipelineStatus = "PARTIAL_OK";

  return {
    ok: pipelineStatus !== "FAIL",
    status: pipelineStatus,
    pipeline_status: pipelineStatus,
    version: SYSTEM_VERSION,
    job: "run_full_pipeline",
    slate_date: slateDate,
    slate_mode: slate.slate_mode,
    dispatcher_mode: "v1.2.73_full_run_is_lightweight_dispatcher_no_mining_no_starter_sweep",
    games,
    markets: marketsTotal,
    expected_starters: expectedStarters,
    starters_total: startersTotal,
    bullpens_total: bullpensTotal,
    lineups_total: lineupsTotal,
    recent_usage_total: recentUsageTotal,
    players_total: playersTotal,
    queue_totals: queueTotals,
    board_queue_auto_build: boardQueueAutoBuild,
    board_queue_auto_mine: { skipped_in_full_run: true, reason: "Mining is intentionally excluded from FULL RUN to avoid Cloudflare subrequest limits. Scheduled/manual Auto Mine processes the queue in 5-row batches." },
    missing_games: missingGames,
    warnings,
    errors,
    audit_gates: {
      pass: "games/markets refreshed and no queue continuation needed",
      partial_ok: "non-fatal data warnings only",
      retry_later: "queue still has PENDING/RETRY_LATER/RUNNING rows for scheduled miner",
      fail: "games or markets empty after retry"
    },
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    steps
  };
}

async function runFullPipeline(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;
  const lockedBy = `${input?.trigger || 'manual'}:${crypto.randomUUID()}`;
  await resetStalePipelineRuntime(env, slateDate).catch(() => null);
  const lockId = `FULL_PIPELINE|${slateDate}`;
  const lock = await acquirePipelineLock(env, lockId, lockedBy, 15);
  if (!lock.acquired) {
    const totals = await boardQueueTotals(env, slateDate).catch(() => null);
    return {
      ok: true,
      version: SYSTEM_VERSION,
      job: 'run_full_pipeline',
      status: 'LOCKED',
      pipeline_status: 'LOCKED',
      slate_date: slateDate,
      lock_status: lock,
      board_queue_totals: totals,
      note: 'A full pipeline is already active. This request exited cleanly to prevent duplicate Worker subrequest storms. Mining can continue separately.'
    };
  }
  try {
    const result = await runFullPipelineCore(input || {}, env);
    if (result && typeof result === 'object') {
      result.lock_status = 'RELEASED';
      result.state_machine_policy = 'v1.2.73: FULL RUN is a lightweight atomic dispatcher using a slate-scoped FULL_PIPELINE lock. It does not mine rows or run starter/lineup sweeps, preventing Cloudflare subrequest overload.';
    }
    return result;
  } catch (err) {
    return {
      ok: true,
      version: SYSTEM_VERSION,
      job: 'run_full_pipeline',
      status: 'PARTIAL_OK_EXCEPTION_CAPTURED',
      pipeline_status: 'PARTIAL_OK',
      slate_date: slateDate,
      error: String(err?.message || err),
      note: 'Exception captured without HTTP 500 so the control room does not retry into a duplicate FULL RUN. Check system_event_log and let scheduled miner continue.'
    };
  } finally {
    await releasePipelineLock(env, lockId, lockedBy);
  }
}


const MLB_TEAM_ABBR = {
  109: "ARI", 144: "ATL", 110: "BAL", 111: "BOS", 112: "CHC", 113: "CIN",
  114: "CLE", 115: "COL", 145: "CWS", 116: "DET", 117: "HOU", 118: "KC",
  108: "LAA", 119: "LAD", 146: "MIA", 158: "MIL", 142: "MIN", 121: "NYM",
  147: "NYY", 133: "OAK", 143: "PHI", 134: "PIT", 135: "SD", 136: "SEA",
  137: "SFG", 138: "STL", 139: "TB", 140: "TEX", 141: "TOR", 120: "WSN"
};


function sleepMs(ms) {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

async function fetchJsonWithRetry(url, options = {}, retries = 3, label = "fetch_json") {
  let lastError = null;
  for (let attempt = 1; attempt <= Math.max(1, retries); attempt++) {
    try {
      const res = await fetch(url, { headers: { "accept": "application/json", ...(options.headers || {}) }, ...options });
      if (res.ok) return { ok: true, status: res.status, data: await res.json(), attempt };
      lastError = new Error(`${label} HTTP ${res.status}`);
      if (![408, 425, 429, 500, 502, 503, 504].includes(Number(res.status))) break;
    } catch (err) {
      lastError = err;
    }
    if (attempt < retries) await sleepMs(250 * attempt);
  }
  return { ok: false, status: null, data: null, error: String(lastError?.message || lastError || `${label} failed`) };
}

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
    const fetched = await fetchJsonWithRetry(url, {}, 3, "mlb_people_pitcher_stats");
    if (!fetched.ok) continue;

    const data = fetched.data || {};
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
    data_source: "mlb_statsapi_probable_pitcher",
    confidence: "official_probable"
  };
}

async function fetchMlbScheduleProbables(slateDate) {
  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(slateDate)}&hydrate=probablePitcher(stats(group=[pitching],type=[season]))`;
  const fetched = await fetchJsonWithRetry(url, {}, 4, "mlb_schedule_probables");
  if (!fetched.ok) throw new Error(`MLB schedule fetch failed after retry: ${fetched.error}`);
  return fetched.data || { dates: [] };
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
  const fetched = await fetchJsonWithRetry(url, {}, 3, "mlb_schedule_team");
  if (!fetched.ok) return [];
  const data = fetched.data || {};
  const games = [];
  for (const d of (data.dates || [])) for (const g of (d.games || [])) games.push(g);
  return games;
}

async function fetchMlbBoxscore(gamePk) {
  const fetched = await fetchJsonWithRetry(`https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`, {}, 3, "mlb_boxscore");
  if (!fetched.ok) return null;
  return fetched.data || null;
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

  const scheduleFetch = await fetchJsonWithRetry(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(slateDate)}`, {}, 3, "mlb_players_schedule");
  const scheduleJson = scheduleFetch.ok ? (scheduleFetch.data || { dates: [] }) : { dates: [] };

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
  const rows = [];
  const team_fetch_audit = [];

  for (const t of selectedTeams) {
    const rosterUrl = `https://statsapi.mlb.com/api/v1/teams/${encodeURIComponent(t.mlbId)}/roster?rosterType=active&hydrate=person(stats(group=[hitting,pitching],type=[season],season=${encodeURIComponent(String(slateDate).slice(0,4))}))`;
    const fetched = await fetchJsonWithRetry(rosterUrl, {}, 4, `mlb_roster_${t.teamId}`);
    team_fetch_audit.push({ team_id: t.teamId, ok: fetched.ok, attempt: fetched.attempt || null, error: fetched.error || null });
    if (!fetched.ok) continue;
    const rosterJson = fetched.data || {};
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

  if (!selectedTeams.length) {
    return { ok: false, job: input.job || "scrape_players_mlb_api", slate_date: slateDate, status: "no_slate_teams", group, teams_total: teamMap.size, teams_checked: 0, fetched_rows: 0, inserted: { players_current: 0 }, retry_later: true, note: "No slate teams were available. Run SCRAPE > Daily MLB Slate first, then retry this player group." };
  }
  if (!rowsToWrite.length) {
    return { ok: false, job: input.job || "scrape_players_mlb_api", slate_date: slateDate, status: "zero_player_rows", group, teams_total: teamMap.size, teams_checked: selectedTeams.length, fetched_rows: 0, inserted: { players_current: 0 }, retry_later: true, team_fetch_audit, note: "MLB roster calls produced zero rows after retry. Existing players_current was not cleared." };
  }

  const validated = validateRows("players_current", rowsToWrite);
  if (!validated.ok) throw new Error(`MLB player identity validation failed: ${validated.error}`);
  if (group === 1) {
    await env.DB.prepare("DELETE FROM players_current").run();
  }
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
    team_fetch_audit,
    fetched_rows: deduped.length,
    written_rows: inserted,
    deferred_rows: deferred,
    write_cap: maxWrites,
    inserted: { players_current: inserted },
    skipped_count: (validated.skipped?.length || 0) + (protectedFilter.skipped?.length || 0),
    skipped: [...(protectedFilter.skipped || []), ...(validated.skipped || [])].slice(0, 20),
    starter_protection_policy: "v1.2.73 preserves manual/fallback/valid official starters from blank/TBD/unknown API overwrite; valid official API may upgrade fallback rows.",
    complete: deferred === 0
  };
}


async function syncMlbApiRecentUsage(input, env) {
  const slate = resolveSlateDate(input || {});
  const slateDate = slate.slate_date;
  const previousDate = addDaysISO(slateDate, -1);

  const slateGames = await env.DB.prepare("SELECT game_id, away_team, home_team FROM games WHERE game_date = ? ORDER BY game_id").bind(slateDate).all();
  const slateTeams = [...new Set((slateGames.results || []).flatMap(g => [g.away_team, g.home_team]))];

  const scheduleFetch = await fetchJsonWithRetry(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(previousDate)}`, {}, 3, "mlb_previous_schedule");
  const scheduleJson = scheduleFetch.ok ? (scheduleFetch.data || { dates: [] }) : { dates: [] };

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
    status: rows.length > 0 ? "pass" : "no_confirmed_lineups_yet",
    slate_date: slateDate,
    source: "mlb_statsapi_boxscore_lineup",
    games_checked: gamesChecked,
    fetched_rows: rows.length,
    inserted: { lineups_current: inserted },
    retry_later: rows.length === 0,
    note: rows.length > 0 ? "Confirmed/available MLB API lineup rows inserted." : "MLB boxscore batting orders were not posted yet. Scheduled task should retry later after lineups are published.",
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

  const scheduleFetch = await fetchJsonWithRetry(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(previousDate)}`, {}, 3, "mlb_previous_schedule");
  const scheduleJson = scheduleFetch.ok ? (scheduleFetch.data || { dates: [] }) : { dates: [] };

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

  let workingRows = rows;
  let groupFilter = null;
  if (input && input.game_group_index !== undefined && input.game_group_index !== null) {
    const groupSize = Math.max(1, Number(input.game_group_size || 5));
    const groupIndex = Math.max(0, Number(input.game_group_index || 0));
    const offset = groupIndex * groupSize;
    const groupResult = await env.DB.prepare(
      "SELECT game_id, away_team, home_team FROM games WHERE game_date = ? ORDER BY game_id ASC LIMIT ? OFFSET ?"
    ).bind(slateDate, groupSize, offset).all();
    const groupGames = groupResult.results || [];
    const allowed = new Set(groupGames.map(g => g.game_id));
    workingRows = rows.filter(r => allowed.has(r.game_id));
    groupFilter = {
      enabled: true,
      group_index: groupIndex,
      group_size: groupSize,
      offset,
      games: groupGames,
      source_rows_before_filter: rows.length,
      source_rows_after_filter: workingRows.length
    };
  }

  await ensureStarterCompatibilityColumns(env).catch(() => null);
  const protectedFilter = await sanitizeStarterRowsForProtectedUpsert(env, workingRows);
  const validated = validateRows("starters_current", protectedFilter.rows);
  if (!validated.ok) throw new Error(`MLB starter validation failed: ${validated.error}`);
  const inserted = await upsertRows(env, "starters_current", validated.rows);

  let missingAfter = [];
  try {
    const missingSql = groupFilter && groupFilter.games && groupFilter.games.length
      ? `
        SELECT g.game_id, g.away_team, g.home_team, COUNT(s.team_id) AS starters_found
        FROM games g
        LEFT JOIN starters_current s ON s.game_id = g.game_id
        WHERE g.game_date = ? AND g.game_id IN (${groupFilter.games.map(() => '?').join(',')})
        GROUP BY g.game_id, g.away_team, g.home_team
        HAVING starters_found < 2
        ORDER BY g.game_id
      `
      : `
        SELECT g.game_id, g.away_team, g.home_team, COUNT(s.team_id) AS starters_found
        FROM games g
        LEFT JOIN starters_current s ON s.game_id = g.game_id
        WHERE g.game_date = ?
        GROUP BY g.game_id, g.away_team, g.home_team
        HAVING starters_found < 2
        ORDER BY g.game_id
      `;
    const binds = groupFilter && groupFilter.games && groupFilter.games.length ? [slateDate, ...groupFilter.games.map(g => g.game_id)] : [slateDate];
    const miss = await env.DB.prepare(missingSql).bind(...binds).all();
    missingAfter = miss.results || [];
  } catch (e) {
    missingAfter = [{ error: String(e?.message || e) }];
  }

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
    status: inserted > 0 ? "pass" : (missingAfter.length ? "no_new_probables_missing_remain" : "no_new_rows_already_current"),
    slate_mode: slate.slate_mode,
    source: "mlb_statsapi_schedule_probablePitcher_people_stats",
    mode: groupFilter ? "deterministic_mlb_api_group_sync_no_gemini" : "deterministic_mlb_api_full_sync_no_gemini",
    fetched_rows: workingRows.length,
    source_rows_before_group_filter: rows.length,
    stats_filled: statsFilled,
    stats_missing: validated.rows.length - statsFilled,
    inserted: { starters_current: inserted },
    group_filter: groupFilter,
    missing_starter_games_after: missingAfter,
    note: groupFilter ? "Starter group buttons now use deterministic MLB Stats API data, not Gemini. Zero inserts are not a fake failure; check missing_starter_games_after for truly unresolved official probables." : "Full deterministic MLB Stats API probable starter sync.",
    skipped_count: validated.skipped?.length || 0,
    skipped: (validated.skipped || []).slice(0, 20)
  };
}


function normalizePitcherThrowCode(value){const text=String(value||"").trim().toUpperCase();if(!text)return null;if(text==="R"||text==="RHP"||text.includes("RIGHT"))return"R";if(text==="L"||text==="LHP"||text.includes("LEFT"))return"L";if(text==="S"||text.includes("SWITCH"))return"S";return text.slice(0,1)}
function usableMissingStarterConfidence(value){const c=String(value||"").trim().toLowerCase();return c==="confirmed"||c==="official"||c==="probable"||c==="projected"}
async function missingStarterTargets(env,slateDate){const result=await env.DB.prepare(`SELECT g.game_id,g.away_team,g.home_team,g.start_time_utc,MAX(CASE WHEN s.team_id=g.away_team THEN s.starter_name ELSE NULL END) AS away_starter,MAX(CASE WHEN s.team_id=g.home_team THEN s.starter_name ELSE NULL END) AS home_starter,SUM(CASE WHEN s.team_id=g.away_team THEN 1 ELSE 0 END) AS has_away,SUM(CASE WHEN s.team_id=g.home_team THEN 1 ELSE 0 END) AS has_home,COUNT(s.team_id) AS starters_found FROM games g LEFT JOIN starters_current s ON s.game_id=g.game_id WHERE g.game_date=? GROUP BY g.game_id,g.away_team,g.home_team,g.start_time_utc HAVING starters_found<2 ORDER BY g.start_time_utc,g.game_id`).bind(slateDate).all();const targets=[];for(const g of(result.results||[])){if(!Number(g.has_away||0))targets.push({game_id:g.game_id,away_team:g.away_team,home_team:g.home_team,missing_team:g.away_team,known_team:g.home_team,known_starter:g.home_starter||null,start_time_utc:g.start_time_utc||null});if(!Number(g.has_home||0))targets.push({game_id:g.game_id,away_team:g.away_team,home_team:g.home_team,missing_team:g.home_team,known_team:g.away_team,known_starter:g.away_starter||null,start_time_utc:g.start_time_utc||null})}return targets}
function buildMissingStarterLivePrompt(slateDate,targets){return `You are repairing a deterministic MLB probable-starter database for slate ${slateDate}. Return ONLY valid JSON. No markdown. For each target, use current live MLB probable pitcher context. Prefer official MLB, team pages, reputable previews, Pitcher List, FanGraphs/RosterResource, ESPN, CBS, FOX, Rotowire. Do not invent. If truly TBD/not available, set starter_found=false and leave starter_name/throws empty. Targets: ${JSON.stringify(targets)} Required JSON shape: {"ok":true,"checked_at":"ISO timestamp","games":[{"game_id":"","away_team":"","home_team":"","missing_team":"","starter_found":true,"starter_name":"Full Name","throws":"RHP or LHP or R or L","confidence":"confirmed|official|probable|projected|not_available","source_summary":"short","notes":"short"}],"summary":{"missing_games_checked":0,"starters_found":0,"starters_not_available":0,"should_backend_fill_missing":true}}`}
async function syncMissingStartersLiveFallback(input,env){const slate=resolveSlateDate(input||{});const slateDate=String(input?.slate_date||slate.slate_date);const targets=await missingStarterTargets(env,slateDate);if(!targets.length){return{ok:true,job:"scrape_starters_missing",version:SYSTEM_VERSION,status:"pass_no_missing_starters",slate_date:slateDate,mode:"targeted_live_missing_starter_fallback",missing_games_checked:0,starters_found:0,inserted:{starters_current:0},still_missing_tbd:[],note:"No missing starter team/game pairs were found. No Gemini call made."}}const raw=await callGeminiWithFallback(env,buildMissingStarterLivePrompt(slateDate,targets));const parsed=parseStrictJson(cleanJsonText(raw));const games=Array.isArray(parsed.games)?parsed.games:[];const targetKeys=new Set(targets.map(t=>`${t.game_id}|${t.missing_team}`));const accepted=[];const rejected=[];for(const row of games){const key=`${row.game_id}|${row.missing_team}`;if(!targetKeys.has(key)){rejected.push({game_id:row.game_id||null,missing_team:row.missing_team||null,reason:"not_in_missing_target_list"});continue}const name=String(row.starter_name||"").trim();if(row.starter_found!==true||!name){rejected.push({game_id:row.game_id,missing_team:row.missing_team,reason:"not_available_or_empty",confidence:row.confidence||null,notes:row.notes||null});continue}if(!usableMissingStarterConfidence(row.confidence)){rejected.push({game_id:row.game_id,missing_team:row.missing_team,starter_name:name,reason:"low_or_invalid_confidence",confidence:row.confidence||null});continue}accepted.push({game_id:String(row.game_id),team_id:String(row.missing_team).toUpperCase(),starter_name:name,throws:normalizePitcherThrowCode(row.throws),source:"gemini_live_missing_starter_fallback",data_source:"gemini_live_missing_starter_fallback",confidence:String(row.confidence||"projected").toLowerCase()})}await ensureStarterCompatibilityColumns(env).catch(()=>null);const protectedFilter=await sanitizeStarterRowsForProtectedUpsert(env,accepted);const stmt=env.DB.prepare(`INSERT OR REPLACE INTO starters_current (game_id,team_id,starter_name,throws,era,whip,strikeouts,innings_pitched,walks,hits_allowed,hr_allowed,days_rest,source,data_source,confidence,updated_at) VALUES (?,?,?,?,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,?,?,?,CURRENT_TIMESTAMP)`);let inserted=0;for(const r of protectedFilter.rows){const result=await stmt.bind(r.game_id,r.team_id,r.starter_name,r.throws,r.source,r.data_source||r.source,r.confidence).run();inserted+=Number(result?.meta?.changes||0)}const remainingTargets=await missingStarterTargets(env,slateDate);return{ok:true,job:"scrape_starters_missing",version:SYSTEM_VERSION,status:remainingTargets.length?"partial_missing_tbd_remain":"pass",slate_date:slateDate,mode:"targeted_live_missing_starter_fallback",source:"gemini_live_missing_starter_fallback",requested_targets:targets,missing_games_checked:targets.length,starters_found:accepted.length,starters_inserted:inserted,inserted:{starters_current:inserted},accepted_starters:accepted.map(r=>({game_id:r.game_id,team_id:r.team_id,starter_name:r.starter_name,throws:r.throws,confidence:r.confidence})),rejected_or_tbd:[...rejected,...(protectedFilter?.skipped||[])],still_missing_tbd:remainingTargets,raw_summary:parsed.summary||null,note:"Targeted missing-starter fallback only. Fills probable/projected/confirmed one-sided starters with nullable stats and preserves true TBD as still_missing_tbd. No broad starter rewrite."}}

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

  if (table === "starters_current") await ensureStarterCompatibilityColumns(env).catch(() => null);

  for (const row of rows) {
    if (table === "starters_current") {
      if (!row.data_source && row.source) row.data_source = row.source;
      if (!row.source && row.data_source) row.source = row.data_source;
    }
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
