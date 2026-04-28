-- AlphaDog v1.2.69 - Lockjaw Dispatcher lock support
-- Safe / idempotent. No destructive cleanup.

CREATE TABLE IF NOT EXISTS pipeline_locks (
  lock_id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'IDLE',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  locked_by TEXT,
  note TEXT
);

-- The Worker uses slate-scoped lock IDs at runtime:
-- FULL_PIPELINE|YYYY-MM-DD
-- BOARD_QUEUE_AUTO_MINE|YYYY-MM-DD
-- Do not hard-delete old lock rows; stale recovery handles old RUNNING rows safely.
