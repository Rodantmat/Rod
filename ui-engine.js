window.PickCalcUI = window.PickCalcUI || {};
(() => {
  const SYSTEM_VERSION = 'v13.77.29 (OXYGEN-PROTON-BADGER)';
  const BRANCH_TOTAL = 72;
  const BRANCH_KEYS = ['A', 'B', 'C', 'D', 'E'];
  const BRANCH_TARGETS = { A: 20, B: 18, C: 12, D: 10, E: 12 };
  const PROVIDERS = ['DraftKings', 'FanDuel', 'BetMGM', 'Bet365', 'Pinnacle'];
  const MODEL_ID = 'gemini-2.5-pro';
  const MLB_FEED_MATRIX = ['Pitcher Strikeouts','Pitching Outs','Pitcher Fantasy Score','Walks Allowed','Hits Allowed','Earned Runs Allowed','Hitter Fantasy Score','Hits+Runs+RBIs','Total Bases','Hits','Runs','RBIs','Home Runs','Singles','Doubles','Triples','Walks','Stolen Bases','Hitter Strikeouts'];

  const PROFILE_FACTOR_NAMES = {
    Pitcher: {
      A: ["Velocity Stability", "Spin Rate Delta", "Extension", "Vertical Break", "Horizontal Movement", "Command Grade", "Location Heat", "Tunneling Quality", "Release Consistency", "Zone Rate", "K-BB% Trend", "Whiff Rate (Fastball)", "Whiff Rate (Offspeed)", "First Pitch Strike%", "Put-away % Efficiency", "Hard Hit Avoidance", "Barrel Rate Allowed", "GB/FB Ratio", "Average Exit Velocity", "Soft Contact%"],
      B: ["Stamina Decay", "Late Movement", "Release Extension", "Strike-One Rate", "Pressure Tolerance", "High-Leverage Efficiency", "Primary Pitch Reliability", "Secondary Pitch Bite", "Sequencing Logic", "Pitch Mix Stability", "Velocity Preservation", "Third-Time-Through Penalty", "Contact Suppression", "CSW Rate", "Called Strike Edge", "Chase Induction", "Backdoor Command", "Finisher Quality"],
      C: ["Park Factor", "Umpire Bias", "Wind Impact", "Historical Matchup", "L/R Splits", "Recent 5-Game Trend", "Air Density", "Umpire Zone", "Defense Support", "Bullpen Buffer", "Game Script Fit", "Weather Volatility"],
      D: ["Platoon Delta", "Manager Threshold", "Lineup Depth", "Run Support Expectation", "Inning Efficiency", "Pitch Count Elasticity", "Strike Zone Fit", "Batted-Ball Luck", "Recovery Window", "Clutch Stability"],
      E: ["DK Projection", "FD Projection", "MGM Projection", "365 Projection", "PIN Projection", "Consensus Mean", "Consensus Median", "Consensus High", "Consensus Low", "Spread", "Line Delta", "Market Confidence"]
    },
    Hitter: {
      A: ["Bat Speed", "Squared Up", "Blasts", "Sweet Spot", "LA Consistency", "Max Exit Velocity", "Pull/Opposite Mix", "Two-Strike Approach", "Chase Rate", "In-Zone Contact", "Pitch Recognition", "Barrel Accuracy", "Pull Power", "Oppo Gap Efficiency", "High-Fastball Combat", "Offspeed Timing", "Clout Grade", "Sprint Speed Impact", "ISO Trend", "Plate Coverage"],
      B: ["Contact Authority", "Damage on Mistakes", "Breaking Ball Handling", "Fastball Lift", "Spray Discipline", "RISP Approach", "Walk Pressure", "Strikeout Resistance", "First-Pitch Attack", "Pull Airball Rate", "Center-Field Carry", "Opposite-Field Carry", "Lefty Split Stability", "Righty Split Stability", "Batted-Ball Efficiency", "Basepath Leverage", "Lineup Spot Edge", "Clutch Contact"],
      C: ["Park Factor", "Umpire Bias", "Wind Impact", "Historical Matchup", "L/R Splits", "Recent 5-Game Trend", "Air Density", "Umpire Zone", "Bullpen Exposure", "Weather Volatility", "Lineup Protection", "Game Script Fit"],
      D: ["Platoon Delta", "Manager Threshold", "Hit Probability Drift", "Extra-Base Upside", "Contact Floor", "Power Spike Chance", "Pitcher Vulnerability", "Defensive Shift Cost", "Batted-Ball Luck", "Late-Game Leverage"],
      E: ["DK Projection", "FD Projection", "MGM Projection", "365 Projection", "PIN Projection", "Consensus Mean", "Consensus Median", "Consensus High", "Consensus Low", "Spread", "Line Delta", "Market Confidence"]
    }
  };

  const FACTOR_GLOSSARY = {
    "Bat Speed": "Raw barrel speed at contact",
    "Squared Up": "Quality of centered contact",
    "Blasts": "High-speed flush contact rate",
    "Sweet Spot": "Ideal launch band frequency",
    "LA Consistency": "Stable launch-angle repeatability",
    "Velocity Stability": "Consistency of pitch speed",
    "Spin Rate Delta": "Movement shift from spin variance",
    "Extension": "Release-point distance toward plate",
    "Vertical Break": "Ride or drop movement",
    "Horizontal Movement": "Arm-side or glove-side run",
    "Air Density": "Atmospheric resistance on ball travel",
    "Umpire Zone": "Strike-call frequency and width",
    "Platoon Delta": "Handedness matchup edge magnitude",
    "Manager Threshold": "Pitch-count or pull tendency",
    "DK Projection": "DraftKings market projection value",
    "FD Projection": "FanDuel market projection value",
    "MGM Projection": "BetMGM market projection value",
    "365 Projection": "Bet365 market projection value",
    "PIN Projection": "Pinnacle market projection value",
    "Consensus Mean": "Average across market sources",
    "Consensus Median": "Middle market source number",
    "Consensus High": "Highest listed market number",
    "Consensus Low": "Lowest listed market number",
    "Spread": "High-minus-low market gap",
    "Line Delta": "Market average versus line",
    "Market Confidence": "Coverage rate across books",
    "Command Grade": "Overall command and intent",
    "Location Heat": "Command quality by location",
    "Tunneling Quality": "Pitch disguise from same lane",
    "Release Consistency": "Repeatable arm slot release",
    "Zone Rate": "Frequency of zone attacks",
    "K-BB% Trend": "Strikeout minus walk trend",
    "Whiff Rate (Fastball)": "Fastball swing-and-miss rate",
    "Whiff Rate (Offspeed)": "Offspeed swing-and-miss rate",
    "First Pitch Strike%": "Opening strike frequency rate",
    "Put-away % Efficiency": "Finishing hitters with two strikes",
    "Hard Hit Avoidance": "Limit on dangerous contact",
    "Barrel Rate Allowed": "Barrels allowed per contact",
    "GB/FB Ratio": "Groundball versus flyball mix",
    "Average Exit Velocity": "Average exit speed allowed",
    "Soft Contact%": "Frequency of weak contact",
    "Stamina Decay": "Late-game fatigue dropoff rate",
    "Late Movement": "Action retained deep outing",
    "Release Extension": "Forward release distance consistency",
    "Strike-One Rate": "Rate of first-strike counts",
    "Pressure Tolerance": "Performance under leverage spots",
    "High-Leverage Efficiency": "Execution in key moments",
    "Primary Pitch Reliability": "Dependability of main pitch",
    "Secondary Pitch Bite": "Sharpness of secondary movement",
    "Sequencing Logic": "Pitch order effectiveness pattern",
    "Pitch Mix Stability": "Consistency of pitch selection",
    "Velocity Preservation": "Holding velocity over innings",
    "Third-Time-Through Penalty": "Dropoff facing lineup again",
    "Contact Suppression": "Ability to mute contact",
    "CSW Rate": "Called plus swinging strikes",
    "Called Strike Edge": "Extra called strikes generated",
    "Chase Induction": "Ability to draw chases",
    "Backdoor Command": "Steal edges with location",
    "Finisher Quality": "Ability to close at-bats",
    "Max Exit Velocity": "Peak batted-ball speed ceiling",
    "Pull/Opposite Mix": "Direction balance on contact",
    "Two-Strike Approach": "Survival quality with two strikes",
    "Chase Rate": "Out-of-zone swing tendency",
    "In-Zone Contact": "Contact rate on strikes",
    "Pitch Recognition": "Reading shape and speed",
    "Barrel Accuracy": "Precision of hard launch",
    "Pull Power": "Damage when pulling airballs",
    "Oppo Gap Efficiency": "Drive quality to opposite field",
    "High-Fastball Combat": "Handling elevated velocity well",
    "Offspeed Timing": "Timing against soft stuff",
    "Clout Grade": "Overall power impact level",
    "Sprint Speed Impact": "Run-speed effect on outcomes",
    "ISO Trend": "Isolated power recent trend",
    "Plate Coverage": "Reach across strike zone",
    "Contact Authority": "Strength behind fair contact",
    "Damage on Mistakes": "Punishing mistakes in zone",
    "Breaking Ball Handling": "Ability versus spin pitches",
    "Fastball Lift": "Air damage on heaters",
    "Spray Discipline": "Intentional contact direction control",
    "RISP Approach": "Approach with runners aboard",
    "Walk Pressure": "Plate patience forcing mistakes",
    "Strikeout Resistance": "Ability to avoid strikeouts",
    "First-Pitch Attack": "Aggression on opener pitches",
    "Pull Airball Rate": "Pulled flyball frequency",
    "Center-Field Carry": "Carry through middle lanes",
    "Opposite-Field Carry": "Carry to opposite field",
    "Lefty Split Stability": "Consistency versus left-handed pitching",
    "Righty Split Stability": "Consistency versus right-handed pitching",
    "Batted-Ball Efficiency": "Quality per ball in play",
    "Basepath Leverage": "Extra value from speed",
    "Lineup Spot Edge": "Order position run upside",
    "Clutch Contact": "Contact quality in key spots",
    "Park Factor": "Venue effect on production",
    "Umpire Bias": "General strike-zone lean",
    "Wind Impact": "Wind effect on outcome",
    "Historical Matchup": "Prior matchup performance signal",
    "L/R Splits": "Left-right split performance",
    "Recent 5-Game Trend": "Recent form over five games",
    "Defense Support": "Defense behind pitcher quality",
    "Bullpen Buffer": "Relief protection after exit",
    "Game Script Fit": "Expected flow of game",
    "Weather Volatility": "Weather instability risk factor",
    "Bullpen Exposure": "Relief matchup exposure later",
    "Lineup Protection": "Support around lineup slot",
    "Run Support Expectation": "Expected offense behind pitcher",
    "Inning Efficiency": "Pitches used per inning",
    "Pitch Count Elasticity": "Likely leash length tonight",
    "Strike Zone Fit": "Profile fit to umpire zone",
    "Batted-Ball Luck": "Results driven by variance",
    "Recovery Window": "Rest freshness before game",
    "Clutch Stability": "Execution consistency under pressure",
    "Lineup Depth": "Strength throughout batting order",
    "Hit Probability Drift": "Moving baseline for hits",
    "Extra-Base Upside": "Chance for extra-base damage",
    "Contact Floor": "Minimum contact expectation level",
    "Power Spike Chance": "Upside for power surge",
    "Pitcher Vulnerability": "Pitcher weakness exposure level",
    "Defensive Shift Cost": "Defensive alignment suppression cost",
    "Late-Game Leverage": "High-leverage late opportunity rate"
  };

  function el(id) { return document.getElementById(id); }
  function escapeHtml(value) { return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function asArray(value) { return Array.isArray(value) ? value : (value ? [value] : []); }

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

  function resolveFactorGlossary(name = '') {
    return FACTOR_GLOSSARY[name] || 'Short factor definition pending';
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
    let realUnits = 0;
    let derivedUnits = 0;
    Object.values(vaultCollection).forEach((vault) => {
      const vaultIsReal = vault?.isReal === true || String(vault?.source || '').toLowerCase() === 'real';
      Object.values(vault?.branches || {}).forEach((branch) => {
        const branchTotal = Number(branch?.factorsTarget || Object.keys(branch?.factorMeta || {}).length || 0);
        if (vaultIsReal) realUnits += branchTotal;
        else derivedUnits += Number(branch?.derivedCount || 0);
      });
    });
    mount.innerHTML = [
      `<div class="pill">Accepted: ${rows.length}</div>`,
      `<div class="pill">Rejected: ${(auditRows || []).filter((r) => !r.accepted).length}</div>`,
      `<div class="pill">REAL Units: ${realUnits}</div>`,
      `<div class="pill">DERIVED Units: ${derivedUnits}</div>`,
      `<div class="pill">Version: ${escapeHtml(SYSTEM_VERSION)}</div>`
    ].join('');
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


  function splitTeamRoleFromName(row = {}) {
    const raw = String(row?.parsedPlayer || row?.player || '').trim();
    let parsed = raw.replace(/([A-Z]{2,3})\s*-\s*(P|SP|RP|C|1B|2B|3B|SS|LF|CF|RF|OF|IF|DH|UTIL|LW|RW|D|G)/gi, ' ').trim();
    parsed = parsed.replace(/(Goblin|Demon|Taco|Free Pick)/gi, ' ').replace(/\s+/g, ' ').trim();
    if (/^[A-Z]{2,3}\s*-\s*(P|SP|RP|C|1B|2B|3B|SS|LF|CF|RF|OF|IF|DH|UTIL|LW|RW|D|G)$/i.test(raw)) parsed = '';
    const match = raw.match(/([A-Z]{2,3})\s*-\s*(P|SP|RP|C|1B|2B|3B|SS|LF|CF|RF|OF|IF|DH|UTIL|LW|RW|D|G)/i);
    return { playerName: parsed || String(row?.player || '').trim(), team: String(row?.team || match?.[1] || '').toUpperCase() };
  }

  function renderPickTypeBadge(pickType = '') {
    const normalized = String(pickType || '').trim();
    if (!normalized || normalized === 'Regular Line') return '';
    const className = normalized.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-+|-+$/g, '');
    return ` <span class="pick-badge ${escapeHtml(className)}">${escapeHtml(normalized)}</span>`;
  }

  function resolveCobaltScore(vault = {}, row = {}) {
    return window.PickCalcCore?.calcCobaltEdge?.(vault, row) || { score: 0 };
  }

  function resolveScoreEmoji(score = 0) {
    const n = Number(score) || 0;
    if (n >= 95) return '💎';
    if (n >= 90) return '🔥';
    if (n >= 80) return '⚡';
    if (n >= 70) return '📈';
    return '🧊';
  }

  function renderFactorLine(meta = {}) {
    const numericValue = Number(meta.value);
    const zeroClass = numericValue === 0 ? ' metric-zero' : '';
    const label = numericValue === 0 ? 'WARNING' : ((meta.status === 'SUCCESS' || meta.status === 'REAL') ? 'REAL' : 'DERIVED');
    const statusClass = label === 'WARNING' ? ' factor-status' : ' factor-status visually-hidden';
    const glossary = resolveFactorGlossary(meta.name || '');
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
    return `<div class="market-providers"><div><strong>Market Projections/Odds:</strong> ${providerLine}</div></div>`;
  }

  function renderPlayerMiningCard(row = {}, vault = {}) {
    const branches = vault?.branches || {};
    const normalized = splitTeamRoleFromName(row);
    const matchupLine = `${row.opponent || ''}${row.gameTimeText ? ` - ${row.gameTimeText}` : ''}`.trim();
    const propLine = `${row.prop || ''} ${row.line || ''} ${row.direction || ''}`.trim();
    const pickTypeMarkup = renderPickTypeBadge(row.pickType || '');
    const scoreMeta = resolveCobaltScore(vault, row);
    const score = Number(scoreMeta?.score || 0);
    const side = scoreMeta?.displaySide ? ` [${scoreMeta.displaySide}]` : '';
    const scoreEmoji = resolveScoreEmoji(score);
    const matrixMarkup = BRANCH_KEYS.map((branchKey) => {
      const branch = branches[branchKey] || { factorMeta: {}, providerMap: {}, status: 'PENDING' };
      const tone = branchTone(branch);
      const warningClass = branch?.status === 'WARNING' ? ' warning' : '';
      const factorMeta = Object.entries(branch.factorMeta || {}).map(([key, meta], idx) => Object.assign({}, meta, { name: resolveFactorName(row, branchKey, idx + 1, meta), key: key || factorKey(branchKey, idx + 1) }));
      const branchHeader = branchKey === 'E'
        ? '<div class="branch-title"><strong>Branch E</strong> <span class="card-type-tag market">MARKET</span></div>'
        : `<div class="branch-title"><strong>Branch ${escapeHtml(branchKey)}</strong> <span class="card-type-tag ${tone.badge}">${escapeHtml(tone.label)}</span></div>`;
      return `<details class="branch-block ${tone.card}${warningClass}"><summary class="branch-summary">${branchHeader}</summary><div class="branch-body">${factorMeta.map(renderFactorLine).join('')}${branchKey === 'E' ? renderMarketProviders(branch.providerMap || {}) : ''}</div></details>`;
    }).join('');
    return `<article class="player-mining-card"><div class="player-header-line"><strong>${escapeHtml(normalized.playerName || '')} - ${escapeHtml(normalized.team || row.team || '')}</strong></div><div class="player-header-line"><strong>Score: ${escapeHtml(String(score))}/100</strong>${pickTypeMarkup}<strong>${escapeHtml(side)} ${escapeHtml(scoreEmoji)}</strong></div><div class="player-header-line"><strong>${escapeHtml(matchupLine)}</strong></div><div class="player-header-line"><strong>${escapeHtml(propLine)}</strong></div><details class="matrix-collapsible"><summary class="collapsible-trigger"><span class="collapsible-arrow">▶</span><span class="collapsible-label">Mining Matrix</span></summary><div class="collapsible-content">${matrixMarkup}</div></details></article>`;
  }

  function renderMiningGrid(rows = [], vaultCollection = {}) {
    const mount = el('miningGrid');
    if (!mount) return;
    const safeRows = asArray(rows);
    const safeVaults = vaultCollection && typeof vaultCollection === 'object' ? vaultCollection : {};
    const hasVaultData = Object.keys(safeVaults).length > 0;
    const cards = safeRows.map((row) => renderPlayerMiningCard(row, safeVaults?.[row.LEG_ID] || {})).join('');
    const emptyState = hasVaultData ? '<div class="mini-muted">Awaiting rows.</div>' : '<div class="mini-muted">WAITING_FOR_BRIDGE</div>';
    mount.innerHTML = `<div class="status-panel"><div class="status-panel-head"><div><strong>Ingested Leg Pool</strong></div><div class="pill">Rows Loaded: ${safeRows.length}</div></div><div class="dense-player-grid">${cards || emptyState}</div></div>`;
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
      const vaultIsReal = vault?.isReal === true || String(vault?.source || '').toLowerCase() === 'real';
      Object.values(vault?.branches || {}).forEach((branch) => {
        const factorEntries = Object.values(branch?.factorMeta || {});
        const branchTotal = Number(branch.factorsTarget || factorEntries.length || 0);
        total += branchTotal;
        const branchNonZero = Object.values(branch.parsed || {}).filter((value) => Number(value) !== 0).length;
        nonZero += branchNonZero;
        warnings += Math.max(0, branchTotal - branchNonZero);
        if (vaultIsReal) {
          real += branchTotal;
        } else {
          real += Number(branch.realCount || 0);
          derived += Number(branch.derivedCount || 0);
          simulated += Number(branch.simulatedCount || 0);
        }
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
    if (rowCard) {
      const rowScoreMeta = resolveCobaltScore(vaultCollection?.[row.LEG_ID] || {}, row);
      const rowSide = rowScoreMeta?.displaySide ? ` [${rowScoreMeta.displaySide}]` : '';
      rowCard.innerHTML = `<div class="status-panel"><div><strong>${escapeHtml(splitTeamRoleFromName(row).playerName || '')} - ${escapeHtml(splitTeamRoleFromName(row).team || row.team || '')}</strong></div><div><strong>Score: ${escapeHtml(String(rowScoreMeta?.score || 0))}/100</strong>${renderPickTypeBadge(row.pickType || '')}<strong>${escapeHtml(rowSide)} ${escapeHtml(resolveScoreEmoji(rowScoreMeta?.score || 0))}</strong></div><div class="mini-muted">${escapeHtml(row.opponent || '')} - ${escapeHtml(row.gameTimeText || '')}</div><div class="mini-muted">${escapeHtml(row.prop || '')} ${escapeHtml(row.line || '')} ${escapeHtml(row.direction || '')}</div></div>`;
    }
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
        const parsed = vault.branches?.[k]?.parsed || {};
        const parsedLine = Object.entries(parsed).map(([key, value], idx) => {
          const factorName = resolveFactorName(row, k, idx + 1, { name: key });
          return `${factorName}=${formatValue(value)} (${resolveFactorGlossary(factorName)})`;
        }).join(', ');
        if (k !== 'E') return `BRANCH ${k}: ${parsedLine}`;
        const providerSummary = [
          `DK=${formatValue(vault.branches?.E?.providerMap?.DraftKings || 0)}`,
          `FD=${formatValue(vault.branches?.E?.providerMap?.FanDuel || 0)}`,
          `MGM=${formatValue(vault.branches?.E?.providerMap?.BetMGM || 0)}`,
          `365=${formatValue(vault.branches?.E?.providerMap?.Bet365 || 0)}`,
          `PIN=${formatValue(vault.branches?.E?.providerMap?.Pinnacle || 0)}`
        ].join(', ');
        return `BRANCH E: ${providerSummary} || ${parsedLine}`;
      });

      return [
        `[PLAYER ${index + 1}] ${row.parsedPlayer || legId || 'UNKNOWN_PLAYER'}`,
        `LEG_ID: ${legId}`,
        `TEAM: ${row.team || ''} | OPP: ${row.opponent || ''} | PROP: ${row.prop || ''} | LINE: ${row.line || row.lineValue || ''} | PICK: ${row.pickType || 'Regular Line'} | SCORE: ${(window.PickCalcCore?.calcCobaltEdge?.(vaultCollection[legId] || {}, row)?.score ?? 0)}/100 ${resolveScoreEmoji(window.PickCalcCore?.calcCobaltEdge?.(vaultCollection[legId] || {}, row)?.score ?? 0)}`,
        `SATURATION: ${summary}`,
        ...matrixLines,
        `PROJECTIONS: ${JSON.stringify(vault.branches?.E?.providerMap || {})}`
      ].join('\n');
    });

    return sections.join('\n\n');
  }



  Object.assign(window.PickCalcUI, { MLB_FEED_MATRIX, FACTOR_GLOSSARY, el, renderLeagueChecklist, renderRunSummary, renderFeedStatus, renderPoolTable, renderAnalysisShell, renderAnalysisResults, renderStreamUpdate, renderConsole, appendConsole, startHeartbeat, stopHeartbeat, showOverlay, hideOverlay, backToIntake, showAnalysisScreen, bindResizeRedraw, buildAnalysisCopyText, initProgressBar, updateProgressBar, renderMiningGrid, resolveFactorGlossary });
  window.onerror = function(message, source, lineno, colno) { try { appendConsole({ level: 'warning', text: `[OXYGEN-COBALT] ${message} @ ${source || 'unknown'}:${lineno || 0}:${colno || 0}` }); } catch (_) {} return false; };
})();
