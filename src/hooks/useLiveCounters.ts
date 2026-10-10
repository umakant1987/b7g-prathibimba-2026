import { useEffect, useRef, useState } from 'react';
import { USE_MOCK_DATA } from '../config/env';
import { fetchImpactStats, mockNextTick } from '../services/donations';
import type { ImpactStats } from '../types';

interface UseLiveCountersResult {
  stats: ImpactStats | null;
  loading: boolean;
  error: string | null;
}

/**
 * Supabase -> API -> React -> Animated Counter.
 * In production, replace the mock polling interval with a Supabase realtime
 * subscription on the `donations` table's aggregate view.
 */
export function useLiveCounters(pollMs = 4000): UseLiveCountersResult {
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const statsRef = useRef<ImpactStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchImpactStats()
      .then((data) => {
        if (cancelled) return;
        statsRef.current = data;
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Unable to load live community impact right now.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!USE_MOCK_DATA) return;

    const interval = setInterval(() => {
      if (!statsRef.current) return;
      const next = mockNextTick(statsRef.current);
      statsRef.current = next;
      setStats(next);
    }, pollMs);

    return () => clearInterval(interval);
  }, [pollMs]);

  return { stats, loading, error };
}
