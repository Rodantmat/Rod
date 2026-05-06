AlphaDog / OXYGEN-COBALT
v1.4.11 - RBI Under Direct Support Lock

Surgical backend scoring patch only.

Changes:
- Preserves the player-name purge and no-book clamp direction from the prior build.
- Locks Sleeper RBI UNDER playable/qualified promotion behind exact paired Odds API RBI support.
- Treats player-only, one-sided, no-fair-probability, and no-book support as audit/supplemental only for RBI UNDER caps.
- Caps unsupported Sleeper RBI UNDER non-elite profiles at 79.
- Caps unsupported strict elite-under profiles at 82.
- Shrinks Gemini bonus to tiny tiebreak only when direct paired support is missing.
- Freshness remains audit-only.
- HITS, TOTAL_BASES, scheduler, cron, schema, Main UI, and stable Control Room flows untouched.

Test sequence:
1. DEBUG > Health
2. SCORING V1 > Run Full Score Refresh / Run MLB Scores
3. Wait 2-4 minutes
4. SCORING V1 > Check MLB Scores
5. MANUAL SQL > top-10 Sleeper RBI UNDER SQL using model_version = 'v1.4.11 - RBI Under Direct Support Lock'
