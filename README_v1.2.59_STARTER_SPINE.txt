AlphaDog v1.2.59 - Starter Spine

Root cause fixed:
- G1/G2/G3 were still routed through the old Gemini starter prompt path.
- G1 zero inserts were being treated by the control room as retry/failure while G2/G3 were exempt.
- Missing starter rows are mostly official-probable availability gaps, not 503s.

Fixes:
- G1/G2/G3 now route to deterministic MLB Stats API group starter sync.
- G1/G2/G3 return group_filter diagnostics and missing_starter_games_after.
- G1 zero insert is no longer shown as failed_after_3_attempts.
- No Gemini starter group fallback is used by the G buttons.
