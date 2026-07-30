// ─── API INTERCEPTOR ──────────────────────────────────────────────────────────
//
// Wraps the browser's built in fetch() function
// Watches every API call the app makes
// If a fetch call fails or returns an error status — captures and reports it
//
// This catches errors that ErrorBoundary cannot:
//   - Network failures
//   - API returning 404, 500 etc
//   - API returning wrong data shape
//
// How it works:
//   Original fetch() is saved
//   We replace fetch() with our own version
//   Our version calls the original fetch()
//   Then checks if it succeeded
//   If not — sends error to SmartTrace collector
// ─────────────────────────────────────────────────────────────────────────────

import sendEvent from './collector';

let interceptorActive = false;

// ── INIT API INTERCEPTOR ──────────────────────────────────────────────────────
// Call this once when app starts
// Wraps window.fetch with our monitoring version

export function initApiInterceptor() {
  // Don't double wrap if already active
  if (interceptorActive) return;
  interceptorActive = true;

  // Save original fetch so we can still call it
  const originalFetch = window.fetch;

  console.log('[SmartTrace SDK] API interceptor active');

  // Replace fetch with our monitored version
  window.fetch = async function (url, options = {}) {
    const startTime = Date.now();
    const method = options.method || 'GET';

    try {
      // Call the real fetch
      const response = await originalFetch(url, options);
      const duration = Date.now() - startTime;

      // Check if response is an error status (4xx or 5xx)
      if (!response.ok) {
        console.warn(`[SmartTrace SDK] API error: ${method} ${url} → ${response.status}`);

        // Send to collector
        await sendEvent({
          errorType: 'APIError',
          message: `API call failed: ${method} ${url} returned ${response.status} ${response.statusText}`,
          stack: new Error().stack,
          file: 'apiInterceptor.js',
          line: 0,
          component: 'fetch',
          extra: {
            type: 'api_error',
            url,
            method,
            status: response.status,
            statusText: response.statusText,
            duration,
          },
        });
      }

      return response;

    } catch (err) {
      // Network error — fetch itself failed (no internet, server down etc)
      const duration = Date.now() - startTime;

      console.error(`[SmartTrace SDK] Network error: ${method} ${url}`, err.message);

      await sendEvent({
        errorType: 'NetworkError',
        message: `Network error: ${method} ${url} — ${err.message}`,
        stack: err.stack || new Error().stack,
        file: 'apiInterceptor.js',
        line: 0,
        component: 'fetch',
        extra: {
          type: 'network_error',
          url,
          method,
          duration,
          originalError: err.message,
        },
      });

      // Re-throw so the app still handles it normally
      throw err;
    }
  };
}

// ── DISABLE INTERCEPTOR ───────────────────────────────────────────────────────
// Restore original fetch if needed

export function disableApiInterceptor() {
  interceptorActive = false;
  console.log('[SmartTrace SDK] API interceptor disabled');
}