type Props = {
  page: number
  pageCount: number
  onChange: (page: number) => void
  placement: 'top' | 'bottom'
}

export default function CollectionPagination({ page, pageCount, onChange, placement }: Props) {
  if (pageCount <= 1) return null

  return (
    <nav className="collection-pagination" aria-label={`Collection pages (${placement})`}>
      <div className="page-buttons">
        <button type="button" disabled={page === 1} onClick={() => onChange(1)}>First</button>
        <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)}>← Previous</button>
      </div>
      <p>Page {page} of {pageCount}</p>
      <div className="page-buttons">
        <button type="button" disabled={page === pageCount} onClick={() => onChange(page + 1)}>Next →</button>
        <button type="button" disabled={page === pageCount} onClick={() => onChange(pageCount)}>Last</button>
      </div>
    </nav>
  )
}
