AlphaDog v1.5.04.6 - Orchestrator Zombie Cleanup Gate

Patched from the user-provided v1.5.04.5 package.

Root fixes:
- Blocks duplicate selected-job enqueue before a second active row can be inserted.
- Adds data_orchestrator_enqueue_locks as an idempotency guard for same job/slate/mode requests.
- Cleans duplicate pending/running queue rows, keeping the current/progress row and cancelling extras.
- When stale global lock recovery fires, it also reconciles matching job running_flag/run_requested_flag and requeues the matching queue row if still active.
- Clears zombie running_flag rows when the global lock is already released.
- Releases enqueue locks on completed/failed/failed_exception terminal rows.

Do not run cascade first. Run the test sequence in the response exactly.
