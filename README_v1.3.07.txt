AlphaDog v1.3.07 - Sleeper Video Parser Side Page

Purpose:
- Adds a separate Sleeper Video Parser page for RBI/RFI visual ingestion testing.
- The page uploads a local video to the Worker, calls Gemini through the existing GEMINI_API_KEY secret, and displays parsed lines on screen.
- No database writes yet. This is parse-only.

Files:
- worker.js
- control_room.html
- sleeper_video_parser.html
- wrangler.jsonc
- README_v1.3.07.txt

New endpoints:
- GET  /sleeper/video/parser
- POST /sleeper/video/parse

Gemini model:
- Defaults to gemini-3.1-pro for this video parser only.
- Optional override: set Worker var SLEEPER_VIDEO_GEMINI_MODEL.

Output format:
Player Name - Team - Opponent - Date - Market - Line - Type

Rules:
- Market is read per card.
- RFI = 1st INNING RUNS ALLOWED.
- RBI = RBI.
- Line is read exactly from card.
- Type is regular if LESS is visible, otherwise more only.
- No DB ingest yet.

How to test:
1. Deploy this ZIP.
2. Open: https://<worker-url>/sleeper/video/parser
3. Upload a short Sleeper screen recording.
4. Click Parse Video With Gemini 3.1 Pro.
5. Review parsed lines and raw JSON.

Notes:
- Keep first test videos short/compressed. Inline video upload is capped around 60 MB by this build.
- If the Worker requires INGEST_TOKEN, paste it into the token box.
