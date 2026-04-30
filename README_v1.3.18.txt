AlphaDog v1.3.18 - Phase 3 Multi-Wave Window Runner

Purpose:
- Fix Phase 3A/3B throughput bottleneck caused by single_mining_wave_limit_1.
- Keep no-parallel locks and Gemini governor.
- Allow multiple bounded mining waves per tick when safe.
- Increase auto-mine ceiling to 12 rows per wave so backend-prefill rows can clear faster.
- Keep runtime cutoff protection.
- Increase Phase 3 global lock stale window to 8 minutes to avoid premature lock release during slow Gemini/API calls.
- When stale lock recovery happens, mark orphan task_runs as STALE_RESET and reset matching deferred request to PENDING instead of leaving dirty running rows.

No scoring changes.
No market expansion.
No UI redesign.
No destructive data cleanup.

Post-deploy checks:
1. DEBUG > Health must show v1.3.18 - Phase 3 Multi-Wave Window Runner.
2. Run Phase 3 tick or let scheduler continue.
3. Confirm task output action_taken starts with multi_wave_mining_limit_.
4. Confirm completed rows increase faster than the single-wave build.
5. Confirm no duplicate queue_id rows in board_factor_results.
