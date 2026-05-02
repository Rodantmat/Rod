AlphaDog Main UI v1.0.10 - Server Constant + Direct Deferred Scheduler Fix

Flat root files only. No folders.

Fixes in this build:
1. Restores missing server-side TEAM_NAMES constant. This directly fixes /main_alphadog_board error: TEAM_NAMES is not defined.
2. Keeps Admin screen with no PIN.
3. Changes Refresh Full Data to direct D1 deferred scheduling. It no longer depends on a fragile HTTP call from the UI worker to the control worker.
4. Creates/inserts deferred_full_run_once row directly; scheduled backend/control worker picks it up behind the curtain.
5. Tightens Admin green-check threshold to 85/100 so old manual/incremental data does not stay green at weak scores.
6. Adds a fallback game-time lookup by team/opponent so cards are less likely to show Time pending when exact player prop matching fails.

Deploy target:
- Worker: main-alphadog-ui-v100
- Config: main_alphadog_wrangler.jsonc
- Main file: main_alphadog_worker.js

Required binding:
- D1 binding named DB, same prop-engine-db.

Secrets:
- No secret is required for Refresh Full Data in this build because scheduling is direct D1.
- Existing INGEST_TOKEN/GEMINI/ODDS secrets can stay; they are not needed for this UI refresh button.

Test sequence:
1. Deploy this ZIP only to main-alphadog-ui-v100. Do not deploy it to prop-ingestion-git.
2. Open main UI root /. Expected: board loads, checkboxes appear, cards render.
3. Open /main_alphadog_health. Expected: ok=true, db_bound=true, direct_deferred_scheduler=true.
4. Open /main_alphadog_board?slate_date=2026-05-02. Expected: ok=true, rows_count > 0, no TEAM_NAMES error.
5. Click Admin. Expected: opens immediately, no PIN.
6. Click Refresh Full Data. Expected: Data Refresh Started / SCHEDULED_ONE_SHOT or ALREADY_SCHEDULED.
7. In Control Room after 1-2 minutes, check the scheduler/deferred run status.
