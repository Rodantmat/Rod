AlphaDog / OXYGEN-COBALT
v1.3.68.1 - RBI Gemini Signal Job Registry Guard

FILES
- worker.js
- control_room.html
- wrangler.jsonc
- package.json
- README_v1.3.68.1.txt

WHAT CHANGED
- Adds a dedicated compact debug job/button for the RBI UNDER 0.5 Gemini signal layer only:
  debug_rbi_gemini_signal_one
- Default test player is Kyle Isbel.
- Optional player override is supported by sending player or player_name in the job body.
- The debug job forces a fresh Gemini API call and bypasses rbi_gemini_under_signals cache.
- The debug job does not write cache rows and does not change main scoring math.
- The debug output exposes the call path and internal decision chain after parsing:
  gemini_call_skipped, skip_reason, cache_used, cache_key, cache_version, cache_signal,
  cache_created_at, forced_fresh_call, api_key_bound, grounding_enabled_or_declared,
  response_text_path_used, json_extract_method, normalizer_input_type, normalizer_output,
  bonus_gate_reason, parsed signal/bonus/usable fields, raw and extracted JSON previews.
- No scoring math changes.
- No candidate board changes.
- No cron/scheduler changes.
- No static/incremental/everyday flow changes.

IMPORTANT EXPECTED BEHAVIOR
- This build is diagnostic first.
- Do not treat Run Full Score Refresh as fixed yet.
- Use the new debug button to prove whether the live Worker Gemini API call returns raw text, whether JSON is extracted, whether normalization passes, and why the bonus gate passes/fails.
- Debug output is compact and preview-limited to avoid browser freeze and D1 SQLITE_TOOBIG style problems.

EXACT TEST SEQUENCE
1. Deploy this ZIP to the scheduled backend/control-room Worker.
2. Open Control Room.
3. Run DEBUG > Health.
   Expected pass signs:
   - version = v1.3.68.1 - RBI Gemini Signal Job Registry Guard
   - ok = true
4. Run SCORING V1 > Debug RBI Gemini Signal One.
   Exact button name: Debug RBI Gemini Signal One
   Expected pass signs:
   - job = debug_rbi_gemini_signal_one
   - player = Kyle Isbel, unless the slate does not contain him
   - forced_fresh_call = true
   - cache_used = false
   - api_key_bound = true
   - gemini_call_skipped = false if the leg is found, line is 0.5, score is over 75, and key exists
   - gemini_http_status = 200 if Gemini API call succeeds
   - response_text_path_used shows candidates[0].content.parts[].text when the API returns normal text
   - raw_text_preview is non-empty
   - json_extract_method is fenced_json, raw_json, or first_object
   - normalizer_input_type = object when JSON parse works
   - normalizer_output shows signal, usable, directMarketEvidence, sourceAllowed, and parser_path
   - bonus_gate_reason explains exactly why bonus passed or failed
5. Only after the debug output proves the failure path, patch the real root cause.
6. After the root-cause patch, use the normal scoring sequence:
   - SCORING V1 > Run Full Score Refresh
   - SCORING V1 > Check MLB Scores
   - SCORING V1 > Build Score Candidate Board
   - SCORING V1 > Inspect Candidate Board
   - SCORING V1 > Export Candidate Board

NOTES
- If Kyle Isbel is not on the active selected slate, the debug job returns debug_leg_not_found_in_current_sleeper_or_prizepicks_rbi_board.
- To test another player, call /tasks/run with job=debug_rbi_gemini_signal_one and player="Player Name".
- The debug job intentionally does not count cached current-version unfavorable rows as proof. It forces the live API call.
