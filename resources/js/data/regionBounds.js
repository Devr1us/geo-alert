/**
 * regionBounds.js - Sumber Kebenaran Tunggal Batas Wilayah & Slug Nusantara
 * Digunakan bersama oleh StoriesHero (beranda) dan MapPage (/peta).
 */

export const REGION_BOUNDS = {
  sumatera: {
    slug: 'sumatera',
    name: 'Sumatera',
    bounds: [[-6.2, 95.0], [5.95, 106.2]],
    center: [-0.5, 101.5],
    svgCenter: { x: 520, y: 410 },
    zoomScale: 2.2,
  },
  jawa: {
    slug: 'jawa',
    name: 'Jawa',
    bounds: [[-8.9, 105.0], [-5.8, 114.7]],
    center: [-7.4, 110.0],
    svgCenter: { x: 680, y: 530 },
    zoomScale: 2.5,
  },
  kalimantan: {
    slug: 'kalimantan',
    name: 'Kalimantan',
    bounds: [[-4.3, 108.8], [4.4, 119.1]],
    center: [0.2, 114.0],
    svgCenter: { x: 755, y: 410 },
    zoomScale: 2.1,
  },
  sulawesi: {
    slug: 'sulawesi',
    name: 'Sulawesi',
    bounds: [[-6.0, 118.7], [2.0, 125.3]],
    center: [-1.8, 121.5],
    svgCenter: { x: 875, y: 415 },
    zoomScale: 2.3,
  },
  'papua-maluku': {
    slug: 'papua-maluku',
    name: 'Papua & Maluku',
    bounds: [[-9.2, 124.0], [2.8, 141.1]],
    center: [-3.8, 134.0],
    svgCenter: { x: 1120, y: 440 },
    zoomScale: 2.1,
  },
};

// Pemetaan alias untuk slug yang bervariasi
const SLUG_ALIASES = {
  papua: 'papua-maluku',
  maluku: 'papua-maluku',
  'papua-dan-maluku': 'papua-maluku',
  'papua_maluku': 'papua-maluku',
};

/**
 * Mencari data batas wilayah berdasarkan slug URL atau ID internal.
 * @param {string} slug
 * @returns {object|null}
 */
export function getRegionBySlug(slug) {
  if (!slug) return null;
  const normalized = String(slug).trim().toLowerCase();
  const canonicalSlug = SLUG_ALIASES[normalized] || normalized;
  return REGION_BOUNDS[canonicalSlug] || null;
}

/**
 * Mengecek apakah koordinat [lat, lng] berada dalam bounds wilayah.
 * @param {number} lat
 * @param {number} lng
 * @param {string|object} regionOrSlug
 * @returns {boolean}
 */
export function isCoordinateInRegion(lat, lng, regionOrSlug) {
  const region = typeof regionOrSlug === 'string' ? getRegionBySlug(regionOrSlug) : regionOrSlug;
  if (!region || !region.bounds) return true;
  const [[south, west], [north, east]] = region.bounds;
  return lat >= south && lat <= north && lng >= west && lng <= east;
}

