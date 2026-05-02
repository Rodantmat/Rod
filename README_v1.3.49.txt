AlphaDog / OXYGEN-COBALT
v1.3.49 - Stale Board Purge

Purpose
- Fixes stale score_candidate_board release rows surviving from prior slates.
- score_candidate_board is now treated as a current release/read model, not historical storage.
- Every candidate-board rebuild fully replaces the board before inserting the active slate rows.
- Inspect Candidate Board and Export Candidate Board remain slate-filtered and now include a stale_guard.
- If old slate rows exist, Inspect/Export return data_ok:false until Run Full Score Refresh rebuilds/purges the board.

Changed files
- worker.js
- control_room.html
- README_v1.3.49.txt

Unchanged / protected
- wrangler.jsonc
- package.json
- Scoring math unchanged
- Pickability Gate unchanged
- Odds API idempotent promotion unchanged
- Gemini unchanged
- Static, incremental, Phase 1, Phase 2A, Phase 2B, Phase 2C, Phase 3A/3B logic unchanged

Version safeguards
- ZIP filename: alphadog_v1.3.49_stale_board_purge.zip
- worker.js SYSTEM_VERSION: v1.3.49 - Stale Board Purge
- control_room.html version tag: v1.3.49 - Stale Board Purge
- README: v1.3.49 - Stale Board Purge
