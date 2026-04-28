-- AlphaDog v1.2.69.1 - Endpoint Anchor lock support
CREATE TABLE IF NOT EXISTS pipeline_locks (
  lock_id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'IDLE',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  locked_by TEXT,
  note TEXT
);

INSERT OR IGNORE INTO pipeline_locks (lock_id, status, note) VALUES ('FULL_PIPELINE', 'IDLE', 'seed');
INSERT OR IGNORE INTO pipeline_locks (lock_id, status, note) VALUES ('BOARD_QUEUE_AUTO_MINE', 'IDLE', 'seed');
