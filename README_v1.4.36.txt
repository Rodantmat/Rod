AlphaDog v1.4.36 - PrizePicks Dispatch Fallback Guard

Purpose:
- Fixes the 10pm/full-cascade block where PrizePicks Board Refresh could stop the queue with missing_github_dispatch_secret even when usable current PrizePicks board rows already exist.
- The board refresh job now soft-passes and continues into Phase 2C when current future board rows are present.
- If GitHub dispatch config is missing AND no current future board exists, it still fails loudly because the system has no board source to continue with.

Preserved:
- v1.4.34 candidate publish fallback final behavior.
- v1.4.35 external-failure self-healing orchestrator behavior.
- Queue-owned scoring remains independent from AUTO_SCORING_REFRESH_V1.
- Volatile table overwrite/cleanup policy remains intact.

Deploy target:
- alphadog-phase3-starter-groups

Test sequence:
1. DEBUG > Health must show v1.4.36 - PrizePicks Dispatch Fallback Guard.
2. DATA REFRESHING > Schedule Cascade.
3. Wait for minute cron.
4. Query data_refresh_queue by chain_id and verify PrizePicks Board Refresh either completes via GitHub dispatch or soft-passes with board_refresh_soft_pass_existing_current_board.
5. Verify Phase 2C, Odds, and Scoring advance.
