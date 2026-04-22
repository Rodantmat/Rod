window.PickCalcConnectors = window.PickCalcConnectors || {};
(() => {
  const SYSTEM_VERSION = 'AlphaDog v0.0.15 "Quantum Vortex"';
  const PRIMARY_MODEL = 'gemini-2.5-pro';
  const FALLBACK_MODEL = 'gemini-3.1-flash-lite-preview';
  const GEMINI_BASE_URL = 'https://geminiconnector.rodolfoaamattos.workers.dev';
  const GROUNDED_2026_PLAYERS = {
    'chase burns': { teamAbbr: 'CIN', teamFullName: 'Cincinnati Reds', identity: 100 },
    'nolan mclean': { teamAbbr: 'NYM', teamFullName: 'New York Mets', identity: 100 },
    'munetaka murakami': { teamAbbr: 'CWS', teamFullName: 'Chicago White Sox', identity: 100 }
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function getActiveGeminiKey() {
    try {
      return String(
        window.__OXYGEN_GEMINI_KEY__ ||
        localStorage.getItem('OXYGEN_GEMINI_KEY') ||
        sessionStorage.getItem('OXYGEN_GEMINI_KEY') ||
        document.getElementById('apiKeyInput')?.value ||
        ''
      ).trim();
    } catch (_) {
      return '';
    }
  }

  function stashRawPayload(value = '') {
    const text = String(value || '');
    try { window.__ALPHADOG_RAW_GEMINI_PAYLOAD__ = text; } catch (_) {}
    try { window.PickCalcUI?.renderRawPayload?.(text); } catch (_) {}
    return text;
  }

  function makeCategory(score = null, name = '') {
    const normalized = Number.isFinite(Number(score)) ? Math.max(0, Math.min(100, Number(score))) : null;
    return { name, value: normalized, status: normalized === null ? 'PENDING' : 'SUCCESS' };
  }

  function normalizeName(value = '') {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function createZeroFilledVault(row = {}) {
    return {
      LEG_ID: row?.LEG_ID || '',
      idx: row?.idx || 0,
      player: row?.parsedPlayer || row?.player || '',
      sourcePlayer: row?.parsedPlayer || row?.player || '',
      rowKey: row?.LEG_ID || row?.row_key || '',
      isReal: false,
      reliable: false,
      terminalState: 'Waiting',
      source: 'empty',
      scores: { identity: null, trend: null, stress: null, risk: null },
      categoryScores: { identity: null, trend: null, stress: null, risk: null },
      finalScore: null,
      final_score: null,
      summary: '',
      auditMeta: {},
      categories: {
        identity: makeCategory(null, 'Identity'),
        trend: makeCategory(null, 'Trend'),
        stress: makeCategory(null, 'Stress'),
        risk: makeCategory(null, 'Risk')
      }
    };
  }

  function buildPrompt(batch = [], mode = 'initial') {
    const subjects = batch.map((row, index) => {
      const rowKey = row.LEG_ID || `LEG-${index + 1}`;
      return [
        `ROW_KEY: ${rowKey}`,
        `SPORT: ${row.sport || ''}`,
        `PLAYER: ${row.parsedPlayer || row.player || ''}`,
        `TEAM: ${row.team || ''}`,
        `OPPONENT: ${row.opponent || ''}`,
        `METRIC: ${row.prop || ''}`,
        `LINE: ${row.line || ''}`,
        `DIRECTION: ${row.direction || ''}`,
        `TYPE: ${row.type || 'Regular'}`,
        `GAME_TIME: ${row.gameTimeText || row.gameTime || ''}`
      ].join('\n');
    }).join('\n\n');

    const modeLine = mode === 'corrected'
      ? 'Repeat identical scoring for the same inputs. Do not change any prior score unless the input changed.'
      : 'Compute the first deterministic pass with no variance.';

    return [
      'Return JSON only. No markdown. No prose outside the JSON.',
      '<System_Instruction>',
      'Role: Iron Bite Auditor (QUANTUM VORTEX v0.0.15).',
      'Context: April 21, 2026.',
      'Constraint: All feed players are 100% active 2026 MLB starters.',
      '',
      'SCORING RULES:',
      '1. ROSTER SHIELD: Identity MUST be 100 for all provided names.',
      '2. DETERMINISM: Calculate % Hit Prob first. Final Score = (Prob * 1.25).',
      '3. DATA BINDING: You MUST include the exact "player" name in the JSON for mapping.',
      '4. Include "row_key" whenever a ROW_KEY is supplied in the subject block.',
      '5. Output integer scores only. If you derive a penalty, convert it to a positive final score before returning JSON.',
      '',
      'RECURSIVE AUDIT:',
      'If Auditor Logic Consistency or Roster Accuracy < 95, you must discard and emit a corrected final run.',
      '</System_Instruction>',
      '',
      '<JSON_Schema>',
      '{',
      '  "version": "v0.0.15",',
      '  "codename": "Quantum Vortex",',
      '  "legs": [{',
      '    "player": "Full Name (EXACT MATCH)",',
      '    "row_key": "LEG-1",',
      '    "scores": {"identity": 100, "trend": 0, "stress": 0, "risk": 0},',
      '    "final_score": 0,',
      '    "summary": "Brutal 1-sentence 2026 critique."',
      '  }],',
      '  "batch_audit": { "logic_consistency": 0, "roster_accuracy": 0 }',
      '}',
      '</JSON_Schema>',
      '',
      modeLine,
      '',
      'Subjects:',
      subjects
    ].join('\\n');
  }

  function parseGeminiText(json = {}) {
    const parts = json?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) return '';
    return parts.map((part) => part?.text || '').join('').trim();
  }

  function safeParsePayload(text = '') {
    const trimmed = String(text || '').trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch (_) {
      const match = trimmed.match(/\{[\s\S]*\}/);
      if (!match) return null;
      try { return JSON.parse(match[0]); } catch (_) { return null; }
    }
  }

  function isRetryableFailure(status = 0, message = '') {
    const code = Number(status) || 0;
    const text = String(message || '').toLowerCase();
    return code === 429 || code === 500 || code === 503 || code === 504 || /busy|quota|prepayment|rate limit|overloaded|temporar/.test(text);
  }

  async function callModel(modelId, prompt, apiKey) {
    const url = `${GEMINI_BASE_URL.replace(/\/$/, '')}/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    const body = JSON.stringify({
      systemInstruction: {
        parts: [{
          text: 'Role: Iron Bite Auditor (QUANTUM VORTEX v0.0.15). Context: April 21, 2026. All feed players are treated as active 2026 MLB starters. Identity must be 100. Return JSON only. Include the exact player name and supplied row_key for each leg. Use scores.identity, scores.trend, scores.stress, scores.risk, plus final_score and summary. Final score must be a positive integer. If your internal logic creates a penalty, convert it before returning JSON.'
        }]
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        maxOutputTokens: 6144
      }
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body
    });

    const rawText = await response.text();
    stashRawPayload(rawText);

    let json = null;
    try { json = JSON.parse(rawText); } catch (_) {}
    const extracted = json ? parseGeminiText(json) : rawText;
    stashRawPayload(extracted || rawText);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        modelId,
        errorText: extracted || rawText || `HTTP ${response.status}`
      };
    }

    const parsed = safeParsePayload(extracted || rawText);
    try { window.__ALPHADOG_LAST_API_RESPONSE__ = parsed || json || null; } catch (_) {}
    if (!parsed || !Array.isArray(parsed.legs)) {
      return {
        ok: false,
        status: response.status,
        modelId,
        errorText: 'Malformed JSON payload from Gemini.'
      };
    }

    return {
      ok: true,
      status: response.status,
      modelId,
      payload: parsed,
      responseText: extracted || rawText,
      rawPayload: extracted || rawText
    };
  }

  async function fetchGeminiBatch(batch = [], mode = 'initial') {
    const apiKey = getActiveGeminiKey();
    if (!apiKey) {
      return { ok: false, status: 0, modelId: PRIMARY_MODEL, errorText: 'Missing Gemini API key.' };
    }

    const prompt = buildPrompt(batch, mode);
    const first = await callModel(PRIMARY_MODEL, prompt, apiKey);
    if (first.ok) return first;

    if (isRetryableFailure(first.status, first.errorText)) {
      await delay(4000);
      const second = await callModel(PRIMARY_MODEL, prompt, apiKey);
      if (second.ok) return second;
      const fallback = await callModel(FALLBACK_MODEL, prompt, apiKey);
      if (fallback.ok) return fallback;
      return fallback;
    }

    return first;
  }

  function clampScore(value) {
    const num = Number(value);
    return Number.isFinite(num) ? Math.max(0, Math.min(100, num)) : null;
  }

  function applyGroundedIdentity(row = {}, leg = {}) {
    const name = String(leg?.player || row?.parsedPlayer || row?.player || '').trim().toLowerCase();
    const grounded = GROUNDED_2026_PLAYERS[name];
    if (!grounded) return leg;
    return Object.assign({}, leg, {
      team: leg?.team || grounded.teamFullName || row?.team || grounded.teamAbbr,
      identity: 100,
      scores: Object.assign({}, leg?.scores || {}, { identity: 100 })
    });
  }

  const SCORE_CACHE = new Map();

  function normalizeLegScores(leg = {}) {
    const nested = leg?.scores || {};
    const identity = clampScore(leg?.identity ?? nested?.identity ?? 100);
    const trend = clampScore(leg?.trend ?? nested?.trend ?? 0);
    const stress = clampScore(leg?.stress ?? nested?.stress ?? 0);
    const risk = clampScore(leg?.risk ?? nested?.risk ?? 0);
    return { identity, trend, stress, risk };
  }

  function computeDeterministicHitProbability(row = {}, scorePack = {}) {
    const identity = clampScore(scorePack?.identity) ?? 100;
    const trend = clampScore(scorePack?.trend) ?? 0;
    const stress = clampScore(scorePack?.stress) ?? 0;
    const risk = clampScore(scorePack?.risk) ?? 0;
    const average = (identity + trend + stress + risk) / 4;
    const bounded = Math.max(0, Math.min(1, Number((average / 100).toFixed(4))));
    return bounded;
  }

  function computeDeterministicFinalScore(row = {}, scorePack = {}) {
    const identity = clampScore(scorePack?.identity) ?? 100;
    const trend = clampScore(scorePack?.trend) ?? 0;
    const stress = clampScore(scorePack?.stress) ?? 0;
    const risk = clampScore(scorePack?.risk) ?? 0;
    let finalScore = clampScore(Math.round((identity + trend + stress + risk) / 4));
    const metric = String(row?.prop || row?.metric || '').toLowerCase();
    if (metric.includes('home run')) {
      finalScore = Math.min(finalScore ?? 0, 55);
    }
    return finalScore;
  }

  function makeReasonablenessKey(row = {}, correctedLeg = {}) {
    return [
      String(correctedLeg?.player || row?.parsedPlayer || row?.player || '').trim().toLowerCase(),
      String(correctedLeg?.team || row?.team || '').trim().toLowerCase(),
      String(correctedLeg?.opponent || row?.opponent || '').trim().toLowerCase(),
      String(correctedLeg?.metric || row?.prop || '').trim().toLowerCase(),
      String(correctedLeg?.line || row?.line || '').trim().toLowerCase(),
      String(correctedLeg?.direction || row?.direction || '').trim().toLowerCase()
    ].join('|');
  }

  function stabilizeFinalScore(cacheKey, computedScore) {
    const prior = SCORE_CACHE.get(cacheKey);
    if (Number.isFinite(prior) && Number.isFinite(computedScore) && Math.abs(prior - computedScore) > 0) {
      SCORE_CACHE.set(cacheKey, prior);
      return prior;
    }
    SCORE_CACHE.set(cacheKey, computedScore);
    return computedScore;
  }

  function hydrateVaultFromLeg(row = {}, leg = {}) {
    const correctedLeg = applyGroundedIdentity(row, leg);
    const vault = createZeroFilledVault(row);
    const rawScores = correctedLeg?.scores || {};
    const vaultEntry = {
      player: String(correctedLeg.player || row?.parsedPlayer || row?.player || ''),
      sourcePlayer: String(correctedLeg.player || row?.parsedPlayer || row?.player || ''),
      rowKey: String(correctedLeg.row_key || row?.LEG_ID || row?.row_key || ''),
      scores: {
        identity: Number(rawScores.identity ?? 0),
        trend: Number(rawScores.trend ?? 0),
        stress: Number(rawScores.stress ?? 0),
        risk: Number(rawScores.risk ?? 0)
      },
      categoryScores: {
        identity: Number(rawScores.identity ?? 0),
        trend: Number(rawScores.trend ?? 0),
        stress: Number(rawScores.stress ?? 0),
        risk: Number(rawScores.risk ?? 0)
      },
      finalScore: Number(correctedLeg.final_score),
      final_score: Number(correctedLeg.final_score),
      summary: String(correctedLeg.summary || ''),
      reliable: true
    };
    const normalizedScores = normalizeLegScores({ scores: vaultEntry.scores });
    const identity = normalizedScores.identity;
    const trend = normalizedScores.trend;
    const stress = normalizedScores.stress;
    const risk = normalizedScores.risk;
    const translatedFinalScore = Number.isFinite(vaultEntry.finalScore)
      ? clampScore(vaultEntry.finalScore < 0 ? 100 + vaultEntry.finalScore : vaultEntry.finalScore)
      : null;
    const finalScore = Number.isFinite(translatedFinalScore)
      ? translatedFinalScore
      : stabilizeFinalScore(makeReasonablenessKey(row, correctedLeg), computeDeterministicFinalScore(row, normalizedScores));

    vault.isReal = true;
    vault.reliable = vaultEntry.reliable;
    vault.terminalState = 'Verified';
    vault.source = 'gemini';
    vault.player = vaultEntry.player;
    vault.sourcePlayer = vaultEntry.sourcePlayer;
    vault.rowKey = vaultEntry.rowKey;
    vault.scores = Object.assign({}, normalizedScores);
    vault.categoryScores = Object.assign({}, normalizedScores);
    vault.finalScore = finalScore;
    vault.final_score = finalScore;
    vault.summary = vaultEntry.summary.trim();
    vault.auditMeta = {
      sport: String(correctedLeg?.sport || '').trim(),
      player: String(correctedLeg?.player || '').trim(),
      team: String(correctedLeg?.team || '').trim(),
      opponent: String(correctedLeg?.opponent || '').trim(),
      dateTime: String(correctedLeg?.date_time || '').trim(),
      metric: String(correctedLeg?.metric || '').trim(),
      line: String(correctedLeg?.line || '').trim(),
      direction: String(correctedLeg?.direction || '').trim(),
      type: String(correctedLeg?.type || '').trim()
    };
    vault.categories = {
      identity: makeCategory(identity, 'Identity'),
      trend: makeCategory(trend, 'Trend'),
      stress: makeCategory(stress, 'Stress'),
      risk: makeCategory(risk, 'Risk')
    };
    return vault;
  }

  function makeBatchAudit(payload = {}) {
    return {
      logicConsistency: clampScore(payload?.batch_audit?.logic_consistency),
      biasControl: clampScore(payload?.batch_audit?.bias_control),
      rosterAccuracy: clampScore(payload?.batch_audit?.roster_accuracy),
      riskBuffer: clampScore(payload?.batch_audit?.risk_buffer)
    };
  }

  function needsCorrectedRun(batchAudit = {}) {
    return ['logicConsistency', 'biasControl', 'rosterAccuracy'].some((key) => Number(batchAudit?.[key]) < 95);
  }

  async function streamingIngress(pool = [], stateRef = null, hooks = {}) {
    const rows = Array.isArray(pool) ? pool.slice(0, 24) : [];
    const totalProbes = rows.length * 4;
    let result = await fetchGeminiBatch(rows, 'initial');

    if (result.ok) {
      const initialBatchAudit = makeBatchAudit(result.payload);
      if (needsCorrectedRun(initialBatchAudit)) {
        hooks.onCorrection?.({ message: 'Determinism lock triggered corrected final pass.' });
        const rerun = await fetchGeminiBatch(rows, 'corrected');
        if (rerun.ok) result = rerun;
      }
    }

    if (!result.ok) {
      const failedVaultCollection = Object.fromEntries(rows.map((row) => [row.LEG_ID, createZeroFilledVault(row)]));
      const lastResult = {
        row: rows[0] || {},
        vault: createZeroFilledVault(rows[0] || {}),
        vaultCollection: failedVaultCollection,
        batchAudit: {},
        logs: [{ level: 'warning', text: `[SYSTEM] ${result.errorText || 'Gemini request failed.'}` }],
        analysisHint: result.errorText || 'Gemini request failed.',
        runStatus: 'FAILED',
        finalized: true,
        rawPayload: window.__ALPHADOG_RAW_GEMINI_PAYLOAD__ || '',
        responseText: window.__ALPHADOG_RAW_GEMINI_PAYLOAD__ || '',
        correctedRun: false
      };
      return { lastResult };
    }

    const byKey = new Map((result.payload.legs || []).map((leg) => [String(leg?.row_key || ''), leg]));
    const byPlayer = new Map((result.payload.legs || []).map((leg) => [normalizeName(leg?.player || ''), leg]));
    const vaultCollection = {};
    let completedProbes = 0;
    let lastRowResult = null;
    const batchAudit = makeBatchAudit(result.payload);
    const correctedRun = Boolean(result?.payload?.batch_audit?.corrected_final_run) || /Corrected[_ ]Final[_ ]Run/i.test(String(result.rawPayload || ''));

    for (const row of rows) {
      hooks.onRowStart?.({ row });
      const leg = byKey.get(String(row.LEG_ID || '')) || byKey.get(String(row.row_key || '')) || byPlayer.get(normalizeName(row.parsedPlayer || row.player || '')) || {};
      const vault = hydrateVaultFromLeg(row, leg);
      vaultCollection[row.LEG_ID] = vault;
      if (stateRef) stateRef.miningVault = Object.assign({}, stateRef.miningVault || {}, { [row.LEG_ID]: vault });
      try { window.__ALPHADOG_MINING_VAULT__ = Object.assign({}, stateRef?.miningVault || vaultCollection); } catch (_) {}

      for (const categoryKey of ['identity', 'trend', 'stress', 'risk']) {
        completedProbes += 1;
        hooks.onBranch?.({
          row,
          categoryKey,
          vault,
          completedProbes,
          totalProbes,
          logs: [{ level: 'info', text: `[SYSTEM] ${row.parsedPlayer || row.LEG_ID}: ${categoryKey} ready.` }],
          rawPayload: result.rawPayload
        });
      }

      lastRowResult = {
        row,
        vault,
        vaultCollection: Object.assign({}, vaultCollection),
        batchAudit,
        logs: [{ level: 'info', text: `[SYSTEM] ${row.parsedPlayer || row.LEG_ID}: audit complete.` }],
        analysisHint: leg?.summary || 'Audit complete.',
        runStatus: 'VERIFIED',
        finalized: true,
        rawPayload: result.rawPayload,
        responseText: result.responseText,
        correctedRun
      };

      hooks.onRowComplete?.({
        result: lastRowResult,
        completedRows: Object.keys(vaultCollection).length,
        completedProbes,
        totalProbes
      });
    }

    const finalResult = Object.assign({}, lastRowResult || {}, {
      vaultCollection: Object.assign({}, vaultCollection),
      batchAudit,
      rawPayload: result.rawPayload,
      responseText: result.responseText,
      finalized: true,
      runStatus: 'VERIFIED',
      correctedRun
    });

    hooks.onComplete?.({ lastResult: finalResult });
    return { lastResult: finalResult };
  }

  async function debugConnection() {
    const apiKey = getActiveGeminiKey();
    if (!apiKey) return { ok: false, status: 0, errorText: 'Missing Gemini API key.' };
    const test = await callModel(FALLBACK_MODEL, 'Return JSON only: {"legs":[],"batch_audit":{"logic_consistency":100,"bias_control":100,"roster_accuracy":100,"risk_buffer":100}}', apiKey);
    return { ok: Boolean(test.ok), status: test.status || 0, errorText: test.errorText || '', modelId: test.modelId || FALLBACK_MODEL };
  }

  Object.assign(window.PickCalcConnectors, {
    SYSTEM_VERSION,
    PRIMARY_MODEL,
    FALLBACK_MODEL,
    GROUNDED_2026_PLAYERS,
    createZeroFilledVault,
    fetchGeminiBatch,
    streamingIngress,
    debugConnection
  });
})();
