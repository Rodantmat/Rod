OXYGEN-COBALT MAIN-1J FULL DB MATRIX

Purpose:
- Keep Screen 1 and Screen 2 structure intact.
- Keep the scheduled backend worker untouched.
- Expand the isolated main API worker packet so Screen 2 can display all safe/readable D1 data currently available for the leg.
- Add richer per-factor matrix rows from games, markets, players, lineups, starters, bullpens, recent usage, and candidate tables.
- Keep scoring as placeholder/wiring proof only. Final scoring logic comes later.

Files:
- index.html
- alphadog-main-1j-parser.js
- alphadog-main-1j-connectors.js
- alphadog-main-1j-ui-engine.js
- alphadog-main-1j-core.js
- alphadog-main-1j-styles.css
- alphadog-main-api-v100-worker.js
- alphadog-main-api-v100-wrangler.jsonc

Deploy worker:
npx wrangler deploy -c alphadog-main-api-v100-wrangler.jsonc

Then upload/replace frontend files.

First test:
1. Open app.
2. Ingest one HITS leg.
3. Go to Screen 2.
4. Confirm Daily Health PASS.
5. Confirm Packet Status OK and Score Status OK.
6. Confirm matrix has Team Context, Candidate Context, and Full DB Inventory.
7. Copy Debug Report and send it back.
