import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MessageSquare, Globe, CheckCircle, AlertCircle, Loader } from 'lucide-react';

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
    <footer className="footer-custom" id="kontak">
      <div className="container">
        <div className="footer-custom-grid">
          {/* Column 1: Brand Info & Social Icons */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-logo-wrap">
              <img src="/logo-geoalert.svg" alt="GeoAlert" className="footer-logo-img" />
              <span className="footer-brand-title">GeoAlert</span>
            </Link>
            
            <p className="footer-brand-desc">
              Kami hadir untuk memberikan informasi deteksi dini bencana real-time dan panduan mitigasi tepercaya bagi seluruh masyarakat Indonesia.
            </p>

            {/* Circular Social / Contact Action Buttons */}
            <div className="footer-social-row">
              <a
                href="mailto:info@geoalert.id"
                className="social-circle-btn"
                title="Email Kami (info@geoalert.id)"
                aria-label="Email Kami"
              >
                <Mail size={18} />
              </a>

              <a
                href="tel:112"
                className="social-circle-btn"
                title="Telepon Darurat 112"
                aria-label="Panggil Darurat 112"
              >
                <Phone size={18} />
              </a>

              <a
                href="https://wa.me/628111111111"
                target="_blank"
                rel="noopener noreferrer"
                className="social-circle-btn"
                title="Layanan WhatsApp CS"
                aria-label="WhatsApp CS"
              >
                <MessageSquare size={18} />
              </a>

              <a
                href="https://www.bmkg.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="social-circle-btn"
                title="Portal Otoritas Resmi"
                aria-label="Portal Otoritas Resmi"
              >
                <Globe size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Eksplorasi Links */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Eksplorasi</h4>
            <ul className="footer-links-list">
              <li><Link to="/" className="footer-link-item">Beranda</Link></li>
              <li><Link to="/peta" className="footer-link-item">Peta Bencana</Link></li>
              <li><a href="#tentang" className="footer-link-item">Tentang Kami</a></li>
              <li><a href="#cara-penggunaan" className="footer-link-item">Cara Penggunaan</a></li>
              <li><a href="#faq" className="footer-link-item">Pertanyaan Umum (FAQ)</a></li>
            </ul>
          </div>

          {/* Column 3: Informasi Bencana & Mitigasi */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Mitigasi Bencana</h4>
            <ul className="footer-links-list">
              <li><Link to="/peta" className="footer-link-item">Gempa Bumi</Link></li>
              <li><Link to="/peta" className="footer-link-item">Banjir Bandang</Link></li>
              <li><Link to="/peta" className="footer-link-item">Tanah Longsor</Link></li>
              <li><Link to="/peta" className="footer-link-item">Cuaca Ekstrem</Link></li>
              <li><a href="https://inarisk.bnpb.go.id" target="_blank" rel="noopener noreferrer" className="footer-link-item">Portal InaRISK BNPB</a></li>
            </ul>
          </div>

          {/* Column 4: Newsletter Berlangganan */}
          <div className="footer-newsletter-col">
            <h4 className="footer-col-title">Peringatan Dini Email</h4>
            <p className="footer-newsletter-sub">
              Daftarkan email Anda untuk menerima informasi lansiran siaga gempa &amp; buletin cuaca mingguan.
            </p>

            {status === 'success' ? (
              <div className="newsletter-success-box">
                <CheckCircle size={16} />
                <span>{message}</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="newsletter-form">
                <div className="newsletter-input-group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setStatus(null); setMessage(''); }}
                    placeholder="Masukkan alamat email..."
                    disabled={status === 'loading'}
                    className="newsletter-input"
                    aria-label="Alamat email untuk berlangganan"
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading' || !email.trim()}
                    className="newsletter-btn"
                    aria-label="Daftar newsletter"
                  >
                    {status === 'loading' ? <Loader size={14} className="spin-loader" /> : 'Daftar'}
                  </button>
                </div>

                {status === 'error' && message && (
                  <div className="newsletter-error-msg">
                    <AlertCircle size={13} />
                    <span>{message}</span>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-custom-bottom">
          <p className="footer-developer-tag">
            Developed by <span className="dev-team-name">GeoAlert Tech Team</span>
          </p>
          <p className="footer-copyright-text">
            &copy; {new Date().getFullYear()} GeoAlert Indonesia. HAK CIPTA DILINDUNGI.
          </p>

          <div className="footer-legal-links">
            <Link to="/kebijakan-privasi" className="footer-legal-item">
              Kebijakan Privasi
            </Link>
            <span className="legal-sep">•</span>
            <Link to="/syarat-ketentuan" className="footer-legal-item">
              Syarat &amp; Ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
