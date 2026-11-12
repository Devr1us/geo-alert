import fs from 'fs';

let content = fs.readFileSync('resources/js/components/StoriesHero.jsx', 'utf8');

const targetStart = `          {/* ================= 2. KOLOM KANAN (PETA INTERAKTIF & SELECTOR) ================= */}`;
const targetEnd = `                <div
                  className="sh-ruler-marker"
                  style={{ top: \`\${RULER_TOP_POSITIONS[activeZoneIndex] || 10}px\` }}
                />
              </div>
            </div>
          </div>`;

const startIdx = content.indexOf(targetStart);
const endIdx = content.indexOf(targetEnd);

if (startIdx === -1 || endIdx === -1) {
  console.error('Target not found!', { startIdx, endIdx });
  process.exit(1);
}

const replacement = `          {/* ================= 2. KOLOM TENGAH (PETA INTERAKTIF INDONESIA) ================= */}
          <div
            className="stories-hero-center"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            {/* Koordinat Pojok Kanan Atas Peta (Disembunyikan di Mobile < 768px) */}
            <div className="sh-coords-block" aria-hidden="true">
              <div className="sh-coord-active">{activeStory.coords}</div>
              <div>0° 47' 00" S, 113° 55' 00" E</div>
            </div>

            {/* SVG Map Container (Enlarged 880x370 Framing, Papua utuh & Sumatera dekat teks) */}
            <div ref={mapViewportRef} className="sh-map-viewport">
              <svg
                className="sh-map-svg"
                viewBox="380 250 880 370"
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label="Peta Vektor Interaktif Wilayah Indonesia — Klik untuk Zoom ke Peta Bencana"
              >
                <title>Peta Interaktif Wilayah Bencana Indonesia</title>
                <desc>
                  Peta kepulauan Indonesia dengan lima zona wilayah: Sumatera, Jawa,
                  Kalimantan, Sulawesi, dan Papua & Maluku. Klik salah satu wilayah untuk zoom langsung ke Peta Bencana.
                </desc>

                <defs>
                  {/* Clip Paths untuk 5 wilayah pulau Indonesia */}
                  {STORIES.map((s) => (
                    <clipPath key={\`clip-\${s.id}\`} id={\`sh-clip-\${s.id}\`}>
                      <path d={REGION_SVG_PATHS[s.id]} />
                    </clipPath>
                  ))}
                </defs>

                {/* Main Zoom Stage Group: zooms smoothly to clicked region in SVG coordinates */}
                <g
                  id="sh-zoom-stage"
                  className={\`sh-zoom-stage \${zoomingRegion ? 'is-zooming' : ''}\`}
                  style={
                    zoomingRegion
                      ? {
                          transformOrigin: \`\${zoomingRegion.svgCenter.x}px \${zoomingRegion.svgCenter.y}px\`,
                          transform: \`scale(\${zoomingRegion.zoomScale || 2.2})\`,
                        }
                      : {
                          transformOrigin: '820px 435px',
                          transform: 'scale(1)',
                        }
                  }
                >
                  {/* Layer 1: Photo Fill Canvases inside Region ClipPaths */}
                  <g id="sh-photo-fills" pointerEvents="none">
                    {STORIES.map((s) => {
                      const isActive = s.id === activeStory.id;
                      const isTarget = zoomingRegion
                        ? zoomingRegion.slug === s.id || (s.id === 'papua' && zoomingRegion.slug === 'papua-maluku')
                        : isActive;
                      return (
                        <foreignObject
                          key={\`fo-\${s.id}\`}
                          x="0"
                          y="0"
                          width="1440"
                          height="810"
                          clipPath={\`url(#sh-clip-\${s.id})\`}
                          className={\`sh-photo-fill \${isActive ? 'is-active' : ''} \${isTarget ? 'is-target' : ''}\`}
                          pointerEvents="none"
                        >
                          <canvas
                            ref={(el) => {
                              if (el) canvasMapRefs.current[s.id] = el;
                            }}
                            width="1440"
                            height="810"
                            style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
                          />
                        </foreignObject>
                      );
                    })}
                  </g>

                  {/* Layer 2: Coastline Ink Paths */}
                  <g id="sh-coastlines">
                    {STORIES.map((s, idx) => {
                      const isActive = s.id === activeStory.id;
                      const isTarget = zoomingRegion
                        ? zoomingRegion.slug === s.id || (s.id === 'papua' && zoomingRegion.slug === 'papua-maluku')
                        : isActive;
                      return (
                        <path
                          key={\`coastline-\${s.id}\`}
                          className={\`sh-coastline-path sh-region-\${s.id} \${isActive ? 'is-active' : ''} \${isTarget ? 'is-target' : ''}\`}
                          d={REGION_SVG_PATHS[s.id]}
                          pathLength="1"
                          role="button"
                          tabIndex={0}
                          aria-label={\`Buka peta bencana wilayah \${s.name}\`}
                          onClick={(e) => handleRegionClick(s.id, idx, e)}
                          onMouseEnter={() => setActiveZoneIndex(idx)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              triggerRegionZoom(s.id);
                            }
                          }}
                        />
                      );
                    })}
                  </g>

                  {/* Layer 3: Invisible Hit Areas (min 44px equivalent) */}
                  <g id="sh-hit-areas">
                    {STORIES.map((s, idx) => (
                      <path
                        key={\`hit-\${s.id}\`}
                        className="sh-hit-area"
                        d={REGION_SVG_PATHS[s.id]}
                        onClick={(e) => handleRegionClick(s.id, idx, e)}
                        onMouseEnter={() => setActiveZoneIndex(idx)}
                        role="button"
                        aria-label={\`Buka peta bencana wilayah \${s.name}\`}
                        tabIndex={-1}
                      />
                    ))}
                  </g>

                  {/* Layer 4: Orange Terracotta Pulse Dots */}
                  <g id="sh-dots">
                    {STORIES.map((s, idx) => {
                      const isActive = s.id === activeStory.id;
                      const isTarget = zoomingRegion
                        ? zoomingRegion.slug === s.id || (s.id === 'papua' && zoomingRegion.slug === 'papua-maluku')
                        : isActive;
                      return (
                        <g
                          key={\`dot-\${s.id}\`}
                          className={\`sh-dot-group \${isActive ? 'is-active' : ''} \${isTarget ? 'is-target' : ''}\`}
                          transform={\`translate(\${s.dot.x}, \${s.dot.y})\`}
                          onClick={(e) => handleRegionClick(s.id, idx, e)}
                          onMouseEnter={() => setActiveZoneIndex(idx)}
                          role="button"
                          tabIndex={0}
                          aria-label={\`Buka peta bencana wilayah \${s.name}\`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              triggerRegionZoom(s.id);
                            }
                          }}
                        >
                          {/* Minimum 48px hit target area */}
                          <circle cx="0" cy="0" r="24" fill="transparent" pointerEvents="all" />
                          <circle cx="0" cy="0" r="14" className="sh-dot-pulse" />
                          <circle cx="0" cy="0" r="5" className="sh-dot-core" />
                        </g>
                      );
                    })}
                  </g>
                </g>
              </svg>

              {/* Touch Device Action Card (Hanya tombol utama 'Lihat di Peta Bencana') */}
              {touchActiveStory && !isNavigating && (
                <div className="sh-touch-action-card" role="dialog" aria-label={\`Pilihan wilayah \${touchActiveStory.name}\`}>
                  <div className="sh-touch-card-top">
                    <div>
                      <span className="sh-touch-card-badge">{touchActiveStory.coords}</span>
                      <h4 className="sh-touch-card-title">{touchActiveStory.name}</h4>
                    </div>
                    <button
                      type="button"
                      className="sh-touch-card-close"
                      onClick={() => setTouchActiveStory(null)}
                      aria-label="Tutup pilihan wilayah"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="sh-touch-card-desc">{touchActiveStory.subtitle}: {touchActiveStory.desc}</p>
                  <div className="sh-touch-card-btns">
                    <button
                      type="button"
                      className="sh-touch-btn-primary"
                      onClick={() => {
                        const targetId = touchActiveStory.id;
                        setTouchActiveStory(null);
                        triggerRegionZoom(targetId);
                      }}
                    >
                      <Compass size={14} />
                      <span>Lihat di Peta Bencana</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ================= 3. KOLOM KANAN (DAFTAR PILIH WILAYAH & RULER) ================= */}
          <div className="stories-hero-right">
            <div className="sh-zone-selector" role="tablist" aria-label="Pilih Wilayah Indonesia">
              <div className="sh-zone-list-wrap">
                <div className="sh-zone-title" id="sh-zone-label">PILIH WILAYAH</div>
                <div className="sh-zone-list" aria-labelledby="sh-zone-label">
                  {STORIES.map((s, idx) => {
                    const isActive = idx === activeZoneIndex;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={\`Buka peta bencana wilayah \${s.name}\`}
                        className={\`sh-zone-item \${isActive ? 'is-active' : ''}\`}
                        onClick={() => triggerRegionZoom(s.id)}
                        onMouseEnter={() => setActiveZoneIndex(idx)}
                        onFocus={() => setActiveZoneIndex(idx)}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 220px Vertical Ruler Track (Desktop only) */}
              <div className="sh-ruler-track" aria-hidden="true">
                <div className="sh-ruler-line" />
                {Array.from({ length: 29 }).map((_, i) => (
                  <div
                    key={\`tick-\${i}\`}
                    className={\`sh-ruler-tick \${i % 7 === 0 ? 'major' : 'minor'}\`}
                    style={{ top: \`\${(i / 28) * 100}%\` }}
                  />
                ))}
                <div
                  className="sh-ruler-marker"
                  style={{ top: \`\${RULER_TOP_POSITIONS[activeZoneIndex] || 10}px\` }}
                />
              </div>
            </div>
          </div>`;

content = content.slice(0, startIdx) + replacement + content.slice(endIdx + targetEnd.length);
fs.writeFileSync('resources/js/components/StoriesHero.jsx', content, 'utf8');
console.log('Successfully updated StoriesHero.jsx with 3-column layout!');

