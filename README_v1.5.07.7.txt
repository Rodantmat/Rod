AlphaDog v1.5.07.7 - One-Shot Clock Plan Gate

Surgical patch for one-shot Production Clock scheduling.

What changed:
- Added Control Room button: DATA REFRESHING > Create One-Shot Full Run +5 Min.
- Button inserts a one-time row into data_refresh_schedule_plan with schedule_kind='once'.
- The one-time row uses the same full backend cascade job list as the scheduled intraday full runs:
  everyday_phase1, weather_roof, lineup_context, prizepicks_board, prizepicks_context, odds_api_morning, odds_api_afternoon, scoring_refresh.
- The minute cron picks it up from data_refresh_schedule_plan when due, exactly like the 9AM / 1PM / 10PM schedule path.
- No manual queue tick is required after creating the one-shot plan.
- One-shot schedule rows auto-delete after the queued chain reaches terminal state.
- Preserves pending eligibility recovery behavior from the previous stable gate.
- Preserves v1.5.07.5 scoring completion reaper behavior.

Exact test sequence:
1. Deploy this ZIP.
2. Open Control Room.
3. Do not click Run Queue Tick.
4. In DATA REFRESHING • PRODUCTION CLOCK ORCHESTRATOR, click Create One-Shot Full Run +5 Min.
5. Confirm output status is one_shot_full_backend_run_scheduled and note the plan_key / due_pt.
6. Wait at least 6 minutes.
7. Click Production Clock Status.
8. Confirm the one-shot plan either enqueued or is gone after terminal completion.
9. Run Manual SQL if needed:
   SELECT * FROM data_refresh_schedule_plan WHERE plan_key LIKE 'one_shot_full_backend_run_%' ORDER BY created_at DESC LIMIT 10;
   SELECT chain_id, job_key, status, tick_count, started_at, finished_at, updated_at, error FROM data_refresh_queue ORDER BY datetime(created_at) DESC, sequence_order LIMIT 30;
10. Passing behavior: cron creates/advances a normal full backend cascade without manual ticks, and the one-shot schedule row auto-deletes after the chain is terminal.
