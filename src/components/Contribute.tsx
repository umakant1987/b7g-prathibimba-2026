import { useState, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, IndianRupee, Phone, UserRound } from 'lucide-react';
import { contributeConfig, formatPhone, upiPayLink, type ContributeContact } from '../data/contribute';
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

        <p className="mt-10 text-cream/90 text-lg sm:text-xl">{t(c.contactLabel)}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 max-w-xl mx-auto">
          {contributeConfig.contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} touch={touch} />
          ))}
        </div>
        <p className="mt-4 text-xs text-cream/55">{t(touch ? c.tapToCall : c.clickToCopy)}</p>
      </div>
    </section>
  );
}

function ContactCard({ contact, touch }: { contact: ContributeContact; touch: boolean }) {
  const { t } = useLanguage();
  const c = translations.contribute;
  const [copied, setCopied] = useState<'phone' | 'upi' | null>(null);
  const display = formatPhone(contact.phone);

  const copy = async (text: string, what: 'phone' | 'upi') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      // Clipboard unavailable: the number stays visible to copy by hand.
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

      {/* Phones: tap to call. Desktop: click to copy (tel: links do nothing useful there). */}
      <a
        href={`tel:${contact.phone}`}
        onClick={(e) => {
          if (!touch) {
            e.preventDefault();
            void copy(display, 'phone');
          }
        }}
        className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-gold to-saffron text-ink font-semibold text-lg tabular-nums hover:brightness-110 transition"
        aria-label={`${t(contact.name)}: ${display}`}
      >
        {copied === 'phone' ? <Check size={18} /> : <Phone size={18} />}
        {copied === 'phone' ? t(c.copied) : display}
      </a>
      <button
        type="button"
        onClick={() => copy(display, 'phone')}
        className="mt-2 inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-light"
      >
        <Copy size={13} />
        {t(c.copyNumber)}
      </button>

      {/* Only with a confirmed UPI ID: phones open their UPI app chooser; desktops can copy the ID. */}
      {contact.upiId &&
        (touch ? (
          <a
            href={upiPayLink(contact, contributeConfig.upiNote)}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gold/50 text-sm font-semibold text-gold hover:bg-gold/10"
          >
            <IndianRupee size={15} />
            {t(c.payUpi)}
          </a>
        ) : (
          <button
            type="button"
            onClick={() => copy(contact.upiId, 'upi')}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-cream/75 hover:text-cream break-all"
          >
            UPI: {contact.upiId}
            {copied === 'upi' ? <Check size={13} /> : <Copy size={13} />}
          </button>
        ))}
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
