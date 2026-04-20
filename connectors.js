window.PickCalcConnectors = (() => {
  const STORAGE_KEY = 'oxygen-cobalt-v15.2-config';
  const DEFAULT_MODEL = 'gemini-3.1-flash-lite-preview';
  const FORBIDDEN_FILLER = [
    'talented','due','breakout','looking to','momentum','matchup favors','run production','flexibility','opportunities'
  ];
  const PROP_PATHS = {
    Hits: ['ball-in-play path', 'contact path', 'line-drive path'],
    'Hits+Runs+RBIs': ['hit + run path', 'rbi opportunity path', 'multi-event scoring path'],
    'Pitcher Strikeouts': ['whiff path', 'chase path', 'put-away path'],
    'Home Runs': ['lift path', 'barrel path', 'air-contact path']
  };
  const RECENT_TREND_ALLOW = ['recent hit streak','recent power surge','recent strikeout form','recent quality contact','recent on-base form','recent run creation form','recent multi-rbi form','recent scoring form','recent whiff form'];

  function clean(value) { return String(value ?? '').trim(); }
  function slug(value) { return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  function parseKeys(raw) {
    return String(raw || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  }

  function loadConfig() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        apiKeys: Array.isArray(parsed.apiKeys) ? parsed.apiKeys.filter(Boolean) : [],
        model: DEFAULT_MODEL
      };
    } catch {
      return { apiKeys: [], model: DEFAULT_MODEL };
    }
  }

  function saveConfig({ apiKeys, model }) {
    const payload = {
      apiKeys: parseKeys(apiKeys),
      model: clean(model) || DEFAULT_MODEL
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return payload;
  }

  async function debugConnection(config) {
    const prompt = 'Return exactly this JSON: [{"leg_id":"debug","direction":"MORE","score":72,"confidence":"MED","trait":"compact swing","opponent_behavior":"zone-heavy pitching","logic_path":"ball-in-play path","season_grounding":".250 AVG","recent_trend":"recent hit streak"}]';
    const text = await requestGemini(prompt, config);
    const parsed = parseJsonLoose(text);
    if (!Array.isArray(parsed) || !parsed.length) throw new Error('Debug request returned invalid JSON.');
    return parsed;
  }

  async function scoreRows(rows, config, onProgress) {
    const batches = [];
    for (let i = 0; i < rows.length; i += 4) batches.push(rows.slice(i, i + 4));
    const scored = [];
    let completed = 0;
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
      const batch = batches[batchIndex];
      const runs = [];
      for (let runIndex = 0; runIndex < 3; runIndex += 1) {
        onProgress?.({ phase: 'request', batchIndex, runIndex, completed, total: rows.length, message: `Batch ${batchIndex + 1}/${batches.length} • Run ${runIndex + 1}/3` });
        const prompt = buildBatchPrompt(batch, batchIndex, runIndex);
        const text = await requestGemini(prompt, config);
        const parsed = parseJsonLoose(text);
        runs.push(Array.isArray(parsed) ? parsed : []);
      }
      const merged = mergeBatchRuns(batch, runs);
      merged.forEach((item) => { scored.push(item); completed += 1; });
      onProgress?.({ phase: 'merge', batchIndex, runIndex: 2, completed, total: rows.length, message: `Merged batch ${batchIndex + 1}/${batches.length}` });
    }
    return scored;
  }

  function buildBatchPrompt(batch, batchIndex, runIndex) {
    const legs = batch.map((row, idx) => ({
      leg_id: row.LEG_ID || row.legId,
      player: row.parsedPlayer,
      team: row.team,
      opponent: row.opponent,
      prop: row.prop,
      line: row.line,
      type: row.pickType || 'Regular Line',
      batch_slot: idx + 1
    }));

    return [
      'ROLE: MLB Prop Scoring Validator',
      'TASK: Return JSON only. No prose. No markdown.',
      'You are a validator, not a writer.',
      'KNOWN CONTEXT: opposing pitcher unknown, handedness unknown. Do not assume either.',
      'Use neutral matchup logic only.',
      'Return one object per leg with exactly these keys:',
      'leg_id, direction, score, confidence, trait, opponent_behavior, logic_path, season_grounding, recent_trend',
      'confidence must be one of LOW, MED, HIGH.',
      'recent_trend must contain no numbers.',
      'Use only these logic_path values by prop:',
      '- Hits: ball-in-play path, contact path, line-drive path',
      '- Hits+Runs+RBIs: hit + run path, RBI opportunity path, multi-event scoring path',
      '- Pitcher Strikeouts: whiff path, chase path, put-away path',
      '- Home Runs: lift path, barrel path, air-contact path',
      'Forbidden filler words: talented, due, breakout, looking to, momentum, matchup favors, run production, flexibility, opportunities.',
      'Do not use handedness terms, pitcher names, or exact recent numbers.',
      'If prop type is Goblin or Demon, direction must be MORE.',
      'Keep logic concise and mechanically causal.',
      'Score guidance: neutral logic capped at 80, extremely strong logic can exceed 85.',
      `Batch ${batchIndex + 1}, Run ${runIndex + 1}.`,
      'Return JSON array only for these legs:',
      JSON.stringify(legs, null, 2)
    ].join('\n');
  }

  async function requestGemini(prompt, config) {
    const keys = parseKeys((config?.apiKeys || []).join('\n'));
    if (!keys.length) throw new Error('No Gemini API keys saved.');
    const model = clean(config?.model) || DEFAULT_MODEL;
    let lastErr = null;
    for (const key of keys) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0
            }
          })
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Gemini ${res.status}: ${body.slice(0, 180)}`);
        }
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
        if (!text) throw new Error('Empty Gemini response.');
        return text;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error('All Gemini keys failed.');
  }

  function parseJsonLoose(text) {
    const raw = String(text || '').trim();
    if (!raw) return null;
    try { return JSON.parse(raw); } catch {}
    const firstArr = raw.indexOf('[');
    const lastArr = raw.lastIndexOf(']');
    if (firstArr !== -1 && lastArr > firstArr) {
      try { return JSON.parse(raw.slice(firstArr, lastArr + 1)); } catch {}
    }
    const firstObj = raw.indexOf('{');
    const lastObj = raw.lastIndexOf('}');
    if (firstObj !== -1 && lastObj > firstObj) {
      try { return JSON.parse(raw.slice(firstObj, lastObj + 1)); } catch {}
    }
    return null;
  }

  function mergeBatchRuns(batch, runs) {
    const playerCounts = new Map();
    batch.forEach((row) => {
      const key = slug(row.parsedPlayer);
      playerCounts.set(key, (playerCounts.get(key) || 0) + 1);
    });

    return batch.map((row) => {
      const candidates = runs.map((run) => {
        const match = (run || []).find((item) => clean(item.leg_id) === clean(row.LEG_ID || row.legId));
        return validateModelLeg(match, row);
      });
      const valid = candidates.filter((c) => c.valid);
      const reasons = candidates.filter((c) => !c.valid).flatMap((c) => c.errors);
      const scores = valid.map((c) => c.score);
      const spread = scores.length ? Math.max(...scores) - Math.min(...scores) : null;
      const directionVotes = tally(valid.map((c) => c.direction));
      const chosenDirection = directionVotes[0]?.value || '';
      const confidenceVotes = tally(valid.map((c) => c.confidence));
      const chosenConfidence = confidenceVotes[0]?.value || 'LOW';
      const traitVotes = tally(valid.map((c) => c.trait));
      const behaviorVotes = tally(valid.map((c) => c.opponent_behavior));
      const pathVotes = tally(valid.map((c) => c.logic_path));
      const seasonVotes = tally(valid.map((c) => c.season_grounding));
      const trendVotes = tally(valid.map((c) => c.recent_trend));

      const score = median(scores);
      const tooFewValid = valid.length < 2;
      const tooWide = spread != null && spread > 12;
      const samePlayerConflict = evaluateSamePlayerConflict(row, batch, { path: pathVotes[0]?.value || '', score });
      const reliable = !tooFewValid && !tooWide && !samePlayerConflict;

      const merged = {
        sourceRow: row,
        validRuns: valid.length,
        spread: spread == null ? 'N/A' : String(spread),
        direction: chosenDirection,
        score: Number.isFinite(score) ? Math.round(score) : null,
        confidence: chosenConfidence,
        trait: traitVotes[0]?.value || '',
        opponent_behavior: behaviorVotes[0]?.value || '',
        logic_path: pathVotes[0]?.value || '',
        season_grounding: seasonVotes[0]?.value || '',
        recent_trend: trendVotes[0]?.value || '',
        reliable,
        rejectionReasons: [...new Set([
          ...reasons,
          ...(tooFewValid ? ['Fewer than 2 valid model runs.'] : []),
          ...(tooWide ? [`Score spread too wide (${spread}).`] : []),
          ...(samePlayerConflict ? [samePlayerConflict] : [])
        ])]
      };

      return merged;
    });
  }

  function evaluateSamePlayerConflict(row, batch, candidate) {
    const same = batch.filter((item) => item !== row && slug(item.parsedPlayer) === slug(row.parsedPlayer));
    if (!same.length) return '';
    if (row.prop === 'Hits+Runs+RBIs' && candidate.logic_path && ['ball-in-play path','contact path','line-drive path'].includes(slug(candidate.logic_path).replace(/\s+/g,' '))) {
      return 'HRR prop reused Hits logic path.';
    }
    return '';
  }

  function validateModelLeg(item, row) {
    const errors = [];
    if (!item || typeof item !== 'object') return { valid: false, errors: ['Missing model row.'] };
    const legId = clean(item.leg_id);
    if (legId !== clean(row.LEG_ID || row.legId)) errors.push('Leg ID mismatch.');

    const direction = clean(item.direction).toUpperCase();
    const score = Number(item.score);
    const confidence = clean(item.confidence).toUpperCase();
    const trait = clean(item.trait);
    const behavior = clean(item.opponent_behavior);
    const path = clean(item.logic_path);
    const season = clean(item.season_grounding);
    const trend = clean(item.recent_trend);

    if (!['MORE','LESS','OVER','UNDER'].includes(direction)) errors.push('Invalid direction.');
    if (!Number.isFinite(score) || score < 0 || score > 100) errors.push('Invalid score.');
    if (!['LOW','MED','HIGH'].includes(confidence)) errors.push('Invalid confidence.');
    if (!trait || !behavior || !path) errors.push('Missing anchor fields.');
    if (!season || !trend) errors.push('Missing grounding.');

    const combined = `${trait} ${behavior} ${path}`.toLowerCase();
    if (FORBIDDEN_FILLER.some((term) => combined.includes(term))) errors.push('Forbidden filler detected.');
    if (/\b(lhp|rhp|left-handed|right-handed)\b/i.test(combined)) errors.push('Handedness assumption detected.');
    if (/\b(spencer|arrighetti|cecconi|ginn|allen|bibee|flaherty|strider|alonso|julio|rodriguez|hancock|alvarez|rocchio|hoerner)\b/i.test(combined)) errors.push('Specific pitcher/player identity used in anchor.');
    if (/\d/.test(trend)) errors.push('Recent trend contains numbers.');
    if (!/\d/.test(season)) errors.push('Current-season grounding missing numbers.');

    const prop = clean(row.prop);
    const allowedPaths = PROP_PATHS[prop] || [];
    if (allowedPaths.length && !allowedPaths.some((allowed) => slug(allowed) === slug(path))) errors.push('Logic path invalid for prop.');

    if (prop === 'Hits+Runs+RBIs') {
      const joined = `${trait} ${behavior} ${path}`.toLowerCase();
      if (!/hit \+ run path|rbi opportunity path|multi-event scoring path/i.test(path)) {
        errors.push('HRR missing scoring path.');
      }
      if (/\bon-base\b|\bplate discipline\b/.test(joined) && !/rbi|run|multi-event/.test(path.toLowerCase())) {
        errors.push('HRR logic too close to Hits logic.');
      }
    }

    if ((row.pickType || '') !== 'Regular Line' && direction !== 'MORE') errors.push('Goblin/Demon line must be MORE.');
    if (confidence === 'HIGH' && score < 80) errors.push('High confidence with weak score.');
    if (confidence === 'MED' && score < 60) errors.push('Medium confidence with low score.');

    return { valid: errors.length === 0, errors, leg_id: legId, direction, score, confidence, trait, opponent_behavior: behavior, logic_path: path, season_grounding: season, recent_trend: trend };
  }

  function tally(values) {
    const map = new Map();
    values.filter(Boolean).forEach((value) => map.set(value, (map.get(value) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }));
  }

  function median(values) {
    if (!values.length) return NaN;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return {
    DEFAULT_MODEL,
    loadConfig,
    saveConfig,
    debugConnection,
    scoreRows
  };
})();
