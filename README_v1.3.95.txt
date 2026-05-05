AlphaDog v1.3.95 - Scoring No-Restart Guard

Patch focus:
- Keeps v1.3.94 startup guard and v1.3.93 HITS thin-market calibration.
- Prevents fresh RUNNING scoring runs from being superseded by browser retries/manual repeats.
- Auto-finalizes stale zero-progress scoring runs before starting a new one.
- Adds scoring loop progress updates every 25 groups so SQL can confirm whether the run is alive.

No scheduled backend scoring math outside the HITS thin-market patch is intentionally changed.
