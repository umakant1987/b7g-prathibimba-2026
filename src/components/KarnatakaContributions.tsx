import { motion } from 'framer-motion';
import { Coffee, Cpu, Crown, Flag, Gem, GraduationCap, HardHat, Landmark, BookOpen, Users, Zap, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { contributions, type ContributionIcon } from '../data/contributions';
import { translations } from '../data/translations';
import { SectionHeader } from './SectionHeader';

const ICONS: Record<ContributionIcon, LucideIcon> = {
  flag: Flag,
  'book-open': BookOpen,
  cpu: Cpu,
  landmark: Landmark,
  zap: Zap,
  coffee: Coffee,
  'hard-hat': HardHat,
  gem: Gem,
  crown: Crown,
  users: Users,
  'graduation-cap': GraduationCap,
};

export function KarnatakaContributions() {
  const { t } = useLanguage();

  return (
    <section className="relative py-24 sm:py-32 px-5 sm:px-8 bg-ink mandala-bg">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          title={translations.contributions.title}
          subtitle={translations.contributions.subtitle}
          eyebrow="Karnataka's Contribution"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
          {contributions.map((item, index) => {
            const Icon = ICONS[item.icon];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
                className="glass rounded-2xl p-6 sm:p-7 hover:bg-cream/10 transition-colors"
              >
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-gold/15 text-gold mb-4">
                  <Icon size={20} />
                </span>
                <h3 className="font-display text-lg font-semibold text-cream mb-2">{t(item.title)}</h3>
                <p className="text-cream/70 text-sm leading-relaxed">{t(item.description)}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
