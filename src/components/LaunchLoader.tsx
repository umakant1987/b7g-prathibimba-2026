import { useEffect, useState } from 'react';

/** Loading steps shown in the neon counter; 75 % holds until the page has finished loading. */
const STEPS = [0, 25, 50, 75, 100];
const STEP_MS = 900;
/** Never keep visitors waiting longer than this for slow images. */
const MAX_WAIT_MS = 2500;
const FADE_MS = 800;

/** Sparkles floating up behind the intro (fixed, seeded positions). */
const SPARKS = (() => {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 26 }, () => ({
    left: `${rnd() * 100}%`,
    size: 2 + rnd() * 4,
    duration: 4 + rnd() * 4,
    delay: -rnd() * 6,
  }));
})();

/**
 * Launch screen shown on every page load: the Prathibimba intro from the promo
 * video (mandala, logo, title, "presents") with a neon 0 → 25 → 50 → 75 → 100 %
 * counter, then it fades out to reveal the website.
 */
export function LaunchLoader() {
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const loaded = new Promise<void>((resolve) => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', () => resolve(), { once: true });
    });
    const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
    let cancelled = false;

    (async () => {
      for (let i = 1; i <= 3; i++) {
        await sleep(STEP_MS);
        if (cancelled) return;
        setStep(i);
      }
      await Promise.race([loaded, sleep(MAX_WAIT_MS)]);
      await sleep(STEP_MS);
      if (cancelled) return;
      setStep(4);
      await sleep(800);
      if (cancelled) return;
      setLeaving(true);
      document.body.style.overflow = '';
      await sleep(FADE_MS);
      if (!cancelled) setGone(true);
    })();

    return () => {
      cancelled = true;
      document.body.style.overflow = '';
    };
  }, []);

  if (gone) return null;
  const percent = STEPS[step];

  return (
    <div
      className={`launch-loader ${leaving ? 'launch-loader--leaving' : ''}`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
      role="status"
      aria-live="polite"
      aria-label={`Loading ${percent}%`}
    >
      <div className="ll-mandala" aria-hidden="true" />
      <div className="ll-burst" aria-hidden="true" />
      <div aria-hidden="true">
        {SPARKS.map((s, i) => (
          <span
            key={i}
            className="ll-spark"
            style={{ left: s.left, width: s.size, height: s.size, animationDuration: `${s.duration}s`, animationDelay: `${s.delay}s` }}
          />
        ))}
      </div>

      <div className="ll-content">
        <div className="ll-halo" aria-hidden="true" />
        <img className="ll-logo" src="/logo.jpg" alt="" />
        <p className="ll-kn">ಪ್ರತಿಬಿಂಬ 2026</p>
        <p className="ll-en">PRATHIBIMBA 2026</p>
        <p className="ll-presents">
          <span className="ll-line" />
          presents
          <span className="ll-line ll-line--r" />
        </p>
        <p className="ll-title">B7G ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ 2026</p>

        <div className="ll-progress">
          <span key={percent} className="ll-percent">
            {percent}%
          </span>
          <div className="ll-bar">
            <div className="ll-bar-fill" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
