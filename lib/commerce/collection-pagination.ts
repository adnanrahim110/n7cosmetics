export const collectionPageSize = 12;

export interface CollectionPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  offset: number;
  end: number;
}

export function collectionPageNumber(value: string | string[] | undefined): number {
  const input = Array.isArray(value) ? value[0] : value;
  if (!input || !/^\d+$/.test(input)) return 1;
  const page = Number(input);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function collectionPagination(totalCount: number, requestedPage = 1): CollectionPagination {
  const totalPages = Math.max(1, Math.ceil(totalCount / collectionPageSize));
  const page = Number.isSafeInteger(requestedPage)
    ? Math.min(totalPages, Math.max(1, requestedPage))
    : 1;
  const offset = (page - 1) * collectionPageSize;
  return { page, pageSize: collectionPageSize, totalCount, totalPages, offset, end: Math.min(offset + collectionPageSize, totalCount) };
}

export function collectionPageHref(pathname: string, page: number): string {
  return page === 1 ? pathname : `${pathname}?page=${page}`;
}
