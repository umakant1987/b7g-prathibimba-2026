import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../data/translations';
import type { Program } from '../types';

interface ProgramCardProps {
  program: Program;
  isLive: boolean;
  isUpNext: boolean;
}

const CATEGORY_COLORS: Record<Program['category'], string> = {
  ceremony: 'bg-gold/20 text-gold',
  music: 'bg-saffron/20 text-saffron',
  dance: 'bg-crimson/20 text-crimson-light',
  drama: 'bg-maroon/30 text-crimson-light',
  kids: 'bg-gold-light/20 text-gold-light',
  talks: 'bg-cream/15 text-cream',
  more: 'bg-gradient-to-r from-gold/30 to-crimson/30 text-gold-light',
};

export function ProgramCard({ program, isLive, isUpNext }: ProgramCardProps) {
  const { t } = useLanguage();

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.3 }}
      className={`glass rounded-2xl p-4 sm:p-5 relative flex gap-4 items-start ${isLive ? 'ring-2 ring-crimson-light' : ''}`}
    >
      {(isLive || isUpNext) && (
        <span
          className={`absolute -top-3 right-5 text-xs font-bold px-3 py-1 rounded-full ${
            isLive ? 'bg-crimson-light text-ink' : 'bg-gold text-ink'
          }`}
        >
          {isLive ? t(translations.schedule.liveNow) : t(translations.schedule.upNext)}
        </span>
      )}

      <span
        aria-label={`Item ${program.sequence}`}
        className="shrink-0 w-9 h-9 rounded-full bg-gold/15 text-gold font-bold flex items-center justify-center"
      >
        {program.sequence}
      </span>

      <div className="min-w-0 flex-1">
        <h4 className="font-kannada text-base sm:text-lg font-bold text-cream leading-snug">{t(program.title)}</h4>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[program.category]}`}>
            {t(translations.schedule.categories[program.category])}
          </span>
          {program.startTime && program.endTime && (
            <span className="inline-flex items-center gap-1.5 text-xs text-cream/60">
              <Clock size={13} />
              {program.startTime} – {program.endTime}
            </span>
          )}
        </div>
      </div>
    </motion.li>
  );
}
