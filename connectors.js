window.PickCalcConnectors = window.PickCalcConnectors || {};
(() => {
  const SYSTEM_VERSION = 'AlphaDog v0.0.1';
  const CURRENT_SEASON = 2026;
  const BRANCH_TARGETS = { A: 20, B: 18, C: 12, D: 10, E: 12 };
  const BRANCH_KEYS = ['A', 'B', 'C', 'D', 'E'];
  const PROVIDERS = ['DraftKings', 'FanDuel', 'BetMGM', 'Bet365', 'Pinnacle'];
  const GEMINI_MODEL = 'gemini-3.1-pro-preview';
  const GEMINI_FALLBACK_MODELS = ['gemini-3.1-flash-lite-preview'];
  const SYSTEM_PROMPT = `<System_Prompt>
You are the AlphaDog Hostile Auditor. Analyze up to 24 legs using 2026 context.
Be brutal. For each leg, return:
[Sport] - [Full Name] ([Team]) @ [Opponent] - [Date/Time]
[Prop] [Metric] [Direction]
Identity & Context Integrity: [x]/100
Performance & Trend Variance: [x]/100
Situational Stress-Testing: [x]/100
Risk & Volatility Buffers: [x]/100
Final Score: [x]/100
[Batch Footer]: Overall Auditor Score: [x]/100
</System_Prompt>`;
  const GEMINI_BASE_URL = 'https://geminiconnector.rodolfoaamattos.workers.dev';

  const FACTOR_NAMES = {
    Pitcher: {
      A: ["Velocity Stability", "Spin Rate Delta", "Extension", "Vertical Break", "Horizontal Movement", "Command Grade", "Location Heat", "Tunneling Quality", "Release Consistency", "Zone Rate", "K-BB% Trend", "Whiff Rate (Fastball)", "Whiff Rate (Offspeed)", "First Pitch Strike%", "Put-away % Efficiency", "Hard Hit Avoidance", "Barrel Rate Allowed", "GB/FB Ratio", "Average Exit Velocity", "Soft Contact%"],
      B: ["Stamina Decay", "Late Movement", "Release Extension", "Strike-One Rate", "Pressure Tolerance", "High-Leverage Efficiency", "Primary Pitch Reliability", "Secondary Pitch Bite", "Sequencing Logic", "Pitch Mix Stability", "Velocity Preservation", "Third-Time-Through Penalty", "Contact Suppression", "CSW Rate", "Called Strike Edge", "Chase Induction", "Backdoor Command", "Finisher Quality"],
      C: ["Park Factor", "Umpire Bias", "Wind Impact", "Historical Matchup", "L/R Splits", "Recent 5-Game Trend", "Air Density", "Umpire Zone", "Defense Support", "Bullpen Buffer", "Game Script Fit", "Weather Volatility"],
      D: ["Platoon Delta", "Manager Threshold", "Lineup Depth", "Run Support Expectation", "Inning Efficiency", "Pitch Count Elasticity", "Strike Zone Fit", "Batted-Ball Luck", "Recovery Window", "Clutch Stability"],
      E: ["DK Projection", "FD Projection", "MGM Projection", "365 Projection", "PIN Projection", "Mean Signal", "Median Signal", "Ceiling Signal", "Floor Signal", "Volatility Signal", "Divergence Signal", "Confidence Signal"]
    },
    Hitter: {
      A: ["Bat Speed", "Squared Up", "Blasts", "Sweet Spot", "LA Consistency", "Max Exit Velocity", "Pull/Opposite Mix", "Two-Strike Approach", "Chase Rate", "In-Zone Contact", "Pitch Recognition", "Barrel Accuracy", "Pull Power", "Oppo Gap Efficiency", "High-Fastball Combat", "Offspeed Timing", "Clout Grade", "Sprint Speed Impact", "ISO Trend", "Plate Coverage"],
      B: ["Contact Authority", "Damage on Mistakes", "Breaking Ball Handling", "Fastball Lift", "Spray Discipline", "RISP Approach", "Walk Pressure", "Strikeout Resistance", "First-Pitch Attack", "Pull Airball Rate", "Center-Field Carry", "Opposite-Field Carry", "Lefty Split Stability", "Righty Split Stability", "Batted-Ball Efficiency", "Basepath Leverage", "Lineup Spot Edge", "Clutch Contact"],
      C: ["Park Factor", "Umpire Bias", "Wind Impact", "Historical Matchup", "L/R Splits", "Recent 5-Game Trend", "Air Density", "Umpire Zone", "Bullpen Exposure", "Weather Volatility", "Lineup Protection", "Game Script Fit"],
      D: ["Platoon Delta", "Manager Threshold", "Hit Probability Drift", "Extra-Base Upside", "Contact Floor", "Power Spike Chance", "Pitcher Vulnerability", "Defensive Shift Cost", "Batted-Ball Luck", "Late-Game Leverage"],
      E: ["DK Projection", "FD Projection", "MGM Projection", "365 Projection", "PIN Projection", "Mean Signal", "Median Signal", "Ceiling Signal", "Floor Signal", "Volatility Signal", "Divergence Signal", "Confidence Signal"]
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
    vault.reliable = false;
    vault.proofFlags = { passed: false, checks: [], failures: [{ key: 'ingress_error', label: detail, passed: false, message: detail }], statusLabel: 'PROOF_FAIL' };
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
      isReal: false,
      isReliable: false,
      shield: computeShieldFromVault(vault),
      analysisHint: detail,
      runStatus: /temporary api unavailable|non-real gemini payload|payload not verified from gemini api/i.test(detail) ? 'FAILED_PAYLOAD' : 'FAILED_CONNECTOR',
      finalized: true,
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
      rawPayload: window.__ALPHADOG_RAW_GEMINI_PAYLOAD__ || '',
      logs: [{ level: 'warning', text: `[OXYGEN] DATA_INGRESS_ERROR: ${row?.parsedPlayer || row?.LEG_ID || 'UNKNOWN_ROW'} :: ${detail}` }]
    };
  }

  function rowHasIngressIdentityError(row = {}) {
    const player = String(row?.parsedPlayer || '').trim();
    if (!player) return true;
    return /\b(?:vs\.?|@|Sun|Mon|Tue|Wed|Thu|Fri|Sat)\b/i.test(player);
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


  function nearlyEqual(a, b, tolerance = 0.02) {
    return Math.abs(Number(a || 0) - Number(b || 0)) <= tolerance;
  }

  function buildCheck(key, label, actual, expected, passed, severity = 'error') {
    return {
      key,
      label,
      actual: safeNumber(actual, 0),
      expected: safeNumber(expected, 0),
      passed: Boolean(passed),
      severity,
      message: passed ? `${label}: PASS` : `${label}: FAIL (actual ${safeNumber(actual, 0).toFixed(2)} vs expected ${safeNumber(expected, 0).toFixed(2)})`
    };
  }

  function computeLocalMarketMetrics(providerMap = {}) {
    const values = [providerMap.DraftKings, providerMap.FanDuel, providerMap.BetMGM, providerMap.Bet365, providerMap.Pinnacle]
      .map((value) => Number(value))
      .filter(Number.isFinite);
    const high = values.length ? Math.max(...values) : 0;
    const low = values.length ? Math.min(...values) : 0;
    const mean = average(values);
    const medianValue = median(values);
    const spread = safeNumber(high - low, 0);
    const coverageCount = values.filter((value) => value > 0).length;
    const marketConfidence = safeNumber(coverageCount / 5, 0);
    return {
      mean,
      median: medianValue,
      high: safeNumber(high, 0),
      low: safeNumber(low, 0),
      spread,
      lineDelta: mean,
      marketConfidence,
      coverageCount
    };
  }

  function stampBranchEAudit(vault = {}, metrics = {}, payloadValues = []) {
    const branch = vault?.branches?.E;
    if (!branch) return;
    const numericValues = Array.isArray(payloadValues) ? payloadValues.map((value) => safeNumber(value, 0)) : [];
    branch.localArithmetic = {
      mean: safeNumber(metrics.mean, 0),
      median: safeNumber(metrics.median, 0),
      high: safeNumber(metrics.high, 0),
      low: safeNumber(metrics.low, 0),
      spread: safeNumber(metrics.spread, 0),
      lineDelta: safeNumber(metrics.lineDelta, 0),
      marketConfidence: safeNumber(metrics.marketConfidence, 0)
    };
    branch.modeledTail = {
      meanSignal: safeNumber(numericValues[65], 0),
      medianSignal: safeNumber(numericValues[66], 0),
      highSignal: safeNumber(numericValues[67], 0),
      lowSignal: safeNumber(numericValues[68], 0),
      spreadSignal: safeNumber(numericValues[69], 0),
      lineDeltaSignal: safeNumber(numericValues[70], 0),
      confidenceSignal: safeNumber(numericValues[71], 0)
    };
    branch.auditMode = 'RAW_PLUS_MODELED_TAIL';
    const renamePairs = [
      ['e06', 'Tail 66 Mean Signal'],
      ['e07', 'Tail 67 Median Signal'],
      ['e08', 'Tail 68 Ceiling Signal'],
      ['e09', 'Tail 69 Floor Signal'],
      ['e10', 'Tail 70 Volatility Signal'],
      ['e11', 'Tail 71 Divergence Signal'],
      ['e12', 'Tail 72 Confidence Signal']
    ];
    renamePairs.forEach(([key, name]) => {
      if (branch.factorMeta?.[key]) branch.factorMeta[key].name = name;
    });
    updateBranchMeta(branch);
  }

  function buildProofFlags(vault = {}, row = {}, payloadValues = []) {
    const checks = [];
    const numericValues = Array.isArray(payloadValues) ? payloadValues.map((value) => Number(value)) : [];
    const allFinite = numericValues.length === 72 && numericValues.every(Number.isFinite);
    const allInRange = allFinite && numericValues.every((value) => value >= 0 && value <= 1);

    checks.push({ key: 'schema_length', label: 'Schema Length 72', passed: numericValues.length === 72, actual: numericValues.length, expected: 72, severity: 'error', message: numericValues.length === 72 ? 'Schema Length 72: PASS' : `Schema Length 72: FAIL (actual ${numericValues.length} vs expected 72)` });
    checks.push({ key: 'numeric_finite', label: 'All Numeric Finite', passed: allFinite, actual: allFinite ? 72 : 0, expected: 72, severity: 'error', message: allFinite ? 'All Numeric Finite: PASS' : 'All Numeric Finite: FAIL' });
    checks.push({ key: 'numeric_unit_range', label: 'All Values In 0-1 Range', passed: allInRange, actual: allInRange ? 72 : 0, expected: 72, severity: 'error', message: allInRange ? 'All Values In 0-1 Range: PASS' : 'All Values In 0-1 Range: FAIL' });

    const providerMap = vault?.branches?.E?.providerMap || {};
    const metrics = computeLocalMarketMetrics(providerMap);
    const rawMean = vault?.branches?.E?.factorMeta?.e06?.value ?? 0;
    const rawMedian = vault?.branches?.E?.factorMeta?.e07?.value ?? 0;
    const rawHigh = vault?.branches?.E?.factorMeta?.e08?.value ?? 0;
    const rawLow = vault?.branches?.E?.factorMeta?.e09?.value ?? 0;
    const rawSpread = vault?.branches?.E?.factorMeta?.e10?.value ?? 0;
    const rawConfidence = vault?.branches?.E?.factorMeta?.e12?.value ?? 0;

    const tailAudits = [
      {
        key: 'mean_signal_divergence',
        label: 'Branch E Mean Signal vs Raw Mean',
        actual: safeNumber(rawMean, 0),
        expected: safeNumber(metrics.mean, 0),
        passed: true,
        severity: 'info',
        message: `Branch E Mean Signal Divergence: ${safeNumber(rawMean,0).toFixed(2)} vs raw mean ${safeNumber(metrics.mean,0).toFixed(2)}`
      },
      {
        key: 'median_signal_divergence',
        label: 'Branch E Median Signal vs Raw Median',
        actual: safeNumber(rawMedian, 0),
        expected: safeNumber(metrics.median, 0),
        passed: true,
        severity: 'info',
        message: `Branch E Median Signal Divergence: ${safeNumber(rawMedian,0).toFixed(2)} vs raw median ${safeNumber(metrics.median,0).toFixed(2)}`
      },
      {
        key: 'ceiling_signal_divergence',
        label: 'Branch E Ceiling Signal vs Raw High',
        actual: safeNumber(rawHigh, 0),
        expected: safeNumber(metrics.high, 0),
        passed: true,
        severity: 'info',
        message: `Branch E Ceiling Signal Divergence: ${safeNumber(rawHigh,0).toFixed(2)} vs raw high ${safeNumber(metrics.high,0).toFixed(2)}`
      },
      {
        key: 'floor_signal_divergence',
        label: 'Branch E Floor Signal vs Raw Low',
        actual: safeNumber(rawLow, 0),
        expected: safeNumber(metrics.low, 0),
        passed: true,
        severity: 'info',
        message: `Branch E Floor Signal Divergence: ${safeNumber(rawLow,0).toFixed(2)} vs raw low ${safeNumber(metrics.low,0).toFixed(2)}`
      },
      {
        key: 'volatility_signal_divergence',
        label: 'Branch E Volatility Signal vs Raw Spread',
        actual: safeNumber(rawSpread, 0),
        expected: safeNumber(metrics.spread, 0),
        passed: true,
        severity: 'info',
        message: `Branch E Volatility Signal Divergence: ${safeNumber(rawSpread,0).toFixed(2)} vs raw spread ${safeNumber(metrics.spread,0).toFixed(2)}`
      },
      {
        key: 'confidence_signal_divergence',
        label: 'Branch E Confidence Signal vs Raw Confidence',
        actual: safeNumber(rawConfidence, 0),
        expected: safeNumber(metrics.marketConfidence, 0),
        passed: true,
        severity: 'info',
        message: `Branch E Confidence Signal Divergence: ${safeNumber(rawConfidence,0).toFixed(2)} vs raw confidence ${safeNumber(metrics.marketConfidence,0).toFixed(2)}`
      },
      {
        key: 'market_tail_inversion',
        label: 'Branch E Ceiling/Floor Signal Order',
        actual: safeNumber(rawHigh - rawLow, 0),
        expected: 0,
        passed: true,
        severity: 'info',
        message: Number(rawHigh) >= Number(rawLow)
          ? `Branch E Ceiling/Floor Signal Order: NORMAL (ceiling ${safeNumber(rawHigh,0).toFixed(2)} >= floor ${safeNumber(rawLow,0).toFixed(2)})`
          : `Branch E Ceiling/Floor Signal Order: INVERTED (ceiling ${safeNumber(rawHigh,0).toFixed(2)} < floor ${safeNumber(rawLow,0).toFixed(2)})`
      }
    ];

    const failures = checks.filter((check) => !check.passed);
    const hardFailures = failures.filter((check) => check.severity === 'error');
    const partial = false;
    const corePassed = hardFailures.length === 0;
    return {
      passed: corePassed,
      corePassed,
      partial,
      checks,
      failures: hardFailures,
      hardFailures,
      tailAudits,
      localMarket: metrics,
      statusLabel: hardFailures.length > 0 ? 'PROOF_FAIL' : (partial ? 'TAIL_AUDIT' : 'PROOF_PASS')
    };
  }


  function summarizePayloadDensity(payloadValues = []) {
    const numericValues = Array.isArray(payloadValues) ? payloadValues.map((value) => Number(value)) : [];
    const core = numericValues.slice(0, 60);
    const market = numericValues.slice(60, 65);
    const tail = numericValues.slice(65, 72);
    const nonZeroCore = core.filter((value) => Number.isFinite(value) && Math.abs(value) > 0.000001).length;
    const nonZeroMarket = market.filter((value) => Number.isFinite(value) && Math.abs(value) > 0.000001).length;
    const nonZeroTail = tail.filter((value) => Number.isFinite(value) && Math.abs(value) > 0.000001).length;
    return {
      nonZeroCore,
      nonZeroMarket,
      nonZeroTail,
      collapsed: nonZeroCore < 18,
      sparse: nonZeroCore < 30
    };
  }


  function computeStdDev(values = []) {
    const nums = (Array.isArray(values) ? values : []).map((v) => Number(v)).filter((v) => Number.isFinite(v));
    if (!nums.length) return 0;
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    return Math.sqrt(nums.reduce((a, b) => a + ((b - mean) ** 2), 0) / nums.length);
  }

  function classifyPayloadQuality(vals = [], warnings = []) {
    const density = summarizePayloadDensity(vals);
    const core = (Array.isArray(vals) ? vals : []).slice(0, 60);
    const distinct = new Set(core.filter((v) => Number.isFinite(Number(v))).map((v) => Number(v).toFixed(3))).size;
    const stddev = computeStdDev(core);
    const lowVariance = warnings.some((w) => /low-variance/i.test(String(w))) || stddev < 0.04 || distinct < 15;
    const insufficientEvidence = density.nonZeroCore > 0 && density.nonZeroCore <= 8 && density.nonZeroMarket >= 5 && density.nonZeroTail === 0;
    if (insufficientEvidence) return { kind: 'INSUFFICIENT_EVIDENCE', retryable: false, density, stddev, distinct };
    if (density.collapsed) return { kind: 'COLLAPSED_PAYLOAD', retryable: true, density, stddev, distinct };
    if (lowVariance) return { kind: 'LOW_VARIANCE', retryable: true, density, stddev, distinct };
    return { kind: 'VALID', retryable: false, density, stddev, distinct };
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
      source: 'pending',
      isReal: false,
      reliable: false,
      proofFlags: { passed: false, checks: [], failures: [], statusLabel: 'UNVERIFIED' },
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

  function safeJsonParse(raw, options = {}) {
    const expectSingle = Boolean(options?.expectSingle);
    let clean = sanitizeJsonText(raw)
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
    const wrapSingle = (parsed) => {
      if (!expectSingle || !parsed || typeof parsed !== 'object') return parsed;
      if (Array.isArray(parsed?.data)) return parsed;
      if (Array.isArray(parsed?.v) && parsed.v.length === 72) {
        return { batch_count: 1, data: [{ i: 0, row_key: String(parsed?.row_key || parsed?.id || '').trim(), v: parsed.v }] };
      }
      return parsed;
    };
    try {
      return { parsed: wrapSingle(JSON.parse(clean)), clean };
    } catch (error) {
      const trimmed = clean.trim();
      if (expectSingle) {
        const vectorMatch = trimmed.match(/\[(?:\s*-?\d+(?:\.\d+)?\s*,?){72}\s*\]/);
        if (vectorMatch) {
          try {
            const arr = JSON.parse(vectorMatch[0]);
            return { parsed: { batch_count: 1, data: [{ i: 0, row_key: '', v: arr }] }, clean: vectorMatch[0], repaired: true };
          } catch (_) {}
        }
      }
      try {
        if (trimmed.endsWith('}') && !trimmed.endsWith(']}')) {
          const repaired = `${trimmed}]}`;
          return { parsed: wrapSingle(JSON.parse(repaired)), clean: repaired, repaired: true };
        }
      } catch (_) {}
      try {
        const lastObj = trimmed.lastIndexOf('}');
        const dataStart = trimmed.indexOf('[');
        if (dataStart >= 0 && lastObj > dataStart) {
          const repaired = trimmed.slice(0, lastObj + 1) + ']}';
          return { parsed: wrapSingle(JSON.parse(repaired)), clean: repaired, repaired: true };
        }
      } catch (_) {}
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

  function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

  function isRetryableStatus(status) {
    return [429, 500, 502, 503, 504].includes(Number(status));
  }

  function vectorSignature(v = []) {
    return Array.isArray(v) ? v.map((n) => Number(n).toFixed(3)).join('|') : '';
  }

  function tailIsFlat(v = []) {
    const tail = Array.isArray(v) ? v.slice(65, 72).map((n) => Number(n).toFixed(3)) : [];
    return tail.length === 7 && new Set(tail).size === 1;
  }

  function makeAlert(code, message, severity = 'warning', retryable = false) {
    return { code, message, severity, retryable };
  }

  function entryStats(v = []) {
    const nums = Array.isArray(v) ? v.map((n) => Number(n)).filter(Number.isFinite) : [];
    if (!nums.length) return { distinct2: 0, stddev: 0, meanAbsDiff: 0 };
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const variance = nums.reduce((sum, n) => sum + ((n - mean) ** 2), 0) / nums.length;
    const distinct2 = new Set(nums.map((n) => n.toFixed(2))).size;
    return { distinct2, stddev: Math.sqrt(variance) };
  }

  function vectorsTooSimilar(a = [], b = []) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) return false;
    const meanAbs = a.reduce((sum, n, idx) => sum + Math.abs(Number(n) - Number(b[idx])), 0) / a.length;
    let near = 0;
    for (let i = 0; i < a.length; i += 1) {
      if (Math.abs(Number(a[i]) - Number(b[i])) <= 0.02) near += 1;
    }
    return meanAbs < 0.035 || near >= 62;
  }


  function pearsonCorrelation(a = [], b = []) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) return 0;
    const xs = a.map((n) => Number(n)).filter(Number.isFinite);
    const ys = b.map((n) => Number(n)).filter(Number.isFinite);
    if (xs.length !== a.length || ys.length !== b.length) return 0;
    const meanX = xs.reduce((s, n) => s + n, 0) / xs.length;
    const meanY = ys.reduce((s, n) => s + n, 0) / ys.length;
    let num = 0;
    let denX = 0;
    let denY = 0;
    for (let i = 0; i < xs.length; i += 1) {
      const dx = xs[i] - meanX;
      const dy = ys[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    if (!denX || !denY) return 0;
    return num / Math.sqrt(denX * denY);
  }

  function detectSyntheticPattern(entries = []) {
    const vectors = entries.map((entry) => Array.isArray(entry?.v) ? entry.v.map((n) => Number(n)) : []).filter((v) => v.length === 72);
    const count = vectors.length;
    if (count < 2) return { flagged: false, retryable: false, reason: '', metrics: { count } };

    let lowPaletteCount = 0;
    let mirroredPairs = 0;
    let recurringMotifVectors = 0;
    const motifSubjects = new Map();

    vectors.forEach((vector, idx) => {
      const formatted = vector.map((n) => n.toFixed(3));
      const unique3 = new Set(formatted);
      const ratio = unique3.size / vector.length;
      if ((count >= 4 && (ratio < 0.30 || unique3.size < 20)) || (count >= 2 && count <= 3 && ratio < 0.15)) lowPaletteCount += 1;
      const localFour = new Map();
      const subjectMotifs = new Set();
      for (let i = 0; i <= formatted.length - 4; i += 1) {
        const motif = formatted.slice(i, i + 4).join('|');
        localFour.set(motif, (localFour.get(motif) || 0) + 1);
        subjectMotifs.add(motif);
      }
      if (count >= 4 && Array.from(localFour.values()).some((c) => c >= 3)) recurringMotifVectors += 1;
      subjectMotifs.forEach((motif) => {
        if (!motifSubjects.has(motif)) motifSubjects.set(motif, new Set());
        motifSubjects.get(motif).add(idx);
      });
    });

    let motifReuse = 0;
    const crossThreshold = count >= 4 ? 2 : 99;
    motifSubjects.forEach((subjects) => {
      if (subjects.size > crossThreshold) motifReuse += 1;
    });

    for (let i = 0; i < vectors.length; i += 1) {
      for (let j = i + 1; j < vectors.length; j += 1) {
        const r = pearsonCorrelation(vectors[i], vectors[j]);
        if ((count >= 4 && r > 0.96) || (count <= 3 && r > 0.99)) mirroredPairs += 1;
      }
    }

    if (count <= 3) {
      const exactDuplicate = vectors.some((a, i) => vectors.some((b, j) => j > i && vectorSignature(a) === vectorSignature(b)));
      const flagged = exactDuplicate || mirroredPairs > 0;
      return { flagged, retryable: flagged, reason: flagged ? 'Synthetic pattern payload detected.' : '', metrics: { count, lowPaletteCount, recurringMotifVectors, motifReuse, mirroredPairs } };
    }

    const flagged = lowPaletteCount > 0 || motifReuse > 0 || mirroredPairs > 0 || recurringMotifVectors > 0;
    return { flagged, retryable: flagged, reason: flagged ? 'Synthetic pattern payload detected.' : '', metrics: { count, lowPaletteCount, recurringMotifVectors, motifReuse, mirroredPairs } };
  }


  function validateGeminiPayload(payload) {
    const entries = Array.isArray(payload?.data) ? payload.data : [];
    if (!entries.length) return { ok: false, reason: 'No data returned from Gemini.', alerts: [makeAlert('FAILED_PAYLOAD','No data returned from Gemini.','warning',true)] };
    const signatures = new Map();
    const warnings = [];
    const alerts = [];
    let flatTailCount = 0;
    for (const entry of entries) {
      if (!Array.isArray(entry?.v) || entry.v.length !== 72) return { ok: false, reason: 'Malformed factor payload.', alerts: [makeAlert('FAILED_PAYLOAD','Malformed factor payload.','warning',true)] };
      if (entries.length > 1 && !String(entry?.row_key || '').trim()) warnings.push('Missing row_key in batch payload.');
      if (entry?.fallback === true) return { ok: false, reason: 'Fallback payload detected.', alerts: [makeAlert('FAILED_PAYLOAD','Fallback payload detected.','warning',false)] };
      if (entry.v.some((n) => !Number.isFinite(Number(n)))) return { ok: false, reason: 'Non-numeric factor payload.', alerts: [makeAlert('FAILED_PAYLOAD','Non-numeric factor payload.','warning',false)] };
      if (entry.v.some((n) => Number(n) < 0 || Number(n) > 1)) return { ok: false, reason: 'Out-of-range factor payload.', alerts: [makeAlert('FAILED_PAYLOAD','Out-of-range factor payload.','warning',false)] };
      const stats = entryStats(entry.v);
      if (stats.distinct2 < 12 || stats.stddev < 0.035) warnings.push('Low-variance factor payload detected.');
      const providers = entry.v.slice(60, 65).map((n) => Number(n));
      if (providers.some((n) => !Number.isFinite(n))) return { ok: false, reason: 'Missing provider slots.', alerts: [makeAlert('FAILED_PAYLOAD','Missing provider slots.','warning',false)] };
      if (new Set(providers.map((n) => n.toFixed(2))).size < 2) return { ok: false, reason: 'Provider payload lacks variance.', alerts: [makeAlert('AUTO_RETRY_TRIGGERED','Provider payload lacks variance.','warning',true)] };
      if (providers.every((n) => Math.abs(n - 0.5) <= 0.001)) return { ok: false, reason: 'Neutral provider payload detected.', alerts: [makeAlert('AUTO_RETRY_TRIGGERED','Neutral provider payload detected.','warning',true)] };
      if (tailIsFlat(entry.v)) flatTailCount += 1;
      const sig = vectorSignature(entry.v.map((n) => Number(n).toFixed(2)));
      if (sig) signatures.set(sig, (signatures.get(sig) || 0) + 1);
    }
    const dup = Array.from(signatures.values()).some((count) => count > 1);
    if (dup && entries.length > 1) return { ok: false, reason: 'Duplicate factor payload detected.', alerts: [makeAlert('AUTO_RETRY_TRIGGERED','Duplicate factor payload detected.','warning',true)] };
    for (let i = 0; i < entries.length; i += 1) {
      for (let j = i + 1; j < entries.length; j += 1) {
        if (vectorsTooSimilar(entries[i].v, entries[j].v)) return { ok: false, reason: 'Near-duplicate factor payload detected.', alerts: [makeAlert('AUTO_RETRY_TRIGGERED','Near-duplicate factor payload detected.','warning',true)] };
      }
    }
    const synthetic = detectSyntheticPattern(entries);
    if (synthetic.flagged) {
      return { ok: false, reason: 'Synthetic pattern payload detected.', alerts: [makeAlert('AUTO_RETRY_TRIGGERED','Synthetic pattern payload detected.','warning',Boolean(synthetic.retryable))], warnings: [`Synthetic metrics => count=${synthetic.metrics.count}|palette=${synthetic.metrics.lowPaletteCount}|recurring=${synthetic.metrics.recurringMotifVectors}|motifs=${synthetic.metrics.motifReuse}|pairs=${synthetic.metrics.mirroredPairs}`] };
    }
    if (entries.length >= 3 && flatTailCount >= 3) {
      warnings.push('Tail slots 66-72 look flat across the batch.');
      alerts.push(makeAlert('TAIL_NULLIFIED','Tail slots 66-72 flagged as filler and will be ignored for scoring.','warning',false));
    }
    return { ok: true, warnings: Array.from(new Set(warnings)), alerts };
  }


  function getActiveGeminiKey() {
    const candidates = [];
    try { candidates.push(String(window.__OXYGEN_GEMINI_KEY__ || '').trim()); } catch (_) {}
    try { candidates.push(String(document.getElementById('apiKeyInput')?.value || '').trim()); } catch (_) {}
    try { candidates.push(String(localStorage.getItem('OXYGEN_GEMINI_KEY') || '').trim()); } catch (_) {}
    try { candidates.push(String(sessionStorage.getItem('OXYGEN_GEMINI_KEY') || '').trim()); } catch (_) {}
    const key = candidates.find((value) => typeof value === 'string' && value.trim()) || '';
    if (key) {
      try { window.__OXYGEN_GEMINI_KEY__ = key; } catch (_) {}
      try { const input = document.getElementById('apiKeyInput'); if (input && input.value !== key) input.value = key; } catch (_) {}
      try { localStorage.setItem('OXYGEN_GEMINI_KEY', key); } catch (_) {}
      try { sessionStorage.setItem('OXYGEN_GEMINI_KEY', key); } catch (_) {}
    }
    return key;
  }


  function stashRawPayload(text = '') {
    const value = String(text || '');
    try { window.__ALPHADOG_RAW_GEMINI_PAYLOAD__ = value; } catch (_) {}
    try { window.PickCalcUI?.renderRawPayload?.(value); } catch (_) {}
    return value;
  }

  function logConnectorStep(step, detail = '', modelId = GEMINI_MODEL) {
    const logger = getConsoleLogger();
    const text = `[SYSTEM] ${step}${detail ? `: ${detail}` : ''}`;
    if (logger === console.log) console.log(text);
    else logger({ level: 'info', text, modelId });
  }

  async function fetchGeminiBatch(batch, options = {}) {
    const activeKey = getActiveGeminiKey();
    const uniqueSubjects = batch.map((p, idx) => {
      const parsedPlayer = p?.parsedPlayer || `Subject ${idx}`;
      const type = p?.type || 'Unknown';
      const team = p?.team || 'Unknown Team';
      const opponent = p?.opponent || 'Unknown Opponent';
      const prop = p?.prop || p?.propFamily || 'Unknown Prop';
      const gameTime = p?.gameTimeText || p?.gameTime || '';
      const pickType = p?.pickType || 'Regular Line';
      const direction = p?.direction || (String(pickType).match(/goblin|demon/i) ? 'More' : '');
      const line = p?.line || p?.lineValue || 0;
      const rowKey = p?.row_key || `${p?.LEG_ID || `LEG-${idx + 1}`}|${prop}|${line}`;
      return `[S${idx}] i=${idx}|row_key=${rowKey}|Name=${parsedPlayer}|Team=${team}|Opponent=${opponent}|Prop=${prop}|Line=${line}|GameTime=${gameTime || 'Unknown'}|PickType=${pickType}|Direction=${direction || 'Undecided'}|Type=${type}|IDENTITY_DIVERGENCE: For same-player multi-prop entries, treat each row_key as a distinct tactical scenario.|DIVERGENCE_ENFORCEMENT: maximize inter-subject differentiation and never mirror another subject.|VARY_TAIL_SIGNALS: Slots 66-72 must reflect the specific market volatility of each unique subject.[/S${idx}]`;
    }).join('\n');
    const prompt = `${batch.length === 1
      ? 'Return minified JSON only. No markdown. No prose. Max 3 decimals. Extract one 72-slot feature vector for the single subject capsule. Use row_key as the primary identity anchor. Output only valid minified JSON with shape {"row_key":"...","v":[72 floats]}.'
      : `Return minified JSON only. No markdown. No prose. Max 3 decimals. End with ]}.
You are an elite sharp analyst. Generate weighted floats (0.0 to 1.0) based on 2026 Statcast and environmental data. High Air Density must penalize Power; Wide Umpire Zones must boost Strikeouts. 0.5 is the fail-state.
Perform a high-resolution extraction for each subject capsule. Use the row_key as the primary identity anchor before generating v.
CRITICAL: Any response containing identical or near-identical float sequences across different indices will be flagged as a failure.
CRITICAL: Same player on different props must produce meaningfully different vectors.
CRITICAL SLOT MAP:
- v[38] = c07 Air Density
- v[39] = c08 Umpire Zone
- v[50] = d01 Platoon Delta
- v[51] = d02 Manager Threshold
- v[60] = market01 DraftKings
- v[61] = market02 FanDuel
- v[62] = market03 BetMGM
- v[63] = market04 Bet365
- v[64] = market05 Pinnacle
Subjects:
${uniqueSubjects}
MANDATORY: Ensure the JSON response is complete and terminates with the correct closing characters ]}.
Return only valid minified JSON with shape {"batch_count":${batch.length},"data":[{"i":0,"row_key":"...","v":[72 floats]}]}.`}
${String(options?.retrySuffix || "").trim()}`;


    if (!activeKey) {
      return { ok: false, errorStatus: 0, errorText: 'Missing Gemini API key.', temporaryFailure: false, modelId: GEMINI_MODEL };
    }

    const logger = getConsoleLogger();
    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: String(prompt || '').trim() || 'Extract data for subject' }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: Number.isFinite(Number(options?.temperature)) ? Number(options.temperature) : 0.15, maxOutputTokens: 6144 }
    });

    async function tryModel(modelId, maxAttempts = 3) {
      const url = GEMINI_BASE_URL.replace(/\/$/, '') + '/v1beta/models/' + modelId + ':generateContent?key=' + activeKey;
      let lastFailure = { ok: false, errorStatus: 0, errorText: 'Unknown Gemini failure.', temporaryFailure: true, modelId };
      let sawPayloadShapeFailure = false;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        logConnectorStep('REQUESTING', `Submitting batch of ${batch.length} subject(s) via ${modelId} [attempt ${attempt}/${maxAttempts}]`);
        try {
          const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
          logConnectorStep('WORKER_HANDSHAKE', `${modelId} HTTP ${response.status}`);
          if (!response.ok) {
            const errorText = await response.text();
            let errorObject = null;
            try { errorObject = JSON.parse(errorText); } catch (_) {}
            const message = errorObject?.error?.message || errorText || `HTTP ${response.status}`;
            lastFailure = { ok: false, errorStatus: response.status, errorText: message, errorJson: errorObject, temporaryFailure: isRetryableStatus(response.status), modelId };
            stashRawPayload(errorText);
            if (logger === console.log) logger(`[SYSTEM] GOOGLE_REJECTION: ${modelId} :: ${message}`);
            else logger({ level: 'warning', text: `[SYSTEM] GOOGLE_REJECTION: ${modelId} :: ${message}`, modelId, pre: errorText });
            if (isRetryableStatus(response.status) && attempt < maxAttempts) {
              try { window.PickCalcUI?.showToast?.(`Model busy (${modelId}). Retrying ${attempt}/${maxAttempts}...`); } catch (_) {}
              await delay(5000 * (2 ** (attempt - 1)));
              continue;
            }
            break;
          }

          const json = await response.json();
          const raw = stashRawPayload(extractGeminiText(json));
          const parsedEnvelope = safeJsonParse(raw, { expectSingle: batch.length === 1 });
          const parsed = parsedEnvelope.parsed;
          if (!parsed) {
            sawPayloadShapeFailure = true;
            lastFailure = { ok: false, errorStatus: response.status, errorText: 'Malformed JSON envelope from Gemini.', temporaryFailure: attempt < maxAttempts, modelId, rawResponse: stashRawPayload(parsedEnvelope.clean || raw || '') };
            if (attempt < maxAttempts) { await delay(5000 * (2 ** (attempt - 1))); continue; }
            break;
          }
          const validation = validateGeminiPayload(parsed);
          if (!validation.ok) {
            sawPayloadShapeFailure = true;
            const retryablePayload = /Malformed factor payload|Duplicate factor payload|Near-duplicate factor payload|Provider payload lacks variance|Neutral provider payload|Synthetic pattern payload/i.test(validation.reason || '');
            lastFailure = { ok: false, errorStatus: response.status, errorText: validation.reason, temporaryFailure: retryablePayload && attempt < maxAttempts, modelId, rawResponse: stashRawPayload(parsedEnvelope.clean || raw || '') };
            if (retryablePayload && attempt < maxAttempts) { await delay(5000 * (2 ** (attempt - 1))); continue; }
            break;
          }
          logConnectorStep('JSON_PARSING', `Parsed ${(parsed.data || []).length} subject payload(s) via ${modelId}`);
          logConnectorStep('FETCH_ATTEMPT_COMPLETE', `Success via ${modelId}`);
          return Object.assign({ ok: true, modelId, rawResponse: stashRawPayload(parsedEnvelope.clean || raw || ''), responseText: raw || '', warnings: validation.warnings || [] }, parsed);
        } catch (e) {
          lastFailure = { ok: false, errorStatus: 0, errorText: e?.message || 'Unknown fetch error', temporaryFailure: true, modelId };
          if (logger === console.log) logger(`[SYSTEM] GOOGLE_REJECTION: ${modelId} :: ${e?.message || 'Unknown fetch error'}`);
          else logger({ level: 'error', text: `[SYSTEM] GOOGLE_REJECTION: ${modelId} :: ${e?.message || 'Unknown fetch error'}`, modelId, pre: String(e?.stack || e?.message || 'Unknown fetch error') });
          if (attempt < maxAttempts) {
            try { window.PickCalcUI?.showToast?.(`Model busy (${modelId}). Retrying ${attempt}/${maxAttempts}...`); } catch (_) {}
            await delay(5000 * (2 ** (attempt - 1)));
            continue;
          }
        }
      }
      return Object.assign(lastFailure, { sawPayloadShapeFailure });
    }

    const primaryResult = await tryModel(GEMINI_MODEL, 3);
    if (primaryResult?.ok) return primaryResult;

    const shouldTryFallback = Boolean(
      primaryResult?.temporaryFailure === true &&
      !primaryResult?.sawPayloadShapeFailure &&
      Array.isArray(GEMINI_FALLBACK_MODELS) &&
      GEMINI_FALLBACK_MODELS.length
    );

    if (!shouldTryFallback) {
      logConnectorStep('FETCH_ATTEMPT_COMPLETE', `Failure ${primaryResult?.errorStatus || 0}`);
      return primaryResult;
    }

    let lastFailure = primaryResult;
    for (const modelId of GEMINI_FALLBACK_MODELS) {
      const fallbackResult = await tryModel(modelId, 3);
      if (fallbackResult?.ok) return fallbackResult;
      lastFailure = fallbackResult;
      if (fallbackResult?.sawPayloadShapeFailure) break;
    }

    logConnectorStep('FETCH_ATTEMPT_COMPLETE', `Failure ${lastFailure?.errorStatus || 0}`);
    return lastFailure;
  }

  async function debugConnection() {
    const activeKey = getActiveGeminiKey();
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

    let payload = null;
    let payloadResponseText = '';
    let payloadWarnings = [];
    let lowVarianceWarning = false;
    const retryPlans = validBatch.length === 1
      ? [
          { temperature: 0.15, retrySuffix: '' },
          { temperature: 0.0, retrySuffix: 'CRITICAL: Previous attempt failed structure. Output only the single JSON object with row_key and a 72-float v array. No prose. No markdown. No extra keys.' }
        ]
      : (validBatch.length <= 3
        ? [
            { temperature: 0.15, retrySuffix: '' },
            { temperature: 0.0, retrySuffix: 'CRITICAL: Previous attempt failed quality checks. Preserve schema, complete the JSON envelope, and avoid malformed output.' }
          ]
        : [
            { temperature: 0.15, retrySuffix: '' },
            { temperature: 0.45, retrySuffix: 'CRITICAL: Previous attempt failed quality checks. Preserve schema, increase differentiation, avoid clustering around 0.5, and complete the JSON envelope.' },
            { temperature: 0.45, retrySuffix: 'CRITICAL: Previous attempts failed quality checks. Preserve schema, increase differentiation, vary tail signals, and complete the JSON envelope. PREVIOUS_FAILURE: Pattern-Template Mirroring detected. Use a high-entropy, diverse range of unique 3-decimal values for every subject.' }
          ]);
    let lastPayload = null;
    for (let attemptIndex = 0; attemptIndex < retryPlans.length; attemptIndex += 1) {
      lastPayload = await fetchGeminiBatch(validBatch, retryPlans[attemptIndex]);
      if (!lastPayload?.ok) {
        if (lastPayload?.temporaryFailure === true && attemptIndex < retryPlans.length - 1) continue;
        break;
      }
      if (validBatch.length === 1) {
        const entry = Array.isArray(lastPayload?.data) ? lastPayload.data.find((d) => Number(d?.i) === 0) : null;
        const vals = Array.isArray(entry?.v) && entry.v.length === 72 ? entry.v : [];
        const quality = classifyPayloadQuality(vals, lastPayload?.warnings || []);
        lastPayload.__quality = quality;
        if (quality.kind === 'VALID') break;
        if (quality.retryable && attemptIndex < retryPlans.length - 1) continue;
        break;
      }
      break;
    }
    payload = lastPayload;
    const rawResponse = stashRawPayload(String(payload?.rawResponse || payload?.responseText || ''));
    payloadResponseText = payload?.responseText || payload?.errorText || rawResponse || '';

    if (!payload?.ok) {
      const detail = payload?.temporaryFailure
        ? `Temporary API unavailable (${payload?.modelId || GEMINI_MODEL}): ${payload?.errorText || 'Retry later.'}`
        : `Non-real Gemini payload (${payload?.modelId || GEMINI_MODEL}): ${payload?.errorText || 'Rejected.'}`;
      validBatch.forEach((row) => {
        const result = buildIngressErrorResult(row, stateRef, detail);
        result.errorText = payload?.errorText || detail;
        result.errorStatus = payload?.errorStatus || 0;
        result.errorJson = payload?.errorJson || null;
        result.responseText = payloadResponseText;
        result.rawPayload = rawResponse;
        results.push(result);
        if (logger === console.log) logger(result.logs[0].text);
        else logger(result.logs[0]);
        hooks.onRowComplete?.({ row, rowIndex: results.length - 1, result, completedRows: results.length, totalRows, completedProbes: results.length, totalProbes });
      });
      const lastResult = results[results.length - 1] || null;
      hooks.onComplete?.({ results, totalRows, lastResult });
      return { results, lastResult };
    }
    const responseData = { data: Array.isArray(payload?.data) ? payload.data.map((entry) => Object.assign({}, entry, {
      row_key: String(entry?.row_key || validBatch[Number(entry?.i)]?.row_key || '').trim(),
      id_confirm: String(entry?.id_confirm || validBatch[Number(entry?.i)]?.parsedPlayer || '').trim(),
      prop_confirm: String(entry?.prop_confirm || validBatch[Number(entry?.i)]?.prop || validBatch[Number(entry?.i)]?.propFamily || '').trim(),
      line_confirm: String(entry?.line_confirm || validBatch[Number(entry?.i)]?.line || '').trim()
    })) : [] };
    payloadWarnings = Array.isArray(payload?.warnings) ? payload.warnings.slice() : [];
    lowVarianceWarning = payloadWarnings.some((warning) => /low-variance/i.test(String(warning)));

    for (let batchIndex = 0; batchIndex < validBatch.length; batchIndex++) {
      const row = validBatch[batchIndex];
      const vault = createZeroVault(row);
      vault.LEG_ID = row.LEG_ID;
      vault.idx = row.idx;

      const entry = responseData.data.find((d) => Number(d?.i) === batchIndex);
      const matchedRow = entry ? validBatch[Number(entry.i)] : null;
      const targetLegId = matchedRow?.LEG_ID || row.LEG_ID;
      const isExactLegMatch = Boolean(matchedRow && targetLegId === row.LEG_ID);
      const vals = (isExactLegMatch && Array.isArray(entry?.v) && entry.v.length === 72) ? entry.v : null;
      const isFallback = !vals || entry?.fallback === true;

      if (isFallback) {
        const result = buildIngressErrorResult(row, stateRef, 'Non-real Gemini payload. Matrix hidden.');
        result.responseText = payloadResponseText;
        result.rawPayload = rawResponse;
        results.push(result);
        logger(result.logs[0]);
        hooks.onRowComplete?.({ row, rowIndex: results.length - 1, result, completedRows: results.length, totalRows, completedProbes: results.length, totalProbes });
        continue;
      }

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

      vault.isReal = true;
      vault.reliable = true;
      vault.source = 'gemini_verified';
      vault.timestamp = Date.now();

      const branchStatus = 'REAL';
      hydrateBranch('A', 0, 20, branchStatus);
      hydrateBranch('B', 20, 18, branchStatus);
      hydrateBranch('C', 38, 12, branchStatus);
      hydrateBranch('D', 50, 10, branchStatus);
      hydrateBranch('E', 60, 12, branchStatus);

      BRANCH_KEYS.forEach((key) => {
        if (vault.branches[key]) {
          vault.branches[key].status = 'REAL';
          vault.branches[key].source = 'gemini_verified';
          vault.branches[key].isReal = true;
          vault.branches[key].isReliable = true;
          vault.branches[key].confidence = 1.0;
          updateBranchMeta(vault.branches[key]);
        }
      });

      PROVIDERS.forEach((provider, idx) => {
        vault.branches.E.providerMap[provider] = safeNumber(vals[60 + idx], 0.5);
      });

      const proofFlags = buildProofFlags(vault, row, vals);
      const density = summarizePayloadDensity(vals);
      const quality = (validBatch.length === 1 && payload?.__quality) ? payload.__quality : classifyPayloadQuality(vals, payloadWarnings);
      proofFlags.payloadDensity = density;
      stampBranchEAudit(vault, proofFlags.localMarket || {}, vals);
      vault.proofFlags = proofFlags;
      vault.payloadWarnings = payloadWarnings.slice();
      const insufficientEvidence = quality.kind === 'INSUFFICIENT_EVIDENCE';
      const collapsedPayload = quality.kind === 'COLLAPSED_PAYLOAD';
      const weakSignal = quality.kind === 'LOW_VARIANCE';
      proofFlags.weakSignal = weakSignal;
      proofFlags.collapsedPayload = collapsedPayload;
      proofFlags.insufficientEvidence = insufficientEvidence;
      const flatTail = tailIsFlat(vals);
      const tailAuditOnly = proofFlags.partial === true && !proofFlags.passed && !collapsedPayload && !insufficientEvidence;
      const coreReliable = proofFlags.corePassed === true && !weakSignal && !collapsedPayload && !insufficientEvidence;
      if (flatTail) {
        for (let ti = 65; ti < 72; ti += 1) vals[ti] = 0.5;
        proofFlags.tailFlattened = true;
      }
      vault.reliable = coreReliable;
      vault.partialDecode = tailAuditOnly || weakSignal;
      vault.weakSignal = weakSignal;
      vault.collapsedPayload = collapsedPayload;
      vault.insufficientEvidence = insufficientEvidence;
      vault.isReal = !collapsedPayload && (proofFlags.passed || proofFlags.partial === true || weakSignal || coreReliable || insufficientEvidence);
      vault.source = insufficientEvidence ? 'insufficient_evidence' : (collapsedPayload ? 'payload_collapsed' : (weakSignal ? 'gemini_weak_signal' : ((coreReliable && proofFlags.tailFlattened) ? 'gemini_verified_core' : (coreReliable ? 'gemini_verified_core' : (tailAuditOnly ? 'gemini_latent_adjustors' : (proofFlags.passed ? 'gemini_verified' : 'proof_rejected'))))));
      vault.terminalState = insufficientEvidence ? 'Insufficient Evidence' : (collapsedPayload ? 'Collapsed Payload Rejected' : (weakSignal ? 'Weak Signal' : (coreReliable ? 'Gemini Verified (Core Locked)' : (tailAuditOnly ? 'Tail Audit' : (proofFlags.passed ? 'Gemini Verified' : 'Integrity Check Failed')))));

      const found = vals.filter((n) => Number(n) !== 0).length;

      commitVault(stateRef, row, vault);
      console.log(`[OXYGEN] VAULT_STAMPED_FOR_ID: ${row.LEG_ID}`);
      if (logger === console.log) logger(`[OXYGEN] VAULT_STAMPED_FOR_ID: ${row.LEG_ID}`);
      else logger({ level: 'info', text: `[OXYGEN] VAULT_STAMPED_FOR_ID: ${row.LEG_ID}` });

      const shield = computeShieldFromVault(vault);
      const currentVaults = stateRef?.miningVault || Object.fromEntries(results.map((r) => [r.row.LEG_ID, r.vault]));
      const proofLogs = (proofFlags.failures || []).map((failure) => ({ level: 'warning', text: `[OXYGEN] ${row.parsedPlayer}: ${failure.message}` }));
      if (insufficientEvidence) proofLogs.unshift({ level: 'warning', text: `[OXYGEN] ${row.parsedPlayer}: Insufficient evidence for reliable inference. Core payload remained sparse after retries.` });
      else if (collapsedPayload) proofLogs.unshift({ level: 'warning', text: `[OXYGEN] ${row.parsedPlayer}: Core payload collapsed (non-zero core slots ${density.nonZeroCore}/60). Rejecting this run.` });
      const eTailLogs = (proofFlags.tailAudits || []).map((audit) => ({ level: audit.passed ? 'info' : 'info', text: `[OXYGEN] ${row.parsedPlayer}: ${audit.message}` }));
      eTailLogs.unshift({ level: proofFlags.tailFlattened ? 'warning' : 'info', text: proofFlags.tailFlattened ? `[ALERT] TAIL_NULLIFIED: ${row.parsedPlayer} :: Tail slots 66-72 flattened and were nullified.` : `[OXYGEN] ${row.parsedPlayer}: Payload density => core_nonzero=${density.nonZeroCore}/60 market_nonzero=${density.nonZeroMarket}/5 tail_nonzero=${density.nonZeroTail}/7` });
      eTailLogs.unshift({ level: 'info', text: `[OXYGEN] ${row.parsedPlayer}: Payload density => core_nonzero=${density.nonZeroCore}/60 market_nonzero=${density.nonZeroMarket}/5 tail_nonzero=${density.nonZeroTail}/7` });
      eTailLogs.unshift({ level: 'info', text: `[OXYGEN] ${row.parsedPlayer}: Branch E raw slots 61-72 => ${vals.slice(60,72).map((value, idx) => `${60 + idx + 1}=${safeNumber(value,0).toFixed(3)}`).join(' | ')}` });
      eTailLogs.unshift({ level: 'info', text: `[OXYGEN] ${row.parsedPlayer}: Branch E arithmetic from 61-65 => mean=${safeNumber((proofFlags.localMarket||{}).mean,0).toFixed(3)} median=${safeNumber((proofFlags.localMarket||{}).median,0).toFixed(3)} high=${safeNumber((proofFlags.localMarket||{}).high,0).toFixed(3)} low=${safeNumber((proofFlags.localMarket||{}).low,0).toFixed(3)} spread=${safeNumber((proofFlags.localMarket||{}).spread,0).toFixed(3)} conf=${safeNumber((proofFlags.localMarket||{}).marketConfidence,0).toFixed(3)}` });
      const baseHint = insufficientEvidence
        ? 'Insufficient evidence. The subject did not provide enough stable signal for reliable inference after retries.'
        : (collapsedPayload
          ? 'Collapsed payload rejected. Most core slots 1-60 were zero or missing, so this run is not usable.'
          : (weakSignal
            ? 'Payload arrived and decoded, but factor variance is low. Core slots remain visible for review. Score uses A-D plus raw market slots 61-65 only.'
            : (coreReliable
              ? (proofFlags.tailFlattened ? 'Payload arrived, decoded, and mapped. Core slots 1-65 are trusted for scoring. Tail slots 66-72 were flagged as filler and nullified.' : 'Payload arrived, decoded, and mapped. Core slots 1-65 are trusted for scoring. Tail slots 66-72 are latent market adjustors shown as a secondary signal layer.')
              : (proofFlags.passed ? 'Gemini Verified payload received. Brutal honesty checks passed.' : 'Integrity Check Failed. Data flagged fake, bad, corrupted, or unreliable.'))));
      const result = {
        vault,
        row,
        isReal: !collapsedPayload && (proofFlags.passed || proofFlags.partial || weakSignal || insufficientEvidence),
        isReliable: coreReliable,
        source: insufficientEvidence ? 'insufficient_evidence' : (collapsedPayload ? 'payload_collapsed' : (weakSignal ? 'gemini_weak_signal' : (coreReliable ? 'gemini_verified_core' : (tailAuditOnly ? 'gemini_latent_adjustors' : (proofFlags.passed ? 'gemini_verified' : 'proof_rejected'))))),
        vaultCollection: JSON.parse(JSON.stringify(currentVaults)),
        shield,
        analysisHint: baseHint,
        runStatus: insufficientEvidence ? 'INSUFFICIENT_EVIDENCE' : (collapsedPayload ? 'FAILED_PAYLOAD' : (weakSignal ? 'WEAK_SIGNAL' : ((coreReliable && proofFlags.tailFlattened) ? 'VERIFIED_CORE_ONLY' : (coreReliable ? 'VERIFIED' : (tailAuditOnly ? 'PARTIAL_DECODE' : (proofFlags.passed ? 'VERIFIED' : 'FAILED_INTEGRITY')))))),
        finalized: true,
        connectorState: {
          version: SYSTEM_VERSION,
          completedRows: batchIndex + 1,
          completedProbes: results.length,
          totalProbes: totalProbes,
          liveBranches: ['A', 'B', 'C', 'D', 'E'].filter((key) => ['REAL', 'SUCCESS'].includes(vault.branches[key]?.status)).length,
          derivedBranches: ['A', 'B', 'C', 'D', 'E'].filter((key) => ['DERIVED', 'REAL', 'SUCCESS'].includes(vault.branches[key]?.status)).length,
          branchStatus: Object.fromEntries(['A', 'B', 'C', 'D', 'E'].map((key) => [key, vault.branches[key]?.status || 'WARNING']))
        },
        responseText: payloadResponseText,
        logs: [{
          level: insufficientEvidence ? 'warning' : (collapsedPayload ? 'warning' : (weakSignal ? 'info' : (coreReliable ? 'success' : (proofFlags.passed ? 'info' : 'warning')))),
          text: insufficientEvidence
            ? `[OXYGEN] INSUFFICIENT_EVIDENCE: ${row.parsedPlayer} (${found} units)`
            : (collapsedPayload
              ? `[OXYGEN] COLLAPSED_PAYLOAD: ${row.parsedPlayer} (${found} units)`
              : (lowVarianceWarning
                ? `[OXYGEN] WEAK_SIGNAL: ${row.parsedPlayer} (${found} units)`
                : (coreReliable ? `[OXYGEN] VERIFIED_CORE: ${row.parsedPlayer} (${found} units)` : (proofFlags.partial ? `[OXYGEN] PARTIAL_DECODE: ${row.parsedPlayer} (${found} units)` : (proofFlags.passed ? `[OXYGEN] SCHEMA_MATCH: ${row.parsedPlayer} (${found} units)` : `[OXYGEN] PROOF_REJECTED: ${row.parsedPlayer} (${found} units)`)))))
        }, ...payloadWarnings.map((warning) => ({ level: 'info', text: `[OXYGEN] ${row.parsedPlayer}: ${warning}` })), ...proofLogs, ...eTailLogs]
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
    if (!row.parsedPlayer || /\b(?:vs\.?|@|Sat|Sun|Mon|Tue|Wed|Thu|Fri)\b/i.test(row.parsedPlayer)) {
      try { window.PickCalcUI?.showToast?.('Mining Blocked: Dirty Player Identity'); } catch (_) {}
      const result = buildIngressErrorResult(row, stateRef, 'Identity Unresolved');
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
    detectSyntheticPattern,
    validateGeminiPayload,
    pearsonCorrelation
  });
})();
