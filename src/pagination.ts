export const BROWSE_PAGE_SIZE = 24

export function browsePageNumber(params: URLSearchParams, total: number) {
  const requested = Number(params.get('page') ?? '1')
  const pageCount = Math.max(1, Math.ceil(total / BROWSE_PAGE_SIZE))
  return Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, pageCount) : 1
}
