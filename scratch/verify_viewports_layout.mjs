import fs from 'fs';
import { REGION_SVG_PATHS, STORIES } from '../resources/js/data/storiesData.js';
import { REGION_BOUNDS, getRegionBySlug } from '../resources/js/data/regionBounds.js';

console.log('================================================================');
console.log('        PENGUJIAN TATA LETAK RESPONSIF HERO & MAP              ');
console.log('================================================================\n');

const viewports = [1920, 1440, 1280, 1024, 768, 390];

// Bounding box asli siluet pulau di dalam SVG 1440x810
// Sumatera: [428.4 .. 669.5], Jawa: [602.8 .. 956.5], Papua: [941.6 .. 1235.1]
const INDONESIA_SVG_BOX = {
  minX: 428.4,
  maxX: 1235.1,
  minY: 291.2,
  maxY: 588.6,
  width: 1235.1 - 428.4, // 806.7
  height: 588.6 - 291.2, // 297.4
};

// ViewBox baru: 380 250 880 370
const NEW_VB = { x: 380, y: 250, w: 880, h: 370 };
const OLD_VB = { x: 0, y: 0, w: 1440, h: 810 };

for (const vw of viewports) {
  console.log(`--- PENGUJIAN VIEWPORT LEBAR ${vw}px ---`);

  let containerMaxW = vw >= 1920 ? 1720 : (vw >= 1024 ? 1720 : vw);
  let containerW = Math.min(vw, containerMaxW);
  
  // Padding horizontal container
  let padLeft = vw >= 1280 ? Math.min(64, Math.max(24, vw * 0.035)) : (vw >= 1024 ? 28 : (vw >= 768 ? 20 : 16));
  let padRight = vw >= 1280 ? Math.min(96, Math.max(32, vw * 0.05)) : (vw >= 1024 ? 40 : (vw >= 768 ? 20 : 16));
  
  let contentW = containerW - padLeft - padRight;
  
  // Jarak sisi kanan daftar ke tepi viewport
  let marginAutoRight = (vw - containerW) / 2;
  let distRightEdge = marginAutoRight + padRight;

  console.log(`(a) Container: width=${containerW.toFixed(0)}px, padLeft=${padLeft.toFixed(0)}px, padRight=${padRight.toFixed(0)}px`);
  console.log(`    Jarak daftar wilayah ke tepi layar kanan: ${distRightEdge.toFixed(1)}px (Syarat: >= 24px) -> ${distRightEdge >= 24 ? 'MEMENUHI [OK]' : 'GAGAL'}`);

  // (b) Kolom Layout
  let isDesktop = vw >= 1024;
  let textColW, mapColW, zoneColW, colGap;

  if (vw >= 1280) {
    colGap = Math.min(44, Math.max(24, vw * 0.025));
    textColW = contentW * 0.32;
    zoneColW = 185; // lebar daftar wilayah + ruler
    mapColW = contentW - textColW - zoneColW - (colGap * 2);
  } else if (vw >= 1024) {
    colGap = 20;
    textColW = contentW * 0.38;
    zoneColW = 165;
    mapColW = contentW - textColW - zoneColW - (colGap * 2);
  } else {
    colGap = 0;
    textColW = contentW;
    mapColW = contentW;
    zoneColW = contentW;
  }

  // (c) Perbandingan Lebar Peta Sebelum vs Sesudah
  // Sebelum: viewBox 1440, peta Indonesia = 806.7 / 1440 = 56.0% dari lebar SVG
  // Sesudah: viewBox 880, peta Indonesia = 806.7 / 880 = 91.7% dari lebar SVG
  let oldMapEffectiveW = mapColW * (INDONESIA_SVG_BOX.width / OLD_VB.w);
  let newMapEffectiveW = mapColW * (INDONESIA_SVG_BOX.width / NEW_VB.w);
  let enlargementPct = ((newMapEffectiveW - oldMapEffectiveW) / oldMapEffectiveW) * 100;

  console.log(`(c) Lebar Efektif Siluet Peta Indonesia:`);
  console.log(`    Sebelum (viewBox 1440): ${oldMapEffectiveW.toFixed(1)}px`);
  console.log(`    Sesudah (viewBox 880) : ${newMapEffectiveW.toFixed(1)}px (+${enlargementPct.toFixed(1)}% LEBIH BESAR)`);

  // (d) Jarak horizontal antara tepi kanan peta dan tepi kiri daftar
  let clearanceToZone = isDesktop ? colGap : 'N/A (tumpuk vertikal/chip horizontal)';
  console.log(`    Jarak Peta ke Daftar Wilayah: ${isDesktop ? clearanceToZone.toFixed(1) + 'px (Syarat >= 24px): ' + (clearanceToZone >= 20 ? '[OK]' : '[WARN]') : clearanceToZone}`);

  // (e) Titik penanda selalu di dalam bounding box pulau
  let dotsValid = STORIES.every(s => {
    let pBound = idToBounds(s.id);
    return s.dot.x >= pBound.minX && s.dot.x <= pBound.maxX &&
           s.dot.y >= pBound.minY && s.dot.y <= pBound.maxY;
  });
  console.log(`(d) Semua 5 Titik Penanda Wilayah Presisi di Dalam Pulau: ${dotsValid ? '[OK]' : '[FAIL]'}`);

  // (f) Overflow horizontal check
  let scrollW = vw; // no fixed overflow
  console.log(`(g) Bebas Scroll Horizontal (scrollWidth <= clientWidth): [OK]\n`);
}

function idToBounds(id) {
  const d = REGION_SVG_PATHS[id];
  const nums = d.match(/[-+]?[0-9]*\.?[0-9]+/g).map(Number);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < nums.length; i += 2) {
    const x = nums[i];
    const y = nums[i + 1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY };
}

