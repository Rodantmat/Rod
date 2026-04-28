-- AlphaDog v1.2.72 - Static Players Chunk Repair reference tables
-- These are also created idempotently by the worker static scrape jobs.

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
);

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
);

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
);

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
);

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
);

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
);
