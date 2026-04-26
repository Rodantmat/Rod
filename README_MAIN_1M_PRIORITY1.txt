OXYGEN-COBALT Main-1M Priority 1 MLB Wiring

Base: stable Main-1L / Worker v100.5 MLB Cleanup Pass.
Scope: surgical rebuild only.

Protected:
- Screen 1 ingestion preserved.
- Parser preserved.
- Layout/CSS preserved.
- UI engine preserved except version label.

Patched:
- Worker upgraded to alphadog-main-api-v100.6 - Priority 1 MLB Matrix Wiring.
- Added safe MLB StatsAPI matrix fills:
  - current player boxscore row
  - current game hits/AB/slot/starter flag
  - recent team runs/hits summary
  - opponent bullpen recent total IP
  - opposing starter recent H allowed and H/IP
  - MLB weather when present
  - MLB officials/home plate umpire when present
- Uses existing MLB API cache table and read-through cache pattern.
- No Gemini calls.
- No scheduled backend changes.
- No cron/task-runner/candidate-builder changes.

Deploy:
npx wrangler deploy -c alphadog-main-api-v100-wrangler.jsonc
