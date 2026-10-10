/**
 * Minimal structured logger. Debug lines (the RAG trace: question, rewrite,
 * entities, retrieved chunks, scores) only print when RAG_DEBUG=true, so
 * visitors' questions aren't written to production logs by default.
 */
let debugEnabled = false;

export function setDebug(enabled: boolean): void {
  debugEnabled = enabled;
}

function write(level: string, message: string, data?: unknown): void {
  const line = `[rag] ${level} ${message}`;
  const out = level === 'error' || level === 'warn' ? console.error : console.log;
  if (data === undefined) out(line);
  else out(line, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
}

export const logger = {
  debug: (message: string, data?: unknown) => {
    if (debugEnabled) write('debug', message, data);
  },
  info: (message: string, data?: unknown) => write('info', message, data),
  warn: (message: string, data?: unknown) => write('warn', message, data),
  error: (message: string, data?: unknown) => write('error', message, data),
};
