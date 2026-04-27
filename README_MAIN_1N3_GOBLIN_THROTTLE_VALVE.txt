OXYGEN-COBALT Main-1N.3 "Goblin Throttle Valve"
================================================

Purpose:
- Surgical reliability patch after Main-1N.2.
- Keeps parser fix from Main-1N.2.
- Changes Gemini A-E retrieval from one heavy all-at-once leg request to one prompt per Worker request.
- Frontend still auto-runs Screen 2; user does not manually trigger prompts.
- Adds clearer progress/status communication for success and user-facing errors.

Version stamps:
- Frontend: v13.78.09 (OXYGEN-COBALT) • Main-1N.3 Goblin Throttle Valve
- Worker: alphadog-main-api-v100.10 - Main-1N.3 Goblin Throttle Valve

Main changes:
- Adds preferred endpoint: POST /main/gemini/matrix/prompt
- Keeps legacy endpoint: POST /main/gemini/matrix/leg
- Frontend now calls Prompt A, then B, then C, then D, then E sequentially.
- No more five Gemini prompts fired at once.
- No more single huge A-E Worker request from the frontend.
- Gemini errors are surfaced clearly in the status bar and debug report.

Gemini policy:
- Primary model: gemini-1.5-pro-latest
- Fallback model: gemini-1.5-flash-latest
- Primary timeout: 25 seconds
- Fallback timeout: 12 seconds
- Max attempts per model: 1
- Fallback starts after retryable primary failure.
- Matrix fill only. No final scoring.

User-facing error examples:
- Gemini is busy now, try again in a few minutes.
- Gemini timed out, try again in a few minutes.
- Gemini rate limit reached, try again in a few minutes.
- Gemini API key is missing or not available on the Worker.
- Gemini returned malformed JSON. Try again.
- Gemini returned an empty response. Try again.

Progress UI:
- Status appears under the loading bar.
- Each task shows running/success/error.
- Success/error state stays visible briefly before the next task.

Payload safety:
- Prompt-specific slim payloads are sent to Gemini.
- Full packet/raw arrays are not sent to every prompt.
- Backend still recomputes/normalizes factor summaries.

Parser fixes preserved:
- Stops TB team abbreviation from parsing as Total Bases.
- Stops More from parsing as ER / Earned Runs Allowed.
- Uses exact prop-line matching first, especially after the numeric line.
- Keeps supported prop aliases intact.
- Fixes @ CLE opponent parsing at the start of a matchup line.

Untouched:
- No scheduled backend/control room changes.
- No final scoring changes.
- No D1 schema changes.
- No new Gemini cache writes yet.
- No Screen 1 redesign.
- No Screen 2 layout redesign beyond the requested progress/status communication area.

Test recommendation:
1. Deploy Worker v100.10.
2. Deploy frontend v13.78.09.
3. Hard refresh / clear PWA cache.
4. Test one supported leg first: HITS, RBI, or RFI.
5. Confirm Daily Health pass.
6. Confirm packet ok.
7. Confirm score ok.
8. Confirm Gemini prompt sequence shows A through E sequentially.
9. If Gemini is busy/timeout/rate-limited, confirm the status bar shows the clear error message instead of unknown error.
