AlphaDog v1.3.08 - Sleeper Video Parser Event Log

Files:
- worker.js
- control_room.html
- sleeper_video_parser.html
- wrangler.jsonc

Changes from v1.3.07:
- Removed visible Worker endpoint field.
- Removed visible ingest token field.
- Hardcoded parser endpoint to https://prop-ingestion-git.rodolfoaamattos.workers.dev/sleeper/video/parse.
- Automatically loads TOKEN from https://raw.githubusercontent.com/Rodantmat/Rod/main/config.txt using the same control-room pattern.
- Uses x-ingest-token header automatically when TOKEN is loaded.
- Added on-page Event Log at the bottom.
- Worker response includes server-side event_log.
- Parse-only. No Sleeper table or DB ingest yet.
- Gemini model remains gemini-3.1-pro by default.
