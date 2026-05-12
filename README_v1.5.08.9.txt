AlphaDog/OXYGEN-COBALT v1.5.08.9 - Same-Slate Scoring Context Gate

Scope:
- Surgical production scheduled-backend patch only.
- Preserves the v1.5.08.8 scoring queue/checkpoint pickup fix.
- Adds same-slate current-game context guards to scoring hydration, active_score_board publishing, and score_candidate_board publishing.
- Does not change scoring math, probabilities, thresholds, PrizePicks board refresh, PrizePicks context generation, Odds API ingestion, Main UI, or broad orchestrator lifecycle.

Root cause fixed:
- v1.5.08.8 proved scoring_refresh can complete and persist durable outputs.
- New failure found after that: live May 12 candidate/active payloads contained stale current-game identity fields such as player_context.game_id = 2026-04-*.
- The likely source was context hydration falling back by player/team/name and allowing stale lineup/RBI edge context to populate current-game fields.

Patch behavior:
- lineups_current hydration is restricted to game_id LIKE selected_slate_date || '_%'.
- edge_candidates_rbi hydration rejects rows whose game_id date does not match the selected scoring slate.
- player-context selection no longer falls back to a mismatched team when current matchup teams are known.
- historical metrics can still be used, but current-game identity fields must not carry stale game_id dates.
- active_score_board rows are published only when current-game identity passes the same-slate gate.
- score_candidate_board rows are blocked entirely when audit_payload/player_context or source row game_id leaks a non-selected-slate date.

Expected test:
1. Keep SLATE on Auto.
2. Confirm Auto resolves to the active board slate before scoring.
3. Click SCORING V1 • MLB Pregame > Run Full Score Refresh.
4. Wait for minute cron / orchestrator pickup, or use DATA REFRESHING > PRODUCTION CLOCK ORCHESTRATOR > Run Queue Tick if you are manually advancing the queue.
5. Run the SQL checks listed in the response after scoring completes.
6. PASS requires active_score_board and score_candidate_board to have zero rows with audit_payload containing "game_id":"2026-04-" for slate_date='2026-05-12'.
