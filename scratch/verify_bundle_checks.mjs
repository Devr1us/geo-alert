import fs from 'fs';

const manifest = JSON.parse(fs.readFileSync('public/build/manifest.json', 'utf8'));
const jsFile = manifest['resources/js/main.jsx'].file;
const cssFile = manifest['resources/js/main.jsx'].css[0];

console.log('=== VERIFYING SERVED ASSETS ===');
console.log('JS Bundle:', jsFile);
console.log('CSS Bundle:', cssFile);

const js = fs.readFileSync(`public/build/${jsFile}`, 'utf8');
const css = fs.readFileSync(`public/build/${cssFile}`, 'utf8');

// 1. Check viewBox="380 250 880 370"
const hasNewViewBox = js.includes('380 250 880 370');
console.log('1. JS has new viewBox="380 250 880 370":', hasNewViewBox);

// 2. Check 3 columns
const hasThreeCols = js.includes('stories-hero-center');
console.log('2. JS has 3-column layout (stories-hero-center):', hasThreeCols);

// 3. Check "Baca kisah" in hero
// In the hero component (around stories-hero), check if "Baca kisah" is present
const heroIdx = js.indexOf('stories-hero-container');
const heroChunk = js.slice(heroIdx - 500, heroIdx + 3500);
const hasBacaKisahInHero = heroChunk.toLowerCase().includes('baca kisah');
console.log('3. Hero chunk has "Baca kisah":', hasBacaKisahInHero);

// 4. Check "KISAH TANGGUH" in hero map
const hasKisahTangguhInHero = heroChunk.includes('KISAH TANGGUH');
console.log('4. Hero map has "KISAH TANGGUH" ring:', hasKisahTangguhInHero);

// 5. Check CSS for hero rotating ring
console.log('5. CSS has .sh-active-ring-group:', css.includes('sh-active-ring-group'));
console.log('   CSS has .sh-ring-spin-text:', css.includes('sh-ring-spin-text'));
console.log('   CSS has .sh-story-link-wrap:', css.includes('sh-story-link-wrap'));
console.log('   CSS has .sh-read-story-trigger:', css.includes('sh-read-story-trigger'));

// 6. Check pulse dot transform-box
console.log('6. CSS has transform-box on dot pulse:', css.includes('transform-box:fill-box') || css.includes('transform-box: fill-box'));

// 7. Check Right padding in CSS container
console.log('7. CSS container has clamp right padding:', css.includes('clamp(32px,5vw,96px)') || css.includes('clamp(32px, 5vw, 96px)'));

// 8. Check Modal still has its spin badge
console.log('8. Modal card spin badge preserved in JS:', js.includes('sh-modal-card-ring-path'));

console.log('\nALL ASSET VERIFICATIONS PASSED? ' + (hasNewViewBox && hasThreeCols && !hasBacaKisahInHero && !hasKisahTangguhInHero && !css.includes('sh-active-ring-group')));

