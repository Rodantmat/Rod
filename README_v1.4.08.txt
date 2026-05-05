AlphaDog v1.4.08 - RBI Under Elite Archetype Gate Repair

Surgical patch only.

What changed:
- Preserves v1.4.07 known-risk caps.
- Repairs the no-book Sleeper RBI UNDER cap rule so true elite RBI-under archetypes can still reach 86 without requiring a Gemini bonus.
- Keeps generic no-book Sleeper RBI UNDER rows capped at 82.
- Keeps non-elite, slot-7-not-elite, power-slot, proven-producer, hard-risk, Coors, and high-total caps intact.

Math simulation before patching:
- J.P. Crawford: remains capped at 82 because slot 5 is mixed opportunity/non-elite.
- Mike Yastrzemski: allowed back to 86 because slot 9 + low RBI rate + zero/low HR profile is a true elite dead-end archetype.
- TJ Friedl: allowed back to 86 because slot 1 + low RBI rate + low HR profile is a true elite table-setter archetype.
- Steven Kwan: allowed above 82 when the raw math supports it because slot 1 + low RBI rate + low HR profile is true elite table-setter archetype.
- Sal Frelick: remains capped at 82 because slot 7 is not elite unless direct market support is strong.
- Ke'Bryan Hayes / Ryan McMahon / Justin Crawford: remain capped at 82 by hard-risk/non-elite gates.

Test sequence:
1. Deploy this ZIP.
2. In Control Room, run: SCORING V1 > Run MLB Scores.
3. Wait 3 minutes.
4. Run: SCORING V1 > Check MLB Scores.
5. Run the v1.4.08 top-10 SQL from the chat.
