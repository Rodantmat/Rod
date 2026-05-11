AlphaDog v1.5.07.6 - Pending Eligibility Recovery Gate

Purpose:
Surgical patch after v1.5.07.5.

Root cause fixed:
The stale-pending/null-run recovery was allowed to judge downstream cascade rows by original queue created_at age. That falsely treated rows as stale even when they had only just become eligible after upstream completion.

Patch:
- Pending/null-run rows are never failed because of original queue age.
- Recovery now checks cascade eligibility first.
- If upstream is still pending/running, the row is skipped as not eligible.
- If required upstream failed, the row is blocked only when the dependency relationship requires blocking.
- If upstream is clear and the row has been eligible for at least 120 seconds, the row is requeued by setting run_after=CURRENT_TIMESTAMP.
- Eligible stale rows are requeued, not failed.
- Scoring Completion Reaper from v1.5.07.5 is preserved.

Expected result:
Downstream rows such as Weather/Roof, PrizePicks Board, Odds API Morning, and Scoring Board should not be falsely failed just because they were created early in the cascade and waited behind a long upstream job.

Known separate issue:
Missing ODDS_API_KEY remains a real config failure and is not masked by this patch.
