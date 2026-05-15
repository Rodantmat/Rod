AlphaDog / OXYGEN-COBALT
v1.5.10.22 - Everyday Phase 1 Lineups Cursor Persistence Gate

Purpose
- Fixes the Everyday Phase 1 lineups loop where bounded lineups checked the same first 2 missing games every minute.
- Adds persistent lineups cursor state inside the bound Everyday Phase 1 child output payload.
- Each lineups tick now checks the next unchecked missing pickable games, not the same first slice forever.
- After a full empty/missing pass, the child stays open truthfully and cools down instead of hammering MLB StatsAPI or pretending success.
- Keeps parent/child binding and completion release logic from v1.5.10.21.
- Preserves incremental delta logic. No incremental code path was changed.

Behavior
- If lineups certify for every current pickable slate team, Everyday Phase 1 advances.
- If lineups are not posted yet, Everyday Phase 1 stays pending/partial_continue and blocks downstream truthfully.
- If all current missing pickable games were checked and still have no usable lineups, the next ticks enter lineups_waiting_cooldown_continue until the cooldown expires, then scan the slate again.
- Started/expired games do not block lineup certification.
- No fake clean success is allowed for missing certification-sensitive data.

Test sequence
1. Deploy this ZIP.
2. Run DATA REFRESHING > Killer Cleaner.
3. Run DATA REFRESHING > Schedule Selected Only.
4. Select only 02 Everyday Phase 1.
5. Wait 3-5 cron minutes.
6. Run the queue/child SQL from the chat response.
7. Confirm lineup_progress.checked_game_ids grows across ticks instead of repeating only the same first 2 games.
8. If lineups are not posted yet, status should remain partial/pending/waiting, not completed cleanly.
9. When lineups are posted/certified or no pickable games remain, the child can complete and leave the queue clean.
