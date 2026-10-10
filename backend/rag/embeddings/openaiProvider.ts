import { withRetry } from '../../lib/retry.ts';
import type { EmbeddingProvider } from './embeddingService.ts';
import { assertDimensions, EmbeddingError } from './errors.ts';

const ENDPOINT = 'https://api.openai.com/v1/embeddings';

interface OpenAIEmbeddingResponse {
  data: { index: number; embedding: number[] }[];
}

/** OpenAI embeddings (text-embedding-3-small by default; multilingual, incl. Kannada). */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'openai';
  readonly model: string;
  readonly dimensions: number;
  private readonly apiKey: string;

  constructor(options: { apiKey: string; model: string; dimensions: number }) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.dimensions = options.dimensions;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const vectors = await withRetry(() => this.request(texts), {
      attempts: 4,
      isRetryable: (error) => error instanceof EmbeddingError && (error.kind === 'rate_limit' || error.kind === 'unavailable'),
      retryAfterMs: (error) => (error instanceof EmbeddingError ? error.retryAfterMs : undefined),
    });
    assertDimensions(vectors, this.dimensions, this.model);
    return vectors;
  }

  private async request(texts: string[]): Promise<number[][]> {
    // text-embedding-3 models accept a `dimensions` parameter; older models don't.
    const body: Record<string, unknown> = { model: this.model, input: texts };
    if (this.model.startsWith('text-embedding-3')) body.dimensions = this.dimensions;

    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (error) {
      throw new EmbeddingError('unavailable', `Embedding API unreachable: ${(error as Error).message}`);
    }

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      if (response.status === 401 || response.status === 403) {
        throw new EmbeddingError('auth', 'Embedding API rejected the key (check OPENAI_API_KEY).');
      }
      // OpenAI uses 429 for both rate limits and an empty account; only the former is worth retrying.
      if (response.status === 429 && /insufficient_quota|credit_balance|billing/i.test(detail)) {
        throw new EmbeddingError('auth', 'The OpenAI account has no credits left — add credits at https://platform.openai.com/settings/organization/billing/');
      }
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get('retry-after'));
        throw new EmbeddingError('rate_limit', 'Embedding API rate limit reached.', retryAfter > 0 ? retryAfter * 1000 : undefined);
      }
      if (response.status >= 500) throw new EmbeddingError('unavailable', `Embedding API error ${response.status}.`);
      throw new EmbeddingError('bad_request', `Embedding API error ${response.status}: ${detail}`);
    }

    const json = (await response.json()) as OpenAIEmbeddingResponse;
    return [...json.data].sort((a, b) => a.index - b.index).map((item) => item.embedding);
  }
}
