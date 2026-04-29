AlphaDog v1.2.87 - Daily Incremental Temp Pipeline

Adds daily protected incremental flow at 1:45 AM PT/PDT:
1. Stage incremental game logs into temp.
2. Stage incremental player splits into temp.
3. Audit/certify temp data.
4. Promote certified temp to live.
5. Clean temp.
6. Rebuild derived metrics after cleanup.

Weekly static flow remains untouched.
