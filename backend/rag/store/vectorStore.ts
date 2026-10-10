import type { KnowledgeChunk, KnowledgeEntity, SearchHit } from '../types.ts';

/** What ingestion needs to know about a chunk already in the store. */
export interface StoredChunkState {
  chunk_key: string;
  content_hash: string;
  metadata_hash: string | null;
  embedding_model: string | null;
  embedding_dimensions: number | null;
  is_active: boolean;
}

/** A chunk to write. `embedding` is omitted for metadata-only updates, which keep the stored vector. */
export interface ChunkWrite {
  chunk: KnowledgeChunk;
  embedding?: { vector: number[]; model: string };
}

export interface VectorSearchOptions {
  model: string;
  threshold: number;
  count: number;
  entityName?: string;
  category?: string;
  eventDate?: string;
}

export interface KeywordSearchOptions {
  count: number;
  entityName?: string;
}

export class StoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StoreError';
  }
}

/** Storage for knowledge chunks and their vectors. Supabase in production; in-memory in tests. */
export interface VectorStore {
  getChunkStates(): Promise<Map<string, StoredChunkState>>;
  writeChunks(writes: ChunkWrite[]): Promise<void>;
  /** Marks chunks inactive (kept for history, excluded from search). */
  deactivateChunks(chunkKeys: string[]): Promise<void>;
  vectorSearch(embedding: number[], options: VectorSearchOptions): Promise<SearchHit[]>;
  keywordSearch(terms: string[], options: KeywordSearchOptions): Promise<SearchHit[]>;
  /** Entities (people, events, …) of active chunks, with aliases, for entity-aware retrieval. */
  listEntities(): Promise<KnowledgeEntity[]>;
}

/** Groups per-chunk entity rows into one entry per entity name. */
export function collectEntities(
  rows: { entity_name: string | null; entity_type: string | null; category: string | null; event_date: string | null; aliases: string[] | null }[],
): KnowledgeEntity[] {
  const byName = new Map<string, KnowledgeEntity>();
  for (const row of rows) {
    if (!row.entity_name) continue;
    const entity = byName.get(row.entity_name) ?? {
      name: row.entity_name,
      type: row.entity_type,
      categories: [],
      eventDates: [],
      aliases: [],
    };
    if (row.category && !entity.categories.includes(row.category)) entity.categories.push(row.category);
    if (row.event_date && !entity.eventDates.includes(row.event_date)) entity.eventDates.push(row.event_date);
    for (const alias of row.aliases ?? []) if (!entity.aliases.includes(alias)) entity.aliases.push(alias);
    byName.set(row.entity_name, entity);
  }
  return [...byName.values()];
}
