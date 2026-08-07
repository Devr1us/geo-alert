import React, { useState, useEffect } from 'react';
import { Search, Map as MapIcon, AlertTriangle, RefreshCw, Activity, Droplets, Wind, Mountain } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../css/MapPage.css';

// Fix for default leaflet icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom pulsing icon
const createCustomIcon = (level) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pulse ${level}"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const INDONESIA_CENTER = [-0.7893, 113.9213];

// Sample data fallback
const sampleData = [
  { id: 1, type: 'Gempa Bumi', location: 'Selatan Jawa Barat', lat: -7.5, lng: 107.0, time: '10:45 WIB', risk: 'danger', desc: 'Magnitudo 5.2, Kedalaman 10km', step: 'Berlindung di bawah meja kuat.' },
  { id: 2, type: 'Banjir', location: 'Jakarta Timur', lat: -6.2, lng: 106.9, time: 'Kemarin, 15:20', risk: 'standby', desc: 'Ketinggian air 50cm', step: 'Matikan arus listrik.' },
  { id: 3, type: 'Cuaca Ekstrem', location: 'Surabaya', lat: -7.25, lng: 112.75, time: '1 Jam yang lalu', risk: 'warning', desc: 'Hujan lebat disertai angin kencang', step: 'Hindari pohon besar.' },
];

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

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setIsSampleData(false);
    
    try {
      // Fetch both endpoints via proxy
      const urlTerkini = `https://api.allorigins.win/get?url=${encodeURIComponent('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json')}`;
      const urlDirasakan = `https://api.allorigins.win/get?url=${encodeURIComponent('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json')}`;
      
      const [resTerkini, resDirasakan] = await Promise.all([
        fetch(urlTerkini),
        fetch(urlDirasakan)
      ]);
      
      if (!resTerkini.ok || !resDirasakan.ok) throw new Error('API Gagal');
      
      const jsonTerkini = await resTerkini.json();
      const jsonDirasakan = await resDirasakan.json();
      
      const parsedTerkini = JSON.parse(jsonTerkini.contents);
      const parsedDirasakan = JSON.parse(jsonDirasakan.contents);
      
      const gempaListTerkini = parsedTerkini.Infogempa.gempa || [];
      const gempaListDirasakan = parsedDirasakan.Infogempa.gempa || [];
      
      // Combine and filter out duplicates based on Date+Time
      const allGempa = [...gempaListTerkini, ...gempaListDirasakan];
      const uniqueGempa = Array.from(new Set(allGempa.map(g => g.DateTime))).map(time => {
        return allGempa.find(g => g.DateTime === time);
      });
      
      const formattedData = uniqueGempa.map((g, index) => {
        const coords = g.Coordinates.split(',');
        const mag = parseFloat(g.Magnitude);
        let risk = 'standby';
        if (mag > 5) risk = 'warning';
        if (mag > 6) risk = 'danger';

        return {
          id: `bmkg-${index}`,
          type: 'Gempa Bumi',
          location: g.Wilayah,
          lat: parseFloat(coords[0]),
          lng: parseFloat(coords[1]),
          time: `${g.Tanggal} ${g.Jam}`,
          risk: risk,
          desc: `Magnitudo ${g.Magnitude}, Kedalaman ${g.Kedalaman}`,
          step: mag > 5 ? 'Berlindung di tempat aman, jauhi kaca.' : 'Tetap tenang dan pantau informasi.',
        };
      });

      setData(formattedData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
      // Fallback to sample data
      setError('Gagal mengambil data real-time BMKG. Menampilkan data contoh.');
      setData(sampleData);
      setIsSampleData(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto refresh every 5 mins
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
      {/* Main Map Area */}
      <div className="map-main">
        <div className="map-header">
          <div className="search-bar">
            <Search size={20} color="var(--color-text-muted)" />
            <input 
              type="text" 
              placeholder="Cari kota atau provinsi..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="filter-chips">
            {['Semua', 'Gempa', 'Banjir', 'Cuaca Ekstrem', 'Longsor'].map(chip => (
              <button 
                key={chip} 
                className={`chip ${activeFilter === chip ? 'active' : ''}`}
                onClick={() => setActiveFilter(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, backgroundColor: 'var(--color-alert)', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.875rem', boxShadow: 'var(--shadow-md)' }}>
            {error}
          </div>
        )}

        <div className="map-container">
          <MapContainer center={mapCenter} zoom={5} style={{ height: '100%', width: '100%' }}>
            <ChangeView center={mapCenter} zoom={5} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {!loading && filteredData.map(item => (
              <Marker 
                key={item.id} 
                position={[item.lat, item.lng]}
                icon={createCustomIcon(item.risk)}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {getIcon(item.type)} {item.type}
                      </strong>
                      {getRiskLabel(item.risk)}
                    </div>
                    <div style={{ fontSize: '0.875rem', marginBottom: '4px' }}><strong>Lokasi:</strong> {item.location}</div>
                    <div className="mono" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>{item.time}</div>
                    <div style={{ fontSize: '0.875rem', marginBottom: '8px', padding: '8px', backgroundColor: 'var(--color-bg)', borderRadius: '4px' }}>
                      {item.desc}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-status-warning)' }}>
                      <strong>Rekomendasi:</strong><br/>{item.step}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Sidebar */}
      <div className="map-sidebar">
        <div className="sidebar-header">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Status Wilayah</h3>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: 'var(--color-alert)' }}></div> Bahaya Tinggi
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: 'var(--color-status-warning)' }}></div> Waspada
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: 'var(--color-standby)' }}></div> Siaga
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Diperbarui: {lastUpdate.toLocaleTimeString()} 
              {isSampleData && <span style={{ fontStyle: 'italic', marginLeft: '4px' }}>(Contoh tampilan data)</span>}
            </span>
            <button onClick={fetchData} className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', gap: '4px', backgroundColor: 'transparent', border: '1px solid var(--color-border)' }}>
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Segarkan
            </button>
          </div>
        </div>

        <div className="sidebar-content">
          <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Log Peringatan Aktif</h4>
          
          {loading ? (
            <div>
              {[1, 2, 3].map(i => (
                <div key={i} className="alert-log-item skeleton" style={{ height: '80px', border: 'none' }}></div>
              ))}
            </div>
          ) : filteredData.length > 0 ? (
            filteredData.map(item => (
              <div key={item.id} className="alert-log-item" onClick={() => setMapCenter([item.lat, item.lng])}>
                <div className="alert-log-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                    {getIcon(item.type)} {item.type}
                  </div>
                  {getRiskLabel(item.risk)}
                </div>
                <div style={{ fontSize: '0.875rem', marginBottom: '4px' }}>{item.location}</div>
                <div className="alert-log-time mono">{item.time}</div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)' }}>
              Tidak ada data yang sesuai filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
