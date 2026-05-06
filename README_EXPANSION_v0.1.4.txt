AlphaDog Expansion Control Room
v0.1.4 - Expansion UI Event + Hardcoded Worker Bridge

Purpose:
Fresh isolated expansion Worker/control room. Writes only to xp_* tables. Existing production tables are read-only inputs.

Fixes in this build:
- Repairs broken JavaScript event binding that caused all buttons to do nothing.
- Removes fragile inline onclick-only dependency.
- Hardcodes the Worker bridge for GitHub-hosted control-room use.
- Keeps clean compact output instead of giant HTML blobs.
- Keeps Manual SQL buttons as Run SQL / Clear SQL / Select SQL.

Hardcoded Worker base used by GitHub-hosted UI:
https://alphadog-expansion-v001.rodantmat.workers.dev

Deploy/test:
1. Replace alphadog_expansion_worker.js in the expansion Worker.
2. Replace alphadog_expansion_control_room.html in GitHub Pages if you keep using GitHub-hosted UI.
3. Open the control room.
4. Confirm version: v0.1.4 - Expansion UI Event + Hardcoded Worker Bridge.
5. Tap Clear SQL. Expected output: SQL cleared.
6. Tap Health. Expected: Worker JSON, not GitHub HTML.
7. Tap Apply Schema.
8. Tap Refresh Board.
9. Tap Counts.
10. Run Manual SQL.
