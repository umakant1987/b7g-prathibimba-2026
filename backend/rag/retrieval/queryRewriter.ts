import { searchTerms } from '../text.ts';
import type { ConversationTurn, KnowledgeEntity } from '../types.ts';
import { detectEntities } from './queryAnalysis.ts';

/** Resolves "him"/"they" etc. when the rule-based rewrite finds several candidates. */
export type LlmRewriter = (question: string, history: ConversationTurn[], candidates: string[]) => Promise<string | null>;

export interface RewriteResult {
  question: string;
  method: 'none' | 'rule' | 'llm';
  /** Entity the follow-up was resolved to, if any. */
  resolvedEntities: string[];
}

const PRONOUN = /\b(he|him|his|she|her|hers|they|them|their)\b|ಅವರ|ಇವರ/i;
/** Follow-ups that refer back without a pronoun ("tell me more", "what about awards?"). */
const FOLLOW_UP = /^(tell me more|more( details)?|what about|and\b|also\b|anything else)/i;
/** Questions that only make sense about a person ("Give me a stage introduction"). */
const PERSON_ONLY = /stage intro|introduction|what can i ask|\b(movies?|films?|acted|directed|awards?|achievements?|books?|known for|born|married|studied|education|theatre)\b/i;

/**
 * Lightweight query rewriting for follow-up questions. Standalone questions
 * (they already name an entity, or don't refer back) are left untouched. A
 * follow-up gets the entity from the most recent turn that mentioned one:
 *   "Tell me more about him" → "Tell me more about Prakash Belawadi"
 * When that turn mentioned several entities, an LLM rewriter (if supplied)
 * decides; otherwise the first one mentioned is used.
 */
export async function rewriteQuery(
  question: string,
  history: ConversationTurn[],
  entities: KnowledgeEntity[],
  llmRewriter?: LlmRewriter,
): Promise<RewriteResult> {
  const unchanged: RewriteResult = { question, method: 'none', resolvedEntities: [] };
  if (history.length === 0 || detectEntities(question, entities).length > 0) return unchanged;
  // "What about November 1?" names its own subject; only a bare "what about him / tell me more" refers back.
  const bareFollowUp = FOLLOW_UP.test(question.trim()) && searchTerms(question.replace(FOLLOW_UP, '')).length === 0;
  if (!PRONOUN.test(question) && !bareFollowUp && !PERSON_ONLY.test(question)) return unchanged;

  const candidates = recentEntities(history, entities);
  if (candidates.length === 0) return unchanged;

  if (candidates.length > 1 && llmRewriter) {
    try {
      const rewritten = await llmRewriter(question, history, candidates.map((e) => e.name));
      if (rewritten) {
        const resolved = detectEntities(rewritten, entities).map((e) => e.name);
        return { question: rewritten, method: 'llm', resolvedEntities: resolved };
      }
    } catch {
      // fall through to the rule-based rewrite
    }
  }

  const name = candidates[0].name;
  return { question: substitute(question, name), method: 'rule', resolvedEntities: [name] };
}

/** Entities mentioned in the most recent turn that mentions any, in order of mention. */
function recentEntities(history: ConversationTurn[], entities: KnowledgeEntity[]): KnowledgeEntity[] {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const text = history[i].content;
    const found = detectEntities(text, entities);
    if (found.length > 0) {
      const lower = text.toLowerCase();
      const position = (e: KnowledgeEntity) =>
        Math.min(...[e.name, ...e.aliases].map((a) => lower.indexOf(a.toLowerCase())).filter((p) => p >= 0), Infinity);
      return found.sort((a, b) => position(a) - position(b));
    }
  }
  return [];
}

function substitute(question: string, name: string): string {
  if (/ಅವರ|ಇವರ/.test(question)) return `${name} — ${question}`;
  let replaced = false;
  const result = question.replace(/\b(he|him|his|she|her|hers|they|them|their)\b/i, (pronoun) => {
    replaced = true;
    return /^(his|her|hers|their)$/i.test(pronoun) ? `${name}'s` : name;
  });
  return replaced ? result : `${question.replace(/[?.!]*$/, '')} (about ${name})?`;
}
