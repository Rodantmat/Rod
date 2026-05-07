AlphaDog Expansion v0.1.19 - Prop Definitions Reset Pipeline Fix

Purpose:
- Isolated expansion control room/worker.
- Reads existing prepared production data where safe.
- Writes only xp_* expansion tables.
- Does not mutate production scoring, candidate-board, scheduled backend, or Main UI tables.

Fixes in v0.1.19:
- Fixes the observed D1 error: NOT NULL constraint failed: xp_prop_definitions.complexity_tier.
- Safely resets only the isolated xp_prop_definitions table during Apply Schema, then recreates it with the current expansion schema.
- Keeps the one-button Phase 1 full pipeline route: /xp/phase1/run-all.
- Keeps Control Room button: RUN PHASE 1 FULL PIPELINE.
- The full pipeline auto-runs schema, board refresh, bridge build, bridge diagnostics, context build, context diagnostics, score build, score counts, and score audit.

Normal test sequence:
1. Deploy this Worker and Control Room.
2. Open the Expansion Control Room.
3. Click: RUN PHASE 1 FULL PIPELINE.
4. Copy the full output.

Individual buttons remain only for debugging.
