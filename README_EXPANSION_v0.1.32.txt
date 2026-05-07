ALPHADOG EXPANSION v0.1.32 - UI Token Route Hardening

Expansion-only package. Do not mix with production scheduled backend, Main UI, or old control room files.

Deploy command:
npx wrangler deploy --config wrangler.expansion.jsonc

Cloudflare build settings:
Build command: blank
Deploy command: npx wrangler deploy --config wrangler.expansion.jsonc
Root directory: /

Test sequence after deployment:
1. Open https://alphadog-expansion-v001.rodolfoaamattos.workers.dev
2. Confirm header shows v0.1.32 - UI Token Route Hardening
3. Tap Button Self Test. Expected: button_wiring PASS_DIRECT_BINDING_AND_DELEGATED_FALLBACK and UI should scroll to output.
4. Tap Health. Expected: HTTP 200 and version v0.1.32.
5. Tap Auth Check. Expected: HTTP 200 and auth_warning embedded_control_room_token_used or null.
6. Tap RUN PHASE 2 HOME RUN SCORE SCAFFOLD. Send the output.
