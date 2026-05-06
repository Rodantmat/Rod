AlphaDog Expansion Build
v0.1.3 - Expansion Clean Output Worker-Origin Guard

Files:
- alphadog_expansion_worker.js
- alphadog_expansion_control_room.html
- alphadog_expansion_schema.sql
- wrangler.expansion.jsonc
- package.expansion.json

Fixes in this build:
- Stops the huge GitHub Pages 404 HTML blob from filling output.
- Adds a clean WRONG_ORIGIN diagnostic if the page is opened from rodantmat.github.io.
- Keeps buttons worker-origin only: /xp/* routes must be opened from the Cloudflare Worker URL root.
- Reworks Manual SQL to match the main Control Room style: Run SQL, Clear SQL, Select SQL.
- Moves COPY OUTPUT below the output window.
- Caps non-JSON/HTML output preview so iPhone/Safari does not get flooded.

Connection truth:
If the browser URL shows rodantmat.github.io, Health will not hit the Expansion Worker. It will hit GitHub Pages and fail. Open the Cloudflare Worker route for alphadog-expansion-v001 instead.

Exact test sequence:
1. Deploy alphadog_expansion_worker.js to the expansion Cloudflare Worker.
2. Open the expansion Worker URL root in Safari, not rodantmat.github.io.
3. Confirm the page shows v0.1.3 - Expansion Clean Output Worker-Origin Guard.
4. Tap Health.
5. Expected: JSON with ok=true and worker=alphadog-expansion-v001.
6. Tap Apply Schema.
7. Tap Refresh Board.
8. Tap Counts.
9. Run the default Manual SQL with Run SQL.
10. Tap COPY OUTPUT.

No current scoring logic is touched. No current production tables are written. Expansion writes stay limited to xp_*.
