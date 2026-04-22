window.PickCalcConnectors = window.PickCalcConnectors || {};
(() => {
  const SYSTEM_VERSION = 'AlphaDog v0.0.20 "Token Goblin"';
  const PRIMARY_MODEL = 'gemini-2.5-pro';
  const FALLBACK_MODEL = 'DISABLED_IN_LOGIC_CAGE';
  const GEMINI_BASE_URL = 'https://geminiconnector.rodolfoaamattos.workers.dev';
  const DEBUG_SEED = 42;

  const LOGIC_CAGE_SYSTEM_INSTRUCTION = [
    '<System_Instruction>',
    'Role: Iron Bite Auditor (AlphaDog v0.0.20 "Token Goblin").',
    'Context: April 21, 2026.',
    'Mode: Structural Sensor.',
    'Mission: Return enum-only structural signals for each leg. Do not calculate arithmetic. Do not output bonuses. Do not output prose outside the schema. Echo every supplied row_key exactly.',
    '',
    'Bucket Separation Mandate:',
    'LOW = clearly favorable setup, or no specific named difficulty is present.',
    'MEDIUM = mixed or genuinely unclear setup only.',
    'HIGH = use only when a specific named difficulty factor is present.',
    'Do not use MEDIUM as a safe default.',
    '',
    'Zero-Tolerance Rules:',
    '1. row_key is mandatory and must be echoed exactly for every leg.',
    '2. The supplied player/team/opponent/metric/line/roster_hint context is authoritative.',
    '3. Output must contain only the schema fields. No extra keys. No renamed keys.',
    '4. Do not calculate final_score. Do not infer hidden penalties. Do not add bonuses.',
    '5. Return enum values only for matchup_tier, stress_level, and risk_level using LOW, MEDIUM, or HIGH.',
    '6. Return roster_status using ACTIVE, UNKNOWN, or OUT.',
    '7. summary must be one short factual sentence only. Include one named reason when using HIGH.',
    '</System_Instruction>'
  ].join('\n');

  const RESPONSE_SCHEMA = {
    type: 'object',
    required: ['legs'],
    properties: {
      legs: {
        type: 'array',
        items: {
          type: 'object',
          required: ['row_key', 'roster_status', 'matchup_tier', 'stress_level', 'risk_level'],
          properties: {
            row_key: { type: 'string' },
            roster_status: { type: 'string', enum: ['ACTIVE', 'UNKNOWN', 'OUT'] },
            matchup_tier: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
            stress_level: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
            risk_level: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
            summary: { type: 'string' }
          }
        }
      }
    }
  };

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
    const rowKey = String(row?.LEG_ID || row?.row_key || '').trim();
    const player = String(row?.parsedPlayer || row?.player || '').trim();
    return {
      LEG_ID: rowKey,
      idx: row?.idx || 0,
      player,
      sourcePlayer: player,
      rowKey,
      isReal: false,
      reliable: false,
      terminalState: 'Waiting',
      source: 'empty',
      schemaState: 'EMPTY',
      schemaErrors: [],
      deductionCodes: null,
      scores: { identity: null, trend: null, stress: null, risk: null },
      categoryScores: { identity: null, trend: null, stress: null, risk: null },
      finalScore: null,
      final_score: null,
      summary: '',
      auditMeta: {
        sport: String(row?.sport || '').trim(),
        player,
        team: String(row?.team || '').trim(),
        opponent: String(row?.opponent || '').trim(),
        dateTime: String(row?.gameTimeText || row?.gameTime || '').trim(),
        metric: String(row?.prop || '').trim(),
        line: String(row?.line || '').trim(),
        direction: String(row?.direction || '').trim(),
        type: String(row?.type || 'Regular').trim()
      },
      categories: {
        identity: makeCategory(null, 'Identity'),
        trend: makeCategory(null, 'Trend'),
        stress: makeCategory(null, 'Stress'),
        risk: makeCategory(null, 'Risk')
      }
    };
  }

  function createSchemaErrorVault(row = {}, reason = 'Schema violation', leg = null) {
    const vault = createZeroFilledVault(row);
    vault.isReal = true;
    vault.reliable = false;
    vault.terminalState = 'Schema Error';
    vault.source = 'gemini';
    vault.schemaState = 'SCHEMA_ERROR';
    vault.schemaErrors = [String(reason || 'Schema violation')];
    vault.summary = String(reason || 'Schema violation');
    vault.player = String(leg?.player || row?.parsedPlayer || row?.player || '').trim();
    vault.sourcePlayer = vault.player;
    vault.rowKey = String(leg?.row_key || row?.LEG_ID || row?.row_key || '').trim();
    return vault;
  }

  function buildUserPrompt(batch = []) {
    const legsJson = batch.map((row, index) => {
      const rowKey = String(row?.LEG_ID || row?.row_key || `LEG-${index + 1}`).trim();
      return {
        row_key: rowKey,
        player: String(row?.parsedPlayer || row?.player || '').trim(),
        sport: String(row?.sport || 'MLB').trim(),
        team: String(row?.team || '').trim(),
        opponent: String(row?.opponent || '').trim(),
        metric: String(row?.prop || '').trim(),
        line: String(row?.line || '').trim(),
        type: String(row?.type || 'Regular').trim(),
        game_time: String(row?.gameTimeText || row?.gameTime || '').trim(),
        roster_hint: String((row?.parsedPlayer || row?.player) ? 'ACTIVE' : 'UNKNOWN')
      };
    });

    return [
      'Return application/json matching the response schema only.',
      'Return one object with a legs array.',
      'Echo every row_key exactly once.',
      'Do not calculate scores.',
      'Do not return batch_audit, codename, version, player, or extra keys.',
      'LOW = favorable or no named difficulty.',
      'MEDIUM = mixed or unclear only.',
      'HIGH = only when a specific named difficulty factor is present.',
      'Do not use MEDIUM as a safe default.',
      '',
      JSON.stringify({ legs: legsJson }, null, 2)
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

  function buildRequestEnvelope(prompt = '') {
    return {
      systemInstruction: {
        parts: [{ text: LOGIC_CAGE_SYSTEM_INSTRUCTION }]
      },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        topK: 1,
        topP: 1,
        seed: DEBUG_SEED,
        candidateCount: 1,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA
      }
    };
  }

  function buildDebugText({ requestBody, rawText, extractedText, parsedPayload, forwardedBody }) {
    return [
      '=== LOGIC CAGE DEBUG ===',
      '',
      'REQUEST_BODY',
      JSON.stringify(requestBody, null, 2),
      '',
      'FORWARDED_BODY',
      forwardedBody ? JSON.stringify(forwardedBody, null, 2) : 'UNAVAILABLE_FROM_WORKER',
      '',
      'RAW_RESPONSE',
      String(rawText || ''),
      '',
      'EXTRACTED_TEXT',
      String(extractedText || ''),
      '',
      'PARSED_PAYLOAD',
      JSON.stringify(parsedPayload || null, null, 2)
    ].join('\n');
  }

  async function callModel(modelId, prompt, apiKey) {
    const url = `${GEMINI_BASE_URL.replace(/\/$/, '')}/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    const requestBody = buildRequestEnvelope(prompt);
    try { console.log('REQUEST_PAYLOAD', JSON.stringify(requestBody, null, 2)); } catch (_) {}

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });

    const rawText = await response.text();
    let outerJson = null;
    try { outerJson = JSON.parse(rawText); } catch (_) {}

    const forwardedBody = outerJson?.debug_request || outerJson?.forwarded_request || outerJson?.request_body || null;
    const finishReason = outerJson?.candidates?.[0]?.finishReason || '';
    const extractedText = outerJson ? parseGeminiText(outerJson) : rawText;
    const parsedPayload = safeParsePayload(extractedText || rawText);
    const debugText = buildDebugText({ requestBody, rawText, extractedText, parsedPayload, forwardedBody });
    stashRawPayload(debugText);

    try {
      window.__ALPHADOG_LAST_API_RESPONSE__ = outerJson || parsedPayload || null;
      window.__ALPHADOG_LAST_REQUEST_BODY__ = requestBody;
      window.__ALPHADOG_LAST_FORWARDED_BODY__ = forwardedBody;
    } catch (_) {}

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        modelId,
        errorText: extractedText || rawText || `HTTP ${response.status}`,
        rawPayload: debugText,
        responseText: extractedText || rawText,
        finishReason
      };
    }

    if (String(finishReason).toUpperCase() === 'MAX_TOKENS') {
      return {
        ok: false,
        status: response.status,
        modelId,
        errorText: 'Truncated Gemini response: MAX_TOKENS.',
        rawPayload: debugText,
        responseText: extractedText || rawText,
        finishReason
      };
    }

    if (!parsedPayload || !Array.isArray(parsedPayload.legs)) {
      return {
        ok: false,
        status: response.status,
        modelId,
        errorText: 'Malformed JSON payload from Gemini.',
        rawPayload: debugText,
        responseText: extractedText || rawText,
        finishReason
      };
    }

    return {
      ok: true,
      status: response.status,
      modelId,
      payload: parsedPayload,
      rawPayload: debugText,
      responseText: extractedText || rawText,
      forwardedBody
    };
  }

  async function fetchGeminiBatch(batch = []) {
    const apiKey = getActiveGeminiKey();
    if (!apiKey) {
      return { ok: false, status: 0, modelId: PRIMARY_MODEL, errorText: 'Missing Gemini API key.' };
    }
    const prompt = buildUserPrompt(batch);
    return callModel(PRIMARY_MODEL, prompt, apiKey);
  }

  function coerceLeg(row = {}, leg = {}) {
    return {
      row_key: String(leg?.row_key || '').trim(),
      player: String(row?.parsedPlayer || row?.player || '').trim(),
      roster_status: String(leg?.roster_status || '').trim(),
      matchup_tier: String(leg?.matchup_tier || '').trim(),
      stress_level: String(leg?.stress_level || '').trim(),
      risk_level: String(leg?.risk_level || '').trim(),
      summary: String(leg?.summary || '').trim(),
      sport: String(row?.sport || 'MLB').trim(),
      team: String(row?.team || '').trim(),
      opponent: String(row?.opponent || '').trim(),
      date_time: String(row?.gameTimeText || row?.gameTime || '').trim(),
      metric: String(row?.prop || '').trim(),
      line: String(row?.line || '').trim(),
      direction: String(row?.direction || '').trim(),
      type: String(row?.type || 'Regular').trim()
    };
  }

  function createSensorVault(row = {}, leg = {}) {
    const normalizedLeg = coerceLeg(row, leg);
    const vault = createZeroFilledVault(row);
    vault.isReal = true;
    vault.reliable = true;
    vault.terminalState = 'Sensor Locked';
    vault.source = 'gemini';
    vault.schemaState = 'OK';
    vault.player = normalizedLeg.player || vault.player;
    vault.sourcePlayer = vault.player;
    vault.rowKey = normalizedLeg.row_key || vault.rowKey;
    vault.summary = normalizedLeg.summary;
    vault.deductionCodes = {
      roster_status: normalizedLeg.roster_status,
      matchup_tier: normalizedLeg.matchup_tier,
      stress_level: normalizedLeg.stress_level,
      risk_level: normalizedLeg.risk_level
    };
    vault.auditMeta = {
      sport: normalizedLeg.sport,
      player: normalizedLeg.player,
      team: normalizedLeg.team,
      opponent: normalizedLeg.opponent,
      dateTime: normalizedLeg.date_time,
      metric: normalizedLeg.metric,
      line: normalizedLeg.line,
      direction: normalizedLeg.direction,
      type: normalizedLeg.type
    };
    return vault;
  }

  function makeBatchAudit(payload = {}) {
    const legCount = Array.isArray(payload?.legs) ? payload.legs.length : 0;
    return {
      logicConsistency: legCount ? 100 : null,
      biasControl: null,
      rosterAccuracy: legCount ? 100 : null,
      riskBuffer: null
    };
  }

  function splitBalancedBatches(rows = [], maxPerBatch = 8) {
    const total = Array.isArray(rows) ? rows.length : 0;
    if (!total) return [];
    const batchCount = Math.ceil(total / maxPerBatch);
    const baseSize = Math.floor(total / batchCount);
    const remainder = total % batchCount;
    const batches = [];
    let cursor = 0;
    for (let i = 0; i < batchCount; i += 1) {
      const size = baseSize + (i < remainder ? 1 : 0);
      batches.push(rows.slice(cursor, cursor + size));
      cursor += size;
    }
    return batches.filter((batch) => batch.length);
  }

  async function streamingIngress(pool = [], stateRef = null, hooks = {}) {
    const rows = Array.isArray(pool) ? pool.slice(0, 24) : [];
    const batches = splitBalancedBatches(rows, 8);
    const totalProbes = rows.length * 4;
    const vaultCollection = {};
    let completedProbes = 0;
    let completedRows = 0;
    let schemaErrorCount = 0;
    let lastRowResult = null;
    let rawPayloadCombined = [];
    let lastResponseText = '';
    let batchAudit = { logicConsistency: null, biasControl: null, rosterAccuracy: null, riskBuffer: null };
    const seenRenderedKeys = new Set();

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
      const batch = batches[batchIndex];
      const result = await fetchGeminiBatch(batch);
      if (result.rawPayload) rawPayloadCombined.push(`=== BATCH ${batchIndex + 1}/${batches.length} ===\n${result.rawPayload}`);
      if (result.responseText) lastResponseText = result.responseText;

      if (!result.ok) {
        for (const row of batch) {
          const rowKey = String(row?.LEG_ID || row?.row_key || '').trim();
          const reason = String(result.errorText || 'Gemini request failed.').includes('MAX_TOKENS')
            ? 'Truncated Gemini response: MAX_TOKENS.'
            : (result.errorText || 'Gemini request failed.');
          const vault = createSchemaErrorVault(row, reason);
          vaultCollection[rowKey] = vault;
          if (stateRef) stateRef.miningVault = Object.assign({}, stateRef.miningVault || {}, { [rowKey]: vault });
          schemaErrorCount += 1;
          for (const categoryKey of ['identity', 'trend', 'stress', 'risk']) {
            completedProbes += 1;
            hooks.onBranch?.({
              row,
              categoryKey,
              vault,
              completedProbes,
              totalProbes,
              logs: [{ level: 'warning', text: `[SYSTEM] ${row.parsedPlayer || row.LEG_ID}: ${reason}` }],
              rawPayload: rawPayloadCombined.join('\n\n')
            });
          }
          completedRows += 1;
          lastRowResult = {
            row,
            vault,
            vaultCollection: Object.assign({}, vaultCollection),
            batchAudit,
            logs: [{ level: 'warning', text: `[SYSTEM] ${row.parsedPlayer || row.LEG_ID}: schema rejected.` }],
            analysisHint: reason,
            runStatus: 'FAILED',
            finalized: true,
            rawPayload: rawPayloadCombined.join('\n\n'),
            responseText: lastResponseText,
            correctedRun: false
          };
          hooks.onRowComplete?.({ result: lastRowResult, completedRows, completedProbes, totalProbes });
        }
        continue;
      }

      batchAudit = makeBatchAudit(result.payload);
      const byKey = new Map();
      const seenResponseKeys = new Set();
      for (const leg of (result.payload.legs || [])) {
        const key = String(leg?.row_key || '').trim();
        if (!key || seenResponseKeys.has(key)) continue;
        seenResponseKeys.add(key);
        byKey.set(key, leg);
      }

      for (const row of batch) {
        hooks.onRowStart?.({ row });
        const rowKey = String(row?.LEG_ID || row?.row_key || '').trim();
        const leg = byKey.get(rowKey);
        let vault;
        if (!leg) {
          vault = createSchemaErrorVault(row, `Missing leg for ${rowKey}. Response must echo row_key exactly.`);
          schemaErrorCount += 1;
        } else if (seenRenderedKeys.has(rowKey)) {
          vault = vaultCollection[rowKey] || createSchemaErrorVault(row, `Duplicate row_key ignored: ${rowKey}.`);
        } else {
          vault = createSensorVault(row, leg);
          seenRenderedKeys.add(rowKey);
        }

        vaultCollection[rowKey] = vault;
        if (stateRef) stateRef.miningVault = Object.assign({}, stateRef.miningVault || {}, { [rowKey]: vault });
        try { window.__ALPHADOG_MINING_VAULT__ = Object.assign({}, stateRef?.miningVault || vaultCollection); } catch (_) {}

        for (const categoryKey of ['identity', 'trend', 'stress', 'risk']) {
          completedProbes += 1;
          hooks.onBranch?.({
            row,
            categoryKey,
            vault,
            completedProbes,
            totalProbes,
            logs: [{ level: vault.schemaState === 'SCHEMA_ERROR' ? 'warning' : 'info', text: `[SYSTEM] ${row.parsedPlayer || row.LEG_ID}: ${vault.schemaState === 'SCHEMA_ERROR' ? 'schema error' : `${categoryKey} locked`}.` }],
            rawPayload: rawPayloadCombined.join('\n\n')
          });
        }

        completedRows += 1;
        lastRowResult = {
          row,
          vault,
          vaultCollection: Object.assign({}, vaultCollection),
          batchAudit,
          logs: [{ level: vault.schemaState === 'SCHEMA_ERROR' ? 'warning' : 'info', text: `[SYSTEM] ${row.parsedPlayer || row.LEG_ID}: ${vault.schemaState === 'SCHEMA_ERROR' ? 'schema rejected' : 'sensor payload accepted'}.` }],
          analysisHint: schemaErrorCount ? `${schemaErrorCount} leg(s) rejected by schema gate.` : 'Sensor payload accepted. JS accountant ready.',
          runStatus: schemaErrorCount ? 'FAILED' : 'VERIFIED',
          finalized: true,
          rawPayload: rawPayloadCombined.join('\n\n'),
          responseText: lastResponseText,
          correctedRun: false
        };
        hooks.onRowComplete?.({ result: lastRowResult, completedRows, completedProbes, totalProbes });
      }
    }

    const finalResult = Object.assign({}, lastRowResult || {}, {
      vaultCollection: Object.assign({}, vaultCollection),
      batchAudit,
      rawPayload: rawPayloadCombined.join('\n\n'),
      responseText: lastResponseText,
      finalized: true,
      runStatus: schemaErrorCount ? 'FAILED' : 'VERIFIED',
      correctedRun: false,
      analysisHint: schemaErrorCount ? `${schemaErrorCount} leg(s) rejected by schema gate.` : 'Logic Cage run complete.'
    });

    hooks.onComplete?.({ lastResult: finalResult });
    return { lastResult: finalResult };
  }

  async function debugConnection() {
    const apiKey = getActiveGeminiKey();
    if (!apiKey) return { ok: false, status: 0, errorText: 'Missing Gemini API key.' };
    const probeRows = [{ LEG_ID: 'LEG-1', parsedPlayer: 'Debug Probe', sport: 'MLB', team: 'NYY', opponent: 'BOS', prop: 'Hits', line: '0.5', direction: 'Over', type: 'Regular', gameTimeText: 'Debug' }];
    const test = await fetchGeminiBatch(probeRows);
    return { ok: Boolean(test.ok), status: test.status || 0, errorText: test.errorText || '', modelId: test.modelId || PRIMARY_MODEL };
  }

  Object.assign(window.PickCalcConnectors, {
    SYSTEM_VERSION,
    PRIMARY_MODEL,
    FALLBACK_MODEL,
    LOGIC_CAGE_SYSTEM_INSTRUCTION,
    RESPONSE_SCHEMA,
    DEBUG_SEED,
    createZeroFilledVault,
    createSchemaErrorVault,
    fetchGeminiBatch,
    streamingIngress,
    debugConnection
  });
})();
