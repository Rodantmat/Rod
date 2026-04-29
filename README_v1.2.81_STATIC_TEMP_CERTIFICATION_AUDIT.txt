AlphaDog v1.2.81 - Static Temp Certification Audit

Adds protected temp certification workflow for truly static weekly data only:
- ref_venues_temp
- ref_team_aliases_temp
- ref_players_temp

New jobs/buttons:
1. CERTIFY TEMP > Audit Static Temp
   Validates temp staging counts, duplicates, critical nulls, invalid roles, team coverage, low roster counts, stale timestamps, and temp-vs-live count drift. Produces certification_grade A+, A, B, or FAIL. Promotion is allowed only for A+ or A.

2. CERTIFY TEMP > Promote Temp To Live
   Blocked unless the latest temp refresh is completed and the latest audit is A or A+ for that exact refresh request. Promotes temp venues, aliases, and players into live trusted tables.

3. CERTIFY TEMP > Clean Static Temp
   Clears only the temp staging tables after promotion. Live tables and audit logs are preserved.

Safe test order:
1. Schedule Static Temp
2. Wait until completed
3. Check Static Temp
4. Audit Temp
5. Promote Temp only if audit grade is A/A+
6. Clean Temp after confirming promotion

Old scheduled mining/full-run work remains paused. The one-minute cron only advances pending static temp refresh ticks.
