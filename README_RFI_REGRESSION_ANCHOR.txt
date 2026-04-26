v1.2.26 — Regression Anchor

Purpose:
- Surgical follow-up to v1.2.25.
- Fixes RFI Regression x3 so the final regression block is anchored and always populated.

Change:
- Final regression checks now run as sequential small SQL calls from the Control Room instead of one fragile multi-statement request.
- The output preserves the regression block with body.ok and body.outputs.

No changes:
- No RFI scoring changes.
- No RFI guarded tier-cap changes.
- No Hits logic changes.
- No RBI logic changes.
- No Worker logic changes.
- No UI rebuild.
