window.PickCalcParser = (() => {
  const SYSTEM_VERSION = 'v13.78.08 (OXYGEN-COBALT) • Main-1N.2 Parser Pixie Progress';
  const STANDALONE_NUMBER_RX = /^\d+(?:\.\d+)?$/;
  const GLUED_NOISE_RX = /(Demon|Goblin|Trending|Popular|Popularity|Hot|Boost|Promo|Specials?|Insurance)\b/g;
  const BADGE_RX = /\b\d+(?:\.\d+)?K\b/gi;
  const TIME_RX = /(?:\d+m\s+\d+s|\d+m|\b(?:sun|mon|tue|wed|thu|fri|sat|today|tomorrow)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)\b|\b\d{1,2}:\d{2}\s*(?:am|pm)?\b)/i;
  const TEAM_ROLE_RX = /\b([A-Z]{2,3})\s*-\s*(P|SP|RP|C|1B|2B|3B|SS|LF|CF|RF|OF|IF|DH|UTIL)\b/i;
  const MATCHUP_RX = /(?:^|\s)(vs\.?|@)\s*([A-Z]{2,3})\b/i;
  const DIRECTION_RX = /\b(more|less|higher|lower)\b/i;
  const NAME_RX = /\b([A-Z][a-z'.-]+(?:\s+[A-Z][a-z'.-]+){1,2})\b/g;

  const MLB_PROP_ALIASES = {
    'PITCHER STRIKEOUTS': { label: 'Pitcher Strikeouts', role: 'Pitcher' },
    'STRIKEOUTS': { label: 'Pitcher Strikeouts', role: 'Pitcher' },
    'KS': { label: 'Pitcher Strikeouts', role: 'Pitcher' },
    "K'S": { label: 'Pitcher Strikeouts', role: 'Pitcher' },

    'PITCHING OUTS': { label: 'Pitching Outs', role: 'Pitcher' },
    'PO': { label: 'Pitching Outs', role: 'Pitcher' },
    'OUTS': { label: 'Pitching Outs', role: 'Pitcher' },

    'PITCHER FANTASY SCORE': { label: 'Pitcher Fantasy Score', role: 'Pitcher' },
    'PITCHER FS': { label: 'Pitcher Fantasy Score', role: 'Pitcher' },
    'PFS': { label: 'Pitcher Fantasy Score', role: 'Pitcher' },

    'WALKS ALLOWED': { label: 'Walks Allowed', role: 'Pitcher' },
    'BB': { label: 'Walks Allowed', role: 'Pitcher' },
    'BB ALLOWED': { label: 'Walks Allowed', role: 'Pitcher' },

    'HITS ALLOWED': { label: 'Hits Allowed', role: 'Pitcher' },
    'HA': { label: 'Hits Allowed', role: 'Pitcher' },

    'EARNED RUNS ALLOWED': { label: 'Earned Runs Allowed', role: 'Pitcher' },
    'EARNED RUNS': { label: 'Earned Runs Allowed', role: 'Pitcher' },
    'ER': { label: 'Earned Runs Allowed', role: 'Pitcher' },

    'HITTER FANTASY SCORE': { label: 'Hitter Fantasy Score', role: 'Hitter' },
    'HITTER FS': { label: 'Hitter Fantasy Score', role: 'Hitter' },
    'HFS': { label: 'Hitter Fantasy Score', role: 'Hitter' },

    'HITS+RUNS+RBIS': { label: 'Hits+Runs+RBIs', role: 'Hitter' },
    'HITS+RUNS+RBI': { label: 'Hits+Runs+RBIs', role: 'Hitter' },
    'H+R+RBI': { label: 'Hits+Runs+RBIs', role: 'Hitter' },
    'HRR': { label: 'Hits+Runs+RBIs', role: 'Hitter' },

    'TOTAL BASES': { label: 'Total Bases', role: 'Hitter' },
    'TB': { label: 'Total Bases', role: 'Hitter' },

    'HITS': { label: 'Hits', role: 'Hitter' },
    'RUNS': { label: 'Runs', role: 'Hitter' },
    'RBIS': { label: 'RBIs', role: 'Hitter' },
    'RBI': { label: 'RBIs', role: 'Hitter' },

    'HOME RUNS': { label: 'Home Runs', role: 'Hitter' },
    'HOME RUN': { label: 'Home Runs', role: 'Hitter' },
    'HR': { label: 'Home Runs', role: 'Hitter' },

    'SINGLES': { label: 'Singles', role: 'Hitter' },
    'DOUBLES': { label: 'Doubles', role: 'Hitter' },
    'TRIPLES': { label: 'Triples', role: 'Hitter' },
    'WALKS': { label: 'Walks', role: 'Hitter' },
    'STOLEN BASES': { label: 'Stolen Bases', role: 'Hitter' },
    'HITTER STRIKEOUTS': { label: 'Hitter Strikeouts', role: 'Hitter' }
  };

  const MLB_FEED_MATRIX = [
    'Pitcher Strikeouts','Pitching Outs','Pitcher Fantasy Score','Walks Allowed','Hits Allowed','Earned Runs Allowed',
    'Hitter Fantasy Score','Hits+Runs+RBIs','Total Bases','Hits','Runs','RBIs','Home Runs','Singles','Doubles',
    'Triples','Walks','Stolen Bases','Hitter Strikeouts'
  ];

  function cleanWhitespace(value) {
    return String(value || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[|•]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function stripAccents(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function normalizeName(value) {
    return stripAccents(String(value || ''))
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase()
      .trim();
  }

  function splitGluedTokens(value) {
    return String(value || '').replace(/([a-z])(Goblin|Demon|Taco|Free Pick)/gi, '$1 $2');
  }

  function preprocessBoardText(text) {
    return String(text || '')
      .replace(/\r\n?/g, '\n')
      .replace(/\u00a0/g, ' ')
      .replace(/\|/g, '\n')
      .split('\n')
      .map((line) => splitGluedTokens(stripAccents(line)))
      .map((line) => cleanWhitespace(line))
      .filter(Boolean);
  }

  function makeCluster(lines, anchorIndex) {
    const start = Math.max(0, anchorIndex - 7);
    const end = Math.min(lines.length, anchorIndex + 6);
    return lines.slice(start, end);
  }

  function cleanClusterLines(clusterLines) {
    return clusterLines
      .map((line) => cleanWhitespace(line.replace(GLUED_NOISE_RX, ' ').replace(BADGE_RX, ' ')))
      .filter(Boolean);
  }

  function propComparable(value) {
    return cleanWhitespace(String(value || '')
      .toUpperCase()
      .replace(/[’']/g, '')
      .replace(/[^A-Z0-9+&\s]/g, ' ')
      .replace(/\s+/g, ' '));
  }

  function isShortAlias(key) {
    return ['KS', 'PO', 'PFS', 'BB', 'HA', 'ER', 'HFS', 'HRR', 'TB', 'RBI', 'HR'].includes(key);
  }

  function exactPropForLine(line) {
    const comparable = propComparable(line);
    for (const key of Object.keys(MLB_PROP_ALIASES).sort((a, b) => b.length - a.length)) {
      if (comparable === propComparable(key)) return MLB_PROP_ALIASES[key];
    }
    return null;
  }

  function phrasePropForLine(line) {
    const comparable = ` ${propComparable(line)} `;
    for (const key of Object.keys(MLB_PROP_ALIASES).sort((a, b) => b.length - a.length)) {
      if (isShortAlias(key)) continue;
      const needle = ` ${propComparable(key)} `;
      if (needle.trim().length >= 4 && comparable.includes(needle)) return MLB_PROP_ALIASES[key];
    }
    return null;
  }

  function resolveProp(clusterLines, lineValue) {
    const anchorIndex = clusterLines.findIndex((line) => cleanWhitespace(line) === cleanWhitespace(lineValue));
    const afterAnchor = anchorIndex >= 0 ? clusterLines.slice(anchorIndex + 1, anchorIndex + 5) : [];
    const beforeAnchor = anchorIndex >= 0 ? clusterLines.slice(Math.max(0, anchorIndex - 4), anchorIndex) : [];

    for (const line of afterAnchor) {
      const exact = exactPropForLine(line);
      if (exact) return exact;
    }

    for (const line of beforeAnchor) {
      const exact = exactPropForLine(line);
      if (exact) return exact;
    }

    for (const line of clusterLines) {
      const exact = exactPropForLine(line);
      if (exact) return exact;
    }

    for (const line of afterAnchor) {
      const phrase = phrasePropForLine(line);
      if (phrase) return phrase;
    }

    for (const line of clusterLines) {
      const phrase = phrasePropForLine(line);
      if (phrase) return phrase;
    }

    return null;
  }

  function resolvePlayer(clusterLines) {
    for (const line of clusterLines) {
      const matches = [...line.matchAll(NAME_RX)].map((m) => cleanWhitespace(m[1]));
      for (const match of matches) {
        if (match.split(' ').length >= 2) return match;
      }
    }
    return '';
  }

  function resolveTeam(clusterLines) {
    for (const line of clusterLines) {
      const match = line.match(TEAM_ROLE_RX);
      if (match) return { team: match[1].toUpperCase(), role: match[2].toUpperCase() };
    }
    return { team: '', role: '' };
  }

  function resolveOpponent(clusterLines) {
    for (const line of clusterLines) {
      const match = line.match(MATCHUP_RX);
      if (match) return match[2].toUpperCase();
    }
    return '';
  }

  function resolveDirection(clusterLines) {
    for (const line of clusterLines) {
      const match = line.match(DIRECTION_RX);
      if (match) {
        const raw = match[1].toLowerCase();
        return raw === 'higher' ? 'More' : raw === 'lower' ? 'Less' : raw[0].toUpperCase() + raw.slice(1);
      }
    }
    return '';
  }

  function resolveGameTime(clusterLines) {
    for (const line of clusterLines) {
      const match = line.match(TIME_RX);
      if (match) return cleanWhitespace(match[0]);
    }
    return '';
  }

  function parseCluster(clusterLines, lineValue, idx) {
    const cleaned = cleanClusterLines(clusterLines);
    const propMeta = resolveProp(cleaned, lineValue);
    if (!propMeta || !MLB_FEED_MATRIX.includes(propMeta.label)) {
      return { accepted: false, rejectionReason: 'Non-MLB or missing prop.' };
    }

    const player = resolvePlayer(cleaned);
    const teamMeta = resolveTeam(cleaned);
    const opponent = resolveOpponent(cleaned);
    const direction = resolveDirection(cleaned);
    const gameTimeText = resolveGameTime(cleaned);

    return {
      accepted: true,
      row: {
        idx,
        LEG_ID: `LEG-${idx}`,
        sourceIndex: idx,
        blockIndex: idx,
        sport: 'MLB',
        league: 'MLB',
        parsedPlayer: player,
        team: teamMeta.team,
        opponent,
        prop: propMeta.label,
        line: String(lineValue),
        type: propMeta.role,
        direction,
        gameTimeText
      }
    };
  }

  function parseBoard(text, options = {}) {
    const lines = preprocessBoardText(text);
    const rows = [];
    const auditRows = [];
    const rejectedLines = [];

    lines.forEach((line, index) => {
      if (!STANDALONE_NUMBER_RX.test(line)) return;
      const cluster = makeCluster(lines, index);
      const parsed = parseCluster(cluster, line, rows.length + 1);
      if (parsed.accepted) {
        const key = [normalizeName(parsed.row.parsedPlayer), parsed.row.prop.toLowerCase(), parsed.row.LEG_ID].join('|');
        if (!rows.some((r) => [normalizeName(r.parsedPlayer), r.prop.toLowerCase(), r.LEG_ID].join('|') === key)) {
          rows.push(parsed.row);
          auditRows.push({ idx: parsed.row.idx, accepted: true, parsedPlayer: parsed.row.parsedPlayer, prop: parsed.row.prop, line: parsed.row.line });
        }
      } else {
        rejectedLines.push(cleanClusterLines(cluster).join(' | '));
        auditRows.push({ idx: auditRows.length + 1, accepted: false, rawText: cluster.join(' | '), rejectionReason: parsed.rejectionReason });
      }
    });

    auditRows.rejectedLines = rejectedLines;
    return { rows, audit: auditRows, rejectedLines, version: SYSTEM_VERSION };
  }

  return {
    SYSTEM_VERSION,
    STANDALONE_NUMBER_RX,
    TIME_RX,
    MLB_FEED_MATRIX,
    parseBoard
  };
})();