AlphaDog Expansion v0.1.6 - Expansion UI Brace Repair Certified

Use these files as flat root files only.

Deploy/replace:
1. Cloudflare Worker source: alphadog_expansion_worker.js
2. GitHub Pages control room HTML: alphadog_expansion_control_room.html
3. Keep wrangler.expansion.jsonc only if deploying from GitHub/CLI later.

This build fixes the v0.1.5 brace escaping regression that caused the UI to render as unstyled HTML and prevented the boot script from running.

Expected first screen:
- Dark background
- Green terminal-style text
- Purple/gold buttons
- API Base displays alphadog-expansion-v001.rodantmat.workers.dev on GitHub Pages

Test order:
1. Reload the GitHub Pages control room after replacing HTML.
2. Confirm version v0.1.6 appears.
3. Click Health.
4. Click Apply Schema.
5. Click Refresh Board.
6. Click Counts.
7. Run SQL.
