import { useEffect, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { loadCollection } from './artworks'
import type { Artwork } from './artworks'
import BrowsePage from './pages/BrowsePage'
import DetailPage from './pages/DetailPage'
import SearchPage from './pages/SearchPage'
import './App.css'

function App() {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [imageBase, setImageBase] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    const controller = new AbortController()
    loadCollection(controller.signal)
      .then((collection) => {
        if (controller.signal.aborted) return
        setArtworks(collection.artworks)
        setImageBase(collection.imageBase)
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('Failed to load artworks. Please refresh the page and try again.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  const browseProps = { artworks, imageBase, loading, error }
  const collectionView = ['/', '/search', '/gallery'].includes(pathname)

  return (
    <main className="collection">
      {collectionView && <header className="museum-header"><h1>Art Institute of Chicago</h1></header>}
      <nav className="view-navigation" aria-label="Collection views">
        <NavLink to="/search">Search</NavLink>
        <NavLink to="/" end>List</NavLink>
        <NavLink to="/gallery">Gallery</NavLink>
      </nav>
      <Routes>
        <Route path="/search" element={<SearchPage />} />
        <Route path="/" element={<BrowsePage {...browseProps} />} />
        <Route path="/gallery" element={<BrowsePage {...browseProps} gallery />} />
        <Route path="/artworks/:id" element={<DetailPage key={pathname} artworks={artworks} imageBase={imageBase} collectionLoading={loading} />} />
        <Route path="*" element={<section className="empty-state"><h1>Page not found</h1><Link to="/">Back to the collection</Link></section>} />
      </Routes>
      <footer>Collection data and images from the Art Institute of Chicago.</footer>
    </main>
  )
}

export default App
