export interface MerchantSearchParams {
  q?: string | string[];
  filter?: string | string[];
  page?: string | string[];
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function merchantFilters(params: MerchantSearchParams): { query: string; filter: string; page: number } {
  const filter = first(params.filter);
  const page = first(params.page);
  return {
    query: first(params.q).slice(0, 190),
    filter: ["issues", "ready", "excluded"].includes(filter) ? filter : "all",
    page: /^\d+$/.test(page) ? Math.max(1, Math.min(100000, Number(page))) : 1,
  };
}
