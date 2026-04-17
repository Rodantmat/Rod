window.PickCalcUI = window.PickCalcUI || {};
(() => {
  const SYSTEM_VERSION = 'v13.62.0 (OXYGEN-COBALT)';
  const BRANCH_TOTAL = 72;
  const BRANCH_KEYS = ['A', 'B', 'C', 'D', 'E'];
  const BRANCH_TARGETS = { A: 20, B: 18, C: 12, D: 10, E: 12 };
  const BRANCH_WEIGHTS = { A: 0.28, B: 0.22, C: 0.18, D: 0.14, E: 0.18 };
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
    mount.innerHTML = `<div class="status-panel"><div class="status-panel-head"><div><strong>MLB Master Feed Checklist</strong><div class="mini-muted">Flip to ✅ only when a valid row enters the pool.</div></div><span class="status-badge ${auditRows.some((r) => !r.accepted) ? 'status-no' : 'status-ok'}">${(auditRows || []).length} CLUSTERS</span></div><div class="prop-grid">${MLB_FEED_MATRIX.map((prop) => `<div class="prop-chip ${active.has(prop) ? 'prop-fed' : 'prop-missing'}"><span>${active.has(prop) ? '✅' : '❌'}</span><span>${escapeHtml(prop)}</span></div>`).join('')}</div></div>`;
  }

  function renderPoolTable(rows) {
    const mount = el('poolMount');
    if (!mount) return;
    if (!rows.length) { mount.innerHTML = ''; return; }
    mount.innerHTML = `<div class="status-panel"><div class="table-wrap"><table><thead><tr><th>#</th><th>Sport</th><th>League</th><th>Player / Entity</th><th>Team</th><th>Opponent</th><th>Prop</th><th>Line</th><th>Time</th><th>Type</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.idx)}</td><td>${escapeHtml(row.sport)}</td><td>${escapeHtml(row.league)}</td><td>${escapeHtml(row.parsedPlayer)}</td><td>${escapeHtml(row.team || '')}</td><td>${escapeHtml(row.opponent || '')}</td><td>${escapeHtml(row.prop || '')}</td><td>${escapeHtml(row.line || '')}</td><td>${escapeHtml(row.gameTimeText || '')}</td><td>${escapeHtml(row.type || '')}</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  function factorKeysForBranch(branchKey) {
    return Array.from({ length: BRANCH_TARGETS[branchKey] || 0 }, (_, idx) => `${branchKey.toLowerCase()}${String(idx + 1).padStart(2, '0')}`);
  }

  function branchTone(branch) {
    if (branch?.status === 'SUCCESS') return { card: 'support live-data', badge: 'live', status: 'ready', label: 'LIVE', icon: '✅' };
    if (branch?.status === 'DERIVED') return { card: 'warning heuristic-data', badge: 'heuristic', status: 'loading', label: 'DERIVED', icon: '🟨' };
    if (branch?.status === 'PENDING') return { card: 'status-pending', badge: 'heuristic', status: 'waiting', label: 'MINING...', icon: '⏳' };
    return { card: 'warning', badge: 'heuristic', status: 'failed', label: 'INTERRUPTED', icon: '❌' };
  }

  function buildFactorSlots(branchKey, parsed = {}) {
    const keys = factorKeysForBranch(branchKey);
    return keys.map((label) => `<div class="shield-cell"><strong>${escapeHtml(label)}</strong><div>${escapeHtml(Number(parsed[label] ?? 0).toFixed ? Number(parsed[label] ?? 0).toFixed(2) : parsed[label] ?? 0)}</div></div>`).join('');
  }

  function miningCardMarkup(branchKey, branch = {}) {
    const tone = branchTone(branch);
    const pct = Math.max(0, Math.min(100, Math.round((Number(branch.factorsFound || 0) / Math.max(1, Number(branch.factorsTarget || BRANCH_TARGETS[branchKey] || 1))) * 100)));
    return `<article class="mining-card ${tone.card}" data-branch-key="${escapeHtml(branchKey)}"><div class="factor-top"><h3 style="margin:0;">Branch ${escapeHtml(branchKey)}</h3><span class="card-type-tag ${tone.badge}">${tone.label}</span></div><div class="mining-status ${tone.status}">${tone.icon} ${escapeHtml(branch.status || 'PENDING')}</div><div class="factor-top"><div class="factor-delta">${escapeHtml(branch.factorsFound || 0)}/${escapeHtml(branch.factorsTarget || BRANCH_TARGETS[branchKey])}</div><div class="mini-muted">${escapeHtml(branch.source || '')}</div></div><div class="conf-bar"><div class="conf-fill" style="width:${pct}%"></div></div><div class="detail-box"><strong>Note</strong><div>${escapeHtml(branch.note || '')}</div></div><div class="shield-grid branch-factor-body" style="margin-top:12px;">${buildFactorSlots(branchKey, branch.parsed || {})}</div></article>`;
  }

  function computeShield(vault = {}) {
    let integrityScore = 0;
    let purityScore = 0;
    let confidenceAvg = 0;
    BRANCH_KEYS.forEach((key) => {
      const branch = vault?.branches?.[key] || { status: 'PENDING', factorsFound: 0, factorsTarget: BRANCH_TARGETS[key] };
      const saturation = (Number(branch.factorsFound || 0) / Math.max(1, Number(branch.factorsTarget || 1))) * 100;
      const weight = BRANCH_WEIGHTS[key] || 0;
      integrityScore += saturation * weight;
      purityScore += (branch.status === 'SUCCESS' ? 100 : branch.status === 'DERIVED' ? 70 : 0) * weight;
      confidenceAvg += ((saturation + (branch.status === 'SUCCESS' ? 100 : branch.status === 'DERIVED' ? 65 : 0)) / 2) * weight;
    });
    return {
      integrityScore: Number(integrityScore.toFixed(2)),
      purityScore: Number(purityScore.toFixed(2)),
      confidenceAvg: Number(confidenceAvg.toFixed(2))
    };
  }

  function renderMiningGrid(row = {}, vault = {}) {
    const mount = el('miningGrid');
    if (!mount) return;
    const branches = vault?.branches || {};
    const totalFound = BRANCH_KEYS.reduce((sum, key) => sum + Number(branches[key]?.factorsFound || 0), 0);
    mount.innerHTML = `<div class="status-panel"><div class="status-panel-head"><div><strong>Mining Matrix</strong><div class="mini-muted">Branch readiness with exact 72-slot saturation. Overall: <span id="matrixFactorTotal">${totalFound}/${BRANCH_TOTAL}</span> factors.</div></div><button id="viewVaultBtn" class="secondary">VIEW RAW VAULT</button></div><div class="mining-grid-inner mining-grid">${BRANCH_KEYS.map((key) => miningCardMarkup(key, branches[key] || { status: 'PENDING', factorsTarget: BRANCH_TARGETS[key], parsed: {} })).join('')}</div></div>`;
    const btn = document.getElementById('viewVaultBtn');
    if (btn) btn.onclick = () => console.log(vault);
  }

  function updateMatrixIcon(branchKey, branch = {}, vault = {}) {
    const root = el('miningGrid');
    if (!root) return;
    const card = root.querySelector(`[data-branch-key="${branchKey}"]`);
    if (!card) { renderMiningGrid({}, vault); return; }
    const tone = branchTone(branch);
    const pct = Math.max(0, Math.min(100, Math.round((Number(branch.factorsFound || 0) / Math.max(1, Number(branch.factorsTarget || BRANCH_TARGETS[branchKey] || 1))) * 100)));
    card.className = `mining-card ${tone.card}`;
    const status = card.querySelector('.mining-status');
    const badge = card.querySelector('.card-type-tag');
    const delta = card.querySelector('.factor-delta');
    const source = card.querySelector('.mini-muted');
    const fill = card.querySelector('.conf-fill');
    const detail = card.querySelector('.detail-box div');
    const body = card.querySelector('.branch-factor-body');
    if (status) { status.className = `mining-status ${tone.status}`; status.textContent = `${tone.icon} ${branch.status || 'PENDING'}`; }
    if (badge) { badge.className = `card-type-tag ${tone.badge}`; badge.textContent = tone.label; }
    if (delta) delta.textContent = `${branch.factorsFound || 0}/${branch.factorsTarget || BRANCH_TARGETS[branchKey]}`;
    if (source) source.textContent = branch.source || '';
    if (fill) fill.style.width = `${pct}%`;
    if (detail) detail.textContent = branch.note || '';
    if (body) body.innerHTML = buildFactorSlots(branchKey, branch.parsed || {});
    const total = BRANCH_KEYS.reduce((sum, key) => sum + Number(vault?.branches?.[key]?.factorsFound || 0), 0);
    const totalNode = document.getElementById('matrixFactorTotal');
    if (totalNode) totalNode.textContent = `${total}/${BRANCH_TOTAL}`;
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

  function renderAnalysisShell(result = {}, rows = [], version = SYSTEM_VERSION) {
    if (el('analysisTitle')) el('analysisTitle').textContent = `Run Analysis ${version}`;
    if (el('analysisVersion')) el('analysisVersion').textContent = `Version: ${version}`;
    const row = result?.row || rows[0] || {};
    const vault = result?.vault || { branches: {} };
    const shield = Object.assign(computeShield(vault), result?.shield || {});
    const summary = el('analysisSummary');
    if (summary) summary.innerHTML = [`<div class="pill">Rows: ${rows.length}</div>`,`<div class="pill">Integrity: ${escapeHtml(shield.integrityScore)}</div>`,`<div class="pill">Purity: ${escapeHtml(shield.purityScore)}</div>`,`<div class="pill">Confidence: ${escapeHtml(shield.confidenceAvg)}</div>`].join('');
    const hint = el('analysisHint');
    if (hint) hint.textContent = result?.analysisHint || 'Oxygen Restore active.';
    const rowCard = el('analysisRowCard');
    if (rowCard) rowCard.innerHTML = `<div class="status-panel"><div><strong>${escapeHtml(row.parsedPlayer || '')}</strong></div><div class="mini-muted">LEG_ID: ${escapeHtml(row.LEG_ID || '')} • idx: ${escapeHtml(row.idx || '')}</div><div class="mini-muted">${escapeHtml(row.team || '')} vs ${escapeHtml(row.opponent || '')} • ${escapeHtml(row.prop || '')} ${escapeHtml(row.line || '')}</div></div>`;
    const kpis = el('analysisKpis');
    if (kpis) kpis.innerHTML = BRANCH_KEYS.map((key) => {
      const branch = vault?.branches?.[key] || {};
      return `<div class="pill">${key}: ${escapeHtml(branch.factorsFound || 0)}/${escapeHtml(branch.factorsTarget || BRANCH_TARGETS[key])}</div>`;
    }).join('');
    renderMiningGrid(row, vault);
    const shieldPanel = el('shieldPanel');
    if (shieldPanel) shieldPanel.innerHTML = [`<div class="status-panel"><strong>Integrity Score</strong><div>${escapeHtml(shield.integrityScore)}</div></div>`,`<div class="status-panel"><strong>Purity Score</strong><div>${escapeHtml(shield.purityScore)}</div></div>`,`<div class="status-panel"><strong>Confidence Avg</strong><div>${escapeHtml(shield.confidenceAvg)}</div></div>`,`<div class="status-panel"><strong>Terminal State</strong><div>${escapeHtml(vault.terminalState || 'INITIALIZING')}</div></div>`].join('');
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
        fill.innerHTML = `<div class="progress-inner"><span>📡 ${pct}% | ${escapeHtml(message || 'Oxygen Restore active.')}</span></div>`;
      }
      if (strong) strong.textContent = `${pct}%`;
      if (spans[0]) spans[0].textContent = `📡 ${message || 'Oxygen Restore active.'}`;
      if (spans[1]) spans[1].textContent = `${safeIndex}/${safeTotal} probes`;
    });
  }

  function initProgressBar(completedRows = 0, totalRows = 1, label = 'Initializing stream...') {
    updateProgressBar(completedRows, totalRows, label);
  }

  function renderAnalysisResults(rows, auditRows, result, version = SYSTEM_VERSION) {
    renderAnalysisShell(result, rows, version);
  }

  function renderStreamUpdate(rows, auditRows, result, version = SYSTEM_VERSION, meta = {}) {
    renderAnalysisShell(result, rows, version);
    updateProgressBar(meta.completedProbes || 0, meta.totalProbes || 1, result?.analysisHint || 'Streaming analysis active.');
    if (meta.branchKey && result?.vault?.branches?.[meta.branchKey]) updateMatrixIcon(meta.branchKey, result.vault.branches[meta.branchKey], result.vault);
  }

  function showAnalysisScreen() {
    const intake = el('intakeScreen');
    const analysis = el('analysisScreen');
    if (intake) { intake.classList.add('hidden'); intake.style.display = 'none'; }
    if (analysis) { analysis.classList.remove('hidden'); analysis.style.display = 'block'; }
  }
  function backToIntake() {
    const intake = el('intakeScreen');
    const analysis = el('analysisScreen');
    if (analysis) analysis.classList.add('hidden');
    if (intake) { intake.classList.remove('hidden'); intake.style.display = 'block'; }
  }
  function showOverlay(title, body) { if (el('runOverlay')) el('runOverlay').classList.remove('hidden'); if (el('overlaySub')) el('overlaySub').textContent = title; if (el('overlayBody')) el('overlayBody').textContent = body; }
  function hideOverlay() { if (el('runOverlay')) el('runOverlay').classList.add('hidden'); }
  function bindResizeRedraw() { window.addEventListener('resize', () => {}); }
  function buildAnalysisCopyText(context = {}) { return JSON.stringify(context, null, 2); }

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
    appendConsole,
    showOverlay,
    hideOverlay,
    backToIntake,
    showAnalysisScreen,
    bindResizeRedraw,
    buildAnalysisCopyText,
    initProgressBar,
    updateProgressBar,
    updateMatrixIcon,
    renderMiningGrid,
    computeShield
  });

  window.onerror = function(message, source, lineno, colno) {
    try {
      appendConsole({ level: 'warning', text: `[OXYGEN RESTORE] ${message} @ ${source || 'unknown'}:${lineno || 0}:${colno || 0}` });
    } catch (_) {}
    return false;
  };
})();
