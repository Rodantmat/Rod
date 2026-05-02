AlphaDog v1.3.53 - Main UI Admin Bridge Guard

CONTROL/SCHEDULED WORKER ONLY:
- worker.js
- wrangler.jsonc
- control_room.html
- package.json

Fixes:
- Adds POST /main-ui/admin-refresh/start for the independent main UI Admin button.
- Starts a background refresh using ctx.waitUntil so the browser can close after the request starts.
- Does not run static data.
- Sleeper remains manual.
- Refresh sequence: incremental temp schedule/tick, everyday schedule/tick, weather, lineup, Phase 2C PrizePicks current-board context, Odds API, full scoring refresh.
- Adds GET /main-ui/admin-refresh/status for latest background run visibility.

Required existing control worker secret:
- INGEST_TOKEN must match the token used by the main UI worker.
