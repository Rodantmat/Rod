window.PickCalcCore = window.PickCalcCore || {};
(() => {
  const Parser = window.PickCalcParser;
  const UI = window.PickCalcUI;
  const Connectors = window.PickCalcConnectors;
  const SYSTEM_VERSION = 'v13.78.36 (OXYGEN-COBALT)';


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
    const branches = vault?.branches || {};
    const clamp01 = (value) => {
      const n = Number(value);
      if (!Number.isFinite(n)) return 0;
      if (n <= 1) return Math.max(0, Math.min(1, n));
      if (n <= 100) return Math.max(0, Math.min(1, n / 100));
      return 1;
    };
    const averageBranch = (branchKey, keys = null) => {
      const parsed = branches?.[branchKey]?.parsed || {};
      const values = Array.isArray(keys) && keys.length ? keys.map((key) => parsed[key]).filter((value) => value !== undefined) : Object.values(parsed);
      if (!values.length) return 0;
      return values.reduce((sum, value) => sum + clamp01(value), 0) / values.length;
    };
    const resolveMarketComposite = () => {
      const providerMap = branches?.E?.providerMap || {};
      const rawBooks = [providerMap.DraftKings, providerMap.FanDuel, providerMap.BetMGM, providerMap.Bet365, providerMap.Pinnacle]
        .map(clamp01)
        .filter((v) => Number.isFinite(v));
      const arithmetic = branches?.E?.localArithmetic || {};
      const components = rawBooks.slice();
      if (Number.isFinite(Number(arithmetic.mean))) components.push(clamp01(arithmetic.mean));
      if (Number.isFinite(Number(arithmetic.marketConfidence))) components.push(clamp01(arithmetic.marketConfidence));
      if (!components.length) return 0;
      return components.reduce((sum, value) => sum + value, 0) / components.length;
    };
    const marketComposite = resolveMarketComposite();
    const prop = String(row?.prop || '').toLowerCase();
    const pickType = String(row?.pickType || '').toLowerCase();
    const isFantasy = /fantasy score|\bpfs\b|\bhfs\b/.test(prop);
    const isPitcherFantasy = /pitcher fantasy score|\bpfs\b/.test(prop);
    const isHitterFantasy = /hitter fantasy score|\bhfs\b/.test(prop) || (isFantasy && String(row?.type || '').toLowerCase().includes('hit'));

    let overScore = 0;
    let underScore = 0;

    if (isPitcherFantasy) {
      const kPulse = averageBranch('A', ['a10', 'a11', 'a12', 'a13', 'a14', 'a15']);
      const environment = averageBranch('C', ['c04', 'c05', 'c09', 'c10', 'c11']);
      const leash = averageBranch('D', ['d02', 'd05', 'd06', 'd10']);
      const market = marketComposite;
      overScore = (kPulse * 0.30) + (environment * 0.20) + (leash * 0.40) + (market * 0.10);
      underScore = ((1 - kPulse) * 0.30) + ((1 - environment) * 0.20) + ((1 - leash) * 0.40) + ((1 - market) * 0.10);
    } else if (isHitterFantasy || isFantasy || /hits\+runs\+rbis|hrr/.test(prop)) {
      const clout = averageBranch('A', ['a01', 'a02', 'a03', 'a04', 'a06', 'a12', 'a13', 'a17', 'a19']);
      const setup = averageBranch('C', ['c01', 'c03', 'c05', 'c09', 'c11', 'c12']);
      const upside = averageBranch('D', ['d03', 'd04', 'd05', 'd06', 'd10']);
      const market = marketComposite;
      overScore = (clout * 0.30) + (setup * 0.20) + (upside * 0.40) + (market * 0.10);
      underScore = ((1 - clout) * 0.30) + ((1 - setup) * 0.20) + ((1 - upside) * 0.40) + ((1 - market) * 0.10);
    } else if (/home runs|triples|stolen bases/.test(prop)) {
      const branchA = averageBranch('A');
      const branchC = averageBranch('C');
      const branchD = averageBranch('D');
      const branchE = marketComposite;
      overScore = (branchA * 0.60) + (branchC * 0.20) + (branchD * 0.15) + (branchE * 0.05);
      underScore = ((1 - branchA) * 0.60) + ((1 - branchC) * 0.20) + ((1 - branchD) * 0.15) + ((1 - branchE) * 0.05);
    } else {
      const branchA = averageBranch('A');
      const branchC = averageBranch('C');
      const branchD = averageBranch('D');
      const branchE = marketComposite;
      overScore = (branchA * 0.45) + (branchC * 0.30) + (branchD * 0.20) + (branchE * 0.05);
      underScore = ((1 - branchA) * 0.45) + ((1 - branchC) * 0.30) + ((1 - branchD) * 0.20) + ((1 - branchE) * 0.05);
    }

    let chosenProbability = overScore;
    let chosenSide = 'More';
    if (pickType === 'goblin' || pickType === 'demon') {
      const requested = String(row?.direction || '').toLowerCase();
      if (requested === 'less' || requested === 'under') {
        chosenProbability = underScore;
        chosenSide = 'Less';
      } else {
        chosenProbability = overScore;
        chosenSide = 'More';
      }
    } else if (underScore > overScore) {
      chosenProbability = underScore;
      chosenSide = 'Less';
    }

    const final = Math.max(0, Math.min(100, Math.round(chosenProbability * 100)));
    return {
      score: final,
      side: chosenSide,
      displaySide: chosenSide,
      overScore: Math.round(overScore * 1000) / 1000,
      underScore: Math.round(underScore * 1000) / 1000,
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
    UI.renderFeedStatus(state.cleanPool, auditRows);
    UI.renderPoolTable(rows);
    UI.renderConsole(state.ingestLogs || [{ level: 'info', text: '[SYSTEM] Intake ready.' }]);
  }

  function ingestBoard() {
    const input = UI.el('boardInput');
    if (!input || !input.value.trim()) return;
    const parsed = Parser.parseBoard(input.value, { dayScope: 'both' });
    const incoming = Array.isArray(parsed.rows) ? parsed.rows : [];
    const rejectedCount = Array.isArray(parsed.audit?.rejectedLines) ? parsed.audit.rejectedLines.length : 0;
    if (incoming.length > 0) {
      const combined = [...state.cleanPool, ...incoming];
      const overflow = Math.max(0, combined.length - 16);
      state.cleanPool = combined.slice(0, 16).map((row, index) => Object.assign({}, row, {
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
      if (overflow > 0) UI.appendConsole?.({ level: 'warning', text: `[SYSTEM] Remaining ${overflow} legs ignored (16 Max)` });
    } else {
      state.auditRows = parsed.audit || [];
      state.ingestLogs = buildIngestLogs(state.auditRows);
      UI.renderPoolCounts?.(0, rejectedCount);
    }
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
    UI.initProgressBar(0, Math.max(1, rows.length * 5), 'Wait bar active. Probing and retrieving payload...');
    UI.renderConsole([{ level: 'info', text: '[SYSTEM] Firing Atomic Ingress...' }]);
    UI.startHeartbeat?.();

    const starterVault = Connectors.createZeroFilledVault(rows[0]);
    const starter = {
      row: rows[0],
      shield: { integrityScore: 0, purityScore: 0, confidenceAvg: 0, label: 'ATOMIC INITIALIZING' },
      connectorState: { liveBranches: 0, derivedBranches: 0, completedRows: 0, completedProbes: 0, totalProbes: rows.length * 5 },
      vault: starterVault,
      vaultCollection: {},
      logs: [{ level: 'info', text: '[SYSTEM] Firing Atomic Ingress...' }],
      analysisHint: 'Wait bar active. Probing and retrieving payload...',
      runStatus: 'LOADING',
      analysisPhase: 'loading',
      finalized: false
    };
    state.lastResult = starter;
    UI.renderAnalysisResults(rows, state.auditRows, starter, state.version);

    try {
      const response = await Connectors.streamingIngress(rows, state, {
        verbose: isVerbose,
        onRowStart: ({ row }) => { UI.renderConsole([{ level: 'info', text: `[SYSTEM] Streaming ${row?.parsedPlayer || row?.LEG_ID}...` }]); },
        onBranch: ({ row, vault, shield, completedProbes, totalProbes, branchKey, logs }) => {
          const payload = {
            row,
            vault,
            vaultCollection: JSON.parse(JSON.stringify(state.miningVault || {})),
            shield,
            analysisHint: 'Wait bar active. Probing and retrieving payload...',
            runStatus: 'LOADING',
            analysisPhase: 'loading',
            finalized: false,
            connectorState: { completedRows: 0, completedProbes, totalProbes },
            logs: logs || [{ level: 'info', text: `[SYSTEM] Branch ${branchKey} hydrated.` }]
          };
          state.lastResult = payload;
          UI.renderStreamUpdate(rows, state.auditRows, payload, state.version, { completedProbes, totalProbes, branchKey });
        },
        onRowComplete: ({ result, completedRows, completedProbes, totalProbes }) => {
          result.vaultCollection = JSON.parse(JSON.stringify(state.miningVault || {}));
          result.analysisPhase = 'final';
          result.finalized = true;
          state.lastResult = result;
          UI.renderStreamUpdate(rows, state.auditRows, result, state.version, { completedRows, completedProbes, totalProbes, branchKey: 'DONE' });
        },
        onComplete: ({ lastResult }) => {
          if (lastResult) {
            lastResult.vaultCollection = JSON.parse(JSON.stringify(state.miningVault || {}));
            lastResult.analysisPhase = 'final';
            lastResult.finalized = true;
            state.lastResult = lastResult;
            UI.renderAnalysisResults(rows, state.auditRows, lastResult, state.version);
            UI.updateProgressBar(rows.length * 5, rows.length * 5, lastResult?.analysisHint || 'Atomic Matrix Saturated');
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

    ['boardInput','ingestMessage','feedStatus','poolMount','analysisSummary','analysisHint','analysisResultsBody','systemConsole','shieldPanel','progressBar'].forEach((id) => {
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
    UI.el('backBtn')?.addEventListener('click', () => UI.backToIntake());
    UI.el('clearBoxBtn')?.addEventListener('click', () => { if (UI.el('boardInput')) UI.el('boardInput').value = ''; });
    UI.el('resetAllBtn')?.addEventListener('click', () => {
      handleResetAll();
    });
    UI.el('copyBtn')?.addEventListener('click', async () => {
      const payload = buildAnalysisCopyText({ result: state.lastResult, rows: state.rows, version: state.version, vault: state.miningVault, BRANCH_TARGETS: Connectors.BRANCH_TARGETS, cobaltEdge: calcCobaltEdge() });
      try { await navigator.clipboard.writeText(payload); } catch (_) {}
    });
  }

  function boot() {
    const title = document.getElementById('intakeTitle');
    const analysisTitle = document.getElementById('analysisTitle');
    const analysisVersion = document.getElementById('analysisVersion');
    const shieldTitle = document.getElementById('shieldTitle');
    if (title) title.textContent = 'PickCalc Multi-Sport Engine';
    if (analysisTitle) analysisTitle.textContent = `Run Analysis ${SYSTEM_VERSION}`;
    if (analysisVersion) analysisVersion.textContent = '';
    if (shieldTitle) shieldTitle.textContent = `Alpha Shield ${SYSTEM_VERSION}`;
    refreshIntake();
    bindEvents();
    const intake = UI.el('intakeScreen');
    if (intake) { intake.classList.remove('hidden'); intake.style.display = 'block'; }
  }

  Object.assign(window.PickCalcCore, { state, boot, ingestBoard, handleMiningClick, handleResetAll, buildAnalysisCopyText, calcCobaltEdge, SYSTEM_VERSION });
  window.addEventListener('DOMContentLoaded', boot);
})();
