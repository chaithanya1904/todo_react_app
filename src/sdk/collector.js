// ─── COLLECTOR ────────────────────────────────────────────────────────────────
//
// This file is responsible for sending captured errors
// to the SmartTrace Collector server running on port 5000
//
// It receives an error event object and POSTs it to the collector
// If the collector is not running it logs a warning and does nothing
// It never throws errors — it must never break the host app
// ─────────────────────────────────────────────────────────────────────────────

const COLLECTOR_URL = 'http://localhost:5000/events';

// ── SEND EVENT ────────────────────────────────────────────────────────────────
// Takes an error event and sends it to the collector
// Wrapped in try/catch so SDK never crashes the app

async function sendEvent(event) {
  try {
    const payload = {
      // Error details
      errorType: event.errorType || 'Error',
      message: event.message || 'Unknown error',
      stack: event.stack || '',

      // Location details — where in the code did it crash
      file: event.file || 'Unknown',
      line: event.line || 0,
      column: event.column || 0,
      component: event.component || 'Unknown',

      // Context — what was the user doing
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),

      // Any extra info passed in
      extra: event.extra || {},
    };

    console.log('[SmartTrace SDK] Sending error to collector:', payload.message);

    const response = await fetch(COLLECTOR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[SmartTrace SDK] Error recorded — Issue #${result.issueId} (count: ${result.count})`);
    } else {
      console.warn('[SmartTrace SDK] Collector returned error:', response.status);
    }

  } catch (err) {
    // Collector might not be running — log warning but never crash app
    console.warn('[SmartTrace SDK] Could not reach collector:', err.message);
    console.warn('[SmartTrace SDK] Is collector running on port 5000?');
  }
}

// ── PARSE STACK TRACE ─────────────────────────────────────────────────────────
// Extracts file name and line number from a JavaScript stack trace
//
// Stack trace looks like:
// TypeError: Cannot read properties of null
//     at TaskItem (App.js:43:20)
//     at renderWithHooks (react-dom.js:1234:56)
//
// We want: file = App.js, line = 43

export function parseStackTrace(stack) {
  if (!stack) return { file: 'Unknown', line: 0, column: 0 };

  // Split stack into lines
  const lines = stack.split('\n');

  // Look through each line for our app files
  // Skip react-dom and node_modules lines
  for (const line of lines) {
    // Match patterns like:   at Component (App.js:43:20)
    // or:                    at App.js:43:20
    const match = line.match(/at\s+.*?\(?(.*?\.jsx?):(\d+):(\d+)\)?/);

    if (match) {
      const filePath = match[1];
      const lineNum = parseInt(match[2]);
      const colNum = parseInt(match[3]);

      // Skip react internal files and node_modules
      if (
        filePath.includes('react-dom') ||
        filePath.includes('node_modules') ||
        filePath.includes('webpack')
      ) {
        continue;
      }

      // Extract just the filename from full path
      const fileName = filePath.split('/').pop();

      return {
        file: fileName,
        line: lineNum,
        column: colNum,
      };
    }
  }

  return { file: 'Unknown', line: 0, column: 0 };
}

export default sendEvent;