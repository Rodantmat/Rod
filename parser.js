(() => {
  const SYSTEM_VERSION = 'AlphaDog v0.0.1';
  const MAX_BATCH_SIZE = 24;
  const PROP_KEYWORDS = [
    'Home Runs','Hits+Runs+RBIs','Hits + Runs + RBIs','Total Bases','Pitcher Strikeouts','Hitter Fantasy Score','Pitcher Fantasy Score',
    'Hits','Runs','RBIs','Walks','Singles','Doubles','Triples','Stolen Bases','Strikeouts','Earned Runs','Outs Recorded',
    'First Inning Runs Allowed','Pitching Outs','Fantasy Score'
  ];
  const DIRECTION_WORDS = ['More', 'Less', 'Over', 'Under'];

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeInput(text = '') {
    return String(text || '')
      .replace(/\r/g, '')
      .replace(/\u00a0/g, ' ')
      .replace(/[\t ]+$/gm, '')
      .trim();
  }

  function isLineValue(line = '') {
    return /^\d+(?:\.\d+)?$/.test(String(line).trim());
  }

  function guessProp(lines = []) {
    for (const line of lines) {
      const cleaned = String(line || '').trim();
      if (!cleaned) continue;
      const hit = PROP_KEYWORDS.find((prop) => cleaned.toLowerCase().includes(prop.toLowerCase()));
      if (hit) return cleaned;
    }
    return lines.find((line) => /score|bases|strikeouts|outs|walks|hits|runs|rbis?/i.test(line || '')) || 'Unknown Prop';
  }

  function guessDirection(lines = []) {
    for (const line of lines) {
      const hit = DIRECTION_WORDS.find((word) => String(line || '').trim().toLowerCase() === word.toLowerCase());
      if (hit) return hit;
    }
    return 'Undecided';
  }

  function guessSport(lines = []) {
    return lines.some((line) => /mlb|pitcher|innings|bases|rbis?|strikeouts/i.test(line || '')) ? 'MLB' : 'MLB';
  }

  function guessMatchup(lines = []) {
    return lines.find((line) => /\b(vs|@)\b/i.test(line || '')) || 'Unknown matchup';
  }

  function guessPlayer(lines = []) {
    const blacklist = new Set(['More','Less','Over','Under']);
    for (const line of lines) {
      const cleaned = String(line || '').trim();
      if (!cleaned || blacklist.has(cleaned) || isLineValue(cleaned)) continue;
      if (/\b(vs|@)\b/i.test(cleaned)) continue;
      if (PROP_KEYWORDS.some((prop) => cleaned.toLowerCase().includes(prop.toLowerCase()))) continue;
      return cleaned;
    }
    return 'Unknown Player';
  }

  function splitBlocks(text = '') {
    const normalized = normalizeInput(text);
    if (!normalized) return [];
    const directBlocks = normalized.split(/\n\s*\n+/).map((block) => block.trim()).filter(Boolean);
    if (directBlocks.length > 1) return directBlocks;

    const lines = normalized.split('\n').map((line) => line.trim()).filter(Boolean);
    const anchors = [];
    lines.forEach((line, index) => { if (isLineValue(line)) anchors.push(index); });
    if (!anchors.length) return [normalized];

    return anchors.map((anchor, idx) => {
      const start = Math.max(0, anchor - 4);
      const end = idx + 1 < anchors.length ? Math.min(lines.length, anchors[idx + 1] + 4) : Math.min(lines.length, anchor + 5);
      return lines.slice(start, end).join('\n').trim();
    }).filter(Boolean);
  }

  function parseBoardText(text = '') {
    const blocks = splitBlocks(text);
    const rows = [];
    const rejected = [];

    blocks.forEach((block, index) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      if (!lines.length) return;
      const lineValue = lines.find((line) => isLineValue(line)) || '';
      const player = guessPlayer(lines);
      const prop = guessProp(lines);
      const direction = guessDirection(lines);
      const matchup = guessMatchup(lines);
      const sport = guessSport(lines);
      const rawText = block.trim();
      if (!rawText) return;
      const row = {
        LEG_ID: `LEG_${String(index + 1).padStart(2, '0')}`,
        index: index + 1,
        sport,
        rawText,
        parsedPlayer: player,
        prop,
        line: lineValue,
        direction,
        matchup,
      };
      if (rows.length < MAX_BATCH_SIZE) rows.push(row);
      else rejected.push({ reason: 'Batch limit exceeded (24 max).', rawText });
    });

    return {
      version: SYSTEM_VERSION,
      rows,
      rejected,
      acceptedCount: rows.length,
      rejectedCount: rejected.length,
      maxBatchSize: MAX_BATCH_SIZE,
    };
  }

  window.AlphaDogParser = { SYSTEM_VERSION, MAX_BATCH_SIZE, parseBoardText, normalizeInput, escapeHtml };
})();
