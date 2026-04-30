AlphaDog v1.3.16 - Gemini Compact Governor

Base: v1.3.15 - Phase 3A/B Stale Lock Recovery.

Purpose:
- Preserve mining inflow.
- Add Gemini per-minute request/token governor at 75% of configured limits.
- Add 30-second wait before a Gemini call if the next call would cross the 75% RPM/TPM guard.
- Convert board-factor raw mining prompt input/output to compact pipe-delimited rows.
- Parse compact rows back into the existing board_factor_results raw_json shape so downstream storage remains compatible.

Changed:
- worker.js only.

Not changed:
- No scoring logic.
- No UI redesign.
- No queue architecture rewrite.
- No slate refresh behavior changed.
- No main table destructive cleanup.

New auto-created table:
- gemini_rate_usage(bucket, model, requests, estimated_tokens, updated_at)

First tests:
1. DEBUG > Health should show v1.3.16 - Gemini Compact Governor.
2. SCRAPE > Board Queue Mine One Raw.
3. CHECK > Board Factor Results.
4. MANUAL SQL:
   SELECT * FROM gemini_rate_usage ORDER BY bucket DESC, model LIMIT 20;

Notes:
- Board-factor mining now asks Gemini for compact rows, not label-heavy JSON.
- Existing internal result format is restored after parsing so current validation/storage still works.
- Other Gemini flows are protected by the rate governor but not fully converted to compact format in this patch.
