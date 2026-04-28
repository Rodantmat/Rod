AlphaDog v1.2.66 - Pipeline Lockstep

Purpose:
- Make the real scheduled/full-run path keep moving until all raw board data is mined.
- Stop hard-failing the full run just because MLB has true TBD/projected-unavailable one-sided starters.
- Preserve reusable manually/Gemini-filled missing starter rows when the slate is refreshed.
- Keep PrizePicks board table untouched.

Surgical changes:
1. Full Run now snapshots reusable missing-starter overrides before slate refresh.
2. Full Run restores those overrides after MLB API starter sync.
3. Missing starter fallback now runs in lockstep with restore/retry/wait sequencing.
4. Starter gaps are warning-state when unresolved after repair, not a full-run blocker.
5. Full Run runs bounded raw-mining waves and reports continuation instead of pretending everything can finish in one HTTP request.
6. Scheduled handler remains the real path: each schedule continues unfinished queue mining and retries flagged/raw rows.
7. Old board queue/result slates are cleaned except the current slate; PrizePicks board data is preserved.

Expected behavior:
- FULL RUN can return SUCCESS_WITH_CONTINUATION_WARNINGS when starters are partial or mining remains pending.
- That is acceptable and expected while raw mining continues over scheduled passes.
- Queue ERROR/RUNNING rows are repaired/retried by future scheduled/full-run cycles.

Correct test buttons:
1. DEBUG > Health
2. SCRAPE > FULL RUN
3. CHECK > MLB Data Coverage Today
4. CHECK > Board Queue Health
5. CHECK > Board Factor Results
6. CHECK > Scheduler Log
7. CHECK > Recent Failures

Success target:
- Full Run should no longer fail only because starters are 26/30.
- board_factor_queue should stay at 202 for the current board.
- board_factor_results should keep increasing across scheduled/manual runs.
