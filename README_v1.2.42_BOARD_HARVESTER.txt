AlphaDog v1.2.42 - Board Harvester

Scope: surgical control-room scheduled-backend update from v1.2.41 Board Sifter.

Changed:
- Keeps mlb_stats read-only board inspection.
- Adds supported single-player vs combo/deferred classification.
- Excludes combo player/team rows from needed-player and normalized-game prompt previews.
- Adds queue estimate for separated backend prompts:
  - A player role/recent/matchup
  - D advanced player/contact
  - B game/team/bullpen/environment
  - WEATHER game-level
  - NEWS/INJURY game-level
  - MARKET game/prop-family-level
- Adds Control Room buttons:
  - Board Classification
  - Board Queue Estimate

Preserved:
- No Gemini calls.
- No D1 writes.
- No schema changes.
- No scoring changes.
- No candidate logic changes.
- Existing Daily Health/RFI regression paths preserved.

Notes:
- Combo rows such as player_name containing '+' or team/opponent containing '/' are intentionally deferred.
- Rows with team equal to opponent are also deferred for review.
