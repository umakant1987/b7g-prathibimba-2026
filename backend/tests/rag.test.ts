/**
 * RAG tests — npm run rag:test
 *
 * Runs the real pipeline (loader → chunker → ingestion → hybrid retrieval →
 * query rewriting → context builder) against an in-memory vector store with
 * the offline hash embeddings and a stub answer model, so no API keys or
 * network are needed. Assertions check what reaches the model's context.
 */
import assert from 'node:assert/strict';
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { before, describe, test } from 'node:test';
import { assertDimensions, EmbeddingError } from '../rag/embeddings/embeddingService.ts';
import { LocalHashEmbeddingProvider } from '../rag/embeddings/localHashProvider.ts';
import type { AnswerModel } from '../rag/generation/llm.ts';
import { NO_INFORMATION } from '../rag/generation/prompt.ts';
import { ingestKnowledge } from '../rag/ingestion/ingest.ts';
import { loadKnowledge } from '../rag/knowledge/loadKnowledge.ts';
import { RagService, RagUnavailableError } from '../rag/ragService.ts';
import { detectDates } from '../rag/retrieval/queryAnalysis.ts';
import { MemoryVectorStore } from '../rag/store/memoryVectorStore.ts';
import type { ConversationTurn } from '../rag/types.ts';

const KNOWLEDGE_DIR = path.resolve(import.meta.dirname, '../../knowledge');
const CHUNKING = { maxTokens: 600, overlapTokens: 80 };
const RETRIEVAL = { topK: 8, contextChunks: 5, similarityThreshold: 0.3, keywordMinCoverage: 0.5, maxChunksPerDocument: 3, hiddenCategories: ['programme_teaser'] };

const DKA = 'Dharmendra Kumar Arenahalli';
const NB = 'Nagabhushana NS';

/** Records the prompt it was given instead of calling Claude. */
class StubModel implements AnswerModel {
  prompts: string[] = [];
  async answer(prompt: string): Promise<string> {
    this.prompts.push(prompt);
    return 'stub answer';
  }
  async rewriteFollowUp(): Promise<string | null> {
    return null;
  }
}

async function buildService(knowledgeDir = KNOWLEDGE_DIR, retrieval = RETRIEVAL) {
  const store = new MemoryVectorStore();
  const embeddings = new LocalHashEmbeddingProvider(512);
  const report = await ingestKnowledge({ knowledgeDir, store, embeddings, chunking: CHUNKING, batchSize: 64 });
  const model = new StubModel();
  const service = new RagService({ store, embeddings, model, retrieval });
  return { store, embeddings, model, service, report };
}

/** Entities of the context sources, in rank order, from the prompt the model received. */
function contextEntities(prompt: string): string[] {
  return [...prompt.matchAll(/^Entity: (.+)$/gm)].map((m) => m[1]);
}

const people = (entities: string[]) => entities.filter((e) => [DKA, NB].includes(e));

