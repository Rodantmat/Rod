AlphaDog v1.4.32 - Queue Stale Killer Safe Publish

Purpose:
- Kill stale/dead scoring queue rows before they block new scoring requests.
- Keep Schedule Cascade fast: only metadata stale-row cleanup, enqueue, return.
- Stop queue-owned scoring from self-locking on AUTO_SCORING_REFRESH_V1.
- Safe-publish scoring: do not wipe active readable score board before replacement rows are written.
- Clean old selected-slate active rows only after successful new publish.
- Preserve volatile overwrite policy: temp tables are staging only; old non-selected volatile data is not retained.

Deploy:
1. Upload this flat ZIP to the production scheduled backend worker.
2. Run DEBUG > Health and confirm v1.4.32 - Queue Stale Killer Safe Publish.
3. In DATA REFRESHING, check only 09 Scoring Board.
4. Press Schedule Selected Only, not Cascade From First Checked, for the scoring-only test.
5. Wait 2-4 minute cron ticks.

SQL test 1 - latest scoring queue:
SELECT
  request_id,
  chain_id,
  job_key,
  status,
  error,
  started_at,
  finished_at,
  retry_count,
  updated_at,
  substr(output_json, 1, 2500) AS output_preview
FROM data_refresh_queue
WHERE job_key = 'scoring_refresh'
ORDER BY created_at DESC
LIMIT 5;

Expected:
- Old stale v1.4.29/v1.4.31 scoring row becomes cancelled.
- New v1.4.32 scoring row runs, then completes.
- No endless SCORING_LOCK_WAIT_RETRY_NEXT_TICK loop.

SQL test 2 - candidate board distribution:
SELECT
  slate_date,
  candidate_status,
  prop_family,
  COUNT(*) AS rows_count,
  MAX(updated_at) AS newest_updated_at
FROM score_candidate_board
GROUP BY slate_date, candidate_status, prop_family
ORDER BY slate_date DESC, candidate_status, prop_family;

SQL test 3 - main board candidates:
SELECT
  player_name,
  team,
  opponent,
  prop_family,
  line_type,
  line_number,
  line_direction,
  final_score,
  recommendation_status,
  confidence_grade,
  candidate_status,
  updated_at
FROM score_candidate_board
WHERE prop_family IN ('HITS','TOTAL_BASES')
  AND candidate_status IN ('QUALIFIED','PLAYABLE','WATCHLIST')
ORDER BY final_score DESC
LIMIT 25;
