import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { slugify } from '../text.ts';
import type { KnowledgeDocument, KnowledgeSection } from '../types.ts';
import { validateDocument } from './schema.ts';

export interface LoadIssue {
  file: string;
  message: string;
}

export interface LoadResult {
  documents: KnowledgeDocument[];
  issues: LoadIssue[];
  filesRead: number;
}

/** Markdown headings that are guidance for the assistant rather than facts for visitors. */
const GUIDANCE_HEADINGS = /positioning rules|how to talk about it|welcome message/i;

/**
 * Loads every knowledge file under `dir`:
 *  - `*.json` in the canonical `{ "documents": [...] }` format (see knowledge/_schema)
 *  - `*.md` with frontmatter, where each `##` heading becomes a section
 * Files and folders starting with "_" or "." (schemas, examples, drafts) are skipped.
 * Invalid documents are reported in `issues` and skipped; the rest still load.
 */
export async function loadKnowledge(dir: string): Promise<LoadResult> {
  const files = await listKnowledgeFiles(dir);
  const documents: KnowledgeDocument[] = [];
  const issues: LoadIssue[] = [];
  const seenIds = new Map<string, string>();

  for (const file of files) {
    const relative = path.relative(dir, file).split(path.sep).join('/');
    let raw: string;
    try {
      raw = await readFile(file, 'utf8');
    } catch (error) {
      issues.push({ file: relative, message: `Could not read file: ${(error as Error).message}` });
      continue;
    }

    let candidates: unknown[];
    try {
      candidates = relative.endsWith('.json') ? parseJsonFile(raw) : [parseMarkdownFile(raw, relative)];
    } catch (error) {
      issues.push({ file: relative, message: (error as Error).message });
      continue;
    }

    candidates.forEach((candidate, index) => {
      const where = candidates.length > 1 ? `${relative} [document ${index + 1}]` : relative;
      const result = validateDocument(candidate, relative);
      if (!result.ok) {
        issues.push({ file: where, message: result.errors.join('; ') });
        return;
      }
      const previous = seenIds.get(result.document.id);
      if (previous) {
        issues.push({ file: where, message: `Duplicate document id "${result.document.id}" (also in ${previous}); skipped.` });
        return;
      }
      seenIds.set(result.document.id, where);
      documents.push(result.document);
    });
  }

  return { documents, issues, filesRead: files.length };
}

async function listKnowledgeFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listKnowledgeFiles(full)));
    else if (/\.(json|md)$/i.test(entry.name) && !/^readme\.md$/i.test(entry.name)) files.push(full);
  }
  return files;
}

function parseJsonFile(raw: string): unknown[] {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON: ${(error as Error).message}`);
  }
  if (Array.isArray(json)) return json;
  if (json && typeof json === 'object' && Array.isArray((json as { documents?: unknown }).documents)) {
    return (json as { documents: unknown[] }).documents;
  }
  throw new Error('JSON must be { "documents": [ ... ] } or an array of documents.');
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { meta, body: raw.slice(match[0].length) };
}

const list = (value?: string) => (value ?? '').split('|').map((item) => item.trim()).filter(Boolean);

/** Converts a frontmatter Markdown file into a canonical (not yet validated) document. */
function parseMarkdownFile(raw: string, relative: string): Record<string, unknown> {
  const { meta, body } = parseFrontmatter(raw);
  const title = meta.title ?? '';
  const parts = body.split(/^##\s+/m);
  const sections: KnowledgeSection[] = [];

  const intro = parts[0].replace(/^#\s+.*$/m, '').trim();
  if (intro) sections.push({ heading: 'Overview', content: intro });
  for (const part of parts.slice(1)) {
    const [headingLine, ...rest] = part.split(/\r?\n/);
    const heading = headingLine.trim();
    const content = rest.join('\n').trim();
    if (!content) continue;
    sections.push({
      heading,
      content,
      subcategory: GUIDANCE_HEADINGS.test(heading) ? 'assistant_guidance' : /^summary$/i.test(heading) ? 'biography' : slugify(heading),
    });
  }
  // A Kannada summary in frontmatter becomes its own Kannada-language section.
  if (meta.summary_kn) {
    sections.push({ heading: 'ಸಾರಾಂಶ (Kannada summary)', content: meta.summary_kn, language: 'kn', subcategory: 'biography' });
  }

  const reserved = new Set([
    'id', 'title', 'category', 'subcategory', 'entity_type', 'entity_name', 'aliases', 'topics', 'language', 'event',
    'event_date', 'source', 'source_url', 'version', 'updated_by', 'updated_at', 'active', 'summary_kn',
  ]);
  const metadata: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (!reserved.has(key)) metadata[key] = value.includes('|') ? list(value) : value;
  }
  if (meta.topics) metadata.topics = list(meta.topics);

  return {
    id: meta.id || relative.replace(/\.md$/i, ''),
    title,
    category: meta.category,
    subcategory: meta.subcategory || undefined,
    entity_type: meta.entity_type || undefined,
    entity_name: meta.entity_name || undefined,
    // Topics (e.g. "ikkat", "mysoorina kathegalu") also point to the entity.
    aliases: [...list(meta.aliases), ...list(meta.topics)],
    language: meta.language || 'en',
    event: meta.event || undefined,
    event_date: meta.event_date || undefined,
    source: meta.source || `knowledge/${relative}`,
    source_url: meta.source_url || undefined,
    version: meta.version ? Number(meta.version) : 1,
    updated_by: meta.updated_by || undefined,
    updated_at: meta.updated_at || undefined,
    is_active: meta.active ? meta.active !== 'false' : true,
    metadata,
    sections,
  };
}
