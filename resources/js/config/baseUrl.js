// Konfigurasi path base untuk GitHub Pages vs Laravel
const isGhPages = import.meta.env.MODE === 'ghpages';

// Router basename: '/geo-alert' di GitHub Pages, '' di Laravel lokal/production
export const ROUTER_BASENAME = isGhPages && import.meta.env.BASE_URL
  ? import.meta.env.BASE_URL.replace(/\/$/, '')
  : '';

// Asset base untuk file statis di folder public (seperti logo dan gambar)
// Di GitHub Pages: '/geo-alert/'
// Di Laravel: '/' (karena aset publik ada di public/, bukan di public/build/)
export const ASSET_BASE = isGhPages && import.meta.env.BASE_URL
  ? (import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`)
  : '/';

