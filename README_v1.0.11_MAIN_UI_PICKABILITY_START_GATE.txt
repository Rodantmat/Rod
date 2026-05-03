AlphaDog Main UI v1.0.11 - Pickability Start-Time Gate

Surgical changes only:
- Uses v1.0.10 as the current/latest main UI base provided in 2.zip.
- Adds a hard 15-minute pickability start-time gate to the main board response.
- Started games and legs inside 15 minutes to start are excluded from the user-facing board.
- Adds client-side backup filtering for the same 15-minute start gate.
- Updates the admin full-refresh alert to tell the user to wait 30-35 minutes.
- Keeps the main UI worker read-only except for the existing direct deferred refresh request insert.
- No scheduled handlers, no scraping, no scoring, no Gemini, no UI redesign.

Backend baseline expected: v1.3.59 - Minute Cron Full Refresh Scheduler.
