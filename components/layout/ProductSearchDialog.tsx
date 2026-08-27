"use client";

import { ArrowRight, LoaderCircle, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import Title from "@/components/ui/Title";

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

interface ProductSearchResult {
  id: string;
  productType: "STANDARD" | "BUNDLE";
  slug: string;
  name: string;
  brand: string | null;
  inspiredBy: string | null;
  category: string;
  pricePence: number;
  compareAtPricePence: number | null;
  image: string;
  imageAlt: string;
}

interface ProductSearchResponse {
  results?: ProductSearchResult[];
  error?: string;
}

interface ProductSearchDialogProps {
  open: boolean;
  onClose: () => void;
}

function formatPrice(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export default function ProductSearchDialog({
  open,
  onClose,
}: ProductSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const titleId = useId();
  const router = useRouter();
  const normalizedQuery = query.trim().replace(/\s+/g, " ");
  const canSearch = normalizedQuery.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() =>
      inputRef.current?.focus(),
    );

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), input:not([disabled])",
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleDocumentKeyDown);
      previouslyFocusedElement?.focus();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !canSearch) return;

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/products/search?q=${encodeURIComponent(normalizedQuery)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as ProductSearchResponse;
        if (!response.ok) {
          throw new Error(payload.error ?? "Products could not be searched.");
        }
        setResults(Array.isArray(payload.results) ? payload.results : []);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Products could not be searched.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [canSearch, normalizedQuery, open]);

  const chooseResult = (result: ProductSearchResult) => {
    onClose();
    router.push(result.productType === "BUNDLE" ? `/bundles/${result.slug}` : `/products/${result.slug}`);
  };

  return (
    <AnimatePresence
      onExitComplete={() => {
        setQuery("");
        setResults([]);
        setLoading(false);
        setError("");
        setActiveIndex(-1);
      }}
    >
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          aria-labelledby={titleId}
          aria-modal="true"
          className="fixed inset-0 z-80 overflow-y-auto bg-[#0b0907]/78 px-0 backdrop-blur-md sm:px-5 sm:py-8"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) onClose();
          }}
          role="dialog"
          transition={{ duration: 0.25 }}
        >
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col overflow-hidden bg-[#f4eee5] text-[#1c1814] shadow-[0_35px_100px_rgba(0,0,0,0.34)] sm:min-h-0 sm:rounded-sm"
            exit={{ opacity: 0, y: -24 }}
            initial={{ opacity: 0, y: -24 }}
            ref={panelRef}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-black/8 px-5 py-4 sm:px-8 sm:py-5">
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.32em] text-[#967c55]">
                  Find your fragrance
                </p>
                <Title
                  className="mt-1"
                  id={titleId}
                  text="Search the collection"
                  tone="ink"
                  variant="small"
                />
              </div>
              <button
                aria-label="Close product search"
                className="grid size-11 place-items-center rounded-full border border-black/10 text-black/65 transition-colors hover:bg-[#1c1814] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#967c55]"
                onClick={onClose}
                type="button"
              >
                <X aria-hidden="true" size={19} strokeWidth={1.5} />
              </button>
            </div>

            <div className="border-b border-black/8 px-5 py-5 sm:px-8 sm:py-7">
              <div className="flex items-center gap-3 border-b border-[#1c1814] pb-3 sm:gap-5 sm:pb-4">
                <Search
                  aria-hidden="true"
                  className="shrink-0 text-[#967c55]"
                  size={22}
                  strokeWidth={1.4}
                />
                <input
                  aria-activedescendant={
                    results[activeIndex]
                      ? `${listboxId}-option-${activeIndex}`
                      : undefined
                  }
                  aria-autocomplete="list"
                  aria-controls={listboxId}
                  aria-expanded={canSearch}
                  aria-label="Search products"
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent font-heading text-2xl text-[#1c1814] outline-none placeholder:text-black/28 sm:text-4xl"
                  inputMode="search"
                  maxLength={80}
                  onChange={(event) => {
                    const nextQuery = event.target.value;
                    setQuery(nextQuery);
                    setResults([]);
                    setLoading(
                      nextQuery.trim().replace(/\s+/g, " ").length >=
                        MIN_QUERY_LENGTH,
                    );
                    setError("");
                    setActiveIndex(-1);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" && results.length) {
                      event.preventDefault();
                      setActiveIndex((current) =>
                        current >= results.length - 1 ? 0 : current + 1,
                      );
                    }
                    if (event.key === "ArrowUp" && results.length) {
                      event.preventDefault();
                      setActiveIndex((current) =>
                        current <= 0 ? results.length - 1 : current - 1,
                      );
                    }
                    if (event.key === "Enter" && results[activeIndex]) {
                      event.preventDefault();
                      chooseResult(results[activeIndex]);
                    }
                  }}
                  placeholder="Name, brand or inspiration…"
                  ref={inputRef}
                  role="combobox"
                  type="text"
                  value={query}
                />
                {loading ? (
                  <LoaderCircle
                    aria-label="Searching products"
                    className="shrink-0 animate-spin text-[#967c55]"
                    size={21}
                  />
                ) : query ? (
                  <button
                    aria-label="Clear product search"
                    className="grid size-9 shrink-0 place-items-center rounded-full text-black/38 transition-colors hover:bg-black/5 hover:text-black"
                    onClick={() => {
                      setQuery("");
                      setResults([]);
                      setLoading(false);
                      setError("");
                      setActiveIndex(-1);
                    }}
                    type="button"
                  >
                    <X aria-hidden="true" size={16} />
                  </button>
                ) : null}
              </div>
              <p className="mt-3 text-[9px] uppercase tracking-[0.18em] text-black/38">
                Results update as you type · enter at least two characters
              </p>
            </div>

            <div
              className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:max-h-[62vh] sm:px-8 sm:py-6"
              id={listboxId}
              role="listbox"
            >
              <div aria-live="polite" className="sr-only" role="status">
                {loading
                  ? "Searching products"
                  : canSearch && !error
                    ? `${results.length} ${results.length === 1 ? "product" : "products"} found`
                    : error}
              </div>

              {!query ? (
                <div className="grid min-h-60 place-items-center py-12 text-center">
                  <div>
                    <span className="mx-auto grid size-14 place-items-center rounded-full border border-[#967c55]/25 bg-white/35 text-[#967c55]">
                      <Search aria-hidden="true" size={22} strokeWidth={1.3} />
                    </span>
                    <p className="mt-5 font-heading text-2xl text-[#1c1814]">
                      Discover something memorable
                    </p>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/48">
                      Search by fragrance name, house, inspiration, category or
                      SKU.
                    </p>
                  </div>
                </div>
              ) : !canSearch ? (
                <p className="py-16 text-center text-sm text-black/42">
                  Keep typing to begin your search.
                </p>
              ) : loading ? (
                <div className="divide-y divide-black/7" aria-hidden="true">
                  {[0, 1, 2].map((item) => (
                    <div className="flex animate-pulse gap-4 py-4" key={item}>
                      <span className="size-20 shrink-0 bg-black/6 sm:size-24" />
                      <span className="flex flex-1 flex-col justify-center gap-3">
                        <span className="h-3 w-24 bg-black/6" />
                        <span className="h-5 w-2/5 bg-black/8" />
                        <span className="h-3 w-36 bg-black/6" />
                      </span>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="py-16 text-center">
                  <p className="font-heading text-xl text-[#1c1814]">
                    Search is unavailable
                  </p>
                  <p className="mt-2 text-sm text-black/45">{error}</p>
                </div>
              ) : results.length ? (
                <div className="divide-y divide-black/8">
                  {results.map((result, index) => (
                    <Link
                      aria-selected={activeIndex === index}
                      className={`group grid grid-cols-[5rem_minmax(0,1fr)_auto] items-center gap-4 py-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#967c55] sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:gap-6 ${
                        activeIndex === index
                          ? "bg-white/45"
                          : "hover:bg-white/35"
                      }`}
                      href={result.productType === "BUNDLE" ? `/bundles/${result.slug}` : `/products/${result.slug}`}
                      id={`${listboxId}-option-${index}`}
                      key={result.id}
                      onClick={onClose}
                      onMouseEnter={() => setActiveIndex(index)}
                      role="option"
                    >
                      <span className="relative aspect-square overflow-hidden bg-white/38">
                        <Image
                          alt={result.imageAlt}
                          className="object-contain p-1.5 transition-transform duration-500 group-hover:scale-105"
                          fill
                          sizes="96px"
                          src={result.image}
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[8px] font-semibold uppercase tracking-[0.24em] text-[#967c55] sm:text-[9px]">
                          {result.category}
                        </span>
                        <span className="mt-1 block truncate font-heading text-lg text-[#1c1814] sm:text-2xl">
                          {result.name}
                        </span>
                        <span className="mt-1 block truncate text-xs text-black/42 sm:text-sm">
                          {result.inspiredBy
                            ? `Inspired by ${result.inspiredBy}`
                            : (result.brand ?? "N7 Cosmetics")}
                        </span>
                      </span>
                      <span className="flex items-center gap-3 pr-1 text-right">
                        <span className="hidden sm:block">
                          <span className="block text-sm font-medium text-[#1c1814]">
                            {formatPrice(result.pricePence)}
                          </span>
                          {result.compareAtPricePence ? (
                            <del className="mt-1 block text-xs text-black/32">
                              {formatPrice(result.compareAtPricePence)}
                            </del>
                          ) : null}
                        </span>
                        <ArrowRight
                          aria-hidden="true"
                          className="text-[#967c55] transition-transform duration-300 group-hover:translate-x-1"
                          size={18}
                          strokeWidth={1.4}
                        />
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <p className="font-heading text-2xl text-[#1c1814]">
                    No fragrances found
                  </p>
                  <p className="mt-2 text-sm text-black/45">
                    Try a product name, fragrance house or a shorter term.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
