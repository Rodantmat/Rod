AlphaDog Main UI v1.0.25 - Sleeper May-Date Auto Rescore Queue

Target: Main UI worker only. This patch is for the Sleeper Feed menu path.

Fixes included:
- Sleeper Feed now parses explicit month/day labels such as "May 7 9:35AM" into the correct slate_date, instead of falling back to PT today.
- Weekday labels such as "Thu 9:35AM" remain supported.
- Regular RBI 0.5 rows with valid fields are saved as parsed and receive CERTIFIED_BOARD_PRESENT market signals.
- More-only rows remain stored but are not certified for Under selection.
- After a successful certified Sleeper ingest, the Main UI writes a deferred_full_run_once request so the scheduled backend cron can rescore/restore the board.
- Sleeper Feed success message now tells the user that legs were ingested/certified and to wait the returned estimated minutes for the new scored board.

Do not use this package for the scheduled backend/control room worker. Deploy it only to the Main UI worker that contains the Sleeper Feed menu.
