// ─── COLLECTOR ────────────────────────────────────────────────────────────────
//
// Sends captured errors to the SmartTrace Collector server on port 5000
// Includes userId so collector knows which user got the error
// ─────────────────────────────────────────────────────────────────────────────

const COLLECTOR_URL = 'http://localhost:5000/events';

// Current user ID set by initSmartTrace
let _currentUserId = 'anonymous';

export function setCurrentUserId(userId) {
  _currentUserId = userId || 'anonymous';
}

async function sendEvent(event) {
  try {
    const payload = {
      errorType: event.errorType || 'Error',
      message: event.message || 'Unknown error',
      stack: event.stack || '',
      file: event.file || 'Unknown',
      line: event.line || 0,
      column: event.column || 0,
      component: event.component || 'Unknown',

      // ── USER CONTEXT ──────────────────────────────
      // Which user got this error
      // Only ID — no personal data per privacy rule
      userId: _currentUserId,

      // ── SESSION CONTEXT ───────────────────────────
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),

      extra: event.extra || {},
    };

    console.log(`[SmartTrace SDK] Sending error to collector: ${payload.message}`);
    console.log(`[SmartTrace SDK] Affected user: ${payload.userId}`);

    const response = await fetch(COLLECTOR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[SmartTrace SDK] Issue #${result.issueId} recorded for ${payload.userId}`);
    } else {
      console.warn('[SmartTrace SDK] Collector returned error:', response.status);
    }

  } catch (err) {
    console.warn('[SmartTrace SDK] Could not reach collector:', err.message);
  }
}

export function parseStackTrace(stack) {
  if (!stack) return { file: 'Unknown', line: 0, column: 0 };

  const lines = stack.split('\n');

  for (const line of lines) {
    const match = line.match(/at\s+.*?\(?(.*?\.jsx?):(\d+):(\d+)\)?/);

    if (match) {
      const filePath = match[1];
      const lineNum = parseInt(match[2]);
      const colNum = parseInt(match[3]);

      if (
        filePath.includes('react-dom') ||
        filePath.includes('node_modules') ||
        filePath.includes('webpack')
      ) {
        continue;
      }

      let fileName = filePath.split('/').pop();

      // CRA bundles into bundle.js — map back to App.js
      if (fileName === 'bundle.js' || fileName === 'main.chunk.js') {
        fileName = 'App.js';
      }

      return { file: fileName, line: lineNum, column: colNum };
    }
  }

  return { file: 'Unknown', line: 0, column: 0 };
}

export default sendEvent;