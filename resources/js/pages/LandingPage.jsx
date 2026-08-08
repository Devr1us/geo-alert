import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Map, Bell, Bot, Shield, ChevronRight, Activity, ArrowRight,
  Wind, Droplets, Mountain, ChevronDown, ChevronUp, MapPin, BellOff,
} from 'lucide-react';
import '../../css/LandingPage.css';
import MitigationModal from '../components/MitigationModal';

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
  { icon: <Activity size={32} color="var(--color-alert)" />, bg: 'rgba(192, 73, 43, 0.1)', title: 'Gempa Bumi', desc: 'Getaran atau guncangan di permukaan bumi akibat pelepasan energi dari dalam secara tiba-tiba. Indonesia rawan gempa karena berada di Cincin Api Pasifik, pertemuan tiga lempeng tektonik besar dunia.' },
  { icon: <Mountain size={32} color="var(--color-status-warning)" />, bg: 'rgba(245, 124, 0, 0.1)', title: 'Tanah Longsor', desc: 'Perpindahan massa tanah, batuan, atau material campuran yang bergerak ke bawah lereng. Sering dipicu oleh curah hujan tinggi atau gempa. Kawasan rawan: Jawa Barat, Sumatra, Sulawesi.' },
  { icon: <Droplets size={32} color="var(--color-standby)" />, bg: 'rgba(74, 144, 217, 0.1)', title: 'Banjir', desc: 'Terbenamnya daratan karena volume air yang melebihi kapasitas drainase. Banjir bandang sangat berbahaya karena bergerak cepat dengan membawa lumpur dan material berbahaya.' },
  { icon: <Wind size={32} color="var(--color-primary)" />, bg: 'rgba(14, 42, 92, 0.1)', title: 'Cuaca Ekstrem', desc: 'Kondisi cuaca berbahaya seperti puting beliung, hujan es, atau badai tropis. Berpotensi merusak infrastruktur dan membahayakan keselamatan jiwa, terutama di wilayah pesisir dan perbukitan.' },
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
        <div className="container animate-fade-in-up">
          <h1 className="hero-title" style={{ fontSize: '4rem', fontWeight: '900', letterSpacing: '-0.02em' }}>
            GeoAlert
          </h1>
          <p className="hero-subtitle" style={{ fontSize: '1.5rem', fontWeight: '500', color: 'var(--color-primary)' }}>
            Deteksi Dini, Lindungi Diri
          </p>
          <p style={{ maxWidth: '700px', margin: '0 auto 2.5rem', color: 'var(--color-text-muted)', fontSize: '1.125rem', lineHeight: '1.7' }}>
            Pantau informasi bencana alam di seluruh Indonesia secara real-time.
            Dapatkan panduan mitigasi instan dan peringatan dini langsung dari sumber resmi.
          </p>

          <div className="hero-actions">
            <Link to="/peta" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
              <Map size={24} /> Cek Bencana Terdekat
            </Link>
            <a href="#tentang" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.125rem', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)' }}>
              Pelajari Lebih Lanjut
            </a>
          </div>

          {/* ---- Live Status Card — poin 1 ---- */}
          <div className="live-status-card glass" style={{ marginTop: '3rem', border: '1px solid rgba(14,42,92,0.1)' }}>
            {/* Lokasi */}
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lokasi Anda</div>
              {locationStatus === 'loading' && (
                <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} style={{ animation: 'pulse 1.5s ease-in-out infinite' }} /> Mendeteksi…
                </div>
              )}
              {locationStatus === 'denied' && (
                <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="var(--color-alert)" />
                  <span style={{ fontSize: '0.8rem' }}>Izin lokasi diperlukan</span>
                </div>
              )}
              {locationStatus === 'ready' && (
                <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} />
                  {locationName}
                </div>
              )}
            </div>

            <div style={{ height: '40px', width: '1px', backgroundColor: 'var(--color-border)' }} />

            {/* Status Wilayah */}
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status Wilayah</div>
              {locationStatus === 'denied' ? (
                <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Aktifkan lokasi untuk melihat status wilayah Anda
                </div>
              ) : (
                <div style={{ fontWeight: '700', color: currentStatus.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: currentStatus.color, boxShadow: `0 0 10px ${currentStatus.glow}`, display: 'inline-block' }} />
                  {locationStatus === 'loading' ? '—' : currentStatus.label}
                </div>
              )}
            </div>

            <div style={{ height: '40px', width: '1px', backgroundColor: 'var(--color-border)' }} />

            {/* Pembaruan */}
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pembaruan</div>
              <div className="mono" style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--color-primary)' }}>
                {eventsLoading ? '…' : 'Baru saja'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== TRUST BAR =================== */}
      <div className="trust-bar glass">
        <div className="container">
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600' }}>
            Terhubung dengan sumber data resmi
          </span>
          <div className="trust-logos">
            <a href="https://www.bmkg.go.id" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'none' }}>
              <Shield size={18} /> BMKG
            </a>
            <a href="https://www.bnpb.go.id" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'none' }}>
              <Shield size={18} /> BNPB
            </a>
            <a href="https://inarisk.bnpb.go.id" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'none' }}>
              <Shield size={18} /> InaRISK
            </a>
          </div>
        </div>
      </div>

      {/* =================== STATS — poin 4 =================== */}
      <section className="stats-section">
        <div className="container">
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
              <div key={i} className="stat-item glass-dark" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                <div className="stat-number">{s.value}</div>
                <div style={{ fontWeight: '500', letterSpacing: '0.05em' }}>{s.label}</div>
                {s.note && (
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{s.note}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== ABOUT =================== */}
      <section id="tentang" className="section bg-white">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem' }}>Mengapa Memilih GeoAlert?</h2>
            <p className="text-muted" style={{ maxWidth: '650px', margin: '1.5rem auto 0', fontSize: '1.125rem' }}>
              Sistem peringatan dini yang dirancang khusus untuk kondisi geografis Indonesia —
              memberikan informasi vital dengan visualisasi modern saat waktu sangat berharga.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div style={{ background: 'linear-gradient(135deg, #F7F2EA, #E0D9CD)', borderRadius: 'var(--radius-xl)', padding: 'clamp(1.5rem, 4vw, 3rem)', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="glass" style={{ textAlign: 'center', padding: 'clamp(1.5rem, 4vw, 3rem)', borderRadius: '50%', boxShadow: 'var(--shadow-lg)', animation: 'float 8s ease-in-out infinite' }}>
                <Map size={80} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
                <p style={{ fontWeight: '600', color: 'var(--color-primary)' }}>Peta Interaktif Indonesia</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: <Activity size={40} color="var(--color-alert)" />, shadow: '0 4px 8px rgba(192,73,43,0.3)', title: 'Data Real-time', desc: 'Terhubung langsung dengan API BMKG tanpa latensi.' },
                { icon: <Bell size={40} color="var(--color-standby)" />, shadow: '0 4px 8px rgba(74,144,217,0.3)', title: 'Peringatan Dini', desc: 'Notifikasi instan untuk wilayah Anda dalam hitungan detik.' },
                { icon: <Bot size={40} color="var(--color-primary)" />, shadow: '0 4px 8px rgba(14,42,92,0.3)', title: 'AI Assistant', desc: 'Panduan berbasis SOP resmi BMKG & BNPB saat kondisi darurat.' },
                { icon: <Map size={40} color="var(--color-status-safe)" />, shadow: '0 4px 8px rgba(46,125,50,0.3)', title: 'Peta Interaktif', desc: 'Visualisasi tingkat risiko berbasis lokasi berakurasi tinggi.' },
              ].map((f, i) => (
                <div key={i} className="card">
                  <div style={{ filter: `drop-shadow(${f.shadow})`, marginBottom: '1.5rem' }}>{f.icon}</div>
                  <h4 style={{ fontSize: '1.25rem' }}>{f.title}</h4>
                  <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: '1.6' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =================== HOW TO USE — poin 2 (notifikasi) =================== */}
      <section id="cara-penggunaan" className="section">
        <div className="container">
          <h2 className="text-center" style={{ marginBottom: '4rem', fontSize: '2.5rem' }}>Cara Menggunakan GeoAlert</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              {[
                { n: '1', title: 'Pilih Lokasi Anda', desc: 'Izinkan akses lokasi atau cari kota Anda secara manual di peta interaktif.', action: null },
                { n: '2', title: 'Lihat Status Bencana', desc: 'Periksa indikator warna untuk mengetahui tingkat risiko di sekitar Anda.', action: null },
                {
                  n: '3',
                  title: 'Aktifkan Notifikasi',
                  desc: 'Dapatkan lansiran peringatan dini langsung ke perangkat saat terjadi anomali.',
                  action: notifPref === 'true' ? null : (
                    <button
                      onClick={handleActivateNotif}
                      disabled={notifRequesting || !('Notification' in window)}
                      className="btn btn-secondary"
                      style={{ marginTop: '0.75rem', padding: '0.5rem 1.25rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {notifRequesting ? (
                        <span>Meminta izin…</span>
                      ) : notifPref === 'false' ? (
                        <><BellOff size={14} /> Izin ditolak — ubah di pengaturan browser</>
                      ) : !('Notification' in window) ? (
                        <><BellOff size={14} /> Browser tidak mendukung notifikasi</>
                      ) : (
                        <><Bell size={14} /> Aktifkan Notifikasi Sekarang</>
                      )}
                    </button>
                  ),
                  badge: notifPref === 'true' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(46,125,50,0.1)', color: 'var(--color-status-safe)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', marginTop: '8px' }}>
                      <Bell size={12} /> Notifikasi aktif
                    </span>
                  ) : null,
                },
                { n: '4', title: 'Tanya Asisten AI', desc: 'Gunakan asisten panduan SOP BMKG untuk informasi evakuasi dan mitigasi.', action: null },
              ].map((s, i) => (
                <div key={i} className="timeline-step" style={{ marginBottom: i < 3 ? '2rem' : 0 }}>
                  <div className="timeline-number">{s.n}</div>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{s.title}</h4>
                    <p className="text-muted" style={{ lineHeight: '1.6' }}>{s.desc}</p>
                    {s.action}
                    {s.badge}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: 'linear-gradient(135deg, var(--color-primary), #1e5bb8)', borderRadius: 'var(--radius-xl)', padding: 'clamp(2rem, 4vw, 4rem) clamp(1.5rem, 3vw, 3rem)', color: 'white', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column' }}>
              <Shield size={48} color="var(--color-standby)" style={{ marginBottom: '2rem' }} />
              <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '2rem' }}>Siaga Kapan Saja</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2.5rem', fontSize: '1.125rem', lineHeight: '1.6' }}>
                GeoAlert dirancang agar sangat mudah diakses bahkan dalam kondisi panik sekalipun.
              </p>
              <Link to="/peta" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '1rem 2rem' }}>
                Mulai Pemantauan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =================== RECENT DISASTERS =================== */}
      <section className="section bg-white">
        <div className="container">
          <div className="flex justify-between items-center" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.5rem' }}>Kejadian Terkini</h2>
            <Link to="/peta" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Lihat Peta Penuh <ChevronRight size={18} />
            </Link>
          </div>
          <div style={{ overflowX: 'auto', padding: '1rem', margin: '-1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', textAlign: 'left' }}>
              <thead>
                <tr>
                  {['Waktu', 'Jenis Bencana', 'Lokasi', 'Status'].map(h => (
                    <th key={h} style={{ padding: '0 1rem 1rem', color: 'var(--color-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eventsLoading
                  ? [1, 2, 3].map(i => (
                    <tr key={i}>
                      <td colSpan={4} style={{ padding: '0 0 8px' }}>
                        <div style={{ height: '52px', background: 'var(--color-border)', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
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
                        <td className="mono" style={{ color: 'var(--color-primary)', fontWeight: '500' }}>
                          {ev.time || '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600' }}>
                            <div style={{ background: 'rgba(192,73,43,0.1)', padding: '8px', borderRadius: '50%' }}>
                              <Activity size={18} color="var(--color-alert)" />
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
      </section>

      {/* =================== EDUCATION =================== */}
      <section className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem' }}>Edukasi Bencana</h2>
            <p className="text-muted" style={{ maxWidth: '650px', margin: '1.5rem auto 0', fontSize: '1.125rem' }}>
              Kenali jenis-jenis bencana alam yang sering terjadi di Indonesia agar Anda dan keluarga lebih siap.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {EDUCATION_DATA.map((e, i) => (
              <div key={i} className="card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{ background: e.bg, padding: '1rem', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
                  {e.icon}
                </div>
                <div>
                  <h4 style={{ marginBottom: '0.75rem', fontSize: '1.2rem' }}>{e.title}</h4>
                  <p className="text-muted" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== MITIGATION =================== */}
      <section className="section bg-white">
        <div className="container">
          <h2 className="text-center" style={{ marginBottom: '4rem', fontSize: '2.5rem' }}>Panduan Mitigasi Instan</h2>
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
      </section>



      {/* =================== FAQ =================== */}
      <section className="section bg-white">
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 className="text-center" style={{ marginBottom: '4rem', fontSize: '2.5rem' }}>Pertanyaan Umum</h2>
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
      </section>

      {/* =================== FINAL CTA =================== */}
      <section className="section text-center" style={{ padding: '6rem 0 8rem' }}>
        <div className="container">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '3rem' }}>Jangan Tunggu Sampai Terlambat</h2>
          <p className="text-muted" style={{ maxWidth: '650px', margin: '0 auto 3rem', fontSize: '1.25rem', lineHeight: '1.6' }}>
            Pantau kondisi lingkungan Anda dan jadilah selangkah lebih maju dalam menghadapi potensi bencana. Keselamatan Anda adalah prioritas utama.
          </p>
          <Link to="/peta" className="btn btn-primary" style={{ padding: '1.25rem 3rem', fontSize: '1.25rem', borderRadius: 'var(--radius-full)' }}>
            Pantau Wilayah Saya Sekarang
          </Link>
        </div>
      </section>

      {/* Mitigation Modal */}
      {modal && <MitigationModal type={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
