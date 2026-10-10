/**
 * Loads the markdown knowledge base under /knowledge at build time and splits
 * each file into one chunk per `##` section. This is the chunking stage of the
 * RAG pipeline — see docs/ARCHITECTURE.md. Add or edit .md files in /knowledge
 * and they are picked up automatically; no code changes needed.
 *
 * Files with `type: guest` frontmatter also become structured GuestProfiles,
 * which drive name-only searches and the "who are the guests?" cards.
 */
const rawFiles = import.meta.glob('/knowledge/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export interface KnowledgeChunk {
  id: string;
  /** Path under /knowledge, e.g. "chief-guests/prakash-belawadi.md". */
  file: string;
  /** Frontmatter `title` of the file. */
  title: string;
  /** Frontmatter `status` — "confirmed" or "provisional". */
  status: string;
  heading: string;
  /** Section body as light markdown (bullets as "• ", **bold**), one line per paragraph/item. */
  text: string;
}

export interface GuestProfile {
  /** File name without extension, e.g. "prakash-belawadi". */
  id: string;
  file: string;
  name: string;
  honorific: string;
  emoji: string;
  /** Path under /public, e.g. "/guests/prakash-belawadi.jpg". Empty shows an initials avatar. */
  photo: string;
  tagline: string;
  short: string;
  eventRole: string;
  eventRoleKn: string;
  eventDate: string;
  eventDateKn: string;
  order: number;
  /** Lowercase names people may type for this guest (including misspellings and Kannada). */
  aliases: string[];
  /** Things closely tied to the guest (e.g. "ikkat") — resolve to the guest but stay part of the question. */
  topics: string[];
  knownFor: string[];
  /** "You can ask me" follow-up questions. */
  ask: string[];
  summaryKn: string;
}

/**
 * Sections that are instructions for the assistant rather than answers for
 * visitors. They're covered by SYSTEM_PROMPT, so they're kept out of retrieval.
 */
const GUIDANCE_HEADINGS = /positioning rules|how to talk about it|welcome message|not yet in the knowledge base/i;

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

/** Frontmatter lists are written as `a | b | c`. */
function splitList(value: string | undefined): string[] {
  return (value ?? '').split('|').map((item) => item.trim()).filter(Boolean);
}

function toLightMarkdown(markdown: string): string {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^\|?\s*-{3,}/.test(line))
    .map((line) =>
      line
        .replace(/^>\s?/, '')
        .replace(/^[-*]\s+/, '• ')
        .replace(/^\|(.*)\|$/, (_, row: string) => row.split('|').map((c) => c.trim()).join(' — '))
        .replace(/`(.+?)`/g, '$1'),
    )
    .filter(Boolean)
    .join('\n');
}

function chunkFile(file: string, meta: Record<string, string>, body: string): KnowledgeChunk[] {
  const title = meta.title ?? file;
  const status = meta.status ?? 'confirmed';

  // Split on level-2 headings; whatever sits under the H1 becomes an intro chunk.
  const parts = body.split(/^##\s+/m);
  const chunks: KnowledgeChunk[] = [];

  parts.forEach((part, i) => {
    const [firstLine, ...rest] = part.split(/\r?\n/);
    const heading = i === 0 ? title : firstLine.trim();
    const content = i === 0 ? part.replace(/^#\s+.*$/m, '') : rest.join('\n');
    const text = toLightMarkdown(content);
    if (!text || GUIDANCE_HEADINGS.test(heading)) return;
    chunks.push({ id: `${file}#${i}`, file, title, status, heading, text });
  });

  return chunks;
}

function toGuest(file: string, meta: Record<string, string>): GuestProfile {
  const lower = (items: string[]) => items.map((item) => item.toLowerCase());
  return {
    id: file.replace(/^.*\//, '').replace(/\.md$/, ''),
    file,
    name: meta.name ?? meta.title ?? file,
    honorific: meta.honorific ?? '',
    emoji: meta.emoji ?? '⭐',
    photo: meta.photo ?? '',
    tagline: meta.tagline ?? '',
    short: meta.short ?? '',
    eventRole: meta.event_role ?? 'Guest',
    eventRoleKn: meta.event_role_kn || meta.event_role || 'ಅತಿಥಿ',
    // event_date is ISO (YYYY-MM-DD) for the backend RAG; event_date_label is the display form.
    eventDate: meta.event_date_label || meta.event_date || '',
    eventDateKn: meta.event_date_kn || meta.event_date_label || meta.event_date || '',
    order: Number(meta.order ?? 99),
    aliases: lower(splitList(meta.aliases)),
    topics: lower(splitList(meta.topics)),
    knownFor: splitList(meta.known_for),
    ask: splitList(meta.ask),
    summaryKn: meta.summary_kn ?? '',
  };
}

const parsedFiles = Object.entries(rawFiles)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, raw]) => ({ file: path.replace(/^\/knowledge\//, ''), ...parseFrontmatter(raw) }));

export const knowledgeChunks: KnowledgeChunk[] = parsedFiles.flatMap(({ file, meta, body }) =>
  chunkFile(file, meta, body),
);

export const guestProfiles: GuestProfile[] = parsedFiles
  .filter(({ meta }) => meta.type === 'guest')
  .map(({ file, meta }) => toGuest(file, meta))
  .sort((a, b) => a.order - b.order);
