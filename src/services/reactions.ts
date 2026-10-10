import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/env';
import type { ReactionCounts, ReactionType } from '../types';

/**
 * Shared "Show Your Love" counters.
 *
 * With VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY set, counts live in the
 * Supabase `reaction_counts` table: everyone reads the same totals, taps go
 * through the rate-limited `add_reaction` function, and changes are pushed to
 * every open page via Supabase Realtime. See docs/ARCHITECTURE.md for the SQL.
 *
 * Without Supabase (or if it can't be reached), counts fall back to this
 * browser's localStorage so the page still works — but only per visitor.
 */

const STORAGE_KEY = 'b7g_reaction_counts_v2';
const SESSION_KEY = 'b7g_session_id';
const REACTION_TYPES: ReactionType[] = ['love', 'proud', 'support', 'respect', 'celebrate'];

const ZERO_COUNTS: ReactionCounts = {
  love: 0,
  proud: 0,
  support: 0,
  respect: 0,
  celebrate: 0,
  updatedAt: new Date().toISOString(),
};

const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

/** Set once Supabase fails (e.g. tables not created yet), so the page degrades to local counts. */
let useLocalFallback = !supabase;

export function isSharedCounter(): boolean {
  return !useLocalFallback;
}

interface CountRow {
  reaction_type: string;
  count: number;
  updated_at: string;
}

function rowsToCounts(rows: CountRow[]): ReactionCounts {
  const counts: ReactionCounts = { ...ZERO_COUNTS, updatedAt: new Date().toISOString() };
  for (const row of rows) {
    if ((REACTION_TYPES as string[]).includes(row.reaction_type)) {
      counts[row.reaction_type as ReactionType] = Number(row.count);
    }
  }
  return counts;
}

function loadLocal(): ReactionCounts {
  if (typeof window === 'undefined') return ZERO_COUNTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...ZERO_COUNTS, ...(JSON.parse(raw) as Partial<ReactionCounts>) } : ZERO_COUNTS;
  } catch {
    return ZERO_COUNTS;
  }
}

function saveLocal(counts: ReactionCounts): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
  } catch {
    // storage unavailable (private browsing, quota) — degrade silently
  }
}

export async function fetchReactionCounts(): Promise<ReactionCounts> {
  if (supabase && !useLocalFallback) {
    const { data, error } = await supabase.from('reaction_counts').select('reaction_type, count, updated_at');
    if (!error && data) return rowsToCounts(data as CountRow[]);
    console.warn('Shared reaction counts unavailable, using this browser only:', error?.message);
    useLocalFallback = true;
  }
  return loadLocal();
}

export class SlowDownError extends Error {}

/**
 * Records one tap and resolves with the latest totals. The server enforces
 * the per-browser rate limit; a SlowDownError means the tap wasn't counted.
 */
export async function submitReaction(type: ReactionType): Promise<ReactionCounts> {
  if (supabase && !useLocalFallback) {
    const { data, error } = await supabase.rpc('add_reaction', { p_type: type, p_session: getSessionId() });
    if (!error && data) return rowsToCounts(data as CountRow[]);
    if (error?.message.includes('slow down')) throw new SlowDownError(error.message);
    throw new Error(error?.message ?? 'Reaction failed');
  }
  const saved = loadLocal();
  const next: ReactionCounts = { ...saved, [type]: saved[type] + 1, updatedAt: new Date().toISOString() };
  saveLocal(next);
  return next;
}

/**
 * Calls `onChange(type, count)` whenever any visitor's tap changes a total.
 * Returns an unsubscribe function. No-op without Supabase.
 */
export function subscribeToReactionCounts(onChange: (type: ReactionType, count: number) => void): () => void {
  if (!supabase || useLocalFallback) return () => {};
  const client = supabase;
  const channel = client
    .channel('reaction_counts')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reaction_counts' }, (payload) => {
      const row = payload.new as Partial<CountRow>;
      if (row.reaction_type && (REACTION_TYPES as string[]).includes(row.reaction_type)) {
        onChange(row.reaction_type as ReactionType, Number(row.count));
      }
    })
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}

/** Anonymous per-browser identifier — no login, no personal data. */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      window.localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return FALLBACK_SESSION_ID;
  }
}

/** Used when localStorage is blocked, so each page load still gets its own rate-limit bucket. */
const FALLBACK_SESSION_ID = `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
