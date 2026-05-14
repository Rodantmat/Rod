AlphaDog v1.5.10.11 - Minute Hot Lane Priority Gate

Deploy this ZIP to the scheduled backend worker.

This build patches the cron starvation/regression path: selected/manual queue work now gets minute-cron priority before production clock scans, and Incremental Daily creates its child temp run at enqueue.

Use the SQL commands from chat, not this README.
