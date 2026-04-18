window.PickCalcUI = (() => {
function el(id){return document.getElementById(id);}

function showToast(msg){
 const t=document.createElement('div');
 t.textContent=msg;
 t.style='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:14px 20px;border:2px solid #4da6ff;border-radius:10px;z-index:9999;';
 document.body.appendChild(t);
 setTimeout(()=>t.remove(),4000);
}

function renderFeedStatus(rows=[],audit={}){
 const m=el('feedStatus');
 if(!rows.length){m.innerHTML='';return;}

 const counts={};
 rows.forEach(r=>counts[r.prop]=(counts[r.prop]||0)+1);

 let html="<div><strong>MLB ✅</strong></div>";
 Object.keys(counts).forEach(k=>{
  html+=`<div>${k}: [${counts[k]}]</div>`;
 });
 html+=`<div>Rejected Lines: [${audit.rejectedLines?.length||0}]</div>`;
 m.innerHTML=html;
}

function renderPoolTable(rows){
 const m=el('poolMount');
 if(!rows.length){m.innerHTML='';return;}
 m.innerHTML=rows.map(r=>`<div>${r.parsedPlayer} - ${r.prop} (${r.line})</div>`).join('');
}

return {el,showToast,renderFeedStatus,renderPoolTable};
})();