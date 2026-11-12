import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, MapPin, Sparkles } from 'lucide-react';
import { ASSET_BASE } from '../config/baseUrl';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHoveredOrFocused, setIsHoveredOrFocused] = useState(false);
  const scrollStopTimerRef = useRef(null);
  const tickingRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      setIsScrolled(currentScrollY > 50);

      // 1. Jika di posisi paling atas (scrollY <= 10), navbar selalu tampil
      if (currentScrollY <= 10) {
        if (scrollStopTimerRef.current) {
          clearTimeout(scrollStopTimerRef.current);
          scrollStopTimerRef.current = null;
        }
        setIsVisible(true);
        return;
      }

      // 2. Jika pengguna mulai scroll (arah apa pun), navbar langsung disembunyikan
      if (!tickingRef.current) {
        window.requestAnimationFrame(() => {
          setIsVisible(false);
          tickingRef.current = false;
        });
        tickingRef.current = true;
      }

      // 3. Debounce: tampilkan navbar kembali HANYA setelah scroll berhenti (200ms tanpa event scroll)
      if (scrollStopTimerRef.current) {
        clearTimeout(scrollStopTimerRef.current);
      }
      scrollStopTimerRef.current = setTimeout(() => {
        setIsVisible(true);
      }, 200);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial scroll
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollStopTimerRef.current) {
        clearTimeout(scrollStopTimerRef.current);
      }
    };
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
    if (location.pathname === '/peta') {
      if (location.hash) {
        navigate('/peta', { replace: true });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } else {
      navigate('/peta');
      forceScrollTop();
    }
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

  const isDarkHero = false;
  const isHidden = !isVisible && !isOpen && !isHoveredOrFocused;
  const navClass = `navbar ${isScrolled ? 'navbar-scrolled' : ''} ${isHidden ? 'navbar-hidden' : ''}`;

  return (
    <nav
      className={navClass}
      onMouseEnter={() => setIsHoveredOrFocused(true)}
      onMouseLeave={() => setIsHoveredOrFocused(false)}
      onFocus={() => setIsHoveredOrFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsHoveredOrFocused(false);
        }
      }}
    >
      <div className="container nav-pill-container">
        {/* Mobile Spacer (for 3-way balance: Spacer | Logo Center | Toggle Right) */}
        <div className="nav-mobile-spacer" aria-hidden="true" />

        {/* Mobile Header Brand (Centered on mobile view) */}
        <Link to="/" className="nav-brand-mobile" aria-label="GeoAlert" onClick={() => setIsOpen(false)}>
          <img src={`${ASSET_BASE}logo-geoalert.svg`} alt="GeoAlert" className="nav-logo" />
          <span className="nav-brand-text">GeoAlert</span>
        </Link>

        {/* Desktop Navbar Layout: Left Links | Center Logo | Right Links */}
        <div className={`nav-links-wrapper ${isOpen ? 'active' : ''}`}>
          {/* Left Group Links */}
          <div className="nav-group nav-group-left">
            <Link to="/" className="nav-link" onClick={() => setIsOpen(false)}>Beranda</Link>
            <a href="/peta" className="nav-link" onClick={goToMap}>Peta Bencana</a>
            <a href="/kisah" className="nav-link" onClick={() => setIsOpen(false)}>Kisah</a>
            <a href="#mitigasi" className="nav-link" onClick={scrollToSection('mitigasi')}>Mitigasi</a>
          </div>

          {/* Center Brand Logo (Desktop - Only Logo Icon, NO text) */}
          <Link to="/" className="nav-brand-center" aria-label="GeoAlert Beranda">
            <svg viewBox="0 0 100 100" className="nav-logo-center-svg" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="50" cy="50" r="40" />
              <circle cx="50" cy="50" r="24" />
              <line x1="50" y1="6" x2="50" y2="94" />
              <line x1="6" y1="50" x2="94" y2="50" />
              <line x1="50" y1="50" x2="75" y2="25" />
              <path d="M50 30 C43 30 38 35 38 42 C38 52 50 64 50 64 C50 64 62 52 62 42 C62 35 57 30 50 30 Z" fill="currentColor" stroke="none" />
              <circle cx="50" cy="41" r="4" fill={isDarkHero ? 'rgba(255, 255, 255, 0.4)' : 'var(--bg-cream)'} />
            </svg>
          </Link>

          {/* Right Group Links */}
          <div className="nav-group nav-group-right">
            <a href="#cara-penggunaan" className="nav-link" onClick={scrollToSection('cara-penggunaan')}>Tutorial</a>
            <a href="#tentang" className="nav-link" onClick={scrollToSection('tentang')}>Tentang Kami</a>
            <a href="#kontak" className="nav-link" onClick={scrollToSection('kontak')}>Kontak</a>
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
