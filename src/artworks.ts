import axios from 'axios'
import { artworkContinent, selectedContinent } from './continents'
import { normalizeSearch } from './artworkSearch'

export type Artwork = {
  id: number
  title: string
  image_id: string | null
  artist_display: string | null
  artist_title?: string | null
  date_display: string | null
  date_start: number | null
  artwork_type_title: string | null
  medium_display: string | null
  dimensions: string | null
  place_of_origin: string | null
  credit_line: string | null
  gallery_title: string | null
  department_title: string | null
  style_titles: string[]
}

export type ArtworkResponse<T> = {
  data: T
  config: { iiif_url: string }
}

const API_URL = 'https://api.artic.edu/api/v1/artworks'
const FIELDS = 'id,title,image_id,artist_display,artist_title,date_display,date_start,artwork_type_title,medium_display,dimensions,place_of_origin,credit_line,gallery_title,department_title,style_titles'

export const SEARCH_PAGE_SIZE = 20
export const SEARCH_RESULT_LIMIT = 10000
const COLLECTION_SIZE = 600
const COLLECTION_BATCH_SIZE = 100

export type SearchResponse = ArtworkResponse<Artwork[]> & {
  pagination: { total: number; current_page: number; total_pages: number }
}

export function searchPageNumber(params: URLSearchParams) {
  const page = Number(params.get('page') ?? '1')
  return Number.isSafeInteger(page) && page > 0 ? Math.min(page, SEARCH_RESULT_LIMIT / SEARCH_PAGE_SIZE) : 1
}

export function searchArtworks(params: URLSearchParams, signal: AbortSignal) {
  const search = (params.get('q') ?? '').trim()
  // Escape wildcard operators so typed * and ? remain literal characters.
  const pattern = `*${search.replace(/[\\*?]/g, '\\$&')}*`
  const property = params.get('sort') === 'year' ? 'date_start' : params.get('sort') === 'artist' ? 'artist_title.keyword' : 'title.keyword'
  const order = params.get('order') === 'desc' ? 'desc' : 'asc'
  return axios.get<SearchResponse>(`${API_URL}/search`, {
    params: { params: JSON.stringify({
      limit: SEARCH_PAGE_SIZE,
      page: searchPageNumber(params),
      fields: FIELDS.split(','),
      query: { wildcard: { 'title.keyword': { value: pattern, case_insensitive: true } } },
      sort: [
        { [property]: { order, missing: '_last' } },
        ...(property === 'title.keyword' ? [] : [{ 'title.keyword': 'asc' }]),
        { id: 'asc' },
      ],
    }) },
    signal,
    timeout: 20000,
  })
}

export async function loadSearchContext(params: URLSearchParams, id: number, signal: AbortSignal) {
  const index = Number(params.get('index'))
  const page = params.has('index') && Number.isSafeInteger(index) && index >= 0 && index < SEARCH_RESULT_LIMIT
    ? Math.floor(index / SEARCH_PAGE_SIZE) + 1 : searchPageNumber(params)
  const query = new URLSearchParams(params)
  query.set('page', String(page))
  const response = await searchArtworks(query, signal)
  const items = response.data.data
  const localIndex = items.findIndex((item) => item.id === id)
  if (localIndex < 0) return null
  const total = response.data.pagination.total
  const available = Math.min(total, SEARCH_RESULT_LIMIT)
  const position = (page - 1) * SEARCH_PAGE_SIZE + localIndex
  if (available < 2) return { position, total, previous: undefined, next: undefined }
  const previousIndex = (position - 1 + available) % available
  const nextIndex = (position + 1) % available
  async function neighbor(neighborIndex: number) {
    const neighborPage = Math.floor(neighborIndex / SEARCH_PAGE_SIZE) + 1
    if (neighborPage === page) return items[neighborIndex % SEARCH_PAGE_SIZE]
    const neighborParams = new URLSearchParams(query)
    neighborParams.set('page', String(neighborPage))
    const result = await searchArtworks(neighborParams, signal)
    return result.data.data[neighborIndex % SEARCH_PAGE_SIZE]
  }
  const [previous, next] = await Promise.all([neighbor(previousIndex), neighbor(nextIndex)])
  return { position, total, previous, next, previousIndex, nextIndex }
}

