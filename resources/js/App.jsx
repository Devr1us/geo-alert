import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import MapPage from './pages/MapPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function ScrollController() {
  const { pathname, hash } = useLocation();
  const isFirstLoadRef = React.useRef(true);

  // Global scroll direction tracker: set data-scroll-dir="down" | "up" on documentElement
  useEffect(() => {
    let lastScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
          if (currentScrollY > lastScrollY + 2) {
            document.documentElement.setAttribute('data-scroll-dir', 'down');
          } else if (currentScrollY < lastScrollY - 2) {
            document.documentElement.setAttribute('data-scroll-dir', 'up');
          }
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Saat refresh web / pertama kali load: selalu ke Beranda paling atas (top: 0)
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      const forceTop = () => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      };
      forceTop();
      setTimeout(forceTop, 30);
      setTimeout(forceTop, 100);
      return;
    }

    if (hash) {
      const scrollToHash = () => {
        const id = hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          setTimeout(() => {
            const elRetry = document.getElementById(id);
            if (elRetry) {
              elRetry.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }
      };

      requestAnimationFrame(scrollToHash);
    } else {
      const top = () => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      };
      top();
      setTimeout(top, 50);
      setTimeout(top, 150);
      setTimeout(top, 300);
    }
  }, [pathname, hash]);

  return null;
}

function App() {
  return (
    <div className="app-container">
      <ScrollController />
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/peta" element={<MapPage />} />
          <Route path="/kebijakan-privasi" element={<PrivacyPage />} />
          <Route path="/syarat-ketentuan" element={<TermsPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
