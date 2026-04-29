AlphaDog v1.2.96 - Phase 2A Weather/Roof Context

Files:
- worker.js
- control_room.html

Adds Everyday Phase 2A:
- Run Weather/Roof
- Check Weather/Roof

Behavior:
- Today-slate only
- Uses OPENWEATHER_API_KEY as primary source
- Uses Open-Meteo no-key fallback if OpenWeather fails or key is missing
- Writes game_weather_context
- Stores weather, wind, precipitation, cloud, pressure, roof context, and weather risk
- No Gemini
- No scoring
- No static remine
- No incremental/history remine

Important:
- Open-Meteo does not require a secret.
- OpenWeather secret name is OPENWEATHER_API_KEY.
- Retractable roof status is not automatically confirmed in this build; those games are marked roof-dependent.

Test order:
1. DEBUG -> Health
2. Everyday Phase 2A -> Run Weather/Roof
3. Everyday Phase 2A -> Check Weather/Roof

Expected:
- version: v1.2.96 - Phase 2A Weather/Roof Context
- weather_context_rows should match today games count
- if OpenWeather succeeds, source_split should show openweather_current
- if fallback is used, source_split should show open_meteo_current_no_key with a warning
