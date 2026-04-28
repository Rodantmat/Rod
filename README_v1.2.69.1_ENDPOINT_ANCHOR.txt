AlphaDog / OXYGEN-COBALT v1.2.69.1 - Endpoint Anchor

Purpose:
Emergency correction after v1.2.69 changed the control-room public endpoint to alphadog-phase3-starter-groups. The direct browser test showed that hostname returns Cloudflare “There is nothing here yet,” while the previously working control-room endpoint was prop-ingestion-git and the Worker health body reports the internal worker label alphadog-phase3-starter-groups.

Deployment target behavior:
- Public Workers URL used by control_room.html: https://prop-ingestion-git.rodolfoaamattos.workers.dev
- Internal health worker label returned by worker.js: alphadog-phase3-starter-groups
- Config file included for GitHub root deploy: wrangler.jsonc
- wrangler.toml is intentionally not included because the GitHub root uses wrangler.jsonc.

Backend reliability content preserved from v1.2.69:
- scheduler split/lightening
- lock hardening
- stale RUNNING recovery
- Full Run dispatcher protection
- starter overwrite protection
- Auto Miner family rotation
- canonical result writes
- safe schema guards
- no scoring
- no UI redesign
- no factor expansion
- no old ZIP merge

First test after deploy:
1. Open/reload control_room.html from the deployed source.
2. Press DEBUG > Health only.
3. Expected body:
   ok: true
   version: v1.2.69.1 - Endpoint Anchor
   worker: alphadog-phase3-starter-groups

Do not press Full Run until Health passes.
