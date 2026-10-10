import { motion } from 'framer-motion';
import { ArrowRight, HandHeart, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useReactionsContext } from '../context/ReactionsContext';
import { translations } from '../data/translations';
import { useFloatingParticles } from '../hooks/useFloatingParticles';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { AnimatedCounter } from './AnimatedCounter';
import { FloatingParticles } from './FloatingParticles';

export function Hero() {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  const { counts, react } = useReactionsContext();
  const { particles, burst } = useFloatingParticles();

  const handleLove = () => {
    react('love');
    burst('❤️', reducedMotion ? 1 : 6);
  };

  return (
    // Top padding matches the fixed navbar height, so the banner starts right below it.
    <section id="top" className="relative overflow-hidden pt-16 sm:pt-20">
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-maroon/60 to-ink" />
      <div className="mandala-layer absolute inset-0" aria-hidden />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(232,184,75,0.25), transparent 40%), radial-gradient(circle at 80% 70%, rgba(200,29,53,0.3), transparent 45%)',
        }}
      />

      {!reducedMotion && (
        <>
          <motion.div
            className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-saffron/25 blur-3xl animate-float"
            aria-hidden
          />
          <motion.div
            className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-gold/20 blur-3xl animate-glow"
            aria-hidden
          />
        </>
      )}

      {/*
        "Namma Karnataka" banner. It carries its own headline, so it sits above the
        page content rather than behind it. Phones get a centred 16:9 crop (keeps the
        full title, much larger than a thin 3:1 strip); wider screens get the whole
        3:1 artwork. Small WebP files per screen size; the PNG is only a fallback.
      */}
      <motion.div
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10"
      >
        <picture>
          <source
            media="(max-width: 767px)"
            type="image/webp"
            srcSet="/hero-banner-mobile-560.webp 560w, /hero-banner-mobile-757.webp 757w"
            sizes="100vw"
          />
          <source
            type="image/webp"
            srcSet="/hero-banner-640.webp 640w, /hero-banner-960.webp 960w, /hero-banner-1280.webp 1280w"
            sizes="100vw"
          />
          <img
            src="/bg.jpg"
            alt="ನಮ್ಮ ಕರ್ನಾಟಕ — ನಮ್ಮ ಪರಂಪರೆ. ನಮ್ಮ ಸಂಸ್ಕೃತಿ. ನಮ್ಮ ಹೆಮ್ಮೆ. (Our Karnataka — our heritage, our culture, our pride.) Illustration of the Karnataka map, Jog Falls, Mysuru Palace, Hampi's stone chariot, Vidhana Soudha, Yakshagana, Kambala and a Bharatanatyam dancer"
            width={1280}
            height={426}
            fetchPriority="high"
            decoding="async"
            className="block w-full aspect-video md:aspect-3/1 object-cover object-center"
          />
        </picture>
        {/* Blend the banner's bottom edge into the page */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-ink" />
      </motion.div>

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 text-center pt-2 sm:pt-4 pb-16 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-4 sm:mb-6 text-sm text-gold"
        >
          <Sparkles size={16} />
          <span>B7G Community Celebration</span>
        </motion.div>

        <h1 className="font-kannada font-extrabold">
          {translations.hero.titleLines.map((line, index) => (
            <motion.span
              key={line}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: index * 0.15, ease: 'easeOut' }}
              className="block text-3xl sm:text-5xl md:text-6xl text-gradient-gold tracking-tight"
            >
              {line}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-4 sm:mt-6 text-base sm:text-xl text-cream/80 max-w-2xl mx-auto"
        >
          {t(translations.hero.subtitle)}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <a
            href="#schedule"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-gold to-saffron text-ink font-semibold hover:brightness-110 transition w-full sm:w-auto justify-center"
          >
            {t(translations.hero.ctaPrimary)}
            <ArrowRight size={18} />
          </a>
          <a
            href="#contribute"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass text-cream font-semibold hover:bg-cream/10 transition w-full sm:w-auto justify-center"
          >
            <HandHeart size={20} />
            {t(translations.hero.ctaSecondary)}
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-10 sm:mt-12 pt-8 border-t border-cream/10 max-w-sm mx-auto"
        >
          <p className="text-cream/70 text-sm sm:text-base">
            {t(translations.heroLove.line1)}
            <br />
            {t(translations.heroLove.line2)}
          </p>
          <div className="relative inline-block mt-4">
            <button
              type="button"
              onClick={handleLove}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass text-cream text-sm font-semibold hover:bg-cream/10 active:scale-95 transition"
            >
              ❤️ {t(translations.heroLove.button)}
            </button>
            <FloatingParticles particles={particles} />
          </div>
          {counts && (
            <p className="mt-3 text-xs text-cream/50">
              <AnimatedCounter value={counts.love} /> {t(translations.heroLove.joined)}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
