import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="nav-brand">
          <Activity size={28} color="var(--color-alert)" />
          GeoAlert
        </Link>
        
        <div className={`nav-links ${isOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setIsOpen(false)}>Beranda</Link>
          <a href="#tentang" className="nav-link" onClick={() => setIsOpen(false)}>Tentang</a>
          <a href="#cara-penggunaan" className="nav-link" onClick={() => setIsOpen(false)}>Cara Penggunaan</a>
          <a href="#tanya-ai" className="nav-link" onClick={() => setIsOpen(false)}>Tanya AI</a>
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
