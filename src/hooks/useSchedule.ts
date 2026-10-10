import { useEffect, useMemo, useState } from 'react';
import { programDates } from '../data/programs';
import { fetchPrograms, getCurrentProgram, getNextProgram, searchPrograms } from '../services/schedule';
import type { Program, ProgramCategory } from '../types';

interface UseScheduleResult {
  programs: Program[];
  loading: boolean;
  error: string | null;
  now: Date;
  currentProgram: Program | undefined;
  nextProgram: Program | undefined;
  /** Programme day shown, YYYY-MM-DD. */
  day: string;
  setDay: (day: string) => void;
  category: ProgramCategory | 'all';
  setCategory: (category: ProgramCategory | 'all') => void;
  query: string;
  setQuery: (query: string) => void;
  /** Items for the selected day, filtered by category and search. */
  filteredPrograms: Program[];
}

/** On a programme day, open that day; otherwise the first day. */
function initialDay(): string {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return programDates.includes(today) ? today : (programDates[0] ?? '');
}

export function useSchedule(): UseScheduleResult {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [day, setDay] = useState(initialDay);
  const [category, setCategory] = useState<ProgramCategory | 'all'>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchPrograms()
      .then((data) => {
        if (!cancelled) {
          setPrograms(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Unable to load the program schedule right now.');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const filteredPrograms = useMemo(
    () =>
      searchPrograms(programs, query).filter(
        (p) => p.date === day && (category === 'all' || p.category === category),
      ),
    [programs, day, category, query],
  );

  return {
    programs,
    loading,
    error,
    now,
    currentProgram: getCurrentProgram(programs, now),
    nextProgram: getNextProgram(programs, now),
    day,
    setDay,
    category,
    setCategory,
    query,
    setQuery,
    filteredPrograms,
  };
}
