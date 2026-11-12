import fs from 'fs';

const css = fs.readFileSync('resources/css/StoriesHero.css', 'utf8');
const lines = css.split('\n');
lines.forEach((l, i) => {
  if (l.includes('sh-dot') || l.includes('sh-dots') || l.includes('sh-map-svg') || l.includes('sh-map-viewport')) {
    console.log(`${i+1}: ${l}`);
  }
});

