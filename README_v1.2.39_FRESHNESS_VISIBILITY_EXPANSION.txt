AlphaDog v1.2.39 - Freshness Visibility Expansion

Base: v1.2.38 - Scheduled Run Freshness Gate.

Surgical change only:
- Adds scheduled.latest_required_jobs to Daily Health.
- Shows the latest slate-fresh successful run per required scheduled job: run_full_pipeline, build_edge_candidates_rfi, build_edge_candidates_rbi, build_edge_candidates_hits.
- Keeps freshness_gate as the blocking source of truth.
- Does not change scoring logic, candidate logic, database schema, or prompt files.

Required tests:
1. Daily Health: ok=true, status=pass, version v1.2.39 - Freshness Visibility Expansion.
2. scheduled.freshness_gate.ok=true.
3. scheduled.latest_required_jobs.ok=true, expected_jobs=4, returned_jobs=4.
4. RFI Regression x3: ok=true, final=pass, complete=true, expected_checks=12, returned_checks=12.
