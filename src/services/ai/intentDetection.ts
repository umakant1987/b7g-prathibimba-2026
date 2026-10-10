export type ChatIntent =
  | 'schedule_now'
  | 'schedule_next'
  | 'schedule_at_time'
  | 'schedule_category'
  | 'schedule_today'
  | 'sponsors'
  | 'venue'
  | 'faq'
  | 'general';

const TIME_PATTERN = /(\d{1,2})(:\d{2})?\s*(am|pm)/i;

/**
 * Lightweight rule-based intent classifier. Keeps structured schedule queries
 * fast and hallucination-free; swap for an LLM-based classifier later if needed
 * without changing the RAG orchestration below.
 */
export function detectIntent(question: string): ChatIntent {
  const q = question.toLowerCase();

  if (/\bnow\b|happening now|live now|currently/.test(q)) return 'schedule_now';
  if (/next|coming up|after this|what's after/.test(q)) return 'schedule_next';
  if (TIME_PATTERN.test(q)) return 'schedule_at_time';
  if (/kid|children|child/.test(q)) return 'schedule_category';
  if (/sponsor/.test(q)) return 'sponsors';
  if (/venue|stage|where is|located|location/.test(q)) return 'venue';
  if (/today|full schedule|whole schedule|entire schedule|all program/.test(q)) return 'schedule_today';
  if (/free|donat|contribut|start|cost|price/.test(q)) return 'faq';
  // Food questions are not schedule questions: "Can I set up a Karnataka food stall?" is about B7G Santhe.
  if (/schedule|program|performance|dance|music/.test(q)) return 'schedule_category';

  return 'general';
}

export function extractTime(question: string): string | null {
  const match = question.match(TIME_PATTERN);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minutes = match[2] ? match[2].slice(1) : '00';
  const meridian = match[3].toLowerCase();
  if (meridian === 'pm' && hour < 12) hour += 12;
  if (meridian === 'am' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${minutes}`;
}

/** Question words → programme filter groups (see categorize() in data/programs.ts). */
const CATEGORY_KEYWORDS: Record<string, string> = {
  kid: 'kids',
  children: 'kids',
  drama: 'drama',
  skit: 'drama',
  dance: 'dance',
  music: 'music',
  sing: 'music',
  song: 'music',
  speech: 'talks',
  talk: 'talks',
  ceremony: 'ceremony',
  invocation: 'ceremony',
  flag: 'ceremony',
};

export function extractCategory(question: string): string | null {
  const q = question.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (q.includes(keyword)) return category;
  }
  return null;
}
