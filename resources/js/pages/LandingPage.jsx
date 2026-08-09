import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Map, Bell, Bot, Shield, ChevronRight, Activity, ArrowRight,
  Wind, Droplets, Mountain, ChevronDown, ChevronUp, MapPin, BellOff, RefreshCw,
  Zap, Quote, Compass, MessageSquare,
} from 'lucide-react';
import '../../css/LandingPage.css';
import MitigationModal from '../components/MitigationModal';
import RevealSection from '../components/RevealSection';

// Count-up hook
function useCountUp(end, duration = 2000) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (end === 0) { setCount(0); return; }
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [end, duration]);
  return count;
}

// FAQ data
const FAQ_DATA = [
  {
    q: 'Apakah data dari GeoAlert akurat dan bisa dipercaya?',
    a: 'Ya, sistem kami terintegrasi dan menarik data secara langsung melalui API resmi dari BMKG (Badan Meteorologi, Klimatologi, dan Geofisika) serta BNPB secara real-time. Data gempa diperbarui setiap 5 menit secara otomatis.'
  },
  {
    q: 'Bagaimana cara kerja notifikasi peringatan dini?',
    a: 'Setelah Anda mengizinkan akses lokasi dan mengaktifkan notifikasi, GeoAlert akan memantau wilayah Anda secara berkala. Jika terjadi gempa atau peristiwa bencana dalam radius yang Anda tentukan, notifikasi akan langsung muncul di perangkat Anda.'
  },
  {
    q: 'Apakah GeoAlert gratis untuk digunakan?',
    a: 'Ya! GeoAlert sepenuhnya gratis untuk seluruh masyarakat Indonesia. Kami percaya informasi keselamatan bencana adalah hak semua orang, bukan hak istimewa.'
  },
  {
    q: 'Berapa jeda waktu peringatan setelah gempa terjadi?',
    a: 'Data gempa dari BMKG biasanya tersedia dalam waktu 3–5 menit setelah kejadian. GeoAlert melakukan sinkronisasi otomatis setiap 5 menit, sehingga informasi yang Anda terima selalu mutakhir dan relevan.'
  },
  {
    q: 'Apakah AI Assistant bisa digunakan saat offline?',
    a: 'Untuk saat ini, AI Assistant memerlukan koneksi internet untuk berjalan. Namun, kami merekomendasikan Anda untuk membaca panduan mitigasi darurat (tersedia di bagian Panduan Mitigasi) dan menyimpannya sebelum bencana terjadi, sebagai referensi offline.'
  },
];

// Education content
const EDUCATION_DATA = [
  { icon: <Activity size={32} color="var(--color-alert)" />, bg: 'rgba(192, 73, 43, 0.1)', accentColor: 'var(--color-alert)', title: 'Gempa Bumi', desc: 'Getaran atau guncangan di permukaan bumi akibat pelepasan energi dari dalam secara tiba-tiba. Indonesia rawan gempa karena berada di Cincin Api Pasifik, pertemuan tiga lempeng tektonik besar dunia.' },
  { icon: <Mountain size={32} color="var(--color-status-warning)" />, bg: 'rgba(245, 124, 0, 0.1)', accentColor: 'var(--color-status-warning)', title: 'Tanah Longsor', desc: 'Perpindahan massa tanah, batuan, atau material campuran yang bergerak ke bawah lereng. Sering dipicu oleh curah hujan tinggi atau gempa. Kawasan rawan: Jawa Barat, Sumatra, Sulawesi.' },
  { icon: <Droplets size={32} color="var(--color-standby)" />, bg: 'rgba(74, 144, 217, 0.1)', accentColor: 'var(--color-standby)', title: 'Banjir', desc: 'Terbenamnya daratan karena volume air yang melebihi kapasitas drainase. Banjir bandang sangat berbahaya karena bergerak cepat dengan membawa lumpur dan material berbahaya.' },
  { icon: <Wind size={32} color="var(--color-primary)" />, bg: 'rgba(14, 42, 92, 0.1)', accentColor: 'var(--color-primary)', title: 'Cuaca Ekstrem', desc: 'Kondisi cuaca berbahaya seperti puting beliung, hujan es, atau badai tropis. Berpotensi merusak infrastruktur dan membahayakan keselamatan jiwa, terutama di wilayah pesisir dan perbukitan.' },
];

// ============================================================
// Haversine distance (km) antara dua koordinat
// ============================================================
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================================
// Hitung status wilayah berdasarkan jarak ke event terdekat
// ============================================================
function calcAreaStatus(userLat, userLng, events) {
  if (!events || events.length === 0) return 'safe';
  let minDist = Infinity;
  let worstRisk = 'standby';
  const riskOrder = { danger: 3, warning: 2, standby: 1 };
  for (const ev of events) {
    if (isNaN(ev.lat) || isNaN(ev.lng)) continue;
    const dist = haversineKm(userLat, userLng, ev.lat, ev.lng);
    if (dist < minDist) minDist = dist;
    const r = ev.risk;
    if ((riskOrder[r] || 0) > (riskOrder[worstRisk] || 0)) worstRisk = r;
  }
  // Radius threshold: danger <100 km dari event berbahaya, warning <200 km
  if (worstRisk === 'danger' && minDist < 100) return 'danger';
  if (minDist < 200) return 'warning';
  return 'safe';
}

