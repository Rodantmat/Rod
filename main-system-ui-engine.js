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

  return {
    SYSTEM_VERSION,
    el,
    showToast,
    renderFeedStatus,
    renderPoolTable
  };
})();