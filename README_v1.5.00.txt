AlphaDog v1.5.00 - Single Lane Independent Orchestrator

Purpose:
- Replaces cascade-style dependency behavior with database-owned single-lane stage control.
- Cron only reads database state/flags and runs one independent stage per tick.
- Each stage owns its own requested/running/completed/failed/blocked state.
- Required base failures block dependent downstream jobs instead of soft-passing.
- All stage activity writes rich logs to data_orchestrator_logs and mirrors legacy visibility through data_refresh_queue.

Core tables added:
- data_orchestrator_state
- data_orchestrator_jobs
- data_orchestrator_logs

Stage order:
00 Static Weekly
01 Incremental Daily Delta
02 Everyday Phase 1
03 Weather/Roof
04 Lineup/Scratch
05 PrizePicks Board
06 PrizePicks Context
07 Odds API Morning
08 Odds API Intraday
09 Scoring Board

Required/blocking rules:
- Everyday Phase 1 failure blocks downstream volatile phases and scoring.
- PrizePicks Board failure blocks PrizePicks Context and Scoring.
- PrizePicks Context failure blocks Scoring.
- Odds API failures are logged/degraded but do not block the board/scoring path.

Deployment:
1. Deploy worker.js to alphadog-phase3-starter-groups.
2. Deploy control_room.html.
3. Keep wrangler.jsonc target as alphadog-phase3-starter-groups.
4. Keep GitHub board scraper files main.py and scrape.yml in the PrizePicks repo path.

Test sequence:
1. Open Control Room.
2. Run DEBUG > Health.
3. Confirm v1.5.00 - Single Lane Independent Orchestrator.
4. Run DATA REFRESHING > Production Clock Status or Orchestrator Status to create/seed tables.
5. Run DATA REFRESHING > PrizePicks Board Only.
6. Wait for minute cron.
7. Run Orchestrator Status and confirm data_orchestrator_jobs shows only PrizePicks Board requested/running/completed/failed.
8. Confirm no concurrent running jobs.
9. Run DATA REFRESHING > Schedule Cascade only after board-only validation.

Validation SQL:
SELECT * FROM data_orchestrator_state;
SELECT job_key, job_index, run_requested_flag, running_flag, blocked_flag, blocked_by_job_key, last_status, last_fail, last_error_code, last_started_at, last_finished_at FROM data_orchestrator_jobs ORDER BY job_index;
SELECT created_at, job_key, event_type, status, fail, error_code, message FROM data_orchestrator_logs ORDER BY created_at DESC LIMIT 30;
SELECT request_id, chain_id, job_key, status, error, started_at, finished_at, updated_at FROM data_refresh_queue WHERE status IN ('pending','running') ORDER BY updated_at DESC LIMIT 20;
