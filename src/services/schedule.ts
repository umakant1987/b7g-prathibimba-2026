import { programs } from '../data/programs';
import type { Program } from '../types';
import { apiGet } from './api';

export async function fetchPrograms(): Promise<Program[]> {
  return apiGet('/programs', () => programs);
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Items with published start/end times on the given day. None exist until timings are announced. */
function timedOn(allPrograms: Program[], date: string): (Program & { startTime: string; endTime: string })[] {
  return allPrograms.filter(
    (p): p is Program & { startTime: string; endTime: string } =>
      p.date === date && !!p.startTime && !!p.endTime && p.status !== 'cancelled',
  );
}

function isoDate(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** The item on stage right now — only possible on a programme day, for items with published times. */
export function getCurrentProgram(allPrograms: Program[], now: Date): Program | undefined {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return timedOn(allPrograms, isoDate(now)).find((p) => toMinutes(p.startTime) <= minutes && minutes < toMinutes(p.endTime));
}

export function getNextProgram(allPrograms: Program[], now: Date): Program | undefined {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return timedOn(allPrograms, isoDate(now))
    .filter((p) => toMinutes(p.startTime) > minutes)
    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))[0];
}

export function getProgramAtTime(allPrograms: Program[], date: string, time: string): Program | undefined {
  const minutes = toMinutes(time);
  return timedOn(allPrograms, date).find((p) => toMinutes(p.startTime) <= minutes && minutes < toMinutes(p.endTime));
}

/** Whether any timings have been published at all. */
export function hasTimings(allPrograms: Program[]): boolean {
  return allPrograms.some((p) => p.startTime && p.endTime);
}

export function getProgramsByCategory(allPrograms: Program[], category: Program['category']): Program[] {
  return allPrograms.filter((p) => p.category === category);
}

export function searchPrograms(allPrograms: Program[], query: string): Program[] {
  const q = query.trim().toLowerCase();
  if (!q) return allPrograms;
  return allPrograms.filter(
    (p) =>
      p.title.en.toLowerCase().includes(q) ||
      (p.performer ?? '').toLowerCase().includes(q) ||
      (p.performanceType ?? '').toLowerCase().includes(q),
  );
}
