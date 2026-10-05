export function focusCheckoutElement(element: HTMLElement | null | undefined) {
  if (!element) return;
  const accordion = element.closest("details");
  if (accordion) accordion.open = true;
  element.focus({ preventScroll: true });
  element.scrollIntoView({
    block: "center",
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
  });
}
