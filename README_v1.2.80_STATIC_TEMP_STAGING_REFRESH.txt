AlphaDog v1.2.80 - Static Temp Staging Refresh

Purpose:
- Adds protected staging tables for true static / slow-static weekly refresh.
- Does not overwrite trusted live tables.
- Old scheduled mining/full-run jobs remain paused.
- Only temp static staging refresh is allowed on the one-minute cron.

New temp tables:
- ref_venues_temp
- ref_team_aliases_temp
- ref_players_temp
- static_temp_refresh_runs

New buttons:
- STATIC TEMP > Schedule Weekly Refresh Test
- STATIC TEMP > Run One Refresh Tick
- CHECK TEMP > All Static Temp
- CHECK TEMP > Static Venues Temp
- CHECK TEMP > Team Aliases Temp
- CHECK TEMP > Players Temp

Test order:
1. Deploy v1.2.80.
2. Run DEBUG > Health and confirm version is v1.2.80 - Static Temp Staging Refresh.
3. Click STATIC TEMP > Schedule Weekly Refresh Test once.
4. Wait 10-15 minutes, or use STATIC TEMP > Run One Refresh Tick manually to advance one step at a time.
5. Run CHECK TEMP > All Static Temp.

Expected final temp counts:
- ref_venues_temp: around 30 rows
- ref_team_aliases_temp: around 120+ rows
- ref_players_temp: around 750+ rows, usually around 780

Safety:
- No promotion to live tables exists in this build.
- Live tables ref_venues, ref_team_aliases, and ref_players are not touched by temp refresh.
- Promotion/certification audit is the next phase only after temp refresh passes.
