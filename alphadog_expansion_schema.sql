CREATE TABLE IF NOT EXISTS xp_schema_migrations (
  version TEXT PRIMARY KEY,
  description TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS xp_prop_definitions (
  stat_type TEXT PRIMARY KEY,
  prop_family TEXT NOT NULL,
  expansion_phase INTEGER NOT NULL,
  target_status TEXT NOT NULL,
  complexity_tier TEXT NOT NULL,
  source_scope TEXT NOT NULL DEFAULT 'PRIZEPICKS_ONLY',
  scoring_status TEXT NOT NULL DEFAULT 'NOT_BUILT',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS xp_prop_lines_current (
  xp_line_key TEXT PRIMARY KEY,
  source_table TEXT NOT NULL,
  source_projection_key TEXT,
  line_id TEXT,
  player_name TEXT,
  normalized_player_name TEXT,
  team TEXT,
  opponent TEXT,
  stat_type TEXT NOT NULL,
  prop_family TEXT NOT NULL,
  line_score REAL,
  odds_type TEXT,
  start_time TEXT,
  slate_date TEXT,
  board_updated_at TEXT,
  captured_at TEXT,
  source_status TEXT,
  is_supported_single INTEGER DEFAULT 1,
  is_current INTEGER DEFAULT 1,
  is_stale INTEGER DEFAULT 0,
  target_status TEXT,
  expansion_phase INTEGER,
  imported_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  raw_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_xp_lines_stat_start ON xp_prop_lines_current(stat_type, start_time);
CREATE INDEX IF NOT EXISTS idx_xp_lines_slate_stat ON xp_prop_lines_current(slate_date, stat_type);
CREATE INDEX IF NOT EXISTS idx_xp_lines_target ON xp_prop_lines_current(target_status, expansion_phase);
CREATE INDEX IF NOT EXISTS idx_xp_lines_player ON xp_prop_lines_current(normalized_player_name, stat_type);

CREATE TABLE IF NOT EXISTS xp_team_alias_map (
  alias_team TEXT PRIMARY KEY,
  canonical_team TEXT NOT NULL,
  notes TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_xp_team_alias_canonical ON xp_team_alias_map(canonical_team);
CREATE TABLE IF NOT EXISTS xp_game_bridge_current (
  xp_line_key TEXT PRIMARY KEY,
  stat_type TEXT,
  player_name TEXT,
  original_team TEXT,
  original_opponent TEXT,
  normalized_team TEXT,
  normalized_opponent TEXT,
  slate_date TEXT,
  pp_start_time TEXT,
  pp_start_time_utc TEXT,
  game_id TEXT,
  away_team TEXT,
  home_team TEXT,
  game_start_time_utc TEXT,
  time_diff_minutes REAL,
  match_status TEXT NOT NULL,
  match_method TEXT,
  candidate_count INTEGER DEFAULT 0,
  clean_match_count INTEGER DEFAULT 0,
  warning TEXT,
  built_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_xp_bridge_status ON xp_game_bridge_current(match_status, stat_type);
CREATE INDEX IF NOT EXISTS idx_xp_bridge_game ON xp_game_bridge_current(game_id);
CREATE INDEX IF NOT EXISTS idx_xp_bridge_pair ON xp_game_bridge_current(normalized_team, normalized_opponent, slate_date);

CREATE TABLE IF NOT EXISTS xp_phase1_player_metrics_current (
  xp_line_key TEXT PRIMARY KEY,
  stat_type TEXT,
  player_name TEXT,
  normalized_player_name TEXT,
  team TEXT,
  normalized_team TEXT,
  opponent TEXT,
  normalized_opponent TEXT,
  line_score REAL,
  odds_type TEXT,
  line_type_warning TEXT,
  player_id INTEGER,
  metric_player_name TEXT,
  metric_team_id TEXT,
  metric_normalized_team TEXT,
  season INTEGER,
  games_logged INTEGER,
  first_game_date TEXT,
  last_game_date TEXT,
  total_pa INTEGER,
  total_ab INTEGER,
  total_walks INTEGER,
  total_strikeouts INTEGER,
  last3_games INTEGER,
  last5_games INTEGER,
  last10_games INTEGER,
  last20_games INTEGER,
  season_k_rate REAL,
  season_bb_rate REAL,
  metric_match_status TEXT NOT NULL,
  metric_warning TEXT,
  source_confidence TEXT,
  source_updated_at TEXT,
  built_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_xp_p1_metrics_status ON xp_phase1_player_metrics_current(metric_match_status, stat_type);
CREATE INDEX IF NOT EXISTS idx_xp_p1_metrics_player ON xp_phase1_player_metrics_current(normalized_player_name, normalized_team);

CREATE TABLE IF NOT EXISTS xp_phase1_game_context_current (
  xp_line_key TEXT PRIMARY KEY,
  stat_type TEXT,
  player_name TEXT,
  normalized_player_name TEXT,
  team TEXT,
  opponent TEXT,
  normalized_team TEXT,
  normalized_opponent TEXT,
  line_score REAL,
  odds_type TEXT,
  line_type_warning TEXT,
  start_time TEXT,
  slate_date TEXT,
  game_id TEXT,
  away_team TEXT,
  home_team TEXT,
  venue TEXT,
  game_status TEXT,
  game_start_time_utc TEXT,
  bridge_match_status TEXT,
  bridge_match_method TEXT,
  time_diff_minutes REAL,
  lineup_slot INTEGER,
  lineup_bats TEXT,
  lineup_k_rate REAL,
  lineup_is_confirmed INTEGER,
  lineup_source TEXT,
  lineup_confidence TEXT,
  lineup_match_status TEXT,
  starter_name TEXT,
  starter_throws TEXT,
  starter_era REAL,
  starter_whip REAL,
  starter_strikeouts INTEGER,
  starter_walks INTEGER,
  starter_innings_pitched REAL,
  starter_days_rest INTEGER,
  starter_source TEXT,
  starter_confidence TEXT,
  starter_match_status TEXT,
  player_id INTEGER,
  metric_team_id TEXT,
  total_pa INTEGER,
  total_walks INTEGER,
  total_strikeouts INTEGER,
  season_k_rate REAL,
  season_bb_rate REAL,
  metric_match_status TEXT,
  context_status TEXT NOT NULL,
  warning_flags TEXT,
  built_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_xp_p1_context_status ON xp_phase1_game_context_current(context_status, stat_type);
CREATE INDEX IF NOT EXISTS idx_xp_p1_context_game ON xp_phase1_game_context_current(game_id, normalized_team);
CREATE INDEX IF NOT EXISTS idx_xp_p1_context_flags ON xp_phase1_game_context_current(lineup_match_status, starter_match_status, metric_match_status);

INSERT OR REPLACE INTO xp_team_alias_map(alias_team, canonical_team, notes, updated_at) VALUES
('ATH','OAK','PrizePicks Athletics alias to games table Oakland alias',CURRENT_TIMESTAMP),
('OAK','OAK','Identity alias',CURRENT_TIMESTAMP),
('AZ','ARI','PrizePicks Arizona alias to games table ARI alias',CURRENT_TIMESTAMP),
('ARI','ARI','Identity alias',CURRENT_TIMESTAMP),
('WSH','WSN','PrizePicks Washington alias to games table WSN alias',CURRENT_TIMESTAMP),
('WSN','WSN','Identity alias',CURRENT_TIMESTAMP),
('SFG','SF','Common Giants alias',CURRENT_TIMESTAMP),
('SF','SF','Identity alias',CURRENT_TIMESTAMP),
('CHW','CWS','Common White Sox alias',CURRENT_TIMESTAMP),
('CWS','CWS','Identity alias',CURRENT_TIMESTAMP),
('SDP','SD','Common Padres alias',CURRENT_TIMESTAMP),
('SD','SD','Identity alias',CURRENT_TIMESTAMP),
('TBR','TB','Common Rays alias',CURRENT_TIMESTAMP),
('TB','TB','Identity alias',CURRENT_TIMESTAMP),
('KCR','KC','Common Royals alias',CURRENT_TIMESTAMP),
('KC','KC','Identity alias',CURRENT_TIMESTAMP),
('LAD','LAD','Identity alias',CURRENT_TIMESTAMP),
('LAA','LAA','Identity alias',CURRENT_TIMESTAMP),
('NYY','NYY','Identity alias',CURRENT_TIMESTAMP),
('NYM','NYM','Identity alias',CURRENT_TIMESTAMP),
('BOS','BOS','Identity alias',CURRENT_TIMESTAMP),
('BAL','BAL','Identity alias',CURRENT_TIMESTAMP),
('TOR','TOR','Identity alias',CURRENT_TIMESTAMP),
('MIA','MIA','Identity alias',CURRENT_TIMESTAMP),
('PHI','PHI','Identity alias',CURRENT_TIMESTAMP),
('PIT','PIT','Identity alias',CURRENT_TIMESTAMP),
('STL','STL','Identity alias',CURRENT_TIMESTAMP),
('CHC','CHC','Identity alias',CURRENT_TIMESTAMP),
('CIN','CIN','Identity alias',CURRENT_TIMESTAMP),
('CLE','CLE','Identity alias',CURRENT_TIMESTAMP),
('DET','DET','Identity alias',CURRENT_TIMESTAMP),
('MIN','MIN','Identity alias',CURRENT_TIMESTAMP),
('TEX','TEX','Identity alias',CURRENT_TIMESTAMP),
('HOU','HOU','Identity alias',CURRENT_TIMESTAMP),
('SEA','SEA','Identity alias',CURRENT_TIMESTAMP),
('MIL','MIL','Identity alias',CURRENT_TIMESTAMP),
('COL','COL','Identity alias',CURRENT_TIMESTAMP),
('ATL','ATL','Identity alias',CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS xp_prop_counts_snapshot (
  snapshot_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  stat_type TEXT NOT NULL,
  odds_type TEXT,
  target_status TEXT,
  expansion_phase INTEGER,
  rows_count INTEGER DEFAULT 0,
  min_line REAL,
  max_line REAL,
  first_start_time TEXT,
  last_start_time TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_xp_counts_run ON xp_prop_counts_snapshot(run_id, stat_type);
CREATE TABLE IF NOT EXISTS xp_job_runs (
  run_id TEXT PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL,
  source_table TEXT,
  rows_read INTEGER DEFAULT 0,
  rows_written INTEGER DEFAULT 0,
  rows_deleted INTEGER DEFAULT 0,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  error TEXT,
  details_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_xp_job_runs_created ON xp_job_runs(started_at DESC);
CREATE TABLE IF NOT EXISTS xp_job_logs (
  log_id TEXT PRIMARY KEY,
  run_id TEXT,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  details_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_xp_logs_run ON xp_job_logs(run_id, created_at DESC);
INSERT OR REPLACE INTO xp_schema_migrations(version, description, applied_at)
VALUES ('v0.1.13', 'Phase 1 context snapshot - isolated xp player metrics and game context read-model', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO xp_prop_definitions(stat_type, prop_family, expansion_phase, target_status, complexity_tier, source_scope, scoring_status, notes, updated_at) VALUES
('Hitter Strikeouts', 'HITTER_STRIKEOUTS', 1, 'READY_PHASE_1', 'LOW', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'First expansion scoring target. Simple count prop with strong board volume.', CURRENT_TIMESTAMP),
('Walks', 'WALKS', 1, 'READY_PHASE_1', 'LOW', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'Second expansion scoring target. Simple count prop.', CURRENT_TIMESTAMP),
('Singles', 'SINGLES', 2, 'READY_PHASE_2', 'MEDIUM', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'Component prop for total bases and fantasy score.', CURRENT_TIMESTAMP),
('Doubles', 'DOUBLES', 2, 'READY_PHASE_2', 'MEDIUM', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'Component prop for total bases and fantasy score.', CURRENT_TIMESTAMP),
('Home Runs', 'HOME_RUNS', 2, 'READY_PHASE_2', 'MEDIUM_HIGH', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'Component prop - weather/park context later.', CURRENT_TIMESTAMP),
('Runs', 'RUNS', 3, 'READY_PHASE_3', 'MEDIUM', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'Needed before HRR and fantasy score.', CURRENT_TIMESTAMP),
('Hits+Runs+RBIs', 'HRR', 4, 'READY_PHASE_4', 'MEDIUM_HIGH', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'Composite after hits, runs, and RBI context exists.', CURRENT_TIMESTAMP),
('Hitter Fantasy Score', 'HITTER_FANTASY_SCORE', 5, 'READY_LATER', 'HIGH', 'PRIZEPICKS_ONLY', 'NOT_BUILT', 'Keep, but build after components are proven.', CURRENT_TIMESTAMP),
('Triples', 'TRIPLES', 9, 'PARKED', 'HIGH_VARIANCE', 'PRIZEPICKS_ONLY', 'PARKED', 'Sparse and high variance. Do not build first.', CURRENT_TIMESTAMP),
('Stolen Bases', 'STOLEN_BASES', 9, 'PARKED', 'HIGH_VARIANCE', 'PRIZEPICKS_ONLY', 'PARKED', 'Requires runner/catcher/pitcher context. Park for now.', CURRENT_TIMESTAMP),
('Hits', 'HITS', 0, 'REFERENCE_EXISTING', 'EXISTING', 'PRIZEPICKS_ONLY', 'EXISTING_SYSTEM', 'Existing current-system prop. Copied for visibility only.', CURRENT_TIMESTAMP),
('Total Bases', 'TOTAL_BASES', 0, 'REFERENCE_EXISTING', 'EXISTING', 'PRIZEPICKS_ONLY', 'EXISTING_SYSTEM', 'Existing current-system prop. Copied for visibility only.', CURRENT_TIMESTAMP),
('RBIs', 'RBI', 0, 'REFERENCE_EXISTING', 'EXISTING', 'PRIZEPICKS_ONLY', 'EXISTING_SYSTEM', 'Existing current-system/related prop. Copied for visibility only.', CURRENT_TIMESTAMP);
