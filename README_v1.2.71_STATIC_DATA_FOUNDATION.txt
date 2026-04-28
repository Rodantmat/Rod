AlphaDog v1.2.71 - Static Data Foundation

Purpose:
Adds manual static/reference data scrapers and checks to the control room while preserving the persistent-miner behavior and the temporary one-shot background Full Run mode.

New manual STATIC scrapers:
- Static > Scrape All Fast: venues + team aliases + active player reference.
- Static > Scrape Venues: wipes/rebuilds ref_venues from MLB StatsAPI plus controlled supplemental fields where available.
- Static > Scrape Team Aliases: wipes/rebuilds ref_team_aliases from MLB StatsAPI and explicit ambiguous-review aliases.
- Static > Scrape Players: wipes/rebuilds ref_players from MLB active rosters.
- Static > Scrape Splits G1-G6: G1 wipes ref_player_splits, groups append standard MLB StatsAPI statSplits.
- Static > Scrape Game Logs G1-G6: G1 wipes player_game_logs, groups append season gameLog rows.
- Static > Scrape BvP Current Slate: wipes/rebuilds ref_bvp_history for current slate board players vs probable starters.

New CHECK static buttons:
- Check > All Static Data
- Venues
- Team Aliases
- Players
- Splits
- Game Logs
- BvP

Safe order:
1. DEBUG > Health should show v1.2.71 - Static Data Foundation.
2. STATIC > Scrape All Fast.
3. CHECK > All Static Data, Venues, Team Aliases, Players.
4. STATIC > Scrape Splits G1 through G6, waiting for each to finish.
5. CHECK > Static Player Splits.
6. STATIC > Scrape Game Logs G1 through G6, waiting for each to finish.
7. CHECK > Static Game Logs.
8. Run/verify daily slate, starters, and board data before STATIC > Scrape BvP Current Slate.
9. CHECK > Static BvP.

Estimated runtimes:
- Venues: 5-15 seconds.
- Team Aliases: 3-10 seconds.
- Players: 25-60 seconds.
- Splits G1-G6: 45-120 seconds per group depending MLB API latency.
- Game Logs G1-G6: 45-120 seconds per group depending MLB API latency.
- BvP Current Slate: 30-120 seconds depending slate size and starter coverage.

No scoring, no UI redesign, no old duplicate cleanup.
