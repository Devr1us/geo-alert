import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer" id="kontak">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="nav-brand" style={{ color: 'white', marginBottom: '1rem' }}>
              <Activity size={28} color="var(--color-alert)" />
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
          
          <div>
            <h4>Mitra Strategis</h4>
            <a href="#" className="footer-link">BMKG</a>
            <a href="#" className="footer-link">BNPB</a>
            <a href="#" className="footer-link">InaRISK</a>
            <a href="#" className="footer-link">PMI</a>
          </div>
          
          <div>
            <h4>Kontak & Berlangganan</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>
              <Mail size={16} /> info@geoalert.id
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.8)' }}>
              <Phone size={16} /> 112 (Darurat)
            </div>
            <form style={{ display: 'flex', gap: '0.5rem' }} onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Alamat email..." 
                style={{ padding: '0.5rem', borderRadius: '4px', border: 'none', width: '100%' }}
              />
              <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Daftar</button>
            </form>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} GeoAlert Indonesia. Hak Cipta Dilindungi.</p>
          <div style={{ marginTop: '0.5rem' }}>
            <a href="#" className="footer-link" style={{ display: 'inline', margin: '0 0.5rem' }}>Kebijakan Privasi</a> | 
            <a href="#" className="footer-link" style={{ display: 'inline', margin: '0 0.5rem' }}>Syarat & Ketentuan</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
