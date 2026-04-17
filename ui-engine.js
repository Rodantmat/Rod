
window.PickCalcUI = window.PickCalcUI || {};
(() => {
  const SYSTEM_VERSION = 'v13.61.0 (OXYGEN-ATOMIC)';
  const MLB_FEED_MATRIX = ['Strikeouts','Total Bases','H+R+RBI','Runs','Hits','Pitching Outs','Earned Runs','Walks Allowed','Hits Allowed'];
  const BRANCH_TOTAL = 72;
  const BRANCH_KEYS = ['A','B','C','D','E'];
  const BRANCH_TARGETS = { A:20, B:18, C:12, D:10, E:12 };

  function el(id) { return document.getElementById(id); }
  function escapeHtml(value) { return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function copyVaultButton(rowIdx) { return `<button class="secondary copy-raw-vault-btn" data-row-idx="${escapeHtml(rowIdx)}">[ COPY RAW VAULT ]</button>`; }
  function asArray(logs) { return Array.isArray(logs) ? logs : (logs ? [logs] : []); }

  function renderLeagueChecklist(leagues) {
    const mount = el('leagueChecklist'); if (!mount) return;
    mount.innerHTML = (leagues || []).map(item => `<label><input type="checkbox" data-league-id="${escapeHtml(item.id)}" value="${escapeHtml(item.id)}" ${item.checked ? 'checked' : ''}/> ${escapeHtml(item.label)}</label>`).join('');
  }

  function renderRunSummary(rows, auditRows = []) {
    const mount = el('runSummary'); if (!mount) return;
    mount.innerHTML = [`<div class="pill">Accepted: ${rows.length}</div>`,`<div class="pill">Rejected: ${(auditRows || []).filter(r => !r.accepted).length}</div>`,`<div class="pill">Version: ${escapeHtml(SYSTEM_VERSION)}</div>`].join('');
  }

  function renderFeedStatus(rows, auditRows = []) {
    const active = new Set((rows || []).filter(r => r.sport === 'MLB').map(r => String(r.prop || '').trim()));
    const rejected = (auditRows || []).filter(r => !r.accepted).slice(-5);
    const mount = el('feedStatus'); if (!mount) return;
    mount.innerHTML = `<div class="status-panel"><div class="status-panel-head"><div><strong>MLB Master Feed Checklist</strong><div class="mini-muted">Flip to ✅ only when a valid row enters the pool.</div></div><span class="status-badge ${rejected.length ? 'status-no' : 'status-ok'}">${(auditRows || []).length} CLUSTERS</span></div><div class="prop-grid">${MLB_FEED_MATRIX.map(prop => `<div class="prop-chip ${active.has(prop) ? 'prop-fed' : 'prop-missing'}"><span>${active.has(prop) ? '✅' : '❌'}</span><span>${escapeHtml(prop)}</span></div>`).join('')}</div>${rejected.length ? `<div class="warning-banner">Recent rejections</div>${rejected.map(r => `<div class="mini-muted" style="margin-top:6px;">#${r.idx} ${escapeHtml(r.parsedPlayer || r.cleanedRawText || r.rawText)} — ${escapeHtml(r.timeFilter?.detail || r.rejectionReason || 'Rejected')}</div>`).join('')}` : ''}</div>`;
  }

  function renderPoolTable(rows) {
    const mount = el('poolMount'); if (!mount) return; if (!rows.length) { mount.innerHTML = ''; return; }
    mount.innerHTML = `<div class="status-panel"><div class="table-wrap"><table><thead><tr><th>#</th><th>Sport</th><th>League</th><th>Player / Entity</th><th>Team</th><th>Opponent</th><th>Prop</th><th>Line</th><th>Time</th><th>Type</th></tr></thead><tbody>${rows.map(row => `<tr><td>${row.idx}</td><td>${escapeHtml(row.sport)}</td><td>${escapeHtml(row.league)}</td><td><div>${escapeHtml(row.parsedPlayer)}</div><div style="margin-top:8px;">${copyVaultButton(row.idx)}</div></td><td>${escapeHtml(row.team||'')}</td><td>${escapeHtml(row.opponent||'')}</td><td>${escapeHtml(row.prop)}</td><td>${escapeHtml(row.line)}</td><td>${escapeHtml(row.gameTimeText||'')}</td><td>${escapeHtml(row.type)}</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  function factorKeysForBranch(key) {
    const prefix = key.toLowerCase();
    return Array.from({ length: BRANCH_TARGETS[key] || 0 }, (_, idx) => `${prefix}${String(idx + 1).padStart(2, '0')}`);
  }

  function branchTone(branch) {
    if (branch?.status === 'SUCCESS' || branch?.sourceMode === 'LIVE DATA') return { card: 'support live-data', badge: 'live', status: 'ready', label: 'LIVE', icon: '✅' };
    if (branch?.status === 'DERIVED' || branch?.sourceMode === 'DERIVED') return { card: 'warning heuristic-data', badge: 'heuristic', status: 'loading', label: 'DERIVED', icon: '🟨' };
    if (branch?.status === 'PENDING') return { card: 'status-pending', badge: 'heuristic', status: 'waiting', label: 'MINING...', icon: '⏳' };
    return { card: 'warning', badge: 'heuristic', status: 'failed', label: 'INTERRUPTED', icon: '❌' };
  }

  function buildFactorSlots(branchKey, parsed = {}) {
    const labels = Object.keys(parsed);
    const keys = labels.length ? labels : factorKeysForBranch(branchKey);
    return keys.map((label) => {
      const value = Number(parsed[label] ?? 0);
      return `<div class="shield-cell"><strong>${escapeHtml(label)}</strong><div>${escapeHtml(Number.isFinite(value) ? value : 0)}</div></div>`;
    }).join('');
  }

  function miningCardMarkup(key, branch = {}) {
    const safeBranch = Object.assign({ status: 'PENDING', sourceMode: 'PENDING', factorsFound: 0, factorsTarget: BRANCH_TARGETS[key], source: 'Mining...', parsed: {}, note: 'Mining...' }, branch || {});
    const tone = branchTone(safeBranch);
    const pct = Math.max(0, Math.min(100, Math.round(((safeBranch.factorsFound || 0) / Math.max(1, safeBranch.factorsTarget || 1)) * 100)));
    return `<article class="mining-card ${tone.card}" data-branch-key="${escapeHtml(key)}"><div class="factor-top"><h3 style="margin:0;">Branch ${key}</h3><span class="card-type-tag ${tone.badge}">${tone.label}</span></div><div class="mining-status ${tone.status}">${tone.icon} ${escapeHtml(safeBranch.status)}</div><div class="factor-top"><div class="factor-delta">${escapeHtml(safeBranch.factorsFound)}/${escapeHtml(safeBranch.factorsTarget)}</div><div class="mini-muted">${escapeHtml(safeBranch.source || '')}</div></div><div class="conf-bar"><div class="conf-fill" style="width:${pct}%"></div></div><div class="detail-box"><strong>Note</strong>${escapeHtml(safeBranch.note || '')}</div><div class="shield-grid branch-factor-body" style="margin-top:12px;">${buildFactorSlots(key, safeBranch.parsed)}</div></article>`;
  }

  function ensureMiningGridSkeleton(row = {}, vault = {}) {
    const mount = el('miningGrid'); if (!mount) return;
    const branches = vault?.branches || {};
    const totalFound = BRANCH_KEYS.reduce((sum, key) => sum + Number(branches[key]?.factorsFound || 0), 0);
    const cards = BRANCH_KEYS.map(key => miningCardMarkup(key, branches[key] || { status: 'PENDING' })).join('');
    mount.innerHTML = `<div class="status-panel"><div class="status-panel-head"><div><strong>Mining Matrix</strong><div class="mini-muted">Branch readiness with exact 72-slot saturation. Overall: <span id="matrixFactorTotal">${totalFound}/${BRANCH_TOTAL}</span> factors.</div></div><button id="viewVaultBtn" class="secondary">VIEW RAW VAULT</button></div><div class="mining-grid-inner mining-grid">${cards}</div></div>`;
    const btn = document.getElementById('viewVaultBtn');
    if (btn) btn.onclick = () => { window.PickCalcCore = window.PickCalcCore || {}; console.log(window.PickCalcCore.state?.miningVault?.[row.idx] || vault); };
  }

  function updateMatrixIcon(branchKey, branch = {}, vault = {}) {
    const root = el('miningGrid'); if (!root) return;
    const card = root.querySelector(`[data-branch-key="${branchKey}"]`); if (!card) return;
    const tone = branchTone(branch || {});
    card.className = `mining-card ${tone.card} is-streaming`;
    const status = card.querySelector('.mining-status');
    if (status) { status.className = `mining-status ${tone.status}`; status.textContent = `${tone.icon} ${branch?.status || 'PENDING'}`; }
    const badge = card.querySelector('.card-type-tag');
    if (badge) { badge.className = `card-type-tag ${tone.badge}`; badge.textContent = tone.label; }
    const delta = card.querySelector('.factor-delta');
    if (delta) delta.textContent = `${branch?.factorsFound || 0}/${branch?.factorsTarget || 0}`;
    const muted = card.querySelector('.mini-muted');
    if (muted) muted.textContent = branch?.source || '';
    const fill = card.querySelector('.conf-fill');
    if (fill) fill.style.width = `${Math.max(0, Math.min(100, Math.round(((branch?.factorsFound || 0) / Math.max(1, branch?.factorsTarget || 1)) * 100)))}%`;
    const detail = card.querySelector('.detail-box');
    if (detail) detail.innerHTML = `<strong>Note</strong>${escapeHtml(branch?.note || '')}`;
    const body = card.querySelector('.branch-factor-body');
    if (body) body.innerHTML = buildFactorSlots(branchKey, branch?.parsed || {});
    const totalEl = document.getElementById('matrixFactorTotal');
    if (totalEl) {
      const branches = vault?.branches || {};
      totalEl.textContent = `${BRANCH_KEYS.reduce((sum, key) => sum + Number(branches[key]?.factorsFound || 0), 0)}/${BRANCH_TOTAL}`;
    }
  }

  function renderMiningMatrix(row, vault) {
    ensureMiningGridSkeleton(row, vault);
    const branches = vault?.branches || {};
    BRANCH_KEYS.forEach(key => updateMatrixIcon(key, branches[key] || { status: 'PENDING' }, { branches }));
  }

  function renderShield(shield) {
    const mount = el('shieldPanel'); if (!mount) return;
    mount.innerHTML = `<div class="shield-cell"><strong>Integrity Score</strong><div>${escapeHtml(shield.integrityScore ?? 0)}</div></div><div class="shield-cell"><strong>Purity Score</strong><div>${escapeHtml(shield.purityScore ?? 0)}</div></div><div class="shield-cell"><strong>Confidence Average</strong><div>${escapeHtml(shield.confidenceAvg ?? 0)}</div></div><div class="shield-cell"><strong>Shield Status</strong><div>${escapeHtml(shield.label || '')}</div></div>`;
  }

  function renderAnalysisTable(rows) {
    const mount = el('analysisResultsBody'); if (!mount) return;
    mount.innerHTML = (rows || []).map(row => `<tr><td>${row.idx}</td><td>${escapeHtml(row.sport)}</td><td>${escapeHtml(row.league)}</td><td><div>${escapeHtml(row.parsedPlayer)}</div><div style="margin-top:8px;">${copyVaultButton(row.idx)}</div></td><td>${escapeHtml(row.team||'')}</td><td>${escapeHtml(row.opponent||'')}</td><td>${escapeHtml(row.prop)}</td><td>${escapeHtml(row.line)}</td><td>${escapeHtml(row.type)}</td></tr>`).join('');
  }

  function renderConsole(logs) {
    const mount = document.getElementById('systemConsole');
    if (!mount) return;
    asArray(logs).forEach(log => {
      const div = document.createElement('div');
      div.className = `console-line ${log.level || 'info'}`;
      div.textContent = `[${new Date().toLocaleTimeString()}] ${String(log.text || '')}`;
      mount.prepend(div);
    });
    while (mount.children.length > 100) mount.lastChild.remove();
  }

  function renderMiningGrid(rowsOrRow, vault = { branches: {} }) {
    const firstRow = Array.isArray(rowsOrRow) ? (rowsOrRow[0] || {}) : (rowsOrRow || {});
    ensureMiningGridSkeleton(firstRow, vault || { branches: {} });
    renderMiningMatrix(firstRow, vault || { branches: {} });
  }

  function renderAnalysisShell(result, pool, version = SYSTEM_VERSION) {
    const safeResult = result || { row: {}, shield: {}, connectorState: {}, vault: { branches: {} }, logs: [] };
    const safePool = Array.isArray(pool) ? pool : [];
    showAnalysisScreen();
    el('analysisSummary').innerHTML = [`<div class="pill">Version: ${escapeHtml(version)}</div>`,`<div class="pill">Rows in pool: ${safePool.length}</div>`,`<div class="pill">Selected row: ${escapeHtml(safeResult.row?.parsedPlayer || 'Unknown')}</div>`,`<div class="pill">League: ${escapeHtml(safeResult.row?.league || 'Unknown')}</div>`].join('');
    el('analysisHint').textContent = safeResult.analysisHint || `${safeResult.row?.sport || 'MLB/NHL'} OMNI-MINER hard-lock matrix active.`;
    el('analysisRowCard').innerHTML = `<div class="row-card"><div class="cell"><strong>Sport</strong>${escapeHtml(safeResult.row?.sport || '')}</div><div class="cell"><strong>League</strong>${escapeHtml(safeResult.row?.league || '')}</div><div class="cell"><strong>Player / Entity</strong>${escapeHtml(safeResult.row?.parsedPlayer || '')}<div style="margin-top:8px;">${copyVaultButton(safeResult.row?.idx ?? 0)}</div></div><div class="cell"><strong>Team</strong>${escapeHtml(safeResult.row?.team || 'TBD')}</div><div class="cell"><strong>Opponent</strong>${escapeHtml(safeResult.row?.opponent || 'TBD')}</div><div class="cell"><strong>Prop</strong>${escapeHtml(safeResult.row?.prop || '')}</div><div class="cell"><strong>Line</strong>${escapeHtml(safeResult.row?.line || '')}</div><div class="cell"><strong>Direction</strong>${escapeHtml(safeResult.row?.direction || '')}</div></div>`;
    el('analysisKpis').innerHTML = `<div class="kpi-card"><strong>Integrity Score</strong>${escapeHtml(safeResult.shield?.integrityScore ?? 0)}</div><div class="kpi-card"><strong>Live Branches</strong>${escapeHtml(safeResult.connectorState?.liveBranches ?? 0)}</div><div class="kpi-card"><strong>Derived Branches</strong>${escapeHtml(safeResult.connectorState?.derivedBranches ?? 0)}</div><div class="kpi-card"><strong>Vault</strong>${escapeHtml(safeResult.vault?.timestamp || '--')}</div>`;
    renderMiningGrid(safeResult.row || {}, { branches: safeResult.vault?.branches || {} });
    renderShield(safeResult.shield || {});
    renderAnalysisTable(safePool);
    renderConsole(safeResult.logs || []);
  }

  function renderAnalysisResults(rows, auditRows, result, version = SYSTEM_VERSION) {
    renderAnalysisShell(result, rows, version);
    const totalRows = Array.isArray(rows) ? rows.length : 0;
    const completedRows = result?.connectorState?.completedRows ?? (result?.vault?.branches ? Number(BRANCH_KEYS.every(k => result.vault.branches?.[k]?.status === 'SUCCESS')) : 0);
    updateProgressBar(completedRows, Math.max(1, totalRows), result?.analysisHint || 'Streaming analysis active.');
  }

  function initProgressBar(completedRows = 0, totalRows = 1, label = 'Initializing stream...') {
    updateProgressBar(completedRows, totalRows, label);
  }

  function updateProgressBar(index = 0, total = 1, message = '') {
    const mount = el('progressBar'); if (!mount) return;
    const safeTotal = Math.max(1, Number(total) || 1);
    const safeIndex = Math.max(0, Math.min(safeTotal, Number(index) || 0));
    const pct = Math.floor((safeIndex / safeTotal) * 100);
    const resolvedMessage = typeof message === 'string' ? message : String(message?.text || message?.subText || 'Oxygen Restore active.');
    let shell = mount.querySelector('.progress-bar-shell');
    let fill = mount.querySelector('.progress-bar-fill');
    let meta = mount.querySelector('.progress-bar-meta');
    if (!shell || !fill || !meta) {
      mount.innerHTML = `<div class="progress-bar-shell"><div class="progress-bar-fill"></div></div><div class="progress-bar-meta"><strong>0%</strong><span>Preparing oxygen stream...</span><span>0/0 probes</span></div>`;
      shell = mount.querySelector('.progress-bar-shell');
      fill = mount.querySelector('.progress-bar-fill');
      meta = mount.querySelector('.progress-bar-meta');
    }
    window.requestAnimationFrame(() => {
      if (fill) {
        fill.style.width = `${pct}%`;
        fill.innerHTML = `<div class="progress-inner"><span>📡 ${pct}% | ${escapeHtml(resolvedMessage)}</span></div>`;
      }
      const strong = meta?.querySelector('strong');
      const spans = meta?.querySelectorAll('span') || [];
      if (strong) strong.textContent = `${pct}%`;
      if (spans[0]) spans[0].textContent = `📡 ${resolvedMessage}`;
      if (spans[1]) spans[1].textContent = `${safeIndex}/${safeTotal} probes`;
    });
  }

  function renderStreamUpdate(rows, auditRows, result, version = SYSTEM_VERSION, meta = {}) {
    const patched = Object.assign({}, result || {});
    patched.connectorState = Object.assign({}, patched.connectorState || {}, { completedRows: Number(meta.completedRows || 0) });
    patched.analysisHint = meta.branchKey && meta.branchKey !== 'DONE'
      ? `Oxygen Restore streaming Branch ${meta.branchKey} for ${patched.row?.parsedPlayer || 'current row'}.`
      : `Deep Saturating: ${Number(meta.completedRows || 0)}/${Math.max(1, Number(meta.totalRows || 1))} row(s) completed.`;
    if (!el('analysisSummary')?.innerHTML) renderAnalysisShell(patched, rows, version);
    const progressCompleted = Number(meta.completedProbes ?? meta.completedRows ?? 0);
    const progressTotal = Math.max(1, Number(meta.totalProbes ?? meta.totalRows ?? (Array.isArray(rows) ? rows.length : 1)));
    updateProgressBar(progressCompleted, progressTotal, patched.analysisHint);
    renderAnalysisShell(patched, Array.isArray(rows) ? rows : [], version);
  }

  function showAnalysisScreen() {
    const intake = el('intakeScreen');
    const analysis = el('analysisScreen');
    if (intake) { intake.classList.add('hidden'); intake.style.display = 'none'; }
    if (analysis) { analysis.classList.remove('hidden'); analysis.style.display = 'block'; analysis.style.visibility = 'visible'; analysis.style.opacity = '1'; }
  }

  function showOverlay(title, body) { el('runOverlay')?.classList.remove('hidden'); el('overlaySub').textContent = title; el('overlayBody').textContent = body; }
  function hideOverlay() { el('runOverlay')?.classList.add('hidden'); }
  function backToIntake() {
    const intake = el('intakeScreen');
    const analysis = el('analysisScreen');
    if (analysis) analysis.classList.add('hidden');
    if (intake) { intake.classList.remove('hidden'); intake.style.display = 'block'; intake.style.visibility = 'visible'; intake.style.opacity = '1'; }
  }
  function bindResizeRedraw() { window.addEventListener('resize', () => {}); }

  function buildAnalysisCopyText(context = {}) {
    const result = context.result || {};
    const vault = result.vault || context.vault || {};
    const branches = vault.branches || {};
    const row = result.row || context.row || {};
    const shield = result.shield || context.shield || vault.shield || {};
    const rows = Array.isArray(context.rows) ? context.rows : [];
    return ['=== PICKCALC LAB REPORT ===', `VERSION: ${context.version || SYSTEM_VERSION}`, `PLAYER: ${row.parsedPlayer || ''}`, `INTEGRITY: ${shield.integrityScore || 0}`, JSON.stringify({ row, rows, shield, branches }, null, 2)].join('\n');
  }

  Object.assign(window.PickCalcUI, {
    MLB_FEED_MATRIX,
    el,
    renderLeagueChecklist,
    renderRunSummary,
    renderFeedStatus,
    renderPoolTable,
    renderAnalysisShell,
    renderAnalysisResults,
    renderStreamUpdate,
    renderConsole,
    showOverlay,
    hideOverlay,
    backToIntake,
    showAnalysisScreen,
    bindResizeRedraw,
    buildAnalysisCopyText,
    initProgressBar,
    updateProgressBar,
    updateMatrixIcon,
    renderMiningGrid
  });

  window.onerror = function(message, source, lineno, colno) {
    try {
      renderConsole({ level: 'warning', text: `[OXYGEN RESTORE] ${message} @ ${source || 'unknown'}:${lineno || 0}:${colno || 0}` });
    } catch (_) {}
    return false;
  };
})();
