AlphaDog v1.4.04 - RBI Calibration Gemini Reconnect Final

Purpose
- Preserve v1.4.03 RBI UNDER calibration: power-slot, proven-producer, Coors Field, and high-total caps.
- Fix the v1.4.03 regression where fresh no-bonus Gemini rows could block valid same-slate positive cached Gemini RBI UNDER signals from v1.3.99/v1.4.02.
- Keep the backend scoring worker only. No Main UI scoring/mining changes.

Patch summary
1. Updated SYSTEM_VERSION to v1.4.04 - RBI Calibration Gemini Reconnect Final.
2. Reordered getRbiGeminiUnderSignalBonus cache logic.
3. Positive same-slate cache sweep now runs before exact current-version no-bonus cache blocking.
4. Valid positive cache rows match same slate + normalized player + RBI 0.5 UNDER line, with source_board when available.
5. Current-version no-bonus rows can still prevent duplicate fresh Gemini calls, but only after positive-cache lookup fails.
6. Preserved v1.4.03 RBI calibration caps and scoring distribution logic.

Expected validation
- Check MLB Scores version should show v1.4.04.
- rbi_board_fallback.gemini_signal_context.cache_hits should be greater than 0 when old valid same-slate positive signals exist.
- rbi_board_fallback.gemini_signal_bonus_rows should return around the prior 10-12 range when cache data exists.
- RBI top rows should show RBI_UNDER_GEMINI_MARKET_SIGNAL_BONUS for cached favorable players.
- Michael Busch should remain suppressed by power calibration.
- Carson Benge should remain capped by environment calibration.

Test sequence
1. Deploy this ZIP to the scheduled backend worker only.
2. Open Control Room.
3. Group: SCORING V1.
4. Button: Run MLB Scores.
5. Wait for completion.
6. Group: SCORING V1.
7. Button: Check MLB Scores.
8. Confirm version v1.4.04 and active board exists.
9. Run Manual SQL top-10 Sleeper RBI UNDER query using model_version = 'v1.4.04 - RBI Calibration Gemini Reconnect Final'.
10. Confirm Gemini bonus rows are present on cached favorable players and calibration caps remain active.
