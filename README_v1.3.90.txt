AlphaDog v1.3.90 - Orchestrator Cascade Gate Repair

Scope:
- Repairs the production/manual refresh orchestrator after v1.3.89 testing.
- Prevents downstream cascade jobs from running while the prior job is still pending with run_after NULL.
- Removes Sleeper Board and Sleeper Morning Window from the data-refresh orchestrator catalog; Sleeper remains manual/feed-driven only.
- Makes PrizePicks Board dispatch/waiting pass when mlb_stats is freshly updated after the dispatch.
- Keeps PrizePicks Context gated behind confirmed board freshness.
- Prevents duplicate active Phase 2C run rows for the same board timestamp.
- Separates normal cron progress ticks from true retry attempts with tick_count/retry_count columns.
- Compacts queue output_json so Orchestrator Status is smaller and easier to read.

Expected manual full refresh path:
Everyday Phase 1 -> Weather/Roof -> Lineup/Scratch -> PrizePicks Board -> PrizePicks Context -> Odds API -> Scoring Board.
Sleeper does not run in this cascade.

Deploy test:
1. Deploy.
2. Run DEBUG > Health and confirm v1.3.90.
3. Run DATA REFRESHING > Init Clock.
4. Run DATA REFRESHING > Orchestrator Status.
5. Start cascade from Everyday Phase 1.
6. Confirm Sleeper jobs are not enqueued and pending downstream jobs stay gated until the prior job completes.
