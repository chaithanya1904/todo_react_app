// ─── ERROR BOUNDARY ───────────────────────────────────────────────────────────
//
// React Error Boundary — catches crashes that happen DURING rendering
//
// When a React component crashes (like our Bug 1 and Bug 3):
//   null.charAt(0)         → TypeError
//   undefined.trim()       → TypeError
//
// React calls this Error Boundary automatically
// It catches the error before the white screen appears
// Sends the error to SmartTrace collector
// Shows a friendly error message instead of blank white screen
//
// This is a CLASS component — Error Boundaries must be class components
// That is a React requirement — cannot be done with function components
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import sendEvent, { parseStackTrace } from './collector';

class SmartTraceErrorBoundary extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  // ── CALLED WHEN CHILD COMPONENT CRASHES ────────────────────────────────────
  // React calls this automatically when any child component throws an error
  // This is where we capture and send the error to SmartTrace

  componentDidCatch(error, errorInfo) {
    console.log('[SmartTrace SDK] Render crash caught by ErrorBoundary');
    console.log('[SmartTrace SDK] Error:', error.message);

    // Parse the stack trace to find exact file and line
    const { file, line, column } = parseStackTrace(error.stack);

    // Extract the component name from React's component stack
    // componentStack looks like:
    //   at TaskItem
    //   at div
    //   at App
    const componentStackLines = errorInfo.componentStack
      .trim()
      .split('\n');

    const crashedComponent = componentStackLines[0]
      ? componentStackLines[0].trim().replace('at ', '')
      : 'Unknown';

    // Build the error event to send to collector
    const event = {
      errorType: error.name || 'Error',
      message: error.message || 'Unknown render error',
      stack: error.stack || '',
      file,
      line,
      column,
      component: crashedComponent,
      componentStack: errorInfo.componentStack,
      extra: {
        type: 'render_crash',
      },
    };

    // Send to collector
    sendEvent(event);

    // Save error in state to show friendly error screen
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  // ── CALLED TO UPDATE STATE BEFORE RENDERING ────────────────────────────────
  // Tells React to show the fallback UI

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // ── RESET ERROR BOUNDARY ───────────────────────────────────────────────────
  // Allow user to try again

  handleReset() {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  // If no error — render children normally (the whole app)
  // If error — show friendly error screen instead of white blank page

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>

            <div style={styles.iconRow}>
              <div style={styles.icon}>⚠</div>
            </div>

            <h1 style={styles.title}>Something went wrong</h1>

            <p style={styles.subtitle}>
              SmartTrace has captured this error and sent it to the dashboard
              for diagnosis.
            </p>

            <div style={styles.errorBox}>
              <div style={styles.errorLabel}>Error</div>
              <div style={styles.errorMessage}>
                {this.state.error && this.state.error.message}
              </div>
            </div>

            <div style={styles.infoRow}>
              <div style={styles.infoBadge}>
                🔍 Error captured by SmartTrace
              </div>
              <div style={styles.infoBadge}>
                📋 Check dashboard for diagnosis
              </div>
            </div>

            <button style={styles.button} onClick={() => this.handleReset()}>
              Reload App
            </button>

          </div>
        </div>
      );
    }

    // No error — render the app normally
    return this.props.children;
  }
}

// ── STYLES ────────────────────────────────────────────────────────────────────

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f0f2f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    padding: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '480px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  iconRow: {
    marginBottom: '20px',
  },
  icon: {
    fontSize: '48px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1d23',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '24px',
    lineHeight: '1.6',
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '8px',
    padding: '14px 18px',
    marginBottom: '20px',
    textAlign: 'left',
  },
  errorLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#ef4444',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  errorMessage: {
    fontSize: '13px',
    color: '#1a1d23',
    fontFamily: 'monospace',
    wordBreak: 'break-word',
  },
  infoRow: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '24px',
  },
  infoBadge: {
    fontSize: '12px',
    background: '#eff6ff',
    color: '#3b82f6',
    padding: '6px 12px',
    borderRadius: '20px',
    fontWeight: '500',
  },
  button: {
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 28px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
  },
};

export default SmartTraceErrorBoundary;