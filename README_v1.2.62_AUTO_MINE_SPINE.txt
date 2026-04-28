AlphaDog v1.2.62 - Auto Mine Spine

New button/job:
- Group: SCRAPE
- Button: Board Queue Auto Mine Raw
- Job: board_queue_auto_mine

Behavior:
- Preserves v1.2.61 Auto Queue Build.
- Runs a Cloudflare-safe batch of Mine One Raw operations per click.
- Default max per invocation: 5. Hard cap: 8.
- Stops on transient Gemini/API retry_later.
- Stops on hard validation failure.
- Stops when queue is empty.
- No prop scoring, no ranking, no candidate logic.

Test order:
1. DEBUG > Health
2. SCRAPE > Board Queue Auto Mine Raw
3. CHECK > Board Queue Health
4. CHECK > Recent Failures
