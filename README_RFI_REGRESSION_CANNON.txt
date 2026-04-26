ALPHADOG CONTROL ROOM
v1.2.23 — RFI Regression Cannon

Base: v1.2.22 — RFI Audit Blade

Surgical update only.

Changes:
- Added CHECK > RFI Regression x3 button.
- The button runs 3 deterministic RFI build/audit cycles.
- The button then runs baseline regression SQL for RFI, RBI, Hits, players, starters, and lineups.
- No Worker changes.
- No scoring changes.
- No layout/CSS changes.
- No Hits/RBI logic changes.

Pass expectations after deploy:
- Version shows v1.2.23 — RFI Regression Cannon.
- CHECK > RFI Regression x3 completes.
- Each RFI cycle inserts 15 rows.
- RFI total remains 15.
- RBI remains 119 with A_POOL 55 / B_POOL 64.
- RBI weak A_POOL leak remains 0.
- Hits total remains non-empty.
