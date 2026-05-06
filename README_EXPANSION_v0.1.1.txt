AlphaDog/OXYGEN-COBALT Expansion Bootstrap
Version: v0.1.1 - Expansion Hardcoded Admin Lock

FILES
- alphadog_expansion_worker.js
- alphadog_expansion_control_room.html
- alphadog_expansion_schema.sql
- wrangler.expansion.jsonc
- package.expansion.json
- README_EXPANSION_v0.1.1.txt
- BUILD_VERSION_AUDIT_EXPANSION_v0.1.1.txt

DESIGN LOCK
- New worker: alphadog-expansion-v001
- Existing scheduled backend is not changed.
- Existing Main UI is not changed.
- Existing production tables are read-only to this worker.
- This worker writes only to xp_* tables.
- New control room is stripped/fresh and only controls expansion routes.
- Control Room now sends the embedded expansion admin token automatically.
- Worker accepts the embedded matching token plus EXPANSION_ADMIN_TOKEN or INGEST_TOKEN if configured.

FIX IN v0.1.1
- Removed manual admin-token requirement from the Expansion Control Room.
- Added matching embedded admin bridge in the Worker and Control Room.
- Admin routes no longer require pasting a token into the UI.
- Health, Apply Schema, Refresh Pickable Board, Counts, Jobs, Logs, and Sample Prop use the embedded token automatically.

FIRST PHASE PURPOSE
This is not scoring yet. It proves the isolated expansion environment can:
1. Connect to the same D1 database.
2. Create isolated xp_* tables.
3. Read PrizePicks current board rows from prizepicks_current_market_context.
4. Copy supported target batter props into xp_prop_lines_current.
5. Show counts and samples in the new control room.
6. Run independently from the current backend/control room.

TARGET BATTER PROPS COPIED
- Hitter Strikeouts
- Walks
- Singles
- Doubles
- Home Runs
- Runs
- Hits+Runs+RBIs
- Hitter Fantasy Score
- Triples
- Stolen Bases
- Hits
- Total Bases
- RBIs

PARKED FOR NOW
- Triples
- Stolen Bases

DEPLOY TARGET
Use wrangler.expansion.jsonc as the expansion worker config.
