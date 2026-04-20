window.PickCalcUI = (() => {
  function el(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function renderPool(rows, audit) {
    renderPoolCounts(rows.length, (audit?.rejectedLines || []).length);
    renderFeedStatus(rows, audit);
    const mount = el('poolMount');
    if (!mount) return;
    if (!rows.length) {
      mount.innerHTML = '';
      return;
    }
    mount.innerHTML = `<div class="status-panel"><div class="table-wrap"><table><thead><tr><th>#</th><th>Sport</th><th>League</th><th>Player</th><th>Team</th><th>Opponent</th><th>Prop</th><th>Line</th><th>Time</th><th>Type</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.idx)}</td><td>${escapeHtml(row.sport)}</td><td>${escapeHtml(row.league)}</td><td>${escapeHtml(row.parsedPlayer)}</td><td>${escapeHtml(row.team || '')}</td><td>${escapeHtml(row.opponent || '')}</td><td>${escapeHtml(row.prop || '')}</td><td>${escapeHtml(row.line || '')}</td><td>${escapeHtml(row.gameTimeText || '')}</td><td>${escapeHtml(row.pickType || 'Regular Line')}</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  function renderPoolCounts(accepted, rejected) {
    const mount = el('poolCounts');
    if (!mount) return;
    mount.innerHTML = `<span class="count-accepted">Accepted: ${escapeHtml(String(accepted))}</span><span class="count-rejected">Rejected: ${escapeHtml(String(rejected))}</span>`;
  }

  function renderFeedStatus(rows, audit) {
    const mount = el('feedStatus');
    if (!mount) return;
    const counts = new Map();
    (rows || []).forEach((row) => {
      counts.set(row.prop, (counts.get(row.prop) || 0) + 1);
    });
    const bits = Array.from(counts.entries()).map(([prop, count]) => `<div class="feed-line">${escapeHtml(prop)}: [${count}]</div>`);
    if (audit?.rejectedLines?.length) bits.push(`<div class="feed-line">Rejected Lines: [${audit.rejectedLines.length}]</div>`);
    mount.innerHTML = bits.length ? `<div class="status-panel feed-status-inline-panel"><div class="feed-summary-list">${bits.join('')}</div></div>` : '';
  }

  function renderProgress(text, current = 0, total = 0) {
    const mount = el('progressBar');
    if (!mount) return;
    const percent = total ? Math.max(0, Math.min(100, Math.round((current / total) * 100))) : 0;
    mount.innerHTML = `<div class="progress-bar-shell"><div class="progress-bar-fill" style="width:${percent}%"><div class="progress-inner">${escapeHtml(text || '')}</div></div></div><div class="progress-bar-meta"><span>${percent}%</span><span>${escapeHtml(String(current))}/${escapeHtml(String(total))}</span></div>`;
  }

  function renderSummary(scored) {
    const mount = el('analysisSummary');
    if (!mount) return;
    const reliable = scored.filter((item) => item.reliable).length;
    const rejected = scored.length - reliable;
    const avg = reliable ? Math.round(scored.filter((item) => item.reliable).reduce((sum, item) => sum + (item.score || 0), 0) / reliable) : 0;
    mount.innerHTML = [
      `<span class="pill">Rows: ${scored.length}</span>`,
      `<span class="pill">Reliable: ${reliable}/${scored.length}</span>`,
      `<span class="pill">Rejected: ${rejected}</span>`,
      `<span class="pill">Average Score: ${avg}</span>`
    ].join('');
    const hint = el('analysisHint');
    if (hint) hint.textContent = reliable ? 'Green light rows passed 3-run median and local audit checks.' : 'No reliable rows passed the local audit gate.';
  }

  function scoreEmoji(item) {
    if (!item.reliable) return 'Rejected - No Reliable Data 👎';
    const score = Number(item.score) || 0;
    if (score >= 85) return `${score}/100 🔥`;
    if (score >= 72) return `${score}/100 ✅`;
    if (score >= 60) return `${score}/100 ⚠️`;
    return `${score}/100 🧊`;
  }

  function renderResults(scored) {
    renderSummary(scored);
    const body = el('scoreTableBody');
    const detailMount = el('detailMount');
    if (body) {
      body.innerHTML = scored.map((item, index) => {
        const row = item.sourceRow;
        return `<tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(row.sport)}</td>
          <td>${escapeHtml(row.parsedPlayer)}</td>
          <td>${escapeHtml(row.team || '')}</td>
          <td>${escapeHtml(row.opponent || '')}</td>
          <td>${escapeHtml(row.gameTimeText || '')}</td>
          <td>${escapeHtml(row.prop || '')}</td>
          <td>${escapeHtml(String(row.line || ''))}</td>
          <td>${escapeHtml(item.direction || '—')}</td>
          <td>${escapeHtml(scoreEmoji(item))}</td>
        </tr>`;
      }).join('');
    }
    if (detailMount) {
      detailMount.innerHTML = scored.map((item, index) => {
        const row = item.sourceRow;
        return `<div class="status-panel">
          <div class="status-panel-head"><strong>L${index + 1} • ${escapeHtml(row.parsedPlayer)} • ${escapeHtml(row.prop)}</strong><span class="pill">${escapeHtml(item.reliable ? 'RELIABLE' : 'REJECTED')}</span></div>
          <div><strong>Direction:</strong> ${escapeHtml(item.direction || '—')}</div>
          <div><strong>Score:</strong> ${escapeHtml(item.reliable ? String(item.score) : 'Rejected - No Reliable Data')}</div>
          <div><strong>Confidence:</strong> ${escapeHtml(item.confidence || '—')}</div>
          <div class="detail-box"><strong>Anchor:</strong> ${escapeHtml(item.trait)} vs ${escapeHtml(item.opponent_behavior)} -> ${escapeHtml(item.logic_path)}</div>
          <div class="detail-box"><strong>Grounding:</strong> ${escapeHtml(item.season_grounding)} | ${escapeHtml(item.recent_trend)}</div>
          <div class="detail-box"><strong>Run Health:</strong> Valid runs ${escapeHtml(String(item.validRuns))}/3 • Spread ${escapeHtml(String(item.spread))}</div>
          ${item.reliable ? '' : `<div class="warning-banner"><strong>Reject Reasons:</strong> ${escapeHtml(item.rejectionReasons.join(' | '))}</div>`}
        </div>`;
      }).join('');
    }
  }

  function appendConsole(line) {
    const mount = el('systemConsole');
    if (!mount) return;
    const stamp = new Date().toLocaleTimeString();
    const row = document.createElement('div');
    row.className = 'console-line';
    row.textContent = `[${stamp}] ${line}`;
    mount.prepend(row);
  }

  function copyReport(scored) {
    const text = scored.map((item, index) => {
      const row = item.sourceRow;
      return [
        `L${index + 1} | ${row.parsedPlayer} | ${row.prop} | ${item.direction || '—'} | ${item.reliable ? item.score : 'Rejected - No Reliable Data'} | ${item.confidence || '—'}`,
        `ANCHOR: ${item.trait} vs ${item.opponent_behavior} -> ${item.logic_path}`,
        `GROUND: ${item.season_grounding} | ${item.recent_trend}`,
        `STATUS: ${item.reliable ? 'PASS' : 'REJECT'}`,
        item.reliable ? '' : `REASON: ${item.rejectionReasons.join(' | ')}`
      ].filter(Boolean).join('\n');
    }).join('\n\n');
    return navigator.clipboard.writeText(text);
  }

  function showScreen(name) {
    el('intakeScreen')?.classList.toggle('hidden', name !== 'intake');
    el('analysisScreen')?.classList.toggle('hidden', name !== 'analysis');
  }

  function renderConfig(config) {
    const keys = el('apiKeysInput');
    if (keys) keys.value = (config.apiKeys || []).join('\n');
  }

  return { renderPool, renderProgress, renderResults, appendConsole, copyReport, showScreen, renderConfig };
})();
