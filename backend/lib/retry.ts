/** Retries an async operation with exponential backoff when `isRetryable` says so. */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: { attempts?: number; baseDelayMs?: number; isRetryable: (error: unknown) => boolean; retryAfterMs?: (error: unknown) => number | undefined },
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 500;
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !options.isRetryable(error)) throw error;
      const delay = options.retryAfterMs?.(error) ?? baseDelayMs * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
