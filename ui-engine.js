(() => {
  const escapeHtml = (value) => window.AlphaDogParser.escapeHtml(value);

  function el(id) { return document.getElementById(id); }

  function renderBatchMeta(summary = {}) {
    const mount = el('batchMeta');
    if (!mount) return;
    mount.innerHTML = [
      `<span class="pill">Version: ${escapeHtml(summary.version || 'AlphaDog v0.0.1')}</span>`,
      `<span class="pill">Accepted: ${escapeHtml(String(summary.acceptedCount || 0))}</span>`,
      `<span class="pill">Rejected: ${escapeHtml(String(summary.rejectedCount || 0))}</span>`,
      `<span class="pill">Cap: ${escapeHtml(String(summary.maxBatchSize || 24))}</span>`
    ].join('');
  }

  function renderBatchList(rows = []) {
    const mount = el('poolMount');
    if (!mount) return;
    if (!rows.length) {
      mount.innerHTML = '<div class="message">No rows loaded.</div>';
      return;
    }
    mount.innerHTML = rows.map((row) => `
      <article class="batch-item">
        <h3>${escapeHtml(row.LEG_ID)} · ${escapeHtml(row.parsedPlayer || 'Unknown Player')}</h3>
        <div class="batch-meta">${escapeHtml(row.prop || 'Unknown Prop')} · Line ${escapeHtml(row.line || '—')} · ${escapeHtml(row.direction || 'Undecided')}</div>
        <div class="result-text">${escapeHtml(row.rawText || '')}</div>
      </article>
    `).join('');
  }

  function renderConsole(lines = []) {
    const mount = el('systemConsole');
    if (!mount) return;
    mount.innerHTML = (lines || []).map((item) => `<div class="console-line ${escapeHtml(item.level || '')}">${escapeHtml(item.text || '')}</div>`).join('');
  }

  function appendConsole(item) {
    const mount = el('systemConsole');
    if (!mount) return;
    const div = document.createElement('div');
    div.className = `console-line ${item?.level || ''}`;
    div.textContent = item?.text || '';
    mount.prepend(div);
  }

  function renderBridgeStatus(message = '', tone = '') {
    const mount = el('bridgeStatus');
    if (!mount) return;
    mount.className = `message ${tone}`.trim();
    mount.textContent = message;
  }

  function renderIngestMessage(message = '', tone = '') {
    const mount = el('ingestMessage');
    if (!mount) return;
    mount.className = `message ${tone}`.trim();
    mount.textContent = message;
  }

  function renderResults(result = {}) {
    const mount = el('resultsMount');
    const hint = el('analysisHint');
    const overall = el('overallScore');
    if (!mount || !hint || !overall) return;

    const legs = Array.isArray(result.legs) ? result.legs : [];
    if (!legs.length) {
      mount.innerHTML = '';
      hint.textContent = 'No result cards returned.';
    } else {
      hint.textContent = `Returned ${legs.length} hostile-auditor card(s).`;
      mount.innerHTML = legs.map((item, index) => `
        <article class="result-card">
          <span class="result-tag">Card ${index + 1}</span>
          <h3>${escapeHtml(item.player || item.leg_id || `Leg ${index + 1}`)}</h3>
          <div class="result-text">${escapeHtml(item.text || '')}</div>
        </article>
      `).join('');
    }

    if (result.overall_auditor_score_text) {
      overall.classList.remove('hidden');
      overall.innerHTML = `<strong>Overall Auditor Score</strong><div class="result-text">${escapeHtml(result.overall_auditor_score_text)}</div>`;
    } else {
      overall.classList.add('hidden');
      overall.innerHTML = '';
    }
  }

  window.AlphaDogUI = {
    el,
    renderBatchMeta,
    renderBatchList,
    renderConsole,
    appendConsole,
    renderBridgeStatus,
    renderIngestMessage,
    renderResults,
  };
})();
