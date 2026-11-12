import fs from 'fs';

const html = fs.readFileSync('public/stories.html', 'utf8');
const lines = html.split('\n');

console.log('--- Search in stories.html ---');
lines.forEach((l, i) => {
  if (l.includes('<svg') || l.includes('viewBox') || l.includes('sh-dot') || l.includes('dot-') || l.includes('id="dots"') || l.includes('dots-group') || l.includes('ring-disc')) {
    console.log(`${i+1}: ${l.trim().slice(0, 120)}`);
  }
});

