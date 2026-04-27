AlphaDog v1.2.44 - Board Label Stitch

Surgical changes only:
1. Fixed CHECK > Board Queue Estimate by replacing the compound UNION estimate SQL with separate SELECT blocks. This avoids the D1 "too many terms in compound SELECT" failure.
2. Standardized Control Room action labels to BLOCK > BUTTON format for output/status clarity, for example CHECK > Board Health and SCRAPE > Board Queue Build.
3. Added SCRAPE > Board Queue Pipeline as a manual task wrapper for the board queue flow.
4. Added run_board_queue_pipeline job route in the Worker. It materializes board_factor_queue only. No Gemini, no scoring, no ranking.
5. Scheduled handler now attempts the normal full pipeline and then the board queue pipeline. This prepares board_factor_queue automatically after scheduled backend runs when mlb_stats is present.

Protected behavior:
- No candidate scoring logic changed.
- No RFI/RBI/Hits candidate formulas changed.
- No Gemini mining added yet.
- Combo rows remain deferred.
- Existing board queue build remains no-Gemini/no-scoring/no-ranking.
