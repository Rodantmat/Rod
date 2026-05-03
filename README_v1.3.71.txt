AlphaDog / OXYGEN-COBALT
v1.3.71 - Hits TB Strategic Probability Lift

Purpose:
- Surgical scoring calibration after v1.3.70 SQL validation showed HITS/TOTAL_BASES were still too compressed.
- Adds a small internal effective-probability lift for strong HITS/TOTAL_BASES signals so they are easier to separate and test without creating fake 90s.

Changes:
1. HITS/TOTAL_BASES Odds API consensus strategic lift:
   - Applies only to HITS and TOTAL_BASES.
   - Requires at least 2 paired books.
   - If no_vig_prob >= 0.60: score from effective_no_vig_prob = no_vig_prob + 0.015.
   - If no_vig_prob >= 0.63: score from effective_no_vig_prob = no_vig_prob + 0.020.
   - effective_no_vig_prob is capped at 0.665.
   - Stored no_vig_prob remains the original market probability for audit/comparison.
   - audit_payload now includes effective_no_vig_prob, probability_lift, and probability_lift_reason.

2. PrizePicks exact standard HITS/TOTAL_BASES fallback strategic lift:
   - Applies only to exact PrizePicks standard rows.
   - If fallback probability >= 0.60: score from effective_no_vig_prob = probability + 0.010.
   - If fallback probability >= 0.63: score from effective_no_vig_prob = probability + 0.015.
   - effective_no_vig_prob is capped at 0.665.
   - Goblin/demon rows remain More-only and do not receive Under releases.

3. Preserved from v1.3.70:
   - C01_THIN_UNDER3_HIGH_PROB_82 remains for high-probability 2-book consensus.
   - C_PP_STD_HITS_TB_UNDER_FALLBACK_76_HIGH_PROB remains for exact standard fallback.
   - Direction-aware fallback modifiers remain.

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
- README_v1.3.71.txt
- BUILD_VERSION_AUDIT_v1.3.71.txt
