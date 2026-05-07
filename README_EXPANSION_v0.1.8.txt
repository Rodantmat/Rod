AlphaDog Expansion v0.1.8 - Expansion Schema Statement Runner Lock

Files:
- alphadog_expansion_worker.js
- alphadog_expansion_control_room.html
- alphadog_expansion_schema.sql
- wrangler.expansion.jsonc
- package.expansion.json

Purpose:
- Fresh isolated expansion worker/control room.
- Reads current PrizePicks board from prizepicks_current_market_context.
- Writes only to xp_* tables.
- Does not alter current scoring/backend tables.

Fix in this build:
- Replaces D1 multi-statement exec schema apply with individual prepare().run() statement execution.
- Fixes Apply Schema error: CREATE TABLE IF NOT EXISTS xp_schema_migrations (: incomplete input.
- Keeps worker-hosted control room and embedded token bridge.

Deploy:
- Upload/replace all files in the same flat repo/root.
- Cloudflare Worker name remains alphadog-expansion-v001.
- Worker main remains alphadog_expansion_worker.js.
- D1 binding remains DB -> prop-engine-db.

Test order:
1. Open https://alphadog-expansion-v001.rodolfoaamattos.workers.dev/
2. Health
3. Apply Schema
4. Counts
5. Refresh Board
6. Counts
7. Load Sample
8. Manual SQL

Expected Apply Schema:
- ok: true
- version: v0.1.8 - Expansion Schema Statement Runner Lock
- statement_runner: individual_prepare_run_no_exec_multistatement
- statements_applied greater than 0
