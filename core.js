window.PickCalcCore = window.PickCalcCore || {};
(() => {
  const Parser = window.PickCalcParser;
  const UI = window.PickCalcUI;
  const Connectors = window.PickCalcConnectors;
  const SYSTEM_VERSION = 'v13.76.2 (OXYGEN-COBALT)';

  const LAB_BOOT_ROWS = [
    { idx: 1, LEG_ID: 'LEG-1', sport: 'MLB', league: 'MLB', parsedPlayer: 'Shohei Ohtani', team: 'LAD', opponent: 'SD', gameTimeText: 'Fri 6:40 PM', prop: 'Hits', line: '1.5', lineValue: 1.5, type: 'Hitter', direction: 'More' },
    { idx: 2, LEG_ID: 'LEG-2', sport: 'MLB', league: 'MLB', parsedPlayer: 'Chase Burns Lowder', team: 'CIN', opponent: 'MIL', gameTimeText: 'Fri 6:40 PM', prop: 'Strikeouts', line: '5.5', lineValue: 5.5, type: 'Pitcher', direction: 'More' },
    { idx: 3, LEG_ID: 'LEG-3', sport: 'MLB', league: 'MLB', parsedPlayer: 'Seth Lugo', team: 'KC', opponent: 'DET', gameTimeText: 'Fri 6:40 PM', prop: 'Strikeouts', line: '4.5', lineValue: 4.5, type: 'Pitcher', direction: 'More' },
    { idx: 4, LEG_ID: 'LEG-4', sport: 'MLB', league: 'MLB', parsedPlayer: 'Max Fried', team: 'NYY', opponent: 'BOS', gameTimeText: 'Fri 7:05 PM', prop: 'Pitching Outs', line: '17.5', lineValue: 17.5, type: 'Pitcher', direction: 'More' },
    { idx: 5, LEG_ID: 'LEG-5', sport: 'MLB', league: 'MLB', parsedPlayer: 'Samuel Basallo', team: 'BAL', opponent: 'TOR', gameTimeText: 'Fri 7:05 PM', prop: 'Hits+Runs+RBIs', line: '1.5', lineValue: 1.5, type: 'Hitter', direction: 'More' },
    { idx: 6, LEG_ID: 'LEG-6', sport: 'MLB', league: 'MLB', parsedPlayer: 'JJ Wetherholt', team: 'STL', opponent: 'CHC', gameTimeText: 'Fri 7:15 PM', prop: 'Total Bases', line: '1.5', lineValue: 1.5, type: 'Hitter', direction: 'More' },
    { idx: 7, LEG_ID: 'LEG-7', sport: 'MLB', league: 'MLB', parsedPlayer: 'Noah Schultz', team: 'CWS', opponent: 'MIN', gameTimeText: 'Fri 7:40 PM', prop: 'Strikeouts', line: '4.5', lineValue: 4.5, type: 'Pitcher', direction: 'More' }
  ];

  const state = {
    version: SYSTEM_VERSION,
    rows: LAB_BOOT_ROWS.slice(),
    auditRows: [],
    selectedLeagues: new Set(['MLB', 'NHL']),
    lastResult: null,
    lastIngestMeta: null,
    ingestLogs: [],
    miningVault: {},
    verboseMode: false
  };

  function getDayScopeValue() { return document.querySelector('input[name="dayScope"]:checked')?.value || 'Today'; }
  function getNow() { return new Date(); }
  function filteredRows(rows) { return (rows || []).filter((row) => state.selectedLeagues.has(row.sport)); }
  function filteredAuditRows(rows) { return (rows || []).filter((row) => !row.sport || state.selectedLeagues.has(row.sport)); }
  function buildIngestLogs(auditRows) { return (auditRows || []).filter((item) => !item.accepted).map((item) => ({ level: 'warning', text: `INGEST REJECTED #${item.idx}: ${item.parsedPlayer || item.rawText || 'Unknown'} • ${item.timeFilter?.detail || item.rejectionReason || 'Rejected'}` })); }

  function refreshIntake() {
    const rows = filteredRows(state.rows);
    const auditRows = filteredAuditRows(state.auditRows);
    UI.renderRunSummary(rows, auditRows, state.lastIngestMeta || { dayScope: getDayScopeValue() });
    UI.renderFeedStatus(rows, auditRows);
    UI.renderPoolTable(rows);
    UI.renderConsole(state.ingestLogs || [{ level: 'info', text: '[SYSTEM] Intake ready.' }]);
  }

  function ingestBoard() {
    const text = UI.el('boardInput')?.value || '';
    const dayScope = getDayScopeValue();
    if (!text.trim()) {
      state.rows = LAB_BOOT_ROWS.slice();
      state.auditRows = LAB_BOOT_ROWS.map((row) => Object.assign({ accepted: true }, row));
      state.ingestLogs = [{ level: 'info', text: '[SYSTEM] Boot rows loaded.' }];
      state.lastIngestMeta = { acceptedCount: state.rows.length, totalAnchors: state.rows.length, rejectedCount: 0, dayScope, timestamp: new Date().toISOString() };
      if (UI.el('ingestMessage')) UI.el('ingestMessage').textContent = `Accepted ${state.rows.length} of ${state.rows.length} cluster(s). HARD-LOCK ingest active.`;
      refreshIntake();
      return;
    }
    const parsed = Parser.parseBoard(text, { dayScope, now: getNow() });
    state.rows = (parsed.rows || []).slice(0, 7).map((row, index) => Object.assign({}, row, { idx: Number(row.idx || index + 1), LEG_ID: row.LEG_ID || `LEG-${Number(row.idx || index + 1)}` }));
    state.auditRows = parsed.audit || [];
    state.ingestLogs = buildIngestLogs(state.auditRows);
    state.lastIngestMeta = { acceptedCount: state.rows.length, totalAnchors: state.auditRows.length, rejectedCount: state.auditRows.filter((item) => !item.accepted).length, dayScope, timestamp: new Date().toISOString(), parseYear: Parser.PARSE_YEAR };
    if (!state.rows.length) state.rows = LAB_BOOT_ROWS.slice();
    if (UI.el('ingestMessage')) UI.el('ingestMessage').textContent = `Accepted ${state.rows.length} of ${Math.max(state.rows.length, state.auditRows.length)} cluster(s). HARD-LOCK ingest active.`;
    refreshIntake();
  }

  async function handleMiningClick(isVerbose = false) {
    state.verboseMode = Boolean(isVerbose);
    const rows = filteredRows(state.rows).slice(0, 7).map((row, index) => Object.assign({}, row, { idx: Number(row.idx || index + 1), LEG_ID: row.LEG_ID || `LEG-${Number(row.idx || index + 1)}` }));
    if (!rows.length) {
      if (UI.el('ingestMessage')) UI.el('ingestMessage').textContent = 'Nothing to run. Paste and ingest at least one valid row.';
      return;
    }

    state.miningVault = {};
    UI.showAnalysisScreen();
    UI.initProgressBar(0, Math.max(1, rows.length * 5), 'Firing Atomic Ingress...');
    UI.renderConsole([{ level: 'info', text: '[SYSTEM] Firing Atomic Ingress...' }]);

    const starterVault = Connectors.createZeroFilledVault(rows[0]);
    const starter = {
      row: rows[0],
      shield: { integrityScore: 0, purityScore: 0, confidenceAvg: 0, label: 'ATOMIC INITIALIZING' },
      connectorState: { liveBranches: 0, derivedBranches: 0, completedRows: 0, completedProbes: 0, totalProbes: rows.length * 5 },
      vault: starterVault,
      vaultCollection: {},
      logs: [{ level: 'info', text: '[SYSTEM] Firing Atomic Ingress...' }],
      analysisHint: 'Firing Atomic Ingress...'
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
            analysisHint: branchKey === 'INIT' ? 'Zero-fill vault primed.' : `Streaming Branch ${branchKey} for ${row?.parsedPlayer || row?.LEG_ID}.`,
            connectorState: { completedRows: 0, completedProbes, totalProbes },
            logs: logs || [{ level: 'info', text: `[SYSTEM] Branch ${branchKey} hydrated.` }]
          };
          state.lastResult = payload;
          UI.renderStreamUpdate(rows, state.auditRows, payload, state.version, { completedProbes, totalProbes, branchKey });
        },
        onRowComplete: ({ result, completedRows, completedProbes, totalProbes }) => {
          result.vaultCollection = JSON.parse(JSON.stringify(state.miningVault || {}));
          state.lastResult = result;
          UI.renderStreamUpdate(rows, state.auditRows, result, state.version, { completedRows, completedProbes, totalProbes, branchKey: 'DONE' });
        },
        onComplete: ({ lastResult }) => {
          if (lastResult) {
            lastResult.vaultCollection = JSON.parse(JSON.stringify(state.miningVault || {}));
            state.lastResult = lastResult;
            UI.renderAnalysisResults(rows, state.auditRows, lastResult, state.version);
            UI.updateProgressBar(rows.length * 5, rows.length * 5, lastResult?.analysisHint || 'Atomic Matrix Saturated');
          }
        }
      });
      state.lastResult = response.lastResult || state.lastResult;
    } catch (error) {
      UI.renderConsole([{ level: 'warning', text: `[SYSTEM] ${error.message}` }]);
    }
  }

  function bindEvents() {
    document.getElementById('debugConnectionBtn')?.addEventListener('click', async () => {
      try {
        await fetch('https://generativelanguage.googleapis.com', { method: 'GET', mode: 'no-cors' });
        const logger = (window.PickCalcUI && window.PickCalcUI.appendConsole) ? window.PickCalcUI.appendConsole : console.log;
        logger({ level: 'info', text: '[OXYGEN] DIRECT_HANDSHAKE_OK: Google endpoint responded.' });
      } catch (error) {
        const logger = (window.PickCalcUI && window.PickCalcUI.appendConsole) ? window.PickCalcUI.appendConsole : console.log;
        logger({ level: 'warning', text: '[OXYGEN] BROWSER_BLOCK: Direct Google handshake failed.' });
        alert('Your Browser is blocking the API. Please disable Ad-Blockers or use a different Browser.');
      }
    });
    document.getElementById('saveKeyBtn').addEventListener('click', () => {
      const key = document.getElementById('apiKeyInput').value.trim();
      if (key) {
        localStorage.setItem('OXYGEN_GEMINI_KEY', key);
        alert('Key Saved! Refreshing...');
        window.location.reload();
      }
    });
    // Initialize input value if key exists
    const savedKey = localStorage.getItem('OXYGEN_GEMINI_KEY');
    if (savedKey) document.getElementById('apiKeyInput').value = savedKey;
    UI.el('ingestBtn')?.addEventListener('click', ingestBoard);
    UI.el('runBtn')?.addEventListener('click', () => handleMiningClick(false));
    UI.el('runKeyLabBtn')?.addEventListener('click', () => handleMiningClick(true));
    UI.el('backBtn')?.addEventListener('click', () => UI.backToIntake());
    UI.el('clearBoxBtn')?.addEventListener('click', () => { if (UI.el('boardInput')) UI.el('boardInput').value = ''; });
    UI.el('resetAllBtn')?.addEventListener('click', () => {
      state.rows = LAB_BOOT_ROWS.slice();
      state.auditRows = [];
      state.miningVault = {};
      state.lastResult = null;
      state.ingestLogs = [{ level: 'info', text: '[SYSTEM] Reset complete.' }];
      if (UI.el('boardInput')) UI.el('boardInput').value = '';
      refreshIntake();
    });
    UI.el('copyBtn')?.addEventListener('click', async () => {
      const payload = UI.buildAnalysisCopyText({ result: state.lastResult, rows: state.rows, version: state.version, vault: state.miningVault, BRANCH_TARGETS: Connectors.BRANCH_TARGETS });
      try { await navigator.clipboard.writeText(payload); } catch (_) {}
    });
    document.querySelectorAll('#leagueChecklist input[type="checkbox"]').forEach((input) => {
      input.addEventListener('change', () => {
        const checked = new Set(Array.from(document.querySelectorAll('#leagueChecklist input[type="checkbox"]:checked')).map((node) => node.value));
        state.selectedLeagues = checked;
        refreshIntake();
      });
    });
  }

  function boot() {
    const title = document.getElementById('intakeTitle');
    const analysisTitle = document.getElementById('analysisTitle');
    const analysisVersion = document.getElementById('analysisVersion');
    const shieldTitle = document.getElementById('shieldTitle');
    if (title) title.innerHTML = `PickCalc Multi-Sport Engine <span class="version-pill">${SYSTEM_VERSION}</span>`;
    if (analysisTitle) analysisTitle.textContent = `Run Analysis ${SYSTEM_VERSION}`;
    if (analysisVersion) analysisVersion.textContent = `Version: ${SYSTEM_VERSION}`;
    if (shieldTitle) shieldTitle.textContent = `Alpha Shield ${SYSTEM_VERSION}`;
    UI.renderLeagueChecklist(Parser.LEAGUES || []);
    refreshIntake();
    bindEvents();
    const intake = UI.el('intakeScreen');
    if (intake) { intake.classList.remove('hidden'); intake.style.display = 'block'; }
  }

  Object.assign(window.PickCalcCore, { state, boot, ingestBoard, handleMiningClick, LAB_BOOT_ROWS, SYSTEM_VERSION });
  window.addEventListener('DOMContentLoaded', boot);
})();
