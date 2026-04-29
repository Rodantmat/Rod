AlphaDog / Oxygen-Cobalt v1.3.01 - Phase 2C-I Current Market Context

Scope:
- Adds prizepicks_current_market_context as the active current PrizePicks board context layer.
- Adds optional prizepicks_market_snapshots audit/history table.
- Adds scrape_phase2c_market_context.
- Adds check_phase2c_market_context.
- Adds Control Room buttons: EVERYDAY PHASE 2C > Run Market Context and EVERYDAY PHASE 2C > Check Market Context.

Not touched:
- Phase 1, Phase 2A, Phase 2B
- static/incremental flows
- scoring
- external odds/market intelligence
- Gemini
- cron/scheduling
- existing mlb_stats schema

Active-board rule:
- Reads mlb_stats rows from the latest board capture window: updated_at >= latest updated_at minus 10 minutes.
- Prioritizes line_id as projection_key.
- Uses fallback composite identity only when line_id is missing and marks those rows MEDIUM confidence.
