AlphaDog Expansion Worker v0.1.12 - Phase 1 Bridge Builder

Scope:
- Isolated expansion worker/control room only.
- Reads existing production-prepared tables.
- Writes only xp_* tables.
- No production scheduled backend mutation.
- No Main UI changes.
- No scoring yet.

New in v0.1.12:
- Adds isolated xp_team_alias_map.
- Adds isolated xp_game_bridge_current.
- Adds Phase 1 bridge builder route/button.
- Adds bridge diagnostics routes/buttons.
- Requires exact slate/team/opponent/start-time bridge before later context/scoring prep.

Primary routes:
- /xp/health
- /xp/schema/apply
- /xp/board/refresh
- /xp/board/counts
- /xp/bridge/build
- /xp/bridge/counts
- /xp/bridge/unmatched
- /xp/bridge/sample
- /xp/manual-sql

Deployment:
Use: wrangler deploy --config wrangler.expansion.jsonc

Mandatory test sequence is provided in the ChatGPT response.
