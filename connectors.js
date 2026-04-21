window.PickCalcConnectors = window.PickCalcConnectors || {};
(() => {
  const SYSTEM_VERSION = 'AlphaDog v0.0.2 "Iron Bite"';
  const PRIMARY_MODEL = 'gemini-2.5-pro';
  const FALLBACK_MODEL = 'gemini-3.1-flash-lite-preview';
  const GEMINI_BASE_URL = 'https://geminiconnector.rodolfoaamattos.workers.dev';
  const BRANCH_TARGETS = { A: 1, B: 1, C: 1, D: 1 };

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

  function makeBranch(score = 0, key = 'A') {
    const normalized = Math.max(0, Math.min(100, Number(score) || 0));
    const parsedKey = `${key.toLowerCase()}01`;
    return {
      status: 'SUCCESS',
      parsed: { [parsedKey]: Number((normalized / 100).toFixed(3)) },
      factorMeta: {
        [parsedKey]: {
          name: key === 'A' ? 'Identity' : key === 'B' ? 'Trend' : key === 'C' ? 'Stress' : 'Risk',
          value: Number((normalized / 100).toFixed(3)),
          status: 'SUCCESS'
        }
      },
      realCount: 1,
      derivedCount: 0,
      simulatedCount: 0,
      source: 'gemini'
    };
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
      branches: {
        A: makeBranch(0, 'A'),
        B: makeBranch(0, 'B'),
        C: makeBranch(0, 'C'),
        D: makeBranch(0, 'D')
      }
    };
  }

  function buildPrompt(batch = []) {
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

    return [
      'Return JSON only. No markdown. No prose outside the JSON.',
      'You are AlphaDog v0.0.2 "Iron Bite". Analyze up to 24 legs. Resolve identities. Determine if More or Less is the superior play based on 2026 depth.',
      'Line detection must capture and resolve: Regular, Goblin, Demon, Taco, and Free Pick.',
      'Do not reject shorthand names. Raw fragments like "J Smith" are valid and must be normalized in context, not refused.',
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
          text: 'You are AlphaDog v0.0.2 "Iron Bite". Analyze up to 24 legs. Resolve identities. Determine if More or Less is the superior play based on 2026 depth. For each leg, return sport, player, team, opponent, date_time, metric, line, direction, type, identity, trend, stress, risk, final_score, and summary. Include batch_audit with logic_consistency, bias_control, roster_accuracy, and risk_buffer. Output JSON only.'
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
      headers: { 'Content-Type': 'application/json' },
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

  async function fetchGeminiBatch(batch = []) {
    const apiKey = getActiveGeminiKey();
    if (!apiKey) {
      return { ok: false, status: 0, modelId: PRIMARY_MODEL, errorText: 'Missing Gemini API key.' };
    }

    const prompt = buildPrompt(batch);
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

  function hydrateVaultFromLeg(row = {}, leg = {}) {
    const vault = createZeroFilledVault(row);
    const identity = Math.max(0, Math.min(100, Number(leg?.identity) || 0));
    const trend = Math.max(0, Math.min(100, Number(leg?.trend) || 0));
    const stress = Math.max(0, Math.min(100, Number(leg?.stress) || 0));
    const risk = Math.max(0, Math.min(100, Number(leg?.risk) || 0));
    const finalScore = Math.max(0, Math.min(100, Number(leg?.final_score) || 0));

    vault.isReal = true;
    vault.reliable = true;
    vault.terminalState = 'Verified';
    vault.source = 'gemini';
    vault.categoryScores = { identity, trend, stress, risk };
    vault.finalScore = finalScore;
    vault.summary = String(leg?.summary || '').trim();
    vault.auditMeta = {
      sport: String(leg?.sport || '').trim(),
      player: String(leg?.player || '').trim(),
      team: String(leg?.team || '').trim(),
      opponent: String(leg?.opponent || '').trim(),
      dateTime: String(leg?.date_time || '').trim(),
      metric: String(leg?.metric || '').trim(),
      line: String(leg?.line || '').trim(),
      direction: String(leg?.direction || '').trim(),
      type: String(leg?.type || '').trim()
    };
    vault.branches = {
      A: makeBranch(identity, 'A'),
      B: makeBranch(trend, 'B'),
      C: makeBranch(stress, 'C'),
      D: makeBranch(risk, 'D')
    };
    return vault;
  }

  function makeBatchAudit(payload = {}) {
    return {
      logicConsistency: payload?.batch_audit?.logic_consistency,
      biasControl: payload?.batch_audit?.bias_control,
      rosterAccuracy: payload?.batch_audit?.roster_accuracy,
      riskBuffer: payload?.batch_audit?.risk_buffer
    };
  }

  async function streamingIngress(pool = [], stateRef = null, hooks = {}) {
    const rows = Array.isArray(pool) ? pool.slice(0, 24) : [];
    const totalProbes = rows.length * 4;
    const result = await fetchGeminiBatch(rows);

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
        responseText: window.__ALPHADOG_RAW_GEMINI_PAYLOAD__ || ''
      };
      return { lastResult };
    }

    const byKey = new Map((result.payload.legs || []).map((leg) => [String(leg?.row_key || ''), leg]));
    const vaultCollection = {};
    let completedProbes = 0;
    let lastRowResult = null;
    const batchAudit = makeBatchAudit(result.payload);

    for (const row of rows) {
      hooks.onRowStart?.({ row });
      const leg = byKey.get(String(row.LEG_ID || '')) || byKey.get(String(row.row_key || '')) || {};
      const vault = hydrateVaultFromLeg(row, leg);
      vaultCollection[row.LEG_ID] = vault;
      if (stateRef) stateRef.miningVault = Object.assign({}, stateRef.miningVault || {}, { [row.LEG_ID]: vault });

      for (const branchKey of ['A', 'B', 'C', 'D']) {
        completedProbes += 1;
        hooks.onBranch?.({
          row,
          branchKey,
          vault,
          shield: {},
          completedProbes,
          totalProbes,
          logs: [{ level: 'info', text: `[SYSTEM] ${row.parsedPlayer || row.LEG_ID}: ${branchKey} ready.` }],
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
        responseText: result.responseText
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
      runStatus: 'VERIFIED'
    });

    hooks.onComplete?.({ lastResult: finalResult });
    return { lastResult: finalResult };
  }

  async function debugConnection() {
    const apiKey = getActiveGeminiKey();
    if (!apiKey) return { ok: false, status: 0, errorText: 'Missing Gemini API key.' };
    const test = await callModel(FALLBACK_MODEL, 'Return JSON only: {"legs":[],"batch_audit":{"logic_consistency":0,"bias_control":0,"roster_accuracy":0,"risk_buffer":0}}', apiKey);
    return { ok: Boolean(test.ok), status: test.status || 0, errorText: test.errorText || '', modelId: test.modelId || FALLBACK_MODEL };
  }

  Object.assign(window.PickCalcConnectors, {
    SYSTEM_VERSION,
    PRIMARY_MODEL,
    FALLBACK_MODEL,
    BRANCH_TARGETS,
    createZeroFilledVault,
    fetchGeminiBatch,
    streamingIngress,
    debugConnection
  });
})();
