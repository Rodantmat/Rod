AlphaDog / OXYGEN-COBALT v1.2.69.2 - SQL Auth Restore

Patch base: v1.2.69.1 - Endpoint Anchor.

Purpose:
- Restore isAuthorized(request, env), the compatibility helper used by handleDebugSQL and other protected routes.
- Restore unauthorized(), the shared 401 helper used by protected routes.
- Preserve v1.2.69.1 endpoint anchoring and all backend reliability changes.

No scoring changes. No UI redesign. No factor expansion. No pipeline refactor beyond the existing v1.2.69.x reliability changes.

First test after deploy:
1. DEBUG > Health
   Expected version: v1.2.69.2 - SQL Auth Restore
2. MANUAL SQL:
   SELECT * FROM pipeline_locks ORDER BY lock_id LIMIT 50;

Do not press Full Run until Health and Manual SQL both pass.
