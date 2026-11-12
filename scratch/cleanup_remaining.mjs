import fs from 'fs';

let jsx = fs.readFileSync('resources/js/components/StoriesHero.jsx', 'utf8');

// Fix comment
jsx = jsx.replace(
  'Diakses via tautan sekunder "Baca kisah" atau menu Kisah',
  'Diakses via menu navbar Kisah atau rute /kisah'
);

// Give modal card its own self-contained textPath defs
const oldModalBadge = `<div className="sh-card-spin-badge" aria-hidden="true">
                    <svg viewBox="0 0 48 48">
                      <circle
                        cx="24"
                        cy="24"
                        r="21"
                        fill="none"
                        stroke={modalStory.textColor}
                        strokeWidth="1.2"
                        opacity="0.35"
                      />
                      <text
                        fontFamily="'IBM Plex Mono', monospace"
                        fontSize="6.5px"
                        fontWeight="600"
                        letterSpacing="0.18em"
                        fill={modalStory.textColor}
                      >
                        <textPath href="#sh-ring-text-path">
                          KISAH TANGGUH &bull; GEOALERT &bull;
                        </textPath>
                      </text>
                    </svg>
                    <span className="sh-card-spin-plus">+</span>
                  </div>`;

const newModalBadge = `<div className="sh-card-spin-badge" aria-hidden="true">
                    <svg viewBox="0 0 48 48">
                      <defs>
                        <path
                          id="sh-modal-card-ring-path"
                          d="M 24,24 m -16,0 a 16,16 0 1,1 32,0 a 16,16 0 1,1 -32,0"
                        />
                      </defs>
                      <circle
                        cx="24"
                        cy="24"
                        r="21"
                        fill="none"
                        stroke={modalStory.textColor}
                        strokeWidth="1.2"
                        opacity="0.35"
                      />
                      <text
                        fontFamily="'IBM Plex Mono', monospace"
                        fontSize="6.5px"
                        fontWeight="600"
                        letterSpacing="0.18em"
                        fill={modalStory.textColor}
                      >
                        <textPath href="#sh-modal-card-ring-path">
                          KISAH TANGGUH &bull; GEOALERT &bull;
                        </textPath>
                      </text>
                    </svg>
                    <span className="sh-card-spin-plus">+</span>
                  </div>`;

if (jsx.includes(oldModalBadge)) {
  jsx = jsx.replace(oldModalBadge, newModalBadge);
  console.log('Updated modal badge with self-contained textPath!');
}

fs.writeFileSync('resources/js/components/StoriesHero.jsx', jsx, 'utf8');

// Now clean up CSS
let css = fs.readFileSync('resources/css/StoriesHero.css', 'utf8');

// Remove line 272
css = css.replace(/\.sh-zoom-stage\.is-zooming\s*\.sh-active-ring-group[\s\S]*?\{[\s\S]*?\}/g, '');

// Remove in media query
css = css.replace(/\.sh-story-link-wrap\s*\{[\s\S]*?\}/g, '');
css = css.replace(/\.sh-active-ring-group\s*\{[\s\S]*?\}/g, '');
css = css.replace(/\.sh-ring-spin-text,/g, '');

fs.writeFileSync('resources/css/StoriesHero.css', css, 'utf8');
console.log('Cleaned up remaining CSS references!');

