import fs from 'fs';

let css = fs.readFileSync('resources/css/StoriesHero.css', 'utf8');

// Update @media (max-width: 1023px)
const oldMq1023 = `@media (max-width: 1023px) {
  .stories-hero {
    padding-top: calc(var(--navbar-height, 70px) + 1.5rem);
    padding-bottom: 4rem;
    min-height: auto;
  }

  .stories-hero-container {
    padding: 0 1.25rem;
  }

  .stories-hero-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .stories-hero-left {
    text-align: left;
  }

  .stories-hero-title {
    font-size: clamp(2rem, 6.5vw, 2.85rem);
  }

  .stories-hero-desc {
    font-size: 0.9rem;
    max-width: 100%;
  }

  .stories-hero-actions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    gap: 0.75rem;
  }

  .sh-btn {
    width: 100%;
    min-height: 48px;
    font-size: 1rem;
  }

  /* Right column mobile adjustments */
  .stories-hero-right {
    min-height: auto;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .sh-coords-block {
    display: none; /* Hidden on mobile */
  }

  .sh-map-viewport {
    width: 100%;
    aspect-ratio: 16 / 10;
    max-height: 380px;
    margin: 0.5rem 0;
  }`;

const newMq = `/* ==========================================================================
   RESPONSIVE MEDIA QUERIES
   ========================================================================== */

/* 1024px - 1279px: Kolom teks ~38%, peta mengisi sisa, daftar terlihat penuh */
@media (min-width: 1024px) and (max-width: 1279px) {
  .stories-hero-container {
    padding-left: 28px;
    padding-right: 40px;
  }

  .stories-hero-grid {
    grid-template-columns: minmax(0, 38%) minmax(0, 1fr) auto;
    column-gap: 20px;
  }

  .sh-zone-selector {
    min-width: 150px;
    gap: 12px;
  }

  .sh-zone-item {
    font-size: 0.95rem;
    line-height: 2.0;
  }
}

@media (max-width: 1023px) {
  .stories-hero {
    padding-top: calc(var(--navbar-height, 70px) + 1.25rem);
    padding-bottom: 3.5rem;
    min-height: auto;
  }

  .stories-hero-container {
    padding: 0 1.25rem;
  }

  .stories-hero-grid {
    grid-template-columns: 1fr;
    gap: 1.75rem;
  }

  .stories-hero-left {
    text-align: left;
    max-width: 640px;
  }

  .stories-hero-title {
    font-size: clamp(2rem, 6.5vw, 2.85rem);
  }

  .stories-hero-desc {
    font-size: 0.9rem;
    max-width: 100%;
  }

  .stories-hero-actions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    gap: 0.75rem;
  }

  .sh-btn {
    width: 100%;
    min-height: 48px;
    font-size: 1rem;
  }

  .stories-hero-center {
    width: 100%;
  }

  .stories-hero-right {
    min-height: auto;
    width: 100%;
    justify-content: flex-start;
    min-width: auto;
  }

  .sh-coords-block {
    display: none !important; /* Hidden on mobile < 768px/tablet */
  }

  .sh-map-viewport {
    width: 100%;
    aspect-ratio: 880 / 370;
    max-height: 380px;
    min-height: auto;
    margin: 0.5rem 0;
  }`;

if (css.includes(oldMq1023)) {
  css = css.replace(oldMq1023, newMq);
  fs.writeFileSync('resources/css/StoriesHero.css', css, 'utf8');
  console.log('Successfully updated responsive media queries in StoriesHero.css!');
} else {
  console.log('Could not find exact oldMq1023 block, checking partial...');
  const idx = css.indexOf('@media (max-width: 1023px)');
  console.log(css.slice(idx, idx + 400));
}

