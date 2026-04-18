window.PickCalcParser = (() => {
  const SYSTEM_VERSION = 'v13.77.15 (OXYGEN-COBALT)';
  const PARSE_YEAR = 2026;
  const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const LEAGUES = [
    { id: 'MLB', label: 'MLB', sport: 'MLB', league: 'MLB', checked: true },
    { id: 'NHL', label: 'NHL', sport: 'NHL', league: 'NHL', checked: true }
  ];

  const PICK_TYPE_RX = /\b(Goblin|Demon|Taco|Free Pick)\b/i;
  const NOISE_WORD_RX = /(trending|popular|popularity|hot|boost|promo|specials?|insurance)\b/gi;
  const GLUED_NOISE_RX = /(Trending|Popular|Popularity|Hot|Boost|Promo|Specials?|Insurance)\b/g;
  const BADGE_RX = /\b\d+(?:\.\d+)?K\b/gi;
  const DIRECTION_RX = /\b(more|less|higher|lower)\b/i;
  const TEAM_ROLE_RX = /\b([A-Z]{2,3})\s*-\s*(P|SP|RP|C|1B|2B|3B|SS|LF|CF|RF|OF|IF|DH|UTIL|LW|RW|D|G)\b/i;
  const NAME_RX = /^[A-Za-z'.-]+(?:\s+[A-Za-z'.-]+){1,2}$/;
  const STANDALONE_NUMBER_RX = /^\d+(?:\.\d+)?$/;
  const TIME_INLINE_RX = /\b(?:sun|mon|tue|wed|thu|fri|sat|today|tomorrow)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i;
  const TEAM_ABBR_RX = /\b(ARI|ATL|BAL|BOS|CHC|CIN|CLE|COL|CWS|DET|HOU|KC|LAA|LAD|MIA|MIL|MIN|NYM|NYY|OAK|PHI|PIT|SD|SEA|SF|STL|TB|TEX|TOR|WSH|BUF|CAR|CBJ|CGY|CHI|COL|DAL|EDM|FLA|LAK|MIN|MTL|NJD|NSH|NYI|NYR|OTT|PHI|PIT|SEA|SJS|STL|TBL|TOR|UTA|VAN|VGK|WPG)\b/gi;

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
    'HR': { label: 'Home Runs', key: 'homeRuns', role: 'Batter' },
    'HOME RUN': { label: 'Home Runs', key: 'homeRuns', role: 'Batter' },
    'HOME RUNS': { label: 'Home Runs', key: 'homeRuns', role: 'Batter' },
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

  function pad2(value) { return String(value).padStart(2, '0'); }

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
        .replace(PICK_TYPE_RX, ' ')
        .replace(/\b(more|less|higher|lower|free\s+pick)\b/gi, ' ')
        .replace(/\b(?:vs\.?|@)\s*[A-Z]{2,3}\b/gi, ' ')
        .replace(/\b[A-Z]{2,3}\s*-\s*(?:P|SP|RP|C|1B|2B|3B|SS|LF|CF|RF|OF|IF|DH|UTIL|LW|RW|D|G)\b/gi, ' ')
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
    if (!source) return { found: false, token: '', eventDate: null, isoLocal: '', parseYear: PARSE_YEAR, reason: 'No game time found.' };

    let match = source.match(/\b(today|tomorrow)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
    if (match) {
      const date = new Date(now);
      date.setFullYear(PARSE_YEAR);
      date.setSeconds(0, 0);
      if (match[1].toLowerCase() === 'tomorrow') date.setDate(date.getDate() + 1);
      const clock = parseClockPieces(match[2]);
      if (clock) {
        date.setHours(clock.hour, clock.minute, 0, 0);
        return { found: true, token: cleanWhitespace(match[0]), eventDate: date, isoLocal: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:00`, parseYear: PARSE_YEAR };
      }
    }

    match = source.match(/\b(sun|mon|tue|wed|thu|fri|sat)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
    if (match) {
      const dayIndex = DAY_NAMES.indexOf(match[1].toLowerCase());
      const date = nextDateForWeekday(now, dayIndex);
      const clock = parseClockPieces(match[2]);
      if (clock) {
        date.setHours(clock.hour, clock.minute, 0, 0);
        return { found: true, token: cleanWhitespace(match[0]), eventDate: date, isoLocal: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:00`, parseYear: PARSE_YEAR };
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
        return { found: true, token: cleanWhitespace(match[0]), eventDate: date, isoLocal: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:00`, parseYear: PARSE_YEAR };
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
        return { found: true, token: cleanWhitespace(match[0]), eventDate: date, isoLocal: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:00`, parseYear: PARSE_YEAR };
      }
    }

    return { found: false, token: '', eventDate: null, isoLocal: '', parseYear: PARSE_YEAR, reason: 'No game time found.' };
  }

  function evaluateTimeFilter(timeContext, scopeValue, now = new Date()) {
    const scope = normalizeDayScope(scopeValue);
    if (!timeContext?.found || !timeContext?.eventDate) return { accepted: false, code: 'NO_TIME', detail: 'Rejected: no parsable game time.', minutesUntilStart: null, parseYear: PARSE_YEAR, scope };

    const eventDate = timeContext.eventDate;
    const diffMs = eventDate.getTime() - now.getTime();
    const minutesUntilStart = Math.floor(diffMs / 60000);
    if (diffMs <= 0) return { accepted: false, code: 'STARTED', detail: 'Rejected: game time already passed.', minutesUntilStart, parseYear: PARSE_YEAR, scope };
    if ((now.getTime() + 20 * 60000) > eventDate.getTime()) return { accepted: false, code: 'UNDER_20', detail: `Rejected: starts in ${minutesUntilStart} minute(s), below 20-minute gate.`, minutesUntilStart, parseYear: PARSE_YEAR, scope };

    const today = new Date(now); today.setHours(0, 0, 0, 0); today.setFullYear(PARSE_YEAR);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const eventDay = new Date(eventDate); eventDay.setHours(0, 0, 0, 0);
    const isToday = eventDay.getTime() === today.getTime();
    const isTomorrow = eventDay.getTime() === tomorrow.getTime();

    if (scope === 'today' && !isToday) return { accepted: false, code: 'SCOPE_TODAY', detail: 'Rejected: event is outside Today scope.', minutesUntilStart, parseYear: PARSE_YEAR, scope };
    if (scope === 'tomorrow' && !isTomorrow) return { accepted: false, code: 'SCOPE_TOMORROW', detail: 'Rejected: event is outside Tomorrow scope.', minutesUntilStart, parseYear: PARSE_YEAR, scope };
    if (scope === 'both' && !(isToday || isTomorrow)) return { accepted: false, code: 'SCOPE_BOTH', detail: 'Rejected: event is outside Today/Tomorrow scope.', minutesUntilStart, parseYear: PARSE_YEAR, scope };
    return { accepted: true, code: 'ACCEPTED', detail: `Accepted: ${minutesUntilStart} minute(s) until start.`, minutesUntilStart, parseYear: PARSE_YEAR, scope };
  }

  function normalizePropName(rawProp, sportHint = 'MLB') {
    const cleaned = cleanWhitespace(rawProp).replace(/[.]/g, '').toUpperCase();
    const dict = sportHint === 'NHL' ? NHL_PROP_ALIASES : MLB_PROP_ALIASES;
    if (dict[cleaned]) return dict[cleaned];
    const padded = ` ${cleaned} `;
    const entries = Object.entries(dict).sort((a, b) => b[0].length - a[0].length);
    for (const [alias, meta] of entries) {
      if (padded.includes(` ${alias} `)) return meta;
    }
    return null;
  }

  function inferSportHint(clusterLines) {
    const text = clusterLines.map(item => item.clean).join(' ').toUpperCase();
    if (/\b(SOG|BLK|SHOTS ON GOAL|BLOCKED SHOTS|SAVES|GOALS ALLOWED|GOALS|ASSISTS|PTS|POINTS)\b/.test(text)) return 'NHL';
    return 'MLB';
  }

  function isAnchorLine(line) { return STANDALONE_NUMBER_RX.test(cleanWhitespace(line)); }

  function makeCluster(lines, anchorIndex) {
    const start = Math.max(0, anchorIndex - 6);
    const end = Math.min(lines.length - 1, anchorIndex + 4);
    return lines.slice(start, end + 1).map((raw, rel) => ({ raw, clean: cleanWhitespace(raw), absIndex: start + rel }));
  }

  function findDirection(cluster, anchorIndex = -1) {
    const sorted = cluster.slice().sort((a, b) => a.absIndex - b.absIndex);
    const lines = anchorIndex >= 0 ? sorted.filter(item => item.absIndex >= anchorIndex && item.absIndex <= anchorIndex + 2) : sorted;
    for (const item of lines) {
      const match = item.clean.match(DIRECTION_RX);
      if (match) return /less|lower/i.test(match[1]) ? 'Less' : 'More';
    }
    return 'More';
  }

  function findProp(cluster, anchorIndex, sportHint) {
    const sorted = cluster.slice().sort((a, b) => a.absIndex - b.absIndex);
    const candidates = anchorIndex >= 0
      ? sorted.filter(item => Math.abs(item.absIndex - anchorIndex) <= 2).sort((a, b) => Math.abs(a.absIndex - anchorIndex) - Math.abs(b.absIndex - anchorIndex))
      : sorted;
    for (const item of candidates) {
      const match = normalizePropName(item.clean, sportHint);
      if (match) return { ...match, sourceLine: item.clean, propIndex: item.absIndex };
    }
    const joined = sorted.map(item => item.clean).join(' ');
    const fallback = normalizePropName(joined, sportHint);
    if (fallback) return { ...fallback, sourceLine: joined, propIndex: anchorIndex };
    return { label: '', key: '', role: sportHint === 'MLB' ? 'Batter' : 'Skater', sourceLine: '', propIndex: -1 };
  }

  function parseTeamRole(cluster) {
    for (const item of cluster) {
      const match = item.clean.match(TEAM_ROLE_RX);
      if (match) return { team: match[1].toUpperCase(), position: match[2].toUpperCase(), absIndex: item.absIndex, token: item.clean };
    }
    const joined = cluster.map(item => item.clean).join(' ');
    const match = joined.match(TEAM_ROLE_RX);
    if (match) return { team: match[1].toUpperCase(), position: match[2].toUpperCase(), absIndex: cluster[0]?.absIndex ?? -1, token: cleanWhitespace(match[0]) };
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
    const joined = cluster.map(item => item.clean).join(' ').toUpperCase();
    const match = joined.match(/\b([A-Z]{2,3})\s*(@|VS\.?)\s*([A-Z]{2,3})\b/);
    if (match) {
      const left = match[1].toUpperCase();
      const right = match[3].toUpperCase();
      const indicator = match[2].replace('.', '').toLowerCase();
      const team = teamRole.team || left;
      const opponent = team === left ? right : left;
      return { team, opponent, indicator, absIndex: cluster[0]?.absIndex ?? -1, token: cleanWhitespace(match[0]) };
    }
    return { team: teamRole.team || '', opponent: '', indicator: '', absIndex: -1, token: '' };
  }

  function isLikelyName(line) {
    const cleaned = cleanPlayerName(line);
    if (!cleaned || !NAME_RX.test(cleaned)) return false;
    if (normalizePropName(cleaned, 'MLB') || normalizePropName(cleaned, 'NHL')) return false;
    if (TEAM_ROLE_RX.test(line) || DIRECTION_RX.test(line) || TIME_INLINE_RX.test(line)) return false;
    if (/^\d+(?:\.\d+)?$/.test(cleaned)) return false;
    const words = cleaned.split(' ');
    return words.length >= 2 && words.length <= 3;
  }

  function extractInlinePlayer(cluster) {
    const raw = cleanPlayerName(cluster.map(item => item.raw).join(' '))
      .replace(/^\d+(?:\.\d+)?\s+/, ' ')
      .replace(TEAM_ABBR_RX, ' ')
      .replace(/\b(?:P|SP|RP|C|1B|2B|3B|SS|LF|CF|RF|OF|IF|DH|UTIL|LW|RW|D|G)\b/gi, ' ')
      .replace(/\b(?:strikeouts?|ks?|pitching outs?|walks allowed|hits allowed|hits\+runs\+rbis|h\+r\+rbi|home runs?|hr|hits?|rbis?|rbi|runs|tb|total bases|sog|shots on goal|blocked shots|pts|points|assists|goals|saves|goals allowed)\b/gi, ' ')
      .replace(/\b(?:more|less|higher|lower|today|tomorrow|am|pm)\b/gi, ' ')
      .replace(/\b\d+(?:\.\d+)?\b/g, ' ');
    const match = raw.match(/\b([A-Z][a-z'.-]+\s+[A-Z][a-z'.-]+(?:\s+[A-Z][a-z'.-]+)?)\b/);
    return match ? cleanPlayerName(match[1]) : '';
  }

  function findPlayer(cluster, teamRole, matchup, anchorIndex) {
    const pivot = matchup.absIndex >= 0 ? matchup.absIndex : (teamRole.absIndex >= 0 ? teamRole.absIndex : anchorIndex);
    const sorted = cluster.filter(item => item.absIndex < pivot).sort((a, b) => b.absIndex - a.absIndex);
    for (const item of sorted) if (isLikelyName(item.clean)) return cleanPlayerName(item.clean);
    const fallback = cluster.filter(item => item.absIndex < anchorIndex).sort((a, b) => b.absIndex - a.absIndex);
    for (const item of fallback) if (isLikelyName(item.clean)) return cleanPlayerName(item.clean);
    return extractInlinePlayer(cluster);
  }

  function detectType(cluster) {
    const raw = cluster.map(item => item.raw).join(' ');
    if (/\b(Ks?|Pitching Outs|Walks Allowed)\b/i.test(raw)) return 'Pitcher';
    if (/\b(Hits?|Home Runs?|HR|RBIs?)\b/i.test(raw)) return 'Hitter';
    return 'Hitter';
  }

  function detectPickType(cluster) {
    const raw = cluster.map(item => item.raw).join(' ');
    const match = raw.match(PICK_TYPE_RX);
    if (!match) return 'Regular Line';
    const value = match[1].toLowerCase();
    if (value === 'free pick') return 'Free Pick';
    if (value === 'goblin') return 'Goblin';
    if (value === 'demon') return 'Demon';
    if (value === 'taco') return 'Taco';
    return 'Regular Line';
  }

  function clusterText(cluster) { return cluster.map(item => item.raw).join('\n'); }

  function extractLineValue(cluster, anchorIndex, propInfo = {}) {
    const sorted = cluster.slice().sort((a, b) => a.absIndex - b.absIndex);
    if (anchorIndex >= 0) {
      const anchorLine = cleanWhitespace(sorted.find(item => item.absIndex === anchorIndex)?.clean || '');
      const numeric = anchorLine.match(/\d+(?:\.\d+)?/);
      if (numeric) return numeric[0];
    }
    const joined = sorted.map(item => item.clean).join(' ');
    const propToken = propInfo?.label ? propInfo.label.replace(/[+]/g, '\\+') : '(?:Ks?|Pitching Outs|Walks Allowed|Hits Allowed|Hits?\\+Runs\\+RBIs|H\\+R\\+RBI|Home Runs?|HR|Hits?|RBIs?|RBI|Runs|TB|Total Bases|SOG|Shots on Goal|Blocked Shots|PTS|Points|Assists|Goals|Saves|Goals Allowed)';
    const nearPropRx = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:${propToken})\\b`, 'ig');
    let candidate = '';
    for (const match of joined.matchAll(nearPropRx)) candidate = match[1];
    if (candidate) return candidate;
    const nearDirectionRx = /\b(\d+(?:\.\d+)?)\b(?=[^\n]*\b(?:more|less|higher|lower)\b)/ig;
    for (const match of joined.matchAll(nearDirectionRx)) candidate = match[1];
    if (candidate) return candidate;
    const standalone = joined.match(/\b(\d+(?:\.\d+)?)\b/);
    return standalone ? standalone[1] : '';
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
    const normalizedAnchorLine = extractLineValue(cluster, anchorIndex, propInfo) || '0.5';
    const rawText = clusterText(cluster);
    const cleanedRawText = cleanWhitespace(removeNoise(rawText));
    const pickType = detectPickType(cluster);
    const profileType = detectType(cluster);

    const audit = {
      idx: (anchorIndex >= 0 ? anchorIndex : (cluster[0]?.absIndex ?? 0)) + 1,
      rawText,
      cleanedRawText,
      parsedPlayer: player || '',
      sport: sportHint,
      league: sportHint,
      prop: propInfo.label || '',
      propKey: propInfo.key || '',
      line: normalizedAnchorLine || '0.5',
      direction,
      team: matchup.team || teamRole.team || '',
      opponent: matchup.opponent || '',
      gameTimeText: timeContext.token || '',
      gameTimeISO: timeContext.isoLocal || '',
      pickType,
      type: profileType,
      accepted: false,
      rejectionReason: '',
      timeFilter,
      parseYear: PARSE_YEAR
    };

    if (!normalizedAnchorLine || isNaN(parseFloat(normalizedAnchorLine))) {
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
    if (timeContext?.found && !timeFilter.accepted) {
      audit.rejectionReason = timeFilter.detail;
      return { audit, row: null };
    }

    audit.accepted = true;
    const row = {
      idx: audit.idx,
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
      line: String(normalizedAnchorLine || '0.5'),
      lineValue: isNaN(parseFloat(normalizedAnchorLine)) ? 0.5 : parseFloat(normalizedAnchorLine),
      direction,
      team: matchup.team || teamRole.team || '',
      opponent: matchup.opponent || '',
      type: profileType,
      pickType,
      gameTimeText: timeContext.token || '',
      gameTimeISO: timeContext.isoLocal || '',
      accepted: true,
      timeFilter,
      parseYear: PARSE_YEAR,
      selectedDate: timeContext.isoLocal ? timeContext.isoLocal.slice(0, 10) : ''
    };
    return { audit, row };
  }

  function buildFuzzyClusters(lines = []) {
    const clusters = [];
    const seen = new Set();
    const decorated = lines.map((raw, index) => ({ raw, clean: cleanWhitespace(raw), absIndex: index }));

    const pushCluster = (items, anchorIndex = -1) => {
      const sorted = items.slice().sort((a, b) => a.absIndex - b.absIndex);
      const key = `${anchorIndex}|${sorted.map(item => item.absIndex).join(',')}`;
      if (!seen.has(key) && sorted.length) {
        seen.add(key);
        clusters.push({ cluster: sorted, anchorIndex });
      }
    };

    decorated.forEach((item, index) => {
      if (isAnchorLine(item.clean)) pushCluster(makeCluster(lines, index), index);
      pushCluster([item], -1);
      for (let size = 2; size <= 8 && index + size <= decorated.length; size += 1) {
        const windowItems = decorated.slice(index, index + size);
        const joined = windowItems.map(entry => entry.clean).join(' ');
        const hasTeam = TEAM_ROLE_RX.test(joined) || /\b(?:vs\.?|@)\s*[A-Z]{2,3}\b/i.test(joined);
        const hasNumeric = /\b\d+(?:\.\d+)?\b/.test(joined);
        const hasSignal = DIRECTION_RX.test(joined) || Boolean(normalizePropName(joined, inferSportHint(windowItems))) || PICK_TYPE_RX.test(joined);
        if (hasTeam && hasNumeric && hasSignal) pushCluster(windowItems, windowItems.find(entry => isAnchorLine(entry.clean))?.absIndex ?? -1);
      }
    });

    return clusters;
  }

  function parseBoard(text, options = {}) {
    const now = options.now instanceof Date ? options.now : new Date();
    const dayScope = options.dayScope || 'Today';
    const lines = String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const candidates = buildFuzzyClusters(lines);
    const rows = [];
    const audit = [];
    const rowMap = new Map();

    candidates.forEach(({ cluster, anchorIndex }) => {
      const parsed = parseCluster(cluster, anchorIndex, dayScope, now);
      audit.push(parsed.audit);
      if (parsed.row) {
        const key = [normalizeName(parsed.row.parsedPlayer), parsed.row.team || '', parsed.row.opponent || '', parsed.row.prop || '', parsed.row.line || '', parsed.row.direction || ''].join('|');
        const existing = rowMap.get(key);
        const isBetter = !existing
          || (existing.pickType === 'Regular Line' && parsed.row.pickType !== 'Regular Line')
          || (!existing.gameTimeText && parsed.row.gameTimeText)
          || ((parsed.row.rawText || '').length > (existing.rawText || '').length);
        if (isBetter) rowMap.set(key, parsed.row);
      }
    });

    rows.push(...rowMap.values());
    rows.sort((a, b) => a.idx - b.idx);
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
