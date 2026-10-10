import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface AnimatedCounterProps {
  value: number;
  format?: (value: number) => string;
  durationMs?: number;
}

export function AnimatedCounter({ value, format, durationMs = 800 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const fromRef = useRef(value);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(value);
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs, reducedMotion]);

  const formatted = format ? format(displayValue) : displayValue.toLocaleString('en-IN');

  return <span>{formatted}</span>;
}
