AlphaDog v1.3.54 Control Admin Bridge Route Lock

Purpose:
- Keeps /main-ui/admin-refresh/start route on the control/scheduled worker.
- Keeps the background waitUntil full refresh bridge.
- Does not touch main UI worker.

Deploy to control/scheduled worker repo only.
