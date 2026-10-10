import { logger } from '../lib/logger.ts';
import { ConversationStore } from './conversation/conversationStore.ts';
import type { EmbeddingProvider } from './embeddings/embeddingService.ts';
import { buildContext, toPublicSources } from './generation/contextBuilder.ts';
import type { AnswerModel } from './generation/llm.ts';
import { buildUserPrompt, NO_INFORMATION } from './generation/prompt.ts';
import { ambiguousSessionDays, carryScheduleContext, formatDate } from './retrieval/conversationContext.ts';
import { analyzeQuery, detectLanguage, inferEventYear } from './retrieval/queryAnalysis.ts';
import { rewriteQuery } from './retrieval/queryRewriter.ts';
import { HybridRetriever } from './retrieval/hybridRetriever.ts';
import type { VectorStore } from './store/vectorStore.ts';
import type { ConversationTurn, KnowledgeEntity, RetrievedChunk } from './types.ts';
import type { RagConfig } from '../config.ts';

export interface RagQuery {
  question: string;
  conversationId?: string;
  /** Recent turns from the client; overrides server-side memory when given. */
  history?: ConversationTurn[];
}

export interface RagSource {
  id: string;
  title: string;
  category: string | null;
  similarity: number;
}

export interface RagResult {
  answer: string;
  sources: RagSource[];
  /** False when the knowledge base had nothing relevant (the answer is the "don't have that" message). */
  grounded: boolean;
  language: 'en' | 'kn';
  /** The search question after follow-up rewriting (for debugging/clients). */
  rewrittenQuestion?: string;
}

/** A controlled failure: the API returns `message` to the visitor instead of a made-up answer. */
export class RagUnavailableError extends Error {
  readonly stage: 'retrieval' | 'generation';
  readonly userMessage: string;

  constructor(stage: 'retrieval' | 'generation', cause: unknown) {
    super(`${stage} failed: ${(cause as Error)?.message ?? cause}`);
    this.name = 'RagUnavailableError';
    this.stage = stage;
    this.userMessage =
      stage === 'retrieval'
        ? "Sorry — I can't reach the B7G knowledge base right now. Please try again in a moment."
        : "Sorry — I can't answer right now. Please try again in a moment.";
  }
}

const ENTITY_CACHE_MS = 5 * 60 * 1000;

/**
 * Orchestrates one question: memory → follow-up rewrite → query analysis →
 * hybrid retrieval → grounded prompt → answer. Every dependency is injected,
 * so the same service runs against Supabase + OpenAI + Claude in production
 * and in-memory fakes in tests.
 */
export class RagService {
  private readonly store: VectorStore;
  private readonly retriever: HybridRetriever;
  private readonly model: AnswerModel;
  private readonly memory: ConversationStore;
  private readonly hiddenCategories: Set<string>;
  private entities: { list: KnowledgeEntity[]; loadedAt: number } | null = null;

  constructor(deps: { store: VectorStore; embeddings: EmbeddingProvider; model: AnswerModel; retrieval: RagConfig['retrieval']; memory?: ConversationStore }) {
    this.store = deps.store;
    this.retriever = new HybridRetriever(deps.store, deps.embeddings, deps.retrieval);
    this.model = deps.model;
    this.memory = deps.memory ?? new ConversationStore();
    this.hiddenCategories = new Set(deps.retrieval.hiddenCategories ?? []);
  }

