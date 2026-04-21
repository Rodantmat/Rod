window.PickCalcUI = window.PickCalcUI || {};
(() => {
  const SYSTEM_VERSION = 'AlphaDog v0.0.2 "Iron Bite"';
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

  function renderLeagueChecklist() {}

  function renderRunSummary(rows = []) {
    const mount = el('runSummary');
    if (!mount) return;
    const accepted = asArray(rows).filter((row) => String(row?.sport || '').toUpperCase() === 'MLB').length;
    if (!accepted) {
      mount.innerHTML = '';
      return;
    }
    mount.innerHTML = `
      <div class="status-panel feed-status-inline-panel">
        <div class="feed-badge-row"><div class="feed-sport-badge">MLB [${escapeHtml(String(accepted))}]</div></div>
      </div>`;
  }

  function renderPoolCounts(accepted = 0, rejected = 0) {
    const mount = el('poolCounts');
    if (!mount) return;
    mount.innerHTML = `<span class="count-accepted">Accepted: ${escapeHtml(String(accepted))}</span><span class="count-rejected">Rejected: ${escapeHtml(String(rejected))}</span>`;
  }

  function renderFeedStatus(rows = []) {
    const mount = el('feedStatus');
    if (!mount) return;
    const counts = new Map();
    asArray(rows).forEach((row) => {
      if (String(row?.sport || '').toUpperCase() !== 'MLB') return;
      const prop = purgeUiNoise(row?.prop || '');
      if (!prop) return;
      counts.set(prop, (counts.get(prop) || 0) + 1);
    });
    if (!counts.size) {
      mount.innerHTML = '';
      return;
    }
    const ordered = MLB_FEED_MATRIX.filter((prop) => counts.has(prop)).concat(Array.from(counts.keys()).filter((prop) => !MLB_FEED_MATRIX.includes(prop)).sort());
    mount.innerHTML = `
      <div class="status-panel feed-status-inline-panel">
        <div class="status-panel-head"><strong>Summary of Legs</strong></div>
        <div class="feed-summary-list">${ordered.map((prop) => `<div class="feed-line">${escapeHtml(prop)}: ${escapeHtml(String(counts.get(prop)))}</div>`).join('')}</div>
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

  function categoryValue(vault = {}, key = '') {
    const direct = vault?.categoryScores?.[key];
    if (Number.isFinite(Number(direct))) return Math.round(Number(direct));
    const branchKey = key === 'identity' ? 'A' : key === 'trend' ? 'B' : key === 'stress' ? 'C' : 'D';
    const parsed = Object.values(vault?.branches?.[branchKey]?.parsed || {}).map(Number).filter(Number.isFinite);
    if (!parsed.length) return null;
    return Math.round((parsed.reduce((sum, value) => sum + value, 0) / parsed.length) * 100);
  }

  function finalValue(vault = {}) {
    if (Number.isFinite(Number(vault?.finalScore))) return Math.round(Number(vault.finalScore));
    const values = ['identity', 'trend', 'stress', 'risk'].map((key) => categoryValue(vault, key)).filter((value) => value !== null);
    if (!values.length) return null;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
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
        <div class="alphadog-score-value ${isFinal ? 'final' : ''} ${value === null ? 'pending' : ''}">${value === null ? '&mdash;' : escapeHtml(String(value))}</div>
      </div>`).join('')}</div>`;
  }

  function renderPlayerMiningCard(row = {}, vault = {}) {
    const player = purgeUiNoise(row?.parsedPlayer || row?.player || 'Unknown Player');
    const matchup = purgeUiNoise(`${row?.team || ''}${row?.opponent ? ` @ ${row.opponent}` : ''}`);
    const propLine = purgeUiNoise(`${row?.prop || ''} ${row?.line || ''} ${row?.direction || ''}`);
    const summary = purgeUiNoise(vault?.summary || '');
    return `
      <div class="alphadog-player-card">
        <div class="alphadog-player-line"><span class="player-name">${escapeHtml(player)}</span><span class="alphadog-matchup-inline">• ${escapeHtml(matchup)}</span></div>
        <div class="alphadog-prop-line">${escapeHtml(propLine)}</div>
        ${renderAlphaDogScoreGrid(vault)}
        ${summary ? `<div class="alphadog-card-summary">${escapeHtml(summary)}</div>` : ''}
      </div>`;
  }

  function renderMiningGrid(rows = [], vaultCollection = {}) {
    const mount = el('miningGrid');
    if (!mount) return;
    const cards = asArray(rows).map((row) => renderPlayerMiningCard(row, vaultCollection?.[row.LEG_ID] || {})).join('');
    mount.innerHTML = `<div class="status-panel"><div class="status-panel-head"><div><strong>Ingested Pool</strong></div></div><div class="dense-player-grid">${cards || '<div class="mini-muted">Waiting for analysis.</div>'}</div></div>`;
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
    renderMiningGrid(rows, vaultCollection);
    const footerMount = el('auditFooterGrade');
    const footerCard = footerMount ? footerMount.closest('.card') : null;
    if (footerMount) {
      const items = [];
      if (result?.overallAuditorScore !== undefined && result?.overallAuditorScore !== null && String(result.overallAuditorScore).trim() !== '') {
        items.push(`<div class="audit-grade-box"><div class="label">Overall Auditor Score</div><div class="value">${escapeHtml(String(result.overallAuditorScore))}</div></div>`);
      }
      if (result?.batchGrade) {
        items.push(`<div class="audit-grade-box"><div class="label">Batch Grade</div><div class="value">${escapeHtml(String(result.batchGrade))}</div></div>`);
      }
      footerMount.innerHTML = items.join('');
      if (footerCard) footerCard.classList.toggle('hidden', !items.length);
    }
    renderConsole(result?.logs || []);
  }

  function updateProgressBar(index = 0, total = 1, message = '') {
    const mount = el('progressBar');
    if (!mount) return;
    const safeTotal = Math.max(1, Number(total) || 1);
    const safeIndex = Math.max(0, Math.min(safeTotal, Number(index) || 0));
    const pct = Math.floor((safeIndex / safeTotal) * 100);
    mount.innerHTML = `<div class="progress-bar-shell"><div class="progress-bar-fill" style="width:${pct}%"><div class="progress-inner">${escapeHtml(message || 'Running analysis...')}</div></div></div><div class="progress-bar-meta"><strong>${pct}%</strong><span>${escapeHtml(message || 'Running analysis...')}</span><span>${safeIndex}/${safeTotal} probes</span></div>`;
  }

  function initProgressBar(completedRows = 0, totalRows = 1, label = 'Initializing stream...') { updateProgressBar(completedRows, totalRows, label); }
  function renderAnalysisResults(rows, auditRows, result, version = SYSTEM_VERSION) { renderAnalysisShell(result, rows, version); }
  function renderStreamUpdate(rows, auditRows, result, version = SYSTEM_VERSION, meta = {}) {
    renderAnalysisShell(result, rows, version);
    updateProgressBar(meta.completedProbes || 0, meta.totalProbes || 1, result?.analysisHint || 'Streaming analysis active.');
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
      return [
        `${index + 1}. ${row.parsedPlayer || 'Unknown'} • ${row.team || ''}${row.opponent ? ` @ ${row.opponent}` : ''}`,
        `${row.prop || ''} ${row.line || ''} ${row.direction || ''}`.trim(),
        `Identity ${categoryValue(vault, 'identity') ?? '-'} | Trend ${categoryValue(vault, 'trend') ?? '-'} | Stress ${categoryValue(vault, 'stress') ?? '-'} | Risk ${categoryValue(vault, 'risk') ?? '-'} | Final ${finalValue(vault) ?? '-'}`,
        vault?.summary || ''
      ].filter(Boolean).join('\n');
    }).join('\n\n');
  }

  function showToast(message) { appendConsole({ text: String(message || '') }); }
  function isReliableVault(vault = {}) { return Boolean(vault?.reliable === true); }
  function isPartialVault() { return false; }

  Object.assign(window.PickCalcUI, {
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
    showToast,
    isReliableVault,
    isPartialVault
  });
})();
