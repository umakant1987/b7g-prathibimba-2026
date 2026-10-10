import { searchTerms, words } from '../text.ts';
import type { EmbeddingProvider } from './embeddingService.ts';

/**
 * Deterministic, offline "embedding" built by hashing words and character
 * trigrams into a fixed-size vector. It captures lexical overlap only — not
 * meaning — so use it for tests and keyless local development, never in
 * production (EMBEDDING_PROVIDER=openai there).
 */
export class LocalHashEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'local';
  readonly model = 'local-hash-v1';
  readonly dimensions: number;

  constructor(dimensions = 512) {
    this.dimensions = dimensions;
  }

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((text) => this.vectorize(text));
  }

  private vectorize(text: string): number[] {
    const vector = new Array<number>(this.dimensions).fill(0);
    const add = (feature: string, weight: number) => {
      const hash = fnv1a(feature);
      vector[hash % this.dimensions] += hash & 0x80000000 ? -weight : weight;
    };
    for (const term of searchTerms(text)) add(`w:${term}`, 2);
    for (const word of words(text)) {
      const padded = `^${word}$`;
      for (let i = 0; i + 3 <= padded.length; i += 1) add(`t:${padded.slice(i, i + 3)}`, 0.5);
    }
    const norm = Math.hypot(...vector) || 1;
    return vector.map((value) => value / norm);
  }
}

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}
