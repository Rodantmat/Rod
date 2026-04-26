window.PickCalcCore = (() => {
  const Parser = window.PickCalcParser;
  const UI = window.PickCalcUI;
  const Connectors = window.PickCalcConnectors;
  const SYSTEM_VERSION = 'v13.78.05 (OXYGEN-COBALT) • Main-1D Report Log Guard';

  const state = {
    version: SYSTEM_VERSION,
    rows: [],
    cleanPool: [],
    auditRows: [],
    selectedLeagues: ['MLB'],
    miningVault: {},
    activeScreen: 'ingest',
    backendHealth: null,
    backendBusy: false,
    slateDate: '',
    systemLog: []
  };

  function nowStamp() {
    return new Date().toLocaleTimeString([], { hour12: false });
  }

  function safeDetail(value) {
    if (value === undefined || value === null || value === '') return '';
    if (typeof value === 'string') return value.length > 1200 ? `${value.slice(0, 1200)}… [truncated]` : value;
    try {
      const text = JSON.stringify(value, null, 2);
      return text.length > 1200 ? `${text.slice(0, 1200)}… [truncated]` : text;
    } catch {
      return String(value);
    }
  }

  function logEvent(level, message, detail = '') {
    state.systemLog.push({
      time: nowStamp(),
      iso: new Date().toISOString(),
      level: level || 'info',
      message: message || '',
      detail: safeDetail(detail)
    });
    if (state.systemLog.length > 200) state.systemLog = state.systemLog.slice(-200);
    UI.renderSystemLog(state.systemLog);
  }

  function renderAll() {
    UI.renderFeedStatus(state.cleanPool, state.auditRows);
    UI.renderPoolTable(state.cleanPool);
    UI.renderBackendStatus(state.backendHealth);
    UI.renderAnalysisScreen(state.cleanPool, state.miningVault, state.backendHealth);
    UI.renderSystemLog(state.systemLog);
    setAnalyzeButtonState();
  }

  function setAnalyzeButtonState() {
    const analyzeBtn = UI.el('analyzeBtn');
    if (analyzeBtn) analyzeBtn.disabled = state.cleanPool.length === 0;
  }

  function setButtonBusy(id, busy, labelWhenBusy = '') {
    const button = UI.el(id);
    if (!button) return;
    if (busy) {
      button.dataset.originalText = button.dataset.originalText || button.textContent;
      if (labelWhenBusy) button.textContent = labelWhenBusy;
      button.disabled = true;
    } else {
      if (button.dataset.originalText) button.textContent = button.dataset.originalText;
      button.disabled = false;
    }
  }

  function getRowKey(row, index = 0) {
    return String(row?.LEG_ID || row?.id || row?.idx || index + 1);
  }

  function showScreen(screenName) {
    const screenOne = UI.el('screenOne');
    const screenTwo = UI.el('screenTwo');
    state.activeScreen = screenName;

    if (screenOne) {
      const isIngest = screenName === 'ingest';
      screenOne.hidden = !isIngest;
      screenOne.classList.toggle('screen-active', isIngest);
    }

    if (screenTwo) {
      const isAnalysis = screenName === 'analysis';
      screenTwo.hidden = !isAnalysis;
      screenTwo.classList.toggle('screen-active', isAnalysis);
    }

    logEvent('info', `Screen changed to ${screenName}`);
  }

  function syncBackendControls() {
    const slateInput = UI.el('slateDateInput');
    const backendUrlInput = UI.el('backendUrlInput');
    const tokenInput = UI.el('backendTokenInput');

    if (backendUrlInput && Connectors) Connectors.setBackendUrl(backendUrlInput.value);
    if (tokenInput && Connectors) Connectors.setToken(tokenInput.value);
    state.slateDate = slateInput && Connectors ? Connectors.setSlateDate(slateInput.value) : (Connectors?.getSlateDate() || '');
  }

  async function refreshBackendHealth() {
    logEvent('info', 'Refresh Daily Health clicked / started');
    setButtonBusy('refreshBackendBtn', true, 'Checking Daily Health…');
    syncBackendControls();

    UI.renderBackendStatus({ loading: true, slateDate: state.slateDate });
    UI.renderSystemLog(state.systemLog);

    if (!Connectors?.getDailyHealth) {
      state.backendHealth = { ok: false, error: 'Connector module missing getDailyHealth' };
      UI.renderBackendStatus(state.backendHealth);
      logEvent('error', 'Daily Health failed before request', state.backendHealth.error);
      setButtonBusy('refreshBackendBtn', false);
      return state.backendHealth;
    }

    state.backendHealth = await Connectors.getDailyHealth(state.slateDate);
    UI.renderBackendStatus(state.backendHealth);

    if (state.backendHealth?.ok) {
      logEvent('success', 'Daily Health returned OK', {
        version: state.backendHealth.version,
        status: state.backendHealth.status,
        slate_date: state.backendHealth.slate_date,
        table_checks: state.backendHealth.table_checks?.length || 0
      });
    } else {
      logEvent('error', 'Daily Health returned failure', state.backendHealth?.error || state.backendHealth?.raw || 'unknown error');
    }

    setButtonBusy('refreshBackendBtn', false);
    return state.backendHealth;
  }

  async function runDatabaseWiringPass() {
    if (!state.cleanPool.length) {
      logEvent('warn', 'DB wiring skipped: no parsed legs');
      return;
    }
    if (state.backendBusy) {
      logEvent('warn', 'DB wiring skipped: backend pass already running');
      return;
    }

    state.backendBusy = true;
    setButtonBusy('rerunBackendBtn', true, 'Running DB Wiring…');
    logEvent('info', `DB wiring pass started for ${state.cleanPool.length} leg(s)`);

    UI.renderAnalysisScreen(state.cleanPool, state.miningVault, state.backendHealth);
    UI.renderSystemLog(state.systemLog);

    for (let i = 0; i < state.cleanPool.length; i++) {
      const row = state.cleanPool[i];
      const key = getRowKey(row, i);
      const family = Connectors.normalizePropFamily(row);
      const payload = Connectors.buildLegPayload(row, state.slateDate);

      state.miningVault[key] = Connectors.stampVault({
        status: 'checking_backend',
        family,
        packet_status: 'queued',
        score_status: 'queued',
        warnings: [],
        payload
      });

      logEvent('info', `Leg ${i + 1} queued for backend probe`, payload);
      UI.renderAnalysisScreen(state.cleanPool, state.miningVault, state.backendHealth);

      try {
        const result = await Connectors.analyzeLeg(row, state.slateDate);
        state.miningVault[key] = result;

        const packetOk = result?.packet_status === 'ok';
        const scoreOk = result?.score_status === 'ok';
        if (packetOk || scoreOk) {
          logEvent('success', `Leg ${i + 1} backend probe completed`, {
            family: result.family,
            status: result.status,
            packet_status: result.packet_status,
            score_status: result.score_status,
            warnings: result.warnings || []
          });
        } else {
          logEvent('warn', `Leg ${i + 1} backend probe completed with endpoint issue`, {
            family: result.family,
            status: result.status,
            packet_status: result.packet_status,
            score_status: result.score_status,
            warnings: result.warnings || []
          });
        }
      } catch (err) {
        state.miningVault[key] = Connectors.stampVault({
          status: 'frontend_adapter_error',
          family,
          packet_status: 'error',
          score_status: 'error',
          warnings: [String(err?.message || err)],
          error: String(err?.message || err),
          payload
        });
        logEvent('error', `Leg ${i + 1} frontend adapter error`, String(err?.message || err));
      }

      UI.renderAnalysisScreen(state.cleanPool, state.miningVault, state.backendHealth);
    }

    state.backendBusy = false;
    setButtonBusy('rerunBackendBtn', false);
    logEvent('success', 'DB wiring pass finished');
  }

  async function openAnalysisScreen() {
    if (!state.cleanPool.length) {
      UI.showToast('Ingest at least one leg before opening Screen 2');
      logEvent('warn', 'Screen 2 blocked: no ingested legs');
      return;
    }

    UI.renderAnalysisScreen(state.cleanPool, state.miningVault, state.backendHealth);
    showScreen('analysis');
    UI.hydrateBackendControls(Connectors);
    await refreshBackendHealth();
    await runDatabaseWiringPass();
  }

  function openIngestScreen() {
    showScreen('ingest');
    renderAll();
  }

  function ingestBoard() {
    const input = UI.el('boardInput');
    const messageMount = UI.el('ingestMessage');
    const raw = input?.value || '';

    if (!raw.trim()) {
      if (messageMount) messageMount.textContent = 'Paste board text to ingest.';
      logEvent('warn', 'Ingest skipped: empty board text');
      return;
    }

    logEvent('info', 'Ingest started', `Raw characters: ${raw.length}`);
    const parsed = Parser.parseBoard(raw);
    let rows = Array.isArray(parsed.rows) ? parsed.rows.slice() : [];
    const availableSlots = Math.max(0, 16 - state.cleanPool.length);

    if (availableSlots <= 0) {
      UI.showToast('You reached the 16 legs limit per run');
      if (messageMount) messageMount.textContent = '16-leg limit reached.';
      logEvent('warn', 'Ingest blocked: 16-leg limit reached');
      return;
    }

    if (rows.length > availableSlots) {
      rows = rows.slice(0, availableSlots);
      UI.showToast('You reached the 16 legs limit per run');
      logEvent('warn', 'Ingest trimmed to available slots', `Accepted only ${availableSlots} remaining slot(s).`);
    }

    if (rows.length > 0 && input) input.value = '';

    state.auditRows = parsed.audit || [];
    state.rows = state.cleanPool.concat(rows);
    state.cleanPool = state.rows.slice();
    state.miningVault = {};

    renderAll();

    if (messageMount) {
      messageMount.textContent = rows.length
        ? `Accepted ${rows.length} line(s). Pool now has ${state.cleanPool.length} leg(s).`
        : 'No valid MLB legs found.';
    }

    logEvent(rows.length ? 'success' : 'warn', rows.length ? 'Ingest completed' : 'Ingest found no valid MLB legs', {
      accepted: rows.length,
      pool: state.cleanPool.length,
      rejected: Array.isArray(parsed.audit?.rejectedLines) ? parsed.audit.rejectedLines.length : 0,
      props: rows.map((row) => ({ player: row.parsedPlayer, team: row.team, opponent: row.opponent, prop: row.prop, line: row.line }))
    });
  }

  function handleResetAll() {
    state.rows = [];
    state.cleanPool = [];
    state.auditRows = [];
    state.miningVault = {};
    state.backendHealth = null;
    state.backendBusy = false;
    state.systemLog = [];
    localStorage.removeItem('pickcalc.slateDate');

    const input = UI.el('boardInput');
    const messageMount = UI.el('ingestMessage');
    if (input) input.value = '';
    if (messageMount) messageMount.textContent = '';

    renderAll();
    showScreen('ingest');
    logEvent('info', 'System reset complete');
    UI.showToast('System reset');
  }

  async function copyDebugReport() {
    const reportText = UI.buildDebugReport({
      version: SYSTEM_VERSION,
      backendUrl: Connectors?.getBackendUrl ? Connectors.getBackendUrl() : 'UNKNOWN',
      state
    });
    const ok = await UI.copyTextToClipboard(reportText);
    if (ok) {
      logEvent('success', 'Debug report copied to clipboard', `Characters copied: ${reportText.length}`);
      UI.showToast('Debug report copied');
    } else {
      logEvent('error', 'Debug report copy failed', 'Browser clipboard API rejected copy. Select/copy manually from report output if needed.');
      UI.showToast('Could not copy report');
    }
  }

  function bindEvents() {
    const ingestBtn = UI.el('ingestBtn');
    const analyzeBtn = UI.el('analyzeBtn');
    const resetBtn = UI.el('resetBtn');
    const backToIngestBtn = UI.el('backToIngestBtn');
    const analysisResetBtn = UI.el('analysisResetBtn');
    const refreshBackendBtn = UI.el('refreshBackendBtn');
    const rerunBackendBtn = UI.el('rerunBackendBtn');
    const copyReportBtn = UI.el('copyReportBtn');
    const copyReportBottomBtn = UI.el('copyReportBottomBtn');

    if (ingestBtn) ingestBtn.addEventListener('click', ingestBoard);
    if (analyzeBtn) analyzeBtn.addEventListener('click', openAnalysisScreen);
    if (resetBtn) resetBtn.addEventListener('click', handleResetAll);
    if (backToIngestBtn) backToIngestBtn.addEventListener('click', openIngestScreen);
    if (analysisResetBtn) analysisResetBtn.addEventListener('click', handleResetAll);
    if (refreshBackendBtn) refreshBackendBtn.addEventListener('click', refreshBackendHealth);
    if (rerunBackendBtn) rerunBackendBtn.addEventListener('click', async () => {
      logEvent('info', 'Re-run DB Wiring clicked');
      state.miningVault = {};
      await refreshBackendHealth();
      await runDatabaseWiringPass();
    });
    if (copyReportBtn) copyReportBtn.addEventListener('click', copyDebugReport);
    if (copyReportBottomBtn) copyReportBottomBtn.addEventListener('click', copyDebugReport);
  }

  window.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    showScreen('ingest');
    UI.hydrateBackendControls(Connectors);
    renderAll();
    logEvent('info', 'Main system booted', SYSTEM_VERSION);
  });

  return {
    state,
    ingestBoard,
    handleResetAll,
    openAnalysisScreen,
    openIngestScreen,
    refreshBackendHealth,
    runDatabaseWiringPass,
    copyDebugReport,
    logEvent
  };
})();
