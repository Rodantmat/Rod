
window.PickCalcCore = window.PickCalcCore || {};
(() => {
  const Parser = window.PickCalcParser;
  const UI = window.PickCalcUI;
  const Connectors = window.PickCalcConnectors;
  const SYSTEM_VERSION = 'v13.61.0 (OXYGEN-ATOMIC)';
  const LAB_BOOT_ROWS = [
    { idx: 1, sport: 'MLB', league: 'MLB', parsedPlayer: 'Shohei Ohtani', team: 'LAD', opponent: 'SD', prop: 'Hits', line: '1.5', lineValue: 1.5, type: 'Hitter', direction: 'More' },
    { idx: 2, sport: 'MLB', league: 'MLB', parsedPlayer: 'Chase Burns Lowder', team: 'CIN', opponent: 'MIL', prop: 'Strikeouts', line: '5.5', lineValue: 5.5, type: 'Pitcher', direction: 'More' },
    { idx: 3, sport: 'MLB', league: 'MLB', parsedPlayer: 'Seth Lugo', team: 'KC', opponent: 'DET', prop: 'Strikeouts', line: '4.5', lineValue: 4.5, type: 'Pitcher', direction: 'More' },
    { idx: 4, sport: 'MLB', league: 'MLB', parsedPlayer: 'Max Fried', team: 'NYY', opponent: 'BOS', prop: 'Pitching Outs', line: '17.5', lineValue: 17.5, type: 'Pitcher', direction: 'More' },
    { idx: 5, sport: 'MLB', league: 'MLB', parsedPlayer: 'Samuel Basallo', team: 'BAL', opponent: 'TOR', prop: 'Hits+Runs+RBIs', line: '1.5', lineValue: 1.5, type: 'Hitter', direction: 'More' },
    { idx: 6, sport: 'MLB', league: 'MLB', parsedPlayer: 'JJ Wetherholt', team: 'STL', opponent: 'CHC', prop: 'Total Bases', line: '1.5', lineValue: 1.5, type: 'Hitter', direction: 'More' },
    { idx: 7, sport: 'MLB', league: 'MLB', parsedPlayer: 'Noah Schultz', team: 'CWS', opponent: 'MIN', prop: 'Strikeouts', line: '4.5', lineValue: 4.5, type: 'Pitcher', direction: 'More' }
  ];

  const state = {
    version: SYSTEM_VERSION,
    rows: [],
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

  function applyHardTimeGate(row, now = new Date()) {
    const gameStart = row?.gameTimeISO ? new Date(row.gameTimeISO) : null;
    if (!gameStart || Number.isNaN(gameStart.getTime())) return { accepted: false, code: 'NO_TIME', detail: 'Rejected: no valid gameTimeISO available.' };
    const diff = gameStart.getTime() - now.getTime();
    if (diff <= 0) return { accepted: false, code: 'STARTED', detail: 'Rejected: game already started.' };
    if (diff < 20 * 60 * 1000) return { accepted: false, code: 'UNDER_20', detail: 'Rejected: game starts in under 20 minutes.' };
    return { accepted: true, code: 'ACCEPTED', detail: 'Accepted by core hard time gate.' };
  }

  function filteredRows(rows) { return (rows || []).filter(row => state.selectedLeagues.has(row.sport)); }
  function filteredAuditRows(rows) { return (rows || []).filter(row => !row.sport || state.selectedLeagues.has(row.sport)); }

  function buildIngestLogs(auditRows) {
    return (auditRows || []).filter(item => !item.accepted).map(item => ({ level: 'warning', text: `INGEST REJECTED #${item.idx}: ${item.parsedPlayer || item.rawText || 'Unknown'} • ${item.timeFilter?.detail || item.rejectionReason || 'Rejected'}` }));
  }

  function refreshIntake() {
    const rows = filteredRows(state.rows);
    const auditRows = filteredAuditRows(state.auditRows);
    UI.renderRunSummary(rows, auditRows, state.lastIngestMeta || { dayScope: getDayScopeValue() });
    UI.renderFeedStatus(rows, auditRows);
    UI.renderPoolTable(rows);
    UI.renderConsole(state.ingestLogs || []);
  }

  function ingestBoard() {
    const text = UI.el('boardInput').value;
    const dayScope = getDayScopeValue();
    const parsed = Parser.parseBoard(text, { dayScope, now: getNow() });
    const acceptedRows = [];
    const adjustedAudit = parsed.audit.map(item => ({ ...item }));
    (parsed.rows || []).forEach(row => {
      const hardGate = applyHardTimeGate(row, getNow());
      if (hardGate.accepted) acceptedRows.push({ ...row, timeFilter: Object.assign({}, row.timeFilter || {}, { hardGate }) });
      else {
        const target = adjustedAudit.find(entry => entry.idx === row.idx && entry.accepted);
        if (target) {
          target.accepted = false;
          target.rejectionReason = hardGate.detail;
          target.timeFilter = Object.assign({}, target.timeFilter || {}, { code: hardGate.code, detail: hardGate.detail, hardGate });
        }
      }
    });
    state.rows = acceptedRows.slice(0, 7);
    state.auditRows = adjustedAudit;
    state.ingestLogs = buildIngestLogs(adjustedAudit);
    state.lastIngestMeta = { acceptedCount: state.rows.length, totalAnchors: adjustedAudit.length, rejectedCount: adjustedAudit.filter(item => !item.accepted).length, dayScope, timestamp: new Date().toISOString(), parseYear: Parser.PARSE_YEAR, twentyMinuteRule: true };
    UI.el('ingestMessage').textContent = adjustedAudit.length ? `Accepted ${state.rows.length} of ${adjustedAudit.length} cluster(s). Rejected ${adjustedAudit.filter(item => !item.accepted).length}. HARD-LOCK ingest active.` : 'No valid MLB/NHL anchors found.';
    refreshIntake();
  }

  async function handleMiningClick(isVerbose = false) {
    state.verboseMode = Boolean(isVerbose);
    const rows = filteredRows(state.rows).slice(0, 7);
    if (!rows.length) {
      UI.el('ingestMessage').textContent = 'Nothing to run. Paste and ingest at least one valid row.';
      return;
    }
    UI.showAnalysisScreen();
    UI.initProgressBar(0, Math.max(1, rows.length * 5), 'Firing Atomic Ingress...');
    UI.renderConsole([{ level: 'info', text: '[SYSTEM] Firing Atomic Ingress...' }, ...(state.ingestLogs || [])]);

    const starter = { row: rows[0] || {}, shield: { integrityScore: 0, label: 'ATOMIC INITIALIZING', purityScore: 0, confidenceAvg: 0 }, connectorState: { liveBranches: 0, derivedBranches: 0 }, vault: { branches: {} }, logs: [{ level: 'info', text: '[SYSTEM] Firing Atomic Ingress...' }] };
    state.lastResult = starter;
    UI.renderAnalysisResults(rows, state.auditRows, starter, state.version);

    try {
      await Connectors.streamingIngress(rows, state, {
        verbose: isVerbose,
        onRowStart: ({ row, rowIndex, totalRows }) => {
          UI.renderConsole({ level: 'info', text: `[SYSTEM] Streaming ${row?.parsedPlayer || 'row'} (${rowIndex + 1}/${totalRows})...` });
        },
        onBranch: ({ row, rowIndex, totalRows, completedRows, completedProbes, totalProbes, branchKey, vault, shield, logs }) => {
          const partialResult = {
            row,
            vault,
            shield,
            logs: [...(state.ingestLogs || []), ...(logs || [])],
            connectorState: {
              version: SYSTEM_VERSION,
              completedRows,
              branchStatus: Object.fromEntries(Object.entries(vault?.branches || {}).map(([k, v]) => [k, v?.status || 'PENDING'])),
              liveBranches: Object.values(vault?.branches || {}).filter(b => b?.sourceMode === 'LIVE DATA').length,
              derivedBranches: Object.values(vault?.branches || {}).filter(b => b?.sourceMode === 'DERIVED').length
            }
          };
          state.lastResult = partialResult;
          UI.renderStreamUpdate(rows, state.auditRows, partialResult, state.version, { completedRows, totalRows, completedProbes, totalProbes, branchKey, rowIndex });
        },
        onRowComplete: ({ result, completedRows, totalRows, completedProbes, totalProbes }) => {
          state.lastResult = result;
          UI.renderStreamUpdate(rows, state.auditRows, result, state.version, { completedRows, totalRows, completedProbes, totalProbes, branchKey: 'DONE' });
        },
        onComplete: ({ totalRows, lastResult }) => {
          if (lastResult) state.lastResult = lastResult;
          UI.renderConsole({ level: 'success', text: '[SYSTEM] Atomic Matrix Saturated.' });
          UI.updateProgressBar(totalRows * 5, totalRows * 5, 'Atomic Matrix Saturated.');
        }
      });
    } catch (err) {
      UI.renderConsole({ level: 'failed', text: `[FATAL] Ingress Aborted: ${err.message}` });
      UI.updateProgressBar(0, Math.max(1, rows.length * 5), `Ingress Aborted: ${err.message}`);
    }
  }

  async function copyDebug() {
    const text = UI.buildAnalysisCopyText({ version: state.version, auditRows: filteredAuditRows(state.auditRows), rows: filteredRows(state.rows), result: state.lastResult });
    try { await navigator.clipboard.writeText(text); UI.renderConsole({ level: 'success', text: 'Analysis report copied to clipboard.' }); }
    catch (error) { UI.renderConsole({ level: 'warning', text: `Clipboard permission blocked: ${error?.message || error}` }); }
  }

  async function copyRawVault(idx) {
    const vault = state.miningVault?.[idx] || null;
    if (!vault) { UI.renderConsole({ level: 'warning', text: `No vault available for row #${idx}.` }); return; }
    const report = UI.buildAnalysisCopyText({ result: state.lastResult || { row: state.rows?.find?.(r => r.idx === idx) || {}, vault }, timestamp: new Date().toISOString() });
    try { await navigator.clipboard.writeText(report); UI.renderConsole({ level: 'success', text: `Plain-text vault copied for row #${idx}.` }); }
    catch (error) { UI.renderConsole({ level: 'warning', text: `Clipboard blocked for row #${idx}: ${error?.message || error}` }); }
  }

  function bindLeagueToggles() {
    const checklist = UI.el('leagueChecklist'); if (!checklist) return;
    checklist.addEventListener('change', event => {
      const id = event.target?.dataset?.leagueId;
      if (!id) return;
      if (event.target.checked) state.selectedLeagues.add(id); else state.selectedLeagues.delete(id);
      refreshIntake();
    });
  }

  function bindButtons() {
    UI.el('ingestBtn')?.addEventListener('click', ingestBoard);
    UI.el('clearBoxBtn')?.addEventListener('click', () => { if (UI.el('boardInput')) UI.el('boardInput').value = ''; if (UI.el('ingestMessage')) UI.el('ingestMessage').textContent = ''; });
    UI.el('resetAllBtn')?.addEventListener('click', () => {
      state.rows = []; state.auditRows = []; state.lastResult = null; state.lastIngestMeta = null; state.ingestLogs = []; state.miningVault = {};
      UI.el('boardInput').value = ''; UI.el('ingestMessage').textContent = 'State reset.'; refreshIntake();
    });
    UI.el('backBtn')?.addEventListener('click', UI.backToIntake);
    UI.el('copyBtn')?.addEventListener('click', copyDebug);
    document.addEventListener('click', event => {
      if (event.target?.closest?.('#runBtn')) { event.preventDefault(); handleMiningClick(false); return; }
      if (event.target?.closest?.('#runKeyLabBtn, #runLabBtn')) { event.preventDefault(); handleMiningClick(true); return; }
      const btn = event.target?.closest?.('.copy-raw-vault-btn');
      if (!btn) return;
      const idx = Number(btn.dataset.rowIdx);
      if (Number.isFinite(idx)) copyRawVault(idx);
    });
  }

  function applyVersionLock() {
    document.title = `PickCalc Multi-Sport Engine • ${SYSTEM_VERSION}`;
    const intakeTitle = UI.el('intakeTitle'); if (intakeTitle) intakeTitle.innerHTML = `PickCalc Multi-Sport Engine <span class="version-pill">${SYSTEM_VERSION}</span>`;
    const analysisTitle = UI.el('analysisTitle'); if (analysisTitle) analysisTitle.textContent = `Run Analysis ${SYSTEM_VERSION}`;
    const analysisVersion = UI.el('analysisVersion'); if (analysisVersion) analysisVersion.textContent = `Version: ${SYSTEM_VERSION}`;
    const shieldTitle = UI.el('shieldTitle'); if (shieldTitle) shieldTitle.textContent = `Alpha Shield ${SYSTEM_VERSION}`;
  }

  function forceMLBNHLOnly() {
    state.selectedLeagues = new Set(['MLB', 'NHL']);
    UI.renderLeagueChecklist(Parser.LEAGUES.filter(item => item.id === 'MLB' || item.id === 'NHL'));
  }

  function init() {
    applyVersionLock();
    forceMLBNHLOnly();
    bindLeagueToggles();
    bindButtons();
    UI.bindResizeRedraw();
    state.rows = LAB_BOOT_ROWS.map(row => ({ ...row }));
    state.auditRows = LAB_BOOT_ROWS.map(row => ({ ...row, accepted: true }));
    state.lastIngestMeta = { acceptedCount: state.rows.length, totalAnchors: state.rows.length, rejectedCount: 0, dayScope: 'Lab', timestamp: new Date().toISOString(), parserMode: 'LAB_BOOT' };
    UI.showAnalysisScreen();
    UI.renderRunSummary(state.rows, state.auditRows, state.lastIngestMeta);
    UI.renderPoolTable(state.rows);
    UI.renderAnalysisShell({ row: state.rows[0], shield: { integrityScore: 0, label: 'ATOMIC READY', purityScore: 0, confidenceAvg: 0 }, connectorState: { liveBranches: 0, derivedBranches: 0 }, vault: { branches: {} }, logs: [{ level: 'success', text: '[ATOMIC] Oxygen-Atomic ignition armed.' }] }, state.rows, state.version);
    UI.renderMiningGrid(state.rows, { branches: {} });
    UI.updateProgressBar(0, state.rows.length * 5, 'Oxygen-Atomic boot ready.');
  }

  Object.assign(window.PickCalcCore, { init, state, getDayScopeValue, copyRawVault, handleMiningClick, copyDebug, LAB_BOOT_ROWS });
  window.addEventListener('load', init);
})();
