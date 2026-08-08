import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
            <FileText size={36} color="var(--color-primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Syarat &amp; Ketentuan</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Terakhir diperbarui: 8 Agustus 2026
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="card" style={{ padding: '2.5rem', lineHeight: '1.8', color: 'var(--color-text-main)' }}>
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>1. Penerimaan Syarat</h2>
            <p>
              Dengan mengakses dan menggunakan layanan GeoAlert ("Layanan"), Anda menyetujui untuk terikat oleh
              Syarat dan Ketentuan ini. Jika Anda tidak menyetujui syarat-syarat ini, mohon hentikan penggunaan
              Layanan kami.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>2. Deskripsi Layanan</h2>
            <p>
              GeoAlert adalah platform pemantauan bencana alam yang menyajikan informasi dari sumber resmi
              pemerintah Indonesia (BMKG, BNPB) secara real-time. Layanan ini bersifat <strong>informatif</strong>
              dan dirancang sebagai alat bantu, bukan sebagai satu-satunya sumber informasi darurat.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>3. Batasan Tanggung Jawab</h2>
            <div style={{
              background: 'rgba(192,73,43,0.08)', border: '1px solid rgba(192,73,43,0.2)',
              borderLeft: '4px solid var(--color-alert)', borderRadius: 'var(--radius-md)',
              padding: '1.25rem', marginBottom: '1rem',
            }}>
              <strong>⚠️ Peringatan Penting:</strong> GeoAlert <strong>bukan pengganti</strong> sistem peringatan
              resmi pemerintah. Dalam kondisi darurat, selalu ikuti instruksi dari BPBD, BMKG, dan otoritas
              setempat.
            </div>
            <p style={{ marginBottom: '1rem' }}>
              GeoAlert tidak bertanggung jawab atas:
            </p>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>Keterlambatan, ketidakakuratan, atau ketidaktersediaan data dari sumber pihak ketiga (BMKG, BNPB)</li>
              <li style={{ marginBottom: '0.5rem' }}>Kerugian yang timbul akibat pengambilan keputusan berdasarkan data GeoAlert</li>
              <li style={{ marginBottom: '0.5rem' }}>Gangguan layanan akibat pemeliharaan, force majeure, atau masalah infrastruktur</li>
              <li style={{ marginBottom: '0.5rem' }}>Kegagalan notifikasi browser akibat pengaturan perangkat pengguna</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>4. Penggunaan yang Diizinkan</h2>
            <p style={{ marginBottom: '1rem' }}>Anda boleh menggunakan Layanan ini untuk:</p>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>Keperluan pribadi, edukasi, dan kesiapsiagaan bencana</li>
              <li style={{ marginBottom: '0.5rem' }}>Pemantauan informasi bencana di wilayah Anda</li>
              <li style={{ marginBottom: '0.5rem' }}>Berbagi informasi keselamatan dengan komunitas</li>
            </ul>
            <p style={{ marginBottom: '1rem', marginTop: '1rem' }}>Anda <strong>tidak boleh</strong>:</p>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>Melakukan scraping atau penggunaan otomatis yang berlebihan pada API kami</li>
              <li style={{ marginBottom: '0.5rem' }}>Menyebarkan informasi bencana palsu menggunakan nama GeoAlert</li>
              <li style={{ marginBottom: '0.5rem' }}>Melakukan reverse engineering atau memodifikasi Layanan</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>5. Akurasi Data</h2>
            <p>
              Data yang ditampilkan GeoAlert bersumber dari API resmi BMKG dan BNPB. Meskipun kami berupaya
              menyajikan data seakurat mungkin, kami tidak dapat menjamin keakuratan 100% karena bergantung
              pada pihak ketiga. Beberapa data mungkin ditandai sebagai <em>"contoh tampilan data"</em> jika
              sumber API tidak tersedia secara publik.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>6. Kekayaan Intelektual</h2>
            <p>
              Desain, kode, dan konten editorial GeoAlert adalah milik GeoAlert Indonesia. Data bencana
              yang bersumber dari BMKG dan BNPB tunduk pada hak cipta instansi tersebut. Penggunaan ulang
              data harus mengikuti ketentuan masing-masing sumber.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>7. Layanan Gratis</h2>
            <p>
              GeoAlert sepenuhnya <strong>gratis</strong> untuk seluruh masyarakat Indonesia. Kami percaya
              informasi keselamatan bencana adalah hak semua orang. Tidak ada biaya tersembunyi atau
              fitur berbayar dalam Layanan ini.
            </p>
          </section>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>8. Perubahan Syarat</h2>
            <p>
              Kami berhak mengubah Syarat dan Ketentuan ini. Perubahan akan berlaku segera setelah
              dipublikasikan di halaman ini. Penggunaan Layanan yang berlanjut setelah perubahan
              menandakan penerimaan Anda terhadap syarat yang diperbarui.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>9. Hukum yang Berlaku</h2>
            <p>
              Syarat dan Ketentuan ini tunduk pada hukum yang berlaku di Republik Indonesia. Sengketa
              yang timbul akan diselesaikan melalui musyawarah, atau jika tidak tercapai kesepakatan,
              melalui pengadilan yang berwenang di Jakarta, Indonesia.
            </p>
          </section>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link to="/kebijakan-privasi" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
            Baca juga: Kebijakan Privasi →
          </Link>
        </div>
      </div>
    </div>
  );
}
