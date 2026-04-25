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
);

CREATE INDEX IF NOT EXISTS idx_edge_hits_slate ON edge_candidates_hits(slate_date);
CREATE INDEX IF NOT EXISTS idx_edge_hits_game ON edge_candidates_hits(game_id);
CREATE INDEX IF NOT EXISTS idx_edge_hits_tier ON edge_candidates_hits(candidate_tier);
