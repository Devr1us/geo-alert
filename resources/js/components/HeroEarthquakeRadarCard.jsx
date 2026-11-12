import React, { useState, useEffect, useMemo } from 'react';

/**
 * Format jam WIB real-time (Asia/Jakarta UTC+7)
 */
function getWibTimeString() {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${formatter.format(now).replace(':', '.')} WIB`;
  } catch (_) {
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const wib = new Date(utc + 7 * 3600000);
    const hh = String(wib.getHours()).padStart(2, '0');
    const mm = String(wib.getMinutes()).padStart(2, '0');
    return `${hh}.${mm} WIB`;
  }
}

/**
 * Jarak Haversine (km) antara 2 koordinat
 */
function haversineDist(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function HeroEarthquakeRadarCard({
  events = [],
  eventsLoading = false,
  userCoords = null,
  locationName = null,
  locationStatus = 'prompt',
  areaStatus = 'safe',
  onSelectLocation,
}) {
  // 1. Jam WIB real-time
  const [wibTime, setWibTime] = useState(() => getWibTimeString());
  useEffect(() => {
    const timer = setInterval(() => {
      setWibTime(getWibTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Filter Gempa Bumi dari data BMKG
  const gempaList = useMemo(() => {
    return (events || []).filter((e) => e.type === 'Gempa Bumi');
  }, [events]);

  // 3. Rotasi data gempa tiap 6 detik jika terdapat > 1 gempa
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeState, setFadeState] = useState('is-fade-in');

  useEffect(() => {
    if (gempaList.length <= 1) return;
    const interval = setInterval(() => {
      setFadeState('is-fade-out');
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % gempaList.length);
        setFadeState('is-fade-in');
      }, 250);
    }, 6000);
    return () => clearInterval(interval);
  }, [gempaList.length]);

  const activeGempa = gempaList[currentIndex] || null;

  // 4. Titik koordinat radar (relatif terhadap posisi pengguna atau pusat Indonesia)
  const radarBlips = useMemo(() => {
    const refLat = userCoords && !isNaN(userCoords[0]) ? userCoords[0] : -2.5;
    const refLng = userCoords && !isNaN(userCoords[1]) ? userCoords[1] : 118.0;

    if (gempaList.length === 0) {
      return [
        { x: 68, y: 36, id: 'ph-1' },
        { x: 34, y: 64, id: 'ph-2' },
        { x: 60, y: 70, id: 'ph-3' },
      ];
    }

    return gempaList.slice(0, 3).map((g, idx) => {
      const gLat = typeof g.lat === 'number' && !isNaN(g.lat) ? g.lat : -2.5;
      const gLng = typeof g.lng === 'number' && !isNaN(g.lng) ? g.lng : 118.0;

      const distKm = haversineDist(refLat, refLng, gLat, gLng);
      const dLng = gLng - refLng;
      const dLat = gLat - refLat;
      const angle = Math.atan2(-dLat, dLng);

      const r = Math.min(42, Math.max(14, (distKm / 1800) * 40));
      const x = Math.round(50 + r * Math.cos(angle));
      const y = Math.round(50 + r * Math.sin(angle));

      return { x, y, id: g.id || `g-${idx}` };
    });
  }, [gempaList, userCoords]);

  // 5. Konfigurasi warna status wilayah
  const statusConfig = {
    safe: {
      label: 'Aman',
      color: '#4ADE80',
      bg: 'rgba(74, 222, 128, 0.18)',
    },
    warning: {
      label: 'Waspada',
      color: '#FFB27A',
      bg: 'rgba(255, 178, 122, 0.20)',
    },
    standby: {
      label: 'Siaga',
      color: '#FB923C',
      bg: 'rgba(251, 146, 60, 0.20)',
    },
    danger: {
      label: 'Awas',
      color: '#F87171',
      bg: 'rgba(248, 113, 113, 0.22)',
    },
  };

  const currentStatusCfg =
    locationStatus === 'ready'
      ? statusConfig[areaStatus] || statusConfig.safe
      : {
        label: 'Pilih Lokasi',
        color: '#C9D3EA',
        bg: 'rgba(201, 211, 234, 0.16)',
      };

  // 6. Hitung jarak riil dari koordinat pengguna ke pusat gempa
  const distanceKm = useMemo(() => {
    if (!userCoords || !activeGempa) return null;
    const uLat = userCoords[0];
    const uLng = userCoords[1];
    const gLat = typeof activeGempa.lat === 'number' && !isNaN(activeGempa.lat) ? activeGempa.lat : null;
    const gLng = typeof activeGempa.lng === 'number' && !isNaN(activeGempa.lng) ? activeGempa.lng : null;
    if (uLat == null || uLng == null || gLat == null || gLng == null || isNaN(uLat) || isNaN(uLng)) return null;
    return Math.round(haversineDist(uLat, uLng, gLat, gLng));
  }, [userCoords, activeGempa]);

  // 7. Format nilai & teks (dengan fallback rapi jika belum ada data)
  const rawMag = activeGempa?.magnitude || (activeGempa?.scale ? activeGempa.scale.replace('M', '').trim() : null);
  const displayMagnitude = rawMag ? `M ${rawMag}` : 'M 5.5';
  const displayLocation =
    activeGempa?.location ||
    activeGempa?.rawLocation ||
    '20 km Barat Laut Serambagiantimur, Maluku';
  const displayTime = activeGempa?.time || '09 Nov 2026 16:48:29 WIB';

  // 8. Skeleton / Loading State
  if (eventsLoading) {
    return (
      <div
        className="hero-navy-card hero-navy-card-skeleton"
        role="status"
        aria-label="Memuat data gempa BMKG…"
      >
        <div className="hero-navy-radar-wrap skeleton-pulse" />
        <div className="hero-navy-gempa-block">
          <div className="skeleton-bar" style={{ width: '90px', height: '12px', marginBottom: '6px' }} />
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="skeleton-bar" style={{ width: '70px', height: '38px', borderRadius: '6px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="skeleton-bar" style={{ width: '200px', height: '16px', borderRadius: '4px' }} />
              <div className="skeleton-bar" style={{ width: '130px', height: '12px', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
        <div className="hero-navy-divider" aria-hidden="true" />
        <div className="hero-navy-user-info">
          <div className="skeleton-bar" style={{ width: '80px', height: '36px', borderRadius: '6px' }} />
          <div className="skeleton-bar" style={{ width: '100px', height: '32px', borderRadius: '16px' }} />
          <div className="skeleton-bar" style={{ width: '80px', height: '36px', borderRadius: '6px' }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="hero-navy-card hero-status-card-animated"
      role="region"
      aria-label="Informasi Gempa Terbaru dan Status Wilayah"
    >
      {/* ================= 1. RADAR (KIRI) ================= */}
      <div className="hero-navy-radar-wrap" role="img" aria-label="Radar titik gempa">
        <svg
          className="hero-navy-radar-svg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="48" fill="rgba(255, 255, 255, 0.03)" />
          <circle cx="50" cy="50" r="16" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1" />
          <circle cx="50" cy="50" r="32" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1" />
          <circle cx="50" cy="50" r="48" stroke="rgba(255, 255, 255, 0.24)" strokeWidth="1" />
          <line x1="50" y1="2" x2="50" y2="98" stroke="rgba(255, 255, 255, 0.20)" strokeWidth="1" />
          <line x1="2" y1="50" x2="98" y2="50" stroke="rgba(255, 255, 255, 0.20)" strokeWidth="1" />
          <circle cx="50" cy="50" r="2.5" fill="#FFFFFF" />
        </svg>

        {/* Garis sapu radar (conic-gradient) */}
        <div className="hero-navy-radar-sweep" aria-hidden="true" />

        {/* Titik Gempa Berdenyut */}
        {radarBlips.map((blip, i) => {
          const isActive = i === (currentIndex % radarBlips.length);
          return (
            <div
              key={blip.id}
              className={`hero-navy-radar-blip ${isActive ? 'is-active-blip' : ''}`}
              style={{ left: `${blip.x}%`, top: `${blip.y}%` }}
              aria-hidden="true"
            >
              <span className="hero-navy-blip-core" />
              <span
                className="hero-navy-blip-pulse"
                style={{ animationDelay: `${i * 0.85}s` }}
              />
            </div>
          );
        })}
      </div>

      {/* ================= 2. GEMPA TERBARU (TENGAH-KIRI) ================= */}
      <div className={`hero-navy-gempa-block ${fadeState}`}>
        <span className="hero-navy-label">GEMPA TERBARU</span>
        <div className="hero-navy-gempa-content">
          <div className="hero-navy-magnitude">
            {displayMagnitude}
          </div>
          <div className="hero-navy-gempa-details">
            <div className="hero-navy-gempa-loc" title={displayLocation}>
              {displayLocation}
            </div>
            <div className="hero-navy-gempa-time">
              {displayTime}
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3. PEMISAH ================= */}
      <div className="hero-navy-divider" aria-hidden="true" />

      {/* ================= 4. INFO PENGGUNA (KANAN: LOKASI, STATUS, WAKTU) ================= */}
      <div className="hero-navy-user-info">
        {/* Kolom 1: LOKASI */}
        <div className="hero-navy-info-col">
          <span className="hero-navy-label">LOKASI</span>
          <div className="hero-navy-val-loc">
            <span
              className="hero-navy-loc-text"
              title={locationStatus === 'ready' && locationName ? locationName : 'Gondangrejo'}
            >
              {locationStatus === 'ready' && locationName ? locationName : 'Gondangrejo'}
            </span>
            <button
              type="button"
              onClick={onSelectLocation}
              className="hero-navy-btn-change"
              title="Ubah lokasi manual"
            >
              Ubah
            </button>
          </div>
        </div>

        {/* Kolom 2: STATUS */}
        <div className="hero-navy-info-col">
          <span className="hero-navy-label">STATUS</span>
          <div className="hero-navy-val-status">
            <span
              className="hero-navy-status-pill"
              style={{
                color: currentStatusCfg.color,
                backgroundColor: currentStatusCfg.bg,
              }}
            >
              <span
                className="hero-navy-status-dot"
                style={{ backgroundColor: currentStatusCfg.color }}
                aria-hidden="true"
              />
              <span>{currentStatusCfg.label}</span>
            </span>
          </div>
        </div>

        {/* Kolom 3: WAKTU */}
        <div className="hero-navy-info-col">
          <span className="hero-navy-label">WAKTU</span>
          <div className="hero-navy-val-time" aria-live="off">
            {wibTime}
          </div>
        </div>
      </div>
    </div>
  );
}