describe('B7G RAG — required questions', () => {
  let service: RagService;
  let model: StubModel;

  before(async () => {
    ({ service, model } = await buildService());
  });

  async function ask(question: string, history: ConversationTurn[] = []) {
    const before = model.prompts.length;
    const result = await service.query({ question, history });
    const prompt = model.prompts.length > before ? model.prompts.at(-1)! : '';
    return { result, prompt, entities: contextEntities(prompt) };
  }

  test('1. "Who are the Chief Guests?" → Dharmendra Kumar Arenahalli', async () => {
    const { result, entities } = await ask('Who are the Chief Guests?');
    assert.equal(result.grounded, true);
    assert.equal(people(entities)[0], DKA, `top people were ${people(entities)}`);
  });

  test('2. "Who are the guests on 15 November?" → Dharmendra Kumar Arenahalli + Nagabhushana NS', async () => {
    const { entities, prompt } = await ask('Who are the guests on 15 November?');
    assert.deepEqual([...people(entities).slice(0, 2)].sort(), [DKA, NB].sort());
    assert.match(prompt, /15 November 2026/);
  });

  test('3. "Who is the hero of Ikkat?" → Nagabhushana NS', async () => {
    const { entities, prompt } = await ask('Who is the hero of Ikkat?');
    assert.equal(people(entities)[0], NB);
    assert.match(prompt, /Vasu/);
  });

  test('4. "Who is Dharmendra Kumar Arenahalli?" → his biography', async () => {
    const { entities, prompt } = await ask('Who is Dharmendra Kumar Arenahalli?');
    assert.equal(entities[0], DKA);
    assert.match(prompt, /Title: Dharmendra Kumar Arenahalli — Summary/);
  });

  test('4a. "Who is Neernalli Ramakrishna?" / "ನೀರ್ನಳ್ಳಿ ರಾಮಕೃಷ್ಣ ಯಾರು?" → his profile', async () => {
    const en = await ask('Who is Neernalli Ramakrishna?');
    assert.equal(en.entities[0], 'Neernalli Ramakrishna');
    assert.match(en.prompt, /Babruvahana/);
    const kn = await ask('ನೀರ್ನಳ್ಳಿ ರಾಮಕೃಷ್ಣ ಯಾರು?');
    assert.equal(kn.result.language, 'kn');
    assert.equal(kn.entities[0], 'Neernalli Ramakrishna');
  });

  test('4b. "Who is Prakash Belawadi?" → the note that he is no longer attending', async () => {
    const { prompt } = await ask('Who is Prakash Belawadi?');
    assert.match(prompt, /will not be attending/);
  });

  test('5. "What is Mysoorina Kathegalu?" → Dharmendra Kumar Arenahalli', async () => {
    const { entities, prompt } = await ask('What is Mysoorina Kathegalu?');
    assert.equal(people(entities)[0], DKA);
    assert.match(prompt, /Stories of Mysuru/);
  });

  test('6. "ಧರ್ಮೇಂದ್ರ ಕುಮಾರ್ ಯಾರು?" → Kannada answer about Dharmendra Kumar Arenahalli', async () => {
    const { result, entities, prompt } = await ask('ಧರ್ಮೇಂದ್ರ ಕುಮಾರ್ ಯಾರು?');
    assert.equal(result.language, 'kn');
    assert.equal(entities[0], DKA);
    assert.match(prompt, /answer in Kannada/);
    assert.match(prompt, /ಧರ್ಮೇಂದ್ರ ಕುಮಾರ್ ಅರೆನಹಳ್ಳಿ \(Dharmendra Kumar Arenahalli, ಧರ್ಮಿ ಸರ್\) ಅವರು/, 'the Kannada summary should be in the context');
  });

  test('7. "Who are the Chief Guests on November 15?" → Dharmendra Kumar Arenahalli', async () => {
    const { entities } = await ask('Who are the Chief Guests on November 15?');
    assert.equal(people(entities)[0], DKA, `top people were ${people(entities)}`);
  });

  test('8. Unrelated question → "I don\'t have that information…" without calling the model', async () => {
    const calls = model.prompts.length;
    const { result } = await ask("Tell me something completely unrelated that isn't in the knowledge base.");
    assert.equal(result.grounded, false);
    assert.equal(result.answer, NO_INFORMATION.en);
    assert.equal(model.prompts.length, calls);
  });
});

