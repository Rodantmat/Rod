AlphaDog Expansion Isolated Worker
Version: v0.1.9 - Expansion Control Room 1to1 Mobile Fit

Deploy these flat-root files to the existing alphadog-expansion-v001 Worker.

Core behavior:
- Worker-hosted control room.
- Reads existing PrizePicks current board as source input.
- Writes only to xp_* expansion tables.
- Existing scoring/control-room tables remain read-only.
- Manual SQL is read-only SELECT-only with output guard.

UI fixes in this build:
- Smaller text/buttons/textbox/output to match the original Control Room mobile scale.
- Button runs scroll to the output section with COPY OUTPUT visible.
- Clear SQL and Select SQL do not erase the output console.
- Every command output includes action, function_name, route, HTTP status, version, worker_base, and response.

After deploy, run:
1. Health
2. Apply Schema
3. Counts
4. Refresh Board
5. Counts
6. Load Sample
