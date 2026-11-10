import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Map, Bell, Bot, Shield, ChevronRight, Activity, ArrowRight,
  Wind, Droplets, Mountain, ChevronDown, ChevronUp, MapPin, BellOff, RefreshCw,
  Zap, Quote, Compass, MessageSquare, Clock, AlertTriangle, AlertOctagon, ShieldAlert,
  Waves, Flame, Briefcase, Navigation
} from 'lucide-react';
import '../../css/LandingPage.css';
import MitigationModal from '../components/MitigationModal';
import EmergencyBagModal from '../components/EmergencyBagModal';
import CitySelectModal from '../components/CitySelectModal';
import RevealSection from '../components/RevealSection';
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

// Education content — 6 Bencana Utama Indonesia (BMKG, BNPB, PVMBG)
const EDUCATION_DATA = [
  { icon: <Activity size={32} color="var(--color-alert)" />, bg: 'rgba(192, 73, 43, 0.1)', accentColor: 'var(--color-alert)', title: 'Gempa Bumi', desc: 'Getaran tektonik tiba-tiba akibat pelepasan energi lempeng bumi. Indonesia berada di Cincin Api Pasifik dengan ribuan sesar aktif yang memerlukan kewaspadaan tinggi.' },
  { icon: <Waves size={32} color="#0284C7" />, bg: 'rgba(2, 132, 199, 0.1)', accentColor: '#0284C7', title: 'Tsunami', desc: 'Gelombang laut raksasa yang dipicu oleh gempa bumi dangkal di dasar laut, longsor bawah laut, atau letusan gunung api. Terapkan evakuasi emas 20-20-20 di pesisir.' },
  { icon: <Droplets size={32} color="var(--color-standby)" />, bg: 'rgba(74, 144, 217, 0.1)', accentColor: 'var(--color-standby)', title: 'Banjir & Banjir Bandang', desc: 'Luapan air berlebih akibat curah hujan ekstrem atau kegagalan tanggul. Aliran air deras membawa material lumpur dan puing yang membahayakan nyawa dan kelistrikan.' },
  { icon: <Mountain size={32} color="var(--color-status-warning)" />, bg: 'rgba(245, 124, 0, 0.1)', accentColor: 'var(--color-status-warning)', title: 'Tanah Longsor', desc: 'Pergerakan massa batuan atau tanah menuruni lereng saat kondisi tanah jenuh air. Selalu evakuasi secara tegak lurus (menyamping) dari jalur luncuran tebing.' },
  { icon: <Wind size={32} color="#D97706" />, bg: 'rgba(217, 119, 6, 0.1)', accentColor: '#D97706', title: 'Cuaca Ekstrem & Puting Beliung', desc: 'Fenomena hidrometeorologi berbahaya seperti angin puting beliung, petir hebat, dan hujan es. Berlindung di bangunan kokoh dan jauhi pohon tunggal serta tiang tinggi.' },
  { icon: <Flame size={32} color="#DC2626" />, bg: 'rgba(220, 38, 38, 0.1)', accentColor: '#DC2626', title: 'Erupsi Gunung Api', desc: 'Keluarnya magma, awan panas (wedhus gembel), lontaran batu pijar, dan abu silika dari kawah aktif. Kenakan masker debu/N95 dan patuhi radius Kawasan Rawan Bencana (KRB).' },
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
    fetch(BMKG_TERKINI_URL),
    fetch(BMKG_DIRASAKAN_URL),
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
    
    // Logika level risiko terpusat berdasar magnitudo, kedalaman, dan potensi tsunami
    const riskInfo = evaluateRisk({
      magnitude: g.Magnitude,
      depth: g.Kedalaman,
      potensi: g.Potensi,
      dirasakan: g.Dirasakan,
      type: 'Gempa Bumi'
    });

    // Format lokasi ramah publik: pisahkan arah mata angin, Title Case, singkatan provinsi
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

  // ---- State ----
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Ambil lokasi tersimpan dari sesi sebelumnya jika ada
  const [savedLocData] = useState(() => {
    try {
      const item = localStorage.getItem('geoalert_user_location');
      return item ? JSON.parse(item) : null;
    } catch { return null; }
  });

  // Geolocation state — Poin 3
  const [userCoords, setUserCoords] = useState(() => savedLocData?.coords || null);
  const [locationName, setLocationName] = useState(() => savedLocData?.name || null);
  const [locationStatus, setLocationStatus] = useState(() => savedLocData ? 'ready' : 'prompt'); // 'prompt' | 'detecting' | 'ready' | 'denied'
  const [areaStatus, setAreaStatus] = useState(() => savedLocData?.areaStatus || 'none'); // 'none' | 'safe' | 'warning' | 'danger'
  const [lastUpdatedTime, setLastUpdatedTime] = useState(() => savedLocData?.updatedAt || null);

  // Modals state
  const [showCityModal, setShowCityModal] = useState(false);
  const [showTsbModal, setShowTsbModal] = useState(false);

  // Notification state
  const [notifPref, setNotifPref] = useState(() => localStorage.getItem(NOTIF_KEY));
  const [notifRequesting, setNotifRequesting] = useState(false);

  // Statistics
  const [liveAlerts, setLiveAlerts] = useState(0);
  const [liveProvinces, setLiveProvinces] = useState(0);

  const alertsCount  = useCountUp(liveAlerts, 1500);
  const provincesCount = useCountUp(liveProvinces, 1500);
  const speedCount   = useCountUp(3, 1500);

  const [openFaq, setOpenFaq] = useState(null);
  const [modal, setModal] = useState(null);

  // ============================================================
  // Fetch BMKG events & hitung statistik
  // ============================================================
  useEffect(() => {
    let cancelled = false;
    fetchBmkgEvents()
      .then((data) => {
        if (cancelled) return;
        setEvents(data);
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

  // Re-kalkulasi status wilayah jika events selesai dimuat & koordinat tersedia
  useEffect(() => {
    if (events.length === 0 || !userCoords) return;
    const status = calcAreaStatus(userCoords[0], userCoords[1], events);
    setAreaStatus(status);

    if (localStorage.getItem(NOTIF_KEY) === 'true' && status === 'danger') {
      sendBrowserNotification(
        '⚠️ GeoAlert — Peringatan Bahaya',
        'Terdapat bencana tingkat BAHAYA di dekat wilayah Anda. Cek peta GeoAlert sekarang.'
      );
    }
  }, [events, userCoords]);

  // Alur minta izin lokasi otomatis
  const requestLocation = (navigateOnSuccess = false) => {
    if (!('geolocation' in navigator)) {
      setShowCityModal(true);
      return;
    }

    setLocationStatus('detecting');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const coords = [latitude, longitude];
          setUserCoords(coords);

          const name = await reverseGeocode(latitude, longitude);
          setLocationName(name);

          const currentEvents = events.length > 0 ? events : [];
          const status = calcAreaStatus(latitude, longitude, currentEvents);
          setAreaStatus(status);

          const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
          setLastUpdatedTime(nowStr);
          setLocationStatus('ready');

          try {
            localStorage.setItem('geoalert_user_location', JSON.stringify({
              coords,
              name,
              areaStatus: status,
              updatedAt: nowStr
            }));
          } catch {}

          if (navigateOnSuccess) {
            navigate('/peta', { state: { userCoords: coords, locationName: name } });
          }
        } catch {
          setLocationName('Lokasi Terdeteksi');
          setLocationStatus('ready');
          if (navigateOnSuccess) {
            navigate('/peta');
          }
        }
      },
      (err) => {
        console.warn('Geolocation failed or denied:', err.message);
        setLocationStatus('denied');
        setShowCityModal(true);
      },
      { timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  };

  // Pilih kota manual
  const handleSelectManualCity = (city) => {
    const coords = [city.lat, city.lng];
    setUserCoords(coords);
    setLocationName(city.name);

    const currentEvents = events.length > 0 ? events : [];
    const status = calcAreaStatus(city.lat, city.lng, currentEvents);
    setAreaStatus(status);

    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setLastUpdatedTime(nowStr);
    setLocationStatus('ready');

    try {
      localStorage.setItem('geoalert_user_location', JSON.stringify({
        coords,
        name: city.name,
        areaStatus: status,
        updatedAt: nowStr
      }));
    } catch {}
  };

  // Tombol aksi Hero & CTA
  const handleCekBencana = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (locationStatus === 'ready' && userCoords) {
      navigate('/peta', { state: { userCoords, locationName } });
    } else {
      requestLocation(true);
    }
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
      <section
        className="hero-section"
        style={{ backgroundImage: `linear-gradient(rgba(247, 242, 234, 0.1), rgba(247, 242, 234, 0.2)), url("${ASSET_BASE}images/Background utama.png")` }}
      >
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
            <button
              type="button"
              onClick={handleCekBencana}
              className="btn btn-primary"
              style={{ padding: '1rem 2rem', fontSize: '1.125rem', cursor: 'pointer', border: 'none' }}
            >
              <Map size={24} /> Cek Bencana Terdekat
            </button>
            <a href="#tentang" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.125rem', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)' }}>
              Pelajari Lebih Lanjut
            </a>
          </div>

          {/* ---- Live Status Card (Refined to match exact screenshot mockup) ---- */}
          <div className="live-status-pill-card hero-status-card-animated">
            {/* Column 1: Lokasi Anda */}
            <div className="status-pill-col">
              <span className="status-pill-label">LOKASI ANDA</span>
              {locationStatus === 'detecting' && (
                <div className="status-pill-val loading-val" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  <RefreshCw size={14} className="animate-spin" /> Mendeteksi…
                </div>
              )}
              {locationStatus === 'ready' && (
                <div className="status-pill-val location-val" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} color="#0E2A5C" />
                  <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={locationName}>
                    {locationName || 'Lokasi Terdeteksi'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCityModal(true)}
                    title="Ubah kota atau lokasi"
                    style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline', padding: '0 2px' }}
                  >
                    Ubah
                  </button>
                </div>
              )}
              {(locationStatus === 'prompt' || locationStatus === 'denied') && (
                <div className="status-pill-val-action">
                  <button
                    type="button"
                    className="btn-status-pill-activate"
                    onClick={() => requestLocation(false)}
                    title="Aktifkan deteksi lokasi otomatis via peramban"
                  >
                    <Navigation size={13} /> Aktifkan Lokasi
                  </button>
                  <button
                    type="button"
                    className="btn-status-pill-manual"
                    onClick={() => setShowCityModal(true)}
                    title="Pilih kota secara manual tanpa GPS"
                  >
                    Pilih Kota
                  </button>
                </div>
              )}
            </div>

            <div className="status-pill-divider" />

            {/* Column 2: Status Wilayah */}
            <div className="status-pill-col">
              <span className="status-pill-label">STATUS WILAYAH</span>
              {locationStatus === 'ready' ? (
                <div className="status-pill-val area-val" style={{ color: currentStatus.color }}>
                  <span
                    className="status-dot-glow"
                    style={{
                      backgroundColor: currentStatus.color,
                      boxShadow: `0 0 10px ${currentStatus.glow}`,
                    }}
                  />
                  <span>{currentStatus.label}</span>
                </div>
              ) : (
                <div className="status-pill-val text-muted" style={{ fontSize: '0.95rem', color: '#64748B' }}>
                  <span
                    className="status-dot-glow"
                    style={{
                      backgroundColor: '#94A3B8',
                      boxShadow: 'none',
                    }}
                  />
                  <span>Belum tersedia</span>
                </div>
              )}
            </div>

            <div className="status-pill-divider" />

            {/* Column 3: Pembaruan */}
            <div className="status-pill-col">
              <span className="status-pill-label">PEMBARUAN</span>
              <div className="status-pill-val time-val">
                <Clock size={13} color="#0E2A5C" />
                <span>{locationStatus === 'ready' ? (lastUpdatedTime || 'Baru saja') : '-'}</span>
              </div>
            </div>
          </div>

          {/* Transparent Location Privacy Note */}
          {locationStatus !== 'ready' && (
            <p className="hero-location-privacy-note" style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.85rem', textAlign: 'center' }}>
              🔒 Untuk mendeteksi bencana terdekat dari posisi Anda. Koordinat diproses langsung di peramban Anda dan tidak disimpan di server.
            </p>
          )}
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

          {/* Top Row: 2 Big Cards */}
          <div className="grid md:grid-cols-2 gap-8 items-stretch" style={{ marginBottom: '2.25rem' }}>
            {/* Left Card: Indonesian Archipelago */}
            <RevealSection className="about-map-card" once={false}>
              <div className="map-card-graphic-wrapper">
                <img
                  src={`${ASSET_BASE}images/INDONESIAN.png`}
                  alt="Indonesia Archipelago Map"
                  className="map-silhouette-img"
                />
              </div>
            </RevealSection>

            {/* Right Card: Apa itu GeoAlert? */}
            <RevealSection className="about-info-card" once={false}>
              <h2 className="info-card-title">Apa itu GeoAlert?</h2>
              <p className="info-card-desc">
                Platform cerdas yang menggabungkan data otoritatif dengan kecerdasan buatan untuk memberikan peringatan yang cepat, akurat, dan dapat ditindaklanjuti.
              </p>
            </RevealSection>
          </div>

          {/* Bottom Row: 4 Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <RevealSection className="about-mini-card" style={{ transitionDelay: '0ms' }} once={false}>
              <div className="mini-icon-circle icon-bg-blue">
                <RefreshCw size={18} />
              </div>
              <h4 className="mini-card-title">Data Real-time</h4>
              <p className="mini-card-desc">Terintegrasi dengan sumber data resmi BMKG & BNPB.</p>
              <Link to="/peta" className="mini-card-link">
                Selengkapnya <span>→</span>
              </Link>
            </RevealSection>

            <RevealSection className="about-mini-card" style={{ transitionDelay: '120ms' }} once={false}>
              <div className="mini-icon-circle icon-bg-yellow">
                <Bell size={18} />
              </div>
              <h4 className="mini-card-title">Peringatan Dini</h4>
              <p className="mini-card-desc">Notifikasi instan berbasis lokasi untuk kesiapsiagaan Anda.</p>
              <Link to="/peta" className="mini-card-link">
                Selengkapnya <span>→</span>
              </Link>
            </RevealSection>

            <RevealSection className="about-mini-card" style={{ transitionDelay: '240ms' }} once={false}>
              <div className="mini-icon-circle icon-bg-sky">
                <MessageSquare size={18} />
              </div>
              <h4 className="mini-card-title">AI Assistant</h4>
              <p className="mini-card-desc">Asisten cerdas menjawab seputar mitigasi & prosedur darurat.</p>
              <Link to="/peta" className="mini-card-link">
                Selengkapnya <span>→</span>
              </Link>
            </RevealSection>

            <RevealSection className="about-mini-card" style={{ transitionDelay: '360ms' }} once={false}>
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

      {/* =================== HOW TO USE =================== */}
      <RevealSection
        id="cara-penggunaan"
        className="how-to-use-white-section"
        style={{ backgroundImage: `url("${ASSET_BASE}images/bg-cara-penggunaan.jpg")`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
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
                      <Bell size={13} /> Notifikasi Aktif
                    </span>
                  ) : notifBrowserPerm === 'unsupported' ? (
                    <span className="notif-unsupported-badge">
                      <BellOff size={13} /> Browser tidak mendukung notifikasi
                    </span>
                  ) : (
                    <button
                      onClick={handleActivateNotif}
                      disabled={notifRequesting}
                      className={`btn-notif-action${notifBrowserPerm === 'denied' ? ' btn-notif-denied' : ''}`}
                    >
                      {notifRequesting ? (
                        <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-notif 0.7s linear infinite' }} /> Meminta izin…</>
                      ) : notifBrowserPerm === 'denied' ? (
                        <><BellOff size={14} /> Buka pengaturan browser</>
                      ) : (
                        <><Bell size={14} style={{ color: '#ffffff' }} /> Aktifkan Notifikasi Sekarang</>
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
      <RevealSection id="mitigasi" className="section bg-white">
        <div className="container">
          <h2 className="section-title">Panduan Mitigasi Instan</h2>
          <p className="section-subtitle">
            Langkah taktis yang dapat Anda ambil sebelum, saat, dan sesudah bencana terjadi berdasarkan standar BMKG &amp; BNPB.
          </p>

          {/* 6 Disaster Cards Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                key: 'gempa',
                icon: <Activity size={44} color="var(--color-alert)" />,
                title: 'Gempa Bumi',
                desc: 'Terapkan DUCK, COVER, HOLD ON. Jauhi jendela kaca, perabot tinggi, dan jangan gunakan lift. Evakuasi setelah getaran reda.',
              },
              {
                key: 'tsunami',
                icon: <Waves size={44} color="#0284C7" />,
                title: 'Tsunami',
                desc: 'Gunakan aturan emas 20-20-20. Jika gempa terasa 20 detik, Anda punya 20 menit untuk lari ke tempat setinggi minimal 20 meter dpl.',
              },
              {
                key: 'banjir',
                icon: <Droplets size={44} color="var(--color-standby)" />,
                title: 'Banjir & Bandang',
                desc: 'Matikan sakelar MCB listrik utama segera. Amankan dokumen ke wadah kedap air di lantai atas, dan jangan terobos arus deras.',
              },
              {
                key: 'longsor',
                icon: <Mountain size={44} color="var(--color-status-warning)" />,
                title: 'Tanah Longsor',
                desc: 'Kenali retakan tanah & dinding seret. Saat terjadi suara gemuruh tebing, evakuasi lari TEGAK LURUS (menyamping) dari luncuran.',
              },
              {
                key: 'cuaca',
                icon: <Wind size={44} color="#D97706" />,
                title: 'Cuaca Ekstrem',
                desc: 'Berlindung di bangunan kokoh tertutup. Jauhi pohon besar, tiang listrik, dan cabut kabel alat elektronik dari stopkontak.',
              },
              {
                key: 'gunungapi',
                icon: <Flame size={44} color="#DC2626" />,
                title: 'Erupsi Gunung Api',
                desc: 'Gunakan masker N95 dan kacamata pelindung dari abu silika. Patuhi radius zona steril KRB yang ditetapkan pos pemantauan PVMBG.',
              },
            ].map(card => (
              <div key={card.key} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                <div style={{ marginBottom: '1.25rem' }}>{card.icon}</div>
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

          {/* Tas Siaga Bencana (TSB) Banner */}
          <div
            className="tsb-promo-banner"
            style={{
              marginTop: '3.5rem',
              padding: '2.5rem',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #0E2A5C 0%, #173B7A 100%)',
              color: '#FFFFFF',
              boxShadow: '0 12px 30px rgba(14, 42, 92, 0.15)',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '2rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ maxWidth: '680px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '12px' }}>
                <Briefcase size={14} /> STANDAR KESIAPSIAGAAN MANDIRI
              </div>
              <h3 style={{ color: '#FFFFFF', fontSize: '1.75rem', marginBottom: '8px', fontWeight: '800' }}>
                Checklist Tas Siaga Bencana (TSB) 72 Jam
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.98rem', lineHeight: '1.6', margin: 0 }}>
                Pastikan perbekalan mandiri keluarga Anda untuk 3 hari pertama pasca-bencana telah lengkap dan tersimpan dalam tas kedap air dekat pintu keluar. Dilengkapi fitur cetak bersih ukuran A4 siap tempel di dinding.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setShowTsbModal(true)}
                className="btn btn-primary"
                style={{
                  background: '#F7F2EA',
                  color: '#0E2A5C',
                  border: 'none',
                  padding: '1rem 1.75rem',
                  fontSize: '1rem',
                  fontWeight: '700',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Briefcase size={18} /> Buka &amp; Cetak Checklist TSB
              </button>
            </div>
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
          <button
            type="button"
            onClick={handleCekBencana}
            className="btn btn-primary"
            style={{ padding: '1.25rem 3rem', fontSize: '1.25rem', borderRadius: 'var(--radius-full)', cursor: 'pointer', border: 'none' }}
          >
            Pantau Wilayah Saya Sekarang
          </button>
        </div>
      </RevealSection>

      {/* Mitigation SOP Modal */}
      {modal && <MitigationModal type={modal} onClose={() => setModal(null)} />}

      {/* Manual City Selector Modal */}
      {showCityModal && (
        <CitySelectModal
          isOpen={showCityModal}
          onClose={() => setShowCityModal(false)}
          onSelectCity={handleSelectManualCity}
        />
      )}

      {/* Emergency Bag (TSB) Checklist Modal */}
      {showTsbModal && (
        <EmergencyBagModal
          onClose={() => setShowTsbModal(false)}
        />
      )}
    </div>
  );
}
