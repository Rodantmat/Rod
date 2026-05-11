AlphaDog/OXYGEN-COBALT
v1.5.06.5 - Function Capsule Secret Gate

Purpose
- Fixes the cascade execution path so each queued function hydrates its own function capsule at execution time.
- PrizePicks Board now receives its own capsule through the same function-level execution path regardless of how it is called: individual selected run, manual cascade, production-clock cascade, or minute cron continuation.
- Expands accepted GitHub token binding aliases for the PrizePicks dispatch capsule.
- Keeps v1.5.06.4 schedule scope behavior: intraday full cascades exclude Static Weekly and Incremental Daily.
- Keeps both Odds API Morning and Odds API Intraday inside full intraday cascades for now.

Function capsule rule
- Call path cannot be the source of secrets/access.
- Each function resolves its own required environment inside the function execution path.
- PrizePicks Board resolves GitHub repo/token/workflow/ref inside its own capsule.
- Odds API jobs resolve ODDS_API_KEY inside their own capsule.
- Scoring resolves from DB/current prepared tables and does not depend on browser state.

Intraday full-run job list
- 02 Everyday Phase 1
- 03 Weather/Roof
- 04 Lineup/Scratch
- 05 PrizePicks Board
- 06 PrizePicks Context
- 07 Odds API Morning
- 08 Odds API Intraday
- 09 Scoring Board

Not included in intraday full runs
- 00 Static Weekly
- 01 Incremental Daily Delta

Deployment/test sequence
1. Deploy this ZIP.
2. Open Control Room.
3. Go to DATA REFRESHING.
4. Click Cancel Active Queue.
5. Click Init Clock.
6. Click Production Clock Status.
7. Confirm the 9 AM, 1 PM, and 10 PM plans each list exactly the 8 full-run jobs above.
8. Check 02 Everyday Phase 1 through 09 Scoring Board, leaving 00 and 01 unchecked.
9. Click Cascade From First Checked.
10. Use Orchestrator Status or Run Queue Tick to monitor.

Expected result
- Manual cascade creates 8 rows.
- It does not include Static Weekly.
- It does not include Incremental Daily Delta.
- PrizePicks Board no longer fails from a call-path missing-secret mismatch.
- If PrizePicks fails, its output now includes function_capsule/github binding diagnostics without exposing secret values.
