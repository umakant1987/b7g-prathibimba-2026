import { slugify } from '../text.ts';
import type { KnowledgeDocument, KnowledgeSection } from '../types.ts';

export type ValidationResult = { ok: true; document: KnowledgeDocument } | { ok: false; errors: string[] };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Top-level fields with a column of their own; anything else (session, sequence, performer, …) goes into metadata. */
const KNOWN_FIELDS = new Set([
  'id', 'title', 'category', 'subcategory', 'entity_type', 'entity_name', 'aliases', 'language', 'event', 'event_date',
  'source', 'source_url', 'version', 'updated_by', 'updated_at', 'is_active', 'metadata', 'content', 'sections',
]);

/**
 * Validates one canonical knowledge document (see knowledge/_schema) and fills
 * defaults. Categories are free-form so new kinds of knowledge need no code
 * change; known ones are listed in docs/RAG.md.
 */
export function validateDocument(input: unknown, file: string): ValidationResult {
  const errors: string[] = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: ['Document must be an object.'] };
  }
  const doc = input as Record<string, unknown>;

  const str = (key: string, required = false): string | undefined => {
    const value = doc[key];
    if (value === undefined || value === null || value === '') {
      if (required) errors.push(`"${key}" is required.`);
      return undefined;
    }
    if (typeof value !== 'string') {
      errors.push(`"${key}" must be a string.`);
      return undefined;
    }
    return value.trim();
  };

  const title = str('title', true);
  const category = str('category', true);
  const eventDate = str('event_date');
  if (eventDate && !DATE.test(eventDate)) errors.push(`"event_date" must be YYYY-MM-DD, got "${eventDate}".`);

  const aliases = doc.aliases ?? [];
  if (!Array.isArray(aliases) || aliases.some((alias) => typeof alias !== 'string')) {
    errors.push('"aliases" must be an array of strings.');
  }

  const version = doc.version ?? 1;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    errors.push('"version" must be a positive whole number.');
  }

  const metadata = doc.metadata ?? {};
  if (typeof metadata !== 'object' || Array.isArray(metadata)) errors.push('"metadata" must be an object.');

  const sections = toSections(doc, errors);

  if (errors.length > 0) return { ok: false, errors };

  const fileId = file.replace(/\.(json|md)$/i, '');
  return {
    ok: true,
    document: {
      id: str('id') ?? `${fileId}/${slugify(title!)}`,
      title: title!,
      category: category!.toLowerCase(),
      subcategory: str('subcategory'),
      entity_type: str('entity_type'),
      entity_name: str('entity_name'),
      aliases: [...new Set((aliases as string[]).map((alias) => alias.trim()).filter(Boolean))],
      language: str('language') ?? 'en',
      event: str('event'),
      event_date: eventDate,
      source: str('source') ?? `knowledge/${file}`,
      source_url: str('source_url'),
      version: version as number,
      updated_by: str('updated_by'),
      updated_at: str('updated_at'),
      is_active: doc.is_active === undefined ? true : doc.is_active !== false,
      metadata: {
        ...Object.fromEntries(Object.entries(doc).filter(([key, value]) => !KNOWN_FIELDS.has(key) && value !== null && value !== undefined)),
        ...(metadata as Record<string, unknown>),
      },
      sections,
      file,
    },
  };
}

/** Accepts either `sections: [{heading, content}]` or a single `content` string (split on "## " headings). */
function toSections(doc: Record<string, unknown>, errors: string[]): KnowledgeSection[] {
  if (Array.isArray(doc.sections)) {
    const sections: KnowledgeSection[] = [];
    doc.sections.forEach((section, i) => {
      const s = section as Record<string, unknown>;
      if (!s || typeof s.content !== 'string' || !s.content.trim()) {
        errors.push(`sections[${i}].content is required.`);
        return;
      }
      if (s.event_date !== undefined && (typeof s.event_date !== 'string' || !DATE.test(s.event_date))) {
        errors.push(`sections[${i}].event_date must be YYYY-MM-DD.`);
      }
      sections.push({
        heading: typeof s.heading === 'string' && s.heading.trim() ? s.heading.trim() : 'Overview',
        content: s.content.trim(),
        subcategory: typeof s.subcategory === 'string' ? s.subcategory : undefined,
        language: typeof s.language === 'string' ? s.language : undefined,
        event_date: typeof s.event_date === 'string' ? s.event_date : undefined,
      });
    });
    if (sections.length === 0 && errors.length === 0) errors.push('"sections" must contain at least one section.');
    return sections;
  }

  if (typeof doc.content === 'string' && doc.content.trim()) {
    const parts = doc.content.split(/^##\s+/m);
    const sections: KnowledgeSection[] = [];
    if (parts[0].trim()) sections.push({ heading: 'Overview', content: parts[0].trim() });
    for (const part of parts.slice(1)) {
      const [heading, ...rest] = part.split(/\r?\n/);
      if (rest.join('\n').trim()) sections.push({ heading: heading.trim(), content: rest.join('\n').trim() });
    }
    return sections;
  }

  errors.push('Either "content" or "sections" is required.');
  return [];
}
