AlphaDog v1.2.54 - Compact Split

Patch target:
- Built from the last deployed stable base.
- No scoring change.
- No architecture change.
- No factor change.
- No prompt-family drift.

What changed:
- PLAYER_A_ROLE_RECENT_MATCHUP queue build now uses 2 players per Gemini request.
- PLAYER_D_ADVANCED_FORM_CONTACT queue build now uses 2 players per Gemini request.
- Game/team queues remain unchanged.
- Control Room queue estimate now shows player prompt request count using 2-player batches.

Why:
- 4-player A/D prompts were still large enough for Gemini to truncate JSON.
- 2-player batches should reduce raw JSON length and improve validation success.

Expected effect:
- More queue rows than before.
- Lower truncation risk.
- Raw output only: min_score/max_score/avg_score should remain null for new raw rows.
