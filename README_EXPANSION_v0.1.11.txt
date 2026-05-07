AlphaDog Expansion Isolated Worker
Version: v0.1.11 - Control Room Output Lens

Deploy these flat-root files to the existing alphadog-expansion-v001 Worker.

Scope of this build:
- Isolated expansion worker/control room only.
- No production scheduled backend changes.
- No Main UI changes.
- No scoring changes.
- Reads existing PrizePicks current board as source input.
- Writes only to xp_* expansion tables.

Changes in this build:
- Manual SQL server cap increased from 100 max returned rows to 500 max returned rows.
- Control Room output display cap increased from 1,800 chars to 120,000 chars.
- Long individual text cells are capped at 8,000 chars to avoid browser/app crashes while preserving usable diagnostics.
- Manual SQL helper text now reflects expanded diagnostics.
- Load Sample default limit increased to 100.
- Output jump scrolls to COPY OUTPUT so the copy button stays visible.
- Clear SQL and Select SQL preserve the real output console.
- Button output wrapper keeps action, function_name, route, HTTP status, version, worker_base, and response.
- Compact mobile Control Room styling preserved.

After deploy, run:
1. Health
2. Counts
3. Manual SQL with: PRAGMA table_info(prizepicks_current_market_context);
4. Manual SQL with: SELECT * FROM xp_prop_lines_current LIMIT 25;
5. Refresh Board
6. Counts
7. Load Sample
8. Copy Output
