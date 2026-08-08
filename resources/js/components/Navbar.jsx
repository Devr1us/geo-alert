import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
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
          <Link to="/peta#tanya-ai" className="nav-link" onClick={() => setIsOpen(false)}>Tanya AI</Link>
          <Link
            to="/peta"
            className="nav-link"
            onClick={() => {
              setIsOpen(false);
              window.scrollTo(0, 0);
              if (document.documentElement) document.documentElement.scrollTop = 0;
            }}
          >
            Peta Bencana
          </Link>
          <a href="#kontak" className="nav-link" onClick={() => setIsOpen(false)}>Kontak</a>
          
          <Link
            to="/peta"
            className="btn btn-primary"
            style={{ marginLeft: '1rem' }}
            onClick={() => {
              setIsOpen(false);
              window.scrollTo(0, 0);
              if (document.documentElement) document.documentElement.scrollTop = 0;
            }}
          >
            Pantau Sekarang
          </Link>
        </div>

        <button className="nav-toggle" onClick={toggleMenu} aria-label="Toggle menu">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
}
