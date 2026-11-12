import fs from 'fs';
import path from 'path';

function searchFiles(dir, patterns) {
  const results = [];
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'vendor' || entry.name === 'storage' || entry.name === 'scratch') continue;
        walk(fullPath);
      } else if (entry.isFile()) {
        if (fullPath.endsWith('.png') || fullPath.endsWith('.jpg') || fullPath.endsWith('.jpeg') || fullPath.endsWith('.mp4')) continue;
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            for (const p of patterns) {
              if (lines[i].toLowerCase().includes(p.toLowerCase())) {
                results.push({ file: fullPath.replace(/\\/g, '/'), line: i + 1, match: lines[i].trim(), pattern: p });
              }
            }
          }
        } catch (_) {}
      }
    }
  }
  walk(dir);
  return results;
}

const terms = ['Buka di Halaman Kisah', 'Wilayah Selanjutnya', 'Kembali ke peta'];
const res = searchFiles('.', terms);
console.log('--- FASE A.1: STRING MATCHES (' + res.length + ' found) ---');
res.forEach(r => {
  if (r.file.includes('public/build/assets')) {
    console.log(`${r.file} (compiled bundle) matched "${r.pattern}"`);
  } else {
    console.log(`${r.file}:${r.line} [${r.pattern}] -> ${r.match.slice(0, 100)}`);
  }
});

