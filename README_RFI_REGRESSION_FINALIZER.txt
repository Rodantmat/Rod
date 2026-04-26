AlphaDog Control Room
v1.2.25 — Regression Finalizer

Built from v1.2.24 — RFI Guarded Tier Cannon.

Scope:
- Preserve RFI guarded tier-cap logic.
- Preserve RFI build/audit buttons.
- Preserve RFI Regression x3 button.
- Harden RFI Regression x3 so the final regression block is always populated, even if the final baseline SQL request times out.
- No RFI scoring changes.
- No cap logic changes.
- No Hits/RBI logic changes.
- No UI rebuild.

Expected RFI baseline for 2026-04-25 after rebuild:
- total: 15
- YES_RFI: 7
- LEAN_YES: 4
- WATCHLIST: 4
- cap_critical_data_missing: 1
- cap_partial_data_missing: 2
