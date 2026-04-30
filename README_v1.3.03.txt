AlphaDog v1.3.03 - Phase 3A/3B Scheduled Full Run Test

Patch purpose:
- Adds Phase 3A/3B Full Run Test buttons to Control Room.
- Schedules the Phase 3A/3B full-run test for the next minute.
- Uses the existing minute cron to advance the test.
- Adds a global no-parallel lock using pipeline_locks.
- Adds postpone behavior: if the global Phase 3 lock is busy, the deferred run is pushed 15 minutes forward.
- Uses existing Phase 3A/3B tables:
  - board_factor_queue as temp/working queue
  - board_factor_results as promoted/main raw-result storage
- Cleans completed queue/temp rows only when the run finishes cleanly without active/error queue rows.

New Control Room buttons:
- PHASE 3A/3B > Schedule Full Run Test
- PHASE 3A/3B > Run Full Run Tick
- PHASE 3A/3B > Check Full Run

Testing:
1. Deploy worker.js and control_room.html.
2. Open Control Room.
3. Click PHASE 3A/3B > Schedule Full Run Test.
4. Wait about 2 minutes.
5. Click PHASE 3A/3B > Check Full Run.
6. If the check says pending/partial_continue, wait another 2 minutes and check again.
7. If Gemini credit is depleted, the check will show ERROR queue rows. Refill Gemini credits before retrying.

No real daily schedule times are added yet in this patch. This is the one-minute full-run test version first.
