AlphaDog v1.2.36 - Historical Failure Filter

Purpose:
- Daily Health now filters historical resolved failures away from active health status.
- Uses the real task_runs schema only: task_id, job_name, status, started_at, finished_at, input_json, output_json, error.
- Preview text is derived only with SUBSTR(COALESCE(error, output_json, ''), 1, 240) AS preview.

Surgical changes only:
1. current_active_failure_rows now includes failed/stale rows only when there is no newer success for the same job.
2. historical_resolved_failure_rows now holds old failed/stale rows that have a newer success for the same job.
3. failed_recent_rows is preserved as a backward-compatible alias for current_active_failure_rows.
4. Daily Health summary now reports active_failures and historical_resolved_failures separately.
5. Registry audit, stale reaper, RFI regression, RFI/RBI/Hits candidate logic, scoring logic, and database schema are untouched.

Expected test result:
- Daily Health should stay ok=true/status=pass when old build_edge_candidates_rbi Unknown job failures have newer successful build_edge_candidates_rbi runs.
- Manual SQL against task_runs must use output_json for payload previews.
