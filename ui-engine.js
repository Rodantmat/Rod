window.PickCalcUI = window.PickCalcUI || {};
(() => {
  const SYSTEM_VERSION = 'v13.77.14 (OXYGEN-COBALT)';
  const BRANCH_TOTAL = 72;
  const BRANCH_KEYS = ['A', 'B', 'C', 'D', 'E'];
  const BRANCH_TARGETS = { A: 20, B: 18, C: 12, D: 10, E: 12 };
  const PROVIDERS = ['DraftKings', 'FanDuel', 'BetMGM', 'Bet365', 'Pinnacle'];
  const MODEL_ID = 'gemini-flash-latest';
  const MLB_FEED_MATRIX = ['Strikeouts','Total Bases','H+R+RBI','Runs','Hits','Pitching Outs','Earned Runs','Walks Allowed','Hits Allowed'];

  const PROFILE_FACTOR_NAMES = {
    Pitcher: {
      A: [
        'Velocity Stability', 'Spin Rate Delta', 'Extension Efficiency', 'Vertical Break', 'Horizontal Movement',
        'Command Grade', 'Location Heat', 'Tunneling Quality', 'Release Consistency', 'Zone Rate',
        'K-BB% Trend', 'Whiff Rate (Fastball)', 'Whiff Rate (Offspeed)', 'First Pitch Strike%', 'Put-away % Efficiency',
        'Hard Hit Avoidance', 'Barrel Rate Allowed', 'GB/FB Ratio', 'Average Exit Velocity', 'Soft Contact%'
      ],
      B: [
        'Stamina Decay', 'Late Movement', 'Release Extension', 'Strike-One Rate', 'Pressure Tolerance', 'High-Leverage Efficiency',
        'Primary Pitch Reliability', 'Secondary Pitch Bite', 'Sequencing Logic', 'Pitch Mix Stability', 'Velocity Preservation',
        'Third-Time-Through Penalty', 'Contact Suppression', 'CSW Rate', 'Called Strike Edge', 'Chase Induction',
        'Backdoor Command', 'Finisher Quality'
      ],
      C: [
        'Park Factor', 'Umpire Bias', 'Wind Impact', 'Historical Matchup', 'L/R Splits', 'Recent 5-Game Trend',
        'Air Density', 'Umpire Zone Rating', 'Defense Support', 'Bullpen Buffer', 'Game Script Fit', 'Weather Volatility'
      ],
      D: [
        'Platoon Delta', 'Manager Pull Threshold', 'Lineup Depth', 'Run Support Expectation', 'Inning Efficiency',
        'Pitch Count Elasticity', 'Strike Zone Fit', 'Batted-Ball Luck', 'Recovery Window', 'Clutch Stability'
      ],
      E: [
        'DraftKings Projection', 'FanDuel Projection', 'BetMGM Projection', 'Bet365 Projection', 'Pinnacle Projection',
        'Consensus Mean', 'Consensus Median', 'Consensus High', 'Consensus Low', 'Spread', 'Line Delta', 'Market Confidence'
      ]
    },
    Hitter: {
      A: [
        'Bat Speed', 'Squared Up Rate', 'Blasts Per Swing', 'Sweet Spot%', 'Launch Angle Consistency',
        'Max Exit Velocity', 'Pull/Opposite Mix', 'Two-Strike Approach', 'Chase Rate', 'In-Zone Contact',
        'Pitch Recognition', 'Barrel Accuracy', 'Pull Power', 'Oppo Gap Efficiency', 'High-Fastball Combat',
        'Offspeed Timing', 'Clout Grade', 'Sprint Speed Impact', 'ISO Trend', 'Plate Coverage'
      ],
      B: [
        'Contact Authority', 'Damage on Mistakes', 'Breaking Ball Handling', 'Fastball Lift', 'Spray Discipline', 'RISP Approach',
        'Walk Pressure', 'Strikeout Resistance', 'First-Pitch Attack', 'Pull Airball Rate', 'Center-Field Carry',
        'Opposite-Field Carry', 'Lefty Split Stability', 'Righty Split Stability', 'Batted-Ball Efficiency',
        'Basepath Leverage', 'Lineup Spot Edge', 'Clutch Contact'
      ],
      C: [
        'Park Factor', 'Umpire Bias', 'Wind Impact', 'Historical Matchup', 'L/R Splits', 'Recent 5-Game Trend',
        'Air Density', 'Umpire Zone Rating', 'Bullpen Exposure', 'Weather Volatility', 'Lineup Protection', 'Game Script Fit'
      ],
      D: [
        'Platoon Delta', 'Manager Pull Threshold', 'Hit Probability Drift', 'Extra-Base Upside', 'Contact Floor',
        'Power Spike Chance', 'Pitcher Vulnerability', 'Defensive Shift Cost', 'Batted-Ball Luck', 'Late-Game Leverage'
      ],
      E: [
        'DraftKings Projection', 'FanDuel Projection', 'BetMGM Projection', 'Bet365 Projection', 'Pinnacle Projection',
        'Consensus Mean', 'Consensus Median', 'Consensus High', 'Consensus Low', 'Spread', 'Line Delta', 'Market Confidence'
      ]
    }
  };

  const FACTOR_GLOSSARY = {
    'Bat Speed': 'Raw velocity of the barrel at contact',
    'Squared Up Rate': 'Impact quality on flush contact',
    'Blasts Per Swing': 'High-speed ideal contact frequency',
    'Sweet Spot%': 'Launch efficiency in optimal band',
    'Launch Angle Consistency': 'Flight angle stability swing to swing',
    'Max Exit Velocity': 'Peak batted-ball speed ceiling',
    'Pull/Opposite Mix': 'Directional spray balance across field',
    'Two-Strike Approach': 'Adjustments made in protect counts',
    'Chase Rate': 'Swings at pitches off-zone',
    'In-Zone Contact': 'Contact rate on strikes seen',
    'Pitch Recognition': 'Read quality out of hand',
    'Barrel Accuracy': 'Precision of ideal impact point',
    'Pull Power': 'Damage ability to pull side',
    'Oppo Gap Efficiency': 'Opposite-field carry into alleys',
    'High-Fastball Combat': 'Performance against elevated velocity',
    'Offspeed Timing': 'Tempo match versus slow stuff',
    'Clout Grade': 'Overall extra-base damage quality',
    'Sprint Speed Impact': 'Run tool effect on outcomes',
    'ISO Trend': 'Recent isolated power trajectory',
    'Plate Coverage': 'Reach across full strike zone',
    'Velocity Stability': 'Consistency of heater speed through innings',
    'Spin Rate Delta': 'Variance in movement-driving spin',
    'Extension Efficiency': 'Release point distance advantage forward',
    'Vertical Break': 'Gravity-defying ride or drop shape',
    'Horizontal Movement': 'Side-to-side action through zone',
    'Command Grade': 'Ability to locate intended targets',
    'Location Heat': 'Concentration of quality attack spots',
    'Tunneling Quality': 'Pitch disguise on shared paths',
    'Release Consistency': 'Repeatability of arm slot release',
    'Zone Rate': 'Frequency of strikes in zone',
    'K-BB% Trend': 'Recent strikeout minus walk edge',
    'Whiff Rate (Fastball)': 'Miss rate generated on heaters',
    'Whiff Rate (Offspeed)': 'Miss rate generated offspeed',
    'First Pitch Strike%': 'Opening strike frequency to hitters',
    'Put-away % Efficiency': 'Ability to finish two-strike counts',
    'Hard Hit Avoidance': 'Suppression of loud contact allowed',
    'Barrel Rate Allowed': 'Ideal contact allowed per ball',
    'GB/FB Ratio': 'Ground-ball versus fly-ball mix',
    'Average Exit Velocity': 'Mean EV permitted on contact',
    'Soft Contact%': 'Weak contact share induced',
    'Air Density': 'Atmospheric resistance on ball flight travel',
    'Umpire Zone Rating': 'Numeric strike-call frequency profile',
    'Platoon Delta': 'L/R handedness edge magnitude',
    'Manager Pull Threshold': 'Historical volume and hook bias',
    'Park Factor': 'Run environment boost or drag',
    'Umpire Bias': 'General calling tendency influence',
    'Wind Impact': 'Wind effect on carry path',
    'Historical Matchup': 'Prior opponent interaction signal',
    'L/R Splits': 'Handedness split performance edge',
    'Recent 5-Game Trend': 'Short-run form over last five',
    'Fatigue Index': 'Wear-and-tear impact on output',
    'Travel Load': 'Schedule and transit burden factor',
    'Defense Support': 'Team fielding support behind pitcher',
    'Bullpen Buffer': 'Relief support protecting projection tail',
    'Game Script Fit': 'Scenario alignment with expected usage',
    'Weather Volatility': 'Instability from changing game weather',
    'Bullpen Exposure': 'Reliever quality likely faced late',
    'Lineup Protection': 'Support hitters around batter slot',
    'Hit Probability Drift': 'Shift in baseline hit odds',
    'Extra-Base Upside': 'Likelihood of doubles or better',
    'Contact Floor': 'Minimum likely contact outcome floor',
    'Power Spike Chance': 'Chance of elevated slug event',
    'Pitcher Vulnerability': 'Opponent weakness exploitable by hitter',
    'Defensive Shift Cost': 'Expected outs lost to positioning',
    'Batted-Ball Luck': 'Variance from fortune on contact',
    'Late-Game Leverage': 'Pressure-context effect in late innings',
    'Stamina Decay': 'Performance drop deeper into outing',
    'Late Movement': 'Shape quality late in pitch flight',
    'Release Extension': 'Forward release creating approach angle',
    'Strike-One Rate': 'First-strike generation frequency',
    'Pressure Tolerance': 'Execution under high-stress spots',
    'High-Leverage Efficiency': 'Results in leverage-heavy moments',
    'Primary Pitch Reliability': 'Dependability of primary offering',
    'Secondary Pitch Bite': 'Sharpness of offspeed break',
    'Sequencing Logic': 'Quality of pitch-order decisions',
    'Pitch Mix Stability': 'Consistency of arsenal allocation',
    'Velocity Preservation': 'Ability to hold velo late',
    'Third-Time-Through Penalty': 'Risk increase on repeated looks',
    'Contact Suppression': 'Limiting quality contact overall',
    'CSW Rate': 'Called plus swinging strike share',
    'Called Strike Edge': 'Extra strikes won from command',
    'Chase Induction': 'Ability to expand hitter decisions',
    'Backdoor Command': 'Precision on edge-stealing pitches',
    'Finisher Quality': 'Out pitch quality to end at-bats',
    'DraftKings Projection': 'DraftKings market-implied projection point',
    'FanDuel Projection': 'FanDuel market-implied projection point',
    'BetMGM Projection': 'BetMGM market-implied projection point',
    'Bet365 Projection': 'Bet365 market-implied projection point',
    'Pinnacle Projection': 'Pinnacle market-implied projection point',
    'Consensus Mean': 'Average across tracked book signals',
    'Consensus Median': 'Middle value across book signals',
    'Consensus High': 'Highest listed market estimate',
    'Consensus Low': 'Lowest listed market estimate',
    'Spread': 'Gap between high and low',
    'Line Delta': 'Difference versus anchor line',
    'Market Confidence': 'Agreement strength across books'
  };

  function resolveProfileType(row = {}) {
    const raw = String(row?.type || '').toLowerCase();
    if (raw.includes('pitch')) return 'Pitcher';
    if (raw.includes('hit')) return 'Hitter';
    return 'Hitter';
  }

  function factorKey(branchKey, index) { return `${branchKey.toLowerCase()}${String(index).padStart(2, '0')}`; }

  function resolveFactorName(row = {}, branchKey, index, meta = {}) {
    const profile = resolveProfileType(row);
    return PROFILE_FACTOR_NAMES[profile]?.[branchKey]?.[index - 1] || meta.name || `${branchKey}${String(index).padStart(2, '0')}`;
  }

  function renderLeagueChecklist(leagues) {
    const mount = el('leagueChecklist');
    if (!mount) return;
    mount.innerHTML = (leagues || []).map((item) => `<label><input type="checkbox" data-league-id="${escapeHtml(item.id)}" value="${escapeHtml(item.id)}" ${item.checked ? 'checked' : ''}/> ${escapeHtml(item.label)}</label>`).join('');
  }

  function renderRunSummary(rows, auditRows = []) {
    const mount = el('runSummary');
    if (!mount) return;
    const vaultCollection = window.PickCalcCore?.state?.miningVault || {};
    let activeStatuses = 0;
    Object.values(vaultCollection).forEach((vault) => {
      Object.values(vault?.branches || {}).forEach((branch) => {
        activeStatuses += Object.values(branch?.factorMeta || {}).filter((meta) => ['DERIVED', 'REAL', 'SUCCESS'].includes(meta?.status)).length;
      });
    });
    mount.innerHTML = [`<div class="pill">Accepted: ${rows.length}</div>`,`<div class="pill">Rejected: ${(auditRows || []).filter((r) => !r.accepted).length}</div>`,`<div class="pill">Active Probes: ${activeStatuses}</div>`,`<div class="pill">Version: ${escapeHtml(SYSTEM_VERSION)}</div>`].join('');
  }

  function renderFeedStatus(rows, auditRows = []) {
    const active = new Set((rows || []).filter((r) => r.sport === 'MLB').map((r) => String(r.prop || '').trim()));
    const mount = el('feedStatus');
    if (!mount) return;
    mount.innerHTML = `<div class="status-panel"><div class="status-panel-head"><div><strong>MLB Master Feed Checklist</strong><div class="mini-muted">Flip to ✅ only when a valid row enters the pool.</div></div><span class="status-badge ${(auditRows || []).some((r) => !r.accepted) ? 'status-no' : 'status-ok'}">${(auditRows || []).length} CLUSTERS</span></div><div class="prop-grid">${MLB_FEED_MATRIX.map((prop) => `<div class="prop-chip ${active.has(prop) ? 'prop-fed' : 'prop-missing'}"><span>${active.has(prop) ? '✅' : '❌'}</span><span>${escapeHtml(prop)}</span></div>`).join('')}</div></div>`;
  }

  function renderPoolTable(rows) {
    const mount = el('poolMount');
    if (!mount) return;
    if (!rows.length) { mount.innerHTML = ''; return; }
    mount.innerHTML = `<div class="status-panel"><div class="table-wrap"><table><thead><tr><th>#</th><th>Sport</th><th>League</th><th>Player / Entity</th><th>Team</th><th>Opponent</th><th>Prop</th><th>Line</th><th>Time</th><th>Type</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.idx)}</td><td>${escapeHtml(row.sport)}</td><td>${escapeHtml(row.league)}</td><td>${escapeHtml(row.parsedPlayer)}</td><td>${escapeHtml(row.team || '')}</td><td>${escapeHtml(row.opponent || '')}</td><td>${escapeHtml(row.prop || '')}</td><td>${escapeHtml(row.line || '')}</td><td>${escapeHtml(row.gameTimeText || '')}</td><td>${escapeHtml(row.type || '')}</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  function branchTone(branch) {
    if (branch?.status === 'SUCCESS') return { card: 'support live-data', badge: 'live', label: 'REAL' };
    if (branch?.status === 'DERIVED') return { card: 'warning heuristic-data', badge: 'heuristic', label: 'DERIVED' };
    if (branch?.status === 'SIMULATED') return { card: 'warning heuristic-data', badge: 'heuristic', label: 'SIMULATED' };
    if (branch?.status === 'WARNING') return { card: 'status-pending', badge: 'heuristic', label: 'WARNING' };
    return { card: 'status-pending', badge: 'heuristic', label: 'PENDING' };
  }

  function formatValue(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n.toFixed(3) : '0.000';
  }

  function renderFactorLine(meta = {}) {
    const numericValue = Number(meta.value);
    const zeroClass = numericValue === 0 ? ' metric-zero' : '';
    const label = numericValue === 0 ? 'WARNING' : ((meta.status === 'SUCCESS' || meta.status === 'REAL') ? 'REAL' : 'DERIVED');
    const statusClass = label === 'WARNING' ? ' factor-status' : ' factor-status visually-hidden';
    const glossary = FACTOR_GLOSSARY[meta.name || ''] || 'Model-derived factor context';
    return `<div class="factor-line"><span class="factor-name">${escapeHtml(meta.name || '')}:</span> <span class="factor-value${zeroClass}">${escapeHtml(formatValue(meta.value))}</span> <span class="mini-muted">(${escapeHtml(glossary)})</span><span class="${statusClass.trim()}">${escapeHtml(label === 'WARNING' ? ' WARNING' : '')}</span></div>`;
  }

  function renderMarketProviders(providerMap = {}) {
    const providerLine = [
      ['DK', providerMap.DraftKings || 0],
      ['FD', providerMap.FanDuel || 0],
      ['MGM', providerMap.BetMGM || 0],
      ['365', providerMap.Bet365 || 0],
      ['PIN', providerMap.Pinnacle || 0]
    ].map(([label, value]) => {
      const numericValue = Number(value);
      const zeroClass = numericValue === 0 ? ' class="metric-zero"' : '';
      return `${label}: <span${zeroClass}>${escapeHtml(formatValue(value))}</span>`;
    }).join(' | ');
    return `<div class="market-providers"><div>${providerLine}</div></div>`;
  }

  function renderPlayerMiningCard(row = {}, vault = {}) {
    const branches = vault?.branches || {};
    const matchupLine = `${row.opponent || ''}${row.gameTimeText ? ` - ${row.gameTimeText}` : ''}`.trim();
    const propLine = `${row.prop || ''} ${row.line || ''} ${row.direction || ''}`.trim();
    return `<article class="player-mining-card"><div class="player-header-line"><strong>${escapeHtml(row.parsedPlayer || '')} - ${escapeHtml(row.team || '')}</strong></div><div class="player-header-line"><strong>${escapeHtml(matchupLine)}</strong></div><div class="player-header-line"><strong>${escapeHtml(propLine)}</strong></div>${BRANCH_KEYS.map((branchKey) => {
      const branch = branches[branchKey] || { factorMeta: {}, providerMap: {}, status: 'PENDING' };
      const tone = branchTone(branch);
      const warningClass = branch?.status === 'WARNING' ? ' warning' : '';
      if (branchKey === 'E') {
        return `<section class="branch-block ${tone.card}${warningClass}">${renderMarketProviders(branch.providerMap || {})}</section>`;
      }
      const factorMeta = Object.entries(branch.factorMeta || {}).map(([key, meta], idx) => Object.assign({}, meta, { name: resolveFactorName(row, branchKey, idx + 1, meta), key: key || factorKey(branchKey, idx + 1) }));
      return `<section class="branch-block ${tone.card}${warningClass}">${factorMeta.map(renderFactorLine).join('')}</section>`;
    }).join('')}</article>`;
  }

  function renderMiningGrid(rows = [], vaultCollection = {}) {
    const mount = el('miningGrid');
    if (!mount) return;
    const safeRows = asArray(rows);
    const safeVaults = vaultCollection && typeof vaultCollection === 'object' ? vaultCollection : {};
    const hasVaultData = Object.keys(safeVaults).length > 0;
    const cards = safeRows.map((row) => renderPlayerMiningCard(row, safeVaults?.[row.LEG_ID] || {})).join('');
    const emptyState = hasVaultData ? '<div class="mini-muted">Awaiting rows.</div>' : '<div class="mini-muted">WAITING_FOR_BRIDGE</div>';
    mount.innerHTML = `<div class="status-panel"><div class="status-panel-head"><div><strong>Mining Matrix</strong></div><div class="pill">Rows Loaded: ${safeRows.length}</div></div><div class="dense-player-grid">${cards || emptyState}</div></div>`;
  }

  function renderConsole(logs) {
    const mount = el('systemConsole');
    if (!mount) return;
    const items = asArray(logs);
    if (!items.length) return;
    mount.innerHTML = items.map((entry) => {
      const stamp = entry?.timestamp || new Date().toLocaleTimeString();
      const modelId = entry?.modelId || MODEL_ID;
      const message = entry?.text || entry?.message || String(entry);
      return `<div class="console-line">${escapeHtml(`[${stamp}] [${modelId}] ${message}`)}</div>`;
    }).join('');
  }

  let heartbeatTimer = null;

  function appendConsole(log) {
    const mount = el('systemConsole');
    if (!mount) return;
    const timestamp = new Date().toLocaleTimeString();
    const modelId = log?.modelId || MODEL_ID;
    const message = String(log?.text || log?.message || log || '').replace(/\n/g, '<br>');
    mount.innerHTML += `<div class="console-line">${escapeHtml(`[${timestamp}] [${modelId}] `)}${message}</div>`;
    mount.scrollTop = mount.scrollHeight;
  }

  function startHeartbeat() {
    if (heartbeatTimer) return;
    appendConsole({ level: 'info', text: '[SYSTEM] HEARTBEAT armed.' });
    heartbeatTimer = window.setInterval(() => {
      appendConsole({ level: 'info', text: '[SYSTEM] HEARTBEAT' });
    }, 5000);
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      window.clearInterval(heartbeatTimer);
      heartbeatTimer = null;
      appendConsole({ level: 'info', text: '[SYSTEM] HEARTBEAT stopped.' });
    }
  }

  function summarizeShield(vaultCollection = {}) {
    let real = 0, derived = 0, simulated = 0, warnings = 0, total = 0, nonZero = 0;
    Object.values(vaultCollection || {}).forEach((vault) => {
      Object.values(vault?.branches || {}).forEach((branch) => {
        real += Number(branch.realCount || 0);
        derived += Number(branch.derivedCount || 0);
        simulated += Number(branch.simulatedCount || 0);
        warnings += Object.values(branch.parsed || {}).filter((value) => Number(value) === 0).length;
        total += Number(branch.factorsTarget || 0);
        nonZero += Object.values(branch.parsed || {}).filter((value) => Number(value) !== 0).length;
      });
    });
    const integrityScore = total ? ((nonZero / total) * 100).toFixed(2) : '0.00';
    const purityUnits = Object.values(vaultCollection || {}).reduce((sum, vault) => sum + Object.values(vault?.branches || {}).filter((b) => b.status !== 'WARNING').length, 0);
    const purityScore = Object.keys(vaultCollection || {}).length ? ((purityUnits / (Object.keys(vaultCollection || {}).length * BRANCH_KEYS.length)) * 100).toFixed(2) : '0.00';
    const confidenceAvg = total ? (((real + derived + (simulated * 0.2)) / total) * 100).toFixed(2) : '0.00';
    return { integrityScore, purityScore, confidenceAvg, real, derived, simulated, warnings, total };
  }

  function renderAnalysisShell(result = {}, rows = [], version = SYSTEM_VERSION) {
    if (el('analysisTitle')) el('analysisTitle').textContent = `Run Analysis ${version}`;
    if (el('analysisVersion')) el('analysisVersion').textContent = `Version: ${version}`;
    if (el('shieldTitle')) el('shieldTitle').textContent = `Alpha Shield ${version}`;

    const row = result?.row || rows[0] || {};
    const vaultCollection = result?.vaultCollection || (row?.LEG_ID && result?.vault ? { [row.LEG_ID]: result.vault } : {});
    const shield = summarizeShield(vaultCollection);
    const summary = el('analysisSummary');
    if (summary) summary.innerHTML = [`<div class="pill">Rows: ${rows.length}</div>`,`<div class="pill">Integrity: ${escapeHtml(shield.integrityScore)}</div>`,`<div class="pill">Purity: ${escapeHtml(shield.purityScore)}</div>`,`<div class="pill">Confidence: ${escapeHtml(shield.confidenceAvg)}</div>`,`<div class="pill">REAL: ${escapeHtml(shield.real)}</div>`,`<div class="pill">SIMULATED: ${escapeHtml(shield.simulated)}</div>`].join('');
    const hint = el('analysisHint');
    if (hint) hint.textContent = result?.analysisHint || 'OXYGEN-COBALT recovery active.';
    const rowCard = el('analysisRowCard');
    if (rowCard) rowCard.innerHTML = `<div class="status-panel"><div><strong>${escapeHtml(row.parsedPlayer || '')} - ${escapeHtml(row.team || '')}</strong></div><div class="mini-muted">${escapeHtml(row.opponent || '')} - ${escapeHtml(row.gameTimeText || '')}</div><div class="mini-muted">${escapeHtml(row.prop || '')} ${escapeHtml(row.line || '')} ${escapeHtml(row.direction || '')}</div><div class="mini-muted">LEG_ID: ${escapeHtml(row.LEG_ID || '')}</div></div>`;
    const kpis = el('analysisKpis');
    if (kpis) kpis.innerHTML = [`<div class="pill">A: 20</div>`,`<div class="pill">B: 18</div>`,`<div class="pill">C: 12</div>`,`<div class="pill">D: 10</div>`,`<div class="pill">E: 12</div>`,`<div class="pill">Target: ${BRANCH_TOTAL}</div>`].join('');
    renderMiningGrid(rows, vaultCollection);
    const shieldPanel = el('shieldPanel');
    if (shieldPanel) shieldPanel.innerHTML = [`<div class="status-panel"><strong>Integrity Score</strong><div>${escapeHtml(shield.integrityScore)}</div></div>`,`<div class="status-panel"><strong>Purity Score</strong><div>${escapeHtml(shield.purityScore)}</div></div>`,`<div class="status-panel"><strong>Confidence Avg</strong><div>${escapeHtml(shield.confidenceAvg)}</div></div>`,`<div class="status-panel"><strong>REAL / DERIVED / SIMULATED / WARNING</strong><div>${escapeHtml(shield.real)} / ${escapeHtml(shield.derived)} / ${escapeHtml(shield.simulated)} / ${escapeHtml(shield.warnings)}</div></div>`].join('');
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
        fill.innerHTML = `<div class="progress-inner"><span>📡 ${pct}% | ${escapeHtml(message || 'OXYGEN-COBALT recovery active.')}</span></div>`;
      }
      if (strong) strong.textContent = `${pct}%`;
      if (spans[0]) spans[0].textContent = `📡 ${message || 'OXYGEN-COBALT recovery active.'}`;
      if (spans[1]) spans[1].textContent = `${safeIndex}/${safeTotal} probes`;
    });
  }

  function initProgressBar(completedRows = 0, totalRows = 1, label = 'Initializing stream...') { updateProgressBar(completedRows, totalRows, label); }
  function renderAnalysisResults(rows, auditRows, result, version = SYSTEM_VERSION) { renderAnalysisShell(result, rows, version); }
  function renderStreamUpdate(rows, auditRows, result, version = SYSTEM_VERSION, meta = {}) {
    renderAnalysisShell(result, rows, version);
    updateProgressBar(meta.completedProbes || 0, meta.totalProbes || 1, result?.analysisHint || 'Streaming analysis active.');
    const responseText = result?.responseText || result?.errorText || '';
    console.log("RAW_MODEL_DATA:", responseText);
    if (result?.errorText) {
      appendConsole({ level: 'warning', text: `[SYSTEM] GOOGLE_REJECTION: ${result.errorText}`, pre: result.errorJson ? JSON.stringify(result.errorJson, null, 2) : (result.errorText || '') });
    }
    if (Number(result?.errorStatus) === 400 && result?.errorText) {
      appendConsole({ level: 'warning', text: `[SYSTEM] 400 GOOGLE_ERROR: ${result.errorText}`, pre: result.errorJson ? JSON.stringify(result.errorJson, null, 2) : (result.errorText || '') });
    }
  }

  function showAnalysisScreen() { const intake = el('intakeScreen'); const analysis = el('analysisScreen'); if (intake) { intake.classList.add('hidden'); intake.style.display = 'none'; } if (analysis) { analysis.classList.remove('hidden'); analysis.style.display = 'block'; } }
  function backToIntake() { const intake = el('intakeScreen'); const analysis = el('analysisScreen'); if (analysis) analysis.classList.add('hidden'); if (intake) { intake.classList.remove('hidden'); intake.style.display = 'block'; } }
  function showOverlay(title, body) { if (el('runOverlay')) el('runOverlay').classList.remove('hidden'); if (el('overlaySub')) el('overlaySub').textContent = title; if (el('overlayBody')) el('overlayBody').textContent = body; }
  function hideOverlay() { if (el('runOverlay')) el('runOverlay').classList.add('hidden'); }
  function bindResizeRedraw() { window.addEventListener('resize', () => {}); }
  function buildAnalysisCopyText(context = {}) {
    const rows = asArray(context.rows);
    const vaultCollection = (context.vault && typeof context.vault === 'object') ? context.vault : {};
    const rowIndex = Object.fromEntries(rows.map((row, idx) => [row.LEG_ID, { row, idx }]));
    const legIds = rows.length ? rows.map((row) => row.LEG_ID) : Object.keys(vaultCollection);

    const sections = legIds.map((legId, index) => {
      const row = rowIndex[legId]?.row || {};
      const vault = vaultCollection[legId] || {};
      const branchKeys = ['A', 'B', 'C', 'D', 'E'];
      const summary = branchKeys.map((k) => {
        const active = Object.values(vault.branches?.[k]?.parsed || {}).filter((val) => Number(val) !== 0).length;
        return `${k}:${active}`;
      }).join('|');
      const matrixLines = branchKeys.map((k) => {
        if (k === 'E') {
          const providers = [['DK', vault.branches?.E?.providerMap?.DraftKings, 'DraftKings market-implied projection point'], ['FD', vault.branches?.E?.providerMap?.FanDuel, 'FanDuel market-implied projection point'], ['MGM', vault.branches?.E?.providerMap?.BetMGM, 'BetMGM market-implied projection point'], ['365', vault.branches?.E?.providerMap?.Bet365, 'Bet365 market-implied projection point'], ['PIN', vault.branches?.E?.providerMap?.Pinnacle, 'Pinnacle market-implied projection point']].map(([label, value, glossary]) => `${label}=${formatValue(value)} (${glossary})`).join(', ');
          return `BRANCH E: ${providers}`;
        }
        const parsed = vault.branches?.[k]?.parsed || {};
        return `BRANCH ${k}: ` + Object.entries(parsed).map(([key, value], idx) => {
          const label = resolveFactorName(row, k, idx + 1, { name: key });
          const glossary = FACTOR_GLOSSARY[label] || 'Model-derived factor context';
          return `${label}=${formatValue(value)} (${glossary})`;
        }).join(', ');
      });

      return [
        `[PLAYER ${index + 1}] ${row.parsedPlayer || legId || 'UNKNOWN_PLAYER'}`,
        `LEG_ID: ${legId}`,
        `TEAM: ${row.team || ''} | OPP: ${row.opponent || ''} | PROP: ${row.prop || ''} | LINE: ${row.line || row.lineValue || ''}`,
        `SATURATION: ${summary}`,
        ...matrixLines,
        `PROJECTIONS: ${JSON.stringify(vault.branches?.E?.providerMap || {})}`
      ].join('\n');
    });

    return sections.join('\n\n');
  }



  Object.assign(window.PickCalcUI, { MLB_FEED_MATRIX, el, renderLeagueChecklist, renderRunSummary, renderFeedStatus, renderPoolTable, renderAnalysisShell, renderAnalysisResults, renderStreamUpdate, renderConsole, appendConsole, startHeartbeat, stopHeartbeat, showOverlay, hideOverlay, backToIntake, showAnalysisScreen, bindResizeRedraw, buildAnalysisCopyText, initProgressBar, updateProgressBar, renderMiningGrid });
  window.onerror = function(message, source, lineno, colno) { try { appendConsole({ level: 'warning', text: `[OXYGEN-COBALT] ${message} @ ${source || 'unknown'}:${lineno || 0}:${colno || 0}` }); } catch (_) {} return false; };
})();
