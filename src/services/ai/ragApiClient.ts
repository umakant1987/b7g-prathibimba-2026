import { RAG_API_URL } from '../../config/env';

export interface RagApiTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface RagApiResponse {
  answer: string;
  sources: { id: string; title: string; category: string | null; similarity: number }[];
  grounded: boolean;
  language: 'en' | 'kn';
}

/**
 * Calls the backend RAG API (backend/server.ts). The browser never sees API
 * keys, embeddings or database access — only the answer and source titles.
 * Throws on any failure so the caller can fall back to the offline assistant.
 */
export async function queryRagApi(
  question: string,
  conversationId: string | undefined,
  history: RagApiTurn[],
): Promise<RagApiResponse> {
  const response = await fetch(RAG_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, conversationId, history }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`RAG API responded ${response.status}`);
  return (await response.json()) as RagApiResponse;
}
