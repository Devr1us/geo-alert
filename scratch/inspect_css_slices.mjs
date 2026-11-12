import fs from 'fs';

const css = fs.readFileSync('resources/css/StoriesHero.css', 'utf8');
const lines = css.split('\n');

console.log('Lines 50-100:');
console.log(lines.slice(50, 100).join('\n'));

console.log('\nLines 200-240:');
console.log(lines.slice(200, 240).join('\n'));

console.log('\nLines 365-420:');
console.log(lines.slice(365, 420).join('\n'));

