AlphaDog/OXYGEN-COBALT
v1.3.47 - Pickability Gate

Scope:
- Adds candidate-release Pickability Gate on top of v1.3.46 Auto Scoring Trigger Mesh.
- Confirms exact current board availability before QUALIFIED / PLAYABLE / WATCHLIST release.
- Uses prizepicks_current_market_context for PrizePicks current-board side availability.
- Uses sleeper_rbi_rfi_market_signals for Sleeper RBI/RFI under-side availability.
- Treats PrizePicks goblin/demon rows as More/OVER-only.
- Unavailable sides are retained as DEFERRED_UNPICKABLE, not released as PLAYABLE/WATCHLIST/QUALIFIED.

Not changed:
- No scoring math changes.
- No Gemini changes.
- No external market changes.
- No cron/scheduling changes.
- No Phase 1 / 2A / 2B changes.
- No static or incremental mining changes.

Test order:
1. Deploy this flat ZIP.
2. Hard refresh Control Room.
3. Run DEBUG > Health.
4. Confirm version is v1.3.47 - Pickability Gate.
5. Run SCORING V1 > Run Full Score Refresh.
6. Run SCORING V1 > Inspect Candidate Board.
7. Run SCORING V1 > Export Candidate Board.
8. Verify summary includes no released unavailable Under sides.
9. Check risk_notes.pickability_gate on any DEFERRED_UNPICKABLE rows.
