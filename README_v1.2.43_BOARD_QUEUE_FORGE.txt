AlphaDog v1.2.43 - Board Queue Forge

Surgical update from v1.2.42 Board Harvester.

What changed:
- Adds board_queue_preview task.
- Adds board_queue_build task.
- Adds board_factor_queue table creation inside the worker and as an optional migration file.
- Adds Board Queue Preview / Board Queue Build buttons.
- Adds Board Queue Health / Board Queue Sample SQL checks.

What did NOT change:
- No scoring logic.
- No Gemini calls.
- No candidate ranking.
- No existing UI/layout redesign.
- Combo lines remain deferred.

Purpose:
- Convert the validated PrizePicks board into safe queue rows for future backend factor mining.
- Player prompt queue rows are batched at 4 players per request.
- Game prompt queue rows are one game per request.
