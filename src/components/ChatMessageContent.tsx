import type { ReactNode } from 'react';
import type { GuestCard } from '../types';

/**
 * Renders the assistant's light markdown: line breaks, "• " / "- " bullets,
 * "### " headings, **bold**, *italic* and bare links. Builds React elements
 * directly (no innerHTML), so answer text can never inject markup.
 */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|https?:\/\/[^\s)]+)/g;
  return text.split(pattern).filter(Boolean).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={key}>{part.slice(1, -1)}</em>;
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={key} href={part} target="_blank" rel="noreferrer" className="underline text-gold break-all">
          {part}
        </a>
      );
    }
    return part;
  });
}

export function RichText({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    const key = `ul-${blocks.length}`;
    blocks.push(
      <ul key={key} className="list-disc pl-5 space-y-0.5">
        {bullets.map((item, i) => (
          <li key={`${key}-${i}`}>{renderInline(item, `${key}-${i}`)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  text.split('\n').forEach((rawLine, i) => {
    const line = rawLine.trim();
    const bullet = line.match(/^(?:•|-)\s+(.*)$/);
    if (bullet) {
      bullets.push(bullet[1]);
      return;
    }
    flushBullets();
    if (!line) return;
    const heading = line.match(/^#{1,3}\s+(.*)$/);
    blocks.push(
      heading ? (
        <p key={`h-${i}`} className="font-semibold text-gold">
          {renderInline(heading[1], `h-${i}`)}
        </p>
      ) : (
        <p key={`p-${i}`}>{renderInline(line, `p-${i}`)}</p>
      ),
    );
  });
  flushBullets();

  return <div className="space-y-2">{blocks}</div>;
}

export function GuestCardView({ card }: { card: GuestCard }) {
  return (
    <div className="flex gap-3 rounded-xl border border-cream/15 bg-cream/5 p-3">
      {card.photo ? (
        <img src={card.photo} alt={card.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
      ) : (
        <span
          aria-hidden="true"
          className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-2xl bg-gradient-to-br from-gold/30 to-saffron/20"
        >
          {card.emoji}
        </span>
      )}
      <div className="min-w-0">
        <p className="font-semibold text-cream leading-snug">{card.name}</p>
        <p className="text-[11px] text-cream/60 leading-snug">{card.tagline}</p>
        <p className="mt-1 text-xs text-cream/80 leading-snug">{card.short}</p>
        <span className="mt-1.5 inline-block text-[11px] font-semibold text-ink bg-gold rounded-full px-2 py-0.5">
          {card.role} · {card.date}
        </span>
      </div>
    </div>
  );
}
