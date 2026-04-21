window.PickCalcConnectors = window.PickCalcConnectors || {};
(() => {
  const SYSTEM_VERSION = 'AlphaDog v0.0.2 "Iron Bite"';
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

  function createZeroFilledVault(row = {}) {
    return {
      LEG_ID: row?.LEG_ID || '',
      idx: row?.idx || 0,
      isReal: false,
      reliable: false,
      terminalState: 'Waiting',
      source: 'empty',
      categoryScores: { identity: null, trend: null, stress: null, risk: null },
      finalScore: null,
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

    const correctionLine = mode === 'corrected'
      ? 'This is a Corrected Final Run. Re-score the full batch using penalty-first logic. Any weak roster grounding or hallucination risk must be corrected now.'
      : 'Initial final run. Use penalty-first logic from 100 and deduct for matchup stress, fatigue, or high-variance line types.';

    return [
      'Return JSON only. No markdown. No prose outside the JSON.',
      'You are AlphaDog v0.0.2 "Iron Bite". Analyze up to 24 legs. Resolve identities. Determine if More or Less is the superior play based on 2026 depth.',
      'Assume all input feed data is already verified 2026 reality. Do not invalidate legs using 2024 or 2025 assumptions.',
      'Grounded 2026 facts:',
      '- Chase Burns (CIN): Active MLB Starter (1-1, 2.42 ERA).',
      '- Nolan McLean (NYM): Active MLB Starter (1-1, 2.28 ERA).',
      '- Munetaka Murakami (CWS): Active MLB 1B/3B (8 HRs, .918 OPS).',
      'If a player matches one of those grounded names, identity must be 100.',
      'Line detection must capture and resolve: Regular, Goblin, Demon, Taco, and Free Pick.',
      'Do not reject shorthand names. Raw fragments like "J Smith" are valid and must be normalized in context, not refused.',
      correctionLine,
      'JSON schema:',
      '{',
      '  "legs": [',
      '    {',
      '      "row_key": "LEG-1",',
      '      "sport": "MLB",',
      '      "player": "Full player name",',
      '      "team": "Full team name",',
      '      "opponent": "Opponent team name",',
      '      "date_time": "Tuesday 4:40pm",',
      '      "metric": "Pitcher Strikeouts",',
      '      "line": "4.5",',
      '      "direction": "More",',
      '      "type": "Goblin",',
      '      "identity": 0,',
      '      "trend": 0,',
      '      "stress": 0,',
      '      "risk": 0,',
      '      "final_score": 0,',
      '      "summary": "brief one-line audit summary"',
      '    }',
      '  ],',
      '  "batch_audit": {',
      '    "logic_consistency": 0,',
      '    "bias_control": 0,',
      '    "roster_accuracy": 0,',
      '    "risk_buffer": 0',
      '  }',
      '}',
      '',
      'Subjects:',
      subjects
    ].join('\n');
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
          text: 'You are AlphaDog v0.0.2 "Iron Bite". Analyze up to 24 legs using 2026 reality. Assume input feed data is valid 2026 truth. If a player is Chase Burns, Nolan McLean, or Munetaka Murakami, set identity to 100. Resolve More or Less. Score identity, trend, stress, risk, and final_score. Add batch_audit with logic_consistency, bias_control, roster_accuracy, and risk_buffer. Output JSON only.'
        }]
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.15,
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
      identity: 100
    });
  }

  function hydrateVaultFromLeg(row = {}, leg = {}) {
    const correctedLeg = applyGroundedIdentity(row, leg);
    const vault = createZeroFilledVault(row);
    const identity = clampScore(correctedLeg?.identity);
    const trend = clampScore(correctedLeg?.trend);
    const stress = clampScore(correctedLeg?.stress);
    const risk = clampScore(correctedLeg?.risk);
    const finalScore = clampScore(correctedLeg?.final_score);

    vault.isReal = true;
    vault.reliable = true;
    vault.terminalState = 'Verified';
    vault.source = 'gemini';
    vault.categoryScores = { identity, trend, stress, risk };
    vault.finalScore = finalScore;
    vault.summary = String(correctedLeg?.summary || '').trim();
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
    return ['logicConsistency', 'biasControl', 'rosterAccuracy', 'riskBuffer'].some((key) => Number(batchAudit?.[key]) < 85);
  }

  async function streamingIngress(pool = [], stateRef = null, hooks = {}) {
    const rows = Array.isArray(pool) ? pool.slice(0, 24) : [];
    const totalProbes = rows.length * 4;
    let result = await fetchGeminiBatch(rows, 'initial');

    if (result.ok) {
      const initialBatchAudit = makeBatchAudit(result.payload);
      if (needsCorrectedRun(initialBatchAudit)) {
        hooks.onCorrection?.({ message: 'Auditor score dipped under 85. Re-running corrected final pass.' });
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
    const vaultCollection = {};
    let completedProbes = 0;
    let lastRowResult = null;
    const batchAudit = makeBatchAudit(result.payload);
    const correctedRun = String(result.rawPayload || '').includes('Corrected Final Run') || needsCorrectedRun(makeBatchAudit(result.payload)) === false;

    for (const row of rows) {
      hooks.onRowStart?.({ row });
      const leg = byKey.get(String(row.LEG_ID || '')) || byKey.get(String(row.row_key || '')) || {};
      const vault = hydrateVaultFromLeg(row, leg);
      vaultCollection[row.LEG_ID] = vault;
      if (stateRef) stateRef.miningVault = Object.assign({}, stateRef.miningVault || {}, { [row.LEG_ID]: vault });

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
