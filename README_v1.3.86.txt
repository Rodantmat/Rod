AlphaDog v1.3.86 - Incremental Delta Audit Gate Repair

Surgical patch over v1.3.85. Fixes true-delta incremental runs stuck on audit after clean non-zero delta temp logs are staged. Delta audit now certifies clean temp logs without requiring full rebuild thresholds or temp split rows, then advances to promote. Promotion remains INSERT OR REPLACE only, and final live certification still blocks bad completion.
