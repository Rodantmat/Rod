AlphaDog v1.4.33 - Volatile Audit Clamp Final

Purpose
- Permanent volatile-data cleanup guard for production scheduled backend.
- Stops scoring_audit_logs from growing by retry/run.
- Keeps Schedule Cascade enqueue-only.
- Keeps scoring queue-owned and non-reentrant.
- Preserves visible selected-slate board until a replacement publish succeeds.

Locked fixes
1. scoring_audit_logs is compact current-run diagnostics only.
2. Row-level scoring audit remains in active_score_board.audit_payload and score_candidate_board.audit_payload, not in scoring_audit_logs.
3. Same-slate scoring audit rows are cleared at scoring start; older slate audit rows are purged by volatile preflight.
4. Same-slate old scoring_runs are cleared after the new run is proven eligible and again after success, leaving the latest run only.
5. Candidate board is not deleted before a successful replacement publish.
6. Odds API temp tables still clear at start and after promotion/failure.
7. Schedule Cascade stays fast: enqueue only, no browser scoring/tick/purge work.
8. Queue stale killer remains active for orphan pending/running scoring rows.

Deploy target
- Worker: alphadog-phase3-starter-groups
- Config: wrangler.jsonc

Test sequence
1. Deploy this ZIP.
2. Run DEBUG > Health. Confirm version v1.4.33 - Volatile Audit Clamp Final.
3. Run DATA REFRESHING > Schedule Cascade with only Scoring + Candidate Board selected.
4. Wait 2-4 minute cron ticks.
5. Run Manual SQL #1 from the assistant response to verify queue completion.
6. Run Manual SQL #2 from the assistant response to verify candidate board rows.
7. Run Manual SQL #3 from the assistant response to verify scoring_audit_logs is compact.
