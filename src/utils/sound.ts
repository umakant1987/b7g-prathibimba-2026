/**
 * Generates a very short, subtle "pop" using the Web Audio API instead of an
 * audio asset. Always called from inside a click handler, so it runs within
 * the user-gesture window browsers require for audio playback.
 */
export function playPopSound(): void {
  if (typeof window === 'undefined' || !window.AudioContext) return;
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.13);
    oscillator.onended = () => ctx.close();
  } catch {
    // audio blocked/unavailable — the interaction still works without sound
  }
}