describe('B7G RAG — conversation, language and dates', () => {
  let service: RagService;
  let model: StubModel;

  before(async () => {
    ({ service, model } = await buildService());
  });

  test('follow-up "When is he coming?" is rewritten to the guest from the previous turn', async () => {
    const history: ConversationTurn[] = [
      { role: 'user', content: 'Who is Nagabhushana?' },
      { role: 'assistant', content: 'Nagabhushana NS is a Kannada actor known for playing Vasu in Ikkat.' },
    ];
    const result = await service.query({ question: 'When is he coming?', history });
    assert.match(result.rewrittenQuestion ?? '', /Nagabhushana NS/);
    assert.equal(people(contextEntities(model.prompts.at(-1)!))[0], NB);
  });

  test('"Give me a stage introduction" after a name search refers to that guest', async () => {
    const history: ConversationTurn[] = [
      { role: 'user', content: 'Dharmi Sir' },
      { role: 'assistant', content: 'Dharmendra Kumar Arenahalli is a historian and digital storyteller.' },
    ];
    const result = await service.query({ question: 'Give me a stage introduction', history });
    assert.match(result.rewrittenQuestion ?? '', /Dharmendra Kumar Arenahalli/);
  });

  test('standalone questions are not rewritten', async () => {
    const history: ConversationTurn[] = [{ role: 'assistant', content: 'Dharmendra Kumar Arenahalli is the Chief Guest.' }];
    const result = await service.query({ question: 'Who is Nagabhushana?', history });
    assert.equal(result.rewrittenQuestion, 'Who is Nagabhushana?');
  });

  test('mixed-language "Dharmendra Kumar Arenahalli ಯಾರು?" → Kannada, about Dharmendra Kumar Arenahalli', async () => {
    const result = await service.query({ question: 'Dharmendra Kumar Arenahalli ಯಾರು?' });
    assert.equal(result.language, 'kn');
    assert.equal(contextEntities(model.prompts.at(-1)!)[0], DKA);
  });

  test('date parsing: English, abbreviations, ordinals, Kannada', () => {
    assert.deepEqual(detectDates('Who is the guest on October 31?', 2026), ['2026-10-31']);
    assert.deepEqual(detectDates('guests on Nov 1st', 2026), ['2026-11-01']);
    assert.deepEqual(detectDates('31st of October', 2026), ['2026-10-31']);
    assert.deepEqual(detectDates('ಅಕ್ಟೋಬರ್ 31ರಂದು ಅತಿಥಿ ಯಾರು?', 2026), ['2026-10-31']);
    assert.deepEqual(detectDates('B7G Kannada Rajyotsava 2026 November celebration', 2026), []);
  });

  test('a store failure returns a controlled error instead of an invented answer', async () => {
    const broken = new MemoryVectorStore();
    broken.listEntities = async () => {
      throw new Error('database down');
    };
    const rag = new RagService({ store: broken, embeddings: new LocalHashEmbeddingProvider(512), model: new StubModel(), retrieval: RETRIEVAL });
    await assert.rejects(rag.query({ question: 'Who are the Chief Guests?' }), RagUnavailableError);
  });
});

