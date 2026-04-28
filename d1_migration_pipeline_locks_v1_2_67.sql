-- AlphaDog v1.2.67 - State Machine Spine
-- Idempotent D1 safety migration for lock/state-machine pipeline.
CREATE TABLE IF NOT EXISTS pipeline_locks (
  lock_id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'IDLE',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  locked_by TEXT,
  note TEXT
);

-- Existing D1 may already have some/all of these columns. Run only the missing ALTERs manually if needed.
-- ALTER TABLE board_factor_queue ADD COLUMN retry_count INTEGER DEFAULT 0;
-- ALTER TABLE board_factor_queue ADD COLUMN last_processed_at TEXT;
-- ALTER TABLE board_factor_queue ADD COLUMN last_error TEXT;
-- ALTER TABLE board_factor_queue ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_board_factor_queue_state_pick
ON board_factor_queue (slate_date, status, attempt_count, updated_at);
