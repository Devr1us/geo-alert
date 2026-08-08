import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import MapPage from './pages/MapPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// ============================================================
// ScrollController
// Berjalan setiap kali pathname atau hash berubah, termasuk
// saat initial mount (effect pertama kali dipanggil React).
//
// Logika:
//   - URL punya hash (#tentang, #cara-penggunaan, dll)
//     → scroll ke elemen dengan id tersebut, dengan sedikit
//       jeda (requestAnimationFrame) agar DOM sudah siap saat
//       halaman pertama kali dirender.
//   - URL tidak punya hash
//     → paksa scroll ke paling atas (0, 0).
//
// Kombinasi dengan window.history.scrollRestoration = 'manual'
// di main.jsx memastikan browser tidak pernah mengintervensi
// posisi scroll ini dengan restore otomatis dari sesi sebelumnya.
// ============================================================
function ScrollController() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Ada hash — scroll ke elemen target setelah DOM siap.
      // requestAnimationFrame memastikan kita menunggu satu frame
      // paint sehingga elemen sudah ada di DOM saat diakses.
      const scrollToHash = () => {
        const id = hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Elemen belum ada (lazy render) — coba sekali lagi setelah
          // 100ms, cocok untuk section yang dirender secara kondisional.
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
      // Tidak ada hash — paksa scroll ke paling atas (0, 0)
      // Dipanggil berulang karena halaman berat (MapPage + Leaflet) bisa
      // menggeser scroll setelah React commit render pertama.
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
  }, [pathname, hash]); // Ulang setiap kali pathname ATAU hash berubah

  return null; // Komponen ini tidak merender apapun ke DOM
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
