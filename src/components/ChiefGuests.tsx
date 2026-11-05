import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../data/translations';
import { guestProfiles, type GuestProfile } from '../services/ai/knowledgeLoader';
import { RichText } from './ChatMessageContent';
import { SectionHeader } from './SectionHeader';

/** Chief Guests come from knowledge/chief-guests (event_role: Chief Guest), photos from their `photo` field. */
const chiefGuests = guestProfiles.filter((g) => /chief/i.test(g.eventRole));

/** Chief Guests with photos; tapping one opens a short bio. Shown before the programme. */
export function ChiefGuests() {
  const s = translations.guests;
  const { t } = useLanguage();
  const [open, setOpen] = useState<GuestProfile | null>(null);
  if (chiefGuests.length === 0) return null;

  return (
    <section id="guests" className="relative scroll-mt-20 py-24 sm:py-32 px-5 sm:px-8 bg-ink mandala-bg">
      <div className="max-w-5xl mx-auto">
        <SectionHeader title={s.title} subtitle={s.subtitle} eyebrow={t(s.eyebrow)} />
        <div className="mt-14 flex flex-wrap justify-center gap-8 sm:gap-10">
          {chiefGuests.map((guest, index) => (
            <GuestCard key={guest.id} guest={guest} index={index} onOpen={() => setOpen(guest)} />
          ))}
        </div>
      </div>
      {/* Portal: the pop-up must sit above the fixed header, outside this section's stacking context */}
      {createPortal(
        <AnimatePresence>{open && <GuestBio guest={open} onClose={() => setOpen(null)} />}</AnimatePresence>,
        document.body,
      )}
    </section>
  );
}

function GuestCard({ guest, index, onOpen }: { guest: GuestProfile; index: number; onOpen: () => void }) {
  const { t, language } = useLanguage();
  const s = translations.guests;
  const kn = language === 'kn';
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: index * 0.12 }}
      className="group w-full max-w-xs rounded-3xl border border-gold/35 bg-maroon/40 p-6 text-center shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-colors hover:border-gold/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      aria-label={`${kn ? guest.nameKn : guest.name} — ${t(s.viewBio)}`}
    >
      <span className="relative mx-auto block h-44 w-44 sm:h-48 sm:w-48">
        <span aria-hidden="true" className="absolute -inset-2 rounded-full bg-gold/25 blur-xl transition-opacity group-hover:opacity-100 opacity-60" />
        <Portrait guest={guest} className="relative h-full w-full border-4 border-gold shadow-[0_0_0_6px_rgba(232,184,75,0.15)] transition-transform duration-500 group-hover:scale-[1.03]" />
      </span>
      <p className={`mt-5 text-xl font-bold text-cream leading-snug ${kn ? 'font-kannada' : 'font-display'}`}>
        {kn ? guest.nameKn : `${guest.honorific ? `${guest.honorific} ` : ''}${guest.name}`}
      </p>
      <p className={`mt-1 text-sm text-cream/70 ${kn ? 'font-kannada' : ''}`}>{kn ? guest.taglineKn : guest.tagline}</p>
      <span className="mt-3 inline-block rounded-full bg-gradient-to-r from-gold to-saffron px-3.5 py-1 font-kannada text-sm font-bold text-ink">
        {kn ? `${guest.eventRoleKn} · ${guest.eventDateKn}` : `${guest.eventRole} · ${guest.eventDate}`}
      </span>
      <span className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-gold group-hover:text-gold-light">
        <Sparkles size={13} />
        {t(s.viewBio)}
      </span>
    </motion.button>
  );
}

function Portrait({ guest, className }: { guest: GuestProfile; className: string }) {
  return guest.photo ? (
    <img src={guest.photo} alt={guest.name} loading="lazy" className={`${className} rounded-full object-cover object-top`} />
  ) : (
    <span className={`${className} flex items-center justify-center rounded-full bg-maroon text-5xl`}>{guest.emoji}</span>
  );
}

/** Short bio pop-up: photo, role, the Summary section (English) or summary_kn (Kannada), and known-for highlights. */
function GuestBio({ guest, onClose }: { guest: GuestProfile; onClose: () => void }) {
  const { t, language } = useLanguage();
  const s = translations.guests;
  const kn = language === 'kn';
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={kn ? guest.nameKn : guest.name}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-70 flex items-center justify-center bg-maroon/90 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 30, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 30, scale: 0.96 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[88svh] w-full max-w-lg overflow-y-auto rounded-3xl border border-gold/40 bg-ink-light p-6 sm:p-8 text-left shadow-2xl"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t(s.close)}
          className="absolute top-3 right-3 rounded-full p-2 text-cream/70 hover:bg-cream/10 hover:text-cream"
        >
          <X size={22} />
        </button>
        <div className="flex flex-col items-center text-center">
          <Portrait guest={guest} className="h-32 w-32 border-4 border-gold shadow-[0_0_30px_rgba(246,215,132,0.35)]" />
          <h3 className={`mt-4 text-2xl font-bold text-gradient-gold ${kn ? 'font-kannada' : 'font-display'}`}>
            {kn ? guest.nameKn : `${guest.honorific ? `${guest.honorific} ` : ''}${guest.name}`}
          </h3>
          <p className={`mt-1 text-sm text-cream/70 ${kn ? 'font-kannada' : ''}`}>{kn ? guest.taglineKn : guest.tagline}</p>
          <span className="mt-3 inline-block rounded-full bg-gradient-to-r from-gold to-saffron px-3.5 py-1 font-kannada text-sm font-bold text-ink">
            {kn ? `${guest.eventRoleKn} · ${guest.eventDateKn}` : `${guest.eventRole} · ${guest.eventDate}`}
          </span>
        </div>
        <div className={`mt-6 text-cream/90 leading-relaxed ${kn ? 'font-kannada' : ''}`}>
          {kn && guest.summaryKn ? <p>{guest.summaryKn}</p> : <RichText text={guest.summary || guest.short} />}
        </div>
        {!kn && guest.knownFor.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-gold">{t(s.knownFor)}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-cream/80 marker:text-gold">
              {guest.knownFor.slice(0, 4).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
