import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { searchArtworks, searchPageNumber, SEARCH_PAGE_SIZE, SEARCH_RESULT_LIMIT } from '../artworks'
import type { SearchResponse } from '../artworks'
import ArtworkImage from '../components/ArtworkImage'

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const sort = ['title', 'year', 'artist'].includes(params.get('sort') ?? '') ? params.get('sort')! : 'title'
  const order = params.get('order') === 'desc' ? 'desc' : 'asc'
  const page = searchPageNumber(params)
  const requestParams = new URLSearchParams({ q: search.trim(), sort, order, page: String(page) })

  function updateParam(name: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    next.delete('page')
    next.delete('index')
    setParams(next, { replace: true })
  }

  function changePage(nextPage: number) {
    const next = new URLSearchParams(params)
    next.set('page', String(nextPage))
    setParams(next)
    window.scrollTo(0, 0)
  }

  return (
    <>
      <header className="collection-header"><h2 className="view-title">Search</h2></header>
      <section className="toolbar search-toolbar" aria-label="Search and sort artworks">
        <div className="search-control">
          <label htmlFor="artwork-search">Search artworks</label>
          <input id="artwork-search" type="search" placeholder="Search by title"
            value={search} onChange={(event) => updateParam('q', event.target.value)} />
        </div>
        <div>
          <label htmlFor="sort-property">Sort by</label>
          <select id="sort-property" value={sort} onChange={(event) => updateParam('sort', event.target.value)}>
            <option value="title">Title</option>
            <option value="year">Creation year</option>
            <option value="artist">Artist</option>
          </select>
        </div>
        <fieldset className="search-order">
          <legend>Order</legend>
          <label><input type="radio" name="search-order" checked={order === 'asc'} onChange={() => updateParam('order', 'asc')} />Ascending</label>
          <label><input type="radio" name="search-order" checked={order === 'desc'} onChange={() => updateParam('order', 'desc')} />Descending</label>
        </fieldset>
      </section>
      {search.trim() && <SearchResults key={requestParams.toString()} paramsString={requestParams.toString()} changePage={changePage} />}
    </>
  )
}

function SearchResults({ paramsString, changePage }: { paramsString: string; changePage: (page: number) => void }) {
  const [result, setResult] = useState<{ data?: SearchResponse; error?: string }>({})
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      searchArtworks(new URLSearchParams(paramsString), controller.signal)
        .then((response) => { if (!controller.signal.aborted) setResult({ data: response.data }) })
        .catch(() => {
          if (!controller.signal.aborted) setResult({ error: 'Failed to search artworks. Please try again.' })
        })
    }, 350)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [paramsString, attempt])

  if (result.error) return <div className="empty-state"><p className="error" role="alert">{result.error}</p><button type="button" onClick={() => { setResult({}); setAttempt(attempt + 1) }}>Try again</button></div>
  if (!result.data) return <p className="status" role="status">Searching artworks...</p>

  const { data: artworks, pagination, config } = result.data
  const page = pagination.current_page
  const offset = (page - 1) * SEARCH_PAGE_SIZE
  const total = pagination.total
  const available = Math.min(total, SEARCH_RESULT_LIMIT)
  const totalPages = Math.ceil(available / SEARCH_PAGE_SIZE)
  const resultsLabel = artworks.length ? `${offset + 1}–${offset + artworks.length} of ${total.toLocaleString('en-US')} matching artworks` : `${total.toLocaleString('en-US')} matching artworks`

  return (
    <>
      <p className="result-count" role="status">{resultsLabel}</p>
      {artworks.length === 0 ? <div className="empty-state">
        <h2>{total ? 'No results on this page' : 'No artworks found'}</h2>
        <p>{total ? 'Return to the first page of results.' : 'Try another title.'}</p>
        {total > 0 && <button type="button" onClick={() => changePage(1)}>First page</button>}
      </div> : <ul className="artwork-list search-results">
        {artworks.map((artwork, index) => {
          const context = new URLSearchParams(paramsString)
          context.set('view', 'search')
          context.set('index', String(offset + index))
          return <li key={artwork.id}>
            <Link className="artwork-row" to={`/artworks/${artwork.id}?${context}`}>
              <ArtworkImage artwork={artwork} imageBase={config.iiif_url} />
              <div className="artwork-info">
                <h2>{artwork.title}</h2>
                <dl>
                  <div><dt>Artist</dt><dd>{artwork.artist_display || 'Unknown artist'}</dd></div>
                  <div><dt>Date</dt><dd>{artwork.date_display || 'Unknown date'}</dd></div>
                </dl>
              </div>
            </Link>
          </li>
        })}
      </ul>}
      {totalPages > 1 && <nav className="search-pagination" aria-label="Search result pages">
        <button type="button" disabled={page <= 1} onClick={() => changePage(page - 1)}>← Previous page</button>
        <p>Page {page} of {totalPages}</p>
        <button type="button" disabled={page >= totalPages} onClick={() => changePage(page + 1)}>Next page →</button>
      </nav>}
      {total > SEARCH_RESULT_LIMIT && <p className="collection-note">Refine your title to browse beyond the first 10,000 matches.</p>}
      <p className="collection-note">Search covers the museum’s full collection. Works without images are included.</p>
    </>
  )
}
