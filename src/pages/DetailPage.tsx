import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { loadArtwork, selectArtworks } from '../artworks'
import type { Artwork } from '../artworks'
import ArtworkImage from '../components/ArtworkImage'
import SearchNavigation from '../components/SearchNavigation'
import { artworkContinent, continentLabel } from '../continents'
import { BROWSE_PAGE_SIZE } from '../pagination'

type Props = { artworks: Artwork[]; imageBase: string; collectionLoading: boolean }

export default function DetailPage({ artworks, imageBase, collectionLoading }: Props) {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const knownArtwork = artworks.find((artwork) => String(artwork.id) === id)
  const [result, setResult] = useState<{ artwork?: Artwork; imageBase?: string; error?: string }>({})
  const validId = /^\d+$/.test(id) && Number(id) > 0 && Number.isSafeInteger(Number(id))

  useEffect(() => {
    if (knownArtwork || !validId) return
    const controller = new AbortController()
    loadArtwork(id, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setResult({ artwork: response.data.data, imageBase: response.data.config.iiif_url })
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const missing = axios.isAxiosError(error) && error.response?.status === 404
        setResult({ error: missing ? 'Artwork not found.' : 'Failed to load this artwork. Please refresh the page and try again.' })
      })
    return () => controller.abort()
  }, [id, knownArtwork, validId])

  const artwork = knownArtwork ?? result.artwork
  const gallery = params.get('view') === 'gallery'
  const searchPage = params.get('view') === 'search'
  const viewLabel = searchPage ? 'search' : gallery ? 'gallery' : 'list'
  const browseParams = new URLSearchParams(params)
  browseParams.delete('view')
  browseParams.delete('index')
  const browsePath = searchPage ? '/search' : gallery ? '/gallery' : '/'
  const backUrl = `${browsePath}${browseParams.size ? `?${browseParams}` : ''}`

  if (!validId || (result.error && !knownArtwork)) {
    return <section className="empty-state"><h1>{!validId ? 'Artwork not found' : 'Unable to display artwork'}</h1><p role="alert">{!validId ? 'Please check the artwork URL.' : result.error}</p><Link className="back-link" to={backUrl}>Back to {viewLabel}</Link></section>
  }
  if (!artwork) return <p className="status" role="status">Loading artwork...</p>

  const filtered = selectArtworks(artworks, params, gallery)
  const sequence = filtered.some((item) => item.id === artwork.id)
    ? filtered
    : [artwork, ...selectArtworks(artworks, new URLSearchParams(), false).filter((item) => item.id !== artwork.id)]
  const index = sequence.findIndex((item) => item.id === artwork.id)
  const previous = sequence[(index - 1 + sequence.length) % sequence.length]
  const next = sequence[(index + 1) % sequence.length]
  const detailsUrl = (item: Artwork) => {
    const context = new URLSearchParams(params)
    context.set('view', gallery ? 'gallery' : 'list')
    context.set('page', String(Math.floor(sequence.findIndex((entry) => entry.id === item.id) / BROWSE_PAGE_SIZE) + 1))
    return `/artworks/${item.id}?${context}`
  }

  return (
    <>
      <Link className="back-link" to={backUrl}>← Back to {viewLabel}</Link>
      <article className="artwork-detail">
        <ArtworkImage key={artwork.id} artwork={artwork} imageBase={knownArtwork ? imageBase : result.imageBase ?? imageBase} large />
        <div className="detail-info">
          <p className="eyebrow">{artwork.artwork_type_title ?? 'Artwork'}</p>
          <h1>{artwork.title}</h1>
          <dl>
            <div><dt>Artist</dt><dd>{artwork.artist_display || 'Unknown artist'}</dd></div>
            <div><dt>Date</dt><dd>{artwork.date_display || 'Unknown date'}</dd></div>
            <div><dt>Type</dt><dd>{artwork.artwork_type_title || 'Not specified'}</dd></div>
            <div><dt>Medium</dt><dd>{artwork.medium_display || 'Not specified'}</dd></div>
            <div><dt>Dimensions</dt><dd>{artwork.dimensions || 'Not specified'}</dd></div>
            <div><dt>Origin</dt><dd>{artwork.place_of_origin || 'Not specified'}</dd></div>
            <div><dt>Continent</dt><dd>{continentLabel(artworkContinent(artwork))}</dd></div>
            <div><dt>Gallery</dt><dd>{artwork.gallery_title || 'Not listed'}</dd></div>
            <div><dt>Credit</dt><dd>{artwork.credit_line || 'Not specified'}</dd></div>
          </dl>
        </div>
      </article>
      {searchPage ? <SearchNavigation key={`${id}?${params}`} id={artwork.id} paramsString={params.toString()} /> : <>
      <nav className="detail-navigation" aria-label="Browse artworks">
        {!collectionLoading && sequence.length > 1 ? <Link className="button-link" to={detailsUrl(previous)}>← Previous</Link> : <button type="button" disabled>← Previous</button>}
        <p>{collectionLoading ? 'Loading collection...' : `Artwork ${index + 1} of ${sequence.length}`}</p>
        {!collectionLoading && sequence.length > 1 ? <Link className="button-link" to={detailsUrl(next)}>Next →</Link> : <button type="button" disabled>Next →</button>}
      </nav>
      <p className="collection-note">Previous and Next follow your current results and loop at the ends.</p>
      </>}
    </>
  )
}
