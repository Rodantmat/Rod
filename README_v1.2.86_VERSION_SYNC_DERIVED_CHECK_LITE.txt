AlphaDog v1.2.86 - Version Sync + Derived Check Lite

Purpose:
- Corrects the package/version mismatch from the previous v1.2.85 delivery.
- Worker SYSTEM_VERSION, control room visible version tag, and control room JS version are all synchronized to v1.2.86.
- Keeps the D1-safe lightweight CHECK > Incremental Derived Metrics path from v1.2.85.

Test:
1. Deploy this flat ZIP.
2. Run DEBUG > Health and confirm version: v1.2.86 - Version Sync + Derived Check Lite.
3. Run CHECK > Incremental Derived Metrics.

Expected:
- Health shows v1.2.86.
- Incremental Derived Metrics check avoids the previous heavy D1 timeout path.
