AlphaDog Main UI v1.0.13 - Candidate Board Read-Only Repair

Worker: main-alphadog-ui-v100
Base: v1.0.12 - RBI Menu Source Badges

Surgical changes only:
- Main board now reads score_candidate_board as the release/read model.
- Main board no longer falls back to active_score_board for user-facing release rows.
- Requested empty/tomorrow slate now falls back to the latest candidate-board slate with released rows.
- Primary board filters to candidate_status QUALIFIED / PLAYABLE / WATCHLIST.
- DEFERRED_UNPICKABLE rows stay out of the primary UI board.
- RBI is enabled by default because current release board is RBI-heavy.
- RBI screen is now a read-only RBI Under release view using backend scores, not browser scoring heuristics.
- PrizePicks goblin/demon UNDER rows are blocked from display if encountered during hydration.
- Admin refresh is read-only/disabled in Main UI; backend refresh/scoring must be run from scheduled backend Control Room.
- Visible version labels were bumped and matched.

Preserved:
- Main UI worker remains separate from scheduled backend/control room.
- No cron.
- No scheduled handler.
- No Gemini calls.
- No scoring math changes.
- No D1 writes from Main UI.
- No Control Room / prop-ingestion-git code touched.
- Existing 15-minute pickability start gate preserved.
- Existing layout preserved except labels/text needed for read-only board behavior.

Deploy:
1. Deploy only to main-alphadog-ui-v100.
2. Do not deploy this ZIP to prop-ingestion-git.
3. After deploy, open /main_alphadog_health and confirm version v1.0.13 - Candidate Board Read-Only Repair.
4. Confirm health shows read_only_release_board=true and source_table=score_candidate_board.
5. Open root UI and confirm version label v1.0.13 - Candidate Board Read-Only Repair.
6. Confirm Board loads current candidate rows from score_candidate_board.
7. Confirm RBI rows show by default.
8. Confirm deferred/unpickable rows are not on the primary board.
9. Open RBI menu and confirm it is a read-only backend-scored RBI Under release view.
10. Open Admin and confirm Refresh Board Status does not start backend mining/scoring.
