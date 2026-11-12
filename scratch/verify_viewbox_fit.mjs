import fs from 'fs';
import { REGION_SVG_PATHS, STORIES } from '../resources/js/data/storiesData.js';
import { REGION_BOUNDS } from '../resources/js/data/regionBounds.js';

console.log('=== VERIFYING VIEWBOX AND ISLAND BOUNDS ===');
const VB = { minX: 380, minY: 250, width: 880, height: 370 };
const VB_MAXX = VB.minX + VB.width;  // 1260
const VB_MAXY = VB.minY + VB.height; // 620

let allInViewBox = true;

for (const [id, d] of Object.entries(REGION_SVG_PATHS)) {
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

  const dot = STORIES.find(s => s.id === id)?.dot;
  const regBound = REGION_BOUNDS[id] || (id === 'papua' ? REGION_BOUNDS['papua-maluku'] : null);

  const pathInX = minX >= VB.minX && maxX <= VB_MAXX;
  const pathInY = minY >= VB.minY && maxY <= VB_MAXY;
  const dotInX = dot ? dot.x >= minX && dot.x <= maxX : false;
  const dotInY = dot ? dot.y >= minY && dot.y <= maxY : false;

  console.log(`Region: ${id.padEnd(12)}`);
  console.log(`  Path bounds: X=[${minX.toFixed(1)}, ${maxX.toFixed(1)}], Y=[${minY.toFixed(1)}, ${maxY.toFixed(1)}]`);
  console.log(`  Inside ViewBox [${VB.minX}..${VB_MAXX}, ${VB.minY}..${VB_MAXY}]: X? ${pathInX}, Y? ${pathInY}`);
  console.log(`  Dot: (${dot?.x}, ${dot?.y}) inside path bounds? X? ${dotInX}, Y? ${dotInY}`);
  console.log(`  svgCenter in regionBounds: (${regBound?.svgCenter.x}, ${regBound?.svgCenter.y})`);

  if (!pathInX || !pathInY || !dotInX || !dotInY) {
    allInViewBox = false;
  }
}

console.log(`\nALL ISLANDS AND DOTS PERFECTLY WITHIN VIEWBOX & BOUNDS? ${allInViewBox}`);

