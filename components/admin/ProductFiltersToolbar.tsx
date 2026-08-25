"use client";

import { ChevronDown, LoaderCircle, Search, SlidersHorizontal, X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  hasActiveProductFilters,
  productListFilterQuery,
  type ProductAudienceFilter,
  type ProductFeaturedFilter,
  type ProductListFilters,
  type ProductStatusFilter,
  type ProductTypeFilter,
} from "@/lib/admin/product-list-filters";

interface FilterOption {
  id: string;
  name: string;
  status: string;
}

interface ProductFiltersToolbarProps {
  initialFilters: ProductListFilters;
  categories: FilterOption[];
  collections: FilterOption[];
  resultCount: number;
}

interface FilterSelectProps {
  label: string;
  value: string;
  widthClass: string;
  children: ReactNode;
  onChange: (value: string) => void;
  visibleLabel?: boolean;
}

const filterParamNames = ["q", "status", "type", "audience", "category", "collection", "featured"] as const;
const debounceMilliseconds = 400;
const emptyFilters: ProductListFilters = { q: "", status: "", productType: "", audience: "", categoryId: "", collectionId: "", featured: "" };

function FilterSelect({ label, value, widthClass, children, onChange, visibleLabel = false }: FilterSelectProps) {
  return (
    <label className={`shrink-0 ${widthClass}`}>
      <span className={visibleLabel ? "mb-1.5 block text-xs font-semibold text-zinc-700" : "sr-only"}>{label}</span>
      <span className="relative block">
        <select
          aria-label={label}
          className="min-h-10 w-full appearance-none rounded-lg border border-zinc-300 bg-white py-2 pl-3 pr-8 text-sm text-zinc-700 outline-none transition hover:border-zinc-400 focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {children}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
      </span>
    </label>
  );
}

function optionLabel(option: FilterOption, activeStatus: string): string {
  return option.status === activeStatus ? option.name : `${option.name} (${option.status.toLowerCase()})`;
}

function activeFilterCount(filters: ProductListFilters): number {
  return [filters.status, filters.categoryId, filters.collectionId, filters.productType, filters.audience, filters.featured].filter(Boolean).length;
}

