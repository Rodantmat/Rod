OXYGEN-COBALT MAIN-1K MLB API FACTOR BRIDGE

Purpose:
- Keeps Screen 1 ingest/parsing unchanged.
- Keeps Screen 2 data-matrix layout unchanged.
- Adds official MLB StatsAPI enrichment on top of the already-working DB packet.
- Keeps scheduled task worker untouched.

Fixed filenames:
- index.html
- alphadog-main-connectors.js
- alphadog-main-core.js
- alphadog-main-parser.js
- alphadog-main-styles.css
- alphadog-main-ui-engine.js
- alphadog-main-api-v100-worker.js
- alphadog-main-api-v100-wrangler.jsonc

Main API Worker:
- Version: alphadog-main-api-v100.4 - MLB API Factor Bridge
- Routes stay the same:
  GET  /main/health
  POST /main/packet/leg
  POST /main/score/leg

New MLB-safe enrichment:
- MLB gamePk resolution from official schedule.
- MLB live/game status from live feed.
- MLB current boxscore lineups.
- MLB player last 5 game logs from recent boxscores.
- MLB team recent games from boxscores.
- MLB opponent bullpen recent usage from recent boxscores.
- MLB API read-through cache table: main_supplemental_mlb_api_cache.

Controlled D1 writes:
- main_supplemental_leg_cache
- main_supplemental_mlb_api_cache

Do not upload old 1h/1i/1j duplicate frontend filenames anymore.
Use these fixed filenames only.
