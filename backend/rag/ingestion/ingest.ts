import { embedInBatches, type EmbeddingProvider } from '../embeddings/embeddingService.ts';
import { loadKnowledge, type LoadIssue } from '../knowledge/loadKnowledge.ts';
import type { ChunkWrite, VectorStore } from '../store/vectorStore.ts';
import type { KnowledgeChunk } from '../types.ts';
import { chunkDocuments, type ChunkingOptions } from './chunkDocuments.ts';

export interface IngestOptions {
  knowledgeDir: string;
  store: VectorStore;
  embeddings: EmbeddingProvider;
  chunking: ChunkingOptions;
  batchSize: number;
  /** Deactivate stored chunks no longer present in the knowledge files (default true). */
  deactivateMissing?: boolean;
  /** Load, validate and chunk only: no embedding calls, no writes. */
  dryRun?: boolean;
}

export interface IngestReport {
  filesRead: number;
  documentsFound: number;
  chunksCreated: number;
  embeddingsGenerated: number;
  inserted: number;
  updated: number;
  metadataOnlyUpdates: number;
  skippedUnchanged: number;
  deactivated: number;
  failed: number;
  issues: LoadIssue[];
  chunks: KnowledgeChunk[];
}

/**
 * The ingestion pipeline: load → validate → chunk → hash → embed (only what
 * changed) → upsert → deactivate removed chunks. Re-running it is cheap:
 * unchanged chunks (same content hash and embedding model) cost no embedding
 * calls. Designed to be called from the CLI today and an admin upload later.
 */
export async function ingestKnowledge(options: IngestOptions): Promise<IngestReport> {
  const { documents, issues, filesRead } = await loadKnowledge(options.knowledgeDir);
  const chunks = chunkDocuments(documents, options.chunking);

  const report: IngestReport = {
    filesRead,
    documentsFound: documents.length,
    chunksCreated: chunks.length,
    embeddingsGenerated: 0,
    inserted: 0,
    updated: 0,
    metadataOnlyUpdates: 0,
    skippedUnchanged: 0,
    deactivated: 0,
    failed: issues.length,
    issues,
    chunks,
  };
  if (options.dryRun) return report;

  const existing = await options.store.getChunkStates();
  const model = options.embeddings.model;
  const toEmbed: KnowledgeChunk[] = [];
  const metadataOnly: KnowledgeChunk[] = [];

  for (const chunk of chunks) {
    const stored = existing.get(chunk.chunk_key);
    const sameContent =
      stored &&
      stored.content_hash === chunk.content_hash &&
      stored.embedding_model === model &&
      stored.embedding_dimensions === options.embeddings.dimensions;
    if (!sameContent) {
      toEmbed.push(chunk);
      if (stored) report.updated += 1;
      else report.inserted += 1;
    } else if (stored.metadata_hash !== chunk.metadata_hash || stored.is_active !== chunk.is_active) {
      metadataOnly.push(chunk);
      report.metadataOnlyUpdates += 1;
    } else {
      report.skippedUnchanged += 1;
    }
  }

  const vectors = await embedInBatches(options.embeddings, toEmbed.map((c) => c.embedding_text), options.batchSize);
  report.embeddingsGenerated = vectors.length;

  const writes: ChunkWrite[] = [
    ...toEmbed.map((chunk, i) => ({ chunk, embedding: { vector: vectors[i], model } })),
    ...metadataOnly.map((chunk) => ({ chunk })),
  ];
  await options.store.writeChunks(writes);

  if (options.deactivateMissing !== false) {
    const current = new Set(chunks.map((c) => c.chunk_key));
    const stale = [...existing.values()].filter((s) => s.is_active && !current.has(s.chunk_key)).map((s) => s.chunk_key);
    await options.store.deactivateChunks(stale);
    report.deactivated = stale.length;
  }

  return report;
}
