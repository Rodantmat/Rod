AlphaDog v1.3.84 - Incremental True Delta Certification

Files included:
- worker.js
- control_room.html
- wrangler.jsonc
- package.json

Purpose:
- Keeps v1.3.83 pristine live certification guard.
- Adds true daily delta mode for incremental refresh when live incremental base is already certified.
- Delta mode stages only recent finalized MLB games from schedule/boxscore with overlap protection.
- Fallback full-safe rebuild remains available automatically if live base is not certified enough.
- Adds visible Control Room button: Certify Live Incremental.

Expected daily path after certified base:
- stage_delta_logs -> audit -> promote -> clean -> derived -> completed

Fallback path if base is not certified:
- stage_logs -> stage_splits -> audit -> promote -> clean -> derived -> completed

Test sequence:
1. Deploy.
2. Run DEBUG > Health. Confirm v1.3.84.
3. Run Daily Incremental Temp > Certify Live Incremental. Expect A/A+.
4. Run Daily Incremental Temp > Schedule + Auto Start.
5. Inspect output: refresh_mode should be delta if the live base is certified.
6. Run Check Incremental Temp every few minutes until completed.
7. Run Certify Live Incremental again.

Notes:
- True delta does not delete live history.
- Promotion uses INSERT OR REPLACE.
- Final live certification blocks silent bad completion.
