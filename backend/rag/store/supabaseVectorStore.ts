import type { SupabaseClient } from '@supabase/supabase-js';
import type { KnowledgeEntity, SearchHit } from '../types.ts';
import {
  collectEntities,
  StoreError,
  type ChunkWrite,
  type KeywordSearchOptions,
  type StoredChunkState,
  type VectorSearchOptions,
  type VectorStore,
} from './vectorStore.ts';

const TABLE = 'knowledge_documents';
const PAGE = 1000;

/** pgvector store backed by the `knowledge_documents` table (supabase/knowledge.sql). */
export class SupabaseVectorStore implements VectorStore {
  private readonly db: SupabaseClient;

  constructor(db: SupabaseClient) {
    this.db = db;
  }

  async getChunkStates(): Promise<Map<string, StoredChunkState>> {
    const states = new Map<string, StoredChunkState>();
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await this.db
        .from(TABLE)
        .select('chunk_key, content_hash, metadata_hash, embedding_model, embedding_dimensions, is_active')
        .order('chunk_key')
        .range(from, from + PAGE - 1);
      if (error) throw new StoreError(explain(error.message));
      for (const row of data as StoredChunkState[]) states.set(row.chunk_key, row);
      if (data.length < PAGE) break;
    }
    return states;
  }

  async writeChunks(writes: ChunkWrite[]): Promise<void> {
    if (writes.length === 0) return;
    const now = new Date().toISOString();
    // Rows with and without a new embedding are written separately: an upsert
    // only overwrites the columns it sends, so metadata-only rows keep their vector.
    const withVector = writes.filter((w) => w.embedding);
    const withoutVector = writes.filter((w) => !w.embedding);
    for (const group of [withVector, withoutVector]) {
      for (let start = 0; start < group.length; start += 100) {
        const rows = group.slice(start, start + 100).map(({ chunk, embedding }) => {
          const { embedding_text: _embeddingText, ...columns } = chunk;
          return {
            ...columns,
            updated_at: now,
            ...(embedding
              ? { embedding: embedding.vector, embedding_model: embedding.model, embedding_dimensions: embedding.vector.length }
              : {}),
          };
        });
        const { error } = await this.db.from(TABLE).upsert(rows, { onConflict: 'chunk_key' });
        if (error) throw new StoreError(explain(error.message));
      }
    }
  }

  async deactivateChunks(chunkKeys: string[]): Promise<void> {
    for (let start = 0; start < chunkKeys.length; start += 100) {
      const { error } = await this.db
        .from(TABLE)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in('chunk_key', chunkKeys.slice(start, start + 100));
      if (error) throw new StoreError(explain(error.message));
    }
  }

  async vectorSearch(embedding: number[], options: VectorSearchOptions): Promise<SearchHit[]> {
    const { data, error } = await this.db.rpc('match_knowledge_documents', {
      query_embedding: embedding,
      embedding_model_name: options.model,
      match_threshold: options.threshold,
      match_count: options.count,
      filter_entity: options.entityName ?? null,
      filter_category: options.category ?? null,
      filter_event_date: options.eventDate ?? null,
    });
    if (error) throw new StoreError(explain(error.message));
    return data as SearchHit[];
  }

  async keywordSearch(terms: string[], options: KeywordSearchOptions): Promise<SearchHit[]> {
    if (terms.length === 0) return [];
    const { data, error } = await this.db.rpc('search_knowledge_keywords', {
      search_terms: terms,
      match_count: options.count,
      filter_entity: options.entityName ?? null,
    });
    if (error) throw new StoreError(explain(error.message));
    return data as SearchHit[];
  }

  async listEntities(): Promise<KnowledgeEntity[]> {
    const { data, error } = await this.db
      .from(TABLE)
      .select('entity_name, entity_type, category, event_date, aliases')
      .eq('is_active', true)
      .not('entity_name', 'is', null);
    if (error) throw new StoreError(explain(error.message));
    return collectEntities(data);
  }
}

function explain(message: string): string {
  if (/knowledge_documents|match_knowledge_documents|search_knowledge_keywords/.test(message) && /not find|does not exist/i.test(message)) {
    return `${message} — run supabase/knowledge.sql in the Supabase SQL Editor first.`;
  }
  return message;
}
