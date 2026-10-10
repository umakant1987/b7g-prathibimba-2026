import { programDates, programs, sessionOrder } from '../../data/programs';
import { sponsors } from '../../data/sponsors';
import { translations } from '../../data/translations';
import type { ChatSource, GuestCard, Language, Program } from '../../types';
import {
  getCurrentProgram,
  getNextProgram,
  getProgramAtTime,
  getProgramsByCategory,
  hasTimings,
} from '../schedule';
import { answerGuestQuestion } from './guestService';
import { detectIntent, extractCategory, extractTime } from './intentDetection';
import { RAG_API_URL, SHOW_PROGRAMME_DETAILS } from '../../config/env';
import { queryRagApi, type RagApiTurn } from './ragApiClient';
import { retrieveRelevantDocs } from './retrieval';

export interface RagAnswer {
  answer: string;
  cards?: GuestCard[];
  sources: ChatSource[];
  suggestedFollowUps: string[];
  grounded: boolean;
  /** Guest the answer was about; pass back as ChatContext.lastGuestId so "he/his" follow-ups resolve. */
  guestId?: string;
}

/** Conversation state carried between questions. */
export interface ChatContext {
  lastGuestId?: string;
  /** Sent to the backend RAG so it can resolve follow-ups ("tell me more about him"). */
  conversationId?: string;
  history?: RagApiTurn[];
}

const FALLBACK: Record<Language, string> = {
  en: "I don't have that information in my B7G event knowledge base yet. Please check with the event organizers.",
  kn: 'ಆ ಮಾಹಿತಿ ನನ್ನ B7G ಕಾರ್ಯಕ್ರಮ ಜ್ಞಾನಭಂಡಾರದಲ್ಲಿ ಇನ್ನೂ ಇಲ್ಲ. ದಯವಿಟ್ಟು ಕಾರ್ಯಕ್ರಮ ಸಂಘಟಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
};

// Sponsors are still draft data — see knowledge/sponsors.md.
const PROVISIONAL_NOTE: Record<Language, string> = {
  en: ' (Provisional — subject to confirmation by the organisers.)',
  kn: ' (ತಾತ್ಕಾಲಿಕ — ಸಂಘಟಕರಿಂದ ದೃಢೀಕರಣಕ್ಕೆ ಒಳಪಟ್ಟಿದೆ.)',
};

const NO_TIMINGS: Record<Language, string> = {
  en: "Exact timings haven't been published yet. Here's the running order:",
  kn: 'ನಿಖರ ಸಮಯವನ್ನು ಇನ್ನೂ ಪ್ರಕಟಿಸಲಾಗಿಲ್ಲ. ಕಾರ್ಯಕ್ರಮಗಳ ಕ್ರಮ ಹೀಗಿದೆ:',
};

const SCHEDULE_SOURCE: ChatSource = { label: 'B7G Programme', type: 'schedule' };

