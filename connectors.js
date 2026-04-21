window.PickCalcConnectors = window.PickCalcConnectors || {};
(() => {
  const SYSTEM_VERSION = 'AlphaDog v0.0.1';
  const GEMINI_BASE_URL = 'https://geminiconnector.rodolfoaamattos.workers.dev';
  const PRIMARY_MODEL = 'gemini-3.1-pro';
  const FALLBACK_MODEL = 'gemini-3.1-flash-lite';
  const CURRENT_SEASON = 2026;
  const BRANCH_TARGETS = {};
  const BRANCH_KEYS = [];
  const PROVIDERS = [];
  const FACTOR_NAMES = [];

  function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
  function escapeRegex(value) { return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function normalizeName(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  function getSavedKey() {
    return String(window.__OXYGEN_GEMINI_KEY__ || localStorage.getItem('OXYGEN_GEMINI_KEY') || sessionStorage.getItem('OXYGEN_GEMINI_KEY') || '').trim();
  }
  function loggerFor(stateRef) {
    return (entry) => {
      try { stateRef?.__liveLogs?.push(entry); } catch (_) {}
      try { window.PickCalcUI?.appendConsole?.(entry); } catch (_) {}
    };
  }
  function buildIngressErrorResult(row, detail, status = 0) {
    const player = row?.parsedPlayer || 'Unknown';
    const legHeader = `${row?.league || 'MLB'} - ${player} (${row?.team || '—'}) @ ${row?.opponent || '—'} - ${row?.gameTimeText || row?.selectedDate || '—'}`;
    const propLine = `${row?.line || '—'} ${row?.prop || 'Unknown Prop'} ${row?.direction || row?.pickType || ''}`.trim();
    const rawText = [
      legHeader,
      propLine,
      'Identity & Context Integrity: 0/100',
      'Performance & Trend Variance: 0/100',
      'Situational Stress-Testing: 0/100',
      'Risk & Volatility Buffers: 0/100',
      'Final Score: 0/100',
      `Footer: ${detail}`
    ].join('\n');
    return {
      row,
      ok: false,
      status,
      rawText,
      overallScore: null,
      card: parseAlphaDogCard(rawText, row),
      logs: [{ level: 'warning', text: `[ALPHADOG] ${player}: ${detail}` }],
      analysisHint: detail,
      runStatus: 'FAILED',
      finalized: true
    };
  }

  function buildSystemInstruction(batch = []) {
    const subjectLines = batch.map((row, idx) => {
      const requested = `${row?.line || '—'} ${row?.prop || 'Unknown Prop'} ${row?.direction || row?.pickType || ''}`.trim();
      return `${idx + 1}. ${row?.league || 'MLB'} | ${row?.parsedPlayer || 'Unknown'} | Team=${row?.team || '—'} | Opponent=${row?.opponent || '—'} | Game=${row?.gameTimeText || row?.selectedDate || '—'} | Request=${requested}`;
    }).join('\n');

    return [
      'You are AlphaDog v0.0.1, a Hostile Auditor. Use 2026 data. Normalize short player references like "J Smith" to the most likely full 2026 MLB identity when the context supports it.',
      'Process up to 24 MLB legs. Return plain text only. No markdown fences. No JSON.',
      'For EACH leg, return EXACTLY this structure:',
      'MLB - [Full Name] ([Team]) @ [Opponent] - [Date/Time]',
      '[Prop Line] [Metric] [Direction]',
      'Identity & Context Integrity: [x]/100',
      'Performance & Trend Variance: [x]/100',
      'Situational Stress-Testing: [x]/100',
      'Risk & Volatility Buffers: [x]/100',
      'Final Score: [x]/100',
      'Footer: [one concise audit note]',
      'After all legs, append exactly one line:',
      'Overall Auditor Score: [x]/100',
      'Be terse, numerical, and hostile-auditor in tone. Keep every score between 0 and 100. Preserve the batch order.',
      '',
      'LEGS TO AUDIT:',
      subjectLines
    ].join('\n');
  }

  function extractTextFromResponse(data) {
    const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
    const chunks = [];
    for (const candidate of candidates) {
      const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
      for (const part of parts) {
        if (typeof part?.text === 'string' && part.text.trim()) chunks.push(part.text.trim());
      }
    }
    if (chunks.length) return chunks.join('\n\n');
    if (typeof data?.text === 'string') return data.text;
    return '';
  }

  async function postToConnector(payload, apiKey) {
    const response = await fetch(`${GEMINI_BASE_URL}/v1beta/models/${payload.model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) {}
    return { response, text, data };
  }

  async function retryWithBackoff(buildPayload, apiKey, log) {
    const attempts = [
      { model: PRIMARY_MODEL, waitMs: 0, label: 'primary-1' },
      { model: PRIMARY_MODEL, waitMs: 3000, label: 'primary-2' },
      { model: PRIMARY_MODEL, waitMs: 6000, label: 'primary-3' },
      { model: FALLBACK_MODEL, waitMs: 0, label: 'fallback' }
    ];
    let last = null;
    for (let i = 0; i < attempts.length; i += 1) {
      const step = attempts[i];
      if (step.waitMs > 0) {
        log({ level: 'info', text: `[ALPHADOG] Retry backoff ${step.waitMs / 1000}s before ${step.model}.` });
        await delay(step.waitMs);
      }
      log({ level: 'info', text: `[ALPHADOG] Connector attempt ${i + 1}/${attempts.length} via ${step.model}.` });
      try {
        const result = await postToConnector(buildPayload(step.model), apiKey);
        last = { ...result, model: step.model, attempt: i + 1 };
        const bodyText = `${result.text || ''} ${(result.data?.error?.message || '')}`;
        const busy = /system busy/i.test(bodyText);
        const retryable = [500, 503, 504].includes(Number(result.response?.status)) || busy;
        if (result.response?.ok && !busy) return last;
        log({ level: retryable ? 'warning' : 'error', text: `[ALPHADOG] Attempt ${i + 1} failed (${result.response?.status || 'ERR'}).${busy ? ' System Busy detected.' : ''}` });
        if (!retryable || i === attempts.length - 1) return last;
      } catch (error) {
        last = { response: { ok: false, status: 0 }, text: String(error?.message || error), data: null, model: step.model, attempt: i + 1 };
        log({ level: 'warning', text: `[ALPHADOG] Attempt ${i + 1} exception: ${error?.message || error}` });
        if (i === attempts.length - 1) return last;
      }
    }
    return last;
  }

  function buildPayload(model, batch) {
    return {
      model,
      system_instruction: { parts: [{ text: buildSystemInstruction(batch) }] },
      contents: [{ role: 'user', parts: [{ text: 'Audit the supplied MLB legs and return the exact AlphaDog plain-text format.' }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 65536,
        responseMimeType: 'text/plain'
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
      ]
    };
  }

  function parseScore(label, text) {
    const rx = new RegExp(`${escapeRegex(label)}\\s*:\\s*(\\d{1,3})\\s*/\\s*100`, 'i');
    const m = String(text || '').match(rx);
    return m ? Math.max(0, Math.min(100, Number(m[1]))) : null;
  }

  function parseAlphaDogCard(text, fallbackRow = {}) {
    const lines = String(text || '').split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const header = lines[0] || `${fallbackRow?.league || 'MLB'} - ${fallbackRow?.parsedPlayer || 'Unknown'} (${fallbackRow?.team || '—'}) @ ${fallbackRow?.opponent || '—'} - ${fallbackRow?.gameTimeText || fallbackRow?.selectedDate || '—'}`;
    const propLine = lines[1] || `${fallbackRow?.line || '—'} ${fallbackRow?.prop || 'Unknown Prop'} ${fallbackRow?.direction || fallbackRow?.pickType || ''}`.trim();
    const footerLine = lines.find((line) => /^footer\s*:/i.test(line)) || '';
    return {
      header,
      propLine,
      identityScore: parseScore('Identity & Context Integrity', text),
      performanceScore: parseScore('Performance & Trend Variance', text),
      stressScore: parseScore('Situational Stress-Testing', text),
      riskScore: parseScore('Risk & Volatility Buffers', text),
      finalScore: parseScore('Final Score', text),
      footer: footerLine.replace(/^footer\s*:\s*/i, '').trim(),
      rawText: String(text || '').trim()
    };
  }

  function splitLegSections(rawText, batch) {
    const full = String(rawText || '').replace(/\r\n?/g, '\n').trim();
    const overallMatch = full.match(/Overall Auditor Score\s*:\s*(\d{1,3})\s*\/\s*100/i);
    const overallScore = overallMatch ? Math.max(0, Math.min(100, Number(overallMatch[1]))) : null;
    const trimmed = overallMatch ? full.slice(0, overallMatch.index).trim() : full;
    const sections = trimmed
      .split(/\n(?=MLB\s*-\s*)/g)
      .map((part) => part.trim())
      .filter(Boolean);

    return {
      sections: batch.map((row, index) => sections[index] || ''),
      overallScore,
      fullText: full
    };
  }

  function createZeroFilledVault() { return {}; }

  async function streamingIngress(rows, stateRef = null, hooks = {}) {
    const batch = (rows || []).slice(0, 24).map((row, index) => ({ ...row, idx: Number(row?.idx || index + 1), LEG_ID: row?.LEG_ID || `LEG-${index + 1}` }));
    const log = loggerFor(stateRef);
    const apiKey = getSavedKey();
    if (!apiKey) {
      const failure = buildIngressErrorResult(batch[0] || {}, 'Missing Gemini API key.', 401);
      return { results: batch.map((row) => buildIngressErrorResult(row, 'Missing Gemini API key.', 401)), lastResult: failure, overallScore: null, rawText: '' };
    }

    hooks.onStart?.({ totalRows: batch.length, totalProbes: batch.length });
    log({ level: 'info', text: `[ALPHADOG] Starting ${SYSTEM_VERSION} for ${batch.length} leg(s).` });
    const attemptResult = await retryWithBackoff((model) => buildPayload(model, batch), apiKey, log);
    const rawText = extractTextFromResponse(attemptResult?.data) || String(attemptResult?.text || '').trim();

    if (!attemptResult?.response?.ok || !rawText) {
      const detail = attemptResult?.data?.error?.message || attemptResult?.text || 'Connector request failed.';
      const results = batch.map((row) => buildIngressErrorResult(row, detail, Number(attemptResult?.response?.status) || 0));
      results.forEach((result, index) => hooks.onRowComplete?.({ row: batch[index], rowIndex: index, result, completedRows: index + 1, totalRows: batch.length, completedProbes: index + 1, totalProbes: batch.length }));
      const lastResult = results[results.length - 1] || null;
      hooks.onComplete?.({ results, totalRows: batch.length, lastResult });
      return { results, lastResult, overallScore: null, rawText: '' };
    }

    const split = splitLegSections(rawText, batch);
    const results = batch.map((row, index) => {
      const section = split.sections[index] || '';
      const parsed = parseAlphaDogCard(section, row);
      const result = {
        row,
        ok: true,
        status: Number(attemptResult?.response?.status) || 200,
        rawText: parsed.rawText,
        overallScore: split.overallScore,
        card: parsed,
        logs: [{ level: 'success', text: `[ALPHADOG] ${row.parsedPlayer || row.LEG_ID}: audited via ${attemptResult.model}.` }],
        analysisHint: `Model ${attemptResult.model} completed AlphaDog categorical audit.`,
        runStatus: 'COMPLETE',
        finalized: true
      };
      hooks.onRowComplete?.({ row, rowIndex: index, result, completedRows: index + 1, totalRows: batch.length, completedProbes: index + 1, totalProbes: batch.length });
      return result;
    });
    const lastResult = results[results.length - 1] || null;
    hooks.onComplete?.({ results, totalRows: batch.length, lastResult });
    return { results, lastResult, overallScore: split.overallScore, rawText: split.fullText };
  }

  async function debugConnection() {
    const apiKey = getSavedKey();
    if (!apiKey) return { ok: false, status: 401, errorText: 'Missing Gemini API key.' };
    const payload = {
      model: FALLBACK_MODEL,
      contents: [{ role: 'user', parts: [{ text: 'Reply with the single word OK.' }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8, responseMimeType: 'text/plain' }
    };
    try {
      const result = await postToConnector(payload, apiKey);
      const text = extractTextFromResponse(result.data) || result.text || '';
      return { ok: Boolean(result.response?.ok), status: Number(result.response?.status) || 0, text, errorText: result.data?.error?.message || (!result.response?.ok ? result.text : '') };
    } catch (error) {
      return { ok: false, status: 0, errorText: String(error?.message || error) };
    }
  }

  async function analyzeRow(row, stateRef = null) {
    const res = await streamingIngress([row], stateRef, {});
    return res?.results?.[0] || null;
  }
  async function minePlayer(row, stateRef = null, hooks = {}) {
    const res = await streamingIngress([row], stateRef, hooks);
    return res?.results?.[0] || null;
  }
  async function fetchGeminiBatch(batch) { return streamingIngress(batch || [], null, {}); }
  function extractJsonBlock(value) { return String(value || '').trim(); }
  function computeShieldFromVault() { return {}; }
  function detectSyntheticPattern() { return { flagged: false, retryable: false, reason: '' }; }
  function validateGeminiPayload() { return { ok: true, reason: '' }; }
  async function neutronSearch() { return []; }
  async function performGroundedMining() { return null; }

  Object.assign(window.PickCalcConnectors, {
    SYSTEM_VERSION,
    CURRENT_SEASON,
    BRANCH_TARGETS,
    BRANCH_KEYS,
    PROVIDERS,
    FACTOR_NAMES,
    normalizeName,
    createZeroFilledVault,
    createZeroVault: createZeroFilledVault,
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
    parseAlphaDogCard
  });
})();
