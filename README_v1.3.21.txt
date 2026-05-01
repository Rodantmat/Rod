AlphaDog v1.3.21 - Sleeper RBI/RFI Insert Arity Fix

Base: v1.3.19 - Phase 3 Stale Pending Finalizer.

Added:
- Sleeper RBI/RFI board signal runner.
- New table: sleeper_rbi_rfi_market_signals.
- New Control Room buttons:
  - SLEEPER RBI/RFI > Run Board Signal
  - SLEEPER RBI/RFI > Check Board Signal
  - SLEEPER RBI/RFI > Schedule Daily 4:30AM
- New daily cron: 30 11 * * * (4:30 AM PDT / 11:30 UTC).

Rules:
- Uses sleeper_rbi_rfi_board only.
- No full-slate RBI/RFI mining.
- Normalizes RBI/RFI target line to 0.5.
- regular rows become CERTIFIED_BOARD_PRESENT.
- more only rows become REJECT_MORE_ONLY and are not usable for under-only targets.
- No Gemini calls in this runner.
- No external odds scraping.
- No final scoring.

Preserved:
- Phase 3A/3B v1.3.19 stale pending finalizer.
- v1.3.18 multi-wave mining behavior.
- Sleeper text ingest.
- Sleeper video parser files.
- Control Room structure and existing buttons.
