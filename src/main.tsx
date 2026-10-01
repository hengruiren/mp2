import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'

// GitHub Pages sends direct SPA URLs through public/404.html.
const pageUrl = new URL(window.location.href)
const originalRoute = pageUrl.searchParams.get('_route')
if (originalRoute?.startsWith('/') && !originalRoute.startsWith('//')) {
  const restored = new URL(`${import.meta.env.BASE_URL}${originalRoute.slice(1)}`, window.location.origin)
  if (restored.pathname.startsWith(import.meta.env.BASE_URL)) {
    window.history.replaceState(null, '', `${restored.pathname}${restored.search}${restored.hash}`)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
