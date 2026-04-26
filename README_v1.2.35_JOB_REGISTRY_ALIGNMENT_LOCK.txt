AlphaDog v1.2.35 - Job Registry Alignment Lock

Surgical scope:
- Updated worker/control-room version labels to v1.2.35.
- Added executable job registry helpers.
- Confirmed build_edge_candidates_rbi is a valid manual job and routes to existing buildEdgeCandidatesRbi.
- Added pre-insert unknown-job rejection in /tasks/run so invalid job names do not create failed task_runs.
- Added Daily Health registry_audit block for required jobs and invalid historic job rows.
- Did not change scoring logic.
- Did not change candidate logic.
- Did not change RFI/RBI/Hits builder math.

Required tests after deployment:
1. Health: verify version v1.2.35 - Job Registry Alignment Lock.
2. Daily Health: verify ok=true, status=pass, registry_audit.ok=true, registry_audit_ok=true.
3. Run Build RBI Candidates: verify ok=true and job=build_edge_candidates_rbi, not Unknown job.
4. Run RFI Regression x3: verify ok=true, final=pass, expected_checks=12, returned_checks=12.
