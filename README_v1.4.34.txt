AlphaDog v1.4.34 - Candidate Publish Fallback Final

Purpose:
- Fixes candidate-board rebuild failure where scoring could finish but score_candidate_board stayed empty.
- Candidate Board now falls back from active_score_board to promoted score tables when active_score_board is empty.
- Safe publish now refuses empty candidate publish and reports ACTIVE/SCORE source-row problem instead of blanking the board silently.
- Scoring no longer deletes prior selected-slate active rows unless replacement active rows actually wrote.
- Keeps volatile audit clamp from v1.4.33: scoring_audit_logs is compact run-level diagnostics only; row audit stays on score rows/board rows.

Files included:
- worker.js
- control_room.html
- wrangler.jsonc
- package.json

Deploy/test:
1. Deploy this ZIP to alphadog-phase3-starter-groups.
2. Run DEBUG > Health and confirm v1.4.34 - Candidate Publish Fallback Final.
3. DATA REFRESHING > Schedule Cascade, select Scoring + Candidate Board only.
4. Wait 2-4 minute cron ticks.
5. Run the SQL checks from the assistant response.
