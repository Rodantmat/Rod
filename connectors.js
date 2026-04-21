window.PickCalcConnectors = window.PickCalcConnectors || {};
(() => {
  const SYSTEM_VERSION = 'AlphaDog v0.0.3 "Steroid Squirrel"';
  const PRIMARY_MODEL = 'gemini-3.1-pro-preview';
  const FALLBACK_MODEL = 'gemini-3.1-flash-lite-preview';
  const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com';
  const GROUNDED_2026_PLAYERS = {
    'keider montero': { teamAbbr: 'DET', teamFullName: 'Detroit Tigers' },
    'kyle harrison': { teamAbbr: 'MIL', teamFullName: 'Milwaukee Brewers' },
    'parker messick': { teamAbbr: 'CLE', teamFullName: 'Cleveland Guardians' },
    'shota imanaga': { teamAbbr: 'CHC', teamFullName: 'Chicago Cubs' }
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function stashRawPayload(text = '') {
    try { window.__ALPHADOG_RAW_GEMINI_PAYLOAD__ = String(text || ''); } catch (_) {}
  }

  function getActiveGeminiKey() {
    try {
      return String(
        window.__OXYGEN_GEMINI_KEY__ ||
        localStorage.getItem('OXYGEN_GEMINI_KEY') ||
        sessionStorage.getItem('OXYGEN_GEMINI_KEY') ||
        document.getElementById('apiKeyInput')?.value || ''
      ).trim();
    } catch (_) {
      return '';
    }
  }

  function makeCategory(score = null, label = '') {
    const value = Number(score);
    return {
      label,
      score: Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : null
    };
  }

  function createZeroFilledVault(row = {}) {
    return {
      isReal: false,
      reliable: false,
      terminalState: 'Pending',
      source: 'gemini',
      categoryScores: { identity: null, trend: null, stress: null, risk: null },
      finalScore: null,
      summary: '',
      auditMeta: {
        sport: String(row?.sport || 'MLB').trim(),
        player: String(row?.parsedPlayer || row?.player || '').trim(),
        team: String(row?.teamFullName || row?.team || '').trim(),
        opponent: String(row?.opponentFullName || row?.opponent || '').trim(),
        dateTime: String(row?.gameDayTime || row?.gameTimeText || row?.gameTime || '').trim(),
        metric: String(row?.prop || '').trim(),
        line: String(row?.line || '').trim(),
        direction: String(row?.direction || '').trim(),
        type: String(row?.type || 'Regular').trim(),
        hitProb: ''
      },
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
        `TEAM: ${row.teamFullName || row.team || ''}`,
        `OPPONENT: ${row.opponentFullName || row.opponent || ''}`,
        `METRIC: ${row.prop || ''}`,
        `LINE: ${row.line || ''}`,
        `DIRECTION: ${row.direction || ''}`,
        `TYPE: ${row.type || 'Regular'}`,
        `GAME_TIME: ${row.gameDayTime || row.gameTimeText || row.gameTime || ''}`
      ].join('\n');
    }).join('\n\n');

    const correctionLine = mode === 'corrected'
      ? 'RECURSIVE AUDIT: This is a Corrected Final Run. Fix hallucination risk and raise roster_accuracy to at least 85.'
      : 'Initial final run. Use penalty-first logic from 100 and deduct for matchup stress, fatigue, or high-variance line types.';

    return [
      'Return valid JSON only. No markdown. No prose outside the JSON.',
      'Wrap the JSON in <JSON_Payload> tags.',
      '<System_Instruction>',
      'Role: Iron Bite Auditor (STEROID SQUIRREL Edition).',
      'Context: April 20, 2026.',
      'Rules:',
      '1. ROSTER SHIELD: Assume 100% accuracy of input rosters. Identity score MUST be 100 for feed-listed players.',
      '2. CALIBRATION: Calculate Hit Prob % first. Final Score cannot exceed (Hit Prob * 1.2). Cap all HR 0.5 lines at 50 unless daily HR rate is above 45%.',
      '3. RECURSIVE AUDIT: If Roster_Accuracy < 85, rerun and output corrected final run.',
      '4. BATCHING: Process up to 3 batches (8 legs each) if needed, but return one final JSON object.',
      '5. OUTPUT: Return valid JSON inside <JSON_Payload> tags. Include hit_prob.',
      'Verified 2026 facts:',
      '- Keider Montero (DET): Active MLB Starter.',
      '- Kyle Harrison: Milwaukee Brewers (MIL) in 2026.',
      '- Parker Messick (CLE): Active MLB Starter.',
      '- Shota Imanaga (CHC): Active MLB Starter.',
      correctionLine,
      '</System_Instruction>',
      '<JSON_Schema>',
      '{',
      '  "version": "v0.0.3",',
      '  "codename": "Steroid Squirrel",',
      '  "legs": [{',
      '    "row_key": "LEG-1",',
      '    "player": "Full Name",',
      '    "team": "Team",',
      '    "opponent": "OPP",',
      '    "metric": "Prop",',
      '    "line": "Value",',
      '    "direction": "More/Less",',
      '    "type": "Regular/Goblin/Demon/Taco/Free Pick",',
      '    "scores": {"id": 100, "trend": 0, "stress": 0, "risk": 0},',
      '    "identity": 100,',
      '    "trend": 0,',
      '    "stress": 0,',
      '    "risk": 0,',
      '    "final_score": 0,',
      '    "hit_prob": "XX%",',
      '    "summary": "Brutal 1-sentence 2026 analysis."',
      '  }],',
      '  "batch_audit": {',
      '    "logic_consistency": 0,',
      '    "bias_control": 0,',
      '    "roster_accuracy": 0,',
      '    "risk_buffer": 0',
      '  }',
      '}',
      '</JSON_Schema>',
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
    const jsonPayloadMatch = trimmed.match(/<JSON_Payload>\s*([\s\S]*?)\s*<\/JSON_Payload>/i);
    const candidate = jsonPayloadMatch ? jsonPayloadMatch[1] : trimmed;
    try { return JSON.parse(candidate); } catch (_) {}
    const match = candidate.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch (_) { return null; }
  }

  function isRetryableFailure(status = 0, message = '') {
    const code = Number(status) || 0;
    const text = String(message || '').toLowerCase();
    return code === 429 || code === 500 || code === 503 || code === 504 || /busy|quota|prepayment|rate limit|overloaded|temporar/.test(text);
  }

  async function callModel(modelId, prompt, apiKey) {
    const url = `${GEMINI_BASE_URL.replace(/\/$/, '')}/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const body = JSON.stringify({
      systemInstruction: {
        parts: [{
          text: 'Role: Iron Bite Auditor (STEROID SQUIRREL Edition). Context: April 20, 2026. ROSTER SHIELD: Assume feed rosters are accurate and force identity to 100 for feed-listed players. CALIBRATION: Compute hit_prob first, final_score cannot exceed hit_prob * 1.2, and HR 0.5 props are capped at 50 unless daily HR rate exceeds 45%. RECURSIVE AUDIT: If roster_accuracy < 85, rerun and correct. OUTPUT: Valid JSON inside <JSON_Payload> tags with hit_prob and batch_audit.'
        }]
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.15,
        maxOutputTokens: 6144,
        responseMimeType: 'application/json'
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
      return { ok: false, status: response.status, modelId, errorText: extracted || rawText || `HTTP ${response.status}` };
    }

    const parsed = safeParsePayload(extracted || rawText);
    if (!parsed || !Array.isArray(parsed.legs)) {
      return { ok: false, status: response.status, modelId, errorText: 'Malformed JSON payload from Gemini.' };
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
    if (!apiKey) return { ok: false, status: 0, modelId: PRIMARY_MODEL, errorText: 'Missing Gemini API key.' };
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
    return Number.isFinite(num) ? Math.max(0, Math.min(100, Math.round(num))) : null;
  }

  function parsePercent(value) {
    const num = Number(String(value || '').replace(/[^\d.]/g, ''));
    return Number.isFinite(num) ? num : null;
  }

  function applyGroundedIdentity(row = {}, leg = {}) {
    const name = String(leg?.player || row?.parsedPlayer || row?.player || '').trim().toLowerCase();
    const grounded = GROUNDED_2026_PLAYERS[name];
    return Object.assign({}, leg, {
      team: leg?.team || grounded?.teamFullName || row?.teamFullName || row?.team || grounded?.teamAbbr || '',
      identity: 100
    });
  }

  function calibrateLegScores(row = {}, leg = {}) {
    const nextLeg = Object.assign({}, leg);
    nextLeg.identity = 100;
    const hitProb = parsePercent(nextLeg?.hit_prob);
    const metric = String(nextLeg?.metric || row?.prop || '').toLowerCase();
    const lineText = String(nextLeg?.line || row?.line || '');

    if (Number.isFinite(hitProb)) {
      const maxByProb = Math.min(100, Math.round(hitProb * 1.2));
      if (Number.isFinite(Number(nextLeg.final_score))) {
        nextLeg.final_score = Math.min(Number(nextLeg.final_score), maxByProb);
      }
      if (hitProb < 68 && Number(nextLeg.final_score) > 85) nextLeg.final_score = 85;
      if (hitProb < 55 && Number(nextLeg.final_score) > 69) nextLeg.final_score = 69;
    }

    if ((metric.includes('home run') || metric === 'hr' || metric.includes('home runs')) && lineText === '0.5') {
      nextLeg.final_score = Math.min(Number(nextLeg.final_score || 0), 50);
    }

    return nextLeg;
  }

  function hydrateVaultFromLeg(row = {}, leg = {}) {
    const correctedLeg = calibrateLegScores(row, applyGroundedIdentity(row, leg));
    const vault = createZeroFilledVault(row);
    const identity = 100;
    const trend = clampScore(correctedLeg?.trend ?? correctedLeg?.scores?.trend);
    const stress = clampScore(correctedLeg?.stress ?? correctedLeg?.scores?.stress);
    const risk = clampScore(correctedLeg?.risk ?? correctedLeg?.scores?.risk);
    const finalScore = clampScore(correctedLeg?.final_score);

    vault.isReal = true;
    vault.reliable = true;
    vault.terminalState = 'Verified';
    vault.source = 'gemini';
    vault.categoryScores = { identity, trend, stress, risk };
    vault.finalScore = finalScore;
    vault.summary = String(correctedLeg?.summary || '').trim();
    vault.auditMeta = {
      sport: String(correctedLeg?.sport || row?.sport || 'MLB').trim(),
      player: String(correctedLeg?.player || row?.parsedPlayer || row?.player || '').trim(),
      team: String(correctedLeg?.team || row?.teamFullName || row?.team || '').trim(),
      opponent: String(correctedLeg?.opponent || row?.opponentFullName || row?.opponent || '').trim(),
      dateTime: String(correctedLeg?.date_time || row?.gameDayTime || row?.gameTimeText || row?.gameTime || '').trim(),
      metric: String(correctedLeg?.metric || row?.prop || '').trim(),
      line: String(correctedLeg?.line || row?.line || '').trim(),
      direction: String(correctedLeg?.direction || row?.direction || '').trim(),
      type: String(correctedLeg?.type || row?.type || 'Regular').trim(),
      hitProb: String(correctedLeg?.hit_prob || '').trim()
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
    return Number(batchAudit?.rosterAccuracy) < 85;
  }

  async function streamingIngress(pool = [], stateRef = null, hooks = {}) {
    const rows = Array.isArray(pool) ? pool.slice(0, 24) : [];
    const totalProbes = rows.length * 4;
    let result = await fetchGeminiBatch(rows, 'initial');

    if (result.ok) {
      const initialBatchAudit = makeBatchAudit(result.payload);
      if (needsCorrectedRun(initialBatchAudit)) {
        hooks.onCorrection?.({ message: 'Roster accuracy fell under 85. Running Corrected Final Run.' });
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
    const correctedRun = /corrected/i.test(String(result.rawPayload || ''));

    for (const row of rows) {
      hooks.onRowStart?.({ row });
      const leg = byKey.get(String(row.LEG_ID || '')) || {};
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
    const test = await callModel(FALLBACK_MODEL, 'Return valid JSON inside <JSON_Payload> tags: <JSON_Payload>{"version":"v0.0.3","codename":"Steroid Squirrel","legs":[],"batch_audit":{"logic_consistency":100,"bias_control":100,"roster_accuracy":100,"risk_buffer":100}}</JSON_Payload>', apiKey);
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
