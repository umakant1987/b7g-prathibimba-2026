import { motion } from 'framer-motion';
import type { LocalizedText } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface SectionHeaderProps {
  eyebrow?: string;
  title: LocalizedText;
  subtitle?: LocalizedText;
  align?: 'center' | 'left';
}

export function SectionHeader({ eyebrow, title, subtitle, align = 'center' }: SectionHeaderProps) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={align === 'center' ? 'text-center mx-auto max-w-2xl' : 'text-left max-w-2xl'}
    >
      {eyebrow && (
        <span className="inline-block text-sm font-semibold tracking-wider uppercase text-gold mb-3">
          {eyebrow}
        </span>
      )}
      <h2 className="font-kannada text-3xl sm:text-4xl md:text-5xl font-bold text-gradient-gold mb-4">
        {t(title)}
      </h2>
      {subtitle && <p className="text-cream/70 text-base sm:text-lg">{t(subtitle)}</p>}
    </motion.div>
  );
}
