window.PickCalcConnectors = (() => {
const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';
function stamp(vault){
 vault.isReal=true;
 vault.source='real';
}
return {GEMINI_MODEL, stamp};
})();