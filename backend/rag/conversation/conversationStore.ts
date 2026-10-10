import type { ConversationTurn } from '../types.ts';

/**
 * Short-term memory per conversationId, used only to rewrite follow-up
 * questions ("tell me more about him"). In-process and bounded: fine for a
 * single server; clients that answer some questions locally send their own
 * `history`, which takes precedence.
 */
export class ConversationStore {
  private readonly conversations = new Map<string, { turns: ConversationTurn[]; updatedAt: number }>();
  private readonly maxConversations: number;
  private readonly maxTurns: number;
  private readonly ttlMs: number;

  constructor(options: { maxConversations?: number; maxTurns?: number; ttlMs?: number } = {}) {
    this.maxConversations = options.maxConversations ?? 1000;
    this.maxTurns = options.maxTurns ?? 8;
    this.ttlMs = options.ttlMs ?? 2 * 60 * 60 * 1000;
  }

  get(conversationId: string | undefined): ConversationTurn[] {
    if (!conversationId) return [];
    const entry = this.conversations.get(conversationId);
    if (!entry || Date.now() - entry.updatedAt > this.ttlMs) {
      this.conversations.delete(conversationId);
      return [];
    }
    return entry.turns;
  }

  append(conversationId: string | undefined, ...turns: ConversationTurn[]): void {
    if (!conversationId) return;
    const existing = this.get(conversationId);
    this.conversations.delete(conversationId); // re-insert so Map order = least recently used first
    this.conversations.set(conversationId, { turns: [...existing, ...turns].slice(-this.maxTurns), updatedAt: Date.now() });
    while (this.conversations.size > this.maxConversations) {
      const oldest = this.conversations.keys().next().value;
      if (oldest === undefined) break;
      this.conversations.delete(oldest);
    }
  }
}
