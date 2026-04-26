AlphaDog v1.2.28 — RBI Baseline Audit Lock

Files updated from the stable v1.2.26 base.

Surgical changes:
1. control_room.html version label updated to v1.2.28.
2. RFI Regression x3 now reports v1.2.28.
3. Final regression now executes one anchored sequential SQL batch instead of many independent final requests.
4. regression.complete is only true after all 12 final checks return.
5. RBI baseline is locked:
   - RBI_TOTAL must be 119.
   - RBI_TIER_SPLIT must be A_POOL 42 / B_POOL 77.
   - RBI weak A_POOL leak must be 0.
6. RFI candidate baseline remains locked:
   - 15 total RFI rows.
   - YES_RFI 7 / LEAN_YES 4 / WATCHLIST 4.
   - critical cap 1.
   - partial cap 2.
   - no incomplete YES_RFI leak.

Primary test:
Run RFI Regression x3 for slate_date 2026-04-25.
Accept only if version is v1.2.28 and regression.complete is true.
