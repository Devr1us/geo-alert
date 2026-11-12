import { REGION_SVG_PATHS, STORIES } from '../resources/js/data/storiesData.js';

console.log('=== STORIES DOT COORDINATES ===');
STORIES.forEach(s => {
  console.log(`${s.id}: dot={ x: ${s.dot.x}, y: ${s.dot.y} }`);
});

console.log('\n=== PARSING SVG PATH BOUNDS ===');
for (const [id, d] of Object.entries(REGION_SVG_PATHS)) {
  // Extract all numbers
  const nums = d.match(/[-+]?[0-9]*\.?[0-9]+/g).map(Number);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < nums.length; i += 2) {
    const x = nums[i];
    const y = nums[i + 1];
    if (x !== undefined && !isNaN(x)) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
    if (y !== undefined && !isNaN(y)) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  console.log(`${id.padEnd(12)}: X=[${minX.toFixed(1)}, ${maxX.toFixed(1)}] Y=[${minY.toFixed(1)}, ${maxY.toFixed(1)}] | Center=[${((minX+maxX)/2).toFixed(1)}, ${((minY+maxY)/2).toFixed(1)}]`);
}

