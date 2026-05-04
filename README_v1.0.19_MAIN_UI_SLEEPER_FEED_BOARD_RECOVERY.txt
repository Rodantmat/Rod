AlphaDog Main UI v1.0.19 - Sleeper Feed Board Recovery

Files included:
- index.html
- main_alphadog_worker.js
- main_alphadog_wrangler.jsonc
- main_alphadog_package.json
- image assets

Changes:
- Added menu item: Sleeper Feed.
- Added Sleeper Feed screen with paste box, Save button, and status output.
- Save always replaces the current Sleeper RBI/RFI board with the pasted block.
- No slate prompt, no preview, no confirmation.
- Parses lines formatted as: Player - TEAM - OPP - Mon 6:40pm - RBI - 0.5 - regular/more only.
- Infers the actual PT date from the weekday/time in each line.
- Stores current rows in sleeper_rbi_rfi_board.
- Regenerates sleeper_rbi_rfi_market_signals.
- More-only rows are stored but not marked usable for Under.
- Board read path still uses score_candidate_board and keeps the UI start-time safety gate.
- TEAM_NAMES is defined in both worker and UI to prevent the previous crash.

Test sequence:
1. Deploy this Main UI worker/files.
2. Open Main UI and confirm visible version v1.0.19.
3. Open menu > Sleeper Feed.
4. Paste the full Sleeper block.
5. Tap Save Sleeper Feed.
6. Status should show parsed/saved counts and any parse errors.
7. Run backend/control-room scoring refresh if you need the candidate board rebuilt from the new Sleeper feed immediately.
