window.PickCalcUI=(()=>{function el(i){return document.getElementById(i);}
function showToast(m){const d=document.createElement('div');d.innerText=m;
d.style='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#000;color:#fff;padding:10px;border:2px solid #4da6ff;border-radius:10px';
document.body.appendChild(d);setTimeout(()=>d.remove(),4000);}
function renderFeedStatus(rows,audit){
const m=el('feedStatus');if(!rows.length){m.innerHTML='';return;}
let c={};rows.forEach(r=>c[r.prop]=(c[r.prop]||0)+1);
let h='<div><b>MLB ✅</b></div>';Object.keys(c).forEach(k=>h+=`<div>${k}: [${c[k]}]</div>`);
h+=`<div>Rejected Lines: [${audit?.rejectedLines?.length||0}]</div>`;m.innerHTML=h;}
function renderPoolTable(rows){el('poolMount').innerHTML=rows.map(r=>`<div>${r.parsedPlayer} ${r.line}</div>`).join('');}
return{el,showToast,renderFeedStatus,renderPoolTable};})();