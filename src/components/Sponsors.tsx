import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { sponsors, sponsorCategoryOrder } from '../data/sponsors';
import { translations } from '../data/translations';
import { useLanguage } from '../context/LanguageContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { SectionHeader } from './SectionHeader';
import { SponsorLogo } from './SponsorLogo';

export function Sponsors() {
  const s = translations.sponsors;
  const announced = sponsors.length > 0;

  return (
    <section id="sponsors" className="relative py-24 sm:py-32 px-5 sm:px-8 bg-ink-light mandala-bg mandala-alt">
      <div className="max-w-5xl mx-auto">
        {announced ? (
          <>
            <SectionHeader title={s.title} subtitle={s.subtitle} eyebrow="Thank You" />
            <div className="mt-14 space-y-10">
              {sponsorCategoryOrder.map((category) => {
                const items = sponsors.filter((sp) => sp.category === category);
                if (items.length === 0) return null;
                return (
                  <div key={category}>
                    <h3 className="text-center text-sm font-semibold tracking-wider uppercase text-cream/50 mb-5">
                      {category}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {items.map((sponsor, index) => (
                        <SponsorLogo key={sponsor.id} sponsor={sponsor} index={index} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <SponsorsComingSoon />
        )}
      </div>
    </section>
  );
}

/** Until sponsors are confirmed: veiled tier cards waiting to be unveiled, plus a partner invitation. */
function SponsorsComingSoon() {
  const { t, language } = useLanguage();
  const reducedMotion = useReducedMotion();
  const s = translations.sponsors;

  return (
    <>
      <SectionHeader title={s.soonTitle} subtitle={s.soonSubtitle} eyebrow={t(s.soonEyebrow)} />

      <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        {s.tiers.map((tier, index) => (
          <motion.div
            key={tier.en}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative overflow-hidden rounded-2xl border border-gold/35 bg-maroon/40 px-4 py-7 sm:py-9 text-center"
          >
            {/* Light sweeping across the veil */}
            {!reducedMotion && (
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-gold/20 to-transparent skew-x-[-20deg]"
                animate={{ x: ['0%', '400%'] }}
                transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.6, delay: index * 0.45, ease: 'easeInOut' }}
              />
            )}
            <motion.div
              aria-hidden="true"
              className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-dashed border-gold/60 font-kannada text-2xl sm:text-3xl font-bold text-gold"
              animate={reducedMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
            >
              <motion.span
                animate={reducedMotion ? undefined : { rotate: -360 }}
                transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
              >
                ?
              </motion.span>
            </motion.div>
            <p className="font-kannada text-base sm:text-lg font-bold text-gold leading-snug">{t(tier)}</p>
            <p className="mt-1.5 text-xs sm:text-sm text-cream/60">{t(s.revealing)}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-10 sm:mt-12 rounded-3xl border border-gold/30 bg-gradient-to-br from-maroon/70 to-ink/60 px-6 py-8 sm:px-10 sm:py-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 text-center md:text-left"
      >
        <span className="glass rounded-full p-4 shrink-0">
          <Sparkles size={28} className="text-gold" />
        </span>
        <div className="flex-1">
          <h3 className="font-kannada text-xl sm:text-2xl font-bold text-gradient-gold">{t(s.partnerTitle)}</h3>
          <p className={`mt-2 text-cream/75 leading-relaxed ${language === 'kn' ? 'font-kannada' : ''}`}>{t(s.partnerText)}</p>
        </div>
        <a
          href="#contribute"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-saffron px-6 py-3 font-semibold text-ink shadow-lg hover:brightness-110 transition shrink-0"
        >
          {t(s.partnerCta)}
          <ArrowRight size={18} />
        </a>
      </motion.div>
    </>
  );
}
