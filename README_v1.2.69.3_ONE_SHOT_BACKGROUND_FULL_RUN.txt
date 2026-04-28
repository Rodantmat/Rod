AlphaDog v1.2.69.3 - One-Shot Background Full Run

Temporary testing build.

Purpose:
- FULL RUN button no longer keeps Safari open while the run executes.
- FULL RUN button schedules one backend Full Run to be picked up by the temporary one-minute cron poller.
- The one-minute poller does nothing unless a deferred_full_run_once row is pending.
- Remove the temporary one-minute cron/route in the next build after validation.

Preserved from previous stable build:
- Endpoint anchor to prop-ingestion-git public URL.
- Internal worker label alphadog-phase3-starter-groups.
- SQL auth restore.
- Lock hardening.
- Full Run dispatcher-only behavior.
- Auto Miner family rotation and canonical result writes.

Test order:
1. DEBUG > Health.
2. Click FULL RUN once. Expected: scheduled one-shot message, not a long browser run.
3. Wait 2-15 minutes.
4. Check Scheduler Log / Tasks / pipeline_locks / task_runs.
