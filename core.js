window.addEventListener('DOMContentLoaded', () => {
  const Parser = window.PickCalcParser;
  const Connectors = window.PickCalcConnectors;
  const UI = window.PickCalcUI;

  const state = {
    rows: [],
    audit: { rejectedLines: [] },
    scored: []
  };

  const el = (id) => document.getElementById(id);
  const config = Connectors.loadConfig();
  UI.renderConfig(config);
  UI.showScreen('intake');

  el('clearBoxBtn')?.addEventListener('click', () => {
    el('boardInput').value = '';
    setMessage('ingestMessage', 'Board text cleared.');
  });

  el('ingestBtn')?.addEventListener('click', () => {
    const text = el('boardInput').value || '';
    const parsed = Parser.parseBoard(text, { dayScope: 'both' });
    state.rows = (parsed.rows || []).slice(0, 8).map((row, index) => ({ ...row, idx: index + 1 }));
    state.audit = parsed.audit || { rejectedLines: [] };
    UI.renderPool(state.rows, state.audit);
    const extra = (parsed.rows || []).length > 8 ? ` Only the first 8 accepted rows will be scored.` : '';
    setMessage('ingestMessage', state.rows.length ? `${state.rows.length} rows ingested.${extra}` : 'No valid MLB rows found.');
    UI.appendConsole(`INGEST_COMPLETE accepted=${state.rows.length} rejected=${(state.audit.rejectedLines || []).length}`);
  });

  el('resetAllBtn')?.addEventListener('click', () => {
    state.rows = [];
    state.audit = { rejectedLines: [] };
    state.scored = [];
    UI.renderPool([], state.audit);
    UI.renderProgress('Idle', 0, 0);
    setMessage('ingestMessage', 'System reset complete.');
    UI.appendConsole('SYSTEM_RESET complete.');
  });

  el('saveKeyBtn')?.addEventListener('click', () => {
    const saved = Connectors.saveConfig({
      apiKeys: el('apiKeysInput').value
    });
    UI.renderConfig(saved);
    setMessage('configMessage', `Config saved. Keys loaded: ${saved.apiKeys.length}.`);
    UI.appendConsole(`CONFIG_SAVED keys=${saved.apiKeys.length}`);
  });

  el('debugConnectionBtn')?.addEventListener('click', async () => {
    const saved = Connectors.saveConfig({
      apiKeys: el('apiKeysInput').value
    });
    try {
      const result = await Connectors.debugConnection(saved);
      setMessage('configMessage', `Debug OK (${Array.isArray(result) ? result.length : 1} row).`);
      UI.appendConsole('DEBUG_CONNECTION ok.');
    } catch (err) {
      setMessage('configMessage', `Debug failed: ${err.message}`);
      UI.appendConsole(`DEBUG_CONNECTION failed: ${err.message}`);
    }
  });

  el('runBtn')?.addEventListener('click', async () => {
    if (!state.rows.length) {
      setMessage('ingestMessage', 'Ingest at least one row first.');
      return;
    }
    const saved = Connectors.saveConfig({
      apiKeys: el('apiKeysInput').value
    });
    try {
      UI.showScreen('analysis');
      UI.renderProgress('Starting run…', 0, state.rows.length);
      UI.appendConsole(`RUN_START rows=${state.rows.length}`);
      const scored = await Connectors.scoreRows(state.rows, saved, ({ message, completed, total }) => {
        UI.renderProgress(message, completed, total);
        UI.appendConsole(message);
      });
      state.scored = scored;
      UI.renderResults(scored);
      UI.renderProgress('Run complete.', state.rows.length, state.rows.length);
      UI.appendConsole('RUN_COMPLETE complete.');
    } catch (err) {
      UI.renderProgress(`Run failed: ${err.message}`, 0, state.rows.length);
      UI.appendConsole(`RUN_FAILED ${err.message}`);
    }
  });

  el('backBtn')?.addEventListener('click', () => UI.showScreen('intake'));
  el('copyBtn')?.addEventListener('click', async () => {
    try {
      await UI.copyReport(state.scored || []);
      UI.appendConsole('REPORT_COPIED clipboard success.');
    } catch (err) {
      UI.appendConsole(`REPORT_COPY_FAILED ${err.message}`);
    }
  });

  function setMessage(id, text) {
    const node = el(id);
    if (node) node.textContent = text;
  }
});
