AlphaDog/OXYGEN-COBALT v1.4.26 - Queue Fast Return Lock Reaper

Purpose:
Surgical production backend patch for volatile data lifecycle, stale scoring locks, Odds API temp cleanup, and PrizePicks goblin/demon pickability bridge.

Changes:
1. SYSTEM_VERSION bumped to v1.4.26 - Queue Fast Return Lock Reaper.
2. Odds API temp tables are cleared at the start of every Odds run.
3. Odds API temp tables are cleared after success, certification failure, or promotion exception. Failed temp rows are no longer retained.
4. Odds API main tables are purged to the active selected slate after certified promotion.
5. Scoring/candidate volatile tables purge old slate data before scoring/candidate rebuild. Static and incremental base tables are not touched.
6. AUTO_SCORING_REFRESH_V1 stale lock reaper runs before scoring lock acquisition and gets a second-chance acquire.
7. Candidate board is volatile selected-slate output only; old candidate slate rows are deleted.
8. PrizePicks goblin/demon rows can validate sportsbook OVER pickability only. UNDER is never manufactured from goblin/demon.
9. Candidate release line_type/line_number reflect the matched PrizePicks board row when bridged.

Deploy target:
alphadog-phase3-starter-groups

Test sequence:
1. Deploy this ZIP to the scheduled backend worker only.
2. Run DEBUG > Health. Confirm version v1.4.26 - Queue Fast Return Lock Reaper.
3. Run DATA REFRESHING > Schedule Cascade with only scoring_refresh first.
4. Run MANUAL SQL: SELECT * FROM pipeline_locks ORDER BY rowid DESC LIMIT 20; confirm AUTO_SCORING_REFRESH_V1 is not stuck RUNNING after completion.
5. Run MANUAL SQL: SELECT slate_date,candidate_status,prop_family,COUNT(*) AS rows_count,MAX(updated_at) AS newest_updated_at FROM score_candidate_board GROUP BY slate_date,candidate_status,prop_family ORDER BY slate_date DESC,candidate_status,prop_family;
6. Main UI: tap Refresh Candidate Board. HITS/TOTAL_BASES goblin/demon OVER legs should no longer be blocked only because the sportsbook score row was standard.
7. Run DATA REFRESHING > Schedule Cascade full chain only after the scoring-only check passes.
