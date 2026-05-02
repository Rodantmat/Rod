AlphaDog / OXYGEN-COBALT
v1.3.48 - Odds Scheduler Guard

What changed:
- Patches Odds API promotion to be idempotent.
- Fixes the root crash: UNIQUE constraint failed: odds_api_events.event_id.
- Promotes Odds API events with ON CONFLICT(event_id) DO UPDATE.
- Promotes game markets and player props with conflict-safe upserts.
- Keeps temp rows for debug if promotion throws instead of silently wiping evidence.
- Prevents duplicate daily Phase 3A/3B schedule rows for the same slate after a terminal request already exists.
- Makes PHASE 3A/3B > Check Full Run slate-guarded: if the requested slate has no Phase 3 request, it falls back to the latest Phase 3 request instead of creating a false hard failure.

What did not change:
- No scoring math changed.
- No candidate scoring gates changed.
- No Gemini prompt logic changed.
- No UI layout drift.
- No static/incremental mining logic changed.
- No database schema migration required.

Root cause fixed:
- Odds API was successfully reachable, but promotion crashed when an event_id already existed in odds_api_events.
- That blocked May 2 odds promotion, leaving odds_api_player_props empty for May 2.
- Scoring then correctly fell back to May 1 odds, and Pickability Gate deferred every candidate.

Expected after deploy:
1. ODDS API > Run Morning Odds should no longer fail on odds_api_events.event_id.
2. odds_api_player_props should populate for the current slate when Odds API has eligible MLB events/props.
3. SCORING V1 > Run Full Score Refresh should use the current promoted odds slate instead of falling back to the previous slate.
4. PHASE 3A/3B > Check Full Run should no longer hard-fail just because the requested slate has not been scheduled yet.

Version safeguard:
- ZIP filename: alphadog_v1.3.48_odds_scheduler_guard.zip
- worker.js SYSTEM_VERSION: v1.3.48 - Odds Scheduler Guard
- control_room.html version tag: v1.3.48 - Odds Scheduler Guard
- README: v1.3.48 - Odds Scheduler Guard
