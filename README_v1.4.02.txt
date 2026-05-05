AlphaDog v1.4.02 - Sleeper RBI Gemini Bonus Reconnect

Patch target:
- Debug-first repair for Sleeper RBI scoring after v1.4.00.
- Sleeper RBI board rows must be promoted into mlb_rbi_scores / active_score_board.
- Sleeper RBI pre-score now checks Odds API batter_rbis rows as reinforcement when available.
- Gemini RBI Under signal is bounded, Sleeper-only, and runs only after deterministic Sleeper RBI UNDER 0.5 pre-score is greater than 75.
- Long scoring remains backend-owned through DATA REFRESHING > PRODUCTION CLOCK ORCHESTRATOR.

Key logic changes:
1. Removed stale cross-run source_line_id skip that caused current Sleeper rows to be skipped because older runs already wrote the same source ids.
2. Added Odds API RBI support context from odds_api_player_props where prop_family='RBI' and market_key='batter_rbis'.
3. Added paired-book fair probability support for RBI Over/Under 0.5 when both sides are available.
4. Added Sleeper RBI odds support modifiers:
   - RBI_ODDS_API_NO_BOOK_THIN_MARKET_TAX
   - RBI_ODDS_API_ONE_SIDED_PRESENCE
   - RBI_ODDS_API_2_BOOK_SUPPORT
   - RBI_ODDS_API_3_BOOK_SUPPORT
   - RBI_ODDS_API_5_BOOK_CONSENSUS
   - RBI_ODDS_API_FAIR_PROBABILITY
5. Added Sleeper RBI cap ladder based on Odds API backing:
   - 0 books: cap 82 before Gemini, 86 with Gemini bonus
   - one-sided/0 paired: cap 84
   - 1 paired book: cap 86
   - 2 paired books: cap 90
   - 3+ paired books: cap 94
   - 5+ paired books with Gemini bonus: cap 96
6. Gemini is now skipped for non-Sleeper RBI fallback rows and allowed only for Sleeper RBI UNDER 0.5 rows pre-scored above 75, bounded by the existing 45-call cap.
7. Reconnected same-slate positive Gemini signal reuse across versions: a valid prior rbi_gemini_under_signals row with usable_for_bonus=1 and bonus>0 can now apply to the current scoring run even if it came from v1.3.99 or another prior model_version.
8. Stale no-bonus / failed 503 Gemini rows no longer block a fresh bounded Gemini attempt. Current-version no-bonus cache still prevents repeated immediate recalls for the same failed leg.
9. Scoring audit now exposes Gemini cache/fresh-call accounting: cache_hits, cache_bonus_rows, fresh_attempts, attempted, favorable, call_failures, parse_failures, and skipped_pre75.

Simulation performed before packaging:
- Syntax check passed with node --check.
- Static helper simulation confirmed Odds API paired Over/Under conversion produces fair probabilities.
- Static scoring simulation confirmed no-book Sleeper RBI rows are capped conservatively and Odds-backed rows receive reinforcement without removing caps.
- Static cache-path simulation confirmed a prior favorable same-slate Gemini signal is reused across model versions before spending a fresh Gemini call.

Deployment:
- Upload all files flat to the scheduled backend Worker repository.
- Do not mix with Main UI worker.
