import fs from 'fs';

const jsx = fs.readFileSync('resources/js/components/StoriesHero.jsx', 'utf8');
const css = fs.readFileSync('resources/css/StoriesHero.css', 'utf8');

console.log('--- in JSX ---');
jsx.split('\n').forEach((l, i) => {
  if (l.includes('Baca kisah') || l.includes('KISAH TANGGUH') || l.includes('sh-ring')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});

console.log('--- in CSS ---');
css.split('\n').forEach((l, i) => {
  if (l.includes('sh-story-link-wrap') || l.includes('sh-ring-spin-text') || l.includes('sh-active-ring-group')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});

