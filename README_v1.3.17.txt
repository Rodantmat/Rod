AlphaDog v1.3.17 - Actionable Backend Prefill

Purpose:
- Keep all data inflow.
- Do not cut required information.
- Stop wasting Gemini on board legs that already started or start too soon.
- Stop sending player A/D fields to Gemini when D1/backend already has the evidence.

Changes:
1. Version labels updated to v1.3.17 - Actionable Backend Prefill.
2. Board queue build now only creates everyday board-mining rows for actionable legs:
   - not already started
   - not starting within 15 minutes
3. Player A and Player D queue rows now attempt backend prefill first:
   - player identity
   - team
   - role/position
   - bats/throws
   - season AVG/OBP/SLG
   - AB/H/K/BB
   - last-game AB/H
   - lineup slot when present
   - opposing starter hand/profile when present
4. If backend prefill validates, the row is written as raw factor result without a Gemini call.
5. Gemini remains available for non-deterministic/missing families such as news/injury/weather/game context.
6. Existing compact Gemini governor remains in place.
7. No scoring changes.
8. No UI redesign.
9. No static/incremental remine forced.

Expected effect:
- Phase 3 should get much faster and cheaper.
- PLAYER_A and PLAYER_D should no longer be the Gemini bottleneck when D1 evidence is present.
- Started or near-start games should not waste mining time.

First test sequence:
1. Deploy.
2. DEBUG > Health must show v1.3.17 - Actionable Backend Prefill.
3. Run/check queue build for current slate.
4. Confirm pending queue rows exclude started and within-15-minute games.
5. Run SCRAPE > Board Queue Auto Mine Raw once if no scheduled lock is active.
6. Check Board Queue Health and Board Factor Results.
7. Verify PLAYER_A / PLAYER_D complete rows increase without heavy Gemini usage.
8. Check gemini_rate_usage. It should not spike for backend-prefilled player rows.
