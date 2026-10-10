import { motion } from 'framer-motion';
import type { Sponsor } from '../types';

export function SponsorLogo({ sponsor, index }: { sponsor: Sponsor; index: number }) {
  return (
    <motion.a
      href={sponsor.website ?? '#'}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: (index % 6) * 0.05 }}
      className="glass rounded-xl p-4 sm:p-5 flex items-center justify-center h-20 sm:h-24 hover:bg-cream/10 transition-colors"
    >
      <img src={sponsor.logo} alt={sponsor.name} className="max-h-10 sm:max-h-12 w-auto object-contain" />
    </motion.a>
  );
}
