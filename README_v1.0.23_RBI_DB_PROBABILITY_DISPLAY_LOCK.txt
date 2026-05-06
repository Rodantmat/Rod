AlphaDog Main UI v1.0.23 - RBI DB Probability Display Lock

Surgical Main UI patch only.

Changes:
- RBI tab now displays backend/database audit_payload.hit_probability directly.
- Browser-side RBI probability recalculation is disabled except as a fallback if DB probability is missing.
- RBI list still shows top 20 pickable Sleeper RBI Under 0.5 legs from backend reserve buffer.
- Slip builder still creates 10 two-pick slips when 20 visible legs are present.
- Same-team pairing is avoided when possible. If unavoidable, slip probability applies the existing 1.08 correlation cap.
- Main board remains Hits + Total Bases only. RBI remains menu-only.
- Started/inside-15-minute/missing-start legs remain hidden.
- No database writes, no scoring, no mining added to Main UI.

Deploy files exactly as provided.
