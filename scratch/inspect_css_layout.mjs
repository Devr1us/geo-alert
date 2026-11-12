import fs from 'fs';

const css = fs.readFileSync('resources/css/StoriesHero.css', 'utf8');

// Let's print the main layout rules
const classes = [
  '.stories-hero',
  '.stories-hero-container',
  '.stories-hero-grid',
  '.stories-hero-left',
  '.stories-hero-right',
  '.sh-map-viewport',
  '.sh-map-svg',
  '.sh-zone-selector',
  '.sh-zone-list-wrap',
  '.sh-active-ring-group',
  '.sh-ring-spin-text',
  '.sh-dot-group',
  '.sh-story-link-wrap',
  '.sh-read-story-trigger'
];

for (const cls of classes) {
  const idx = css.indexOf(cls + ' ');
  const idx2 = css.indexOf(cls + '{');
  const targetIdx = idx !== -1 ? idx : idx2;
  if (targetIdx !== -1) {
    console.log(`=== ${cls} ===`);
    console.log(css.slice(targetIdx, targetIdx + 400).split('}')[0] + '}');
  }
}

