AlphaDog Player Identity + Handedness Patch

What changed:
- Adds MLB API player identity / handedness layer.
- New job: scrape_players_mlb_api
- Pulls official MLB roster identity:
  player_name, team_id, role, position, bats, throws, age, source, confidence
- Adds Control Room buttons:
  SCRAPE > MLB Players
  CHECK > Players
  CHECK > Player List
  CHECK > Handedness Gaps
- FULL RUN includes MLB API Player Identity before starters.
- Final Feed Audit includes PLAYERS and HANDEDNESS_GAPS.

No migration required.
No config.txt replacement.

Upload to GitHub root:
- worker.js
- control_room.html
- scrape_daily_mlb_slate_v1.txt
- scrape_starters_group_v1.txt
- scrape_starters_missing_v1.txt

Test:
CLEAN > Full
SCRAPE > FULL RUN
CHECK > Players
CHECK > Player List
CHECK > Handedness Gaps
CHECK > Final Feed Audit
CHECK > Truth Audit
CHECK > Scheduler Log
