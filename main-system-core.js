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
    miningVault: {}
  };

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
    UI.showToast('System reset');
  }

  function bindEvents() {
    const ingestBtn = UI.el('ingestBtn');
    const resetBtn = UI.el('resetBtn');
    if (ingestBtn) ingestBtn.addEventListener('click', ingestBoard);
    if (resetBtn) resetBtn.addEventListener('click', handleResetAll);
  }

  window.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    UI.renderFeedStatus([]);
    UI.renderPoolTable([]);
  });

  return {
    state,
    ingestBoard,
    handleResetAll
  };
})();