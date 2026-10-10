import { useCallback, useState } from 'react';

export interface Particle {
  id: string;
  emoji: string;
  dx: number;
  duration: number;
  delay: number;
}

interface UseFloatingParticlesResult {
  particles: Particle[];
  burst: (emoji: string, count?: number) => void;
}

export function useFloatingParticles(): UseFloatingParticlesResult {
  const [particles, setParticles] = useState<Particle[]>([]);

  const burst = useCallback((emoji: string, count = 6) => {
    const newParticles: Particle[] = Array.from({ length: count }).map(() => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      emoji,
      dx: (Math.random() - 0.5) * 120,
      duration: 900 + Math.random() * 500,
      delay: Math.random() * 150,
    }));

    setParticles((prev) => [...prev, ...newParticles]);

    newParticles.forEach((particle) => {
      window.setTimeout(
        () => setParticles((prev) => prev.filter((item) => item.id !== particle.id)),
        particle.duration + particle.delay + 150,
      );
    });
  }, []);

  return { particles, burst };
}
