/**
 * npm run feedback:export — downloads every feedback response and writes
 * feedback-export/feedback-<date>.csv, then prints average ratings per aspect.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { loadConfig } from '../config.ts';
import { getServiceClient } from '../lib/supabase.ts';
import { FEEDBACK_ASPECTS, FEEDBACK_BUCKET, type FeedbackEntry } from '../http/feedback.ts';

const supabase = getServiceClient(loadConfig());
const bucket = supabase.storage.from(FEEDBACK_BUCKET);

const { data: folders, error } = await bucket.list('', { limit: 1000 });
if (error) {
  console.error(/not found/i.test(error.message) ? 'No feedback yet.' : error.message);
  process.exit(1);
}

const entries: FeedbackEntry[] = [];
for (const folder of folders ?? []) {
  const { data: files } = await bucket.list(folder.name, { limit: 10000 });
  for (const file of files ?? []) {
    const { data } = await bucket.download(`${folder.name}/${file.name}`);
    if (data) entries.push(JSON.parse(await data.text()) as FeedbackEntry);
  }
}
entries.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const rows = [
  ['submittedAt', 'name', 'language', ...FEEDBACK_ASPECTS, 'improvements'],
  ...entries.map((e) => [e.submittedAt, e.name, e.language, ...FEEDBACK_ASPECTS.map((a) => e.ratings[a] ?? ''), e.improvements]),
];
mkdirSync('feedback-export', { recursive: true });
const file = `feedback-export/feedback-${new Date().toISOString().slice(0, 10)}.csv`;
writeFileSync(file, '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\n'));

console.log(`${entries.length} responses → ${file}\n`);
for (const aspect of FEEDBACK_ASPECTS) {
  const values = entries.map((e) => e.ratings[aspect]).filter((v): v is number => typeof v === 'number');
  const avg = values.length ? (values.reduce((s, v) => s + v, 0) / values.length).toFixed(2) : '—';
  console.log(`${aspect.padEnd(20)} ${avg}  (${values.length} ratings)`);
}
