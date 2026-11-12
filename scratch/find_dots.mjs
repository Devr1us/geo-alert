import fs from 'fs';

const files = [
  'resources/js/components/StoriesHero.jsx',
  'resources/css/StoriesHero.css',
  'resources/js/pages/LandingPage.jsx',
  'resources/css/LandingPage.css',
];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('pulse') || l.includes('dot') || l.includes('sh-dot') || l.includes('ruler') || l.includes('coords') || l.includes('RULER')) {
      console.log(`${f}:${i+1} -> ${l.trim().slice(0, 100)}`);
    }
  });
}

