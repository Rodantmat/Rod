AlphaDog Expansion Worker
v0.1.2 - Expansion Worker-Hosted Control Room

Files are flat-folder only.

What changed in v0.1.2:
- The Expansion Control Room is now served directly by the Expansion Worker at the worker root URL.
- The UI no longer asks for an Expansion Worker Base URL.
- The admin token remains embedded in the matching worker/control-room build.
- Health, Apply Schema, Refresh, Counts, Jobs, Logs, Sample, Manual SQL, and Copy Output all run against the same worker origin.
- Manual SQL is read-only and allows SELECT, WITH, and PRAGMA only.
- Writes remain isolated to xp_* tables only.
- Existing Main UI, current scoring worker, and current control room are not touched.

Important open rule:
Open the Worker URL itself, not GitHub Pages. The root page of the deployed worker is the control room.

Test sequence:
1. Open the deployed Expansion Worker URL.
2. Press Health.
3. Press Apply Schema.
4. Press Refresh Pickable Board.
5. Press Counts.
6. Pick Hitter Strikeouts and press Load Sample.
7. Press Run Manual SQL.
8. Press Copy Output.

Expected:
- Health returns JSON with control_room_served_by_worker true.
- Apply Schema returns ok true.
- Refresh writes only xp_* rows.
- Counts returns target prop groups.
- Manual SQL returns rows from xp_prop_lines_current.
