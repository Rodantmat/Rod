AlphaDog / OXYGEN-COBALT
v1.5.07.3 - Phase1 Continuation Hard Gate Verified

This build is the verified replacement for the bad/mislabeled v1.5.07.2 delivery.

Fix locked in this build:
- Queue-owned Everyday Phase 1 is treated as a resumable child-runner.
- If the Worker dies mid-child-step, the single-lane orchestrator can continue the locked everyday_phase1 job on the next tick.
- Queue-owned everyday_phase1 no longer uses the old direct wrapper that could run too long and strand the parent queue as RUNNING with null output_json.
- The queue path advances one bounded child step per tick.

Expected post-deploy version:
v1.5.07.3 - Phase1 Continuation Hard Gate Verified

Critical test:
Use DATA REFRESHING > Run One Queue Tick after deployment. The returned version must match this README exactly.
