AlphaDog v1.3.05 - Phase 3A/3B Build-First Scheduler Test

Fixes v1.3.04 behavior where mining started as soon as any queue rows existed.

New behavior:
- Each tick first runs one queue-build pass.
- If the build pass inserts rows or reports remaining build work, the tick stops safely.
- Mining starts only after queue builder reports complete/no new rows.
- Mining remains bounded to one safe wave per tick.
- Global pipeline lock behavior remains unchanged.
- No scoring/final candidate ranking added.

Test:
1. Deploy.
2. Click PHASE 3A/3B > Run Full Run Tick repeatedly.
3. Confirm action_taken stays single_queue_build_pass until all queue families are materialized.
4. Then mining starts.
5. Check Full Run should show full queue population before mining completion.
