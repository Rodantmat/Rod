AlphaDog / Oxygen-Cobalt
v1.3.02 - Phase 2C-I Market Context Chunk Runner

Purpose:
- Build the internal current PrizePicks market/projection context layer from latest mlb_stats board rows.
- Process current board rows in bounded chunks to avoid D1 timeout.

Changed:
- Added/uses prizepicks_current_market_context.
- Added/uses phase2c_market_context_runs.
- Defers snapshot/history writes.
- Adds/keeps Control Room buttons:
  - EVERYDAY PHASE 2C > Run Market Context
  - EVERYDAY PHASE 2C > Check Market Context

Not changed:
- No scoring.
- No Gemini.
- No external odds.
- No cron.
- No Phase 1, 2A, 2B, static, or incremental logic changes.

Expected use:
- Press EVERYDAY PHASE 2C > Run Market Context repeatedly until status is completed.
- Then press EVERYDAY PHASE 2C > Check Market Context.
