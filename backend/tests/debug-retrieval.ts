// Dev helper: prints how retrieval ranks chunks for a question (offline embeddings).
// node --experimental-strip-types backend/tests/debug-retrieval.ts "question"
import path from 'node:path';
import { LocalHashEmbeddingProvider } from '../rag/embeddings/localHashProvider.ts';
import { ingestKnowledge } from '../rag/ingestion/ingest.ts';
import { analyzeQuery } from '../rag/retrieval/queryAnalysis.ts';
import { HybridRetriever } from '../rag/retrieval/hybridRetriever.ts';
import { MemoryVectorStore } from '../rag/store/memoryVectorStore.ts';

const store = new MemoryVectorStore();
const embeddings = new LocalHashEmbeddingProvider(512);
await ingestKnowledge({ knowledgeDir: path.resolve(import.meta.dirname, '../../knowledge'), store, embeddings, chunking: { maxTokens: 600, overlapTokens: 80 }, batchSize: 64 });
const retriever = new HybridRetriever(store, embeddings, { topK: 8, contextChunks: 6, similarityThreshold: 0.3, keywordMinCoverage: 0.5, maxChunksPerDocument: 8, hiddenCategories: process.env.HIDE ? process.env.HIDE.split(',') : ['programme_teaser'] });
for (const question of process.argv.slice(2)) {
  const analysis = analyzeQuery(question, await store.listEntities());
  console.log(`\nQ: ${question}\n   terms=${analysis.terms.join(',')} entities=${analysis.entities.map((e) => e.name).join(',')} dates=${analysis.dates} categories=${analysis.categories}`);
  for (const c of await retriever.retrieve(analysis)) {
    console.log(`   ${c.score.toFixed(2)} sim=${c.similarity.toFixed(2)} kw=${c.keywordCoverage.toFixed(2)} [${c.reasons}] ${c.entity_name ?? c.title} — ${c.section}`);
  }
}
