/**
 * Live RAG check against the real stack (Supabase + embeddings + Claude) —
 * npm run rag:eval. Needs the keys in .env and a completed `npm run rag:ingest`.
 * Each question calls the embedding API and Claude once, so it costs a little.
 */
import { loadConfig } from '../config.ts';
import { setDebug } from '../lib/logger.ts';
import { getServiceClient } from '../lib/supabase.ts';
import { createEmbeddingProvider } from '../rag/embeddings/embeddingService.ts';
import { ClaudeAnswerModel } from '../rag/generation/llm.ts';
import { NO_INFORMATION } from '../rag/generation/prompt.ts';
import { RagService } from '../rag/ragService.ts';
import { SupabaseVectorStore } from '../rag/store/supabaseVectorStore.ts';
import type { ConversationTurn } from '../rag/types.ts';

const KANNADA = /[ಀ-೿]/;

const CASES: { question: string; check: (answer: string) => boolean; expect: string; history?: ConversationTurn[] }[] = [
  { question: 'Who are the Chief Guests?', expect: 'Prakash Belawadi + Dharmendra Kumar Arenahalli', check: (a) => /Belawadi/.test(a) && /Dharmendra/.test(a) },
  { question: 'Who is the guest on October 31?', expect: 'Nagabhushana NS', check: (a) => /Nagabhushana/.test(a) },
  { question: 'Who is the hero of Ikkat?', expect: 'Nagabhushana NS', check: (a) => /Nagabhushana/.test(a) },
  { question: 'Who is Prakash Belawadi?', expect: 'Prakash Belawadi biography', check: (a) => /theatre|actor|filmmaker/i.test(a) },
  { question: 'What is Mysoorina Kathegalu?', expect: 'Dharmendra Kumar Arenahalli', check: (a) => /Dharmendra/.test(a) },
  { question: 'ಪ್ರಕಾಶ್ ಬೆಳವಾಡಿ ಯಾರು?', expect: 'Kannada answer about Prakash Belawadi', check: (a) => KANNADA.test(a) },
  { question: 'Who are the guests on November 1?', expect: 'Prakash Belawadi + Dharmendra Kumar Arenahalli', check: (a) => /Belawadi/.test(a) && /Dharmendra/.test(a) && !/Nagabhushana[^.]*November 1/.test(a) },
  // Cultural programme
  { question: 'What is happening on 31st October?', expect: 'the 31 October programme', check: (a) => /SriRanga/.test(a) && /Tanya PV/.test(a) && /B7G Boys/.test(a) },
  { question: 'What programs are there on November 1?', expect: 'morning / afternoon / evening sections', check: (a) => /morning/i.test(a) && /afternoon/i.test(a) && /evening/i.test(a) && /B7G Sante/.test(a) },
  { question: 'Who is performing violin?', expect: 'Tanya PV on 31 October 2026', check: (a) => /Tanya PV/.test(a) && /31 October|October 31/.test(a) },
  { question: 'When is Huli Dance?', expect: '1 November 2026 evening', check: (a) => /1 November|November 1/.test(a) && /evening/i.test(a) },
  { question: 'What is there in the afternoon?', expect: 'B7G Sante on 1 November', check: (a) => /B7G Sante/.test(a) },
  { question: 'What happens after B7G Sante?', expect: 'Soul Strech Yoga (evening)', check: (a) => /Soul Strech Yoga/.test(a) },
  { question: 'Who is performing before Jamming?', expect: 'Huli Dance', check: (a) => /Huli Dance/.test(a) },
  { question: 'What time is Tanya PV performing?', expect: 'time not published; no invented time', check: (a) => /publish|announc|not (yet )?(been )?(shared|available)/i.test(a) && !/\b\d{1,2}(:\d{2})?\s?(am|pm)\b/i.test(a) },
  { question: 'What is happening in the evening?', expect: 'asks which day', check: (a) => /31 October/.test(a) && /1 November/.test(a) && /\?/.test(a) },
  {
    question: 'What about November 1?',
    history: [
      { role: 'user', content: 'Who is doing the violin?' },
      { role: 'assistant', content: 'Tanya PV will perform violin on 31 October 2026.' },
    ],
    expect: '1 November programme (not Tanya PV)',
    check: (a) => /B7G Sante|Invocation|Flag Hoisting|Huli Dance/.test(a),
  },
  {
    question: "Tell me something completely unrelated that isn't in the knowledge base.",
    expect: '"I don\'t have that information…"',
    check: (a) => a.includes(NO_INFORMATION.en) || /don't have that information/i.test(a),
  },
];

const config = loadConfig();
setDebug(config.debug);
const rag = new RagService({
  store: new SupabaseVectorStore(getServiceClient(config)),
  embeddings: createEmbeddingProvider(config),
  model: new ClaudeAnswerModel(config.llm),
  retrieval: config.retrieval,
});

let failures = 0;
for (const [i, testCase] of CASES.entries()) {
  try {
    const result = await rag.query({ question: testCase.question, history: testCase.history });
    const ok = testCase.check(result.answer);
    if (!ok) failures += 1;
    console.log(`\n${ok ? '✅' : '❌'} ${i + 1}. ${testCase.question}\n   expected: ${testCase.expect}\n   answer:   ${result.answer.replace(/\n+/g, ' ')}`);
    console.log(`   sources:  ${result.sources.map((s) => `${s.title} (${s.similarity})`).join('; ') || '—'}`);
  } catch (error) {
    failures += 1;
    console.log(`\n❌ ${i + 1}. ${testCase.question}\n   error: ${(error as Error).message}`);
  }
}
console.log(`\n${CASES.length - failures}/${CASES.length} passed.`);
process.exitCode = failures ? 1 : 0;
