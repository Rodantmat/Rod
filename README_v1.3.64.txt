AlphaDog/OXYGEN-COBALT Scheduled Backend Build

v1.3.64 - RBI Real Data Variance Gemini Over75 Signal

Files included:
- worker.js
- control_room.html
- wrangler.jsonc
- package.json
- README_v1.3.64.txt

What changed:
- Removed the v1.3.63 blanket Sleeper board market-signal bonus. Sleeper board presence now stays pickability/context only; it is not a universal strength boost.
- Removed the RBI fallback hard cap at 85. RBI UNDER scores can now rise above 85 when stored real data supports it. A hard safety clamp remains at 96 only.
- Rebuilt RBI fallback scoring around real stored-data variance: lineup slot, RBI opportunity context, incremental season RBI rate, HR/PA self-RBI risk, SLG/power profile, low/high game total context, park context, and available edge candidate context.
- Added Gemini BettingPros RBI UNDER 0.5 market-presence prompt wiring only after deterministic stored-data RBI UNDER score is already over 75.
- Gemini signal can only add a small favorable tie-breaker bonus when it returns a usable BettingPros Under/Less-side market signal. It does not run for all legs and does not replace deterministic scoring.
- Added cached table rbi_gemini_under_signals so repeated full score refreshes reuse same-slate/player/line signal rows instead of repeatedly calling Gemini.
- Kept compact scoring output guard from v1.3.62 to avoid browser freezes / D1 SQLITE_TOOBIG task output.

Deployment:
Upload/replace worker.js, control_room.html, wrangler.jsonc, and package.json in the scheduled backend repo.

Test sequence:
1. Deploy the Worker.
2. Open Control Room.
3. Run DEBUG > Health. Confirm visible version is v1.3.64 - RBI Real Data Variance Gemini Over75 Signal.
4. Run SCORING V1 > Run Full Score Refresh.
5. Run SCORING V1 > Check MLB Scores. Confirm latest run is COMPLETED, scratch_clean=true, active_rows_ok=true.
6. Run SCORING V1 > Build Score Candidate Board.
7. Run SCORING V1 > Inspect Candidate Board.
8. Run SCORING V1 > Export Candidate Board.
9. Optional SQL check for Gemini signal usage:
   SELECT slate_date, COUNT(*) AS rows_count, SUM(usable_for_bonus) AS favorable_rows, ROUND(AVG(bonus),2) AS avg_bonus, MAX(bonus) AS max_bonus FROM rbi_gemini_under_signals GROUP BY slate_date ORDER BY slate_date DESC;
10. Optional SQL check for top RBI UNDERs:
   SELECT player_name, team, opponent, line_direction, line_number, final_score, confidence_grade, recommendation_status, market_confidence, json_extract(audit_payload,'$.market_bonus.bonus') AS gemini_bonus FROM active_score_board WHERE prop_family='RBI' AND line_direction='UNDER' AND slate_date=(SELECT MAX(slate_date) FROM active_score_board WHERE prop_family='RBI') ORDER BY final_score DESC LIMIT 25;

Notes:
- The Gemini prompt is intentionally not full-slate. It is over-75-only.
- If no RBI UNDER leg crosses 75 before Gemini, no Gemini calls are made.
- If Gemini cannot verify BettingPros Under/Less-side market presence, no bonus is applied.
- Candidate board pickability gate remains unchanged.
