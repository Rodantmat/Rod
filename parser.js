window.PickCalcParser = (() => {
const STANDALONE_NUMBER_RX = /^\d+(?:\.\d+)?$/;
const GLUED_NOISE_RX = /(Demon|Goblin|Trending|Popular|Popularity|Hot|Boost|Promo|Specials?|Insurance)\b/g;
const BADGE_RX = /\b\d+(?:\.\d+)?K\b/gi;

function clean(l){return l.replace(GLUED_NOISE_RX,' ').replace(BADGE_RX,' ').trim();}
function makeCluster(lines,i){return lines.slice(Math.max(0,i-7), Math.min(lines.length,i+6)).map(clean);}

function parseBoard(text){
const lines = text.replace(/\|/g,'\n').split('\n').map(l=>l.trim()).filter(Boolean);
const rows=[]; const audit={rejectedLines:[]};

lines.forEach((l,i)=>{
 if(STANDALONE_NUMBER_RX.test(l)){
  const c = makeCluster(lines,i);
  const prop = c.find(x=>/Ks|Strikeouts/i.test(x));
  const name = c.find(x=>/[A-Z][a-z]+\s+[A-Z][a-z]+/.test(x));
  if(!prop){audit.rejectedLines.push(c.join(' '));return;}
  rows.push({parsedPlayer:name||'',prop:'Pitcher Strikeouts',line:l,sport:'MLB'});
 }
});
return {rows,audit};
}
return {parseBoard};
})();