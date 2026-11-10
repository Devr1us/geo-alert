import React, { useState } from 'react';
import { Search, MapPin, X, Loader, CheckCircle, Navigation } from 'lucide-react';

// Daftar kota populer Indonesia dengan koordinat resmi
const POPULAR_CITIES = [
  { name: 'Padang, Sumatera Barat', lat: -0.9471, lng: 100.4172 },
  { name: 'Cianjur, Jawa Barat', lat: -6.8222, lng: 107.1394 },
  { name: 'D.I. Yogyakarta', lat: -7.7956, lng: 110.3695 },
  { name: 'Banda Aceh, Aceh', lat: 5.5483, lng: 95.3238 },
  { name: 'Palu, Sulawesi Tengah', lat: -0.9003, lng: 119.8779 },
  { name: 'Bandung, Jawa Barat', lat: -6.9175, lng: 107.6191 },
  { name: 'Jakarta Selatan, DKI Jakarta', lat: -6.2615, lng: 106.8106 },
  { name: 'Malang, Jawa Timur', lat: -7.9666, lng: 112.6326 },
  { name: 'Mataram (Lombok), NTB', lat: -8.5833, lng: 116.1167 },
  { name: 'Jayapura, Papua', lat: -2.5337, lng: 140.7181 },
];

export default function CitySelectModal({ isOpen, onClose, onSelectCity }) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;

    setSearching(true);
    setErrorMsg(null);
    try {
      const encoded = encodeURIComponent(`${q}, Indonesia`);
      const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&countrycodes=id&format=json&limit=5&accept-language=id`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'GeoAlert/1.0 (+https://geoalert.id)' },
      });
      const data = await res.json();
      if (data && data.length > 0) {
        setSearchResults(data.map(item => ({
          name: item.display_name.split(',').slice(0, 3).join(','),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        })));
      } else {
        setErrorMsg('Kota tidak ditemukan. Coba ketik nama kabupaten atau kota terdekat.');
      }
    } catch {
      setErrorMsg('Gagal mencari kota. Silakan pilih salah satu kota populer di bawah.');
    } finally {
      setSearching(false);
    }
  };

  const handlePick = (city) => {
    onSelectCity(city);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(14, 42, 92, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fade-in-up 0.3s ease',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="city-modal-title"
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          maxWidth: '560px',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 80px rgba(14, 42, 92, 0.4)',
          border: '1px solid rgba(14, 42, 92, 0.15)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              background: '#0E2A5C', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <MapPin size={20} color="#FFFFFF" />
            </div>
            <div>
              <h3 id="city-modal-title" style={{ margin: 0, fontSize: '1.15rem', color: '#0E2A5C', fontWeight: '800' }}>
                Pilih Wilayah Anda
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                Lokasi diproses di peramban Anda dan tidak disimpan di server
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#64748B', padding: '6px', borderRadius: '50%'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input Box */}
        <div style={{ padding: '1.25rem 1.75rem 0.75rem' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 16px', background: '#F1F5F9', borderRadius: '14px',
              border: '1px solid #CBD5E1'
            }}>
              <Search size={18} color="#64748B" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cari nama kota / kabupaten Anda..."
                style={{
                  border: 'none', background: 'transparent', outline: 'none',
                  width: '100%', fontSize: '0.925rem', color: '#0E2A5C'
                }}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={searching || query.trim().length < 2}
              style={{
                padding: '0 18px', borderRadius: '14px', background: '#0E2A5C',
                color: '#FFFFFF', border: 'none', fontWeight: '700', fontSize: '0.85rem',
                cursor: query.trim().length >= 2 ? 'pointer' : 'default',
                opacity: query.trim().length >= 2 ? 1 : 0.6
              }}
            >
              {searching ? <Loader size={16} className="spin-loader" /> : 'Cari'}
            </button>
          </form>

          {errorMsg && (
            <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#DC2626' }}>
              {errorMsg}
            </p>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div style={{ marginTop: '12px', border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', background: '#F8FAFC', fontSize: '0.75rem', fontWeight: '700', color: '#64748B' }}>
                Hasil Pencarian:
              </div>
              {searchResults.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePick(res)}
                  style={{
                    width: '100%', padding: '10px 14px', textAlign: 'left',
                    background: '#FFFFFF', border: 'none', borderTop: '1px solid #F1F5F9',
                    display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                    fontSize: '0.875rem', color: '#0E2A5C'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                  onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                >
                  <Navigation size={14} color="#0284C7" />
                  <span>{res.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Popular Cities Quick Select */}
        <div style={{ padding: '0.75rem 1.75rem 1.5rem', maxHeight: '280px', overflowY: 'auto' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>
            Atau Pilih Cepat Kota Terpantau:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {POPULAR_CITIES.map((c, i) => (
              <button
                key={i}
                onClick={() => handlePick(c)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 12px', borderRadius: '12px',
                  background: '#F8FAFC', border: '1px solid #E2E8F0',
                  color: '#0E2A5C', fontSize: '0.825rem', fontWeight: '600',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#EFF6FF';
                  e.currentTarget.style.borderColor = '#93C5FD';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#F8FAFC';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                <MapPin size={14} color="#0284C7" style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

