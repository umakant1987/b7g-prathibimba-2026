import { searchTerms } from '../text.ts';
import type { ConversationTurn, RetrievedChunk } from '../types.ts';
import { detectDates, detectSessions, isGenericScheduleTerm } from './queryAnalysis.ts';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function formatDate(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${MONTH_NAMES[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
}

/**
 * Carries the programme day (and session) from earlier turns into a short
 * follow-up, e.g. after talking about 31 October, "What is happening in the
 * evening?" means the 31 October evening. Returns the text to append to the
 * search question, or null when nothing should be carried over.
 */
export function carryScheduleContext(
  question: string,
  history: ConversationTurn[],
  year: number,
  knownDates: string[],
): string | null {
  const dates = detectDates(question, year, knownDates);
  const sessions = detectSessions(question);
  const topic = searchTerms(question).filter((t) => !isGenericScheduleTerm(t));
  const additions: string[] = [];

  // A session or a generic "what's on?" question without a day → take the most recent single day discussed.
  const isScheduleQuestion = sessions.length > 0 || (topic.length === 0 && searchTerms(question).some(isGenericScheduleTerm));
  if (dates.length === 0 && isScheduleQuestion) {
    for (let i = history.length - 1; i >= 0; i -= 1) {
      const found = detectDates(history[i].content, year, knownDates);
      if (found.length === 1) {
        additions.push(`on ${formatDate(found[0])}`);
        break;
      }
      if (found.length > 1) break; // the last turn covered several days — don't guess
    }
  }

  // Just a day ("1 November", e.g. answering "which day?") → keep the session the visitor asked about.
  const dateOnly = dates.length > 0 && topic.length === 0;
  if (sessions.length === 0 && dateOnly) {
    for (let i = history.length - 1; i >= 0; i -= 1) {
      if (history[i].role !== 'user') continue;
      const previous = detectSessions(history[i].content);
      if (previous.length === 1) additions.push(`${previous[0]} programme`);
      break;
    }
  }

  return additions.length > 0 ? additions.join(' ') : null;
}

/**
 * "What is happening in the evening?" with no day, when evenings exist on
 * several days → the days to ask about. Null when the question is unambiguous.
 */
export function ambiguousSessionDays(sessions: string[], dates: string[], chunks: RetrievedChunk[]): string[] | null {
  if (sessions.length !== 1 || dates.length > 0) return null;
  const days = new Set(
    chunks
      .filter((c) => c.subcategory === 'day_schedule' && c.metadata?.session === sessions[0] && c.event_date)
      .map((c) => c.event_date!),
  );
  return days.size > 1 ? [...days].sort() : null;
}
