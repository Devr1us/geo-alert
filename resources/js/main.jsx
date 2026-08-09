import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '../css/index.css';
import '../css/components.css';

// Nonaktifkan scroll restoration otomatis browser SEBELUM React mount,
// supaya Firefox/Chrome tidak sempat me-restore posisi scroll dari sesi
// sebelumnya bahkan selama jeda singkat sebelum hydration selesai.
window.history.scrollRestoration = 'manual';

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
    <BrowserRouter basename={import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, '') : ''}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
