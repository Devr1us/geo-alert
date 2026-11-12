import fs from 'fs';

const content = fs.readFileSync('resources/js/components/StoriesHero.jsx', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(365, 560).join('\n'));

