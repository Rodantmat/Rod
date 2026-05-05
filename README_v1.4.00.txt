AlphaDog v1.4.00 - Sleeper RBI Bridge Finalizer Fix

Patch target:
- Fix v1.3.99 scoring run stuck after scoring_loop_complete_before_fallbacks.
- Keep long scoring routed through DATA REFRESHING / Production Clock Orchestrator.
- Preserve HITS thin-market calibration and Total Bases market-confidence calibration.
- Preserve Sleeper RBI promotion bridge, but make it bounded and finalizer-safe.

Important behavior:
- Sleeper RBI bridge rows are promoted from sleeper_rbi_rfi_board.
- Sleeper bridge does not call Gemini inside scoring finalization.
- RBI Gemini UNDER market-signal calls remain available for non-Sleeper RBI rows, capped at 45 attempts per scoring run.
- Runs now finalize instead of staying RUNNING if bridge/fallback work fails.

Deploy flat files only.
