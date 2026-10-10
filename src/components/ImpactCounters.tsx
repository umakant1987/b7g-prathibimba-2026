import { motion } from 'framer-motion';
import { Heart, Theater, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLiveCounters } from '../hooks/useLiveCounters';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../data/translations';
import { AnimatedCounter } from './AnimatedCounter';

export function ImpactCounters() {
  const { stats, loading, error } = useLiveCounters();
  const { t } = useLanguage();

  return (
    <section className="relative py-20 sm:py-28 px-5 sm:px-8 bg-ink mandala-bg">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-10">
          <h2 className="font-kannada text-2xl sm:text-3xl font-bold text-gradient-gold">
            {t(translations.impact.title)}
          </h2>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-crimson-light">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson-light opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-crimson-light" />
            </span>
            {t(translations.impact.live)}
          </span>
        </div>

        {error && <p className="text-center text-cream/60">{error}</p>}

        {loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-6 h-32 animate-pulse" />
            ))}
          </div>
        )}

        {stats && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              icon={<Heart className="text-crimson-light" size={26} />}
              label={t(translations.impact.contributors)}
              value={<AnimatedCounter value={stats.contributors} format={(v) => `${v.toLocaleString('en-IN')}+`} />}
            />
            <StatCard
              icon={<Users className="text-saffron" size={26} />}
              label={t(translations.impact.families)}
              value={
                <AnimatedCounter
                  value={stats.familiesParticipating}
                  format={(v) => `${v.toLocaleString('en-IN')}+`}
                />
              }
            />
            <StatCard
              icon={<Theater className="text-gold-light" size={26} />}
              label={t(translations.impact.programs)}
              value={<AnimatedCounter value={stats.programsCount} />}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl p-5 sm:p-6 text-center"
    >
      <div className="flex justify-center mb-3">{icon}</div>
      <div className="font-kannada text-2xl sm:text-3xl font-bold text-cream">{value}</div>
      <div className="text-xs sm:text-sm text-cream/60 mt-1">{label}</div>
    </motion.div>
  );
}
