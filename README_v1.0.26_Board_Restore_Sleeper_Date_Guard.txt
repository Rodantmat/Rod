AlphaDog Main UI v1.0.26 - Board Restore Sleeper Date Guard

Built from the uploaded v1.0.24 Main UI base.
Fixes Sleeper Feed month/day parsing for lines like May 7 9:35AM.
Adds row-level board hydration guard so one bad candidate row cannot crash board loading.
Queues existing deferred full-run rescore after certified Sleeper RBI rows are ingested.
