window.PickCalcConnectors = window.PickCalcConnectors || {};
(() => {
  const SYSTEM_VERSION = 'v13.78.39 (OXYGEN-COBALT)';
  const CURRENT_SEASON = 2026;
  const BRANCH_TARGETS = { A: 20, B: 18, C: 12, D: 10, E: 12 };
  const BRANCH_KEYS = ['A', 'B', 'C', 'D', 'E'];
  const PROVIDERS = ['DraftKings', 'FanDuel', 'BetMGM', 'Bet365', 'Pinnacle'];
  const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';
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

  function hasNumericNoiseInIdentity(value = '') {
    const raw = String(value || '').trim();
    if (!raw) return true;
    if (/unknown/i.test(raw)) return true;
    if (/\d/.test(raw)) return true;
    const normalized = raw.replace(/[^A-Za-z'.\-\s]/g, ' ').replace(/\s+/g, ' ').trim();
    return !/^[A-Za-z][A-Za-z'.\-]*(?:\s+[A-Za-z][A-Za-z'.\-]*){1,2}$/.test(normalized);
  }

  function buildIngressErrorResult(row = {}, stateRef = null, detail = 'Data Ingress Error') {
    const vault = createZeroVault(row);
    vault.LEG_ID = row?.LEG_ID || vault.LEG_ID;
    vault.idx = row?.idx || vault.idx;
    vault.terminalState = 'Data Ingress Error';
    vault.isReal = false;
    vault.source = 'error';
    BRANCH_KEYS.forEach((key) => {
      if (!vault.branches[key]) return;
      vault.branches[key].status = 'WARNING';
      vault.branches[key].source = 'error';
      vault.branches[key].note = detail;
      updateBranchMeta(vault.branches[key]);
    });
    commitVault(stateRef, row, vault);
    return {
      vault,
      row,
      shield: computeShieldFromVault(vault),
      analysisHint: detail,
      connectorState: {
        version: SYSTEM_VERSION,
        completedRows: 0,
        completedProbes: 0,
        totalProbes: 0,
        liveBranches: 0,
        derivedBranches: 0,
        branchStatus: Object.fromEntries(BRANCH_KEYS.map((key) => [key, vault.branches[key]?.status || 'WARNING']))
      },
      responseText: '',
      logs: [{ level: 'warning', text: `[OXYGEN] DATA_INGRESS_ERROR: ${row?.parsedPlayer || row?.LEG_ID || 'UNKNOWN_ROW'} :: ${detail}` }]
    };
  }

  function rowHasIngressIdentityError(row = {}) {
    const player = String(row?.parsedPlayer || '').trim();
    if (!player) return true;
    if (hasNumericNoiseInIdentity(player)) return true;
    if (/\b(?:@|vs\.?|sun|mon|tue|wed|thu|fri|sat)\b/i.test(player)) return true;
    return false;
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


  function stdDev(values = []) {
    const nums = values.map((v) => Number(v)).filter(Number.isFinite);
    if (!nums.length) return 0;
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const variance = nums.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / nums.length;
    return Math.sqrt(variance);
  }

  function classifyVector(values = []) {
    const core = values.slice(0, 60).map((v) => Number(v));
    const tail = values.slice(65, 72).map((v) => Number(v));
    const nonZero = core.filter((n) => Number.isFinite(n) && n !== 0).length;
    const variance = stdDev(core.filter(Number.isFinite));
    const uniqueRounded = new Set(core.filter(Number.isFinite).map((v) => Number(v).toFixed(3))).size;
    const tailNonZero = tail.filter((n) => Number.isFinite(n) && n !== 0).length;
    if (nonZero <= 4) return { ok: false, kind: 'INSUFFICIENT_EVIDENCE', detail: 'Core payload remained sparse after retries.', nonZero, variance, tailNonZero };
    if (nonZero < 20) return { ok: false, kind: 'COLLAPSED_PAYLOAD', detail: 'Most core slots 1-60 were zero or missing.', nonZero, variance, tailNonZero };
    if (variance < 0.04) return { ok: false, kind: 'LOW_VARIANCE', detail: 'Provider payload lacks variance.', nonZero, variance, tailNonZero };
    if (uniqueRounded < 10) return { ok: false, kind: 'LOW_VARIANCE', detail: 'Provider payload lacks variance.', nonZero, variance, tailNonZero };
    return { ok: true, kind: tailNonZero === 0 ? 'VERIFIED_CORE_ONLY' : 'VERIFIED', detail: '', nonZero, variance, tailNonZero };
  }

  function batchHasNearDuplicateVectors(data = []) {
    const valid = data.filter((entry) => Array.isArray(entry?.v) && entry.v.length >= 60);
    for (let i = 0; i < valid.length; i += 1) {
      const a = valid[i].v.slice(0, 60).map((v) => Number(v));
      for (let j = i + 1; j < valid.length; j += 1) {
        const b = valid[j].v.slice(0, 60).map((v) => Number(v));
        let same = 0;
        for (let k = 0; k < 60; k += 1) {
          if (Math.abs((a[k] || 0) - (b[k] || 0)) <= 0.015) same += 1;
        }
        if (same >= 55) return true;
      }
    }
    return false;
  }

  function getSavedApiKey() {
    const inputValue = typeof document !== 'undefined' ? String(document.getElementById('apiKeyInput')?.value || '').trim() : '';
    const winKey = typeof window !== 'undefined' ? String(window.__OXYGEN_GEMINI_KEY__ || '').trim() : '';
    const localKey = (() => { try { return String(localStorage.getItem('OXYGEN_GEMINI_KEY') || '').trim(); } catch (_) { return ''; } })();
    const sessionKey = (() => { try { return String(sessionStorage.getItem('OXYGEN_GEMINI_KEY') || '').trim(); } catch (_) { return ''; } })();
    return inputValue || winKey || localKey || sessionKey || '';
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
      source: 'real',
      isReal: true,
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
          "Generate weighted floats (0.0 to 1.0) based on 2026 data for the following full player identities. Each subject includes player name, team, opponent, game time, prop family, line, direction, and role. For 'Walks Allowed,' prioritize Command/Patience. For 'Fantasy Score,' prioritize accumulation potential.",
          'Strictly return one JSON object only.',
          'Each subject key must be the normalized alphanumeric subject name.',
          'Schema:',
          '{"players":{"normalizedname":{"a01":0.0,"a02":0.0,"a03":0.0,"a04":0.0,"a05":0.0,"a06":0.0,"a07":0.0,"a08":0.0,"a09":0.0,"a10":0.0,"a11":0.0,"a12":0.0,"a13":0.0,"a14":0.0,"a15":0.0,"a16":0.0,"a17":0.0,"a18":0.0,"a19":0.0,"a20":0.0,"b01":0.0,"b02":0.0,"b03":0.0,"b04":0.0,"b05":0.0,"b06":0.0,"b07":0.0,"b08":0.0,"b09":0.0,"b10":0.0,"b11":0.0,"b12":0.0,"b13":0.0,"b14":0.0,"b15":0.0,"b16":0.0,"b17":0.0,"b18":0.0,"c01":0.0,"c02":0.0,"c03":0.0,"c04":0.0,"c05":0.0,"c06":0.0,"c07":0.0,"c08":0.0,"c09":0.0,"c10":0.0,"c11":0.0,"c12":0.0,"d01":0.0,"d02":0.0,"d03":0.0,"d04":0.0,"d05":0.0,"d06":0.0,"d07":0.0,"d08":0.0,"d09":0.0,"d10":0.0,"market01":0.0,"market02":0.0,"market03":0.0,"market04":0.0,"market05":0.0}}}',
          'Explicitly populate c07=Air Density, c08=Umpire Zone, d01=Platoon Delta, d02=Manager Threshold, market01=DraftKings, market02=FanDuel, market03=BetMGM, market04=Bet365, market05=Pinnacle.\nDo not include prose, code fences, headings, or commentary.',
          "For 'Walks Allowed,' prioritize Command/Patience. For 'Fantasy Score,' prioritize accumulation potential. Use 0.0 only when data is physically unavailable."
        ].join('\n')
      : [
          "Generate weighted floats (0.0 to 1.0) based on 2026 data for the following full player identities, including player name, team, opponent, game time, prop family, line, direction, and role, including explicit Sharp variables and sportsbook tiers. For 'Walks Allowed,' prioritize Command/Patience. For 'Fantasy Score,' prioritize accumulation potential.",
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
    branch.factorMeta[key] = { name: factorName, value: safeValue, status: safeStatus, isReal: true, source: 'real', rawSource: source || branch.source };
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
    const activeKey = getSavedApiKey();
    const makeSubjects = () => batch.map((p, idx) => {
      const parsedPlayer = p?.parsedPlayer || `Subject ${idx}`;
      const type = p?.type || 'Unknown';
      const team = p?.team || 'Unknown Team';
      const opponent = p?.opponent || 'Unknown Opp';
      const line = p?.line || p?.lineValue || 0;
      const gameTime = p?.gameTimeText || p?.gameTimeISO || '';
      return `[SUBJECT ${idx}] LEG_ID=${p?.LEG_ID || `LEG-${idx + 1}`} | NAME=${parsedPlayer} | TEAM=${team} | OPP=${opponent} | TYPE=${type} | PROP=${p?.prop || ''} | LINE=${line} | TIME=${gameTime}`;
    }).join('
');

    if (!activeKey) return Object.assign(buildBaselinePayload(batch), { errorKind: 'KEY_MISSING', errorText: 'API key missing.' });

    const url = GEMINI_BASE_URL.replace(/\/$/, '') + '/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + activeKey;
    let lastFailure = 'Unknown payload failure';

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const temp = attempt === 1 ? 0.15 : (attempt === 2 ? 0.3 : 0.45);
      const retrySuffix = attempt === 1 ? '' : `
CRITICAL RETRY ${attempt}: Previous batch failed quality checks. Each subject must be evaluated independently. Near-duplicate vectors across subjects are INVALID. Preserve exact subject index ordering. If one subject lacks evidence, still return a fixed-length vector for that subject but set e="INSUFFICIENT_EVIDENCE" and c<=0.35. Avoid clustering around 0.5. Commit to subject-specific variation.`;
      const prompt = `You are a numeric feature transpiler for OXYGEN-COBALT. Evaluate each indexed subject independently. Same team, same opponent, or same prop family does NOT justify similar vectors. Return one JSON object only with exact shape {"data":[{"i":0,"v":[72 floats],"c":0.0,"e":""}]}. Rules: preserve exact index order, every subject must have one object, every v must contain exactly 72 floats from 0.0 to 1.0, no prose, no markdown, no extra keys, no duplicated vectors, no copied shapes between subjects. Weak subjects may set e="INSUFFICIENT_EVIDENCE" with low confidence but must still preserve schema. Subjects:
${makeSubjects()}${retrySuffix}`;
      const body = JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: temp }
      });

      console.log('[OXYGEN] FETCH_URL:', url);
      console.log('HANDSHAKE_URL:', url);
      console.log('HANDSHAKE_BODY:', body);
      console.log('RAW_PAYLOAD:', prompt);
      logConnectorStep('REQUESTING', `Submitting batch of ${batch.length} subject(s) [attempt ${attempt}/3]`);

      try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        logConnectorStep('WORKER_HANDSHAKE', `HTTP ${response.status}`);
        const rawText = await response.text();
        if (!response.ok) {
          lastFailure = rawText || `HTTP ${response.status}`;
          continue;
        }
        let raw = rawText;
        let parsedEnvelope = null;
        try {
          const responseJson = JSON.parse(rawText);
          raw = extractGeminiText(responseJson) || rawText;
        } catch (_) {}
        const { parsed, clean, error } = safeJsonParse(raw);
        if (!parsed) {
          lastFailure = 'Malformed factor payload.';
          console.warn('[OXYGEN] JSON_PARSE_REPAIR_FAIL:', error);
          continue;
        }
        const data = Array.isArray(parsed?.data) ? parsed.data : [];
        if (!data.length || data.length !== batch.length) {
          lastFailure = 'Malformed factor payload.';
          continue;
        }
        if (!data.every((entry, idx) => Number(entry?.i) === idx && Array.isArray(entry?.v) && entry.v.length === 72)) {
          lastFailure = 'Malformed factor payload.';
          continue;
        }
        if (batchHasNearDuplicateVectors(data)) {
          lastFailure = 'Near-duplicate factor payload detected.';
          continue;
        }
        const classifications = data.map((entry) => classifyVector(entry.v));
        const anyLowVariance = classifications.some((c) => !c.ok && c.kind === 'LOW_VARIANCE');
        const allSparse = classifications.every((c) => !c.ok && (c.kind === 'INSUFFICIENT_EVIDENCE' || c.kind === 'COLLAPSED_PAYLOAD'));
        if (anyLowVariance && attempt < 3) {
          lastFailure = 'Provider payload lacks variance.';
          continue;
        }
        parsedEnvelope = { data, responseText: raw || '', rawResponse: clean || raw || '', classifications };
        return parsedEnvelope;
      } catch (e) {
        console.error('[OXYGEN] BRIDGE_FETCH_FAIL:', e);
        lastFailure = e?.message || 'Unknown fetch error';
      }
    }

    return Object.assign(buildBaselinePayload(batch), { errorKind: 'BATCH_FAIL', errorText: lastFailure, responseText: lastFailure, rawResponse: lastFailure });
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
    const validBatch = [];
    const invalidEntries = [];
    batch.forEach((row) => {
      if (rowHasIngressIdentityError(row)) invalidEntries.push(row);
      else validBatch.push(row);
    });

    const logger = (window.PickCalcUI && window.PickCalcUI.appendConsole) ? window.PickCalcUI.appendConsole : console.log;

    invalidEntries.forEach((row) => {
      const result = buildIngressErrorResult(row, stateRef, 'Data Ingress Error');
      results.push(result);
      if (logger === console.log) logger(result.logs[0].text);
      else logger(result.logs[0]);
      hooks.onRowComplete?.({ row, rowIndex: results.length - 1, result, completedRows: results.length, totalRows, completedProbes: results.length, totalProbes });
    });

    if (!validBatch.length) {
      const lastResult = results[results.length - 1] || null;
      hooks.onComplete?.({ results, totalRows, lastResult });
      return { results, lastResult };
    }

    const payload = await fetchGeminiBatch(validBatch);
    const payloadResponseText = payload?.responseText || payload?.errorText || '';
    if (!Array.isArray(payload?.data) || !payload.data.length) {
      const lastResult = results[results.length - 1] || buildIngressErrorResult(validBatch[validBatch.length - 1], stateRef, `Non-real Gemini payload (${GEMINI_MODEL}): ${payload?.errorText || 'Malformed factor payload.'}`);
      results.push(lastResult);
      hooks.onComplete?.({ results, totalRows, lastResult });
      return { results, lastResult };
    }

    for (let batchIndex = 0; batchIndex < validBatch.length; batchIndex++) {
      const row = validBatch[batchIndex];
      const entry = payload.data.find((d) => Number(d?.i) === batchIndex) || null;
      const vals = Array.isArray(entry?.v) ? entry.v : [];
      const classification = classifyVector(vals);
      if (!entry || vals.length !== 72) {
        const result = buildIngressErrorResult(row, stateRef, `Non-real Gemini payload (${GEMINI_MODEL}): Malformed factor payload.`);
        results.push(result);
        logger(result.logs[0]);
        hooks.onRowComplete?.({ row, rowIndex: results.length - 1, result, completedRows: results.length, totalRows, completedProbes: results.length, totalProbes });
        continue;
      }
      if (!classification.ok) {
        const detail = classification.kind === 'INSUFFICIENT_EVIDENCE'
          ? 'Insufficient evidence. The subject did not provide enough stable signal for reliable inference after retries.'
          : `Non-real Gemini payload (${GEMINI_MODEL}): ${classification.detail}`;
        const result = buildIngressErrorResult(row, stateRef, detail);
        result.vault.terminalState = classification.kind;
        result.shield = computeShieldFromVault(result.vault);
        result.connectorState = { version: SYSTEM_VERSION, completedRows: results.length + 1, completedProbes: results.length + 1, totalProbes, liveBranches: 0, derivedBranches: 0, branchStatus: Object.fromEntries(BRANCH_KEYS.map((key) => [key, 'WARNING'])) };
        result.logs = [{ level: classification.kind === 'INSUFFICIENT_EVIDENCE' ? 'warning' : 'error', text: `[OXYGEN] ${classification.kind}: ${row.parsedPlayer} (${classification.nonZero || 0} units)` }];
        results.push(result);
        logger(result.logs[0]);
        hooks.onRowComplete?.({ row, rowIndex: results.length - 1, result, completedRows: results.length, totalRows, completedProbes: results.length, totalProbes });
        continue;
      }

      const vault = createZeroVault(row);
      vault.LEG_ID = row.LEG_ID;
      vault.idx = row.idx;
      console.log('[OXYGEN] Hydrating ' + (row.parsedPlayer || row.LEG_ID) + ' [Index: ' + batchIndex + '] with ' + vals.length + ' units.');
      const hydrateBranch = (branchKey, startIndex, count, status) => {
        const branch = vault.branches[branchKey] || seedBranch(branchKey);
        for (let j = 0; j < count; j += 1) {
          const factorNumber = j + 1;
          const factorName = getFactorName(branchKey, factorNumber, row);
          const factorValue = safeNumber(vals[startIndex + j], 0.5);
          applyFactor(branch, factorKey(branchKey, factorNumber), factorName, factorValue, status, 'GEMINI_JSON');
        }
        branch.status = status;
        updateBranchMeta(branch);
      };
      ['A','B','C','D','E'].forEach((key, idx) => {
        const starts = { A:0, B:20, C:38, D:50, E:60 };
        const counts = { A:20, B:18, C:12, D:10, E:12 };
        hydrateBranch(key, starts[key], counts[key], 'REAL');
      });
      PROVIDERS.forEach((provider, idx) => { vault.branches.E.providerMap[provider] = safeNumber(vals[60 + idx], 0.5); });
      vault.terminalState = classification.kind;
      commitVault(stateRef, row, vault);
      console.log(`[OXYGEN] VAULT_STAMPED_FOR_ID: ${row.LEG_ID}`);
      if (logger === console.log) logger(`[OXYGEN] VAULT_STAMPED_FOR_ID: ${row.LEG_ID}`);
      else logger({ level: 'info', text: `[OXYGEN] VAULT_STAMPED_FOR_ID: ${row.LEG_ID}` });
      const shield = computeShieldFromVault(vault);
      const currentVaults = stateRef?.miningVault || Object.fromEntries(results.map((r) => [r.row.LEG_ID, r.vault]));
      const result = {
        vault,
        row,
        isReal: true,
        source: 'real',
        vaultCollection: JSON.parse(JSON.stringify(currentVaults)),
        shield,
        analysisHint: classification.kind === 'VERIFIED_CORE_ONLY' ? 'Core slots 1-65 are trusted for scoring. Tail slots 66-72 were absent and are audit-only.' : 'Atomic Matrix Saturated',
        connectorState: {
          version: SYSTEM_VERSION,
          completedRows: results.length + 1,
          completedProbes: results.length + 1,
          totalProbes,
          liveBranches: ['A', 'B', 'C', 'D', 'E'].filter((key) => ['REAL', 'SUCCESS'].includes(vault.branches[key]?.status)).length,
          derivedBranches: ['A', 'B', 'C', 'D', 'E'].filter((key) => ['DERIVED', 'REAL', 'SUCCESS'].includes(vault.branches[key]?.status)).length,
          branchStatus: Object.fromEntries(['A', 'B', 'C', 'D', 'E'].map((key) => [key, vault.branches[key]?.status || 'WARNING']))
        },
        responseText: payloadResponseText,
        logs: [{ level: classification.kind === 'VERIFIED_CORE_ONLY' ? 'warning' : 'success', text: `[OXYGEN] ${classification.kind === 'VERIFIED_CORE_ONLY' ? 'VERIFIED_CORE_ONLY' : 'VERIFIED_CORE'}: ${row.parsedPlayer} (72 units)` }]
      };
      results.push(result);
      logger(result.logs[0]);
      if (window.PickCalcUI?.renderMiningGrid) {
        try { window.PickCalcUI.renderMiningGrid(batch, stateRef?.miningVault || currentVaults); } catch (uiErr) { console.warn('[OXYGEN] UI_REFRESH_FAIL:', uiErr); }
      }
      hooks.onRowComplete?.({ row, rowIndex: results.length - 1, result, completedRows: results.length, totalRows, completedProbes: results.length, totalProbes });
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
    // If the parser failed to provide a clean name, ABORT to prevent fake sequential data
    if (!row.parsedPlayer || row.parsedPlayer.length < 3 || /vs|@|Sat|Sun/i.test(row.parsedPlayer)) {
      try { window.PickCalcUI?.showToast?.('Mining Blocked: Dirty Player Identity'); } catch (_) {}
      const result = buildIngressErrorResult(row, stateRef, 'Identity Binding Error');
      hooks.onRowComplete?.({ row, rowIndex: 0, result, completedRows: 1, totalRows: 1, completedProbes: 0, totalProbes: 5 });
      hooks.onComplete?.({ results: [result], totalRows: 1, lastResult: result });
      return result;
    }
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
    debugConnection,
    classifyVector
  });
})();
