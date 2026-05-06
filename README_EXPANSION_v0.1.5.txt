AlphaDog/OXYGEN-COBALT Expansion Build
v0.1.5 - Expansion Output Preserve CORS-Safe Bridge

Fixes:
- Clear SQL, Select SQL, and Copy Output no longer erase the last real command/manual SQL output.
- Command buttons jump to the output console when clicked.
- Output is shorter and cleaner.
- UI uses a CORS-safe Worker bridge: token is sent by query string and POST uses text/plain to avoid preflight issues on iPhone/GitHub Pages.
- Worker accepts xp_token/admin_token query tokens while preserving the old header token path.

Deploy worker and GitHub Pages HTML together.
