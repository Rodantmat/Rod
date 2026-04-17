
window.PickCalcParser = (() => {
  const SYSTEM_VERSION = 'v13.72.0 (OXYGEN-COBALT)';
  const PARSE_YEAR = 2026;
  const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const LEAGUES = [
    { id: 'MLB', label: 'MLB', sport: 'MLB', league: 'MLB', checked: true },
    { id: 'NHL', label: 'NHL', sport: 'NHL', league: 'NHL', checked: true }
  ];

  const NOISE_WORD_RX = /(demon|goblin|trending|popular|popularity|hot|boost|promo|specials?|insurance)\b/gi;
  const GLUED_NOISE_RX = /(Demon|Goblin|Trending|Popular|Popularity|Hot|Boost|Promo|Specials?|Insurance)\b/g;
  const BADGE_RX = /\b\d+(?:\.\d+)?K\b/gi;
  const DIRECTION_RX = /\b(more|less|higher|lower)\b/i;
  const TEAM_ROLE_RX = /\b([A-Z]{2,3})\s*-\s*(P|SP|RP|C|1B|2B|3B|SS|LF|CF|RF|OF|IF|DH|UTIL|LW|RW|D|G)\b/i;
  const NAME_RX = /^[A-Za-z'.-]+(?:\s+[A-Za-z'.-]+){1,2}$/;
  const STANDALONE_NUMBER_RX = /^\d+(?:\.\d+)?$/;
  const TIME_INLINE_RX = /\b(?:sun|mon|tue|wed|thu|fri|sat|today|tomorrow)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i;

  const MLB_PROP_ALIASES = {
    'TB': { label: 'Total Bases', key: 'totalBases', role: 'Batter' },
    'TOTAL BASES': { label: 'Total Bases', key: 'totalBases', role: 'Batter' },
    'KS': { label: 'Strikeouts', key: 'strikeOuts', role: 'Pitcher' },
    'K': { label: 'Strikeouts', key: 'strikeOuts', role: 'Pitcher' },
    'STRIKEOUTS': { label: 'Strikeouts', key: 'strikeOuts', role: 'Pitcher' },
    'PITCHER STRIKEOUTS': { label: 'Strikeouts', key: 'strikeOuts', role: 'Pitcher' },
    'PO': { label: 'Pitching Outs', key: 'inningsPitched', role: 'Pitcher' },
    'PITCHING OUTS': { label: 'Pitching Outs', key: 'inningsPitched', role: 'Pitcher' },
    'OUTS': { label: 'Pitching Outs', key: 'inningsPitched', role: 'Pitcher' },
    'HITS+RUNS+RBIS': { label: 'H+R+RBI', key: 'hitsRunsRbis', role: 'Batter' },
    'HITS+RUNS+RBI': { label: 'H+R+RBI', key: 'hitsRunsRbis', role: 'Batter' },
    'H+R+RBI': { label: 'H+R+RBI', key: 'hitsRunsRbis', role: 'Batter' },
    'H+R+RBIS': { label: 'H+R+RBI', key: 'hitsRunsRbis', role: 'Batter' },
    'HITS ALLOWED': { label: 'Hits Allowed', key: 'hitsAllowed', role: 'Pitcher' },
    'HITS': { label: 'Hits', key: 'hits', role: 'Batter' },
    'RUNS': { label: 'Runs', key: 'runs', role: 'Batter' },
    'RBIS': { label: 'RBIs', key: 'rbi', role: 'Batter' },
    'RBI': { label: 'RBIs', key: 'rbi', role: 'Batter' },
    'ER': { label: 'Earned Runs', key: 'earnedRuns', role: 'Pitcher' },
    'EARNED RUNS': { label: 'Earned Runs', key: 'earnedRuns', role: 'Pitcher' },
    'WALKS ALLOWED': { label: 'Walks Allowed', key: 'walksAllowed', role: 'Pitcher' },
    'WALKED ALLOWED': { label: 'Walks Allowed', key: 'walksAllowed', role: 'Pitcher' },
    'BB ALLOWED': { label: 'Walks Allowed', key: 'walksAllowed', role: 'Pitcher' }
  };

  const NHL_PROP_ALIASES = {
    'SOG': { label: 'Shots on Goal', key: 'shotsOnGoal', role: 'Skater' },
    'SHOTS ON GOAL': { label: 'Shots on Goal', key: 'shotsOnGoal', role: 'Skater' },
    'BLK': { label: 'Blocked Shots', key: 'blockedShots', role: 'Skater' },
    'BLOCKED SHOTS': { label: 'Blocked Shots', key: 'blockedShots', role: 'Skater' },
    'PTS': { label: 'Points', key: 'points', role: 'Skater' },
    'POINTS': { label: 'Points', key: 'points', role: 'Skater' },
    'AST': { label: 'Assists', key: 'assists', role: 'Skater' },
    'ASSISTS': { label: 'Assists', key: 'assists', role: 'Skater' },
    'GOALS': { label: 'Goals', key: 'goals', role: 'Skater' },
    'SAVES': { label: 'Saves', key: 'saves', role: 'Goalie' },
    'GA': { label: 'Goals Allowed', key: 'goalsAllowed', role: 'Goalie' },
    'GOALS ALLOWED': { label: 'Goals Allowed', key: 'goalsAllowed', role: 'Goalie' }
  };

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function stripAccents(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function normalizeName(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  function cleanWhitespace(value) {
    return String(value || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[|•]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function removeNoise(value) {
    return cleanWhitespace(
      stripAccents(String(value || ''))
        .replace(GLUED_NOISE_RX, ' ')
        .replace(NOISE_WORD_RX, ' ')
        .replace(BADGE_RX, ' ')
    );
  }

  function cleanPlayerName(value) {
    return cleanWhitespace(
      removeNoise(stripAccents(String(value || '')))
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b(more|less|higher|lower)\b/gi, ' ')
        .replace(/[^A-Za-z'.\-\s]/g, ' ')
    );
  }

  function normalizeDayScope(value) {
    const text = String(value || '').toLowerCase();
    if (text.includes('both') || (text.includes('today') && text.includes('tomorrow'))) return 'both';
    if (text.includes('tomorrow')) return 'tomorrow';
    return 'today';
  }

  function parseClockPieces(value) {
    const match = String(value || '').match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (!match) return null;
    let hour = Number(match[1]);
    const minute = Number(match[2] || '0');
    const ampm = match[3].toLowerCase();
    if (ampm === 'pm' && hour !== 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    return { hour, minute };
  }

  function nextDateForWeekday(now, targetDayIndex) {
    const candidate = new Date(now);
    candidate.setFullYear(PARSE_YEAR);
    candidate.setSeconds(0, 0);
    const delta = (targetDayIndex - candidate.getDay() + 7) % 7;
    candidate.setDate(candidate.getDate() + delta);
    return candidate;
  }

  function extractTimeContext(text, now = new Date()) {
    const source = cleanWhitespace(text);
    if (!source) {
      return { found: false, token: '', eventDate: null, isoLocal: '', parseYear: PARSE_YEAR, reason: 'No game time found.' };
    }

    let match = source.match(/\b(today|tomorrow)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
    if (match) {
      const date = new Date(now);
      date.setFullYear(PARSE_YEAR);
      date.setSeconds(0, 0);
      if (match[1].toLowerCase() === 'tomorrow') date.setDate(date.getDate() + 1);
      const clock = parseClockPieces(match[2]);
      if (clock) {
        date.setHours(clock.hour, clock.minute, 0, 0);
        return {
          found: true,
          token: cleanWhitespace(match[0]),
          eventDate: date,
          isoLocal: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:00`,
          parseYear: PARSE_YEAR
        };
      }
    }

    match = source.match(/\b(sun|mon|tue|wed|thu|fri|sat)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
    if (match) {
      const dayIndex = DAY_NAMES.indexOf(match[1].toLowerCase());
      const date = nextDateForWeekday(now, dayIndex);
      const clock = parseClockPieces(match[2]);
      if (clock) {
        date.setHours(clock.hour, clock.minute, 0, 0);
        return {
          found: true,
          token: cleanWhitespace(match[0]),
          eventDate: date,
          isoLocal: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:00`,
          parseYear: PARSE_YEAR
        };
      }
    }

    match = source.match(/\b(\d{1,2}[\/\-]\d{1,2})(?:[\/\-](\d{2,4}))?\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
    if (match) {
      const [month, day] = match[1].split(/[\/\-]/).map(Number);
      let year = match[2] ? Number(match[2]) : PARSE_YEAR;
      if (year < 100) year += 2000;
      const date = new Date(year, month - 1, day, 0, 0, 0, 0);
      const clock = parseClockPieces(match[3]);
      if (clock) {
        date.setHours(clock.hour, clock.minute, 0, 0);
        return {
          found: true,
          token: cleanWhitespace(match[0]),
          eventDate: date,
          isoLocal: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:00`,
          parseYear: PARSE_YEAR
        };
      }
    }

    match = source.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
    if (match) {
      const date = new Date(now);
      date.setFullYear(PARSE_YEAR);
      date.setSeconds(0, 0);
      const clock = parseClockPieces(match[1]);
      if (clock) {
        date.setHours(clock.hour, clock.minute, 0, 0);
        return {
          found: true,
          token: cleanWhitespace(match[0]),
          eventDate: date,
          isoLocal: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:00`,
          parseYear: PARSE_YEAR
        };
      }
    }

    return { found: false, token: '', eventDate: null, isoLocal: '', parseYear: PARSE_YEAR, reason: 'No game time found.' };
  }

  function evaluateTimeFilter(timeContext, scopeValue, now = new Date()) {
    const scope = normalizeDayScope(scopeValue);
    if (!timeContext?.found || !timeContext?.eventDate) {
      return { accepted: false, code: 'NO_TIME', detail: 'Rejected: no parsable game time.', minutesUntilStart: null, parseYear: PARSE_YEAR, scope };
    }

    const eventDate = timeContext.eventDate;
    const diffMs = eventDate.getTime() - now.getTime();
    const minutesUntilStart = Math.floor(diffMs / 60000);

    if (diffMs <= 0) {
      return { accepted: false, code: 'STARTED', detail: 'Rejected: game time already passed.', minutesUntilStart, parseYear: PARSE_YEAR, scope };
    }
    if ((now.getTime() + 20 * 60000) > eventDate.getTime()) {
      return { accepted: false, code: 'UNDER_20', detail: `Rejected: starts in ${minutesUntilStart} minute(s), below 20-minute gate.`, minutesUntilStart, parseYear: PARSE_YEAR, scope };
    }

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    today.setFullYear(PARSE_YEAR);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const eventDay = new Date(eventDate);
    eventDay.setHours(0, 0, 0, 0);

    const isToday = eventDay.getTime() === today.getTime();
    const isTomorrow = eventDay.getTime() === tomorrow.getTime();

    if (scope === 'today' && !isToday) {
      return { accepted: false, code: 'SCOPE_TODAY', detail: 'Rejected: event is outside Today scope.', minutesUntilStart, parseYear: PARSE_YEAR, scope };
    }
    if (scope === 'tomorrow' && !isTomorrow) {
      return { accepted: false, code: 'SCOPE_TOMORROW', detail: 'Rejected: event is outside Tomorrow scope.', minutesUntilStart, parseYear: PARSE_YEAR, scope };
    }
    if (scope === 'both' && !(isToday || isTomorrow)) {
      return { accepted: false, code: 'SCOPE_BOTH', detail: 'Rejected: event is outside Today/Tomorrow scope.', minutesUntilStart, parseYear: PARSE_YEAR, scope };
    }

    return { accepted: true, code: 'ACCEPTED', detail: `Accepted: ${minutesUntilStart} minute(s) until start.`, minutesUntilStart, parseYear: PARSE_YEAR, scope };
  }

  function normalizePropName(rawProp, sportHint = 'MLB') {
    const cleaned = cleanWhitespace(rawProp).replace(/[.]/g, '').toUpperCase();
    const dict = sportHint === 'NHL' ? NHL_PROP_ALIASES : MLB_PROP_ALIASES;
    return dict[cleaned] || null;
  }

  function inferSportHint(clusterLines) {
    const text = clusterLines.map(item => item.clean).join(' ').toUpperCase();
    if (/\b(SOG|BLK|SHOTS ON GOAL|BLOCKED SHOTS|SAVES|GOALS ALLOWED|GOALS|ASSISTS|PTS|POINTS)\b/.test(text)) return 'NHL';
    return 'MLB';
  }

  function isAnchorLine(line) {
    return STANDALONE_NUMBER_RX.test(cleanWhitespace(line));
  }

  function makeCluster(lines, anchorIndex) {
    const start = Math.max(0, anchorIndex - 6);
    const end = Math.min(lines.length - 1, anchorIndex + 2);
    return lines.slice(start, end + 1).map((raw, rel) => ({
      raw,
      clean: cleanWhitespace(raw),
      absIndex: start + rel
    }));
  }

  function findDirection(cluster, anchorIndex) {
    const lines = cluster
      .filter(item => item.absIndex > anchorIndex && item.absIndex <= anchorIndex + 2)
      .sort((a, b) => a.absIndex - b.absIndex);
    for (const item of lines) {
      const match = item.clean.match(DIRECTION_RX);
      if (match) return /less|lower/i.test(match[1]) ? 'Less' : 'More';
    }
    return 'More';
  }

  function findProp(cluster, anchorIndex, sportHint) {
    const candidates = cluster
      .filter(item => Math.abs(item.absIndex - anchorIndex) <= 2)
      .sort((a, b) => Math.abs(a.absIndex - anchorIndex) - Math.abs(b.absIndex - anchorIndex));
    for (const item of candidates) {
      const match = normalizePropName(item.clean, sportHint);
      if (match) return { ...match, sourceLine: item.clean, propIndex: item.absIndex };
    }
    return { label: '', key: '', role: sportHint === 'MLB' ? 'Batter' : 'Skater', sourceLine: '', propIndex: -1 };
  }

  function parseTeamRole(cluster) {
    for (const item of cluster) {
      const match = item.clean.match(TEAM_ROLE_RX);
      if (match) {
        return { team: match[1].toUpperCase(), position: match[2].toUpperCase(), absIndex: item.absIndex, token: item.clean };
      }
    }
    return { team: '', position: '', absIndex: -1, token: '' };
  }

  function parseMatchup(cluster, teamRole) {
    for (const item of cluster) {
      const upper = item.clean.toUpperCase();
      let match = upper.match(/@\s*([A-Z]{2,3})\b/);
      if (match) return { team: teamRole.team || '', opponent: match[1].toUpperCase(), indicator: '@', absIndex: item.absIndex, token: item.clean };
      match = upper.match(/\bVS\.?\s*([A-Z]{2,3})\b/);
      if (match) return { team: teamRole.team || '', opponent: match[1].toUpperCase(), indicator: 'vs', absIndex: item.absIndex, token: item.clean };
      match = upper.match(/\b([A-Z]{2,3})\s*(@|VS\.?)\s*([A-Z]{2,3})\b/);
      if (match) {
        const left = match[1].toUpperCase();
        const right = match[3].toUpperCase();
        const indicator = match[2].replace('.', '').toLowerCase();
        const team = teamRole.team || left;
        const opponent = team === left ? right : left;
        return { team, opponent, indicator, absIndex: item.absIndex, token: item.clean };
      }
    }
    return { team: teamRole.team || '', opponent: '', indicator: '', absIndex: -1, token: '' };
  }

  function isLikelyName(line) {
    const cleaned = cleanPlayerName(line);
    if (!cleaned || !NAME_RX.test(cleaned)) return false;
    if (normalizePropName(cleaned, 'MLB') || normalizePropName(cleaned, 'NHL')) return false;
    if (TEAM_ROLE_RX.test(line)) return false;
    if (DIRECTION_RX.test(line)) return false;
    if (TIME_INLINE_RX.test(line)) return false;
    if (/^\d+(?:\.\d+)?$/.test(cleaned)) return false;
    const words = cleaned.split(' ');
    return words.length >= 2 && words.length <= 3;
  }

  function findPlayer(cluster, teamRole, matchup, anchorIndex) {
    const pivot = matchup.absIndex >= 0 ? matchup.absIndex : (teamRole.absIndex >= 0 ? teamRole.absIndex : anchorIndex);
    const sorted = cluster.filter(item => item.absIndex < pivot).sort((a, b) => b.absIndex - a.absIndex);
    for (const item of sorted) {
      if (isLikelyName(item.clean)) return cleanPlayerName(item.clean);
    }
    const fallback = cluster.filter(item => item.absIndex < anchorIndex).sort((a, b) => b.absIndex - a.absIndex);
    for (const item of fallback) {
      if (isLikelyName(item.clean)) return cleanPlayerName(item.clean);
    }
    return '';
  }

  function detectType(cluster) {
    const raw = cluster.map(item => item.raw).join(' ');
    if (/demon/i.test(raw)) return '🔥 Demon';
    if (/goblin/i.test(raw)) return '👺 Goblin';
    return '⚪ Regular';
  }

  function clusterText(cluster) {
    return cluster.map(item => item.raw).join('\n');
  }

  function parseCluster(cluster, anchorIndex, dayScope, now) {
    const sportHint = inferSportHint(cluster);
    const teamRole = parseTeamRole(cluster);
    const matchup = parseMatchup(cluster, teamRole);
    const propInfo = findProp(cluster, anchorIndex, sportHint);
    const player = findPlayer(cluster, teamRole, matchup, anchorIndex);
    const direction = findDirection(cluster, anchorIndex);
    const timeSource = [matchup.token, ...cluster.map(item => item.clean)].join(' ');
    const timeContext = extractTimeContext(timeSource, now);
    const timeFilter = evaluateTimeFilter(timeContext, dayScope, now);
    const anchorLine = cleanWhitespace(cluster.find(item => item.absIndex === anchorIndex)?.clean || '');
    const rawText = clusterText(cluster);
    const cleanedRawText = cleanWhitespace(removeNoise(rawText));

    const audit = {
      idx: anchorIndex + 1,
      rawText,
      cleanedRawText,
      parsedPlayer: player || '',
      sport: sportHint,
      league: sportHint,
      prop: propInfo.label || '',
      propKey: propInfo.key || '',
      line: anchorLine || '',
      direction,
      team: matchup.team || teamRole.team || '',
      opponent: matchup.opponent || '',
      gameTimeText: timeContext.token || '',
      gameTimeISO: timeContext.isoLocal || '',
      accepted: false,
      rejectionReason: '',
      timeFilter,
      parseYear: PARSE_YEAR
    };

    if (!anchorLine) {
      audit.rejectionReason = 'No numeric anchor found.';
      return { audit, row: null };
    }
    if (!propInfo.label) {
      audit.rejectionReason = 'Numeric anchor found but prop alias was not resolved.';
      return { audit, row: null };
    }
    if (!player) {
      audit.rejectionReason = 'Player name could not be resolved from block cluster.';
      return { audit, row: null };
    }
    if (!timeFilter.accepted) {
      audit.rejectionReason = timeFilter.detail;
      return { audit, row: null };
    }

    audit.accepted = true;
    const row = {
      idx: anchorIndex + 1,
      rawText,
      cleanedRawText,
      parsedPlayer: player,
      player,
      sport: sportHint,
      league: sportHint,
      role: propInfo.role,
      prop: propInfo.label,
      propKey: propInfo.key,
      propFamily: propInfo.label,
      line: String(anchorLine),
      lineValue: Number(anchorLine),
      direction,
      team: matchup.team || teamRole.team || '',
      opponent: matchup.opponent || '',
      type: detectType(cluster),
      gameTimeText: timeContext.token || '',
      gameTimeISO: timeContext.isoLocal || '',
      accepted: true,
      timeFilter,
      parseYear: PARSE_YEAR,
      selectedDate: timeContext.isoLocal ? timeContext.isoLocal.slice(0, 10) : ''
    };
    return { audit, row };
  }

  function parseBoard(text, options = {}) {
    const now = options.now instanceof Date ? options.now : new Date();
    const dayScope = options.dayScope || 'Today';
    const lines = String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const anchors = lines.map((line, index) => ({ line, index })).filter(item => isAnchorLine(item.line));
    const rows = [];
    const audit = [];

    anchors.forEach(({ index }) => {
      const cluster = makeCluster(lines, index);
      const parsed = parseCluster(cluster, index, dayScope, now);
      audit.push(parsed.audit);
      if (parsed.row) rows.push(parsed.row);
    });

    return { version: SYSTEM_VERSION, parseYear: PARSE_YEAR, rows, audit };
  }

  return {
    SYSTEM_VERSION,
    PARSE_YEAR,
    LEAGUES,
    MLB_PROP_ALIASES,
    NHL_PROP_ALIASES,
    cleanWhitespace,
    cleanPlayerName,
    extractTimeContext,
    evaluateTimeFilter,
    normalizeDayScope,
    parseBoard,
    stripAccents,
    normalizeName
  };
})();
