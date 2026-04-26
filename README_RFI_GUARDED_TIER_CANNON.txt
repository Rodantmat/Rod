ALPHADOG CONTROL ROOM
v1.2.24 — RFI Guarded Tier Cannon

Base:
v1.2.23 — RFI Regression Cannon

Purpose:
Surgically sharpen RFI candidate tiering after Gemini edge-case validation.

Changes:
- Added deterministic RFI lineup-completeness tier cap.
- If both top-3 lineups are incomplete: cap candidate_tier at WATCHLIST and append cap_critical_data_missing.
- If one top-3 lineup is incomplete: cap candidate_tier at LEAN_YES and append cap_partial_data_missing.
- Raw rfi_score remains unchanged for audit integrity.
- One row per game preserved.
- No probabilities, scores-as-bets, or betting decisions.

Expected current baseline after rebuild:
- edge_candidates_rfi: 15
- YES_RFI: 7
- LEAN_YES: 4
- WATCHLIST: 4
- cap_critical_data_missing: 1
- cap_partial_data_missing: 2
- incomplete YES_RFI leak: 0
- RBI total remains 119
- RBI A_POOL/B_POOL remains 55/64
- Hits total remains 126

Do not use v1.2.20 as base.
