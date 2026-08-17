// ─── SMARTTRACE SDK ───────────────────────────────────────────────────────────
//
// Usage:
//
// 1. In src/index.js:
//    import SmartTraceErrorBoundary from './sdk';
//    root.render(
//      <SmartTraceErrorBoundary>
//        <App />
//      </SmartTraceErrorBoundary>
//    );
//
// 2. In src/App.js:
//    import { initSmartTrace } from './sdk';
//    initSmartTrace({ userId: currentUser.id });
// ─────────────────────────────────────────────────────────────────────────────

import SmartTraceErrorBoundary from './errorBoundary';
import { initApiInterceptor } from './apiInterceptor';
import { setCurrentUserId } from './collector';

export function initSmartTrace(config = {}) {
  console.log('[SmartTrace SDK] Initializing...');

  // Set current user ID
  if (config.userId) {
    setCurrentUserId(config.userId);
    console.log(`[SmartTrace SDK] User: ${config.userId}`);
  }

  // Start API interceptor
  initApiInterceptor();

  console.log('[SmartTrace SDK] Ready — monitoring errors');
}

export { SmartTraceErrorBoundary };
export default SmartTraceErrorBoundary;