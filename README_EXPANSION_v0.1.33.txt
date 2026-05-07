ALPHADOG EXPANSION v0.1.33 - Embedded HTML Script Escape Fix

Expansion-only package. Do not mix with production scheduled backend, Main UI, or old control room files.

Root cause fixed:
The Worker embedded the control room HTML in a normal template literal. That converted browser-script escape sequences, especially \n inside the output truncation string, into a real newline inside a JavaScript single-quoted string. On Safari/iPhone this prevented the entire UI script from running, so the page rendered but all buttons were dead.

Patch:
CONTROL_ROOM_HTML now uses String.raw so the embedded script is served as valid browser JavaScript.

Deploy command:
npx wrangler deploy --config wrangler.expansion.jsonc

Cloudflare build settings:
Build command: blank
Deploy command: npx wrangler deploy --config wrangler.expansion.jsonc
Root directory: /

Test sequence after deployment:
1. Open https://alphadog-expansion-v001.rodolfoaamattos.workers.dev
2. Confirm header shows v0.1.33 - Embedded HTML Script Escape Fix
3. Confirm the bridge pill changes away from Worker bridge loading...
4. Tap Button Self Test. Expected: PASS_DIRECT_BINDING_AND_DELEGATED_FALLBACK.
5. Tap Health. Expected: HTTP 200 and version v0.1.33.
6. Tap Auth Check. Expected: HTTP 200.
7. Tap RUN PHASE 2 HOME RUN SCORE SCAFFOLD. Send the output.
