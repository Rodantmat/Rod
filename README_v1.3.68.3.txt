AlphaDog / OXYGEN-COBALT

v1.3.68.3 - RBI Gemini Signal Main Layer Promotion

Purpose:
Promote the proven v1.3.68.2 grounded Gemini RBI UNDER 0.5 signal call path from the single-leg debug job into the real Scoring V1 full-refresh path.

Surgical scope only:
- Full scoring now uses the same grounded-search Gemini payload that passed the Kyle Isbel debug test.
- No responseMimeType/application-json is sent when Google Search tool grounding is enabled.
- JSON is requested through strict prompt instructions and parsed from fenced/raw/first-object text.
- Existing normalizer/bonus gate remains strict: HTTP success, parsed JSON, FAVORABLE signal, usable true, allowed grounded market source, direct market evidence, bonus 1-3.
- Cache remains version-gated by SYSTEM_VERSION, so old v1.3.67/v1.3.68.2 stale no-bonus rows do not block this build.

Unchanged by design:
- No deterministic RBI scoring math change.
- No board/candidate/pickability change.
- No cron/scheduler change.
- No static/incremental/everyday flow change.
- Blanket Sleeper board bonus remains disabled.
- PrizePicks demon/goblin UNDER remains blocked.

Files:
- worker.js
- control_room.html
- wrangler.jsonc
- package.json
- README_v1.3.68.3.txt
- BUILD_VERSION_AUDIT_v1.3.68.3.txt

Required test sequence:
1. Deploy this ZIP.
2. Open Control Room.
3. Run DEBUG > Health.
   Expected: version = v1.3.68.3 - RBI Gemini Signal Main Layer Promotion.
4. Run SCORING V1 > Debug RBI Gemini Signal One.
   Expected: gemini_http_status=200, parsed_signal=FAVORABLE for Kyle Isbel if market evidence remains available, bonus_gate_passed, bonus_applied 2-3.
5. Run SCORING V1 > Run Full Score Refresh.
   Expected: compact output, rbi_board_fallback.gemini_signal_context.eligible_over75 > 0, attempted > 0, favorable > 0 if Kyle Isbel/other favorable legs are present, gemini_signal_bonus_rows > 0.
6. Run SCORING V1 > Check MLB Scores.
   Expected: latest run completed and active rows exist.
7. Run SCORING V1 > Build Score Candidate Board.
8. Run SCORING V1 > Inspect Candidate Board.
9. Run SCORING V1 > Export Candidate Board.
   Expected: started/expired legs not user-facing; Sleeper regular RBI UNDER can be pickable; PrizePicks demon/goblin cannot get UNDER.
