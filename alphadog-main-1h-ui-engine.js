window.PickCalcUI = (() => {
  const SYSTEM_VERSION = 'v13.78.05 (OXYGEN-COBALT) • Main-1H Auto API Lock';

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

  function compactJson(value, max = 900) {
    if (value === undefined || value === null) return 'EMPTY';
    let text = '';
    try { text = JSON.stringify(value, null, 2); } catch { text = String(value); }
    return text.length > max ? `${text.slice(0, max)}… [truncated]` : text;
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

  function hydrateBackendControls(Connectors) {
    if (!Connectors) return;
    if (Connectors.forceBackendUrlInputToMainApi) Connectors.forceBackendUrlInputToMainApi();
    if (Connectors.setToken) Connectors.setToken('');
    if (Connectors.setSlateDate) Connectors.setSlateDate('');
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
    if (window.PickCalcConnectors?.normalizePropFamily) return window.PickCalcConnectors.normalizePropFamily(row);
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
    return { family, label: 'Adapter pending', tone: 'pending' };
  }

  function rowKey(row, index = 0) {
    return String(row?.LEG_ID || row?.id || row?.idx || index + 1);
  }

  function tableCheckMap(backendHealth) {
    const map = new Map();
    (backendHealth?.table_checks || []).forEach((check) => map.set(check.check, check));
    return map;
  }

  function checkValue(backendHealth, name) {
    const item = tableCheckMap(backendHealth).get(name);
    if (!item) return { label: name, value: 'NOT LOADED', status: 'pending' };
    return { label: name, value: `${item.value} • ${item.status}`, status: item.ok ? 'ok' : 'missing' };
  }

  function renderBackendStatus(health) {
    const mount = el('backendStatusMount');
    if (!mount) return;

    if (!health) {
      mount.innerHTML = `<div class="backend-status-box pending">Backend not checked yet.</div>`;
      return;
    }

    if (health.loading) {
      mount.innerHTML = `<div class="backend-status-box pending">Checking backend Daily Health${health.slateDate ? ` for ${escapeHtml(health.slateDate)}` : ''}…</div>`;
      return;
    }

    if (!health.ok) {
      mount.innerHTML = `<div class="backend-status-box missing">Daily Health failed: ${escapeHtml(health.error || 'unknown error')}</div>`;
      return;
    }

    const summary = health.summary || {};
    mount.innerHTML = `
      <div class="backend-status-box ok">
        <strong>Daily Health: ${escapeHtml(health.status || 'pass')}</strong>
        <span>Slate: ${escapeHtml(health.slate_date || 'auto')}</span>
        <span>Backend: ${escapeHtml(health.version || 'unknown')}</span>
        <span>Freshness: ${summary.freshness_gate_ok === false ? 'REVIEW' : 'OK'}</span>
        <span>Active Failures: ${escapeHtml(summary.active_failures ?? 0)}</span>
      </div>
    `;
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

  function buildMatrixSections(row = {}, vault = null, backendHealth = null) {
    const support = getSupportStatus(row);
    const packetStatus = vault?.packet_status || 'not_started';
    const scoreStatus = vault?.score_status || 'not_started';
    const healthOk = backendHealth?.ok === true;
    const warningList = Array.isArray(vault?.warnings) ? vault.warnings : [];
    const score = vault?.score || {};

    return [
      renderMatrixSection('Identity', [
        { label: 'Player', value: row.parsedPlayer || 'MISSING', status: row.parsedPlayer ? 'ok' : 'missing' },
        { label: 'Team', value: row.team || 'MISSING', status: row.team ? 'ok' : 'missing' },
        { label: 'Opponent', value: row.opponent || 'MISSING', status: row.opponent ? 'ok' : 'missing' },
        { label: 'Prop Family', value: support.family },
        { label: 'Backend Payload', value: vault?.payload ? compactJson(vault.payload, 700) : 'QUEUED AFTER BACKEND PASS', status: vault?.payload ? 'ok' : 'pending' }
      ], true),
      renderMatrixSection('Trend', [
        { label: 'Recent Usage Source', value: healthOk ? 'D1 player_recent_usage foundation available' : 'WAITING DAILY HEALTH', status: healthOk ? 'ok' : 'pending' },
        checkValue(backendHealth, 'PLAYERS_CURRENT'),
        { label: 'Packet Status', value: packetStatus, status: packetStatus === 'ok' ? 'ok' : (packetStatus === 'error' ? 'missing' : 'pending') }
      ]),
      renderMatrixSection('Matchup', [
        { label: 'Game / Matchup', value: `${row.team || 'MISSING'} ${row.opponent ? 'vs/@' : ''} ${row.opponent || 'MISSING'}`.trim(), status: row.team && row.opponent ? 'ok' : 'missing' },
        checkValue(backendHealth, 'GAMES_TODAY'),
        checkValue(backendHealth, 'STARTERS_TODAY'),
        { label: 'Opposing Starter Detail', value: vault?.packet?.opposing_starter?.starter_name || vault?.packet?.candidate?.opposing_starter || 'PENDING PACKET ENDPOINT', status: (vault?.packet?.opposing_starter?.starter_name || vault?.packet?.candidate?.opposing_starter) ? 'ok' : 'pending' }
      ]),
      renderMatrixSection('Role / Usage', [
        { label: 'Role Type', value: row.type || 'MISSING', status: row.type ? 'ok' : 'missing' },
        checkValue(backendHealth, 'LINEUPS_TODAY'),
        { label: 'Lineup Slot', value: vault?.packet?.lineup_slot || 'PENDING PACKET ENDPOINT', status: vault?.packet?.lineup_slot ? 'ok' : 'pending' }
      ]),
      renderMatrixSection('Market', [
        { label: 'Prop', value: row.prop || 'MISSING', status: row.prop ? 'ok' : 'missing' },
        { label: 'Line', value: row.line || 'MISSING', status: row.line ? 'ok' : 'missing' },
        { label: 'Direction', value: row.direction || row.side || row.type || 'PENDING', status: row.direction || row.side || row.type ? 'ok' : 'pending' },
        checkValue(backendHealth, 'MARKETS_TODAY')
      ]),
      renderMatrixSection('Environment', [
        checkValue(backendHealth, 'BULLPENS_TODAY'),
        { label: 'Venue / Park', value: vault?.packet?.venue || vault?.packet?.game?.venue || vault?.packet?.park || 'PENDING PACKET ENDPOINT', status: (vault?.packet?.venue || vault?.packet?.game?.venue || vault?.packet?.park) ? 'ok' : 'pending' },
        { label: 'Weather', value: 'FUTURE MINER', status: 'pending' }
      ]),
      renderMatrixSection('Risk', [
        { label: 'Daily Health', value: backendHealth ? (backendHealth.ok ? 'PASS' : 'FAIL') : 'NOT CHECKED', status: backendHealth?.ok ? 'ok' : 'pending' },
        { label: 'Unsupported Family', value: support.family === 'UNWIRED' ? 'YES' : 'NO', status: support.family === 'UNWIRED' ? 'missing' : 'ok' },
        { label: 'Packet Error', value: vault?.packet_request?.error || 'NONE / NOT RUN', status: vault?.packet_request?.error ? 'missing' : 'pending' },
        { label: 'Score Error', value: vault?.score_request?.error || 'NONE / NOT RUN', status: vault?.score_request?.error ? 'missing' : 'pending' }
      ]),
      renderMatrixSection('Final Score', [
        { label: 'Score', value: score.final_score ?? score.finalScore ?? 'NOT SCORED YET', status: score.final_score || score.finalScore ? 'ok' : 'pending' },
        { label: 'Verdict', value: score.verdict || 'WAITING FOR SCORING ADAPTER', status: score.verdict ? 'ok' : 'pending' },
        { label: 'Confidence', value: score.confidence || 'NOT ASSIGNED', status: score.confidence ? 'ok' : 'pending' },
        { label: 'Score Status', value: scoreStatus, status: scoreStatus === 'ok' ? 'ok' : (scoreStatus === 'error' ? 'missing' : 'pending') }
      ]),
      renderMatrixSection('Hit Probability', [
        { label: 'Probability', value: score.hit_probability ?? score.hitProbability ?? 'NOT CALCULATED YET', status: score.hit_probability || score.hitProbability ? 'ok' : 'pending' },
        { label: 'Formula Source', value: 'PENDING PROP FAMILY ADAPTER', status: 'pending' }
      ]),
      renderMatrixSection('Warnings', [
        { label: 'Current Warning State', value: warningList.length ? warningList.join(' | ') : support.label, status: warningList.length ? 'missing' : (support.tone === 'ready' ? 'ok' : 'pending') },
        { label: 'Backend Freshness Gate', value: backendHealth?.summary?.freshness_gate_ok === false ? 'REVIEW' : (backendHealth?.ok ? 'PASS/OK' : 'NOT CHECKED'), status: backendHealth?.ok ? 'ok' : 'pending' }
      ]),
      renderMatrixSection('Derived Flags / Raw Packet Preview', [
        { label: 'Derived Fields', value: Array.isArray(vault?.derived_flags) && vault.derived_flags.length ? vault.derived_flags.join(' | ') : 'NONE FLAGGED YET', status: 'pending' },
        { label: 'Raw Packet', value: vault?.packet ? compactJson(vault.packet, 900) : 'PENDING /packet/leg RESPONSE', status: vault?.packet ? 'ok' : 'pending' },
        { label: 'Raw Score', value: vault?.score ? compactJson(vault.score, 900) : 'PENDING /score/leg RESPONSE', status: vault?.score ? 'ok' : 'pending' }
      ])
    ].join('');
  }

  function renderAnalysisScreen(rows = [], miningVault = {}, backendHealth = null) {
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
          const vault = miningVault?.[rowKey(row, index)] || null;
          const score = vault?.score || {};
          const hasScore = score.final_score || score.finalScore;
          const statusText = vault?.status || support.label;
          const chipClass = hasScore ? 'score-ready' : (vault?.status?.includes('error') || vault?.status?.includes('fix') ? 'score-error' : 'score-pending');
          return `
            <article class="player-card" data-row-index="${escapeHtml(index + 1)}">
              <div class="player-card-head">
                <div>
                  <div class="player-kicker">LEG ${escapeHtml(index + 1)} • ${escapeHtml(support.family)}</div>
                  <h3>${escapeHtml(row.parsedPlayer || 'Unknown Player')}</h3>
                  <p>${escapeHtml(row.team || '—')} vs/@ ${escapeHtml(row.opponent || '—')} • ${escapeHtml(row.gameTimeText || 'Time pending')}</p>
                </div>
                <div class="score-chip ${chipClass}">${escapeHtml(hasScore ? (score.final_score || score.finalScore) : 'Pending')}</div>
              </div>
              <div class="leg-summary-grid">
                <div><span>Prop</span><strong>${escapeHtml(row.prop || '—')}</strong></div>
                <div><span>Line</span><strong>${escapeHtml(row.line || '—')}</strong></div>
                <div><span>Type</span><strong>${escapeHtml(row.type || '—')}</strong></div>
                <div><span>Status</span><strong>${escapeHtml(statusText)}</strong></div>
              </div>
              <div class="matrix-shell">
                ${buildMatrixSections(row, vault, backendHealth)}
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderSystemLog(logRows = []) {
    const mount = el('systemLogMount');
    if (!mount) return;

    if (!Array.isArray(logRows) || !logRows.length) {
      mount.innerHTML = '<div class="system-log-empty">No backend/mining steps logged yet.</div>';
      return;
    }

    mount.innerHTML = logRows.slice().reverse().map((item) => {
      const level = String(item.level || 'info').toLowerCase();
      const safeLevel = ['info', 'success', 'warn', 'error'].includes(level) ? level : 'info';
      return `
        <div class="system-log-row system-log-${safeLevel}">
          <div class="system-log-time">${escapeHtml(item.time || '')}</div>
          <div class="system-log-level">${escapeHtml(safeLevel)}</div>
          <div class="system-log-message">${escapeHtml(item.message || '')}</div>
          ${item.detail ? `<div class="system-log-detail">${escapeHtml(item.detail)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function buildDebugReport(report = {}) {
    const lines = [];
    const now = new Date().toISOString();
    const state = report.state || {};
    const rows = Array.isArray(state.cleanPool) ? state.cleanPool : [];
    const vault = state.miningVault || {};
    const health = state.backendHealth || null;
    const logRows = Array.isArray(state.systemLog) ? state.systemLog : [];

    lines.push('OXYGEN-COBALT MAIN SYSTEM DEBUG REPORT');
    lines.push(`Generated: ${now}`);
    lines.push(`Frontend Version: ${report.version || SYSTEM_VERSION}`);
    lines.push(`Worker URL: ${report.backendUrl || 'UNKNOWN'}`);
    lines.push(`Slate Date: ${state.slateDate || 'AUTO / BLANK'}`);
    lines.push(`Active Screen: ${state.activeScreen || 'UNKNOWN'}`);
    lines.push('');

    lines.push('=== SCREEN 1 / INGEST SUMMARY ===');
    lines.push(`Accepted Legs: ${rows.length}`);
    lines.push(`Rejected Lines: ${Array.isArray(state.auditRows?.rejectedLines) ? state.auditRows.rejectedLines.length : 0}`);
    rows.forEach((row, index) => {
      lines.push(`${index + 1}. ${row.parsedPlayer || 'UNKNOWN'} | ${row.team || ''} vs/@ ${row.opponent || ''} | ${row.prop || ''} | line ${row.line || ''} | type ${row.type || ''} | time ${row.gameTimeText || ''}`);
    });
    lines.push('');

    lines.push('=== DAILY HEALTH ===');
    if (!health) {
      lines.push('Daily Health: NOT CHECKED');
    } else {
      lines.push(`ok: ${health.ok}`);
      lines.push(`version: ${health.version || 'UNKNOWN'}`);
      lines.push(`status: ${health.status || 'UNKNOWN'}`);
      lines.push(`slate_date: ${health.slate_date || 'UNKNOWN'}`);
      lines.push(`error: ${health.error || 'NONE'}`);
      lines.push('table_checks:');
      (health.table_checks || []).forEach((check) => {
        lines.push(`- ${check.check}: ${check.value} / ${check.status} / ok=${check.ok}`);
      });
      lines.push(`summary: ${compactJson(health.summary || {}, 3000)}`);
    }
    lines.push('');

    lines.push('=== SCREEN 2 / LEG MATRIX STATE ===');
    rows.forEach((row, index) => {
      const key = String(row?.LEG_ID || row?.id || row?.idx || index + 1);
      const item = vault[key] || {};
      lines.push(`--- LEG ${index + 1} ---`);
      lines.push(`Player: ${row.parsedPlayer || 'UNKNOWN'}`);
      lines.push(`Team/Opponent: ${row.team || ''} vs/@ ${row.opponent || ''}`);
      lines.push(`Prop: ${row.prop || ''}`);
      lines.push(`Line: ${row.line || ''}`);
      lines.push(`Family: ${item.family || (window.PickCalcConnectors?.normalizePropFamily ? window.PickCalcConnectors.normalizePropFamily(row) : 'UNKNOWN')}`);
      lines.push(`Status: ${item.status || 'NOT STARTED'}`);
      lines.push(`Packet Status: ${item.packet_status || 'NOT STARTED'}`);
      lines.push(`Score Status: ${item.score_status || 'NOT STARTED'}`);
      lines.push(`Warnings: ${Array.isArray(item.warnings) && item.warnings.length ? item.warnings.join(' | ') : 'NONE'}`);
      lines.push(`Payload: ${compactJson(item.payload || {}, 3000)}`);
      lines.push(`Packet Request: ${compactJson(item.packet_request || {}, 3000)}`);
      lines.push(`Score Request: ${compactJson(item.score_request || {}, 3000)}`);
      lines.push(`Packet: ${compactJson(item.packet || {}, 3000)}`);
      lines.push(`Score: ${compactJson(item.score || {}, 3000)}`);
    });
    lines.push('');

    lines.push('=== SYSTEM LOG ===');
    if (!logRows.length) lines.push('No log rows captured.');
    logRows.forEach((item) => {
      lines.push(`[${item.time || ''}] ${String(item.level || 'info').toUpperCase()} ${item.message || ''}${item.detail ? ` | ${item.detail}` : ''}`);
    });
    lines.push('');

    lines.push('=== RAW STATE SNAPSHOT ===');
    lines.push(compactJson({
      cleanPool: rows,
      auditRows: state.auditRows,
      miningVault: state.miningVault,
      backendHealth: state.backendHealth,
      systemLog: state.systemLog
    }, 20000));

    return lines.join('\n');
  }

  async function copyTextToClipboard(text) {
    const value = String(text || '');
    if (!value.trim()) return false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {}

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    textarea.remove();
    return ok;
  }

  return {
    SYSTEM_VERSION,
    el,
    showToast,
    hydrateBackendControls,
    renderFeedStatus,
    renderPoolTable,
    renderBackendStatus,
    renderAnalysisScreen,
    renderSystemLog,
    buildDebugReport,
    copyTextToClipboard
  };
})();
