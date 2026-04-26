OXYGEN-COBALT Main-1M Priority 1 Matrix Bridge

Files are flat at ZIP root.
Deploy Worker:
npx wrangler deploy -c alphadog-main-api-v100-wrangler.jsonc

GitHub auto-deploy:
Upload/replace these root files. Cloudflare build should deploy the worker if connected.

Test one leg first:
Shohei Ohtani LAD CHC Hits 0.5 More 1m 19s

Expected:
- Daily Health ok
- Packet ok
- Score ok
- recent_usage populated from MLB StatsAPI
- matrix.groups.priority_1 populated
- incremental_cache writes main_supplemental_leg_cache
- no Gemini call
- scoring remains placeholder; matrix fill is the target
