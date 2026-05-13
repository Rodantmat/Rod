AlphaDog/OXYGEN-COBALT v1.5.09.8 - Odds Runner No-Silent-Hang Gate

Purpose:
- Surgical Odds API regression patch only.
- Fixes v1.5.09.7 silent Odds hang where odds_api_morning could remain RUNNING with output_json = null and zero odds_api_requests_temp rows.

Changes:
1. Adds first-line Odds queue progress before resolver, table setup, slate resolution, or fetch.
2. Adds bounded Odds key resolver path with explicit resolver_completed / failed output.
3. Adds bounded table setup and slate-resolution gates.
4. Adds fetch timeout to Odds API HTTP calls so fetch cannot hang silently.
5. Adds visible progress checkpoints for first fetch, event selection, prop fetch, temp write, certification, promotion, and cleanup.
6. Restores existing-temp certification/promote finalizer behavior so temp rows can be certified instead of refetched.

Not touched:
- Scoring math
- PrizePicks board/context logic
- Main UI
- Slate AUTO
- Candidate board scoring
- Clean Run State logic except existing behavior remains available before testing

Expected pass condition:
- Odds queue row must never stay RUNNING with output_json = null.
- If resolver/key fails, it fails explicitly.
- If fetch starts, odds_api_requests_temp receives rows quickly or a fetch timeout/error is written.
- Successful Odds run certifies/promotes and the cascade advances.
