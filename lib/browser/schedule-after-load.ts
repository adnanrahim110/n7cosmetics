/** Run optional work after critical resources have loaded, during an idle slot. */
export function scheduleAfterLoad(callback: () => void): () => void {
  let cancelled = false;
  let idleId: number | undefined;
  let timerId: number | undefined;

  const run = () => {
    if (!cancelled) callback();
  };
  const schedule = () => {
    if (cancelled) return;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(run, { timeout: 1500 });
    } else {
      timerId = window.setTimeout(run, 32);
    }
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener("load", schedule);
    if (idleId !== undefined) window.cancelIdleCallback(idleId);
    if (timerId !== undefined) window.clearTimeout(timerId);
  };
}
