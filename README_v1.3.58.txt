AlphaDog Control Room Build
v1.3.58 - PrizePicks GitHub Dispatch Bridge

Files included:
- worker.js
- control_room.html
- wrangler.jsonc
- package.json
- README_v1.3.58.txt

Surgical fixes in this build:
1. Minute cron now advances Admin/Main UI full-refresh deferred rows before Phase 3A/3B ticks, so Phase 3 cannot starve user-triggered freshness refreshes.
2. deferred_full_run_once polling now only consumes job_name = run_full_pipeline; Phase 3 rows stay on the Phase 3 runner.
3. run_full_pipeline deferred rows now execute a bounded backend freshness dispatcher instead of the old one-shot v1.2.69 lightweight dispatcher.
4. Admin freshness sequence excludes static data and runs bounded steps behind the curtain: incremental daily, everyday Phase 1, Phase 2 weather, Phase 2 lineup, Odds morning, Odds afternoon, and scoring refresh.
5. If a step needs more time, the same deferred request is re-queued for the next minute cron. No browser/Safari dependency.
6. PrizePicks GitHub scrape is not triggered by this worker because no GitHub Actions trigger secret/config exists in the current control-room files. Existing scrape.yml schedule/manual workflow remains the PrizePicks board updater.

Deployment target:
- Control room / scheduled backend worker only.
- Do not deploy this ZIP to the Main UI worker.

Test sequence after deploy:
1. Open Control Room.
2. Run group: DEBUG / HEALTH. Button: Health. Confirm version = v1.3.58 - PrizePicks GitHub Dispatch Bridge.
3. From Main UI Admin, click Refresh Full Data once.
4. Wait 2 minutes.
5. In Control Room, run MANUAL SQL with:
   SELECT request_id, job_name, slate_date, status, requested_at, run_after, started_at, finished_at, requested_by, error, substr(output_json,1,900) AS output_preview FROM deferred_full_run_once ORDER BY requested_at DESC LIMIT 10;
6. Confirm the main_ui_deferred_full_run row is moving through admin_refresh_state instead of staying untouched PENDING.
7. Run MANUAL SQL with:
   SELECT job_name, status, started_at, finished_at, error, substr(output_json,1,900) AS output_preview FROM task_runs WHERE job_name='admin_freshness_dispatcher_step' ORDER BY started_at DESC LIMIT 20;
8. Confirm steps are being recorded.
9. When completed, check freshness cards again.


V1.3.58 SURGICAL CHANGE
- Adds PrizePicks GitHub Actions dispatch into the Admin/Main UI full refresh pipeline.
- Full refresh sequence now waits for mlb_stats to update after GitHub workflow_dispatch before rebuilding Phase 2C PrizePicks context and running scoring.
- Uses Control Room worker secrets: GITHUB_REPO, GITHUB_TOKEN, GITHUB_WORKFLOW_FILE. Optional: GITHUB_REF or GITHUB_BRANCH, default main.
- Static refresh remains excluded by design. Sleeper remains manual by design.
