AlphaDog Derived Context Safe-Safe Patch

Adds deterministic zero-subrequest derived context:
- game_context_current auto-created by worker
- park factors / roof / altitude from static manifest
- implied totals shell from existing markets
- bullpen fatigue score from existing bullpen feed
- lineup count/status from existing lineup feed

New Control Room:
- Run Derived Metrics
- Derived Metrics
- Park Context Audit
- Feed Readiness

FULL RUN now runs Derived Metrics after Recent Usage.

No migration required.
Do not replace config.txt.

Test:
1. CLEAN > Full
2. SCRAPE > FULL RUN
3. CHECK > Derived Metrics
4. CHECK > Park Context Audit
5. CHECK > Feed Readiness
6. CHECK > Final Feed Audit
