ALPHADOG v1.2.94 - Phase 1 Route Repair

Patch scope:
- Fixes Everyday Phase 1 routing bug.
- Schedule Baseline Test, Run Baseline Tick, Check Baseline, and Run Direct Baseline now route to deterministic internal functions before generic prompt/Gemini fallback.

Root cause:
- v1.2.93 registered Phase 1 jobs with prompt:null but did not add executeTaskJob routes.
- Those jobs fell through to runJob and threw: Missing prompt filename.

Files included:
- worker.js
- control_room.html

Test order:
1. DEBUG > Health
2. Everyday Phase 1 > Schedule Baseline Test
3. Everyday Phase 1 > Run Baseline Tick repeatedly until completed
4. Everyday Phase 1 > Check Baseline
