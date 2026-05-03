AlphaDog Main UI v1.0.14 - Candidate Board Double-Gate Repair

Worker: main-alphadog-ui-v100
Main file: main_alphadog_worker.js
Wrangler config: main_alphadog_wrangler.jsonc

Purpose:
- Repair Main UI empty board caused by a second Main UI start-time/hydration gate.
- Main UI now trusts score_candidate_board as the backend release/read model.
- Main UI does not re-eliminate backend-released rows when local hydration cannot find a game/start-time row.

What changed:
- /main_alphadog_board still reads score_candidate_board.
- Primary board still includes only QUALIFIED, PLAYABLE, WATCHLIST.
- DEFERRED_UNPICKABLE stays hidden from primary board.
- Removed the second Main UI start-time exclusion for score_candidate_board rows.
- Added response fields second_start_gate_applied=false and backend_release_trusted=true.
- Normalizes standard/regular line types together so DB standard rows appear under the Regular UI filter.
- Admin Incremental Daily uses real task_runs columns: task_id, job_name, status, started_at, finished_at, output_json, error.
- Admin Incremental Daily job list corrected to include incremental_base_splits_g1-g6.

What did not change:
- No scheduled backend changes.
- No Control Room changes.
- No scoring math changes.
- No Gemini changes.
- No D1 writes.
- No cron/scheduler changes.
- No raw source table scoring/display migration.

Important note:
- SQL confirmed score_candidate_board has 38 current release rows for 2026-05-03.
- SQL also confirmed task_runs has no newer incremental temp refresh after 2026-04-29, so the Main UI should not fake a today date for Incremental Daily.
