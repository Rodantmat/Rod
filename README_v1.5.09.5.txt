AlphaDog / OXYGEN-COBALT
v1.5.09.5 - One-Shot Full Run Scheduler

Purpose
- Adds a repeatable Control Room button to schedule one temporary full Production Clock cascade about 2 minutes ahead.
- The button does not run a direct long request.
- The minute cron picks up the temporary one-shot schedule and enqueues the same full cascade path used by the 9AM / 1PM / 10PM Production Clock runs.
- After the one-shot plan is accepted into the queue, the temporary schedule row auto-clears. The queue chain owns success/failure after that.

New Control Room button
DATA REFRESHING • PRODUCTION CLOCK ORCHESTRATOR:
- Schedule One-Shot Full Run +2 Min

One-shot cascade jobs
- 02 Everyday Phase 1
- 03 Weather/Roof
- 04 Lineup/Scratch
- 05 PrizePicks Board
- 06 PrizePicks Context
- 07 Odds API Morning
- 08 Odds API Intraday
- 09 Scoring Board

Safety rules
- Only one active one-shot temporary plan can exist at a time.
- One-shot plans are stored in data_refresh_schedule_plan with schedule_kind='once'.
- If a one-shot is due but the single-lane orchestrator is busy, it waits for a later minute inside the one-shot catch-up window.
- Once the one-shot is accepted into data_refresh_queue, the temporary plan is deleted/cleared.
- Regular daily/weekly Production Clock plans are untouched.

Deployment
- Deploy this ZIP normally to prop-ingestion-git.
- No manual SQL migration is required; the Worker creates/uses the existing data_refresh_schedule_plan table.

Test sequence
1. Deploy v1.5.09.5.
2. Open Control Room.
3. Go to DATA REFRESHING • PRODUCTION CLOCK ORCHESTRATOR.
4. Click: Init Production Clock.
5. Click: Production Clock Status.
6. Confirm the version shows v1.5.09.5 - One-Shot Full Run Scheduler.
7. Click: Schedule One-Shot Full Run +2 Min.
8. Wait for the next 2-3 minute-cron ticks.
9. Click: Orchestrator Status.
10. Confirm queue rows appear for the normal full cascade chain.
11. Click: Production Clock Status.
12. Confirm no active one-shot plan remains after enqueue.
13. Let cron continue the chain. Use Orchestrator Status to watch progress.
