// External script keeps the Pages fallback free of inline JavaScript.
const base = '/mp2/'
if (window.location.pathname.startsWith(base)) {
  const route = `/${window.location.pathname.slice(base.length)}${window.location.search}${window.location.hash}`
  const destination = new URL(base, window.location.origin)
  destination.searchParams.set('_route', route)
  window.location.replace(destination.href)
}
