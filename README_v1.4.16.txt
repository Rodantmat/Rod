AlphaDog / OXYGEN-COBALT
v1.4.16 - Production Clock Watchdog Guard

Surgical backend/control-room build.

Changes:
- Keeps RBI UNDER Gemini disabled.
- Keeps PrizePicks RBI skipped.
- Sharpens deterministic Sleeper RBI UNDER probability math.
- Lowers missing RBI/PA fallback from 0.070 to 0.055.
- Adds available opposing-starter ERA/K9 suppression when starters_current has usable fields.
- Hardens recent contact cold-state suppression using stored last3/last5 hit data because last3/last5 RBI fields are not available in the current incremental table.
- Raises weak-profile probability floors: sub-.200 low-power, sub-.210 low-power, rookie weak-contact, bottom-order/table-setter low-power, low-total low-power, high-K weak-contact.
- Promotes a top-30 backend Sleeper RBI reserve buffer so Main UI can still display 20 legs / 10 slips after client-side started-game hiding.
- Preserves Check MLB Scores status fix: COMPLETED_WITH_SKIPS counts as completed.
- HITS and TOTAL_BASES scoring untouched.

Test sequence:
1. DEBUG > Health
2. SCORING V1 > Run Full Score Refresh / Run MLB Scores
3. Wait 2-4 minutes
4. SCORING V1 > Check MLB Scores
5. Main UI refresh > RBI > verify 20 legs and 10 slips.

Manual SQL:
SELECT
  player_name,
  team,
  opponent,
  game_datetime_utc,
  line_direction,
  line_number,
  final_score,
  confidence_grade,
  recommendation_status,
  market_confidence,
  substr(audit_payload,1,1800) AS audit_preview,
  created_at
FROM mlb_rbi_scores
WHERE model_version = 'v1.4.16 - Production Clock Watchdog Guard'
  AND source_board = 'sleeper'
  AND line_direction = 'UNDER'
  AND line_number = 0.5
ORDER BY
  CAST(json_extract(audit_payload,'$.hit_probability') AS REAL) DESC,
  final_score DESC
LIMIT 35;


Surgical v1.4.16 additions:
- Kept worker name, URL, wrangler.jsonc, control-room paths, and existing backend routes unchanged.
- Added health booleans for ODDS_API_KEY and GitHub dispatch secret presence.
- Added scheduled-handler heartbeat/error event logging.
- Added stale queue watchdog recovery for pending rows with null run_after that are older than 30 minutes and no earlier active chain dependency.
- Odds API refresh failure is now treated as an optional dependency for cascade advancement; scoring_refresh can be released instead of being stranded pending.
- AUTO slate rollover now switches to next day at 9 PM PT.
- Added 11 AM PT and 11 PM PT diagnostic watchdog windows, plus light stale-recovery preflight.
