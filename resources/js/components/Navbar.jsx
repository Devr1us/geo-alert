import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    let lastScrollY = window.scrollY || document.documentElement.scrollTop || 0;

    const handleScroll = (e) => {
      let currentScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

      if (e && e.target && e.target !== document && e.target !== window && typeof e.target.scrollTop === 'number') {
        currentScrollY = e.target.scrollTop;
      }

      if (currentScrollY <= 20) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY + 5) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY - 5) {
        setIsVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);

  // Scroll ke atas secara paksa — dipanggil berulang agar menang dari render async MapPage
  const forceScrollTop = () => {
    const go = () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    go();                         // langsung
    setTimeout(go, 0);            // setelah microtask queue kosong
    setTimeout(go, 50);           // setelah React commit render pertama
    setTimeout(go, 150);          // setelah Leaflet & asset berat selesai mount
    setTimeout(go, 300);          // safety net terakhir
  };

  // Navigasi ke halaman peta dan paksa scroll ke atas
  const goToMap = (e) => {
    e.preventDefault();
    setIsOpen(false);
    // Jika sudah di /peta, gunakan replace agar hash lama (misal #tanya-ai) ikut terhapus
    navigate('/peta', { replace: location.pathname === '/peta' });
    forceScrollTop();
  };

  // Navigasi ke section Tanya AI di halaman peta
  const goToAIChat = (e) => {
    e.preventDefault();
    setIsOpen(false);
    if (location.pathname === '/peta') {
      // Sudah di /peta — langsung scroll ke section
      const el = document.getElementById('tanya-ai');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Navigasi ke /peta#tanya-ai — ScrollController akan handle scroll-nya
      navigate('/peta#tanya-ai');
    }
  };

  const navClass = `navbar ${!isVisible && !isOpen ? 'navbar-hidden' : ''}`;

  return (
    <nav className={navClass}>
      <div className="container">
        <Link to="/" className="nav-brand" aria-label="GeoAlert">
          <img src="/logo-geoalert.svg" alt="GeoAlert" className="nav-logo" />
        </Link>
        
        <div className={`nav-links ${isOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setIsOpen(false)}>Beranda</Link>
          <Link to="/#tentang" className="nav-link" onClick={() => setIsOpen(false)}>Tentang</Link>
          <Link to="/#cara-penggunaan" className="nav-link" onClick={() => setIsOpen(false)}>Cara Penggunaan</Link>
          {/* Peta Bencana — navigasi ke /peta dan scroll ke atas */}
          <a href="/peta" className="nav-link" onClick={goToMap}>Peta Bencana</a>
          {/* Tanya AI — scroll ke section #tanya-ai di /peta */}
          <a href="/peta#tanya-ai" className="nav-link" onClick={goToAIChat}>Tanya AI</a>
          <a href="#kontak" className="nav-link" onClick={() => setIsOpen(false)}>Kontak</a>
          
          <a
            href="/peta"
            className="btn btn-primary"
            style={{ marginLeft: '1rem' }}
            onClick={goToMap}
          >
            Pantau Sekarang
          </a>
        </div>

        <button className="nav-toggle" onClick={toggleMenu} aria-label="Toggle menu">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
}
