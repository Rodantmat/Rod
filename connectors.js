
window.PickCalcConnectors = window.PickCalcConnectors || {};
(() => {
  const SYSTEM_VERSION = 'v13.1.0 (FIXED-IGNITION)';
  const CURRENT_SEASON = 2026;
  const ODDS_API_KEY = '7caa930f0cda5a1baaea0dad608f71a1';
  const ODDS_BASE = 'https://api.the-odds-api.com/v4';
  const MLB_SPORT_KEY = 'baseball_mlb';
  const BOVADA_BASEBALL_URL = 'https://www.bovada.lv/services/sports/event/v1/events/list/json/baseball?marketFilterId=def&lang=en&eventsLimit=50';
  const DRAFTKINGS_MLB_URL = 'https://sportsbook-nash-usmi.draftkings.com/sites/US-MI-SB/api/v5/eventgroups/84240?format=json';
  const FANDUEL_MLB_URL = 'https://sbapi.on.sportsbook.fanduel.com/api/content-managed-page?page=SPORT&eventTypeId=7511';
  const BETSAPI_TOKEN = '';
  const BETSAPI_BASE = 'https://api.betsapi.com/v2';
  const FACTOR_TARGETS = { A: 20, B: 18, C: 12, D: 10, E: 12 };

  const TEAM_ABBR_TO_ID = {
    ARI:109, ATL:144, BAL:110, BOS:111, CHC:112, CIN:113, CLE:114, COL:115,
    DET:116, HOU:117, KC:118, KCR:118, LAA:108, LAD:119, MIA:146, MIL:158,
    MIN:142, NYM:121, NYY:147, ATH:133, OAK:133, PHI:143, PIT:134, SD:135,
    SDP:135, SEA:136, SF:137, SFG:137, STL:138, TB:139, TBR:139, TEX:140,
    TOR:141, WSH:120, WAS:120, CWS:145, CHW:145
  };

  const TEAM_NAME_TO_ABBR = {
    'arizona diamondbacks':'ARI','atlanta braves':'ATL','baltimore orioles':'BAL','boston red sox':'BOS',
    'chicago cubs':'CHC','cincinnati reds':'CIN','cleveland guardians':'CLE','colorado rockies':'COL',
    'detroit tigers':'DET','houston astros':'HOU','kansas city royals':'KC','los angeles angels':'LAA',
    'los angeles dodgers':'LAD','miami marlins':'MIA','milwaukee brewers':'MIL','minnesota twins':'MIN',
    'new york mets':'NYM','new york yankees':'NYY','oakland athletics':'ATH','athletics':'ATH',
    'philadelphia phillies':'PHI','pittsburgh pirates':'PIT','san diego padres':'SD','seattle mariners':'SEA',
    'san francisco giants':'SF','st. louis cardinals':'STL','st louis cardinals':'STL','tampa bay rays':'TB',
    'texas rangers':'TEX','toronto blue jays':'TOR','washington nationals':'WSH','chicago white sox':'CWS'
  };

  const stadiumLibrary = {
    1:{id:1,name:'Angel Stadium',team:'LAA',city:'Anaheim',lat:33.8003,lon:-117.8827,alt:160,hrFactor:0.97,runFactor:0.98,lf:347,cf:396,rf:350,surface:'Grass'},
    2:{id:2,name:'Oriole Park at Camden Yards',team:'BAL',city:'Baltimore',lat:39.2838,lon:-76.6217,alt:20,hrFactor:0.99,runFactor:1.00,lf:333,cf:400,rf:318,surface:'Grass'},
    3:{id:3,name:'Fenway Park',team:'BOS',city:'Boston',lat:42.3467,lon:-71.0972,alt:20,hrFactor:1.03,runFactor:1.02,lf:310,cf:390,rf:302,surface:'Grass'},
    4:{id:4,name:'Guaranteed Rate Field',team:'CWS',city:'Chicago',lat:41.8300,lon:-87.6338,alt:595,hrFactor:1.06,runFactor:1.03,lf:330,cf:400,rf:335,surface:'Grass'},
    5:{id:5,name:'Progressive Field',team:'CLE',city:'Cleveland',lat:41.4962,lon:-81.6852,alt:650,hrFactor:1.02,runFactor:1.00,lf:325,cf:400,rf:325,surface:'Grass'},
    7:{id:7,name:'Kauffman Stadium',team:'KC',city:'Kansas City',lat:39.0517,lon:-94.4803,alt:750,hrFactor:0.95,runFactor:0.97,lf:330,cf:410,rf:330,surface:'Grass'},
    15:{id:15,name:'Chase Field',team:'ARI',city:'Phoenix',lat:33.4455,lon:-112.0667,alt:1050,hrFactor:1.04,runFactor:1.05,lf:330,cf:407,rf:334,surface:'Turf'},
    17:{id:17,name:'Wrigley Field',team:'CHC',city:'Chicago',lat:41.9484,lon:-87.6553,alt:595,hrFactor:1.01,runFactor:1.00,lf:355,cf:400,rf:353,surface:'Grass'},
    19:{id:19,name:'Coors Field',team:'COL',city:'Denver',lat:39.7559,lon:-104.9942,alt:5200,hrFactor:1.18,runFactor:1.20,lf:347,cf:415,rf:350,surface:'Grass'},
    22:{id:22,name:'Dodger Stadium',team:'LAD',city:'Los Angeles',lat:34.0739,lon:-118.2400,alt:340,hrFactor:0.99,runFactor:0.98,lf:330,cf:395,rf:330,surface:'Grass'},
    31:{id:31,name:'loanDepot park',team:'MIA',city:'Miami',lat:25.7781,lon:-80.2197,alt:10,hrFactor:0.90,runFactor:0.93,lf:344,cf:407,rf:335,surface:'Grass'},
    32:{id:32,name:'American Family Field',team:'MIL',city:'Milwaukee',lat:43.0280,lon:-87.9712,alt:635,hrFactor:1.02,runFactor:1.01,lf:344,cf:400,rf:345,surface:'Grass'},
    2392:{id:2392,name:'Target Field',team:'MIN',city:'Minneapolis',lat:44.9817,lon:-93.2773,alt:815,hrFactor:0.97,runFactor:0.98,lf:339,cf:403,rf:328,surface:'Grass'},
    2394:{id:2394,name:'Citi Field',team:'NYM',city:'Queens',lat:40.7571,lon:-73.8458,alt:20,hrFactor:0.96,runFactor:0.97,lf:335,cf:408,rf:330,surface:'Grass'},
    2395:{id:2395,name:'Citizens Bank Park',team:'PHI',city:'Philadelphia',lat:39.9057,lon:-75.1665,alt:40,hrFactor:1.08,runFactor:1.05,lf:329,cf:401,rf:330,surface:'Grass'},
    2396:{id:2396,name:'PNC Park',team:'PIT',city:'Pittsburgh',lat:40.4469,lon:-80.0057,alt:725,hrFactor:0.93,runFactor:0.94,lf:325,cf:399,rf:320,surface:'Grass'},
    2397:{id:2397,name:'Petco Park',team:'SD',city:'San Diego',lat:32.7073,lon:-117.1573,alt:60,hrFactor:0.90,runFactor:0.92,lf:334,cf:396,rf:322,surface:'Grass'},
    2398:{id:2398,name:'T-Mobile Park',team:'SEA',city:'Seattle',lat:47.5914,lon:-122.3325,alt:10,hrFactor:0.92,runFactor:0.93,lf:331,cf:401,rf:326,surface:'Grass'},
    2399:{id:2399,name:'Oracle Park',team:'SF',city:'San Francisco',lat:37.7786,lon:-122.3893,alt:10,hrFactor:0.88,runFactor:0.91,lf:339,cf:399,rf:309,surface:'Grass'},
    2400:{id:2400,name:'Busch Stadium',team:'STL',city:'St. Louis',lat:38.6226,lon:-90.1928,alt:465,hrFactor:0.95,runFactor:0.96,lf:336,cf:400,rf:335,surface:'Grass'},
    2402:{id:2402,name:'Minute Maid Park',team:'HOU',city:'Houston',lat:29.7573,lon:-95.3555,alt:40,hrFactor:1.01,runFactor:1.00,lf:315,cf:409,rf:326,surface:'Grass'},
    2504:{id:2504,name:'Nationals Park',team:'WSH',city:'Washington',lat:38.8730,lon:-77.0074,alt:25,hrFactor:1.00,runFactor:1.00,lf:336,cf:402,rf:335,surface:'Grass'},
    2515:{id:2515,name:'Truist Park',team:'ATL',city:'Atlanta',lat:33.8908,lon:-84.4677,alt:1050,hrFactor:1.03,runFactor:1.02,lf:335,cf:400,rf:325,surface:'Grass'},
    2602:{id:2602,name:'Globe Life Field',team:'TEX',city:'Arlington',lat:32.7473,lon:-97.0842,alt:550,hrFactor:1.00,runFactor:1.01,lf:329,cf:407,rf:326,surface:'Turf'},
    2680:{id:2680,name:'Great American Ball Park',team:'CIN',city:'Cincinnati',lat:39.0979,lon:-84.5083,alt:490,hrFactor:1.10,runFactor:1.06,lf:328,cf:404,rf:325,surface:'Grass'},
    2681:{id:2681,name:'Comerica Park',team:'DET',city:'Detroit',lat:42.3390,lon:-83.0485,alt:600,hrFactor:0.96,runFactor:0.97,lf:345,cf:412,rf:330,surface:'Grass'},
    2689:{id:2689,name:'Oakland Coliseum',team:'ATH',city:'Oakland',lat:37.7516,lon:-122.2005,alt:20,hrFactor:0.91,runFactor:0.92,lf:330,cf:400,rf:330,surface:'Grass'},
    2889:{id:2889,name:'George M. Steinbrenner Field',team:'TB',city:'Tampa',lat:27.9800,lon:-82.5062,alt:45,hrFactor:0.98,runFactor:0.99,lf:318,cf:408,rf:314,surface:'Grass'},
    3209:{id:3209,name:'Daikin Park',team:'HOU',city:'Houston',lat:29.7573,lon:-95.3555,alt:40,hrFactor:1.01,runFactor:1.00,lf:315,cf:409,rf:326,surface:'Grass'},
    3312:{id:3312,name:'Sutter Health Park',team:'ATH',city:'West Sacramento',lat:38.5806,lon:-121.5131,alt:30,hrFactor:0.97,runFactor:0.98,lf:325,cf:403,rf:325,surface:'Grass'},
    3313:{id:3313,name:'Yankee Stadium',team:'NYY',city:'Bronx',lat:40.8300,lon:-73.9200,alt:55,hrFactor:1.11,runFactor:1.05,lf:318,cf:408,rf:314,surface:'Grass'}
  };

  const climateFallback = {
    'Anaheim': {4:{tempF:67,humidity:56,pressureInHg:29.96},5:{tempF:70,humidity:58,pressureInHg:29.93}},
    'Baltimore': {4:{tempF:61,humidity:55,pressureInHg:29.95},5:{tempF:70,humidity:58,pressureInHg:29.91}},
    'Boston': {4:{tempF:53,humidity:58,pressureInHg:29.98},5:{tempF:63,humidity:60,pressureInHg:29.92}},
    'Chicago': {4:{tempF:54,humidity:57,pressureInHg:29.97},5:{tempF:64,humidity:59,pressureInHg:29.90}},
    'Cleveland': {4:{tempF:55,humidity:58,pressureInHg:29.95},5:{tempF:65,humidity:60,pressureInHg:29.89}},
    'Kansas City': {4:{tempF:59,humidity:55,pressureInHg:29.92},5:{tempF:69,humidity:58,pressureInHg:29.88}},
    'Phoenix': {4:{tempF:79,humidity:27,pressureInHg:29.82},5:{tempF:88,humidity:22,pressureInHg:29.78}},
    'Denver': {4:{tempF:56,humidity:38,pressureInHg:24.90},5:{tempF:66,humidity:34,pressureInHg:24.84}},
    'Los Angeles': {4:{tempF:68,humidity:61,pressureInHg:29.92},5:{tempF:71,humidity:64,pressureInHg:29.89}},
    'Miami': {4:{tempF:80,humidity:69,pressureInHg:29.94},5:{tempF:84,humidity:71,pressureInHg:29.90}},
    'Milwaukee': {4:{tempF:52,humidity:58,pressureInHg:29.97},5:{tempF:63,humidity:60,pressureInHg:29.91}},
    'Minneapolis': {4:{tempF:50,humidity:55,pressureInHg:29.94},5:{tempF:62,humidity:57,pressureInHg:29.89}},
    'Queens': {4:{tempF:57,humidity:58,pressureInHg:29.97},5:{tempF:67,humidity:60,pressureInHg:29.91}},
    'Philadelphia': {4:{tempF:59,humidity:56,pressureInHg:29.96},5:{tempF:69,humidity:58,pressureInHg:29.90}},
    'Pittsburgh': {4:{tempF:56,humidity:58,pressureInHg:29.95},5:{tempF:67,humidity:60,pressureInHg:29.89}},
    'San Diego': {4:{tempF:66,humidity:66,pressureInHg:29.94},5:{tempF:68,humidity:69,pressureInHg:29.90}},
    'Seattle': {4:{tempF:56,humidity:67,pressureInHg:30.02},5:{tempF:62,humidity:66,pressureInHg:29.97}},
    'San Francisco': {4:{tempF:60,humidity:68,pressureInHg:30.01},5:{tempF:63,humidity:70,pressureInHg:29.97}},
    'St. Louis': {4:{tempF:61,humidity:57,pressureInHg:29.93},5:{tempF:72,humidity:60,pressureInHg:29.88}},
    'Washington': {4:{tempF:63,humidity:55,pressureInHg:29.95},5:{tempF:73,humidity:59,pressureInHg:29.89}},
    'Atlanta': {4:{tempF:68,humidity:58,pressureInHg:29.93},5:{tempF:76,humidity:61,pressureInHg:29.88}},
    'Arlington': {4:{tempF:73,humidity:55,pressureInHg:29.86},5:{tempF:81,humidity:58,pressureInHg:29.82}},
    'Cincinnati': {4:{tempF:59,humidity:57,pressureInHg:29.94},5:{tempF:70,humidity:60,pressureInHg:29.88}},
    'Detroit': {4:{tempF:55,humidity:50,pressureInHg:29.97},5:{tempF:66,humidity:56,pressureInHg:29.91}},
    'Oakland': {4:{tempF:62,humidity:64,pressureInHg:30.01},5:{tempF:65,humidity:67,pressureInHg:29.97}},
    'Tampa': {4:{tempF:78,humidity:64,pressureInHg:29.95},5:{tempF:83,humidity:67,pressureInHg:29.90}},
    'West Sacramento': {4:{tempF:67,humidity:56,pressureInHg:29.96},5:{tempF:75,humidity:52,pressureInHg:29.91}},
    'Bronx': {4:{tempF:57,humidity:58,pressureInHg:29.97},5:{tempF:67,humidity:60,pressureInHg:29.91}}
  };

  function stripAccents(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function normalizeName(value) {
    return stripAccents(String(value || ''))
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/Demon|Goblin|Trending/gi, ' ')
      .replace(/\b\d+(?:\.\d+)?K\b/gi, ' ')
      .replace(/[^a-zA-Z0-9 .'-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }
  function normalizeTeamAbbr(input) {
    const clean = stripAccents(String(input || '')).trim();
    if (!clean) return null;
    const upper = clean.toUpperCase();
    if (TEAM_ABBR_TO_ID[upper]) return upper === 'KCR' ? 'KC' : upper === 'SDP' ? 'SD' : upper === 'SFG' ? 'SF' : upper === 'TBR' ? 'TB' : upper === 'WAS' ? 'WSH' : upper === 'OAK' ? 'ATH' : upper === 'CHW' ? 'CWS' : upper;
    return TEAM_NAME_TO_ABBR[clean.toLowerCase()] || null;
  }
  function round2(value) { const n = Number(value); return Number.isFinite(n) ? Number(n.toFixed(2)) : null; }
  const forceAvg = (val, divisor) => (Number(divisor) > 0 ? Number((Number(val || 0) / Number(divisor)).toFixed(2)) : 0);
  const calcAvg = (val, games) => forceAvg(val, games);
  const safeDiv = (num, den, mult = 1) => {
    const n = Number(num || 0);
    const d = Number(den || 0);
    return d > 0 ? round2((n / d) * mult) : null;
  };
  function calculateRates(seasonStats = {}, logs = [], fallback = {}) {
    const gamesPitched = Number(seasonStats?.gamesPitched || seasonStats?.gamesStarted || seasonStats?.gamesPlayed || 0);
    const strikeOuts = Number(seasonStats?.strikeOuts || 0);
    const groundOuts = Number(seasonStats?.groundOuts || 0);
    const airOuts = Number(seasonStats?.airOuts || 0);
    const battersFaced = Number(seasonStats?.battersFaced || seasonStats?.plateAppearances || 0);
    const walks = Number(seasonStats?.baseOnBalls || 0);
    const homeRuns = Number(seasonStats?.homeRuns || 0);
    const inningsPitched = Number(seasonStats?.inningsPitched || 0);
    const pitchesThrown = Number(seasonStats?.numberOfPitches || seasonStats?.pitchesThrown || 0);
    const gbPct = (groundOuts + airOuts) > 0 ? safeDiv(groundOuts, groundOuts + airOuts, 100) : round2(Number(seasonStats?.groundBallPercentage));
    return {
      seasonAvg: calcAvg(strikeOuts, gamesPitched || (Array.isArray(logs) ? logs.length : 0)),
      kRate: battersFaced > 0 ? safeDiv(strikeOuts, battersFaced, 100) : round2(Number(seasonStats?.strikeOutRate || seasonStats?.strikeOutsPerPlateAppearance) * 100),
      bbRate: battersFaced > 0 ? safeDiv(walks, battersFaced, 100) : round2(Number(seasonStats?.walkRate || seasonStats?.baseOnBallsPerPlateAppearance) * 100),
      hrPer9: inningsPitched > 0 ? safeDiv(homeRuns, inningsPitched, 9) : round2(Number(fallback?.hrPer9)),
      groundBallPct: gbPct,
      pitchesPerInning: inningsPitched > 0 ? safeDiv(pitchesThrown, inningsPitched, 1) : round2(Number(fallback?.pitchesPerInning))
    };
  }
  const calcTrends = (gameLog, lineValue, propKey) => manualTrendReducer(gameLog, lineValue, propKey);
  function avg(values) { const clean = (values || []).filter(v => Number.isFinite(v)); return clean.length ? round2(clean.reduce((a,b)=>a+b,0)/clean.length) : null; }
  function median(values) { const clean=(values||[]).filter(v=>Number.isFinite(v)).sort((a,b)=>a-b); if(!clean.length) return null; const mid=Math.floor(clean.length/2); return clean.length%2?clean[mid]:round2((clean[mid-1]+clean[mid])/2); }
  function standardDeviation(values){ const clean=(values||[]).filter(v=>Number.isFinite(v)); if(!clean.length) return null; const mean=clean.reduce((a,b)=>a+b,0)/clean.length; return round2(Math.sqrt(clean.reduce((s,v)=>s+Math.pow(v-mean,2),0)/clean.length)); }
  function sanitizeForVault(value, depth=0) {
    if (depth > 5) return null;
    if (value == null) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? round2(value) : null;
    if (typeof value === 'string') return value.slice(0, 1200);
    if (typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.slice(0, 50).map(v => sanitizeForVault(v, depth+1));
    if (typeof value === 'object') {
      const out = {};
      Object.keys(value).slice(0, 80).forEach(key => {
        const cleaned = sanitizeForVault(value[key], depth+1);
        if (cleaned !== undefined) out[key] = cleaned;
      });
      return out;
    }
    return String(value);
  }
  async function safeFetchJson(url, options = {}) {
    const timeout = options.timeout || 12000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { method: 'GET', signal: controller.signal, headers: Object.assign({ 'Accept': 'application/json, text/plain, */*' }, options.headers || {}) });
      clearTimeout(timer);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      clearTimeout(timer);
      return null;
    }
  }
  function dateRangeLast15(baseIso) {
    const end = baseIso ? new Date(baseIso) : new Date();
    const start = new Date(end.getTime() - 14 * 24 * 60 * 60 * 1000);
    const f = d => d.toISOString().slice(0,10);
    return { start: f(start), end: f(end) };
  }
  function mapTeamToId(team) { return TEAM_ABBR_TO_ID[normalizeTeamAbbr(team)] || null; }
  function getMonthFromIso(iso) { const d = iso ? new Date(iso) : new Date(); return Number.isFinite(d.getTime()) ? d.getUTCMonth() + 1 : (new Date().getUTCMonth() + 1); }
  function fuzzyVenueMatch(inputName, candidateName) {
    const a = String(inputName || '').toLowerCase().trim();
    const b = String(candidateName || '').toLowerCase().trim();
    if (!a || !b) return false;
    return a === b || a.includes(b) || b.includes(a);
  }
  function getVenueFromContext(scheduleCtx = {}, row = {}) {
    if (scheduleCtx.venueId && stadiumLibrary[scheduleCtx.venueId]) return stadiumLibrary[scheduleCtx.venueId];
    const normalizedVenueInput = String(scheduleCtx.venueName || row.venueName || '').toLowerCase().trim();
    if (normalizedVenueInput) {
      const byVenueName = Object.values(stadiumLibrary).find(v => fuzzyVenueMatch(normalizedVenueInput, String(v.name || '').toLowerCase().trim()));
      if (byVenueName) return byVenueName;
    }
    const team = normalizeTeamAbbr(scheduleCtx.team || row.team);
    const byTeam = Object.values(stadiumLibrary).find(v => String(v.team || '').toUpperCase().trim() === String(team || '').toUpperCase().trim());
    return byTeam || null;
  }
  function defaultBranch(key, note='MINING_INTERRUPTED') {
    return { key, status: 'MINING_INTERRUPTED', sourceMode: 'MINING_INTERRUPTED', source: 'Unavailable', note, factorsFound: 0, factorsTarget: FACTOR_TARGETS[key], parsed: {}, apiPayload: 'MINING_INTERRUPTED' };
  }
  function finalizeBranch(key, status, sourceMode, source, parsed, apiPayload, note='') {
    const found = Object.entries(parsed || {}).filter(([k, v]) => {
      if (key === 'E' && (k === 'bookmaker' || k === 'note')) return false;
      if (v == null || v === '') return false;
      return typeof v === 'number' || typeof v === 'string';
    }).length;
    return { key, status, sourceMode, source, note, factorsFound: key === 'E' ? Math.min(found, 12) : found, factorsTarget: FACTOR_TARGETS[key], parsed, apiPayload: sanitizeForVault(apiPayload) };
  }
  async function handednessLock(personId, row = {}, scheduleCtx = {}) {
    try {
      const payload = await safeFetchJson(`https://statsapi.mlb.com/api/v1/people/${personId}`, { timeout: 3000 });
      const person = Array.isArray(payload?.people) ? payload.people[0] : payload?.person || payload || {};
      const apiHand = String(person?.pitchHand?.code || person?.pitchHand?.description || '').toUpperCase();
      if (apiHand.startsWith('L')) return 'L';
      if (apiHand.startsWith('R')) return 'R';
    } catch {}
    const rowRole = String(row?.teamRole || row?.parsedPlayer || scheduleCtx?.teamRole || '').toUpperCase();
    if (rowRole.includes(' LHP') || rowRole.includes('(L)') || rowRole.includes(' LEFT')) return 'L';
    return 'R';
  }

  function handednessMatcher(splitEntries, pitcherHand = 'R') {
    const wanted = String(pitcherHand || 'R').toUpperCase().startsWith('L') ? 'vs left' : 'vs right';
    const clean = (value) => String(value || '').toLowerCase().trim();
    const found = (Array.isArray(splitEntries) ? splitEntries : []).find(split => {
      const display = clean(split?.stat?.group?.displayName || split?.split?.group?.displayName || split?.split?.displayName || split?.split?.name || split?.label);
      return display === wanted || display.includes(wanted);
    });
    return found || null;
  }

  function propKeyForRow(row) {
    const raw = String(row?.propKey || row?.prop || '').trim().toLowerCase();
    const map = {
      'tb':'totalBases','total bases':'totalBases','totalbases':'totalBases',
      'ks':'strikeOuts','strikeouts':'strikeOuts',
      'h+r+rbi':'hitsRunsRbis','hits+runs+rbis':'hitsRunsRbis','hitsrunsrbis':'hitsRunsRbis',
      'runs':'runs','hits':'hits','rbi':'rbi',
      'po':'pitchingOuts','pitching outs':'pitchingOuts','pitchingouts':'pitchingOuts',
      'er':'earnedRuns','earned runs':'earnedRuns','earnedruns':'earnedRuns',
      'hits allowed':'hitsAllowed','hitsallowed':'hitsAllowed',
      'walks allowed':'walksAllowed','walksallowed':'walksAllowed'
    };
    return map[raw] || map[raw.replace(/[^a-z+ ]/g,'').trim()] || 'totalBases';
  }
  function inningsToOuts(ip) {
    if (ip == null || ip === '') return null;
    const parts = String(ip).split('.');
    const whole = Number(parts[0] || 0); const frac = Number(parts[1] || 0);
    return Number.isFinite(whole) ? whole * 3 + Math.min(frac, 2) : null;
  }
  function valueFromMlbGame(game, propKey) {
    const stat = game?.stat || game || {};
    switch (propKey) {
      case 'strikeOuts': return Number(stat.strikeOuts);
      case 'totalBases': return Number(stat.totalBases);
      case 'hitsRunsRbis': return Number(stat.hits || 0) + Number(stat.runs || 0) + Number(stat.rbi || 0);
      case 'runs': return Number(stat.runs);
      case 'hits': return Number(stat.hits);
      case 'rbi': return Number(stat.rbi);
      case 'pitchingOuts': return inningsToOuts(stat.inningsPitched ?? stat.ip ?? stat.outs);
      case 'earnedRuns': return Number(stat.earnedRuns);
      case 'hitsAllowed': return Number(stat.hits);
      case 'walksAllowed': return Number(stat.baseOnBalls ?? stat.walks);
      default: return null;
    }
  }
  function parseMlbStatsPayload(payload) {
    const stats = Array.isArray(payload?.stats) ? payload.stats : [];
    const season = stats.find(s => String(s.type?.displayName || '').toLowerCase().includes('season'));
    const gameLog = stats.find(s => String(s.type?.displayName || '').toLowerCase().includes('game log'));
    const career = stats.find(s => String(s.type?.displayName || '').toLowerCase().includes('career'));
    const expectedStatistics = StatcastRoomFinder(payload, 'expectedStatistics') || findGroupStat(payload, 'expectedStatistics');
    const statcast50ft = StatcastRoomFinder(payload, 'statcast50ft') || findGroupStat(payload, 'statcast50ft');
    return {
      seasonStats: season?.splits?.[0]?.stat || {},
      logs: (gameLog?.splits || []).map(split => ({
        stat: split?.stat || {},
        isHome: Boolean(split?.isHome),
        dayNight: String(split?.game?.dayNight || '').toLowerCase(),
        gameDate: split?.date,
        opponent: split?.opponent?.abbreviation || '',
        venue: split?.venue?.name || '',
        team: split?.team?.abbreviation || ''
      })),
      careerStats: career?.splits?.[0]?.stat || {},
      expectedStats: expectedStatistics?.splits?.[0]?.stat || {},
      statcast50ftStats: statcast50ft?.splits?.[0]?.stat || {}
    };
  }
  
  function StatcastRoomFinder(payload, targetName) {
    const stats = Array.isArray(payload?.stats) ? payload.stats : [];
    const wanted = String(targetName || '').toLowerCase().replace(/\s+/g, '').trim();
    for (const entry of stats) {
      const groupName = String(entry?.group?.name || entry?.group?.displayName || '').toLowerCase().replace(/\s+/g, '').trim();
      if (groupName === wanted) return entry;
    }
    for (const entry of stats) {
      const typeName = String(entry?.type?.displayName || '').toLowerCase().replace(/\s+/g, '').trim();
      if (typeName === wanted) return entry;
    }
    return null;
  }

function findGroupStat(payload, targetName) {
  const stats = Array.isArray(payload?.stats) ? payload.stats : [];
  const wanted = String(targetName || '').toLowerCase().replace(/\s+/g, '').trim();
  for (const stat of stats) {
    const groupName = String(stat?.group?.name || stat?.group?.displayName || '').toLowerCase().replace(/\s+/g, '').trim();
    const typeName = String(stat?.type?.displayName || '').toLowerCase().replace(/\s+/g, '').trim();
    if (groupName === wanted || typeName === wanted) return stat;
  }
  return null;
}
function recursiveSeek(obj, targetKey, options = {}) {
  const allowZero = Boolean(options.allowZero);
  const seen = new WeakSet();
  const walk = (node) => {
    if (node == null || typeof node !== 'object') return undefined;
    if (seen.has(node)) return undefined;
    seen.add(node);
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = walk(item);
        if (found !== undefined) return found;
      }
      return undefined;
    }
    if (Object.prototype.hasOwnProperty.call(node, targetKey)) {
      const val = node[targetKey];
      const num = Number(val);
      if (allowZero) {
        if (val !== undefined && val !== null && val !== '') return val;
      } else if ((Number.isFinite(num) && num !== 0) || (!Number.isFinite(num) && val !== undefined && val !== null && val !== '')) {
        return val;
      }
    }
    for (const value of Object.values(node)) {
      const found = walk(value);
      if (found !== undefined) return found;
    }
    return undefined;
  };
  return walk(obj);
}
const pickNum = (...vals) => {
  for (const val of vals) {
    const num = Number(val);
    if (Number.isFinite(num)) return num;
  }
  return null;
};
function mergeQualifiedStats(...candidates) {
  const keys = ['xba','xwoba','xslg','avgExitVelocity','barrelPct','hardHitPct','whiffPct','velocityDelta'];
  const out = {};
  for (const key of keys) {
    for (const candidate of candidates) {
      const val = candidate?.[key];
      const num = Number(val);
      if ((Number.isFinite(num) && num !== 0) || (!Number.isFinite(num) && val !== undefined && val !== null && val !== '')) {
        out[key] = Number.isFinite(num) ? round2(num) : val;
        break;
      }
    }
    if (out[key] === undefined) out[key] = null;
  }
  return out;
}
function deepMergeOxy(...results) {
  return mergeQualifiedStats(...results);
}
function promoteBatteryStats(baseStats = {}, expectedMapped = {}, statcastMapped = {}) {
  const promoted = Object.assign({}, baseStats || {});
  const writeIfQualified = (key, candidate) => {
    const num = Number(candidate);
    if (Number.isFinite(num) && num !== 0) promoted[key] = round2(num);
    else if (!Number.isFinite(num) && candidate !== undefined && candidate !== null && candidate !== '') promoted[key] = candidate;
  };
  ['xba','xwoba','xslg'].forEach(key => writeIfQualified(key, expectedMapped?.[key]));
  ['avgExitVelocity','barrelPct','hardHitPct','whiffPct','velocityDelta'].forEach(key => writeIfQualified(key, statcastMapped?.[key]));
  return promoted;
}
function manualTrendReducer(gameLog, lineValue, propKey) {
  const recent = (Array.isArray(gameLog) ? gameLog : [])
    .slice()
    .sort((a, b) => new Date(b?.gameDate || b?.date || 0) - new Date(a?.gameDate || a?.date || 0));
  const reduceAvg = (count) => {
    const slice = recent.slice(0, Math.max(0, Number(count) || 0));
    if (!slice.length) return null;
    const total = slice.reduce((acc, game) => acc + Number(valueFromMlbGame(game, propKey) || 0), 0);
    return round2(total / slice.length);
  };
  const threshold = Number(lineValue);
  const hitRateOverLine = Number.isFinite(threshold) && recent.length
    ? round2((recent.reduce((acc, game) => acc + (Number(valueFromMlbGame(game, propKey) || 0) > threshold ? 1 : 0), 0) / recent.length) * 100)
    : null;
  return { l5: reduceAvg(5), l10: reduceAvg(10), l20: reduceAvg(20), hitRateOverLine, samples: recent.length };
}
function getTrend(gameLog, count, propKey) {
  return manualTrendReducer(gameLog, null, propKey)[`l${count}`] ?? null;
}
function processLogs(logs, propKey, lineValue) {
  const mapped = (logs || []).map(g => ({
    value: valueFromMlbGame(g, propKey),
    isHome: Boolean(g.isHome),
    dayNight: String(g.dayNight || '').toLowerCase(),
    date: g.gameDate,
    strikeOuts: Number(g?.stat?.strikeOuts || 0)
  })).filter(g => Number.isFinite(g.value));
  const values = mapped.map(g => g.value);
  const recent = mapped.slice().sort((a,b) => new Date(b.date||0) - new Date(a.date||0));
  const trends = manualTrendReducer(logs, lineValue, propKey);
  try { (window.PickCalcCore?.state?.ingestLogs || []).push({ level: 'success', text: `[REDUCER] Calculated Trends for ${row?.parsedPlayer || 'player'}` }); } catch (_) {}
  const home = avg(mapped.filter(g => g.isHome).map(g => g.value));
  const away = avg(mapped.filter(g => !g.isHome).map(g => g.value));
  const day = avg(mapped.filter(g => g.dayNight === 'day').map(g => g.value));
  const night = avg(mapped.filter(g => g.dayNight !== 'day').map(g => g.value));
  let restDays = null;
  if (recent.length > 1 && recent[0].date && recent[1].date) {
    restDays = round2((new Date(recent[0].date) - new Date(recent[1].date)) / 86400000);
  }
  return { seasonAvg: avg(values), l5: trends.l5, l10: trends.l10, l20: trends.l20, homeAvg: home, awayAvg: away, dayAvg: day, nightAvg: night, standardDeviation: standardDeviation(values), median: median(values), hitRateOverLine: trends.hitRateOverLine, restDays, samples: trends.samples || mapped.length };
}

async function identityRacerPro(row) {
    const teamId = mapTeamToId(row.team);
    const jersey = String(row.jersey || '').trim();
    const position = String(row.position || '').trim().toUpperCase();
    const playerQuery = normalizeName(row.parsedPlayer || row.player || '');
    const searchUrl = `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(row.parsedPlayer || '')}`;
    const search = await safeFetchJson(searchUrl, { timeout: 9000 });
    const candidates = Array.isArray(search?.people) ? search.people : [];
    const activeCandidates = candidates.filter(p => p?.active === true);
    const exact = activeCandidates.find(p => normalizeName(p.fullName) === playerQuery && (!teamId || p.currentTeam?.id === teamId))
      || candidates.find(p => normalizeName(p.fullName) === playerQuery && (!teamId || p.currentTeam?.id === teamId));
    const partial = activeCandidates.find(p => normalizeName(p.fullName).includes(playerQuery) || playerQuery.includes(normalizeName(p.fullName)))
      || candidates.find(p => normalizeName(p.fullName).includes(playerQuery) || playerQuery.includes(normalizeName(p.fullName)));
    if (exact || partial) {
      const pick = exact || partial;
      return { live: true, source: 'StatsAPI Search', personId: Number(pick.id), resolvedName: pick.fullName || row.parsedPlayer, teamId: pick.currentTeam?.id || teamId || null, jersey: pick.primaryNumber || jersey || '', position: pick.primaryPosition?.abbreviation || position || '', searchPayload: search };
    }
    if (teamId) {
      const roster = await safeFetchJson(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster`, { timeout: 9000 });
      const rosterList = Array.isArray(roster?.roster) ? roster.roster : [];
      const rosterMatch = rosterList.find(p => {
        const full = normalizeName(p.person?.fullName || '');
        const jerseyOk = jersey ? String(p.jerseyNumber || '') === jersey : false;
        const posOk = position ? String(p.position?.abbreviation || '').toUpperCase() === position : false;
        return full === playerQuery || (full.includes(playerQuery) && (jerseyOk || posOk || !jersey && !position));
      }) || rosterList.find(p => normalizeName(p.person?.fullName || '') === playerQuery);
      if (rosterMatch) {
        return { live: false, source: 'Roster Failover', personId: Number(rosterMatch.person?.id), resolvedName: rosterMatch.person?.fullName || row.parsedPlayer, teamId, jersey: rosterMatch.jerseyNumber || jersey || '', position: rosterMatch.position?.abbreviation || position || '', rosterPayload: roster };
      }
    }
    return { live: false, source: 'Identity Failed', personId: null, resolvedName: row.parsedPlayer || '', teamId, jersey, position, searchPayload: search || null };
  }
  async function getScheduleContext(row) {
    const baseDate = row?.gameTimeISO ? new Date(row.gameTimeISO) : new Date();
    const dateStr = Number.isFinite(baseDate.getTime()) ? baseDate.toISOString().slice(0,10) : new Date().toISOString().slice(0,10);
    const schedule = await safeFetchJson(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${dateStr}`, { timeout: 10000 });
    const team = normalizeTeamAbbr(row.team); const opp = normalizeTeamAbbr(row.opponent);
    const games = (schedule?.dates || []).flatMap(d => d.games || []);
    const match = games.find(g => {
      const home = normalizeTeamAbbr(g.teams?.home?.team?.abbreviation || g.teams?.home?.team?.name);
      const away = normalizeTeamAbbr(g.teams?.away?.team?.abbreviation || g.teams?.away?.team?.name);
      return (home === team && away === opp) || (home === opp && away === team);
    }) || null;
    const homeAbbr = normalizeTeamAbbr(match?.teams?.home?.team?.abbreviation || match?.teams?.home?.team?.name);
    const awayAbbr = normalizeTeamAbbr(match?.teams?.away?.team?.abbreviation || match?.teams?.away?.team?.name);
    const isHome = match ? homeAbbr === team : null;
    const venueRecord = getVenueFromContext({ venueId: match?.venue?.id || null, venueName: match?.venue?.name || '', team, opponent: opp }, row);
    return {
      selectedDate: dateStr,
      schedulePayload: schedule || null,
      gamePk: match?.gamePk || null,
      venueId: match?.venue?.id || venueRecord?.id || null,
      venueName: String(match?.venue?.name || venueRecord?.name || '').toLowerCase().trim(),
      lat: venueRecord?.lat || null,
      lon: venueRecord?.lon || null,
      team,
      teamId: match ? (isHome ? match?.teams?.home?.team?.id : match?.teams?.away?.team?.id) || mapTeamToId(team) : mapTeamToId(team),
      opponent: opp,
      opponentId: parseInt(match ? ((isHome ? match?.teams?.away?.team?.id : match?.teams?.home?.team?.id) || mapTeamToId(opp)) : mapTeamToId(opp), 10) || null,
      homeTeam: homeAbbr,
      awayTeam: awayAbbr,
      gameTimeISO: match?.gameDate || row?.gameTimeISO || null,
      isHome
    };
  }

  
async function branchA(row, scheduleCtx) {
  const identity = await identityRacerPro(row);
  try {
    const profile = await safeFetchJson(`https://statsapi.mlb.com/api/v1/people/${identity.personId}`, { timeout: 3000 });
    const person = Array.isArray(profile?.people) ? profile.people[0] : null;
    identity.pitchHand = String(person?.pitchHand?.code || '').toUpperCase().startsWith('L') ? 'L' : 'R';
  } catch {}
  if (!identity.personId) {
    return finalizeBranch('A', 'DERIVED', 'DERIVED', identity.source, {
      personId: 'UNRESOLVED',
      resolvedName: identity.resolvedName || row.parsedPlayer,
      identityMode: identity.source,
      sourceYear: null,
      seasonAvg: round2(Number(row.line || row.lineValue || 0)),
      l5: null, l10: null, l20: null, hitRateOverLine: null,
      samples: 0
    }, { identity }, 'Identity unresolved');
  }

  scheduleCtx.personId = identity.personId;
  if (identity?.pitchHand && !scheduleCtx?.pitchHand) scheduleCtx.pitchHand = identity.pitchHand;
  const propKey = propKeyForRow(row);
  const threshold = Number(row.lineValue ?? row.line);

  async function fetchPayload(url) {
    const started = Date.now();
    const payload = await safeFetchJson(url, { timeout: 3000 });
    return { payload, latency: Date.now() - started, url };
  }

  function mapSeasonStats(corePayload) {
    const parsed = parseMlbStatsPayload(corePayload || {});
    const seasonStats = parsed.seasonStats || {};
    const careerStats = parsed.careerStats || {};
    const logs = parsed.logs || [];
    const rates = calculateRates(seasonStats, logs, {});
    const trends = manualTrendReducer(logs, threshold, propKey);
    const gamesPitched = Number(seasonStats?.gamesPitched || seasonStats?.gamesPlayed || trends.samples || 0);
    const careerGames = Number(careerStats?.gamesPitched || careerStats?.gamesPlayed || 0);
    return {
      seasonStats,
      careerStats,
      logs,
      derived: {
        seasonAvg: calcAvg(seasonStats?.strikeOuts, gamesPitched),
        careerBaseline: calcAvg(careerStats?.strikeOuts, careerGames),
        kRate: rates.kRate,
        bbRate: rates.bbRate,
        hrPer9: Number(Number(seasonStats?.inningsPitched || 0) > 0 ? ((Number(seasonStats?.homeRuns || 0) / Number(seasonStats?.inningsPitched || 1)) * 9).toFixed(2) : 0),
        groundBallPct: Number(((Number(seasonStats?.groundOuts || 0) + Number(seasonStats?.airOuts || 0)) > 0 ? ((Number(seasonStats?.groundOuts || 0) / (Number(seasonStats?.groundOuts || 0) + Number(seasonStats?.airOuts || 0))) * 100).toFixed(2) : 0)),
        pitchesPerInning: rates.pitchesPerInning,
        l5: trends.l5,
        l10: trends.l10,
        l20: trends.l20,
        hitRateOverLine: trends.hitRateOverLine,
        samples: trends.samples || logs.length
      }
    };
  }

  function mapBatteryPayload(payload, groupName) {
    const room = StatcastRoomFinder(payload, groupName) || findGroupStat(payload, groupName) || {};
    const stat = room?.splits?.[0]?.stat || {};
    if (groupName === 'expectedStatistics') {
      return {
        xba: pickNum(stat?.expectedBattingAverage, recursiveSeek(room, 'expectedBattingAverage'), recursiveSeek(payload, 'expectedBattingAverage')),
        xwoba: pickNum(stat?.expectedWeightedOnBaseAverage, recursiveSeek(room, 'expectedWeightedOnBaseAverage'), recursiveSeek(payload, 'expectedWeightedOnBaseAverage')),
        xslg: pickNum(stat?.expectedSlugging, recursiveSeek(room, 'expectedSlugging'), recursiveSeek(payload, 'expectedSlugging'))
      };
    }
    if (groupName === 'statcast50ft') {
      return {
        avgExitVelocity: pickNum(stat?.avgExitVelocity, recursiveSeek(room, 'avgExitVelocity'), recursiveSeek(payload, 'avgExitVelocity')),
        barrelPct: pickNum(stat?.barrelPercentage, recursiveSeek(room, 'barrelPercentage'), recursiveSeek(payload, 'barrelPercentage')),
        hardHitPct: pickNum(stat?.hardHitRate, recursiveSeek(room, 'hardHitRate'), recursiveSeek(payload, 'hardHitRate')),
        whiffPct: pickNum(stat?.whiffPercentage, recursiveSeek(room, 'whiffPercentage'), recursiveSeek(payload, 'whiffPercentage')),
        velocityDelta: pickNum(stat?.velocityDelta, recursiveSeek(room, 'velocityDelta'))
      };
    }
    return {};
  }


  async function DeepHistoryProbe() {
    const probeYears = [2026, 2025, 2024, 2023];
    const history = [];
    for (const probeYear of probeYears) {
      const snap = await runOxyBattery(probeYear);
      history.push(snap);
      const hasAdvanced = ['xba','xwoba','xslg','avgExitVelocity','barrelPct','hardHitPct','whiffPct'].some((key) => {
        const value = Number(snap?.merged?.[key]);
        return Number.isFinite(value) && value !== 0;
      });
      const hasSeason = Number(snap?.derived?.seasonAvg || 0) > 0 || Number(snap?.derived?.samples || 0) > 0;
      if (hasAdvanced || hasSeason) return { chosen: snap, history };
    }
    return { chosen: history[0] || null, history };
  }


  async function runOxyBattery(year) {
    const probes = [
      { key: 'seasonLive', url: `https://statsapi.mlb.com/api/v1/people/${identity.personId}/stats?stats=season&group=pitching&season=${year}` },
      { key: 'expectedLive', url: `https://statsapi.mlb.com/api/v1/people/${identity.personId}/stats?stats=expectedStatistics&group=pitching&season=${year}` },
      { key: 'statcastLive', url: `https://statsapi.mlb.com/api/v1/people/${identity.personId}/stats?stats=statcast50ft&group=pitching&season=${year}` },
      { key: 'gameLogLive', url: `https://statsapi.mlb.com/api/v1/people/${identity.personId}/stats?stats=gameLog&group=pitching&season=${year}` },
      { key: 'careerLive', url: `https://statsapi.mlb.com/api/v1/people/${identity.personId}/stats?stats=career&group=pitching&season=${year}` },
      { key: 'seasonPivotPrev1', url: `https://statsapi.mlb.com/api/v1/people/${identity.personId}/stats?stats=season&group=pitching&season=${year - 1}` },
      { key: 'expectedPivotPrev1', url: `https://statsapi.mlb.com/api/v1/people/${identity.personId}/stats?stats=expectedStatistics&group=pitching&season=${year - 1}` },
      { key: 'statcastPivotPrev1', url: `https://statsapi.mlb.com/api/v1/people/${identity.personId}/stats?stats=statcast50ft&group=pitching&season=${year - 1}` },
      { key: 'seasonFallbackPrev2', url: `https://statsapi.mlb.com/api/v1/people/${identity.personId}/stats?stats=season&group=pitching&season=${year - 2}` },
      { key: 'expectedFallbackPrev2', url: `https://statsapi.mlb.com/api/v1/people/${identity.personId}/stats?stats=expectedStatistics&group=pitching&season=${year - 2}` },
      { key: 'statcastFallbackPrev2', url: `https://statsapi.mlb.com/api/v1/people/${identity.personId}/stats?stats=statcast50ft&group=pitching&season=${year - 2}` }
    ];
    const oxyBattery = await Promise.allSettled(probes.map(probe => fetchPayload(probe.url)));
    const unpack = (idx) => oxyBattery[idx]?.status === 'fulfilled' ? oxyBattery[idx].value : { payload: null, latency: 0, url: probes[idx].url };
    const seasonRes = unpack(0);
    const expectedRes = unpack(1);
    const statcastRes = unpack(2);
    const gameLogRes = unpack(3);
    const careerRes = unpack(4);
    const season25Res = unpack(5);
    const expected25Res = unpack(6);
    const statcast25Res = unpack(7);
    const season24Res = unpack(8);
    const expected24Res = unpack(9);
    const statcast24Res = unpack(10);

    const liveSeason = parseMlbStatsPayload(seasonRes.payload || {});
    const liveLog = parseMlbStatsPayload(gameLogRes.payload || {});
    const liveCareer = parseMlbStatsPayload(careerRes.payload || {});
    const season25 = parseMlbStatsPayload(season25Res.payload || {});
    const season24 = parseMlbStatsPayload(season24Res.payload || {});

    const liveAdvanced = deepMergeOxy(mapBatteryPayload(expectedRes.payload, 'expectedStatistics'), mapBatteryPayload(statcastRes.payload, 'statcast50ft'));
    const pivotAdvanced = deepMergeOxy(mapBatteryPayload(expected25Res.payload, 'expectedStatistics'), mapBatteryPayload(statcast25Res.payload, 'statcast50ft'));
    const fallbackAdvanced = deepMergeOxy(mapBatteryPayload(expected24Res.payload, 'expectedStatistics'), mapBatteryPayload(statcast24Res.payload, 'statcast50ft'));
    const merged = deepMergeOxy(liveAdvanced, pivotAdvanced, fallbackAdvanced);

    const oxySource = {};
    ['xba','xwoba','xslg','avgExitVelocity','barrelPct','hardHitPct','whiffPct','velocityDelta'].forEach((key) => {
      const ordered = [
        ['expectedLive/statcastLive', liveAdvanced?.[key]],
        ['expectedPivotPrev1/statcastPivotPrev1', pivotAdvanced?.[key]],
        ['expectedFallbackPrev2/statcastFallbackPrev2', fallbackAdvanced?.[key]]
      ];
      oxySource[key] = '[NOT_IN_STATSAPI]';
      for (const [label, value] of ordered) {
        const num = Number(value);
        if ((Number.isFinite(num) && num !== 0) || (!Number.isFinite(num) && value !== undefined && value !== null && value !== '')) {
          oxySource[key] = label;
          break;
        }
      }
    });

    const seasonStats = liveSeason.seasonStats || season25.seasonStats || season24.seasonStats || {};
    const careerStats = liveCareer.careerStats || {};
    const logs = liveLog.logs?.length ? liveLog.logs : (liveSeason.logs?.length ? liveSeason.logs : [ ...(season25.logs || []), ...(season24.logs || []) ]);
    const rates = calculateRates(seasonStats, logs, {
      hrPer9: calculateRates(season25.seasonStats || season24.seasonStats || {}, season25.logs || season24.logs || []).hrPer9,
      pitchesPerInning: calculateRates(season25.seasonStats || season24.seasonStats || {}, season25.logs || season24.logs || []).pitchesPerInning
    });
    const trends = calcTrends(logs, threshold, propKey);

    return {
      year,
      probes,
      oxyBattery,
      seasonPayload: seasonRes.payload,
      expectedPayload: expectedRes.payload,
      statcastPayload: statcastRes.payload,
      gameLogPayload: gameLogRes.payload,
      careerPayload: careerRes.payload,
      seasonStats,
      careerStats,
      logs,
      merged,
      oxySource,
      derived: {
        seasonAvg: rates.seasonAvg,
        careerBaseline: calcAvg(careerStats?.strikeOuts, careerStats?.gamesPitched || careerStats?.gamesStarted || careerStats?.gamesPlayed),
        kRate: rates.kRate,
        bbRate: rates.bbRate,
        hrPer9: rates.hrPer9,
        groundBallPct: rates.groundBallPct,
        pitchesPerInning: rates.pitchesPerInning,
        l5: trends.l5,
        l10: trends.l10,
        l20: trends.l20,
        hitRateOverLine: trends.hitRateOverLine,
        samples: trends.samples
      },
      latencies: probes.reduce((acc, probe, idx) => { acc[probe.key] = unpack(idx).latency || 0; return acc; }, {})
    };
  }

  const isHollow = (snapshot) => {
    const ev = Number(snapshot?.merged?.avgExitVelocity);
    const xw = Number(snapshot?.merged?.xwoba);
    const brl = Number(snapshot?.merged?.barrelPct);
    return !snapshot?.seasonPayload || !Number.isFinite(ev) || ev === 0 || !Number.isFinite(xw) || xw === 0 || !Number.isFinite(brl) || brl === 0;
  };

  try {
    let snap = await runOxyBattery(2026);
    let note = '';
    if (isHollow(snap) || Number(snap?.derived?.seasonAvg || 0) === 0 || Number(snap?.derived?.samples || 0) === 0) {
      const deepHistory = await DeepHistoryProbe();
      if (deepHistory?.chosen) {
        snap = deepHistory.chosen;
        note = `Deep-history pivoted to ${deepHistory.chosen.year} due to hollow current-season data.`;
      }
    }
    if (!snap?.seasonPayload) {
      const failed = finalizeBranch('A', 'MINING_INTERRUPTED', 'MINING_INTERRUPTED', 'StatsAPI Unreachable', { personId: String(identity.personId), resolvedName: identity.resolvedName }, { identity }, 'All Branch A battery endpoints failed');
      failed.error = 'All Branch A battery endpoints failed';
      return failed;
    }
    const parsed = {
      personId: String(identity.personId),
      resolvedName: identity.resolvedName,
      identityMode: identity.source,
      sourceYear: snap.year,
      seasonAvg: snap.derived.seasonAvg,
      careerBaseline: Number(snap.derived.careerBaseline || 0) > 0 ? snap.derived.careerBaseline : snap.derived.seasonAvg,
      l5: snap.derived.l5,
      l10: snap.derived.l10,
      l20: snap.derived.l20,
      hitRateOverLine: snap.derived.hitRateOverLine,
      samples: snap.derived.samples,
      kRate: snap.derived.kRate,
      bbRate: snap.derived.bbRate,
      hrPer9: snap.derived.hrPer9,
      groundBallPct: snap.derived.groundBallPct,
      pitchesPerInning: snap.derived.pitchesPerInning,
      xba: snap.merged.xba,
      xwoba: snap.merged.xwoba,
      xslg: snap.merged.xslg,
      avgExitVelocity: snap.merged.avgExitVelocity,
      barrelPct: snap.merged.barrelPct,
      hardHitPct: snap.merged.hardHitPct,
      whiffPct: snap.merged.whiffPct,
      velocityDelta: snap.merged.velocityDelta,
      oxySource: Object.entries(snap.oxySource || {}).map(([k, v]) => `${k}:${v}`).join(', ')
    };
    const pitchHandRaw = String(identity?.pitchHand || snap.seasonStats?.pitchHand?.code || snap.seasonStats?.throws || snap.seasonStats?.pitchHand || '').toUpperCase();
    scheduleCtx.pitchHand = pitchHandRaw.startsWith('L') ? 'L' : 'R';
    const branch = finalizeBranch('A', 'SUCCESS', 'LIVE DATA', `StatsAPI Key-Lab (${snap.year})`, parsed, { identity, snap }, note);
    branch.apiLatency = Object.values(snap.latencies || {}).reduce((a, b) => a + Number(b || 0), 0);
    branch.rawResponseLength = JSON.stringify({ season: snap.seasonPayload || null, expected: snap.expectedPayload || null, statcast: snap.statcastPayload || null, gameLog: snap.gameLogPayload || null, career: snap.careerPayload || null }).length;
    branch.error = '';
    branch.verbosePayload = { season: snap.seasonPayload || null, expected: snap.expectedPayload || null, statcast: snap.statcastPayload || null, gameLog: snap.gameLogPayload || null, career: snap.careerPayload || null };
    return branch;
  } catch (e) {
    const branch = finalizeBranch('A', 'MINING_INTERRUPTED', 'MINING_INTERRUPTED', 'StatsAPI Unreachable', { personId: String(identity.personId), resolvedName: identity.resolvedName }, { identity }, e?.message || 'Unknown Branch A failure');
    branch.error = e?.message || 'Unknown Branch A failure';
    branch.apiLatency = 0;
    branch.rawResponseLength = 0;
    return branch;
  }
}



  

async function branchB(row, scheduleCtx, opponentId = null) {
  const oppId = Number(opponentId) || Number(scheduleCtx?.opponentId) || mapTeamToId(scheduleCtx?.opponent || row.opponent);
  const pitcherHand = await handednessLock(scheduleCtx?.personId || row?.personId || row?.playerId || row?.mlbId || 0, row, scheduleCtx);
  const baseline = {
    opponentId: oppId || null, sourceYear: null, splitHandedness: pitcherHand,
    teamObp15: 0.315, teamOps15: 0.724, teamAvg15: 0.245, teamKRate15: 23.2, teamBbRate15: 8.1,
    opponentAvgVsL: 0.245, opponentAvgVsR: 0.245, opponentOpsVsL: 0.725, opponentOpsVsR: 0.725,
    opponentIsoVsL: 0.180, opponentIsoVsR: 0.180
  };
  if (!oppId) {
    const branch = finalizeBranch('B', 'DERIVED', 'DERIVED', 'League Baseline', baseline, { scheduleCtx }, 'Opponent ID missing');
    branch.error = 'Opponent ID missing';
    return branch;
  }
  try {
    const season = 2025;
    const url = `https://statsapi.mlb.com/api/v1/teams/${oppId}/stats?stats=statSplits&group=hitting&season=${season}`;
    const started = Date.now();
    const payload = await safeFetchJson(url, { timeout: 3000 });
    const statsBuckets = Array.isArray(payload?.stats) ? payload.stats : [];
    const splitEntries = statsBuckets.flatMap(s => Array.isArray(s?.splits) ? s.splits : []);
    const cleanName = (split) => String(split?.stat?.group?.displayName || split?.split?.group?.displayName || split?.split?.displayName || split?.split?.name || split?.label || '').toLowerCase().trim();
    const handedBuckets = splitEntries.filter(sp => cleanName(sp).includes('vs'));
    const vsLeftEntry = handedBuckets.find(sp => cleanName(sp) === 'vs left' || cleanName(sp).includes('vs left')) || null;
    const vsRightEntry = handedBuckets.find(sp => cleanName(sp) === 'vs right' || cleanName(sp).includes('vs right')) || null;
    const handedEntry = handednessMatcher(splitEntries, pitcherHand);
    const overallEntry = splitEntries.find(sp => cleanName(sp).includes('season') || cleanName(sp).includes('overall')) || handedEntry || vsLeftEntry || vsRightEntry || splitEntries[0] || {};
    const overall = overallEntry?.stat || {};
    const iso = (stat) => round2(Number(stat?.slg || stat?.slugging || 0) - Number(stat?.avg || stat?.battingAverage || 0));
    const pa = Number(overall?.plateAppearances || overall?.battersFaced || 0);
    if (!splitEntries.length || (!vsLeftEntry && !vsRightEntry)) {
      const branch = finalizeBranch('B', 'DERIVED', 'DERIVED', 'League Baseline', baseline, { scheduleCtx, oppId, payload }, 'Opponent split search fell back to derived baseline');
      branch.error = 'Opponent split search fell back to derived baseline';
      branch.apiLatency = Date.now() - started;
      branch.rawResponseLength = JSON.stringify(payload || '').length;
      return branch;
    }
    const parsed = {
      opponentId: oppId,
      sourceYear: season,
      splitHandedness: pitcherHand,
      teamObp15: round2(Number(overall?.obp)),
      teamOps15: round2(Number(overall?.ops)),
      teamAvg15: round2(Number(overall?.avg || overall?.battingAverage)),
      teamKRate15: pa ? round2((Number(overall?.strikeOuts || 0) / pa) * 100) : null,
      teamBbRate15: pa ? round2((Number(overall?.baseOnBalls || 0) / pa) * 100) : null,
      opponentAvgVsL: round2(Number(vsLeftEntry?.stat?.avg || vsLeftEntry?.stat?.battingAverage)),
      opponentAvgVsR: round2(Number(vsRightEntry?.stat?.avg || vsRightEntry?.stat?.battingAverage)),
      opponentOpsVsL: round2(Number(vsLeftEntry?.stat?.ops)),
      opponentOpsVsR: round2(Number(vsRightEntry?.stat?.ops)),
      opponentIsoVsL: iso(vsLeftEntry?.stat || {}),
      opponentIsoVsR: iso(vsRightEntry?.stat || {}),
      handedAvg: round2(Number(handedEntry?.stat?.avg || handedEntry?.stat?.battingAverage)),
      handedOps: round2(Number(handedEntry?.stat?.ops)),
      handedIso: iso(handedEntry?.stat || {})
    };
    const branch = finalizeBranch('B', 'SUCCESS', 'LIVE DATA', `Opponent Handedness Splits (${season})`, parsed, { scheduleCtx, oppId, payload }, '');
    branch.error = '';
    branch.apiLatency = Date.now() - started;
    branch.rawResponseLength = JSON.stringify(payload || '').length;
    branch.verbosePayload = payload || null;
    return branch;
  } catch (e) {
    const branch = finalizeBranch('B', 'DERIVED', 'DERIVED', 'League Baseline', baseline, { scheduleCtx, oppId }, e?.message || 'Opponent split search failed');
    branch.error = e?.message || 'Opponent split search failed';
    return branch;
  }
}

async function branchC(row, scheduleCtx) {
  try {
    const fallbackVenue = getVenueFromContext(scheduleCtx, row);
    const venueId = Number(scheduleCtx?.venueId || fallbackVenue?.id || 0) || null;
    const venueUrl = venueId ? `https://statsapi.mlb.com/api/v1/venues/${venueId}` : '';
    const started = Date.now();
    const payload = venueUrl ? await safeFetchJson(venueUrl, { timeout: 10000 }) : null;
    const info = payload?.venues?.[0] || payload || {};
    const record = fallbackVenue || {};
    const fieldInfo = info?.fieldInfo || {};
    const location = info?.location || {};
    const parsed = {
      venueId: venueId || record?.id || null,
      venueName: String(info?.name || record?.name || scheduleCtx?.venueName || '').trim(),
      city: String(location?.city || record?.city || '').trim(),
      lat: round2(Number(location?.defaultCoordinates?.latitude || record?.lat || scheduleCtx?.lat || 0)),
      lon: round2(Number(location?.defaultCoordinates?.longitude || record?.lon || scheduleCtx?.lon || 0)),
      alt: round2(Number(location?.elevation || record?.alt || 0)),
      surface: String(fieldInfo?.turfType || record?.surface || 'Unknown'),
      roofType: String(fieldInfo?.roofType || 'Open'),
      hrFactor: round2(Number(record?.hrFactor || 1)),
      runFactor: round2(Number(record?.runFactor || 1)),
      lf: Number(fieldInfo?.leftLine || record?.lf || 0) || null,
      cf: Number(fieldInfo?.center || record?.cf || 0) || null,
      rf: Number(fieldInfo?.rightLine || record?.rf || 0) || null
    };
    const live = Boolean(payload || record?.id);
    const branch = finalizeBranch('C', live ? 'SUCCESS' : 'DERIVED', live ? 'LIVE DATA' : 'DERIVED', live ? 'Venue Registry' : 'Hard-Lock Stadium Library', parsed, { payload, fallbackVenue: record }, live ? '' : 'Venue API unavailable; stadium library fallback used.');
    branch.error = '';
    branch.apiLatency = Date.now() - started;
    branch.rawResponseLength = JSON.stringify(payload || record || '').length;
    return branch;
  } catch (e) {
    const record = getVenueFromContext(scheduleCtx, row) || {};
    const parsed = {
      venueId: record?.id || scheduleCtx?.venueId || null,
      venueName: String(record?.name || scheduleCtx?.venueName || '').trim(),
      city: String(record?.city || '').trim(),
      lat: round2(Number(record?.lat || scheduleCtx?.lat || 0)),
      lon: round2(Number(record?.lon || scheduleCtx?.lon || 0)),
      alt: round2(Number(record?.alt || 0)),
      surface: String(record?.surface || 'Unknown'),
      roofType: 'Unknown',
      hrFactor: round2(Number(record?.hrFactor || 1)),
      runFactor: round2(Number(record?.runFactor || 1)),
      lf: Number(record?.lf || 0) || null,
      cf: Number(record?.cf || 0) || null,
      rf: Number(record?.rf || 0) || null
    };
    const branch = finalizeBranch('C', 'DERIVED', 'DERIVED', 'Hard-Lock Stadium Library', parsed, { scheduleCtx }, e?.message || 'Venue lookup failed');
    branch.error = e?.message || 'Venue lookup failed';
    branch.apiLatency = 0;
    branch.rawResponseLength = 0;
    return branch;
  }
}

async function branchD(row, scheduleCtx) {
  try {
    const started = Date.now();
    const liveUrl = scheduleCtx?.gamePk ? `https://statsapi.mlb.com/api/v1.1/game/${scheduleCtx.gamePk}/feed/live` : '';
    const payload = liveUrl ? await safeFetchJson(liveUrl, { timeout: 10000 }) : null;
    const venue = getVenueFromContext(scheduleCtx, row) || {};
    const month = getMonthFromIso(scheduleCtx?.gameTimeISO || scheduleCtx?.selectedDate);
    const climate = climateFallback[String(venue?.city || '').trim()]?.[month] || { tempF: 68, humidity: 55, pressureInHg: 29.92 };
    const condition = payload?.gameData?.weather || {};
    const tempF = round2(Number(condition?.temp || climate.tempF));
    const windRaw = String(condition?.wind || '0 mph');
    const windSpeedMph = round2(Number((windRaw.match(/(\d+(?:\.\d+)?)/) || [0, 0])[1] || 0));
    const humidity = round2(Number(condition?.humidity || climate.humidity));
    const pressureInHg = round2(Number(condition?.pressure || climate.pressureInHg));
    const dewPointF = round2(tempF - ((100 - humidity) / 5));
    const densityAltitude = round2(Number(venue?.alt || 0) + ((tempF - 59) * 120) - ((pressureInHg - 29.92) * 1000) + ((humidity - 50) * 6));
    const parsed = {
      tempF,
      humidity,
      windSpeedMph,
      windDirectionDeg: round2(Number(condition?.windDirection || 0)),
      pressureInHg,
      cloudCoverPct: round2(Number(condition?.cloudCover || 0)),
      dewPointF,
      visibilityMiles: round2(Number(condition?.visibility || 10)),
      densityAltitude,
      precipProbPct: round2(Number(condition?.precipitationProbability || 0)),
      densityAltitudeImpactK: round2((densityAltitude / 1000) * -1.5)
    };
    const live = Boolean(payload);
    const branch = finalizeBranch('D', live ? 'SUCCESS' : 'DERIVED', live ? 'LIVE DATA' : 'DERIVED', live ? 'Game Feed Weather' : 'Climate Fallback', parsed, { payload, venue }, live ? '' : 'Weather feed unavailable; climate fallback used.');
    branch.error = '';
    branch.apiLatency = Date.now() - started;
    branch.rawResponseLength = JSON.stringify(payload || climate || '').length;
    return branch;
  } catch (e) {
    const venue = getVenueFromContext(scheduleCtx, row) || {};
    const month = getMonthFromIso(scheduleCtx?.gameTimeISO || scheduleCtx?.selectedDate);
    const climate = climateFallback[String(venue?.city || '').trim()]?.[month] || { tempF: 68, humidity: 55, pressureInHg: 29.92 };
    const densityAltitude = round2(Number(venue?.alt || 0) + ((Number(climate.tempF) - 59) * 120) - ((Number(climate.pressureInHg) - 29.92) * 1000) + ((Number(climate.humidity) - 50) * 6));
    const parsed = { tempF: round2(Number(climate.tempF)), humidity: round2(Number(climate.humidity)), windSpeedMph: 0, windDirectionDeg: 0, pressureInHg: round2(Number(climate.pressureInHg)), cloudCoverPct: 0, dewPointF: round2(Number(climate.tempF) - ((100 - Number(climate.humidity)) / 5)), visibilityMiles: 10, densityAltitude, precipProbPct: 0, densityAltitudeImpactK: round2((densityAltitude / 1000) * -1.5) };
    const branch = finalizeBranch('D', 'DERIVED', 'DERIVED', 'Climate Fallback', parsed, { scheduleCtx, venue }, e?.message || 'Weather lookup failed');
    branch.error = e?.message || 'Weather lookup failed';
    branch.apiLatency = 0;
    branch.rawResponseLength = 0;
    return branch;
  }
}

  async function branchE(row, scheduleCtx) {
    const heuristic = {
      openingLine: round2(Number(row.line || row.lineValue || 0)),
      currentLine: round2(Number(row.line || row.lineValue || 0)),
      lineDeltaPct: 0,
      openingTotal: round2(Number(scheduleCtx?.projectedTotal || 8.5)),
      currentTotal: round2(Number(scheduleCtx?.projectedTotal || 8.5)),
      impliedTeamTotal: round2(Number(scheduleCtx?.projectedTotal || 8.5) / 2),
      sharpActionBias: 'Heuristic',
      overJuice: -110,
      underJuice: -110,
      spread: round2(Number(scheduleCtx?.spread || 0)),
      marketConsensusBooks: 0,
      steamDirection: 'Flat',
      bookmaker: 'Synthetic Edge',
      marketSupport: 0
    };
    const team = normalizeTeamAbbr(scheduleCtx?.team || row.team);
    const opp = normalizeTeamAbbr(scheduleCtx?.opponent || row.opponent);
    const matchTeams = (homeName, awayName) => {
      const home = normalizeTeamAbbr(homeName); const away = normalizeTeamAbbr(awayName);
      return (home === team && away === opp) || (home === opp && away === team);
    };
    const parseMarketPayload = (payload, source, started) => {
      const payloadText = JSON.stringify(payload || '').toLowerCase();
      if (!payload || (!payloadText.includes(String(team || '').toLowerCase()) && !payloadText.includes(String(opp || '').toLowerCase()))) return null;
      const total = round2(Number(recursiveSeek(payload, 'total', { allowZero: true }) || recursiveSeek(payload, 'line', { allowZero: true }) || recursiveSeek(payload, 'handicap', { allowZero: true }) || heuristic.openingTotal));
      const price = Number(recursiveSeek(payload, 'american', { allowZero: true }) || recursiveSeek(payload, 'americanOdds', { allowZero: true }) || recursiveSeek(payload, 'price', { allowZero: true }) || -110);
      return {
        parsed: {
          openingLine: heuristic.openingLine,
          currentLine: heuristic.currentLine,
          lineDeltaPct: 0,
          openingTotal: total,
          currentTotal: total,
          impliedTeamTotal: round2(total / 2),
          sharpActionBias: source,
          overJuice: price,
          underJuice: -price || -110,
          spread: heuristic.spread,
          marketConsensusBooks: 1,
          steamDirection: 'Flat',
          bookmaker: source
        },
        source,
        latency: Date.now() - started,
        rawLength: JSON.stringify(payload || '').length,
        payload
      };
    };
    const fromBovada = async () => {
      const started = Date.now();
      const payload = await safeFetchJson(BOVADA_BASEBALL_URL, { timeout: 3000, headers: { 'Accept': 'application/json, text/plain, */*' } });
      const events = Array.isArray(payload) ? payload.flatMap(x => x?.events || x || []) : [];
      const event = events.find(ev => matchTeams(ev?.competitors?.[0]?.name || ev?.description, ev?.competitors?.[1]?.name || ev?.awayTeam)) || null;
      if (!event) return null;
      const total = round2(Number(recursiveSeek(event, 'total') || recursiveSeek(event, 'point') || recursiveSeek(event, 'handicap') || heuristic.openingTotal));
      const price = Number(recursiveSeek(event, 'american') || recursiveSeek(event, 'price') || -110);
      return {
        parsed: { ...heuristic, openingTotal: total, currentTotal: total, impliedTeamTotal: round2(total / 2), overJuice: price, underJuice: -price || -110, marketConsensusBooks: 1, bookmaker: 'Bovada', sharpActionBias: 'Bovada Direct' },
        source: 'Bovada', latency: Date.now() - started, rawLength: JSON.stringify(payload || '').length, payload
      };
    };
    const fromFanDuelDirect = async () => {
      const started = Date.now();
      const payload = await safeFetchJson(FANDUEL_MLB_URL, { timeout: 3000 });
      return parseMarketPayload(payload, 'FanDuel Direct', started);
    };
    const fromSyntheticAnchor = async () => ({ parsed: heuristic, source: 'Synthetic Edge', latency: 0, rawLength: 0, payload: { scheduleCtx } });
    const MarketSwarm = await Promise.race([
      Promise.allSettled([fromBovada(), fromFanDuelDirect()]),
      new Promise(resolve => setTimeout(() => resolve('TIMEOUT'), 3000))
    ]);
    const liveResults = MarketSwarm === 'TIMEOUT' ? [] : MarketSwarm.filter(item => item.status === 'fulfilled' && item.value?.parsed).map(item => item.value);
    const bestLive = liveResults.sort((a, b) => (b?.rawLength || 0) - (a?.rawLength || 0))[0] || null;
    const result = bestLive || await fromSyntheticAnchor();
    result.parsed.marketSupport = Number.isFinite(Number(result.parsed.currentTotal)) && Number.isFinite(Number(row?.lineValue || row?.line)) ? round2(Number(result.parsed.currentTotal) - Number(row?.lineValue || row?.line)) : 0;
    const mode = result.source === 'Synthetic Edge' ? 'DERIVED' : 'LIVE DATA';
    const status = result.source === 'Synthetic Edge' ? 'DERIVED' : 'SUCCESS';
    const branch = finalizeBranch('E', status, mode, result.source, result.parsed, { payload: result.payload }, result.source === 'Synthetic Edge' ? 'Market swarm timed out; synthetic anchor used.' : '');
    branch.error = '';
    branch.apiLatency = result.latency || 0;
    branch.rawResponseLength = result.rawLength || 0;
    return branch;
  }

  function assembleVault(row, scheduleCtx, results) {
    const keys = ['A','B','C','D','E'];
    const branches = {};
    keys.forEach((key, idx) => {
      const res = results[idx];
      branches[key] = res && res.status === 'fulfilled' && res.value ? res.value : defaultBranch(key);
    });
    return {
      version: SYSTEM_VERSION,
      timestamp: new Date().toISOString(),
      rowIdx: row.idx,
      player: row.parsedPlayer,
      team: row.team,
      opponent: row.opponent,
      prop: row.prop,
      line: String(row.line ?? row.lineValue ?? ''),
      gameTimeISO: scheduleCtx?.gameTimeISO || row.gameTimeISO || null,
      schedule: sanitizeForVault({ gamePk: scheduleCtx?.gamePk || null, venueId: scheduleCtx?.venueId || null, venueName: scheduleCtx?.venueName || '', selectedDate: scheduleCtx?.selectedDate || '', opponentId: scheduleCtx?.opponentId || null }),
      branches,
      parsedFactors: {
        branchA: branches.A.parsed,
        branchB: branches.B.parsed,
        branchC: branches.C.parsed,
        branchD: branches.D.parsed,
        branchE: branches.E.parsed
      },
      branchErrors: {
        A: branches.A.error || '',
        B: branches.B.error || '',
        C: branches.C.error || '',
        D: branches.D.error || '',
        E: branches.E.error || ''
      },
      latency: Object.values(branches).reduce((s,b)=>s+Number(b.apiLatency||0),0),
      apiLatencyA: Number(branches.A.apiLatency || 0),
      apiLatencyB: Number(branches.B.apiLatency || 0),
      apiLatencyC: Number(branches.C.apiLatency || 0),
      apiLatencyD: Number(branches.D.apiLatency || 0),
      apiLatencyE: Number(branches.E.apiLatency || 0),
      rawResponseLengthA: Number(branches.A.rawResponseLength || 0),
      rawResponseLengthB: Number(branches.B.rawResponseLength || 0),
      rawResponseLengthC: Number(branches.C.rawResponseLength || 0),
      rawResponseLengthD: Number(branches.D.rawResponseLength || 0),
      rawResponseLengthE: Number(branches.E.rawResponseLength || 0)
    };
  }
  function buildShield(vault) {
    const list = Object.values(vault.branches || {});
    const live = list.filter(b => b.sourceMode === 'LIVE DATA').length;
    const derived = list.filter(b => b.sourceMode === 'DERIVED').length;
    return {
      integrityScore: Math.max(25, (live * 20) + (derived * 12)),
      purityScore: live,
      confidenceAvg: round2(list.reduce((s,b)=>s+((b.factorsFound/Math.max(1,b.factorsTarget))*100),0)/Math.max(1,list.length)),
      label: live >= 4 ? 'HARD LOCK READY' : derived >= 3 ? 'DERIVED STABLE' : 'PARTIAL INGEST'
    };
  }

  async function streamingIngress(rows, stateRef = null, hooks = {}) {
    const pool = Array.isArray(rows) ? rows : [];
    const totalRows = pool.length;
    const resultsOut = [];
    const targetState = stateRef && typeof stateRef === 'object' ? stateRef : (window.PickCalcCore?.state || (window.state = window.state || {}));
    targetState.miningVault = targetState.miningVault || {};
    for (let rowIndex = 0; rowIndex < pool.length; rowIndex += 1) {
      const row = pool[rowIndex];
      hooks.onRowStart?.({ row, rowIndex, totalRows });
      const scheduleCtx = await getScheduleContext(row).catch(() => ({ selectedDate: '', opponentId: null, venueName: '', venueId: null }));
      const oppID = Number(scheduleCtx?.opponentId) || null;
      const branchKeys = ['A', 'B', 'C', 'D', 'E'];
      const probeWeights = { A: 9, B: 1, C: 1, D: 1, E: 3 };
      const partialResults = branchKeys.map(key => ({ status: 'fulfilled', value: defaultBranch(key) }));
      const branchJobs = {
        A: () => branchA(row, scheduleCtx),
        B: () => branchB(row, scheduleCtx, oppID),
        C: () => branchC(row, scheduleCtx),
        D: () => branchD(row, scheduleCtx),
        E: () => branchE(row, scheduleCtx)
      };
      let completedProbeCount = rowIndex * 15;
      for (let branchIndex = 0; branchIndex < branchKeys.length; branchIndex += 1) {
        const key = branchKeys[branchIndex];
        try {
          const branch = await branchJobs[key]();
          partialResults[branchIndex] = { status: 'fulfilled', value: branch };
        } catch (error) {
          const failed = defaultBranch(key);
          failed.status = 'MINING_INTERRUPTED';
          failed.sourceMode = 'DERIVED';
          failed.note = error?.message || `${key} stream failure`;
          failed.error = error?.message || `${key} stream failure`;
          partialResults[branchIndex] = { status: 'fulfilled', value: failed };
        }
        const vault = assembleVault(row, scheduleCtx, partialResults);
        const shield = buildShield(vault);
        targetState.miningVault[row.idx] = vault;
        const completedRows = rowIndex + (branchIndex === branchKeys.length - 1 ? 1 : 0);
        completedProbeCount += Number(probeWeights[key] || 1);
        hooks.onBranch?.({
          row,
          rowIndex,
          totalRows,
          completedRows,
          completedProbes: completedProbeCount,
          totalProbes: totalRows * 15,
          branchKey: key,
          vault,
          shield,
          logs: [
            { level: 'success', text: `[STREAM] ${row.parsedPlayer || 'Row'} — Branch ${key} resolved.` },
            ...(oppID ? [{ level: 'success', text: `[Branch B] Opponent ID handoff locked at ${oppID}.` }] : [])
          ]
        });
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      const vault = assembleVault(row, scheduleCtx, partialResults);
      const shield = buildShield(vault);
      targetState.miningVault[row.idx] = vault;
      const result = {
        row,
        vault,
        shield,
        connectorState: {
          version: SYSTEM_VERSION,
          branchStatus: Object.fromEntries(Object.entries(vault.branches).map(([k, v]) => [k, v.status])),
          liveBranches: Object.values(vault.branches).filter(b => b.sourceMode === 'LIVE DATA').length,
          derivedBranches: Object.values(vault.branches).filter(b => b.sourceMode === 'DERIVED').length,
          completedRows: rowIndex + 1
        },
        logs: [
          { level: 'success', text: `[OMNI-MINER] Streaming ingress complete for ${row.parsedPlayer}.` },
          ...(oppID ? [{ level: 'success', text: `[Branch B] Opponent ID handoff locked at ${oppID}.` }] : [{ level: 'warning', text: '[Branch B] Opponent ID missing from schedule context; fallback path armed.' }]),
          { level: 'success', text: `[Vault] Saved raw branch payloads to state.miningVault[${row.idx}].` }
        ]
      };
      resultsOut.push(result);
      hooks.onRowComplete?.({ row, rowIndex, result, completedRows: rowIndex + 1, totalRows, completedProbes: (rowIndex + 1) * 15, totalProbes: totalRows * 15 });
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    hooks.onComplete?.({ results: resultsOut, totalRows });
    return { results: resultsOut, lastResult: resultsOut[resultsOut.length - 1] || null };
  }

  async function analyzeRow(row, stateRef = null) {
    const scheduleCtx = await getScheduleContext(row);
    const oppID = Number(scheduleCtx?.opponentId) || null;
    const results = await Promise.allSettled([
      branchA(row, scheduleCtx),
      branchB(row, scheduleCtx, scheduleCtx?.opponentId ?? oppID),
      branchC(row, scheduleCtx),
      branchD(row, scheduleCtx),
      branchE(row, scheduleCtx)
    ]);
    const vault = assembleVault(row, scheduleCtx, results);
    const shield = buildShield(vault);
    const targetState = stateRef && typeof stateRef === 'object' ? stateRef : (window.PickCalcCore?.state || (window.state = window.state || {}));
    targetState.miningVault = targetState.miningVault || {};
    targetState.miningVault[row.idx] = vault;
    return {
      row,
      vault,
      shield,
      connectorState: {
        version: SYSTEM_VERSION,
        branchStatus: Object.fromEntries(Object.entries(vault.branches).map(([k,v]) => [k, v.status])),
        liveBranches: Object.values(vault.branches).filter(b => b.sourceMode === 'LIVE DATA').length,
        derivedBranches: Object.values(vault.branches).filter(b => b.sourceMode === 'DERIVED').length
      },
      logs: [
        { level: 'success', text: `[OMNI-MINER] Parallel ingress complete for ${row.parsedPlayer}.` },
        ...(oppID ? [{ level: 'success', text: `[Branch B] Opponent ID handoff locked at ${oppID}.` }] : [{ level: 'warning', text: '[Branch B] Opponent ID missing from schedule context; fallback path armed.' }]),
        { level: 'success', text: `[Vault] Saved raw branch payloads to state.miningVault[${row.idx}].` }
      ]
    };
  }

  Object.assign(window.PickCalcConnectors, { SYSTEM_VERSION, stadiumLibrary, normalizeName, normalizeTeamAbbr, analyzeRow, streamingIngress, identityRacerPro });
})();