export async function loadCollection(signal: AbortSignal) {
  // Load image-bearing examples from each inhabited continent and unknown origins.
  const sampleOrigins = [
    ['China', 'Japan', 'India', 'Tibet', 'Nepal', 'Korea', 'Thailand'],
    ['Egypt', 'Nigeria', 'Mali', 'Ghana', 'Congo', 'Benin', 'South Africa'],
    ['France', 'Italy', 'Spain', 'Germany', 'England', 'Netherlands', 'Greece'],
    ['United States', 'Canada', 'Mexico', 'Guatemala', 'Chicago'],
    ['Peru', 'Brazil', 'Chile', 'Argentina', 'Colombia', 'Ecuador', 'Bolivia'],
    ['Australia', 'New Zealand', 'Papua New Guinea', 'Fiji', 'Solomon Islands', 'Samoa'],
  ]
  const sampleQueries = [
    ...sampleOrigins.map((origins) => ({
      bool: {
        should: origins.map((origin) => ({ match_phrase: { place_of_origin: origin } })),
        minimum_should_match: 1,
      },
    })),
    { bool: { must_not: { exists: { field: 'place_of_origin' } } } },
  ]
  const responses = await Promise.all(
    sampleQueries.map((sampleQuery) =>
      axios.get<ArtworkResponse<Artwork[]>>(`${API_URL}/search`, {
        params: {
          params: JSON.stringify({
            limit: COLLECTION_BATCH_SIZE,
            fields: FIELDS.split(','),
            query: {
              bool: {
                filter: [
                  sampleQuery,
                  { exists: { field: 'image_id' } },
                ],
              },
            },
          }),
        },
        signal,
        timeout: 20000,
      }),
    ),
  )
  // Interleave the groups so the 600-work limit preserves geographic variety.
  const collection = new Map<number, Artwork>()
  for (let index = 0; index < COLLECTION_BATCH_SIZE && collection.size < COLLECTION_SIZE; index++) {
    for (const response of responses) {
      const artwork = response.data.data[index]
      if (artwork) collection.set(artwork.id, artwork)
      if (collection.size === COLLECTION_SIZE) break
    }
  }
  // Fill any shortfall caused by small regional samples or duplicate records.
  let page = 1
  while (collection.size < COLLECTION_SIZE) {
    const response = await axios.get<SearchResponse>(`${API_URL}/search`, {
      params: { params: JSON.stringify({
        limit: COLLECTION_BATCH_SIZE,
        page,
        fields: FIELDS.split(','),
        query: { exists: { field: 'image_id' } },
        sort: [{ id: 'asc' }],
      }) },
      signal,
      timeout: 20000,
    })
    for (const artwork of response.data.data) {
      collection.set(artwork.id, artwork)
      if (collection.size === COLLECTION_SIZE) break
    }
    if (response.data.data.length === 0 || page >= response.data.pagination.total_pages) break
    page++
  }
  return {
    artworks: [...collection.values()],
    imageBase: responses[0].data.config.iiif_url,
  }
}

export function loadArtwork(id: string, signal: AbortSignal) {
  return axios.get<ArtworkResponse<Artwork>>(`${API_URL}/${id}`, {
    params: { fields: FIELDS },
    signal,
    timeout: 20000,
  })
}

export function selectArtworks(artworks: Artwork[], params: URLSearchParams, gallery: boolean) {
  const search = normalizeSearch(params.get('q') ?? '')
  const continent = selectedContinent(params)
  const sort = params.get('sort') ?? 'title'
  const descending = params.get('order') === 'desc'

  return artworks
    .filter((artwork) =>
      (!gallery || !continent || artworkContinent(artwork) === continent) &&
      [artwork.title, artwork.artist_display, artwork.date_display].some((value) => normalizeSearch(value ?? '').includes(search)),
    )
    .sort((a, b) => {
      let comparison: number
      if (sort === 'year') {
        if (a.date_start === null && b.date_start === null) return a.id - b.id
        if (a.date_start === null) return 1
        if (b.date_start === null) return -1
        comparison = a.date_start - b.date_start
      } else if (sort === 'artist') {
        const artistA = a.artist_display?.trim()
        const artistB = b.artist_display?.trim()
        if (!artistA && !artistB) return a.id - b.id
        if (!artistA) return 1
        if (!artistB) return -1
        comparison = artistA.localeCompare(artistB, 'en', { sensitivity: 'base' })
      } else {
        comparison = a.title.localeCompare(b.title, 'en', { sensitivity: 'base' })
      }
      return (descending ? -comparison : comparison) || a.id - b.id
    })
}
