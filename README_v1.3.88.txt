AlphaDog v1.3.88 - Incremental Daily Production Guard

Purpose:
Production hardening for unattended daily incremental delta refresh.

Changes:
- Keeps true-delta mode as the default when live incremental base is certified.
- Adds stale-delta rescue so valid active true-delta tails are not killed by the six-hour stale finalizer.
- Keeps the state machine self-sufficient through stage_delta_logs -> audit -> promote -> clean -> derived -> live certification -> completed.
- Refreshes Check Incremental Temp counts after reconcile/clean so completed runs show current temp state.
- Preserves INSERT OR REPLACE promotion only; no live deletion.
- Keeps final live certification as the completion gate.

Test sequence:
1. DEBUG > Health: confirm v1.3.88.
2. CERTIFY > Incremental Live Tables: expect A or A+.
3. Daily Incremental Temp > Schedule + Auto Start.
4. Confirm refresh_mode = delta.
5. Wait for minute cron; do not manually tick.
6. Daily Incremental Temp > Check Incremental Temp until completed.
7. CERTIFY > Incremental Live Tables: expect A or A+.
