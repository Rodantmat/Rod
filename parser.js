(function(){
  const TEAM_RX = /\b(ARI|ATL|BAL|BOS|CHC|CWS|CIN|CLE|COL|DET|HOU|KC|LAA|LAD|MIA|MIL|MIN|NYM|NYY|ATH|PHI|PIT|SD|SF|SEA|STL|TB|TEX|TOR|WSH)\b/i;
  const PROPS = ["Hits+Runs+RBIs","Pitching Outs","Total Bases","Strikeouts","Hits","RBIs","Runs","Home Runs","Walks","Singles","Doubles","Earned Runs","Hits Allowed"];
  function clean(s){return String(s||"").replace(/\s+/g," ").trim()}
  function family(prop){const p=String(prop||"").toLowerCase(); if(p.includes('rbi'))return 'RBI'; if(p.includes('hit'))return 'HITS'; if(p.includes('strikeout'))return 'K'; if(p.includes('total base'))return 'TB'; return 'GENERIC'}
  function parseCompact(line, idx){
    const raw=clean(line); if(!raw)return null;
    const prop=PROPS.find(p=>new RegExp(`\\b${p.replace(/[+]/g,'\\+')}\\b`,'i').test(raw)); if(!prop)return null;
    const lineMatch=raw.match(/(?:line\s*)?(\d+(?:\.\d+)?)/i); if(!lineMatch)return null;
    const teams=[...raw.matchAll(new RegExp(TEAM_RX.source,'ig'))].map(m=>m[1].toUpperCase());
    const lineValue=lineMatch[1];
    let before=raw.split(new RegExp(prop.replace(/[+]/g,'\\+'),'i'))[0]||raw;
    before=before.replace(/\b(More|Less|Over|Under)\b/ig,'').replace(/\d+(?:\.\d+)?/g,'');
    teams.forEach(t=>before=before.replace(new RegExp(`\\b${t}\\b`,'ig'),''));
    const player=clean(before.replace(/[|@/,-]/g,' '));
    if(!player||!teams[0])return null;
    return {idx,LEG_ID:`LEG-${idx}`,sourceIndex:idx,blockIndex:idx,sport:'MLB',league:'MLB',parsedPlayer:player,team:teams[0],opponent:teams[1]||'',prop,line:lineValue,type: prop.toLowerCase().includes('strikeout')||prop.toLowerCase().includes('pitching')?'Pitcher':'Hitter',direction:/\b(less|under)\b/i.test(raw)?'Less':'More',gameTimeText:(raw.match(/\b\d+\s*[mh]\s*\d*\s*[ms]?\b/i)||[''])[0]};
  }
  function parseBoard(text){
    const lines=String(text||'').split(/\n|\r|\|/).map(clean).filter(Boolean);
    const rows=[]; const rejectedLines=[];
    let i=0;
    for(const line of lines){ const r=parseCompact(line, rows.length+1); if(r)rows.push(r); else rejectedLines.push({line,reason:'no supported MLB prop parse'}); i++; }
    const seen=new Set();
    const cleanRows=rows.filter(r=>{const k=`${r.parsedPlayer}|${r.team}|${r.opponent}|${r.prop}|${r.line}`.toLowerCase(); if(seen.has(k))return false; seen.add(k); return true;}).slice(0,24).map((r,i)=>({...r,idx:i+1,LEG_ID:`LEG-${i+1}`,sourceIndex:i+1,blockIndex:i+1}));
    return {rows:cleanRows,audit:cleanRows.map(r=>({idx:r.idx,accepted:true,parsedPlayer:r.parsedPlayer,prop:r.prop,line:r.line})),rejectedLines};
  }
  window.Parser={parseBoard,familyFromProp:family};
})();
