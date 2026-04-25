AlphaDog Edge Candidates - Hits B Aggressive

Adds scheduled-task layer only:
- build_edge_candidates_hits
- edge_candidates_hits table
- Control Room button: SCRAPE > Build Hits Candidates
- Candidate pool only: no probabilities, no scores, no betting decisions.

Recommended run order:
1. SCRAPE > FULL RUN
2. SCRAPE > MLB Lineups
3. SCRAPE > MLB Usage
4. SCRAPE > Run Derived Metrics
5. SCRAPE > Build Hits Candidates
6. CHECK > Feed Readiness
7. Manual SQL:
   SELECT candidate_tier, COUNT(*) AS c FROM edge_candidates_hits WHERE slate_date='2026-04-25' GROUP BY candidate_tier;
   SELECT player_name, team_id, lineup_slot, candidate_tier, candidate_reason FROM edge_candidates_hits WHERE slate_date='2026-04-25' ORDER BY candidate_tier, game_id, team_id, lineup_slot LIMIT 80;

Migration:
- The worker auto-creates the table on first run.
- Optional manual migration file included: d1_migration_edge_candidates_hits.sql

Cosmetic carried forward:
- Control Room buttons shrink toward text-fit sizing again.


Update in this package:
- Candidate inserts use D1 batch writes to avoid Worker request-limit failures.
- Control Room button height restored to text-fit sizing.
- Manual SQL uses sqlInput correctly.
- Added CHECK > Hits Candidates audit button.


HOTFIX C:
- Removed Build Hits Candidates dependency on validateRows(TABLES.edge_candidates_hits).
- Registered edge_candidates_hits in TABLES anyway.
- D1 batch insert remains request-limit safe.
