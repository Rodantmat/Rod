v1.4.29 - Scoring Queue Non-Reentry Fix

Fix: Schedule Cascade no longer runs volatile purge/reaper or auto-start tick inside the browser request. It only enqueues rows and returns. Minute cron owns all work.

Test: DEBUG > Health, then DATA REFRESHING > Schedule Cascade with scoring_refresh. Expected: immediate JSON response, not TypeError Load failed.
