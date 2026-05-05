AlphaDog v1.3.93 - HITS Thin-Market Variance Patch

Purpose
- Patch HITS scoring only.
- Reduce thin-market inflation from 2-book HITS rows.
- Penalize 0-book PrizePicks standard HITS fallback rows.
- Remove the flat 76-score HITS fallback cluster.
- Preserve existing Total Bases, RBI, Odds API, orchestrator, scheduler, and Control Room flows.

Changes
1. HITS 2-book market depth
- 2-book HITS consensus now receives a thin-market drag instead of a positive market-depth bump.
- Positive market-depth support for HITS now requires 3+ paired books.

2. HITS probability lift
- 2-book HITS probability lift is sharply reduced.
- 0-book PrizePicks standard HITS fallback receives no probability lift.

3. HITS elite-contact exception
- Thin 2-book HITS rows can exceed the normal cap only when the internal contact profile clears the elite-contact exception.
- The exception is based on stored metrics: hit volume, lineup slot, hits/AB proxy, and market probability.

4. HITS 0-book fallback
- 0-book PrizePicks standard HITS fallback rows are capped below PLAYABLE.
- HITS UNDER fallback no longer clusters at 76. It now uses a dynamic cap based on hit_per_game.
- HITS OVER fallback also uses a dynamic cap based on hit_per_game.

5. Same-side HITS penalty
- HITS same-side matchup penalty increased from -1.0 to -2.5.

Expected result
- 0-book HITS rows should not promote to PLAYABLE.
- Most 2-book non-elite goblin HITS rows should move down into WATCHLIST/low PLAYABLE range.
- Elite contact hitters can still separate.
- The repeated 76.00 HITS fallback cluster should be gone.

Deploy
- Upload the flat ZIP contents to the scheduled backend worker repo.
- Deploy using the existing Cloudflare/GitHub flow.
- Do not deploy this to the separate Main UI worker.
