import { containsAlias, KANNADA, searchTerms } from '../text.ts';
import type { KnowledgeEntity } from '../types.ts';

/**
 * Generic question vocabulary → knowledge categories. This describes how
 * people phrase questions, not event facts, so it doesn't change when new
 * knowledge is added. Categories that aren't present simply never match.
 */
const CATEGORY_HINTS: { pattern: RegExp; categories: string[] }[] = [
  { pattern: /chief\s*guests?|ಮುಖ್ಯ\s*ಅತಿಥಿ/i, categories: ['chief_guest'] },
  { pattern: /\bguests?\b|celebrit|ಅತಿಥಿ/i, categories: ['chief_guest', 'guest'] },
  { pattern: /sponsor|partner|ಪ್ರಾಯೋಜಕ|ಪ್ರೋತ್ಸಾಹಕ/i, categories: ['sponsor'] },
  { pattern: /schedule|programme|program|timing|time\s*table|agenda|what'?s on|happening|going on|line-?up|before|after|ವೇಳಾಪಟ್ಟಿ|ಕಾರ್ಯಕ್ರಮ/i, categories: ['schedule', 'programme'] },
  { pattern: /perform|singer|dancer|artist|band|troupe/i, categories: ['performer', 'programme'] },
  { pattern: /venue|where\b|location|stage|address|parking/i, categories: ['venue', 'event'] },
  { pattern: /rajyotsava|ರಾಜ್ಯೋತ್ಸವ|november\s*1|1956|unification|ಏಕೀಕರಣ/i, categories: ['kannada_rajyotsava'] },
  { pattern: /histor|dynast|\bking|empire|ಇತಿಹಾಸ/i, categories: ['karnataka_history', 'heritage'] },
  { pattern: /culture|tradition|festival|food|cuisine|ಸಂಸ್ಕೃತಿ|ಪರಂಪರೆ/i, categories: ['karnataka_culture', 'heritage'] },
  { pattern: /\bb7g\b|brigade|community|residents?/i, categories: ['b7g_community'] },
  { pattern: /gallery|video|photo|last year|previous|2025/i, categories: ['gallery'] },
  { pattern: /announce|update|news/i, categories: ['announcement'] },
];

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6,
  jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11,
  november: 11, dec: 12, december: 12,
  ಜನವರಿ: 1, ಫೆಬ್ರವರಿ: 2, ಮಾರ್ಚ್: 3, ಏಪ್ರಿಲ್: 4, ಮೇ: 5, ಜೂನ್: 6, ಜುಲೈ: 7, ಆಗಸ್ಟ್: 8, ಸೆಪ್ಟೆಂಬರ್: 9, ಅಕ್ಟೋಬರ್: 10,
  ನವೆಂಬರ್: 11, ಡಿಸೆಂಬರ್: 12,
};

/** Categories describing people, for "who are the guests/performers?"-style questions. */
/** Programme sessions; Kannada: ಬೆಳಿಗ್ಗೆ morning, ಮಧ್ಯಾಹ್ನ afternoon, ಸಂಜೆ/ರಾತ್ರಿ evening. */
const SESSIONS: { session: string; pattern: RegExp }[] = [
  { session: 'morning', pattern: /\bmorning\b|ಬೆಳಿಗ್ಗೆ|ಬೆಳಗ್ಗೆ/i },
  { session: 'afternoon', pattern: /\bafternoon\b|ಮಧ್ಯಾಹ್ನ/i },
  { session: 'evening', pattern: /\bevening\b|\bnight\b|ಸಂಜೆ|ರಾತ್ರಿ/i },
];

const GUEST_CATEGORIES = ['chief_guest', 'guest'];

export const PERSON_CATEGORIES = new Set(['chief_guest', 'guest', 'performer']);

export interface QueryAnalysis {
  /** The (possibly rewritten) question used for search. */
  text: string;
  language: 'en' | 'kn';
  terms: string[];
  /** Terms that aren't part of a detected entity's name — what is actually being asked about. */
  topicTerms: string[];
  /** Names an entity and asks nothing more specific ("Who is Prakash Belawadi?") → wants a profile. */
  wantsProfile: boolean;
  /** Asks about a group of people without naming one ("Who are the Chief Guests?"). */
  wantsPeopleList: boolean;
  entities: KnowledgeEntity[];
  /** YYYY-MM-DD dates mentioned in the question. */
  dates: string[];
  /** Programme sessions mentioned: morning / afternoon / evening. */
  sessions: string[];
  categories: string[];
  /** A broad "what's happening (on <day> / in the <session>)?" question, best answered by day/session schedules. */
  wantsOverview: boolean;
}

/** Any Kannada script → answer in Kannada (covers mixed questions like "Prakash Belawadi ಯಾರು?"). */
export function detectLanguage(text: string): 'en' | 'kn' {
  return KANNADA.test(text) ? 'kn' : 'en';
}

/** Entities whose name or alias appears in the text, longest match first. */
export function detectEntities(text: string, entities: KnowledgeEntity[]): KnowledgeEntity[] {
  return entities
    .map((entity) => ({
      entity,
      match: [entity.name, ...entity.aliases].filter((alias) => containsAlias(text, alias)).sort((a, b) => b.length - a.length)[0],
    }))
    .filter((m) => m.match)
    .sort((a, b) => b.match!.length - a.match!.length)
    .map((m) => m.entity);
}

