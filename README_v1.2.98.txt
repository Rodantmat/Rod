AlphaDog v1.2.98 - Phase 2B Lineup Confirmation Shell

Files:
- worker.js
- control_room.html

Adds Everyday Phase 2B:
- Run Lineup/Scratch
- Check Lineup/Scratch

Purpose:
- Today-slate lineup confirmation context
- Top-3 / Top-5 / full-9 lineup completeness
- Per-team lineup readiness status
- Late scratch / injury-news shell fields

Safety:
- No Gemini
- No scoring
- No news scraping yet
- No static remine
- No incremental history remine
- Slate-only

Test order:
1. DEBUG -> Health
2. Everyday Phase 2B -> Run Lineup/Scratch
3. Everyday Phase 2B -> Check Lineup/Scratch

Expected:
- game_lineup_context rows = games * 2
- pass or pass_with_warnings
- warnings are acceptable when top-order lineups are incomplete or late-scratch news source is not connected yet
