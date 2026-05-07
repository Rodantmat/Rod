AlphaDog Expansion v0.1.22 - Phase 2 Readiness Gate

Purpose:
Move beyond Phase 1 without creating fake Phase 2 picks. Adds a one-button Phase 2 readiness gate for Singles, Doubles, and Home Runs.

Change:
- Adds RUN PHASE 2 READINESS GATE in the Expansion Control Room.
- Auto-runs schema, board refresh, Phase 2 bridge, bridge diagnostics, and Phase 2 data-readiness audit.
- Writes only xp_* tables.
- Does not mutate production scoring tables.
- Does not score Singles/Doubles by proxy because current incremental metrics do not certify native singles/doubles columns.
- Marks Home Runs as ready for a basic power-context scaffold when PA and HR totals exist.

Test sequence:
1. Deploy this build.
2. Open Expansion Control Room.
3. Click RUN PHASE 2 READINESS GATE.
4. Copy the full output.

Expected:
- ok should be true.
- build_bridge_phase2 should return matched rows and zero/low unmatched.
- final_readiness.score_created should be false.
- Home Runs should show READY_FOR_PHASE2_SCORE_SCAFFOLD when power context exists.
- Singles/Doubles should show NEEDS_NATIVE_COMPONENT_METRIC_BEFORE_SCORE unless native component data has been added.
