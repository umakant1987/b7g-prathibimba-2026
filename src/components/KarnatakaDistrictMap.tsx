import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { districts, KARNATAKA_VIEWBOX, type District } from '../data/karnatakaDistricts';
import { districtsKn } from '../data/karnatakaDistrictsKn';
import { translations } from '../data/translations';

/**
 * Interactive district map (shapes and facts from public/Karnataka District Map.html),
 * restyled in the site's gold-on-red. Tap or hover a district — or pick one from the
 * dropdown — and its details appear below the map on desktop, or in a bottom sheet on
 * phones/tablets so they are always on screen. Loaded lazily (~145 KB of shape data).
 */
export default function KarnatakaDistrictMap() {
  const { t, language } = useLanguage();
  const m = translations.why.map;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const rootRef = useRef<HTMLDivElement>(null);

  const active = districts.find((d) => d.id === activeId) ?? null;
  const highlighted = districts.find((d) => d.id === (hoverId ?? activeId)) ?? null;
  // Draw the selected district last so its outline sits above its neighbours.
  const ordered = useMemo(
    () => (activeId ? [...districts.filter((d) => d.id !== activeId), districts.find((d) => d.id === activeId)!] : districts),
    [activeId],
  );
  const sortedForSelect = useMemo(
    () => [...districts].sort((a, b) => (language === 'kn' ? a.kn.localeCompare(b.kn, 'kn') : a.name.localeCompare(b.name))),
    [language],
  );

  // Phones/tablets: close the bottom sheet once the map scrolls out of view, so it never
  // lingers over other sections.
  useEffect(() => {
    if (isDesktop || !activeId || !rootRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setActiveId(null);
    });
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [isDesktop, activeId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setActiveId(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const label = (d: (typeof districts)[number]) => (language === 'kn' ? `${d.kn} · ${d.name}` : `${d.name} · ${d.kn}`);

  return (
    <div ref={rootRef} className="w-full">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <p className="text-sm font-semibold tracking-wider uppercase text-gold">{t(m.title)}</p>
        <p className="font-kannada text-sm text-cream/70 truncate min-h-[1.5em]" aria-live="polite">
          {highlighted ? label(highlighted) : ''}
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[400px]">
        <svg
          viewBox={KARNATAKA_VIEWBOX}
          role="img"
          aria-label={t(m.ariaLabel)}
          className="block w-full h-auto overflow-visible"
          onMouseLeave={() => setHoverId(null)}
        >
          <defs>
            <filter id="ka-map-glow" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="wide" />
              <feColorMatrix in="wide" type="matrix" values="0 0 0 0 0.91  0 0 0 0 0.72  0 0 0 0 0.29  0 0 0 0.9 0" result="halo" />
              <feMerge>
                <feMergeNode in="halo" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g filter="url(#ka-map-glow)">
            {ordered.map((d) => {
              const isActive = d.id === activeId;
              const isHover = d.id === hoverId;
              return (
                <path
                  key={d.id}
                  d={d.d}
                  onMouseEnter={() => setHoverId(d.id)}
                  onClick={() => setActiveId(isActive ? null : d.id)}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  className="cursor-pointer transition-[fill] duration-150"
                  fill={isActive ? 'rgba(232,184,75,0.55)' : isHover ? 'rgba(232,184,75,0.3)' : 'rgba(232,184,75,0.1)'}
                  stroke={isActive ? '#f6d784' : '#e8b84b'}
                  strokeWidth={isActive ? 2.4 : 1.1}
                >
                  <title>{language === 'kn' ? `${d.kn} (${d.name})` : `${d.name} (${d.kn})`}</title>
                </path>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Accessible, phone-friendly way to pick a district */}
      <label className="mt-5 block">
        <span className="sr-only">{t(m.choose)}</span>
        <select
          value={activeId ?? ''}
          onChange={(e) => setActiveId(e.target.value || null)}
          className="w-full glass rounded-full px-4 py-2.5 text-sm text-cream bg-transparent focus:outline-none focus:ring-2 focus:ring-gold"
        >
          <option value="" className="text-ink">
            {t(m.choose)}
          </option>
          {sortedForSelect.map((d) => (
            <option key={d.id} value={d.id} className="text-ink">
              {label(d)}
            </option>
          ))}
        </select>
      </label>

      {/* Details for the selected district: inline on desktop, where it's already in view;
          on phones/tablets a bottom sheet, because the map is taller than the screen and an
          inline card below it would land off-screen after tapping a northern district. */}
      <div className={isDesktop ? 'mt-4 min-h-38' : 'mt-4'}>
        <AnimatePresence mode="wait">
          {active && isDesktop ? (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="glass rounded-2xl p-5 text-left relative"
            >
              <DistrictDetails district={active} onClose={() => setActiveId(null)} />
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm text-cream/60 pt-2"
            >
              {t(m.hint)}
            </motion.p>
          )}
        </AnimatePresence>
        <p className="mt-3 text-center text-[11px] text-cream/45">{t(m.note)}</p>
      </div>

      <AnimatePresence>
        {active && !isDesktop && (
          <motion.div
            key="sheet"
            role="dialog"
            aria-label={label(active)}
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            exit={{ y: '110%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed inset-x-3 z-60 max-h-[45vh] overflow-y-auto rounded-2xl border border-gold/40 bg-ink-light/95 backdrop-blur-md p-5 pt-6 text-left shadow-[0_-12px_40px_rgba(0,0,0,0.45)]"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
          >
            <span aria-hidden className="absolute top-2 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-cream/30" />
            <AnimatePresence mode="wait">
              <motion.div key={active.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <DistrictDetails district={active} onClose={() => setActiveId(null)} />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DistrictDetails({ district, onClose }: { district: District; onClose: () => void }) {
  const { language } = useLanguage();
  const kn = language === 'kn' ? districtsKn[district.id] : undefined;
  const known = kn?.known ?? district.known;
  const facts = kn?.facts ?? district.facts;
  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label={language === 'kn' ? 'ಮುಚ್ಚಿ' : 'Close'}
        className="absolute top-3 right-3 p-1 text-cream/60 hover:text-cream"
      >
        <X size={20} />
      </button>
      {kn ? (
        <p className="flex flex-wrap items-center gap-x-2 font-bold text-cream text-lg pr-8">
          <MapPin size={18} className="text-gold shrink-0" />
          <span className="font-kannada">{district.kn}</span>
          <span className="font-medium text-cream/70 text-base">{district.name}</span>
        </p>
      ) : (
        <p className="flex flex-wrap items-center gap-x-2 font-bold text-cream text-lg pr-8">
          <MapPin size={18} className="text-gold shrink-0" />
          {district.name}
          <span className="font-kannada font-medium text-cream/70 text-base">{district.kn}</span>
        </p>
      )}
      <p className={`mt-1 text-xs font-semibold tracking-wider uppercase text-gold ${kn ? 'font-kannada text-sm normal-case tracking-normal' : ''}`}>{known}</p>
      <ul className={`mt-3 space-y-1.5 text-sm text-cream/85 leading-relaxed list-disc pl-5 marker:text-gold ${kn ? 'font-kannada' : ''}`}>
        {facts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>
    </>
  );
}

/** True when the viewport matches the query; updates on resize/rotation. */
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
