import { KANNADA, normalize } from '../text.ts';
import type { KnowledgeChunk, KnowledgeEntity, SearchHit } from '../types.ts';
import {
  collectEntities,
  type ChunkWrite,
  type KeywordSearchOptions,
  type StoredChunkState,
  type VectorSearchOptions,
  type VectorStore,
} from './vectorStore.ts';

interface Row {
  id: string;
  chunk: KnowledgeChunk;
  embedding: number[] | null;
  embedding_model: string | null;
}

/**
 * In-memory VectorStore with the same semantics as the Supabase SQL functions.
 * Used by tests and dry runs; not persistent.
 */
export class MemoryVectorStore implements VectorStore {
  readonly rows = new Map<string, Row>();
  private nextId = 1;

  async getChunkStates(): Promise<Map<string, StoredChunkState>> {
    const states = new Map<string, StoredChunkState>();
    for (const [key, row] of this.rows) {
      states.set(key, {
        chunk_key: key,
        content_hash: row.chunk.content_hash,
        metadata_hash: row.chunk.metadata_hash,
        embedding_model: row.embedding_model,
        embedding_dimensions: row.embedding?.length ?? null,
        is_active: row.chunk.is_active,
      });
    }
    return states;
  }

  async writeChunks(writes: ChunkWrite[]): Promise<void> {
    for (const { chunk, embedding } of writes) {
      const existing = this.rows.get(chunk.chunk_key);
      this.rows.set(chunk.chunk_key, {
        id: existing?.id ?? `mem-${this.nextId++}`,
        chunk,
        embedding: embedding?.vector ?? existing?.embedding ?? null,
        embedding_model: embedding?.model ?? existing?.embedding_model ?? null,
      });
    }
  }

  async deactivateChunks(chunkKeys: string[]): Promise<void> {
    for (const key of chunkKeys) {
      const row = this.rows.get(key);
      if (row) row.chunk = { ...row.chunk, is_active: false };
    }
  }

  async vectorSearch(embedding: number[], options: VectorSearchOptions): Promise<SearchHit[]> {
    return [...this.rows.values()]
      .filter((row) => row.chunk.is_active && row.embedding && row.embedding_model === options.model)
      .filter((row) => row.embedding!.length === embedding.length)
      .filter((row) => !options.entityName || row.chunk.entity_name === options.entityName)
      .filter((row) => !options.category || row.chunk.category === options.category)
      .filter((row) => !options.eventDate || row.chunk.event_date === options.eventDate)
      .map((row) => ({ ...toHit(row), similarity: cosine(embedding, row.embedding!) }))
      .filter((hit) => hit.similarity >= options.threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, options.count);
  }

  async keywordSearch(terms: string[], options: KeywordSearchOptions): Promise<SearchHit[]> {
    return [...this.rows.values()]
      .filter((row) => row.chunk.is_active && (!options.entityName || row.chunk.entity_name === options.entityName))
      .map((row) => {
        const haystack = normalize(`${row.chunk.title} ${row.chunk.section} ${row.chunk.content} ${row.chunk.aliases.join(' ')}`);
        const hits = terms.filter((term) =>
          KANNADA.test(term) ? haystack.includes(term) : new RegExp(`\\b${term}(s|es)?\\b`).test(haystack),
        ).length;
        return { ...toHit(row), keyword_hits: hits };
      })
      .filter((hit) => hit.keyword_hits > 0)
      .sort((a, b) => b.keyword_hits - a.keyword_hits || a.content.length - b.content.length)
      .slice(0, options.count);
  }

  async listEntities(): Promise<KnowledgeEntity[]> {
    return collectEntities([...this.rows.values()].filter((row) => row.chunk.is_active).map((row) => row.chunk));
  }
}

function toHit(row: Row): SearchHit {
  const c = row.chunk;
  return {
    id: row.id,
    chunk_key: c.chunk_key,
    document_id: c.document_id,
    title: c.title,
    section: c.section,
    content: c.content,
    category: c.category,
    subcategory: c.subcategory,
    entity_type: c.entity_type,
    entity_name: c.entity_name,
    event_date: c.event_date,
    language: c.language,
    metadata: c.metadata,
  };
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
