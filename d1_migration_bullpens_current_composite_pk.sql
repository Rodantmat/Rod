PRAGMA foreign_keys=off;

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
  PRIMARY KEY (game_id, team_id)
);

INSERT OR IGNORE INTO bullpens_current_new (
  game_id,
  team_id,
  bullpen_era,
  bullpen_whip,
  last_game_ip,
  last3_ip,
  fatigue,
  source,
  confidence
)
SELECT
  game_id,
  team_id,
  bullpen_era,
  bullpen_whip,
  last_game_ip,
  last3_ip,
  fatigue,
  source,
  confidence
FROM bullpens_current
WHERE game_id IS NOT NULL
  AND team_id IS NOT NULL;

DROP TABLE bullpens_current;

ALTER TABLE bullpens_current_new RENAME TO bullpens_current;

PRAGMA foreign_keys=on;
