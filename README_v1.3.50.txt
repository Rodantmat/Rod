AlphaDog/OXYGEN-COBALT Build
v1.3.50 - Rollover Pickability Gate

Files included:
- worker.js
- control_room.html
- wrangler.jsonc
- package.json
- README_v1.3.50.txt

Purpose:
- Fix the over-aggressive stale board guard from the prior build.
- Old slate rows are allowed in DB during MLB/PrizePicks rollover windows.
- Candidate Inspect/Export are selected-slate filtered.
- Release still requires exact selectable board side.
- PrizePicks rows at or inside 15 minutes to start are not treated as pickable.
- No scoring math changed.
- No Gemini, Odds API, cron, static, incremental, Phase 1, Phase 2A, Phase 2B, or Phase 3A/3B logic changed.

Version safeguard:
- ZIP filename: alphadog_v1.3.50_rollover_pickability_gate.zip
- worker.js SYSTEM_VERSION: v1.3.50 - Rollover Pickability Gate
- control_room.html version tag: v1.3.50 - Rollover Pickability Gate
- README: v1.3.50 - Rollover Pickability Gate

Test sequence:
1. SCORING V1 > Run Full Score Refresh
2. SCORING V1 > Inspect Candidate Board
3. SCORING V1 > Export Candidate Board
4. MANUAL SQL > Output

SQL 1:
SELECT
  slate_date,
  candidate_status,
  prop_family,
  COUNT(*) AS rows_count,
  ROUND(AVG(final_score),2) AS avg_score,
  ROUND(MAX(final_score),2) AS max_score
FROM score_candidate_board
GROUP BY slate_date, candidate_status, prop_family
ORDER BY slate_date DESC, candidate_status, prop_family;

SQL 2:
SELECT
  slate_date,
  COUNT(*) AS active_rows,
  MAX(updated_at) AS latest_updated_at
FROM active_score_board
GROUP BY slate_date
ORDER BY slate_date DESC
LIMIT 10;

Expected:
- Inspect Candidate Board: ok=true.
- Inspect Candidate Board: data_ok=true if selected slate has candidate rows.
- Export Candidate Board: ok=true.
- Export Candidate Board: data_ok=true if selected slate has exported rows.
- rollover_guard.pass=true even if older slate rows remain in DB.
- No FAIL_STALE_ROWS_PRESENT.
