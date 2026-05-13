AlphaDog/OXYGEN-COBALT v1.5.09.6 - Scoring Stable Run Clean Gate

Purpose
- Fix scoring_refresh so one queue request owns one stable scoring run_id across partial cron ticks.
- Stop stale scoring cleanup from killing an active queue-owned scoring run just because the total run is older than one short runtime window.
- Treat transient D1 failures such as "Network connection lost" as retryable queue continuations instead of permanent scoring failures.
- Add a reusable Clean Run State function and Control Room button.
- Run Clean Run State before full cascade enqueues: scheduled production plans, one-shot full run, and manual cascade.

Main changes
1. Stable queue-owned scoring run_id
- queue-owned scoring now uses a deterministic run_id derived from the data_refresh_queue request_id.
- partial_continue ticks resume the same run_id.
- scoring_runs.details_json records queue_request_id, queue_chain_id, and queue_run_id.

2. D1 transient retry guard
- D1 transient errors are returned as SCORING_D1_TRANSIENT_RETRY_NEXT_TICK for queue-owned scoring.
- The scoring run remains RUNNING and is resumed by the next minute cron tick.
- env.DB.batch scoring writes retry up to 3 times for transient D1 failures.

3. Clean Run State
- New job: refresh_orchestrator_clean_run_state.
- New Control Room button: DATA REFRESHING > Clean Run State.
- Cleans stale queue/orchestrator state, terminal/missing enqueue locks, zombie job flags, stale global lock, and abandoned non-terminal scoring run artifacts.
- Preserves completed scoring runs and existing stable release data unless the rows belong to a bad/non-terminal run.

4. Pre-full-run clean gate
- scheduled full cascades run Clean Run State before enqueue.
- one-shot full run runs Clean Run State before enqueue.
- manual cascade runs Clean Run State before enqueue.

5. One-shot full run button
- New job: schedule_one_shot_full_run_plus_2min.
- New Control Room button: DATA REFRESHING > Schedule One-Shot Full Run +2 Min.
- Schedules a temporary full cascade about two minutes ahead.
- One-shot plan auto-clears only after accepted enqueue.

Test sequence
1. Deploy this ZIP.
2. Open Control Room.
3. Go to DATA REFRESHING • PRODUCTION CLOCK ORCHESTRATOR.
4. Click Init Tables.
5. Click Init Clock.
6. Click Clean Run State.
7. Click Production Clock Status and confirm active_queue is empty before one-shot test.
8. Click Schedule One-Shot Full Run +2 Min.
9. Wait for cron to enqueue it.
10. Click Production Clock Status every few minutes.
11. When scoring_refresh is active, verify scoring_runs keeps one run_id for the same queue request across partial ticks.
12. After scoring completes, verify score_candidate_board has fresh rows for the latest scoring run.
13. Verify no abandoned active_score_board run_id pileup remains from failed partial runs.

Important
- This build does not change scoring math calibration.
- This build does not remove jobs from the full cascade.
- This build does not touch Main UI.
- ODDS_API_KEY missing remains recoverable/non-blocking for downstream scoring, as before.
