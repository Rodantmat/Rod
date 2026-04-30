AlphaDog v1.3.12 - Sleeper Text Board Ingest

Adds a text-based Sleeper RBI/RFI board ingest page.

New page:
GET /sleeper/text/ingest

New endpoints:
POST /sleeper/text/parse  - parse preview only, no DB write
POST /sleeper/text/save   - parse and upsert into sleeper_rbi_rfi_board
GET  /sleeper/text/check  - summary/recent rows for slate

New D1 table created automatically:
sleeper_rbi_rfi_board

Input format:
Player Name - Team - Opponent - Date - Market - Line - Type

Examples:
Colt Keith - DET - @ ATL - Thu 9:15am - RBI - 0.5 - regular
Kevin Gausman - TOR - MIN - Thu 4:40pm - RFI - 0.5 - regular

Rules:
- RBI and RFI are accepted.
- Original line is stored.
- Normalized downstream target line is stored as 0.5.
- RBI target side = UNDER_0_5_RBI.
- RFI target side = NRFI_UNDER_0_5_FIRST_INNING.
- No Gemini API call is used in this text ingest page.
- No scoring is added.
- No Phase 3 schedule changes.
