AlphaDog Main UI v1.0.03 - Admin Freshness Console

Files are flat root files. Deploy with:
npx wrangler deploy --config main_alphadog_wrangler.jsonc

New main UI endpoints:
/main_alphadog_admin_status
/main_alphadog_admin_refresh

Main UI secrets needed for Refresh Full Data:
CONTROL_WORKER_URL
CONTROL_WORKER_INGEST_TOKEN (or existing INGEST_TOKEN)

Control worker must also be patched with v1.3.51 and GitHub secrets if PrizePicks workflow dispatch is desired.
