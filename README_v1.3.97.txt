AlphaDog v1.3.97 - Backend Scoring Orchestrator

Purpose:
Moves manual scoring execution into DATA REFRESHING > PRODUCTION CLOCK ORCHESTRATOR so the browser button no longer owns the long scoring request.

What changed:
- SCORING V1 > Run MLB Scores now enqueues scoring_refresh in data_refresh_queue instead of directly running the long scorer from the Control Room request.
- SCORING V1 > Run Full Score Refresh now uses the same backend enqueue path.
- Manual Odds API actions enqueue backend scoring instead of chaining a long inline scoring request.
- Orchestrator-internal scoring still runs the actual stored-data scorer when the minute cron processes the scoring_refresh row.
- Existing one-sided market skip guard and HITS thin-market calibration remain preserved.

Expected behavior:
- Manual scoring returns quickly with queued_in_production_clock_orchestrator.
- The backend minute cron continues the scoring_refresh queue row.
- Use DATA REFRESHING > Production Clock Status / Orchestrator Status to monitor progress.
- Do not repeatedly press Run MLB Scores while a scoring_refresh row is pending/running.

No external data is pulled by scoring itself. It uses stored Odds API / board / static / incremental / everyday data already in D1.
