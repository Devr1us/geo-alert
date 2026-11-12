import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Compass } from 'lucide-react';
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

// Pemecahan kata judul "Siaga bencana di seluruh Indonesia"
// Saat scroll down: Siaga (0) -> di (1) -> seluruh (2) -> Indonesia (3) -> bencana (4, oranye muncul paling akhir)
// Saat scroll up: urutan dibalik (bencana -> Indonesia -> seluruh -> di -> Siaga)
const HERO_WORDS = [
  { text: 'Siaga', isAccent: false, downOrder: 0, upOrder: 4 },
  { text: 'bencana', isAccent: true, downOrder: 4, upOrder: 0 },
  { text: 'di', isAccent: false, downOrder: 1, upOrder: 3 },
  { text: 'seluruh', isAccent: false, downOrder: 2, upOrder: 2 },
  { text: 'Indonesia', isAccent: false, downOrder: 3, upOrder: 1 },
];

/**
 * Komponen ticker/odometer per karakter untuk angka koordinat:
 * Setiap karakter berganti atau saat muncul, berputar/slide dari bawah (translateY 100% ke 0),
 * dengan stagger 25ms antar karakter dan tabular-nums untuk mencegah layout shift.
 */
function CoordinateTicker({ text }) {
  if (!text) return null;
  return (
    <span className="sh-ticker-line" aria-label={text}>
      {text.split('').map((char, i) => (
        <span key={`${i}-${char}`} className="sh-ticker-char-wrap" aria-hidden="true">
          <span className="sh-ticker-char" style={{ '--char-i': i }}>
            {char === ' ' ? '\u00A0' : char}
          </span>
        </span>
      ))}
    </span>
  );
}

console.info('[GeoAlert hero v2] loaded');

