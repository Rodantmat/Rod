AlphaDog v1.2.40 - Manual SQL Output Guard

Base: v1.2.39 - Freshness Visibility Expansion.

Surgical change only:
- Added Manual SQL output guard to /debug/sql.
- SELECT/PRAGMA outputs now include row_count, returned_rows, truncated, and output_guard metadata.
- Manual SQL response is capped by default at 50 rows, hard max 100 rows.
- Long text cells are truncated by default at 900 characters, hard max 2000 characters.
- Control Room Manual SQL button now sends max_rows=50 and max_chars=900.

No changes:
- No scoring logic changed.
- No candidate logic changed.
- No schema changed.
- Daily Health logic unchanged except version label.
- RFI Regression x3 logic unchanged except version label.

Required tests:
1. Daily Health: ok=true, status=pass, version v1.2.40 - Manual SQL Output Guard.
2. RFI Regression x3: ok=true, final=pass, regression.complete=true, expected_checks=12, returned_checks=12.
3. Manual SQL guard test: run a large SELECT and confirm http_status=200, manual_sql_output_guard.enabled=true, output_guard.enabled=true, row_count >= returned_rows, returned_rows <= 50, truncated=true when more than 50 rows match.
