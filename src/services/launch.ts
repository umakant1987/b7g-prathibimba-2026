/** Signals the end of the launch loader, so features can wait until the website is actually visible. */
let done = false;
const listeners = new Set<() => void>();

export function markLaunchDone(): void {
  done = true;
  listeners.forEach((listener) => listener());
  listeners.clear();
}

export function onLaunchDone(listener: () => void): () => void {
  if (done) {
    listener();
    return () => {};
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}
