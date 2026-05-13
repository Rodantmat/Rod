AlphaDog/OXYGEN-COBALT v1.5.10.1 - One-Shot Direct Pickup Rescue Gate

Purpose:
- Fixes the temporary one-shot full-run schedule pickup path.
- Keeps v1.5.09.9 production clock finalizer/killer cleaner intact.
- Adds robust schedule_kind='once' due detection using the one-shot plan_key PT date + hour/minute.
- Adds explicit one-shot skip reasons in production clock schedule scan diagnostics.
- Keeps the one-shot plan auto-clear behavior after accepted enqueue.

Surgical scope:
- worker.js production clock one-shot due detection only.
- control_room.html version tag only.
- main.py version tag only.

Do not use this build as a scoring/math change. It does not touch scoring, PrizePicks scraping, Odds API internals, Main UI, candidate board logic, or the killer cleaner reset rules.

Expected pass:
- DATA REFRESHING > Schedule One-Shot Full Run +2 Min creates a one_shot_full_run_* plan.
- The minute Production Clock marks that plan due at/after target PT minute.
- New rows appear in data_refresh_queue.
- data_refresh_schedule_plan removes the one-shot row after accepted enqueue.
- production_clock_schedule_scan evaluated_plans includes skip_reason for not-due plans.
