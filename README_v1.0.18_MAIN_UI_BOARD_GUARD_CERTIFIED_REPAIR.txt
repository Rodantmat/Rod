v1.0.18 - Main UI Board Guard Certified Repair

Patch target: Main UI only. Scheduled backend/scoring math untouched.

Fixes:
- Defines TEAM_NAMES client-side alias to eliminate the board crash.
- Keeps candidate-board start-time safety gate: started, inside-15-minute, and unknown-start rows are hidden.
- Restores Admin > Refresh Full Data as a direct deferred_full_run_once scheduler request for next backend cron tick.
- Keeps Board > Refresh Candidate Board read-only against prepared score_candidate_board release rows.
- Syncs index.html and worker embedded INDEX_HTML to the same version.

Deploy only the Main UI worker/files.
