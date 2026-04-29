AlphaDog v1.2.90 - Incremental Temp Reset Rebuild

Fixes D1 timeout during Clean Incremental Temp by replacing large DELETE operations with DROP + CREATE empty temp tables.

Preserves v1.2.89 idempotent promotion. Live tables are not touched by temp reset/clean.

Test after deploy:
1. CERTIFY TEMP > Clean Incremental Temp
2. INCREMENTAL TEMP > Schedule Daily Refresh Test
3. Wait 8-12 minutes
4. CHECK TEMP > All Incremental Temp
5. CERTIFY TEMP > Audit Incremental Temp
6. CHECK > Incremental All

Expected: Clean returns temp_reset_cleaned, temp counts reset to 0, no D1 timeout, no UNIQUE crash.
