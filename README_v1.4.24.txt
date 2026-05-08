AlphaDog/OXYGEN-COBALT v1.4.24 - Pickability Loader Hardening

Purpose
- Surgical production scheduled-backend patch from v1.4.23.
- Fixes the PrizePicks pickability loader so current active rows are loaded broadly and filtered in JavaScript instead of relying on SQLite datetime parsing or matching PrizePicks slate_date to scoring slate_date.
- Keeps goblin/demon as More-only pickability bridges. They can validate sportsbook OVER/MORE candidates for exact player/stat/line, but they never validate UNDER.
- Adds real scoring-refresh failure exposure so the orchestrator no longer hides internal scoring/candidate-board errors behind generic refresh_job_failed.

What changed
1. SYSTEM_VERSION bumped to v1.4.24 - Pickability Loader Hardening.
2. loadPickabilityContext now loads active/current/non-stale PrizePicks rows without SQL datetime filters, then applies JS pickability/start-time filtering.
3. Added JS slate/start-time helper for PrizePicks active row eligibility.
4. run_full_scoring_refresh_v1 now reports scoring_ok, candidate_board_ok, failure_stage, failure_error, and exception stack preview when applicable.
5. No scoring math, odds math, Gemini logic, external API logic, cron plan, static/incremental, everyday, weather, lineup, or Odds API fetch logic was changed.

Test sequence
1. Deploy this ZIP to Worker: alphadog-phase3-starter-groups.
2. Open Control Room.
3. Run DEBUG > Health and confirm version is v1.4.24 - Pickability Loader Hardening.
4. Do NOT run full cascade first.
5. Run DATA REFRESHING > Schedule Cascade with only Scoring + Candidate Board selected.
6. Run Manual SQL:

SELECT
  slate_date,
  candidate_status,
  prop_family,
  COUNT(*) AS rows_count,
  MAX(updated_at) AS newest_updated_at
FROM score_candidate_board
WHERE slate_date IN ('2026-05-08','2026-05-09')
GROUP BY slate_date, candidate_status, prop_family
ORDER BY slate_date DESC, candidate_status, prop_family;

7. Confirm HITS/TOTAL_BASES are no longer all DEFERRED_UNPICKABLE when exact PrizePicks goblin/demon More rows exist.
8. Refresh Main UI candidate board.
