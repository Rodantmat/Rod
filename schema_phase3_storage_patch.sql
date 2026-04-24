-- ALPHADOG PHASE 3 STORAGE PATCH
-- Purpose:
-- 1) make starters_current store BOTH teams per game using PRIMARY KEY (game_id, team_id)
-- 2) make bullpens_current store BOTH teams per game using PRIMARY KEY (game_id, team_id)
-- 3) preserve existing rows where possible
-- 4) keep the architecture unchanged

PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS starters_current_new (
  game_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  starter_name TEXT,
  throws TEXT,
  era REAL,
  whip REAL,
  strikeouts INTEGER,
  innings_pitched REAL,
  walks INTEGER,
  hits_allowed INTEGER,
  hr_allowed INTEGER,
  days_rest INTEGER,
  source TEXT,
  confidence TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (game_id, team_id),
  FOREIGN KEY (game_id) REFERENCES games(game_id)
);

INSERT OR REPLACE INTO starters_current_new (
  game_id, team_id, starter_name, throws, era, whip, strikeouts, innings_pitched,
  walks, hits_allowed, hr_allowed, days_rest, source, confidence, updated_at
)
SELECT
  game_id, team_id, starter_name, throws, era, whip, strikeouts, innings_pitched,
  walks, hits_allowed, hr_allowed, days_rest, source, confidence, COALESCE(updated_at, CURRENT_TIMESTAMP)
FROM starters_current
WHERE game_id IS NOT NULL AND team_id IS NOT NULL;

DROP TABLE starters_current;
ALTER TABLE starters_current_new RENAME TO starters_current;

CREATE TABLE IF NOT EXISTS bullpens_current_new (
  game_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  bullpen_era REAL,
  bullpen_whip REAL,
  last_game_ip REAL,
  last3_ip REAL,
  fatigue TEXT,
  source TEXT,
  confidence TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (game_id, team_id),
  FOREIGN KEY (game_id) REFERENCES games(game_id)
);

INSERT OR REPLACE INTO bullpens_current_new (
  game_id, team_id, bullpen_era, bullpen_whip, last_game_ip, last3_ip,
  fatigue, source, confidence, updated_at
)
SELECT
  game_id, team_id, bullpen_era, bullpen_whip, last_game_ip, last3_ip,
  fatigue, source, confidence, COALESCE(updated_at, CURRENT_TIMESTAMP)
FROM bullpens_current
WHERE game_id IS NOT NULL AND team_id IS NOT NULL;

DROP TABLE bullpens_current;
ALTER TABLE bullpens_current_new RENAME TO bullpens_current;

PRAGMA foreign_keys = ON;

PRAGMA foreign_key_check;
