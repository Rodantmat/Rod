AlphaDog v1.2.65 - Scheduler Miner Spine

Surgical fixes only:
- Worker and UI version locked to v1.2.65 - Scheduler Miner Spine.
- Scheduled handler now runs slate prep, board queue auto build, and one Cloudflare-safe Board Queue Auto Mine Raw batch.
- Full Run now includes board queue auto build + raw mining batch so scheduled runs keep advancing raw factor mining.
- Auto mining retries transient/API rows up to 3 row-level attempts, then flags the row ERROR with last_error instead of silently looping or dropping it.
- Scheduled/full-run mining calls retry_errors=true, resetting flagged rows for the next scheduled retry wave.
- Old board queue/result rows from other slates are purged during Full Run; current slate queue/results are preserved so mining can continue instead of restarting.
- Miner Pulse disappears when any non-auto-miner task starts.
- No prop scoring, no ranking, no candidate scoring changes.

Suggested Cloudflare cron alignment:
- Run this worker scheduled handler after PrizePicks scrape windows, not before.
- Multiple scheduled invocations are expected; each one advances another safe mining batch.
