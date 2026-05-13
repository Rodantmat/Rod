AlphaDog/OXYGEN-COBALT
v1.5.10.4 - Orchestrator Hard Reset Gate

Patch purpose:
- Upgrades DATA REFRESHING > Killer Cleaner into a true orchestrator/cron hard reset.
- Disables all Production Clock schedule plans during reset.
- Cancels active queue/job/run/control rows without deleting real sports data or logs.
- Releases active minute/enqueue/pipeline locks.
- Cancels legacy deferred admin refresh rows so old Main UI/admin freshness jobs cannot keep running behind the orchestrator.
- Returns a verification object; data_ok is true only when all active orchestration counts are zero and GLOBAL lock_flag is 0.

Protected data not wiped:
- score_candidate_board
- PrizePicks board/context tables
- Odds API real/promoted tables
- weather, lineup, games, markets, starters tables
- incremental live data tables
- data_refresh_events and data_orchestrator_logs

Manual test sequence:
1. Deploy this build.
2. Open Control Room.
3. Go to DATA REFRESHING.
4. Click Killer Cleaner.
5. Run Production Clock Status and confirm no enabled plans and no active queue.
6. Run Manual SQL verification if needed:
   SELECT COUNT(*) AS enabled_schedule_plans FROM data_refresh_schedule_plan WHERE enabled=1;
   SELECT COUNT(*) AS active_queue_rows FROM data_refresh_queue WHERE status IN ('pending','running','requested');
   SELECT COUNT(*) AS active_job_flags FROM data_orchestrator_jobs WHERE run_requested_flag=1 OR running_flag=1 OR blocked_flag=1;
   SELECT state_key, lock_flag, running_job_key, running_request_id, status FROM data_orchestrator_state WHERE state_key='GLOBAL';

Do not run full cascade again until the orchestrator/cron communication bug is audited and fixed.
