import fs from 'fs';

const content = fs.readFileSync('resources/js/data/regionBounds.js', 'utf8');
console.log(content);

