AlphaDog v1.5.04.8 - Dynamic Runtime Timeout Gate

Patch target
- Production scheduled backend / Data Refreshing orchestrator.
- Built from the uploaded v1.5.04.7 package.

What changed
- Adds job-specific dynamic timeout profiles based on recent successful completed data_refresh_queue rows.
- Timeout formula: average successful runtime from last 10 completed rows x 1.20.
- Requires at least 3 successful samples before using dynamic history.
- Uses safe fallback timeout floors/caps when history is insufficient.
- Adds runtime_profiles to DATA REFRESHING > Orchestrator Status so you can see timeout_seconds, avg_success_seconds, sample_count, source, floor, and cap per job.
- Replaces hard 15-minute stale global lock release with dynamic runtime timeout release.
- Replaces fixed 5/8-minute stale running row requeue logic with dynamic timeout checks.
- Keeps PrizePicks Board as the special locked waiting stage; its audit wait gate remains separate.

Expected behavior
- incremental_daily may stay running/continue across ticks while it is still inside its dynamic timeout window.
- auto_continue_scheduled is treated as healthy continuation, not as a terminal failure.
- A job is only requeued/cancelled for timeout after it exceeds its job-specific runtime profile and has no recent progress grace.

Files
- worker.js
- control_room.html
- main.py
- scrape.yml
- wrangler.jsonc
- package.json
