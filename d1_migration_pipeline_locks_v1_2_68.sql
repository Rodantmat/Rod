-- AlphaDog v1.2.68 - Atomic Dispatcher lock support
CREATE TABLE IF NOT EXISTS pipeline_locks (
  lock_id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'IDLE',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  locked_by TEXT,
  note TEXT
);

INSERT OR IGNORE INTO pipeline_locks (lock_id, status, updated_at, locked_by, note)
VALUES ('FULL_PIPELINE', 'IDLE', CURRENT_TIMESTAMP, NULL, 'v1.2.68 global full pipeline lock');

-- Optional cleanup for previously stuck full pipeline task rows.
UPDATE task_runs
SET status='stale_reset', finished_at=CURRENT_TIMESTAMP, error='manual v1.2.68 stale running cleanup'
WHERE status='running'
  AND started_at < datetime('now','-15 minutes')
  AND job_name IN ('run_full_pipeline','scheduled_full_pipeline_plus_board_queue');
