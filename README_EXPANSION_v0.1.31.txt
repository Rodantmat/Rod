ALPHADOG EXPANSION v0.1.31 - Event Delegation Button Fix

Expansion-only package. Do not mix with production scheduled backend, Main UI, or old control room files.

Deploy command:
npx wrangler deploy --config wrangler.expansion.jsonc

Cloudflare build settings:
Build command: blank
Deploy command: npx wrangler deploy --config wrangler.expansion.jsonc
Root directory: /

Test sequence after deployment:
1. Open https://alphadog-expansion-v001.rodolfoaamattos.workers.dev
2. Confirm header shows v0.1.31 - Event Delegation Button Fix
3. Tap Button Self Test. Expected: button_wiring PASS_INLINE_ONCLICK_ACTIVE.
4. Tap Health. Expected: HTTP 200 and version v0.1.31.
5. Tap RUN PHASE 2 HOME RUN SCORE SCAFFOLD. Send the output.
