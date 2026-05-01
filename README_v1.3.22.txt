AlphaDog v1.3.22 - Sleeper RBI/RFI Slate Window Runner

Base: v1.3.21 - Sleeper RBI/RFI Insert Arity Fix

Adds Sleeper RBI/RFI window runner:
- Uses sleeper_rbi_rfi_market_signals as source.
- Morning window: starts before 12:00 PM PT/PDT.
- Early-afternoon window: starts from 12:00 PM through before 5:00 PM PT/PDT.
- Excludes games already started.
- Excludes games starting within 15 minutes.
- Retains more-only/rejected rows as non-usable.
- Normalizes RBI/RFI target line to 0.5.
- No full-slate scrape.
- No Gemini calls.
- No external odds.
- No scoring.

New table:
- sleeper_rbi_rfi_window_results

New Control Room jobs:
- SLEEPER RBI/RFI > Run Morning Window
- SLEEPER RBI/RFI > Run Early Afternoon Window
- SLEEPER RBI/RFI > Check Window Runner

Scheduled cron:
- 4:30 AM PDT / 11:30 UTC runs board signal + morning window.
- 11:00 AM PDT / 18:00 UTC runs early-afternoon window.

Preserved:
- Phase 3 stale pending finalizer.
- Multi-wave Phase 3 runner.
- Sleeper text ingest.
- Existing control room layout.
