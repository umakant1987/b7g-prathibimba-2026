import type { RagConfig } from '../../config.ts';
import type { EmbeddingProvider } from '../embeddings/embeddingService.ts';
import type { VectorStore } from '../store/vectorStore.ts';
import { normalize, KANNADA } from '../text.ts';
import type { RetrievedChunk, SearchHit } from '../types.ts';
import { PERSON_CATEGORIES, type QueryAnalysis } from './queryAnalysis.ts';

/** Ranking weights. Similarity is 0–1; the boosts re-rank candidates that already passed the relevance gate. */
const WEIGHTS = {
  keywordCoverage: 0.3,
  entity: 0.35,
  dateMatch: 0.3,
  dateConflict: -0.4,
  category: 0.15,
  language: 0.1,
  /** Profile-style questions ("Who is X?", "Who are the guests?") prefer biography sections. */
  biography: 0.3,
  sessionMatch: 0.25,
  sessionConflict: -0.35,
  /** Broad "what's happening on…" questions prefer whole day/session schedules over single items. */
  daySchedule: 0.35,
  overview: 0.15,
};

/** Categories where a different event date means "a different day's guest", not just less relevant. */
const DATED_CATEGORIES = new Set(['chief_guest', 'guest', 'performer', 'programme', 'schedule']);

/**
 * Hybrid, entity- and date-aware retrieval:
 *   1. vector search over all knowledge + one vector search per detected entity
 *   2. keyword/alias search (names, film titles, Kannada words)
 *   3. merge, gate out weak matches, boost entity/date/category matches,
 *      penalise chunks dated for a different day than the one asked about
 *   4. de-duplicate, cap chunks per document, return the best few
 */
export class HybridRetriever {
  private readonly store: VectorStore;
  private readonly embeddings: EmbeddingProvider;
  private readonly settings: RagConfig['retrieval'];

  constructor(store: VectorStore, embeddings: EmbeddingProvider, settings: RagConfig['retrieval']) {
    this.store = store;
    this.embeddings = embeddings;
    this.settings = settings;
  }