  async query(input: RagQuery): Promise<RagResult> {
    const question = input.question.trim();
    const history = input.history?.length ? input.history : this.memory.get(input.conversationId);
    const language = detectLanguage(question);

    let chunks: RetrievedChunk[];
    let searchQuestion = question;
    let ambiguousDays: string[] | null = null;
    let askedSession: string | undefined;
    try {
      const entities = await this.getEntities();
      const rewrite = await rewriteQuery(question, history, entities, (q, h, c) => this.model.rewriteFollowUp(q, h, c));
      searchQuestion = rewrite.question;
      // Programme follow-ups: "what's happening in the evening?" after discussing a day means that day.
      const carried = carryScheduleContext(searchQuestion, history, inferEventYear(entities), entities.flatMap((e) => e.eventDates));
      if (carried) searchQuestion = `${searchQuestion.replace(/[?.!\s]+$/, '')} ${carried}?`;
      const analysis = analyzeQuery(searchQuestion, entities, question);
      chunks = await this.retriever.retrieve(analysis);
      ambiguousDays = ambiguousSessionDays(analysis.sessions, analysis.dates, chunks);
      askedSession = analysis.sessions[0];

      logger.debug('query', {
        question,
        rewritten: rewrite.method === 'none' ? undefined : `${rewrite.question} (${rewrite.method})`,
        language: analysis.language,
        entities: analysis.entities.map((e) => e.name),
        dates: analysis.dates,
        categories: analysis.categories,
        retrieved: chunks.map((c) => `${c.score.toFixed(2)} sim=${c.similarity.toFixed(2)} kw=${c.keywordCoverage.toFixed(2)} [${c.reasons.join(',')}] ${c.title} — ${c.section}`),
      });
    } catch (error) {
      logger.error('retrieval failed', (error as Error).message);
      throw new RagUnavailableError('retrieval', error);
    }

    // Same session on several days and no day given → ask, don't guess.
    if (ambiguousDays && askedSession) {
      const answer = clarifySession(askedSession, ambiguousDays, language);
      this.memory.append(input.conversationId, { role: 'user', content: question }, { role: 'assistant', content: answer });
      return { answer, sources: [], grounded: true, language, rewrittenQuestion: searchQuestion };
    }

    if (chunks.length === 0) {
      const answer = NO_INFORMATION[language];
      this.memory.append(input.conversationId, { role: 'user', content: question }, { role: 'assistant', content: answer });
      return { answer, sources: [], grounded: false, language, rewrittenQuestion: searchQuestion };
    }

    let answer: string;
    try {
      answer = await this.model.answer(buildUserPrompt({ question, context: buildContext(chunks), history, language }));
    } catch (error) {
      logger.error('generation failed', (error as Error).message);
      throw new RagUnavailableError('generation', error);
    }
    logger.debug('answer', answer);

    this.memory.append(input.conversationId, { role: 'user', content: question }, { role: 'assistant', content: answer });
    return { answer, sources: toPublicSources(chunks), grounded: true, language, rewrittenQuestion: searchQuestion };
  }

  /** Entities change only on ingestion, so they're cached briefly. */
  private async getEntities(): Promise<KnowledgeEntity[]> {
    if (!this.entities || Date.now() - this.entities.loadedAt > ENTITY_CACHE_MS) {
      // Entities known only from hidden knowledge (e.g. unreleased programme items) aren't recognised.
      const all = await this.store.listEntities();
      const list = all.filter((e) => e.categories.some((c) => !this.hiddenCategories.has(c)));
      this.entities = { list, loadedAt: Date.now() };
    }
    return this.entities.list;
  }
}

const SESSION_KN: Record<string, string> = { morning: 'ಬೆಳಿಗ್ಗೆ', afternoon: 'ಮಧ್ಯಾಹ್ನ', evening: 'ಸಂಜೆ' };

function clarifySession(session: string, days: string[], language: 'en' | 'kn'): string {
  const labels = days.map(formatDate);
  const list = labels.length === 2 ? `${labels[0]} or ${labels[1]}` : `${labels.slice(0, -1).join(', ')} or ${labels.at(-1)}`;
  return language === 'kn'
    ? `ಯಾವ ದಿನದ ${SESSION_KN[session] ?? session} ಕಾರ್ಯಕ್ರಮ — ${labels.join(' ಅಥವಾ ')}?`
    : `There's ${/^[aeiou]/i.test(session) ? 'an' : 'a'} ${session} programme on more than one day — do you mean ${list}?`;
}
