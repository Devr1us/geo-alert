import React, { useRef, useState, useEffect } from 'react';

/**
 * TrustBarSection Component
 * Menampilkan bagian "Sumber Data Terintegrasi" dan "Rujukan Informasi & Standar Mitigasi"
 * dengan animasi scroll dua arah (masuk & keluar viewport) serta spacing yang rapi.
 */
export default function TrustBarSection() {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    // Observer dua arah: threshold 0.2, rootMargin "0px 0px -8% 0px"
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -8% 0px',
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`trust-bar-inline ${isVisible ? 'is-visible' : ''}`}
      data-reveal="trust-section"
    >
      {/* 1. Garis pemisah horizontal di atas (delay 0ms: scaleX 0 ke 1 dari tengah) */}
      <div className="trust-divider-line" aria-hidden="true" />

      <div className="trust-groups-wrapper">
        {/* ================= GROUP 1: SUMBER DATA TERINTEGRASI ================= */}
        <div className="trust-group">
          {/* 2. Label Group 1 (delay 100ms: fade + translateY 12px + letter-spacing) */}
          <span className="trust-bar-label" style={{ '--delay': '100ms' }}>
            SUMBER DATA TERINTEGRASI (REAL-TIME)
          </span>

          {/* 3. Chip BMKG dan NASA FIRMS (delay 200ms, stagger 90ms) */}
          <div className="trust-logos-grid">
            <div className="trust-chip-wrap" style={{ '--delay': '200ms', '--i': 0 }}>
              <a
                href="https://www.bmkg.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="trust-item-card"
                title="Badan Meteorologi, Klimatologi, & Geofisika"
              >
                <span className="trust-badge-unified">BMKG</span>
                <span className="trust-name-unified">Badan Meteorologi, Klimatologi, &amp; Geofisika</span>
              </a>
            </div>

            <div className="trust-chip-wrap" style={{ '--delay': '290ms', '--i': 1 }}>
              <a
                href="https://firms.modaps.eosdis.nasa.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="trust-item-card"
                title="NASA Fire Information for Resource Management System"
              >
                <span className="trust-badge-unified">NASA FIRMS</span>
                <span className="trust-name-unified">Pemantauan Satelit Titik Panas Karhutla</span>
              </a>
            </div>
          </div>
        </div>

        {/* ================= GROUP 2: RUJUKAN INFORMASI & STANDAR MITIGASI ================= */}
        <div className="trust-group">
          {/* 4. Label Group 2 (delay 400ms: fade + translateY 12px + letter-spacing) */}
          <span className="trust-bar-label" style={{ '--delay': '400ms' }}>
            RUJUKAN INFORMASI &amp; STANDAR MITIGASI
          </span>

          {/* 5. Chip BNPB, InaRISK, SiPongi (delay 500ms, stagger 90ms) */}
          <div className="trust-logos-grid trust-logos-grid-wide">
            <div className="trust-chip-wrap" style={{ '--delay': '500ms', '--i': 0 }}>
              <a
                href="https://www.bnpb.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="trust-item-card"
                title="Badan Nasional Penanggulangan Bencana"
              >
                <span className="trust-badge-unified badge-secondary">BNPB</span>
                <span className="trust-name-unified">Badan Penanggulangan Bencana</span>
              </a>
            </div>

            <div className="trust-chip-wrap" style={{ '--delay': '590ms', '--i': 1 }}>
              <a
                href="https://inarisk.bnpb.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="trust-item-card"
                title="Portal Risiko Bencana BNPB"
              >
                <span className="trust-badge-unified badge-secondary">InaRISK</span>
                <span className="trust-name-unified">Portal Risiko Bencana</span>
              </a>
            </div>

            <div className="trust-chip-wrap" style={{ '--delay': '680ms', '--i': 2 }}>
              <a
                href="https://sipongi.menlhk.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="trust-item-card"
                title="Sistem Pemantauan Karhutla, Kementerian Kehutanan"
              >
                <span className="trust-badge-unified badge-secondary">SiPongi</span>
                <span className="trust-name-unified">Sistem Pemantauan Karhutla, Kementerian Kehutanan</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

