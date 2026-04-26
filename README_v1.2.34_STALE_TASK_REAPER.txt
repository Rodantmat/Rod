AlphaDog v1.2.34 - Stale Task Reaper

Surgical change only:
- Daily Health now reaps task_runs rows stuck in status=running for more than 30 minutes.
- Reaped rows are marked status=stale, finished_at=CURRENT_TIMESTAMP if missing, and error contains the stale-task reaper note.
- Daily Health returns scheduled.stale_reaper plus summary.stale_reaped and summary.stale_reaper_ok.
- Existing table checks are preserved.
- RFI/RBI/Hits candidate logic unchanged.
- RFI regression logic unchanged.

Expected test:
1. Daily Health for 2026-04-25 should return ok=true/status=pass after stale rows are reaped.
2. RFI Regression x3 should still return ok=true/final=pass/regression.complete=true/12 checks.