describe('B7G RAG — cultural programme', () => {
  let service: RagService;
  let model: StubModel;

  before(async () => {
    ({ service, model } = await buildService());
  });

  async function ask(question: string, history: ConversationTurn[] = []) {
    const before = model.prompts.length;
    const result = await service.query({ question, history });
    const prompt = model.prompts.length > before ? model.prompts.at(-1)! : '';
    return { result, prompt, called: model.prompts.length > before };
  }

  /** Titles of the context sources, in rank order. */
  const titles = (prompt: string) => [...prompt.matchAll(/^Title: (.+)$/gm)].map((m) => m[1]);

  test('every programme item is on 15 November with session, running order, type and times', async () => {
    const { documents } = await loadKnowledge(KNOWLEDGE_DIR);
    const items = documents.filter((d) => d.subcategory === 'performance');
    assert.equal(items.length, 21);
    for (const item of items) {
      assert.equal(item.event_date, '2026-11-15', item.title);
      assert.ok(item.metadata.session && typeof item.metadata.sequence === 'number', item.title);
      assert.match(String(item.metadata.start_time), /^\d\d:\d\d$/, item.title);
      assert.match(String(item.metadata.end_time), /^\d\d:\d\d$/, item.title);
    }
    assert.equal(items.filter((i) => i.metadata.session === 'morning').length, 7);
    assert.equal(items.filter((i) => i.metadata.session === 'evening').length, 14);
  });

  test('"What is happening on 15 November?" → the morning and evening sessions', async () => {
    const { prompt } = await ask('What is happening on 15 November?');
    const t = titles(prompt).join('\n');
    assert.match(t, /Morning Session/);
    assert.match(t, /Evening Session/);
  });

  test('"What is happening in the evening?" → one programme day, so no clarification', async () => {
    const { prompt, called } = await ask('What is happening in the evening?');
    assert.ok(called);
    assert.match(prompt, /Evening Session/);
    assert.match(prompt, /4:40 PM/);
  });

  test('"Who is performing violin?" → Tanya PV at 5:50 PM', async () => {
    const { prompt } = await ask('Who is performing violin?');
    assert.match(titles(prompt)[0], /Tanya PV/);
    assert.match(prompt, /5:50 PM to 6:00 PM/);
  });

  test('"What time is the sand art?" → 7:05 – 8:00 PM by Mr. Raghavendra Hegde', async () => {
    const { prompt } = await ask('What time is the sand art?');
    assert.match(prompt, /7:05 PM to 8:00 PM/);
    assert.match(prompt, /Raghavendra Hegde/);
  });

  test('"When is the Santhe inauguration?" → 10:45 AM, one Santhe entity', async () => {
    const { prompt } = await ask('When is the Santhe inauguration?');
    assert.match(prompt, /10:45 AM/);
    assert.match(prompt, /Entity: B7G Santhe/);
  });

  test('"When is Samvada?" → 9:30 – 10:30 AM with the Chief Guests', async () => {
    const { prompt } = await ask('When is Samvada with the chief guests?');
    assert.match(prompt, /9:30 AM to 10:30 AM/);
  });

  test('"What happens after Rhythm of B7G?" / "What is before Jamming?" → running-order neighbours', async () => {
    assert.match((await ask('What happens after Rhythm of B7G?')).prompt, /before Sand Art/);
    assert.match((await ask('What is before Jamming?')).prompt, /after Sand Art/);
  });

  test('old date: "What is happening on 31st October?" → the move to 15 November', async () => {
    const { prompt } = await ask('What is happening on 31st October?');
    assert.match(prompt, /rescheduled|15 November 2026/);
  });
});

describe('B7G RAG — detailed programme not yet released', () => {
  // VITE_SHOW_PROGRAMME_DETAILS=false: programme records hidden, the "coming soon" note shown.
  let service: RagService;
  let model: StubModel;

  before(async () => {
    ({ service, model } = await buildService(KNOWLEDGE_DIR, { ...RETRIEVAL, hiddenCategories: ['programme'] }));
  });

  async function context(question: string) {
    const calls = model.prompts.length;
    const result = await service.query({ question });
    return { result, prompt: model.prompts.length > calls ? model.prompts.at(-1)! : '' };
  }

  test('schedule questions get the 15 November schedule, not the running order', async () => {
    const { prompt } = await context('What is happening on 15 November?');
    assert.doesNotMatch(prompt, /^Category: programme$/m);
    assert.doesNotMatch(prompt, /SriRanga Group|Tanya PV|Danzo/);
    assert.match(prompt, /15 November 2026/);
    assert.match(prompt, /Santhe/);
  });

  test('old dates: "Is the celebration on 1 November?" → it has moved to 15 November', async () => {
    const { prompt } = await context('Is the celebration on 1 November?');
    assert.match(prompt, /rescheduled|moved to 15 November/);
  });

  test('performer questions do not reveal unreleased performers', async () => {
    for (const q of ['Who is performing violin?', 'When is Huli Dance?', 'Who is performing before Jamming?']) {
      const { prompt } = await context(q);
      assert.doesNotMatch(prompt, /Running order: item/, q);
    }
  });

  test('Chief Guest questions no longer reveal their programme slot', async () => {
    const { prompt } = await context('When is Mr. Dharmi speaking?');
    assert.doesNotMatch(prompt, /Speech by Mr\. Dharmi|item 4 of 8/);
  });

  test('the 15 November schedule is available: morning Santhe; evening culture, sand art, jamming', async () => {
    const { prompt } = await context('What are the highlights of Prathibimba?');
    assert.match(prompt, /15 November 2026/);
    assert.match(prompt, /B7G Santhe/);
    assert.match(prompt, /sand art/i);
    assert.match(prompt, /jamming/i);
  });
});

