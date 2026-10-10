import { Search } from 'lucide-react';
import { SHOW_PROGRAMME_DETAILS } from '../config/env';
import { programDates, sessionNames, sessionOrder } from '../data/programs';
import { translations } from '../data/translations';
import { useLanguage } from '../context/LanguageContext';
import { useSchedule } from '../hooks/useSchedule';
import { hasTimings } from '../services/schedule';
import type { ProgramCategory } from '../types';
import { ProgramCard } from './ProgramCard';
import { ProgrammePosters } from './ProgrammePosters';
import { SectionHeader } from './SectionHeader';

const CATEGORIES: (ProgramCategory | 'all')[] = ['all', 'ceremony', 'music', 'dance', 'drama', 'kids', 'talks', 'more'];

/**
 * Programmes section. Until the detailed programme is released (VITE_SHOW_PROGRAMME_DETAILS),
 * it shows the programme posters; the detailed view below is kept intact for release.
 */
export function ProgramSchedule() {
  return SHOW_PROGRAMME_DETAILS ? <DetailedProgramme /> : <PosterProgramme />;
}

function PosterProgramme() {
  const { t } = useLanguage();
  const s = translations.schedule;
  return (
    <section id="schedule" className="relative py-24 sm:py-32 px-5 sm:px-8 bg-ink-light mandala-bg mandala-alt">
      <div className="max-w-5xl mx-auto">
        <SectionHeader title={s.title} subtitle={s.postersSubtitle} eyebrow={t(s.eyebrow)} />
        <ProgrammePosters />
      </div>
    </section>
  );
}

function DetailedProgramme() {
  const {
    programs,
    loading,
    error,
    filteredPrograms,
    day,
    setDay,
    category,
    setCategory,
    query,
    setQuery,
    currentProgram,
    nextProgram,
  } = useSchedule();
  const { t } = useLanguage();
  const s = translations.schedule;

  const sessions = sessionOrder
    .map((session) => ({ session, items: filteredPrograms.filter((p) => p.session === session) }))
    .filter((group) => group.items.length > 0);

  return (
    <section id="schedule" className="relative py-24 sm:py-32 px-5 sm:px-8 bg-ink-light mandala-bg mandala-alt">
      <div className="max-w-5xl mx-auto">
        <SectionHeader title={s.title} subtitle={s.subtitle} eyebrow={t(s.eyebrow)} />

        {/* Day switcher */}
        <div role="tablist" aria-label="Programme day" className="mt-10 flex justify-center gap-3">
          {programDates.map((date) => {
            const count = programs.filter((p) => p.date === date).length;
            return (
              <button
                key={date}
                type="button"
                role="tab"
                aria-selected={day === date}
                onClick={() => setDay(date)}
                className={`rounded-2xl px-5 py-3 text-left transition-colors ${
                  day === date ? 'bg-gold text-ink' : 'glass text-cream/80 hover:text-cream'
                }`}
              >
                <span className="block font-kannada text-lg font-bold leading-tight">{t(s.days[date] ?? { en: date, kn: date })}</span>
                <span className={`block text-xs ${day === date ? 'text-ink/70' : 'text-cream/50'}`}>
                  {count} {t(s.items)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(s.searchPlaceholder)}
              aria-label={t(s.searchPlaceholder)}
              className="w-full glass rounded-full py-2.5 pl-11 pr-4 text-sm text-cream placeholder:text-cream/40 focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`whitespace-nowrap text-sm font-medium px-4 py-2 rounded-full transition-colors ${
                  category === cat ? 'bg-gold text-ink' : 'glass text-cream/70 hover:text-cream'
                }`}
              >
                {cat === 'all' ? t(s.allCategories) : t(s.categories[cat])}
              </button>
            ))}
          </div>
        </div>

        {!loading && !error && !hasTimings(programs) && (
          <p className="mt-6 text-center text-xs text-cream/50">⏱ {t(s.timingsTba)}</p>
        )}

        {error && <p className="mt-10 text-center text-cream/60">{error}</p>}

        {loading && !error && (
          <div className="mt-10 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl h-20 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !error && sessions.length === 0 && <p className="mt-10 text-center text-cream/60">{t(s.noResults)}</p>}

        {!loading &&
          !error &&
          sessions.map(({ session, items }) => (
            <div key={session} className="mt-10">
              <h3 className="flex items-baseline gap-3 mb-4">
                <span className="font-kannada text-xl sm:text-2xl font-bold text-gold">{t(s.sessions[session])}</span>
                {sessionNames[`${day}|${session}`] && (
                  <span className="text-sm text-cream/50">{sessionNames[`${day}|${session}`]}</span>
                )}
              </h3>
              <ol className="grid sm:grid-cols-2 gap-3">
                {items.map((program) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    isLive={currentProgram?.id === program.id}
                    isUpNext={nextProgram?.id === program.id}
                  />
                ))}
              </ol>
            </div>
          ))}
      </div>
    </section>
  );
}
