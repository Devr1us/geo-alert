import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Map, Bell, Bot, Shield, ChevronRight, Activity, ArrowRight,
  Droplets, Mountain, ChevronDown, ChevronUp, MapPin, BellOff, RefreshCw,
  Zap, Quote, Compass, MessageSquare, Clock, AlertTriangle, AlertOctagon, ShieldAlert,
  Waves, Flame, Navigation, BookOpen
} from 'lucide-react';
import '../../css/LandingPage.css';
import MitigationModal from '../components/MitigationModal';
import RevealSection from '../components/RevealSection';
import StoriesHero from '../components/StoriesHero';
import TrustBarSection from '../components/TrustBarSection';
import { BMKG_TERKINI_URL, BMKG_DIRASAKAN_URL } from '../config/bmkgApi';
import { ASSET_BASE } from '../config/baseUrl';
import { formatLocation } from '../utils/locationFormatter';
import { evaluateRisk } from '../utils/riskEvaluator';

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

// Bi-directional step reveal component for sequential scroll-driven animations
function RevealStep({ children, className = '' }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.3,
        rootMargin: '0px 0px -12% 0px',
      }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`how-to-use-step ${isVisible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
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

// Education content — Bencana Utama Indonesia (BMKG, BNPB, PVMBG, NASA FIRMS)
const EDUCATION_DATA = [
  { icon: <Activity size={28} color="#B91C1C" strokeWidth={2.2} />, bg: '#FEE2E2', accentColor: '#B91C1C', title: 'Gempa Bumi', desc: 'Getaran tektonik tiba-tiba akibat pelepasan energi lempeng bumi. Indonesia berada di Cincin Api Pasifik dengan ribuan sesar aktif yang memerlukan kewaspadaan tinggi.' },
  { icon: <Waves size={28} color="#0284C7" strokeWidth={2.2} />, bg: '#E0F2FE', accentColor: '#0284C7', title: 'Tsunami', desc: 'Gelombang laut raksasa yang dipicu oleh gempa bumi dangkal di dasar laut, longsor bawah laut, atau letusan gunung api. Terapkan evakuasi emas 20-20-20 di pesisir.' },
  { icon: <Flame size={28} color="#EA580C" strokeWidth={2.2} />, bg: '#FFEDD5', accentColor: '#EA580C', title: 'Karhutla (Kebakaran Hutan & Lahan)', desc: 'Penyebab utama adalah pembakaran lahan ilegal dan kemarau di lahan gambut. Berdampak kabut asap beracun, lonjakan ISPA, dan gangguan transportasi darat/udara. Wajib pakai masker N95 dan laporkan titik api ke satgas BPBD/Manggala Agni.' },
  { icon: <Droplets size={28} color="#0369A1" strokeWidth={2.2} />, bg: '#E0F2FE', accentColor: '#0369A1', title: 'Banjir & Banjir Bandang', desc: 'Luapan air berlebih akibat curah hujan ekstrem atau kegagalan tanggul. Aliran air deras membawa material lumpur dan puing yang membahayakan nyawa dan kelistrikan.' },
  { icon: <Mountain size={28} color="#92400E" strokeWidth={2.2} />, bg: '#FEF3C7', accentColor: '#92400E', title: 'Tanah Longsor', desc: 'Pergerakan massa batuan atau tanah menuruni lereng saat kondisi tanah jenuh air. Selalu evakuasi secara tegak lurus (menyamping) dari jalur luncuran tebing.' },
  { icon: <Mountain size={28} color="#B91C1C" strokeWidth={2.2} />, bg: '#FFE4E6', accentColor: '#B91C1C', title: 'Erupsi Gunung Api', desc: 'Keluarnya magma, awan panas (wedhus gembel), lontaran batu pijar, dan abu silika dari kawah aktif. Kenakan masker debu/N95 dan patuhi radius Kawasan Rawan Bencana (KRB).' },
];



// ============================================================
// Fetch Disaster events (BMKG Earthquakes + NASA FIRMS Karhutla)
// ============================================================
async function fetchDisasterEvents() {
  const [resTerkini, resDirasakan, resKarhutla] = await Promise.allSettled([
    fetch(BMKG_TERKINI_URL),
    fetch(BMKG_DIRASAKAN_URL),
    fetch('/api/karhutla'),
  ]);

  let allEvents = [];

  // 1. Olah data BMKG
  if (
    resTerkini.status === 'fulfilled' &&
    resDirasakan.status === 'fulfilled' &&
    resTerkini.value.ok &&
    resDirasakan.value.ok
  ) {
    try {
      const parsedTerkini = await resTerkini.value.json();
      const parsedDirasakan = await resDirasakan.value.json();

      const listTerkini = parsedTerkini.Infogempa?.gempa || [];
      const listDirasakan = parsedDirasakan.Infogempa?.gempa || [];
      const allGempa = [...listTerkini, ...listDirasakan];
      const uniqueGempa = Array.from(new Set(allGempa.map(g => g.DateTime)))
        .map(time => allGempa.find(g => g.DateTime === time));

      const bmkgEvents = uniqueGempa.map((g, idx) => {
        const coords = (g.Coordinates || '').split(',');
        const lat = parseFloat(coords[0]);
        const lng = parseFloat(coords[1]);

        const riskInfo = evaluateRisk({
          magnitude: g.Magnitude,
          depth: g.Kedalaman,
          potensi: g.Potensi,
          dirasakan: g.Dirasakan,
          type: 'Gempa Bumi'
        });

        const formattedLocation = formatLocation(g.Wilayah);

        return {
          id: `bmkg-${idx}`,
          type: 'Gempa Bumi',
          location: formattedLocation,
          rawLocation: g.Wilayah || '',
          lat: isNaN(lat) ? -2.5 : lat,
          lng: isNaN(lng) ? 117.5 : lng,
          time: g.Tanggal && g.Jam ? `${g.Tanggal} ${g.Jam}` : '—',
          risk: riskInfo.level,
          riskLabel: riskInfo.label,
          riskBadgeClass: riskInfo.badgeClass,
          scale: g.Magnitude ? `M ${g.Magnitude}` : '—',
          magnitude: g.Magnitude,
          depth: g.Kedalaman,
          potensi: g.Potensi,
          province: (() => {
            const wilayah = g.Wilayah || '';
            const lastDash = wilayah.lastIndexOf('-');
            return lastDash !== -1 ? wilayah.slice(lastDash + 1).trim() : wilayah.trim();
          })(),
        };
      });

      allEvents.push(...bmkgEvents);
    } catch (err) {
      console.warn('[GeoAlert] Gagal mengolah data BMKG:', err);
    }
  }

  // 2. Olah data Karhutla (NASA FIRMS)
  if (resKarhutla.status === 'fulfilled' && resKarhutla.value.ok) {
    try {
      const khJson = await resKarhutla.value.json();
      if (Array.isArray(khJson.events)) {
        // Hanya ambil kejadian Karhutla berstatus Waspada & Bahaya Tinggi
        const karhutlaEvents = khJson.events
          .filter(ev => ev.risk === 'warning' || ev.risk === 'danger')
          .map((ev) => ({
            id: ev.id,
            type: 'Karhutla',
            location: ev.location || `${ev.wilayah?.kabupaten}, ${ev.wilayah?.provinsi}`,
            rawLocation: ev.location,
            province: ev.wilayah?.provinsi || '',
            lat: ev.lat,
            lng: ev.lon,
            time: ev.waktu || '—',
            risk: ev.risk,
            riskLabel: ev.status,
            riskBadgeClass: ev.risk === 'danger' ? 'badge-danger' : ev.risk === 'warning' ? 'badge-warning' : 'badge-standby',
            scale: `${ev.jumlah_titik} titik (${ev.frp_total} MW)`,
            jumlah_titik: ev.jumlah_titik,
            frp_total: ev.frp_total,
            radius_km: ev.radius_km || 5,
          }));

        allEvents.push(...karhutlaEvents);
      }
    } catch (khErr) {
      console.warn('[GeoAlert] Gagal mengolah data Karhutla:', khErr);
    }
  }

  return allEvents;
}

// ============================================================
// Notification helper — poin 2
// Pakai SW.showNotification() jika tersedia (wajib untuk PWA),
// fallback ke new Notification() untuk browser tanpa SW.
// ============================================================
const NOTIF_KEY = 'geoalert_notifications_enabled';

async function sendBrowserNotification(title, body) {
  if (Notification.permission !== 'granted') return;

  const options = {
    body,
    icon: '/logo-geoalert.svg',
    badge: '/logo-geoalert.svg',
    tag: 'geoalert-warning',
    renotify: true,
    requireInteraction: false,
  };

  // Chrome & PWA browsers memerlukan SW.showNotification()
  // ketika ada service worker terdaftar — new Notification() akan diabaikan
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, options);
      return;
    } catch (_) {
      // SW tidak ready atau gagal — fallback ke constructor
    }
  }

  // Fallback untuk browser tanpa service worker
  try {
    // eslint-disable-next-line no-new
    new Notification(title, options);
  } catch (_) {
    // Beberapa browser memblokir constructor sama sekali — abaikan
  }
}


export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to hash target on mount or hash change
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location.hash, location.pathname]);

  // ---- State ----
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Modals state
  const [openFaq, setOpenFaq] = useState(null);
  const [modal, setModal] = useState(null);

  // Notification state
  const [notifPref, setNotifPref] = useState(() => localStorage.getItem(NOTIF_KEY));
  const [notifRequesting, setNotifRequesting] = useState(false);

  // Statistics
  const [liveAlerts, setLiveAlerts] = useState(0);

  const alertsCount = useCountUp(liveAlerts, 1500);

  // ============================================================
  // Fetch Disaster events (BMKG + NASA FIRMS Karhutla)
  // ============================================================
  useEffect(() => {
    let cancelled = false;
    fetchDisasterEvents()
      .then((data) => {
        if (cancelled) return;
        setEvents(data);
        const activeCount = data.filter(e => e.risk === 'warning' || e.risk === 'danger').length;
        setLiveAlerts(activeCount > 0 ? activeCount : data.length);
        setEventsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLiveAlerts(0);
        setEventsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Tombol aksi Hero & CTA
  const handleCekBencana = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    navigate('/peta');
  };

  // ============================================================
  // Poin 2: Handle klik "Aktifkan Notifikasi"
  // Selalu sync state dengan Notification.permission asli dari browser
  // ============================================================
    const [notifBrowserPerm, setNotifBrowserPerm] = useState(() => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission; // 'default' | 'granted' | 'denied'
  });

  const handleActivateNotif = async () => {
    if (!('Notification' in window)) return;

    // Jika sudah denied, arahkan ke pengaturan browser
    if (notifBrowserPerm === 'denied') {
      alert('Notifikasi diblokir browser Anda. Klik ikon gembok/info di address bar untuk mengizinkan notifikasi dari situs ini, lalu muat ulang halaman.');
      return;
    }

    // Jika sudah granted, tidak perlu request lagi
    if (notifBrowserPerm === 'granted') {
      setNotifPref('true');
      localStorage.setItem(NOTIF_KEY, 'true');
      sendBrowserNotification('✅ GeoAlert — Notifikasi Aktif', 'Anda sudah mendapat peringatan bencana di wilayah Anda.');
      return;
    }

    setNotifRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setNotifBrowserPerm(result);
      if (result === 'granted') {
        setNotifPref('true');
        localStorage.setItem(NOTIF_KEY, 'true');
        sendBrowserNotification('✅ GeoAlert — Notifikasi Aktif', 'Anda akan mendapat peringatan bencana di wilayah Anda.');
      } else {
        setNotifPref('false');
        localStorage.setItem(NOTIF_KEY, 'false');
      }
    } catch (err) {
      console.warn('Notification request failed:', err);
    } finally {
      setNotifRequesting(false);
    }
  };


  return (
    <div>
      {/* =================== STORIES HERO SECTION (INTERACTIVE INDONESIA MAP) =================== */}
      <StoriesHero onCekBencana={handleCekBencana} />

      {/* =================== STATS + TRUST BAR (GABUNGAN) =================== */}
      <section className="stats-section">
        <div className="container">
          {/* Stats Cards (4 Kolom Sama Tinggi & Struktur Identik) */}
          <div className="stats-grid">
            {[
              {
                value: eventsLoading ? 'Memuat...' : alertsCount,
                label: 'Peringatan Aktif',
                note: 'Diperbarui otomatis tiap 5 menit',
              },
              {
                value: '38',
                label: 'Provinsi Terpantau',
                note: 'Seluruh wilayah Indonesia',
              },
              {
                value: '5 Menit',
                label: 'Interval Pembaruan',
                note: 'Sinkronisasi BMKG & NASA FIRMS',
              },
              {
                value: '24/7',
                label: 'Pembaruan Otomatis',
                note: 'Sistem berjalan tanpa henti',
              },
            ].map((s, i) => (
              <RevealSection
                key={i}
                className="stat-item"
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div className="stat-number tabular-nums">{s.value}</div>
                <div className="stat-label">{s.label}</div>
                {s.note ? <div className="stat-note">{s.note}</div> : null}
              </RevealSection>
            ))}
          </div>

          {/* Section Terhubung Dengan Sumber Data Resmi & Rujukan Mitigasi */}
          <TrustBarSection />
        </div>
      </section>

      {/* =================== ABOUT (TENTANG KAMI) =================== */}
      <RevealSection id="tentang" className="about-modern-section">
        {/* Background Overlay Graphics (Layers 0-C, 1, 2) */}
        <div className="section-dark-bg-layers" aria-hidden="true">
          {/* ENHANCEMENT C: Garis Kontur Topografi Tipis */}
          <svg className="layer0-topo-contour" viewBox="0 0 1200 600" preserveAspectRatio="none" fill="none">
            <path d="M0 60 C 250 110, 500 20, 750 90 C 950 140, 1100 70, 1200 100" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.08" />
            <path d="M0 120 C 300 160, 550 80, 800 150 C 1000 200, 1120 130, 1200 160" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.07" />
            <path d="M0 190 C 220 230, 480 160, 720 220 C 920 270, 1080 200, 1200 230" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.06" />
            <path d="M0 320 C 350 370, 650 300, 880 360 C 1050 400, 1150 350, 1200 370" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.06" />
            <path d="M0 460 C 280 500, 580 430, 820 480 C 1000 520, 1120 470, 1200 490" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.05" />
          </svg>

          {/* LAYER 1: Organic Network / Constellation Pattern */}
          <svg className="layer1-constellation-svg" viewBox="0 0 1200 600" fill="none">
            <line x1="90" y1="80" x2="240" y2="150" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.1" />
            <line x1="240" y1="150" x2="410" y2="90" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.1" />
            <line x1="410" y1="90" x2="580" y2="180" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.08" />
            <line x1="580" y1="180" x2="740" y2="100" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.1" />
            <line x1="740" y1="100" x2="920" y2="160" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.08" />
            <line x1="920" y1="160" x2="1110" y2="70" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.1" />

            <line x1="150" y1="360" x2="290" y2="480" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.08" />
            <line x1="290" y1="480" x2="480" y2="410" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.1" />
            <line x1="720" y1="450" x2="880" y2="520" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.08" />
            <line x1="880" y1="520" x2="1050" y2="430" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.1" />

            {/* ENHANCEMENT A: Added constellation-node class for animated CSS twinkle */}
            <circle cx="90" cy="80" r="3" fill="#0E2A5C" fillOpacity="0.3" className="constellation-node" />
            <circle cx="240" cy="150" r="2.5" fill="#d97706" fillOpacity="0.35" className="constellation-node" />
            <circle cx="410" cy="90" r="3.5" fill="#0E2A5C" fillOpacity="0.3" className="constellation-node" />
            <circle cx="580" cy="180" r="2" fill="#0E2A5C" fillOpacity="0.25" className="constellation-node" />
            <circle cx="740" cy="100" r="3" fill="#d97706" fillOpacity="0.3" className="constellation-node" />
            <circle cx="920" cy="160" r="2.5" fill="#0E2A5C" fillOpacity="0.35" className="constellation-node" />
            <circle cx="1110" cy="70" r="3.5" fill="#0E2A5C" fillOpacity="0.3" className="constellation-node" />

            <circle cx="150" cy="360" r="3" fill="#0E2A5C" fillOpacity="0.3" className="constellation-node" />
            <circle cx="290" cy="480" r="2" fill="#d97706" fillOpacity="0.25" className="constellation-node" />
            <circle cx="480" cy="410" r="3.5" fill="#0E2A5C" fillOpacity="0.3" className="constellation-node" />
            <circle cx="720" cy="450" r="2.5" fill="#0E2A5C" fillOpacity="0.3" className="constellation-node" />
            <circle cx="880" cy="520" r="3" fill="#d97706" fillOpacity="0.35" className="constellation-node" />
            <circle cx="1050" cy="430" r="2.5" fill="#0E2A5C" fillOpacity="0.3" className="constellation-node" />
          </svg>

          {/* LAYER 2: Concentric Radar Ping Utama */}
          <div className="layer2-radar-wrapper radar-pos-top-right">
            <svg viewBox="0 0 300 300" className="radar-signal-svg" fill="none">
              <circle cx="150" cy="150" r="5" fill="#e5533c" className="radar-center-dot" />
              <circle cx="150" cy="150" r="25" stroke="#e5533c" strokeWidth="1.5" strokeOpacity="0.3" className="radar-ring ping-ring-1" />
              <circle cx="150" cy="150" r="55" stroke="#0E2A5C" strokeWidth="1.2" strokeOpacity="0.18" className="radar-ring ping-ring-2" />
              <circle cx="150" cy="150" r="90" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.12" className="radar-ring ping-ring-3" />
              <circle cx="150" cy="150" r="130" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.05" className="radar-ring ping-ring-4" />
            </svg>
          </div>

          {/* ENHANCEMENT B: Radar Ping Kedua */}
          <div className="layer2-radar-wrapper radar-pos-bottom-left radar-secondary">
            <svg viewBox="0 0 300 300" className="radar-signal-svg" fill="none">
              <circle cx="150" cy="150" r="4" fill="#4A90D9" className="radar-center-dot-blue" />
              <circle cx="150" cy="150" r="25" stroke="#4A90D9" strokeWidth="1.2" strokeOpacity="0.25" className="radar-ring ping-ring-blue-1" />
              <circle cx="150" cy="150" r="55" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.12" className="radar-ring ping-ring-blue-2" />
              <circle cx="150" cy="150" r="90" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.08" className="radar-ring ping-ring-blue-3" />
              <circle cx="150" cy="150" r="130" stroke="#0E2A5C" strokeWidth="1" strokeOpacity="0.04" className="radar-ring ping-ring-blue-4" />
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

          {/* Unified 4-Column Grid for All 6 Cards */}
          <div className="about-unified-grid">
            {/* Left Card: Tipografi Kutipan Siaga (Span 2) */}
            <RevealSection
              className="shuffle-card-slot shuffle-card-1 about-card-col-span-2"
              threshold={0.2}
              style={{ '--shuffle-rot': '-7deg', '--shuffle-delay': '0ms' }}
            >
              <div className="about-quote-card">
                <span className="about-quote-mark" aria-hidden="true">“</span>
                <div className="about-quote-content">
                  <blockquote className="about-quote-text">
                    <span className="quote-text-primary">Siaga hari ini,</span>
                    <span className="quote-text-accent">selamat esok hari.</span>
                  </blockquote>
                </div>
              </div>
            </RevealSection>

            {/* Right Card: Apa itu GeoAlert? (Span 2) */}
            <RevealSection
              className="shuffle-card-slot shuffle-card-2 about-card-col-span-2"
              threshold={0.2}
              style={{ '--shuffle-rot': '-4deg', '--shuffle-delay': '100ms' }}
            >
              <div className="about-info-card">
                <h2 className="info-card-title">Apa itu GeoAlert?</h2>
                <p className="info-card-desc">
                  Platform cerdas yang menggabungkan data otoritatif dengan kecerdasan buatan untuk memberikan peringatan yang cepat, akurat, dan dapat ditindaklanjuti.
                </p>
              </div>
            </RevealSection>

            {/* Feature 1: Data Real-time (Span 1) */}
            <RevealSection
              className="shuffle-card-slot shuffle-card-3 about-card-col-span-1"
              threshold={0.2}
              style={{ '--shuffle-rot': '-8deg', '--shuffle-delay': '200ms' }}
            >
              <div className="about-mini-card">
                <div className="mini-icon-circle icon-bg-blue">
                  <RefreshCw size={18} />
                </div>
                <h4 className="mini-card-title">Data Real-time</h4>
                <p className="mini-card-desc">Terintegrasi dengan sumber data resmi BMKG & BNPB.</p>
                <Link to="/peta" className="mini-card-link">
                  Selengkapnya <span>→</span>
                </Link>
              </div>
            </RevealSection>

            {/* Feature 2: Peringatan Dini (Span 1) */}
            <RevealSection
              className="shuffle-card-slot shuffle-card-4 about-card-col-span-1"
              threshold={0.2}
              style={{ '--shuffle-rot': '-5deg', '--shuffle-delay': '300ms' }}
            >
              <div className="about-mini-card">
                <div className="mini-icon-circle icon-bg-yellow">
                  <Bell size={18} />
                </div>
                <h4 className="mini-card-title">Peringatan Dini</h4>
                <p className="mini-card-desc">Notifikasi instan berbasis lokasi untuk kesiapsiagaan Anda.</p>
                <Link to="/peta" className="mini-card-link">
                  Selengkapnya <span>→</span>
                </Link>
              </div>
            </RevealSection>

            {/* Feature 3: AI Assistant (Span 1) */}
            <RevealSection
              className="shuffle-card-slot shuffle-card-5 about-card-col-span-1"
              threshold={0.2}
              style={{ '--shuffle-rot': '-7deg', '--shuffle-delay': '400ms' }}
            >
              <div className="about-mini-card">
                <div className="mini-icon-circle icon-bg-sky">
                  <MessageSquare size={18} />
                </div>
                <h4 className="mini-card-title">AI Assistant</h4>
                <p className="mini-card-desc">Asisten cerdas menjawab seputar mitigasi & prosedur darurat.</p>
                <Link to="/peta" className="mini-card-link">
                  Selengkapnya <span>→</span>
                </Link>
              </div>
            </RevealSection>

            {/* Feature 4: Peta Interaktif (Span 1) */}
            <RevealSection
              className="shuffle-card-slot shuffle-card-6 about-card-col-span-1"
              threshold={0.2}
              style={{ '--shuffle-rot': '-4deg', '--shuffle-delay': '500ms' }}
            >
              <div className="about-mini-card">
                <div className="mini-icon-circle icon-bg-rose">
                  <Map size={18} />
                </div>
                <h4 className="mini-card-title">Peta Interaktif</h4>
                <p className="mini-card-desc">Visualisasi sebaran ancaman bencana di seluruh Indonesia.</p>
                <Link to="/peta" className="mini-card-link">
                  Selengkapnya <span>→</span>
                </Link>
              </div>
            </RevealSection>
          </div>
        </div>
      </RevealSection>

      {/* =================== HOW TO USE =================== */}
      <RevealSection
        id="cara-penggunaan"
        className="how-to-use-white-section"
      >
        <div className="container relative z-10">
          <h2 className="how-to-use-heading">Cara Menggunakan GeoAlert</h2>

          <div className="how-to-use-centered-container">
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
                  action: notifBrowserPerm === 'granted' ? (
                    <span className="notif-active-badge">
                      <Bell size={14} /> Notifikasi Aktif
                    </span>
                  ) : notifBrowserPerm === 'denied' ? (
                    <span
                      className="notif-denied-badge"
                      onClick={handleActivateNotif}
                      title="Klik untuk membuka blokir notifikasi di pengaturan browser"
                    >
                      <BellOff size={14} /> Notifikasi Diblokir (Buka Izin di Browser)
                    </span>
                  ) : notifBrowserPerm === 'unsupported' ? (
                    <span className="notif-unsupported-badge">
                      <BellOff size={14} /> Tidak didukung browser ini
                    </span>
                  ) : (
                    <button
                      onClick={handleActivateNotif}
                      disabled={notifRequesting}
                      className="btn-notif-action"
                    >
                      {notifRequesting ? (
                        <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-notif 0.7s linear infinite' }} /> Meminta izin…</>
                      ) : (
                        <><Bell size={14} style={{ color: '#ffffff' }} /> Aktifkan Notifikasi</>
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
                <RevealStep key={i}>
                  <div className="step-circle-num">{s.n}</div>
                  <div className="step-content-body">
                    <h3 className="step-title-text">{s.title}</h3>
                    <p className="step-desc-text">{s.desc}</p>
                    {s.action}
                  </div>
                </RevealStep>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* =================== RECENT DISASTERS =================== */}
      <RevealSection className="section">
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
                    {['Waktu', 'Jenis Bencana', 'Lokasi', 'Skala / Titik', 'Status'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {eventsLoading
                    ? [1, 2, 3].map(i => (
                      <tr key={i}>
                        <td colSpan={5}>
                          <div className="skeleton" style={{ height: '48px', margin: '4px 0' }} />
                        </td>
                      </tr>
                    ))
                    : events.slice(0, 6).map((ev, i) => {
                      const isKarhutla = ev.type === 'Karhutla';
                      const riskBadge = (() => {
                        if (ev.risk === 'danger') {
                          return (
                            <span className="badge badge-danger" aria-label="Tingkat Risiko: Bahaya Tinggi">
                              <AlertOctagon size={13} aria-hidden="true" />
                              <span>Bahaya Tinggi</span>
                            </span>
                          );
                        }
                        if (ev.risk === 'warning') {
                          return (
                            <span className="badge badge-warning" aria-label="Tingkat Risiko: Waspada">
                              <AlertTriangle size={13} aria-hidden="true" />
                              <span>Waspada</span>
                            </span>
                          );
                        }
                        return (
                          <span className="badge badge-standby" aria-label="Tingkat Risiko: Siaga">
                            <ShieldAlert size={13} aria-hidden="true" />
                            <span>Siaga</span>
                          </span>
                        );
                      })();
                      return (
                        <tr key={ev.id || i} className="recent-table-row">
                          <td className="mono" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
                            {ev.time || '—'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}>
                              <div style={{
                                background: isKarhutla ? 'rgba(234, 88, 12, 0.12)' : 'rgba(14,42,92,0.08)',
                                padding: '6px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {isKarhutla ? (
                                  <Flame size={16} color="#EA580C" />
                                ) : (
                                  <Activity size={16} color="var(--color-primary)" />
                                )}
                              </div>
                              <span>{ev.type}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: '500' }}>{ev.location}</td>
                          <td className="mono" style={{ fontSize: '0.875rem', fontWeight: '600', color: isKarhutla ? '#EA580C' : 'var(--color-primary)' }}>
                            {isKarhutla
                              ? `${ev.jumlah_titik} titik (${ev.frp_total} MW)`
                              : ev.type === 'Gempa Bumi' && ev.magnitude
                                ? `M ${ev.magnitude}`
                                : (ev.scale || ev.magnitude || '—')}
                          </td>
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
      <RevealSection id="mitigasi" className="section">
        <div className="container">
          <h2 className="section-title">Panduan Mitigasi Instan</h2>
          <p className="section-subtitle">
            Langkah taktis yang dapat Anda ambil sebelum, saat, dan sesudah bencana terjadi berdasarkan standar BMKG &amp; BNPB.
          </p>

          {/* Disaster Cards Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                key: 'karhutla',
                icon: <Flame size={26} color="#EA580C" strokeWidth={2.2} />,
                bg: '#FFEDD5',
                title: 'Karhutla & Kabut Asap',
                desc: 'Gunakan masker N95 dan tutup ventilasi ruangan saat kabut asap pekat. Kurangi aktivitas luar, siapkan obat pernapasan, ikuti instruksi evakuasi BPBD, dan laporkan titik api ke 112 / Manggala Agni.',
              },
              {
                key: 'gempa',
                icon: <Activity size={26} color="#B91C1C" strokeWidth={2.2} />,
                bg: '#FEE2E2',
                title: 'Gempa Bumi',
                desc: 'Terapkan DUCK, COVER, HOLD ON. Jauhi jendela kaca, perabot tinggi, dan jangan gunakan lift. Evakuasi setelah getaran reda.',
              },
              {
                key: 'tsunami',
                icon: <Waves size={26} color="#0284C7" strokeWidth={2.2} />,
                bg: '#E0F2FE',
                title: 'Tsunami',
                desc: 'Gunakan aturan emas 20-20-20. Jika gempa terasa 20 detik, Anda punya 20 menit untuk lari ke tempat setinggi minimal 20 meter dpl.',
              },
              {
                key: 'banjir',
                icon: <Droplets size={26} color="#0369A1" strokeWidth={2.2} />,
                bg: '#E0F2FE',
                title: 'Banjir & Bandang',
                desc: 'Matikan sakelar MCB listrik utama segera. Amankan dokumen ke wadah kedap air di lantai atas, dan jangan terobos arus deras.',
              },
              {
                key: 'longsor',
                icon: <Mountain size={26} color="#92400E" strokeWidth={2.2} />,
                bg: '#FEF3C7',
                title: 'Tanah Longsor',
                desc: 'Kenali retakan tanah & dinding seret. Saat terjadi suara gemuruh tebing, evakuasi lari TEGAK LURUS (menyamping) dari luncuran.',
              },
              {
                key: 'gunungapi',
                icon: <Mountain size={26} color="#B91C1C" strokeWidth={2.2} />,
                bg: '#FFE4E6',
                title: 'Erupsi Gunung Api',
                desc: 'Gunakan masker N95 dan kacamata pelindung dari abu silika. Patuhi radius zona steril KRB yang ditetapkan pos pemantauan PVMBG.',
              },
            ].map(card => (
              <div key={card.key} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: card.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                  flexShrink: 0
                }}>
                  {card.icon}
                </div>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.35rem' }}>{card.title}</h3>
                <p className="text-muted" style={{ marginBottom: '1.75rem', fontSize: '0.95rem', lineHeight: '1.6', flex: 1 }}>{card.desc}</p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '0.75rem', fontWeight: '600' }}
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
      <RevealSection className="section">
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
      <RevealSection className="section section-lg text-center cta-navy-section">
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <h2 className="section-title" style={{ marginBottom: '1.5rem', fontSize: 'clamp(2.2rem, 4vw, 3rem)' }}>Jangan Tunggu Sampai Terlambat</h2>
          <p className="section-subtitle">
            Pantau kondisi lingkungan Anda dan jadilah selangkah lebih maju dalam menghadapi potensi bencana. Keselamatan Anda adalah prioritas utama.
          </p>
          <button
            type="button"
            onClick={handleCekBencana}
            className="btn btn-cta-contrast"
            style={{ padding: '1.25rem 3rem', fontSize: '1.25rem', borderRadius: 'var(--radius-full)', cursor: 'pointer' }}
          >
            Pantau Wilayah Saya Sekarang
          </button>
        </div>
      </RevealSection>

      {/* Mitigation SOP Modal */}
      {modal && <MitigationModal type={modal} onClose={() => setModal(null)} />}


    </div>
  );
}