export default function ProductFiltersToolbar({ initialFilters, categories, collections, resultCount }: ProductFiltersToolbarProps) {
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);
  const [advancedFilters, setAdvancedFilters] = useState(initialFilters);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advancedDialog = useRef<HTMLDialogElement>(null);
  const isWorking = isDebouncing || isPending;
  const appliedFilterCount = activeFilterCount(filters);

  useEffect(() => () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  }, []);

  useEffect(() => {
    const dialog = advancedDialog.current;
    if (!dialog) return;
    if (advancedOpen && !dialog.open) dialog.showModal();
    if (!advancedOpen && dialog.open) dialog.close();
  }, [advancedOpen]);

  function cancelDebounce() {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = null;
    setIsDebouncing(false);
  }

  function navigate(nextFilters: ProductListFilters) {
    const nextQuery = productListFilterQuery({ ...nextFilters, q: nextFilters.q.trim() });
    const params = new URLSearchParams(window.location.search);
    for (const name of filterParamNames) params.delete(name);
    for (const [name, value] of Object.entries(nextQuery)) if (value) params.set(name, value);
    params.delete("page");
    params.delete("toast");
    const serialized = params.toString();
    const href = `/admin/products${serialized ? `?${serialized}` : ""}`;
    if (href === `${window.location.pathname}${window.location.search}`) return;
    startTransition(() => router.replace(href, { scroll: false }));
  }

  function applyFilter<Key extends keyof ProductListFilters>(name: Key, value: ProductListFilters[Key]) {
    cancelDebounce();
    const nextFilters = { ...filters, [name]: value };
    setFilters(nextFilters);
    setAdvancedFilters(nextFilters);
    navigate(nextFilters);
  }

  function handleSearch(value: string) {
    const nextFilters = { ...filters, q: value };
    setFilters(nextFilters);
    setAdvancedFilters(nextFilters);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setIsDebouncing(true);
    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null;
      setIsDebouncing(false);
      navigate({ ...nextFilters, q: value.trim() });
    }, debounceMilliseconds);
  }

  function applySearchImmediately() {
    cancelDebounce();
    const nextFilters = { ...filters, q: filters.q.trim() };
    setFilters(nextFilters);
    setAdvancedFilters(nextFilters);
    navigate(nextFilters);
  }

  function clearFilters() {
    cancelDebounce();
    setFilters(emptyFilters);
    setAdvancedFilters(emptyFilters);
    navigate(emptyFilters);
  }

  function openAdvancedFilters() {
    setAdvancedFilters(filters);
    setAdvancedOpen(true);
  }

  function closeAdvancedFilters() {
    setAdvancedFilters(filters);
    setAdvancedOpen(false);
  }

  function updateAdvancedFilter<Key extends keyof ProductListFilters>(name: Key, value: ProductListFilters[Key]) {
    setAdvancedFilters((current) => ({ ...current, [name]: value }));
  }

  function resetAdvancedFilters() {
    setAdvancedFilters({ ...emptyFilters, q: advancedFilters.q });
  }

  function applyAdvancedFilters() {
    cancelDebounce();
    setFilters(advancedFilters);
    setAdvancedOpen(false);
    navigate(advancedFilters);
  }

  return (
    <>
      <div aria-busy={isWorking} className="mt-7 rounded-xl border border-zinc-200 bg-white shadow-sm" role="search">
        <div className="flex min-w-0 flex-nowrap items-center gap-2 p-3">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search products</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={17} />
            <input
              aria-label="Search products"
              className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-9 text-sm outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
              maxLength={100}
              onChange={(event) => handleSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applySearchImmediately();
                } else if (event.key === "Escape" && filters.q) {
                  event.preventDefault();
                  applyFilter("q", "");
                }
              }}
              placeholder="Search name, brand, category, or collection"
              type="search"
              value={filters.q}
            />
            {isWorking ? <LoaderCircle aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-amber-700" size={16} /> : null}
          </label>

          <FilterSelect label="Filter by status" onChange={(value) => applyFilter("status", value as ProductStatusFilter)} value={filters.status} widthClass="hidden w-36 md:block">
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </FilterSelect>
          <FilterSelect label="Filter by category" onChange={(value) => applyFilter("categoryId", value)} value={filters.categoryId} widthClass="hidden w-44 lg:block">
            <option value="">All categories</option>
            {categories.map((option) => <option key={option.id} value={option.id}>{optionLabel(option, "ACTIVE")}</option>)}
          </FilterSelect>
          <FilterSelect label="Filter by collection" onChange={(value) => applyFilter("collectionId", value)} value={filters.collectionId} widthClass="hidden w-44 xl:block">
            <option value="">All collections</option>
            {collections.map((option) => <option key={option.id} value={option.id}>{optionLabel(option, "ACTIVE")}</option>)}
          </FilterSelect>
          <div className="hidden w-24 shrink-0 items-center justify-center text-xs text-zinc-500 2xl:flex" aria-live="polite">
            {isWorking ? <span className="inline-flex items-center gap-1.5"><LoaderCircle aria-hidden="true" className="animate-spin text-amber-700" size={14} />Updating</span> : <span>{resultCount} {resultCount === 1 ? "result" : "results"}</span>}
          </div>
          <button
            aria-expanded={advancedOpen}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-amber-100"
            onClick={openAdvancedFilters}
            type="button"
          >
            <SlidersHorizontal aria-hidden="true" size={16} />
            <span className="hidden sm:inline">Advanced filters</span><span className="sm:hidden">Filters</span>
            {appliedFilterCount ? <span className="grid size-5 place-items-center rounded-full bg-zinc-950 text-[10px] font-bold text-white">{appliedFilterCount}</span> : null}
          </button>
          <button
            aria-label="Clear all product filters"
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-zinc-300 bg-white text-zinc-500 transition hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-800 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-300 disabled:hover:bg-white"
            disabled={!hasActiveProductFilters(filters)}
            onClick={clearFilters}
            title="Clear all filters"
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>
      </div>

      <dialog
        aria-labelledby="advanced-product-filters-title"
        className="fixed inset-y-0 right-0 left-auto m-0 h-dvh w-full max-w-md overflow-hidden border-0 bg-white p-0 text-zinc-950 shadow-2xl backdrop:bg-zinc-950/45 backdrop:backdrop-blur-[2px]"
        onCancel={(event) => {
          event.preventDefault();
          closeAdvancedFilters();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeAdvancedFilters();
        }}
        onClose={() => setAdvancedOpen(false)}
        ref={advancedDialog}
      >
        <div className="flex h-full flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Product catalog</p>
              <h2 className="mt-1 text-lg font-semibold" id="advanced-product-filters-title">Advanced filters</h2>
              <p className="mt-1 text-sm leading-5 text-zinc-500">Choose any combination, then apply everything in one update.</p>
            </div>
            <button aria-label="Close advanced filters" className="grid size-9 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" onClick={closeAdvancedFilters} type="button"><X size={18} /></button>
          </header>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FilterSelect label="Status" onChange={(value) => updateAdvancedFilter("status", value as ProductStatusFilter)} value={advancedFilters.status} visibleLabel widthClass="w-full">
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </FilterSelect>
              <FilterSelect label="Product type" onChange={(value) => updateAdvancedFilter("productType", value as ProductTypeFilter)} value={advancedFilters.productType} visibleLabel widthClass="w-full">
                <option value="">All types</option>
                <option value="STANDARD">Standard</option>
                <option value="BUNDLE">Bundle</option>
              </FilterSelect>
            </div>
            <FilterSelect label="Category" onChange={(value) => updateAdvancedFilter("categoryId", value)} value={advancedFilters.categoryId} visibleLabel widthClass="w-full">
              <option value="">All categories</option>
              {categories.map((option) => <option key={option.id} value={option.id}>{optionLabel(option, "ACTIVE")}</option>)}
            </FilterSelect>
            <FilterSelect label="Collection" onChange={(value) => updateAdvancedFilter("collectionId", value)} value={advancedFilters.collectionId} visibleLabel widthClass="w-full">
              <option value="">All collections</option>
              {collections.map((option) => <option key={option.id} value={option.id}>{optionLabel(option, "ACTIVE")}</option>)}
            </FilterSelect>
            <div className="grid gap-4 sm:grid-cols-2">
              <FilterSelect label="Audience" onChange={(value) => updateAdvancedFilter("audience", value as ProductAudienceFilter)} value={advancedFilters.audience} visibleLabel widthClass="w-full">
                <option value="">All audiences</option>
                <option value="MEN">Men</option>
                <option value="WOMEN">Women</option>
                <option value="UNISEX">Unisex</option>
                <option value="UNSPECIFIED">Unspecified</option>
              </FilterSelect>
              <FilterSelect label="Featured state" onChange={(value) => updateAdvancedFilter("featured", value as ProductFeaturedFilter)} value={advancedFilters.featured} visibleLabel widthClass="w-full">
                <option value="">All products</option>
                <option value="yes">Featured</option>
                <option value="no">Not featured</option>
              </FilterSelect>
            </div>
          </div>

          <footer className="border-t border-zinc-200 bg-zinc-50 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <button className="text-sm font-semibold text-zinc-600 hover:text-zinc-950 disabled:cursor-not-allowed disabled:text-zinc-300" disabled={!activeFilterCount(advancedFilters)} onClick={resetAdvancedFilters} type="button">Reset filters</button>
              <div className="flex items-center gap-2">
                <button className="min-h-10 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-100" onClick={closeAdvancedFilters} type="button">Cancel</button>
                <button className="min-h-10 rounded-lg bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800" onClick={applyAdvancedFilters} type="button">Apply filters{activeFilterCount(advancedFilters) ? ` (${activeFilterCount(advancedFilters)})` : ""}</button>
              </div>
            </div>
          </footer>
        </div>
      </dialog>
    </>
  );
}
