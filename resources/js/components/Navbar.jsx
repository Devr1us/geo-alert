import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, MapPin, Sparkles } from 'lucide-react';

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

  const forceScrollTop = () => {
    const go = () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    go();
    setTimeout(go, 0);
    setTimeout(go, 50);
    setTimeout(go, 150);
    setTimeout(go, 300);
  };

  const goToMap = (e) => {
    e.preventDefault();
    setIsOpen(false);
    navigate('/peta', { replace: location.pathname === '/peta' });
    forceScrollTop();
  };

  const navClass = `navbar ${!isVisible && !isOpen ? 'navbar-hidden' : ''}`;

  return (
    <nav className={navClass}>
      <div className="container nav-pill-container">
        {/* Mobile Header Brand (Visible on small screens) */}
        <Link to="/" className="nav-brand-mobile" aria-label="GeoAlert">
          <img src="/logo-geoalert.svg" alt="GeoAlert" className="nav-logo" />
          <span className="nav-brand-text">GeoAlert</span>
        </Link>

        {/* Desktop Navbar Layout: Left Links | Center Logo | Right Links */}
        <div className={`nav-links-wrapper ${isOpen ? 'active' : ''}`}>
          {/* Left Group Links */}
          <div className="nav-group nav-group-left">
            <Link to="/" className="nav-link" onClick={() => setIsOpen(false)}>Beranda</Link>
            <a href="/peta" className="nav-link" onClick={goToMap}>Peta Bencana</a>
            <Link to="/#tentang" className="nav-link" onClick={() => setIsOpen(false)}>Tentang Kami</Link>
          </div>

          {/* Center Brand Logo (Desktop) */}
          <Link to="/" className="nav-brand-center" aria-label="GeoAlert">
            <img src="/logo-geoalert.svg" alt="GeoAlert" className="nav-logo-center" />
            <span className="nav-brand-text">GeoAlert</span>
          </Link>

          {/* Right Group Links */}
          <div className="nav-group nav-group-right">
            <Link to="/#cara-penggunaan" className="nav-link" onClick={() => setIsOpen(false)}>Cara Penggunaan</Link>
            <Link to="/#mitigasi" className="nav-link" onClick={() => setIsOpen(false)}>Mitigasi</Link>
            <a href="#kontak" className="nav-link" onClick={() => setIsOpen(false)}>Kontak</a>
            <a
              href="/peta"
              className="btn btn-primary nav-btn-cta"
              onClick={goToMap}
            >
              Pantau Sekarang
            </a>
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <button className="nav-toggle" onClick={toggleMenu} aria-label="Toggle menu">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
}
