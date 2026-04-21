window.PickCalcUI = window.PickCalcUI || {};
(() => {
  const SYSTEM_VERSION = 'AlphaDog v0.0.1';

  function el(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function asArray(value) { return Array.isArray(value) ? value : (value ? [value] : []); }

  function renderPoolCounts(accepted = 0, rejected = 0) {
    const mount = el('poolCounts');
    if (!mount) return;
    mount.innerHTML = `<span class="count-accepted">Accepted: ${escapeHtml(String(accepted))}</span><span class="count-rejected">Rejected: ${escapeHtml(String(rejected))}</span>`;
  }

  function renderFeedStatus(rows = [], auditRows = []) {
    const mount = el('feedStatus');
    if (!mount) return;
    const counts = new Map();
    rows.forEach((row) => {
      const prop = String(row?.prop || '').trim();
      if (!prop) return;
      counts.set(prop, (counts.get(prop) || 0) + 1);
    });
    const rejectedCount = Array.isArray(auditRows?.rejectedLines) ? auditRows.rejectedLines.length : 0;
    if (!counts.size && !rejectedCount) {
      mount.innerHTML = '';
      return;
    }
    const lines = [...counts.entries()].map(([prop, count]) => `<div class="feed-line">${escapeHtml(prop)}: [${escapeHtml(String(count))}]</div>`);
    if (rejectedCount) lines.push(`<div class="feed-line">Rejected Lines: [${escapeHtml(String(rejectedCount))}]</div>`);
    mount.innerHTML = `<div class="status-panel feed-status-inline-panel"><div class="feed-summary-list">${lines.join('')}</div></div>`;
  }

  function renderPoolTable(rows = []) {
    const mount = el('poolMount');
    if (!mount) return;
    if (!rows.length) {
      mount.innerHTML = `<div class="message">No accepted legs yet.</div>`;
      return;
    }
    mount.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Sport</th><th>League</th><th>Player / Entity</th><th>Team</th><th>Opponent</th><th>Prop</th><th>Line</th><th>Type</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((item) => `<tr><td>${escapeHtml(item.idx)}</td><td>${escapeHtml(item.sport)}</td><td>${escapeHtml(item.league)}</td><td>${escapeHtml(item.parsedPlayer)}</td><td>${escapeHtml(item.team || '')}</td><td>${escapeHtml(item.opponent || '')}</td><td>${escapeHtml(item.prop || '')}</td><td>${escapeHtml(item.line || '')}</td><td>${escapeHtml(item.type || '')}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function renderConsole(logs = []) {
    const mount = el('systemConsole');
    if (!mount) return;
    mount.innerHTML = asArray(logs).map((entry) => {
      const text = typeof entry === 'string' ? entry : entry?.text || '';
      return `<div class="console-line">${escapeHtml(text)}</div>`;
    }).join('');
  }

  function appendConsole(entry) {
    const mount = el('systemConsole');
    if (!mount) return;
    const line = document.createElement('div');
    line.className = 'console-line';
    line.textContent = typeof entry === 'string' ? entry : entry?.text || '';
    mount.appendChild(line);
    mount.scrollTop = mount.scrollHeight;
  }

  function scorePill(label, value) {
    const safe = value == null ? '—' : String(value);
    return `<div class="alphadog-score-pill"><span>${escapeHtml(label)}</span><strong>${escapeHtml(safe)}${safe === '—' ? '' : '/100'}</strong></div>`;
  }

  function renderAnalysisShell(result = {}, rows = [], version = SYSTEM_VERSION) {
    const analysisTitle = el('analysisTitle');
    if (analysisTitle) analysisTitle.textContent = `Run Analysis ${version}`;

    const summaryMount = el('analysisSummary');
    if (summaryMount) {
      const overall = result?.overallScore;
      const processed = asArray(result?.results).length || rows.length || 0;
      summaryMount.innerHTML = [
        `<div class="pill">Version: ${escapeHtml(version)}</div>`,
        `<div class="pill">Legs: ${escapeHtml(String(processed))}</div>`,
        `<div class="pill">Overall Auditor Score: ${escapeHtml(overall == null ? '—' : `${overall}/100`)}</div>`
      ].join('');
    }

    const hint = el('analysisHint');
    if (hint) hint.textContent = result?.analysisHint || '';

    const gridWrap = el('miningGrid');
    const connectorSvg = el('connectorSvg');
    const shieldPanel = el('shieldPanel');
    const shieldTitle = el('shieldTitle');
    if (connectorSvg) connectorSvg.innerHTML = '';
    if (shieldTitle) shieldTitle.textContent = 'Overall Auditor Score';
    if (shieldPanel) shieldPanel.innerHTML = `<div class="status-panel"><strong>Batch Grade</strong><div>${escapeHtml(result?.overallScore == null ? '—' : `${result.overallScore}/100`)}</div></div>`;

    const cards = asArray(result?.results).map((entry, index) => {
      const card = entry?.card || {};
      return `
        <article class="alphadog-card">
          <div class="alphadog-card-header">
            <div>
              <div class="alphadog-card-kicker">Leg ${escapeHtml(String(index + 1))}</div>
              <h3>${escapeHtml(card.header || rows[index]?.parsedPlayer || `Leg ${index + 1}`)}</h3>
              <div class="mini-muted">${escapeHtml(card.propLine || '')}</div>
            </div>
            <div class="alphadog-final-score">${escapeHtml(card.finalScore == null ? '—' : `${card.finalScore}/100`)}</div>
          </div>
          <div class="alphadog-score-grid">
            ${scorePill('Identity & Context Integrity', card.identityScore)}
            ${scorePill('Performance & Trend Variance', card.performanceScore)}
            ${scorePill('Situational Stress-Testing', card.stressScore)}
            ${scorePill('Risk & Volatility Buffers', card.riskScore)}
          </div>
          <div class="detail-box alphadog-raw">${escapeHtml(card.rawText || '')}</div>
          ${card.footer ? `<div class="detail-box alphadog-footer"><strong>Footer:</strong> ${escapeHtml(card.footer)}</div>` : ''}
        </article>`;
    }).join('');
    if (gridWrap) {
      gridWrap.innerHTML = cards || `<div class="message">No AlphaDog cards to display.</div>`;
      gridWrap.className = 'alphadog-results';
    }

    const body = el('analysisResultsBody');
    if (body) body.innerHTML = rows.map((item) => `<tr><td>${escapeHtml(item.idx)}</td><td>${escapeHtml(item.sport)}</td><td>${escapeHtml(item.league)}</td><td>${escapeHtml(item.parsedPlayer)}</td><td>${escapeHtml(item.team || '')}</td><td>${escapeHtml(item.opponent || '')}</td><td>${escapeHtml(item.prop || '')}</td><td>${escapeHtml(item.line || '')}</td><td>${escapeHtml(item.type || '')}</td></tr>`).join('');

    renderConsole(result?.logs || []);
  }

  function updateProgressBar(index = 0, total = 1, message = '') {
    const mount = el('progressBar');
    if (!mount) return;
    const safeTotal = Math.max(1, Number(total) || 1);
    const safeIndex = Math.max(0, Math.min(safeTotal, Number(index) || 0));
    const pct = Math.floor((safeIndex / safeTotal) * 100);
    mount.innerHTML = `<div class="progress-bar-shell"><div class="progress-bar-fill" style="width:${pct}%"><div class="progress-inner"><span>${escapeHtml(message || 'Running AlphaDog audit...')}</span></div></div></div><div class="progress-bar-meta"><strong>${pct}%</strong><span>${escapeHtml(message || 'Running AlphaDog audit...')}</span><span>${safeIndex}/${safeTotal}</span></div>`;
  }
  function initProgressBar(completedRows = 0, totalRows = 1, label = 'Initializing AlphaDog...') { updateProgressBar(completedRows, totalRows, label); }
  function renderAnalysisResults(rows, auditRows, result, version = SYSTEM_VERSION) { renderAnalysisShell(result, rows, version); }
  function renderStreamUpdate(rows, auditRows, result, version = SYSTEM_VERSION, meta = {}) {
    renderAnalysisShell(result, rows, version);
    updateProgressBar(meta.completedProbes || 0, meta.totalProbes || 1, result?.analysisHint || 'Streaming AlphaDog audit...');
  }

  function showAnalysisScreen() { const intake = el('intakeScreen'); const analysis = el('analysisScreen'); if (intake) { intake.classList.add('hidden'); intake.style.display = 'none'; } if (analysis) { analysis.classList.remove('hidden'); analysis.style.display = 'block'; } }
  function backToIntake() { const intake = el('intakeScreen'); const analysis = el('analysisScreen'); if (analysis) analysis.classList.add('hidden'); if (intake) { intake.classList.remove('hidden'); intake.style.display = 'block'; } }
  function showOverlay() {}
  function hideOverlay() {}
  function startHeartbeat() {}
  function stopHeartbeat() {}
  function bindResizeRedraw() {}

  function buildAnalysisCopyText(context = {}) {
    const results = asArray(context?.result?.results);
    const lines = results.map((entry) => entry?.card?.rawText || '').filter(Boolean);
    const overall = context?.result?.overallScore;
    if (overall != null) lines.push(`Overall Auditor Score: ${overall}/100`);
    return lines.join('\n\n');
  }

  function showToast(message) {
    let toast = document.getElementById('pcToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'pcToast';
      toast.style.position = 'fixed';
      toast.style.left = '50%';
      toast.style.bottom = '20px';
      toast.style.transform = 'translateX(-50%)';
      toast.style.zIndex = '9999';
      toast.style.padding = '12px 16px';
      toast.style.borderRadius = '12px';
      toast.style.background = 'linear-gradient(180deg, rgba(18,26,47,0.98), rgba(12,20,39,0.98))';
      toast.style.border = '1px solid #24304f';
      toast.style.color = '#edf2ff';
      document.body.appendChild(toast);
    }
    toast.textContent = String(message || '');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => { if (toast) toast.textContent = ''; }, 3000);
  }

  Object.assign(window.PickCalcUI, { el, renderPoolCounts, renderFeedStatus, renderPoolTable, renderAnalysisShell, renderAnalysisResults, renderStreamUpdate, renderConsole, appendConsole, startHeartbeat, stopHeartbeat, showOverlay, hideOverlay, backToIntake, showAnalysisScreen, bindResizeRedraw, buildAnalysisCopyText, initProgressBar, updateProgressBar, showToast });
  window.onerror = function(message, source, lineno, colno) { try { appendConsole(`[ALPHADOG] ${message} @ ${source || 'unknown'}:${lineno || 0}:${colno || 0}`); } catch (_) {} return false; };
})();
