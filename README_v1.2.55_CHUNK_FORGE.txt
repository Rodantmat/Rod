AlphaDog v1.2.55 - Chunk Forge

Purpose:
- Fixes Board Queue Build hitting Cloudflare single-invocation request limits.
- Board Queue Build is now chunked and Cloudflare-safe.
- No Gemini calls during queue build.
- No backend scoring, prop scoring, ranking, or candidate logic touched.

What changed:
- Board Queue Build no longer deletes/rebuilds every supported queue row in one request.
- It builds one small slice at a time.
- Larger player prompt families stay split at PLAYER_BATCH_2.
- Existing valid rows are preserved.
- Stale old PLAYER_BATCH_4 player queue rows are cleared only for the affected player queue families so the new 2-player queue can materialize cleanly.
- Uses INSERT OR IGNORE to protect against duplicate rows.

Expected behavior:
- Click Board Queue Build repeatedly until response says build_complete=true.
- Each click should return status partial until all queue slices are built.
- When complete, response returns status pass and build_complete=true.

Validation path:
1. DEBUG > Health
2. CHECK > Board Queue Health
3. SCRAPE > Board Queue Build
4. Repeat Board Queue Build until build_complete=true
5. CHECK > Board Queue Health
6. REPAIR > Board Queue Raw State
7. SCRAPE > Board Queue Mine One Raw
8. CHECK > Board Factor Results
9. CHECK > Board Factor Inspect
