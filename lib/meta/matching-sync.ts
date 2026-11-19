import type { MetaMatchingInput } from "./matching-input";

export const META_MATCHING_FLUSH_EVENT = "n7:meta-matching-flush";

// Keep typing debounced, but flush already-known details before InitiateCheckout
// takes its matching snapshot. This never creates or replays a commerce event.
export function synchronizeCheckoutMatching(
  profile: MetaMatchingInput,
  target: EventTarget,
  update: (input: MetaMatchingInput) => Promise<boolean>,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const flush = () => {
    clearTimeout(timer);
    timer = undefined;
    void update(profile).catch(() => undefined);
  };
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(flush, 1000);
  };
  schedule();
  target.addEventListener("n7:meta-ready", schedule);
  target.addEventListener("n7:tiktok-ready", schedule);
  target.addEventListener(META_MATCHING_FLUSH_EVENT, flush);
  return () => {
    clearTimeout(timer);
    target.removeEventListener("n7:meta-ready", schedule);
    target.removeEventListener("n7:tiktok-ready", schedule);
    target.removeEventListener(META_MATCHING_FLUSH_EVENT, flush);
  };
}
