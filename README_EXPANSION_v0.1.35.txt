AlphaDog Expansion v0.1.35 - Alias Map Reset Fix

Expansion worker only. Hitter props only. Writes only xp_* tables. No production scoring/candidate-board mutation.

New: one-button RUN BRIDGE CONTEXT LOCK. It applies schema, refreshes the expansion board, builds strict game_id bridge rows for all expansion phases, writes xp_bridge_audit_current, and creates no new scoring.

Deploy command:
npx wrangler deploy --config wrangler.expansion.jsonc

Test sequence:
1. Open the Expansion Control Room.
2. Tap Button Self Test. Expect PASS.
3. Tap Auth Check. Expect HTTP 200.
4. Tap Health. Expect v0.1.35.
5. Tap RUN BRIDGE CONTEXT LOCK. Expect ok=true and final_bridge_audit summary.
6. Tap Bridge Counts. Confirm matched_rows equals rows_count or inspect unmatched/unsafe.
7. Tap Bridge Audit. Confirm no FAIL rows before moving to the next phase.
