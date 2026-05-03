AlphaDog Scheduled Backend Build
v1.3.62 - Scoring Output Safety Guard

Files included:
- worker.js
- control_room.html
- package.json
- wrangler.jsonc
- README_v1.3.62.txt

What changed:
- Fixed RBI scoring direction handling so demon/tail RBI lines do not manufacture UNDER rows.
- Added stored-data RBI board fallback scoring from PrizePicks current board and Sleeper RBI board when Odds API RBI coverage is thin.
- PrizePicks RBI demon/goblin/promo rows are scored as OVER only.
- PrizePicks RBI standard rows may score OVER and UNDER because both sides can be selectable.
- Sleeper RBI rows are scored as UNDER 0.5 using stored RBI/history/game context, capped at 85.
- RBI fallback scoring uses edge_candidates_rbi, lineup context, park context, and game totals when available; Odds API is supplemental for RBI.
- Same-slate mlb_*_scores tables are cleared before each scoring run to stop duplicate source-line waves across refreshes.
- Phase 3 stale task cleanup now marks orphan run_phase3ab_full_run_tick tasks stale even if the global lock is already IDLE.
- Deferred Phase 3 partial-continue rows no longer remain PENDING with finished_at set.

Deployment:
Upload these flat files to the scheduled backend/control-room repo only. Do not deploy to the main UI worker.

Post-deploy test sequence:
1. Deploy this scheduled backend build.
2. Open Control Room.
3. Confirm the visible version tag says v1.3.62 - Scoring Output Safety Guard.
4. Run ADMIN / MAIN UI FRESHNESS > Run Full Refresh Now, or run SCORING V1 > Run MLB Scores followed by SCORING V1 > Build Score Candidate Board.
5. Run Manual SQL checks from the chat to confirm:
   - no mlb_rbi_scores demon/goblin UNDER rows for current slate
   - active_score_board RBI count is no longer limited to only thin Odds API rows
   - sleeper current RBI rows can match candidate pickability
   - no old duplicate score waves remain after a fresh scoring run