/**
 * Dates like "October 31", "31st Oct", "Nov 1", "ಅಕ್ಟೋಬರ್ 31". The year
 * comes from the question, else the year most event dates in the knowledge
 * base fall in. A bare day ("on the 31st", "on 1st") is resolved against the
 * event dates in the knowledge base when exactly one of them has that day.
 */
export function detectDates(text: string, defaultYear: number, knownDates: string[] = []): string[] {
  const monthNames = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');
  const day = '(\\d{1,2})(?:st|nd|rd|th|ರಂದು|ರ)?';
  const patterns = [
    new RegExp(`(?:^|[^a-z])(${monthNames})\\.?\\s*${day}(?:,?\\s*(\\d{4}))?`, 'gi'),
    new RegExp(`(?<!\\d)${day}\\s*(?:of\\s+)?(${monthNames})(?:,?\\s*(\\d{4}))?`, 'gi'),
  ];
  const found = new Set<string>();
  for (const [index, pattern] of patterns.entries()) {
    for (const match of text.matchAll(pattern)) {
      const [monthName, dayText, yearText] = index === 0 ? [match[1], match[2], match[3]] : [match[2], match[1], match[3]];
      const month = MONTHS[monthName.toLowerCase()];
      const dayNumber = Number(dayText);
      if (!month || dayNumber < 1 || dayNumber > 31) continue;
      const year = yearText ? Number(yearText) : defaultYear;
      found.add(`${year}-${String(month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`);
    }
  }
  if (found.size === 0 && knownDates.length > 0) {
    // "on the 31st" / "for 1st" / "31st?" — but not "who performs 1st" (first).
    const bare = [...text.matchAll(/(?:\b(?:on|for)\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\b)|(?:\b(\d{2})(?:st|nd|rd|th)\b)/gi)];
    for (const match of bare) {
      const dayNumber = Number(match[1] ?? match[2]);
      const candidates = [...new Set(knownDates)].filter((date) => Number(date.slice(8, 10)) === dayNumber);
      if (candidates.length === 1) found.add(candidates[0]);
    }
  }
  return [...found];
}

export function detectSessions(text: string): string[] {
  return SESSIONS.filter((s) => s.pattern.test(text)).map((s) => s.session);
}

export function detectCategories(text: string): string[] {
  const categories = new Set<string>();
  for (const hint of CATEGORY_HINTS) if (hint.pattern.test(text)) hint.categories.forEach((c) => categories.add(c));
  // "Chief guests" means only chief guests, not every guest.
  if (CATEGORY_HINTS[0].pattern.test(text)) categories.delete('guest');
  return [...categories];
}

/** The year most entity event dates fall in — used for questions that give a day and month only. */
export function inferEventYear(entities: KnowledgeEntity[]): number {
  const counts = new Map<number, number>();
  for (const date of entities.flatMap((e) => e.eventDates)) {
    const year = Number(date.slice(0, 4));
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? new Date().getFullYear();
}

export function analyzeQuery(text: string, entities: KnowledgeEntity[], languageOf: string = text): QueryAnalysis {
  const terms = searchTerms(text);
  const found = detectEntities(text, entities);
  const nameTerms = found.flatMap((e) => [e.name, ...e.aliases]).flatMap(searchTerms);
  const topicTerms = terms.filter((term) => !nameTerms.some((name) => name === term || (KANNADA.test(term) && term.startsWith(name))));
  const categories = detectCategories(text);
  const dates = detectDates(text, inferEventYear(entities), entities.flatMap((e) => e.eventDates));
  const sessions = detectSessions(text);
  const asksAboutGuests = categories.some((c) => GUEST_CATEGORIES.includes(c));
  return {
    text,
    language: detectLanguage(languageOf),
    terms,
    topicTerms,
    wantsProfile: found.length > 0 && topicTerms.length === 0,
    wantsPeopleList: found.length === 0 && categories.some((c) => PERSON_CATEGORIES.has(c)),
    entities: found,
    dates,
    sessions,
    categories,
    // Only generic words ("what is happening on 31st October in the evening?") — nothing specific like "violin".
    wantsOverview:
      found.length === 0 &&
      !asksAboutGuests &&
      terms.every(isGenericScheduleTerm) &&
      (dates.length > 0 || sessions.length > 0 || categories.includes('programme') || categories.includes('schedule')),
  };
}

/** Words that make a question a generic "what's on?" question rather than about something specific. */
const GENERIC_SCHEDULE_TERMS = new Set([
  'happening', 'programme', 'program', 'schedule', 'performing', 'perform', 'performance', 'performer', 'lineup',
  'line', 'going', 'event', 'item', 'there', 'session', 'day', 'today', 'morning', 'afternoon', 'evening', 'night',
  'ಕಾರ್ಯಕ್ರಮ', 'ಬೆಳಿಗ್ಗೆ', 'ಬೆಳಗ್ಗೆ', 'ಮಧ್ಯಾಹ್ನ', 'ಸಂಜೆ', 'ರಾತ್ರಿ',
]);

/** Generic schedule words, day numbers and month names. */
export function isGenericScheduleTerm(term: string): boolean {
  return GENERIC_SCHEDULE_TERMS.has(term) || /^\d{1,4}$/.test(term) || term in MONTHS;
}
