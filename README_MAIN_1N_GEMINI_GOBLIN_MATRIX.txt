OXYGEN-COBALT Main-1N "Gemini Goblin Matrix"
================================================

Base patched:
- 2.zip / Main-1M Priority 1 MLB Wiring.

Protected systems:
- 1.zip / AlphaDog v1.2.40 Manual SQL Output Guard was not edited.
- Scheduled backend/control room untouched.

Version stamps:
- Frontend: v13.78.06 (OXYGEN-COBALT) • Main-1N Gemini Goblin Matrix
- Worker: alphadog-main-api-v100.7 - Main-1N Gemini Goblin Matrix

What changed:
1. Added isolated main-worker Gemini endpoint:
   POST /main/gemini/matrix/leg

2. Added Gemini A-E request orchestration:
   - Prompt A: player role / recent / matchup
   - Prompt B: game / team / bullpen / environment
   - Prompt C: prop / market placeholders / candidate / game state
   - Prompt D: advanced player form / contact
   - Prompt E: injury / news / weather placeholders / integrity

3. Added request safety policy:
   - Promise.allSettled across A-E.
   - 12-second timeout per prompt.
   - 3 total attempts per prompt.
   - Backoff: 1s then 2s.
   - Retry conditions: 503, 429, timeout, cancelled, zero payload, malformed JSON, network fetch failure.
   - Partial success allowed.
   - One failed prompt does not crash the whole leg.

4. Added backend normalization:
   - Validates prompt_id.
   - Requires factors array.
   - Recomputes summary average/counts.
   - Preserves required factor shape.
   - Missing factor from Gemini becomes explicit MISSING_DATA placeholder, not a fake value.

5. Added frontend wiring:
   - Screen 2 still starts automatically after Go to Screen 2.
   - Existing packet and score endpoints still run.
   - New Gemini A-E endpoint runs after packet/score.
   - UI displays Gemini A-E status and all prompt factors with score/classification.
   - Debug report includes Gemini request summary, status, prompt summaries, and compact raw Gemini output.

What did not change:
- No UI redesign.
- No layout rewrite.
- No Screen 1 parser change.
- No scheduled backend/control-room change.
- No final scoring logic change.
- No Gemini cache/D1 writes added in this build.

Cloudflare secret required:
- GEMINI_API_KEY must exist on the main worker alphadog-main-api-v100.

Deploy:
1. Upload/deploy the flat folder files from this ZIP to the main system repo/folder.
2. Deploy the main API worker using alphadog-main-api-v100-wrangler.jsonc.
3. Confirm Cloudflare worker has secret GEMINI_API_KEY.

Testing:
1. Open the app fresh / hard refresh.
2. Confirm top label shows Main-1N Gemini Goblin Matrix.
3. Ingest 1 supported MLB leg first: HITS, RBI, or RFI.
4. Click Go to Screen 2 / Analyze.
5. Confirm Daily Health passes.
6. Confirm packet_status ok.
7. Confirm score_status ok.
8. Confirm gemini_status ok or partial_success.
9. Open Gemini A-E sections and verify factors are visible with score and GREEN/YELLOW/RED signal.
10. Copy Debug Report and paste it back for review.

Known intentional limits:
- Final leg score remains matrix-fill placeholder.
- Market/odds are not faked.
- Injury/news/weather are not faked.
- Gemini caching is deferred to a future build.
