AlphaDog Main UI v1.0.24 - RBI Probability Boot-Safe Lock

Surgical fix from v1.0.22 stable base.

Changes:
- Fixed v1.0.23 boot failure by rebuilding from the last working v1.0.22 UI base.
- RBI tab now reads backend DB audit_payload.hit_probability first.
- Browser-side RBI probability math is fallback only when DB probability is missing.
- RBI remains hidden from the main board and visible only through Menu > RBI.
- Main board remains Hits + Total Bases only.
- Sleeper label remains text-only, no moon emoji.
- Started/unknown-hidden behavior preserved from stable base.
- No backend scoring, scheduled task, D1 write, or database connection logic changed.

Deploy files flat. Use main_alphadog_worker.js and main_alphadog_wrangler.jsonc.
