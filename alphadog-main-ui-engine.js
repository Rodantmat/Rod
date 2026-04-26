window.PickCalcUI = (() => {
  const SYSTEM_VERSION = 'v13.78.05 (OXYGEN-COBALT) • Main-1L MLB Cleanup Pass';

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

  function lightForScore(score) {
    const n = Number(score);
    if (!Number.isFinite(n)) return '0/100 🔴 RISK';
    if (n >= 80) return `${Math.round(n)}/100 🟢 STRONG`;
    if (n >= 65) return `${Math.round(n)}/100 🟡 REVIEW`;
    return `${Math.round(n)}/100 🔴 RISK`;
  }

  function formatFactorValue(factor) {
    if (!factor) return `MISSING — ${lightForScore(0)}`;
    const value = factor.value === undefined || factor.value === null || factor.value === '' ? 'MISSING' : factor.value;
    return `${value} — ${lightForScore(factor.score)}${factor.source ? ` • ${factor.source}` : ''}`;
  }

  function getPacket(vault = null) {
    if (!vault) return null;
    if (vault.packet?.packet) return vault.packet.packet;
    if (vault.packet) return vault.packet;
    if (vault.score_request?.score?.packet) return vault.score_request.score.packet;
    return null;
  }

  function getFactor(packet, section, key) {
    const rows = packet?.matrix_factors?.[section] || [];
    return rows.find((row) => row.key === key) || null;
  }

  function factorRows(packet, section) {
    return (packet?.matrix_factors?.[section] || []).map((factor) => ({
      label: factor.label,
      value: formatFactorValue(factor),
      status: factor.score >= 80 ? 'ok' : (factor.score >= 65 ? 'pending' : 'missing')
    }));
  }

  function rawCountRows(packet) {
    const inv = packet?.db_inventory || {};
    return Object.keys(inv).map((key) => ({
      label: key,
      value: String(inv[key]) + ' row(s)',
      status: Number(inv[key]) > 0 ? 'ok' : 'missing'
    }));
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

  function packetValue(packet, path, fallback = 'MISSING') {
    if (!packet) return fallback;
    let cur = packet;
    for (const part of path.split('.')) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, part)) cur = cur[part];
      else return fallback;
    }
    return cur === undefined || cur === null || cur === '' ? fallback : cur;
  }

  function buildMatrixSections(row = {}, vault = null, backendHealth = null) {
    const support = getSupportStatus(row);
    const packet = getPacket(vault);
    const packetStatus = vault?.packet_status || 'not_started';
    const scoreStatus = vault?.score_status || 'not_started';
    const warningList = Array.isArray(vault?.warnings) ? vault.warnings : [];
    const score = vault?.score || {};
    const factorSummary = packet?.matrix_factor_summary || score?.matrix_factor_summary || null;
    const cache = packet?.incremental_cache || null;

    return [
      renderMatrixSection('Identity', [
        { label: 'Player Identity', value: formatFactorValue(getFactor(packet, 'identity', 'player_identity')), status: getFactor(packet, 'identity', 'player_identity') ? 'ok' : 'missing' },
        { label: 'Team / Opponent', value: formatFactorValue(getFactor(packet, 'identity', 'team_match')), status: getFactor(packet, 'identity', 'team_match') ? 'ok' : 'missing' },
        { label: 'Prop Family', value: formatFactorValue(getFactor(packet, 'identity', 'prop_family')), status: getFactor(packet, 'identity', 'prop_family') ? 'ok' : 'pending' },
        { label: 'Backend Payload', value: vault?.payload ? compactJson(vault.payload, 700) : 'QUEUED AFTER BACKEND PASS', status: vault?.payload ? 'ok' : 'pending' }
      ], true),
      renderMatrixSection('Trend', [
        { label: 'Last 5 / Recent Hits', value: formatFactorValue(getFactor(packet, 'trend', 'last5_hits')), status: getFactor(packet, 'trend', 'last5_hits') ? 'ok' : 'missing' },
        { label: 'Season AVG', value: formatFactorValue(getFactor(packet, 'trend', 'season_avg')), status: getFactor(packet, 'trend', 'season_avg') ? 'ok' : 'missing' },
        { label: 'Season OBP', value: formatFactorValue(getFactor(packet, 'trend', 'season_obp')), status: getFactor(packet, 'trend', 'season_obp') ? 'ok' : 'missing' },
        { label: 'Season SLG', value: formatFactorValue(getFactor(packet, 'trend', 'season_slg')), status: getFactor(packet, 'trend', 'season_slg') ? 'ok' : 'missing' },
        checkValue(backendHealth, 'PLAYERS_CURRENT')
      ]),
      renderMatrixSection('Matchup', [
        { label: 'Game / Matchup', value: `${packetValue(packet, 'game.away_team', row.opponent || 'MISSING')} @ ${packetValue(packet, 'game.home_team', row.team || 'MISSING')}`, status: packet?.game ? 'ok' : 'missing' },
        { label: 'Opposing Starter', value: formatFactorValue(getFactor(packet, 'matchup', 'opposing_starter')), status: getFactor(packet, 'matchup', 'opposing_starter') ? 'ok' : 'missing' },
        { label: 'Starter Hand', value: formatFactorValue(getFactor(packet, 'matchup', 'starter_throws')), status: getFactor(packet, 'matchup', 'starter_throws') ? 'ok' : 'missing' },
        { label: 'Starter WHIP', value: formatFactorValue(getFactor(packet, 'matchup', 'starter_whip')), status: getFactor(packet, 'matchup', 'starter_whip') ? 'ok' : 'missing' },
        { label: 'Starter ERA', value: formatFactorValue(getFactor(packet, 'matchup', 'starter_era')), status: getFactor(packet, 'matchup', 'starter_era') ? 'ok' : 'missing' },
        { label: 'Starter H/IP', value: formatFactorValue(getFactor(packet, 'matchup', 'starter_hits_per_ip')), status: getFactor(packet, 'matchup', 'starter_hits_per_ip') ? 'ok' : 'missing' },
        checkValue(backendHealth, 'STARTERS_TODAY')
      ]),
      renderMatrixSection('Role / Usage', [
        { label: 'Lineup Slot', value: formatFactorValue(getFactor(packet, 'role_usage', 'lineup_slot')), status: getFactor(packet, 'role_usage', 'lineup_slot') ? 'ok' : 'missing' },
        { label: 'Lineup Confirmed', value: formatFactorValue(getFactor(packet, 'role_usage', 'lineup_confirmed')), status: getFactor(packet, 'role_usage', 'lineup_confirmed') ? 'ok' : 'missing' },
        { label: 'Role Type', value: formatFactorValue(getFactor(packet, 'role_usage', 'role_type')), status: getFactor(packet, 'role_usage', 'role_type') ? 'ok' : 'missing' },
        { label: 'Recent AB Volume', value: formatFactorValue(getFactor(packet, 'role_usage', 'recent_ab_volume')), status: getFactor(packet, 'role_usage', 'recent_ab_volume') ? 'ok' : 'missing' },
        checkValue(backendHealth, 'LINEUPS_TODAY')
      ]),
      renderMatrixSection('Market', [
        { label: 'Prop', value: row.prop || 'MISSING', status: row.prop ? 'ok' : 'missing' },
        { label: 'Line', value: row.line || 'MISSING', status: row.line ? 'ok' : 'missing' },
        { label: 'Direction', value: row.direction || row.side || 'PENDING', status: row.direction || row.side ? 'ok' : 'pending' },
        { label: 'Game Total', value: formatFactorValue(getFactor(packet, 'market', 'game_total')), status: getFactor(packet, 'market', 'game_total') ? 'ok' : 'missing' },
        { label: 'Team Implied Runs', value: formatFactorValue(getFactor(packet, 'market', 'team_implied_runs')), status: getFactor(packet, 'market', 'team_implied_runs') ? 'ok' : 'missing' },
        { label: 'Market Source', value: formatFactorValue(getFactor(packet, 'market', 'market_source')), status: getFactor(packet, 'market', 'market_source') ? 'ok' : 'missing' },
        checkValue(backendHealth, 'MARKETS_TODAY')
      ]),
      renderMatrixSection('Environment', [
        { label: 'Venue / Park', value: formatFactorValue(getFactor(packet, 'environment', 'venue')), status: getFactor(packet, 'environment', 'venue') ? 'ok' : 'missing' },
        { label: 'Park Run Factor', value: formatFactorValue(getFactor(packet, 'environment', 'park_run_factor')), status: getFactor(packet, 'environment', 'park_run_factor') ? 'ok' : 'missing' },
        { label: 'Park HR Factor', value: formatFactorValue(getFactor(packet, 'environment', 'park_hr_factor')), status: getFactor(packet, 'environment', 'park_hr_factor') ? 'ok' : 'missing' },
        { label: 'Opponent Bullpen Fatigue', value: formatFactorValue(getFactor(packet, 'environment', 'bullpen_fatigue')), status: getFactor(packet, 'environment', 'bullpen_fatigue') ? 'ok' : 'missing' },
        { label: 'Weather', value: 'FUTURE MINER — 0/100 🔴 RISK', status: 'missing' },
        checkValue(backendHealth, 'BULLPENS_TODAY')
      ]),
      renderMatrixSection('Team Context', factorRows(packet, 'team_context')),
      renderMatrixSection('MLB API Enrichment', [
        ...factorRows(packet, 'mlb_api'),
        { label: 'MLB Recent Player Logs Raw', value: packet?.mlb_api?.player_recent_logs ? compactJson(packet.mlb_api.player_recent_logs, 1600) : 'MISSING', status: packet?.mlb_api?.player_recent_logs?.length ? 'ok' : 'missing' },
        { label: 'MLB Team Recent Games Raw', value: packet?.mlb_api?.team_recent_games ? compactJson(packet.mlb_api.team_recent_games, 1600) : 'MISSING', status: packet?.mlb_api?.team_recent_games?.length ? 'ok' : 'missing' },
        { label: 'MLB Opponent Bullpen Recent Raw', value: packet?.mlb_api?.opponent_bullpen_recent ? compactJson(packet.mlb_api.opponent_bullpen_recent, 1400) : 'MISSING', status: packet?.mlb_api?.opponent_bullpen_recent?.length ? 'ok' : 'missing' }
      ]),
      renderMatrixSection('Candidate Context', factorRows(packet, 'candidate_context')),
      renderMatrixSection('Full DB Inventory', [
        ...rawCountRows(packet),
        { label: 'Team Lineup Raw', value: packet?.team_lineup ? compactJson(packet.team_lineup, 800) : 'MISSING', status: packet?.team_lineup?.length ? 'ok' : 'missing' },
        { label: 'Opponent Lineup Raw', value: packet?.opponent_lineup ? compactJson(packet.opponent_lineup, 800) : 'MISSING', status: packet?.opponent_lineup?.length ? 'ok' : 'missing' },
        { label: 'Game Starters Raw', value: packet?.game_starters ? compactJson(packet.game_starters, 1200) : 'MISSING', status: packet?.game_starters?.length ? 'ok' : 'missing' },
        { label: 'Game Bullpens Raw', value: packet?.game_bullpens ? compactJson(packet.game_bullpens, 1200) : 'MISSING', status: packet?.game_bullpens?.length ? 'ok' : 'missing' },
        { label: 'Related Candidates Raw', value: packet?.related_candidates ? compactJson(packet.related_candidates, 900) : 'MISSING', status: packet?.related_candidates ? 'ok' : 'missing' },
        { label: 'MLB API Raw', value: packet?.mlb_api ? compactJson(packet.mlb_api, 900) : 'MISSING', status: packet?.mlb_api?.ok ? 'ok' : 'missing' }
      ]),
      renderMatrixSection('Risk', [
        { label: 'Daily Health', value: backendHealth ? (backendHealth.ok ? 'PASS — 100/100 🟢 STRONG' : 'FAIL — 0/100 🔴 RISK') : 'NOT CHECKED — 0/100 🔴 RISK', status: backendHealth?.ok ? 'ok' : 'missing' },
        { label: 'Packet Completeness', value: formatFactorValue(getFactor(packet, 'risk', 'packet_completeness')), status: getFactor(packet, 'risk', 'packet_completeness') ? 'ok' : 'missing' },
        { label: 'Candidate Tier', value: formatFactorValue(getFactor(packet, 'candidate_context', 'candidate_tier')), status: getFactor(packet, 'candidate_context', 'candidate_tier') ? 'ok' : 'missing' },
        { label: 'Lineup Context', value: formatFactorValue(getFactor(packet, 'candidate_context', 'lineup_context')), status: getFactor(packet, 'candidate_context', 'lineup_context') ? 'ok' : 'missing' },
        { label: 'Warnings', value: formatFactorValue(getFactor(packet, 'risk', 'warnings')), status: warningList.length ? 'missing' : 'ok' },
        { label: 'Packet Error', value: vault?.packet_request?.error || 'NONE', status: vault?.packet_request?.error ? 'missing' : 'ok' },
        { label: 'Score Error', value: vault?.score_request?.error || 'NONE', status: vault?.score_request?.error ? 'missing' : 'ok' }
      ]),
      renderMatrixSection('Matrix Summary / Cache', [
        { label: 'Factor Summary', value: factorSummary ? `${factorSummary.strong} strong / ${factorSummary.review} review / ${factorSummary.risk} risk / avg ${factorSummary.average_factor_score}` : 'PENDING MATRIX FACTORS', status: factorSummary ? 'ok' : 'pending' },
        { label: 'Incremental Cache', value: cache ? `${cache.ok ? 'UPSERT OK' : 'CACHE REVIEW'} • ${cache.table || ''} • ${cache.cache_key || cache.mode || ''}` : 'PENDING CACHE RESULT', status: cache?.ok ? 'ok' : (cache ? 'missing' : 'pending') },
        { label: 'Cache Mode', value: cache?.mode || 'PENDING', status: cache ? 'ok' : 'pending' }
      ]),
      renderMatrixSection('Final Score', [
        { label: 'Score', value: score.final_score ?? score.finalScore ?? 'NOT FINAL — MATRIX ONLY', status: score.final_score || score.finalScore ? 'ok' : 'pending' },
        { label: 'Verdict', value: score.verdict || 'WAITING FOR FINAL SCORING ADAPTER', status: score.verdict ? 'ok' : 'pending' },
        { label: 'Confidence', value: score.confidence || 'NOT FINAL', status: score.confidence ? 'ok' : 'pending' },
        { label: 'Score Status', value: scoreStatus, status: scoreStatus === 'ok' ? 'ok' : (scoreStatus === 'error' ? 'missing' : 'pending') }
      ]),
      renderMatrixSection('Raw Packet Preview', [
        { label: 'Raw Packet', value: packet ? compactJson(packet, 650) : 'PENDING /main/packet/leg RESPONSE', status: packet ? 'ok' : 'pending' },
        { label: 'Raw Score', value: vault?.score ? compactJson(vault.score, 650) : 'PENDING /main/score/leg RESPONSE', status: vault?.score ? 'ok' : 'pending' }
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

    function resultSummary(req) {
      const result = req?.result || {};
      return {
        ok: req?.ok ?? result?.ok ?? false,
        source: req?.source || null,
        family: req?.family || null,
        http_status: result?.http_status || null,
        url: result?.url || null,
        started_at: result?.started_at || null,
        finished_at: result?.finished_at || null,
        error: req?.error || result?.error || null
      };
    }

    function briefPacket(packet = {}) {
      const mlb = packet?.mlb_api || {};
      return {
        ok: packet.ok || false,
        mode: packet.mode || null,
        slate_date: packet.slate_date || null,
        leg: packet.leg || null,
        game: packet.game || null,
        market: packet.market || null,
        player: packet.player || null,
        lineup: packet.lineup || null,
        opposing_starter: packet.opposing_starter || null,
        bullpen: packet.bullpen || null,
        recent_usage: Array.isArray(packet.recent_usage) ? packet.recent_usage.slice(0, 5) : [],
        candidate: packet.candidate || null,
        matrix_factor_summary: packet.matrix_factor_summary || null,
        incremental_cache: packet.incremental_cache || null,
        db_counts: {
          team_lineup: packet.team_lineup?.length || 0,
          opponent_lineup: packet.opponent_lineup?.length || 0,
          game_starters: packet.game_starters?.length || 0,
          game_bullpens: packet.game_bullpens?.length || 0,
          team_players: packet.team_players?.length || 0,
          opponent_players: packet.opponent_players?.length || 0,
          related_hits: packet.related_candidates?.hits?.length || 0,
          related_rbi: packet.related_candidates?.rbi?.length || 0,
          related_rfi: packet.related_candidates?.rfi?.length || 0
        },
        mlb_api: {
          ok: mlb.ok || false,
          game_pk: mlb.game_pk || null,
          live_status: mlb.live_status || null,
          player_recent_summary: mlb.player_recent_summary || null,
          team_recent_games: Array.isArray(mlb.team_recent_games) ? mlb.team_recent_games.slice(0, 5) : [],
          opponent_bullpen_recent: Array.isArray(mlb.opponent_bullpen_recent) ? mlb.opponent_bullpen_recent.slice(0, 3) : [],
          boxscore_starting_lineup_count: mlb.boxscore_lineup?.length || 0,
          opponent_starting_lineup_count: mlb.opponent_boxscore_lineup?.length || 0,
          substitutions_count: mlb.boxscore_substitutions?.length || 0,
          opponent_substitutions_count: mlb.opponent_boxscore_substitutions?.length || 0,
          participant_count: mlb.boxscore_participants?.length || 0,
          opponent_participant_count: mlb.opponent_boxscore_participants?.length || 0,
          cache_summary: mlb.cache_summary || null,
          api_requests: Array.isArray(mlb.api_requests) ? mlb.api_requests.map(r => ({ ok: r.ok, from_cache: r.from_cache, error: r.error || null })) : [],
          warnings: mlb.warnings || []
        },
        missing: packet.missing || [],
        warnings: packet.warnings || []
      };
    }

    lines.push('OXYGEN-COBALT MAIN SYSTEM DEBUG REPORT');
    lines.push(`Generated: ${now}`);
    lines.push(`Frontend Version: ${report.version || SYSTEM_VERSION}`);
    lines.push(`Worker URL: ${report.backendUrl || 'UNKNOWN'}`);
    lines.push(`Slate Date: ${state.slateDate || 'AUTO / BLANK'}`);
    lines.push(`Active Screen: ${state.activeScreen || 'UNKNOWN'}`);
    lines.push('Report Mode: COMPACT CLEANUP — full raw arrays are summarized to prevent clipboard overload.');
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
      (health.table_checks || []).forEach((check) => lines.push(`- ${check.check}: ${check.value} / ${check.status} / ok=${check.ok}`));
      lines.push(`summary: ${compactJson(health.summary || {}, 1000)}`);
    }
    lines.push('');

    lines.push('=== SCREEN 2 / LEG MATRIX STATE ===');
    rows.forEach((row, index) => {
      const key = String(row?.LEG_ID || row?.id || row?.idx || index + 1);
      const item = vault[key] || {};
      const packet = item.packet || item.packet_request?.packet || item.packet_request?.result?.body || null;
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
      lines.push(`Payload: ${compactJson(item.payload || {}, 1400)}`);
      lines.push(`Packet Request Summary: ${compactJson(resultSummary(item.packet_request), 1400)}`);
      lines.push(`Score Request Summary: ${compactJson(resultSummary(item.score_request), 1400)}`);
      lines.push(`Packet Summary: ${compactJson(briefPacket(packet || {}), 12000)}`);
      lines.push(`Score: ${compactJson(item.score || {}, 3000)}`);
    });
    lines.push('');

    lines.push('=== SYSTEM LOG ===');
    if (!logRows.length) lines.push('No log rows captured.');
    logRows.forEach((item) => {
      const detail = item.detail ? String(item.detail) : '';
      const briefDetail = detail.length > 1200 ? `${detail.slice(0, 1200)} …[truncated]` : detail;
      lines.push(`[${item.time || ''}] ${String(item.level || 'info').toUpperCase()} ${item.message || ''}${briefDetail ? ` | ${briefDetail}` : ''}`);
    });
    lines.push('');

    lines.push('=== RAW STATE SNAPSHOT / COMPACT ===');
    const compactVault = {};
    Object.entries(vault || {}).forEach(([key, item]) => {
      const packet = item?.packet || item?.packet_request?.packet || item?.packet_request?.result?.body || null;
      compactVault[key] = {
        status: item?.status || null,
        family: item?.family || null,
        packet_status: item?.packet_status || null,
        score_status: item?.score_status || null,
        warnings: item?.warnings || [],
        matrix_factor_summary: packet?.matrix_factor_summary || item?.score?.matrix_factor_summary || null,
        incremental_cache: packet?.incremental_cache || null,
        score: item?.score || null,
        packet_summary: briefPacket(packet || {})
      };
    });
    lines.push(compactJson({
      cleanPool: rows,
      auditRows: state.auditRows,
      miningVault: compactVault,
      backendHealth: state.backendHealth,
      systemLog: (state.systemLog || []).map(item => ({ ...item, detail: item.detail && String(item.detail).length > 1200 ? `${String(item.detail).slice(0, 1200)} …[truncated]` : item.detail }))
    }, 25000));

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
