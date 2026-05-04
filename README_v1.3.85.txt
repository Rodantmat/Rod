AlphaDog v1.3.85 - Incremental Delta Stale Finalizer

Purpose:
- Surgical repair for true delta mode getting stuck in stage_delta_logs after staging clean non-zero temp rows.

Changes:
- Keeps v1.3.84 true delta certification behavior.
- Adds hard reconciler branch for stage_delta_logs.
- If stage_delta_logs has clean non-zero temp rows and stale/no movement, advances to audit.
- Keeps audit/promote/clean/derived/completed path intact.
- Keeps final live certification guard.
- No live table deletion.
- Promotion remains INSERT OR REPLACE.

Test sequence:
1. Deploy.
2. Run DEBUG > Health and confirm v1.3.85.
3. Run Check Incremental Temp.
4. Expected: current_step should advance from stage_delta_logs to audit.
5. Wait 2-5 minutes.
6. Run Check Incremental Temp again.
7. Expected path: audit -> promote -> clean -> derived -> completed.
8. Run Certify Live Incremental and expect A/A+.
