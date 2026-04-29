AlphaDog v1.2.97 - OpenWeather Dual Endpoint Repair

Patch target:
- Phase 2A weather/roof context.
- Repairs OpenWeather routing before Open-Meteo fallback.

Changes:
- OpenWeather primary now tries official 2.5 Current Weather endpoint first.
- If that fails, OpenWeather tries official 3.0 One Call endpoint second.
- If both OpenWeather endpoints fail, Open-Meteo no-key fallback still fills weather context.
- Warnings now include OpenWeather endpoint/status/code/message diagnostics so the root cause is visible from the Run Weather/Roof output.
- Supports secret aliases: OPENWEATHER_API_KEY, OPEN_WEATHER_API_KEY, OPENWEATHERMAP_API_KEY.
- No scoring, no Gemini, no static remine, no incremental history remine.

Test:
1. DEBUG > Health
2. Everyday Phase 2A > Run Weather/Roof
3. Everyday Phase 2A > Check Weather/Roof

Expected:
- If OpenWeather works: source_split/source_counts show openweather_current_2_5 or openweather_onecall_3_0.
- If OpenWeather still fails: warnings include exact endpoint/status/message, and Open-Meteo fills rows safely.
