import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  CircleCheck,
  Drama,
  Guitar,
  Heart,
  HeartHandshake,
  Hourglass,
  Lightbulb,
  MessageSquareHeart,
  Mic,
  MonitorPlay,
  Send,
  Speaker,
  Star,
  Store,
  type LucideIcon,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { feedbackGroups, feedbackText as f, overallAspect, ratingWords, type FeedbackAspect, type FeedbackIcon } from '../data/feedback';

const ICONS: Record<FeedbackIcon, LucideIcon> = {
  mic: Mic,
  store: Store,
  drama: Drama,
  hourglass: Hourglass,
  guitar: Guitar,
  lightbulb: Lightbulb,
  speaker: Speaker,
  monitor: MonitorPlay,
  heart: Heart,
};

const FEEDBACK_URL = '/api/feedback';

/** /feedback — thank-you note, star ratings for each part of the day, improvement ideas. */
export function Feedback() {
  const { t, language, toggleLanguage } = useLanguage();
  const kn = language === 'kn' ? 'font-kannada' : '';
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [improvements, setImprovements] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error' | 'empty'>('idle');

  const rate = (id: string, value: number) => setRatings((r) => ({ ...r, [id]: r[id] === value ? 0 : value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!Object.values(ratings).some(Boolean) && !improvements.trim()) {
      setStatus('empty');
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch(FEEDBACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratings, improvements, name, language }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="min-h-svh bg-ink mandala-bg text-cream">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-ink/90 backdrop-blur-md border-b border-cream/10" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2.5 min-w-0">
            <img src="/logo.jpg" alt="" className="h-11 w-11 rounded-full object-cover shrink-0" />
            <span className="font-kannada text-base sm:text-lg font-bold text-gradient-gold truncate">B7G ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ</span>
          </a>
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={language === 'en' ? 'Switch language to Kannada' : 'Switch language to English'}
            className="inline-flex min-h-9 items-center rounded-full border border-cream/30 px-3 py-1.5 text-sm font-semibold text-cream hover:text-gold"
          >
            {language === 'en' ? <span className="font-kannada">ಕನ್ನಡ</span> : 'EN'}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 pb-24">
        {/* Thank-you note */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mt-8 overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-maroon/80 via-ink-light/70 to-maroon/90 p-7 sm:p-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
        >
          <span aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
          <span className="relative mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold shadow-[0_0_30px_rgba(246,215,132,0.35)]">
            <HeartHandshake size={32} />
          </span>
          <p className="relative mt-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-gold">{t(f.eyebrow)}</p>
          <h1 className="relative mt-2 font-kannada text-3xl sm:text-4xl font-bold text-gradient-gold">{t(f.thanksTitle)}</h1>
          <p className={`relative mt-4 text-cream/90 leading-relaxed ${kn}`}>{t(f.thanksBody)}</p>
          <p className={`relative mt-4 text-sm text-gold-light ${kn}`}>{t(f.thanksAsk)}</p>
        </motion.section>

        <AnimatePresence mode="wait">
          {status === 'done' ? (
            <motion.section
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 rounded-3xl glass p-10 text-center"
            >
              <motion.span
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold to-saffron text-ink"
              >
                <CircleCheck size={42} />
              </motion.span>
              <h2 className="mt-5 font-kannada text-2xl sm:text-3xl font-bold text-gradient-gold">{t(f.doneTitle)}</h2>
              <p className={`mt-3 text-cream/85 ${kn}`}>{t(f.doneBody)}</p>
              <p className="mt-5 font-kannada text-lg font-bold text-gold">ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ!</p>
              <a href="/" className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-saffron px-6 py-3 font-semibold text-ink hover:brightness-110">
                <ArrowLeft size={18} />
                {t(f.backHome)}
              </a>
            </motion.section>
          ) : (
            <motion.form key="form" onSubmit={submit} className="mt-8" exit={{ opacity: 0 }}>
              <p className={`text-center text-sm text-cream/60 ${kn}`}>{t(f.rateHint)}</p>

              {feedbackGroups.map((group) => (
                <fieldset key={group.title.en} className="mt-8">
                  <legend className="mb-4 font-kannada text-xl font-bold text-gold">{t(group.title)}</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.aspects.map((aspect, i) => (
                      <RatingCard key={aspect.id} aspect={aspect} value={ratings[aspect.id] ?? 0} onRate={rate} index={i} />
                    ))}
                  </div>
                </fieldset>
              ))}

              <fieldset className="mt-8">
                <legend className="sr-only">{t(overallAspect.label)}</legend>
                <RatingCard aspect={overallAspect} value={ratings.overall ?? 0} onRate={rate} index={0} featured />
              </fieldset>

              <label className="mt-8 block">
                <span className="mb-2 flex items-center gap-2 font-kannada text-xl font-bold text-gold">
                  <MessageSquareHeart size={22} />
                  {t(f.improveLabel)}
                </span>
                <textarea
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  maxLength={2000}
                  rows={5}
                  placeholder={t(f.improvePlaceholder)}
                  className={`w-full rounded-2xl border border-cream/15 bg-ink-light/60 p-4 text-cream placeholder:text-cream/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40 ${kn}`}
                />
              </label>

              <label className="mt-5 block">
                <span className={`mb-2 block text-sm text-cream/75 ${kn}`}>{t(f.nameLabel)}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  autoComplete="name"
                  className="w-full rounded-full border border-cream/15 bg-ink-light/60 px-5 py-3 text-cream focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
                />
              </label>

              {(status === 'error' || status === 'empty') && (
                <p role="alert" className={`mt-5 text-center text-sm text-crimson-light ${kn}`}>
                  {t(status === 'error' ? f.failed : f.needOne)}
                </p>
              )}

              <div className="mt-8 text-center">
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-saffron px-8 py-3.5 text-lg font-bold text-ink shadow-[0_0_24px_rgba(246,215,132,0.35)] hover:brightness-110 disabled:opacity-60"
                >
                  <Send size={19} />
                  <span className={kn}>{t(status === 'sending' ? f.sending : f.submit)}</span>
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function RatingCard({
  aspect,
  value,
  onRate,
  index,
  featured = false,
}: {
  aspect: FeedbackAspect;
  value: number;
  onRate: (id: string, value: number) => void;
  index: number;
  featured?: boolean;
}) {
  const { t, language } = useLanguage();
  const [hover, setHover] = useState(0);
  const Icon = ICONS[aspect.icon];
  const shown = hover || value;
  const kn = language === 'kn' ? 'font-kannada' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
        featured
          ? 'border-gold/60 bg-gradient-to-br from-maroon/80 to-ink-light/70 text-center shadow-[0_0_40px_rgba(232,184,75,0.15)]'
          : value
            ? 'border-gold/50 bg-maroon/40'
            : 'border-cream/10 bg-ink-light/40'
      }`}
    >
      <div className={`flex items-center gap-3 ${featured ? 'flex-col' : ''}`}>
        <span className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold ${featured ? 'h-14 w-14' : 'h-10 w-10'}`}>
          <Icon size={featured ? 28 : 20} />
        </span>
        <div className="min-w-0">
          <p className={`font-kannada font-bold text-cream leading-snug ${featured ? 'text-2xl' : 'text-base'}`}>{t(aspect.label)}</p>
          <p className={`text-xs text-cream/60 ${kn}`}>{t(aspect.hint)}</p>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label={t(aspect.label)}
        className={`mt-3 flex items-center gap-1.5 ${featured ? 'justify-center' : ''}`}
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} / 5 — ${t(ratingWords[n - 1])}`}
            onClick={() => onRate(aspect.id, n)}
            onMouseEnter={() => setHover(n)}
            className="rounded-md p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <Star
              size={featured ? 38 : 28}
              className={n <= shown ? 'fill-gold text-gold drop-shadow-[0_0_6px_rgba(246,215,132,0.6)]' : 'text-cream/30'}
            />
          </button>
        ))}
        <span className={`ml-2 min-w-20 text-sm font-semibold text-gold-light ${kn} ${featured ? 'hidden sm:inline' : ''}`}>
          {shown ? t(ratingWords[shown - 1]) : ''}
        </span>
      </div>
      {featured && <p className={`mt-2 h-5 text-sm font-semibold text-gold-light sm:hidden ${kn}`}>{shown ? t(ratingWords[shown - 1]) : ''}</p>}
    </motion.div>
  );
}
