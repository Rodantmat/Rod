AlphaDog v1.5.04.5 - Dispatch Observation Hard Gate

Patched from the user-provided v1.5.04.4 package.

Purpose:
- Keep PrizePicks Board certification audit-only.
- Keep GitHub run visibility diagnostic-only.
- Fail fast if the Worker dispatch is accepted but no workflow_dispatch run is visible after 240 seconds.
- Prevent the orchestrator from sitting in a long fake board wait when GitHub never actually starts the scraper workflow.

Expected hard-fail code when dispatch is not observed:
github_workflow_dispatch_not_observed

This means the next fix is GitHub dispatch target, workflow file/ref, token permission, repo permission, or Actions configuration.
