import type { RagConfig } from '../../config.ts';
import { LocalHashEmbeddingProvider } from './localHashProvider.ts';
import { OpenAIEmbeddingProvider } from './openaiProvider.ts';
import { EmbeddingError } from './errors.ts';

export { assertDimensions, EmbeddingError, type EmbeddingErrorKind } from './errors.ts';

/** Turns text into vectors. Add a provider by implementing this and registering it below. */
export interface EmbeddingProvider {
  readonly name: string;
  readonly model: string;
  readonly dimensions: number;
  embed(texts: string[]): Promise<number[][]>;
}

export function createEmbeddingProvider(config: RagConfig): EmbeddingProvider {
  const { provider, model, dimensions, openaiApiKey } = config.embedding;
  switch (provider) {
    case 'openai':
      if (!openaiApiKey) throw new EmbeddingError('config', 'EMBEDDING_PROVIDER=openai needs OPENAI_API_KEY.');
      return new OpenAIEmbeddingProvider({ apiKey: openaiApiKey, model, dimensions });
    case 'local':
      return new LocalHashEmbeddingProvider(dimensions);
    default:
      throw new EmbeddingError('config', `Unknown EMBEDDING_PROVIDER "${provider}". Use "openai" or "local".`);
  }
}

/** Embeds many texts in batches, preserving order. */
export async function embedInBatches(provider: EmbeddingProvider, texts: string[], batchSize: number): Promise<number[][]> {
  const vectors: number[][] = [];
  for (let start = 0; start < texts.length; start += batchSize) {
    vectors.push(...(await provider.embed(texts.slice(start, start + batchSize))));
  }
  return vectors;
}
