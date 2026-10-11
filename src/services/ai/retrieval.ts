import { SHOW_CONTRIBUTE, SHOW_PROGRAMME_DETAILS } from '../../config/env';
import { faqs, venues } from '../../data/knowledgeBase';
import type { ChatSource, Language } from '../../types';
import { knowledgeChunks, type KnowledgeChunk } from './knowledgeLoader';

export interface RetrievedDoc {
  id: string;
  /** The text surfaced to the user / passed to the LLM as context. */
  text: string;
  /** Full text used for scoring, so FAQ questions/headings don't leak into answers. */
  matchText: string;
  /** Heading/question text; matches here count double so the most on-topic section wins. */
  headingText: string;
  source: ChatSource;
  score: number;
}

const SOURCE_TYPE_BY_FILE: Record<string, ChatSource['type']> = {
  'faq.md': 'faq',
  'sponsors.md': 'sponsor',
};

function chunkToDoc(chunk: KnowledgeChunk): RetrievedDoc {
  // A "Summary" section is the canonical answer for "who is <title>?" questions.
  const headingText = /^summary$/i.test(chunk.heading) ? chunk.title : chunk.heading;
  const label = chunk.status === 'provisional' ? `${chunk.title} (provisional)` : chunk.title;
  return {
    id: chunk.id,
    text: chunk.text,
    matchText: `${chunk.title} ${chunk.heading} ${chunk.text}`,
    headingText,
    source: { label, type: SOURCE_TYPE_BY_FILE[chunk.file] ?? 'general' },
    score: 0,
  };
}

/**
 * Document corpus. English answers come from the markdown knowledge base in
 * /knowledge (see knowledgeLoader.ts). Kannada questions additionally search
 * the bilingual entries in src/data/knowledgeBase.ts, since the markdown files
 * are English-only. In production this is the chunking stage before
 * embedding — see docs/ARCHITECTURE.md RAG diagram.
 */
function buildCorpus(language: Language): RetrievedDoc[] {
  // The "coming soon" note applies only while the detailed programme is unreleased.
  const docs = knowledgeChunks
    .filter((chunk) => !(SHOW_PROGRAMME_DETAILS && chunk.file === 'programme-coming-soon.md'))
    // Contribute details only while the Contribute section is on; the "coming soon" note otherwise.
    .filter((chunk) => chunk.file !== (SHOW_CONTRIBUTE ? 'contribute-coming-soon.md' : 'contribute.md'))
    .map(chunkToDoc);
  if (language !== 'kn') return docs;

  for (const faq of faqs) {
    docs.push({
      id: faq.id,
      text: faq.answer.kn,
      matchText: `${faq.question.kn} ${faq.answer.kn}`,
      headingText: faq.question.kn,
      source: { label: 'FAQ', type: 'faq' },
      score: 0,
    });
  }

  for (const venue of venues) {
    docs.push({
      id: venue.id,
      text: `${venue.name.kn}: ${venue.description.kn}`,
      matchText: `${venue.name.kn}: ${venue.description.kn}`,
      headingText: venue.name.kn,
      source: { label: `Venue — ${venue.name.kn}`, type: 'venue' },
      score: 0,
    });
  }

  return docs;
}

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'of', 'at', 'in', 'on', 'to', 'for',
  'and', 'or', 'what', 'where', 'when', 'who', 'how', 'do', 'does', 'did', 'it', 'this', 'that',
  'me', 'about', 'tell', 'you', 'can', 'i', 'he', 'him', 'his', 'she', 'her', 'has', 'have',
  'had', 'be', 'by', 'with', 'any', 'some', 'give', 'please', 'will', 'there', 'your', 'my',
]);

/** Naive folding so "movies"/"movie", "awards"/"award" and "studied"/"study" match. */
function stem(token: string): string {
  if (token.length > 4 && token.endsWith('ied')) return `${token.slice(0, -3)}y`;
  return token.length > 3 && token.endsWith('s') && !token.endsWith('ss') ? token.slice(0, -1) : token;
}

export function tokenize(text: string): Set<string> {
  const tokens = text.toLowerCase().match(/[a-z0-9ಀ-೿]+/g) ?? [];
  return new Set(tokens.filter((token) => token.length > 1 && !STOPWORDS.has(token)).map(stem));
}

export function overlap(queryTokens: Set<string>, text: string): number {
  const docTokens = tokenize(text);
  let count = 0;
  for (const token of queryTokens) {
    if (docTokens.has(token)) count += 1;
  }
  return count;
}

/**
 * Mock embedding similarity: term-overlap scoring. The interface (query in,
 * ranked docs out) matches what a real Supabase pgvector `match_documents`
 * RPC call would return, so swapping in real embeddings later is a drop-in
 * replacement for this function only.
 */
export function retrieveRelevantDocs(query: string, language: Language, topK = 3): RetrievedDoc[] {
  const queryTokens = tokenize(query);
  const corpus = buildCorpus(language);

  // Require at least two matching terms (or the only term, for one-word
  // questions like "What is B7G?") so a single incidental word doesn't
  // produce a misleading answer. Heading matches rank the most on-topic
  // section first, and the fraction of the heading matched breaks ties
  // (so "What is Kannada Rajyotsava?" beats "When is B7G Kannada Rajyotsava 2026?").
  const minOverlap = Math.min(2, queryTokens.size);
  if (minOverlap === 0) return [];
  return corpus
    .filter((doc) => overlap(queryTokens, doc.matchText) >= minOverlap)
    .map((doc) => {
      const headingMatches = overlap(queryTokens, doc.headingText);
      const headingSize = Math.max(1, tokenize(doc.headingText).size);
      return {
        ...doc,
        score: overlap(queryTokens, doc.matchText) + headingMatches + headingMatches / headingSize,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
