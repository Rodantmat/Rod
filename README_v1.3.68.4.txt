AlphaDog / OXYGEN-COBALT
v1.3.68.4 - RBI Gemini Parser Hardening

SCOPE
- Surgical patch on top of the prior RBI Gemini main-layer promotion build.
- Hardens grounded Gemini RBI UNDER JSON extraction against duplicated fenced JSON, malformed fenced output, and truncated/unbalanced responses.
- Adds one automatic retry with stronger format-repair wording and larger maxOutputTokens when JSON extraction fails.
- Adds compact parse-failure accounting to the full scoring summary.
- Keeps Gemini RBI market signal as over-75 RBI UNDER small bonus/tiebreaker only.
- No scoring math changes.
- No candidate board/pickability changes.
- No cron changes.
- No static/incremental/everyday flow changes.

FILES
- worker.js
- control_room.html
- wrangler.jsonc
- package.json
- README_v1.3.68.4.txt
- BUILD_VERSION_AUDIT_v1.3.68.4.txt

TEST SEQUENCE
1. Deploy this ZIP.
2. Control Room: DEBUG > Health
   Expected: version = v1.3.68.4 - RBI Gemini Parser Hardening.
3. Control Room: SCORING V1 > Debug RBI Gemini Signal One
   Expected: Gemini call-path output includes json_parse_failure_type/json_parse_attempts_count/gemini_retry_count/parse_attempts. If first response is malformed, retry should attempt repair.
4. Control Room: SCORING V1 > Run Full Score Refresh
   Expected: eligible_over75 > 0, attempted > 0, favorable may be > 0 when market evidence exists, gemini_signal_bonus_rows > 0 if favorable signals exist.
   Expected compact summary now includes call_failures, parse_failures, malformed_or_truncated, retry_successes.
5. Control Room: SCORING V1 > Check MLB Scores
6. Control Room: SCORING V1 > Build Score Candidate Board
7. Control Room: SCORING V1 > Inspect Candidate Board
8. Control Room: SCORING V1 > Export Candidate Board

PASS SIGNS
- No REJECTED_UNKNOWN_JOB.
- No hard JSON MIME + grounding 400 error.
- Full score refresh remains compact-output guarded.
- If Gemini returns malformed/truncated JSON, parse failure is counted instead of silently disappearing.
- If retry repairs the output, retry_successes increments.
