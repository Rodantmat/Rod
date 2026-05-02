AlphaDog v1.3.54 Main UI Constant Fix + Strict Freshness

Fixes:
- Defines ACTIVE_PROP_FAMILIES so /main_alphadog_board stops failing.
- Keeps flat root deployment.
- Tightens Admin freshness scoring so old manual/intraday data drops below green and shows red X when quality is below 85.
- Keeps Admin PIN at 3971.

Deploy to main UI worker repo only.