export default function StoriesHero({ onCekBencana }) {
  const navigate = useNavigate();
  const [activeZoneIndex, setActiveZoneIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, visible: false });

  // Scroll Direction & Bi-directional Reveal States
  const [scrollDir, setScrollDir] = useState('down');
  const [isVisible, setIsVisible] = useState(false);

  // Zoom to region & navigation states
  const [isNavigating, setIsNavigating] = useState(false);
  const [zoomingRegion, setZoomingRegion] = useState(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [touchActiveStory, setTouchActiveStory] = useState(null);

  const heroRef = useRef(null);
  const mapViewportRef = useRef(null);
  const videoRef = useRef(null);
  const canvasMapRefs = useRef({});
  const coastlineRefs = useRef({});
  const animFrameIdRef = useRef(null);
  const stillImageRef = useRef(null);
  const navigationTimerRef = useRef(null);
  const overlayTimerRef = useRef(null);

  const activeStory = STORIES[activeZoneIndex] || STORIES[0];

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

  // 2b. IntersectionObserver & Scroll Direction Tracker (down / up)
  useEffect(() => {
    // 5. Verifikasi Console: Log jumlah elemen .reveal
    const revealElements = document.querySelectorAll('.reveal');
    console.log('reveal init', revealElements.length);

    const isMobileInit = typeof window !== 'undefined' && window.innerWidth < 768;
    document.documentElement.setAttribute('data-scroll-dir', 'down');
    document.documentElement.style.setProperty('--enter-from', isMobileInit ? '20px' : '40px');
    document.documentElement.style.setProperty('--exit-to', isMobileInit ? '-15px' : '-30px');
    document.documentElement.style.setProperty('--word-enter-y', '100%');

    // Satu IntersectionObserver (threshold 0.15)
    const heroEl = heroRef.current;
    let observer;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // Baris JS yang menambah/menghapus class is-visible (Verifikasi #4)
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
            } else {
              entry.target.classList.remove('is-visible');
            }
            if (entry.target === heroEl) {
              setIsVisible(entry.isIntersecting);
            }
          });
        },
        {
          threshold: 0.15,
          rootMargin: '0px 0px -10% 0px',
        }
      );

      if (heroEl) observer.observe(heroEl);
      revealElements.forEach((el) => observer.observe(el));
    }

    // Putar otomatis saat pertama kali dimuat jika hero sudah terlihat
    if (heroEl && typeof window !== 'undefined') {
      const rect = heroEl.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView) {
        heroEl.classList.add('is-visible');
        revealElements.forEach((el) => el.classList.add('is-visible'));
        setIsVisible(true);
      }
    }

    // Passive listener + requestAnimationFrame untuk mendeteksi arah scroll
    let lastScrollY = typeof window !== 'undefined' ? (window.scrollY || window.pageYOffset || 0) : 0;
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || window.pageYOffset || 0;
          const diff = currentScrollY - lastScrollY;

          if (Math.abs(diff) > 2) {
            const nextDir = diff > 0 ? 'down' : 'up';
            setScrollDir(nextDir);
            document.documentElement.setAttribute('data-scroll-dir', nextDir);

            const isMobile = window.innerWidth < 768;
            const enterDist = isMobile ? '20px' : '40px';
            const exitDist = isMobile ? '15px' : '30px';

            if (nextDir === 'down') {
              document.documentElement.style.setProperty('--enter-from', enterDist);
              document.documentElement.style.setProperty('--exit-to', `-${exitDist}`);
              document.documentElement.style.setProperty('--word-enter-y', '100%');
            } else {
              document.documentElement.style.setProperty('--enter-from', `-${enterDist}`);
              document.documentElement.style.setProperty('--exit-to', exitDist);
              document.documentElement.style.setProperty('--word-enter-y', '-100%');
            }
            lastScrollY = currentScrollY;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (observer) observer.disconnect();
    };
  }, []);

  // Hitung stagger delay (data-order * 100ms):
  // Scroll down: order 0 -> 4
  // Scroll up: urutan dibalik (elemen bawah muncul lebih dulu: order 4 -> 0)
  const getElementDelay = (order) => {
    const effectiveOrder = scrollDir === 'up' ? 4 - order : order;
    return effectiveOrder * 100;
  };

  const getWordDelay = (word) => {
    const baseTitleDelay = getElementDelay(1);
    const wordOrder = scrollDir === 'up' ? word.upOrder : word.downOrder;
    return baseTitleDelay + wordOrder * 60;
  };

  // Stagger delay untuk item wilayah (delay 100ms, stagger 80ms per item):
  // Saat scroll down: index 0 (Sumatera) -> index 4 (Papua & Maluku)
  // Saat scroll up: dibalik (index 4 -> index 0)
  const getZoneItemDelay = (idx) => {
    const effectiveIdx = scrollDir === 'up' ? 4 - idx : idx;
    return 100 + effectiveIdx * 80;
  };

  // Ukur panjang path SVG setiap pulau dengan getTotalLength() untuk animasi stroke-dashoffset
  useEffect(() => {
    STORIES.forEach((s) => {
      const el = coastlineRefs.current[s.id];
      if (el && typeof el.getTotalLength === 'function') {
        try {
          const len = Math.ceil(el.getTotalLength());
          el.style.setProperty('--path-length', `${len}px`);
          el.style.strokeDasharray = `${len}`;
          el.style.strokeDashoffset = isVisible ? '0' : `${len}`;
        } catch (_) {
          // Fallback aman jika SVG belum terpasang penuh
        }
      }
    });
  }, [isVisible]);

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

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [activeZoneIndex, renderCellToCanvas]);

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

  // 7. Navigasi Keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
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
  }, [isNavigating, activeZoneIndex, triggerRegionZoom]);

  // 8. Custom cursor positioning (hanya pointer halus)
  const handlePointerMove = (e) => {
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
    if (isNavigating) return;
    setCursorPos({
      x: e.clientX,
      y: e.clientY,
      visible: true,
    });
  };

  const handlePointerLeave = () => {
    setCursorPos((prev) => ({ ...prev, visible: false }));
  };

  // Scroll ke section Ringkasan Statistik (#ringkasan)
  const handleScrollToRingkasan = (e) => {
    e.preventDefault();
    const el = document.getElementById('ringkasan') || document.getElementById('tentang');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      ref={heroRef}
      className={`stories-hero ${isNavigating ? 'is-navigating' : ''} ${isVisible ? 'is-visible' : ''}`}
      aria-label="Mitigasi Bencana Nusantara — Hero Section GeoAlert"
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
        className={`sh-custom-cursor ${cursorPos.visible && !isNavigating ? 'is-visible' : ''}`}
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`,
        }}
        aria-hidden="true"
      >
        <span className="sh-cursor-text">LIHAT<br />PETA</span>
      </div>

      <div className="stories-hero-container">
        <div className="stories-hero-grid">
          {/* ================= 1. KOLOM KIRI (TEKS & AKSI) ================= */}
          <div className="stories-hero-left">
            {/* 1. Badge "GEOALERT" + Tagline (order 0) */}
            <div
              className={`stories-hero-eyebrow-row reveal reveal-eyebrow ${isVisible ? 'is-visible' : ''}`}
              data-reveal="hero-badge"
              data-order="0"
              style={{ '--delay': `${getElementDelay(0)}ms` }}
            >
              <span className="stories-hero-badge">GEOALERT</span>
              <span className="stories-hero-tagline">Deteksi Dini, Lindungi Diri</span>
            </div>

            {/* 2. Judul "Siaga bencana di seluruh Indonesia" (order 1) */}
            <h1
              className={`stories-hero-title reveal reveal-title ${isVisible ? 'is-visible' : ''}`}
              data-reveal="hero-title"
              data-order="1"
              style={{ '--delay': `${getElementDelay(1)}ms` }}
            >
              {HERO_WORDS.map((w, i) => (
                <React.Fragment key={i}>
                  <span className="sh-title-mask">
                    <span
                      className={`sh-title-word ${w.isAccent ? 'sh-terracotta sh-title-word-accent' : ''}`}
                      style={{ '--word-delay': `${getWordDelay(w)}ms` }}
                    >
                      {w.text}
                    </span>
                  </span>
                  {i < HERO_WORDS.length - 1 && ' '}
                </React.Fragment>
              ))}
            </h1>

            {/* 3. Paragraf deskripsi (order 2) */}
            <p
              className={`stories-hero-desc reveal reveal-desc ${isVisible ? 'is-visible' : ''}`}
              data-reveal="hero-desc"
              data-order="2"
              style={{ '--delay': `${getElementDelay(2)}ms` }}
            >
              Pantau potensi bencana di lima wilayah Indonesia, pelajari langkah mitigasinya, dan siapkan diri sebelum bencana terjadi. Arahkan kursor ke zona untuk melihat lebih dekat, lalu klik wilayah untuk membuka peta bencana interaktif.
            </p>

            {/* 4. Tombol Aksi (order 3 & order 4) */}
            <div className="stories-hero-actions">
              <div
                className={`sh-btn-reveal-wrap reveal reveal-btn ${isVisible ? 'is-visible' : ''}`}
                data-reveal="hero-btn-primary"
                data-order="3"
                style={{ '--delay': `${getElementDelay(3)}ms` }}
              >
                <button
                  type="button"
                  onClick={onCekBencana}
                  className="sh-btn sh-btn-primary"
                  aria-label="Cek Bencana Terdekat pada Peta Interaktif"
                >
                  <Compass size={19} aria-hidden="true" />
                  <span>Cek Bencana Terdekat</span>
                </button>
              </div>

              <div
                className={`sh-btn-reveal-wrap reveal reveal-btn ${isVisible ? 'is-visible' : ''}`}
                data-reveal="hero-btn-secondary"
                data-order="4"
                style={{ '--delay': `${getElementDelay(4)}ms` }}
              >
                <a
                  href="#ringkasan"
                  onClick={handleScrollToRingkasan}
                  className="sh-btn sh-btn-secondary"
                  aria-label="Pelajari Lebih Lanjut tentang Ringkasan GeoAlert"
                >
                  <span>Pelajari Lebih Lanjut</span>
                </a>
              </div>
            </div>
          </div>

          {/* ================= 2. KOLOM KANAN: PETA + DAFTAR WILAYAH DI DALAMNYA ================= */}
          <div className="stories-hero-right-col">
            {/* Bagian Peta Interaktif & Koordinat */}
            <div
              className="stories-hero-center"
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
            >
              {/* Koordinat Pojok Kanan Atas Peta (12-16px dari tepi) */}
              <div
                className={`sh-coords-block reveal reveal-coords ${isVisible ? 'is-visible' : ''}`}
                data-reveal="coords"
                aria-hidden="true"
              >
                <div className="sh-coord-active">
                  <CoordinateTicker text={activeStory.coords} />
                </div>
                <div className="sh-coord-secondary">0° 47' 00" S, 113° 55' 00" E</div>
              </div>

              {/* SVG Map Container */}
              <div
                ref={mapViewportRef}
                className={`sh-map-viewport reveal reveal-map ${isVisible ? 'is-visible' : ''}`}
                data-reveal="map"
              >
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
                      <clipPath key={`clip-${s.id}`} id={`sh-clip-${s.id}`}>
                        <path d={REGION_SVG_PATHS[s.id]} />
                      </clipPath>
                    ))}
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
                            transformOrigin: '820px 435px',
                            transform: 'scale(1)',
                          }
                    }
                  >
                    {/* Layer 1: Photo Fill Canvases inside Region ClipPaths */}
                    <g id="sh-photo-fills" pointerEvents="none">
                      {STORIES.map((s, idx) => {
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
                            style={{
                              '--fill-delay': `${1200 + idx * 100}ms`,
                            }}
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
                            ref={(el) => {
                              coastlineRefs.current[s.id] = el;
                            }}
                            className={`sh-coastline-path sh-region-${s.id} ${isActive ? 'is-active' : ''} ${isTarget ? 'is-target' : ''}`}
                            d={REGION_SVG_PATHS[s.id]}
                            pathLength="1"
                            style={{
                              '--coastline-delay': `${idx * 100}ms`,
                            }}
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
                            style={{
                              '--dot-delay': `${1400 + idx * 120}ms`,
                            }}
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
                            <g className="sh-dot-reveal-wrap">
                              {/* Minimum 48px hit target area */}
                              <circle cx="0" cy="0" r="24" fill="transparent" pointerEvents="all" />
                              <circle cx="0" cy="0" r="14" className="sh-dot-pulse" />
                              <circle cx="0" cy="0" r="5" className="sh-dot-core" />
                            </g>
                          </g>
                        );
                      })}
                    </g>
                  </g>
                </svg>

                {/* Touch Device Action Card */}
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
                        <span>Lihat di Peta Bencana</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bagian Daftar PILIH WILAYAH & Skala (di dalam kolom kanan) */}
            <div className={`stories-hero-right reveal ${isVisible ? 'is-visible' : ''}`} data-reveal="zone-selector">
              <div className="sh-zone-selector" role="tablist" aria-label="Pilih Wilayah Indonesia">
                <div className="sh-zone-list-wrap">
                  <div className={`sh-zone-title reveal reveal-zone-title ${isVisible ? 'is-visible' : ''}`} id="sh-zone-label" data-reveal="zone-label">PILIH WILAYAH</div>
                  <div className="sh-zone-list" aria-labelledby="sh-zone-label">
                    {STORIES.map((s, idx) => {
                      const isActive = idx === activeZoneIndex;
                      return (
                        <div
                          key={s.id}
                          className={`sh-zone-item-wrap reveal reveal-zone-item ${isVisible ? 'is-visible' : ''}`}
                          style={{
                            '--i': idx,
                            '--item-delay': `${getZoneItemDelay(idx)}ms`,
                          }}
                        >
                          <button
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
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 220px Vertical Ruler Track (Desktop only) */}
                <div className="sh-ruler-track" aria-hidden="true">
                  <div className={`sh-ruler-line reveal reveal-ruler ${isVisible ? 'is-visible' : ''}`} />
                  {Array.from({ length: 29 }).map((_, i) => (
                    <div
                      key={`tick-${i}`}
                      className={`sh-ruler-tick ${i % 7 === 0 ? 'major' : 'minor'}`}
                      style={{
                        top: `${(i / 28) * 100}%`,
                        '--tick-i': i,
                      }}
                    />
                  ))}
                  <div
                    className={`sh-ruler-marker reveal reveal-marker ${isVisible ? 'is-visible' : ''}`}
                    style={{ top: `${RULER_TOP_POSITIONS[activeZoneIndex] || 10}px` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indikator scroll kecil di tengah bawah hero */}
      <a
        href="#ringkasan"
        onClick={handleScrollToRingkasan}
        className="sh-scroll-indicator"
        aria-label="Gulir ke Ringkasan Statistik"
      >
        <span className="sh-scroll-indicator-arrow" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </a>
    </section>
  );
}
