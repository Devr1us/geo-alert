import fs from 'fs';

const content = fs.readFileSync('resources/js/components/StoriesHero.jsx', 'utf8');
const lines = content.split('\n');
console.log('Lines 360-420:');
console.log(lines.slice(360, 420).join('\n'));
console.log('\nLines 530-675:');
console.log(lines.slice(530, 675).join('\n'));

