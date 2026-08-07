import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Map, Bell, Bot, Shield, ChevronRight, Activity, ArrowRight,
  Wind, Droplets, Mountain, ChevronDown, ChevronUp,
} from 'lucide-react';
import '../../css/LandingPage.css';
import MitigationModal from '../components/MitigationModal';
import AIChat from '../components/AIChat';

// Count-up hook
function useCountUp(end, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
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

export default function LandingPage() {
  const alertsCount = useCountUp(12, 1500);
  const provincesCount = useCountUp(38, 1500);
  const speedCount = useCountUp(3, 1500);

  const [openFaq, setOpenFaq] = useState(null);
  const [modal, setModal] = useState(null); // 'gempa' | 'banjir' | 'cuaca'

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

          {/* Live Status Card */}
          <div className="live-status-card glass" style={{ marginTop: '3rem', border: '1px solid rgba(14,42,92,0.1)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lokasi Anda</div>
              <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--color-primary)' }}>Jakarta Selatan</div>
            </div>
            <div style={{ height: '40px', width: '1px', backgroundColor: 'var(--color-border)' }} />
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status Wilayah</div>
              <div style={{ fontWeight: '700', color: 'var(--color-status-safe)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-status-safe)', boxShadow: '0 0 10px var(--color-status-safe)', display: 'inline-block' }} />
                Aman
              </div>
            </div>
            <div style={{ height: '40px', width: '1px', backgroundColor: 'var(--color-border)' }} />
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pembaruan</div>
              <div className="mono" style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--color-primary)' }}>Baru saja</div>
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

      {/* =================== STATS =================== */}
      <section className="stats-section">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: alertsCount, label: 'Peringatan Aktif' },
              { value: provincesCount, label: 'Provinsi Terpantau' },
              { value: `< ${speedCount}s`, label: 'Kecepatan Notifikasi' },
              { value: '24/7', label: 'Pemantauan Aktif' },
            ].map((s, i) => (
              <div key={i} className="stat-item glass-dark" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                <div className="stat-number">{s.value}</div>
                <div style={{ fontWeight: '500', letterSpacing: '0.05em' }}>{s.label}</div>
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
            <div style={{ background: 'linear-gradient(135deg, #F7F2EA, #E0D9CD)', borderRadius: 'var(--radius-xl)', padding: '3rem', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="glass" style={{ textAlign: 'center', padding: '3rem', borderRadius: '50%', boxShadow: 'var(--shadow-lg)', animation: 'float 8s ease-in-out infinite' }}>
                <Map size={80} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
                <p style={{ fontWeight: '600', color: 'var(--color-primary)' }}>Peta Interaktif Indonesia</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: <Activity size={40} color="var(--color-alert)" />, shadow: '0 4px 8px rgba(192,73,43,0.3)', title: 'Data Real-time', desc: 'Terhubung langsung dengan API BMKG tanpa latensi.' },
                { icon: <Bell size={40} color="var(--color-standby)" />, shadow: '0 4px 8px rgba(74,144,217,0.3)', title: 'Peringatan Dini', desc: 'Notifikasi instan untuk wilayah Anda dalam hitungan detik.' },
                { icon: <Bot size={40} color="var(--color-primary)" />, shadow: '0 4px 8px rgba(14,42,92,0.3)', title: 'AI Assistant', desc: 'Panduan cerdas dan interaktif saat kondisi darurat.' },
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

      {/* =================== HOW TO USE =================== */}
      <section id="cara-penggunaan" className="section">
        <div className="container">
          <h2 className="text-center" style={{ marginBottom: '4rem', fontSize: '2.5rem' }}>Cara Menggunakan GeoAlert</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              {[
                { n: '1', title: 'Pilih Lokasi Anda', desc: 'Izinkan akses lokasi atau cari kota Anda secara manual di peta interaktif.' },
                { n: '2', title: 'Lihat Status Bencana', desc: 'Periksa indikator warna untuk mengetahui tingkat risiko di sekitar Anda.' },
                { n: '3', title: 'Aktifkan Notifikasi', desc: 'Dapatkan lansiran peringatan dini langsung ke perangkat saat terjadi anomali.' },
                { n: '4', title: 'Tanya Asisten AI', desc: 'Gunakan asisten cerdas untuk panduan evakuasi spesifik dan personal.' },
              ].map((s, i) => (
                <div key={i} className="timeline-step" style={{ marginBottom: i < 3 ? '2rem' : 0 }}>
                  <div className="timeline-number">{s.n}</div>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{s.title}</h4>
                    <p className="text-muted" style={{ lineHeight: '1.6' }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: 'linear-gradient(135deg, var(--color-primary), #1e5bb8)', borderRadius: 'var(--radius-xl)', padding: '4rem 3rem', color: 'white', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column' }}>
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
                {[
                  { time: 'Hari ini, 10:45 WIB', icon: <Activity size={18} color="var(--color-alert)" />, iconBg: 'rgba(192,73,43,0.1)', type: 'Gempa Bumi (M 5.2)', loc: 'Selatan Jawa Barat', badge: <span className="badge badge-warning">WASPADA</span> },
                  { time: 'Kemarin, 15:20 WIB', icon: <Droplets size={18} color="var(--color-standby)" />, iconBg: 'rgba(74,144,217,0.1)', type: 'Banjir', loc: 'Jakarta Timur', badge: <span className="badge badge-standby">SIAGA</span> },
                  { time: 'Kemarin, 08:10 WIB', icon: <Activity size={18} color="var(--color-status-safe)" />, iconBg: 'rgba(46,125,50,0.1)', type: 'Gempa Bumi (M 4.1)', loc: 'Palu, Sulawesi Tengah', badge: <span className="badge badge-safe">AMAN</span> },
                ].map((row, i) => (
                  <tr key={i} className="recent-table-row">
                    <td className="mono" style={{ color: 'var(--color-primary)', fontWeight: '500' }}>{row.time}</td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600' }}><div style={{ background: row.iconBg, padding: '8px', borderRadius: '50%' }}>{row.icon}</div>{row.type}</div></td>
                    <td style={{ fontWeight: '500' }}>{row.loc}</td>
                    <td>{row.badge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* =================== ASK AI =================== */}
      <section id="tanya-ai" className="container">
        <div className="ask-ai-section">
          <div style={{ padding: '0 2rem 0', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'grid' }} className="grid md:grid-cols-2 gap-12 items-stretch">
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', marginBottom: '1.5rem', fontWeight: '600', letterSpacing: '0.05em', width: 'fit-content' }}>
                  <Bot size={18} /> FITUR BARU
                </div>
                <h2 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '2.5rem' }}>Tanya Asisten AI</h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', fontSize: '1.125rem', lineHeight: '1.6' }}>
                  Dapatkan jawaban cepat seputar kesiapsiagaan bencana, prosedur evakuasi, dan informasi lokasi spesifik langsung dari asisten cerdas kami.
                </p>
                <Link to="/peta" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Map size={20} /> Buka Peta + AI <ArrowRight size={18} />
                </Link>
              </div>

              {/* Inline functional AI chat */}
              <div className="glass-dark" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', minHeight: '460px' }}>
                <AIChat isFloating={false} />
              </div>
            </div>
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
