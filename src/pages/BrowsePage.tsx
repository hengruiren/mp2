import { Link, useSearchParams } from 'react-router-dom'
import { selectArtworks } from '../artworks'
import type { Artwork } from '../artworks'
import ArtworkImage from '../components/ArtworkImage'
import CollectionPagination from '../components/CollectionPagination'
import { BROWSE_PAGE_SIZE, browsePageNumber } from '../pagination'
import { artworkContinent, continentLabel, CONTINENTS, selectedContinent } from '../continents'

type Props = {
  artworks: Artwork[]
  imageBase: string
  loading: boolean
  error: string
  gallery?: boolean
}

export default function BrowsePage({ artworks, imageBase, loading, error, gallery = false }: Props) {
  const [params, setParams] = useSearchParams()
  const visibleArtworks = selectArtworks(artworks, params, gallery)
  const continent = selectedContinent(params)
  const sort = params.get('sort') ?? 'title'
  const order = params.get('order') === 'desc' ? 'desc' : 'asc'
  const page = browsePageNumber(params, visibleArtworks.length)
  const pageCount = Math.ceil(visibleArtworks.length / BROWSE_PAGE_SIZE)
  const offset = (page - 1) * BROWSE_PAGE_SIZE
  const pageArtworks = visibleArtworks.slice(offset, offset + BROWSE_PAGE_SIZE)

  function updateParam(name: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    next.delete('page')
    setParams(next, { replace: true })
  }

  function chooseContinent(selection: string) {
    const next = new URLSearchParams(params)
    // set replaces the previous selection, including repeated URL parameters.
    if (selection) next.set('continent', selection)
    else next.delete('continent')
    next.delete('type')
    next.delete('theme')
    next.delete('page')
    setParams(next, { replace: true })
  }

  function detailsUrl(id: number) {
    const context = new URLSearchParams(params)
    context.set('view', gallery ? 'gallery' : 'list')
    context.set('page', String(page))
    return `/artworks/${id}?${context}`
  }

  function changePage(nextPage: number) {
    const next = new URLSearchParams(params)
    next.set('page', String(nextPage))
    setParams(next)
    window.scrollTo(0, 0)
  }

  return (
    <>
      <header className="collection-header">
        <h2 className="view-title">{gallery ? 'Gallery' : 'List'}</h2>
        <p className="intro">{gallery ? 'Explore art from around the world. Select a work to look closer.' : 'Discover artworks, their artists, and the stories of their time.'}</p>
      </header>

      <section className="toolbar" aria-label="Search and sort artworks">
        <div className="search-control">
          <label htmlFor="artwork-search">Search artworks</label>
          <input id="artwork-search" type="search" placeholder="Search by title, artist, or date"
            value={params.get('q') ?? ''} onChange={(event) => updateParam('q', event.target.value)} />
        </div>
        <div>
          <label htmlFor="sort-property">Sort by</label>
          <select id="sort-property" value={['title', 'year', 'artist'].includes(sort) ? sort : 'title'} onChange={(event) => updateParam('sort', event.target.value)}>
            <option value="title">Title</option>
            <option value="year">Creation year</option>
            <option value="artist">Artist</option>
          </select>
        </div>
        <div>
          <label htmlFor="sort-order">Order</label>
          <select id="sort-order" value={order} onChange={(event) => updateParam('order', event.target.value)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </section>

      {gallery && !loading && !error && (
        <fieldset className="continent-filters">
          <legend>Explore by continent</legend>
          <button className="filter-button" type="button" aria-pressed={!continent}
            onClick={() => chooseContinent('')}>All continents</button>
          {CONTINENTS.map((item) => (
            <button className="filter-button" type="button" key={item.id}
              aria-pressed={continent === item.id}
              onClick={() => chooseContinent(item.id)}>{item.label}</button>
          ))}
        </fieldset>
      )}

      {loading && <p className="status" role="status">Loading artworks...</p>}
      {error && <p className="status error" role="alert">{error}</p>}
      {!loading && !error && (
        <>
          <div className="results-summary" role="status">
            <p className="result-count">{visibleArtworks.length} of {artworks.length} loaded artworks</p>
            {pageArtworks.length > 0 && <p className="page-range">Showing {offset + 1}–{offset + pageArtworks.length}</p>}
          </div>
          <CollectionPagination page={page} pageCount={pageCount} onChange={changePage} placement="top" />
          {visibleArtworks.length === 0 ? (
            <div className="empty-state">
              <h2>No artworks found</h2>
              <p>{gallery ? 'Try another search or continent.' : 'Try another search.'}</p>
              <button type="button" onClick={() => setParams({}, { replace: true })}>Clear filters</button>
            </div>
          ) : (
            <ul className={gallery ? 'gallery-grid' : 'artwork-list'}>
              {pageArtworks.map((artwork) => (
                <li key={artwork.id}>
                  <Link className={gallery ? 'gallery-card' : 'artwork-row'} to={detailsUrl(artwork.id)}>
                    <ArtworkImage artwork={artwork} imageBase={imageBase} />
                    <div className="artwork-info">
                      {gallery && <p className="artwork-type">{artwork.artwork_type_title ?? 'Other'}</p>}
                      {gallery && <p className="artwork-origin">{artwork.place_of_origin || 'Origin not specified'}</p>}
                      <h2 title={artwork.title}>{artwork.title}</h2>
                      <dl>
                        <div><dt>Artist</dt><dd title={artwork.artist_display || 'Unknown artist'}>{artwork.artist_display || 'Unknown artist'}</dd></div>
                        <div><dt>Date</dt><dd>{artwork.date_display || 'Unknown date'}</dd></div>
                      </dl>
                      {gallery && <div className="continent-tag"><span>{continentLabel(artworkContinent(artwork))}</span></div>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <CollectionPagination page={page} pageCount={pageCount} onChange={changePage} placement="bottom" />
          <p className="collection-note">Search, filters, and sorting cover the entire loaded collection. Year sorting uses the beginning of each work’s date range.</p>
          {gallery && <p className="collection-note">Continents are based on each work’s recorded place of origin.</p>}
        </>
      )}
    </>
  )
}
