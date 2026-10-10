/**
 * npm run rag:ingest [-- --dry-run] [-- --print] [-- --keep-missing]
 *
 *   --dry-run       validate and chunk only (no API calls, no database writes)
 *   --print         also print the canonical documents/chunks as JSON
 *   --keep-missing  don't deactivate chunks that were removed from the knowledge files
 */
import { loadConfig } from '../../config.ts';
import { getServiceClient } from '../../lib/supabase.ts';
import { createEmbeddingProvider } from '../embeddings/embeddingService.ts';
import { SupabaseVectorStore } from '../store/supabaseVectorStore.ts';
import { MemoryVectorStore } from '../store/memoryVectorStore.ts';
import { ingestKnowledge } from './ingest.ts';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');

try {
  const config = loadConfig();
  console.log(`B7G RAG ingestion started${dryRun ? ' (dry run)' : ''}\n`);
  console.log(`Knowledge folder:  ${config.knowledgeDir}`);
  if (!dryRun) console.log(`Embedding model:   ${config.embedding.provider} / ${config.embedding.model} (${config.embedding.dimensions} dimensions)`);

  const report = await ingestKnowledge({
    knowledgeDir: config.knowledgeDir,
    store: dryRun ? new MemoryVectorStore() : new SupabaseVectorStore(getServiceClient(config)),
    embeddings: dryRun ? { name: 'none', model: 'none', dimensions: 0, embed: async () => [] } : createEmbeddingProvider(config),
    chunking: config.chunking,
    batchSize: config.embedding.batchSize,
    deactivateMissing: !args.has('--keep-missing'),
    dryRun,
  });

  if (args.has('--print')) console.log(JSON.stringify(report.chunks, null, 2));

  console.log(`
Files read:             ${report.filesRead}
Documents found:        ${report.documentsFound}
Chunks created:         ${report.chunksCreated}${dryRun ? '' : `
Embeddings generated:   ${report.embeddingsGenerated}
Inserted:               ${report.inserted}
Updated:                ${report.updated}
Metadata-only updates:  ${report.metadataOnlyUpdates}
Skipped unchanged:      ${report.skippedUnchanged}
Deactivated (removed):  ${report.deactivated}`}
Failed:                 ${report.failed}`);

  for (const issue of report.issues) console.log(`  ✗ ${issue.file}: ${issue.message}`);
  console.log(report.failed === 0 ? '\nRAG ingestion completed successfully.' : '\nRAG ingestion completed with errors (see above).');
  process.exitCode = report.failed === 0 ? 0 : 1;
} catch (error) {
  console.error(`\nRAG ingestion failed: ${(error as Error).message}`);
  process.exitCode = 1;
}
