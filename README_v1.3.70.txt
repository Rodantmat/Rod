AlphaDog / OXYGEN-COBALT
v1.3.70 - Hits TB Cap Calibration Repair

Purpose:
- Surgical scoring calibration after SQL + Gemini validation.
- Fixes HITS/TOTAL_BASES cap-induced compression without touching stable scheduled backend flows outside scoring calibration.

Changes:
1. HITS/TOTAL_BASES two-book high-probability consensus cap:
   - Old: C01_THIN_UNDER3_75 always capped 2-book markets at 75.
   - New: C01_THIN_UNDER3_HIGH_PROB_82 applies only when no_vig_prob >= 0.60, projected market confidence >= 0.40, spread <= 0.07, and max hold <= 0.25.
   - Otherwise the old 75 cap remains.

2. PrizePicks exact standard HITS/TOTAL_BASES fallback:
   - Old: exact standard board fallback was too compressed, especially UNDER fallback.
   - New: exact standard fallback can breathe to 76 when fallback probability >= 0.58.
   - Weaker fallback rows keep the 72/68 safety rails.

3. Direction-aware fallback modifiers:
   - PP_STD_HIT_RATE_MODEL is now side-oriented.
   - PP_STD_TB_CONTACT_PROXY is now side-oriented.
   - This fixes UNDER fallback rows being penalized by OVER-oriented contact/hit-rate math.

Preserved:
- RBI Gemini parsing and over75 signal behavior.
- PrizePicks goblin/demon More-only rule.
- Sleeper more-only Under block.
- Single-book cap.
- Main DB lifecycle and scheduler behavior.

Files:
- worker.js
- control_room.html
- wrangler.jsonc
- package.json
- README_v1.3.70.txt
- BUILD_VERSION_AUDIT_v1.3.70.txt
