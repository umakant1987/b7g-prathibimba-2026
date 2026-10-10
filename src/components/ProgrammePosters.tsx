import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../data/translations';
import type { Language } from '../types';

/** Programme posters (public/posters/*.webp, from the originals in public/*.jpg). */
const POSTERS: { date: string; file: Record<Language, string> }[] = [
  { date: '2026-10-31', file: { en: 'oct-31-english', kn: 'oct-31-kannada' } },
  { date: '2026-11-01', file: { en: 'nov-1-english', kn: 'nov-1-kannada' } },
];

/**
 * Shown in the Programmes section until the detailed programme is released
 * (SHOW_PROGRAMME_DETAILS). One poster per day in the visitor's language, with a
 * toggle for the other language and a full-screen view for reading.
 */
export function ProgrammePosters() {
  const { t, language } = useLanguage();
  const s = translations.schedule;
  // Posters follow the site language; a manual pick applies until the site language changes.
  const [choice, setChoice] = useState<{ lang: Language; siteLang: Language } | null>(null);
  const posterLang = choice && choice.siteLang === language ? choice.lang : language;
  const setPosterLang = (lang: Language) => setChoice({ lang, siteLang: language });
  const [open, setOpen] = useState<{ src: string; alt: string } | null>(null);

  return (
    <div className="mt-10">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
        <span className="text-cream/70">{t(s.posterLanguage)}</span>
        <div role="radiogroup" aria-label={t(s.posterLanguage)} className="glass rounded-full p-1 flex">
          {(['en', 'kn'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              role="radio"
              aria-checked={posterLang === lang}
              onClick={() => setPosterLang(lang)}
              className={`px-4 py-1.5 rounded-full font-semibold transition-colors ${
                posterLang === lang ? 'bg-gold text-ink' : 'text-cream/80 hover:text-cream'
              }`}
            >
              {lang === 'en' ? 'English' : 'ಕನ್ನಡ'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 max-w-4xl mx-auto">
        {POSTERS.map((poster) => {
          const name = poster.file[posterLang];
          const label = t(s.posterDays[poster.date]);
          return (
            <motion.figure
              key={poster.date}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <figcaption className="mb-3 font-kannada text-lg sm:text-xl font-bold text-gold">{label}</figcaption>
              <button
                type="button"
                onClick={() => setOpen({ src: `/posters/${name}-1024.webp`, alt: label })}
                className="group relative block w-full max-w-sm md:max-w-none mx-auto rounded-2xl overflow-hidden border border-gold/30 shadow-[0_12px_40px_rgba(0,0,0,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                aria-label={`${label} — ${t(s.tapToEnlarge)}`}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={name}
                    src={`/posters/${name}-600.webp`}
                    srcSet={`/posters/${name}-600.webp 600w, /posters/${name}-1024.webp 1024w`}
                    sizes="(min-width: 768px) 420px, 92vw"
                    alt={label}
                    width={1024}
                    height={1536}
                    loading="lazy"
                    decoding="async"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="block w-full aspect-[2/3] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </AnimatePresence>
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1.5 text-xs font-semibold text-cream">
                  <Maximize2 size={13} />
                  {t(s.viewFull)}
                </span>
              </button>
            </motion.figure>
          );
        })}
      </div>

      {/* B7G Santhe flyer (bilingual, so no language toggle) */}
      <motion.figure
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mt-12 text-center"
      >
        <figcaption className="mb-3 font-kannada text-lg sm:text-xl font-bold text-gold">{t(s.santhePoster)}</figcaption>
        <button
          type="button"
          onClick={() => setOpen({ src: '/posters/b7g-santhe-853.webp', alt: t(s.santhePoster) })}
          className="group relative block w-full max-w-sm mx-auto rounded-2xl overflow-hidden border border-gold/30 shadow-[0_12px_40px_rgba(0,0,0,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          aria-label={`${t(s.santhePoster)} — ${t(s.tapToEnlarge)}`}
        >
          <img
            src="/posters/b7g-santhe-600.webp"
            srcSet="/posters/b7g-santhe-600.webp 600w, /posters/b7g-santhe-853.webp 853w"
            sizes="(min-width: 640px) 384px, 92vw"
            alt={t(s.santhePoster)}
            width={853}
            height={1280}
            loading="lazy"
            decoding="async"
            className="block w-full aspect-[2/3] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1.5 text-xs font-semibold text-cream">
            <Maximize2 size={13} />
            {t(s.viewFull)}
          </span>
        </button>
      </motion.figure>

      <AnimatePresence>{open && <PosterViewer src={open.src} alt={open.alt} onClose={() => setOpen(null)} />}</AnimatePresence>
    </div>
  );
}

/** Full-screen poster view sized to fit the whole poster on any screen. */
function PosterViewer({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-70 bg-maroon/95 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
    >
      <motion.img
        src={src}
        alt={alt}
        initial={{ scale: 0.96 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[calc(100svh-2rem)] max-w-full w-auto h-auto rounded-xl shadow-2xl object-contain"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 glass rounded-full p-2.5 text-cream hover:bg-cream/10"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        <X size={22} />
      </button>
    </motion.div>
  );
}
