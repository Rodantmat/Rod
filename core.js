window.PickCalcCore=(()=>{const P=window.PickCalcParser;const U=window.PickCalcUI;
let state={cleanPool:[],miningVault:{}};
function ingestBoard(){
const input=U.el('boardInput');const parsed=P.parseBoard(input.value);
let rows=parsed.rows;
if(state.cleanPool.length+rows.length>16){
 rows=rows.slice(0,16-state.cleanPool.length);
 U.showToast('You reached the 16 legs limit per run');
}
if(rows.length){state.cleanPool=state.cleanPool.concat(rows);input.value='';}
U.renderFeedStatus(state.cleanPool,parsed.audit);U.renderPoolTable(state.cleanPool);
}
function resetAll(){state.cleanPool=[];state.miningVault={};localStorage.clear();
U.renderFeedStatus([]);U.renderPoolTable([]);}
window.addEventListener('DOMContentLoaded',()=>{
document.getElementById('ingestBtn').onclick=ingestBoard;
document.getElementById('resetAllBtn').onclick=resetAll;
});
})();