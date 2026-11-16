/**
 * Event feedback: POST /api/feedback → validated, then stored as one JSON file per
 * response in a private Supabase Storage bucket (service-role key, never the browser).
 * Export with `npm run feedback:export`.
 */
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export const FEEDBACK_BUCKET = 'event-feedback';

/** Rated aspects of the day; keep in sync with src/data/feedback.ts. */
export const FEEDBACK_ASPECTS = [
  'morningGuestSpeech',
  'santhe',
  'eveningCultural',
  'sandArt',
  'jamming',
  'lightStage',
  'soundSystem',
  'ledWall',
  'overall',
] as const;

export interface FeedbackEntry {
  submittedAt: string;
  ratings: Partial<Record<(typeof FEEDBACK_ASPECTS)[number], number>>;
  improvements: string;
  name: string;
  language: string;
}

/** Turns an untrusted body into a clean entry, or explains what is wrong. */
export function parseFeedback(body: Record<string, unknown>): { entry: FeedbackEntry } | { error: string } {
  const raw = (body.ratings ?? {}) as Record<string, unknown>;
  const ratings: FeedbackEntry['ratings'] = {};
  for (const aspect of FEEDBACK_ASPECTS) {
    const value = raw[aspect];
    if (value === undefined || value === null || value === 0) continue;
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 5) {
      return { error: `Rating for "${aspect}" must be 1–5.` };
    }
    ratings[aspect] = value;
  }
  const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const improvements = text(body.improvements, 2000);
  if (Object.keys(ratings).length === 0 && !improvements) return { error: 'Please rate at least one part of the day.' };
  return {
    entry: {
      submittedAt: new Date().toISOString(),
      ratings,
      improvements,
      name: text(body.name, 80),
      language: body.language === 'kn' ? 'kn' : 'en',
    },
  };
}

let bucketReady = false;

async function ensureBucket(supabase: SupabaseClient): Promise<void> {
  if (bucketReady) return;
  const { error } = await supabase.storage.createBucket(FEEDBACK_BUCKET, { public: false });
  if (error && !/exist/i.test(error.message)) throw error;
  bucketReady = true;
}

export async function saveFeedback(supabase: SupabaseClient, entry: FeedbackEntry): Promise<void> {
  await ensureBucket(supabase);
  const path = `${entry.submittedAt.slice(0, 10)}/${entry.submittedAt.replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}.json`;
  const { error } = await supabase.storage
    .from(FEEDBACK_BUCKET)
    .upload(path, JSON.stringify(entry, null, 2), { contentType: 'application/json', upsert: false });
  if (error) throw error;
}
