AlphaDog v1.4.36 - PrizePicks Dispatch Fallback Guard

Files:
- worker.js
- control_room.html
- wrangler.jsonc
- package.json

Control Room adjustment:
- Added Run PrizePicks Board Only button under DATA REFRESHING.
- Button enqueues only job_key=prizepicks_board through refresh_orchestrator_enqueue_selected.
- It does not enqueue prizepicks_context, odds jobs, scoring, or cascade jobs.
- Control Room visible/internal version aligned with worker v1.4.36.

Test:
1. Deploy.
2. Open Control Room.
3. DEBUG > Health should show v1.4.36 - PrizePicks Dispatch Fallback Guard.
4. Click DATA REFRESHING > Run PrizePicks Board Only.
5. Verify the queue for the new chain has only prizepicks_board.
