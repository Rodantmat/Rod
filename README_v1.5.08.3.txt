AlphaDog v1.5.08.3 - Schedule Scanner Restore Gate

Purpose:
- Restore the Production Clock schedule scanner so the 9AM / 1PM / 10PM PT plans are evaluated by the minute cron.
- Prevent exact-minute schedule misses caused by cleanup/tick delay, Worker timing, or a slow prior step.
- Preserve v1.5.08.2 PrizePicks completion reaper behavior.

Patch details:
- Added productionPlanDueInfo() with exact-slot plus catch-up eligibility.
- Daily/weekly schedule plans use a 30-minute catch-up window.
- One-shot schedule plans use a 180-minute catch-up window.
- Due keys are anchored to the scheduled PT slot, not the later catch-up minute.
- enqueueDueProductionRefreshPlans() now logs production_clock_schedule_scan every minute.
- The scanner output now includes evaluated_plans, due_plan_keys, due_count, PT time, and enqueue results.

Expected behavior:
- Cron continues firing every minute.
- At 10:00 PM PT, or within the catch-up window, intraday_full_2200_pt enqueues once with key intraday_full_2200_pt|YYYY-MM-DD|2200.
- If a due slot is missed by a slow cleanup/tick, the next few minute ticks still catch it.
- PrizePicks board dispatch/completion logic remains unchanged from v1.5.08.2 except for version label propagation.
