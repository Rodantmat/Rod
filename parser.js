window.PickCalcParser = (() => {
  const SYSTEM_VERSION = 'v13.78.22 (OXYGEN-COBALT)';
  const PARSE_YEAR = 2026;
  const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const LEAGUES = [
    { id: 'MLB', label: 'MLB', sport: 'MLB', league: 'MLB', checked: true }
  ];

  const PICK_TYPE_RX = /\b(Goblin|Demon|Taco|Free Pick)\b/i;
  const TEAM_ROLE_RX = /\b([A-Z]{2,3})\s*[-—–]\s*(P|SP|RP|C|1B|2B|3B|SS|LF|CF|RF|OF|IF|DH|UTIL|LW|RW|D|G)\b/i;
  const DIRECTION_RX = /\b(more|less|higher|lower)\b/i;
  const MATCHUP_RX = /\b(vs\.?|@)\s*([A-Z]{2,3})\b/i;
  const NAME_CANDIDATE_RX = /\b([A-Z][a-z'.-]+(?:\s+[A-Z][a-z'.-]+){1,2})\b/g;
  const STANDALONE_NUMBER_RX = /^\d+(?:\.\d+)?$/;
  const BADGE_RX = /\b\d+(?:\.\d+)?K\b/gi;
  const POPULARITY_BADGE_RX = /^\d+(?:\.\d+)?K$/i;
  const COUNTDOWN_RX = /^\d{2}:\d{2}:\d{2}$/;
  const LIVE_STATUS_RX = /^(?:LIVE|1st|2nd|3rd|Inning|Period)$/i;
  const TIME_RX = /(?:\b(?:sun|mon|tue|wed|thu|fri|sat|today|tomorrow)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)\b|\b\d{1,3}m\s+\d{1,2}s\b|\b\d{1,3}m\b|\b\d{1,2}:\d{2}:\d{2}\b)/i;
  const INLINE_TIME_RX = TIME_RX;
  const GLUED_NOISE_RX = /(Demon|Goblin|Trending|Popular|Popularity|Hot|Boost|Promo|Specials?|Insurance)\b/gi;
  const NOISE_WORD_RX = /\b(trending|popular|popularity|hot|boost|promo|specials?|insurance)\b/gi;
  const ROLE_ONLY_RX = /^(?:P|SP|RP|C|1B|2B|3B|SS|LF|CF|RF|OF|IF|DH|UTIL|LW|RW|D|G)$/i;
  const TEAM_ABBR_LIST = ['ARI','ATL','BAL','BOS','CHC','CIN','CLE','COL','CWS','DET','HOU','KC','LAA','LAD','MIA','MIL','MIN','NYM','NYY','OAK','PHI','PIT','SD','SEA','SF','STL','TB','TEX','TOR','WSH','BUF','CAR','CBJ','CGY','CHI','COL','DAL','EDM','FLA','LAK','MIN','MTL','NJD','NSH','NYI','NYR','OTT','PHI','PIT','SEA','SJS','STL','TBL','TOR','UTA','VAN','VGK','WPG'];
  const TEAM_ABBR_RX = new RegExp(`\\b(?:${TEAM_ABBR_LIST.join('|')})\\b`, 'gi');
  const RESERVED_NAME_WORDS = new Set(['MORE','LESS','HIGHER','LOWER','HITS','RUNS','RBIS','RBI','TOTAL','BASES','TB','STRIKEOUTS','KS','PFS','HFS','PITCHER','HITTER','FANTASY','SCORE','WALKS','ALLOWED','EARNED','HOME','OUTS','PO','VS','AT']);

  const STAT_BOUND_ALIAS_RX = /\b(?:Pitcher Strikeouts|Strikeouts|Pitching Outs|Pitcher Fantasy Score|Pitcher FS|PFS|Walks Allowed|Hits Allowed|Earned Runs Allowed|Earned Runs|ER|Hitter Fantasy Score|Hitter FS|HFS|Hits\+Runs\+RBIs|Hits\+Runs\+RBI|H\+R\+R\+?BI?S?|HRR|Total Bases|TB|Hits|Runs|RBIs|RBI|Home Runs?|HR|Singles|Doubles|Triples|Walks|Stolen Bases|Hitter Strikeouts|Ks|K's|PO|Outs|BB|HA)\b/i;

  const MLB_PROP_ALIASES = {
    'PITCHER STRIKEOUTS': { label: 'Pitcher Strikeouts', key: 'strikeOuts', role: 'Pitcher' },
    'STRIKEOUTS': { label: 'Pitcher Strikeouts', key: 'strikeOuts', role: 'Pitcher' },
    'KS': { label: 'Pitcher Strikeouts', key: 'strikeOuts', role: 'Pitcher' },
    "K'S": { label: 'Pitcher Strikeouts', key: 'strikeOuts', role: 'Pitcher' },
    'K': { label: 'Pitcher Strikeouts', key: 'strikeOuts', role: 'Pitcher' },
    'PITCHING OUTS': { label: 'Pitching Outs', key: 'inningsPitched', role: 'Pitcher' },
    'PO': { label: 'Pitching Outs', key: 'inningsPitched', role: 'Pitcher' },
    'OUTS': { label: 'Pitching Outs', key: 'inningsPitched', role: 'Pitcher' },
    'PITCHER FANTASY SCORE': { label: 'Pitcher Fantasy Score', key: 'pitcherFantasyScore', role: 'Pitcher' },
    'PFS': { label: 'Pitcher Fantasy Score', key: 'pitcherFantasyScore', role: 'Pitcher' },
    'PITCHER FS': { label: 'Pitcher Fantasy Score', key: 'pitcherFantasyScore', role: 'Pitcher' },
    'WALKS ALLOWED': { label: 'Walks Allowed', key: 'walksAllowed', role: 'Pitcher' },
    'BB ALLOWED': { label: 'Walks Allowed', key: 'walksAllowed', role: 'Pitcher' },
    'BB': { label: 'Walks Allowed', key: 'walksAllowed', role: 'Pitcher' },
    'HITS ALLOWED': { label: 'Hits Allowed', key: 'hitsAllowed', role: 'Pitcher' },
    'HA': { label: 'Hits Allowed', key: 'hitsAllowed', role: 'Pitcher' },
    'EARNED RUNS ALLOWED': { label: 'Earned Runs Allowed', key: 'earnedRuns', role: 'Pitcher' },
    'EARNED RUNS': { label: 'Earned Runs Allowed', key: 'earnedRuns', role: 'Pitcher' },
    'ER': { label: 'Earned Runs Allowed', key: 'earnedRuns', role: 'Pitcher' },
    'HITTER FANTASY SCORE': { label: 'Hitter Fantasy Score', key: 'hitterFantasyScore', role: 'Batter' },
    'HFS': { label: 'Hitter Fantasy Score', key: 'hitterFantasyScore', role: 'Batter' },
    'HITTER FS': { label: 'Hitter Fantasy Score', key: 'hitterFantasyScore', role: 'Batter' },
    'HITS+RUNS+RBIS': { label: 'Hits+Runs+RBIs', key: 'hitsRunsRbis', role: 'Batter' },
    'HITS+RUNS+RBI': { label: 'Hits+Runs+RBIs', key: 'hitsRunsRbis', role: 'Batter' },
    'HITS + RUNS + RBIS': { label: 'Hits+Runs+RBIs', key: 'hitsRunsRbis', role: 'Batter' },
    'HITS + RUNS + RBI': { label: 'Hits+Runs+RBIs', key: 'hitsRunsRbis', role: 'Batter' },
    'H+R+RBI': { label: 'Hits+Runs+RBIs', key: 'hitsRunsRbis', role: 'Batter' },
    'H+R+R': { label: 'Hits+Runs+RBIs', key: 'hitsRunsRbis', role: 'Batter' },
    'HRR': { label: 'Hits+Runs+RBIs', key: 'hitsRunsRbis', role: 'Batter' },
    'H+R+RBIS': { label: 'Hits+Runs+RBIs', key: 'hitsRunsRbis', role: 'Batter' },
    'TOTAL BASES': { label: 'Total Bases', key: 'totalBases', role: 'Batter' },
    'TB': { label: 'Total Bases', key: 'totalBases', role: 'Batter' },
    'HITS': { label: 'Hits', key: 'hits', role: 'Batter' },
    'RUNS': { label: 'Runs', key: 'runs', role: 'Batter' },
    'RBIS': { label: 'RBIs', key: 'rbi', role: 'Batter' },
    'RBI': { label: 'RBIs', key: 'rbi', role: 'Batter' },
    'RUNS BATTED IN': { label: 'RBIs', key: 'rbi', role: 'Batter' },
    'HOME RUN': { label: 'Home Runs', key: 'homeRuns', role: 'Batter' },
    'HOME RUNS': { label: 'Home Runs', key: 'homeRuns', role: 'Batter' },
    'HR': { label: 'Home Runs', key: 'homeRuns', role: 'Batter' },
    'SINGLES': { label: 'Singles', key: 'singles', role: 'Batter' },
    'DOUBLES': { label: 'Doubles', key: 'doubles', role: 'Batter' },
    'TRIPLES': { label: 'Triples', key: 'triples', role: 'Batter' },
    'WALKS': { label: 'Walks', key: 'walks', role: 'Batter' },
    'STOLEN BASES': { label: 'Stolen Bases', key: 'stolenBases', role: 'Batter' },
    'HITTER STRIKEOUTS': { label: 'Hitter Strikeouts', key: 'hitterStrikeouts', role: 'Batter' },
    'HITTER KS': { label: 'Hitter Strikeouts', key: 'hitterStrikeouts', role: 'Batter' },
    "HITTER K'S": { label: 'Hitter Strikeouts', key: 'hitterStrikeouts', role: 'Batter' }
  };

  const MLB_FEED_MATRIX = ['Pitcher Strikeouts','Pitching Outs','Pitcher Fantasy Score','Walks Allowed','Hits Allowed','Earned Runs Allowed','Hitter Fantasy Score','Hits+Runs+RBIs','Total Bases','Hits','Runs','RBIs','Home Runs','Singles','Doubles','Triples','Walks','Stolen Bases','Hitter Strikeouts'];


  function pad2(value) { return String(value).padStart(2, '0'); }
  function cleanWhitespace(value) { return String(value || '').replace(/\u00a0/g, ' ').replace(/[|•]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function stripAccents(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function normalizeName(value) { return stripAccents(String(value || '')).toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function splitGluedTokens(value) {
    return String(value || '')
      .replace(/([a-z])(Goblin|Demon|Taco|Free Pick)/gi, '$1 $2')
      .replace(GLUED_NOISE_RX, ' ')
      .replace(/([a-z'.-])(?=([A-Z]{2,3})\s*[-—–]\s*(P|SP|RP|C|1B|2B|3B|SS|LF|CF|RF|OF|IF|DH|UTIL|LW|RW|D|G)\b)/g, '$1 ')
      .replace(/([a-z])(?=([A-Z][a-z]+\s+[A-Z]{2,3}\s*[-—–]\s*(P|SP|RP|C|1B|2B|3B|SS|LF|CF|RF|OF|IF|DH|UTIL|LW|RW|D|G)\b))/g, '$1 ');
  }

  function preprocessBoardText(text) {
    const normalized = String(text || '')
      .replace(/\r\n?/g, '\n')
      .replace(/\u00a0/g, ' ')
      .replace(/\|/g, '\n')
      .replace(/([a-z])(Goblin|Demon|Taco|Free Pick)/gi, '$1 $2')
      .replace(/\b(?:Goblin|Demon|Taco|Promo|Less|More)\b/gi, ' ');

    return normalized
      .split('\n')
      .map((line) => splitGluedTokens(stripAccents(line)).replace(BADGE_RX, ' ').replace(GLUED_NOISE_RX, ' '))
      .map((line) => line.replace(/\b(?:\d{2}:\d{2}:\d{2}|\d{1,3}m(?:\s+\d{1,2}s)?|\d+h\s*\d{1,2}m|countdown|locks?\s*in:?|pitch count:?\s*\d+|pitches:?\s*\d+)\b/gi, ' '))
      .map((line) => line.replace(/\b(?:LIVE|Final|Postponed|Delayed|Warmup|Starting|Started|Projected|Confirmed|In\s+Lineup|Probable|Top\s+\d+(?:st|nd|rd|th)|Bot\s+\d+(?:st|nd|rd|th)|Mid\s+\d+(?:st|nd|rd|th)|Extra\s+Innings|Next\s+Half\s+Inning|Current\s+Inning|\d+(?:st|nd|rd|th)\s+Inning\s+Stretch|Inning\s*\d+|1st|2nd|3rd|4th|5th|6th|7th|8th|9th|Period)\b/gi, ' '))
      .map((line) => line.replace(/\b(?:Trending|Popular)\b/gi, ' '))
      .map((line) => line.replace(BADGE_RX, ' '))
      .map((line) => line.replace(NOISE_WORD_RX, ' '))
      .map((line) => line.replace(/[\t ]+/g, ' ').trim())
      .join('\n')
      .replace(/\n{4,}/g, '\n\n\n')
      .split('\n');
  }

  function isRegisteredMlbProp(propLabel = '') {
    return MLB_FEED_MATRIX.includes(String(propLabel || '').trim());
  }

  function pushRejectedLine(bucket, value) {
    const line = cleanWhitespace(value);
    if (!line) return;
    if (!bucket.includes(line)) bucket.push(line);
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

    match = source.match(/\b(\d{1,2}[\/-]\d{1,2})(?:[\/-](\d{2,4}))?\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
    if (match) {
      const [month, day] = match[1].split(/[\/-]/).map(Number);
      let year = match[2] ? Number(match[2]) : PARSE_YEAR;
      if (year < 100) year += 2000;
      const date = new Date(year, month - 1, day, 0, 0, 0, 0);
      const clock = parseClockPieces(match[3]);
      if (clock) {
        date.setHours(clock.hour, clock.minute, 0, 0);
        return { found: true, token: cleanWhitespace(match[0]), eventDate: date, isoLocal: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:00`, parseYear: PARSE_YEAR };
      }
    }

    match = source.match(/\b(?:\d{1,3}m(?:\s+\d{1,2}s)?|\d+h\s*\d{1,2}m|countdown|locks?\s*in:?)\b/i);
    if (match) {
      return { found: false, token: cleanWhitespace(match[0]), eventDate: null, isoLocal: '', parseYear: PARSE_YEAR, reason: 'Countdown timer ignored.' };
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
    if (!timeContext?.found || !timeContext?.eventDate) return { accepted: true, code: 'NO_TIME', detail: 'No game time found.', scope, parseYear: PARSE_YEAR };
    const todayKey = `${PARSE_YEAR}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = `${PARSE_YEAR}-${pad2(tomorrow.getMonth() + 1)}-${pad2(tomorrow.getDate())}`;
    const eventKey = `${timeContext.eventDate.getFullYear()}-${pad2(timeContext.eventDate.getMonth() + 1)}-${pad2(timeContext.eventDate.getDate())}`;
    const accepted = scope === 'both' || (scope === 'today' && eventKey === todayKey) || (scope === 'tomorrow' && eventKey === tomorrowKey);
    return { accepted, code: accepted ? 'IN_SCOPE' : 'OUT_OF_SCOPE', detail: accepted ? `Accepted for ${scope}.` : `Rejected: ${eventKey} is outside ${scope}.`, scope, parseYear: PARSE_YEAR };
  }

  function inferSportHint(lines = []) {
    const joined = lines.map((line) => typeof line === 'string' ? line : line.raw).join(' ').toUpperCase();
    if (/\b(NBA|NHL|NFL|WNBA|SOCCER|TENNIS|GOLF|SOG|SHOTS ON GOAL|BLOCKED SHOTS|GOALS ALLOWED|SAVES|PTS|POINTS|ASSISTS|GOALS)\b/.test(joined)) return 'NON_MLB';
    return 'MLB';
  }

  function resolvePropAlias(text, sportHint = 'MLB') {
    if (sportHint !== 'MLB') return null;
    const raw = cleanWhitespace(text).toUpperCase();
    const normalized = raw.replace(/\s*\+\s*/g, '+').replace(/\s+/g, ' ').trim();
    const aliases = Object.entries(MLB_PROP_ALIASES).sort((a, b) => b[0].length - a[0].length);
    for (const [alias, meta] of aliases) {
      const aliasNorm = alias.toUpperCase().replace(/\s*\+\s*/g, '+').replace(/\s+/g, ' ').trim();
      const escaped = aliasNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(`(^|[^A-Z])${escaped}(?=$|[^A-Z])`, 'i');
      if (rx.test(normalized)) return { ...meta, source: text };
    }
    return null;
  }

  function detectType(sourceText = '', propMeta = null) {
    const token = `${propMeta?.label || ''} ${String(sourceText || '')}`;
    if (/\b(Pitcher Fantasy Score|PFS|Ks|K's|Strikeouts|Pitching Outs|PO|Outs|Walks Allowed|Hits Allowed|Earned Runs|BB)\b/i.test(token)) return 'Pitcher';
    if (/\b(Hitter Fantasy Score|HFS|Fantasy Score|Hits\s*\+\s*Runs\s*\+\s*RBIs|H\+R\+R|HRR|Hits|Home Runs?|RBIs?|Runs Batted In|Total Bases|TB)\b/i.test(token)) return 'Hitter';
    if (propMeta?.role === 'Pitcher') return 'Pitcher';
    return 'Hitter';
  }

  function extractPickType(text) {
    const match = String(text || '').match(PICK_TYPE_RX);
    if (!match) return 'Regular Line';
    const value = match[1].toLowerCase();
    if (value === 'free pick') return 'Free Pick';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function extractLocalPickType(context = [], anchorLineIndex = 0) {
    const ordered = context.slice().sort((a, b) => Math.abs(a.absIndex - anchorLineIndex) - Math.abs(b.absIndex - anchorLineIndex));
    for (const item of ordered) {
      const match = String(item?.raw || item || '').match(PICK_TYPE_RX);
      if (!match) continue;
      const value = match[1].toLowerCase();
      if (value === 'free pick') return 'Free Pick';
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    return 'Regular Line';
  }

  function sanitizePlayerName(value) {
    return cleanWhitespace(
      splitGluedTokens(String(value || ''))
        .replace(PICK_TYPE_RX, ' ')
      .replace(GLUED_NOISE_RX, ' ')
        .replace(TEAM_ROLE_RX, ' ')
        .replace(MATCHUP_RX, ' ')
        .replace(INLINE_TIME_RX, ' ')
        .replace(NOISE_WORD_RX, ' ')
        .replace(/\b\d+(?:\.\d+)?\b/g, ' ')
        .replace(/\b(more|less|higher|lower)\b/gi, ' ')
        .replace(TEAM_ABBR_RX, ' ')
        .replace(/[^A-Za-z'.\-\s]/g, ' ')
    ).replace(/\s+/g, ' ').trim();
  }

  function isLikelyPlayerName(value) {
    const clean = sanitizePlayerName(value);
    if (!clean) return false;
    if (TEAM_ROLE_RX.test(clean) || ROLE_ONLY_RX.test(clean)) return false;
    if (/\b(?:vs\.?|@)\b/i.test(clean) || /\b(?:sun|mon|tue|wed|thu|fri|sat|today|tomorrow|am|pm)\b/i.test(clean)) return false;
    const words = clean.split(' ');
    if (words.length < 2 || words.length > 3) return false;
    if (words.some((word) => RESERVED_NAME_WORDS.has(word.toUpperCase()))) return false;
    return words.every((word) => /^[A-Z][A-Za-z'.-]*$/.test(word));
  }

  function extractNameCandidates(text) {
    const matches = [];
    const clean = splitGluedTokens(String(text || ''));
    for (const match of clean.matchAll(NAME_CANDIDATE_RX)) {
      const candidate = sanitizePlayerName(match[1]);
      if (isLikelyPlayerName(candidate)) matches.push(candidate);
    }
    return matches;
  }

  function extractTeamRole(text) {
    const match = String(text || '').match(TEAM_ROLE_RX);
    if (!match) return { team: '', position: '', token: '' };
    return { team: match[1].toUpperCase(), position: match[2].toUpperCase(), token: cleanWhitespace(match[0]) };
  }

  function extractMatchup(text, teamHint = '') {
    const match = String(text || '').match(MATCHUP_RX);
    if (!match) return { opponent: '', indicator: '', token: '' };
    return { opponent: match[2].toUpperCase(), indicator: match[1].replace('.', '').toLowerCase(), token: cleanWhitespace(match[0]), team: teamHint || '' };
  }

  function extractMatchupFallback(context = [], teamHint = '') {
    const joined = cleanWhitespace((context || []).map((item) => item?.raw || item || '').join(' '));
    if (!joined) return { opponent: '', indicator: '', token: '', team: teamHint || '' };

    const direct = joined.match(/(?:\bvs\.?|@)\s*([A-Z]{2,3})\b/i);
    if (direct && direct[1].toUpperCase() !== (teamHint || '').toUpperCase()) {
      return { opponent: direct[1].toUpperCase(), indicator: /@/.test(direct[0]) ? '@' : 'vs', token: cleanWhitespace(direct[0]), team: teamHint || '' };
    }

    const tokens = joined.split(/\s+/).filter(Boolean);
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i].replace(/[^A-Za-z@.]/g, '');
      if (!/^(vs\.?|@)$/i.test(token)) continue;
      for (let j = i + 1; j < Math.min(tokens.length, i + 5); j += 1) {
        const candidate = tokens[j].replace(/[^A-Za-z]/g, '').toUpperCase();
        if (/^[A-Z]{2,3}$/.test(candidate) && candidate !== (teamHint || '').toUpperCase()) {
          return { opponent: candidate, indicator: token.replace('.', '').toLowerCase(), token: `${token} ${candidate}`, team: teamHint || '' };
        }
      }
    }

    const lines = Array.isArray(context) ? context : [];
    for (let i = 0; i < lines.length; i += 1) {
      const raw = cleanWhitespace(lines[i]?.raw || lines[i] || '');
      const match = raw.match(/(?:\bvs\.?|@)\s*([A-Z]{2,3})\b/i);
      if (match && match[1].toUpperCase() !== (teamHint || '').toUpperCase()) {
        return { opponent: match[1].toUpperCase(), indicator: /@/.test(match[0]) ? '@' : 'vs', token: cleanWhitespace(match[0]), team: teamHint || '' };
      }
    }

    return { opponent: '', indicator: '', token: '', team: teamHint || '' };
  }


  function isNoiseLine(line) {
    const clean = cleanWhitespace(line);
    return !clean || COUNTDOWN_RX.test(clean) || LIVE_STATUS_RX.test(clean) || POPULARITY_BADGE_RX.test(clean) || /^\d+$/.test(clean) || /^Block ingestion example:?$/i.test(clean);
  }

  function isAnchorBoundary(lines, index, currentAnchorIndex) {
    if (index < 0 || index >= lines.length || index === currentAnchorIndex) return false;
    const clean = cleanWhitespace(lines[index]);
    if (!clean || isNoiseLine(clean)) return false;
    if (isStandaloneAnchorLine(clean) && hasNearbyStatAlias(lines, index)) return true;
    return Boolean(extractInlineAnchor(clean));
  }

  function cleanClusterLine(value) {
    return cleanWhitespace(
      splitGluedTokens(String(value || ''))
        .replace(BADGE_RX, ' ')
        .replace(GLUED_NOISE_RX, ' ')
        .replace(NOISE_WORD_RX, ' ')
    );
  }

  function buildIdentityCleanLines(cluster = []) {
    return (cluster || [])
      .map((item) => {
        const raw = typeof item === 'string' ? item : (item?.raw || item?.clean || '');
        return String(raw || '').replace(/(Demon|Goblin|Trending|Popular|Hot|Boost|Promo|Insurance|\b\d+K\b)/gi, '').trim();
      })
      .filter(Boolean);
  }

  function resolvePlayerFromTeamRoleContext(cluster = [], anchorLineIndex = Infinity) {
    const normalized = buildIdentityCleanLines(cluster).map((raw, idx) => ({
      idx,
      absIndex: Number.isFinite(cluster?.[idx]?.absIndex) ? cluster[idx].absIndex : idx,
      raw,
      clean: cleanWhitespace(raw)
    })).filter((item) => item.clean);

    const teamRoleEntries = normalized
      .filter((item) => TEAM_ROLE_RX.test(item.clean))
      .sort((a, b) => Math.abs(a.absIndex - anchorLineIndex) - Math.abs(b.absIndex - anchorLineIndex) || a.absIndex - b.absIndex);

    for (const entry of teamRoleEntries) {
      const entryIdx = normalized.findIndex((item) => item.absIndex === entry.absIndex && item.clean === entry.clean);
      for (let i = entryIdx - 1; i >= 0; i -= 1) {
        const candidate = sanitizePlayerName(normalized[i].clean);
        if (!candidate) continue;
        if (isLikelyPlayerName(candidate)) return candidate;
        break;
      }
    }
    return '';
  }

  function makeCluster(lines, anchorIndex, aboveRadius = 12, belowRadius = 5) {
    const cluster = [];
    const start = Math.max(0, anchorIndex - aboveRadius);
    const end = Math.min(lines.length - 1, anchorIndex + belowRadius);
    for (let i = start; i <= end; i += 1) {
      const clean = cleanClusterLine(lines[i]);
      if (!clean) continue;
      cluster.push({ raw: clean, clean, absIndex: i });
    }
    return cluster;
  }


  function parseCluster(cluster) {
    const DECON = /(Demon|Goblin|Taco|Free Pick|Promo|Trending|Hot|Boost|Popular|Insurance|Less|More)/gi;
    const rawLines = (cluster || []).map((item) => {
      const raw = typeof item === 'string' ? item : (item?.raw || item?.clean || '');
      return String(raw || '').replace(DECON, '').trim();
    });

    let player = '', team = '', prop = '', line = 0;
    const TEAM_RX = /\b([A-Z]{2,3})\s*[-—–]\s*(P|SP|RP|C|1B|2B|3B|SS|LF|CF|RF|OF|IF|DH|UTIL)\b/i;
    const JUNK = /(?:\bvs\.?\b|@|\b(?:Sat|Sun|Mon|Tue|Wed|Thu|Fri|Today|Tomorrow|LIVE|Final|Postponed|Delayed|Warmup|Starting|Started|Projected|Confirmed|Probable)\b|\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,3}m(?:\s+\d{1,2}s)?|\d+h\s*\d{1,2}m|countdown|locks?\s*in:?)/i;
    const NAME_SCORE_RX = /^[A-Za-z'.\-\s]{3,25}$/;

    rawLines.forEach((value) => {
      const clean = cleanWhitespace(value);
      if (STANDALONE_NUMBER_RX.test(clean)) line = parseFloat(clean);
    });

    const teamEntries = [];
    rawLines.forEach((value, index) => {
      const clean = cleanWhitespace(value);
      const match = clean.match(TEAM_RX);
      if (match) teamEntries.push({ index, team: String(match[1] || '').toUpperCase() });
    });

    const scoreNameCandidate = (value, pivotIndex, idx) => {
      const clean = sanitizePlayerName(value);
      if (!clean || clean.includes('+')) return { clean: '', score: -1 };
      if (!NAME_SCORE_RX.test(clean)) return { clean: '', score: -1 };
      if (TEAM_RX.test(clean) || JUNK.test(clean) || /^\d/.test(clean)) return { clean: '', score: -1 };
      if (!isLikelyPlayerName(clean)) return { clean: '', score: -1 };
      let score = 100 - Math.abs(idx - pivotIndex) * 12;
      if (idx === pivotIndex - 1 || idx === pivotIndex + 1) score += 35;
      else if (idx === pivotIndex - 2 || idx === pivotIndex + 2) score += 22;
      else if (idx === pivotIndex - 3 || idx === pivotIndex + 3) score += 12;
      return { clean, score };
    };

    let best = { clean: '', score: -1, team: '' };
    teamEntries.forEach((entry) => {
      const hunt = [entry.index - 1, entry.index + 1, entry.index - 2, entry.index + 2, entry.index - 3, entry.index + 3];
      hunt.forEach((idx) => {
        if (idx < 0 || idx >= rawLines.length) return;
        const candidate = scoreNameCandidate(rawLines[idx], entry.index, idx);
        if (candidate.score > best.score) best = { ...candidate, team: entry.team };
      });
    });

    if (best.clean) {
      player = best.clean;
      team = best.team;
    } else if (teamEntries[0]) {
      team = teamEntries[0].team;
    }

    const blob = rawLines.join(' ');
    if (/\b(?:Ks|K's|Strikeouts)\b/i.test(blob)) prop = 'Pitcher Strikeouts';
    else if (/\b(?:Total Bases|TB)\b/i.test(blob)) prop = 'Total Bases';
    else if (/\b(?:Pitching Outs|PO|Outs)\b/i.test(blob)) prop = 'Pitching Outs';
    else if (/\b(?:Pitcher Fantasy Score|PFS|Fantasy)\b/i.test(blob)) prop = 'Pitcher Fantasy Score';
    else if (/\b(?:Walks Allowed|BB Allowed|BB)\b/i.test(blob)) prop = 'Walks Allowed';
    else if (/\b(?:Hits Allowed|HA)\b/i.test(blob)) prop = 'Hits Allowed';
    else if (/\b(?:Earned Runs Allowed|Earned Runs|ER)\b/i.test(blob)) prop = 'Earned Runs Allowed';
    else if (/\b(?:Hitter Fantasy Score|HFS)\b/i.test(blob)) prop = 'Hitter Fantasy Score';
    else if (/\b(?:Hits\+Runs\+RBIs|H\+R\+RBI|HRR)\b/i.test(blob)) prop = 'Hits+Runs+RBIs';
    else if (/\bHits\b/i.test(blob)) prop = 'Hits';
    else if (/\bRuns\b/i.test(blob)) prop = 'Runs';
    else if (/\b(?:RBIs|RBI)\b/i.test(blob)) prop = 'RBIs';
    else if (/\b(?:Home Runs|Home Run|HR)\b/i.test(blob)) prop = 'Home Runs';
    else if (/\bSingles\b/i.test(blob)) prop = 'Singles';
    else if (/\bDoubles\b/i.test(blob)) prop = 'Doubles';
    else if (/\bTriples\b/i.test(blob)) prop = 'Triples';
    else if (/\bWalks\b/i.test(blob)) prop = 'Walks';
    else if (/\bStolen Bases\b/i.test(blob)) prop = 'Stolen Bases';
    else if (/\b(?:Hitter Strikeouts|Hitter Ks|Hitter K's)\b/i.test(blob)) prop = 'Hitter Strikeouts';

    return {
      parsedPlayer: player,
      team,
      prop: prop || 'MLB Prop',
      line,
      accepted: (player.length > 2 && line > 0 && !!team)
    };
  }

  function collectBackwardCluster(lines, anchorIndex, maxLines = 7) {
    const cluster = [];
    let i = anchorIndex - 1;
    while (i >= 0 && cluster.length < maxLines) {
      const clean = cleanClusterLine(lines[i]);
      if (!clean) { i -= 1; continue; }
      if (isAnchorBoundary(lines, i, anchorIndex)) break;
      cluster.unshift(clean);
      i -= 1;
    }
    return cluster;
  }

  function collectForwardCluster(lines, anchorIndex, maxLines = 5) {
    const cluster = [];
    let i = anchorIndex + 1;
    while (i < lines.length && cluster.length < maxLines) {
      const clean = cleanClusterLine(lines[i]);
      if (!clean) { i += 1; continue; }
      if (isAnchorBoundary(lines, i, anchorIndex)) break;
      cluster.push(clean);
      if (/^(more|less|higher|lower)$/i.test(clean) && cluster.length >= 2) break;
      i += 1;
    }
    return cluster;
  }

  function gatherCandidateContext(lines, anchorIndex) {
    const context = makeCluster(lines, anchorIndex, 12, 5);
    return context.length ? context : [{ raw: cleanClusterLine(lines[anchorIndex]), clean: cleanClusterLine(lines[anchorIndex]), absIndex: anchorIndex }];
  }

  function isStandaloneAnchorLine(line) {
    const clean = cleanWhitespace(line);
    if (!STANDALONE_NUMBER_RX.test(clean)) return false;
    const n = Number(clean);
    return Number.isFinite(n) && (clean.includes('.') || n <= 40);
  }

  function extractInlineAnchor(line) {
    const clean = cleanWhitespace(line);
    const match = clean.match(/^(\d+(?:\.\d+)?)\s+(.+)$/i);
    if (!match) return '';
    const remainder = cleanWhitespace(match[2]);
    return resolvePropAlias(remainder, 'MLB') ? match[1] : '';
  }

  function hasNearbyStatAlias(lines, index) {
    const start = Math.max(0, index - 2);
    const end = Math.min(lines.length - 1, index + 2);
    for (let i = start; i <= end; i += 1) {
      const clean = cleanClusterLine(lines[i]);
      if (!clean || isNoiseLine(clean)) continue;
      if (STAT_BOUND_ALIAS_RX.test(clean)) return true;
    }
    return false;
  }

  function buildAnchorCandidates(lines) {
    const candidates = [];
    const seen = new Set();
    lines.forEach((line, index) => {
      const clean = cleanClusterLine(line);
      if (!clean || isNoiseLine(clean)) return;
      if (!(STANDALONE_NUMBER_RX.test(clean) && hasNearbyStatAlias(lines, index))) return;
      const anchor = clean;
      const context = gatherCandidateContext(lines, index);
      const key = `${normalizeName(context.map((item) => item.raw).join(' '))}|${anchor}|${index}`;
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push({ anchorLineIndex: index, anchorValue: anchor, inline: false, context });
    });
    return candidates;
  }

  function choosePlayer(context, anchorLineIndex) {
    const head = context.filter((item) => item.absIndex <= anchorLineIndex);
    const scoreMap = new Map();

    const addCandidate = (candidate, score) => {
      const clean = sanitizePlayerName(candidate);
      if (!isLikelyPlayerName(clean)) return;
      if (TEAM_ROLE_RX.test(clean) || PICK_TYPE_RX.test(clean)) return;
      if (TEAM_ABBR_LIST.includes(clean.toUpperCase())) return;
      scoreMap.set(clean, Math.max(scoreMap.get(clean) || 0, score));
    };

    const linePriority = (item) => {
      let score = 100 + Math.max(0, (anchorLineIndex - item.absIndex)) * 2;
      if (item.absIndex === anchorLineIndex - 1) score += 12;
      if (item.absIndex === anchorLineIndex - 2) score += 8;
      if (!/\b(vs\.?|@|sat|sun|mon|tue|wed|thu|fri|am|pm|more|less|higher|lower)\b/i.test(item.clean)) score += 15;
      return score;
    };

    head.forEach((item) => {
      if (isLikelyPlayerName(item.clean)) addCandidate(item.clean, linePriority(item) + item.clean.length);
      extractNameCandidates(item.raw).forEach((candidate) => addCandidate(candidate, linePriority(item) + candidate.length));
    });

    const anchorText = head.map((item) => item.raw).join(' ');
    const roleMatch = anchorText.match(TEAM_ROLE_RX);
    if (roleMatch) {
      const beforeRole = anchorText.slice(0, anchorText.toUpperCase().indexOf(roleMatch[0].toUpperCase()));
      extractNameCandidates(beforeRole).forEach((candidate, idx) => addCandidate(candidate, 220 + (idx * 5) + candidate.length));
    }
    const matchupMatch = anchorText.match(MATCHUP_RX);
    if (matchupMatch) {
      const beforeMatchup = anchorText.slice(0, anchorText.toUpperCase().indexOf(matchupMatch[0].toUpperCase()));
      extractNameCandidates(beforeMatchup).forEach((candidate, idx) => addCandidate(candidate, 190 + (idx * 5) + candidate.length));
    }

    const occurrences = {};
    head.forEach((item) => {
      extractNameCandidates(item.raw).forEach((candidate) => {
        occurrences[candidate] = (occurrences[candidate] || 0) + 1;
      });
    });
    Object.entries(occurrences).forEach(([candidate, count]) => addCandidate(candidate, 140 + (count * 25) + candidate.length));

    const sorted = Array.from(scoreMap.entries()).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length);
    return sorted[0]?.[0] || '';
  }

  function chooseProp(context, anchorLineIndex, sportHint) {
    const ordered = context.slice().sort((a, b) => Math.abs(a.absIndex - anchorLineIndex) - Math.abs(b.absIndex - anchorLineIndex));
    const cleanCandidates = ordered
      .filter((item) => !TEAM_ROLE_RX.test(item.clean))
      .filter((item) => !MATCHUP_RX.test(item.clean))
      .filter((item) => !INLINE_TIME_RX.test(item.clean))
      .filter((item) => !isLikelyPlayerName(item.clean))
      .map((item) => item.clean);

    const prioritySources = [];
    [0, 1, -1, 2, -2, 3].forEach((offset) => {
      const item = context.find((entry) => entry.absIndex === anchorLineIndex + offset);
      if (item && !prioritySources.includes(item.clean)) prioritySources.push(item.clean);
    });
    cleanCandidates.forEach((source) => {
      if (!prioritySources.includes(source)) prioritySources.push(source);
    });

    for (const source of prioritySources) {
      const meta = resolvePropAlias(source, sportHint);
      if (meta) return meta;
    }

    const forwardJoin = context
      .filter((item) => item.absIndex >= anchorLineIndex && item.absIndex <= anchorLineIndex + 3)
      .map((item) => item.clean)
      .join(' ');
    return resolvePropAlias(forwardJoin, sportHint);
  }

  function chooseDirection(context, anchorLineIndex, pickType = 'Regular Line') {
    if (/^(goblin|demon|free pick|taco)$/i.test(String(pickType || ''))) return 'More';
    const ordered = context.slice().sort((a, b) => Math.abs(a.absIndex - anchorLineIndex) - Math.abs(b.absIndex - anchorLineIndex));
    for (const item of ordered) {
      const match = item.clean.match(DIRECTION_RX);
      if (match) return /less|lower/i.test(match[1]) ? 'Less' : 'More';
    }
    return '';
  }

  function isComboEntity(value = '') {
    const raw = cleanWhitespace(String(value || ''));
    if (!raw) return false;
    if (/[A-Z]{2,3}\/[A-Z]{2,3}/.test(raw)) return true;
    if (/(?:and|\&)/i.test(raw) && /[A-Z][a-z'.-]+\s+[A-Z][a-z'.-]+/.test(raw)) return true;
    const strippedPropText = raw
      .replace(/(?:Hits\s*\+\s*Runs\s*\+\s*RBIs|Hits\+Runs\+RBIs|H\+R\+RBI|HRR|Total Bases|Pitcher Strikeouts|Pitching Outs|Pitcher Fantasy Score|Hitter Fantasy Score|Walks Allowed|Hits Allowed|Earned Runs Allowed|Walks|Hits|Runs|RBIs?|Home Runs?|Singles|Doubles|Triples|Stolen Bases|Hitter Strikeouts|Ks|K's|Outs|Fantasy)/gi, ' ')
      .replace(/\+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (/(?:and|\&)/i.test(strippedPropText) && /[A-Z][a-z'.-]+\s+[A-Z][a-z'.-]+/.test(strippedPropText)) return true;
    return false;
  }

  function parseCandidate(candidate, dayScope, now) {
    const context = candidate.context;
    const sportHint = inferSportHint(context);
    const joined = context.map((item) => item.raw).join('\n');
    const pickType = extractPickType(joined);
    const clusterIdentity = parseCluster(context);
    const teamRole = extractTeamRole(joined);
    let matchup = extractMatchup(joined, teamRole.team);
    if (!matchup.opponent) matchup = extractMatchupFallback(context, teamRole.team);
    const propMeta = chooseProp(context, candidate.anchorLineIndex, sportHint) || resolvePropAlias(clusterIdentity.prop || '', sportHint);
    const identityPlayer = clusterIdentity.parsedPlayer || resolvePlayerFromTeamRoleContext(context, candidate.anchorLineIndex);
    const parsedPlayer = identityPlayer || choosePlayer(context, candidate.anchorLineIndex);
    const direction = chooseDirection(context, candidate.anchorLineIndex, pickType);
    const timeContext = extractTimeContext(joined, now);
    const timeFilter = timeContext.found ? evaluateTimeFilter(timeContext, dayScope, now) : { accepted: true, code: 'NO_TIME', detail: 'No game time found.', scope: normalizeDayScope(dayScope), parseYear: PARSE_YEAR };
    const type = propMeta?.role === 'Pitcher' ? 'Pitcher' : 'Hitter';
    const team = clusterIdentity.team || teamRole.team || matchup.team || '';
    const opponent = matchup.opponent || '';
    const audit = {
      idx: candidate.anchorLineIndex + 1,
      rawText: joined,
      cleanedRawText: cleanWhitespace(joined),
      parsedPlayer,
      sport: sportHint,
      league: sportHint,
      prop: propMeta?.label || '',
      propKey: propMeta?.key || '',
      line: String(candidate.anchorValue || ''),
      direction,
      team,
      opponent,
      gameTimeText: timeContext.token || '',
      gameTimeISO: timeContext.isoLocal || '',
      pickType,
      type,
      accepted: false,
      rejectionReason: '',
      timeFilter,
      parseYear: PARSE_YEAR
    };

    if (sportHint !== 'MLB') {
      audit.rejectionReason = 'Rejected: non-MLB content.';
      return { audit, row: null };
    }
    if (!candidate.anchorValue) {
      audit.rejectionReason = 'No numeric anchor found.';
      return { audit, row: null };
    }
    if (!propMeta?.label || !isRegisteredMlbProp(propMeta.label)) {
      audit.rejectionReason = 'Rejected: prop is outside the 19 registered MLB props.';
      return { audit, row: null };
    }
    if (isComboEntity(parsedPlayer) || isComboEntity(joined)) {
      audit.rejectionReason = 'Rejected: combo or paired legs are not supported.';
      return { audit, row: null };
    }
    if (!parsedPlayer || !isLikelyPlayerName(parsedPlayer)) {
      audit.rejectionReason = 'Player name could not be resolved from block cluster.';
      return { audit, row: null };
    }
    if (timeContext.found && !timeFilter.accepted) {
      audit.rejectionReason = timeFilter.detail;
      return { audit, row: null };
    }

    audit.accepted = true;
    const row = {
      idx: audit.idx,
      rawText: audit.rawText,
      cleanedRawText: audit.cleanedRawText,
      parsedPlayer,
      player: parsedPlayer,
      sport: sportHint,
      league: sportHint,
      role: propMeta.role,
      prop: propMeta.label,
      propKey: propMeta.key,
      propFamily: propMeta.label,
      line: String(candidate.anchorValue),
      lineValue: Number(candidate.anchorValue),
      direction,
      team,
      opponent,
      type,
      pickType,
      gameTimeText: timeContext.token || '',
      gameTimeISO: timeContext.isoLocal || '',
      accepted: true,
      timeFilter,
      parseYear: PARSE_YEAR,
      selectedDate: timeContext.isoLocal ? timeContext.isoLocal.slice(0, 10) : '',
      sourceIndex: audit.idx
    };
    return { audit, row };
  }


  function splitStructuredBlocks(lines = []) {
    const blocks = [];
    let current = [];
    lines.forEach((line) => {
      const clean = cleanWhitespace(line);
      if (!clean) {
        if (current.length) {
          blocks.push(current.slice());
          current = [];
        }
        return;
      }
      current.push(clean);
    });
    if (current.length) blocks.push(current.slice());
    return blocks;
  }


  function countBlockAnchors(block = []) {
    let count = 0;
    for (let i = 0; i < block.length; i += 1) {
      const line = cleanWhitespace(block[i]);
      if (!line || isNoiseLine(line)) continue;
      if (isStandaloneAnchorLine(line) && hasNearbyStatAlias(block, i)) count += 1;

    }
    return count;
  }

  function findPrimaryAnchor(block = []) {
    for (let i = 0; i < block.length; i += 1) {
      const line = cleanClusterLine(block[i]);
      if (!line) continue;
      if (isStandaloneAnchorLine(line) && hasNearbyStatAlias(block, i)) return line;
    }
    return '';
  }

  function parseStructuredBlock(block = [], dayScope = 'today', now = new Date(), blockIndex = 0) {
    const joined = block.join('\n');
    const sportHint = inferSportHint(block);
    const pickType = extractPickType(joined);
    const parsedCluster = parseCluster(block);
    const teamRole = extractTeamRole(joined);
    let matchup = extractMatchup(joined, teamRole.team);
    if (!matchup.opponent) matchup = extractMatchupFallback(block, teamRole.team);
    const contextItems = block.map((raw, idx) => ({ raw, clean: cleanWhitespace(raw), absIndex: idx }));
    const anchorValue = findPrimaryAnchor(block);
    const anchorIndex = Math.max(0, block.findIndex((line) => cleanWhitespace(line) === String(anchorValue)));
    const propMeta = chooseProp(contextItems, anchorIndex, sportHint) || resolvePropAlias(parsedCluster.prop || '', sportHint) || resolvePropAlias(joined, sportHint);
    const direction = chooseDirection(contextItems, anchorIndex, pickType);
    const timeContext = extractTimeContext(joined, now);
    const timeFilter = timeContext.found ? evaluateTimeFilter(timeContext, dayScope, now) : { accepted: true, code: 'NO_TIME', detail: 'No game time found.', scope: normalizeDayScope(dayScope), parseYear: PARSE_YEAR };
    const identityPlayer = parsedCluster.parsedPlayer || resolvePlayerFromTeamRoleContext(contextItems, anchorIndex);
    const playerCandidates = [];
    buildIdentityCleanLines(block).forEach((line) => {
      if (isLikelyPlayerName(line)) playerCandidates.push(line);
      extractNameCandidates(line).forEach((candidate) => playerCandidates.push(candidate));
    });
    const counts = {};
    playerCandidates.forEach((name) => { const clean = sanitizePlayerName(name); if (isLikelyPlayerName(clean)) counts[clean] = (counts[clean] || 0) + 1; });
    const parsedPlayer = identityPlayer || Object.entries(counts).sort((a,b) => (b[1]-a[1]) || (b[0].length-a[0].length))[0]?.[0] || choosePlayer(contextItems, Math.max(anchorIndex, block.length - 1));
    const type = propMeta?.role === 'Pitcher' ? 'Pitcher' : 'Hitter';
    const team = parsedCluster.team || teamRole.team || matchup.team || '';
    const opponent = matchup.opponent || '';
    const audit = {
      idx: blockIndex + 1,
      rawText: joined,
      cleanedRawText: cleanWhitespace(joined),
      parsedPlayer,
      sport: sportHint,
      league: sportHint,
      prop: propMeta?.label || '',
      propKey: propMeta?.key || '',
      line: String(anchorValue || ''),
      direction,
      team,
      opponent,
      gameTimeText: timeContext.token || '',
      gameTimeISO: timeContext.isoLocal || '',
      pickType,
      type,
      accepted: false,
      rejectionReason: '',
      timeFilter,
      parseYear: PARSE_YEAR
    };
    if (sportHint !== 'MLB') { audit.rejectionReason = 'Rejected: non-MLB content.'; return { audit, row: null }; }
    if (!anchorValue) { audit.rejectionReason = 'No numeric anchor found.'; return { audit, row: null }; }
    if (!propMeta?.label || !isRegisteredMlbProp(propMeta.label)) { audit.rejectionReason = 'Rejected: prop is outside the 19 registered MLB props.'; return { audit, row: null }; }
    if (isComboEntity(parsedPlayer) || isComboEntity(joined)) { audit.rejectionReason = 'Rejected: combo or paired legs are not supported.'; return { audit, row: null }; }
    if (!parsedPlayer || !isLikelyPlayerName(parsedPlayer)) { audit.rejectionReason = 'Player name could not be resolved from block cluster.'; return { audit, row: null }; }
    if (timeContext.found && !timeFilter.accepted) { audit.rejectionReason = timeFilter.detail; return { audit, row: null }; }
    audit.accepted = true;
    return { audit, row: {
      idx: audit.idx,
      rawText: audit.rawText,
      cleanedRawText: audit.cleanedRawText,
      parsedPlayer,
      player: parsedPlayer,
      sport: sportHint,
      league: sportHint,
      role: propMeta.role,
      prop: propMeta.label,
      propKey: propMeta.key,
      propFamily: propMeta.label,
      line: String(anchorValue),
      lineValue: Number(anchorValue),
      direction,
      team,
      opponent,
      type,
      pickType,
      gameTimeText: timeContext.token || '',
      gameTimeISO: timeContext.isoLocal || '',
      accepted: true,
      timeFilter,
      parseYear: PARSE_YEAR,
      selectedDate: timeContext.isoLocal ? timeContext.isoLocal.slice(0, 10) : '',
      sourceIndex: audit.idx,
      blockIndex: audit.idx,
      geminiSubject: {
        name: parsedPlayer,
        team,
        opponent,
        prop: propMeta.label,
        line: String(anchorValue),
        gameTime: timeContext.token || '',
        pickType,
        direction,
        type
      }
    }};
  }

  function splitPipeBlocks(text = '') {
    return String(text || '')
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => line.includes('|'))
      .map((line) => preprocessBoardText(line).filter(Boolean));
  }


  function parseBoard(text, options = {}) {
    const now = options.now instanceof Date ? options.now : new Date();
    const dayScope = options.dayScope || 'both';
    const pipeBlocks = splitPipeBlocks(text);
    const rawLines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
    const nonPipeText = rawLines.filter((line) => !String(line || '').includes('|')).join('\n');
    const lines = preprocessBoardText(nonPipeText);
    const blocks = splitStructuredBlocks(lines);
    const audit = [];
    audit.rejectedLines = [];
    const rowMap = new Map();


    const acceptParsed = (parsed) => {
      audit.push(parsed.audit);
      if (!parsed.row) {
        if (parsed?.audit?.rejectionReason && /non-MLB|outside the 19 registered MLB props/i.test(parsed.audit.rejectionReason)) {
          pushRejectedLine(audit.rejectedLines, parsed.audit.rawText || parsed.audit.cleanedRawText || parsed.audit.prop || parsed.audit.parsedPlayer || '');
        }
        return;
      }
      const legId = String(parsed.row.legId || parsed.row.LEG_ID || parsed.row.blockIndex || parsed.audit?.idx || parsed.row.sourceIndex || parsed.row.idx || 0);
      const key = [normalizeName(parsed.row.parsedPlayer), String(parsed.row.prop || '').toLowerCase(), legId].join('|');
      const completeness = [parsed.row.pickType !== 'Regular Line', Boolean(parsed.row.team), Boolean(parsed.row.opponent), Boolean(parsed.row.gameTimeText), Boolean(parsed.row.direction), (parsed.row.rawText || '').length].reduce((sum, value) => sum + (value ? 1 : 0), 0);
      const existing = rowMap.get(key);
      if (!existing || completeness > existing.__completeness || ((parsed.row.rawText || '').length > (existing.rawText || '').length)) {
        rowMap.set(key, Object.assign({}, parsed.row, { __completeness: completeness }));
      }
    };

    const consumedAnchors = new Set();
    pipeBlocks.forEach((block, blockIndex) => {
      if (!block.length) return;
      const parsed = parseStructuredBlock(block, dayScope, now, blockIndex);
      if (parsed?.row) {
        acceptParsed(parsed);
        consumedAnchors.add(String(parsed.row.line) + '|' + normalizeName(parsed.row.parsedPlayer || '') + '|' + normalizeName(parsed.row.prop || ''));
      } else if (parsed?.audit) {
        acceptParsed(parsed);
      }
    });

    const structuredOnly = !nonPipeText.trim() || (blocks.length > 0 && blocks.every((block) => block.length && countBlockAnchors(block) === 1));
    blocks.forEach((block, blockIndex) => {
      if (!block.length) return;
      if (countBlockAnchors(block) !== 1) return;
      const parsed = parseStructuredBlock(block, dayScope, now, blockIndex);
      if (parsed?.row) {
        acceptParsed(parsed);
        consumedAnchors.add(String(parsed.row.line) + '|' + normalizeName(parsed.row.parsedPlayer || '') + '|' + normalizeName(parsed.row.prop || ''));
      } else if (parsed?.audit) {
        acceptParsed(parsed);
      }
    });

    if (!structuredOnly) {
      const candidates = buildAnchorCandidates(lines);
      candidates.forEach((candidate) => {
      const parsed = parseCandidate(candidate, dayScope, now);
      const signature = String(parsed?.row?.line || parsed?.audit?.line || '') + '|' + normalizeName(parsed?.row?.parsedPlayer || parsed?.audit?.parsedPlayer || '') + '|' + normalizeName(parsed?.row?.prop || parsed?.audit?.prop || '');
      if (consumedAnchors.has(signature)) return;
        acceptParsed(parsed);
      });
    }

    const rows = Array.from(rowMap.values()).map((row, index) => {
      const cleanRow = Object.assign({}, row);
      delete cleanRow.__completeness;
      cleanRow.idx = index + 1;
      return cleanRow;
    });

    return { version: SYSTEM_VERSION, parseYear: PARSE_YEAR, rows, audit };
  }

  return {
    SYSTEM_VERSION,
    PARSE_YEAR,
    LEAGUES,
    MLB_PROP_ALIASES,
    MLB_FEED_MATRIX,
    cleanWhitespace,
    extractTimeContext,
    evaluateTimeFilter,
    normalizeDayScope,
    parseBoard,
    stripAccents,
    normalizeName
  };
})();
