OXYGEN-COBALT MAIN-1I MATRIX FILL CACHE

What changed:
- Frontend version bumped to Main-1I Matrix Fill Cache.
- Main API worker version bumped to alphadog-main-api-v100.2 - Matrix Fill Cache Layer.
- Screen 2 matrix rows now show real packet data plus per-factor score/light/label.
- Lights are colorblind-safe with text: 🟢 STRONG, 🟡 REVIEW, 🔴 RISK.
- Screen 2 backend execution is prepared for batches of 4.
- Screen 1 max accepted pool is now 24 legs.
- Main API still has no cron, no task runner, no candidate builders, no bulk scraping.
- Controlled incremental cache writes are allowed only into main_supplemental_leg_cache.
- Scheduled backend worker prop-ingestion-git is untouched.

Deploy main API worker:
npx wrangler deploy -c alphadog-main-api-v100-wrangler.jsonc

Then upload/replace the frontend files on the main page host.

First test:
1. Open the main page fresh.
2. Paste one HITS leg.
3. Ingest & Validate Board.
4. Go to Screen 2 / Analyze.
5. Copy Debug Report.

Expected:
- Daily Health ok=true.
- Packet Status ok.
- Score Status ok.
- Matrix rows show values like "Season AVG 0.237 — 70/100 🟡 REVIEW".
- Incremental Cache shows UPSERT OK into main_supplemental_leg_cache.
