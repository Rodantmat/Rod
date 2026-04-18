window.PickCalcParser = (() => {
const SYSTEM_VERSION = 'v13.78.04 (OXYGEN-COBALT)';
const STANDALONE_NUMBER_RX = /^\d+(?:\.\d+)?$/;
const GLUED_NOISE_RX = /(Demon|Goblin|Trending|Popular|Popularity|Hot|Boost|Promo|Specials?|Insurance)\b/g;
const BADGE_RX = /\b\d+(?:\.\d+)?K\b/gi;
const TIME_RX = /(\d+m\s+\d+s|\d+m|\d{1,2}:\d{2}\s*(am|pm)?)/i;

const MLB_PROPS = [
"Pitcher Strikeouts","Pitching Outs","Pitcher Fantasy Score","Walks Allowed","Hits Allowed","Earned Runs Allowed",
"Hitter Fantasy Score","Hits+Runs+RBIs","Total Bases","Hits","Runs","RBIs","Home Runs","Singles","Doubles",
"Triples","Walks","Stolen Bases","Hitter Strikeouts"
];

function clean(line){
 return String(line).replace(GLUED_NOISE_RX,' ').replace(BADGE_RX,' ').trim();
}

function makeCluster(lines,i){
 return lines.slice(Math.max(0,i-7), Math.min(lines.length,i+6)).map(clean);
}

function findProp(cluster){
 for(const l of cluster){
  for(const p of MLB_PROPS){
   if(l.toLowerCase().includes(p.toLowerCase())) return p;
  }
 }
 return null;
}

function findName(cluster){
 for(const l of cluster){
  if(/[A-Z][a-z]+\s+[A-Z][a-z]+/.test(l)) return l;
 }
 return '';
}

function parseBoard(text){
 const lines = String(text).replace(/\|/g,'\n').split('\n').map(l=>l.trim()).filter(Boolean);
 const rows=[]; const audit={rejectedLines:[]};

 lines.forEach((line,i)=>{
  if(STANDALONE_NUMBER_RX.test(line)){
   const cluster = makeCluster(lines,i);
   const prop = findProp(cluster);
   const name = findName(cluster);

   if(!prop){
    audit.rejectedLines.push(cluster.join(' '));
    return;
   }

   rows.push({
    idx: rows.length+1,
    parsedPlayer: name,
    prop,
    line,
    sport:'MLB'
   });
  }
 });

 return {rows,audit};
}

return {parseBoard};
})();