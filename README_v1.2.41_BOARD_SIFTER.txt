AlphaDog v1.2.41 - Board Sifter

Base: v1.2.40 - Manual SQL Output Guard.

Surgical change only:
- Added read-only Board Sifter Preview job for mlb_stats.
- Added Control Room buttons: Board Sifter Preview, Board Health, Board Sample, Board Needed Players.
- Board Sifter reads mlb_stats, reports row counts, latest sync, unique players, unique games, stat_type/odds_type distribution, sample legs, and dry-run job previews.

No changes:
- No scoring logic changed.
- No candidate logic changed.
- No schema changed.
- No Gemini calls added.
- No D1 writes added for board sifter.
- Existing Daily Health and RFI Regression logic preserved.

Required tests:
1. Daily Health: ok=true or existing baseline status unchanged; version should show v1.2.41 - Board Sifter after deploy.
2. RFI Regression x3: same baseline behavior as v1.2.40.
3. Board Health: returns mlb_stats counts/distributions.
4. Board Sifter Preview: returns ok=true when mlb_stats exists and includes counts, sample_legs, needed_players_preview, needed_games_preview, dry_run_jobs_preview.
