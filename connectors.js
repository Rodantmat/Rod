window.PickCalcConnectors = (() => {
  const SYSTEM_VERSION = 'v13.78.05 (OXYGEN-COBALT)';
  const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';

  function stampVault(vault = {}) {
    vault.isReal = true;
    vault.source = 'real';
    return vault;
  }

  return {
    SYSTEM_VERSION,
    GEMINI_MODEL,
    stampVault
  };
})();