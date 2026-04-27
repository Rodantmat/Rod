OXYGEN-COBALT Main-1N.4 "Goblin Triple Tap"
=================================================

Purpose:
- Surgical follow-up to Main-1N.3.
- Preserve parser fix, sequential Gemini prompt endpoint, progress/status communication, packet/score wiring, and UI layout.
- Restore the Gemini model policy confirmed from old-chat context.

Versions:
- Frontend: v13.78.10 (OXYGEN-COBALT) • Main-1N.4 Goblin Triple Tap
- Worker: alphadog-main-api-v100.11 - Main-1N.4 Goblin Triple Tap

Gemini policy:
- Primary model: gemini-2.5-pro
- Fallback model: gemini-3.1-flash-lite-preview
- Primary timeout: 30000 ms
- Fallback timeout: 30000 ms
- Attempts: 3 primary attempts, then 3 fallback attempts when primary fails with retryable conditions.
- One prompt at a time from the frontend sequence: A → B → C → D → E.
- No separate consistency model. Backend deterministic banding/recompute remains the validation layer.

Retryable conditions:
- 503 / high demand / busy / overload
- 429
- timeout / cancelled / abort
- zero payload / empty response
- malformed JSON
- network fetch failure

Error mapping fix:
- 404 is now reported as model unavailable / model not supported, not as rate limit.
- 429 remains rate limit.
- 503 remains Gemini busy.

Preserved:
- No scheduled backend/control room changes.
- No scoring changes.
- No D1 schema changes.
- No new cache writes.
- No parser drift from Main-1N.2.
- No UI redesign.
