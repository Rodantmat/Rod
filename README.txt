AlphaDog Market Audit Schema-Safe Fix

What changed:
- Fixes CHECK > Market Audit.
- Removes references to spread_away / odds columns that do not exist in the current D1 schema.
- Market Audit now checks:
  1. markets_current count matches games count
  2. every market row joins to a valid game row
  3. schema-safe sample/info count

No worker logic change required, but worker.js is included unchanged for flat upload consistency.

Upload:
- control_room.html
- worker.js optional/unchanged

Test:
CHECK > Market Audit
CHECK > Final Feed Audit
