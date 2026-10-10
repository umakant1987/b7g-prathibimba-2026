import { useCallback, useEffect, useRef, useState } from 'react';
import { MILESTONES } from '../data/reactions';
import {
  fetchReactionCounts,
  isSharedCounter,
  SlowDownError,
  submitReaction,
  subscribeToReactionCounts,
} from '../services/reactions';
import type { ReactionCounts, ReactionType } from '../types';
import { playPopSound } from '../utils/sound';

const CLICK_WINDOW_MS = 4000;
const CLICK_LIMIT = 12;
const CELEBRATED_KEY = 'b7g_celebrated_milestones_v2';
const NO_PENDING: Record<ReactionType, number> = { love: 0, proud: 0, support: 0, respect: 0, celebrate: 0 };

function getCelebratedMilestones(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(CELEBRATED_KEY) ?? '[]') as number[];
  } catch {
    return [];
  }
}

function markMilestoneCelebrated(milestone: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CELEBRATED_KEY, JSON.stringify([...getCelebratedMilestones(), milestone]));
  } catch {
    // ignore
  }
}

function findNewlyCrossedMilestone(before: number, after: number): number | null {
  const crossed = MILESTONES.find((m) => before < m && after >= m);
  if (crossed === undefined || getCelebratedMilestones().includes(crossed)) return null;
  return crossed;
}

interface UseReactionsResult {
  counts: ReactionCounts | null;
  loading: boolean;
  milestone: number | null;
  cooldownActive: boolean;
  /** True when counts are the community-wide Supabase totals; false when only this browser's. */
  shared: boolean;
  /** Reactions accepted from this visitor this session — drives "Learn a Kannada word". */
  wordsLearned: number;
  react: (type: ReactionType) => void;
}

/**
 * Displayed count = latest server total + this visitor's taps still in flight,
 * so the number responds instantly and never jumps backwards while tapping.
 * Other visitors' taps arrive through the realtime subscription. Milestones
 * celebrate whenever the community total crosses one, whoever tapped.
 */
export function useReactions(): UseReactionsResult {
  const [counts, setCounts] = useState<ReactionCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [shared, setShared] = useState(false);
  const [wordsLearned, setWordsLearned] = useState(0);

  const serverRef = useRef<ReactionCounts | null>(null);
  const pendingRef = useRef<Record<ReactionType, number>>({ ...NO_PENDING });
  const displayedLoveRef = useRef(0);
  const clickTimestamps = useRef<number[]>([]);

  const publish = useCallback(() => {
    const server = serverRef.current;
    if (!server) return;
    const pending = pendingRef.current;
    const next: ReactionCounts = {
      love: server.love + pending.love,
      proud: server.proud + pending.proud,
      support: server.support + pending.support,
      respect: server.respect + pending.respect,
      celebrate: server.celebrate + pending.celebrate,
      updatedAt: server.updatedAt,
    };
    const crossed = findNewlyCrossedMilestone(displayedLoveRef.current, next.love);
    displayedLoveRef.current = next.love;
    setCounts(next);
    if (crossed !== null) {
      markMilestoneCelebrated(crossed);
      setMilestone(crossed);
      window.setTimeout(() => setMilestone(null), 4200);
    }
  }, []);

  /** Server totals only grow, so keep the highest value seen (updates can arrive out of order). */
  const mergeServer = useCallback((incoming: ReactionCounts) => {
    const current = serverRef.current;
    serverRef.current = current
      ? {
          love: Math.max(current.love, incoming.love),
          proud: Math.max(current.proud, incoming.proud),
          support: Math.max(current.support, incoming.support),
          respect: Math.max(current.respect, incoming.respect),
          celebrate: Math.max(current.celebrate, incoming.celebrate),
          updatedAt: incoming.updatedAt,
        }
      : incoming;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};
    fetchReactionCounts().then((data) => {
      if (cancelled) return;
      serverRef.current = data;
      displayedLoveRef.current = data.love; // don't celebrate milestones already passed before this visit
      publish();
      setLoading(false);
      setShared(isSharedCounter());
      unsubscribe = subscribeToReactionCounts((type, count) => {
        const base = serverRef.current;
        if (!base) return;
        mergeServer({ ...base, [type]: count, updatedAt: new Date().toISOString() });
        publish();
      });
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [publish, mergeServer]);

  const react = useCallback(
    (type: ReactionType) => {
      const server = serverRef.current;
      if (!server) return;

      const now = Date.now();
      clickTimestamps.current = clickTimestamps.current.filter((t) => now - t < CLICK_WINDOW_MS);
      if (clickTimestamps.current.length >= CLICK_LIMIT) {
        setCooldownActive(true);
        window.setTimeout(() => setCooldownActive(false), 1200);
        return;
      }
      clickTimestamps.current.push(now);

      pendingRef.current[type] += 1;
      publish();
      setWordsLearned((n) => n + 1);

      if (navigator.vibrate) navigator.vibrate(12);
      if (type === 'love') playPopSound();

      submitReaction(type)
        .then((confirmed) => {
          mergeServer(confirmed);
        })
        .catch((error: unknown) => {
          if (error instanceof SlowDownError) {
            setCooldownActive(true);
            window.setTimeout(() => setCooldownActive(false), 1200);
          } else {
            console.warn('Reaction not saved:', error);
          }
        })
        .finally(() => {
          pendingRef.current[type] -= 1;
          publish();
        });
    },
    [publish, mergeServer],
  );

  return { counts, loading, milestone, cooldownActive, shared, wordsLearned, react };
}
