window.PickCalcUI = (() => {
  const SYSTEM_VERSION = 'v13.78.05 (OXYGEN-COBALT)';

  function el(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(message) {
    const existing = document.querySelector('.toast-notice');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notice';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function renderFeedStatus(rows = [], auditRows = []) {
    const mount = el('feedStatus');
    if (!mount) return;

    if (!rows.length) {
      mount.innerHTML = '';
      return;
    }

    const counts = new Map();
    rows.forEach((row) => {
      const prop = String(row?.prop || '').trim();
      if (!prop) return;
      counts.set(prop, (counts.get(prop) || 0) + 1);
    });

    const rejectedCount = Array.isArray(auditRows?.rejectedLines) ? auditRows.rejectedLines.length : 0;
    const ordered = [...counts.keys()].sort((a, b) => a.localeCompare(b));

    const lines = ordered
      .map((prop) => `<div class="feed-line"><span>${escapeHtml(prop)}</span><span>[${counts.get(prop)}]</span></div>`)
      .join('');

    mount.innerHTML = `
      <div class="ingest-status-box">
        <div class="ingest-status-head">MLB ✅</div>
        <div class="feed-summary-list">${lines}</div>
        <div class="feed-line rejected-line"><span>Rejected Lines</span><span>[${rejectedCount}]</span></div>
      </div>
    `;
  }

  function renderPoolTable(rows = []) {
    const mount = el('poolMount');
    if (!mount) return;

    if (!rows.length) {
      mount.innerHTML = `
        <div class="card">
          <div class="empty-state">No legs ingested yet.</div>
        </div>
      `;
      return;
    }

    mount.innerHTML = `
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Team</th>
                <th>Opponent</th>
                <th>Prop</th>
                <th>Line</th>
                <th>Type</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((row) => `
                <tr>
                  <td>${escapeHtml(row.idx)}</td>
                  <td>${escapeHtml(row.parsedPlayer)}</td>
                  <td>${escapeHtml(row.team || '')}</td>
                  <td>${escapeHtml(row.opponent || '')}</td>
                  <td>${escapeHtml(row.prop || '')}</td>
                  <td>${escapeHtml(row.line || '')}</td>
                  <td>${escapeHtml(row.type || '')}</td>
                  <td>${escapeHtml(row.gameTimeText || '')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function getPropFamily(row = {}) {
    const prop = String(row.prop || '').toLowerCase();
    if (prop.includes('rbi')) return 'RBI';
    if (prop === 'hits' || prop.includes('hits')) return 'HITS';
    if (prop.includes('run first inning') || prop.includes('rfi')) return 'RFI';
    if (prop.includes('strikeout') || prop === 'ks') return 'PITCHER_KS';
    return 'UNWIRED';
  }

  function getSupportStatus(row = {}) {
    const family = getPropFamily(row);
    if (['RBI', 'HITS', 'RFI'].includes(family)) {
      return { family, label: 'Backend candidate family ready', tone: 'ready' };
    }
    return { family, label: 'Matrix shell only / adapter pending', tone: 'pending' };
  }

  function renderMatrixSection(title, rows = [], open = false) {
    const body = rows.length
      ? rows.map((item) => `
          <div class="matrix-row">
            <span class="matrix-key">${escapeHtml(item.label)}</span>
            <span class="matrix-value ${item.status ? `matrix-${escapeHtml(item.status)}` : ''}">${escapeHtml(item.value)}</span>
          </div>
        `).join('')
      : '<div class="matrix-empty">No fields wired yet.</div>';

    return `
      <details class="matrix-section" ${open ? 'open' : ''}>
        <summary>${escapeHtml(title)}</summary>
        <div class="matrix-body">${body}</div>
      </details>
    `;
  }

  function buildMatrixSections(row = {}) {
    const support = getSupportStatus(row);
    return [
      renderMatrixSection('Identity', [
        { label: 'Player', value: row.parsedPlayer || 'MISSING', status: row.parsedPlayer ? 'ok' : 'missing' },
        { label: 'Team', value: row.team || 'MISSING', status: row.team ? 'ok' : 'missing' },
        { label: 'Opponent', value: row.opponent || 'MISSING', status: row.opponent ? 'ok' : 'missing' },
        { label: 'Prop Family', value: support.family },
        { label: 'Original Row #', value: row.idx || 'MISSING', status: row.idx ? 'ok' : 'missing' }
      ], true),
      renderMatrixSection('Trend', [
        { label: 'Recent Usage', value: 'PENDING BACKEND PACKET', status: 'pending' },
        { label: 'Recent Production', value: 'PENDING BACKEND PACKET', status: 'pending' },
        { label: 'Consistency Signal', value: 'PENDING SCORING ADAPTER', status: 'pending' }
      ]),
      renderMatrixSection('Matchup', [
        { label: 'Game / Matchup', value: `${row.team || 'MISSING'} ${row.opponent ? 'vs/@' : ''} ${row.opponent || 'MISSING'}`.trim(), status: row.team && row.opponent ? 'ok' : 'missing' },
        { label: 'Opposing Starter', value: 'PENDING BACKEND PACKET', status: 'pending' },
        { label: 'Opponent Profile', value: 'PENDING BACKEND PACKET', status: 'pending' }
      ]),
      renderMatrixSection('Role / Usage', [
        { label: 'Role Type', value: row.type || 'MISSING', status: row.type ? 'ok' : 'missing' },
        { label: 'Lineup Slot', value: 'PENDING BACKEND PACKET', status: 'pending' },
        { label: 'Starter / Usage Confirmation', value: 'PENDING BACKEND PACKET', status: 'pending' }
      ]),
      renderMatrixSection('Market', [
        { label: 'Prop', value: row.prop || 'MISSING', status: row.prop ? 'ok' : 'missing' },
        { label: 'Line', value: row.line || 'MISSING', status: row.line ? 'ok' : 'missing' },
        { label: 'Direction', value: row.direction || row.side || 'PENDING', status: row.direction || row.side ? 'ok' : 'pending' },
        { label: 'Market / Total Context', value: 'PENDING BACKEND PACKET', status: 'pending' }
      ]),
      renderMatrixSection('Environment', [
        { label: 'Venue / Park', value: 'PENDING BACKEND PACKET', status: 'pending' },
        { label: 'Weather', value: 'FUTURE MINER', status: 'pending' },
        { label: 'Run Environment', value: 'PENDING BACKEND PACKET', status: 'pending' }
      ]),
      renderMatrixSection('Risk', [
        { label: 'Missing Required Data', value: 'NOT EVALUATED YET', status: 'pending' },
        { label: 'Stale Data', value: 'NOT EVALUATED YET', status: 'pending' },
        { label: 'Unsupported Family', value: support.family === 'UNWIRED' ? 'YES' : 'NO', status: support.family === 'UNWIRED' ? 'missing' : 'ok' }
      ]),
      renderMatrixSection('Final Score', [
        { label: 'Score', value: 'NOT SCORED YET', status: 'pending' },
        { label: 'Verdict', value: 'WAITING FOR SCORING ADAPTER', status: 'pending' },
        { label: 'Confidence', value: 'NOT ASSIGNED', status: 'pending' }
      ]),
      renderMatrixSection('Hit Probability', [
        { label: 'Probability', value: 'NOT CALCULATED YET', status: 'pending' },
        { label: 'Formula Source', value: 'PENDING PROP FAMILY ADAPTER', status: 'pending' }
      ]),
      renderMatrixSection('Warnings', [
        { label: 'Current Warning State', value: support.label, status: support.tone === 'ready' ? 'ok' : 'pending' },
        { label: 'Backend Health Dependency', value: 'REQUIRES DAILY HEALTH PASS', status: 'pending' }
      ]),
      renderMatrixSection('Derived Flags / Raw Packet Preview', [
        { label: 'Derived Fields', value: 'NONE YET — PACKET NOT WIRED', status: 'pending' },
        { label: 'Raw Packet', value: 'PENDING /packet or /score endpoint', status: 'pending' }
      ])
    ].join('');
  }

  function renderAnalysisScreen(rows = [], miningVault = {}) {
    const mount = el('analysisMount');
    if (!mount) return;

    if (!rows.length) {
      mount.innerHTML = `
        <div class="card">
          <div class="empty-state">No parsed legs available. Go back to Screen 1 and ingest a board first.</div>
        </div>
      `;
      return;
    }

    mount.innerHTML = `
      <div class="analysis-grid">
        ${rows.map((row, index) => {
          const support = getSupportStatus(row);
          const vault = miningVault?.[row.LEG_ID || row.idx] || null;
          return `
            <article class="player-card" data-row-index="${escapeHtml(index + 1)}">
              <div class="player-card-head">
                <div>
                  <div class="player-kicker">LEG ${escapeHtml(index + 1)} • ${escapeHtml(support.family)}</div>
                  <h3>${escapeHtml(row.parsedPlayer || 'Unknown Player')}</h3>
                  <p>${escapeHtml(row.team || '—')} vs/@ ${escapeHtml(row.opponent || '—')} • ${escapeHtml(row.gameTimeText || 'Time pending')}</p>
                </div>
                <div class="score-chip score-pending">Pending</div>
              </div>
              <div class="leg-summary-grid">
                <div><span>Prop</span><strong>${escapeHtml(row.prop || '—')}</strong></div>
                <div><span>Line</span><strong>${escapeHtml(row.line || '—')}</strong></div>
                <div><span>Type</span><strong>${escapeHtml(row.type || '—')}</strong></div>
                <div><span>Status</span><strong>${escapeHtml(vault?.status || support.label)}</strong></div>
              </div>
              <div class="matrix-shell">
                ${buildMatrixSections(row)}
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  return {
    SYSTEM_VERSION,
    el,
    showToast,
    renderFeedStatus,
    renderPoolTable,
    renderAnalysisScreen
  };
})();
