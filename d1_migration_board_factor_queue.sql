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
  last_error TEXT,
  payload_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_board_factor_queue_slate_type_status ON board_factor_queue (slate_date, queue_type, status);
CREATE INDEX IF NOT EXISTS idx_board_factor_queue_scope ON board_factor_queue (scope_type, scope_key);
