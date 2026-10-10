/** Errors raised by embedding providers, classified so callers can retry or report precisely. */
export type EmbeddingErrorKind = 'config' | 'auth' | 'rate_limit' | 'unavailable' | 'bad_request' | 'dimension_mismatch';

export class EmbeddingError extends Error {
  readonly kind: EmbeddingErrorKind;
  readonly retryAfterMs?: number;

  constructor(kind: EmbeddingErrorKind, message: string, retryAfterMs?: number) {
    super(message);
    this.name = 'EmbeddingError';
    this.kind = kind;
    this.retryAfterMs = retryAfterMs;
  }
}

/** Verifies every vector has the configured dimension, so a model/config mismatch fails loudly. */
export function assertDimensions(vectors: number[][], expected: number, model: string): void {
  const wrong = vectors.find((vector) => vector.length !== expected);
  if (wrong) {
    throw new EmbeddingError(
      'dimension_mismatch',
      `${model} returned ${wrong.length}-dimensional vectors but EMBEDDING_DIMENSIONS is ${expected}.`,
    );
  }
}
