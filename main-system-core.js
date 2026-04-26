window.PickCalcCore = (() => {
  const Parser = window.PickCalcParser;
  const UI = window.PickCalcUI;
  const Connectors = window.PickCalcConnectors;
  const SYSTEM_VERSION = 'v13.78.05 (OXYGEN-COBALT) • Main-1C DB Wiring Starter';

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
    slateDate: ''
  };

  function setAnalyzeButtonState() {
    const analyzeBtn = UI.el('analyzeBtn');
    if (analyzeBtn) analyzeBtn.disabled = state.cleanPool.length === 0;
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
  }

  async function refreshBackendHealth() {
    const slateInput = UI.el('slateDateInput');
    const backendUrlInput = UI.el('backendUrlInput');
    const tokenInput = UI.el('backendTokenInput');

    if (backendUrlInput && Connectors) Connectors.setBackendUrl(backendUrlInput.value);
    if (tokenInput && Connectors) Connectors.setToken(tokenInput.value);
    state.slateDate = slateInput && Connectors ? Connectors.setSlateDate(slateInput.value) : (Connectors?.getSlateDate() || '');

    UI.renderBackendStatus({ loading: true, slateDate: state.slateDate });

    if (!Connectors?.getDailyHealth) {
      state.backendHealth = { ok: false, error: 'Connector module missing getDailyHealth' };
      UI.renderBackendStatus(state.backendHealth);
      return state.backendHealth;
    }

    state.backendHealth = await Connectors.getDailyHealth(state.slateDate);
    UI.renderBackendStatus(state.backendHealth);
    return state.backendHealth;
  }

  async function runDatabaseWiringPass() {
    if (!state.cleanPool.length || state.backendBusy) return;
    state.backendBusy = true;

    UI.renderAnalysisScreen(state.cleanPool, state.miningVault, state.backendHealth);

    for (let i = 0; i < state.cleanPool.length; i++) {
      const row = state.cleanPool[i];
      const key = getRowKey(row, i);
      state.miningVault[key] = Connectors.stampVault({
        status: 'checking_backend',
        family: Connectors.normalizePropFamily(row),
        packet_status: 'queued',
        score_status: 'queued',
        warnings: [],
        payload: Connectors.buildLegPayload(row, state.slateDate)
      });
      UI.renderAnalysisScreen(state.cleanPool, state.miningVault, state.backendHealth);

      try {
        state.miningVault[key] = await Connectors.analyzeLeg(row, state.slateDate);
      } catch (err) {
        state.miningVault[key] = Connectors.stampVault({
          status: 'frontend_adapter_error',
          family: Connectors.normalizePropFamily(row),
          packet_status: 'error',
          score_status: 'error',
          warnings: [String(err?.message || err)],
          error: String(err?.message || err),
          payload: Connectors.buildLegPayload(row, state.slateDate)
        });
      }

      UI.renderAnalysisScreen(state.cleanPool, state.miningVault, state.backendHealth);
    }

    state.backendBusy = false;
  }

  async function openAnalysisScreen() {
    if (!state.cleanPool.length) {
      UI.showToast('Ingest at least one leg before opening Screen 2');
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
    UI.renderFeedStatus(state.cleanPool, state.auditRows);
    UI.renderPoolTable(state.cleanPool);
    setAnalyzeButtonState();
  }

  function ingestBoard() {
    const input = UI.el('boardInput');
    const messageMount = UI.el('ingestMessage');
    const raw = input?.value || '';

    if (!raw.trim()) {
      if (messageMount) messageMount.textContent = 'Paste board text to ingest.';
      return;
    }

    const parsed = Parser.parseBoard(raw);
    let rows = Array.isArray(parsed.rows) ? parsed.rows.slice() : [];
    const availableSlots = Math.max(0, 16 - state.cleanPool.length);

    if (availableSlots <= 0) {
      UI.showToast('You reached the 16 legs limit per run');
      if (messageMount) messageMount.textContent = '16-leg limit reached.';
      return;
    }

    if (rows.length > availableSlots) {
      rows = rows.slice(0, availableSlots);
      UI.showToast('You reached the 16 legs limit per run');
    }

    if (rows.length > 0 && input) {
      input.value = '';
    }

    state.auditRows = parsed.audit || [];
    state.rows = state.cleanPool.concat(rows);
    state.cleanPool = state.rows.slice();
    state.miningVault = {};

    UI.renderFeedStatus(state.cleanPool, state.auditRows);
    UI.renderPoolTable(state.cleanPool);
    setAnalyzeButtonState();

    if (messageMount) {
      messageMount.textContent = rows.length
        ? `Accepted ${rows.length} line(s). Pool now has ${state.cleanPool.length} leg(s).`
        : 'No valid MLB legs found.';
    }
  }

  function handleResetAll() {
    state.rows = [];
    state.cleanPool = [];
    state.auditRows = [];
    state.miningVault = {};
    state.backendHealth = null;
    state.backendBusy = false;
    localStorage.removeItem('pickcalc.slateDate');

    const input = UI.el('boardInput');
    const messageMount = UI.el('ingestMessage');
    if (input) input.value = '';
    if (messageMount) messageMount.textContent = '';

    UI.renderFeedStatus([]);
    UI.renderPoolTable([]);
    UI.renderBackendStatus(null);
    UI.renderAnalysisScreen([], {}, null);
    setAnalyzeButtonState();
    showScreen('ingest');
    UI.showToast('System reset');
  }

  function bindEvents() {
    const ingestBtn = UI.el('ingestBtn');
    const analyzeBtn = UI.el('analyzeBtn');
    const resetBtn = UI.el('resetBtn');
    const backToIngestBtn = UI.el('backToIngestBtn');
    const analysisResetBtn = UI.el('analysisResetBtn');
    const refreshBackendBtn = UI.el('refreshBackendBtn');
    const rerunBackendBtn = UI.el('rerunBackendBtn');

    if (ingestBtn) ingestBtn.addEventListener('click', ingestBoard);
    if (analyzeBtn) analyzeBtn.addEventListener('click', openAnalysisScreen);
    if (resetBtn) resetBtn.addEventListener('click', handleResetAll);
    if (backToIngestBtn) backToIngestBtn.addEventListener('click', openIngestScreen);
    if (analysisResetBtn) analysisResetBtn.addEventListener('click', handleResetAll);
    if (refreshBackendBtn) refreshBackendBtn.addEventListener('click', refreshBackendHealth);
    if (rerunBackendBtn) rerunBackendBtn.addEventListener('click', async () => {
      state.miningVault = {};
      await refreshBackendHealth();
      await runDatabaseWiringPass();
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    showScreen('ingest');
    UI.hydrateBackendControls(Connectors);
    UI.renderFeedStatus([]);
    UI.renderPoolTable([]);
    UI.renderBackendStatus(null);
    UI.renderAnalysisScreen([], {}, null);
    setAnalyzeButtonState();
  });

  return {
    state,
    ingestBoard,
    handleResetAll,
    openAnalysisScreen,
    openIngestScreen,
    refreshBackendHealth,
    runDatabaseWiringPass
  };
})();
