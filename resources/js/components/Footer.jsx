import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Mail, Phone, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.message || 'Terjadi kesalahan. Coba lagi.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Gagal terhubung ke server. Periksa koneksi Anda.');
    }
  };

  return (
    <footer className="footer" id="kontak">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="nav-brand" style={{ color: 'white', marginBottom: '1rem' }}>
              <Activity size={28} color="var(--color-standby)" />
              GeoAlert
            </div>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem' }}>
              Sistem peringatan dini bencana alam Indonesia yang menyajikan informasi real-time dan panduan mitigasi tepercaya.
            </p>
          </div>

          <div>
            <h4>Tautan Cepat</h4>
            <Link to="/" className="footer-link">Beranda</Link>
            <Link to="/peta" className="footer-link">Peta Bencana</Link>
            <a href="#tentang" className="footer-link">Tentang Kami</a>
            <a href="#cara-penggunaan" className="footer-link">Panduan</a>
          </div>

          {/* Mitra Strategis — link ke situs resmi (poin 8) */}
          <div>
            <h4>Mitra Strategis</h4>
            <a
              href="https://www.bmkg.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              BMKG
            </a>
            <a
              href="https://www.bnpb.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              BNPB
            </a>
            <a
              href="https://inarisk.bnpb.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              InaRISK
            </a>
            <a
              href="https://www.pmi.or.id"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              PMI
            </a>
          </div>

          {/* Newsletter — fungsional (poin 7) */}
          <div>
            <h4>Kontak &amp; Berlangganan</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>
              <Mail size={16} /> info@geoalert.id
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.8)' }}>
              <Phone size={16} /> 112 (Darurat)
            </div>

            {status === 'success' ? (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                background: 'rgba(46,125,50,0.2)', border: '1px solid rgba(46,125,50,0.4)',
                borderRadius: '6px', padding: '10px 12px',
                color: '#81c784', fontSize: '0.85rem', lineHeight: '1.4',
              }}>
                <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                {message}
              </div>
            ) : (
              <form style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} onSubmit={handleSubscribe}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setStatus(null); setMessage(''); }}
                    placeholder="Alamat email..."
                    disabled={status === 'loading'}
                    style={{
                      padding: '0.5rem', borderRadius: '4px', border: 'none',
                      width: '100%', fontSize: '0.9rem',
                      opacity: status === 'loading' ? 0.7 : 1,
                    }}
                    aria-label="Alamat email untuk berlangganan newsletter"
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={status === 'loading' || !email.trim()}
                    style={{
                      padding: '0.5rem 1rem', flexShrink: 0,
                      display: 'flex', alignItems: 'center', gap: '6px',
                      opacity: status === 'loading' ? 0.7 : 1,
                    }}
                    aria-label="Daftar newsletter"
                  >
                    {status === 'loading' ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                    Daftar
                  </button>
                </div>

                {status === 'error' && message && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    color: '#ef9a9a', fontSize: '0.8rem',
                  }}>
                    <AlertCircle size={13} />
                    {message}
                  </div>
                )}
              </form>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} GeoAlert Indonesia. Hak Cipta Dilindungi.</p>
          <div style={{ marginTop: '0.5rem' }}>
            {/* Link legal — menggunakan React Router (poin 8) */}
            <Link to="/kebijakan-privasi" className="footer-link" style={{ display: 'inline', margin: '0 0.5rem' }}>
              Kebijakan Privasi
            </Link>
            {' | '}
            <Link to="/syarat-ketentuan" className="footer-link" style={{ display: 'inline', margin: '0 0.5rem' }}>
              Syarat &amp; Ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
