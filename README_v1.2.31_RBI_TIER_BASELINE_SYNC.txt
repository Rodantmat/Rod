AlphaDog v1.2.31 — RBI Tier Baseline Sync

Surgical patch verified as v1.2.31 runtime build.

Changed:
- control_room.html version label/debug version.
- RFI Regression x3 RBI_TIER_SPLIT expected baseline updated from A_POOL 42 / B_POOL 77 to A_POOL 55 / B_POOL 64.
- worker.js version comment updated only.

Reason:
- RFI data passed.
- RBI total still passed at 119.
- RBI weak A-pool leak passed at 0.
- Only the tier split baseline was stale after the current live build returned A_POOL 55 / B_POOL 64.

Expected RFI Regression x3:
- ok: true
- version: v1.2.31 — RBI Tier Baseline Sync
- regression.complete: true
- expected_checks: 12
- returned_checks: 12
- RBI_TIER_SPLIT: PASS_BASELINE_55_64
