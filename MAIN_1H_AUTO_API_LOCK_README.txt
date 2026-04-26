OXYGEN-COBALT MAIN-1H AUTO API LOCK

Purpose:
- Frontend is hard-locked to the isolated read-only main API worker.
- Removed visible Worker URL, Slate Date, and Token fields from Screen 2.
- Clears old localStorage backend URL/token so prop-ingestion-git cannot persist from prior builds.
- Uses cache-busting renamed JS/CSS file names with ?v=main1h.

Expected debug report after upload:
Frontend Version: v13.78.05 (OXYGEN-COBALT) • Main-1H Auto API Lock
Worker URL: https://alphadog-main-api-v100.rodolfoaamattos.workers.dev
Daily Health: ok true

Upload all files in this ZIP to the main page/static site.
Do not upload these files into prop-ingestion-git scheduled worker deployment unless you intentionally keep frontend/static files there only.
