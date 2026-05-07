AlphaDog Expansion v0.1.27 - Expansion Only Clean Package

Expansion-only files included:
- alphadog_expansion_worker.js
- alphadog_expansion_control_room.html
- alphadog_expansion_schema.sql
- wrangler.expansion.jsonc
- package.expansion.json

No generic worker.js, control_room.html, wrangler.jsonc, package.json, or schema.sql files are included in this ZIP.

Deploy using the expansion Wrangler config only:
wrangler deploy --config wrangler.expansion.jsonc

Post-deploy test sequence:
1. Open the Expansion Control Room.
2. Click Health.
3. Confirm version shows v0.1.27 - Expansion Only Clean Package.
4. Click Run Phase 2 Home Run Score Scaffold.
5. Confirm the route returns HTTP 200, not Unknown route.
