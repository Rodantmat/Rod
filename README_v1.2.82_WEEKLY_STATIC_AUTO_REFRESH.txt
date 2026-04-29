AlphaDog v1.2.82 - Weekly Static Auto Refresh

Purpose:
- Adds the weekly protected static temp refresh pipeline.
- Weekly cron is Monday 1:00 AM PT/PDT via Cloudflare cron 0 8 * * 1.
- Minute cron remains enabled only to advance due static-temp pipeline steps.
- Old scheduled mining/full-run/slate jobs remain paused.

Pipeline:
1. Schedule weekly temp refresh.
2. Fill ref_venues_temp, ref_team_aliases_temp, ref_players_temp.
3. Run certification audit.
4. Promote temp to live only if audit is A+ or A and request IDs match.
5. Clean temp tables.

Protected live tables:
- ref_venues
- ref_team_aliases
- ref_players

Not touched by this weekly static pipeline:
- ref_player_splits
- player_game_logs
- ref_bvp_history
- slate/market/queue/mining tables
