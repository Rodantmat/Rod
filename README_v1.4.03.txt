AlphaDog v1.4.03 - RBI Under Power Environment Calibration

Purpose:
- Surgical RBI UNDER 0.5 calibration patch on top of v1.4.02.
- Preserves backend orchestration, HITS scoring, Total Bases scoring, Sleeper RBI promotion, Odds API RBI reinforcement, and Gemini RBI UNDER bonus reuse/fresh-call logic.
- Adds targeted caps/penalties for the exact over-scored RBI UNDER buckets found in top-10 calibration.

What changed:
1. Added ref_player_splits power context into the scoring modifier context when available.
2. Added RBI_POWER_SLOT_RISK_TAX for slots 3-6 with proven HR/SLG/current power signals.
3. Added RBI_MIDDLE_ORDER_PRODUCER_TAX for slots 3-6 with strong RBI production profile.
4. Added C_RBI_POWER_SLOT_RISK_CAP_79 for Sleeper RBI UNDER rows with middle-order proven power and fewer than 2 paired Odds API books.
5. Added C_RBI_MIDDLE_ORDER_PRODUCER_CAP_81 for middle-order producer risk when not strongly odds-backed.
6. Added RBI_COORS_FIELD_UNDER_ENVIRONMENT_TAX and C_RBI_COORS_FIELD_UNDER_CAP_82 for Coors Field RBI UNDER rows.
7. Added C_RBI_HIGH_TOTAL_UNDER_CAP_82 for game totals >= 10.

Expected calibration effect:
- Bottom-order / leadoff low-power RBI UNDERs remain strong.
- Michael Busch / Lourdes Gurriel style middle-order power or proven run-producer rows are pulled out of inflated 86 territory.
- Carson Benge / Coors-style rows are capped lower instead of landing at 86 by default.
- Gemini bonus still works, but it cannot blindly override the power/environment caps without strong Odds API pairing.

Test sequence:
1. Deploy this ZIP to the scheduled backend worker.
2. Open Control Room.
3. Run DATA REFRESHING > Production Clock Status.
4. Run SCORING V1 > Run MLB Scores only if no active scoring run is already running.
5. Wait for completion.
6. Run SCORING V1 > Check MLB Scores.
7. Run Manual SQL top-10 Sleeper RBI UNDER query and confirm v1.4.03 rows show power/environment caps where applicable.
