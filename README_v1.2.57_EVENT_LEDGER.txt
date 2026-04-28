AlphaDog v1.2.57 - Event Ledger

Surgical fixes from v1.2.56:
- Restores broken CHECK buttons that were sending blank SQL.
- Adds visible SCRAPE > Daily MLB Slate button.
- Corrects daily_mlb_slate display label so it is no longer hidden as Markets.
- Adds system_event_log auto-created by the Worker.
- Logs Health, Manual/CHECK SQL actions, manual job button starts/completions, and scheduled starts/completions.
- Adds CHECK > System Event Log and CHECK > Scheduled Status buttons.
- Stops MLB Lineups button from retrying three times when MLB API has zero confirmed batting orders posted; response now says no_confirmed_lineups_yet/retry_later.
- Keeps existing UI layout and stable flows intact.

Testing order:
1. DEBUG > Health
2. CHECK > Games
3. CHECK > Starters
4. CHECK > Lineups
5. CHECK > System Event Log
6. CHECK > Scheduled Status
7. SCRAPE > Daily MLB Slate
8. SCRAPE > MLB Lineups
