import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadSearchContext, SEARCH_PAGE_SIZE, SEARCH_RESULT_LIMIT } from '../artworks'
import type { Artwork } from '../artworks'

type Context = Awaited<ReturnType<typeof loadSearchContext>>

export default function SearchNavigation({ id, paramsString }: { id: number; paramsString: string }) {
  const [result, setResult] = useState<{ context?: Context; error?: boolean }>({})
  useEffect(() => {
    const controller = new AbortController()
    loadSearchContext(new URLSearchParams(paramsString), id, controller.signal)
      .then((context) => { if (!controller.signal.aborted) setResult({ context }) })
      .catch(() => { if (!controller.signal.aborted) setResult({ error: true }) })
    return () => controller.abort()
  }, [id, paramsString])

  const context = result.context
  function detailsUrl(artwork: Artwork, index: number) {
    const params = new URLSearchParams(paramsString)
    params.set('index', String(index))
    params.set('page', String(Math.floor(index / SEARCH_PAGE_SIZE) + 1))
    return `/artworks/${artwork.id}?${params}`
  }
  const loading = result.context === undefined && !result.error
  return (
    <>
      <nav className="detail-navigation" aria-label="Browse artworks">
        {context?.previous ? <Link className="button-link" to={detailsUrl(context.previous, context.previousIndex!)}>← Previous</Link> : <button type="button" disabled>← Previous</button>}
        <p>{loading ? 'Loading search results...' : context ? `Artwork ${context.position + 1} of ${context.total.toLocaleString('en-US')}` : 'Search navigation unavailable'}</p>
        {context?.next ? <Link className="button-link" to={detailsUrl(context.next, context.nextIndex!)}>Next →</Link> : <button type="button" disabled>Next →</button>}
      </nav>
      <p className="collection-note">{result.error || result.context === null ? 'Return to search to browse matching works.' : context && context.total > SEARCH_RESULT_LIMIT ? 'Previous and Next follow the first 10,000 matches. Refine your search to browse further.' : 'Previous and Next follow your search results and loop at the ends.'}</p>
    </>
  )
}
