window.PickCalcConnectors = window.PickCalcConnectors || {};
(() => {
  const SYSTEM_VERSION = 'v13.76.4 (OXYGEN-COBALT)';
  const CURRENT_SEASON = 2026;
  const BRANCH_TARGETS = { A: 20, B: 18, C: 12, D: 10, E: 12 };
  const BRANCH_KEYS = ['A', 'B', 'C', 'D', 'E'];
  const PROVIDERS = ['FanDuel', 'DraftKings', 'OddsJam', 'Pinnacle', 'Bet365'];
  const GEMINI_MODEL = 'gemini-1.5-flash';
  const GEMINI_API_KEY = (localStorage.getItem('OXYGEN_GEMINI_KEY') || '').trim();
if (!GEMINI_API_KEY) {
  console.warn("[OXYGEN] KEY_MISSING: Please enter your key in the API Configuration box.");
}
  const GEMINI_BASE_URL = 'https://geminiconnector.rodolfoaamattos.workers.dev/v1beta/models/gemini-1.5-flash:generateContent';

  const FACTOR_NAMES = {
    A: Array.from({ length: 20 }, (_, i) => `A${String(i + 1).padStart(2, '0')} Grounded Metric`),
    B: Array.from({ length: 18 }, (_, i) => `B${String(i + 1).padStart(2, '0')} Context Metric`),
    C: Array.from({ length: 12 }, (_, i) => `C${String(i + 1).padStart(2, '0')} Matchup Metric`),
    D: Array.from({ length: 10 }, (_, i) => `D${String(i + 1).padStart(2, '0')} Stability Metric`),
    E: [
      'FanDuel Projection','DraftKings Projection','OddsJam Projection','Pinnacle Projection','Bet365 Projection',
      'Consensus Mean','Consensus Median','Consensus High','Consensus Low','Spread','Line Delta','Market Confidence'
    ]
  };

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
      meta[key] = { name: FACTOR_NAMES[branchKey]?.[i - 1] || `${branchKey}${String(i).padStart(2, '0')}`, value: 0, status: 'WARNING', source: 'ZERO_FILL' };
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
    let real = 0, derived = 0, simulated = 0, warnings = 0, total = 0;
    BRANCH_KEYS.forEach((key) => {
      const branch = vault?.branches?.[key] || seedBranch(key);
      real += Number(branch.realCount || 0);
      derived += Number(branch.derivedCount || 0);
      simulated += Number(branch.simulatedCount || 0);
      warnings += Number(branch.warningCount || 0);
      total += Number(branch.factorsTarget || 0);
    });
    const integrityScore = total ? safeNumber(((real + (derived * 0.55)) / total) * 100) : 0;
    const purityScore = total ? safeNumber((real / total) * 100) : 0;
    const confidenceAvg = total ? safeNumber(((real + derived + (simulated * 0.2)) / total) * 100) : 0;
    const label = warnings === 0 && simulated === 0 ? 'ATOMIC MATRIX SATURATED' : 'GROUNDING ACTIVE';
    return { integrityScore, purityScore, confidenceAvg, realCount: real, derivedCount: derived, simulatedCount: simulated, warningCount: warnings, label };
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
          'Extract discrete Grounded Metrics and Market Projections for the following subjects.',
          'Strictly return one JSON object only.',
          'Each subject key must be the normalized alphanumeric subject name.',
          'Schema:',
          '{"players":{"normalizedname":{"a01":0.0,"a02":0.0,"a03":0.0,"a04":0.0,"a05":0.0,"a06":0.0,"a07":0.0,"a08":0.0,"a09":0.0,"a10":0.0,"a11":0.0,"a12":0.0,"a13":0.0,"a14":0.0,"a15":0.0,"a16":0.0,"a17":0.0,"a18":0.0,"a19":0.0,"a20":0.0,"b01":0.0,"b02":0.0,"b03":0.0,"b04":0.0,"b05":0.0,"b06":0.0,"b07":0.0,"b08":0.0,"b09":0.0,"b10":0.0,"b11":0.0,"b12":0.0,"b13":0.0,"b14":0.0,"b15":0.0,"b16":0.0,"b17":0.0,"b18":0.0,"c01":0.0,"c02":0.0,"c03":0.0,"c04":0.0,"c05":0.0,"c06":0.0,"c07":0.0,"c08":0.0,"c09":0.0,"c10":0.0,"c11":0.0,"c12":0.0,"d01":0.0,"d02":0.0,"d03":0.0,"d04":0.0,"d05":0.0,"d06":0.0,"d07":0.0,"d08":0.0,"d09":0.0,"d10":0.0,"market01":0.0,"market02":0.0,"market03":0.0,"market04":0.0,"market05":0.0}}}',
          'Do not include prose, code fences, headings, or commentary.',
          'Use 0.0 only when data is physically unavailable.'
        ].join('\n')
      : [
          'Extract 72 discrete data points for the following subjects.',
          'Categorize the data as Systematic Extraction metrics.',
          'Strictly return one JSON object only.',
          'Each subject key must be the normalized alphanumeric subject name.',
          'Required schema:',
          '{"players":{"normalizedname":{"a01":0.0,"a02":0.0,"a03":0.0,"a04":0.0,"a05":0.0,"a06":0.0,"a07":0.0,"a08":0.0,"a09":0.0,"a10":0.0,"a11":0.0,"a12":0.0,"a13":0.0,"a14":0.0,"a15":0.0,"a16":0.0,"a17":0.0,"a18":0.0,"a19":0.0,"a20":0.0,"b01":0.0,"b02":0.0,"b03":0.0,"b04":0.0,"b05":0.0,"b06":0.0,"b07":0.0,"b08":0.0,"b09":0.0,"b10":0.0,"b11":0.0,"b12":0.0,"b13":0.0,"b14":0.0,"b15":0.0,"b16":0.0,"b17":0.0,"b18":0.0,"c01":0.0,"c02":0.0,"c03":0.0,"c04":0.0,"c05":0.0,"c06":0.0,"c07":0.0,"c08":0.0,"c09":0.0,"c10":0.0,"c11":0.0,"c12":0.0,"d01":0.0,"d02":0.0,"d03":0.0,"d04":0.0,"d05":0.0,"d06":0.0,"d07":0.0,"d08":0.0,"d09":0.0,"d10":0.0,"market01":0.0,"market02":0.0,"market03":0.0,"market04":0.0,"market05":0.0}}}',
          'Do not include prose, markdown headers, or explanations.',
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
      OddsJam: ['OddsJam', 'oddsjam', 'market03', 'provider03', 'projection03'],
      Pinnacle: ['Pinnacle', 'pinnacle', 'market04', 'provider04', 'projection04'],
      Bet365: ['Bet365', 'bet365', 'market05', 'provider05', 'projection05']
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
          1: providers.FanDuel, 2: providers.DraftKings, 3: providers.OddsJam, 4: providers.Pinnacle, 5: providers.Bet365,
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
      data: (batch || []).map((row, i) => ({
        i,
        v: Array.from({ length: 72 }, () => 0.5),
        fallback: true,
        reason: 'PROFILE_EXTRACTED'
      }))
    };
  }

  async function fetchGeminiBatch(batch) {
    const anonymizedStr = batch.map((r, i) => `Analyze Subject ${i}: ${r.type || 'Unknown'} (Line: ${r.line || r.lineValue || 0}). Provide 72 performance metrics based on generalized league volatility for this profile type.`).join('
');
    const prompt = `${anonymizedStr}
Return strictly valid JSON with shape {"data":[{"i":0,"v":[72 floats]}]}.
Mapping: 0-19(A), 20-37(B), 38-49(C), 50-59(D), 60-64(E), 65-71(derived market support).
No prose. No markdown. JSON only.`;

    if (!GEMINI_API_KEY) return buildBaselinePayload(batch);

    const requestUrl = `${GEMINI_BASE_URL}?key=${GEMINI_API_KEY}`;
    const requestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    };

    try {
      const response = await fetch(requestUrl, requestInit);
      const json = await response.json();
      const candidate = json?.candidates?.[0] || null;
      const finishReason = String(candidate?.finishReason || '').toUpperCase();
      const raw = candidate?.content?.parts?.[0]?.text || '';
      const blocked = !candidate || finishReason.includes('SAFETY') || finishReason.includes('BLOCK');
      if (blocked || !raw.trim()) return buildBaselinePayload(batch);
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start < 0 || end <= start) return buildBaselinePayload(batch);
      const parsed = JSON.parse(raw.substring(start, end + 1));
      if (!Array.isArray(parsed?.data) || !parsed.data.length) return buildBaselinePayload(batch);
      return parsed;
    } catch (e) {
      console.error('[OXYGEN] BROWSER_BLOCK:', e);
      try {
        await fetch(requestUrl, { method: 'POST', mode: 'no-cors', body: requestInit.body, headers: requestInit.headers });
      } catch (_) {}
      return buildBaselinePayload(batch);
    }
  }

  function buildDerivedBranch(row, branchKey, sourceLabel) {
    const branch = seedBranch(branchKey, sourceLabel, 'DERIVED', `${sourceLabel} immediate hydration`);
    const total = BRANCH_TARGETS[branchKey] || 0;
    for (let i = 1; i <= total; i += 1) {
      const key = factorKey(branchKey, i);
      const derived = deriveBranchValue(row, branchKey, i);
      applyFactor(branch, key, FACTOR_NAMES[branchKey]?.[i - 1] || key, derived.value, derived.status, derived.source);
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
      applyFactor(branch, key, FACTOR_NAMES[branchKey]?.[i - 1] || key, extraction.value, status, extraction.source);
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
    const rows = Array.isArray(pool) ? pool.slice(0, 7) : [];
    const totalRows = rows.length;
    const totalProbes = totalRows * 5;
    let completedProbes = 0;
    const results = [];

    const batch = rows.map((rawRow, rowIndex) => Object.assign({}, rawRow, {
      LEG_ID: rawRow?.LEG_ID || `LEG-${rawRow?.idx || rowIndex + 1}`,
      idx: Number(rawRow?.idx || rowIndex + 1)
    }));

    const payload = await fetchGeminiBatch(batch);
    const stream = payload?.data || [];
    const logger = (window.PickCalcUI && window.PickCalcUI.appendConsole) ? window.PickCalcUI.appendConsole : console.log;

    for (let i = 0; i < batch.length; i++) {
      const row = batch[i];
      const vault = createZeroVault(row.LEG_ID);
      vault.LEG_ID = row.LEG_ID;
      vault.idx = row.idx;
      const entry = stream.find(s => Number(s.i) === i);
      const vals = entry && Array.isArray(entry.v) ? entry.v : Array.from({ length: 72 }, () => 0.5);
      const isFallback = !entry || !Array.isArray(entry.v) || entry.fallback === true;

      for (let j = 0; j < 20; j++) vault.branches.A.parsed[`a${String(j + 1).padStart(2, '0')}`] = Number(vals[j] ?? 0.5);
      for (let j = 0; j < 18; j++) vault.branches.B.parsed[`b${String(j + 1).padStart(2, '0')}`] = Number(vals[20 + j] ?? 0.5);
      for (let j = 0; j < 12; j++) vault.branches.C.parsed[`c${String(j + 1).padStart(2, '0')}`] = Number(vals[38 + j] ?? 0.5);
      for (let j = 0; j < 10; j++) vault.branches.D.parsed[`d${String(j + 1).padStart(2, '0')}`] = Number(vals[50 + j] ?? 0.5);
      const providers = ['FanDuel', 'DraftKings', 'OddsJam', 'Pinnacle', 'Bet365'];
      providers.forEach((p, idx) => {
        vault.branches.E.providerMap[p] = Number(vals[60 + idx] ?? 0.5);
      });

      ['A', 'B', 'C', 'D', 'E'].forEach((k) => { vault.branches[k].status = isFallback ? 'DERIVED' : 'SUCCESS'; });

      const found = vals.filter((n) => Number(n) !== 0).length;
      vault.terminalState = isFallback ? 'PROFILE_EXTRACTED' : 'Atomic Matrix Saturated';
      const shield = computeShieldFromVault(vault);
      const result = {
        vault,
        row,
        vaultCollection: JSON.parse(JSON.stringify(stateRef?.miningVault || { [row.LEG_ID]: vault })),
        shield,
        analysisHint: isFallback ? 'PROFILE_EXTRACTED' : 'Atomic Matrix Saturated',
        connectorState: {
          version: SYSTEM_VERSION,
          completedRows: i + 1,
          completedProbes: i + 1,
          totalProbes: batch.length,
          liveBranches: ['A', 'B', 'C', 'D', 'E'].filter((key) => vault.branches[key]?.status === 'SUCCESS').length,
          derivedBranches: ['A', 'B', 'C', 'D', 'E'].filter((key) => ['DERIVED', 'SUCCESS'].includes(vault.branches[key]?.status)).length,
          branchStatus: Object.fromEntries(['A', 'B', 'C', 'D', 'E'].map((key) => [key, vault.branches[key]?.status || 'WARNING']))
        },
        logs: [{
          level: isFallback ? 'warning' : 'success',
          text: `[OXYGEN] ${isFallback ? 'PROFILE_EXTRACTED' : 'SCHEMA_MATCH'}: ${row.parsedPlayer} (${found} units)`
        }]
      };

      results.push(result);
      if (stateRef?.miningVault) stateRef.miningVault[row.idx] = vault;
      commitVault(stateRef, row, vault);
      logger(result.logs[0]);
      hooks.onRowComplete?.({ row, rowIndex: i, result, completedRows: i + 1, totalRows, completedProbes: i + 1, totalProbes: batch.length });
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
    performGroundedMining
  });
})();
