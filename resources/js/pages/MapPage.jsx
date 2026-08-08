import React, { useState, useEffect, useRef } from 'react';
import { Search, AlertTriangle, RefreshCw, Activity, Droplets, Wind, Mountain, Bot, Map as MapIcon, Info, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../css/MapPage.css';
import '../../css/LandingPage.css';
import AIChat from '../components/AIChat';
import RevealSection from '../components/RevealSection';

// Fix for default leaflet icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom pulsing icon
const createCustomIcon = (level) => {
  const colors = {
    danger: '#C0492B',
    warning: '#F57C00',
    standby: '#4A90D9',
  };
  const color = colors[level] || colors.standby;
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:20px;height:20px;">
        <div style="
          width:14px;height:14px;border-radius:50%;
          background:${color};
          position:absolute;top:3px;left:3px;
          box-shadow:0 0 0 0 ${color}88;
          animation:marker-pulse 2s infinite;
        "></div>
        <div style="
          width:20px;height:20px;border-radius:50%;
          border:2px solid ${color};
          position:absolute;top:0;left:0;
          opacity:0.5;
          animation:marker-ring 2s infinite;
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Indonesia bounds — prevents panning away
const INDONESIA_BOUNDS = L.latLngBounds(
  L.latLng(-11.5, 94.0),  // SW corner
  L.latLng(6.5, 141.0)    // NE corner
);
const INDONESIA_CENTER = [-2.5, 117.5];

// =============================================================
// Sample data — BANJIR & LONGSOR
// Catatan: Data banjir dan longsor tidak tersedia via API publik
// resmi BNPB/InaRISK tanpa autentikasi. Ditampilkan sebagai
// contoh tampilan data saja.
// =============================================================
const SAMPLE_FLOOD_LANDSLIDE = [
  {
    id: 'sample-banjir-1',
    type: 'Banjir',
    location: 'Jakarta Timur',
    lat: -6.2, lng: 106.9,
    time: '(contoh data)',
    risk: 'standby',
    magnitude: 'Ketinggian 50 cm',
    depth: '-',
    step: 'Matikan arus listrik. Evakuasi ke lantai atas. Hubungi BPBD.',
    isSample: true,
  },
  {
    id: 'sample-longsor-1',
    type: 'Longsor',
    location: 'Bogor, Jawa Barat',
    lat: -6.6, lng: 106.8,
    time: '(contoh data)',
    risk: 'warning',
    magnitude: 'Volume sedang',
    depth: '-',
    step: 'Jauhi area lereng. Evakuasi ke dataran rendah yang aman. Pantau perkembangan.',
    isSample: true,
  },
];

function SetBounds() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(INDONESIA_BOUNDS);
    map.setMinZoom(4);
  }, [map]);
  return null;
}

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Nominatim geocoding untuk search bar
async function geocodeLocation(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&countrycodes=id&format=json&limit=1&accept-language=id`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'GeoAlert/1.0 (+https://geoalert.id)' },
  });
  const results = await res.json();
  if (results.length > 0) {
    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
      displayName: results[0].display_name,
    };
  }
  return null;
}

export default function MapPage() {
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isSampleData, setIsSampleData] = useState(false);
  const [mapCenter, setMapCenter] = useState(INDONESIA_CENTER);
  const [mapZoom, setMapZoom] = useState(5);
  const [sidebarTab, setSidebarTab] = useState('map');
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  // Geocoding search state
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState(null);
  const searchDebounceRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setIsSampleData(false);

    try {
      const [resTerkini, resDirasakan] = await Promise.all([
        fetch('/api/bmkg/gempa-terkini'),
        fetch('/api/bmkg/gempa-dirasakan'),
      ]);

      if (!resTerkini.ok || !resDirasakan.ok) throw new Error('Proxy API gagal');

      const parsedTerkini = await resTerkini.json();
      const parsedDirasakan = await resDirasakan.json();

      if (parsedTerkini.error || parsedDirasakan.error) {
        throw new Error(parsedTerkini.error || parsedDirasakan.error);
      }

      const listTerkini = parsedTerkini.Infogempa?.gempa || [];
      const listDirasakan = parsedDirasakan.Infogempa?.gempa || [];

      const allGempa = [...listTerkini, ...listDirasakan];
      const uniqueGempa = Array.from(new Set(allGempa.map(g => g.DateTime)))
        .map(time => allGempa.find(g => g.DateTime === time));

      const formattedData = uniqueGempa.map((g, index) => {
        const coords = g.Coordinates.split(',');
        const lat = parseFloat(coords[0]);
        const lng = parseFloat(coords[1]);
        const mag = parseFloat(g.Magnitude);
        let risk = 'standby';
        if (mag >= 5) risk = 'warning';
        if (mag >= 6) risk = 'danger';

        return {
          id: `bmkg-${index}`,
          type: 'Gempa Bumi',
          location: g.Wilayah,
          lat: isNaN(lat) ? -2.5 : lat,
          lng: isNaN(lng) ? 117.5 : lng,
          time: `${g.Tanggal} ${g.Jam}`,
          risk,
          magnitude: g.Magnitude,
          depth: g.Kedalaman,
          step: mag >= 6
            ? 'BAHAYA: Segera berlindung! Jauhi bangunan rapuh. Jika di pesisir, evakuasi ke dataran tinggi segera!'
            : mag >= 5
            ? 'Berlindung di bawah meja kuat. Jauhi kaca dan perabotan. Waspada gempa susulan.'
            : 'Tetap tenang. Pantau informasi resmi BMKG. Tidak berpotensi tsunami.',
          isSample: false,
        };
      });

      setData([...formattedData, ...SAMPLE_FLOOD_LANDSLIDE]);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('[GeoAlert] Gagal mengambil data BMKG:', err.message);
      setError(`Gagal memuat data BMKG: ${err.message}. Menampilkan contoh tampilan data.`);
      setData([
        { id: 's1', type: 'Gempa Bumi', location: 'Selatan Jawa Barat', lat: -7.5, lng: 107.0, time: '(contoh data)', risk: 'danger', magnitude: '5.2', depth: '10 km', step: 'Berlindung di bawah meja kuat.', isSample: true },
        { id: 's4', type: 'Gempa Bumi', location: 'Palu, Sulawesi Tengah', lat: -0.9, lng: 119.87, time: '(contoh data)', risk: 'standby', magnitude: '4.1', depth: '30 km', step: 'Tetap tenang.', isSample: true },
        ...SAMPLE_FLOOD_LANDSLIDE,
      ]);
      setIsSampleData(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Geocoding saat user berhenti mengetik (debounce 600ms)
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setGeocodeResult(null);

    if (search.trim().length < 3) return;

    const localMatch = data.find(item =>
      item.location.toLowerCase().includes(search.toLowerCase())
    );
    if (localMatch) return;

    searchDebounceRef.current = setTimeout(async () => {
      setGeocodeLoading(true);
      try {
        const result = await geocodeLocation(search.trim());
        setGeocodeResult(result);
      } catch (e) {
        // Geocoding fail silent fallback
      } finally {
        setGeocodeLoading(false);
      }
    }, 600);
  }, [search, data]);

  const handleGeocodePan = () => {
    if (!geocodeResult) return;
    setMapCenter([geocodeResult.lat, geocodeResult.lng]);
    setMapZoom(11);
    setGeocodeResult(null);
    setSearch('');
  };

  const getRiskLabel = (risk) => {
    if (risk === 'danger') return <span className="badge badge-danger">BAHAYA</span>;
    if (risk === 'warning') return <span className="badge badge-warning">WASPADA</span>;
    return <span className="badge badge-standby">SIAGA</span>;
  };

  const getIcon = (type) => {
    if (type.includes('Gempa')) return <Activity size={16} />;
    if (type.includes('Banjir')) return <Droplets size={16} />;
    if (type.includes('Cuaca')) return <Wind size={16} />;
    if (type.includes('Longsor')) return <Mountain size={16} />;
    return <AlertTriangle size={16} />;
  };

  const filteredData = data.filter(item => {
    const matchesFilter = activeFilter === 'Semua' || item.type.includes(activeFilter);
    const matchesSearch = item.location.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const hasSampleItems = filteredData.some(item => item.isSample);

  return (
    <>
      <div className="map-page-wrapper">
        {/* Injected marker animation styles */}
        <style>{`
          @keyframes marker-pulse {
            0%   { transform: scale(1); opacity: 1; }
            70%  { transform: scale(1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes marker-ring {
            0%   { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(2.5); opacity: 0; }
          }
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>

        <div className="map-page-container">
          {/* Main Map Card */}
          <div className="map-main-card">
            {/* Floating Toolbar Overlay */}
            <div className="map-toolbar-floating">
              {/* Search bar dengan geocoding */}
              <div style={{ position: 'relative', flexGrow: 1, maxWidth: '400px' }}>
                <div className="search-bar-pill">
                  <Search size={18} color="var(--color-primary)" />
                  <input
                    type="text"
                    placeholder="Cari lokasi atau wilayah..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    aria-label="Cari lokasi"
                  />
                  {geocodeLoading && (
                    <RefreshCw size={14} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                  )}
                </div>
                {/* Geocoding result suggestion */}
                {geocodeResult && !geocodeLoading && (
                  <button
                    onClick={handleGeocodePan}
                    style={{
                      position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 1001,
                      background: 'white', border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)', padding: '10px 14px',
                      textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem',
                      boxShadow: 'var(--shadow-md)',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}
                  >
                    <Search size={14} color="var(--color-primary)" />
                    <span>
                      <strong>Pergi ke:</strong> {geocodeResult.displayName.split(',').slice(0, 3).join(', ')}
                    </span>
                  </button>
                )}
              </div>

              {/* Filter chips pills */}
              <div className="filter-chips-pill">
                {['Semua', 'Gempa', 'Banjir', 'Cuaca Ekstrem', 'Longsor'].map(chip => (
                  <button
                    key={chip}
                    className={`chip-pill ${activeFilter === chip ? 'active' : ''}`}
                    onClick={() => setActiveFilter(chip)}
                    aria-pressed={activeFilter === chip}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Floating Notice Toast */}
            {!noticeDismissed && (hasSampleItems || error) && (
              <div className="map-notice-toast">
                <Info size={16} color="var(--color-standby)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  {error ? (
                    <span>{error}</span>
                  ) : (
                    <span>
                      Data banjir &amp; longsor: <strong>contoh tampilan data</strong> — API resmi BNPB belum publik.
                    </span>
                  )}
                </div>
                <button
                  className="map-notice-toast-close"
                  onClick={() => setNoticeDismissed(true)}
                  title="Tutup pemberitahuan"
                  aria-label="Tutup"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Leaflet Map Container */}
            <div className="map-container">
              <MapContainer
                center={INDONESIA_CENTER}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
                maxBounds={INDONESIA_BOUNDS}
                maxBoundsViscosity={1.0}
                minZoom={4}
              >
                <SetBounds />
                <ChangeView center={mapCenter} zoom={mapZoom} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {!loading && filteredData.map(item => (
                  <Marker
                    key={item.id}
                    position={[item.lat, item.lng]}
                    icon={createCustomIcon(item.risk)}
                  >
                    <Popup maxWidth={300}>
                      <div style={{ minWidth: '240px', fontFamily: 'Inter, sans-serif' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1rem' }}>
                            {getIcon(item.type)} {item.type}
                          </strong>
                          {getRiskLabel(item.risk)}
                        </div>
                        <div style={{ fontSize: '0.875rem', marginBottom: '6px' }}>
                          <strong>Lokasi:</strong> {item.location}
                        </div>
                        <div style={{ fontFamily: 'Fira Code, monospace', fontSize: '0.8rem', color: '#777', marginBottom: '8px' }}>
                          {item.time}
                        </div>
                        {item.isSample && (
                          <div style={{
                            background: 'rgba(74,144,217,0.1)', borderRadius: '4px',
                            padding: '4px 8px', fontSize: '0.72rem', color: '#4A90D9',
                            marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px',
                          }}>
                            <Info size={11} /> contoh tampilan data
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                          <div style={{ background: '#f7f2ea', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', color: '#777', textTransform: 'uppercase' }}>Magnitudo</div>
                            <div style={{ fontFamily: 'Fira Code, monospace', fontWeight: '700', fontSize: '1.1rem', color: '#0E2A5C' }}>{item.magnitude}</div>
                          </div>
                          <div style={{ background: '#f7f2ea', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', color: '#777', textTransform: 'uppercase' }}>Kedalaman</div>
                            <div style={{ fontFamily: 'Fira Code, monospace', fontWeight: '700', fontSize: '1.1rem', color: '#0E2A5C' }}>{item.depth}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.85rem', padding: '10px', background: 'rgba(192,73,43,0.08)', borderRadius: '8px', borderLeft: '3px solid #C0492B', lineHeight: '1.5' }}>
                          <strong>⚠️ Rekomendasi:</strong><br />{item.step}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {loading && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 1000,
                  background: 'rgba(247,242,234,0.85)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '16px', borderRadius: 'var(--radius-xl)'
                }}>
                  <RefreshCw size={32} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Memuat data BMKG…</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Floating Card Panel */}
          <div className="map-sidebar-card">
            {/* Segmented Control Header */}
            <div className="sidebar-segmented-header">
              <div className="segmented-control">
                <button
                  className={`segmented-tab ${sidebarTab === 'map' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('map')}
                >
                  <MapIcon size={15} /> Peta &amp; Legenda
                </button>
                <button
                  className={`segmented-tab ${sidebarTab === 'ai' ? 'active' : ''}`}
                  onClick={() => {
                    setSidebarTab('ai');
                    document.getElementById('tanya-ai')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Bot size={15} /> Tanya AI ↓
                </button>
              </div>
            </div>

            {/* Sidebar Legend Card */}
            <div className="sidebar-legend-card">
              <div className="sidebar-section-label">Legenda Risiko</div>
              <div className="legend-chips-group">
                <div className="legend-chip danger">
                  <span className="legend-chip-dot"></span> Bahaya Tinggi
                </div>
                <div className="legend-chip warning">
                  <span className="legend-chip-dot"></span> Waspada
                </div>
                <div className="legend-chip standby">
                  <span className="legend-chip-dot"></span> Siaga
                </div>
              </div>

              <div className="sidebar-status-bar">
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Diperbarui: <span className="mono">{lastUpdate.toLocaleTimeString('id-ID')}</span>
                </span>
                <button
                  onClick={fetchData}
                  style={{
                    display: 'flex', gap: '4px', alignItems: 'center',
                    padding: '4px 10px', borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--color-border)', background: 'white',
                    cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-primary)',
                    fontWeight: '600', boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <RefreshCw size={12} /> Segarkan
                </button>
              </div>
            </div>

            {/* Log Peringatan Container */}
            <div className="sidebar-log-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="sidebar-section-label">Log Peringatan Aktif</span>
                <span style={{
                  fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-primary)',
                  background: 'rgba(14,42,92,0.06)', padding: '2px 8px', borderRadius: 'var(--radius-full)'
                }}>
                  {filteredData.length} Bencana
                </span>
              </div>

              {loading
                ? [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '84px', borderRadius: 'var(--radius-lg)' }} />)
                : filteredData.length > 0
                  ? filteredData.map(item => (
                    <div
                      key={item.id}
                      className="alert-log-card"
                      onClick={() => { setMapCenter([item.lat, item.lng]); setMapZoom(9); }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Lihat ${item.type} di ${item.location}`}
                    >
                      <div className="alert-log-card-header">
                        <div className="alert-type-title">
                          {getIcon(item.type)} {item.type}
                          {item.isSample && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-standby)', fontWeight: '500', background: 'rgba(74,144,217,0.1)', padding: '1px 6px', borderRadius: 'var(--radius-full)' }}>
                              contoh data
                            </span>
                          )}
                        </div>
                        {getRiskLabel(item.risk)}
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '4px', color: 'var(--color-text-main)' }}>
                        {item.location}
                      </div>
                      <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="mono" style={{ color: 'var(--color-text-muted)' }}>{item.time}</span>
                        {item.magnitude && item.magnitude !== '-' && !item.isSample && (
                          <span className="mono" style={{ color: 'var(--color-primary)', fontWeight: '700', background: 'rgba(14,42,92,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                            M {item.magnitude}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                  : <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0' }}>Tidak ada data sesuai filter.</p>
              }
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: TANYA ASISTEN AI */}
      <RevealSection id="tanya-ai" animation="glow-in" className="tanya-ai-section">
        <div className="container" style={{ maxWidth: '1140px' }}>
          <div style={{ borderRadius: '24px', overflow: 'hidden', height: '680px', boxShadow: 'var(--shadow-lg)' }}>
            <AIChat isFloating={false} />
          </div>
        </div>
      </RevealSection>
    </>
  );
}
