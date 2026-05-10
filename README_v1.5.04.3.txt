AlphaDog v1.5.04.3 - GitHub Run Visibility Gate

MAIN PRODUCTION ONLY. Do not use for expansion, POTD, or Main UI work.

Purpose:
- Keep PrizePicks Board certification audit-only.
- Do not certify from mlb_stats updated_at, existing rows, or generic freshness.
- Add GitHub Actions run visibility after workflow dispatch so failures distinguish:
  1) audit-certified success,
  2) scraper/workflow failed,
  3) workflow completed but did not write mlb_stats_refresh_audit,
  4) dispatch accepted but no workflow_dispatch run was observed,
  5) real timeout.
- Fix Control Room Orchestrator Status so it does not retry just because old queue/log text contains 503/cancelled/zero inserted. Status is read-only.

Required deployment files:
- worker.js
- control_room.html
- main.py
- scrape.yml
- wrangler.jsonc
- package.json

Important:
main.py and scrape.yml must be committed/deployed to the configured GitHub repository/workflow path. Cloudflare Worker deployment alone does not update GitHub Actions scraper files.
