import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Phone, QrCode } from 'lucide-react';
import { contributeConfig, type ContributeQr } from '../data/contribute';
import { translations } from '../data/translations';
import { useLanguage } from '../context/LanguageContext';

export function Contribute() {
  const { t } = useLanguage();
  const c = translations.contribute;
  const { qrCodes, phone, phoneLabel } = contributeConfig;

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

        <p className="mt-8 text-cream/90 text-lg sm:text-xl max-w-xl mx-auto">{t(c.message)}</p>

        {/* QR codes */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-6 max-w-lg mx-auto">
          {qrCodes.map((qr) => (
            <QrCard key={qr.id} qr={qr} />
          ))}
        </div>
        <p className="mt-4 text-xs text-cream/60 sm:hidden">{t(c.mobileHint)}</p>

        {/* Phone */}
        <div className="mt-10">
          <p className="text-sm text-cream/70">{t(phoneLabel)}</p>
          {phone ? (
            <a
              href={`tel:${phone.replace(/[^\d+]/g, '')}`}
              className="mt-3 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-gold to-saffron text-ink font-semibold text-lg hover:brightness-110 transition"
            >
              <Phone size={18} />
              {phone}
            </a>
          ) : (
            <p className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass text-cream/70 text-sm">
              <Phone size={16} />
              {t(c.comingSoon)}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function QrCard({ qr }: { qr: ContributeQr }) {
  const { t } = useLanguage();
  const c = translations.contribute;
  const [copied, setCopied] = useState(false);

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(qr.upiId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — the UPI ID is still visible to copy by hand.
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-3 sm:p-5 flex flex-col items-center"
    >
      {/* Scanners need a light, high-contrast tile around the code */}
      <div className="w-full aspect-square rounded-xl bg-white p-2 sm:p-3 flex items-center justify-center">
        {qr.image ? (
          <img src={qr.image} alt={t(qr.label)} className="w-full h-full object-contain" loading="lazy" />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 w-full h-full rounded-lg border-2 border-dashed border-ink/25 text-ink/60">
            <QrCode size={40} />
            <span className="text-xs font-medium px-2">{t(c.qrComingSoon)}</span>
          </div>
        )}
      </div>
      <p className="mt-3 text-sm font-semibold text-cream">{t(qr.label)}</p>
      {qr.upiId && (
        <button
          type="button"
          onClick={copyUpi}
          className="mt-1 inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-light break-all"
          aria-label={`Copy UPI ID ${qr.upiId}`}
        >
          {qr.upiId}
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      )}
    </motion.div>
  );
}
