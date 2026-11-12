import fs from 'fs';

const manifest = JSON.parse(fs.readFileSync('public/build/manifest.json', 'utf8'));
const jsFile = manifest['resources/js/main.jsx'].file;
const cssFile = manifest['resources/js/main.jsx'].css[0];

const js = fs.readFileSync(`public/build/${jsFile}`, 'utf8');
const css = fs.readFileSync(`public/build/${cssFile}`, 'utf8');

const heroIdx = js.indexOf('stories-hero-container');
const heroChunk = js.slice(heroIdx - 500, heroIdx + 3500);

console.log('JS Bundle:', jsFile);
console.log('CSS Bundle:', cssFile);
console.log('1. viewBox="380 250 880 370" present:', js.includes('380 250 880 370'));
console.log('2. stories-hero-center present:', js.includes('stories-hero-center'));
console.log('3. "Baca kisah" in hero:', heroChunk.toLowerCase().includes('baca kisah'));
console.log('4. "KISAH TANGGUH" in hero map:', heroChunk.includes('KISAH TANGGUH'));
console.log('5. .sh-active-ring-group in CSS:', css.includes('sh-active-ring-group'));
console.log('6. .sh-read-story-trigger in CSS:', css.includes('sh-read-story-trigger'));
console.log('7. .sh-story-link-wrap in CSS:', css.includes('sh-story-link-wrap'));
console.log('8. Modal card badge preserved:', js.includes('sh-modal-card-ring-path'));

if (js.includes('380 250 880 370') &&
    js.includes('stories-hero-center') &&
    !heroChunk.toLowerCase().includes('baca kisah') &&
    !heroChunk.includes('KISAH TANGGUH') &&
    !css.includes('sh-active-ring-group') &&
    !css.includes('sh-read-story-trigger')) {
  console.log('\n>>> ALL 5 HERO CLEANUP & ENHANCEMENT REQUIREMENTS VERIFIED SUCCESSFULLY! <<<');
} else {
  console.error('\n>>> VERIFICATION FAILED! <<<');
}

