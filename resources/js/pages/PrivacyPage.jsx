import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '80vh', background: 'var(--color-bg)', padding: '4rem 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        {/* Back nav */}
        <Link
          to="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            color: 'var(--color-primary)', textDecoration: 'none',
            fontWeight: '600', marginBottom: '2rem', fontSize: '0.9rem',
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Beranda
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{
            background: 'rgba(14,42,92,0.1)', padding: '1rem',
            borderRadius: 'var(--radius-lg)', flexShrink: 0,
          }}>
            <Shield size={36} color="var(--color-primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Kebijakan Privasi</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Terakhir diperbarui: 8 Agustus 2026
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="card" style={{ padding: '2.5rem', lineHeight: '1.8', color: 'var(--color-text-main)' }}>
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>1. Pendahuluan</h2>
            <p>
              GeoAlert Indonesia ("kami") berkomitmen untuk melindungi privasi pengguna ("Anda"). Kebijakan Privasi ini
              menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi yang Anda berikan saat
              menggunakan layanan GeoAlert di <strong>geoalert.id</strong>.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>2. Informasi yang Kami Kumpulkan</h2>
            <p style={{ marginBottom: '1rem' }}>Kami dapat mengumpulkan informasi berikut:</p>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Data Lokasi:</strong> Koordinat GPS (latitude/longitude) yang Anda izinkan melalui browser
                untuk menampilkan status wilayah dan bencana terdekat. Data ini <em>hanya diproses di perangkat Anda</em>
                dan tidak dikirim ke server kami.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Alamat Email:</strong> Jika Anda mendaftar newsletter, kami menyimpan alamat email Anda
                di server kami yang aman untuk mengirimkan informasi terkait bencana.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Preferensi Notifikasi:</strong> Status izin notifikasi browser Anda disimpan di
                <em>localStorage</em> perangkat Anda saja, tidak di server.
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <strong>Log Teknis:</strong> Alamat IP, jenis browser, dan halaman yang dikunjungi untuk
                keperluan keamanan dan pemeliharaan sistem.
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>3. Penggunaan Informasi</h2>
            <p style={{ marginBottom: '1rem' }}>Kami menggunakan informasi Anda untuk:</p>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>Menampilkan status bencana dan peringatan dini yang relevan dengan lokasi Anda</li>
              <li style={{ marginBottom: '0.5rem' }}>Mengirimkan notifikasi peringatan bencana melalui newsletter (jika berlangganan)</li>
              <li style={{ marginBottom: '0.5rem' }}>Meningkatkan kualitas dan keandalan layanan GeoAlert</li>
              <li style={{ marginBottom: '0.5rem' }}>Memenuhi kewajiban hukum yang berlaku di Indonesia</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>4. Sumber Data Pihak Ketiga</h2>
            <p>
              GeoAlert mengambil data bencana dari sumber resmi pemerintah Indonesia:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.75rem' }}>
              <li><strong>BMKG</strong> (bmkg.go.id) — Data gempa dan cuaca</li>
              <li><strong>BNPB</strong> (bnpb.go.id) — Data bencana nasional</li>
              <li><strong>OpenStreetMap/Nominatim</strong> — Layanan geocoding lokasi</li>
            </ul>
            <p style={{ marginTop: '0.75rem' }}>
              Penggunaan layanan tersebut tunduk pada kebijakan privasi masing-masing penyedia.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>5. Keamanan Data</h2>
            <p>
              Kami menerapkan langkah-langkah keamanan teknis yang wajar untuk melindungi data Anda, termasuk
              enkripsi HTTPS, rate limiting pada API, dan akses terbatas ke database. Namun, tidak ada sistem
              yang 100% aman — kami menganjurkan Anda untuk tidak berbagi informasi sensitif melalui platform ini.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>6. Hak Pengguna</h2>
            <p style={{ marginBottom: '0.75rem' }}>Sesuai hukum yang berlaku, Anda berhak untuk:</p>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>Meminta akses ke data pribadi yang kami simpan tentang Anda</li>
              <li style={{ marginBottom: '0.5rem' }}>Meminta koreksi atau penghapusan data email Anda</li>
              <li style={{ marginBottom: '0.5rem' }}>Mencabut izin lokasi kapan saja melalui pengaturan browser</li>
            </ul>
            <p style={{ marginTop: '0.75rem' }}>
              Untuk mengajukan permintaan, hubungi kami di <strong>info@geoalert.id</strong>.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>7. Perubahan Kebijakan</h2>
            <p>
              Kami berhak memperbarui Kebijakan Privasi ini sewaktu-waktu. Perubahan signifikan akan diumumkan
              di halaman ini dengan memperbarui tanggal "Terakhir diperbarui". Penggunaan layanan yang berkelanjutan
              setelah perubahan dianggap sebagai penerimaan kebijakan yang diperbarui.
            </p>
          </section>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link to="/syarat-ketentuan" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
            Baca juga: Syarat &amp; Ketentuan →
          </Link>
        </div>
      </div>
    </div>
  );
}
