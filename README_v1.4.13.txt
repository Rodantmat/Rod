AlphaDog / OXYGEN-COBALT
v1.4.13 - RBI Top 20 Probability Board

Surgical backend/control-room build.

Changes:
- Keeps PrizePicks RBI skipped.
- Keeps RBI UNDER Gemini disabled.
- Selects Sleeper RBI UNDER 0.5 candidates after backend pickability/start-time filtering.
- Ranks Sleeper RBI UNDER candidates by deterministic Poisson-style No-RBI hit probability.
- Promotes only the top 20 valid Sleeper RBI UNDER candidates.
- Adds hit_probability / hit_probability_pct into RBI audit payload for Main UI display.
- Preserves HITS, TOTAL_BASES, scheduler, cron, schema, and Control Room behavior.

Test:
1. DEBUG > Health
2. SCORING V1 > Run Full Score Refresh / Run MLB Scores
3. Wait 2-4 minutes
4. SCORING V1 > Check MLB Scores
5. MANUAL SQL > inspect model_version = 'v1.4.13 - RBI Top 20 Probability Board'
