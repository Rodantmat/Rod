AlphaDog / OXYGEN-COBALT Build
v1.3.68.2 - RBI Gemini Grounded JSON Payload Fix

Surgical scope:
- Fixes Gemini grounded-search RBI UNDER signal call payload.
- Removes generationConfig.responseMimeType from Google Search tool calls only.
- Keeps strict JSON/fenced-output instructions inside the prompt.
- Parses Gemini JSON from candidates[0].content.parts[].text.
- Captures groundingMetadata grounding chunks/URIs in debug output.
- Forces grounding/citation evidence as part of bonus safety gate.
- Keeps debug_rbi_gemini_signal_one forced fresh/no-cache-write behavior.

Not changed:
- No deterministic scoring math changes.
- No board pickability changes.
- No candidate/export logic changes.
- No cron/scheduler changes.
- No static/incremental/everyday flow changes.
- No main UI changes.

Files included:
- worker.js
- control_room.html
- wrangler.jsonc
- package.json
- README_v1.3.68.2.txt
- BUILD_VERSION_AUDIT_v1.3.68.2.txt

Exact test sequence:
1. Deploy this ZIP.
2. Open Control Room.
3. Run DEBUG > Health.
   Expected: version = v1.3.68.2 - RBI Gemini Grounded JSON Payload Fix
4. Run SCORING V1 > Debug RBI Gemini Signal One.
   Exact button name: Debug RBI Gemini Signal One
   Expected pass signs:
   - job = debug_rbi_gemini_signal_one
   - forced_fresh_call = true
   - cache_used = false
   - api_key_bound = true
   - response_mime_type_removed_for_grounding = true
   - gemini_http_status = 200
   - raw_text_preview is not the old HTTP 400 responseMimeType error
   - response_text_path_used = candidates[0].content.parts[].text or candidates[0].content.parts[0].text
   - json_extract_method = fenced_json, first_object, or raw_json
   - grounding_uris/grounding_sources are present if Gemini found live sources
   - bonus_gate_reason explains pass/fail

After debug passes:
5. Run SCORING V1 > Run Full Score Refresh.
6. Run SCORING V1 > Check MLB Scores.
7. Run SCORING V1 > Build Score Candidate Board.
8. Run SCORING V1 > Inspect Candidate Board.
9. Run SCORING V1 > Export Candidate Board.

Fail signs to report back:
- gemini_http_status still 400
- raw_text_preview still says Tool use with response mime type is unsupported
- raw_text_preview empty with HTTP 200
- json_extract_method = none
- grounding_uris empty when the model claims direct market evidence
- bonus_gate_reason contains grounding_metadata_missing/source_not_allowed_or_missing/direct_market_evidence_missing for a manual-positive test case
