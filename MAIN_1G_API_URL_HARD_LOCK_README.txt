OXYGEN-COBALT Main-1G API URL Hard Lock

Fix applied:
- Main page now hard-locks backend URL to the isolated API worker when old localStorage/browser input still contains prop-ingestion-git.
- Any saved prop-ingestion-git URL is automatically replaced with https://alphadog-main-api-v100.rodolfoaamattos.workers.dev
- Scheduled worker remains untouched.

Expected debug report after this build:
Worker URL: https://alphadog-main-api-v100.rodolfoaamattos.workers.dev
Daily Health: ok true
/main/health no longer returns Not found.

Note:
RUNS is still intentionally unsupported until we add the RUNS prop adapter. Test HITS/RBI/RFI first for backend packet wiring.
