AlphaDog v1.3.87 - Incremental Delta Promote Executor Repair

Surgical patch over v1.3.86. Fixes true-delta incremental runs that advanced to promote but never executed the promotion tail. v1.3.87 adds a delta promote executor that safely runs INSERT OR REPLACE from player_game_logs_temp into player_game_logs, skips split promotion when delta has zero split rows, cleans temp, rebuilds derived metrics, runs live certification, and completes the request. It also recovers a failed stale promote request if clean temp logs remain.

Test: deploy, confirm Health version, then run Check Incremental Temp. Expected: the prior failed promote delta is reopened/repaired and completes, or an active promote request completes through clean/derived/live certification. Then run Certify Live Incremental.
