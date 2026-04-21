(() => {
  const Parser = window.AlphaDogParser;
  const UI = window.AlphaDogUI;
  const Connectors = window.AlphaDogConnectors;

  const state = {
    version: Parser.SYSTEM_VERSION,
    rows: [],
    rejected: [],
    logs: [{ level: 'status-ok', text: '[ALPHADOG] Ready.' }],
    lastResult: null,
  };

  function syncConsole() {
    UI.renderConsole(state.logs);
  }

  function log(level, text) {
    state.logs.unshift({ level, text });
    state.logs = state.logs.slice(0, 200);
    UI.renderConsole(state.logs);
  }

  function ingestBoard() {
    const raw = UI.el('boardInput')?.value || '';
    const parsed = Parser.parseBoardText(raw);
    state.rows = parsed.rows;
    state.rejected = parsed.rejected;
    state.lastResult = null;
    UI.renderBatchMeta(parsed);
    UI.renderBatchList(parsed.rows);
    UI.renderResults({ legs: [], overall_auditor_score_text: '' });
    UI.renderIngestMessage(
      parsed.rows.length
        ? `Loaded ${parsed.rows.length} leg(s). ${parsed.rejected.length ? `${parsed.rejected.length} rejected by the 24-leg cap.` : ''}`
        : 'No valid legs detected.',
      parsed.rows.length ? 'status-ok' : 'status-warn'
    );
    log(parsed.rows.length ? 'status-ok' : 'status-warn', `[ALPHADOG] Batch normalized: accepted=${parsed.rows.length} rejected=${parsed.rejected.length}`);
  }

  async function checkBridge() {
    UI.renderBridgeStatus('Checking bridge...', 'status-warn');
    log('status-warn', '[ALPHADOG] Checking Python bridge.');
    try {
      const health = await Connectors.checkBridgeHealth();
      const msg = `Bridge online · ${health.service || 'AlphaDog Bridge'} · models: ${health.primary_model} -> ${health.fallback_model}`;
      UI.renderBridgeStatus(msg, 'status-ok');
      log('status-ok', `[ALPHADOG] ${msg}`);
    } catch (error) {
      UI.renderBridgeStatus(`Bridge check failed: ${error.message}`, 'status-error');
      log('status-error', `[ALPHADOG] Bridge health failed: ${error.message}`);
    }
  }

  async function runAudit() {
    if (!state.rows.length) {
      UI.renderIngestMessage('Load a batch first.', 'status-warn');
      log('status-warn', '[ALPHADOG] Audit blocked: no rows loaded.');
      return;
    }
    log('status-warn', `[ALPHADOG] Dispatching ${state.rows.length} leg(s) to Python bridge.`);
    UI.renderResults({ legs: [], overall_auditor_score_text: '' });
    try {
      const result = await Connectors.runAudit(state.rows);
      state.lastResult = result;
      UI.renderResults(result);
      const modelUsed = result.model_used || 'unknown-model';
      log('status-ok', `[ALPHADOG] Audit completed via ${modelUsed}.`);
      if (Array.isArray(result.logs)) {
        result.logs.forEach((entry) => log(entry.level || 'status-warn', entry.text || ''));
      }
    } catch (error) {
      UI.renderResults({ legs: [], overall_auditor_score_text: '' });
      log('status-error', `[ALPHADOG] Audit failed: ${error.message}`);
    }
  }

  function resetAll() {
    state.rows = [];
    state.rejected = [];
    state.lastResult = null;
    UI.el('boardInput').value = '';
    UI.renderBatchMeta({ version: state.version, acceptedCount: 0, rejectedCount: 0, maxBatchSize: Parser.MAX_BATCH_SIZE });
    UI.renderBatchList([]);
    UI.renderResults({ legs: [], overall_auditor_score_text: '' });
    UI.renderIngestMessage('Reset complete.', 'status-ok');
    log('status-ok', '[ALPHADOG] Reset complete.');
  }

  function bind() {
    UI.el('ingestBtn')?.addEventListener('click', ingestBoard);
    UI.el('runBtn')?.addEventListener('click', runAudit);
    UI.el('healthBtn')?.addEventListener('click', checkBridge);
    UI.el('clearBoxBtn')?.addEventListener('click', () => {
      UI.el('boardInput').value = '';
      UI.renderIngestMessage('Board input cleared.', 'status-ok');
    });
    UI.el('resetAllBtn')?.addEventListener('click', resetAll);
    UI.renderBatchMeta({ version: state.version, acceptedCount: 0, rejectedCount: 0, maxBatchSize: Parser.MAX_BATCH_SIZE });
    UI.renderBatchList([]);
    syncConsole();
  }

  bind();
})();
