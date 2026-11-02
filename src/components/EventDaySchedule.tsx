import { motion } from 'framer-motion';
import { Drama, Guitar, Hourglass, Mic, Moon, Store, Sun, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { daySchedule, EVENT_DAY, type ScheduleIcon, type ScheduleSession } from '../data/eventSchedule';
import { translations } from '../data/translations';

const ITEM_ICONS: Record<ScheduleIcon, LucideIcon> = {
  talk: Mic,
  santhe: Store,
  culture: Drama,
  'sand-art': Hourglass,
  jamming: Guitar,
};

/**
 * The one-day schedule (Sunday 15 November): a date badge, then Morning and Evening cards.
 * Shown until the detailed running order is released (VITE_SHOW_PROGRAMME_DETAILS).
 */
export function EventDaySchedule() {
  const { t, language } = useLanguage();
  const s = translations.schedule;

  return (
    <div className="mt-12">
      {/* Date badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex w-fit items-center gap-4 rounded-3xl border border-gold/50 bg-maroon/50 px-6 py-4 shadow-[0_0_40px_rgba(232,184,75,0.18)]"
      >
        <span className="font-display text-5xl sm:text-6xl font-bold leading-none text-gradient-gold">{EVENT_DAY.dayOfMonth}</span>
        <span className="text-left">
          <span className={`block text-lg sm:text-xl font-bold text-cream ${language === 'kn' ? 'font-kannada' : ''}`}>{t(s.eventMonth)}</span>
          <span className={`block text-sm sm:text-base font-semibold text-gold ${language === 'kn' ? 'font-kannada' : ''}`}>{t(s.eventDay)}</span>
        </span>
      </motion.div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {daySchedule.map((session, index) => (
          <SessionCard key={session.id} session={session} index={index} />
        ))}
      </div>
    </div>
  );
}

function SessionCard({ session, index }: { session: ScheduleSession; index: number }) {
  const { t, language } = useLanguage();
  const kn = language === 'kn' ? 'font-kannada' : '';
  const morning = session.id === 'morning';
  const SessionIcon = morning ? Sun : Moon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: index * 0.12 }}
      className={`relative overflow-hidden rounded-3xl border border-gold/35 p-6 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.3)] ${
        morning ? 'bg-gradient-to-br from-saffron/20 via-maroon/50 to-maroon/60' : 'bg-gradient-to-br from-maroon/80 via-ink/70 to-maroon/90'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${morning ? 'bg-gold text-ink' : 'bg-cream/10 text-gold-light'}`}>
          <SessionIcon size={24} />
        </span>
        <h3 className="font-kannada text-2xl sm:text-3xl font-bold text-gradient-gold">{t(session.title)}</h3>
      </div>

      <ul className="mt-6 space-y-4">
        {session.items.map((item) => {
          const Icon = ITEM_ICONS[item.icon];
          return (
            <li key={item.id} className="flex gap-4 rounded-2xl bg-ink/25 p-4">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <Icon size={20} />
              </span>
              <div>
                <p className="font-kannada text-lg font-bold text-cream leading-snug">{t(item.title)}</p>
                {item.time && <p className="text-sm font-semibold text-gold">{t(item.time)}</p>}
                <p className={`mt-1 text-sm text-cream/70 leading-relaxed ${kn}`}>{t(item.description)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
