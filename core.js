window.PickCalcCore = window.PickCalcCore || {};
(() => {
  const Parser = window.PickCalcParser;
  const UI = window.PickCalcUI;
  const Connectors = window.PickCalcConnectors;
  const SYSTEM_VERSION = 'AlphaDog v0.0.12 "Chromium Fang"';


  const state = {
    version: SYSTEM_VERSION,
    rows: [],
    cleanPool: [],
    auditRows: [],
    selectedLeagues: ['MLB'],
    lastIngestMeta: null,
    lastResult: null,
    ingestLogs: [],
    miningVault: {},
    verboseMode: false
  };

  function calcCobaltEdge(vault = {}, row = {}) {
    const direct = Number(vault?.finalScore);
    const scores = [vault?.categoryScores?.identity, vault?.categoryScores?.trend, vault?.categoryScores?.stress, vault?.categoryScores?.risk]
      .map((v) => Number(v))
      .filter(Number.isFinite);
    const computed = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const final = Number.isFinite(direct) ? Math.max(0, Math.min(100, Math.round(direct))) : computed;
    const chosenSide = String(row?.direction || '').trim() || 'More';
    return {
      score: final,
      side: chosenSide,
      displaySide: chosenSide,
      overScore: final / 100,
      underScore: (100 - final) / 100,
      player: row?.parsedPlayer || '',
      legId: row?.LEG_ID || ''
    };
  }

  function buildAnalysisCopyText(context = {}) {
    return UI.buildAnalysisCopyText(context);
  }

  function getDayScopeValue() { return 'Today'; }
  function getNow() { return new Date(); }
  function filteredRows(rows) { return (rows || []).filter((row) => state.selectedLeagues.includes(row.sport)); }
  function filteredAuditRows(rows) { return (rows || []).filter((row) => !row.sport || state.selectedLeagues.includes(row.sport)); }
  function buildIngestLogs(auditRows) { return (auditRows || []).flatMap((item) => { if (item?.accepted) { return [{ level: 'info', text: `[PARSER] Found ${item.parsedPlayer || 'Unknown'} | Prop: ${item.prop || 'Unknown'} | Line: ${item.line || '?'} | Pick: ${item.pickType || 'Regular Line'}` }]; } return [{ level: 'warning', text: `INGEST REJECTED #${item.idx}: ${item.parsedPlayer || item.rawText || 'Unknown'} • ${item.timeFilter?.detail || item.rejectionReason || 'Rejected'}` }]; }); }

  function refreshIntake() {
    state.cleanPool = state.rows.slice();
    const rows = filteredRows(state.cleanPool);
    const auditRows = filteredAuditRows(state.auditRows);
    const rejectedCount = Array.isArray(auditRows?.rejectedLines) ? auditRows.rejectedLines.length : 0;
    UI.renderPoolCounts?.(rows.length, rejectedCount);
    UI.renderRunSummary(state.cleanPool, auditRows);
    UI.renderFeedStatus(state.cleanPool, auditRows);
    UI.renderPoolTable(rows);
    UI.renderConsole(state.ingestLogs || [{ level: 'info', text: '[SYSTEM] Intake ready.' }]);
    UI.renderRawPayload?.('');
  }

  function ingestBoard() {
    const input = UI.el('boardInput');
    if (!input || !input.value.trim()) return;
    const parsed = Parser.parseBoard(input.value, { dayScope: 'both' });
    const incoming = Array.isArray(parsed.rows) ? parsed.rows : [];
    const rejectedCount = Array.isArray(parsed.audit?.rejectedLines) ? parsed.audit.rejectedLines.length : 0;
    if (incoming.length > 0) {
      const combined = [...state.cleanPool, ...incoming];
      const overflow = Math.max(0, combined.length - 24);
      state.cleanPool = combined.slice(0, 24).map((row, index) => Object.assign({}, row, {
        idx: index + 1,
        LEG_ID: row.LEG_ID || `LEG-${index + 1}`
      }));
      state.rows = state.cleanPool.slice();
      state.auditRows = parsed.audit || [];
      state.lastResult = null;
      state.miningVault = {};
      state.ingestLogs = buildIngestLogs(state.auditRows);
      input.value = '';
      UI.renderPoolCounts?.(incoming.length, rejectedCount + overflow);
      if (overflow > 0) UI.appendConsole?.({ level: 'warning', text: `[SYSTEM] Remaining ${overflow} legs ignored (24 Max)` });
    } else {
      state.auditRows = parsed.audit || [];
      state.ingestLogs = buildIngestLogs(state.auditRows);
      UI.renderPoolCounts?.(0, rejectedCount);
    }
    UI.renderRunSummary(state.cleanPool, parsed.audit);
    UI.renderFeedStatus(state.cleanPool, parsed.audit);
    UI.renderPoolTable(state.cleanPool);
    UI.renderConsole(state.ingestLogs || [{ level: 'info', text: '[SYSTEM] Intake ready.' }]);
    if (!incoming.length && UI.el('ingestMessage')) UI.el('ingestMessage').textContent = 'No valid legs found. Check board format.';
    else if (UI.el('ingestMessage')) UI.el('ingestMessage').textContent = '';
  }

  async function handleMiningClick(isVerbose = false) {
    state.verboseMode = Boolean(isVerbose);
    const rows = filteredRows(state.rows).map((row, index) => Object.assign({}, row, { idx: Number(row.idx || index + 1), LEG_ID: row.LEG_ID || `LEG-${Number(row.idx || index + 1)}` }));
    if (!rows.length) {
      if (UI.el('ingestMessage')) UI.el('ingestMessage').textContent = 'Nothing to run. Paste and ingest at least one valid row.';
      return;
    }

    state.miningVault = {};
    UI.showAnalysisScreen();
    UI.initProgressBar(0, 1, 'Audit live. Awaiting response...');
    UI.renderConsole([{ level: 'info', text: '[SYSTEM] Firing Atomic Ingress...' }]);
    UI.startHeartbeat?.();

    const starterVault = Connectors.createZeroFilledVault(rows[0]);
    const starter = {
      row: rows[0],
      shield: { integrityScore: 0, purityScore: 0, confidenceAvg: 0, label: 'ATOMIC INITIALIZING' },
      connectorState: { completedRows: 0, completedAudits: 0, totalAudits: rows.length * 4 },
      vault: starterVault,
      vaultCollection: {},
      logs: [{ level: 'info', text: '[SYSTEM] Firing Atomic Ingress...' }],
      analysisHint: 'Audit live. Awaiting response...',
      runStatus: 'LOADING',
      analysisPhase: 'loading',
      finalized: false
    };
    state.lastResult = starter;
    UI.renderAnalysisResults(rows, state.auditRows, starter, state.version);
    UI.renderRawPayload?.('');

    try {
      const response = await Connectors.streamingIngress(rows, state, {
        verbose: isVerbose,
        onRowStart: ({ row }) => { UI.renderConsole([{ level: 'info', text: `[SYSTEM] Streaming ${row?.parsedPlayer || row?.LEG_ID}...` }]); },
        onBranch: ({ row, vault, completedProbes, totalProbes, categoryKey, logs }) => {
          const payload = {
            row,
            vault,
            vaultCollection: JSON.parse(JSON.stringify(state.miningVault || {})),
            
            analysisHint: 'Audit live. Awaiting response...',
            runStatus: 'LOADING',
            analysisPhase: 'loading',
            finalized: false,
            connectorState: { completedRows: 0, completedProbes, totalProbes },
            logs: logs || [{ level: 'info', text: `[SYSTEM] ${categoryKey} hydrated.` }]
          };
          state.lastResult = payload;
          UI.renderStreamUpdate(rows, state.auditRows, payload, state.version, { completedProbes, totalProbes, categoryKey });
          UI.renderRawPayload?.(payload.rawPayload || payload.responseText || window.__ALPHADOG_RAW_GEMINI_PAYLOAD__ || '');
        },
        onRowComplete: ({ result, completedRows, completedProbes, totalProbes }) => {
          result.vaultCollection = JSON.parse(JSON.stringify(state.miningVault || {}));
          result.analysisPhase = 'final';
          result.finalized = true;
          state.lastResult = result;
          UI.renderStreamUpdate(rows, state.auditRows, result, state.version, { completedRows, completedProbes, totalProbes, categoryKey: 'DONE' });
          UI.renderRawPayload?.(result.rawPayload || result.responseText || window.__ALPHADOG_RAW_GEMINI_PAYLOAD__ || '');
        },
        onComplete: ({ lastResult }) => {
          if (lastResult) {
            lastResult.vaultCollection = JSON.parse(JSON.stringify(state.miningVault || {}));
            lastResult.analysisPhase = 'final';
            lastResult.finalized = true;
            state.lastResult = lastResult;
            UI.renderAnalysisResults(rows, state.auditRows, lastResult, state.version);
            UI.updateProgressBar(100, 100, lastResult?.analysisHint || 'Audit complete.');
          }
          setTimeout(() => { UI.stopHeartbeat?.(); }, 500);
        }
      });
      state.lastResult = response.lastResult || state.lastResult;
    } catch (error) {
      UI.renderConsole([{ level: 'warning', text: `[SYSTEM] ${error.message}` }]);
      setTimeout(() => { UI.stopHeartbeat?.(); }, 500);
    }
  }


  function handleBack() {
    state.miningVault = {};
    state.auditRows = [];
    state.lastResult = null;
    state.rawPayload = '';
    state.currentRawPayload = '';
    state.connectorState = {};
    try { window.__ALPHADOG_RAW_GEMINI_PAYLOAD__ = ''; } catch (_) {}
    try { window.__ALPHADOG_LAST_API_RESPONSE__ = null; } catch (_) {}
    ['analysisSummary','analysisHint','systemConsole','progressBar','batchAuditorOutput','rawPayloadOutput','audit-results','miningGrid','poolMount'].forEach((id) => {
      const node = UI.el(id);
      if (!node) return;
      node.innerHTML = '';
      if ('textContent' in node) node.textContent = '';
    });
    const rawPayloadOutput = UI.el('rawPayloadOutput');
    if (rawPayloadOutput) rawPayloadOutput.textContent = '';
    UI.stopHeartbeat?.();
    UI.backToIntake?.();
  }

  function handleResetAll() {
    let preservedKey = '';
    try { preservedKey = String(window.__OXYGEN_GEMINI_KEY__ || localStorage.getItem('OXYGEN_GEMINI_KEY') || sessionStorage.getItem('OXYGEN_GEMINI_KEY') || document.getElementById('apiKeyInput')?.value || '').trim(); } catch (_) {}
    const preserveStorageKey = (storage) => {
      if (!storage) return;
      try {
        const preserve = new Set(['OXYGEN_GEMINI_KEY']);
        const doomed = [];
        for (let i = 0; i < storage.length; i += 1) {
          const key = storage.key(i);
          if (!preserve.has(key)) doomed.push(key);
        }
        doomed.forEach((key) => { try { storage.removeItem(key); } catch (_) {} });
      } catch (_) {}
    };
    try { preserveStorageKey(localStorage); } catch (_) {}
    try { preserveStorageKey(sessionStorage); } catch (_) {}
    if (preservedKey) {
      try { window.__OXYGEN_GEMINI_KEY__ = preservedKey; } catch (_) {}
      try { localStorage.setItem('OXYGEN_GEMINI_KEY', preservedKey); } catch (_) {}
      try { sessionStorage.setItem('OXYGEN_GEMINI_KEY', preservedKey); } catch (_) {}
      try { const keyInput = document.getElementById('apiKeyInput'); if (keyInput) keyInput.value = preservedKey; } catch (_) {}
    }
    state.rows = [];
    state.cleanPool = [];
    state.auditRows = [];
    state.miningVault = {};
    state.selectedLeagues = ['MLB'];
    state.lastResult = null;
    state.lastIngestMeta = null;
    state.ingestLogs = [];
    state.verboseMode = false;
    state.version = SYSTEM_VERSION;

    ['boardInput','ingestMessage','feedStatus','runSummary','poolMount','analysisSummary','analysisHint','systemConsole','progressBar','batchAuditorOutput','rawPayloadOutput'].forEach((id) => {
      const node = UI.el(id);
      if (!node) return;
      if (id === 'boardInput' && 'value' in node) {
        node.value = '';
        return;
      }
      node.innerHTML = '';
      if ('textContent' in node) node.textContent = '';
    });

    if (UI.stopHeartbeat) UI.stopHeartbeat();
    UI.backToIntake?.();
    refreshIntake();
    UI.showToast?.('System reset complete.');
  }

  function bindEvents() {
    document.getElementById('debugConnectionBtn')?.addEventListener('click', async () => {
      try {
        const result = await Connectors.debugConnection();
        if (!result?.ok && Number(result?.status) === 400 && result?.errorText) {
          UI.renderConsole([{ level: 'warning', text: `[SYSTEM] 400 GOOGLE_ERROR: ${result.errorText}` }]);
        }
      } catch (error) {
        const logger = (window.PickCalcUI && window.PickCalcUI.appendConsole) ? window.PickCalcUI.appendConsole : console.log;
        logger({ level: 'warning', text: `[OXYGEN] DEBUG_CONNECTION_FAIL: ${error.message}` });
      }
    });
    document.getElementById('saveKeyBtn')?.addEventListener('click', () => {
      const key = document.getElementById('apiKeyInput').value.trim();
      if (key) {
        localStorage.setItem('OXYGEN_GEMINI_KEY', key);
        try { sessionStorage.setItem('OXYGEN_GEMINI_KEY', key); } catch (_) {}
        try { window.__OXYGEN_GEMINI_KEY__ = key; } catch (_) {}
        alert('Key Saved!');
      }
    });
    // Initialize input value if key exists
    const savedKey = window.__OXYGEN_GEMINI_KEY__ || localStorage.getItem('OXYGEN_GEMINI_KEY') || sessionStorage.getItem('OXYGEN_GEMINI_KEY');
    if (savedKey) { document.getElementById('apiKeyInput').value = savedKey; window.__OXYGEN_GEMINI_KEY__ = savedKey; }
    UI.el('ingestBtn')?.addEventListener('click', ingestBoard);
    UI.el('runBtn')?.addEventListener('click', () => handleMiningClick(false));
    UI.el('backBtn')?.addEventListener('click', handleBack);
    UI.el('clearBoxBtn')?.addEventListener('click', () => { if (UI.el('boardInput')) UI.el('boardInput').value = ''; });
    UI.el('resetAllBtn')?.addEventListener('click', () => {
      handleResetAll();
    });
    UI.el('copyBtn')?.addEventListener('click', async () => {
      const payload = buildAnalysisCopyText({ result: state.lastResult, rows: state.rows, version: state.version, vault: state.miningVault, cobaltEdge: calcCobaltEdge() });
      try { await navigator.clipboard.writeText(payload); } catch (_) {}
    });
  }

  function boot() {
    const title = document.getElementById('intakeTitle');
    const analysisTitle = document.getElementById('analysisTitle');
    const analysisVersion = document.getElementById('analysisVersion');
    const shieldTitle = document.getElementById('shieldTitle');
    if (title) title.textContent = SYSTEM_VERSION;
    if (analysisTitle) analysisTitle.textContent = SYSTEM_VERSION;
    if (analysisVersion) analysisVersion.textContent = '';
    if (shieldTitle) shieldTitle.textContent = '';
    refreshIntake();
    bindEvents();
    const intake = UI.el('intakeScreen');
    if (intake) { intake.classList.remove('hidden'); intake.style.display = 'block'; }
  }

  Object.assign(window.PickCalcCore, { state, boot, ingestBoard, handleMiningClick, handleBack, handleResetAll, buildAnalysisCopyText, calcCobaltEdge, SYSTEM_VERSION });
  window.addEventListener('DOMContentLoaded', boot);
})();
