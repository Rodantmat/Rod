AlphaDog v1.2.33 - Daily Health Layer

Base: locked prior Regression No-Interrupt Loop.

Surgical changes only:
- Added worker version constant: v1.2.33 - Daily Health Layer.
- Added authenticated GET /health/daily?slate_date=YYYY-MM-DD.
- Added compact daily table-count validation for games, starters, lineups, bullpens, markets, players, RFI, RBI, and Hits.
- Added stale/stuck task visibility through recent task_runs checks.
- Added Control Room Daily Health button.
- Updated all visible version labels to v1.2.33.

Preserved:
- RFI build logic unchanged.
- RFI regression logic unchanged.
- RBI logic unchanged.
- Hits logic unchanged.
- prior regression baseline expectations unchanged.

Expected first test:
1. Open Control Room.
2. Tap Config and verify version shows control_room_v1_2_33_daily_health_layer.
3. Tap Health and verify worker version shows v1.2.33 - Daily Health Layer.
4. Tap Daily Health.
5. Tap RFI Regression x3 and verify prior regression baseline still passes.
