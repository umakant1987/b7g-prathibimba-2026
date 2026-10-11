/**
 * Backend configuration, read from environment variables (see docs/RAG.md).
 * Server-only: nothing here is ever sent to the browser.
 */

function env(name: string, fallback = ''): string {
  const value = process.env[name];
  return value === undefined || value.trim() === '' ? fallback : value.trim();
}

function envNumber(name: string, fallback: number): number {
  const raw = env(name);
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${name} must be a number, got "${raw}"`);
  return value;
}

/** Known output dimensions per embedding model; override with EMBEDDING_DIMENSIONS. */
const KNOWN_DIMENSIONS: Record<string, number> = {
  'text-embedding-3-small': 1536,
  'text-embedding-3-large': 3072,
  'text-embedding-ada-002': 1536,
  'local-hash-v1': 512,
};

/**
 * Default minimum cosine similarity per provider. OpenAI's text-embedding-3
 * models score relevant passages roughly 0.3–0.6, so a 0.70 cut-off would
 * reject nearly everything; tune with RAG_SIMILARITY_THRESHOLD using the
 * similarity scores printed when RAG_DEBUG=true.
 */
const DEFAULT_THRESHOLD: Record<string, number> = { openai: 0.3, local: 0.3 };

export interface RagConfig {
  embedding: { provider: string; model: string; dimensions: number; openaiApiKey: string; batchSize: number };
  llm: { model: string; effort: 'low' | 'medium' | 'high' | 'xhigh' | 'max'; maxTokens: number };
  retrieval: {
    topK: number;
    contextChunks: number;
    similarityThreshold: number;
    keywordMinCoverage: number;
    maxChunksPerDocument: number;
    /** Knowledge categories excluded from search (see showProgrammeDetails). */
    hiddenCategories: string[];
  };
  chunking: { maxTokens: number; overlapTokens: number };
  knowledgeDir: string;
  supabase: { url: string; serviceRoleKey: string };
  server: { port: number; corsOrigins: string[]; rateLimitPerMinute: number; trustProxy: boolean };
  /** Same switch as the website (VITE_SHOW_PROGRAMME_DETAILS). */
  showProgrammeDetails: boolean;
  debug: boolean;
}

export function loadConfig(): RagConfig {
  const provider = env('EMBEDDING_PROVIDER', 'openai');
  // The offline provider has exactly one model; ignore EMBEDDING_MODEL for it.
  const model = provider === 'local' ? 'local-hash-v1' : env('EMBEDDING_MODEL', 'text-embedding-3-small');
  const dimensions = envNumber('EMBEDDING_DIMENSIONS', KNOWN_DIMENSIONS[model] ?? 0);
  if (!dimensions) {
    throw new Error(`Unknown embedding dimension for "${model}". Set EMBEDDING_DIMENSIONS.`);
  }
  const effort = env('RAG_LLM_EFFORT', 'medium');
  // Detailed programme released? Off: hide the programme records, keep the "coming soon" note.
  // On: the reverse. Shared with the website so both always agree.
  const showProgrammeDetails = env('VITE_SHOW_PROGRAMME_DETAILS') === 'true';
  // Same idea for the Contribute section (VITE_SHOW_CONTRIBUTE).
  const showContribute = env('VITE_SHOW_CONTRIBUTE') === 'true';
  if (!['low', 'medium', 'high', 'xhigh', 'max'].includes(effort)) {
    throw new Error(`RAG_LLM_EFFORT must be low, medium, high, xhigh or max, got "${effort}"`);
  }

  return {
    embedding: {
      provider,
      model,
      dimensions,
      openaiApiKey: env('OPENAI_API_KEY'),
      batchSize: envNumber('EMBEDDING_BATCH_SIZE', 64),
    },
    llm: {
      model: env('RAG_LLM_MODEL', 'claude-opus-5-5'),
      effort: effort as RagConfig['llm']['effort'],
      maxTokens: envNumber('RAG_LLM_MAX_TOKENS', 16000),
    },
    retrieval: {
      topK: envNumber('RAG_TOP_K', 8),
      contextChunks: envNumber('RAG_CONTEXT_CHUNKS', 6),
      similarityThreshold: envNumber('RAG_SIMILARITY_THRESHOLD', DEFAULT_THRESHOLD[provider] ?? 0.3),
      keywordMinCoverage: envNumber('RAG_KEYWORD_MIN_COVERAGE', 0.5),
      maxChunksPerDocument: envNumber('RAG_MAX_CHUNKS_PER_DOCUMENT', 3),
      hiddenCategories: [
        showProgrammeDetails ? 'programme_teaser' : 'programme',
        showContribute ? 'contribute_teaser' : 'contribute',
      ],
    },
    chunking: {
      maxTokens: envNumber('RAG_CHUNK_MAX_TOKENS', 600),
      overlapTokens: envNumber('RAG_CHUNK_OVERLAP_TOKENS', 80),
    },
    knowledgeDir: env('RAG_KNOWLEDGE_DIR', 'knowledge'),
    supabase: {
      // The project URL is public; reuse the frontend's value when no server copy is set.
      url: env('SUPABASE_URL', env('VITE_SUPABASE_URL')),
      serviceRoleKey: env('SUPABASE_SERVICE_ROLE_KEY'),
    },
    server: {
      port: envNumber('RAG_PORT', 8787),
      corsOrigins: env('RAG_CORS_ORIGINS', 'http://localhost:5173,http://localhost:4173')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
      rateLimitPerMinute: envNumber('RAG_RATE_LIMIT_PER_MINUTE', 20),
      // Behind a proxy (Vite dev proxy, hosting load balancer) the visitor IP is in X-Forwarded-For.
      trustProxy: env('RAG_TRUST_PROXY', 'true') === 'true',
    },
    showProgrammeDetails,
    debug: env('RAG_DEBUG') === 'true',
  };
}
