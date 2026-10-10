/** Shared types for the RAG pipeline. */

/** A semantic section of a knowledge document (one or more chunks). */
export interface KnowledgeSection {
  heading: string;
  content: string;
  subcategory?: string;
  /** Overrides the document language, e.g. a Kannada summary inside an English document. */
  language?: string;
  /** Overrides the document event date for this section. */
  event_date?: string;
}

/**
 * Canonical knowledge document. JSON files in /knowledge use this shape
 * directly (see knowledge/_schema); Markdown files are converted into it.
 */
export interface KnowledgeDocument {
  /** Stable id, e.g. "chief-guests/prakash-belawadi". Derived from the file when omitted. */
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  entity_type?: string;
  entity_name?: string;
  /** Other names for the entity, incl. Kannada script and common misspellings. */
  aliases: string[];
  language: string;
  event?: string;
  /** YYYY-MM-DD */
  event_date?: string;
  source: string;
  source_url?: string;
  version: number;
  updated_by?: string;
  updated_at?: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  sections: KnowledgeSection[];
  /** File the document came from, relative to the knowledge directory. */
  file: string;
}

/** One embeddable unit of knowledge. */
export interface KnowledgeChunk {
  chunk_key: string;
  document_id: string;
  chunk_index: number;
  title: string;
  section: string;
  /** Clean section text shown to the LLM. */
  content: string;
  /** Context header + content: what gets embedded, so the chunk stands alone. */
  embedding_text: string;
  category: string;
  subcategory: string | null;
  entity_type: string | null;
  entity_name: string | null;
  aliases: string[];
  source: string;
  source_url: string | null;
  event_date: string | null;
  language: string;
  metadata: Record<string, unknown>;
  version: number;
  is_active: boolean;
  content_hash: string;
  metadata_hash: string;
}

/** A chunk returned by a search, with whichever relevance signals that search produced. */
export interface SearchHit {
  id: string;
  chunk_key: string;
  document_id: string;
  title: string;
  section: string | null;
  content: string;
  category: string | null;
  subcategory: string | null;
  entity_type: string | null;
  entity_name: string | null;
  event_date: string | null;
  language: string;
  metadata: Record<string, unknown>;
  similarity?: number;
  keyword_hits?: number;
}

/** A chunk chosen for the LLM context, with its combined ranking. */
export interface RetrievedChunk extends SearchHit {
  similarity: number;
  keywordCoverage: number;
  score: number;
  reasons: string[];
}

/** An entity known to the knowledge base (built from ingested metadata). */
export interface KnowledgeEntity {
  name: string;
  type: string | null;
  categories: string[];
  eventDates: string[];
  aliases: string[];
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}