describe('B7G RAG — B7G Santhe (Taste of Karnataka)', () => {
  // Run with the detailed programme hidden, as it is now: Santhe must still be answerable.
  let service: RagService;
  let model: StubModel;

  before(async () => {
    ({ service, model } = await buildService(KNOWLEDGE_DIR, { ...RETRIEVAL, hiddenCategories: ['programme'] }));
  });

  async function ask(question: string) {
    const calls = model.prompts.length;
    const result = await service.query({ question });
    const prompt = model.prompts.length > calls ? model.prompts.at(-1)! : '';
    return { result, prompt, top: [...prompt.matchAll(/^Title: (.+)$/gm)].map((m) => m[1]) };
  }

  const santheFirst = (top: string[]) => top[0]?.startsWith('B7G Santhe') ?? false;

  test('"What is B7G Santhe?" and "What is Taste of Karnataka?" retrieve the same Santhe knowledge', async () => {
    const a = await ask('What is B7G Santhe?');
    const b = await ask('What is Taste of Karnataka?');
    assert.ok(santheFirst(a.top), a.top.join(' | '));
    assert.ok(santheFirst(b.top), b.top.join(' | '));
    assert.match(b.prompt, /Entity: B7G Santhe/);
  });

  test('stall, food and participation questions reach the right Santhe sections', async () => {
    const cases: [string, RegExp][] = [
      ['What stalls can I set up?', /types of stalls/],
      ['Are Karnataka food stalls welcome?', /Karnataka-style food/],
      ['How do I participate?', /participate/i],
      ['Can I showcase my artwork?', /artwork|Handmade/],
      ['Can I set up a games stall?', /Games & Activities/],
    ];
    for (const [question, expected] of cases) {
      const { prompt } = await ask(question);
      assert.match(prompt, expected, question);
      assert.match(prompt, /Entity: B7G Santhe/, question);
    }
  });

  test('"When is Santhe?" and "What is happening on 15 November morning?" give 15 November, morning', async () => {
    for (const question of ['When is Santhe?', 'What is happening on 15 November morning?']) {
      const { prompt } = await ask(question);
      assert.match(prompt, /B7G Santhe/, question);
      assert.match(prompt, /Event date: 2026-11-15\nSession: morning/, question);
    }
  });

  test('Kanglish and Kannada questions find Santhe', async () => {
    for (const question of ['Santhe alli stall haakbahuda?', 'Taste of Karnataka andre enu?', 'B7G ಸಂತೆಯಲ್ಲಿ ಭಾಗವಹಿಸುವುದು ಹೇಗೆ?']) {
      const { prompt } = await ask(question);
      assert.match(prompt, /Entity: B7G Santhe/, question);
    }
  });

  test('unknown details are flagged as not announced: start time and WhatsApp link', async () => {
    for (const question of ['What time does Santhe start?', 'What is the WhatsApp group link for Santhe?']) {
      const { prompt } = await ask(question);
      assert.match(prompt, /has not been announced|have not been announced/, question);
      assert.doesNotMatch(prompt, /chat\.whatsapp\.com|https?:\/\/wa\.me/, question);
    }
  });

  test('one Santhe entity, even when the detailed programme is released', async () => {
    const { service: released, model: m } = await buildService(KNOWLEDGE_DIR, RETRIEVAL);
    await released.query({ question: 'Tell me about B7G Sante' });
    const entities = new Set([...m.prompts.at(-1)!.matchAll(/^Entity: (.*Sant.*)$/gm)].map((x) => x[1]));
    assert.deepEqual([...entities], ['B7G Santhe']);
  });
});

