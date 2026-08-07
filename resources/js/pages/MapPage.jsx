import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, RefreshCw, Activity, Droplets, Wind, Mountain, Bot, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../css/MapPage.css';
import AIChat from '../components/AIChat';

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

// Sample data fallback
const sampleData = [
  { id: 's1', type: 'Gempa Bumi', location: 'Selatan Jawa Barat', lat: -7.5, lng: 107.0, time: '10:45 WIB', risk: 'danger', magnitude: '5.2', depth: '10 km', step: 'Berlindung di bawah meja kuat. Jauhi jendela dan perabotan berat. Waspada tsunami jika di pesisir.' },
  { id: 's2', type: 'Banjir', location: 'Jakarta Timur', lat: -6.2, lng: 106.9, time: '15:20 WIB', risk: 'standby', magnitude: 'Ketinggian 50 cm', depth: '-', step: 'Matikan arus listrik. Evakuasi ke lantai atas. Hubungi BPBD.' },
  { id: 's3', type: 'Cuaca Ekstrem', location: 'Surabaya', lat: -7.25, lng: 112.75, time: '12:00 WIB', risk: 'warning', magnitude: 'Angin 80 km/jam', depth: '-', step: 'Hindari pohon besar dan tiang listrik. Segera masuk bangunan kokoh.' },
  { id: 's4', type: 'Gempa Bumi', location: 'Palu, Sulawesi Tengah', lat: -0.9, lng: 119.87, time: '08:10 WIB', risk: 'standby', magnitude: '4.1', depth: '30 km', step: 'Tetap tenang. Pantau informasi BMKG. Gempa kecil ini tidak berpotensi tsunami.' },
  { id: 's5', type: 'Longsor', location: 'Bogor, Jawa Barat', lat: -6.6, lng: 106.8, time: 'Kemarin', risk: 'warning', magnitude: 'Volume sedang', depth: '-', step: 'Jauhi area lereng. Evakuasi ke dataran rendah yang aman. Pantau perkembangan.' },
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

export default function MapPage() {
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isSampleData, setIsSampleData] = useState(false);
  const [mapCenter, setMapCenter] = useState(INDONESIA_CENTER);
  const [sidebarTab, setSidebarTab] = useState('map'); // 'map' or 'ai'

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setIsSampleData(false);

    try {
      const urlTerkini = `https://api.allorigins.win/get?url=${encodeURIComponent('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json')}`;
      const urlDirasakan = `https://api.allorigins.win/get?url=${encodeURIComponent('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json')}`;

      const [resTerkini, resDirasakan] = await Promise.all([fetch(urlTerkini), fetch(urlDirasakan)]);
      if (!resTerkini.ok || !resDirasakan.ok) throw new Error('API Gagal');

      const jsonTerkini = await resTerkini.json();
      const jsonDirasakan = await resDirasakan.json();
      const parsedTerkini = JSON.parse(jsonTerkini.contents);
      const parsedDirasakan = JSON.parse(jsonDirasakan.contents);

      const listTerkini = parsedTerkini.Infogempa.gempa || [];
      const listDirasakan = parsedDirasakan.Infogempa.gempa || [];

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
        };
      });

      setData(formattedData);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Gagal mengambil data real-time BMKG. Menampilkan contoh tampilan data.');
      setData(sampleData);
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

  return (
    <div className="map-page-container">
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
      `}</style>

      {/* Main Map Area */}
      <div className="map-main">
        {/* Map header */}
        <div className="map-header">
          <div className="search-bar">
            <Search size={20} color="var(--color-text-muted)" />
            <input
              type="text"
              placeholder="Cari kota atau provinsi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Cari lokasi"
            />
          </div>

          <div className="filter-chips">
            {['Semua', 'Gempa', 'Banjir', 'Cuaca Ekstrem', 'Longsor'].map(chip => (
              <button
                key={chip}
                className={`chip ${activeFilter === chip ? 'active' : ''}`}
                onClick={() => setActiveFilter(chip)}
                aria-pressed={activeFilter === chip}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{
            background: 'rgba(192,73,43,0.1)', borderLeft: '4px solid var(--color-alert)',
            padding: '10px 16px', fontSize: '0.875rem',
            color: 'var(--color-alert)', display: 'flex', gap: '8px', alignItems: 'center'
          }}>
            <AlertTriangle size={16} />
            {error}
            {isSampleData && <em style={{ color: 'var(--color-text-muted)' }}>(contoh tampilan data)</em>}
          </div>
        )}

        {/* Leaflet Map */}
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
            <ChangeView center={mapCenter} zoom={5} />
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
              gap: '16px',
            }}>
              <RefreshCw size={32} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Memuat data BMKG…</p>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar — Map Info + AI Chat */}
      <div className="map-sidebar">
        {/* Tab switcher */}
        <div style={{
          display: 'flex', borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-white)', flexShrink: 0,
        }}>
          <button
            onClick={() => setSidebarTab('map')}
            style={{
              flex: 1, padding: '14px', border: 'none', cursor: 'pointer', fontWeight: '600',
              fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              background: sidebarTab === 'map' ? 'var(--color-bg)' : 'var(--color-white)',
              color: sidebarTab === 'map' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: sidebarTab === 'map' ? '3px solid var(--color-primary)' : '3px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <MapIcon size={16} /> Peta &amp; Legenda
          </button>
          <button
            onClick={() => setSidebarTab('ai')}
            style={{
              flex: 1, padding: '14px', border: 'none', cursor: 'pointer', fontWeight: '600',
              fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              background: sidebarTab === 'ai' ? 'var(--color-bg)' : 'var(--color-white)',
              color: sidebarTab === 'ai' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: sidebarTab === 'ai' ? '3px solid var(--color-primary)' : '3px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <Bot size={16} /> Tanya AI
          </button>
        </div>

        {/* Tab: Map Info */}
        {sidebarTab === 'map' && (
          <>
            <div className="sidebar-header">
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Legenda Risiko</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div className="legend-item"><div className="legend-color" style={{ backgroundColor: 'var(--color-alert)' }}></div> Bahaya Tinggi</div>
                <div className="legend-item"><div className="legend-color" style={{ backgroundColor: 'var(--color-status-warning)' }}></div> Waspada</div>
                <div className="legend-item"><div className="legend-color" style={{ backgroundColor: 'var(--color-standby)' }}></div> Siaga</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span className="mono">{lastUpdate.toLocaleTimeString('id-ID')}</span>
                  {isSampleData && <em> (contoh tampilan data)</em>}
                </span>
                <button
                  onClick={fetchData}
                  style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-primary)' }}
                >
                  <RefreshCw size={12} /> Segarkan
                </button>
              </div>
            </div>

            <div className="sidebar-content">
              <h4 style={{ marginBottom: '12px', fontSize: '0.95rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Log Peringatan Aktif</h4>

              {loading
                ? [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '80px', marginBottom: '12px', borderRadius: 'var(--radius-md)' }} />)
                : filteredData.length > 0
                  ? filteredData.map(item => (
                    <div key={item.id} className="alert-log-item" onClick={() => setMapCenter([item.lat, item.lng])} role="button" tabIndex={0} aria-label={`Lihat ${item.type} di ${item.location}`}>
                      <div className="alert-log-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.9rem' }}>
                          {getIcon(item.type)} {item.type}
                        </div>
                        {getRiskLabel(item.risk)}
                      </div>
                      <div style={{ fontSize: '0.875rem', marginBottom: '4px', color: 'var(--color-text-main)' }}>{item.location}</div>
                      <div style={{ fontSize: '0.8rem' }}>
                        <span className="mono" style={{ color: 'var(--color-text-muted)' }}>{item.time}</span>
                        {item.magnitude && item.magnitude !== '-' && (
                          <span className="mono" style={{ marginLeft: '8px', color: 'var(--color-primary)', fontWeight: '600' }}>M {item.magnitude}</span>
                        )}
                      </div>
                    </div>
                  ))
                  : <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0' }}>Tidak ada data sesuai filter.</p>
              }
            </div>
          </>
        )}

        {/* Tab: AI Chat */}
        {sidebarTab === 'ai' && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <AIChat isFloating={true} />
          </div>
        )}
      </div>
    </div>
  );
}
