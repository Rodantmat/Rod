AlphaDog/OXYGEN-COBALT v1.5.09.7 - Odds Resolver Parity Gate

Purpose
- Patch v1.5.09.6 without changing scoring math, Main UI, PrizePicks flow, slate AUTO behavior, or board/context logic.
- Fix Odds API resolver parity so Morning and Intraday use the same async key/config resolver path.
- Prevent stale same-slate candidate-board rows from surviving after a certified candidate-board publish.
- Strengthen Clean Run State so old same-slate release rows not owned by the latest completed scoring run are removed when the system is idle.

Changes
1. Odds API resolver parity
- Expanded Odds API accepted secret/config aliases.
- Both run_odds_api_morning and run_odds_api_afternoon now use getOddsApiKeyForJob through the same async resolver.
- Resolver diagnostics now report the actual async path, checked aliases/config paths, source name, resolver name, key length only, and whether an isolate last-good fallback exists.
- Secret values are never returned.
- Added an isolate last-good fallback so if Morning resolves the key and Intraday runs in the same isolate, Intraday cannot fail from a later remote/config miss.

2. Candidate board overwrite gate
- score_candidate_board now deletes selected-slate rows only after a non-empty replacement candidate batch has been built.
- This prevents old same-slate run_id rows from surviving a successful candidate publish.
- Empty candidate builds still preserve the existing board instead of blanking the release board.

3. Clean Run State release hygiene
- Clean Run State still protects active queues.
- When idle, it removes stale candidate/active rows for the slate that do not belong to the latest completed scoring run.
- It still preserves completed scoring runs.

Deploy
- Upload this flat ZIP to the production scheduled backend worker only.
- Do not deploy to Main UI.
- Do not change secrets before testing this patch.

Test sequence
1. Deploy ZIP.
2. Open Control Room.
3. DATA REFRESHING > Clean Run State.
4. DATA REFRESHING > Schedule One-Shot Full Run +2 Min.
5. Wait for Production Clock to complete the cascade.
6. Run DATA REFRESHING > Production Clock Status.
7. Run Manual SQL diagnostics:
   - latest data_refresh_queue rows for the new chain
   - latest odds_api_run_certifications
   - latest scoring_runs
   - active_score_board grouped by run_id
   - score_candidate_board grouped by run_id

Expected
- Odds API Morning and Intraday should both complete/certify/promote or expose a real HTTP/data error, not Missing ODDS_API_KEY when another Odds job can resolve the key.
- Candidate board should show only the latest completed run_id for the selected slate.
- Scoring math/output distribution should remain unchanged except for fresher odds/candidate overwrite hygiene.
