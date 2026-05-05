AlphaDog v1.4.10 - RBI Under No-Book Playable Clamp

Surgical RBI UNDER calibration patch only.

What changed:
- Preserved the v1.4.09 player-name purge.
- Added no-book Sleeper RBI UNDER clamp.
- Increased no-book Sleeper RBI UNDER tax from -3 to -8.
- No-book non-elite Sleeper RBI UNDER rows cap at 79.
- No-book strict elite-under Sleeper RBI UNDER rows cap at 82.
- Replaced misleading no-book odds-support cap label with no-book cap labels.
- Strict elite-under proof is math-only: slot archetype, low RBI rate, low HR risk, no middle-order/power/producer/math-risk profile, and no high-run environment.
- Gemini remains bounded as a tiebreaker only.
- Freshness remains audit-only.
- HITS, TOTAL_BASES, scheduler, cron, schema, and stable Control Room behavior were not changed.

Expected outcome:
- Thin no-book Sleeper RBI UNDER rows stop reaching 86.
- Non-elite no-book rows become WATCHLIST at most.
- Only strict elite-under archetypes can remain low PLAYABLE at 82 without book support.

Exact test sequence:
1. DEBUG > Health
2. SCORING V1 > Run Full Score Refresh / Run MLB Scores
3. Wait 2-4 minutes
4. SCORING V1 > Check MLB Scores
5. MANUAL SQL > run the v1.4.10 top-10 Sleeper RBI UNDER SQL from the chat
