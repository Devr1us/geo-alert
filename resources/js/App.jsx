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
      // Tidak ada hash — selalu mulai dari atas.
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]); // Ulang setiap kali pathname ATAU hash berubah

  return null; // Komponen ini tidak merender apapun ke DOM
}

function App() {
  return (
    <div className="app-container">
      <ScrollController />
      <Navbar />
      <main style={{ paddingTop: 'var(--navbar-height)' }}>
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
