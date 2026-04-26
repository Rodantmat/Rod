AlphaDog v1.2.32 — Regression No-Interrupt Loop

Surgical patch over v1.2.31.

Fixes:
- RFI Regression x3 no longer renders the large suite JSON during each cycle.
- Each cycle is captured with try/catch so a cycle exception cannot silently stop before final regression.
- Final regression still uses the corrected 55 / 64 RBI tier baseline.
- Runtime version is locked to v1.2.32 in visible UI, debugConfig, and regression JSON.

Expected RFI Regression x3:
- version: v1.2.32 - Regression No-Interrupt Loop
- cycles.length: 3
- regression.expected_checks: 12
- regression.returned_checks: 12
- RBI_TIER_SPLIT: PASS_BASELINE_55_64
- ok: true if all baselines remain stable.
