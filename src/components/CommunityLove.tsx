import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useReactionsContext } from '../context/ReactionsContext';
import { KANNADA_WORDS, MILESTONES, REACTION_CONFIG } from '../data/reactions';
import { translations } from '../data/translations';
import { useFloatingParticles } from '../hooks/useFloatingParticles';
import { useReducedMotion } from '../hooks/useReducedMotion';
import type { ReactionType } from '../types';
import { AnimatedCounter } from './AnimatedCounter';
import { FloatingParticles } from './FloatingParticles';
import { MilestoneCelebration } from './MilestoneCelebration';

const SECONDARY_TYPES: ReactionType[] = ['proud', 'support', 'respect', 'celebrate'];

export function CommunityLove() {
  const { t } = useLanguage();
  const { counts, loading, milestone, cooldownActive, shared, wordsLearned, react } = useReactionsContext();
  const { particles, burst } = useFloatingParticles();
  const reducedMotion = useReducedMotion();
  const [pulseKey, setPulseKey] = useState(0);

  const handleLove = () => {
    react('love');
    burst('❤️', reducedMotion ? 1 : 8);
    setPulseKey((k) => k + 1);
  };

  const handleSecondary = (type: ReactionType) => {
    react(type);
    burst(REACTION_CONFIG[type].emoji, reducedMotion ? 1 : 4);
  };

  const milestoneMessage = milestone
    ? `🎉 ${milestone.toLocaleString('en-IN')} ${t(translations.love.milestone)}`
    : '';

  return (
    <section id="love" className="relative py-24 sm:py-32 px-5 sm:px-8 bg-ink overflow-hidden mandala-bg mandala-alt">
      <div
        className="absolute inset-0 opacity-40"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(232,184,75,0.18), transparent 55%)' }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <span className="inline-block text-sm font-semibold tracking-wider uppercase text-gold mb-3">
          Community Love
        </span>
        <h2 className="font-kannada text-3xl sm:text-4xl md:text-5xl font-bold text-gradient-gold mb-3">
          ❤️ {t(translations.love.title)}
        </h2>
        <p className="text-cream/70 text-base sm:text-lg mb-10">{t(translations.love.subtitle)}</p>

        <div className="relative inline-block">
          {!reducedMotion && (
            <span className="absolute -inset-6 rounded-full bg-gold/25 blur-2xl animate-glow" aria-hidden />
          )}
          <motion.button
            key={pulseKey}
            type="button"
            onClick={handleLove}
            whileTap={{ scale: 0.92 }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 0.4 }}
            className="relative glass rounded-full px-10 py-6 sm:px-14 sm:py-8 text-xl sm:text-3xl font-kannada font-bold text-cream shadow-lg hover:bg-cream/10 transition-colors"
          >
            {t(translations.love.button)}
          </motion.button>
          <FloatingParticles particles={particles} />
        </div>

        <p className="mt-6 text-cream/80 text-lg min-h-[1.75rem]">
          {!loading && counts && (
            <>
              <span className="font-bold text-gold text-xl">
                <AnimatedCounter value={counts.love} />
              </span>{' '}
              {t(translations.love.countSuffix)}
            </>
          )}
        </p>

        <AnimatePresence>
          {cooldownActive && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 text-sm text-gold-light"
            >
              {t(translations.love.cooldown)}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {SECONDARY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleSecondary(type)}
              className="glass rounded-full px-4 py-2 text-sm text-cream/80 hover:bg-cream/10 transition-colors flex items-center gap-1.5"
            >
              <span className="text-base">{REACTION_CONFIG[type].emoji}</span>
              {t(REACTION_CONFIG[type].label)}
            </button>
          ))}
        </div>

        {counts && !loading && (
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <LoveStat emoji="❤️" value={counts.love} label={t(translations.love.statLove)} />
            <LoveStat emoji="👍" value={counts.proud} label={t(translations.love.statProud)} />
            <LoveStat emoji="🎉" value={counts.celebrate} label={t(translations.love.statCelebrate)} />
          </div>
        )}

        {counts && !loading && !shared && (
          <p className="mt-3 text-xs text-cream/50">{t(translations.love.localOnly)}</p>
        )}

        {counts && !loading && <MilestoneProgress love={counts.love} />}

        <KannadaWordCard wordsLearned={wordsLearned} />
      </div>

      <MilestoneCelebration milestone={milestone} message={milestoneMessage} />
    </section>
  );
}

function LoveStat({ emoji, value, label }: { emoji: string; value: number; label: string }) {
  return (
    <div className="glass rounded-2xl p-5 text-center">
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="font-kannada text-xl sm:text-2xl font-bold text-cream">
        <AnimatedCounter value={value} />
      </div>
      <div className="text-xs text-cream/60 mt-1">{label}</div>
    </div>
  );
}

/** Progress from the last milestone reached to the next one. */
function MilestoneProgress({ love }: { love: number }) {
  const { t } = useLanguage();
  const next = MILESTONES.find((m) => m > love);
  if (next === undefined) {
    return <p className="mt-10 text-gold font-semibold">{t(translations.love.allMilestones)}</p>;
  }
  const previous = [...MILESTONES].reverse().find((m) => m <= love) ?? 0;
  const percent = Math.min(100, ((love - previous) / (next - previous)) * 100);
  return (
    <div className="mt-12 max-w-md mx-auto text-left">
      <div className="flex justify-between text-xs text-cream/60 mb-2">
        <span>{t(translations.love.nextMilestone)}</span>
        <span className="font-semibold text-gold">{next.toLocaleString('en-IN')} ❤️</span>
      </div>
      <div
        className="h-3 rounded-full bg-cream/10 overflow-hidden"
        role="progressbar"
        aria-valuemin={previous}
        aria-valuemax={next}
        aria-valuenow={love}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-saffron to-gold-light"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <p className="mt-2 text-sm text-cream/70 text-center">
        <span className="font-semibold text-cream">{(next - love).toLocaleString('en-IN')}</span>{' '}
        {t(translations.love.toGo)}
      </p>
    </div>
  );
}

/** Each reaction reveals the next Kannada word — Learn. Celebrate. Connect. */
function KannadaWordCard({ wordsLearned }: { wordsLearned: number }) {
  const { t } = useLanguage();
  const word = KANNADA_WORDS[Math.max(0, wordsLearned - 1) % KANNADA_WORDS.length];
  const revealed = wordsLearned > 0;

  return (
    <div className="mt-12 max-w-md mx-auto">
      <h3 className="font-kannada text-lg font-bold text-gold mb-4">📖 {t(translations.love.wordTitle)}</h3>
      <div className="glass rounded-2xl p-6 min-h-[11rem] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={revealed ? wordsLearned : 'prompt'}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="text-center"
          >
            <p className={`font-kannada text-4xl sm:text-5xl font-bold ${revealed ? 'text-cream' : 'text-cream/40'}`}>
              {word.kn}
            </p>
            <p className="mt-2 text-gold font-semibold">{word.roman}</p>
            <p className="text-sm text-cream/70">{revealed ? word.meaning : t(translations.love.wordPrompt)}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      {revealed && (
        <p className="mt-3 text-xs text-cream/60">
          {Math.min(wordsLearned, KANNADA_WORDS.length)} / {KANNADA_WORDS.length} {t(translations.love.wordsLearned)}
        </p>
      )}
    </div>
  );
}
