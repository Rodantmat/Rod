CREATE TABLE IF NOT EXISTS system_event_log (
  event_id TEXT PRIMARY KEY,
  event_time TEXT DEFAULT CURRENT_TIMESTAMP,
  version TEXT,
  trigger_source TEXT,
  action_label TEXT,
  job_name TEXT,
  slate_date TEXT,
  slate_mode TEXT,
  status TEXT,
  http_status INTEGER,
  task_id TEXT,
  input_json TEXT,
  output_preview TEXT,
  error TEXT
);
CREATE INDEX IF NOT EXISTS idx_system_event_log_time ON system_event_log(event_time);
CREATE INDEX IF NOT EXISTS idx_system_event_log_job ON system_event_log(job_name, event_time);
CREATE INDEX IF NOT EXISTS idx_system_event_log_slate ON system_event_log(slate_date, event_time);
