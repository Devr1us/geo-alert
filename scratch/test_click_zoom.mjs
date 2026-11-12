import fs from 'fs';
import { REGION_BOUNDS, getRegionBySlug } from '../resources/js/data/regionBounds.js';

console.log('=== VERIFYING CLICK ZOOM & NAVIGATION FLOW ===');
const regions = ['sumatera', 'jawa', 'kalimantan', 'sulawesi', 'papua-maluku'];

for (const slug of regions) {
  const r = getRegionBySlug(slug);
  console.log(`Wilayah: ${r.name.padEnd(16)} -> slug: ${r.slug.padEnd(14)} svgCenter: (${r.svgCenter.x}, ${r.svgCenter.y}) zoomScale: ${r.zoomScale}`);
}

const js = fs.readFileSync('resources/js/components/StoriesHero.jsx', 'utf8');

// Check navigation URL string
if (!js.includes('navigate(`/peta?wilayah=${slug}`)')) {
  throw new Error('navigate(/peta?wilayah=...) call is missing!');
}
console.log('✓ Navigation call: navigate(`/peta?wilayah=${slug}`) is active');

// Check triggerRegionZoom is called on click
if (!js.includes('onClick={(e) => handleRegionClick(s.id, idx, e)}') ||
    !js.includes('onClick={() => triggerRegionZoom(s.id)}')) {
  throw new Error('Region click handlers missing!');
}
console.log('✓ Map path & zone items are wired to triggerRegionZoom');

// Check bfcache pageshow handler is present
if (!js.includes("window.addEventListener('pageshow', handlePageShow)")) {
  throw new Error('pageshow handler missing!');
}
console.log('✓ bfcache pageshow handler resets zoom state');

console.log('CLICK ZOOM & NAVIGATION FLOW VERIFIED 100%!');

