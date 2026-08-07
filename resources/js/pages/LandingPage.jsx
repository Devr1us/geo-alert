import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Map, Bell, Bot, Shield, ChevronRight, Activity, ArrowRight, Wind, Droplets } from 'lucide-react';
import '../../css/LandingPage.css';

// A simple custom hook for count-up animation
function useCountUp(end, duration = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return count;
}

export default function LandingPage() {
  const alertsCount = useCountUp(12, 1500);
  const provincesCount = useCountUp(38, 1500);
  const speedCount = useCountUp(3, 1500);
  
  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container animate-fade-in-up">
          <h1 className="hero-title">GeoAlert</h1>
          <p className="hero-subtitle">Deteksi Dini, Lindungi Diri</p>
          <p style={{ maxWidth: '700px', margin: '0 auto 2rem', color: 'var(--color-text-muted)' }}>
            Pantau informasi bencana alam di seluruh Indonesia secara real-time. 
            Dapatkan panduan mitigasi instan dan peringatan dini langsung dari sumber resmi.
          </p>
          
          <div className="hero-actions">
            <Link to="/peta" className="btn btn-primary">
              <Map size={20} /> Cek Bencana Terdekat
            </Link>
            <a href="#tentang" className="btn btn-secondary">
              Pelajari Lebih Lanjut
            </a>
          </div>

          <div className="live-status-card">
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Lokasi Anda</div>
              <div style={{ fontWeight: '600' }}>Jakarta Selatan</div>
            </div>
            <div style={{ height: '30px', width: '1px', backgroundColor: 'var(--color-border)' }}></div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Status Wilayah</div>
              <div style={{ fontWeight: '600', color: 'var(--color-status-safe)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-status-safe)' }}></span>
                Aman
              </div>
            </div>
            <div style={{ height: '30px', width: '1px', backgroundColor: 'var(--color-border)' }}></div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Pembaruan Terakhir</div>
              <div className="mono" style={{ fontSize: '0.875rem' }}>Baru saja</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="trust-bar">
        <div className="container">
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Terhubung dengan sumber data resmi
          </span>
          <div className="trust-logos">
            <span>BMKG</span>
            <span>BNPB</span>
            <span>InaRISK</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <section className="stats-section">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="stat-item">
              <div className="stat-number">{alertsCount}</div>
              <div>Peringatan Aktif</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{provincesCount}</div>
              <div>Provinsi Terpantau</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">&lt; {speedCount}s</div>
              <div>Kecepatan Notifikasi</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div>Pemantauan</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="tentang" className="section bg-white">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '3rem' }}>
            <h2>Mengapa Memilih GeoAlert?</h2>
            <p className="text-muted" style={{ maxWidth: '600px', margin: '1rem auto' }}>
              Sistem peringatan dini yang dirancang khusus untuk kondisi geografis Indonesia, 
              memberikan informasi yang Anda butuhkan saat waktu sangat berharga.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div style={{ backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', padding: '2rem', height: '100%', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
              {/* Static Map Preview */}
              <div style={{ textAlign: 'center', opacity: 0.5 }}>
                <Map size={64} style={{ margin: '0 auto 1rem' }} />
                <p>Pratinjau Peta Interaktif</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="card">
                <Activity color="var(--color-alert)" size={32} style={{ marginBottom: '1rem' }} />
                <h4>Data Real-time</h4>
                <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Terhubung langsung dengan API BMKG.</p>
              </div>
              <div className="card">
                <Bell color="var(--color-standby)" size={32} style={{ marginBottom: '1rem' }} />
                <h4>Peringatan Dini</h4>
                <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Notifikasi instan untuk wilayah Anda.</p>
              </div>
              <div className="card">
                <Bot color="var(--color-primary)" size={32} style={{ marginBottom: '1rem' }} />
                <h4>AI Assistant</h4>
                <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Panduan cerdas saat darurat.</p>
              </div>
              <div className="card">
                <Map color="var(--color-status-safe)" size={32} style={{ marginBottom: '1rem' }} />
                <h4>Peta Interaktif</h4>
                <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Visualisasi risiko berbasis lokasi.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section id="cara-penggunaan" className="section">
        <div className="container">
          <h2 className="text-center" style={{ marginBottom: '3rem' }}>Cara Menggunakan GeoAlert</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="timeline-step">
                <div className="timeline-number">01</div>
                <div>
                  <h4>Pilih Lokasi Anda</h4>
                  <p className="text-muted">Izinkan akses lokasi atau cari kota Anda secara manual di peta.</p>
                </div>
              </div>
              <div className="timeline-step">
                <div className="timeline-number">02</div>
                <div>
                  <h4>Lihat Status Bencana</h4>
                  <p className="text-muted">Periksa indikator warna untuk mengetahui tingkat risiko di sekitar Anda.</p>
                </div>
              </div>
              <div className="timeline-step">
                <div className="timeline-number">03</div>
                <div>
                  <h4>Aktifkan Notifikasi</h4>
                  <p className="text-muted">Dapatkan lansiran peringatan dini langsung ke perangkat Anda.</p>
                </div>
              </div>
              <div className="timeline-step">
                <div className="timeline-number">04</div>
                <div>
                  <h4>Tanya AI</h4>
                  <p className="text-muted">Gunakan asisten cerdas untuk panduan mitigasi spesifik.</p>
                </div>
              </div>
            </div>
            
            <div style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-lg)', padding: '2rem', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ color: 'white', marginBottom: '1rem' }}>Siap Kapan Saja</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem' }}>
                Kesiapsiagaan adalah kunci keselamatan. GeoAlert didesain agar mudah diakses dalam kondisi panik sekalipun.
              </p>
              <Link to="/peta" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Mulai Sekarang</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Disasters */}
      <section className="section bg-white">
        <div className="container">
          <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
            <h2>Kejadian Terkini</h2>
            <Link to="/peta" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontWeight: '600' }}>
              Lihat Semua <ChevronRight size={16} />
            </Link>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ padding: '1rem 0' }}>Waktu</th>
                  <th>Jenis Bencana</th>
                  <th>Lokasi</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="mono" style={{ padding: '1rem 0' }}>Hari ini, 10:45 WIB</td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={16} /> Gempa Bumi (M 5.2)</div></td>
                  <td>Selatan Jawa Barat</td>
                  <td><span className="badge badge-warning">WASPADA</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="mono" style={{ padding: '1rem 0' }}>Kemarin, 15:20 WIB</td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Droplets size={16} /> Banjir</div></td>
                  <td>Jakarta Timur</td>
                  <td><span className="badge badge-standby">SIAGA</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="mono" style={{ padding: '1rem 0' }}>Kemarin, 08:10 WIB</td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={16} /> Gempa Bumi (M 4.1)</div></td>
                  <td>Palu, Sulawesi Tengah</td>
                  <td><span className="badge badge-safe">AMAN</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Mitigation Guide */}
      <section className="section">
        <div className="container">
          <h2 className="text-center" style={{ marginBottom: '3rem' }}>Panduan Mitigasi</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card">
              <Activity size={32} color="var(--color-alert)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Gempa Bumi</h3>
              <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                Jangan panik. Berlindung di bawah meja yang kuat, jauhi jendela dan perabotan yang mudah jatuh.
              </p>
              <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.875rem', padding: '0.5rem' }}>Selengkapnya</button>
            </div>
            <div className="card">
              <Droplets size={32} color="var(--color-standby)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Banjir</h3>
              <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                Matikan arus listrik, amankan dokumen penting ke tempat tinggi, dan ikuti jalur evakuasi.
              </p>
              <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.875rem', padding: '0.5rem' }}>Selengkapnya</button>
            </div>
            <div className="card">
              <Wind size={32} color="var(--color-status-warning)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Cuaca Ekstrem</h3>
              <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                Tetap di dalam rumah, hindari pohon besar, dan pantau informasi peringatan dini dari sumber resmi.
              </p>
              <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.875rem', padding: '0.5rem' }}>Selengkapnya</button>
            </div>
          </div>
        </div>
      </section>

      {/* Ask AI */}
      <section id="tanya-ai" className="container">
        <div className="ask-ai-section" style={{ padding: '4rem 2rem' }}>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 style={{ color: 'white', marginBottom: '1rem' }}>Tanya Asisten AI</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem' }}>
                Dapatkan jawaban cepat dan akurat seputar kesiapsiagaan bencana, prosedur evakuasi, dan informasi lokasi.
              </p>
              
              <div className="chat-input">
                <input type="text" placeholder="Tanya sesuatu tentang gempa..." />
                <button className="btn btn-primary"><ArrowRight size={20} /></button>
              </div>
            </div>
            
            <div className="chat-preview">
              <div className="chat-bubble chat-user">
                Apa yang harus saya siapkan di tas siaga bencana?
              </div>
              <div className="chat-bubble chat-ai">
                <strong>Tas siaga bencana sebaiknya berisi:</strong>
                <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                  <li>Air minum & makanan tahan lama (untuk 3 hari)</li>
                  <li>Kotak P3K & obat-obatan pribadi</li>
                  <li>Senter, radio portabel & baterai cadangan</li>
                  <li>Dokumen penting dalam map kedap air</li>
                  <li>Pakaian ganti & peluit darurat</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-white">
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 className="text-center" style={{ marginBottom: '3rem' }}>Pertanyaan Umum</h2>
          
          <div className="faq-item">
            <div className="faq-question">Apakah data GeoAlert akurat? <ChevronRight size={20} /></div>
            <div className="faq-answer">Ya, kami menarik data secara langsung dari API resmi BMKG dan BNPB.</div>
          </div>
          <div className="faq-item">
            <div className="faq-question">Bagaimana cara mengaktifkan notifikasi? <ChevronRight size={20} /></div>
          </div>
          <div className="faq-item">
            <div className="faq-question">Apakah aplikasi ini berbayar? <ChevronRight size={20} /></div>
          </div>
          <div className="faq-item">
            <div className="faq-question">Berapa jeda waktu peringatan setelah gempa terjadi? <ChevronRight size={20} /></div>
          </div>
          <div className="faq-item">
            <div className="faq-question">Apakah saya bisa melihat riwayat bencana di lokasi saya? <ChevronRight size={20} /></div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section text-center">
        <div className="container">
          <h2 style={{ marginBottom: '1.5rem' }}>Jangan Tunggu Sampai Terlambat</h2>
          <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
            Pantau kondisi lingkungan Anda dan jadilah selangkah lebih maju dalam menghadapi potensi bencana.
          </p>
          <Link to="/peta" className="btn btn-primary btn-lg" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
            Pantau Wilayah Saya Sekarang
          </Link>
        </div>
      </section>
    </div>
  );
}
