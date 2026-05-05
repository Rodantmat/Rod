AlphaDog v1.4.06 - RBI Under Elite Gate Caps

Surgical patch only. No scheduled backend architecture changes. No HITS / Total Bases scoring changes intended.

Changed:
1. Updated SYSTEM_VERSION to v1.4.06 - RBI Under Elite Gate Caps.
2. Fixed Sleeper matchup parsing so opponent strings like NYM @ COL and AZ VS PIT produce real MLB home/away teams instead of position labels.
3. Added hard RBI UNDER caps after all modifiers and Gemini bonus:
   - Coors Field UNDER cap: 82 max.
   - Coors Field with power/hard-risk profile: 80 max.
   - High total UNDER cap: 82 max, or 80 for power/middle-order/hard-risk profiles.
   - Slot 3-6 power-risk cap: 79 max unless 3+ paired direct books support it.
   - Proven run-producer cap: 78 max unless 3+ paired direct books support it.
   - Known hard-risk profile cap: 78 max unless 3+ paired direct books support it.
4. Gemini RBI UNDER bonus remains connected but cannot override hard risk caps.
5. Added explicit hard-risk profiles for Michael Busch, Lourdes Gurriel, and Marcell Ozuna.

Deploy/test sequence:
1. Deploy this ZIP normally.
2. Open Control Room.
3. Go to group: SCORING V1.
4. Press: Run MLB Scoring V1.
5. Wait for backend completion. If it is still running, do not press Run again.
6. Press: Check MLB Scores.
7. Confirm version shows v1.4.06 - RBI Under Elite Gate Caps.
8. Go to group: MANUAL SQL.
9. Run this exact top-10 query:

SELECT
  player_name,
  team,
  opponent,
  line_direction,
  line_number,
  final_score,
  confidence_grade,
  recommendation_status,
  market_confidence,
  caps,
  penalties,
  substr(scoring_modifiers,1,1200) AS modifiers_preview,
  substr(audit_payload,1,1500) AS audit_preview,
  created_at
FROM mlb_rbi_scores
WHERE slate_date = '2026-05-05'
  AND model_version = 'v1.4.06 - RBI Under Elite Gate Caps'
  AND source_board = 'sleeper'
  AND line_direction = 'UNDER'
  AND line_number = 0.5
ORDER BY final_score DESC, market_confidence DESC
LIMIT 10;

Expected checks:
- Carson Benge should not reach 86 if NYM @ COL parses correctly; Coors cap should appear.
- Lourdes Gurriel should be capped by hard-risk/proven-producer logic and should not stay easy PLAYABLE at 82+ unless strong direct paired market support exists.
- Marcell Ozuna should not be elevated by Gemini bonus above hard-risk cap without strong direct paired market support.
- True table-setter/bottom-order low-power profiles can still remain high if no hard risk cap applies.
