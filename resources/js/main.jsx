import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '../css/index.css';
import '../css/components.css';
import { ROUTER_BASENAME } from './config/baseUrl';

// Progressive enhancement flag: sembunyikan elemen animasi HANYA jika JavaScript siap
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('js-ready', 'js-enabled');
  if (!document.documentElement.hasAttribute('data-scroll-dir')) {
    document.documentElement.setAttribute('data-scroll-dir', 'down');
  }
}

// Nonaktifkan scroll restoration otomatis browser SEBELUM React mount,
// dan pastikan setiap refresh web selalu kembali ke Beranda paling atas (scrollY = 0).
if (typeof window !== 'undefined') {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  // Jika URL membawa hash (misalnya #kontak) saat direfresh, segera bersihkan dan reset ke atas
  if (window.location.hash) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  window.scrollTo(0, 0);
  if (document.documentElement) document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
}

// Hapus Service Worker lama di lingkungan pengujian lokal (127.0.0.1 / localhost)
// untuk mencegah masalah white screen akibat cache Service Worker yang kadaluarsa saat rebuild asset.
if ('serviceWorker' in navigator && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={ROUTER_BASENAME}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
