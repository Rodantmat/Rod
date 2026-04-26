ALPHADOG control_room v1.2.18 — RBI Hydra

Files changed:
- control_room.html: version bump only, UI preserved from v1.2.17.
- worker.js: registered and implemented build_edge_candidates_rbi.
- d1_migration_edge_candidates_rbi.sql: safe table creation.

Deploy:
- Upload/deploy worker.js.
- Upload/deploy control_room.html.
- Run migration only if edge_candidates_rbi does not already exist.

Test:
1. SCRAPE > Build RBI Candidates
2. Manual SQL: SELECT COUNT(*) FROM edge_candidates_rbi;
3. Manual SQL: SELECT player_name, team_id, lineup_slot, rbi_opportunity_score, candidate_tier FROM edge_candidates_rbi LIMIT 20;
