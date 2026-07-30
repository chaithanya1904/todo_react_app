// ─── SMARTTRACE SDK ───────────────────────────────────────────────────────────
//
// Main entry point for the SmartTrace SDK
//
// Two things need to happen to use the SDK:
//
// 1. In src/index.js — wrap the entire app with ErrorBoundary:
//
//    import SmartTraceErrorBoundary from './smarttrace-sdk';
//
//    root.render(
//      <SmartTraceErrorBoundary>
//        <App />
//      </SmartTraceErrorBoundary>
//    );
//
// 2. In src/App.js — initialize the API interceptor at the top:
//
//    import { initSmartTrace } from './smarttrace-sdk';
//    initSmartTrace();
//
// That is all. SDK is now active and monitoring the app.
// ─────────────────────────────────────────────────────────────────────────────

import SmartTraceErrorBoundary from './errorBoundary';
import { initApiInterceptor } from './apiInterceptor';

// ── INIT SMARTTRACE ───────────────────────────────────────────────────────────
// Call this once at the top of App.js
// Starts the API interceptor

export function initSmartTrace() {
  console.log('[SmartTrace SDK] Initializing...');
  initApiInterceptor();
  console.log('[SmartTrace SDK] Ready — monitoring errors');
}

// ── EXPORTS ───────────────────────────────────────────────────────────────────

export { SmartTraceErrorBoundary };
export default SmartTraceErrorBoundary;