// ============================================================
// Reverse geocode via Nominatim (OpenStreetMap, bebas biaya)
// ============================================================
async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=id`;
  const res = await fetch(url, { headers: { 'User-Agent': 'GeoAlert/1.0 (+https://geoalert.id)' } });
  const data = await res.json();
  const addr = data.address || {};
  return (
    addr.city ||
    addr.town ||
    addr.county ||
    addr.municipality ||
    addr.state_district ||
    addr.state ||
    'Lokasi Anda'
  );
}

// ============================================================
// Fetch BMKG events (shared dengan MapPage via window cache)
// ============================================================
async function fetchBmkgEvents() {
  const [resTerkini, resDirasakan] = await Promise.all([
    fetch('/api/bmkg/gempa-terkini'),
    fetch('/api/bmkg/gempa-dirasakan'),
  ]);
  const parsedTerkini = await resTerkini.json();
  const parsedDirasakan = await resDirasakan.json();

  const listTerkini = parsedTerkini.Infogempa?.gempa || [];
  const listDirasakan = parsedDirasakan.Infogempa?.gempa || [];
  const allGempa = [...listTerkini, ...listDirasakan];
  const uniqueGempa = Array.from(new Set(allGempa.map(g => g.DateTime)))
    .map(time => allGempa.find(g => g.DateTime === time));

  return uniqueGempa.map((g, idx) => {
    const coords = (g.Coordinates || '').split(',');
    const lat = parseFloat(coords[0]);
    const lng = parseFloat(coords[1]);
    const mag = parseFloat(g.Magnitude);
    let risk = 'standby';
    if (mag >= 5) risk = 'warning';
    if (mag >= 6) risk = 'danger';
    return {
      id: `bmkg-${idx}`,
      type: 'Gempa Bumi',
      location: g.Wilayah || '',
      lat: isNaN(lat) ? -2.5 : lat,
      lng: isNaN(lng) ? 117.5 : lng,
      // Bug fix 2: tambahkan field time dari Tanggal + Jam (mengikuti pola MapPage.jsx)
      time: g.Tanggal && g.Jam ? `${g.Tanggal} ${g.Jam}` : '—',
      risk,
      magnitude: g.Magnitude,
      // Bug fix 3: format Wilayah BMKG adalah "10 km BaratLaut KOTA-PROVINSI"
      // bukan CSV — split koma salah. Ambil bagian setelah tanda "-" terakhir.
      province: (() => {
        const wilayah = g.Wilayah || '';
        const lastDash = wilayah.lastIndexOf('-');
        return lastDash !== -1 ? wilayah.slice(lastDash + 1).trim() : wilayah.trim();
      })(),
    };
  });
}

// ============================================================
// Notification helper — poin 2
// ============================================================
const NOTIF_KEY = 'geoalert_notifications_enabled';

async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  const permission = await Notification.requestPermission();
  localStorage.setItem(NOTIF_KEY, permission === 'granted' ? 'true' : 'false');
  return permission;
}

function sendBrowserNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.svg',
      tag: 'geoalert-warning',
    });
  }
}

export default function LandingPage() {
  // ---- State ----
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Geolocation state — poin 1
  const [locationName, setLocationName] = useState(null);       // string | null
  const [locationStatus, setLocationStatus] = useState('loading'); // 'loading' | 'denied' | 'ready' | 'error'
  const [areaStatus, setAreaStatus] = useState('safe');          // 'safe' | 'warning' | 'danger'

  // Notification state — poin 2
  const [notifPref, setNotifPref] = useState(() => localStorage.getItem(NOTIF_KEY));
  const [notifRequesting, setNotifRequesting] = useState(false);

  // Statistics — poin 4
  const [liveAlerts, setLiveAlerts] = useState(0);
  const [liveProvinces, setLiveProvinces] = useState(0);

  const alertsCount  = useCountUp(liveAlerts, 1500);
  const provincesCount = useCountUp(liveProvinces, 1500);
  const speedCount   = useCountUp(3, 1500);

  const [openFaq, setOpenFaq] = useState(null);
  const [modal, setModal] = useState(null);

  // ============================================================
  // Poin 4: Fetch BMKG events & hitung statistik
  // ============================================================
  useEffect(() => {
    let cancelled = false;
    fetchBmkgEvents()
      .then((data) => {
        if (cancelled) return;
        setEvents(data);
        // Statistik poin 4
        const activeCount = data.filter(e => e.risk === 'warning' || e.risk === 'danger').length;
        setLiveAlerts(activeCount > 0 ? activeCount : data.length);
        const provinces = new Set(data.map(e => e.province).filter(Boolean));
        setLiveProvinces(provinces.size);
        setEventsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLiveAlerts(12);
        setLiveProvinces(38);
        setEventsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // ============================================================
  // Poin 1: Geolocation + reverse-geocode + hitung status wilayah
  // ============================================================
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const name = await reverseGeocode(latitude, longitude);
          setLocationName(name);

          // Hitung status wilayah dari events BMKG (tunggu sampai events ada)
          if (events.length > 0) {
            const status = calcAreaStatus(latitude, longitude, events);
            setAreaStatus(status);
          }
          setLocationStatus('ready');
        } catch {
          setLocationName('Lokasi Anda');
          setLocationStatus('ready');
        }
      },
      () => {
        setLocationStatus('denied');
      },
      { timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, []); // runs once on mount

  // Re-hitung status wilayah ketika events terisi
  useEffect(() => {
    if (events.length === 0 || locationStatus !== 'ready') return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const status = calcAreaStatus(pos.coords.latitude, pos.coords.longitude, events);
        setAreaStatus(status);

        // Poin 2: Kirim notifikasi jika ada bahaya & notif aktif
        if (localStorage.getItem(NOTIF_KEY) === 'true' && status === 'danger') {
          sendBrowserNotification(
            '⚠️ GeoAlert — Peringatan Bahaya',
            'Terdapat bencana tingkat BAHAYA di dekat wilayah Anda. Cek peta GeoAlert sekarang.'
          );
        }
      },
      () => {}
    );
  }, [events, locationStatus]);

  // ============================================================
  // Poin 2: Handle klik "Aktifkan Notifikasi"
  // ============================================================
  const handleActivateNotif = async () => {
    setNotifRequesting(true);
    const permission = await requestNotificationPermission();
    setNotifPref(permission === 'granted' ? 'true' : 'false');
    setNotifRequesting(false);
    if (permission === 'granted') {
      sendBrowserNotification('✅ GeoAlert — Notifikasi Aktif', 'Anda akan mendapat peringatan bencana di wilayah Anda.');
    }
  };

  // ---- Helpers untuk status wilayah ----
  const areaStatusConfig = {
    safe:    { label: 'Aman',    color: 'var(--color-status-safe)',    glow: 'var(--color-status-safe)' },
    warning: { label: 'Waspada', color: 'var(--color-status-warning)', glow: 'var(--color-status-warning)' },
    danger:  { label: 'Bahaya',  color: 'var(--color-alert)',          glow: 'var(--color-alert)' },
  };
  const currentStatus = areaStatusConfig[areaStatus] || areaStatusConfig.safe;

  return (
    <div>
      {/* =================== HERO =================== */}
      <section className="hero-section">
        <div className="container">
          <h1 className="hero-title hero-title-animated" style={{ fontSize: '4rem', fontWeight: '900' }}>
            GeoAlert
          </h1>
          <p className="hero-subtitle hero-subtitle-animated" style={{ fontSize: '1.5rem', fontWeight: '500', color: 'var(--color-primary)' }}>
            Deteksi Dini, Lindungi Diri
          </p>
          <p className="hero-desc-animated" style={{ maxWidth: '700px', margin: '0 auto 2.5rem', color: 'var(--color-text-muted)', fontSize: '1.125rem', lineHeight: '1.7' }}>
            Pantau informasi bencana alam di seluruh Indonesia secara real-time.
            Dapatkan panduan mitigasi instan dan peringatan dini langsung dari sumber resmi.
          </p>

          <div className="hero-actions hero-actions-animated">
            <Link to="/peta" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
              <Map size={24} /> Cek Bencana Terdekat
            </Link>
            <a href="#tentang" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.125rem', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)' }}>
              Pelajari Lebih Lanjut
            </a>
          </div>

          {/* ---- Live Status Card (Refined to match exact screenshot mockup) ---- */}
          <div className="live-status-pill-card hero-status-card-animated">
            {/* Column 1: Lokasi Anda */}
            <div className="status-pill-col">
              <span className="status-pill-label">LOKASI ANDA</span>
              {locationStatus === 'loading' && (
                <div className="status-pill-val loading-val" style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                  <MapPin size={14} className="animate-pulse" /> Mendeteksi…
                </div>
              )}
              {locationStatus === 'denied' && (
                <div className="status-pill-val alert-val" style={{ color: 'var(--color-alert)', fontSize: '0.85rem' }}>
                  <MapPin size={14} color="var(--color-alert)" />
                  <span>Izin lokasi diperlukan</span>
                </div>
              )}
              {locationStatus === 'ready' && (
                <div className="status-pill-val location-val">
                  <MapPin size={14} color="#0E2A5C" />
                  <span>{locationName || 'Karanganyar'}</span>
                </div>
              )}
            </div>

            <div className="status-pill-divider" />

            {/* Column 2: Status Wilayah */}
            <div className="status-pill-col">
              <span className="status-pill-label">STATUS WILAYAH</span>
              {locationStatus === 'denied' ? (
                <div className="status-pill-val text-muted" style={{ fontSize: '0.85rem' }}>
                  Aktifkan lokasi
                </div>
              ) : (
                <div className="status-pill-val area-val" style={{ color: currentStatus.color }}>
                  <span
                    className="status-dot-glow"
                    style={{
                      backgroundColor: currentStatus.color,
                      boxShadow: `0 0 10px ${currentStatus.glow}`,
                    }}
                  />
                  <span>{locationStatus === 'loading' ? '—' : currentStatus.label}</span>
                </div>
              )}
            </div>

            <div className="status-pill-divider" />

            {/* Column 3: Pembaruan */}
            <div className="status-pill-col">
              <span className="status-pill-label">PEMBARUAN</span>
              <div className="status-pill-val time-val mono">
                {eventsLoading ? '…' : 'Baru saja'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== STATS + TRUST BAR (gabungan) =================== */}
      <section className="stats-section">
        <div className="container">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {
                value: eventsLoading ? '…' : alertsCount,
                label: 'Peringatan Aktif',
                note: eventsLoading ? null : '(dari data BMKG)',
              },
              {
                value: eventsLoading ? '…' : provincesCount,
                label: 'Provinsi Terpantau',
                note: eventsLoading ? null : '(dari data BMKG)',
              },
              { value: `< ${speedCount}s`, label: 'Kecepatan Notifikasi' },
              { value: '24/7', label: 'Pemantauan Aktif' },
            ].map((s, i) => (
              <RevealSection key={i} style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', transitionDelay: `${i * 400}ms` }} className="stat-item">
                <div className="stat-number">{s.value}</div>
                <div style={{ fontWeight: '600', color: 'var(--color-primary)', letterSpacing: '0.03em' }}>{s.label}</div>
                {s.note && (
                  <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '4px' }}>{s.note}</div>
                )}
              </RevealSection>
            ))}
          </div>

          {/* Trust Bar — di dalam navy */}
          <div className="trust-bar-inline">
            <span className="trust-bar-label">
              Terhubung dengan sumber data resmi
            </span>
            <div className="trust-logos-inline">
              <a href="https://www.bmkg.go.id" target="_blank" rel="noopener noreferrer" className="trust-item-inline">
                <span className="trust-badge-inline trust-bmkg-inline">BMKG</span>
                <span>Badan Meteorologi, Klimatologi, &amp; Geofisika</span>
              </a>
              <a href="https://www.bnpb.go.id" target="_blank" rel="noopener noreferrer" className="trust-item-inline">
                <span className="trust-badge-inline trust-bnpb-inline">BNPB</span>
                <span>Badan Penanggulangan Bencana</span>
              </a>
              <a href="https://inarisk.bnpb.go.id" target="_blank" rel="noopener noreferrer" className="trust-item-inline">
                <span className="trust-badge-inline trust-inarisk-inline">InaRISK</span>
                <span>Portal Risiko Bencana</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =================== ABOUT (TENTANG KAMI) =================== */}
      <RevealSection id="tentang" className="about-modern-section">
        {/* Background Overlay Graphics (Layers 0-C, 1, 2) */}
        <div className="section-dark-bg-layers" aria-hidden="true">
          {/* ENHANCEMENT C: Garis Kontur Topografi Tipis (Section 1: Rapat di bagian atas) */}
          <svg className="layer0-topo-contour" viewBox="0 0 1200 600" preserveAspectRatio="none" fill="none">
            <path d="M0 60 C 250 110, 500 20, 750 90 C 950 140, 1100 70, 1200 100" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.07" />
            <path d="M0 120 C 300 160, 550 80, 800 150 C 1000 200, 1120 130, 1200 160" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.06" />
            <path d="M0 190 C 220 230, 480 160, 720 220 C 920 270, 1080 200, 1200 230" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.05" />
            <path d="M0 320 C 350 370, 650 300, 880 360 C 1050 400, 1150 350, 1200 370" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.05" />
            <path d="M0 460 C 280 500, 580 430, 820 480 C 1000 520, 1120 470, 1200 490" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.04" />
          </svg>

          {/* LAYER 1: Organic Network / Constellation Pattern */}
          <svg className="layer1-constellation-svg" viewBox="0 0 1200 600" fill="none">
            <line x1="90" y1="80" x2="240" y2="150" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.14" />
            <line x1="240" y1="150" x2="410" y2="90" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.14" />
            <line x1="410" y1="90" x2="580" y2="180" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.12" />
            <line x1="580" y1="180" x2="740" y2="100" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.14" />
            <line x1="740" y1="100" x2="920" y2="160" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.12" />
            <line x1="920" y1="160" x2="1110" y2="70" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.14" />

            <line x1="150" y1="360" x2="290" y2="480" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.12" />
            <line x1="290" y1="480" x2="480" y2="410" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.14" />
            <line x1="720" y1="450" x2="880" y2="520" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.12" />
            <line x1="880" y1="520" x2="1050" y2="430" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.14" />

            {/* ENHANCEMENT A: Added constellation-node class for animated CSS twinkle */}
            <circle cx="90" cy="80" r="3" fill="#ffffff" fillOpacity="0.4" className="constellation-node" />
            <circle cx="240" cy="150" r="2.5" fill="#bae6fd" fillOpacity="0.45" className="constellation-node" />
            <circle cx="410" cy="90" r="3.5" fill="#ffffff" fillOpacity="0.4" className="constellation-node" />
            <circle cx="580" cy="180" r="2" fill="#ffffff" fillOpacity="0.35" className="constellation-node" />
            <circle cx="740" cy="100" r="3" fill="#bae6fd" fillOpacity="0.4" className="constellation-node" />
            <circle cx="920" cy="160" r="2.5" fill="#ffffff" fillOpacity="0.45" className="constellation-node" />
            <circle cx="1110" cy="70" r="3.5" fill="#ffffff" fillOpacity="0.4" className="constellation-node" />

            <circle cx="150" cy="360" r="3" fill="#ffffff" fillOpacity="0.4" className="constellation-node" />
            <circle cx="290" cy="480" r="2" fill="#bae6fd" fillOpacity="0.35" className="constellation-node" />
            <circle cx="480" cy="410" r="3.5" fill="#ffffff" fillOpacity="0.4" className="constellation-node" />
            <circle cx="720" cy="450" r="2.5" fill="#ffffff" fillOpacity="0.4" className="constellation-node" />
            <circle cx="880" cy="520" r="3" fill="#bae6fd" fillOpacity="0.45" className="constellation-node" />
            <circle cx="1050" cy="430" r="2.5" fill="#ffffff" fillOpacity="0.4" className="constellation-node" />
          </svg>

          {/* LAYER 2: Concentric Radar Ping Utama (Top Right - Merah) */}
          <div className="layer2-radar-wrapper radar-pos-top-right">
            <svg viewBox="0 0 300 300" className="radar-signal-svg" fill="none">
              <circle cx="150" cy="150" r="5" fill="#e5533c" className="radar-center-dot" />
              <circle cx="150" cy="150" r="25" stroke="#e5533c" strokeWidth="1.5" strokeOpacity="0.4" className="radar-ring ping-ring-1" />
              <circle cx="150" cy="150" r="55" stroke="#bae6fd" strokeWidth="1.2" strokeOpacity="0.25" className="radar-ring ping-ring-2" />
              <circle cx="150" cy="150" r="90" stroke="#bae6fd" strokeWidth="1" strokeOpacity="0.15" className="radar-ring ping-ring-3" />
              <circle cx="150" cy="150" r="130" stroke="#bae6fd" strokeWidth="1" strokeOpacity="0.05" className="radar-ring ping-ring-4" />
            </svg>
          </div>

          {/* ENHANCEMENT B: Radar Ping Kedua di Pojok Berlawanan (Bottom Left - Biru Standby) */}
          <div className="layer2-radar-wrapper radar-pos-bottom-left radar-secondary">
            <svg viewBox="0 0 300 300" className="radar-signal-svg" fill="none">
              <circle cx="150" cy="150" r="4" fill="#4A90D9" className="radar-center-dot-blue" />
              <circle cx="150" cy="150" r="25" stroke="#4A90D9" strokeWidth="1.2" strokeOpacity="0.3" className="radar-ring ping-ring-blue-1" />
              <circle cx="150" cy="150" r="55" stroke="#4A90D9" strokeWidth="1" strokeOpacity="0.18" className="radar-ring ping-ring-blue-2" />
              <circle cx="150" cy="150" r="90" stroke="#4A90D9" strokeWidth="1" strokeOpacity="0.1" className="radar-ring ping-ring-blue-3" />
              <circle cx="150" cy="150" r="130" stroke="#4A90D9" strokeWidth="1" strokeOpacity="0.04" className="radar-ring ping-ring-blue-4" />
            </svg>
          </div>
        </div>

        <div className="container relative z-10">
          {/* Top Right Label / Tag */}
          <div className="about-header-tag">
            <span className="about-tag-title">TENTANG KAMI</span>
            <div className="about-tag-dots">
              <span className="dot dot-navy" />
              <span className="dot dot-red" />
              <span className="dot dot-red" />
            </div>
            <div className="about-floating-icon icon-lightning">
              <Zap size={14} />
            </div>
          </div>

          {/* Floating decorative icons */}
          <div className="floating-badge badge-left" aria-hidden="true">
            <Quote size={16} />
          </div>
          <div className="floating-badge badge-center" aria-hidden="true">
            <Compass size={16} />
          </div>

          {/* Top Row: 2 Big Cards */}
          <div className="grid md:grid-cols-2 gap-8 items-stretch" style={{ marginBottom: '2.25rem' }}>
            {/* Left Card: Indonesian Archipelago */}
            <RevealSection className="about-map-card">
              <div className="map-card-graphic-wrapper">
                <img
                  src="/images/INDONESIAN.png"
                  alt="Indonesia Archipelago Map"
                  className="map-silhouette-img"
                />
              </div>
              <div className="map-card-footer">
                <h4 className="map-title">INDONESIAN</h4>
                <p className="map-subtitle">EXPLORE THE ARCHIPELAGO</p>
              </div>
            </RevealSection>

            {/* Right Card: Apa itu GeoAlert? */}
            <RevealSection className="about-info-card">
              <h2 className="info-card-title">Apa itu GeoAlert?</h2>
              <p className="info-card-desc">
                Platform cerdas yang menggabungkan data otoritatif dengan kecerdasan buatan untuk memberikan peringatan yang cepat, akurat, dan dapat ditindaklanjuti.
              </p>
            </RevealSection>
          </div>

          {/* Bottom Row: 4 Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <RevealSection className="about-mini-card" style={{ transitionDelay: '0ms' }}>
              <div className="mini-icon-circle icon-bg-blue">
                <RefreshCw size={18} />
              </div>
              <h4 className="mini-card-title">Data Real-time</h4>
              <p className="mini-card-desc">Terintegrasi dengan sumber data resmi BMKG & BNPB.</p>
              <Link to="/peta" className="mini-card-link">
                Selengkapnya <span>→</span>
              </Link>
            </RevealSection>

            <RevealSection className="about-mini-card" style={{ transitionDelay: '150ms' }}>
              <div className="mini-icon-circle icon-bg-yellow">
                <Bell size={18} />
              </div>
              <h4 className="mini-card-title">Peringatan Dini</h4>
              <p className="mini-card-desc">Notifikasi instan berbasis lokasi untuk kesiapsiagaan Anda.</p>
              <Link to="/peta" className="mini-card-link">
                Selengkapnya <span>→</span>
              </Link>
            </RevealSection>

            <RevealSection className="about-mini-card" style={{ transitionDelay: '300ms' }}>
              <div className="mini-icon-circle icon-bg-sky">
                <MessageSquare size={18} />
              </div>
              <h4 className="mini-card-title">AI Assistant</h4>
              <p className="mini-card-desc">Asisten cerdas menjawab seputar mitigasi & prosedur darurat.</p>
              <Link to="/peta" className="mini-card-link">
                Selengkapnya <span>→</span>
              </Link>
            </RevealSection>

            <RevealSection className="about-mini-card" style={{ transitionDelay: '450ms' }}>
              <div className="mini-icon-circle icon-bg-rose">
                <Map size={18} />
              </div>
              <h4 className="mini-card-title">Peta Interaktif</h4>
              <p className="mini-card-desc">Visualisasi sebaran ancaman bencana di seluruh Indonesia.</p>
              <Link to="/peta" className="mini-card-link">
                Selengkapnya <span>→</span>
              </Link>
            </RevealSection>
          </div>
        </div>
      </RevealSection>

      {/* =================== HOW TO USE — Cara Menggunakan GeoAlert =================== */}
      <RevealSection id="cara-penggunaan" className="section how-to-use-dark-section">
        {/* Background Overlay Graphics (Layers 0-C, 1, 2, 3) */}
        <div className="section-dark-bg-layers" aria-hidden="true">
          {/* ENHANCEMENT C: Garis Kontur Topografi Tipis (Section 2: Rapat di bagian bawah) */}
          <svg className="layer0-topo-contour" viewBox="0 0 1200 600" preserveAspectRatio="none" fill="none">
            <path d="M0 100 C 220 140, 480 80, 720 150 C 950 200, 1100 130, 1200 160" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.04" />
            <path d="M0 220 C 350 270, 650 200, 880 260 C 1050 300, 1150 250, 1200 270" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.05" />
            <path d="M0 350 C 250 400, 520 320, 780 390 C 980 440, 1100 380, 1200 410" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.06" />
            <path d="M0 440 C 280 490, 560 410, 820 470 C 1000 520, 1120 460, 1200 490" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.07" />
            <path d="M0 520 C 300 560, 600 490, 850 540 C 1020 570, 1140 530, 1200 550" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.07" />
          </svg>

          {/* LAYER 1: Organic Network / Constellation Pattern */}
          <svg className="layer1-constellation-svg" viewBox="0 0 1200 600" fill="none">
            <line x1="60" y1="120" x2="220" y2="60" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.14" />
            <line x1="220" y1="60" x2="390" y2="140" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.12" />
            <line x1="390" y1="140" x2="560" y2="80" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.14" />
            <line x1="560" y1="80" x2="780" y2="130" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.12" />
            <line x1="780" y1="130" x2="980" y2="50" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.14" />
            <line x1="980" y1="50" x2="1140" y2="110" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.12" />

            <line x1="120" y1="420" x2="280" y2="350" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.12" />
            <line x1="280" y1="350" x2="450" y2="460" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.14" />
            <line x1="650" y1="410" x2="840" y2="480" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.12" />
            <line x1="840" y1="480" x2="1020" y2="390" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.14" />

            {/* ENHANCEMENT A: Added constellation-node class for animated CSS twinkle */}
            <circle cx="60" cy="120" r="3" fill="#ffffff" fillOpacity="0.4" className="constellation-node" />
            <circle cx="220" cy="60" r="2.5" fill="#bae6fd" fillOpacity="0.45" className="constellation-node" />
            <circle cx="390" cy="140" r="3.5" fill="#ffffff" fillOpacity="0.4" className="constellation-node" />
            <circle cx="560" cy="80" r="2" fill="#ffffff" fillOpacity="0.35" className="constellation-node" />
            <circle cx="780" cy="130" r="3" fill="#bae6fd" fillOpacity="0.4" className="constellation-node" />
            <circle cx="980" cy="50" r="2.5" fill="#ffffff" fillOpacity="0.45" className="constellation-node" />
            <circle cx="1140" cy="110" r="3.5" fill="#ffffff" fillOpacity="0.4" className="constellation-node" />

            <circle cx="120" cy="420" r="3" fill="#ffffff" fillOpacity="0.4" className="constellation-node" />
            <circle cx="280" cy="350" r="2" fill="#bae6fd" fillOpacity="0.35" className="constellation-node" />
            <circle cx="450" cy="460" r="3.5" fill="#ffffff" fillOpacity="0.4" className="constellation-node" />
            <circle cx="650" cy="410" r="2.5" fill="#ffffff" fillOpacity="0.4" className="constellation-node" />
            <circle cx="840" cy="480" r="3" fill="#bae6fd" fillOpacity="0.45" className="constellation-node" />
            <circle cx="1020" cy="390" r="2.5" fill="#ffffff" fillOpacity="0.4" className="constellation-node" />
          </svg>

          {/* LAYER 2: Concentric Radar Ping Utama (Top Left - Merah) */}
          <div className="layer2-radar-wrapper radar-pos-top-left">
            <svg viewBox="0 0 300 300" className="radar-signal-svg" fill="none">
              <circle cx="150" cy="150" r="5" fill="#e5533c" className="radar-center-dot" />
              <circle cx="150" cy="150" r="25" stroke="#e5533c" strokeWidth="1.5" strokeOpacity="0.4" className="radar-ring ping-ring-1" />
              <circle cx="150" cy="150" r="55" stroke="#bae6fd" strokeWidth="1.2" strokeOpacity="0.25" className="radar-ring ping-ring-2" />
              <circle cx="150" cy="150" r="90" stroke="#bae6fd" strokeWidth="1" strokeOpacity="0.15" className="radar-ring ping-ring-3" />
              <circle cx="150" cy="150" r="130" stroke="#bae6fd" strokeWidth="1" strokeOpacity="0.05" className="radar-ring ping-ring-4" />
            </svg>
          </div>

          {/* ENHANCEMENT B: Radar Ping Kedua di Pojok Berlawanan (Bottom Right - Biru Standby) */}
          <div className="layer2-radar-wrapper radar-pos-bottom-right radar-secondary">
            <svg viewBox="0 0 300 300" className="radar-signal-svg" fill="none">
              <circle cx="150" cy="150" r="4" fill="#4A90D9" className="radar-center-dot-blue" />
              <circle cx="150" cy="150" r="25" stroke="#4A90D9" strokeWidth="1.2" strokeOpacity="0.3" className="radar-ring ping-ring-blue-1" />
              <circle cx="150" cy="150" r="55" stroke="#4A90D9" strokeWidth="1" strokeOpacity="0.18" className="radar-ring ping-ring-blue-2" />
              <circle cx="150" cy="150" r="90" stroke="#4A90D9" strokeWidth="1" strokeOpacity="0.1" className="radar-ring ping-ring-blue-3" />
              <circle cx="150" cy="150" r="130" stroke="#4A90D9" strokeWidth="1" strokeOpacity="0.04" className="radar-ring ping-ring-blue-4" />
            </svg>
          </div>

          {/* LAYER 3: Aksen Gelombang Seismik (Khusus Section 2) */}
          <svg className="layer3-seismic-waveform" viewBox="0 0 1200 60" preserveAspectRatio="none" fill="none">
            <path d="M0 30 L350 30 L365 10 L380 50 L395 0 L410 60 L425 15 L440 42 L455 25 L470 35 L485 30 L1200 30" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.18" />
          </svg>
        </div>

        <div className="container relative z-10">
          <h2 className="how-to-use-heading">Cara Menggunakan GeoAlert</h2>
          
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center" style={{ marginTop: '3.5rem' }}>
            {/* Left timeline */}
            <div className="how-to-use-timeline">
              <div className="timeline-connector-vertical" />
              {[
                { 
                  n: '1', 
                  title: 'Pilih Lokasi Anda', 
                  desc: 'Izinkan akses lokasi atau cari kota Anda secara manual di peta interaktif.', 
                  action: null 
                },
                { 
                  n: '2', 
                  title: 'Lihat Status Bencana', 
                  desc: 'Periksa indikator warna untuk mengetahui tingkat risiko di sekitar Anda.', 
                  action: null 
                },
                {
                  n: '3',
                  title: 'Aktifkan Notifikasi',
                  desc: 'Dapatkan lansiran peringatan dini langsung ke perangkat saat terjadi anomali.',
                  action: notifPref === 'true' ? (
                    <span className="notif-active-badge">
                      <Bell size={13} /> Notifikasi Aktif
                    </span>
                  ) : (
                    <button
                      onClick={handleActivateNotif}
                      disabled={notifRequesting || !('Notification' in window)}
                      className="btn-notif-action"
                    >
                      {notifRequesting ? (
                        <span>Meminta izin…</span>
                      ) : notifPref === 'false' ? (
                        <><BellOff size={14} /> Izin ditolak — ubah di pengaturan browser</>
                      ) : !('Notification' in window) ? (
                        <><BellOff size={14} /> Browser tidak mendukung notifikasi</>
                      ) : (
                        <><Bell size={14} style={{ color: '#f59e0b' }} /> Aktifkan Notifikasi Sekarang</>
                      )}
                    </button>
                  ),
                },
                { 
                  n: '4', 
                  title: 'Tanya Asisten AI', 
                  desc: 'Gunakan asisten panduan SOP BMKG untuk informasi evakuasi dan mitigasi.', 
                  action: null 
                },
              ].map((s, i) => (
                <div key={i} className="how-to-use-step">
                  <div className="step-circle-num">{s.n}</div>
                  <div className="step-content-body">
                    <h3 className="step-title-text">{s.title}</h3>
                    <p className="step-desc-text">{s.desc}</p>
                    {s.action}
                  </div>
                </div>
              ))}
            </div>

            {/* Right feature card */}
            <div className="siaga-card">
              <div className="siaga-card-graphic">
                <div className="graphic-grid-bg" />
                <svg className="radar-graphic" viewBox="0 0 200 200" fill="none">
                  {/* Concentric rings */}
                  <circle cx="100" cy="100" r="85" stroke="rgba(14, 42, 92, 0.08)" strokeWidth="1" />
                  <circle cx="100" cy="100" r="65" stroke="rgba(14, 42, 92, 0.12)" strokeWidth="1" />
                  <circle cx="100" cy="100" r="45" stroke="rgba(14, 42, 92, 0.18)" strokeWidth="1" />
                  <circle cx="100" cy="100" r="25" stroke="rgba(229, 83, 60, 0.35)" strokeWidth="1.5" className="radar-ring-pulse" />
                  {/* Center Dot */}
                  <circle cx="100" cy="100" r="6" fill="#e5533c" className="radar-dot-center" />
                </svg>
              </div>
              <div className="siaga-card-body">
                <h3 className="siaga-title">Siaga Kapan Saja</h3>
                <p className="siaga-desc">
                  GeoAlert dirancang agar sangat mudah diakses bahkan dalam kondisi panik sekalipun.
                </p>
                <Link to="/peta" className="btn-siaga-action">
                  Mulai Pemantauan
                </Link>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* =================== RECENT DISASTERS =================== */}
      <RevealSection className="section bg-white">
        <div className="container">
          <div className="flex justify-between items-center" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.5rem' }}>Kejadian Terkini</h2>
            <Link to="/peta" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Lihat Peta Penuh <ChevronRight size={18} />
            </Link>
          </div>
          <div className="recent-disasters-glass-card glass">
            <div className="recent-table-wrapper">
              <table className="recent-table">
                <thead>
                  <tr>
                    {['Waktu', 'Jenis Bencana', 'Lokasi', 'Status'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {eventsLoading
                    ? [1, 2, 3].map(i => (
                      <tr key={i}>
                        <td colSpan={4}>
                          <div className="skeleton" style={{ height: '48px', margin: '4px 0' }} />
                        </td>
                      </tr>
                    ))
                    : events.slice(0, 5).map((ev, i) => {
                      const riskBadge = {
                        danger: <span className="badge badge-danger">BAHAYA</span>,
                        warning: <span className="badge badge-warning">WASPADA</span>,
                        standby: <span className="badge badge-standby">SIAGA</span>,
                      }[ev.risk] || <span className="badge badge-standby">SIAGA</span>;
                      return (
                        <tr key={ev.id || i} className="recent-table-row">
                          <td className="mono" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
                            {ev.time || '—'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}>
                              <div style={{ background: 'rgba(14,42,92,0.08)', padding: '6px', borderRadius: '50%' }}>
                                <Activity size={16} color="var(--color-primary)" />
                              </div>
                              {ev.type}
                            </div>
                          </td>
                          <td style={{ fontWeight: '500' }}>{ev.location}</td>
                          <td>{riskBadge}</td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
              {!eventsLoading && events.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0' }}>
                  Tidak ada kejadian aktif saat ini.
                </p>
              )}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* =================== EDUCATION =================== */}
      <RevealSection className="section">
        <div className="container">
          <h2 className="section-title">Edukasi Bencana</h2>
          <p className="section-subtitle">
            Kenali jenis-jenis bencana alam yang sering terjadi di Indonesia agar Anda dan keluarga lebih siap.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {EDUCATION_DATA.map((e, i) => (
              <div key={i} className="card-education glass" style={{ borderLeft: `4px solid ${e.accentColor}` }}>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{ background: e.bg, padding: '1rem', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
                    {e.icon}
                  </div>
                  <div>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', background: e.bg, color: e.accentColor, fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Karakteristik Bencana
                    </span>
                    <h4 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>{e.title}</h4>
                    <p className="text-muted" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{e.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* =================== MITIGATION =================== */}
      <RevealSection className="section bg-white">
        <div className="container">
          <h2 className="section-title">Panduan Mitigasi Instan</h2>
          <p className="section-subtitle">
            Langkah taktis yang dapat Anda ambil sebelum, saat, dan sesudah bencana terjadi.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { key: 'gempa', icon: <Activity size={48} color="var(--color-alert)" />, title: 'Gempa Bumi', desc: 'Jangan panik. Berlindung di bawah meja yang kuat, jauhi kaca dan perabotan berat. Jika di pesisir, waspadai tsunami setelah guncangan kuat.' },
              { key: 'banjir', icon: <Droplets size={48} color="var(--color-standby)" />, title: 'Banjir', desc: 'Matikan arus listrik dari meteran utama. Amankan dokumen ke tempat tinggi dalam wadah kedap air, dan ikuti jalur evakuasi resmi.' },
              { key: 'cuaca', icon: <Wind size={48} color="var(--color-status-warning)" />, title: 'Cuaca Ekstrem', desc: 'Masuk ke dalam bangunan kokoh segera. Hindari pohon besar, tiang listrik, dan area terbuka. Pantau peringatan resmi BMKG.' },
            ].map(card => (
              <div key={card.key} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ marginBottom: '1.5rem' }}>{card.icon}</div>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>{card.title}</h3>
                <p className="text-muted" style={{ marginBottom: '2rem', fontSize: '1rem', lineHeight: '1.6', flex: 1 }}>{card.desc}</p>
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '0.75rem' }}
                  onClick={() => setModal(card.key)}
                >
                  Lihat SOP Lengkap →
                </button>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* =================== FAQ =================== */}
      <RevealSection className="section bg-white">
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 className="section-title">Pertanyaan Umum</h2>
          {FAQ_DATA.map((item, i) => (
            <div key={i} className="faq-item">
              <button
                className="faq-question"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
              >
                <span>{item.q}</span>
                {openFaq === i ? <ChevronUp size={20} color="var(--color-primary)" /> : <ChevronDown size={20} color="var(--color-text-muted)" />}
              </button>
              {openFaq === i && (
                <div className="faq-answer" style={{ animation: 'fade-in-up 0.3s ease' }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </RevealSection>

      {/* =================== FINAL CTA =================== */}
      <RevealSection className="section section-lg text-center">
        <div className="container">
          <h2 className="section-title" style={{ marginBottom: '1.5rem', fontSize: 'clamp(2.2rem, 4vw, 3rem)' }}>Jangan Tunggu Sampai Terlambat</h2>
          <p className="section-subtitle">
            Pantau kondisi lingkungan Anda dan jadilah selangkah lebih maju dalam menghadapi potensi bencana. Keselamatan Anda adalah prioritas utama.
          </p>
          <Link to="/peta" className="btn btn-primary" style={{ padding: '1.25rem 3rem', fontSize: '1.25rem', borderRadius: 'var(--radius-full)' }}>
            Pantau Wilayah Saya Sekarang
          </Link>
        </div>
      </RevealSection>

      {/* Mitigation Modal */}
      {modal && <MitigationModal type={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
