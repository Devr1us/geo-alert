import fs from 'fs';

const content = fs.readFileSync('resources/js/components/StoriesHero.jsx', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(365, 430).join('\n'));
console.log('--- middle ---');
console.log(lines.slice(525, 675).join('\n'));

