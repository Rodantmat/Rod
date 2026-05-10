AlphaDog v1.5.04.4 - Public GitHub Visibility Fallback

Purpose:
- Preserve strict PrizePicks audit-only certification.
- Do not certify from mlb_stats updated_at or generic freshness.
- Improve GitHub Actions visibility when scheduled cron/tick context cannot read GITHUB_TOKEN even though dispatch succeeded.
- Reuse prior dispatch repo/workflow/ref metadata and attempt public/unauthenticated GitHub run lookup when token is unavailable.
- Keep lane locked while waiting for mlb_stats_refresh_audit.

Expected statuses:
- board_refresh_certified_by_audit
- board_refresh_certified_by_post_dispatch_audit
- github_workflow_failed_before_audit
- github_workflow_completed_without_audit
- github_workflow_dispatch_not_observed
- PRIZEPICKS_BOARD_REFRESH_TIMEOUT

Deploy all files in this ZIP.
