AlphaDog/OXYGEN-COBALT Production Scheduled Backend
v1.5.09.3 - Candidate Board Fresh Publish Gate

Purpose
- Fixes the last confirmed issue after v1.5.09.2: scoring completed and active_score_board refreshed, but score_candidate_board could remain stale from an older same-slate run.
- Root cause: build_mlb_score_candidate_board_v1 preserved selected-slate rows and used UPSERT conflict logic that kept older higher-score candidate rows instead of replacing the board with the latest completed scoring run.
- Patch behavior: when fresh candidate rows are ready, delete selected-slate score_candidate_board rows and republish from the latest active_score_board source rows. If no source rows exist, preserve the selected-slate board to avoid a blank release board.

Scope
- Patched worker.js only in candidate-board publish path and version labels.
- Updated control_room.html visible/internal version labels.
- No scoring math changes.
- No Odds API changes.
- No PrizePicks scraper changes.
- No Phase 1 / Weather / Lineup changes.
- No static or incremental refresh changes.
- No Gemini changes.
- No Main UI changes.

Expected result
- After the 1 PM automatic scheduled cascade, scoring_refresh should complete.
- active_score_board should refresh with the latest run_id.
- score_candidate_board should also contain rows from the latest run_id, not the older 08:10 run.
- stale same-slate candidate rows from older run_ids should be zero after a successful candidate rebuild.

Deploy
- Upload/deploy this flat ZIP as the scheduled backend/control-room worker package.
- Do not run manual queue tick unless debugging requires it; the minute cron should pick up the scheduled run automatically.
