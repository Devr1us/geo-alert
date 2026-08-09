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

  useEffect(() => {
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
