AlphaDog Control/Scheduled Worker v1.3.51 - Main UI Admin Refresh Bridge

Adds routes only; existing control-room tasks stay intact.

New routes:
POST /main-ui/admin-refresh/start
GET /main-ui/admin-refresh/status

Secrets needed on the control/scheduled worker for PrizePicks GitHub workflow dispatch:
GITHUB_TOKEN
GITHUB_OWNER
GITHUB_REPO
GITHUB_WORKFLOW_FILE

Defaults if owner/repo/workflow are not set: Rodantmat / Rod / scrape.yml.
