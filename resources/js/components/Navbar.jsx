import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    if (!isOpen) {
      setIsHidden(false);
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    let lastScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    let ticking = false;

    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;

      // Scrolled state: aktif jika scrollY > 20px
      setIsScrolled(currentScrollY > 20);

      // Di dekat/paling atas halaman (scrollY <= 15), navbar selalu dimunculkan
      if (currentScrollY <= 15) {
        setIsHidden(false);
      } else if (!isOpen) {
        // Hitung selisih scroll untuk menentukan arah
        const diff = currentScrollY - lastScrollY;

        if (diff > 5 && currentScrollY > 60) {
          // Scroll ke BAWAH -> sembunyikan navbar
          setIsHidden(true);
        } else if (diff < -5) {
          // Scroll ke ATAS -> munculkan navbar kembali
          setIsHidden(false);
        }
      }

      lastScrollY = currentScrollY > 0 ? currentScrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('scroll', onScroll);
    };
  }, [isOpen]);

  const navClass = `navbar ${isScrolled ? 'navbar-scrolled' : ''} ${isHidden && !isOpen ? 'navbar-hidden' : ''}`;

  return (
    <nav className={navClass}>
      <div className="container">
        <Link to="/" className="nav-brand">
          <Activity size={28} color="var(--color-alert)" />
          GeoAlert
        </Link>
        
        <div className={`nav-links ${isOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setIsOpen(false)}>Beranda</Link>
          <Link to="/#tentang" className="nav-link" onClick={() => setIsOpen(false)}>Tentang</Link>
          <Link to="/#cara-penggunaan" className="nav-link" onClick={() => setIsOpen(false)}>Cara Penggunaan</Link>
          <Link to="/peta#tanya-ai" className="nav-link" onClick={() => setIsOpen(false)}>Tanya AI</Link>
          <Link to="/peta" className="nav-link" onClick={() => setIsOpen(false)}>Peta Bencana</Link>
          <a href="#kontak" className="nav-link" onClick={() => setIsOpen(false)}>Kontak</a>
          
          <Link to="/peta" className="btn btn-primary" style={{ marginLeft: '1rem' }}>
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
