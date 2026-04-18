window.PickCalcUI = window.PickCalcUI || {};
(() => {
  const SYSTEM_VERSION = 'v13.77.4 (OXYGEN-COBALT)';
  const BRANCH_TOTAL = 72;
  const BRANCH_KEYS = ['A', 'B', 'C', 'D', 'E'];
  const BRANCH_TARGETS = { A: 20, B: 18, C: 12, D: 10, E: 12 };
  const PROVIDERS = ['FanDuel', 'DraftKings', 'OddsJam', 'Pinnacle', 'Bet365'];
  const MLB_FEED_MATRIX = ['Strikeouts','Total Bases','H+R+RBI','Runs','Hits','Pitching Outs','Earned Runs','Walks Allowed','Hits Allowed'];

  function el(id) { return document.getElementById(id); }
  function escapeHtml(value) { return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function asArray(value) { return Array.isArray(value) ? value : (value ? [value] : []); }

  function renderLeagueChecklist(leagues) {
    const mount = el('leagueChecklist');
    if (!mount) return;
    mount.innerHTML = (leagues || []).map((item) => `<label><input type="checkbox" data-league-id="${escapeHtml(item.id)}" value="${escapeHtml(item.id)}" ${item.checked ? 'checked' : ''}/> ${escapeHtml(item.label)}</label>`).join('');
  }

  function renderRunSummary(rows, auditRows = []) {
    const mount = el('runSummary');
    if (!mount) return;
    mount.innerHTML = [`<div class="pill">Accepted: ${rows.length}</div>`,`<div class="pill">Rejected: ${(auditRows || []).filter((r) => !r.accepted).length}</div>`,`<div class="pill">Version: ${escapeHtml(SYSTEM_VERSION)}</div>`].join('');
  }

  function renderFeedStatus(rows, auditRows = []) {
    const active = new Set((rows || []).filter((r) => r.sport === 'MLB').map((r) => String(r.prop || '').trim()));
    const mount = el('feedStatus');
    if (!mount) return;
    mount.innerHTML = `<div class="status-panel"><div class="status-panel-head"><div><strong>MLB Master Feed Checklist</strong><div class="mini-muted">Flip to ✅ only when a valid row enters the pool.</div></div><span class="status-badge ${(auditRows || []).some((r) => !r.accepted) ? 'status-no' : 'status-ok'}">${(auditRows || []).length} CLUSTERS</span></div><div class="prop-grid">${MLB_FEED_MATRIX.map((prop) => `<div class="prop-chip ${active.has(prop) ? 'prop-fed' : 'prop-missing'}"><span>${active.has(prop) ? '✅' : '❌'}</span><span>${escapeHtml(prop)}</span></div>`).join('')}</div></div>`;
  }

  function renderPoolTable(rows) {
    const mount = el('poolMount');
    if (!mount) return;
    if (!rows.length) { mount.innerHTML = ''; return; }
    mount.innerHTML = `<div class="status-panel"><div class="table-wrap"><table><thead><tr><th>#</th><th>Sport</th><th>League</th><th>Player / Entity</th><th>Team</th><th>Opponent</th><th>Prop</th><th>Line</th><th>Time</th><th>Type</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.idx)}</td><td>${escapeHtml(row.sport)}</td><td>${escapeHtml(row.league)}</td><td>${escapeHtml(row.parsedPlayer)}</td><td>${escapeHtml(row.team || '')}</td><td>${escapeHtml(row.opponent || '')}</td><td>${escapeHtml(row.prop || '')}</td><td>${escapeHtml(row.line || '')}</td><td>${escapeHtml(row.gameTimeText || '')}</td><td>${escapeHtml(row.type || '')}</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  function branchTone(branch) {
    if (branch?.status === 'SUCCESS') return { card: 'support live-data', badge: 'live', label: 'REAL' };
    if (branch?.status === 'DERIVED') return { card: 'warning heuristic-data', badge: 'heuristic', label: 'DERIVED' };
    if (branch?.status === 'SIMULATED') return { card: 'warning heuristic-data', badge: 'heuristic', label: 'SIMULATED' };
    if (branch?.status === 'WARNING') return { card: 'status-pending', badge: 'heuristic', label: 'WARNING' };
    return { card: 'status-pending', badge: 'heuristic', label: 'PENDING' };
  }

  function formatValue(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
  }

  function renderFactorLine(meta = {}) {
    const numericValue = Number(meta.value);
    const zeroStyle = numericValue === 0 ? ' style="color:#ff4d4d; font-weight:bold;"' : '';
    return `<div class="factor-line"><span class="factor-name">${escapeHtml(meta.name || '')}:</span> <span class="factor-value"${zeroStyle}>${escapeHtml(formatValue(meta.value))}</span> <span class="factor-status">- ${escapeHtml(meta.status || 'WARNING')}</span></div>`;
  }

  function renderMarketProviders(providerMap = {}) {
    const providerLine = [
      ['FanDuel', providerMap.FanDuel || 0],
      ['DraftKings', providerMap.DraftKings || 0],
      ['OddsJam', providerMap.OddsJam || 0],
      ['Pinnacle', providerMap.Pinnacle || 0],
      ['Bet365', providerMap.Bet365 || 0]
    ].map(([label, value]) => {
      const numericValue = Number(value);
      const zeroStyle = numericValue === 0 ? ' style="color:#ff4d4d; font-weight:bold;"' : '';
      return `${label}: <span${zeroStyle}>${escapeHtml(formatValue(value))}</span>`;
    }).join(' | ');
    return `<div class="market-providers"><strong>Market Projections/Odds:</strong><div>${providerLine}</div></div>`;
  }

  function renderPlayerMiningCard(row = {}, vault = {}) {
    const branches = vault?.branches || {};
    const matchupLine = `${row.opponent || ''}${row.gameTimeText ? ` - ${row.gameTimeText}` : ''}`.trim();
    const propLine = `${row.prop || ''} ${row.line || ''} ${row.direction || ''}`.trim();
    return `<article class="player-mining-card"><div class="player-header-line"><strong>${escapeHtml(row.parsedPlayer || '')} - ${escapeHtml(row.team || '')}</strong></div><div class="player-header-line"><strong>${escapeHtml(matchupLine)}</strong></div><div class="player-header-line"><strong>${escapeHtml(propLine)}</strong></div>${BRANCH_KEYS.map((branchKey) => {
      const branch = branches[branchKey] || { factorMeta: {}, providerMap: {}, status: 'PENDING' };
      const tone = branchTone(branch);
      const factorMeta = Object.values(branch.factorMeta || {});
      return `<section class="branch-block ${tone.card}"><div class="branch-title"><strong>Branch ${escapeHtml(branchKey)}</strong> <span class="card-type-tag ${tone.badge}">${escapeHtml(tone.label)}</span></div>${factorMeta.map(renderFactorLine).join('')}${branchKey === 'E' ? renderMarketProviders(branch.providerMap || {}) : ''}</section>`;
    }).join('')}</article>`;
  }

  function renderMiningGrid(rows = [], vaultCollection = {}) {
    const mount = el('miningGrid');
    if (!mount) return;
    const safeRows = asArray(rows);
    const safeVaults = vaultCollection && typeof vaultCollection === 'object' ? vaultCollection : {};
    const hasVaultData = Object.keys(safeVaults).length > 0;
    const cards = safeRows.map((row) => renderPlayerMiningCard(row, safeVaults?.[row.LEG_ID] || {})).join('');
    const emptyState = hasVaultData ? '<div class="mini-muted">Awaiting rows.</div>' : '<div class="mini-muted">WAITING_FOR_BRIDGE</div>';
    mount.innerHTML = `<div class="status-panel"><div class="status-panel-head"><div><strong>Verbatim Density Layout</strong><div class="mini-muted">7-player sequential shell. Player / Team / Matchup / Time header locked. Branch E market providers rendered inline.</div></div><div class="pill">Rows Loaded: ${safeRows.length}</div></div><div class="dense-player-grid">${cards || emptyState}</div></div>`;
  }

  function renderConsole(logs) {
    const mount = el('systemConsole');
    if (!mount) return;
    const items = asArray(logs);
    if (!items.length) return;
    mount.innerHTML = items.map((entry) => `<div class="console-line">${escapeHtml(entry.text || entry.message || String(entry))}</div>`).join('');
  }

  function appendConsole(log) {
    const mount = el('systemConsole');
    if (!mount) return;
    const line = document.createElement('div');
    line.className = 'console-line';
    line.textContent = log?.text || log?.message || String(log);
    mount.prepend(line);
  }

  function summarizeShield(vaultCollection = {}) {
    let real = 0, derived = 0, simulated = 0, warnings = 0, total = 0;
    Object.values(vaultCollection || {}).forEach((vault) => {
      Object.values(vault?.branches || {}).forEach((branch) => {
        real += Number(branch.realCount || 0);
        derived += Number(branch.derivedCount || 0);
        simulated += Number(branch.simulatedCount || 0);
        warnings += Number(branch.warningCount || 0);
        total += Number(branch.factorsTarget || 0);
      });
    });
    const integrityScore = total ? (((real + (derived * 0.55)) / total) * 100).toFixed(2) : '0.00';
    const purityScore = total ? ((real / total) * 100).toFixed(2) : '0.00';
    const confidenceAvg = total ? (((real + derived + (simulated * 0.2)) / total) * 100).toFixed(2) : '0.00';
    return { integrityScore, purityScore, confidenceAvg, real, derived, simulated, warnings, total };
  }

  function renderAnalysisShell(result = {}, rows = [], version = SYSTEM_VERSION) {
    if (el('analysisTitle')) el('analysisTitle').textContent = `Run Analysis ${version}`;
    if (el('analysisVersion')) el('analysisVersion').textContent = `Version: ${version}`;
    if (el('shieldTitle')) el('shieldTitle').textContent = `Alpha Shield ${version}`;

    const row = result?.row || rows[0] || {};
    const vaultCollection = result?.vaultCollection || (row?.LEG_ID && result?.vault ? { [row.LEG_ID]: result.vault } : {});
    const shield = summarizeShield(vaultCollection);
    const summary = el('analysisSummary');
    if (summary) summary.innerHTML = [`<div class="pill">Rows: ${rows.length}</div>`,`<div class="pill">Integrity: ${escapeHtml(shield.integrityScore)}</div>`,`<div class="pill">Purity: ${escapeHtml(shield.purityScore)}</div>`,`<div class="pill">Confidence: ${escapeHtml(shield.confidenceAvg)}</div>`,`<div class="pill">REAL: ${escapeHtml(shield.real)}</div>`,`<div class="pill">SIMULATED: ${escapeHtml(shield.simulated)}</div>`].join('');
    const hint = el('analysisHint');
    if (hint) hint.textContent = result?.analysisHint || 'OXYGEN-COBALT recovery active.';
    const rowCard = el('analysisRowCard');
    if (rowCard) rowCard.innerHTML = `<div class="status-panel"><div><strong>${escapeHtml(row.parsedPlayer || '')} - ${escapeHtml(row.team || '')}</strong></div><div class="mini-muted">${escapeHtml(row.opponent || '')} - ${escapeHtml(row.gameTimeText || '')}</div><div class="mini-muted">${escapeHtml(row.prop || '')} ${escapeHtml(row.line || '')} ${escapeHtml(row.direction || '')}</div><div class="mini-muted">LEG_ID: ${escapeHtml(row.LEG_ID || '')}</div></div>`;
    const kpis = el('analysisKpis');
    if (kpis) kpis.innerHTML = [`<div class="pill">A: 20</div>`,`<div class="pill">B: 18</div>`,`<div class="pill">C: 12</div>`,`<div class="pill">D: 10</div>`,`<div class="pill">E: 12</div>`,`<div class="pill">Target: ${BRANCH_TOTAL}</div>`].join('');
    renderMiningGrid(rows, vaultCollection);
    const shieldPanel = el('shieldPanel');
    if (shieldPanel) shieldPanel.innerHTML = [`<div class="status-panel"><strong>Integrity Score</strong><div>${escapeHtml(shield.integrityScore)}</div></div>`,`<div class="status-panel"><strong>Purity Score</strong><div>${escapeHtml(shield.purityScore)}</div></div>`,`<div class="status-panel"><strong>Confidence Avg</strong><div>${escapeHtml(shield.confidenceAvg)}</div></div>`,`<div class="status-panel"><strong>REAL / DERIVED / SIMULATED / WARNING</strong><div>${escapeHtml(shield.real)} / ${escapeHtml(shield.derived)} / ${escapeHtml(shield.simulated)} / ${escapeHtml(shield.warnings)}</div></div>`].join('');
    const body = el('analysisResultsBody');
    if (body) body.innerHTML = rows.map((item) => `<tr><td>${escapeHtml(item.idx)}</td><td>${escapeHtml(item.sport)}</td><td>${escapeHtml(item.league)}</td><td>${escapeHtml(item.parsedPlayer)}</td><td>${escapeHtml(item.team || '')}</td><td>${escapeHtml(item.opponent || '')}</td><td>${escapeHtml(item.prop || '')}</td><td>${escapeHtml(item.line || '')}</td><td>${escapeHtml(item.type || '')}</td></tr>`).join('');
    renderConsole(result.logs || []);
  }

  function updateProgressBar(index = 0, total = 1, message = '') {
    const mount = el('progressBar');
    if (!mount) return;
    const safeTotal = Math.max(1, Number(total) || 1);
    const safeIndex = Math.max(0, Math.min(safeTotal, Number(index) || 0));
    const pct = Math.floor((safeIndex / safeTotal) * 100);
    if (!mount.querySelector('.progress-bar-shell')) {
      mount.innerHTML = `<div class="progress-bar-shell"><div class="progress-bar-fill"></div></div><div class="progress-bar-meta"><strong>0%</strong><span>Preparing oxygen stream...</span><span>0/0 probes</span></div>`;
    }
    const fill = mount.querySelector('.progress-bar-fill');
    const strong = mount.querySelector('.progress-bar-meta strong');
    const spans = mount.querySelectorAll('.progress-bar-meta span');
    window.requestAnimationFrame(() => {
      if (fill) {
        fill.style.width = `${pct}%`;
        fill.innerHTML = `<div class="progress-inner"><span>📡 ${pct}% | ${escapeHtml(message || 'OXYGEN-COBALT recovery active.')}</span></div>`;
      }
      if (strong) strong.textContent = `${pct}%`;
      if (spans[0]) spans[0].textContent = `📡 ${message || 'OXYGEN-COBALT recovery active.'}`;
      if (spans[1]) spans[1].textContent = `${safeIndex}/${safeTotal} probes`;
    });
  }

  function initProgressBar(completedRows = 0, totalRows = 1, label = 'Initializing stream...') { updateProgressBar(completedRows, totalRows, label); }
  function renderAnalysisResults(rows, auditRows, result, version = SYSTEM_VERSION) { renderAnalysisShell(result, rows, version); }
  function renderStreamUpdate(rows, auditRows, result, version = SYSTEM_VERSION, meta = {}) {
    renderAnalysisShell(result, rows, version);
    updateProgressBar(meta.completedProbes || 0, meta.totalProbes || 1, result?.analysisHint || 'Streaming analysis active.');
    const responseText = result?.responseText || result?.errorText || '';
    console.log("RAW_MODEL_DATA:", responseText);
    if (Number(result?.errorStatus) === 400 && result?.errorText) {
      appendConsole({ level: 'warning', text: `[SYSTEM] 400 GOOGLE_ERROR: ${result.errorText}` });
    }
  }

  function showAnalysisScreen() { const intake = el('intakeScreen'); const analysis = el('analysisScreen'); if (intake) { intake.classList.add('hidden'); intake.style.display = 'none'; } if (analysis) { analysis.classList.remove('hidden'); analysis.style.display = 'block'; } }
  function backToIntake() { const intake = el('intakeScreen'); const analysis = el('analysisScreen'); if (analysis) analysis.classList.add('hidden'); if (intake) { intake.classList.remove('hidden'); intake.style.display = 'block'; } }
  function showOverlay(title, body) { if (el('runOverlay')) el('runOverlay').classList.remove('hidden'); if (el('overlaySub')) el('overlaySub').textContent = title; if (el('overlayBody')) el('overlayBody').textContent = body; }
  function hideOverlay() { if (el('runOverlay')) el('runOverlay').classList.add('hidden'); }
  function bindResizeRedraw() { window.addEventListener('resize', () => {}); }
  function buildAnalysisCopyText(context = {}) {
    const v = context.result?.vault || {};
    const r = context.result?.row || {};
    const summary = Object.keys(v.branches || {}).map(k => {
      const active = Object.values(v.branches[k]?.parsed || {}).filter(val => Number(val) > 0.1).length;
      return `${k}:${active}`;
    }).join('|');

    return [
      `v13.77.4 [${r.LEG_ID}] ${r.parsedPlayer}`,
      `SATURATION: ${summary}`,
      `PROJECTIONS: ${JSON.stringify(v.branches?.E?.providerMap || {})}`
    ].join('\n');
  }


  Object.assign(window.PickCalcUI, { MLB_FEED_MATRIX, el, renderLeagueChecklist, renderRunSummary, renderFeedStatus, renderPoolTable, renderAnalysisShell, renderAnalysisResults, renderStreamUpdate, renderConsole, appendConsole, showOverlay, hideOverlay, backToIntake, showAnalysisScreen, bindResizeRedraw, buildAnalysisCopyText, initProgressBar, updateProgressBar, renderMiningGrid });
  window.onerror = function(message, source, lineno, colno) { try { appendConsole({ level: 'warning', text: `[OXYGEN-COBALT] ${message} @ ${source || 'unknown'}:${lineno || 0}:${colno || 0}` }); } catch (_) {} return false; };
})();
