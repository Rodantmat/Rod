AlphaDog Market Implied Runs Null-Fix

Root cause found:
- markets_current schema has current_total/game_total/open_total and moneylines
- actual market rows currently have NULL totals and NULL moneylines
- previous derived metrics displayed 0/0 because blank values were being treated as numeric zero

Fix:
- Derived metrics now rejects 0/blank market values
- If market totals/odds are unavailable, away_implied_runs/home_implied_runs stay NULL
- implied_source becomes market_unavailable_null_no_zero_fill
- Adds Control Room audit button: Market Implied Runs

Run order:
1. SCRAPE > Run Derived Metrics
2. CHECK > Market Implied Runs
3. CHECK > Derived Metrics
4. CHECK > Feed Readiness
5. CHECK > Final Feed Audit

Expected:
- MARKET_ZERO_FILL_CHECK = PASS_NO_FAKE_ZEROES
- MARKET_IMPLIED_AVAILABLE may be INFO_UNAVAILABLE_SOURCE_EMPTY until real odds/totals populate markets_current

No migration required.
Do not replace config.txt.
