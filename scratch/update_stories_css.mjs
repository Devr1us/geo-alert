import fs from 'fs';

let css = fs.readFileSync('resources/css/StoriesHero.css', 'utf8');

// 1. Container
css = css.replace(
  /\.stories-hero-container\s*\{[\s\S]*?\}/,
  `.stories-hero-container {
  max-width: 1720px;
  margin: 0 auto;
  padding-left: clamp(24px, 3.5vw, 64px);
  padding-right: clamp(32px, 5vw, 96px); /* Jarak ke tepi kanan minimal clamp(32px, 5vw, 96px) */
  position: relative;
  z-index: 2;
  box-sizing: border-box;
}`
);

// 2. Grid & Columns
css = css.replace(
  /\.stories-hero-grid\s*\{[\s\S]*?\}/,
  `.stories-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 32%) minmax(0, 1fr) auto;
  align-items: center;
  column-gap: clamp(24px, 2.5vw, 44px);
  min-height: 580px;
  width: 100%;
  box-sizing: border-box;
}`
);

// 3. Replace .stories-hero-right block with .stories-hero-center and .stories-hero-right
const heroRightBlock = `.stories-hero-right {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  width: 100%;
  min-height: 520px;
}`;

const newCols = `.stories-hero-center {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  z-index: 10;
}

.stories-hero-right {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  z-index: 20;
  min-width: 170px;
  flex-shrink: 0;
}`;

if (css.includes(heroRightBlock)) {
  css = css.replace(heroRightBlock, newCols);
}

// 4. Update .sh-map-viewport
css = css.replace(
  /\.sh-map-viewport\s*\{[\s\S]*?\}/,
  `.sh-map-viewport {
  position: relative;
  width: 100%;
  aspect-ratio: 880 / 370;
  min-height: clamp(360px, 58vh, 600px);
  display: flex;
  align-items: center;
  justify-content: center;
}`
);

// 5. Update .sh-coords-block
css = css.replace(
  /\.sh-coords-block\s*\{[\s\S]*?\}/,
  `.sh-coords-block {
  position: absolute;
  top: 6px;
  right: 12px;
  font-family: var(--sh-font-mono);
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--sh-ink-subtle);
  z-index: 15;
  pointer-events: none;
  background: rgba(246, 243, 234, 0.85);
  backdrop-filter: blur(4px);
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(28, 26, 23, 0.08);
  text-align: right;
}`
);

// 6. Update .sh-dot-pulse and .sh-dot-core
css = css.replace(
  /\.sh-dot-pulse\s*\{[\s\S]*?@keyframes shDotPulse\s*\{[\s\S]*?\}\s*\.sh-dot-core\s*\{[\s\S]*?\}/,
  `.sh-dot-pulse {
  fill: var(--sh-terracotta);
  opacity: 0.45;
  transform-box: fill-box;
  transform-origin: center;
  animation: shDotPulse 2.4s ease-out infinite;
}

@keyframes shDotPulse {
  0% {
    transform: scale(0.9);
    opacity: 0.6;
  }
  100% {
    transform: scale(2.8);
    opacity: 0;
  }
}

.sh-dot-core {
  fill: var(--sh-terracotta);
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), fill 0.2s ease;
}`
);

// 7. Remove .sh-active-ring-group, .sh-ring-disc, .sh-ring-plus, .sh-ring-spin-text from hero
const ringSectionRegex = /\/\* Active Ring with Spinning Circular Text[\s\S]*?@keyframes shSpinCircleText\s*\{[\s\S]*?\}\s*/;
// We want to delete ring classes but KEEP @keyframes shSpinCircleText for modal!
css = css.replace(
  ringSectionRegex,
  `/* Keyframes rotasi untuk lencana modal (hero ring sudah dihapus) */
@keyframes shSpinCircleText {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

`
);

// 8. Remove .sh-story-link-wrap and .sh-read-story-trigger
const storyTriggerRegex = /\/\* Secondary Story Trigger Link under Region List \*\/[\s\S]*?\.sh-read-story-trigger:focus-visible\s*\{[\s\S]*?\}\s*/;
css = css.replace(storyTriggerRegex, '');

// 9. Update .sh-zone-selector width
css = css.replace(
  /\.sh-zone-selector\s*\{[\s\S]*?\}/,
  `.sh-zone-selector {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: auto;
  min-width: 170px;
  z-index: 25;
}`
);

// 10. Update .sh-zone-item font size
css = css.replace(
  /\.sh-zone-item\s*\{[\s\S]*?\}/,
  `.sh-zone-item {
  background: none;
  border: none;
  font-family: var(--sh-font-mono);
  font-size: clamp(0.95rem, 1.1vw, 1.15rem);
  line-height: 2.1;
  font-weight: 500;
  color: var(--sh-ink-faint);
  cursor: pointer;
  transition: color 0.25s ease, transform 0.25s ease;
  white-space: nowrap;
  padding: 2px 6px;
  text-align: right;
  outline: none;
}`
);

// 11. Update .sh-touch-card-btns and .sh-touch-btn-primary
css = css.replace(
  /\.sh-touch-card-btns\s*\{[\s\S]*?\.sh-touch-btn-secondary\s*\{[\s\S]*?\}/,
  `.sh-touch-card-btns {
  display: flex;
  gap: 10px;
}

.sh-touch-btn-primary {
  width: 100%;
  flex: 1;
  background: var(--sh-ink);
  color: #FFFFFF;
  border: none;
  border-radius: 9999px;
  padding: 10px 16px;
  font-size: 0.88rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  min-height: 44px;
}`
);

fs.writeFileSync('resources/css/StoriesHero.css', css, 'utf8');
console.log('Successfully updated StoriesHero.css layout & responsive rules!');

