AlphaDog v1.3.04 - Phase 3A/3B Throttled Full Run Test

Fixes v1.3.03 Cloudflare error: Too many API requests by single Worker invocation.

Change:
- Run Full Run Tick now performs one bounded unit per invocation: one queue build pass OR one mining wave with limit 1 OR cleanup/check.
- Deferred jobs re-queue for the next minute while status is partial_continue.
- Keeps global no-parallel lock behavior.

Test:
1. Deploy.
2. Click PHASE 3A/3B > Run Full Run Tick.
3. Wait 2 minutes.
4. Click PHASE 3A/3B > Check Full Run.
5. Repeat tick/check until completed or until Gemini billing/error rows are reported.
