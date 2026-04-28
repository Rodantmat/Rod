AlphaDog v1.2.75 - Static Splits Resume Repair

Surgical patch from v1.2.74.

Fix:
- Scrape Splits G1 no longer wipes ref_player_splits and static_scrape_progress on every repeated click.
- G1 wipes only when starting a fresh split rebuild with no existing G1 progress, or when progress exists but the split table is empty.
- Repeated G1 clicks now resume the next 10 eligible players and remaining_in_group_after should decrease.

Expected test:
1. Deploy.
2. Run STATIC > Scrape Splits G1.
3. Run STATIC > Scrape Splits G1 again.
4. remaining_in_group_after should drop by about 10 each successful run instead of staying at 120.
5. When G1 reaches 0, move to G2-G6.
