ALPHADOG v1.2.95 - Phase 1 Auto Runner

Patch purpose:
- Fixes Phase 1 manual one-step-per-tick behavior.
- Run Baseline Tick now auto-continues through bounded today-slate-only Phase 1 steps.
- Keeps scope limited to today slate: games, markets, starters, bullpens, lineups, usage, candidates.
- Does not remine static data.
- Does not remine incremental historical logs/splits/derived base.
- Does not call Gemini.
- Lineups are non-blocking/retry-later when not posted.
- Check Baseline reports auto-runner mode, latest output preview, and running-age warning.

Deploy files:
- worker.js
- control_room.html

Test order:
1. DEBUG > Health
   Expected version: v1.2.95 - Phase 1 Auto Runner

2. EVERYDAY PHASE 1 > Schedule Baseline Test

3. EVERYDAY PHASE 1 > Run Baseline Tick
   Expected: it processes multiple steps in one response.

4. EVERYDAY PHASE 1 > Check Baseline
   Expected: games/markets/starters/bullpens/usage populated.
   Lineups may still warn if not posted.
   Candidate warnings are acceptable until candidate builders have valid slate inputs.

Root cause fixed:
The long delay was not slow mining. Phase 1 only advanced one step per manual tick, so it waited between clicks. v1.2.95 auto-advances bounded steps in one run.
