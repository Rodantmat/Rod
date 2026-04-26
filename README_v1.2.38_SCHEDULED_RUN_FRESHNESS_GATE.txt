AlphaDog v1.2.38 - Scheduled Run Freshness Gate

Base:
- Patched from the locked stable previous locked stable zip only.

What changed:
- Added Daily Health freshness gate for scheduled run integrity.
- Daily Health now checks that the slate has fresh successful task_runs for:
  - build_edge_candidates_rfi
  - build_edge_candidates_rbi
  - build_edge_candidates_hits
  - one slate-prep/full-pipeline path: run_full_pipeline, scrape_games_markets, or daily_mlb_slate

Freshness rule:
- Matching task_run must be status='success'.
- Matching task_run must contain the slate date in input_json, output_json, or error.
- Matching task_run must have finished_at/started_at on or after slate_date 00:00:00.

Expected Daily Health result:
- ok=true only when base table checks pass, no stuck running rows exist, no current active slate failures exist, registry audit passes, and freshness_gate.ok=true.

No changes:
- No scoring logic changed.
- No candidate logic changed.
- No schema migration changed.
- No prompt files changed.
