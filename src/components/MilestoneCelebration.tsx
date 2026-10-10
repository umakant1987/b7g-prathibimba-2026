import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

const COLORS = ['#e8b84b', '#c81d35', '#f0a500', '#f7f1e3', '#e0324a'];

interface MilestoneCelebrationProps {
  milestone: number | null;
  message: string;
}

export function MilestoneCelebration({ milestone, message }: MilestoneCelebrationProps) {
  const reducedMotion = useReducedMotion();

  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: COLORS[i % COLORS.length],
        duration: 2 + Math.random() * 1.5,
        delay: Math.random() * 0.4,
        rotate: Math.random() * 360,
        size: 6 + Math.random() * 6,
      })),
    [milestone],
  );

  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] pointer-events-none flex items-start justify-center overflow-hidden"
          role="status"
          aria-live="polite"
        >
          {!reducedMotion &&
            pieces.map((piece) => (
              <motion.span
                key={piece.id}
                initial={{ y: -40, x: `${piece.left}vw`, opacity: 1, rotate: 0 }}
                animate={{ y: '100vh', rotate: piece.rotate }}
                transition={{ duration: piece.duration, delay: piece.delay, ease: 'easeIn' }}
                style={{ backgroundColor: piece.color, width: piece.size, height: piece.size }}
                className="absolute top-0 rounded-sm"
              />
            ))}

          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 40, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="glass rounded-2xl px-6 py-4 mt-10 text-center max-w-sm mx-4"
          >
            <p className="font-kannada text-lg sm:text-xl font-bold text-gradient-gold">{message}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
