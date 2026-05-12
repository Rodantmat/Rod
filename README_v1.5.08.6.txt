AlphaDog v1.5.08.6 - Scoring Durability Continuation Gate

Scope:
- MAIN PRODUCTION scheduled backend / Control Room only.
- Surgical fix for scoring_refresh lifecycle/durability/finalization only.
- No scoring math changes.
- No PrizePicks board flow changes beyond version label retention of existing v1.5.08.5 behavior.
- No PrizePicks context changes.
- No Odds API changes.
- No Main UI changes.
- No Expansion or POTD changes.

Root issue confirmed by SQL:
- PrizePicks board recovery was fixed by v1.5.08.5 and completed request 6fa88ac1 with 5324 rows.
- PrizePicks context completed with 5324 active current rows for slate_date 2026-05-12.
- Odds API completed/certified.
- scoring_refresh then started request f14b4763-6924-4a6b-9e8a-ca9bda35f63d and became stuck RUNNING.
- scoring_runs claimed progress: rows_targeted=2627, rows_certified=1041, rows_promoted=1041, rows_active=441.
- Durable score/output tables were empty: mlb_scoring_scratchpad=0, mlb_hits_scores=0, mlb_rbi_scores=0, mlb_total_bases_scores=0, active_score_board=0, score_candidate_board=0.
- data_refresh_queue scoring_refresh had null output_json and no finish time.
- GLOBAL remained locked on scoring_refresh.

Fix summary:
1. Allows a locked scoring_refresh job to be continued by the orchestrator instead of waiting for the dynamic timeout.
2. Detects phantom scoring runs that claim promoted/active counters while durable output tables are empty, then fails them explicitly before retry.
3. Adds durable checkpoint writes during the scoring loop so counters only advance with persisted scoring rows.
4. Returns SCORING_PARTIAL_CONTINUE before request timeout so the queue releases the GLOBAL lane and resumes on the next cron tick.
5. Resumes queue-owned scoring from scoring_runs.details_json durable_group_index.
6. Final completion is truth-bound to real durable rows in mlb_*_scores and active_score_board.

Expected behavior after deploy:
- The current stuck scoring_refresh row should be continued or requeued by the minute cron.
- The old phantom scoring run should be failed if it still has counters but no durable output.
- A new/resumed scoring run should write durable score rows in chunks.
- scoring_refresh may show partial_continue for multiple ticks; that is healthy.
- Final completion should only occur after real rows exist in active_score_board and the score tables.
- score_candidate_board should populate only after scoring finalizes successfully.
