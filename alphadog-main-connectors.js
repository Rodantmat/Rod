window.PickCalcConnectors = (() => {
  const SYSTEM_VERSION = 'v13.78.05 (OXYGEN-COBALT) • Main-1G API URL Hard Lock';
  const DEFAULT_BACKEND_URL = 'https://alphadog-main-api-v100.rodolfoaamattos.workers.dev';
  const STORAGE_KEYS = {
    backendUrl: 'pickcalc.backendUrl',
    ingestToken: 'pickcalc.ingestToken',
    slateDate: 'pickcalc.slateDate'
  };

  function isLegacyScheduledWorkerUrl(value) {
    return String(value || '').includes('prop-ingestion-git.rodolfoaamattos.workers.dev');
  }

  function cleanBaseUrl(value) {
    const raw = String(value || '').trim().replace(/\/+$/, '');
    if (!raw || isLegacyScheduledWorkerUrl(raw)) return DEFAULT_BACKEND_URL;
    return raw;
  }

  function getBackendUrl() {
    const stored = localStorage.getItem(STORAGE_KEYS.backendUrl);
    const cleaned = cleanBaseUrl(stored || DEFAULT_BACKEND_URL);
    if (stored !== cleaned) localStorage.setItem(STORAGE_KEYS.backendUrl, cleaned);
    return cleaned;
  }

  function setBackendUrl(value) {
    const cleaned = cleanBaseUrl(value);
    localStorage.setItem(STORAGE_KEYS.backendUrl, cleaned);
    return cleaned;
  }

  function forceBackendUrlInputToMainApi() {
    const input = document.getElementById('backendUrlInput');
    const cleaned = setBackendUrl(input?.value || DEFAULT_BACKEND_URL);
    if (input && input.value !== cleaned) input.value = cleaned;
    return cleaned;
  }

  function getToken() {
    return String(localStorage.getItem(STORAGE_KEYS.ingestToken) || '').trim();
  }

  function setToken(value) {
    const cleaned = String(value || '').trim();
    if (cleaned) localStorage.setItem(STORAGE_KEYS.ingestToken, cleaned);
    else localStorage.removeItem(STORAGE_KEYS.ingestToken);
    return cleaned;
  }

  function getSlateDate() {
    return String(localStorage.getItem(STORAGE_KEYS.slateDate) || '').trim();
  }

  function setSlateDate(value) {
    const cleaned = String(value || '').trim();
    if (cleaned) localStorage.setItem(STORAGE_KEYS.slateDate, cleaned);
    else localStorage.removeItem(STORAGE_KEYS.slateDate);
    return cleaned;
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

  async function analyzeLeg(row = {}, slateDate = '') {
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
      started_at: new Date().toISOString(),
      warnings: [],
      missing: [],
      derived_flags: []
    });

    if (!vault.supported_now) {
      vault.status = 'unsupported_family_pending_adapter';
      vault.packet_status = 'skipped';
      vault.score_status = 'skipped';
      vault.warnings.push('Prop family is not wired to backend scoring yet.');
      vault.finished_at = new Date().toISOString();
      return vault;
    }

    const packet = await getLegPacket(row, slateDate);
    vault.packet_request = packet;
    vault.packet_status = packet.ok ? 'ok' : 'error';
    vault.packet = packet.packet;
    if (!packet.ok) vault.warnings.push(`Packet endpoint failed: ${packet.error || 'unknown error'}`);

    const score = await scoreLeg(row, slateDate);
    vault.score_request = score;
    vault.score_status = score.ok ? 'ok' : 'error';
    vault.score = score.score;
    if (!score.ok) vault.warnings.push(`Score endpoint failed: ${score.error || 'unknown error'}`);

    vault.status = packet.ok || score.ok ? 'backend_response_received' : 'backend_adapter_needs_worker_endpoint_fix';
    vault.finished_at = new Date().toISOString();
    return vault;
  }

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
    analyzeLeg
  };
})();
