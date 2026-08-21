"use client";

import {
  ArrowUpDown,
  PoundSterling,
  RotateCcw,
  Search,
  Tags,
  X,
} from "lucide-react";
import { useMemo } from "react";
import type { CollectionPageContent } from "../../content/collections";
import CustomSelect, { type CustomSelectOption } from "../ui/CustomSelect";
import {
  priceBandLabels,
  productMatchesPriceBand,
  type CollectionDesign,
  type PriceBand,
  type SortOption,
} from "./collection-config";

interface CollectionControlsProps {
  collection: CollectionPageContent;
  design: CollectionDesign;
  categories: string[];
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  selectedPriceBands: PriceBand[];
  setSelectedPriceBands: (priceBands: PriceBand[]) => void;
  query: string;
  setQuery: (query: string) => void;
  sortBy: SortOption;
  setSortBy: (sortBy: SortOption) => void;
  onReset: () => void;
}

const sortOptions: CustomSelectOption[] = [
  {
    value: "featured",
    label: "Curated order",
    description: "The house edit",
  },
  {
    value: "rating",
    label: "Highest rated",
    description: "Guest favourites first",
  },
  {
    value: "price-low",
    label: "Price ascending",
    description: "Lowest price first",
  },
  {
    value: "price-high",
    label: "Price descending",
    description: "Highest price first",
  },
  { value: "name", label: "Name A — Z", description: "Alphabetical" },
];

export default function CollectionControls({
  collection,
  design,
  categories,
  selectedCategories,
  setSelectedCategories,
  selectedPriceBands,
  setSelectedPriceBands,
  query,
  setQuery,
  sortBy,
  setSortBy,
  onReset,
}: CollectionControlsProps) {
  const categoryOptions = useMemo<CustomSelectOption[]>(
    () =>
      categories.map((category) => ({
        value: category,
        label: category,
        description: `${collection.products.filter((product) => product.category === category).length} compositions`,
      })),
    [categories, collection.products],
  );

  const priceOptions = useMemo<CustomSelectOption[]>(
    () =>
      (Object.entries(priceBandLabels) as [PriceBand, string][]).map(
        ([value, label]) => ({
          value,
          label,
          description: `${collection.products.filter((product) => productMatchesPriceBand(product.price, value)).length} compositions`,
        }),
      ),
    [collection.products],
  );

  const activeFilterCount =
    selectedCategories.length +
    selectedPriceBands.length +
    (query.trim() ? 1 : 0);
  const hasCustomOrder = sortBy !== "featured";
  const canReset = activeFilterCount > 0 || hasCustomOrder;

  return (
    <div className="relative z-40 mb-16 border-y border-[#80664d]/18 bg-[#d9cdbd]/32 p-1.5 shadow-[0_14px_38px_rgba(54,39,26,0.07)]">
      <div className="grid gap-1 md:grid-cols-2 xl:grid-cols-[minmax(17rem,1.35fr)_minmax(12rem,1fr)_minmax(11rem,0.82fr)_minmax(12rem,0.95fr)_3.5rem]">
        <div className="group/search relative flex min-h-14 min-w-0 items-center gap-2.5 overflow-hidden border border-[#8d755c]/18 bg-[#faf6ef]/88 px-3.5 py-2 transition-all duration-400 hover:border-[#9d7d5a]/48 hover:bg-[#fffaf4] focus-within:border-[#9d7d5a]/58 focus-within:bg-[#fffaf4] focus-within:shadow-[0_14px_34px_rgba(44,31,20,0.11)] md:col-span-2 xl:col-span-1">
          <span
            className={`absolute inset-y-0 left-0 w-0.75 origin-bottom transition-transform duration-400 ${query ? "scale-y-100" : "scale-y-0 group-hover/search:scale-y-100 group-focus-within/search:scale-y-100"}`}
            style={{ backgroundColor: design.accent }}
          />
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-full border transition-all duration-400 ${query ? "border-transparent text-white" : "border-[#745d48]/24 text-[#5f4b39]/72 group-hover/search:border-[#745d48]/42 group-hover/search:text-[#382a20] group-focus-within/search:border-[#745d48]/42 group-focus-within/search:text-[#382a20]"}`}
            style={query ? { backgroundColor: design.accent } : undefined}
          >
            <Search className="size-3.5" strokeWidth={1.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="mb-0.5 block text-[7px] font-semibold uppercase tracking-[0.24em] text-[#765f4b]/68">
              Search
            </span>
            <input
              type="search"
              aria-label="Search this collection"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, house or collection"
              className="w-full bg-transparent text-[10px] font-semibold uppercase tracking-[0.12em] text-[#211a15] outline-none placeholder:font-medium placeholder:text-[#3f3126]/76"
            />
          </span>
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear product search"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-black/38 transition-colors hover:bg-black/5.5 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <CustomSelect
          label="Scent family"
          options={categoryOptions}
          selectedValues={selectedCategories}
          onChange={setSelectedCategories}
          placeholder="All families"
          multiple
          searchable={categoryOptions.length > 6}
          searchPlaceholder="Search scent families"
          accentColor={design.accent}
          icon={Tags}
          compact
        />

        <CustomSelect
          label="Price"
          options={priceOptions}
          selectedValues={selectedPriceBands}
          onChange={(values) => setSelectedPriceBands(values as PriceBand[])}
          placeholder="All price points"
          multiple
          accentColor={design.accent}
          icon={PoundSterling}
          compact
        />

        <CustomSelect
          label="Sort by"
          options={sortOptions}
          selectedValues={[sortBy]}
          onChange={(values) => {
            const selectedSort = values[0] as SortOption | undefined;
            if (selectedSort) setSortBy(selectedSort);
          }}
          placeholder="Curated order"
          accentColor={design.accent}
          icon={ArrowUpDown}
          compact
        />

        <button
          type="button"
          disabled={!canReset}
          onClick={onReset}
          aria-label="Clear all filters and sorting"
          className="group/reset flex min-h-14 items-center justify-center border border-[#8d755c]/18 bg-[#f4ede3]/80 text-[#5f4b39]/64 transition-all duration-400 hover:border-[#9d7d5a]/48 hover:bg-[#ead8c2] hover:text-[#2c2118] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6e5237] disabled:cursor-not-allowed disabled:border-[#8d755c]/10 disabled:bg-[#f4ede3]/42 disabled:text-[#5f4b39]/22 disabled:hover:border-[#8d755c]/10 disabled:hover:bg-[#f4ede3]/42 disabled:hover:text-[#5f4b39]/22 md:col-span-2 xl:col-span-1"
        >
          <RotateCcw
            className="size-4 transition-transform duration-500 group-hover/reset:-rotate-90"
            strokeWidth={1.5}
          />
          <span className="ml-3 text-[8px] font-semibold uppercase tracking-[0.2em] xl:sr-only">
            Reset
          </span>
        </button>
      </div>
    </div>
  );
}
