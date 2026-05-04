AlphaDog v1.3.89 - Production Refresh Clock Orchestrator

Scope:
- Adds database-backed production refresh schedule table.
- Minute cron remains the only Cloudflare cron.
- Worker checks DB schedule/queue and runs one safe queued job at a time.
- Static weekly refresh: Monday 12:30 AM PT.
- Incremental true-delta refresh: daily 1:30 AM PT.
- Intraday cascades: daily 9:00 AM, 1:00 PM, and 10:00 PM PT.
- Intraday includes Everyday Phase 1, Weather/Roof, Lineup/Scratch, PrizePicks Board, PrizePicks Context, Odds API, and Scoring Board.
- Sleeper board remains manual and is intentionally excluded.

Safety:
- No overlapping refresh queues.
- Active queue blocks new due scheduled plan until the next minute.
- Static and incremental no longer run through legacy direct minute branches.
- Scheduled work is enqueued into data_refresh_queue.
- Production schedule is stored in data_refresh_schedule_plan.
