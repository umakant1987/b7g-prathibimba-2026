import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../data/translations';
import { SectionHeader } from './SectionHeader';

// The district map carries ~145 KB of shape data, so it loads separately from the first screen.
const KarnatakaDistrictMap = lazy(() => import('./KarnatakaDistrictMap'));

export function WhyKannada() {
  const { t } = useLanguage();

  return (
    <section id="why" className="relative py-24 sm:py-32 px-5 sm:px-8 bg-ink-light overflow-hidden mandala-bg mandala-alt">
      <div className="relative z-10 max-w-6xl mx-auto">
        <SectionHeader title={translations.why.title} subtitle={translations.why.subtitle} eyebrow="Our Story" />

        {/* Desktop: cards left, map right. Phones/tablets: cards, then the map below. */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-10 lg:gap-12 items-start">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {translations.why.cards.map((card, index) => (
              <motion.div
                key={card.title.kn}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass rounded-2xl p-6 sm:p-7 hover:bg-cream/10 transition-colors"
              >
                <h3 className="font-kannada text-2xl font-bold text-gold mb-3">{card.title.kn}</h3>
                <p className="text-cream/75 text-sm sm:text-base leading-relaxed">{t(card.body)}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-28"
          >
            <Suspense fallback={<div className="mx-auto w-full max-w-[340px] aspect-[1120/1720] glass rounded-2xl animate-pulse" />}>
              <KarnatakaDistrictMap />
            </Suspense>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
