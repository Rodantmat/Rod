AlphaDog v1.3.92 - Odds API RBI Key Revert

Patch target
- Reverts the Odds API MLB RBI player prop market key back to batter_rbis.
- Keeps player prop requests on regions=us with empty bookmaker filters so the API can return any US coverage.
- Keeps Hits and Total Bases as batter_hits,batter_total_bases.
- Keeps RBI rows non-fatal if empty, because book coverage can still be thin or unavailable.
- Updates backend/control-room version labels to v1.3.92.

Root cause fixed
- v1.3.91 used an expanded RBI key that the live Odds API rejected with 422 INVALID_MARKET.
- v1.3.92 restores the key that the system previously used for RBI requests.

Deploy files
- worker.js
- control_room.html
- wrangler.jsonc
- package.json

Test sequence
1. Upload/deploy this flat ZIP through the scheduled backend/control-room Worker repo.
2. Open Control Room > DEBUG > Health.
3. Confirm version: v1.3.92 - Odds API RBI Key Revert.
4. Run DATA REFRESHING > Init Production Clock.
5. Run ODDS API > Run Morning Odds.
6. Run ODDS API > Check Market Intel.
7. Confirm RBI requests no longer return INVALID_MARKET for the expanded key.
8. If RBI still has zero rows, treat it as normal market coverage/availability, not a bad key.
9. Run ODDS API > Run Early Afternoon Odds only after Morning Odds is clean.
10. Recheck candidate board/export after odds promotion.
