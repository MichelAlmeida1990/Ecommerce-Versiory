export interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  source: 'frontend' | 'api';
  timestamp: number;
  userAgent?: string;
}

const STORAGE_KEY = 'versiory_error_logs';
const MAX_LOGS = 200;

export function logError(message: string, stack?: string, source: 'frontend' | 'api' = 'frontend') {
  try {
    const logs: ErrorLog[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    logs.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      stack,
      source,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    });
    if (logs.length > MAX_LOGS) logs.length = MAX_LOGS;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // ignore
  }
}

export function getErrorLogs(): ErrorLog[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearErrorLogs() {
  localStorage.removeItem(STORAGE_KEY);
}

// Auto-capture global errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    logError(e.message || 'Unknown error', e.error?.stack, 'frontend');
  });
  window.addEventListener('unhandledrejection', (e) => {
    logError(String(e.reason?.message || e.reason || 'Unhandled rejection'), e.reason?.stack, 'frontend');
  });
}
