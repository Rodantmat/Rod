AlphaDog/OXYGEN-COBALT v1.4.23 - Goblin Demon Pickability Bridge

Purpose:
Surgical backend patch for the main production scheduled worker.

Root issue fixed:
The score_candidate_board had strong Hits/Total Bases sportsbook scores, but they were being marked DEFERRED_UNPICKABLE because the PrizePicks pickability gate loaded rows only by exact slate_date. PrizePicks rows had rolled to the next slate_date while their start_time was still the active current slate. This made pp_rows_checked = 0 and blocked the Main Board.

Patch:
- loadPickabilityContext now loads active, current, non-stale PrizePicks rows by:
  1. exact slate_date match,
  2. start_time date matching the scoring slate,
  3. active future start_time rows.
- Goblin/demon PrizePicks rows validate OVER/MORE only.
- Goblin/demon rows never validate UNDER.
- Exact player/stat/line/team/opponent checks are preserved.
- RBI/Sleeper behavior is unchanged.
- Scoring math is unchanged.
- Odds API is unchanged.
- Gemini is unchanged.
- Main UI is unchanged.

Expected result after deploy:
Run DATA REFRESHING > Schedule Cascade with only Scoring + Candidate Board, or run the full cascade if needed.
Then the main board should have Hits/Total Bases candidates when PrizePicks has matching active goblin/demon/standard rows.

Required test sequence:
1. Deploy this ZIP to alphadog-phase3-starter-groups.
2. Open Control Room > DEBUG > Health.
3. Confirm version is v1.4.23 - Goblin Demon Pickability Bridge.
4. Run DATA REFRESHING > Schedule Cascade.
5. Select only Scoring + Candidate Board if the latest PrizePicks board and Odds API already completed.
6. Wait for completion.
7. Run Manual SQL:

SELECT
  slate_date,
  candidate_status,
  prop_family,
  COUNT(*) AS rows_count,
  MAX(updated_at) AS newest_updated_at
FROM score_candidate_board
WHERE slate_date = '2026-05-08'
GROUP BY slate_date, candidate_status, prop_family
ORDER BY candidate_status, prop_family;

8. Expected: Hits and/or Total Bases should no longer be all DEFERRED_UNPICKABLE if matching active PrizePicks rows exist.
9. Refresh Main UI Candidate Board.
10. Main Board should show non-RBI legs when filters allow them.
