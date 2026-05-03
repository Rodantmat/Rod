AlphaDog Main UI v1.0.12 - RBI Menu Source Badges

Worker: main-alphadog-ui-v100
Base: v1.0.11 - Pickability Start-Time Gate

Surgical changes only:
- Replaced visible Admin button with burger menu.
- Burger menu now opens Board, RBI, and Admin.
- Main board now defaults RBI checkbox OFF, while RBI remains available if manually checked.
- Added RBI screen for RBI Under 0.5 Sleeper-first strategy.
- RBI screen only uses not-started / outside 15-minute gate rows already released by the backend board endpoint.
- RBI screen rejects detected top-six lineup slots and detected high-risk parks.
- RBI screen highlights Sleeper-certified source, Poisson under estimate when lambda fields exist, lineup slot when available, and same-team correlation pool.
- Main cards now show board source under the Goblin/Demon/Regular badge: PrizePicks, Sleeper, or Market.
- Worker board response now hydrates Sleeper board source metadata when a certified Sleeper RBI Under row is found.

Preserved:
- Main UI worker remains read-only.
- No cron.
- No scheduled handler.
- No scoring writes.
- No Gemini calls.
- No Control Room / prop-ingestion-git code touched.
- Existing 15-minute pickability start gate preserved.

Deploy:
1. Deploy only to main-alphadog-ui-v100.
2. Do not deploy this ZIP to prop-ingestion-git.
3. After deploy, open /main_alphadog_health and confirm version v1.0.12.
4. Open root UI, confirm burger menu opens.
5. Confirm main board RBI checkbox starts unchecked.
6. Confirm cards show source badge under line type.
7. Open RBI from menu and confirm RBI Under screen loads.
