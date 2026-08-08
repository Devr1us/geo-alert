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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
