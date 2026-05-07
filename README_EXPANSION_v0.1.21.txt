AlphaDog Expansion v0.1.21 - Score Table Context Column Fix

Purpose:
Fixes the Cloudflare D1 per-invocation API request failure during Phase 1 context build.

Change:
- Replaced per-row context lookups with set-based INSERT...SELECT builders.
- Keeps all writes isolated to xp_* tables.
- Does not mutate production scoring tables.
- One-button pipeline remains: schema -> refresh board -> bridge -> context -> score -> audit.

Test sequence:
1. Deploy this build.
2. Open Expansion Control Room.
3. Click RUN PHASE 1 FULL PIPELINE.
4. Copy the full output.

Expected:
- build_context should return ok=true.
- builder_mode should show SET_BASED_NO_PER_ROW_D1_LOOP.
- Pipeline should continue into build_score and score_audit.
