AlphaDog v1.3.96 - One-Sided Market Skip Guard

Patch target:
- Scoring V1 stuck near the end of the Odds API TOTAL_BASES loop when the feed includes one-sided alt ladders.

Changes:
- Skips Odds API prop groups that do not contain both Over and Under before no-vig scoring.
- Skips groups where Over/Under exist but cannot be paired inside the same bookmaker.
- Writes scoring_audit_logs rows with SKIPPED_ONE_SIDED_MARKET or SKIPPED_NO_VALID_PAIRED_BOOK.
- Keeps v1.3.95 no-restart guard so retries do not supersede active scoring runs.
- Adds scoring_runs details_json progress stages before RBI fallback, before PrizePicks fallback, and statement build.
- Final status becomes COMPLETED_WITH_SKIPS when invalid groups are skipped, otherwise COMPLETED.

Preserved:
- HITS thin-market variance calibration from v1.3.93.
- Startup guard from v1.3.94.
- No-restart guard from v1.3.95.
- RBI board fallback and PrizePicks standard fallback behavior.
- No Gemini / no external scoring calls inside Scoring V1.
