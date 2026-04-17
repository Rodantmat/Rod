window.PickCalcConnectors = window.PickCalcConnectors || {};
(() => {
  const SYSTEM_VERSION = 'v13.69.0 (OXYGEN-COBALT)';
  const CURRENT_SEASON = 2026;
  const BRANCH_TARGETS = { A: 20, B: 18, C: 12, D: 10, E: 12 };
  const BRANCH_KEYS = ['A', 'B', 'C', 'D', 'E'];
  const PROVIDERS = ['FanDuel', 'DraftKings', 'OddsJam', 'Pinnacle', 'Bet365'];
  const GEMINI_MODEL = 'gemini-1.5-flash';
  const GEMINI_API_KEY = (window.__OXYGEN_GEMINI_KEY || localStorage.getItem('OXYGEN_GEMINI_KEY') || '').trim();

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
    const branches = {};
    BRANCH_KEYS.forEach((key) => { branches[key] = seedBranch(key); });
    return {
      LEG_ID: row.LEG_ID || `LEG-${row.idx || 0}`,
      idx: row.idx || 0,
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


  async function fetchGeminiBatch(rows, hooks = {}) {
    const batch = Array.isArray(rows) ? rows : [];
    if (!batch.length) return null;
    if (!GEMINI_API_KEY) {
      hooks.onBranch?.({ text: '[OXYGEN-COBALT] Gemini key missing. Systematic Extraction payload unavailable.', level: 'warning' });
      return null;
    }

    const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;

    // REPLACE internal logic in fetchGeminiBatch:
    const prompt = `Perform a Systematic Extraction for ${batch.length} Subjects.
Mapping: ${batch.map((r, i) => `Index ${i}: ${r.parsedPlayer}`).join(', ')}.
Return a strictly valid JSON object containing a "subjects" array. 
Each object in the array MUST contain:
- "index": integer (verbatim index from 0 to ${batch.length - 1})
- "metric_group_a": { "a01": float, ..., "a20": float }
- "metric_group_b": { "b01": float, ..., "b18": float }
- "metric_group_c": { "c01": float, ..., "c12": float }
- "metric_group_d": { "d01": float, ..., "d10": float }
- "variance_projections": { "p01": float, "p02": float, "p03": float, "p04": float, "p05": float }

NO PROSE. NO MARKDOWN. NO EXPLANATIONS. Initialize unavailable values as 0.0.`;

    try {
      const response = await fetch(`${GEMINI_BASE_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
        })
      });

      const data = await response.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      try {
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        return JSON.parse(raw.substring(start, end + 1));
      } catch (e) {
        console.error('[OXYGEN] Extraction Void:', e);
        hooks.onBranch?.({ text: `[OXYGEN] Extraction Void: ${e.message}`, level: 'warning' });
        return null;
      }
    } catch (error) {
      hooks.onBranch?.({ text: `[OXYGEN-COBALT] Systematic Extraction failed: ${error.message}`, level: 'warning' });
      return null;
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

    const payload = await fetchGeminiBatch(batch, hooks);
    const subjectPool = payload?.subjects || [];

    for (let rowIndex = 0; rowIndex < batch.length; rowIndex += 1) {
      const row = batch[rowIndex];

      hooks.onRowStart?.({ row, rowIndex, totalRows });
      const vault = createZeroVault(row);
      commitVault(stateRef, row, vault);
      hooks.onBranch?.({
        row,
        rowIndex,
        totalRows,
        completedProbes,
        totalProbes,
        branchKey: 'INIT',
        vault: JSON.parse(JSON.stringify(vault)),
        shield: computeShieldFromVault(vault),
        logs: [{ level: 'info', text: `[OXYGEN-COBALT] Zero-fill primed for ${row.parsedPlayer || row.LEG_ID}.` }]
      });
      await yieldToUi();

      vault.branches.B = buildDerivedBranch(row, 'B', 'Local Memory');
      commitVault(stateRef, row, vault);
      completedProbes += 1;
      hooks.onBranch?.({ row, rowIndex, totalRows, completedProbes, totalProbes, branchKey: 'B', vault: JSON.parse(JSON.stringify(vault)), shield: computeShieldFromVault(vault) });
      await yieldToUi();

      vault.branches.C = buildDerivedBranch(row, 'C', 'Local Memory');
      commitVault(stateRef, row, vault);
      completedProbes += 1;
      hooks.onBranch?.({ row, rowIndex, totalRows, completedProbes, totalProbes, branchKey: 'C', vault: JSON.parse(JSON.stringify(vault)), shield: computeShieldFromVault(vault) });
      await yieldToUi();

      vault.branches.D = buildDerivedBranch(row, 'D', 'neutronSearch');
      commitVault(stateRef, row, vault);
      completedProbes += 1;
      hooks.onBranch?.({ row, rowIndex, totalRows, completedProbes, totalProbes, branchKey: 'D', vault: JSON.parse(JSON.stringify(vault)), shield: computeShieldFromVault(vault) });
      await yieldToUi();

      vault.branches.A = seedBranch('A', 'Systematic Extraction', 'WARNING', 'Index-Locked Ingress active');
      vault.branches.E = seedBranch('E', 'Subjective Variance', 'WARNING', 'Variance projection hydration active');

      // Inside streamingIngress, REPLACE the Batch-to-Vault hydration loop:
      const subject = subjectPool.find((s) => parseInt(s?.index) === rowIndex);

      if (subject) {
        const map = { metric_group_a: 'A', metric_group_b: 'B', metric_group_c: 'C', metric_group_d: 'D' };

        Object.entries(map).forEach(([apiGroup, branchKey]) => {
          if (subject[apiGroup]) {
            Object.entries(subject[apiGroup]).forEach(([factorKey, value]) => {
              const num = Number(value);
              if (!isNaN(num) && num !== 0) {
                vault.branches[branchKey].parsed[factorKey] = safeNumber(num);
                vault.branches[branchKey].status = 'SUCCESS';
                if (vault.branches[branchKey].factorMeta?.[factorKey]) {
                  vault.branches[branchKey].factorMeta[factorKey].status = 'REAL';
                  vault.branches[branchKey].factorMeta[factorKey].source = 'SYSTEMATIC_EXTRACTION';
                  vault.branches[branchKey].factorMeta[factorKey].value = safeNumber(num);
                }
              }
            });
          }
          updateBranchMeta(vault.branches[branchKey]);
        });

        if (subject.variance_projections) {
          const pMap = { p01: 'FanDuel', p02: 'DraftKings', p03: 'OddsJam', p04: 'Pinnacle', p05: 'Bet365' };
          Object.entries(pMap).forEach(([pKey, provider]) => {
            const pVal = Number(subject.variance_projections[pKey]);
            if (!isNaN(pVal) && pVal !== 0) {
              vault.branches.E.providerMap[provider] = safeNumber(pVal);
              vault.branches.E.status = 'SUCCESS';
            }
          });
        }
      }

      PROVIDERS.forEach((provider) => {
        if (!Number.isFinite(Number(vault.branches.E.providerMap[provider]))) vault.branches.E.providerMap[provider] = 0;
      });

      updateBranchMeta(vault.branches.E);

      const realCount = Object.values(vault.branches).reduce((acc, br) => 
        acc + Object.values(br.parsed || {}).filter(v => v !== 0).length, 0);

      if (realCount === 0) {
        appendConsole({ level: 'warning', text: `[OXYGEN] PHYSICS_NULL_EXPOSURE for ${row.parsedPlayer}` });
        hooks.onBranch?.({
          row,
          rowIndex,
          totalRows,
          completedProbes,
          totalProbes,
          branchKey: 'VERIFY',
          vault: JSON.parse(JSON.stringify(vault)),
          shield: computeShieldFromVault(vault),
          logs: [{ level: 'warning', text: `[OXYGEN] PHYSICS_NULL_EXPOSURE for ${row.parsedPlayer}` }]
        });
      } else {
        appendConsole({ level: 'success', text: `[OXYGEN] SUBJECT_HYDRATED: ${row.parsedPlayer} (Index:${rowIndex})` });
        hooks.onBranch?.({
          row,
          rowIndex,
          totalRows,
          completedProbes,
          totalProbes,
          branchKey: 'VERIFY',
          vault: JSON.parse(JSON.stringify(vault)),
          shield: computeShieldFromVault(vault),
          logs: [{ level: 'success', text: `[OXYGEN] SUBJECT_HYDRATED: ${row.parsedPlayer} (Index:${rowIndex})` }]
        });
      }

      if (stateRef && typeof stateRef === 'object') {
        stateRef.miningVault = stateRef.miningVault || {};
        stateRef.miningVault[row.idx] = JSON.parse(JSON.stringify(vault));
      }
      commitVault(stateRef, row, vault);
      completedProbes += 1;
      hooks.onBranch?.({ row, rowIndex, totalRows, completedProbes, totalProbes, branchKey: 'A', vault: JSON.parse(JSON.stringify(vault)), shield: computeShieldFromVault(vault) });
      await yieldToUi();

      vault.terminalState = realCount === 0 ? 'SUBJECTIVE_VARIANCE_NULL_EXPOSURE' : 'SUBJECT_HYDRATED';
      commitVault(stateRef, row, vault);

      completedProbes += 1;
      const shield = computeShieldFromVault(vault);
      hooks.onBranch?.({
        row,
        rowIndex,
        totalRows,
        completedProbes,
        totalProbes,
        branchKey: 'E',
        vault: JSON.parse(JSON.stringify(vault)),
        shield,
        logs: [{
          level: realCount === 0 ? 'warning' : 'success',
          text: realCount === 0
            ? `[OXYGEN-COBALT] SUBJECTIVE_VARIANCE_NULL_EXPOSURE for ${row.parsedPlayer || row.LEG_ID}.`
            : `[OXYGEN-COBALT] SUBJECT_HYDRATED for ${row.parsedPlayer || row.LEG_ID}.`
        }]
      });
      await yieldToUi();

      const result = {
        row,
        vault: JSON.parse(JSON.stringify(vault)),
        vaultCollection: JSON.parse(JSON.stringify(stateRef?.miningVault || { [row.LEG_ID]: vault })),
        shield,
        analysisHint: vault.terminalState,
        connectorState: {
          version: SYSTEM_VERSION,
          completedRows: rowIndex + 1,
          completedProbes,
          totalProbes,
          liveBranches: BRANCH_KEYS.filter((key) => vault.branches[key].status === 'SUCCESS').length,
          derivedBranches: BRANCH_KEYS.filter((key) => ['DERIVED', 'SUCCESS'].includes(vault.branches[key].status)).length,
          branchStatus: Object.fromEntries(BRANCH_KEYS.map((key) => [key, vault.branches[key].status]))
        },
        logs: [{
          level: realCount === 0 ? 'warning' : 'success',
          text: realCount === 0
            ? `[OXYGEN-COBALT] SUBJECTIVE_VARIANCE_NULL_EXPOSURE for ${row.parsedPlayer || row.LEG_ID}.`
            : `[OXYGEN-COBALT] SUBJECT_HYDRATED for ${row.parsedPlayer || row.LEG_ID}.`
        }]
      };
      results.push(result);
      hooks.onRowComplete?.({ row, rowIndex, result, completedRows: rowIndex + 1, totalRows, completedProbes, totalProbes });
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
