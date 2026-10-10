import { AnimatePresence, motion } from 'framer-motion';
import type { Particle } from '../hooks/useFloatingParticles';

export function FloatingParticles({ particles }: { particles: Particle[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            initial={{ opacity: 1, y: 0, x: 0, scale: 0.6 }}
            animate={{ opacity: 0, y: -90, x: particle.dx, scale: 1.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: particle.duration / 1000, delay: particle.delay / 1000, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 text-2xl select-none"
          >
            {particle.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
