v1.2.29 — Regression Execution Hard Lock

Fixes v1.2.28 where RFI Regression x3 could stop before the final regression block and leave regression.status=not_started / complete=false.

Changes:
- Compact cycle summaries only.
- No huge nested build/audit response payloads inside cycles.
- Final checks run as 12 individual anchored SQL calls.
- complete=true only after all 12 expected statuses pass.
- Keeps RBI baseline lock: 119 total, A_POOL 42 / B_POOL 77, weak A-pool leak 0.
