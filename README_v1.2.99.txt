AlphaDog v1.2.99 - Phase 2B Last Lineup Fallback

Patched from v1.2.98.

Changes:
- If today current lineup is missing for a team, Phase 2B now fetches the team's last available MLB boxscore lineup.
- Fallback lineups are inserted into lineups_current for today's game/team with is_confirmed=0 and source=mlb_statsapi_last_available_lineup_fallback.
- game_lineup_context now records fallback_used, fallback_game_id, and fallback_game_date.
- Current official lineups still win when available.
- No scoring, no Gemini, no static remine, no incremental history remine.

Test:
1. DEBUG > Health
2. Everyday Phase 2B > Run Lineup/Scratch
3. Everyday Phase 2B > Check Lineup/Scratch

Expected:
- 30 lineup context rows.
- Missing today lineups become LAST_AVAILABLE_FALLBACK_* when a recent MLB boxscore lineup exists.
- missing_lineup_teams should drop sharply or reach 0 if all teams have recent game boxscores.
