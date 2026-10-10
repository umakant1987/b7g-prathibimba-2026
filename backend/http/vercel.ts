/**
 * Vercel entry: one RAG API per function instance, created on the first
 * request and reused while the instance stays warm. Secrets come from the
 * project's environment variables (never VITE_-prefixed).
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadConfig } from '../config.ts';
import { logger, setDebug } from '../lib/logger.ts';
import { createRagApi, send, type RagApiHandler } from './ragApi.ts';

let api: RagApiHandler | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!api) {
    try {
      const config = loadConfig();
      setDebug(config.debug);
      api = createRagApi(config);
    } catch (error) {
      logger.error('RAG API configuration error', (error as Error).message);
      send(res, 503, { error: 'config_unavailable', answer: 'The assistant is not available right now. Please try again later.' });
      return;
    }
  }
  await api(req, res);
}
