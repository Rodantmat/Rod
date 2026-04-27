OXYGEN-COBALT Main-1N.2 "Parser Pixie Progress"

Purpose:
- Surgical parser fix for short-alias drift.
- Adds Screen 2 retrieval progress bar/status field in the existing header text slot.
- Preserves working UI, packet/score wiring, Gemini endpoint, scheduled backend separation, and scoring placeholder.

Version stamps:
- Frontend: v13.78.08 (OXYGEN-COBALT) • Main-1N.2 Parser Pixie Progress
- Worker: alphadog-main-api-v100.9 - Main-1N.2 Parser Pixie Progress

Parser fixes:
- Stops TB team abbreviation from parsing as Total Bases.
- Stops More from parsing as ER / Earned Runs Allowed.
- Uses exact prop-line matching first, especially after the numeric line.
- Keeps supported prop aliases intact.
- Fixes @ CLE opponent parsing at the start of a matchup line.

Progress UI:
- Replaces the old global helper sentence with a progress bar/status panel.
- Shows current retrieval task.
- Shows success/error state briefly before moving to the next task.

Untouched:
- No scheduled backend/control room changes.
- No scoring changes.
- No Gemini prompt text changes.
- No endpoint architecture changes.
- No layout redesign.
