import fs from 'fs';

const css = fs.readFileSync('resources/css/StoriesHero.css', 'utf8');
const lines = css.split('\n');
console.log(lines.slice(500, 560).join('\n'));

