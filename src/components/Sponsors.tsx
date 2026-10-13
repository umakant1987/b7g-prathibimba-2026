import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { sponsors } from '../data/sponsors';
import { translations } from '../data/translations';
import { useLanguage } from '../context/LanguageContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import type { Sponsor } from '../types';
import { SectionHeader } from './SectionHeader';
import { SHOW_CONTRIBUTE } from '../config/env';

export function Sponsors() {
  const s = translations.sponsors;
  const { t } = useLanguage();
  const announced = sponsors.length > 0;

  return (
    <section id="sponsors" className="relative py-24 sm:py-32 px-5 sm:px-8 bg-ink-light mandala-bg mandala-alt">
      <div className="max-w-5xl mx-auto">
        {announced ? (
          <>
            <SectionHeader title={s.title} subtitle={s.subtitle} eyebrow={t(s.thankYou)} />
            {/* Flex-wrap rather than grid, so a short last row stays centred. */}
            <div className="mt-14 flex flex-wrap justify-center gap-6">
              {sponsors.map((sponsor, index) => (
                <SponsorCard key={sponsor.id} sponsor={sponsor} index={index} />
              ))}
            </div>
            <PartnerInvite />
          </>
        ) : (
          <SponsorsComingSoon />
        )}
      </div>
    </section>
  );
}

/** Until sponsors are confirmed: veiled sponsor cards waiting to be unveiled, plus a partner invitation. */
const SPONSOR_SLOTS = [0, 1, 2, 3];

function SponsorsComingSoon() {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  const s = translations.sponsors;

  return (
    <>
      <SectionHeader title={s.soonTitle} subtitle={s.soonSubtitle} eyebrow={t(s.soonEyebrow)} />

      <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        {SPONSOR_SLOTS.map((index) => (
          <motion.div
            key={index}
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
            <p className="font-kannada text-base sm:text-lg font-bold text-gold leading-snug">{t(s.slot)}</p>
            <p className="mt-1.5 text-xs sm:text-sm text-cream/60">{t(s.revealing)}</p>
          </motion.div>
        ))}
      </div>

      <PartnerInvite />
    </>
  );
}

/** A confirmed sponsor: logo (or a monogram badge when there is no logo) and name. */
function SponsorCard({ sponsor, index }: { sponsor: Sponsor; index: number }) {
  const card = (
    <>
      <div className="aspect-[4/3] flex items-center justify-center p-2">
        {sponsor.logo ? (
          <img src={sponsor.logo} alt={sponsor.fullName ?? sponsor.name} loading="lazy" className="max-h-full max-w-full object-contain rounded-lg" />
        ) : (
          <SponsorMonogram name={sponsor.name} />
        )}
      </div>
      <div className="mt-4 text-center">
        <p className="font-display text-xl font-bold text-cream">{sponsor.name}</p>
        {sponsor.fullName && <p className="mt-0.5 text-sm text-cream/65 leading-snug">{sponsor.fullName}</p>}
      </div>
    </>
  );
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] max-w-sm rounded-2xl border border-gold/40 bg-maroon/40 p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.3)]"
    >
      {sponsor.website ? (
        <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="block">
          {card}
        </a>
      ) : (
        card
      )}
    </motion.div>
  );
}

/** Default badge for a sponsor without a logo: initials in a gold ring, in the site's mandala style. */
function SponsorMonogram({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
  return (
    <div
      role="img"
      aria-label={name}
      className="relative flex h-full max-h-40 aspect-square items-center justify-center rounded-full border-2 border-gold/70 bg-gradient-to-br from-ink-light to-maroon shadow-[0_0_30px_rgba(232,184,75,0.25)]"
    >
      <span aria-hidden="true" className="absolute inset-2 rounded-full border border-dashed border-gold/40" />
      <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[url('/patterns/mandala.svg')] bg-center bg-contain bg-no-repeat opacity-15" />
      <span className="relative font-display text-4xl sm:text-5xl font-bold tracking-wide text-gradient-gold">{initials}</span>
    </div>
  );
}

/** "Be a part of Namma Rajyotsava" invitation, with a Contribute button while that section is on. */
function PartnerInvite() {
  const { t, language } = useLanguage();
  const s = translations.sponsors;
  return (
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
          {SHOW_CONTRIBUTE && (
          <a
            href="#contribute"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-saffron px-6 py-3 font-semibold text-ink shadow-lg hover:brightness-110 transition shrink-0"
          >
            {t(s.partnerCta)}
            <ArrowRight size={18} />
          </a>
          )}
        </motion.div>
  );
}
