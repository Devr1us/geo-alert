/**
 * GeoAlert — Peta Bencana JavaScript
 * Handles: Leaflet map, BMKG API fetch, markers, filters,
 * sidebar, bottom sheet, auto-refresh, search, error states
 */
(function () {
  'use strict';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // ============================================
  // CONFIG
  // ============================================
  const API_GEMPA_TERKINI = 'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json';
  const API_GEMPA_DIRASAKAN = 'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json';
  const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const INDONESIA_CENTER = [-2.5, 118];
  const INDONESIA_ZOOM = 5;
  // Sample data for non-earthquake disasters (realistic Indonesian data)
  const SAMPLE_DISASTERS = [
    {
      type: 'banjir',
      label: 'Banjir',
      location: 'Kab. Bekasi, Jawa Barat',
      coords: [-6.25, 107.15],
      time: '06 Agu 2026, 08:30 WIB',
      severity: 'Tinggi — ketinggian air 1.5m',
      risk: 'danger',
      action: 'Segera mengungsi ke tempat yang lebih tinggi. Hindari berjalan atau berkendara melewati genangan air. Hubungi posko terdekat.'
    },
    {
      type: 'cuaca',
      label: 'Cuaca Ekstrem',
      location: 'Kota Semarang, Jawa Tengah',
      coords: [-6.97, 110.42],
      time: '06 Agu 2026, 10:15 WIB',
      severity: 'Angin kencang 60 km/jam',
      risk: 'warning',
      action: 'Hindari area terbuka dan pohon besar. Pastikan atap dan bangunan dalam kondisi aman. Ikuti arahan BMKG.'
    },
    {
      type: 'longsor',
      label: 'Longsor',
      location: 'Kab. Garut, Jawa Barat',
      coords: [-7.22, 107.9],
      time: '05 Agu 2026, 14:00 WIB',
      severity: 'Sedang — jalan tertutup material',
      risk: 'warning',
      action: 'Jauhi lereng dan tebing. Perhatikan retakan tanah. Segera evakuasi jika berada di daerah rawan longsor.'
    },
    {
      type: 'banjir',
      label: 'Banjir',
      location: 'Kota Makassar, Sulawesi Selatan',
      coords: [-5.13, 119.42],
      time: '05 Agu 2026, 06:45 WIB',
      severity: 'Sedang — ketinggian air 80cm',
      risk: 'warning',
      action: 'Pantau ketinggian air secara berkala. Siapkan tas darurat. Hubungi BPBD setempat jika air terus naik.'
    },
    {
      type: 'cuaca',
      label: 'Cuaca Ekstrem',
      location: 'Kab. Banyuwangi, Jawa Timur',
      coords: [-8.22, 114.35],
      time: '04 Agu 2026, 18:20 WIB',
      severity: 'Hujan lebat disertai petir',
      risk: 'siaga',
      action: 'Berteduh di dalam bangunan kokoh. Jangan berteduh di bawah pohon. Cabut peralatan elektronik dari stopkontak.'
    },
    {
      type: 'longsor',
      label: 'Longsor',
      location: 'Kab. Banjarnegara, Jawa Tengah',
      coords: [-7.39, 109.69],
      time: '04 Agu 2026, 09:00 WIB',
      severity: 'Rendah — potensi susulan',
      risk: 'siaga',
      action: 'Waspada saat dan setelah hujan deras. Perhatikan tanda-tanda awal longsor seperti suara gemuruh dan air keruh.'
    }
  ];
  // ============================================
  // STATE
  // ============================================
  let map;
  let allMarkers = [];
  let allDisasters = [];
  let activeFilter = 'semua';
  let refreshTimer;
  let isLoading = true;
  let hasError = false;
  // ============================================
  // INIT MAP
  // ============================================
  function initMap() {
    map = L.map('map', {
      center: INDONESIA_CENTER,
      zoom: INDONESIA_ZOOM,
      zoomControl: true,
      minZoom: 4,
      maxZoom: 15,
      attributionControl: false
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);
    // Add attribution control to bottom-left
    L.control.attribution({ position: 'bottomleft' }).addTo(map);
    // Move zoom control to bottom-right on desktop
    map.zoomControl.setPosition('bottomright');
  }
  // ============================================
  // CREATE PULSING MARKER
  // ============================================
  function createPulseMarker(lat, lng, riskLevel) {
    const className = `pulse-marker pulse-marker--${riskLevel}`;
    const icon = L.divIcon({
      className: className,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      html: `
        <span class="pulse-marker__core" aria-hidden="true"></span>
        <span class="pulse-marker__ring" aria-hidden="true"></span>
      `
    });
    return L.marker([lat, lng], { icon });
  }
  // ============================================
  // PARSE BMKG DATA
  // ============================================
  function parseBMKGData(data, source) {
    const earthquakes = [];
    const gempaArray = data?.Infogempa?.gempa || [];
    gempaArray.forEach(g => {
      const coords = g.Coordinates ? g.Coordinates.split(',').map(Number) : null;
      if (!coords || coords.length < 2) return;
      const magnitude = parseFloat(g.Magnitude) || 0;
      let risk = 'siaga';
      if (magnitude >= 6.0) risk = 'danger';
      else if (magnitude >= 5.0) risk = 'warning';
      earthquakes.push({
        type: 'gempa',
        label: 'Gempa Bumi',
        location: g.Wilayah || 'Tidak diketahui',
        coords: [coords[0], coords[1]],
        time: `${g.Tanggal}, ${g.Jam}`,
        magnitude: g.Magnitude,
        depth: g.Kedalaman,
        lintang: g.Lintang,
        bujur: g.Bujur,
        potensi: g.Potensi,
        severity: `M${g.Magnitude} — ${g.Kedalaman}`,
        risk: risk,
        source: source,
        action: magnitude >= 6.0
          ? 'Segera berlindung di bawah meja atau furnitur kokoh. Jauhi jendela dan benda berat yang dapat jatuh. Setelah guncangan berhenti, segera keluar ke area terbuka.'
          : 'Tetap tenang dan waspada. Perhatikan instruksi dari BMKG. Jauhi bangunan yang terlihat rusak. Siapkan tas darurat.',
        isSample: false
      });
    });
    return earthquakes;
  }
  // ============================================
  // FETCH DATA
  // ============================================
  async function fetchDisasterData() {
    showLoading();
    hasError = false;
    try {
      const [terkiniRes, dirasakanRes] = await Promise.allSettled([
        fetch(API_GEMPA_TERKINI).then(r => {
          if (!r.ok) throw new Error('Network error');
          return r.json();
        }),
        fetch(API_GEMPA_DIRASAKAN).then(r => {
          if (!r.ok) throw new Error('Network error');
          return r.json();
        })
      ]);
      let earthquakes = [];
      if (terkiniRes.status === 'fulfilled') {
        earthquakes = [...earthquakes, ...parseBMKGData(terkiniRes.value, 'terkini')];
      }
      if (dirasakanRes.status === 'fulfilled') {
        const dirasakan = parseBMKGData(dirasakanRes.value, 'dirasakan');
        // Deduplicate by coordinates
        dirasakan.forEach(d => {
          const exists = earthquakes.some(e =>
            e.coords[0] === d.coords[0] && e.coords[1] === d.coords[1]
          );
          if (!exists) earthquakes.push(d);
        });
      }
      if (earthquakes.length === 0 && terkiniRes.status === 'rejected' && dirasakanRes.status === 'rejected') {
        throw new Error('Semua API gagal dimuat');
      }
      // Combine real + sample data
      const sampleWithFlag = SAMPLE_DISASTERS.map(d => ({ ...d, isSample: true }));
      allDisasters = [...earthquakes, ...sampleWithFlag];
      renderDisasters();
      updateRefreshTime();
      hideLoading();
    } catch (error) {
      console.error('Error fetching disaster data:', error);
      hasError = true;
      hideLoading();
      showError();
    }
  }
  // ============================================
  // RENDER MARKERS & SIDEBAR
  // ============================================
  function renderDisasters() {
    clearMarkers();
    const filtered = activeFilter === 'semua'
      ? allDisasters
      : allDisasters.filter(d => d.type === activeFilter);
    const sidebarLog = document.getElementById('alert-log');
    if (sidebarLog) {
      sidebarLog.innerHTML = '';
    }
    // Also update bottom sheet log
    const bottomLog = document.getElementById('bottom-sheet-log');
    if (bottomLog) {
      bottomLog.innerHTML = '';
    }
    filtered.forEach((disaster, index) => {
      // Create marker
      const marker = createPulseMarker(disaster.coords[0], disaster.coords[1], disaster.risk);
      // Popup content
      const popupHTML = buildPopupHTML(disaster);
      marker.bindPopup(popupHTML, { maxWidth: 300, closeButton: true });
      marker.addTo(map);
      allMarkers.push(marker);
      // Sidebar entry
      const logHTML = buildLogItemHTML(disaster, index);
      if (sidebarLog) {
        sidebarLog.insertAdjacentHTML('beforeend', logHTML);
      }
      if (bottomLog) {
        bottomLog.insertAdjacentHTML('beforeend', logHTML);
      }
    });
    // Attach click handlers to log items
    document.querySelectorAll('.alert-log__item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-index'), 10);
        if (filtered[idx]) {
          map.setView(filtered[idx].coords, 10, { animate: !prefersReducedMotion });
          allMarkers[idx]?.openPopup();
        }
      });
    });
    updateFilterCounts();
  }
  function buildPopupHTML(d) {
    const typeClass = `popup-detail__type--${d.type}`;
    const sampleNote = d.isSample ? '<p style="font-size:0.625rem;color:#B5AFA3;font-style:italic;margin-top:0.5rem;">contoh tampilan data</p>' : '';
    let detailGrid = '';
    if (d.type === 'gempa') {
      detailGrid = `
        <div class="popup-detail__grid">
          <div class="popup-detail__item">
            <span class="popup-detail__label">Magnitudo</span>
            <span class="popup-detail__value">${d.magnitude || '-'}</span>
          </div>
          <div class="popup-detail__item">
            <span class="popup-detail__label">Kedalaman</span>
            <span class="popup-detail__value">${d.depth || '-'}</span>
          </div>
          <div class="popup-detail__item">
            <span class="popup-detail__label">Lintang</span>
            <span class="popup-detail__value">${d.lintang || '-'}</span>
          </div>
          <div class="popup-detail__item">
            <span class="popup-detail__label">Bujur</span>
            <span class="popup-detail__value">${d.bujur || '-'}</span>
          </div>
        </div>
        ${d.potensi ? `<p style="font-size:0.75rem;color:#C0492B;font-weight:600;margin-bottom:0.5rem;">${d.potensi}</p>` : ''}
      `;
    } else {
      detailGrid = `
        <div class="popup-detail__grid">
          <div class="popup-detail__item" style="grid-column:1/-1">
            <span class="popup-detail__label">Tingkat Keparahan</span>
            <span class="popup-detail__value">${d.severity || '-'}</span>
          </div>
        </div>
      `;
    }
    return `
      <div class="popup-detail">
        <div class="popup-detail__header">
          <span class="popup-detail__type ${typeClass}">${d.label}</span>
        </div>
        <div class="popup-detail__title">${d.location}</div>
        <p style="font-family:var(--font-mono);font-size:0.75rem;color:#8A8478;margin-bottom:0.75rem;">${d.time}</p>
        ${detailGrid}
        <div class="popup-detail__action">
          <div class="popup-detail__action-title">Langkah yang disarankan</div>
          <div class="popup-detail__action-text">${d.action}</div>
        </div>
        ${sampleNote}
      </div>
    `;
  }
  function buildLogItemHTML(d, index) {
    const typeClass = `alert-log__item-type--${d.risk}`;
    const sampleTag = d.isSample ? ' <span style="font-size:0.5625rem;color:#B5AFA3;font-style:italic;">(contoh)</span>' : '';
    return `
      <div class="alert-log__item" data-index="${index}" role="button" tabindex="0" aria-label="Lihat detail ${d.label} di ${d.location}">
        <div class="alert-log__item-header">
          <span class="alert-log__item-type ${typeClass}">${d.label}${sampleTag}</span>
          <span class="alert-log__item-time">${d.time.split(',')[0] || d.time}</span>
        </div>
        <div class="alert-log__item-location">${d.location}</div>
        <div class="alert-log__item-detail">${d.severity || ''}</div>
      </div>
    `;
  }
  function clearMarkers() {
    allMarkers.forEach(m => m.remove());
    allMarkers = [];
  }
  // ============================================
  // FILTER CHIPS
  // ============================================
  function initFilters() {
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeFilter = chip.getAttribute('data-filter');
        renderDisasters();
      });
    });
  }
  function updateFilterCounts() {
    const counts = {
      semua: allDisasters.length,
      gempa: allDisasters.filter(d => d.type === 'gempa').length,
      banjir: allDisasters.filter(d => d.type === 'banjir').length,
      cuaca: allDisasters.filter(d => d.type === 'cuaca').length,
      longsor: allDisasters.filter(d => d.type === 'longsor').length,
    };
    document.querySelectorAll('.filter-chip').forEach(chip => {
      const filter = chip.getAttribute('data-filter');
      const countEl = chip.querySelector('.filter-chip__count');
      if (countEl && counts[filter] !== undefined) {
        countEl.textContent = counts[filter];
      }
    });
  }
  // ============================================
  // SEARCH
  // ============================================
  function initSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length < 2) {
          renderDisasters();
          return;
        }
        clearMarkers();
        const sidebarLog = document.getElementById('alert-log');
        const bottomLog = document.getElementById('bottom-sheet-log');
        if (sidebarLog) sidebarLog.innerHTML = '';
        if (bottomLog) bottomLog.innerHTML = '';
        const filtered = allDisasters.filter(d =>
          d.location.toLowerCase().includes(query)
        );
        filtered.forEach((d, idx) => {
          const marker = createPulseMarker(d.coords[0], d.coords[1], d.risk);
          marker.bindPopup(buildPopupHTML(d), { maxWidth: 300 });
          marker.addTo(map);
          allMarkers.push(marker);
          const logHTML = buildLogItemHTML(d, idx);
          if (sidebarLog) sidebarLog.insertAdjacentHTML('beforeend', logHTML);
          if (bottomLog) bottomLog.insertAdjacentHTML('beforeend', logHTML);
        });
        if (filtered.length > 0) {
          const group = L.featureGroup(allMarkers);
          map.fitBounds(group.getBounds().pad(0.3), { animate: !prefersReducedMotion });
        }
      }, 300);
    });
  }
  // ============================================
  // LOADING / ERROR STATES
  // ============================================
  function showLoading() {
    const sidebar = document.getElementById('alert-log');
    if (sidebar) {
      sidebar.innerHTML = `
        <div style="padding:1rem 1.25rem;">
          <div class="skeleton skeleton-block"></div>
          <div class="skeleton skeleton-block"></div>
          <div class="skeleton skeleton-block"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text skeleton-text--short"></div>
        </div>
      `;
    }
  }
  function hideLoading() {
    isLoading = false;
  }
  function showError() {
    const sidebar = document.getElementById('alert-log');
    if (sidebar) {
      sidebar.innerHTML = `
        <div class="peta-error">
          <svg class="peta-error__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div class="peta-error__title">Gagal Memuat Data</div>
          <div class="peta-error__desc">Tidak dapat terhubung ke server BMKG. Periksa koneksi internet Anda dan coba lagi.</div>
          <button class="peta-error__btn" onclick="location.reload()" aria-label="Muat ulang halaman">Coba Lagi</button>
        </div>
      `;
    }
  }
  // ============================================
  // AUTO-REFRESH
  // ============================================
  function updateRefreshTime() {
    const el = document.getElementById('refresh-time');
    if (el) {
      const now = new Date();
      el.textContent = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
  function startAutoRefresh() {
    refreshTimer = setInterval(() => {
      fetchDisasterData();
    }, REFRESH_INTERVAL);
  }
  // ============================================
  // MOBILE BOTTOM SHEET
  // ============================================
  function initBottomSheet() {
    const toggle = document.getElementById('bottom-sheet-toggle');
    const sheet = document.getElementById('bottom-sheet');
    const overlay = document.getElementById('bottom-sheet-overlay');
    if (!toggle || !sheet) return;
    toggle.addEventListener('click', () => {
      const isActive = sheet.classList.toggle('active');
      if (overlay) overlay.classList.toggle('active', isActive);
      toggle.setAttribute('aria-expanded', isActive);
    });
    if (overlay) {
      overlay.addEventListener('click', () => {
        sheet.classList.remove('active');
        overlay.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      });
    }
  }
  // ============================================
  // INIT
  // ============================================
  document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initFilters();
    initSearch();
    initBottomSheet();
    fetchDisasterData();
    startAutoRefresh();
  });
})();
