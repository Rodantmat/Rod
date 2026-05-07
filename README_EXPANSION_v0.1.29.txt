AlphaDog Expansion v0.1.29 - Expansion Own Files Only

This ZIP intentionally contains only expansion-specific files.
It does NOT include package.json or wrangler.jsonc because those belong to the old/current control room setup and must not be overwritten.

Deploy target:
- Worker name: alphadog-expansion-v001
- Worker source: alphadog_expansion_worker.js
- Wrangler config: wrangler.expansion.jsonc
- UI file: alphadog_expansion_control_room.html

Deploy command if deploying manually from this folder:
npx wrangler deploy --config wrangler.expansion.jsonc

Test sequence:
1. Open the Expansion Control Room.
2. Click Health.
3. Confirm version shows v0.1.29 - Expansion Own Files Only.
4. Click Run Phase 2 Home Run Score Scaffold.
5. Confirm HTTP 200 and no Unknown route.

If deployed worker still shows an older version, the active deploy command is not using wrangler.expansion.jsonc or is pointing at another folder/repo.
