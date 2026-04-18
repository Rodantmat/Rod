window.PickCalcParser = (() => {
  const SYSTEM_VERSION = 'v13.77.18 (OXYGEN-COBALT)';
  const PARSE_YEAR = 2026;
  const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const LEAGUES = [
    { id: 'MLB', label: 'MLB', sport: 'MLB', league: 'MLB', checked: true },
    { id: 'NHL', label: 'NHL', sport: 'NHL', league: 'NHL', checked: true }
  ];

  const PICK_TYPE_RX = /\b(Goblin|Demon|Taco|Free Pick)\b/i;
  const TEAM_ROLE_RX = /\b([A-Z]{2,3})\s*-\s*(P|SP|RP|C|1B|2B|3B|SS|LF|CF|RF|OF|IF|DH|UTIL|LW|RW|D|G)\b/i;
  const DIRECTION_RX = /\b(more|less|higher|lower)\b/i;
  const MATCHUP_RX = /\b(vs\.?|@)\s*([A-Z]{2,3})\b/i;
  const NAME_CANDIDATE_RX = /\b([A-Z][a-z'.-]+(?:\s+[A-Z][a-z'.-]+){1,2})\b/g;
  const STANDALONE_ANCHOR_RX = /^\d+(?:\.\d+)?$/;
  const INLINE_TIME_RX = /\b(?:sun|mon|tue|wed|thu|fri|sat|today|tomorrow)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i;
  const NOISE_WORD_RX = /\b(trending|popular|popularity|hot|boost|promo|specials?|insurance)\b/gi;
  const ROLE_ONLY_RX = /^(?:P|SP|RP|C|1B|2B|3B|SS|LF|CF|RF|OF|IF|DH|UTIL|LW|RW|D|G)$/i;
  const TEAM_ABBR_LIST = ['ARI','ATL','BAL','BOS','CHC','CIN','CLE','COL','CWS','DET','HOU','KC','LAA','LAD','MIA','MIL','MIN','NYM','NYY','OAK','PHI','PIT','SD','SEA','SF','STL','TB','TEX','TOR','WSH','BUF','CAR','CBJ','CGY','CHI','COL','DAL','EDM','FLA','LAK','MIN','MTL','NJD','NSH','NYI','NYR','OTT','PHI','PIT','SEA','SJS','STL','TBL','TOR','UTA','VAN','VGK','WPG'];
  const TEAM_ABBR_RX = new RegExp(`\\b(?:${TEAM_ABBR_LIST.join('|')})\\b`, 'gi');

  const MLB_PROP_ALIASES = {
    'TB': { label: 'Total Bases', key: 'totalBases', role: 'Batter' },
    'TOTAL BASES': { label: 'Total Bases', key: 'totalBases', role: 'Batter' },
    'KS': { label: 'Strikeouts', key: 'strikeOuts', role: 'Pitcher' },
    "K'S": { label: 'Strikeouts', key: 'strikeOuts', role: 'Pitcher' },
    'K': { label: 'Strikeouts', key: 'strikeOuts', role: 'Pitcher' },
    'STRIKEOUTS': { label: 'Strikeouts', key: 'strikeOuts', role: 'Pitcher' },
    'PITCHER STRIKEOUTS': { label: 'Strikeouts', key: 'strikeOuts', role: 'Pitcher' },
    'PO': { label: 'Pitching Outs', key: 'inningsPitched', role: 'Pitcher' },
    'PITCHING OUTS': { label: 'Pitching Outs', key: 'inningsPitched', role: 'Pitcher' },
    'OUTS': { label: 'Pitching Outs', key: 'inningsPitched', role: 'Pitcher' },
    'HITS+RUNS+RBIS': { label: 'Hits+Runs+RBIs', key: 'hitsRunsRbis', role: 'Batter' },
    'HITS+RUNS+RBI': { label: 'Hits+Runs+RBIs', key: 'hitsRunsRbis', role: 'Batter' },
    'HITS + RUNS + RBIS': { label: 'Hits+Runs+RBIs', key: 'hitsRunsRbis', role: 'Batter' },
    'HITS + RUNS + RBI': { label: 'Hits+Runs+RBIs', key: 'hitsRunsRbis', role: 'Batter' },
    'H+R+RBI': { label: 'Hits+Runs+RBIs', key: 'hitsRunsRbis', role: 'Batter' },
    'H+R+R': { label: 'Hits+Runs+RBIs', key: 'hitsRunsRbis', role: 'Batter' },
    'HRR': { label: 'Hits+Runs+RBIs', key: 'hitsRunsRbis', role: 'Batter' },
    'H+R+RBIS': { label: 'Hits+Runs+RBIs', key: 'hitsRunsRbis', role: 'Batter' },
    'HITS': { label: 'Hits', key: 'hits', role: 'Batter' },
    'RUNS': { label: 'Runs', key: 'runs', role: 'Batter' },
    'RBIS': { label: 'RBIs', key: 'rbi', role: 'Batter' },
    'RBI': { label: 'RBIs', key: 'rbi', role: 'Batter' },
    'RUNS BATTED IN': { label: 'RBIs', key: 'rbi', role: 'Batter' },
    'HR': { label: 'Home Runs', key: 'homeRuns', role: 'Batter' },
    'HOME RUN': { label: 'Home Runs', key: 'homeRuns', role: 'Batter' },
    'HOME RUNS': { label: 'Home Runs', key: 'homeRuns', role: 'Batter' },
    'HITS ALLOWED': { label: 'Hits Allowed', key: 'hitsAllowed', role: 'Pitcher' },
    'ER': { label: 'Earned Runs', key: 'earnedRuns', role: 'Pitcher' },
    'EARNED RUNS': { label: 'Earned Runs', key: 'earnedRuns', role: 'Pitcher' },
    'WALKS ALLOWED': { label: 'Walks Allowed', key: 'walksAllowed', role: 'Pitcher' },
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
  function cleanWhitespace(value) { return String(value || '').replace(/\u00a0/g, ' ').replace(/[|•]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function stripAccents(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function normalizeName(value) { return stripAccents(String(value || '')).toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function splitGluedPickTypes(value) { return String(value || '').replace(/([a-z])(?=(Goblin|Demon|Taco|Free Pick)\b)/gi, '$1 '); }

  function preprocessBoardText(text) {
    return String(text || '')
      .replace(/\r/g, '\n')
      .replace(/\u00a0/g, ' ')
      .split('\n')
      .map((line) => splitGluedPickTypes(stripAccents(line)).trim())
      .filter(Boolean);
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
    if (/\b(SOG|SHOTS ON GOAL|BLOCKED SHOTS|GOALS ALLOWED|SAVES|PTS|POINTS|ASSISTS|GOALS)\b/.test(joined)) return 'NHL';
    return 'MLB';
  }

  function resolvePropAlias(text, sportHint = 'MLB') {
    const raw = cleanWhitespace(text).toUpperCase();
    const normalized = raw.replace(/\s*\+\s*/g, '+').replace(/\s+/g, ' ').trim();
    const maps = sportHint === 'NHL' ? [NHL_PROP_ALIASES] : [MLB_PROP_ALIASES, NHL_PROP_ALIASES];
    for (const dictionary of maps) {
      const aliases = Object.entries(dictionary).sort((a, b) => b[0].length - a[0].length);
      for (const [alias, meta] of aliases) {
        const aliasNorm = alias.toUpperCase().replace(/\s*\+\s*/g, '+').replace(/\s+/g, ' ').trim();
        const rx = new RegExp(`(^|[^A-Z])${aliasNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^A-Z])`, 'i');
        if (rx.test(normalized)) return { ...meta, source: text };
      }
    }
    return null;
  }

  function detectType(sourceText = '', propMeta = null) {
    const raw = String(sourceText || '');
    const token = `${propMeta?.label || ''} ${raw}`;
    if (/\b(Ks|K's|Strikeouts|Pitching Outs|Outs|Walks Allowed)\b/i.test(token)) return 'Pitcher';
    if (/\b(Hits\s*\+\s*Runs\s*\+\s*RBIs|H\+R\+R|HRR|Hits|Home Runs?|RBIs?|Runs Batted In|Total Bases)\b/i.test(token)) return 'Hitter';
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

  function sanitizePlayerName(value) {
    return cleanWhitespace(
      splitGluedPickTypes(String(value || ''))
        .replace(PICK_TYPE_RX, ' ')
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
    return words.every((word) => /^[A-Z][A-Za-z'.-]*$/.test(word));
  }

  function extractNameCandidates(text) {
    const matches = [];
    const clean = splitGluedPickTypes(String(text || ''));
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

    const direct = joined.match(/(?:vs\.?|@)\s*([A-Z]{2,3})/i);
    if (direct) return { opponent: direct[1].toUpperCase(), indicator: /@/.test(direct[0]) ? '@' : 'vs', token: cleanWhitespace(direct[0]), team: teamHint || '' };

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
      if (!raw) continue;
      if (/^(vs\.?|@)$/i.test(raw)) {
        for (let j = i + 1; j < Math.min(lines.length, i + 3); j += 1) {
          const nextRaw = cleanWhitespace(lines[j]?.raw || lines[j] || '');
          const nextMatch = nextRaw.match(/([A-Z]{2,3})/);
          if (nextMatch && nextMatch[1].toUpperCase() !== (teamHint || '').toUpperCase()) {
            return { opponent: nextMatch[1].toUpperCase(), indicator: raw.replace('.', '').toLowerCase(), token: `${raw} ${nextMatch[1].toUpperCase()}`, team: teamHint || '' };
          }
        }
      }
    }

    return { opponent: '', indicator: '', token: '', team: teamHint || '' };
  }

  function isStandaloneAnchorLine(line) {
    const clean = cleanWhitespace(line);
    if (!STANDALONE_ANCHOR_RX.test(clean)) return false;
    const n = Number(clean);
    return Number.isFinite(n) && (clean.includes('.') || n <= 40);
  }

  function extractInlineAnchor(line) {
    const clean = cleanWhitespace(line);
    const propFirst = clean.match(/(\d+(?:\.\d+)?)\s*(Ks|K's|Strikeouts|PO|Outs|Pitching Outs|Walks Allowed|Hits Allowed|Hits\s*\+\s*Runs\s*\+\s*RBIs|H\+R\+RBI|H\+R\+R|HRR|Home Runs?|HR|Hits|RBIs|Runs Batted In|RBI|Runs|TB|Total Bases|SOG|Shots on Goal|Blocked Shots|PTS|Points|Assists|Goals|Saves|Goals Allowed)\b/i);
    if (propFirst) return propFirst[1];
    const directionFirst = clean.match(/\b(\d+(?:\.\d+)?)\b(?=.*\b(?:more|less|higher|lower)\b)/i);
    return directionFirst ? directionFirst[1] : '';
  }

  function gatherContext(lines, anchorLineIndex) {
    const start = Math.max(0, anchorLineIndex - 4);
    const end = Math.min(lines.length - 1, anchorLineIndex + 2);
    return lines.slice(start, end + 1).map((raw, idx) => ({ raw, clean: cleanWhitespace(raw), absIndex: start + idx }));
  }

  function buildAnchorCandidates(lines) {
    const candidates = [];
    const seen = new Set();
    lines.forEach((line, index) => {
      const clean = cleanWhitespace(line);
      let anchor = '';
      let inline = false;
      if (isStandaloneAnchorLine(clean)) {
        anchor = clean;
      } else {
        anchor = extractInlineAnchor(clean);
        inline = Boolean(anchor);
      }
      if (!anchor) return;
      const inlineSelfContained = inline && TEAM_ROLE_RX.test(clean) && DIRECTION_RX.test(clean);
      const context = inlineSelfContained ? [{ raw: line, clean, absIndex: index }] : gatherContext(lines, index);
      const key = `${index}|${anchor}|${context.map((item) => item.absIndex).join(',')}`;
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push({ anchorLineIndex: index, anchorValue: anchor, inline, context });
    });
    return candidates;
  }

  function choosePlayer(context, anchorLineIndex) {
    const anchorText = context.find((item) => item.absIndex === anchorLineIndex)?.raw || '';
    const scoreMap = new Map();

    if (anchorText) {
      const roleMatch = anchorText.match(TEAM_ROLE_RX);
      const matchupMatch = anchorText.match(MATCHUP_RX);
      const upper = anchorText.toUpperCase();
      if (roleMatch) {
        const boundaryIndex = upper.indexOf(roleMatch[0].toUpperCase());
        const beforeRole = sanitizePlayerName(anchorText.slice(0, boundaryIndex));
        for (const candidate of extractNameCandidates(beforeRole)) {
          scoreMap.set(candidate, Math.max(scoreMap.get(candidate) || 0, 180 + candidate.length));
        }
      }
      if (matchupMatch) {
        const boundaryIndex = upper.indexOf(matchupMatch[0].toUpperCase());
        const beforeMatchup = sanitizePlayerName(anchorText.slice(0, boundaryIndex));
        for (const candidate of extractNameCandidates(beforeMatchup)) {
          scoreMap.set(candidate, Math.max(scoreMap.get(candidate) || 0, 150 + candidate.length));
        }
      }
    }

    const beforeText = context.filter((item) => item.absIndex <= anchorLineIndex).map((item) => item.raw).join(' ');
    const allText = context.map((item) => item.raw).join(' ');

    context.forEach((item) => {
      if (isLikelyPlayerName(item.clean)) {
        const candidate = sanitizePlayerName(item.clean);
        const score = 100 + (anchorLineIndex - item.absIndex) * 3 + candidate.length;
        scoreMap.set(candidate, Math.max(scoreMap.get(candidate) || 0, score));
      }
    });

    for (const candidate of extractNameCandidates(beforeText)) {
      const occurrences = (beforeText.match(new RegExp(candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      const score = 70 + occurrences * 20 + candidate.length;
      scoreMap.set(candidate, Math.max(scoreMap.get(candidate) || 0, score));
    }

    for (const candidate of extractNameCandidates(allText)) {
      const occurrences = (allText.match(new RegExp(candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      const score = 40 + occurrences * 15 + candidate.length;
      scoreMap.set(candidate, Math.max(scoreMap.get(candidate) || 0, score));
    }

    const sorted = Array.from(scoreMap.entries())
      .filter(([candidate]) => !TEAM_ROLE_RX.test(candidate) && !PICK_TYPE_RX.test(candidate) && !TEAM_ABBR_LIST.includes(candidate.toUpperCase()))
      .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length);
    return sorted[0]?.[0] || '';
  }

  function chooseProp(context, anchorLineIndex, sportHint) {
    const ordered = context.slice().sort((a, b) => Math.abs(a.absIndex - anchorLineIndex) - Math.abs(b.absIndex - anchorLineIndex));
    for (const item of ordered) {
      const meta = resolvePropAlias(item.clean, sportHint);
      if (meta) return meta;
    }
    const joined = context.map((item) => item.clean).join(' ');
    return resolvePropAlias(joined, sportHint);
  }

  function chooseDirection(context, anchorLineIndex) {
    const ordered = context.slice().sort((a, b) => Math.abs(a.absIndex - anchorLineIndex) - Math.abs(b.absIndex - anchorLineIndex));
    for (const item of ordered) {
      const match = item.clean.match(DIRECTION_RX);
      if (match) return /less|lower/i.test(match[1]) ? 'Less' : 'More';
    }
    return 'More';
  }

  function parseCandidate(candidate, dayScope, now) {
    const context = candidate.context;
    const sportHint = inferSportHint(context);
    const joined = context.map((item) => item.raw).join('\n');
    const pickType = extractPickType(joined);
    const teamRole = extractTeamRole(joined);
    const matchupPrimary = extractMatchup(joined, teamRole.team);
    const matchupFallback = matchupPrimary.opponent ? matchupPrimary : extractMatchupFallback(context, teamRole.team);
    const matchup = matchupFallback;
    const propMeta = chooseProp(context, candidate.anchorLineIndex, sportHint);
    const parsedPlayer = choosePlayer(context, candidate.anchorLineIndex);
    const direction = chooseDirection(context, candidate.anchorLineIndex);
    const timeContext = extractTimeContext(joined, now);
    const timeFilter = timeContext.found ? evaluateTimeFilter(timeContext, dayScope, now) : { accepted: true, code: 'NO_TIME', detail: 'No game time found.', scope: normalizeDayScope(dayScope), parseYear: PARSE_YEAR };
    const type = detectType(joined, propMeta);
    const team = teamRole.team || matchup.team || '';
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

    if (!candidate.anchorValue) {
      audit.rejectionReason = 'No numeric anchor found.';
      return { audit, row: null };
    }
    if (!propMeta?.label) {
      audit.rejectionReason = 'Numeric anchor found but prop alias was not resolved.';
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
      selectedDate: timeContext.isoLocal ? timeContext.isoLocal.slice(0, 10) : ''
    };
    return { audit, row };
  }

  function parseBoard(text, options = {}) {
    const now = options.now instanceof Date ? options.now : new Date();
    const dayScope = options.dayScope || 'today';
    const lines = preprocessBoardText(text);
    const candidates = buildAnchorCandidates(lines);
    const audit = [];
    const rowMap = new Map();

    candidates.forEach((candidate) => {
      const parsed = parseCandidate(candidate, dayScope, now);
      audit.push(parsed.audit);
      if (!parsed.row) return;
      const key = [normalizeName(parsed.row.parsedPlayer), String(parsed.row.prop || '').toLowerCase(), String(parsed.row.line || '')].join('|');
      const completeness = [parsed.row.pickType !== 'Regular Line', Boolean(parsed.row.team), Boolean(parsed.row.opponent), Boolean(parsed.row.gameTimeText), (parsed.row.rawText || '').length].reduce((sum, value) => sum + (value ? 1 : 0), 0);
      const existing = rowMap.get(key);
      if (!existing || completeness > existing.__completeness) {
        rowMap.set(key, Object.assign({}, parsed.row, { __completeness: completeness }));
      }
    });

    const rows = Array.from(rowMap.values()).map((row, index) => {
      const cleanRow = Object.assign({}, row);
      delete cleanRow.__completeness;
      cleanRow.idx = index + 1;
      return cleanRow;
    });

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
    extractTimeContext,
    evaluateTimeFilter,
    normalizeDayScope,
    parseBoard,
    stripAccents,
    normalizeName
  };
})();
