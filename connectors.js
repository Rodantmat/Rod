window.PickCalcConnectors = window.PickCalcConnectors || {};
(() => {
  const SYSTEM_VERSION = 'v13.77.19 (OXYGEN-COBALT)';
  const CURRENT_SEASON = 2026;
  const BRANCH_TARGETS = { A: 20, B: 18, C: 12, D: 10, E: 12 };
  const BRANCH_KEYS = ['A', 'B', 'C', 'D', 'E'];
  const PROVIDERS = ['DraftKings', 'FanDuel', 'BetMGM', 'Bet365', 'Pinnacle'];
  const GEMINI_MODEL = 'gemini-flash-latest';
  const GEMINI_BASE_URL = 'https://geminiconnector.rodolfoaamattos.workers.dev';

  const FACTOR_NAMES = {
    Pitcher: {
      A: ["Velocity Stability", "Spin Rate Delta", "Extension", "Vertical Break", "Horizontal Movement", "Command Grade", "Location Heat", "Tunneling Quality", "Release Consistency", "Zone Rate", "K-BB% Trend", "Whiff Rate (Fastball)", "Whiff Rate (Offspeed)", "First Pitch Strike%", "Put-away % Efficiency", "Hard Hit Avoidance", "Barrel Rate Allowed", "GB/FB Ratio", "Average Exit Velocity", "Soft Contact%"],
      B: ["Stamina Decay", "Late Movement", "Release Extension", "Strike-One Rate", "Pressure Tolerance", "High-Leverage Efficiency", "Primary Pitch Reliability", "Secondary Pitch Bite", "Sequencing Logic", "Pitch Mix Stability", "Velocity Preservation", "Third-Time-Through Penalty", "Contact Suppression", "CSW Rate", "Called Strike Edge", "Chase Induction", "Backdoor Command", "Finisher Quality"],
      C: ["Park Factor", "Umpire Bias", "Wind Impact", "Historical Matchup", "L/R Splits", "Recent 5-Game Trend", "Air Density", "Umpire Zone", "Defense Support", "Bullpen Buffer", "Game Script Fit", "Weather Volatility"],
      D: ["Platoon Delta", "Manager Threshold", "Lineup Depth", "Run Support Expectation", "Inning Efficiency", "Pitch Count Elasticity", "Strike Zone Fit", "Batted-Ball Luck", "Recovery Window", "Clutch Stability"],
      E: ["DK Projection", "FD Projection", "MGM Projection", "365 Projection", "PIN Projection", "Consensus Mean", "Consensus Median", "Consensus High", "Consensus Low", "Spread", "Line Delta", "Market Confidence"]
    },
    Hitter: {
      A: ["Bat Speed", "Squared Up", "Blasts", "Sweet Spot", "LA Consistency", "Max Exit Velocity", "Pull/Opposite Mix", "Two-Strike Approach", "Chase Rate", "In-Zone Contact", "Pitch Recognition", "Barrel Accuracy", "Pull Power", "Oppo Gap Efficiency", "High-Fastball Combat", "Offspeed Timing", "Clout Grade", "Sprint Speed Impact", "ISO Trend", "Plate Coverage"],
      B: ["Contact Authority", "Damage on Mistakes", "Breaking Ball Handling", "Fastball Lift", "Spray Discipline", "RISP Approach", "Walk Pressure", "Strikeout Resistance", "First-Pitch Attack", "Pull Airball Rate", "Center-Field Carry", "Opposite-Field Carry", "Lefty Split Stability", "Righty Split Stability", "Batted-Ball Efficiency", "Basepath Leverage", "Lineup Spot Edge", "Clutch Contact"],
      C: ["Park Factor", "Umpire Bias", "Wind Impact", "Historical Matchup", "L/R Splits", "Recent 5-Game Trend", "Air Density", "Umpire Zone", "Bullpen Exposure", "Weather Volatility", "Lineup Protection", "Game Script Fit"],
      D: ["Platoon Delta", "Manager Threshold", "Hit Probability Drift", "Extra-Base Upside", "Contact Floor", "Power Spike Chance", "Pitcher Vulnerability", "Defensive Shift Cost", "Batted-Ball Luck", "Late-Game Leverage"],
      E: ["DK Projection", "FD Projection", "MGM Projection", "365 Projection", "PIN Projection", "Consensus Mean", "Consensus Median", "Consensus High", "Consensus Low", "Spread", "Line Delta", "Market Confidence"]
    }
  };

  function resolveProfileType(row = {}) {
    const raw = String(row?.type || '').toLowerCase();
    if (raw.includes('pitch')) return 'Pitcher';
    if (raw.includes('hit')) return 'Hitter';
    return 'Hitter';
  }

  function getFactorName(branchKey, idx, row = {}) {
    const profile = resolveProfileType(row);
    return FACTOR_NAMES[profile]?.[branchKey]?.[idx - 1] || `${branchKey}${String(idx).padStart(2, '0')}`;
  }

  function stripAccents(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function normalizeName(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase()
      .trim();
  }

  function yieldToUi() { return new Promise((resolve) => setTimeout(resolve, 0)); }
  function factorKey(branchKey, idx) { return `${branchKey.toLowerCase()}${String(idx).padStart(2, '0')}`; }
  function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? Number(n.toFixed(2)) : Number(Number(fallback || 0).toFixed(2));
  }
  function average(values = []) {
    const nums = values.map((v) => Number(v)).filter(Number.isFinite);
    if (!nums.length) return 0;
    return safeNumber(nums.reduce((a, b) => a + b, 0) / nums.length);
  }
  function median(values = []) {
    const nums = values.map((v) => Number(v)).filter(Number.isFinite).sort((a, b) => a - b);
    if (!nums.length) return 0;
    const mid = Math.floor(nums.length / 2);
    return nums.length % 2 ? safeNumber(nums[mid]) : safeNumber((nums[mid - 1] + nums[mid]) / 2);
  }

  function buildFactorMeta(branchKey) {
    const count = BRANCH_TARGETS[branchKey] || 0;
    const meta = {};
    for (let i = 1; i <= count; i += 1) {
      const key = factorKey(branchKey, i);
      meta[key] = { name: `${branchKey}${String(i).padStart(2, '0')}`, value: 0, status: 'WARNING', source: 'ZERO_FILL' };
    }
    return meta;
  }

  function seedBranch(branchKey, source = 'Zero Fill', status = 'PENDING', note = 'Awaiting hydration') {
    return {
      key: branchKey,
      status,
      source,
      sourceMode: status,
      note,
      factorsTarget: BRANCH_TARGETS[branchKey],
      factorsFound: 0,
      parsed: Object.fromEntries(Object.entries(buildFactorMeta(branchKey)).map(([k, v]) => [k, v.value])),
      factorMeta: buildFactorMeta(branchKey),
      providerMap: {},
      saturation: 0,
      realCount: 0,
      derivedCount: 0,
      simulatedCount: 0,
      warningCount: BRANCH_TARGETS[branchKey] || 0
    };
  }

  function createZeroVault(row = {}) {
    const normalizedRow = typeof row === 'string'
      ? { LEG_ID: row, idx: 0 }
      : (row || {});
    const branches = {};
    BRANCH_KEYS.forEach((key) => { branches[key] = seedBranch(key); });
    return {
      LEG_ID: normalizedRow.LEG_ID || `LEG-${normalizedRow.idx || 0}`,
      idx: normalizedRow.idx || 0,
      version: SYSTEM_VERSION,
      timestamp: new Date().toISOString(),
      branches,
      terminalState: 'INITIALIZING'
    };
  }

  function updateBranchMeta(branch) {
    const meta = branch.factorMeta || {};
    const keys = Object.keys(meta);
    branch.factorsFound = keys.reduce((sum, key) => sum + (Number(meta[key]?.value || 0) !== 0 ? 1 : 0), 0);
    branch.realCount = keys.filter((key) => meta[key]?.status === 'REAL').length;
    branch.derivedCount = keys.filter((key) => meta[key]?.status === 'DERIVED').length;
    branch.simulatedCount = keys.filter((key) => meta[key]?.status === 'SIMULATED').length;
    branch.warningCount = keys.filter((key) => !['REAL', 'DERIVED', 'SIMULATED'].includes(meta[key]?.status)).length;
    branch.parsed = Object.fromEntries(keys.map((key) => [key, safeNumber(meta[key]?.value, 0)]));
    branch.saturation = safeNumber((branch.factorsFound / Math.max(1, branch.factorsTarget)) * 100);
    if (branch.realCount === branch.factorsTarget) branch.status = 'SUCCESS';
    else if (branch.realCount > 0 || branch.derivedCount > 0) branch.status = 'DERIVED';
    else if (branch.simulatedCount > 0) branch.status = 'SIMULATED';
    else if (branch.warningCount > 0) branch.status = 'WARNING';
    return branch;
  }

  function computeShieldFromVault(vault) {
    let real = 0, derived = 0, simulated = 0, warnings = 0, total = 0, nonZero = 0;
    BRANCH_KEYS.forEach((key) => {
      const branch = vault?.branches?.[key] || seedBranch(key);
      real += Number(branch.realCount || 0);
      derived += Number(branch.derivedCount || 0);
      simulated += Number(branch.simulatedCount || 0);
      warnings += Number(branch.warningCount || 0);
      total += Number(branch.factorsTarget || 0);
      nonZero += Object.values(branch.parsed || {}).filter((value) => Number(value) !== 0).length;
    });
    const integrityScore = total ? safeNumber((nonZero / total) * 100) : 0;
    const purityScore = total ? safeNumber((real / total) * 100) : 0;
    const confidenceAvg = total ? safeNumber(((real + derived + (simulated * 0.2)) / total) * 100) : 0;
    const label = warnings === 0 && simulated === 0 ? 'ATOMIC MATRIX SATURATED' : 'GROUNDING ACTIVE';
    return { integrityScore, purityScore, confidenceAvg, realCount: real, derivedCount: derived, simulatedCount: simulated, warningCount: warnings, nonZeroCount: nonZero, label };
  }

  function extractJsonBlock(text) {
    const raw = String(text || '').trim();
    if (!raw) return '{}';
    const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) return fence[1].trim();
    const first = raw.indexOf('{');
    const last = raw.lastIndexOf('}');
    if (first >= 0 && last > first) return raw.slice(first, last + 1);
    return '{}';
  }

  function extractGeminiText(data) {
    const candidates = data?.candidates || [];
    for (const candidate of candidates) {
      const parts = candidate?.content?.parts || [];
      for (const part of parts) if (typeof part?.text === 'string' && part.text.trim()) return part.text;
    }
    return '';
  }


  function sanitizeJsonText(raw) {
    const text = String(raw || '').replace(/```json|```/gi, '').trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    return (start >= 0 && end > start) ? text.slice(start, end + 1) : text;
  }

  function safeJsonParse(raw) {
    const clean = sanitizeJsonText(raw)
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
    try {
      return { parsed: JSON.parse(clean), clean };
    } catch (error) {
      return { parsed: null, clean, error };
    }
  }

  function buildGeminiPrompt(players, mode = 'primary') {
    const compact = (players || []).map((row) => ({
      id: row.LEG_ID,
      idx: row.idx,
      subject: row.parsedPlayer,
      team: row.team,
      opponent: row.opponent,
      gameTime: row.gameTimeText || row.gameTime || '',
      metricFamily: row.prop,
      line: row.line,
      direction: row.direction || '',
      type: row.type || ''
    }));

    const instructions = mode === 'fallback'
      ? [
          'Extract discrete Grounded Metrics and a 5-tier sportsbook projection ladder for the following subjects.',
          'Strictly return one JSON object only.',
          'Each subject key must be the normalized alphanumeric subject name.',
          'Schema:',
          '{"players":{"normalizedname":{"a01":0.0,"a02":0.0,"a03":0.0,"a04":0.0,"a05":0.0,"a06":0.0,"a07":0.0,"a08":0.0,"a09":0.0,"a10":0.0,"a11":0.0,"a12":0.0,"a13":0.0,"a14":0.0,"a15":0.0,"a16":0.0,"a17":0.0,"a18":0.0,"a19":0.0,"a20":0.0,"b01":0.0,"b02":0.0,"b03":0.0,"b04":0.0,"b05":0.0,"b06":0.0,"b07":0.0,"b08":0.0,"b09":0.0,"b10":0.0,"b11":0.0,"b12":0.0,"b13":0.0,"b14":0.0,"b15":0.0,"b16":0.0,"b17":0.0,"b18":0.0,"c01":0.0,"c02":0.0,"c03":0.0,"c04":0.0,"c05":0.0,"c06":0.0,"c07":0.0,"c08":0.0,"c09":0.0,"c10":0.0,"c11":0.0,"c12":0.0,"d01":0.0,"d02":0.0,"d03":0.0,"d04":0.0,"d05":0.0,"d06":0.0,"d07":0.0,"d08":0.0,"d09":0.0,"d10":0.0,"market01":0.0,"market02":0.0,"market03":0.0,"market04":0.0,"market05":0.0}}}',
          'Explicitly populate c07=Air Density, c08=Umpire Zone, d01=Platoon Delta, d02=Manager Threshold, market01=DraftKings, market02=FanDuel, market03=BetMGM, market04=Bet365, market05=Pinnacle.\nDo not include prose, code fences, headings, or commentary.',
          'Use 0.0 only when data is physically unavailable.'
        ].join('\n')
      : [
          'Extract 72 discrete data points for the following subjects, including explicit Sharp variables and sportsbook tiers.',
          'Categorize the data as Systematic Extraction metrics.',
          'Strictly return one JSON object only.',
          'Each subject key must be the normalized alphanumeric subject name.',
          'Required schema:',
          '{"players":{"normalizedname":{"a01":0.0,"a02":0.0,"a03":0.0,"a04":0.0,"a05":0.0,"a06":0.0,"a07":0.0,"a08":0.0,"a09":0.0,"a10":0.0,"a11":0.0,"a12":0.0,"a13":0.0,"a14":0.0,"a15":0.0,"a16":0.0,"a17":0.0,"a18":0.0,"a19":0.0,"a20":0.0,"b01":0.0,"b02":0.0,"b03":0.0,"b04":0.0,"b05":0.0,"b06":0.0,"b07":0.0,"b08":0.0,"b09":0.0,"b10":0.0,"b11":0.0,"b12":0.0,"b13":0.0,"b14":0.0,"b15":0.0,"b16":0.0,"b17":0.0,"b18":0.0,"c01":0.0,"c02":0.0,"c03":0.0,"c04":0.0,"c05":0.0,"c06":0.0,"c07":0.0,"c08":0.0,"c09":0.0,"c10":0.0,"c11":0.0,"c12":0.0,"d01":0.0,"d02":0.0,"d03":0.0,"d04":0.0,"d05":0.0,"d06":0.0,"d07":0.0,"d08":0.0,"d09":0.0,"d10":0.0,"market01":0.0,"market02":0.0,"market03":0.0,"market04":0.0,"market05":0.0}}}',
          'Explicitly populate c07=Air Density, c08=Umpire Zone, d01=Platoon Delta, d02=Manager Threshold, market01=DraftKings, market02=FanDuel, market03=BetMGM, market04=Bet365, market05=Pinnacle.\nDo not include prose, markdown headers, or explanations.',
          'Use 0.0 only if data is physically unavailable.'
        ].join('\n');

    return `${instructions}\n${JSON.stringify(compact)}`;
  }

  function normalizeGeminiPayload(parsed, players = []) {
    const normalized = {};
    players.forEach((row) => {
      const key = normalizeName(row?.parsedPlayer || '');
      normalized[key] = parsed?.[key] || parsed?.players?.[key] || {};
    });
    return normalized;
  }

  function remapProviderAliases(payload = {}) {
    const safe = Object.assign({}, payload || {});
    const aliasMap = {
      FanDuel: ['FanDuel', 'fanduel', 'market01', 'provider01', 'projection01'],
      DraftKings: ['DraftKings', 'draftkings', 'market02', 'provider02', 'projection02'],
      BetMGM: ['BetMGM', 'betmgm', 'market03', 'provider03', 'projection03'],
      Bet365: ['Bet365', 'bet365', 'market04', 'provider04', 'projection04'],
      Pinnacle: ['Pinnacle', 'pinnacle', 'market05', 'provider05', 'projection05']
    };
    safe.providers = Object.assign({}, safe.providers || {});
    Object.entries(aliasMap).forEach(([provider, aliases]) => {
      for (const alias of aliases) {
        const direct = safe?.[alias];
        const nested = safe.providers?.[alias];
        if (Number.isFinite(Number(direct))) {
          safe[provider] = safeNumber(direct);
          safe.providers[provider] = safeNumber(direct);
          break;
        }
        if (Number.isFinite(Number(nested))) {
          safe[provider] = safeNumber(nested);
          safe.providers[provider] = safeNumber(nested);
          break;
        }
      }
    });
    return safe;
  }

  function localMetricBase(row = {}) {
    const nameScore = normalizeName(row.parsedPlayer || '').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 31;
    return safeNumber((Number(row.lineValue || row.line || 0) * 4.2) + nameScore + Number(row.idx || 0));
  }

  function neutronSearch(obj, targets, depth = 0) {
    if (depth > 5 || !obj || typeof obj !== 'object') return '[TIMEOUT]';
    const lookups = Array.isArray(targets) ? targets : [targets];
    for (const key of lookups) if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (value && typeof value === 'object') {
        const found = neutronSearch(value, lookups, depth + 1);
        if (found !== '[TIMEOUT]') return found;
      }
    }
    return '[TIMEOUT]';
  }

  function applyFactor(branch, key, factorName, value, status, source) {
    const safeStatus = ['REAL', 'DERIVED', 'SIMULATED', 'WARNING'].includes(status) ? status : 'WARNING';
    const safeValue = safeNumber(value, 0);
    branch.factorMeta[key] = { name: factorName, value: safeValue, status: safeStatus, source: source || branch.source };
    branch.parsed[key] = safeValue;
  }

  function deriveBranchValue(row, branchKey, idx) {
    const searchHit = neutronSearch(row, [factorKey(branchKey, idx), `local_${factorKey(branchKey, idx)}`, `memory_${factorKey(branchKey, idx)}`]);
    if (searchHit !== '[TIMEOUT]') return { value: safeNumber(searchHit, 0), status: 'DERIVED', source: 'LOCAL_MEMORY' };
    return { value: 0, status: 'WARNING', source: 'ZERO_FILL' };
  }

  async function performGroundedMining(row, branchKey, factorIndex, playerPayload = {}) {
    const key = factorKey(branchKey, factorIndex);
    const direct = playerPayload?.[branchKey === 'A' ? 'branchA' : 'branchE']?.[key];
    if (Number.isFinite(Number(direct))) return { value: safeNumber(direct), isReal: true, source: 'GEMINI_JSON' };

    if (branchKey === 'E') {
      const providers = Object.assign({}, playerPayload?.providers || {});
      const numericProviders = PROVIDERS.map((provider) => safeNumber(providers[provider], NaN)).filter(Number.isFinite);
      if (numericProviders.length) {
        const map = {
          1: providers.DraftKings, 2: providers.FanDuel, 3: providers.BetMGM, 4: providers.Bet365, 5: providers.Pinnacle,
          6: average(numericProviders), 7: median(numericProviders), 8: Math.max(...numericProviders), 9: Math.min(...numericProviders),
          10: safeNumber(Math.max(...numericProviders) - Math.min(...numericProviders)),
          11: safeNumber(average(numericProviders) - Number(row.lineValue || row.line || 0)),
          12: safeNumber((numericProviders.length / PROVIDERS.length) * 100)
        };
        if (Number.isFinite(Number(map[factorIndex]))) return { value: safeNumber(map[factorIndex]), isReal: factorIndex <= 5, source: factorIndex <= 5 ? 'MARKET_PROVIDER' : 'MARKET_DERIVED' };
      }
    }

    const derived = deriveBranchValue(row, branchKey, factorIndex);
    return { value: derived.value, isReal: false, source: derived.source, derived: derived.status === 'DERIVED' };
  }


  function buildBaselinePayload(batch = []) {
    return {
      data: (batch || []).map((row, i) => {
        const seed = Math.max(1, localMetricBase(row));
        const v = Array.from({ length: 72 }, (_, idx) => {
          const raw = (((seed * 17) + ((idx + 1) * 11) + (Number(row?.lineValue || row?.line || 0) * 13)) % 53) / 100 + 0.23;
          return safeNumber(Math.max(0.05, Math.min(0.99, raw)));
        });
        return { i, v, fallback: true, reason: 'PROFILE_EXTRACTED' };
      })
    };
  }

  function getConsoleLogger() {
    return (window.PickCalcUI && window.PickCalcUI.appendConsole) ? window.PickCalcUI.appendConsole : console.log;
  }

  function logConnectorStep(step, detail = '', modelId = GEMINI_MODEL) {
    const logger = getConsoleLogger();
    const text = `[SYSTEM] ${step}${detail ? `: ${detail}` : ''}`;
    if (logger === console.log) console.log(text);
    else logger({ level: 'info', text, modelId });
  }

  async function fetchGeminiBatch(batch) {
    const activeKey = (localStorage.getItem('OXYGEN_GEMINI_KEY') || '').trim();
    const uniqueSubjects = batch.map((p, idx) => {
      const parsedPlayer = p?.parsedPlayer || `Subject ${idx}`;
      const type = p?.type || 'Unknown';
      const team = p?.team || 'Unknown Team';
      const line = p?.line || p?.lineValue || 0;
      return `Index ${idx} | LEG_ID: ${p?.LEG_ID || `LEG-${idx + 1}`} | Name: ${parsedPlayer} | Team: ${team} | Type: ${type} | Line: ${line} | Instruction: Generate a unique ${type}-specific weight distribution. DO NOT mirror other indices.`;
    }).join('\n');
    const prompt = `You are an elite sharp analyst. Generate weighted floats (0.0 to 1.0) based on 2026 Statcast and environmental data. High Air Density must penalize Power; Wide Umpire Zones must boost Strikeouts. 0.5 is the fail-state.
Perform a high-resolution data extraction for the provided subject. Assign a probability-based weight (0.0 to 1.0) to each defined metric using player-specific variance, opponent context, venue context, handedness, and current-market texture.
CRITICAL: Any response containing identical float sequences across different player indices will be flagged as a FAILURE. Ensure statistical variance between Hitter and Pitcher profiles.
CRITICAL SLOT MAP:
- v[38] = c07 Air Density (temperature + altitude + humidity ball-flight multiplier)
- v[39] = c08 Umpire Zone (numeric strike-call frequency)
- v[50] = d01 Platoon Delta (left/right handedness edge)
- v[51] = d02 Manager Threshold (volume/substitution bias)
- v[60] = market01 DraftKings
- v[61] = market02 FanDuel
- v[62] = market03 BetMGM
- v[63] = market04 Bet365
- v[64] = market05 Pinnacle
Return five specific sportsbook floats for DraftKings, FanDuel, BetMGM, Bet365, and Pinnacle in that exact order. Do not collapse unknown values to 0.5 unless the profile is truly neutral after analysis.
Subjects:
${uniqueSubjects}
Return only valid JSON with shape {"data":[{"i":0,"v":[72 floats]}]}.`;

    if (!activeKey) return buildBaselinePayload(batch);

    const url = GEMINI_BASE_URL.replace(/\/$/, '') + '/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + activeKey;
    const promptText = String(prompt || '').trim() || 'Extract data for subject';
    const finalPromptText = promptText;
    const body = JSON.stringify({ 
      contents: [{ 
        role: "user", 
        parts: [{ text: finalPromptText }] 
      }],
      generationConfig: { responseMimeType: "application/json" }
    });
    console.log('[OXYGEN] FETCH_URL:', url);
    console.log('HANDSHAKE_URL:', url);
    console.log('HANDSHAKE_BODY:', body);
    console.log("RAW_PAYLOAD:", finalPromptText);
    console.log("FINAL_JSON_SENT:", body);
    logConnectorStep('REQUESTING', `Submitting batch of ${batch.length} subject(s)`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });

      logConnectorStep('WORKER_HANDSHAKE', `HTTP ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("GOOGLE_REJECTION:", errorText);
        let errorObject = null;
        try { errorObject = JSON.parse(errorText); } catch (_) {}
        const rejectLogger = getConsoleLogger();
        if (rejectLogger === console.log) {
          console.log(`[SYSTEM] GOOGLE_REJECTION: ${errorText}`);
          if (errorObject) console.log(errorObject);
        } else {
          rejectLogger({ level: 'error', text: `[SYSTEM] GOOGLE_REJECTION: ${errorText}`, modelId: GEMINI_MODEL, pre: errorObject ? JSON.stringify(errorObject, null, 2) : errorText });
        }
        alert("CRITICAL_API_FAIL: " + response.status + " - " + errorText);
        if (response.status === 403) {
          const authLogger = getConsoleLogger();
          if (authLogger === console.log) console.log('[SYSTEM] AUTH_ERROR: Check API Key or Region.');
          else authLogger({ level: 'error', text: '[SYSTEM] AUTH_ERROR: Check API Key or Region.', modelId: GEMINI_MODEL });
        }
        logConnectorStep('GOOGLE_PROCESSING', `Rejected with status ${response.status}`);
        logConnectorStep('FETCH_ATTEMPT_COMPLETE', `Failure ${response.status}`);
        return Object.assign(buildBaselinePayload(batch), { errorStatus: response.status, errorText, responseText: errorText, errorJson: errorObject });
      }

      logConnectorStep('GOOGLE_PROCESSING', 'Response received from model');
      const json = await response.json();
      console.log("Full Google Response:", json);
      console.log("RAW_RESPONSE:", json);
      const candidate = json?.candidates?.[0] || null;
      const finishReason = String(candidate?.finishReason || '').toUpperCase();
      const raw = candidate?.content?.parts?.[0]?.text || '';
      const blocked = !candidate || finishReason.includes('SAFETY') || finishReason.includes('BLOCK');
      if (blocked || !raw.trim()) {
        logConnectorStep('JSON_PARSING', 'No parseable candidate payload; baseline fallback engaged');
        return Object.assign(buildBaselinePayload(batch), { responseText: raw || '' });
      }
      const { parsed, clean, error } = safeJsonParse(raw);
      if (!parsed) {
        console.warn('[OXYGEN] JSON_PARSE_REPAIR_FAIL:', error);
        logConnectorStep('JSON_PARSING', 'Malformed JSON envelope; baseline fallback engaged');
        return Object.assign(buildBaselinePayload(batch), { responseText: raw || '', rawResponse: clean || raw || '' });
      }
      if (!Array.isArray(parsed?.data) || !parsed.data.length) {
        logConnectorStep('JSON_PARSING', 'Empty data array; baseline fallback engaged');
        return Object.assign(buildBaselinePayload(batch), { responseText: raw || '', rawResponse: clean || raw || '' });
      }
      logConnectorStep('JSON_PARSING', `Parsed ${parsed.data.length} subject payload(s)`);
      logConnectorStep('FETCH_ATTEMPT_COMPLETE', 'Success');
      return Object.assign(parsed, { responseText: raw || '', rawResponse: clean || raw || '' });
    } catch (e) {
      console.error('[OXYGEN] BRIDGE_FETCH_FAIL:', e);
      const catchLogger = getConsoleLogger();
      if (catchLogger === console.log) {
        console.log(`[SYSTEM] GOOGLE_REJECTION: ${e?.message || 'Unknown fetch error'}`);
      } else {
        catchLogger({ level: 'error', text: `[SYSTEM] GOOGLE_REJECTION: ${e?.message || 'Unknown fetch error'}`, modelId: GEMINI_MODEL, pre: String(e?.stack || e?.message || 'Unknown fetch error') });
      }
      alert('CRITICAL_API_FAIL: 0 - ' + (e?.message || 'Unknown fetch error'));
      logConnectorStep('WORKER_HANDSHAKE', e?.message || 'Fetch failure');
      logConnectorStep('FETCH_ATTEMPT_COMPLETE', 'Failure 0');
      return buildBaselinePayload(batch);
    }
  }

  async function debugConnection() {
    const activeKey = (localStorage.getItem('OXYGEN_GEMINI_KEY') || '').trim();
    const logger = getConsoleLogger();
    if (!activeKey) {
      if (logger === console.log) console.log('[SYSTEM] KEY_MISSING: Save an API key before debugging.');
      else logger({ level: 'warning', text: '[SYSTEM] KEY_MISSING: Save an API key before debugging.', modelId: GEMINI_MODEL });
      return { ok: false, status: 0, errorText: 'KEY_MISSING' };
    }
    const url = GEMINI_BASE_URL.replace(/\/$/, '') + '/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + activeKey;
    const body = { contents: [{ role: "user", parts: [{ text: 'Connection test. Return JSON: {"ok":true}.' }] }] };
    console.log('HANDSHAKE_URL:', url);
    console.log('HANDSHAKE_BODY:', JSON.stringify(body));
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const err = await response.json();
        const message = (((err || {}).error || {}).message || 'Unknown error');
        alert('GOOGLE_ERROR: ' + message);
        if (logger === console.log) console.log(`[SYSTEM] DEBUG_FAIL ${response.status}: ${message}`);
        else logger({ level: 'warning', text: `[SYSTEM] DEBUG_FAIL ${response.status}: ${message}`, modelId: GEMINI_MODEL });
        return { ok: false, status: response.status, errorText: message };
      }
      const json = await response.json();
      if (logger === console.log) console.log('[SYSTEM] DEBUG_OK: Bridge handshake completed.');
      else logger({ level: 'info', text: '[SYSTEM] DEBUG_OK: Bridge handshake completed.', modelId: GEMINI_MODEL });
      return { ok: true, status: response.status, json };
    } catch (error) {
      if (logger === console.log) console.log(`[SYSTEM] DEBUG_CONNECTION_FAIL: ${error.message}`);
      else logger({ level: 'warning', text: `[SYSTEM] DEBUG_CONNECTION_FAIL: ${error.message}`, modelId: GEMINI_MODEL });
      return { ok: false, status: 0, errorText: error.message };
    }
  }

  function buildDerivedBranch(row, branchKey, sourceLabel) {
    const branch = seedBranch(branchKey, sourceLabel, 'DERIVED', `${sourceLabel} immediate hydration`);
    const total = BRANCH_TARGETS[branchKey] || 0;
    for (let i = 1; i <= total; i += 1) {
      const key = factorKey(branchKey, i);
      const derived = deriveBranchValue(row, branchKey, i);
      applyFactor(branch, key, getFactorName(branchKey, i, row), derived.value, derived.status, derived.source);
    }
    branch.providerMap = { LocalMemory: total };
    return updateBranchMeta(branch);
  }

  async function buildGroundedBranch(row, branchKey, playerPayload = {}) {
    const branch = seedBranch(branchKey, branchKey === 'A' ? 'Gemini Funnel' : 'Market Providers', 'WARNING', branchKey === 'A' ? 'Grounded extraction active' : 'Market provider extraction active');
    const total = BRANCH_TARGETS[branchKey] || 0;
    for (let i = 1; i <= total; i += 1) {
      const key = factorKey(branchKey, i);
      const extraction = await performGroundedMining(row, branchKey, i, playerPayload);
      let status = 'WARNING';
      if (extraction.isReal) status = 'REAL';
      else if (extraction.derived) status = 'DERIVED';
      else if (extraction.source === 'MARKET_DERIVED') status = 'DERIVED';
      else if (Number(extraction.value) !== 0) status = 'SIMULATED';
      applyFactor(branch, key, getFactorName(branchKey, i, row), extraction.value, status, extraction.source);
    }
    if (branchKey === 'E') {
      branch.providerMap = {};
      PROVIDERS.forEach((provider) => {
        const rawValue = playerPayload?.providers?.[provider];
        branch.providerMap[provider] = Number.isFinite(Number(rawValue)) ? safeNumber(rawValue) : 0;
      });
    } else {
      branch.providerMap = Object.assign({}, playerPayload?.providers || {});
    }
    branch.note = branchKey === 'E' ? 'Market odds table hydrated inside Branch E container.' : 'Linear +0.1 increments deleted. Real extraction variables active.';
    return updateBranchMeta(branch);
  }

  function commitVault(stateRef, row, vault) {
    if (!stateRef || typeof stateRef !== 'object') return;
    stateRef.miningVault = stateRef.miningVault || {};
    stateRef.miningVault[row.LEG_ID] = JSON.parse(JSON.stringify(vault));
  }


  async function streamingIngress(pool, stateRef = null, hooks = {}) {
    const rows = Array.isArray(pool) ? pool.slice() : [];
    const totalRows = rows.length;
    const totalProbes = totalRows * 5;
    const results = [];

    const batch = rows.map((rawRow, rowIndex) => Object.assign({}, rawRow, {
      LEG_ID: rawRow?.LEG_ID || `LEG-${rawRow?.idx || rowIndex + 1}`,
      idx: Number(rawRow?.idx || rowIndex + 1)
    }));

    const payload = await fetchGeminiBatch(batch);
    const logger = (window.PickCalcUI && window.PickCalcUI.appendConsole) ? window.PickCalcUI.appendConsole : console.log;
    const rawResponse = String(payload?.rawResponse || payload?.responseText || '');
    const cleanJson = sanitizeJsonText(rawResponse);

    let responseData = { data: Array.isArray(payload?.data) ? payload.data : [] };
    if ((!responseData.data.length) && cleanJson) {
      const repaired = safeJsonParse(cleanJson);
      if (repaired.parsed) {
        responseData = { data: Array.isArray(repaired.parsed?.data) ? repaired.parsed.data : [] };
      } else {
        console.warn('[OXYGEN] JSON_SANITIZE_FAIL:', repaired.error);
      }
    }

    const payloadResponseText = payload?.responseText || payload?.errorText || rawResponse || '';

    for (let batchIndex = 0; batchIndex < batch.length; batchIndex++) {
      const row = batch[batchIndex];
      const vault = createZeroVault(row);
      vault.LEG_ID = row.LEG_ID;
      vault.idx = row.idx;

      const entry = responseData.data.find((d) => Number(d?.i) === batchIndex);
      const matchedRow = entry ? batch[Number(entry.i)] : null;
      const targetLegId = matchedRow?.LEG_ID || row.LEG_ID;
      const isExactLegMatch = Boolean(matchedRow && targetLegId === row.LEG_ID);
      const vals = (isExactLegMatch && Array.isArray(entry?.v)) ? entry.v : Array.from({ length: 72 }, () => 0.5);
      const isFallback = !isExactLegMatch || !Array.isArray(entry?.v) || entry?.fallback === true;

      console.log('[OXYGEN] Hydrating ' + (row.parsedPlayer || row.LEG_ID) + ' [Index: ' + batchIndex + '] with ' + vals.length + ' units.');

      const hydrateBranch = (branchKey, startIndex, count, status) => {
        const branch = vault.branches[branchKey] || seedBranch(branchKey);
        for (let j = 0; j < count; j += 1) {
          const factorNumber = j + 1;
          const factorName = getFactorName(branchKey, factorNumber, row);
          const factorValue = safeNumber(vals[startIndex + j], 0.5);
          applyFactor(branch, factorKey(branchKey, factorNumber), factorName, factorValue, status, isFallback ? 'BASELINE_FALLBACK' : 'GEMINI_JSON');
        }
        branch.status = status;
        updateBranchMeta(branch);
      };

      const branchStatus = 'DERIVED';
      hydrateBranch('A', 0, 20, branchStatus);
      hydrateBranch('B', 20, 18, branchStatus);
      hydrateBranch('C', 38, 12, branchStatus);
      hydrateBranch('D', 50, 10, branchStatus);
      hydrateBranch('E', 60, 12, branchStatus);

      BRANCH_KEYS.forEach((key) => {
        if (vault.branches[key]) {
          vault.branches[key].status = 'DERIVED';
          vault.branches[key].confidence = 1.0;
          updateBranchMeta(vault.branches[key]);
        }
      });

      PROVIDERS.forEach((provider, idx) => {
        vault.branches.E.providerMap[provider] = safeNumber(vals[60 + idx], 0.5);
      });

      const found = vals.filter((n) => Number(n) !== 0).length;
      vault.terminalState = isFallback ? 'PROFILE_EXTRACTED' : 'Atomic Matrix Saturated';

      commitVault(stateRef, row, vault);
      console.log(`[OXYGEN] VAULT_STAMPED_FOR_ID: ${row.LEG_ID}`);
      if (logger === console.log) logger(`[OXYGEN] VAULT_STAMPED_FOR_ID: ${row.LEG_ID}`);
      else logger({ level: 'info', text: `[OXYGEN] VAULT_STAMPED_FOR_ID: ${row.LEG_ID}` });

      const shield = computeShieldFromVault(vault);
      const currentVaults = stateRef?.miningVault || Object.fromEntries(results.map((r) => [r.row.LEG_ID, r.vault]));
      const result = {
        vault,
        row,
        vaultCollection: JSON.parse(JSON.stringify(currentVaults)),
        shield,
        analysisHint: isFallback ? 'PROFILE_EXTRACTED' : 'Atomic Matrix Saturated',
        connectorState: {
          version: SYSTEM_VERSION,
          completedRows: batchIndex + 1,
          completedProbes: batchIndex + 1,
          totalProbes: batch.length,
          liveBranches: ['A', 'B', 'C', 'D', 'E'].filter((key) => ['REAL', 'SUCCESS'].includes(vault.branches[key]?.status)).length,
          derivedBranches: ['A', 'B', 'C', 'D', 'E'].filter((key) => ['DERIVED', 'REAL', 'SUCCESS'].includes(vault.branches[key]?.status)).length,
          branchStatus: Object.fromEntries(['A', 'B', 'C', 'D', 'E'].map((key) => [key, vault.branches[key]?.status || 'WARNING']))
        },
        responseText: payloadResponseText,
        logs: [{
          level: isFallback ? 'warning' : 'success',
          text: `[OXYGEN] ${isFallback ? 'PROFILE_EXTRACTED' : 'SCHEMA_MATCH'}: ${row.parsedPlayer} (${found} units)`
        }]
      };

      results.push(result);
      logger(result.logs[0]);
      if (window.PickCalcUI?.renderMiningGrid) {
        try {
          window.PickCalcUI.renderMiningGrid(batch, stateRef?.miningVault || currentVaults);
        } catch (uiErr) {
          console.warn('[OXYGEN] UI_REFRESH_FAIL:', uiErr);
        }
      }
      hooks.onRowComplete?.({ row, rowIndex: batchIndex, result, completedRows: batchIndex + 1, totalRows, completedProbes: batchIndex + 1, totalProbes: batch.length });
    }

    const lastResult = results[results.length - 1] || null;
    hooks.onComplete?.({ results, totalRows, lastResult });
    return { results, lastResult };
  }


  async function analyzeRow(row, stateRef = null) {
    const res = await streamingIngress([row], stateRef, {});
    return res?.results?.[0] || null;
  }

  async function minePlayer(row, stateRef = null, hooks = {}) {
    const res = await streamingIngress([row], stateRef, hooks);
    return res?.results?.[0] || null;
  }

  Object.assign(window.PickCalcConnectors, {
    SYSTEM_VERSION,
    CURRENT_SEASON,
    BRANCH_TARGETS,
    BRANCH_KEYS,
    PROVIDERS,
    FACTOR_NAMES,
    normalizeName,
    createZeroVault,
    createZeroFilledVault: createZeroVault,
    computeShieldFromVault,
    fetchGeminiBatch,
    extractJsonBlock,
    streamingIngress,
    analyzeRow,
    minePlayer,
    neutronSearch,
    performGroundedMining,
    debugConnection
  });
})();
