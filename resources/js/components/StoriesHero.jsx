import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X, MapPin, BookOpen, ExternalLink, Compass } from 'lucide-react';
import {
  STORIES,
  REGION_SVG_PATHS,
  VIDEO_COLS,
  VIDEO_ROWS,
  STILL_COLS,
  STILL_ROWS,
  VIDEO_SRC,
  STILL_SRC,
} from '../data/storiesData';
import { REGION_BOUNDS, getRegionBySlug } from '../data/regionBounds';
import '../../css/StoriesHero.css';

const RULER_TOP_POSITIONS = [10, 56, 108, 158, 206];

console.info('[GeoAlert hero v2] loaded');

export default function StoriesHero({ onCekBencana }) {
  const navigate = useNavigate();
  const [activeZoneIndex, setActiveZoneIndex] = useState(0);
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, visible: false });

  // Zoom to region & navigation states
  const [isNavigating, setIsNavigating] = useState(false);
  const [zoomingRegion, setZoomingRegion] = useState(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [touchActiveStory, setTouchActiveStory] = useState(null);

  const heroRef = useRef(null);
  const mapViewportRef = useRef(null);
  const videoRef = useRef(null);
  const canvasMapRefs = useRef({});
  const storyCanvasRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const stillImageRef = useRef(null);
  const navigationTimerRef = useRef(null);
  const overlayTimerRef = useRef(null);

  const activeStory = STORIES[activeZoneIndex] || STORIES[0];
  const modalStory = STORIES[storyIndex] || STORIES[0];

  // 1. Inisialisasi video & stillImage fallback untuk render canvas
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = STILL_SRC;
    stillImageRef.current = img;

    const vid = videoRef.current;
    if (vid) {
      vid.play().catch(() => {
        // Autoplay policy: video akan berjalan saat interaksi pertama
      });
    }

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  // 2. Reset zoom, overlay, & navigation lock saat mount dan bfcache (Back button)
  useEffect(() => {
    setIsNavigating(false);
    setZoomingRegion(null);
    setIsOverlayVisible(false);
    setTouchActiveStory(null);

    const handlePageShow = () => {
      setIsNavigating(false);
      setZoomingRegion(null);
      setIsOverlayVisible(false);
      setTouchActiveStory(null);
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      if (navigationTimerRef.current) clearTimeout(navigationTimerRef.current);
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
  }, []);

  // 3. Fungsi menggambar cell video/gambar ke canvas
  const renderCellToCanvas = useCallback((canvas, cCol, cRow) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const vid = videoRef.current;
    const img = stillImageRef.current;
    const hasVideo = vid && vid.readyState >= 2 && !vid.paused;
    const source = hasVideo ? vid : img;

    if (!source || (!hasVideo && (!img || !img.complete))) return;

    const colBounds = hasVideo ? VIDEO_COLS[cCol] : STILL_COLS[cCol];
    const rowBounds = hasVideo ? VIDEO_ROWS[cRow] : STILL_ROWS[cRow];
    if (!colBounds || !rowBounds) return;

    const sx = colBounds[0];
    const sy = rowBounds[0];
    const sw = colBounds[1] - colBounds[0];
    const sh = rowBounds[1] - rowBounds[0];
    const dw = canvas.width;
    const dh = canvas.height;

    const scale = Math.max(dw / sw, dh / sh);
    const cropW = dw / scale;
    const cropH = dh / scale;
    const cropX = sx + (sw - cropW) / 2;
    const cropY = sy + (sh - cropH) / 2;

    try {
      ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, dw, dh);
    } catch (_) {
      // CORS fallback: jika browser memblokir drawImage cross-origin, biarkan tanpa error
    }
  }, []);

  // 4. Render loop canvas
  useEffect(() => {
    let active = true;

    const loop = () => {
      if (!active) return;

      // Render canvas active region pada peta
      const curZone = STORIES[activeZoneIndex];
      if (curZone) {
        const c = canvasMapRefs.current[curZone.id];
        if (c) {
          renderCellToCanvas(c, curZone.videoCol, curZone.videoRow);
        }
      }

      // Render canvas modal cerita jika sedang terbuka
      if (isStoryOpen && storyCanvasRef.current) {
        const curModalZone = STORIES[storyIndex];
        if (curModalZone) {
          renderCellToCanvas(storyCanvasRef.current, curModalZone.videoCol, curModalZone.videoRow);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [activeZoneIndex, isStoryOpen, storyIndex, renderCellToCanvas]);

  // 5. Eksekusi Zoom & Navigasi ke Halaman Peta Bencana
  const triggerRegionZoom = useCallback((regionIdOrSlug) => {
    if (isNavigating) return; // Kunci double click

    const region = getRegionBySlug(regionIdOrSlug) || REGION_BOUNDS['sumatera'];
    const slug = region.slug;

    // Periksa preferensi reduced-motion
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      navigate(`/peta?wilayah=${slug}`);
      return;
    }

    setIsNavigating(true);
    setZoomingRegion(region);
    setCursorPos((prev) => ({ ...prev, visible: false }));

    // Overlay krem memudar masuk setelah 450ms
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    overlayTimerRef.current = setTimeout(() => {
      setIsOverlayVisible(true);
    }, 450);

    // Navigasi ke /peta?wilayah=<slug> setelah animasi selesai (750ms)
    if (navigationTimerRef.current) clearTimeout(navigationTimerRef.current);
    navigationTimerRef.current = setTimeout(() => {
      navigate(`/peta?wilayah=${slug}`);
    }, 750);
  }, [isNavigating, navigate]);

  // 6. Handler klik pada wilayah (desktop: langsung zoom & navigasi; mobile: buka kartu aksi ringkas)
  const handleRegionClick = useCallback((regionId, index, evt) => {
    setActiveZoneIndex(index);
    const isTouchOnly = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const isTouchType = evt && (evt.pointerType === 'touch' || evt.nativeEvent?.pointerType === 'touch');

    if (isTouchOnly || isTouchType) {
      setTouchActiveStory(STORIES[index]);
    } else {
      triggerRegionZoom(regionId);
    }
  }, [triggerRegionZoom]);

  // 7. Buka / Tutup Modal Kisah Lengkap (Sekunder, tidak dipicu klik peta)
  const openStory = useCallback((index) => {
    const targetIdx = typeof index === 'number' ? index : activeZoneIndex;
    setStoryIndex(targetIdx);
    setActiveZoneIndex(targetIdx);
    setIsStoryOpen(true);
    setCursorPos((prev) => ({ ...prev, visible: false }));
  }, [activeZoneIndex]);

  const closeStory = useCallback(() => {
    setIsStoryOpen(false);
  }, []);

  // 8. Navigasi Keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isStoryOpen) {
        if (e.key === 'Escape') {
          closeStory();
        } else if (e.key === 'ArrowRight') {
          setStoryIndex((prev) => Math.min(STORIES.length - 1, prev + 1));
        } else if (e.key === 'ArrowLeft') {
          setStoryIndex((prev) => Math.max(0, prev - 1));
        }
        return;
      }

      if (isNavigating) return;

      // Saat di peta beranda: panah atas/bawah/kiri/kanan memilih wilayah
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveZoneIndex((prev) => (prev + 1) % STORIES.length);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveZoneIndex((prev) => (prev - 1 + STORIES.length) % STORIES.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        // Enter atau Spasi pada item zona memicu zoom ke peta bencana
        if (document.activeElement && document.activeElement.classList.contains('sh-zone-item')) {
          e.preventDefault();
          const targetZone = STORIES[activeZoneIndex];
          if (targetZone) triggerRegionZoom(targetZone.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStoryOpen, isNavigating, activeZoneIndex, closeStory, triggerRegionZoom]);

  // 9. Custom cursor positioning (hanya pointer halus)
  const handlePointerMove = (e) => {
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
    if (isNavigating || isStoryOpen) return;
    setCursorPos({
      x: e.clientX,
      y: e.clientY,
      visible: true,
    });
  };

  const handlePointerLeave = () => {
    setCursorPos((prev) => ({ ...prev, visible: false }));
  };

  // Scroll ke section "Apa itu GeoAlert?" (#tentang)
  const handleScrollToTentang = (e) => {
    e.preventDefault();
    const el = document.getElementById('tentang');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      ref={heroRef}
      className={`stories-hero ${isNavigating ? 'is-navigating' : ''}`}
      aria-label="Kisah Tangguh Nusantara — Hero Section GeoAlert"
    >
      {/* Hidden Video element for animation texture */}
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        autoPlay
        crossOrigin="anonymous"
        src={VIDEO_SRC}
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      {/* Smooth transition cream overlay to /peta */}
      <div
        className={`sh-zoom-overlay ${isOverlayVisible ? 'is-active' : ''}`}
        aria-hidden="true"
      />

      {/* Custom Pointer Circle Cursor Disc (Only fine pointer devices) */}
      <div
        className={`sh-custom-cursor ${cursorPos.visible && !isStoryOpen && !isNavigating ? 'is-visible' : ''}`}
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`,
        }}
        aria-hidden="true"
      >
        <span>LIHAT PETA</span>
      </div>

      <div className="stories-hero-container">
        <div className="stories-hero-grid">
          {/* ================= 1. KOLOM KIRI (TEKS & AKSI) ================= */}
          <div className="stories-hero-left">
            {/* Eyebrow & Brand Tagline */}
            <div className="stories-hero-eyebrow-row">
              <span className="stories-hero-badge">GEOALERT STORIES</span>
              <span className="stories-hero-tagline">Deteksi Dini, Lindungi Diri</span>
            </div>

            {/* H1 Headline */}
            <h1 className="stories-hero-title">
              Jelajahi <span className="sh-terracotta">kisah</span> di seluruh Indonesia
            </h1>

            {/* Paragraph (max ~60 karakter per baris) */}
            <p className="stories-hero-desc">
              Lima wilayah, lima kisah ketangguhan warga memitigasi bencana di tanah air.
              Arahkan kursor ke zona untuk melihat dekat, lalu klik wilayah untuk membuka peta bencana interaktif.
            </p>

            {/* Tombol Aksi */}
            <div className="stories-hero-actions">
              <button
                type="button"
                onClick={onCekBencana}
                className="sh-btn sh-btn-primary"
                aria-label="Cek Bencana Terdekat pada Peta Interaktif"
              >
                <Compass size={19} aria-hidden="true" />
                <span>Cek Bencana Terdekat</span>
              </button>

              <a
                href="#tentang"
                onClick={handleScrollToTentang}
                className="sh-btn sh-btn-secondary"
                aria-label="Pelajari Lebih Lanjut tentang GeoAlert"
              >
                <span>Pelajari Lebih Lanjut</span>
              </a>
            </div>
          </div>

          {/* ================= 2. KOLOM KANAN (PETA INTERAKTIF & SELECTOR) ================= */}
          <div
            className="stories-hero-right"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            {/* Koordinat Pojok Kanan Atas (Disembunyikan di Mobile) */}
            <div className="sh-coords-block" aria-hidden="true">
              <div className="sh-coord-active">{activeStory.coords}</div>
              <div>0° 47' 00" S, 113° 55' 00" E</div>
            </div>

            {/* SVG Map Container (Separated cleanly from zone selector) */}
            <div ref={mapViewportRef} className="sh-map-viewport">
              <svg
                className="sh-map-svg"
                viewBox="0 0 1440 810"
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
                    <clipPath key={`clip-${s.id}`} id={`sh-clip-${s.id}`}>
                      <path d={REGION_SVG_PATHS[s.id]} />
                    </clipPath>
                  ))}

                  {/* Circular text path for active ring */}
                  <path
                    id="sh-ring-text-path"
                    d="M 50,50 m -34,0 a 34,34 0 1,1 68,0 a 34,34 0 1,1 -68,0"
                  />
                </defs>

                {/* Main Zoom Stage Group: zooms smoothly to clicked region in SVG coordinates */}
                <g
                  id="sh-zoom-stage"
                  className={`sh-zoom-stage ${zoomingRegion ? 'is-zooming' : ''}`}
                  style={
                    zoomingRegion
                      ? {
                          transformOrigin: `${zoomingRegion.svgCenter.x}px ${zoomingRegion.svgCenter.y}px`,
                          transform: `scale(${zoomingRegion.zoomScale || 2.2})`,
                        }
                      : {
                          transformOrigin: '720px 405px',
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
                          key={`fo-${s.id}`}
                          x="0"
                          y="0"
                          width="1440"
                          height="810"
                          clipPath={`url(#sh-clip-${s.id})`}
                          className={`sh-photo-fill ${isActive ? 'is-active' : ''} ${isTarget ? 'is-target' : ''}`}
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
                          key={`coastline-${s.id}`}
                          className={`sh-coastline-path sh-region-${s.id} ${isActive ? 'is-active' : ''} ${isTarget ? 'is-target' : ''}`}
                          d={REGION_SVG_PATHS[s.id]}
                          pathLength="1"
                          role="button"
                          tabIndex={0}
                          aria-label={`Buka peta bencana wilayah ${s.name}`}
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
                        key={`hit-${s.id}`}
                        className="sh-hit-area"
                        d={REGION_SVG_PATHS[s.id]}
                        onClick={(e) => handleRegionClick(s.id, idx, e)}
                        onMouseEnter={() => setActiveZoneIndex(idx)}
                        role="button"
                        aria-label={`Buka peta bencana wilayah ${s.name}`}
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
                          key={`dot-${s.id}`}
                          className={`sh-dot-group ${isActive ? 'is-active' : ''} ${isTarget ? 'is-target' : ''}`}
                          transform={`translate(${s.dot.x}, ${s.dot.y})`}
                          onClick={(e) => handleRegionClick(s.id, idx, e)}
                          onMouseEnter={() => setActiveZoneIndex(idx)}
                          role="button"
                          tabIndex={0}
                          aria-label={`Buka peta bencana wilayah ${s.name}`}
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

                  {/* Layer 5: Active Ring with Rotating Badge Text (Pointer Events None) */}
                  <g
                    className={`sh-active-ring-group ${zoomingRegion ? 'is-hidden' : 'is-visible'}`}
                    transform={`translate(${activeStory.dot.x}, ${activeStory.dot.y})`}
                    pointerEvents="none"
                    aria-hidden="true"
                  >
                    <circle cx="0" cy="0" r="28" className="sh-ring-disc" />
                    <line x1="-8" y1="0" x2="8" y2="0" className="sh-ring-plus" />
                    <line x1="0" y1="-8" x2="0" y2="8" className="sh-ring-plus" />
                    <text className="sh-ring-spin-text">
                      <textPath href="#sh-ring-text-path">
                        KISAH TANGGUH &bull; GEOALERT &bull;
                      </textPath>
                    </text>
                  </g>
                </g>
              </svg>

              {/* Touch Device Action Card (Muncul saat wilayah disentuh pada layar sentuh) */}
              {touchActiveStory && !isNavigating && (
                <div className="sh-touch-action-card" role="dialog" aria-label={`Pilihan wilayah ${touchActiveStory.name}`}>
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
                      <span>Buka di Peta Bencana</span>
                    </button>
                    <button
                      type="button"
                      className="sh-touch-btn-secondary"
                      onClick={() => {
                        const idx = STORIES.findIndex((s) => s.id === touchActiveStory.id);
                        setTouchActiveStory(null);
                        openStory(idx >= 0 ? idx : activeZoneIndex);
                      }}
                    >
                      <BookOpen size={14} />
                      <span>Baca Kisah</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Zone Selector (Right Edge on Desktop, Horizontal Chips on Mobile, separated from Map) */}
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
                        aria-label={`Buka peta bencana wilayah ${s.name}`}
                        className={`sh-zone-item ${isActive ? 'is-active' : ''}`}
                        onClick={() => triggerRegionZoom(s.id)}
                        onMouseEnter={() => setActiveZoneIndex(idx)}
                        onFocus={() => setActiveZoneIndex(idx)}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>

                {/* Secondary link to read story without opening modal from map click */}
                <div className="sh-story-link-wrap">
                  <button
                    type="button"
                    className="sh-read-story-trigger"
                    onClick={(e) => {
                      e.stopPropagation();
                      openStory(activeZoneIndex);
                    }}
                    aria-label={`Baca kisah ketangguhan wilayah ${activeStory.name}`}
                  >
                    <BookOpen size={13} aria-hidden="true" />
                    <span>Baca kisah {activeStory.name} &rarr;</span>
                  </button>
                </div>
              </div>

              {/* 220px Vertical Ruler Track (Desktop only) */}
              <div className="sh-ruler-track" aria-hidden="true">
                <div className="sh-ruler-line" />
                {Array.from({ length: 29 }).map((_, i) => (
                  <div
                    key={`tick-${i}`}
                    className={`sh-ruler-tick ${i % 7 === 0 ? 'major' : 'minor'}`}
                    style={{ top: `${(i / 28) * 100}%` }}
                  />
                ))}
                <div
                  className="sh-ruler-marker"
                  style={{ top: `${RULER_TOP_POSITIONS[activeZoneIndex] || 10}px` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================================================
          MODAL KISAH LENGKAP (Full Story Dialog)
          Ported with high fidelity from public/stories.html #story-view
          Diakses via tautan sekunder "Baca kisah" atau menu Kisah
          ========================================================================== */}
      <div
        className={`sh-story-overlay ${isStoryOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Kisah Lengkap: ${modalStory.title} (${modalStory.city})`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeStory();
        }}
      >
        <div className="sh-story-modal">
          {/* Left Paper Strip with Close Button */}
          <div className="sh-modal-left-strip">
            <button
              type="button"
              onClick={closeStory}
              className="sh-modal-back-btn"
              title="Kembali ke Peta Beranda (Esc)"
              aria-label="Tutup kisah dan kembali ke peta"
            >
              <div className="sh-modal-back-arrow">
                <ArrowLeft size={18} />
              </div>
              <span className="sh-modal-back-text">KEMBALI KE PETA</span>
            </button>
          </div>

          {/* Modal Main Content */}
          <div className="sh-story-body">
            <div className="sh-story-card-pair">
              {/* Landscape Photo Canvas Panel */}
              <div className="sh-story-photo-panel">
                <canvas
                  ref={storyCanvasRef}
                  width="530"
                  height="600"
                  className="sh-story-canvas"
                />
                <div className="sh-story-photo-overlay" />
                <div className="sh-story-photo-tag">
                  {modalStory.name} &bull; {modalStory.coords}
                </div>
              </div>

              {/* Story Themed Card */}
              <div
                className="sh-story-card"
                style={{
                  backgroundColor: modalStory.color,
                  color: modalStory.textColor,
                }}
              >
                {/* Watermark SVG of Region Outline */}
                <svg className="sh-card-watermark" viewBox="0 0 1440 810" aria-hidden="true">
                  <path
                    d={REGION_SVG_PATHS[modalStory.id]}
                    fill="none"
                    stroke={modalStory.textColor}
                    strokeWidth="3.5"
                  />
                </svg>

                {/* Card Top: Counter and Progress */}
                <div className="sh-card-top">
                  <span className="sh-card-counter">
                    0{storyIndex + 1} &mdash;&mdash; 0{STORIES.length}
                  </span>
                  <div className="sh-card-progress-bar">
                    <div
                      className="sh-card-progress-fill"
                      style={{
                        width: `${((storyIndex + 1) / STORIES.length) * 100}%`,
                        backgroundColor: modalStory.textColor,
                      }}
                    />
                  </div>
                </div>

                {/* Person Profile Inset */}
                <div className="sh-card-person-row">
                  <div className="sh-card-portrait-wrap">
                    <img
                      src={modalStory.personPhoto}
                      alt={modalStory.personName}
                      className="sh-card-portrait-img"
                      loading="lazy"
                    />
                  </div>
                  <div className="sh-card-person-info">
                    <span className="sh-card-person-name">{modalStory.personName}</span>
                    <span className="sh-card-person-role">{modalStory.personRole}</span>
                  </div>
                </div>

                {/* Card Middle: Category, City, Description */}
                <div className="sh-card-middle">
                  <div className="sh-card-category">{modalStory.category}</div>
                  <div className="sh-card-city">{modalStory.city}</div>
                  <p className="sh-card-desc">{modalStory.desc}</p>
                </div>

                {/* Card Bottom: Link to Standalone /kisah and Spinning Badge */}
                <div className="sh-card-bottom">
                  <a
                    href={`/kisah#${modalStory.id}`}
                    className="sh-card-link-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Buka kisah ${modalStory.city} di halaman mandiri /kisah`}
                  >
                    Buka di Halaman Kisah &rarr;
                  </a>

                  {/* Spinning Badge with Plus */}
                  <div className="sh-card-spin-badge" aria-hidden="true">
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
                  </div>
                </div>
              </div>
            </div>

            {/* Region Navigation Controls (Prev / Next inside dialog) */}
            <div className="sh-modal-nav-row">
              <button
                type="button"
                className="sh-modal-nav-btn"
                onClick={() => setStoryIndex((prev) => Math.max(0, prev - 1))}
                disabled={storyIndex === 0}
                style={{ opacity: storyIndex === 0 ? 0.4 : 1 }}
              >
                &larr; Wilayah Sebelumnya
              </button>
              <button
                type="button"
                className="sh-modal-nav-btn"
                onClick={() => setStoryIndex((prev) => Math.min(STORIES.length - 1, prev + 1))}
                disabled={storyIndex === STORIES.length - 1}
                style={{ opacity: storyIndex === STORIES.length - 1 ? 0.4 : 1 }}
              >
                Wilayah Selanjutnya &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