describe('B7G RAG — ingestion', () => {
  test('re-ingesting unchanged knowledge generates no embeddings', async () => {
    const { store, embeddings, report } = await buildService();
    assert.equal(report.failed, 0);
    assert.equal(report.inserted, report.chunksCreated);
    const again = await ingestKnowledge({ knowledgeDir: KNOWLEDGE_DIR, store, embeddings, chunking: CHUNKING, batchSize: 64 });
    assert.equal(again.embeddingsGenerated, 0);
    assert.equal(again.skippedUnchanged, again.chunksCreated);
  });

  test('every chunk names its entity, so it makes sense on its own', async () => {
    const { documents } = await loadKnowledge(KNOWLEDGE_DIR);
    const { store } = await buildService();
    for (const row of store.rows.values()) {
      if (row.chunk.entity_name) assert.ok(row.chunk.embedding_text.startsWith(row.chunk.entity_name), row.chunk.chunk_key);
    }
    assert.ok(documents.length >= 10);
  });

  test('a new JSON document becomes answerable after ingestion, with no code changes', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'b7g-knowledge-'));
    try {
      await cp(KNOWLEDGE_DIR, dir, { recursive: true });
      await writeFile(
        path.join(dir, 'performers.json'),
        JSON.stringify({
          documents: [
            {
              title: 'Test Folk Ensemble — Performer',
              category: 'performer',
              entity_type: 'group',
              entity_name: 'Test Folk Ensemble',
              event_date: '2026-11-01',
              content: 'Test Folk Ensemble performs Dollu Kunitha drumming on the Main Stage at B7G Kannada Rajyotsava 2026.',
            },
          ],
        }),
      );
      const { service, model } = await buildService(dir);
      await service.query({ question: 'Who is performing Dollu Kunitha?' });
      assert.equal(contextEntities(model.prompts.at(-1)!)[0], 'Test Folk Ensemble');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test('edited content is re-embedded; removed content is deactivated, not deleted', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'b7g-knowledge-'));
    try {
      await cp(KNOWLEDGE_DIR, dir, { recursive: true });
      const { store, embeddings } = await buildService(dir);
      await writeFile(path.join(dir, 'b7g-community.md'), '---\ntitle: B7G Community\ncategory: b7g_community\n---\n\n## About B7G\n\nB7G stands for Brigade 7 Gardens, Bengaluru. Updated.\n');
      const report = await ingestKnowledge({ knowledgeDir: dir, store, embeddings, chunking: CHUNKING, batchSize: 64 });
      assert.equal(report.updated, 1);
      assert.ok(report.deactivated >= 1, 'removed sections should be deactivated');
      const inactive = [...store.rows.values()].filter((r) => !r.chunk.is_active);
      assert.equal(inactive.length, report.deactivated);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test('invalid files are reported and skipped; valid ones still load', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'b7g-knowledge-'));
    try {
      await writeFile(path.join(dir, 'broken.json'), '{ "documents": [ { "title": "x" ');
      await writeFile(path.join(dir, 'bad-date.json'), JSON.stringify([{ title: 'X', category: 'event', event_date: '1 Nov', content: 'x' }]));
      await writeFile(path.join(dir, 'dupe.json'), JSON.stringify([
        { id: 'same', title: 'A', category: 'faq', content: 'a' },
        { id: 'same', title: 'B', category: 'faq', content: 'b' },
      ]));
      const result = await loadKnowledge(dir);
      assert.equal(result.documents.length, 1);
      assert.match(result.issues.map((i) => i.message).join('\n'), /Invalid JSON/);
      assert.match(result.issues.map((i) => i.message).join('\n'), /YYYY-MM-DD/);
      assert.match(result.issues.map((i) => i.message).join('\n'), /Duplicate document id/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test('an embedding dimension mismatch fails loudly', () => {
    assert.throws(() => assertDimensions([[0.1, 0.2]], 1536, 'text-embedding-3-small'), (error: unknown) => {
      return error instanceof EmbeddingError && error.kind === 'dimension_mismatch';
    });
  });
});
