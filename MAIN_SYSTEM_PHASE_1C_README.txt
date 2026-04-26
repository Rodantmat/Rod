MAIN SYSTEM PHASE 1C — DB WIRING STARTER

Purpose:
- Keep Screen 1 ingestion/parser intact.
- Keep Screen 2 matrix layout intact.
- Start wiring Screen 2 to the stable Cloudflare Worker/D1 backend.
- Do NOT change scheduled backend files.

What this build adds:
1. Backend Worker URL field on Screen 2.
2. Optional Slate Date field on Screen 2.
3. Optional INGEST_TOKEN field on Screen 2.
4. Daily Health live check through /health/daily.
5. Per-leg backend payload builder.
6. Per-leg safe probe to /packet/leg and /score/leg for RFI/RBI/Hits.
7. Matrix fields now show Daily Health/table-check data when available.
8. Packet/score failures are shown as warnings instead of crashing the card.

Important:
- This is NOT final scoring yet.
- This is NOT a backend patch.
- If /packet/leg or /score/leg fail, that is expected at this stage and will identify the next backend endpoint patch.
- RFI/RBI/Hits are the first supported families.
- Other prop families are marked adapter pending.

Default Worker URL:
https://prop-ingestion-git.rodolfoaamattos.workers.dev

Recommended slate test date from verified backend runs:
2026-04-25

Test steps:
1. Open index.html.
2. Paste board legs.
3. Click Ingest & Validate Board.
4. Click Go to Screen 2 / Analyze.
5. In Slate Date, enter 2026-04-25.
6. Confirm Daily Health shows pass.
7. Open player matrix sections.
8. Confirm table checks populate from backend health.
9. Confirm packet/score errors are contained inside matrix warnings, not app crashes.
10. Click Re-run DB Wiring after changing Slate Date or Worker URL.

Pass condition:
- Screen 1 still works.
- Screen 2 opens.
- Daily Health loads.
- Cards do not crash.
- Matrix shows real backend health data.
- Unsupported or endpoint-missing states are visible and contained.
