MAIN SYSTEM PHASE 1A — PROTECTED RENAMED SHELL

Base inspected: v13.78.05 OXYGEN-COBALT UI Restoration
Output purpose: rename all main-system support files so they cannot collide with the stable scheduled-task backend files.

Files in this package:
- index.html
- main-system-styles.css
- main-system-parser.js
- main-system-ui-engine.js
- main-system-core.js
- main-system-connectors.js

Surgical changes made:
1. index.html kept as index.html.
2. styles.css renamed to main-system-styles.css.
3. parser.js renamed to main-system-parser.js.
4. ui-engine.js renamed to main-system-ui-engine.js.
5. core.js renamed to main-system-core.js.
6. connectors.js renamed to main-system-connectors.js.
7. index.html script/link references updated to the renamed files.

Protected areas not changed:
- Screen 1 layout unchanged.
- Screen 1 ingestion/parser logic unchanged.
- Screen 2 pool/table layout unchanged.
- No backend Worker code included.
- No scheduled-task code touched.
- No scoring/mining rewrite yet.

Next phase after this passes visual/parser sanity:
Main-1B: audit parser output shape and Screen 2 expected result shape.
Main-1C: design connector adapter for backend packet/scoring endpoint consumption.
Main-1D: wire RFI/RBI/Hits first.
