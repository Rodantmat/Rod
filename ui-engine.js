window.PickCalcUI = window.PickCalcUI || {};
(() => {
  const SYSTEM_VERSION = 'AlphaDog v0.0.14 "Oxygen Cobalt"';
  const MODEL_ID = 'gemini-2.5-pro';
  const MLB_FEED_MATRIX = [
    'Pitcher Strikeouts', 'Hits Allowed', 'Walks Allowed', 'Pitching Outs', 'Fantasy Score',
    'Hits', 'Total Bases', 'Runs', 'RBIs', 'Hits+Runs+RBIs', 'Singles', 'Doubles', 'Home Runs', 'Stolen Bases'
  ];

  const el = (id) => document.getElementById(id);
  const asArray = (value) => Array.isArray(value) ? value : [];
  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  function purgeUiNoise(value = '') {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function scoreClass(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 'score-pending';
    if (num < 70) return 'score-low';
    if (num < 85) return 'score-mid';
    return 'score-high';
  }

  function formatScore(value) {
    const num = Number(value);
    return Number.isFinite(num) ? String(Math.round(num)) : '—';
  }

  function titleCaseDay(value = '') {
    const text = purgeUiNoise(value);
    if (!text) return '';
    return text.replace(/\b([a-z])/g, (m) => m.toUpperCase());
  }

  function renderLeagueChecklist() {}

  function renderRunSummary(rows = []) {
    const mount = el('runSummary');
    if (!mount) return;
    mount.innerHTML = '';
  }

  function renderPoolCounts(accepted = 0, rejected = 0) {
    const mount = el('poolCounts');
    if (!mount) return;
    mount.innerHTML = `<span class="count-accepted">Accepted: ${escapeHtml(String(accepted))}</span><span class="count-rejected">Rejected: ${escapeHtml(String(rejected))}</span>`;
  }

  function renderFeedStatus(rows = []) {
    const mount = el('feedStatus');
    if (!mount) return;
    const mlbRows = asArray(rows).filter((row) => String(row?.sport || '').toUpperCase() === 'MLB');
    if (!mlbRows.length) {
      mount.innerHTML = '';
      return;
    }

    const counts = new Map();
    mlbRows.forEach((row) => {
      const prop = purgeUiNoise(row?.prop || 'Unknown Prop');
      counts.set(prop, (counts.get(prop) || 0) + 1);
    });

    const ordered = MLB_FEED_MATRIX.filter((prop) => counts.has(prop))
      .concat(Array.from(counts.keys()).filter((prop) => !MLB_FEED_MATRIX.includes(prop)).sort());

    mount.innerHTML = `
      <div class="status-panel iron-summary-stack">
        <div class="metric-stack-shell">
          <div class="feed-sport-badge">MLB [${escapeHtml(String(mlbRows.length))}]</div>
          <div class="feed-summary-list vertical-metric-stack centered-metric-stack">${ordered.map((prop) => `<div class="feed-line prop-metric">${escapeHtml(prop)}: ${escapeHtml(String(counts.get(prop)))}</div>`).join('')}</div>
        </div>
      </div>`;
  }

  function renderPoolTable(rows = []) {
    const mount = el('poolMount');
    if (!mount) return;
    if (!rows.length) {
      mount.innerHTML = '';
      return;
    }
    mount.innerHTML = `
      <div class="status-panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Sport</th><th>Player / Entity</th><th>Team</th><th>Opponent</th><th>Prop</th><th>Line</th><th>Time</th></tr></thead>
            <tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.idx)}</td><td>${escapeHtml(row.sport)}</td><td>${escapeHtml(row.parsedPlayer)}</td><td>${escapeHtml(row.team || '')}</td><td>${escapeHtml(row.opponent || '')}</td><td>${escapeHtml(row.prop || '')}</td><td>${escapeHtml(row.line || '')}</td><td>${escapeHtml(row.gameTimeText || '')}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      </div>`;
  }

  function categoryValue(vault, key) {
    // Access scores directly from the hydrated vault.
    const score = vault?.categoryScores?.[key];
    return (score !== undefined && score !== null) ? score : null;
  }

  function finalValue(vault) {
    // Use the direct finalScore passed from the API.
    return vault?.finalScore !== undefined ? Math.round(vault.finalScore) : null;
  }

  function renderAlphaDogScoreGrid(vault = {}) {
    const cells = [
      ['Identity', categoryValue(vault, 'identity')],
      ['Trend', categoryValue(vault, 'trend')],
      ['Stress', categoryValue(vault, 'stress')],
      ['Risk', categoryValue(vault, 'risk')],
      ['Final Score', finalValue(vault), true]
    ];
    return `<div class="alphadog-card-grid">${cells.map(([label, value, isFinal]) => `
      <div class="alphadog-score-tile ${isFinal ? 'final' : ''}">
        <div class="alphadog-score-label">${escapeHtml(label)}</div>
        <div class="alphadog-score-value ${isFinal ? 'final' : ''} ${scoreClass(value)}">${escapeHtml(formatScore(value))}</div>
      </div>`).join('')}</div>`;
  }

  function getAuditDisplay(row = {}, vault = {}) {
    const meta = vault?.auditMeta || {};
    return {
      sport: purgeUiNoise(meta.sport || row?.sport || 'MLB'),
      player: purgeUiNoise(meta.player || row?.parsedPlayer || row?.player || 'Unknown Player'),
      team: purgeUiNoise(meta.team || row?.teamFullName || row?.team || ''),
      opponent: purgeUiNoise(meta.opponent || row?.opponentFullName || row?.opponent || ''),
      dateTime: titleCaseDay(meta.dateTime || row?.gameDayTime || row?.gameTimeText || row?.gameTime || ''),
      metric: purgeUiNoise(meta.metric || row?.prop || ''),
      line: purgeUiNoise(meta.line || row?.line || ''),
      direction: purgeUiNoise(meta.direction || row?.direction || ''),
      type: purgeUiNoise(meta.type || row?.type || 'Regular')
    };
  }

  function renderPlayerMiningCard(row = {}, vault = {}) {
    const display = getAuditDisplay(row, vault);
    const summary = purgeUiNoise(vault?.summary || '');
    return `
      <article class="alphadog-player-card">
        <div class="alphadog-card-header">
          <div class="alphadog-card-headline">${escapeHtml(display.player)}</div>
          <div class="alphadog-card-subline">${escapeHtml(display.team || 'Unknown Team')} • ${escapeHtml(display.sport || 'MLB')}</div>
        </div>
        <div class="alphadog-card-prop">${escapeHtml(display.metric || 'Unknown Metric')} • ${escapeHtml(display.line || '—')} • ${escapeHtml(display.direction || '—')}</div>
        <div class="alphadog-card-meta">${escapeHtml(display.opponent || 'Unknown Opponent')} • ${escapeHtml(display.dateTime || 'Time Pending')} • ${escapeHtml(display.type || 'Regular')}</div>
        ${renderAlphaDogScoreGrid(vault)}
        ${summary ? `<div class="alphadog-card-summary">${escapeHtml(summary)}</div>` : ''}
      </article>`;
  }

  function renderAuditResults(rows = [], vaultCollection = {}) {
    const auditResults = el('audit-results');
    if (!auditResults) {
      renderMiningGrid(rows, vaultCollection);
      return;
    }
    auditResults.innerHTML = '';
    const grid = document.createElement('div');
    grid.id = 'miningGrid';
    grid.className = 'mining-grid';
    auditResults.appendChild(grid);
    const cards = asArray(rows).map((row) => renderPlayerMiningCard(row, vaultCollection?.[row.LEG_ID] || {})).join('');
    grid.innerHTML = cards || '<div class="mini-muted">Waiting for analysis.</div>'; 
  }

  function renderMiningGrid(rows = [], vaultCollection = {}) {
    const mount = el('miningGrid');
    if (!mount) return;
    const cards = asArray(rows).map((row) => renderPlayerMiningCard(row, vaultCollection?.[row.LEG_ID] || {})).join('');
    mount.innerHTML = cards || '<div class="mini-muted">Waiting for analysis.</div>';
  }

  function renderBatchAuditor(result = {}) {
    const mount = el('batchAuditorOutput');
    const section = el('auditorSection');
    if (!mount || !section) return;
    const batch = result?.batchAudit || {};
    const scoreItems = [
      ['Logic Consistency', batch.logicConsistency],
      ['Bias Control', batch.biasControl],
      ['Roster Accuracy', batch.rosterAccuracy],
      ['Risk Buffer', batch.riskBuffer]
    ].filter(([, value]) => Number.isFinite(Number(value)));

    if (!scoreItems.length) {
      mount.innerHTML = '<div class="mini-muted">Batch auditor data will appear here after Gemini responds.</div>';
      section.classList.remove('hidden');
      return;
    }

    const statusLine = result?.correctedRun ? 'Corrected Final Run' : 'Initial Final Run';
    mount.innerHTML = `
      <article class="alphadog-player-card alphadog-batch-card">
        <div class="alphadog-card-headline">AUDITOR</div>
        <div class="alphadog-card-subline">${escapeHtml(statusLine)}</div>
        <div class="alphadog-card-grid alphadog-batch-grid">${scoreItems.map(([label, value]) => `
          <div class="alphadog-score-tile">
            <div class="alphadog-score-label">${escapeHtml(label)}</div>
            <div class="alphadog-score-value ${scoreClass(value)}">${escapeHtml(formatScore(value))}</div>
          </div>`).join('')}</div>
      </article>`;
    section.classList.remove('hidden');
  }

  function renderConsole(logs = []) {
    const mount = el('systemConsole');
    if (!mount) return;
    mount.innerHTML = asArray(logs).map((entry) => `<div class="console-line">${escapeHtml(`[${entry?.timestamp || new Date().toLocaleTimeString()}] ${entry?.text || entry?.message || String(entry)}`)}</div>`).join('');
  }

  function appendConsole(log) {
    const mount = el('systemConsole');
    if (!mount) return;
    const line = document.createElement('div');
    line.className = 'console-line';
    line.textContent = `[${new Date().toLocaleTimeString()}] ${String(log?.text || log?.message || log || '')}`;
    mount.appendChild(line);
    mount.scrollTop = mount.scrollHeight;
  }

  let heartbeatTimer = null;
  function startHeartbeat() {
    if (heartbeatTimer) return;
    heartbeatTimer = window.setInterval(() => appendConsole({ text: '[SYSTEM] HEARTBEAT' }), 5000);
  }
  function stopHeartbeat() {
    if (!heartbeatTimer) return;
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  function summarizeStatus(result = {}) {
    if (result?.runStatus === 'FAILED') return { label: 'FAILED', text: result?.analysisHint || 'Analysis failed.' };
    if (result?.runStatus === 'VERIFIED') return { label: 'VERIFIED', text: result?.analysisHint || 'Analysis complete.' };
    return { label: 'LOADING', text: result?.analysisHint || 'Running analysis...' };
  }

  function renderAnalysisShell(result = {}, rows = [], version = SYSTEM_VERSION) {
    if (el('analysisTitle')) el('analysisTitle').textContent = version;
    const summary = el('analysisSummary');
    if (summary) summary.innerHTML = '';
    const hint = el('analysisHint');
    if (hint) {
      const status = summarizeStatus(result);
      hint.innerHTML = `<span class="${status.label === 'FAILED' ? 'warning-banner analysis-error-banner' : 'status-ok-banner'}"><strong>${escapeHtml(status.label)}:</strong> ${escapeHtml(status.text)}</span>`;
    }
    const vaultCollection = result?.vaultCollection || {};
    renderAuditResults(rows, vaultCollection);
    renderBatchAuditor(result);
    renderConsole(result?.logs || []);
  }

  function setProgressState(percent = 0, message = '', mode = 'normal') {
    const mount = el('progressBar');
    if (!mount) return;
    const pct = Math.max(0, Math.min(100, Number(percent) || 0));
    const cleanMessage = String(message || 'Running audit...').replace(/probes?/gi, '').replace(/Gemini/gi, 'model').replace(/\s+/g,' ').trim();
    const fillClass = mode === 'complete' ? 'progress-bar-fill progress-complete' : mode === 'creep' ? 'progress-bar-fill progress-creep' : 'progress-bar-fill';
    mount.innerHTML = `<div class="progress-bar-shell"><div class="${fillClass}" style="width:${pct}%"><div class="progress-inner">${escapeHtml(cleanMessage)}</div></div></div><div class="progress-bar-meta"><strong>${pct}%</strong><span>${escapeHtml(cleanMessage)}</span></div>`;
  }

  function updateProgressBar(percent = 0, _unused = 0, message = '') {
    setProgressState(percent, message, percent >= 100 ? 'complete' : 'normal');
  }

  function initProgressBar(_completedRows = 0, _totalRows = 1, label = 'Initializing audit...') {
    setProgressState(0, label, 'normal');
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setProgressState(90, label, 'creep'));
    });
  }

  function renderAnalysisResults(rows, auditRows, result, version = SYSTEM_VERSION) {
    renderAnalysisShell(result, rows, version);
    renderAuditResults(rows, result?.vaultCollection || {});
  }
  function renderStreamUpdate(rows, auditRows, result, version = SYSTEM_VERSION, meta = {}) {
    renderAnalysisShell(result, rows, version);
    const message = result?.analysisHint || 'Running audit...';
    const completed = Number(meta.completedProbes || meta.completedAudits || 0);
    const total = Math.max(1, Number(meta.totalProbes || meta.totalAudits || 1));
    const pct = result?.runStatus === 'VERIFIED' ? 100 : Math.min(90, Math.max(10, Math.round((completed / total) * 80) + 10));
    updateProgressBar(pct, total, message);
  }

  function renderRawPayload(payloadText = '') {
    const mount = el('rawPayloadOutput');
    if (!mount) return;
    mount.textContent = String(payloadText || '').trim();
  }

  function showAnalysisScreen() {
    const intake = el('intakeScreen');
    const analysis = el('analysisScreen');
    if (intake) intake.classList.add('hidden');
    if (analysis) analysis.classList.remove('hidden');
  }
  function backToIntake() {
    const intake = el('intakeScreen');
    const analysis = el('analysisScreen');
    ['analysisSummary','analysisHint','batchAuditorOutput','rawPayloadOutput','progressBar','systemConsole'].forEach((id) => {
      const node = el(id);
      if (!node) return;
      if ('textContent' in node) node.textContent = '';
      if ('innerHTML' in node) node.innerHTML = '';
    });
    renderAuditResults([], {});
    if (analysis) analysis.classList.add('hidden');
    if (intake) intake.classList.remove('hidden');
  }
  function showOverlay() {}
  function hideOverlay() {}
  function bindResizeRedraw() {}
  function buildAnalysisCopyText(context = {}) {
    const rows = asArray(context.rows);
    const vaults = context.vault || {};
    return rows.map((row, index) => {
      const vault = vaults[row.LEG_ID] || {};
      const display = getAuditDisplay(row, vault);
      return [
        `${index + 1}. ${display.sport} - ${display.player} - ${display.team}`,
        `@ ${display.opponent} - ${display.dateTime}`,
        `${display.metric} - ${display.line} - ${display.direction} - ${display.type}`,
        `Identity ${categoryValue(vault, 'identity') ?? '-'} | Trend ${categoryValue(vault, 'trend') ?? '-'} | Stress ${categoryValue(vault, 'stress') ?? '-'} | Risk ${categoryValue(vault, 'risk') ?? '-'} | Final ${finalValue(vault) ?? '-'}`,
        vault?.summary || ''
      ].filter(Boolean).join('\n');
    }).join('\n\n');
  }

  function showToast(message) { appendConsole({ text: String(message || '') }); }
  function isReliableVault(vault = {}) { return Boolean(vault?.reliable === true); }
  function isPartialVault() { return false; }

  Object.assign(window.PickCalcUI, {
    MODEL_ID,
    MLB_FEED_MATRIX,
    el,
    renderLeagueChecklist,
    renderRunSummary,
    renderPoolCounts,
    renderFeedStatus,
    renderPoolTable,
    renderAnalysisShell,
    renderAnalysisResults,
    renderStreamUpdate,
    renderConsole,
    appendConsole,
    startHeartbeat,
    stopHeartbeat,
    showOverlay,
    hideOverlay,
    backToIntake,
    showAnalysisScreen,
    bindResizeRedraw,
    buildAnalysisCopyText,
    initProgressBar,
    updateProgressBar,
    renderMiningGrid,
    renderRawPayload,
    renderBatchAuditor,
    showToast,
    isReliableVault,
    isPartialVault
  });
})();
