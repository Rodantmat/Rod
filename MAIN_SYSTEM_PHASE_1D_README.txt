OXYGEN-COBALT Main-1D Report Log Guard

Purpose:
- Adds a Copy Debug Report button to Screen 2.
- Adds a System Log at the bottom of Screen 2.
- Captures ingest, Daily Health refresh, DB wiring, per-leg packet/score probe, success, warning, and failure states.
- Debug report includes Screen 1 ingest summary, Daily Health, leg matrix state, packet/score request state, warnings, and full system log.

Protected rules:
- Screen 1 parser unchanged.
- Screen 2 matrix preserved.
- No scoring logic added.
- No Gemini calls added.
- No scheduled backend changes.
- API key txt file is not used in this build.

Test:
1. Open index.html.
2. Paste one MLB leg.
3. Click Ingest & Validate Board.
4. Click Go to Screen 2 / Analyze.
5. Confirm System Log appears at bottom.
6. Click Refresh Daily Health.
7. Confirm a log row appears showing success or failure.
8. Click Re-run DB Wiring.
9. Confirm log rows appear for queued leg and endpoint result.
10. Click Copy Debug Report.
11. Paste into chat and verify it includes Screen 1 summary, Daily Health, leg matrix state, and System Log.
