/**
 * B7G RAG API — npm run rag:server
 *
 *   POST /api/rag/query  { question, conversationId?, history? } → { answer, sources, grounded, language }
 *   GET  /api/health
 *
 * Holds every secret (Supabase service-role key, OpenAI and Anthropic keys);
 * the browser only ever sees answers and source titles.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { loadConfig } from './config.ts';
import { logger, setDebug } from './lib/logger.ts';
import { getServiceClient } from './lib/supabase.ts';
import { createEmbeddingProvider } from './rag/embeddings/embeddingService.ts';
import { ClaudeAnswerModel } from './rag/generation/llm.ts';
import { RagService, RagUnavailableError } from './rag/ragService.ts';
import { SupabaseVectorStore } from './rag/store/supabaseVectorStore.ts';
import type { ConversationTurn } from './rag/types.ts';

const MAX_BODY_BYTES = 16 * 1024;
const MAX_QUESTION_CHARS = 1000;

function startup() {
  try {
    const config = loadConfig();
    setDebug(config.debug);
    const rag = new RagService({
      store: new SupabaseVectorStore(getServiceClient(config)),
      embeddings: createEmbeddingProvider(config),
      model: new ClaudeAnswerModel(config.llm),
      retrieval: config.retrieval,
    });
    return { config, rag };
  } catch (error) {
    console.error(`B7G RAG API can't start: ${(error as Error).message}\nSee docs/RAG.md → Setup.`);
    process.exit(1);
  }
}

const { config, rag } = startup();

/** Simple fixed-window limit per client IP, so a public page can't run up AI costs. */
const requestsByIp = new Map<string, { count: number; windowStart: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = requestsByIp.get(ip);
  if (!entry || now - entry.windowStart > 60_000) {
    requestsByIp.set(ip, { count: 1, windowStart: now });
    if (requestsByIp.size > 10_000) requestsByIp.clear();
    return false;
  }
  entry.count += 1;
  return entry.count > config.server.rateLimitPerMinute;
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function applyCors(req: IncomingMessage, res: ServerResponse): void {
  const origin = req.headers.origin;
  if (origin && config.server.corsOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const parts: Buffer[] = [];
  for await (const part of req) {
    size += (part as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new Error('too_large');
    parts.push(part as Buffer);
  }
  return JSON.parse(Buffer.concat(parts).toString('utf8') || '{}');
}

/** Accepts only well-formed recent turns; anything else is ignored rather than trusted. */
function parseHistory(value: unknown): ConversationTurn[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((t): t is ConversationTurn => !!t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string')
    .slice(-6)
    .map((t) => ({ role: t.role, content: t.content.slice(0, 2000) }));
}

async function handleQuery(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const forwarded = config.server.trustProxy ? String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() : '';
  const ip = forwarded || req.socket.remoteAddress || 'unknown';
  if (rateLimited(ip)) {
    send(res, 429, { error: 'rate_limited', answer: "You're asking very quickly — please wait a moment and try again." });
    return;
  }

  let body: Record<string, unknown>;
  try {
    body = (await readJson(req)) as Record<string, unknown>;
  } catch (error) {
    send(res, (error as Error).message === 'too_large' ? 413 : 400, { error: 'invalid_request', message: 'Send a JSON body.' });
    return;
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question || question.length > MAX_QUESTION_CHARS) {
    send(res, 400, { error: 'invalid_question', message: `"question" must be 1–${MAX_QUESTION_CHARS} characters.` });
    return;
  }
  const conversationId = typeof body.conversationId === 'string' ? body.conversationId.slice(0, 100) : undefined;

  try {
    const result = await rag.query({ question, conversationId, history: parseHistory(body.history) });
    send(res, 200, result);
  } catch (error) {
    if (error instanceof RagUnavailableError) {
      send(res, 503, { error: `${error.stage}_unavailable`, answer: error.userMessage });
      return;
    }
    logger.error('unexpected error', (error as Error).stack ?? String(error));
    send(res, 500, { error: 'internal_error', answer: "Sorry — something went wrong. Please try again." });
  }
}

const server = createServer((req, res) => {
  applyCors(req, res);
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
  } else if (req.method === 'POST' && url.pathname === '/api/rag/query') {
    void handleQuery(req, res);
  } else if (req.method === 'GET' && url.pathname === '/api/health') {
    send(res, 200, { ok: true, embeddingModel: config.embedding.model, llmModel: config.llm.model });
  } else {
    send(res, 404, { error: 'not_found' });
  }
});

server.listen(config.server.port, () => {
  logger.info(`B7G RAG API listening on http://localhost:${config.server.port} (embeddings: ${config.embedding.model}, LLM: ${config.llm.model})`);
});
