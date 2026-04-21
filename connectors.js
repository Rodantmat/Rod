(() => {
  const SYSTEM_VERSION = 'AlphaDog v0.0.1';
  const REQUEST_TIMEOUT_MS = 180000;
  const HOSTILE_SYSTEM_PROMPT = `You are AlphaDog v0.0.1, a Hostile Auditor. Use 2026 data. Normalize name fragments. Process 24 legs across 3 XML batches.
RETURN FORMAT FOR EACH LEG:
MLB - [Full Player Name] ([Full Team Name])
@ [Opponent Full Name] - [Date/Time]
[Prop] [Metric] [Direction]
Identity & Context Integrity: [x]/100
Performance & Trend Variance: [x]/100
Situational Stress-Testing: [x]/100
Risk & Volatility Buffers: [x]/100
Final Score: [x]/100
[Footer]: Provide an Auditor Score for the whole batch.`;

  function getBridgeUrl() {
    const input = document.getElementById('bridgeUrlInput');
    return String(input?.value || 'http://127.0.0.1:8000').trim().replace(/\/$/, '');
  }

  async function fetchJson(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error('Request timed out.')), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      const text = await response.text();
      let json = null;
      try { json = text ? JSON.parse(text) : {}; } catch (_) { json = { raw: text }; }
      if (!response.ok) {
        const message = json?.detail || json?.error || text || `HTTP ${response.status}`;
        throw new Error(message);
      }
      return json;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function checkBridgeHealth() {
    const baseUrl = getBridgeUrl();
    return fetchJson(`${baseUrl}/health`, { method: 'GET' });
  }

  async function runAudit(rows = []) {
    const baseUrl = getBridgeUrl();
    return fetchJson(`${baseUrl}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: HOSTILE_SYSTEM_PROMPT,
        rows,
      }),
    });
  }

  window.AlphaDogConnectors = {
    SYSTEM_VERSION,
    REQUEST_TIMEOUT_MS,
    HOSTILE_SYSTEM_PROMPT,
    getBridgeUrl,
    checkBridgeHealth,
    runAudit,
  };
})();
