AlphaDog v1.3.11 - Sleeper Video Parser Active File Diagnostics

Purpose:
- Patch the Sleeper RBI/RFI video parser after the File API upload succeeded but generate returned an empty raw_text.

Research basis:
- Gemini video understanding docs recommend the Files API for video inputs and note video processing via file_data.
- Gemini Files API docs require uploaded files to be available/ACTIVE before generateContent usage.

Changes:
- Keeps Gemini model default as gemini-3.1-pro-preview.
- Verifies the Gemini file state is ACTIVE server-side before generateContent.
- Adds Gemini safetySettings BLOCK_NONE for the generate step.
- Attempts generateContent once with responseMimeType application/json, then retries once without responseMimeType if the text response is empty.
- Returns detailed Gemini diagnostics when raw text is still empty:
  - finish reasons
  - promptFeedback
  - safety ratings
  - usageMetadata
  - raw response previews
- Preserves the full server JSON in the page error instead of only showing {raw_text:""}.

Still parse-only:
- No Sleeper database table yet.
- No ingest yet.
