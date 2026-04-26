MAIN SYSTEM PHASE 1B — SCREEN 2 FLOW + DATA MATRIX SHELL

Base: Main System Phase 1A protected renamed shell.

Purpose:
- Restore the missing Screen 2 navigation flow.
- Add a safe player-card Screen 2.
- Add the new category-based collapsible data matrix shell.
- Do not wire backend packets yet.
- Do not score legs yet.
- Do not touch the scheduled backend.

Files in this package:
- index.html
- main-system-styles.css
- main-system-parser.js
- main-system-ui-engine.js
- main-system-core.js
- main-system-connectors.js
- MAIN_SYSTEM_PHASE_1B_README.txt

Surgical changes:
1. Added “Go to Screen 2 / Analyze” button to Screen 1.
2. Button stays disabled until at least one leg is ingested.
3. Added Screen 2 container with toolbar and Back/Reset controls.
4. Added per-leg player cards on Screen 2.
5. Added collapsible matrix sections:
   - Identity
   - Trend
   - Matchup
   - Role / Usage
   - Market
   - Environment
   - Risk
   - Final Score
   - Hit Probability
   - Warnings
   - Derived Flags / Raw Packet Preview
6. Matrix marks backend-dependent fields as pending instead of inventing data.
7. RFI/RBI/Hits are marked as backend-candidate families ready for future adapter wiring.
8. Other prop families are marked as adapter pending.

Protected areas not changed:
- Parser logic unchanged.
- Screen 1 paste/input behavior preserved.
- No backend endpoint calls added.
- No Gemini logic added.
- No scoring formulas added.
- No scheduled-task worker code included.

Next phase:
Main-1C — Backend packet adapter contract for RFI/RBI/Hits only.
