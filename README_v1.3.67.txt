AlphaDog / OXYGEN-COBALT
v1.3.67 - RBI Gemini Nested Signal Normalizer

FILES
- worker.js
- control_room.html
- wrangler.jsonc
- package.json
- README_v1.3.67.txt

WHAT CHANGED
- Repairs the RBI UNDER 0.5 Gemini market-signal layer from prior build.
- Keeps deterministic RBI stored-data scoring as the base.
- Gemini still runs only for RBI UNDER 0.5 legs with deterministic pre-signal score over 75.
- Replaces the too-strict BettingPros-only parser with grounded RBI UNDER signal parsing that accepts the same stable shape seen in direct Gemini testing:
  signal, bonus_recommended, confidence, sources_checked, evidence_summary, do_not_bonus_reason.
- Allows direct market evidence from BettingPros, Covers, major sportsbook indexed pages, or direct odds pages.
- Applies a small bonus only when the Gemini signal is FAVORABLE and evidence is market/odds based.
- No blanket Sleeper board bonus.
- No hard 85 cap for RBI fallback scores; only hard safety clamp remains.
- No UI flow changes, no cron changes, no schema-breaking changes.

IMPORTANT EXPECTED BEHAVIOR
- Full Score Refresh may still complete quickly because Gemini calls are only for over-75 RBI UNDER rows and cached signal rows are reused.
- If Gemini grounding/API cannot find real market evidence, rows receive no signal bonus.
- If direct market evidence exists, the signal bonus should now match the behavior seen in direct Gemini tests much more closely.

TEST SEQUENCE
1. Upload/deploy this ZIP to the same Cloudflare Worker.
2. Open Control Room.
3. Run DEBUG > Health.
   Confirm version: v1.3.67 - RBI Gemini Nested Signal Normalizer.
4. Run SCORING V1 > Run Full Score Refresh.
5. Run SCORING V1 > Check MLB Scores.
   Confirm:
   - scoring_engine_ok = true
   - latest_run_completed = true
   - scratch_clean = true
   - rbi_board_fallback.gemini_signal_context attempted > 0 when over-75 RBI UNDER rows exist
   - favorable/bonus rows can appear when Gemini returns FAVORABLE market evidence
6. Run SCORING V1 > Build Score Candidate Board.
7. Run SCORING V1 > Inspect Candidate Board.
8. Run SCORING V1 > Export Candidate Board.

FOCUSED SQL CHECKS
Use Manual SQL if you want to verify the signal table:

SELECT
  slate_date,
  usable_for_bonus,
  COUNT(*) AS rows_count,
  AVG(bonus) AS avg_bonus,
  MAX(bonus) AS max_bonus
FROM rbi_gemini_under_signals
GROUP BY slate_date, usable_for_bonus
ORDER BY slate_date DESC, usable_for_bonus DESC
LIMIT 20;

SELECT
  player_name,
  team,
  opponent,
  pre_signal_score,
  usable_for_bonus,
  market_presence_score,
  under_signal_score,
  bonus,
  source_name,
  source_type,
  evidence
FROM rbi_gemini_under_signals
WHERE slate_date = (SELECT MAX(slate_date) FROM rbi_gemini_under_signals)
ORDER BY bonus DESC, pre_signal_score DESC
LIMIT 25;


V1.3.66 FIX:
- Stale rbi_gemini_under_signals rows from older parser/prompt builds no longer block fresh Gemini calls.
- Current-version cache is still respected after rerun.
- Direct Gemini response shape stores sources_checked/evidence_summary cleanly.
