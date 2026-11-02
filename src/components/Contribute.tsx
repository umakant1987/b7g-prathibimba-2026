import { useState, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, IndianRupee, Phone, UserRound } from 'lucide-react';
import { contributeConfig, detectPlatform, formatPhone, upiLinks, type ContributeContact } from '../data/contribute';
import { translations } from '../data/translations';
import { useLanguage } from '../context/LanguageContext';

export function Contribute() {
  const { t } = useLanguage();
  const c = translations.contribute;
  const touch = useIsTouchDevice();

  return (
    <section id="contribute" className="relative scroll-mt-20 py-24 sm:py-32 px-5 sm:px-8 bg-ink mandala-bg">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-kannada text-2xl sm:text-3xl font-bold text-gold mb-6">{t(c.eyebrow)}</h2>

        {/* Motivational quote */}
        <motion.figure
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <blockquote className="font-kannada text-2xl sm:text-4xl font-bold text-gradient-gold leading-snug">
            “{c.quote.kn}”
          </blockquote>
          <figcaption className="mt-3 text-cream/70 text-sm sm:text-base">
            <span className="italic">{c.quote.en}</span>
            <span className="block mt-1 text-gold/90">— {t(c.quoteAuthor)}</span>
          </figcaption>
        </motion.figure>

        <p className="mt-10 text-cream/90 text-lg sm:text-xl">{t(c.payLabel)}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
          {contributeConfig.contacts.map((contact) => (
            <PayCard key={contact.id} contact={contact} touch={touch} />
          ))}
        </div>
        <p className="mt-4 text-xs text-cream/60 max-w-md mx-auto">{t(touch ? c.payHintMobile : c.payHintDesktop)}</p>
      </div>
    </section>
  );
}

function PayCard({ contact, touch }: { contact: ContributeContact; touch: boolean }) {
  const { t } = useLanguage();
  const c = translations.contribute;
  const [copied, setCopied] = useState<'upi' | 'phone' | null>(null);
  const links = upiLinks(contact, contributeConfig.upiNote, detectPlatform(navigator.userAgent));
  const phone = formatPhone(contact.phone);

  const copy = async (text: string, what: 'upi' | 'phone') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      // Clipboard unavailable: the UPI ID stays visible to copy by hand.
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-5 flex flex-col items-center"
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-gold">
        <UserRound size={22} />
      </span>
      <p className="mt-2 font-kannada text-xl font-bold text-cream">{t(contact.name)}</p>

      {/* UPI ID: always visible and copyable, so it works with any UPI app on any device */}
      <button
        type="button"
        onClick={() => copy(contact.upiId, 'upi')}
        className="mt-3 inline-flex max-w-full items-center gap-2 rounded-xl border border-gold/40 bg-ink/30 px-3 py-2 text-sm font-semibold text-cream hover:border-gold"
        aria-label={`${t(c.copyUpi)}: ${contact.upiId}`}
      >
        <span className="break-all">{contact.upiId}</span>
        {copied === 'upi' ? <Check size={15} className="shrink-0 text-gold" /> : <Copy size={15} className="shrink-0 text-gold" />}
      </button>
      {copied === 'upi' && <span className="mt-1 text-xs text-gold">{t(c.copied)}</span>}

      {/* Phones: open a UPI app with the ID and note filled in; the payer enters the amount */}
      {touch && (
        <div className="mt-4 flex w-full flex-col items-center gap-2">
          <a
            href={links.any}
            className="inline-flex w-full max-w-60 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold to-saffron px-5 py-2.5 font-semibold text-ink hover:brightness-110"
          >
            <IndianRupee size={17} />
            {t(c.payUpi)}
          </a>
          <div className="flex w-full max-w-60 gap-2">
            <a href={links.gpay} className="flex-1 rounded-full border border-cream/30 px-3 py-2 text-sm font-semibold text-cream hover:border-gold">
              Google Pay
            </a>
            <a href={links.phonepe} className="flex-1 rounded-full border border-cream/30 px-3 py-2 text-sm font-semibold text-cream hover:border-gold">
              PhonePe
            </a>
          </div>
        </div>
      )}

      {/* Questions: call on phones, copy the number on desktop */}
      <a
        href={`tel:${contact.phone}`}
        onClick={(e) => {
          if (!touch) {
            e.preventDefault();
            void copy(phone, 'phone');
          }
        }}
        className="mt-4 inline-flex items-center gap-1.5 text-xs text-cream/70 hover:text-gold tabular-nums"
      >
        <Phone size={13} />
        {t(c.questions)} {copied === 'phone' ? t(c.copied) : phone}
      </a>
    </motion.div>
  );
}

/** Phones and tablets (coarse pointer), where tel: and upi: links open the dialler / UPI apps. */
function useIsTouchDevice(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia('(pointer: coarse)');
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia('(pointer: coarse)').matches,
    () => false,
  );
}
