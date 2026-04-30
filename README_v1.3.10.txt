AlphaDog v1.3.10 - Sleeper Video Parser File API Progress

Scope:
- Sleeper video parser side page only.
- No database ingest yet.
- No Phase 3A/3B scheduler changes.

Fixes:
- Replaces frontend base64 upload with multipart/form-data upload.
- Adds real XMLHttpRequest upload progress bar.
- Adds Gemini Files API resumable upload endpoints in worker.js.
- Adds Gemini file status polling endpoint.
- Adds separate generate endpoint using uploaded file_uri.
- Keeps same x-ingest-token auth pattern from Control Room config.txt.
- Keeps Gemini API key only in Cloudflare Worker secret.
- Supports video/mp4 and video/quicktime MIME types from upload.
- Adds stronger prompt instruction to ignore large stylized background text and read only small clear team abbreviations.

Endpoints:
- GET  /sleeper/video/parser
- POST /sleeper/video/upload
- GET  /sleeper/video/status?file_name=files/...
- POST /sleeper/video/generate
- POST /sleeper/video/parse remains as a backwards-compatible endpoint, but inline JSON video_base64 is limited and not recommended.

Model:
- Default SLEEPER_VIDEO_MODEL = gemini-3.1-pro-preview
- Can be overridden with Cloudflare env var SLEEPER_VIDEO_GEMINI_MODEL

Test:
1. Deploy.
2. Open /sleeper/video/parser.
3. Upload mp4 or iPhone mov/quicktime clip.
4. Watch upload progress bar.
5. Wait for Gemini file processing.
6. Review Parsed Lines, Raw JSON, and Event Log.
