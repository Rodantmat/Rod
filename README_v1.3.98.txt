AlphaDog v1.3.98 - Total Bases Market-Confidence Patch

Patch summary:
- Keeps SCORING V1 long runs routed through DATA REFRESHING > Production Clock Orchestrator backend queue.
- Adds Total Bases scoring calibration after Gemini consensus review.
- Stops 0-book Total Bases fallback Overs from reaching 80+ confidence.
- Adds zero-book Total Bases volatility tax.
- Removes the old flat Total Bases 76 fallback behavior and replaces it with dynamic caps.
- Rewards validated Total Bases Under 1.5 rows with 3+ books while keeping pickability status separate.
- Preserves HITS thin-market calibration and RBI behavior.

Test sequence:
1. Deploy this ZIP normally.
2. Open Control Room.
3. Run DATA REFRESHING > Init Production Clock.
4. Run SCORING V1 > Run MLB Scores.
5. Do not keep pressing Run MLB Scores. It should queue scoring_refresh into Production Clock Orchestrator.
6. Watch with DATA REFRESHING > Production Clock Status or Manual SQL against data_refresh_queue.
7. After completed, run SCORING V1 > Check MLB Scores.
8. Then run Manual SQL candidate-board summary for slate 2026-05-05 or current slate.

Expected behavior:
- Long scoring does not run in the browser request.
- 0-book Total Bases Over 1.5 rows are capped around 72-76 depending profile, not 80+.
- 0-book Total Bases Under 0.5 rows show variance instead of a flat 76 cluster.
- 3+ book and 5-book Total Bases Under 1.5 market-backed rows can score stronger mathematically while still staying DEFERRED_UNPICKABLE if the board side is not selectable.