/** From the programme posters (knowledge/programme-highlights.md). */
const PROGRAMME_COMING_SOON: Record<Language, string> = {
  en: [
    'The detailed programme will be released closer to the event. Here are the highlights from the posters:',
    '• **31 October, 5 PM – 10 PM** — performances by B7G residents (singing, dance, drama, dance drama) and live sand art by Mr. Raghavendra Hegde, with Kannada film actor Nagabhushana NS.',
    '• **1 November, from 9 AM** — Chief Guests Prakash Belawadi and Dharmendra Kumar (Dharmi), B7G Santhe food stalls, and evening highlights Hulivesha (Huli Kunita) and a live band.',
    'See the posters in the Programmes section.',
  ].join('\n'),
  kn: [
    'ವಿವರವಾದ ಕಾರ್ಯಕ್ರಮ ಪಟ್ಟಿಯನ್ನು ಕಾರ್ಯಕ್ರಮದ ಹತ್ತಿರ ಪ್ರಕಟಿಸಲಾಗುವುದು. ಪೋಸ್ಟರ್‌ಗಳ ಮುಖ್ಯಾಂಶಗಳು:',
    '• **ಅಕ್ಟೋಬರ್ 31, ಸಂಜೆ 5 – ರಾತ್ರಿ 10** — B7G ನಿವಾಸಿಗಳಿಂದ ಗಾಯನ, ನೃತ್ಯ, ನಾಟಕ, ನೃತ್ಯ ರೂಪಕ; ಶ್ರೀ ರಾಘವೇಂದ್ರ ಹೆಗಡೆ ಅವರಿಂದ ಲೈವ್ ಮರಳು ಕಲೆ; ಕನ್ನಡ ಚಲನಚಿತ್ರ ನಟ ನಾಗಭೂಷಣ ಎನ್.ಎಸ್.',
    '• **ನವೆಂಬರ್ 1, ಬೆಳಿಗ್ಗೆ 9ರಿಂದ** — ಮುಖ್ಯ ಅತಿಥಿಗಳು ಪ್ರಕಾಶ್ ಬೆಳವಾಡಿ ಮತ್ತು ಧರ್ಮೇಂದ್ರ ಕುಮಾರ್ (ಧರ್ಮಿ); B7G ಸಂತೆ ಆಹಾರ ಮಳಿಗೆಗಳು; ಸಂಜೆ ಹುಲಿವೇಷ (ಹುಲಿ ಕುಣಿತ) ಮತ್ತು ಲೈವ್ ಬ್ಯಾಂಡ್.',
    'ಪೋಸ್ಟರ್‌ಗಳನ್ನು ಕಾರ್ಯಕ್ರಮಗಳು ವಿಭಾಗದಲ್ಲಿ ನೋಡಿ.',
  ].join('\n'),
};

const dayLabel = (date: string, language: Language) => translations.schedule.days[date]?.[language] ?? date;
const sessionLabel = (session: Program['session'], language: Language) => translations.schedule.sessions[session][language];

function describeProgram(program: Program, language: Language): string {
  const time = program.startTime && program.endTime ? `, ${program.startTime}–${program.endTime}` : '';
  return `**${program.title[language]}** — ${dayLabel(program.date, language)}, ${sessionLabel(program.session, language)}, #${program.sequence}${time}`;
}

/** Running order grouped by day and session, as light markdown for the chat. */
function formatProgramme(items: Program[], language: Language): string {
  const lines: string[] = [];
  for (const date of programDates) {
    for (const session of sessionOrder) {
      const group = items.filter((p) => p.date === date && p.session === session);
      if (group.length === 0) continue;
      lines.push('', `**${dayLabel(date, language)} — ${sessionLabel(session, language)}**`);
      lines.push(...group.map((p) => `• ${p.sequence}. ${p.title[language]}`));
    }
  }
  return lines.join('\n').trim();
}

