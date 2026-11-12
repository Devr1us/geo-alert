import fs from 'fs';

const css = fs.readFileSync('resources/css/StoriesHero.css', 'utf8');

const regex = /\.sh-zone-[\s\S]*?(?=\n\.[a-z]|\n@media|\n\/\*)/g;
let match;
while ((match = regex.exec(css)) !== null) {
  console.log(match[0].slice(0, 300));
  console.log('---');
}

// Media queries
const mqRegex = /@media[^{]+\{[\s\S]*?(?=\n@media|\n\/\*|$)/g;
while ((match = mqRegex.exec(css)) !== null) {
  if (match[0].includes('zone') || match[0].includes('grid') || match[0].includes('hero')) {
    console.log('=== MEDIA QUERY ===');
    console.log(match[0].slice(0, 400));
  }
}

