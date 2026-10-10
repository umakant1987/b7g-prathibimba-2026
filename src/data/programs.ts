import type { Program, ProgramCategory, ProgramSession } from '../types';

/**
 * The official cultural programme, read from the same file the AI assistant
 * uses (knowledge/programme-2026.json), so the website and the chat can never
 * disagree. Edit that file to change the programme; run `npm run rag:ingest`
 * to update the assistant too.
 */
const files = import.meta.glob('/knowledge/programme-2026.json', { eager: true, import: 'default' }) as Record<
  string,
  { documents: ProgrammeRecord[] }
>;

interface ProgrammeRecord {
  id: string;
  title: string;
  subcategory: string;
  event_date?: string;
  session?: ProgramSession;
  session_name?: string;
  sequence?: number;
  performer?: string | null;
  performance_type?: string | null;
  start_time?: string;
  end_time?: string;
}

const SESSION_ORDER: ProgramSession[] = ['morning', 'afternoon', 'evening'];

/** Groups the organisers' performance types into the filter chips shown on the website. */
function categorize(type: string | null | undefined): ProgramCategory {
  const t = (type ?? '').toLowerCase();
  if (/kids/.test(t)) return 'kids';
  if (/drama|skit/.test(t)) return 'drama';
  if (/dance/.test(t)) return 'dance';
  if (/sing|song|violin|flute|instrumental|jamming/.test(t)) return 'music';
  if (/speech|recital/.test(t)) return 'talks';
  if (/ceremony|invocation|flag|thanks/.test(t)) return 'ceremony';
  return 'more';
}

const records = Object.values(files).flatMap((file) => file.documents);

export const programs: Program[] = records
  .filter((r) => r.subcategory === 'performance' && r.event_date && r.session && r.sequence)
  .map((r) => ({
    id: r.id,
    // Names stay exactly as the organisers wrote them; no translations are invented.
    title: { en: r.title, kn: r.title },
    performer: r.performer ?? undefined,
    performanceType: r.performance_type ?? undefined,
    date: r.event_date!,
    session: r.session!,
    sequence: r.sequence!,
    category: categorize(r.performance_type),
    status: 'scheduled' as const,
    startTime: r.start_time,
    endTime: r.end_time,
  }))
  .sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      SESSION_ORDER.indexOf(a.session) - SESSION_ORDER.indexOf(b.session) ||
      a.sequence - b.sequence,
  );

/** Session names from the day/session records, e.g. "Cultural Evening", keyed by "date|session". */
export const sessionNames: Record<string, string> = Object.fromEntries(
  records
    .filter((r) => r.subcategory === 'day_schedule' && r.event_date && r.session)
    .map((r) => [`${r.event_date}|${r.session}`, r.session_name ?? '']),
);

export const programDates: string[] = [...new Set(programs.map((p) => p.date))];
export const sessionOrder = SESSION_ORDER;
