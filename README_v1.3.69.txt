AlphaDog / OXYGEN-COBALT
v1.3.69 - PrizePicks Standard Hits/TB Coverage Repair

Purpose
- Surgical backend scoring coverage repair only.
- Adds conservative fallback scoring for exact PrizePicks STANDARD Hits and Total Bases rows when Odds API consensus scoring is missing or too thin.
- Preserves current RBI Gemini parser hardening from the prior parser-hardening build.
- Preserves candidate-board release rules and Main UI read-only behavior.

What changed
1. Added PrizePicks STANDARD Hits/Total Bases fallback scoring inside full scoring refresh.
2. The fallback scores only exact current PrizePicks standard rows from prizepicks_current_market_context.
3. The fallback can write mlb_hits_scores / mlb_total_bases_scores and active_score_board rows when the conservative score reaches active-board status.
4. score_candidate_board remains the release model and still applies exact pickability.
5. Goblin/demon rows remain More-only. The system does not manufacture unders for PrizePicks goblin/demon.
6. Sleeper more-only under rejection behavior is untouched.

What was not touched
- Scheduled backend/control room structure.
- Cron schedules.
- D1 schema migrations beyond existing CREATE TABLE guards.
- RBI scoring math except preserving the existing parser-hardened behavior.
- Sleeper board ingest.
- PrizePicks board ingest.
- Main UI files/routes.
- Candidate release thresholds.

Expected validation after deploy
1. Deploy this backend/control-room build.
2. Run SCORING V1 > Run Full Score Refresh.
3. Run SCORING V1 > Build Score Candidate Board if full refresh does not auto-build it.
4. Run SCORING V1 > Inspect Candidate Board.
5. Check that run output includes prizepicks_standard_hits_tb_fallback.
6. Hits/Total Bases may still be absent from the release board if the conservative fallback scores remain below WATCHLIST. That is correct. The fix is coverage, not forced release.

Files included
- worker.js
- control_room.html
- wrangler.jsonc
- package.json
- README_v1.3.69.txt
- BUILD_VERSION_AUDIT_v1.3.69.txt
