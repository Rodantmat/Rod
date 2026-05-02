AlphaDog Main UI v1.0.01 - Independent Main UI

Worker name:
main-alphadog-ui-v100

Files:
index.html
main_alphadog_worker.js
main_alphadog_wrangler.jsonc
main_alphadog_package.json
main_alphadog_logo.png
main_alphadog_favicon.png
main_alphadog_apple_touch_icon.png

Purpose:
This is a completely separate read-only Main UI worker.
It does not replace or touch prop-ingestion-git.
It has no cron triggers.
It has no scheduled handler.
It does not run scoring.
It does not call Odds API, Gemini, PrizePicks, Sleeper, or MLB API.
It only reads D1 and serves the Main UI page/assets.

Required Cloudflare binding:
D1 binding name: DB
D1 database_name: prop-engine-db
D1 database_id: ec21a626-1b31-45fd-816c-5baf5609a6c3

Required secrets:
None for this build.
Reason: this worker is read-only and uses only the D1 DB binding.
Do not add Gemini/Odds/PrizePicks/Sleeper secrets here unless a future build explicitly adds external calls.

Optional route tests:
/main_alphadog_health
/main_alphadog_board?score_min=0

Deploy command:
npx wrangler deploy --config main_alphadog_wrangler.jsonc

Do not deploy this into prop-ingestion-git.
Do not copy this worker over the scheduled/control-room worker.
