window.PickCalcConnectors = (() => {
  const SYSTEM_VERSION = 'v13.78.10 (OXYGEN-COBALT) • Main-1N.4 Goblin Triple Tap';
  const DEFAULT_BACKEND_URL = 'https://alphadog-main-api-v100.rodolfoaamattos.workers.dev';
  const STORAGE_KEYS = {
    backendUrl: 'pickcalc.backendUrl',
    ingestToken: 'pickcalc.ingestToken',
    slateDate: 'pickcalc.slateDate',
    legacyBackendUrl: 'pickcalc.legacyBackendUrl'
  };

  function purgeLegacyBackendStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.backendUrl);
      if (stored && stored !== DEFAULT_BACKEND_URL) {
        localStorage.setItem(STORAGE_KEYS.legacyBackendUrl, stored);
      }
      localStorage.setItem(STORAGE_KEYS.backendUrl, DEFAULT_BACKEND_URL);
      localStorage.removeItem(STORAGE_KEYS.ingestToken);
    } catch {}
  }

  function isLegacyScheduledWorkerUrl(value) {
    return String(value || '').includes('prop-ingestion-git.rodolfoaamattos.workers.dev');
  }

  function cleanBaseUrl() {
    purgeLegacyBackendStorage();
    return DEFAULT_BACKEND_URL;
  }

  function getBackendUrl() {
    purgeLegacyBackendStorage();
    return DEFAULT_BACKEND_URL;
  }

  function setBackendUrl() {
    purgeLegacyBackendStorage();
    return DEFAULT_BACKEND_URL;
  }

  function forceBackendUrlInputToMainApi() {
    purgeLegacyBackendStorage();
    const input = document.getElementById('backendUrlInput');
    if (input) input.value = DEFAULT_BACKEND_URL;
    return DEFAULT_BACKEND_URL;
  }

  function getToken() {
    return '';
  }

  function setToken() {
    try { localStorage.removeItem(STORAGE_KEYS.ingestToken); } catch {}
    return '';
  }

  function getSlateDate() {
    return '';
  }

  function setSlateDate() {
    try { localStorage.removeItem(STORAGE_KEYS.slateDate); } catch {}
    return '';
  }

  function stampVault(vault = {}) {
    vault.isReal = true;
    vault.source = 'main_system_db_adapter';
    vault.version = SYSTEM_VERSION;
    return vault;
  }

  function normalizePropFamily(row = {}) {
    const prop = String(row.prop || '').toLowerCase().trim();
    if (prop.includes('rbi') || prop.includes('runs batted')) return 'RBI';
    if (prop === 'hits' || prop.includes('hits')) return 'HITS';
    if (prop.includes('run first inning') || prop.includes('rfi')) return 'RFI';
    if (prop.includes('strikeout') || prop === 'ks' || prop.includes('pitcher strikeouts')) return 'PITCHER_KS';
    if (prop.includes('total bases')) return 'TOTAL_BASES';
    if (prop === 'runs' || prop.includes('runs')) return 'RUNS';
    if (prop.includes('home run')) return 'HOME_RUNS';
    return 'UNWIRED';
  }

  function buildLegPayload(row = {}, slateDate = '') {
    const family = normalizePropFamily(row);
    return {
      source: 'main_system_screen2',
      source_version: SYSTEM_VERSION,
      slate_date: slateDate || undefined,
      leg_id: row.LEG_ID || row.id || row.idx || null,
      row_index: row.idx || null,
      player_name: row.parsedPlayer || row.player_name || row.player || '',
      team_id: row.team || row.team_id || '',
      opponent_team: row.opponent || row.opponent_team || '',
      prop_type: row.prop || '',
      prop_family: family,
      line: row.line || '',
      side: row.direction || row.side || row.type || '',
      game_time_text: row.gameTimeText || '',
      raw_row: row
    };
  }

  async function requestJson(path, options = {}) {
    const baseUrl = cleanBaseUrl(options.backendUrl || forceBackendUrlInputToMainApi());
    const url = new URL(path, baseUrl + '/');
    if (options.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          url.searchParams.set(key, String(value).trim());
        }
      });
    }

    const headers = { 'content-type': 'application/json' };
    const token = options.token !== undefined ? String(options.token || '').trim() : getToken();
    if (token) headers['x-ingest-token'] = token;

    const fetchOptions = {
      method: options.method || 'GET',
      headers
    };
    if (options.body !== undefined) fetchOptions.body = JSON.stringify(options.body);

    const startedAt = new Date().toISOString();
    try {
      const res = await fetch(url.toString(), fetchOptions);
      let body = null;
      try { body = await res.json(); } catch { body = { ok: false, error: 'Response was not valid JSON' }; }
      return {
        ok: res.ok && body?.ok !== false,
        http_status: res.status,
        url: url.toString(),
        body,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        error: res.ok ? null : (body?.error || `HTTP ${res.status}`)
      };
    } catch (err) {
      return {
        ok: false,
        http_status: 0,
        url: url.toString(),
        body: null,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        error: String(err?.message || err)
      };
    }
  }

  async function getDailyHealth(slateDate = '') {
    const result = await requestJson('/main/health', {
      method: 'GET',
      query: slateDate ? { slate_date: slateDate } : {}
    });
    const body = result.body?.body || result.body || {};
    return {
      ok: result.ok,
      source: 'health/daily',
      version: body.version || null,
      slate_date: body.slate_date || slateDate || null,
      status: body.status || null,
      table_checks: body.table_checks || [],
      scheduled: body.scheduled || null,
      summary: body.summary || null,
      raw: result,
      error: result.error || body.error || null
    };
  }

  async function getLegPacket(row = {}, slateDate = '') {
    const payload = buildLegPayload(row, slateDate);
    const result = await requestJson('/main/packet/leg', { method: 'POST', body: payload });
    const body = result.body?.body || result.body || {};
    return {
      ok: result.ok,
      source: 'packet/leg',
      family: payload.prop_family,
      payload,
      result,
      packet: body.packet || body,
      error: result.error || body.error || null
    };
  }

  async function scoreLeg(row = {}, slateDate = '') {
    const payload = buildLegPayload(row, slateDate);
    const result = await requestJson('/main/score/leg', { method: 'POST', body: payload });
    const body = result.body?.body || result.body || {};
    return {
      ok: result.ok,
      source: 'score/leg',
      family: payload.prop_family,
      payload,
      result,
      score: body.score_output || body.score || body,
      error: result.error || body.error || null
    };
  }


  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const GEMINI_PROMPT_KEYS = ['A', 'B', 'C', 'D', 'E'];

  function summarizeGeminiPrompts(prompts = []) {
    const allFactors = prompts.flatMap((prompt) => Array.isArray(prompt?.factors) ? prompt.factors : []);
    const okPrompts = prompts.filter((prompt) => prompt?.ok).length;
    const failedPrompts = prompts.filter((prompt) => !prompt?.ok).length;
    const total = allFactors.length;
    const avg = total ? Number((allFactors.reduce((sum, factor) => sum + Number(factor.score_0_100 || factor.score || 0), 0) / total).toFixed(1)) : 0;
    return {
      total_prompts: prompts.length,
      ok_prompts: okPrompts,
      failed_prompts: failedPrompts,
      partial_success: okPrompts > 0 && failedPrompts > 0,
      total_factors: total,
      green_count: allFactors.filter((factor) => String(factor.signal || '').toUpperCase() === 'GREEN').length,
      yellow_count: allFactors.filter((factor) => String(factor.signal || '').toUpperCase() === 'YELLOW').length,
      red_count: allFactors.filter((factor) => String(factor.signal || '').toUpperCase() === 'RED').length,
      average_factor_score: avg,
      final_scoring_status: 'not_final_matrix_fill_only'
    };
  }

  function normalizePromptFromResponse(body = {}, promptKey = '') {
    const prompt = body.prompt || (Array.isArray(body.prompts) ? body.prompts[0] : null) || body;
    return {
      ...prompt,
      prompt_key: prompt.prompt_key || promptKey,
      ok: !!prompt.ok,
      status: prompt.status || (prompt.ok ? 'ok' : 'failed'),
      error: prompt.error || body.error || body.error_context?.message || null,
      error_context: body.error_context || prompt.error_context || null
    };
  }

  function friendlyGeminiError(prompts = []) {
    const text = prompts.map((prompt) => `${prompt?.error || ''} ${prompt?.error_context?.message || ''} ${(prompt?.attempts_log || []).map((a) => a.error || '').join(' ')}`).join(' ').toLowerCase();
    if (!text.trim()) return 'Gemini did not return a usable response. Try again in a few minutes.';
    if (text.includes('missing_gemini_api_key') || text.includes('api key')) return 'Gemini API key is missing or not available on the Worker.';
    if (text.includes('503') || text.includes('high demand') || text.includes('overload') || text.includes('busy')) return 'Gemini is busy now, try again in a few minutes.';
    if (text.includes('429') || text.includes('quota') || text.includes('rate')) return 'Gemini rate limit reached, try again in a few minutes.';
    if (text.includes('timeout') || text.includes('cancelled') || text.includes('abort')) return 'Gemini timed out, try again in a few minutes.';
    if (text.includes('malformed') || text.includes('json')) return 'Gemini returned malformed JSON. Try again.';
    if (text.includes('zero_payload') || text.includes('empty')) return 'Gemini returned an empty response. Try again.';
    return prompts.find((prompt) => prompt?.error)?.error || 'Gemini failed. Try again in a few minutes.';
  }

  async function getGeminiPrompt(row = {}, slateDate = '', promptKey = '') {
    const payload = { ...buildLegPayload(row, slateDate), prompt_key: promptKey };
    const result = await requestJson('/main/gemini/matrix/prompt', {
      method: 'POST',
      query: { prompt_key: promptKey },
      body: payload
    });
    const body = result.body?.body || result.body || {};
    const prompt = normalizePromptFromResponse(body, promptKey);
    return {
      ok: result.ok && !!prompt.ok,
      source: 'gemini/matrix/prompt',
      family: payload.prop_family,
      prompt_key: promptKey,
      payload,
      result,
      prompt,
      error: result.error || prompt.error || body.error_context?.message || body.error || null
    };
  }

  async function getGeminiMatrix(row = {}, slateDate = '', options = {}) {
    const payload = buildLegPayload(row, slateDate);
    const prompts = [];
    const prompt_results = [];
    const startedAt = new Date().toISOString();

    for (let index = 0; index < GEMINI_PROMPT_KEYS.length; index += 1) {
      const promptKey = GEMINI_PROMPT_KEYS[index];
      const percentBase = 58 + index * 6;
      if (options.onProgress) await options.onProgress({ task: `Gemini Prompt ${promptKey}`, percent: percentBase, status: 'running', detail: `retrieving Prompt ${promptKey}` });
      const one = await getGeminiPrompt(row, slateDate, promptKey);
      prompt_results.push(one);
      prompts.push(one.prompt);
      const detail = one.ok ? `success — Prompt ${promptKey}` : `error — ${friendlyGeminiError([one.prompt])}`;
      if (options.onProgress) await options.onProgress({ task: `Gemini Prompt ${promptKey}`, percent: percentBase + 5, status: one.ok ? 'success' : 'error', detail });
      await sleep(500);
    }

    const summary = summarizeGeminiPrompts(prompts);
    const ok = summary.ok_prompts > 0;
    const status = summary.failed_prompts === 0 ? 'ok' : (summary.ok_prompts > 0 ? 'partial_success' : 'failed');
    const errorMessage = ok ? null : friendlyGeminiError(prompts);
    return {
      ok,
      source: 'gemini/matrix/prompt_sequence',
      family: payload.prop_family,
      payload,
      result: {
        ok,
        http_status: prompt_results.some((item) => item.result?.http_status === 200) ? 200 : (prompt_results[0]?.result?.http_status || 0),
        url: prompt_results.map((item) => item.result?.url).filter(Boolean).join(' | '),
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        error: errorMessage
      },
      gemini: {
        ok,
        version: prompt_results.find((item) => item.result?.body?.version)?.result?.body?.version || null,
        worker: 'alphadog-main-api-v100',
        mode: 'gemini_a_e_matrix_prompt_sequence_no_final_scoring',
        route: '/main/gemini/matrix/prompt',
        leg: payload,
        status,
        summary,
        prompts,
        prompt_results: prompt_results.map((item) => ({ prompt_key: item.prompt_key, ok: item.ok, error: item.error, http_status: item.result?.http_status || null })),
        error_context: errorMessage ? { code: 'GEMINI_SEQUENCE_FAILED', message: errorMessage, is_retryable: true, suggested_wait_ms: 180000 } : null,
        started_at: startedAt,
        finished_at: new Date().toISOString()
      },
      error: errorMessage
    };
  }

  async function analyzeLeg(row = {}, slateDate = '', options = {}) {
    const family = normalizePropFamily(row);
    const vault = stampVault({
      status: 'database_wiring_started',
      family,
      supported_now: ['RFI', 'RBI', 'HITS'].includes(family),
      row,
      payload: buildLegPayload(row, slateDate),
      daily_health_dependency: 'required',
      packet_status: 'not_started',
      score_status: 'not_started',
      gemini_status: 'not_started',
      started_at: new Date().toISOString(),
      warnings: [],
      missing: [],
      derived_flags: []
    });

    if (!vault.supported_now) {
      vault.status = 'unsupported_family_pending_adapter';
      vault.packet_status = 'skipped';
      vault.score_status = 'skipped';
      vault.gemini_status = 'skipped';
      vault.warnings.push('Prop family is not wired to backend scoring yet.');
      vault.finished_at = new Date().toISOString();
      return vault;
    }

    if (options.onProgress) await options.onProgress({ task: 'Packet / MLB + D1', percent: 42, status: 'running', detail: 'retrieving packet' });
    const packet = await getLegPacket(row, slateDate);
    if (options.onProgress) await options.onProgress({ task: 'Packet / MLB + D1', percent: 48, status: packet.ok ? 'success' : 'error', detail: packet.ok ? 'success — packet received' : `error — ${packet.error || 'packet failed'}` });
    vault.packet_request = packet;
    vault.packet_status = packet.ok ? 'ok' : 'error';
    vault.packet = packet.packet;
    if (!packet.ok) vault.warnings.push(`Packet endpoint failed: ${packet.error || 'unknown error'}`);

    if (options.onProgress) await options.onProgress({ task: 'Matrix score placeholder', percent: 52, status: 'running', detail: 'retrieving score proof' });
    const score = await scoreLeg(row, slateDate);
    if (options.onProgress) await options.onProgress({ task: 'Matrix score placeholder', percent: 56, status: score.ok ? 'success' : 'error', detail: score.ok ? 'success — score proof received' : `error — ${score.error || 'score failed'}` });
    vault.score_request = score;
    vault.score_status = score.ok ? 'ok' : 'error';
    vault.score = score.score;
    if (!score.ok) vault.warnings.push(`Score endpoint failed: ${score.error || 'unknown error'}`);

    const gemini = await getGeminiMatrix(row, slateDate, options);
    vault.gemini_request = gemini;
    vault.gemini_status = gemini.ok ? (gemini.gemini?.status || 'ok') : 'error';
    vault.gemini = gemini.gemini;
    if (!gemini.ok) vault.warnings.push(`Gemini A-E endpoint failed: ${gemini.error || 'Gemini failed. Try again in a few minutes.'}`);

    vault.status = packet.ok || score.ok || gemini.ok ? 'backend_response_received' : 'backend_adapter_needs_worker_endpoint_fix';
    vault.finished_at = new Date().toISOString();
    return vault;
  }

  purgeLegacyBackendStorage();

  return {
    SYSTEM_VERSION,
    DEFAULT_BACKEND_URL,
    getBackendUrl,
    setBackendUrl,
    forceBackendUrlInputToMainApi,
    getToken,
    setToken,
    getSlateDate,
    setSlateDate,
    stampVault,
    normalizePropFamily,
    buildLegPayload,
    requestJson,
    getDailyHealth,
    getLegPacket,
    scoreLeg,
    getGeminiMatrix,
    analyzeLeg
  };
})();
