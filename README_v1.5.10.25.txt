AlphaDog / OXYGEN-COBALT Build
Version: v1.5.10.25 - Incremental Continuation Release Gate

Purpose:
Surgical follow-up to v1.5.10.24. v1.5.10.24 fixed the incremental metrics source-of-truth bug, but live testing showed the incremental parent could stay RUNNING while the child stayed in stage_delta_logs and stale recovery repeatedly requeued continuation rows.

Changes:
- Preserve the v1.5.10.24 metrics coverage fix.
- Reduce orchestrator-owned incremental continuation work to a smaller bounded batch.
- Pass max_games explicitly into the delta game-log staging path.
- Make stage_delta_logs respect max_games or max_players instead of defaulting to 8 games per request.
- This is intended to let the parent return partial_continue, release the global lock, and requeue cleanly instead of timing out and requiring stale recovery.

Not changed:
- No secrets changed.
- No Cloudflare bindings changed.
- No cron config changed.
- No worker name changed.
- No Main UI / Expansion / POTD work.
- No protected data wipe.

Test focus:
Run Incremental Daily again. The parent should not sit RUNNING for 20+ minutes. It should either release pending between ticks or complete. Final metrics coverage must be verified separately.
