import type { RetrievedChunk } from '../types.ts';

/**
 * Formats retrieved chunks as labelled sources so the model sees where each
 * fact comes from, which entity and date it belongs to, and whether it's
 * provisional — rather than one undifferentiated block of text.
 */
export function buildContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((chunk, i) => {
      const lines = [`[Source ${i + 1}]`, `Title: ${chunk.section ? `${chunk.title} — ${chunk.section}` : chunk.title}`];
      if (chunk.category) lines.push(`Category: ${chunk.category}`);
      if (chunk.entity_name) lines.push(`Entity: ${chunk.entity_name}`);
      if (typeof chunk.metadata?.event_role === 'string') lines.push(`Event role: ${chunk.metadata.event_role}`);
      if (chunk.event_date) lines.push(`Event date: ${chunk.event_date}`);
      const meta = chunk.metadata ?? {};
      if (typeof meta.session === 'string') lines.push(`Session: ${meta.session}`);
      if (typeof meta.sequence === 'number') lines.push(`Running order: item ${meta.sequence} of its session`);
      if (typeof meta.performer === 'string') lines.push(`Performer: ${meta.performer}`);
      if (typeof meta.performance_type === 'string') lines.push(`Performance type: ${meta.performance_type}`);
      if (chunk.metadata?.status === 'provisional') lines.push('Status: provisional — not yet confirmed by the organisers');
      if (chunk.subcategory === 'assistant_guidance') lines.push('Type: assistant guidance');
      lines.push('Content:', chunk.content);
      return lines.join('\n');
    })
    .join('\n\n');
}

/** Source list for the API response: titles and scores only — never content or vectors. */
export function toPublicSources(chunks: RetrievedChunk[]) {
  return chunks
    .filter((chunk) => chunk.subcategory !== 'assistant_guidance')
    .map((chunk) => ({
      id: chunk.id,
      title: chunk.section && chunk.section !== 'Overview' ? `${chunk.title} – ${chunk.section}` : chunk.title,
      category: chunk.category,
      similarity: Math.round(chunk.similarity * 100) / 100,
    }));
}
