AlphaDog v1.2.63 - Auto Miner Lock

Purpose
- Adds the visible SCRAPE > Board Queue Auto Mine Raw button to the control room.
- Bumps every internal version label to v1.2.63 - Auto Miner Lock.
- Keeps Board Queue Auto Build separate: it builds/materializes the queue only.
- Board Queue Auto Mine Raw mines pending raw factor rows in a Cloudflare-safe batch of up to 8 rows per click.

Testing order
1. DEBUG > Health
2. CHECK > Board Queue Health
3. SCRAPE > Board Queue Auto Mine Raw
4. CHECK > Board Queue Health

Expected
- Version: v1.2.63 - Auto Miner Lock
- Auto Mine returns job: board_queue_auto_mine
- completed_rows increases and pending_rows decreases.
