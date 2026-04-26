ALPHADOG CONTROL ROOM v1.2.22 — RFI Audit Blade

Base: v1.2.21 — RFI Razor Fang.

Surgical update only:
- Added CHECK > RFI Candidates audit button.
- Preserved SCRAPE > Build RFI Candidates.
- Preserved Hits and RBI candidate logic.
- Preserved UI layout/CSS.
- No scoring changes.

RFI Candidates audit returns:
- total RFI rows for selected slate
- tier counts
- missing starter count
- warning rows count
- score band sanity by tier
- top 20 RFI rows by score

Expected validation after current 2026-04-25 slate:
- edge_candidates_rfi: 15
- YES_RFI: 7
- LEAN_YES: 5
- WATCHLIST: 3
- missing starters: 0
- warning rows: 3

Deploy/test:
1. Upload control_room.html to GitHub Pages.
2. Worker does not require logic changes for this audit button because CHECK audits use the existing SQL endpoint.
3. Open Control Room and confirm version v1.2.22 — RFI Audit Blade.
4. Tap CHECK > RFI Candidates.
5. Confirm the audit output matches the expected current slate profile.
