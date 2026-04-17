
window.PickCalcCore = window.PickCalcCore || {};
(() => {
  const Parser = window.PickCalcParser;
  const UI = window.PickCalcUI;
  const Connectors = window.PickCalcConnectors;
  const SYSTEM_VERSION = 'v13.1.0 (FIXED-IGNITION)';
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

  function getDayScopeValue() {
    return document.querySelector('input[name="dayScope"]:checked')?.value || 'Today';
  }

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
    return (auditRows || []).filter(item => !item.accepted).map(item => {
      const name = item.parsedPlayer || item.cleanedRawText || item.rawText || 'Unknown row';
      if (item.timeFilter?.code === 'UNDER_20') return { level: 'warning', text: `[Time Filter] Discarded: ${name} (Starts in < 20 mins).` };
      if (item.timeFilter?.code === 'STARTED') return { level: 'warning', text: `[Time Filter] Discarded: ${name} (Game already started).` };
      return { level: 'warning', text: `INGEST REJECTED #${item.idx}: ${name} • ${item.timeFilter?.detail || item.rejectionReason || 'Rejected'}` };
    });
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
    state.rows = acceptedRows;
    state.auditRows = adjustedAudit;
    state.ingestLogs = buildIngestLogs(adjustedAudit);
    state.lastIngestMeta = {
      acceptedCount: acceptedRows.length,
      totalAnchors: adjustedAudit.length,
      rejectedCount: adjustedAudit.filter(item => !item.accepted).length,
      dayScope,
      timestamp: new Date().toISOString(),
      parseYear: Parser.PARSE_YEAR,
      twentyMinuteRule: true,
      parserMode: 'Block-Cluster',
      phase: 'HARD-LOCK'
    };
    const rejected = adjustedAudit.filter(item => !item.accepted).length;
    UI.el('ingestMessage').textContent = adjustedAudit.length ? `Accepted ${acceptedRows.length} of ${adjustedAudit.length} cluster(s). Rejected ${rejected}. HARD-LOCK ingest active.` : 'No valid MLB/NHL anchors found.';
    refreshIntake();
  }

  async function unifiedIngress(verbose = false) {
    const rows = filteredRows(state.rows);
    if (!rows.length) { UI.el('ingestMessage').textContent = 'Nothing to run. Paste and ingest at least one valid row.'; return; }
    const starter = {
      row: rows[0] || {},
      shield: { integrityScore: 0, label: verbose ? 'KEY-LAB INITIALIZING' : 'STREAMING INGRESS' },
      connectorState: { liveBranches: 0, derivedBranches: 0 },
      vault: { branches: {} },
      logs: [{ level: 'success', text: verbose ? `[LAB] Racing Connectors for ${rows[0]?.parsedPlayer || 'queued row'}...` : `[OMNI-MINER] Streaming ingress initialized for ${rows.length} row(s).` }]
    };
    state.verboseMode = Boolean(verbose);
    state.lastResult = starter;
    UI.showAnalysisScreen();
    UI.renderAnalysisResults(rows, state.auditRows, starter, state.version);
    UI.initProgressBar(0, rows.length, verbose ? 'Surgically Mining queued players...' : 'Surgically Mining queued players...');
    UI.renderConsole([...(state.ingestLogs || []), ...(starter.logs || [])]);
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
    try {
      const stream = await Connectors.streamingIngress(rows, state, {
        verbose,
        onRowStart: ({ row, rowIndex, totalRows }) => {
          UI.updateProgressBar(rowIndex, totalRows, `Mining ${row?.parsedPlayer || 'row'}: swarm start`);
        },
        onBranch: ({ row, rowIndex, totalRows, completedRows, completedProbes, totalProbes, branchKey, vault, shield, logs }) => {
          const partialResult = {
            row,
            vault,
            shield,
            logs,
            connectorState: {
              version: SYSTEM_VERSION,
              branchStatus: Object.fromEntries(Object.entries(vault?.branches || {}).map(([k, v]) => [k, v?.status || 'PENDING'])),
              liveBranches: Object.values(vault?.branches || {}).filter(b => b?.sourceMode === 'LIVE DATA').length,
              derivedBranches: Object.values(vault?.branches || {}).filter(b => b?.sourceMode === 'DERIVED').length
            }
          };
          state.lastResult = partialResult;
          if (state.verboseMode && ['A','B'].includes(branchKey)) {
            const branchObj = vault?.branches?.[branchKey] || {};
            const hollow = [branchObj?.parsed?.avgExitVelocity, branchObj?.parsed?.xwoba, branchObj?.parsed?.barrelPct].some(v => Number(v) === 0) || branchObj?.note?.includes?.('[NOT_IN_STATSAPI]');
            if (hollow || branchObj?.status === 'MINING_INTERRUPTED') {
              UI.renderConsole([
                { level: 'warning', text: `[LAB] Racing Connectors for ${row?.parsedPlayer || 'row'}...` },
                { level: 'warning', text: `[KEY-LAB] Branch ${branchKey} hollow or failed. Raw payload length: ${branchObj?.rawResponseLength || 0}` },
                { level: 'warning', text: `${JSON.stringify(branchObj?.verbosePayload || branchObj?.apiPayload || {}, null, 2).slice(0, 3000)}` },
                ...(logs || [])
              ]);
            }
          }
          UI.renderStreamUpdate(rows, state.auditRows, partialResult, state.version, {
            completedRows,
            totalRows,
            completedProbes,
            totalProbes,
            branchKey,
            rowIndex,
            label: `Mining ${row?.parsedPlayer || 'row'}: Branch ${branchKey}`
          });
        },
        onRowComplete: ({ result, completedRows, totalRows, completedProbes, totalProbes }) => {
          result.logs = [...(state.ingestLogs || []), ...(result.logs || [])];
          result.connectorState = Object.assign({}, result.connectorState || {}, { parseYear: Parser.PARSE_YEAR, twentyMinuteRule: true, dayScope: getDayScopeValue(), parserMode: 'Block-Cluster', phase: verbose ? 'OXY-LAB' : 'OXY-STREAM' });
          state.lastResult = result;
          UI.renderStreamUpdate(rows, state.auditRows, result, state.version, {
            completedRows,
            totalRows,
            completedProbes,
            totalProbes,
            branchKey: 'DONE'
          });
        }
      });
      if (stream?.lastResult) {
        stream.lastResult.logs = [...(state.ingestLogs || []), ...(stream.lastResult.logs || [])];
        stream.lastResult.connectorState = Object.assign({}, stream.lastResult.connectorState || {}, { parseYear: Parser.PARSE_YEAR, twentyMinuteRule: true, dayScope: getDayScopeValue(), parserMode: 'Block-Cluster', phase: verbose ? 'OXY-LAB' : 'OXY-STREAM' });
        state.lastResult = stream.lastResult;
        UI.renderAnalysisResults(rows, state.auditRows, stream.lastResult, state.version);
      }
      UI.updateProgressBar(rows.length, rows.length, verbose ? '🔬 KEY-LAB complete.' : 'Streaming ingress complete.');
    } catch (error) {
      UI.renderConsole([{ level: 'warning', text: `Unified ingress failed: ${error?.message || error}` }, ...(state.lastResult?.logs || state.ingestLogs || [])]);
      UI.updateProgressBar(0, rows.length, verbose ? '🔬 KEY-LAB halted.' : 'Streaming ingress halted.');
    } finally {
      UI.hideOverlay();
    }
  }


  async function handleMiningClick(isVerbose = false) {
    state.verboseMode = Boolean(isVerbose);
    const rows = filteredRows(state.rows);
    UI.showAnalysisScreen();
    UI.initProgressBar(0, Math.max(1, rows.length), isVerbose ? 'Surgically Mining queued players...' : 'Surgically Mining queued players...');
    UI.renderConsole([
      { level: 'success', text: isVerbose ? '[LAB] Key-Lab button armed. Preparing unified swarm ingress...' : '[OMNI-MINER] Preparing unified swarm ingress...' },
      ...(state.ingestLogs || [])
    ]);
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
    let heartbeat = null;
    try {
      heartbeat = setInterval(() => {
        UI.renderConsole([
          { level: 'success', text: `[HEARTBEAT] Swarm ingress alive for ${rows[0]?.parsedPlayer || 'queue'}...` },
          ...(state.lastResult?.logs || state.ingestLogs || [])
        ]);
      }, 500);
      await unifiedIngress(isVerbose);
    } finally {
      if (heartbeat) clearInterval(heartbeat);
    }
  }

  async function copyDebug() {
    const hasVault = state.miningVault && Object.keys(state.miningVault).length > 0;
    const text = hasVault
      ? UI.buildAnalysisCopyText({ version: state.version, ingestMeta: state.lastIngestMeta, auditRows: filteredAuditRows(state.auditRows), rows: filteredRows(state.rows), result: state.lastResult })
      : ['=== PICKCALC STATE REPORT ===', `VERSION: ${state.version}`, JSON.stringify({ rows: state.rows, auditRows: state.auditRows, lastIngestMeta: state.lastIngestMeta }, null, 2)].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      UI.renderConsole([{ level: 'success', text: hasVault ? 'Analysis report copied to clipboard.' : 'State report copied to clipboard.' }, ...(state.lastResult?.logs || state.ingestLogs || [])]);
    } catch (error) {
      UI.renderConsole([{ level: 'warning', text: `Clipboard permission blocked: ${error?.message || error}` }, ...(state.lastResult?.logs || state.ingestLogs || [])]);
      try { console.log(text); } catch (_) {}
    }
  }

  async function copyRawVault(idx) {
    try {
      const vault = state.miningVault?.[idx] || null;
      if (!vault) { UI.renderConsole([{ level: 'warning', text: `No vault available for row #${idx}.` }, ...(state.lastResult?.logs || state.ingestLogs || [])]); return; }
      const report = UI.buildAnalysisCopyText({ result: state.lastResult || { row: state.rows?.find?.(r => r.idx === idx) || {}, vault, shield: vault?.shield || {} }, timestamp: new Date().toISOString() });
      await navigator.clipboard.writeText(report);
      UI.renderConsole([{ level: 'success', text: `Plain-text vault copied for row #${idx}.` }, ...(state.lastResult?.logs || state.ingestLogs || [])]);
    } catch (error) {
      UI.renderConsole([{ level: 'warning', text: `Clipboard blocked or report generation failed for row #${idx}: ${error?.message || error}` }, ...(state.lastResult?.logs || state.ingestLogs || [])]);
      try { console.log(UI.buildAnalysisCopyText({ result: state.lastResult || {}, timestamp: new Date().toISOString() })); } catch {}
    }
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
      const runBtn = event.target?.closest?.('#runBtn');
      if (runBtn) { event.preventDefault(); handleMiningClick(false); return; }
      const runLabBtn = event.target?.closest?.('#runKeyLabBtn, #runLabBtn');
      if (runLabBtn) { event.preventDefault(); handleMiningClick(true); return; }
      const btn = event.target?.closest?.('.copy-raw-vault-btn');
      if (!btn) return;
      const idx = Number(btn.dataset.rowIdx);
      if (Number.isFinite(idx)) {
        (async () => {
          try { await copyRawVault(idx); }
          catch (error) {
            UI.renderConsole([{ level: 'warning', text: `Copy Raw Vault failed: ${error?.message || error}` }, ...(state.lastResult?.logs || state.ingestLogs || [])]);
          }
        })();
      }
    });
    const dayScope = UI.el('dayScope');
    if (dayScope) dayScope.addEventListener('change', () => { if (state.auditRows.length || state.rows.length) ingestBoard(); else refreshIntake(); });
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
    UI.renderAnalysisShell({ row: state.rows[0], shield: { integrityScore: 0, label: 'LAB READY' }, connectorState: { liveBranches: 0, derivedBranches: 0 }, vault: { branches: {} }, logs: [{ level: 'success', text: '[LAB] Fixed ignition armed.' }] }, state.rows, state.version);
    UI.renderMiningGrid(state.rows, { branches: {} });
    UI.updateProgressBar(0, state.rows.length, 'Lab boot ready.');
  }

  Object.assign(window.PickCalcCore, { init, state, getDayScopeValue, copyRawVault, handleMiningClick, copyDebug, LAB_BOOT_ROWS });

  const ignite = () => {
    const grid = document.getElementById('miningGrid');
    if (!grid || !window.PickCalcUI || !window.PickCalcConnectors || !window.PickCalcCore) {
      setTimeout(ignite, 50);
      return;
    }
    window.PickCalcCore.init();
    window.PickCalcCore.state.rows = LAB_BOOT_ROWS.map(row => ({ ...row }));
    window.PickCalcUI.showAnalysisScreen();
    window.PickCalcUI.renderMiningGrid(window.PickCalcCore.state.rows, { branches: {} });
    window.PickCalcCore.handleMiningClick(true);
  };
  window.addEventListener('load', ignite);
})();
