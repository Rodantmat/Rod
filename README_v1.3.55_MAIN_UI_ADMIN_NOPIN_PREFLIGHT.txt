AlphaDog v1.3.55 / Main UI v1.0.07 - Admin No PIN + Hard Preflight

Changes:
- Removed Admin PIN flow for now. Admin button opens Admin screen directly.
- Fixed missing admin freshness helper functions: okByQuality and strictFresh.
- Hardened Admin date formatting to avoid Safari pattern errors.
- Refresh Full Data sends no PIN; main UI still proxies to the independent scheduled/control worker.
- Preserved board/card behavior and independent main UI worker naming.

Deploy main files to main-alphadog-ui-v100.
Deploy control files only to the scheduled/control worker. Do not mix worker names.
