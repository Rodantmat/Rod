AlphaDog v1.4.27 - Scoring Lock Wait Queue Fix

Fixes scoring_refresh lock-wait handling so SCORING_LOCK_WAIT_RETRY_NEXT_TICK remains pending instead of being marked completed. Schedule Cascade remains fast-return/backend-owned. Volatile overwrite/temp cleanup guard remains in place.
