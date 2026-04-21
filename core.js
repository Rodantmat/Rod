window.PickCalcCore = window.PickCalcCore || {};
(() => {
  const Parser = window.PickCalcParser;
  const UI = window.PickCalcUI;
  const Connectors = window.PickCalcConnectors;
  const SYSTEM_VERSION = 'AlphaDog v0.0.1';
  const MAX_LEGS = 24;

  const state = {
    version: SYSTEM_VERSION,
    rows: [],
    cleanPool: [],
    auditRows: [],
    lastResult: null,
    ingestLogs: [],
    __liveLogs: []
  };

  function buildIngestLogs(auditRows) {
    const entries = [];
    asArray(auditRows).forEach((item) => {
      if (item?.accepted) entries.push({ level: 'info', text: `[PARSER] ACCEPTED: ${item.parsedPlayer || 'Unknown'} | ${item.prop || 'Unknown'} | ${item.line || '?'} | ${item.team || '—'} vs ${item.opponent || '—'}` });
    });
    const rejected = Array.isArray(auditRows?.rejectedLines) ? auditRows.rejectedLines.length : 0;
    if (rejected) entries.push({ level: 'warning', text: `[PARSER] REJECTED LINES: ${rejected}` });
    if (!entries.length) entries.push({ level: 'info', text: '[SYSTEM] Intake ready.' });
    return entries;
  }
  function asArray(value) { return Array.isArray(value) ? value : []; }

  function refreshIntake() {
    const rejectedCount = Array.isArray(state.auditRows?.rejectedLines) ? state.auditRows.rejectedLines.length : 0;
    UI.renderPoolCounts?.(state.cleanPool.length, rejectedCount);
    UI.renderFeedStatus?.(state.cleanPool, state.auditRows);
    UI.renderPoolTable?.(state.cleanPool);
    UI.renderConsole?.(state.ingestLogs);
  }

  function ingestBoard() {
    const input = UI.el('boardInput');
    if (!input || !input.value.trim()) return;
    const parsed = Parser.parseBoard(input.value, { dayScope: 'both' });
    const incoming = asArray(parsed.rows);
    const combined = [...state.cleanPool, ...incoming];
    const overflow = Math.max(0, combined.length - MAX_LEGS);
    state.cleanPool = combined.slice(0, MAX_LEGS).map((row, index) => ({
      ...row,
      idx: index + 1,
      LEG_ID: row.LEG_ID || `LEG-${index + 1}`
    }));
    state.rows = state.cleanPool.slice();
    state.auditRows = parsed.audit || [];
    state.lastResult = null;
    state.ingestLogs = buildIngestLogs(state.auditRows);
    input.value = '';
    refreshIntake();
    const message = UI.el('ingestMessage');
    if (message) message.textContent = incoming.length ? '' : 'No valid legs found. Check board format.';
    if (overflow > 0) UI.appendConsole?.({ level: 'warning', text: `[SYSTEM] Remaining ${overflow} legs ignored (${MAX_LEGS} Max)` });
  }

  async function handleMiningClick() {
    const rows = state.rows.slice(0, MAX_LEGS);
    if (!rows.length) {
      const message = UI.el('ingestMessage');
      if (message) message.textContent = 'Nothing to run. Paste and ingest at least one valid row.';
      return;
    }

    UI.showAnalysisScreen?.();
    UI.initProgressBar?.(0, rows.length, 'Submitting AlphaDog audit...');
    state.__liveLogs = [{ level: 'info', text: '[ALPHADOG] Run initialized.' }];
    UI.renderConsole?.(state.__liveLogs);
    const seedResult = {
      results: rows.map((row) => ({ row, card: { header: `${row.league || 'MLB'} - ${row.parsedPlayer} (${row.team || '—'}) @ ${row.opponent || '—'} - ${row.gameTimeText || row.selectedDate || '—'}`, propLine: `${row.line || '—'} ${row.prop || ''} ${row.direction || ''}`.trim(), rawText: '' } })),
      overallScore: null,
      logs: state.__liveLogs,
      analysisHint: 'Running AlphaDog categorical audit...'
    };
    UI.renderAnalysisResults?.(rows, state.auditRows, seedResult, state.version);

    try {
      const response = await Connectors.streamingIngress(rows, state, {
        onRowComplete: ({ completedRows, totalRows, result }) => {
          const partialResults = (state.lastResult?.results || []).slice();
          partialResults[result.row.idx - 1] = result;
          state.lastResult = {
            ...(state.lastResult || {}),
            results: partialResults.filter(Boolean),
            overallScore: state.lastResult?.overallScore ?? null,
            logs: state.__liveLogs,
            analysisHint: result.analysisHint || 'Streaming AlphaDog audit...'
          };
          UI.renderStreamUpdate?.(rows, state.auditRows, state.lastResult, state.version, { completedProbes: completedRows, totalProbes: totalRows });
        }
      });
      state.lastResult = {
        results: response.results,
        overallScore: response.overallScore,
        rawText: response.rawText,
        logs: state.__liveLogs,
        analysisHint: response.overallScore == null ? 'AlphaDog audit completed without batch footer score.' : 'AlphaDog categorical audit complete.'
      };
      UI.renderAnalysisResults?.(rows, state.auditRows, state.lastResult, state.version);
      UI.updateProgressBar?.(rows.length, rows.length, 'AlphaDog categorical audit complete.');
    } catch (error) {
      state.lastResult = {
        results: rows.map((row) => ({ row, card: { header: row.parsedPlayer || 'Unknown', propLine: `${row.line || '—'} ${row.prop || ''}`, rawText: String(error?.message || error) } })),
        overallScore: null,
        logs: [...state.__liveLogs, { level: 'warning', text: `[ALPHADOG] Run failed: ${error?.message || error}` }],
        analysisHint: String(error?.message || error)
      };
      UI.renderAnalysisResults?.(rows, state.auditRows, state.lastResult, state.version);
    }
  }

  function handleResetAll() {
    let preservedKey = '';
    try { preservedKey = String(window.__OXYGEN_GEMINI_KEY__ || localStorage.getItem('OXYGEN_GEMINI_KEY') || sessionStorage.getItem('OXYGEN_GEMINI_KEY') || '').trim(); } catch (_) {}
    state.rows = [];
    state.cleanPool = [];
    state.auditRows = [];
    state.lastResult = null;
    state.ingestLogs = [{ level: 'info', text: '[SYSTEM] Intake ready.' }];
    state.__liveLogs = [];
    ['boardInput','ingestMessage','feedStatus','poolMount','analysisSummary','analysisHint','analysisResultsBody','systemConsole','shieldPanel','progressBar','miningGrid'].forEach((id) => {
      const node = UI.el(id);
      if (!node) return;
      if ('value' in node) node.value = '';
      else node.innerHTML = '';
      if ('textContent' in node && id !== 'boardInput') node.textContent = '';
    });
    if (preservedKey) {
      try { window.__OXYGEN_GEMINI_KEY__ = preservedKey; } catch (_) {}
      try { localStorage.setItem('OXYGEN_GEMINI_KEY', preservedKey); } catch (_) {}
      try { sessionStorage.setItem('OXYGEN_GEMINI_KEY', preservedKey); } catch (_) {}
      const keyInput = document.getElementById('apiKeyInput');
      if (keyInput) keyInput.value = preservedKey;
    }
    UI.backToIntake?.();
    refreshIntake();
    UI.showToast?.('System reset complete.');
  }

  function bindEvents() {
    document.getElementById('debugConnectionBtn')?.addEventListener('click', async () => {
      const result = await Connectors.debugConnection();
      const text = result?.ok ? `[ALPHADOG] CONNECTOR OK: ${result.text || 'OK'}` : `[ALPHADOG] CONNECTOR FAIL: ${result?.errorText || 'Unknown error'}`;
      UI.renderConsole?.([{ level: result?.ok ? 'success' : 'warning', text }]);
    });
    document.getElementById('saveKeyBtn')?.addEventListener('click', () => {
      const key = document.getElementById('apiKeyInput')?.value?.trim();
      if (!key) return;
      localStorage.setItem('OXYGEN_GEMINI_KEY', key);
      try { sessionStorage.setItem('OXYGEN_GEMINI_KEY', key); } catch (_) {}
      try { window.__OXYGEN_GEMINI_KEY__ = key; } catch (_) {}
      UI.showToast?.('Key saved.');
    });
    const savedKey = window.__OXYGEN_GEMINI_KEY__ || localStorage.getItem('OXYGEN_GEMINI_KEY') || sessionStorage.getItem('OXYGEN_GEMINI_KEY');
    if (savedKey && document.getElementById('apiKeyInput')) {
      document.getElementById('apiKeyInput').value = savedKey;
      window.__OXYGEN_GEMINI_KEY__ = savedKey;
    }
    UI.el('ingestBtn')?.addEventListener('click', ingestBoard);
    UI.el('runBtn')?.addEventListener('click', () => handleMiningClick());
    UI.el('backBtn')?.addEventListener('click', () => UI.backToIntake());
    UI.el('clearBoxBtn')?.addEventListener('click', () => { if (UI.el('boardInput')) UI.el('boardInput').value = ''; });
    UI.el('resetAllBtn')?.addEventListener('click', handleResetAll);
    UI.el('copyBtn')?.addEventListener('click', async () => {
      const payload = UI.buildAnalysisCopyText({ result: state.lastResult, rows: state.rows, version: state.version });
      try { await navigator.clipboard.writeText(payload); UI.showToast?.('Analysis copied.'); } catch (_) {}
    });
  }

  function boot() {
    const intakeTitle = document.getElementById('intakeTitle');
    const analysisTitle = document.getElementById('analysisTitle');
    const shieldTitle = document.getElementById('shieldTitle');
    if (intakeTitle) intakeTitle.textContent = 'AlphaDog v0.0.1';
    if (analysisTitle) analysisTitle.textContent = `Run Analysis ${SYSTEM_VERSION}`;
    if (shieldTitle) shieldTitle.textContent = 'Overall Auditor Score';
    state.ingestLogs = [{ level: 'info', text: '[SYSTEM] Intake ready.' }];
    refreshIntake();
    bindEvents();
    const intake = UI.el('intakeScreen');
    if (intake) { intake.classList.remove('hidden'); intake.style.display = 'block'; }
  }

  Object.assign(window.PickCalcCore, { state, boot, ingestBoard, handleMiningClick, handleResetAll, SYSTEM_VERSION });
  window.addEventListener('DOMContentLoaded', boot);
})();
