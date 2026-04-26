window.PickCalcCore = (() => {
  const Parser = window.PickCalcParser;
  const UI = window.PickCalcUI;
  const SYSTEM_VERSION = 'v13.78.05 (OXYGEN-COBALT)';

  const state = {
    version: SYSTEM_VERSION,
    rows: [],
    cleanPool: [],
    auditRows: [],
    selectedLeagues: ['MLB'],
    miningVault: {},
    activeScreen: 'ingest'
  };

  function setAnalyzeButtonState() {
    const analyzeBtn = UI.el('analyzeBtn');
    if (analyzeBtn) analyzeBtn.disabled = state.cleanPool.length === 0;
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

  function openAnalysisScreen() {
    if (!state.cleanPool.length) {
      UI.showToast('Ingest at least one leg before opening Screen 2');
      return;
    }

    UI.renderAnalysisScreen(state.cleanPool, state.miningVault);
    showScreen('analysis');
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
    localStorage.clear();

    const input = UI.el('boardInput');
    const messageMount = UI.el('ingestMessage');
    if (input) input.value = '';
    if (messageMount) messageMount.textContent = '';

    UI.renderFeedStatus([]);
    UI.renderPoolTable([]);
    UI.renderAnalysisScreen([], {});
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
    if (ingestBtn) ingestBtn.addEventListener('click', ingestBoard);
    if (analyzeBtn) analyzeBtn.addEventListener('click', openAnalysisScreen);
    if (resetBtn) resetBtn.addEventListener('click', handleResetAll);
    if (backToIngestBtn) backToIngestBtn.addEventListener('click', openIngestScreen);
    if (analysisResetBtn) analysisResetBtn.addEventListener('click', handleResetAll);
  }

  window.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    showScreen('ingest');
    UI.renderFeedStatus([]);
    UI.renderPoolTable([]);
    UI.renderAnalysisScreen([], {});
    setAnalyzeButtonState();
  });

  return {
    state,
    ingestBoard,
    handleResetAll,
    openAnalysisScreen,
    openIngestScreen
  };
})();
