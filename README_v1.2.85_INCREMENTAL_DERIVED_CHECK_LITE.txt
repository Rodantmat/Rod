AlphaDog v1.2.85 - Incremental Derived Check Lite

Purpose:
- Fix CHECK > Incremental Derived Metrics D1 timeout after v1.2.84 build succeeded.

Surgical changes:
- Worker version bumped to v1.2.85.
- Derived metrics build remains untouched.
- check_incremental_derived_metrics now uses a lightweight D1-safe path:
  - season count only
  - coverage count
  - zero/null integrity checks
  - role split
  - 10-row sample
  - no heavy full-table duplicate/orphan scans
  - no MLB API calls
  - no Gemini calls

Expected test:
1. Deploy.
2. Run DEBUG > Health and confirm v1.2.85.
3. Run CHECK > Incremental Derived Metrics.
4. Expected: pass or needs_review JSON, not D1 timeout.

No live data rebuild required.
