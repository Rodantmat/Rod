AlphaDog v1.4.09 - RBI Under Math Gate Purge

Surgical patch only.

What changed:
- Removed RBI_UNDER_HARD_RISK_BY_PLAYER.
- Removed the player-name RBI UNDER hard-risk scoring map.
- Added generalized RBI UNDER math-risk profile gating using only available stored fields.
- Math-risk inputs: lineup slot, historical HR, historical SLG, current HR, HR/PA, RBI/PA, current RBI, AVG/contact floor, RBI opportunity score, and runner/on-base support.
- Preserves bounded Gemini bonus behavior. Gemini remains a tiebreaker only and cannot override non-elite/no-book/risk caps.
- Preserves freshness as audit-only; no freshness scoring penalty was added.
- Preserves HITS, TOTAL_BASES, scheduler, cron, schema, and stable Control Room behavior.

Pre-patch simulation summary:
- Middle-order power/producer/contact profiles now receive a math-risk tax and cap from their measurable profile instead of a player-name lookup.
- Strong risk profiles: cap 78, tax -8.
- Medium risk profiles: cap 80, tax -6.
- Floor-risk profiles: cap 82, tax -4.
- True elite-under archetypes remain possible only when low RBI rate, low power, proper slot archetype, and no math-risk profile are present.
- No-book Sleeper RBI UNDER rows remain capped unless they prove an elite-under archetype.

Exact test sequence:
1. DEBUG > Health
2. SCORING V1 > Run Full Score Refresh / Run MLB Scores
3. Wait 2-4 minutes
4. SCORING V1 > Check MLB Scores
5. MANUAL SQL > run the v1.4.09 top-10 Sleeper RBI UNDER SQL from the chat
