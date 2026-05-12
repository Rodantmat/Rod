AlphaDog/OXYGEN-COBALT v1.5.08.8 - Scoring Checkpoint Pickup Gate

Scope:
- Surgical production scheduled-backend patch only.
- Fixes scoring_refresh queue pickup / continuation ownership.
- Does not change scoring math, PrizePicks board/context, odds logic, Main UI, thresholds, or formulas.

Root cause fixed:
- Backend/manual scoring enqueue could insert a data_refresh_queue scoring_refresh row without initializing data_orchestrator_jobs.
- Minute cron reads the single-lane orchestrator job flags, so the orphan pending queue row could sit forever with tick_count=0.
- Existing scoring_runs checkpoints were durable, but the next queue-owned continuation was not guaranteed to attach through the official single-lane request path.

Patch behavior:
- enqueue_backend_scoring_refresh now calls requestSingleLaneJobs for scoring_refresh.
- data_refresh_queue and data_orchestrator_jobs are initialized together.
- Existing RUNNING scoring_runs checkpoints are preserved and should be resumed by run_mlb_scoring_v1.
- SCORING_PARTIAL_CONTINUE remains non-terminal and should requeue for the next cron tick until completion.

Expected test:
1. Deploy this build.
2. Run the scoring enqueue/control-room scoring button once.
3. Wait for minute cron to pick it up.
4. Confirm scoring_refresh queue row changes from pending to running/partial/completed.
5. Confirm scoring_runs resumes from the existing partial checkpoint and advances beyond durable_group_index 1100.
6. Confirm final durable tables and candidate board populate before scoring queue is marked completed.
