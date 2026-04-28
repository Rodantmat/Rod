AlphaDog v1.2.70 - Persistent Miner

Purpose:
- Keep one-shot background Full Run for now. It is temporary and must be removed later after scheduler/miner reliability is fully proven.
- Add persistent backend mining cadence so raw factor queue mining continues without iPhone/Safari loops.

Core behavior:
- scheduled() keeps the one-minute one-shot Full Run poller only for deferred Full Run requests.
- Adds */2 * * * * persistent Auto Miner cron.
- Auto Miner remains slate-locked with BOARD_QUEUE_AUTO_MINE|YYYY-MM-DD.
- Auto Miner mines one under-mined family per invocation, one row at a time, within the existing 20-second cutoff.
- RETRY_LATER rows respect retry backoff of retry_count * 5 minutes.
- Retry cap is 5 attempts.
- ERROR rows are not reset automatically by scheduled mining.
- Manual Auto Mine button now runs one short server batch only; no long Safari loop.
- No scoring, no ranking, no factor expansion, no old duplicate cleanup.

Expected timing from current 2026-04-28 queue state:
- About 272 pending rows before this build.
- At 1-2 rows per 2-minute miner run, check after 30 minutes for progress, 2 hours for strong progress, 5-7 hours for likely near-complete, 9-10 hours conservative completion.

First tests:
1. DEBUG > Health should show v1.2.70 - Persistent Miner.
2. Verify wrangler.jsonc has */2 * * * *.
3. Wait 10-15 minutes, then check task_runs for scheduled board_queue_auto_mine successes.
4. Check queue health; pending should fall and completed should rise.
