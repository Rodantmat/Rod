AlphaDog / OXYGEN-COBALT
v1.4.14 - RBI Probability Sharpener Status Fix

Surgical backend patch only.

Changes:
- Preserves v1.4.13 top-20 pickable Sleeper RBI UNDER board.
- Keeps PrizePicks RBI skipped.
- Keeps RBI UNDER Gemini disabled.
- Sharpens deterministic No-RBI probability floors for low AVG / low power / rookie-sample / high-K / low-total profiles.
- Keeps top-20 RBI rows displayable for Main UI by preventing top-20 rows from falling below WATCHLIST display floor.
- Fixes Check MLB Scores status wrapper so COMPLETED_WITH_SKIPS counts as latest_run_completed=true.

Untouched:
- HITS scoring.
- TOTAL_BASES scoring.
- Schema.
- Cron schedule.
- Main UI.
- Database connection.

Test sequence:
1. DEBUG > Health
2. SCORING V1 > Run Full Score Refresh / Run MLB Scores
3. Wait 2-4 minutes
4. SCORING V1 > Check MLB Scores
5. MANUAL SQL > inspect model_version = 'v1.4.14 - RBI Probability Sharpener Status Fix'
