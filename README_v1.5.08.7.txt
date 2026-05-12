AlphaDog/OXYGEN-COBALT v1.5.08.7 - Scoring Partial Propagation Gate

Scope: production scheduled backend only.

Surgical fix over v1.5.08.6:
- Preserves the scoring durability/chunk checkpoint writes from v1.5.08.6.
- Fixes the wrapper bug where SCORING_PARTIAL_CONTINUE was interpreted as refresh_job_failed.
- Propagates queue-owned scoring partial_continue back to the single-lane orchestrator as partial=true/status=SCORING_PARTIAL_CONTINUE.
- Keeps candidate board/export skipped until scoring reaches true terminal completion.
- Does not change scoring math.
- Does not touch Main UI, PrizePicks board/context, odds, or normal cascade architecture.

Expected behavior:
- scoring_refresh can remain pending across several minute ticks while durable score tables grow.
- GLOBAL lock should release between chunks.
- Queue must not fail on SCORING_PARTIAL_CONTINUE.
- Completion must require durable output/candidate board verification.
