AlphaDog Control Room v1.2.29 — Regression Execution Hard Lock

Corrected package. The visible Control Room version tag is v1.2.29. The worker header is v1.2.29.

Surgical purpose:
- Keep the stable v1.2.28 RFI/RBI candidate logic.
- Fix the RFI Regression x3 harness so final regression checks execute as anchored individual SQL checks.
- Final pass requires all 12 regression checks to return expected statuses and regression.complete=true.

Test after deploy:
1. Open Control Room and confirm the top label says: v1.2.29 — Regression Execution Hard Lock.
2. Run only: RFI Regression x3.
3. Accept only if output shows:
   - version: v1.2.29 — Regression Execution Hard Lock
   - regression.mode: anchored_individual_sql
   - regression.complete: true
   - final: pass
