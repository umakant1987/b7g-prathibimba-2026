import { estimateTokens, slugify } from '../text.ts';
import type { KnowledgeChunk, KnowledgeDocument, KnowledgeSection } from '../types.ts';
import { sha256, stableStringify } from './hash.ts';

export interface ChunkingOptions {
  maxTokens: number;
  overlapTokens: number;
}

/**
 * Splits documents into embeddable chunks. Section boundaries come first
 * (each `##` section is its own unit); only sections longer than `maxTokens`
 * are split further, at paragraph/bullet boundaries with `overlapTokens` of
 * overlap. Every chunk's embedded text starts with a context header naming
 * the entity, role and date, so a chunk like "He won the award" is never
 * embedded without saying who "he" is.
 */
export function chunkDocuments(documents: KnowledgeDocument[], options: ChunkingOptions): KnowledgeChunk[] {
  return documents.flatMap((doc) => chunkDocument(doc, options));
}

function chunkDocument(doc: KnowledgeDocument, options: ChunkingOptions): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  doc.sections.forEach((section, sectionIndex) => {
    const parts = splitSection(cleanMarkdown(section.content), options);
    parts.forEach((content, partIndex) => {
      chunks.push(buildChunk(doc, section, content, `${sectionIndex}-${slugify(section.heading)}`, partIndex, chunks.length));
    });
  });
  return chunks;
}

function buildChunk(
  doc: KnowledgeDocument,
  section: KnowledgeSection,
  content: string,
  sectionKey: string,
  partIndex: number,
  chunkIndex: number,
): KnowledgeChunk {
  const eventDate = section.event_date ?? doc.event_date ?? null;
  const language = section.language ?? doc.language;
  const header = contextHeader(doc, section, eventDate);
  const embeddingText = `${header}\n${content}`;
  const metadata: Record<string, unknown> = {
    ...doc.metadata,
    event: doc.event,
    file: doc.file,
    updated_by: doc.updated_by,
    updated_at: doc.updated_at,
  };

  const chunk: Omit<KnowledgeChunk, 'content_hash' | 'metadata_hash'> = {
    chunk_key: `${doc.id}#${sectionKey}#${partIndex}`,
    document_id: doc.id,
    chunk_index: chunkIndex,
    title: doc.title,
    section: section.heading,
    content,
    embedding_text: embeddingText,
    category: doc.category,
    subcategory: section.subcategory ?? doc.subcategory ?? null,
    entity_type: doc.entity_type ?? null,
    entity_name: doc.entity_name ?? null,
    aliases: doc.aliases,
    source: doc.source,
    source_url: doc.source_url ?? null,
    event_date: eventDate,
    language,
    metadata,
    version: doc.version,
    is_active: doc.is_active,
  };

  // content_hash decides re-embedding; metadata_hash catches metadata-only edits.
  const { embedding_text: _text, content: _content, chunk_key: _key, ...rest } = chunk;
  return { ...chunk, content_hash: sha256(embeddingText), metadata_hash: sha256(stableStringify(rest)) };
}

/** e.g. "Prakash Belawadi — Chief Guest — B7G Kannada Rajyotsava 2026 — 2026-11-01 — Section: What awards has he received?" */
function contextHeader(doc: KnowledgeDocument, section: KnowledgeSection, eventDate: string | null): string {
  const parts = [doc.entity_name ?? doc.title, doc.category.replace(/_/g, ' ')];
  if (doc.event) parts.push(doc.event);
  if (eventDate) parts.push(eventDate);
  if (doc.entity_name && doc.title !== doc.entity_name) parts.push(doc.title);
  return `${parts.join(' — ')}\nSection: ${section.heading}`;
}

/** Strips Markdown syntax that adds noise to embeddings but no meaning. */
function cleanMarkdown(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^>\s?/, '')
        .replace(/^\s*[-*]\s+/, '• ')
        .replace(/^\|?\s*-{3,}.*$/, '')
        .replace(/^\|(.*)\|$/, (_, row: string) => row.split('|').map((cell) => cell.trim()).join(' — '))
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1$2')
        .replace(/`([^`]+)`/g, '$1')
        .trimEnd(),
    )
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Splits a long section at line boundaries into ≤ maxTokens pieces with overlap. */
function splitSection(text: string, { maxTokens, overlapTokens }: ChunkingOptions): string[] {
  if (estimateTokens(text) <= maxTokens) return [text];

  const units = text.split('\n').flatMap((line) =>
    estimateTokens(line) > maxTokens ? line.split(/(?<=[.!?।])\s+/) : [line],
  );
  const pieces: string[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const unit of units) {
    const tokens = estimateTokens(unit);
    if (currentTokens + tokens > maxTokens && current.length > 0) {
      pieces.push(current.join('\n').trim());
      // Carry the tail of the previous piece forward as overlap.
      const overlap: string[] = [];
      let overlapSize = 0;
      for (let i = current.length - 1; i >= 0 && overlapSize < overlapTokens; i -= 1) {
        overlap.unshift(current[i]);
        overlapSize += estimateTokens(current[i]);
      }
      current = overlap;
      currentTokens = overlapSize;
    }
    current.push(unit);
    currentTokens += tokens;
  }
  if (current.length > 0) pieces.push(current.join('\n').trim());
  return pieces.filter(Boolean);
}
