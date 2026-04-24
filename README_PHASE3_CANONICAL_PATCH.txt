ALPHADOG PHASE 3 CANONICAL PATCH

WHAT THIS PATCH DOES
- Normalizes team aliases before database insert.
- Prevents CHW/KCR/SDP/SF/TBR/WSH duplicate IDs from coming back.
- Rejects team shell rows with no real stats.
- Rejects starter shell rows with missing ERA/WHIP/strikeouts/innings_pitched.
- Tightens scrape_starters_v1.txt to force real starter stats.

UPLOAD TO GITHUB ROOT
- worker.js
- scrape_teams_v1.txt
- scrape_starters_v1.txt

NO SCHEMA PATCH NEEDED if starters_current already verifies game_id + team_id.