  async retrieve(query: QueryAnalysis): Promise<RetrievedChunk[]> {
    const { topK, similarityThreshold } = this.settings;
    const [embedding] = await this.embeddings.embed([query.text]);
    // Ask for borderline candidates too; the relevance gate below decides.
    const candidateThreshold = similarityThreshold * 0.5;

    const searches: Promise<SearchHit[]>[] = [
      this.store.vectorSearch(embedding, { model: this.embeddings.model, threshold: candidateThreshold, count: topK * 2 }),
      this.store.keywordSearch(query.terms, { count: topK * 2 }),
      ...query.entities.slice(0, 3).map((entity) =>
        this.store.vectorSearch(embedding, { model: this.embeddings.model, threshold: 0, count: topK, entityName: entity.name }),
      ),
      // "What's happening on 1 November?" — fetch that day's records directly, so every
      // session schedule for the day is a candidate even when many single items compete.
      ...(query.wantsOverview ? query.dates.slice(0, 2) : []).map((eventDate) =>
        this.store.vectorSearch(embedding, { model: this.embeddings.model, threshold: 0, count: topK * 4, eventDate }),
      ),
      // "Who are the Chief Guests?" — fetch those people's chunks even though their
      // biographies never say "chief guest".
      ...(query.wantsPeopleList ? query.categories.filter((c) => PERSON_CATEGORIES.has(c)) : []).map((category) =>
        this.store.vectorSearch(embedding, { model: this.embeddings.model, threshold: 0, count: topK * 3, category }),
      ),
    ];
    const results = await Promise.all(searches);

    // Union of all searches; the keyword search contributes recall, scoring happens below.
    const merged = new Map<string, { hit: SearchHit; similarity: number }>();
    const hidden = new Set(this.settings.hiddenCategories ?? []);
    for (const hit of results.flat()) {
      if (hit.category && hidden.has(hit.category)) continue;
      const entry = merged.get(hit.chunk_key) ?? { hit, similarity: 0 };
      entry.similarity = Math.max(entry.similarity, hit.similarity ?? 0);
      merged.set(hit.chunk_key, entry);
    }
    const entityNames = new Set(query.entities.map((e) => e.name));

    const ranked: RetrievedChunk[] = [];
    // Coverage is measured on what's being asked, not on the entity's name: every one of
    // Prakash Belawadi's sections contains his name, but only one is about his awards.
    const coverageTerms = query.topicTerms.length > 0 ? query.topicTerms : query.terms;

    for (const { hit, similarity } of merged.values()) {
      const keywordCoverage = coverage(coverageTerms, hit);
      const entityMatch = hit.entity_name !== null && entityNames.has(hit.entity_name);

      const categoryMatch = hit.category !== null && query.categories.includes(hit.category);
      const isBiography = hit.subcategory === 'biography';

      // Guidance sections are instructions about an entity — only relevant when the question names it.
      if (hit.subcategory === 'assistant_guidance' && !entityMatch) continue;

      // Relevance gate: a chunk must be semantically close, strongly keyword-matched,
      // about an entity the question names, or a profile of the people asked about.
      const passes =
        similarity >= similarityThreshold ||
        keywordCoverage >= this.settings.keywordMinCoverage ||
        (entityMatch && similarity >= candidateThreshold * 0.5) ||
        (query.wantsPeopleList && categoryMatch && isBiography) ||
        // "What's happening on 31 October?" — that day's programme records are relevant by date.
        (query.wantsOverview && hit.event_date !== null && query.dates.includes(hit.event_date) && categoryMatch);
      if (!passes) continue;

      const reasons: string[] = [];
      let score = similarity + WEIGHTS.keywordCoverage * keywordCoverage;
      if (entityMatch) {
        score += WEIGHTS.entity;
        reasons.push('entity');
      }
      if (query.dates.length > 0 && hit.event_date) {
        if (query.dates.includes(hit.event_date)) {
          score += WEIGHTS.dateMatch;
          reasons.push('date');
        } else if (hit.category && DATED_CATEGORIES.has(hit.category)) {
          score += WEIGHTS.dateConflict;
          reasons.push('other-date');
        }
      }
      if (categoryMatch) {
        score += WEIGHTS.category;
        reasons.push('category');
      }
      if (hit.language === query.language) score += WEIGHTS.language;
      const session = typeof hit.metadata?.session === 'string' ? hit.metadata.session : null;
      if (query.sessions.length > 0 && session) {
        if (query.sessions.includes(session)) {
          score += WEIGHTS.sessionMatch;
          reasons.push('session');
        } else {
          score += WEIGHTS.sessionConflict;
          reasons.push('other-session');
        }
      }
      // Day/session schedules — or, before the programme is released, the poster highlights
      // and "coming soon" note — answer broad "what's happening" questions best.
      const isScheduleSummary =
        hit.subcategory === 'day_schedule' || hit.category === 'programme_highlights' || hit.category === 'programme_teaser';
      if (query.wantsOverview && isScheduleSummary) {
        score += WEIGHTS.daySchedule;
        reasons.push('schedule');
      } else if (query.wantsOverview && hit.subcategory === 'overview' && query.dates.length === 0 && query.sessions.length === 0) {
        score += WEIGHTS.overview;
        reasons.push('overview');
      }
      if (isBiography && ((query.wantsProfile && entityMatch) || (query.wantsPeopleList && categoryMatch))) {
        score += WEIGHTS.biography;
        reasons.push('profile');
      }

      ranked.push({ ...hit, similarity, keywordCoverage, score, reasons });
    }

    return this.selectContext(ranked.sort((a, b) => b.score - a.score));
  }

  /** Drops near-duplicates and caps chunks per document so one long document can't crowd out the rest. */
  private selectContext(ranked: RetrievedChunk[]): RetrievedChunk[] {
    const perDocument = new Map<string, number>();
    const seenContent = new Set<string>();
    const selected: RetrievedChunk[] = [];
    for (const chunk of ranked) {
      const fingerprint = chunk.content.replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 200);
      if (seenContent.has(fingerprint)) continue;
      const count = perDocument.get(chunk.document_id) ?? 0;
      if (count >= this.settings.maxChunksPerDocument) continue;
      seenContent.add(fingerprint);
      perDocument.set(chunk.document_id, count + 1);
      selected.push(chunk);
      if (selected.length >= this.settings.contextChunks) break;
    }
    return selected;
  }
}

/** Share of `terms` found in the chunk (whole words for English, prefixes for Kannada). */
function coverage(terms: string[], hit: SearchHit): number {
  if (terms.length === 0) return 0;
  const haystack = normalize(`${hit.title} ${hit.section ?? ''} ${hit.content}`);
  const found = terms.filter((term) =>
    KANNADA.test(term) ? haystack.includes(term) : new RegExp(`\\b${term}(s|es)?\\b`).test(haystack),
  );
  return found.length / terms.length;
}
