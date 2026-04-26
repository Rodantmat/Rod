ALPHADOG CONTROL ROOM
v1.2.21 — RFI Razor Fang

Base used:
- v1.2.19 — RBI Iron Filter

Do not use as base:
- v1.2.20 — RFI Zero Inning

Changes:
- Added SCRAPE > Build RFI Candidates button directly after Build RBI Candidates.
- Added Worker job build_edge_candidates_rfi.
- Added Worker auto-create table function for edge_candidates_rfi.
- Added deterministic D1-only game-level RFI candidate builder.
- Added d1_migration_edge_candidates_rfi.sql as reference/Cloudflare-console fallback.

RFI behavior:
- One row per game.
- No Gemini call.
- No external API call.
- No probabilities.
- No betting decisions.
- Uses games, starters_current, game_context_current, lineups_current, and players_current.

Expected test after deploy:
1. Confirm visible version: v1.2.21 — RFI Razor Fang
2. SCRAPE > Build RFI Candidates
3. Manual SQL:
   SELECT COUNT(*) FROM edge_candidates_rfi;
   Expected 15 if slate has 15 games.
4. Manual SQL:
   SELECT candidate_tier, COUNT(*) FROM edge_candidates_rfi GROUP BY candidate_tier;
5. Manual SQL:
   SELECT game_id, away_team, home_team, away_starter, home_starter, rfi_score, candidate_tier, candidate_reason
   FROM edge_candidates_rfi
   ORDER BY rfi_score DESC
   LIMIT 20;

Verification performed before packaging:
- Version string updated.
- RFI button present once in SCRAPE.
- Broken v1.2.20 label fragments absent.
- Worker job registered.
- Worker route present.
- Worker RFI table creation present.
- Worker RFI builder present.
- Node syntax check passed.
- ZIP root is flat.
