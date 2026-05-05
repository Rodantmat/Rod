AlphaDog v1.3.99 - Sleeper RBI Promotion Bridge

Purpose:
- Fixes missing Sleeper RBI rows in scoring outputs.
- Preserves HITS thin-market calibration from v1.3.97.
- Preserves Total Bases market-confidence calibration from v1.3.98.
- Keeps long/heavy scoring routed through DATA REFRESHING > PRODUCTION CLOCK ORCHESTRATOR.

Patch behavior:
- Reads current Sleeper RBI rows directly from sleeper_rbi_rfi_board.
- Uses permissive current-row validation so parser wording changes do not drop valid rows.
- Promotes Sleeper RBI rows into mlb_rbi_scores.
- Promotes eligible Sleeper RBI rows into active_score_board.
- Lets candidate board pickability identify exact Sleeper RBI UNDER sides.
- Uses source_board = sleeper so SQL can filter Sleeper rows directly.

No intended changes:
- No HITS scoring change.
- No TOTAL_BASES scoring change.
- No PrizePicks demon/goblin under creation.
- No browser long-loop scoring; scoring remains orchestrator-owned.

Test sequence:
1. Deploy this ZIP.
2. Open Control Room and confirm version tag says v1.3.99 - Sleeper RBI Promotion Bridge.
3. Go to DATA REFRESHING.
4. Click Production Clock Status once to confirm the worker responds on v1.3.99.
5. Go to SCORING V1.
6. Click Run MLB Scores once. It should enqueue in Production Clock Orchestrator, not run a long browser request.
7. Wait for minute cron to complete the scoring_refresh job.
8. Click Check MLB Scores.
9. Use Manual SQL to run the Sleeper RBI verification query from the chat.
