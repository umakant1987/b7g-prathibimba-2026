import { motion } from 'framer-motion';
import { Award, Coffee, Cpu, Crown, Flag, Gem, GraduationCap, HardHat, Landmark, BookOpen, Users, Zap, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { achievers, contributions, type ContributionIcon } from '../data/contributions';
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
  const { t, language } = useLanguage();
  const c = translations.contributions;
  const kn = language === 'kn' ? 'font-kannada' : '';

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

          {/* Other Significant Achievements: Karnataka's great achievers (see knowledge/achievers/) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="sm:col-span-2 lg:col-span-3 rounded-3xl border border-gold/35 bg-gradient-to-br from-maroon/70 to-ink-light/60 p-6 sm:p-8 lg:p-10"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-center sm:text-left">
              <span className="mx-auto sm:mx-0 inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold/15 text-gold shrink-0">
                <Award size={22} />
              </span>
              <div>
                <h3 className="font-kannada text-xl sm:text-2xl font-bold text-gradient-gold">{t(c.achieversTitle)}</h3>
                <p className={`mt-1 text-cream/70 text-sm sm:text-base ${kn}`}>{t(c.achieversSubtitle)}</p>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievers.map((person) => (
                <div key={person.id} className="glass rounded-2xl p-5 hover:bg-cream/10 transition-colors">
                  <p className="font-kannada text-lg font-bold text-cream leading-snug">{t(person.name)}</p>
                  <span className="mt-1.5 inline-block rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-xs font-semibold text-gold">
                    {t(person.honour)}
                  </span>
                  <p className={`mt-3 text-cream/70 text-sm leading-relaxed ${kn}`}>{t(person.description)}</p>
                  {person.awards && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {person.awards.map((award) => (
                        <li key={award.en} className={`rounded-full border border-cream/20 bg-cream/5 px-2.5 py-0.5 text-[11px] text-cream/80 ${kn}`}>
                          🏅 {t(award)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <p className={`mt-7 border-t border-gold/20 pt-5 text-center text-sm sm:text-base italic text-gold-light/90 leading-relaxed max-w-3xl mx-auto ${kn}`}>
              “{t(c.achieversClosing)}”
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
