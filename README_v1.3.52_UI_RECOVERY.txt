AlphaDog Main UI v1.0.04 / Build v1.3.52 - UI Recovery Static Controls

Purpose:
- Fixes broken UI controls by making filter checkboxes static HTML instead of JS-generated only.
- Keeps Admin PIN screen and admin freshness console.
- Removes Workers Assets binding from wrangler config so Cloudflare does not scan the whole flat repo or node_modules as assets.
- Main UI worker remains independent from the control/scheduled worker.

Upload to the main UI GitHub repo root:
- main_alphadog_worker.js
- main_alphadog_wrangler.jsonc
- index.html
- .assetsignore
- main_alphadog_package.json
- main_alphadog_logo.png
- main_alphadog_favicon.png
- main_alphadog_apple_touch_icon.png

Cloudflare deploy command:
npx wrangler deploy --config main_alphadog_wrangler.jsonc

Expected:
- Prop checkboxes show immediately.
- Line type checkboxes show immediately.
- Refresh button works.
- Final score dropdown filters without needing refresh.
- Admin button opens PIN modal.
- PIN 3971 opens Admin screen.