function today(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Today's programme on an event day, otherwise both days. */
function relevantProgramme(now: Date): Program[] {
  const day = today(now);
  return programDates.includes(day) ? programs.filter((p) => p.date === day) : programs;
}

/**
 * Chat router. Structured answers come first and are exact: guest profile
 * cards and guest lists, the official programme (data/programs.ts, read from
 * knowledge/programme-2026.json) and sponsors. Everything else goes to the
 * backend RAG (Supabase pgvector + Claude, see docs/RAG.md) when
 * VITE_RAG_API_URL is set, and falls back to the offline keyword search over
 * /knowledge if it isn't set or can't be reached.
 */
export async function answerQuestion(
  question: string,
  language: Language = 'en',
  context: ChatContext = {},
): Promise<RagAnswer> {
  const guestReply = await answerGuestQuestion(question, language, context.lastGuestId, {
    structuredOnly: Boolean(RAG_API_URL),
  });
  if (guestReply) return guestReply;

  const now = new Date();
  const detected = detectIntent(question);
  // With the backend RAG on, schedule questions go there: it understands days,
  // sessions, performers and follow-ups. Offline, they're answered from the same data here.
  const intent = RAG_API_URL && detected.startsWith('schedule') ? 'general' : detected;

  // Detailed programme not released yet: share the poster highlights instead of the running order.
  if (!SHOW_PROGRAMME_DETAILS && intent.startsWith('schedule')) {
    return {
      answer: PROGRAMME_COMING_SOON[language],
      sources: [SCHEDULE_SOURCE],
      suggestedFollowUps: ['Who are the Chief Guests?', 'What is Kannada Rajyotsava?'],
      grounded: true,
    };
  }

  if (intent === 'schedule_now' || intent === 'schedule_next' || intent === 'schedule_at_time') {
    if (hasTimings(programs)) {
      const time = intent === 'schedule_at_time' ? extractTime(question) : null;
      const match =
        intent === 'schedule_now'
          ? getCurrentProgram(programs, now)
          : intent === 'schedule_next'
            ? getNextProgram(programs, now)
            : time
              ? getProgramAtTime(programs, today(now), time)
              : undefined;
      if (match) {
        return {
          answer: describeProgram(match, language),
          sources: [SCHEDULE_SOURCE],
          suggestedFollowUps: ['Show me the full schedule'],
          grounded: true,
        };
      }
    }
    return {
      answer: `${NO_TIMINGS[language]}\n${formatProgramme(relevantProgramme(now), language)}`,
      sources: [SCHEDULE_SOURCE],
      suggestedFollowUps: ['Who are the Chief Guests?', 'What is Kannada Rajyotsava?'],
      grounded: true,
    };
  }

  if (intent === 'schedule_today') {
    return {
      answer: formatProgramme(/\btoday\b/i.test(question) ? relevantProgramme(now) : programs, language),
      sources: [SCHEDULE_SOURCE],
      suggestedFollowUps: ['Who are the Chief Guests?', 'What is Kannada Rajyotsava?'],
      grounded: programs.length > 0,
    };
  }

  if (intent === 'schedule_category') {
    const category = extractCategory(question);
    const matches = category ? getProgramsByCategory(programs, category as Program['category']) : [];
    if (matches.length > 0) {
      return {
        answer: matches.map((p) => `• ${describeProgram(p, language)}`).join('\n'),
        sources: [SCHEDULE_SOURCE],
        suggestedFollowUps: ['Show me the full schedule', 'Who are the Chief Guests?'],
        grounded: true,
      };
    }
    return {
      answer: FALLBACK[language],
      sources: [],
      suggestedFollowUps: ['Show me the full schedule', "What's happening today?"],
      grounded: false,
    };
  }

  if (intent === 'sponsors') {
    const list = sponsors.map((s) => `${s.name} (${s.category})`).join(', ');
    return {
      answer:
        language === 'kn'
          ? `ನಮ್ಮ ಪ್ರೋತ್ಸಾಹಕರು: ${list}.${PROVISIONAL_NOTE.kn}`
          : `Our sponsors are: ${list}.${PROVISIONAL_NOTE.en}`,
      sources: [{ label: 'Sponsors', type: 'sponsor' }],
      suggestedFollowUps: ['Show me the full schedule', 'Who are the Chief Guests?'],
      grounded: true,
    };
  }

  if (RAG_API_URL) {
    try {
      const result = await queryRagApi(question, context.conversationId, context.history ?? []);
      return {
        answer: result.answer,
        sources: result.sources.map((source) => ({ label: source.title, type: 'general' as const })),
        suggestedFollowUps: ['Who are the Chief Guests?', 'What is Mysoorina Kathegalu?', 'Show me the full schedule'],
        grounded: result.grounded,
      };
    } catch (error) {
      console.warn('Knowledge service unavailable, answering offline:', error);
    }
  }

  // Offline: best-matching knowledge section, verbatim.
  const docs = retrieveRelevantDocs(question, language);
  if (docs.length === 0) {
    return {
      answer: FALLBACK[language],
      sources: [],
      suggestedFollowUps: ['Who are the Chief Guests?', 'What is Kannada Rajyotsava?', 'Show me the full schedule'],
      grounded: false,
    };
  }

  return {
    answer: docs[0].text,
    sources: [docs[0].source],
    suggestedFollowUps: ['Who are the Chief Guests?', 'What is Mysoorina Kathegalu?', 'Show me the full schedule'],
    grounded: true,
  };
}
