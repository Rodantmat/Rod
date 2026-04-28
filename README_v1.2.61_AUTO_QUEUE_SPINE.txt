AlphaDog v1.2.61 - Auto Queue Spine

Fixes:
- Adds SCRAPE > Board Queue Auto Build.
- Scheduled Board Queue Pipeline now uses the auto builder.
- Auto builder fills all queue families: A, D, game bullpen, weather, news.
- Queue build uses lightweight payloads and hydrates full context at mining time to avoid repeated manual clicking and Cloudflare/D1 pressure.

Test order:
1. DEBUG > Health
2. CHECK > Board Queue Health
3. SCRAPE > Board Queue Auto Build
4. CHECK > Board Queue Health

Expected:
- board_queue_auto_build returns build_complete=true when all desired families exist.
- If it returns needs_continue=true, run SCRAPE > Board Queue Auto Build one more time only.
- Do not keep pressing the old Board Queue Build unless manually debugging one slice.

Important buttons:
- SCRAPE > Board Queue Auto Build = preferred queue builder.
- SCRAPE > Board Queue Build = old manual fallback.
- CHECK > Board Queue Health = verification.
