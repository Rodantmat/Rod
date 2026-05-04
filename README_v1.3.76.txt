AlphaDog v1.3.76 - Cancel Retry Guard + Incremental Queue Fix

Surgical patch over v1.3.75.

Fixes:
- Control Room cancel action no longer retries successful cancel responses.
- Removed false retry caused by the word "cancelled" inside a successful cancel response.
- Keeps v1.3.75 incremental orchestrator adapter repair.
- Keeps six-hour incremental stale safety window.
- Does not touch scoring, market odds, PrizePicks, Sleeper, Gemini, or candidate board logic.

Files:
- worker.js
- control_room.html
- wrangler.jsonc
- package.json

Test sequence:
1. Deploy this ZIP.
2. Run DEBUG > Health. Confirm v1.3.76 - Cancel Retry Guard + Incremental Queue Fix.
3. Run DATA REFRESHING > Cancel Active Queue.
4. Expected: final success, no retrying blob.
5. Run DATA REFRESHING > Schedule Selected Only with only Incremental Daily Temp checked.
6. Run DATA REFRESHING > Orchestrator Status.
7. Run CHECK TEMP > All Incremental Temp.
