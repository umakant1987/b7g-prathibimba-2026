/**
 * B7G RAG API — npm run rag:server (local). Routes and behaviour live in
 * backend/http/ragApi.ts, shared with the Vercel functions in api/.
 */
import { createServer } from 'node:http';
import { loadConfig } from './config.ts';
import { createRagApi } from './http/ragApi.ts';
import { logger, setDebug } from './lib/logger.ts';

function startup() {
  try {
    const config = loadConfig();
    setDebug(config.debug);
    return { config, api: createRagApi(config) };
  } catch (error) {
    console.error(`B7G RAG API can't start: ${(error as Error).message}\nSee docs/RAG.md → Setup.`);
    process.exit(1);
  }
}

const { config, api } = startup();

const server = createServer((req, res) => void api(req, res));

server.listen(config.server.port, () => {
  logger.info(`B7G RAG API listening on http://localhost:${config.server.port} (embeddings: ${config.embedding.model}, LLM: ${config.llm.model})`);
});
