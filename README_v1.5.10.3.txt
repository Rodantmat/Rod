AlphaDog/OXYGEN-COBALT
v1.5.10.3 - Cron Queue-First Bridge Gate

Root-cause patch:
The minute cron was firing, and selected/orchestrator queue rows were being created, but existing queued/requested work could remain pending because the scheduled handler ran schedule-scan/watchdog/one-shot phases before the actual orchestrator tick. If those front-loaded phases consumed the scheduled lifecycle or timed out, the queue bridge never advanced the pending selected job.

Fix:
- Adds a hot-lane detector for data_orchestrator_jobs/data_refresh_queue.
- On every * * * * * cron tick, if queued/requested work exists, the cron advances runRefreshOrchestratorTick first.
- Schedule scan/watchdog/one-shot rescue are skipped for that tick when the hot lane is already present.
- Keeps production clock schedule scans active when no queued work exists, so 9AM/1PM/10PM scheduled full cascades still enqueue normally.
- Adds correct idle-status recognition for single_lane_idle_no_requested_job.

Do not change scoring math, candidate-board logic, PrizePicks scraping, odds logic, or UI layout.
