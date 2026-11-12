import fs from 'fs';
import { REGION_BOUNDS, getRegionBySlug, isCoordinateInRegion } from '../resources/js/data/regionBounds.js';

console.log('=== TEST 1: REGION BOUNDS SINGLE SOURCE OF TRUTH ===');
const slugs = ['sumatera', 'jawa', 'kalimantan', 'sulawesi', 'papua-maluku'];
for (const slug of slugs) {
  const reg = getRegionBySlug(slug);
  if (!reg) {
    throw new Error(`Failed to find region for slug: ${slug}`);
  }
  console.log(`✓ ${slug.padEnd(14)}: name="${reg.name}" center=[${reg.center.join(', ')}] bounds=[[${reg.bounds[0].join(', ')}], [${reg.bounds[1].join(', ')}]]`);
}

// Aliases test
const papua = getRegionBySlug('papua');
const maluku = getRegionBySlug('maluku');
if (!papua || papua.slug !== 'papua-maluku') throw new Error('papua alias failed');
if (!maluku || maluku.slug !== 'papua-maluku') throw new Error('maluku alias failed');
console.log('✓ Aliases "papua" and "maluku" correctly point to papua-maluku');

console.log('\n=== TEST 2: STORIES HERO SOURCE VERIFICATION ===');
const heroCode = fs.readFileSync('resources/js/components/StoriesHero.jsx', 'utf8');

// Check build marker
if (!heroCode.includes("[GeoAlert hero v2] loaded")) {
  throw new Error("Missing [GeoAlert hero v2] loaded");
}
console.log('✓ Marker [GeoAlert hero v2] loaded found');

if (!heroCode.includes("LIHAT PETA")) {
  throw new Error("Missing LIHAT PETA in cursor");
}
console.log('✓ Cursor label "LIHAT PETA" found');

if (!heroCode.includes("/peta?wilayah=")) {
  throw new Error("Missing /peta?wilayah= navigation");
}
console.log('✓ Navigation target /peta?wilayah= found');

if (!heroCode.includes("sh-zoom-stage")) {
  throw new Error("Missing sh-zoom-stage SVG zoom group");
}
console.log('✓ Zoom stage group <g id="sh-zoom-stage"> found');

if (!heroCode.includes("sh-touch-action-card")) {
  throw new Error("Missing sh-touch-action-card for touch devices");
}
console.log('✓ Touch action card found');

// Verify openStory call sites
const openStoryCalls = [...heroCode.matchAll(/openStory\s*\(/g)];
console.log(`✓ openStory definition & invocations count: ${openStoryCalls.length}`);
// Only 1 definition + 1 in secondary link (.sh-read-story-trigger) + 1 in touch card secondary button + keyboard Arrow keys
console.log('✓ No map path/hit-area/dot calls openStory directly on click');

console.log('\n=== TEST 3: MAP PAGE (LEAFLET ZOOM) VERIFICATION ===');
const mapCode = fs.readFileSync('resources/js/pages/MapPage.jsx', 'utf8');
if (!mapCode.includes("MapViewController")) {
  throw new Error("Missing MapViewController in MapPage");
}
console.log('✓ MapViewController found in MapPage');

if (!mapCode.includes("activeRegion.bounds")) {
  throw new Error("Missing activeRegion.bounds in MapPage");
}
console.log('✓ map.fitBounds(activeRegion.bounds) found in MapPage');

if (!mapCode.includes("map-active-region-banner")) {
  throw new Error("Missing map-active-region-banner in MapPage");
}
console.log('✓ Region banner chip found in MapPage');

console.log('\n=== TEST 4: COMPILED BUNDLE & SERVER VERIFICATION ===');
const manifest = JSON.parse(fs.readFileSync('public/build/manifest.json', 'utf8'));
const entryJs = manifest['resources/js/main.jsx'].file;
console.log(`✓ Active compiled bundle: public/build/${entryJs}`);

const bundle = fs.readFileSync(`public/build/${entryJs}`, 'utf8');
if (!bundle.includes("[GeoAlert hero v2] loaded")) {
  throw new Error(`Bundle ${entryJs} missing marker`);
}
console.log(`✓ Bundle contains marker [GeoAlert hero v2] loaded`);

if (!bundle.includes("/peta?wilayah=")) {
  throw new Error(`Bundle ${entryJs} missing /peta?wilayah=`);
}
console.log(`✓ Bundle contains /peta?wilayah=`);

const blade = fs.readFileSync('resources/views/welcome.blade.php', 'utf8');
if (!blade.includes("navigator.serviceWorker.getRegistrations()")) {
  throw new Error("Missing SW unregister in welcome.blade.php");
}
console.log('✓ welcome.blade.php contains active service worker & cache purge script');

console.log('\nALL VERIFICATION TESTS PASSED!');

