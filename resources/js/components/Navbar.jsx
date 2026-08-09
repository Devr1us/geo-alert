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

  const scrollToSection = (id) => (e) => {
    e.preventDefault();
    setIsOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { replace: false });
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
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
            <a href="#mitigasi" className="nav-link" onClick={scrollToSection('mitigasi')}>Mitigasi</a>
          </div>

          {/* Center Brand Logo (Desktop - Only Logo Icon, NO text) */}
          <Link to="/" className="nav-brand-center" aria-label="GeoAlert Beranda">
            <svg viewBox="0 0 100 100" className="nav-logo-center-svg" fill="none" stroke="#0E2A5C" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="50" cy="50" r="40"/>
              <circle cx="50" cy="50" r="24"/>
              <line x1="50" y1="6" x2="50" y2="94"/>
              <line x1="6" y1="50" x2="94" y2="50"/>
              <line x1="50" y1="50" x2="75" y2="25"/>
              <path d="M50 30 C43 30 38 35 38 42 C38 52 50 64 50 64 C50 64 62 52 62 42 C62 35 57 30 50 30 Z" fill="#0E2A5C" stroke="none"/>
              <circle cx="50" cy="41" r="4" fill="#F7F2EA"/>
            </svg>
          </Link>

          {/* Right Group Links */}
          <div className="nav-group nav-group-right">
            <a href="#cara-penggunaan" className="nav-link" onClick={scrollToSection('cara-penggunaan')}>Tutorial</a>
            <a href="#tentang" className="nav-link" onClick={scrollToSection('tentang')}>Tentang Kami</a>
            <a href="#kontak" className="nav-link" onClick={scrollToSection('kontak')}>Contact</a>
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
