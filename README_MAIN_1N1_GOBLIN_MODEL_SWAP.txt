OXYGEN-COBALT Main-1N.1 "Goblin Model Swap"
================================================

Surgical patch from Main-1N "Gemini Goblin Matrix".

Purpose:
- Fix Gemini A-E model rejection caused by deprecated gemini-2.0-flash.
- Preserve working UI, parser, Screen 1, Screen 2, packet endpoint, score endpoint, D1/MLB API wiring, and scheduled backend separation.

Version stamps:
- Frontend: v13.78.07 (OXYGEN-COBALT) • Main-1N.1 Goblin Model Swap
- Worker: alphadog-main-api-v100.8 - Main-1N.1 Goblin Model Swap

Changed files:
- index.html: version/title label only.
- alphadog-main-connectors.js: frontend version label only.
- alphadog-main-core.js: frontend version label only.
- alphadog-main-ui-engine.js: frontend version label only.
- alphadog-main-api-v100-worker.js: worker version + Gemini model routing only.

Gemini model routing:
- Primary model: gemini-2.5-pro
- Fallback model: gemini-3.1-flash-lite-preview
- Per-model attempts: 3
- Timeout per attempt: 12 seconds
- Retry delays: 1s, 2s
- Fallback starts after primary model retry exhaustion on retryable failure.

Not changed:
- No UI redesign.
- No CSS/layout changes.
- No parser rewrite.
- No scheduled backend/control room changes.
- No final scoring rewrite.
- No new Gemini cache writes.

Deploy:
1. Upload/deploy the flat folder contents.
2. Deploy the worker file using the same main API worker setup as Main-1N.
3. Confirm Cloudflare secret GEMINI_API_KEY exists on alphadog-main-api-v100.
4. Hard refresh the app/PWA.
5. Confirm header shows Main-1N.1 Goblin Model Swap.
6. Run one HITS leg first.
7. In debug report, confirm Gemini policy shows primary_model gemini-2.5-pro and fallback_model gemini-3.1-flash-lite-preview.
