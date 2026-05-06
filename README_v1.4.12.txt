AlphaDog / OXYGEN-COBALT
v1.4.12 - RBI Sleeper Top 20 No Gemini

Surgical backend scoring patch.

Changes:
- Preserves scheduled backend / Control Room separation.
- Does not touch Main UI.
- Does not touch HITS or TOTAL_BASES scoring.
- Skips PrizePicks RBI rows in RBI fallback scoring.
- Disables Gemini market-signal calls for Sleeper RBI UNDER 0.5 scoring.
- Ranks current Sleeper regular RBI UNDER 0.5 rows using deterministic stored-data math only.
- Promotes only the top 20 Sleeper RBI UNDER 0.5 candidates.
- Keeps freshness audit-only.

Test sequence:
1. DEBUG > Health
2. SCORING V1 > Run Full Score Refresh / Run MLB Scores
3. Wait 2-4 minutes
4. SCORING V1 > Check MLB Scores
5. MANUAL SQL > inspect model_version = 'v1.4.12 - RBI Sleeper Top 20 No Gemini'
