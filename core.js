window.PickCalcCore = (() => {
const Parser = window.PickCalcParser;
const UI = window.PickCalcUI;

const state = {cleanPool:[], miningVault:{}};

function ingestBoard(){
 const input = UI.el('boardInput');
 const parsed = Parser.parseBoard(input.value);
 let rows = parsed.rows;

 if(state.cleanPool.length + rows.length > 16){
  rows = rows.slice(0, 16 - state.cleanPool.length);
  UI.showToast("You reached the 16 legs limit per run");
 }

 if(rows.length){
  state.cleanPool = state.cleanPool.concat(rows);
  input.value='';
 }

 UI.renderFeedStatus(state.cleanPool, parsed.audit);
 UI.renderPoolTable(state.cleanPool);
}

function handleResetAll(){
 state.cleanPool=[];
 state.miningVault={};
 localStorage.clear();
 UI.renderFeedStatus([]);
 UI.renderPoolTable([]);
 UI.showToast("System reset");
}

window.addEventListener('DOMContentLoaded',()=>{
 document.getElementById('ingestBtn').onclick=ingestBoard;
 document.getElementById('resetBtn').onclick=handleResetAll;
});

})();