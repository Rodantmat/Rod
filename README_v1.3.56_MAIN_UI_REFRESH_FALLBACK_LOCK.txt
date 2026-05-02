AlphaDog Main UI v1.0.08 - Admin Refresh Fallback Lock

Patch scope:
- Main UI worker only.
- No control-room/scheduled-worker changes.
- No DB writes from main UI except calling the existing backend refresh endpoint.
- Admin PIN remains disabled.
- Refresh Full Data now tries the locked control worker origin first, then /main-ui/admin-refresh/start, then stable /deferred/full-run fallback.
- A bad CONTROL_WORKER_URL secret can no longer trap the UI at root path /.

Test sequence:
1. Deploy this main UI worker.
2. Open /main_alphadog_health. Expect v1.0.08 and db_bound true.
3. Open the board. Expect cards to load.
4. Tap Admin. No PIN should appear.
5. Tap Refresh Full Data. Expect Data Refresh Started popup.
6. If it fails, copy the attempts array from response; the UI now reports each attempted URL.
