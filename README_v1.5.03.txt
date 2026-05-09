AlphaDog / OXYGEN-COBALT
v1.5.03 - PrizePicks Ten Check Wait Gate

Patch purpose:
- Fixes v1.5.02 behavior where PrizePicks Board could still finalize as failed before the real 10-check timeout because the generic terminal-fail logic used the job max_attempts value.
- PrizePicks Board waiting/dispatched states now remain locked/running until either:
  1) fresh board update is certified, or
  2) the explicit PrizePicks 10-check timeout creates PRIZEPICKS_BOARD_REFRESH_TIMEOUT.
- Missing GitHub dispatch configuration remains an immediate hard fail.

Expected test:
1. Deploy files.
2. DEBUG > Health must show v1.5.03 - PrizePicks Ten Check Wait Gate.
3. DATA REFRESHING > PrizePicks Board Only.
4. Wait 4-6 minutes.
5. DATA REFRESHING > Orchestrator Status.

Expected during wait:
- data_orchestrator_state.lock_flag = 1
- prizepicks_board.running_flag = 1
- data_refresh_queue.status = running
- logs show wait_check / waiting_locked
- no downstream job starts

Expected terminal behavior:
- If board refresh certifies before 10 checks: job completes and lane releases.
- If board refresh does not certify after 10 checks: job hard-fails as PRIZEPICKS_BOARD_REFRESH_TIMEOUT, lane releases, dependent jobs block.
