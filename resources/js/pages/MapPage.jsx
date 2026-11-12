import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, AlertOctagon, ShieldAlert, RefreshCw, Activity, Droplets, Wind, Mountain, Waves, Flame, Bot, Map as MapIcon, Info, X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../css/MapPage.css';
import '../../css/LandingPage.css';
import AIChat from '../components/AIChat';
import MitigationModal from '../components/MitigationModal';
import { BMKG_TERKINI_URL, BMKG_DIRASAKAN_URL } from '../config/bmkgApi';
import { formatLocation } from '../utils/locationFormatter';
import { evaluateRisk, hasTsunamiThreat } from '../utils/riskEvaluator';
import { REGION_BOUNDS, getRegionBySlug, isCoordinateInRegion } from '../data/regionBounds';

// Fix for default leaflet icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom pulsing icon for earthquakes & generic points
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

// Create flame marker icon for Karhutla hotspot clusters
const createFlameMarkerIcon = (level, pointCount = 1) => {
  const colors = {
    danger: '#C0492B',
    warning: '#F57C00',
    standby: '#4A90D9',
  };
  const color = colors[level] || '#F57C00';
  const isDanger = level === 'danger';
  const countBadge = pointCount > 1 ? (pointCount > 99 ? '99+' : pointCount) : null;

  return L.divIcon({
    className: 'karhutla-flame-divicon',
    html: `
      <div style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
        ${isDanger ? `
          <div style="
            position:absolute;inset:-2px;border-radius:50%;
            background:${color}33;
            animation:karhutla-flame-pulse 1.8s infinite;
          "></div>
        ` : ''}
        <div style="
          width:28px;height:28px;border-radius:50%;
          background:${color};
          border:2px solid #ffffff;
          box-shadow:0 3px 8px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
          position:relative;z-index:2;
        ">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
          </svg>
        </div>
        ${countBadge ? `
          <div style="
            position:absolute;top:-4px;right:-4px;
            background:#0E2A5C;color:#ffffff;
            font-family:'Fira Code', monospace;font-size:10px;font-weight:700;
            padding:1px 5px;border-radius:10px;border:1.5px solid #ffffff;
            z-index:3;line-height:1.2;
          ">${countBadge}</div>
        ` : ''}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
};

// Create tsunami marker icon (waves symbol in blue)
const createTsunamiMarkerIcon = (level) => {
  const colors = {
    danger: '#C0492B',
    warning: '#F57C00',
    standby: '#0284C7',
  };
  const color = colors[level] || '#0284C7';
  return L.divIcon({
    className: 'tsunami-marker-divicon',
    html: `
      <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
        <div style="
          position:absolute;inset:-2px;border-radius:50%;
          background:${color}33;
          animation:marker-pulse 1.8s infinite;
        "></div>
        <div style="
          width:26px;height:26px;border-radius:50%;
          background:${color};
          border:2px solid #ffffff;
          box-shadow:0 3px 8px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
          position:relative;z-index:2;
        ">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
            <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
            <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Indonesia bounds — limits panning and sets initial view
const INDONESIA_BOUNDS = L.latLngBounds(
  L.latLng(-13.0, 93.0),  // SW corner (mencakup seluruh perairan barat & selatan)
  L.latLng(8.5, 143.0)    // NE corner (mencakup seluruh Sabang s/d Merauke & pulau terluar)
);
const INDONESIA_CENTER = [-2.5, 117.5];

// =============================================================
// Sample data — SIMULASI BENCANA MULTI-BAHAYA
// Catatan: Data banjir, longsor, dan erupsi gunung api belum
// tersedia melalui API publik tanpa autentikasi, ditampilkan
// sebagai contoh data edukatif terstruktur dengan metrik relevan.
// =============================================================
const SAMPLE_DISASTERS = [
  {
    id: 'sample-banjir-1',
    type: 'Banjir',
    location: 'Jakarta Timur',
    lat: -6.2, lng: 106.9,
    time: '(contoh data)',
    risk: 'standby',
    magnitude: '50 cm',
    depth: 'TMA Siaga 3',
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
    magnitude: 'Volume Sedang',
    depth: 'Tanah Labil',
    step: 'Jauhi area lereng. Evakuasi lari tegak lurus dari luncuran. Pantau perkembangan.',
    isSample: true,
  },
  {
    id: 'sample-tsunami-1',
    type: 'Tsunami',
    location: 'Pesisir Pangandaran, Jawa Barat',
    lat: -7.7011, lng: 108.4947,
    time: '(contoh simulasi)',
    risk: 'danger',
    magnitude: 'Tinggi ~3 m',
    depth: 'Laut Dangkal',
    step: 'Aturan 20-20-20: Gempa terasa 20 detik, lari dalam 20 menit ke ketinggian >20m dpl.',
    isSample: true,
  },
  {
    id: 'sample-gunungapi-1',
    type: 'Gunung Api',
    location: 'Gunung Merapi, Sleman, D.I. Yogyakarta',
    lat: -7.5407, lng: 110.4457,
    time: '(contoh status PVMBG)',
    risk: 'warning',
    magnitude: 'Level III (Siaga)',
    depth: 'Radius Bahaya 5 km',
    step: 'Jauhi radius bahaya 5 km dari kawah puncak. Kenakan masker N95 antisipasi abu silika.',
    isSample: true,
  },
];

// Helper untuk menyesuaikan label dan nilai metrik sesuai jenis bencana
const getDisasterMetrics = (item) => {
  const type = (item.type || '').toLowerCase();

  if (type.includes('banjir')) {
    return {
      label1: 'Ketinggian Air',
      value1: item.magnitude || '50 cm',
      label2: 'Kondisi Genangan',
      value2: item.depth && item.depth !== '-' ? item.depth : 'TMA Siaga 3',
    };
  }

  if (type.includes('longsor')) {
    return {
      label1: 'Skala Longsor',
      value1: item.magnitude || 'Volume Sedang',
      label2: 'Kondisi Lereng',
      value2: item.depth && item.depth !== '-' ? item.depth : 'Tanah Labil',
    };
  }

  if (type.includes('gunung') || type.includes('erupsi')) {
    return {
      label1: 'Tingkat Aktivitas',
      value1: item.magnitude || 'Level III (Siaga)',
      label2: 'Zona Bahaya',
      value2: item.depth && item.depth !== '-' ? item.depth : 'Radius Bahaya 5 km',
    };
  }

  if (type.includes('tsunami')) {
    return {
      label1: 'Tinggi Gelombang',
      value1: item.magnitude || 'Tinggi ~3 m',
      label2: 'Pusat Gempa',
      value2: item.depth && item.depth !== '-' ? item.depth : 'Laut Dangkal',
    };
  }

  if (type.includes('karhutla')) {
    return {
      label1: 'Jumlah Titik',
      value1: item.jumlah_titik ? `${item.jumlah_titik} Titik` : (item.magnitude || 'Titik Panas'),
      label2: 'Radiasi Termal',
      value2: item.frp_total ? `${item.frp_total} MW` : (item.depth || 'FRP Aktif'),
    };
  }

  if (type.includes('cuaca')) {
    return {
      label1: 'Kecepatan Angin',
      value1: item.magnitude || '> 50 km/jam',
      label2: 'Fenomena',
      value2: item.depth && item.depth !== '-' ? item.depth : 'Hujan & Angin Kencang',
    };
  }

  // Standar BMKG untuk Gempa Bumi
  return {
    label1: 'Magnitudo',
    value1: item.magnitude || '-',
    label2: 'Kedalaman',
    value2: item.depth || '-',
  };
};

function MapViewController({ activeRegion, center, zoom }) {
  const map = useMap();
  const prevRegionSlugRef = useRef(null);

  useEffect(() => {
    map.setMaxBounds(INDONESIA_BOUNDS);
    map.setMinZoom(4);
  }, [map]);

  useEffect(() => {
    if (!map) return;
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (activeRegion && activeRegion.bounds) {
      prevRegionSlugRef.current = activeRegion.slug;
      const t = setTimeout(() => {
        try {
          map.invalidateSize();
          if (prefersReducedMotion) {
            map.fitBounds(activeRegion.bounds, { padding: [30, 30], maxZoom: 8 });
          } else {
            map.flyToBounds(activeRegion.bounds, { padding: [30, 30], duration: 1.2, maxZoom: 8 });
          }
        } catch (_) {}
      }, 50);
      return () => clearTimeout(t);
    } else if (prevRegionSlugRef.current && !activeRegion) {
      // User klik tombol "Lihat seluruh Indonesia"
      prevRegionSlugRef.current = null;
      if (prefersReducedMotion) {
        map.fitBounds(INDONESIA_BOUNDS, { padding: [10, 10] });
      } else {
        map.flyToBounds(INDONESIA_BOUNDS, { padding: [10, 10], duration: 1.0 });
      }
    } else if (!activeRegion && center) {
      // Normalkan center — bisa array [lat, lng] atau object {lat, lng}
      const lat = Array.isArray(center) ? center[0] : center.lat;
      const lng = Array.isArray(center) ? center[1] : center.lng;
      // Jika zoom 13+ (dari flyToUser/Pantau Wilayah), pakai flyTo dengan animasi mulus
      if (zoom >= 13) {
        const t = setTimeout(() => {
          try {
            map.invalidateSize();
            if (prefersReducedMotion) {
              map.setView([lat, lng], zoom);
            } else {
              map.flyTo([lat, lng], zoom, { duration: 1.8 });
            }
          } catch (_) {}
        }, 100);
        return () => clearTimeout(t);
      } else {
        map.setView([lat, lng], zoom || 5);
      }
    }
  }, [activeRegion, center, zoom, map]);

  return null;
}

// Invalidate Leaflet map size on mount and resize (prevents blank map tiles on mobile)
function MapFixResize() {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 200);
    const t3 = setTimeout(() => map.invalidateSize(), 500);
    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
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
  const location = useLocation();
  const navigate = useNavigate();

  // Parsing parameter URL (?wilayah=... atau ?provinsi=...)
  const searchParams = new URLSearchParams(location.search);
  const initialWilayahSlug = searchParams.get('wilayah') || searchParams.get('provinsi');
  const initialRegion = getRegionBySlug(initialWilayahSlug);

  const [activeRegion, setActiveRegion] = useState(initialRegion);
  const [filterOnlyThisRegion, setFilterOnlyThisRegion] = useState(Boolean(initialRegion));
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isSampleData, setIsSampleData] = useState(false);
  const [mapCenter, setMapCenter] = useState(initialRegion ? initialRegion.center : INDONESIA_CENTER);
  const [mapZoom, setMapZoom] = useState(initialRegion ? 6 : 5);
  const [sidebarTab, setSidebarTab] = useState('map');
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [satelliteNoticeDismissed, setSatelliteNoticeDismissed] = useState(false);
  const [mitigationModal, setMitigationModal] = useState(null);
  const [karhutlaInfo, setKarhutlaInfo] = useState({
    stale: false,
    updatedAt: null,
    totalPoints: 0,
    notice: null,
  });

  // Sinkronisasi saat URL search params berubah (misalnya klik navbar "Peta Bencana" atau tombol Back)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const slug = params.get('wilayah') || params.get('provinsi');
    const reg = getRegionBySlug(slug);
    setActiveRegion(reg);
    if (reg) {
      setFilterOnlyThisRegion(true);
      setMapCenter(reg.center);
      setMapZoom(6);
    } else {
      setFilterOnlyThisRegion(false);
    }
  }, [location.search]);

  // Handler reset ke tampilan nasional penuh
  const handleResetToNational = () => {
    setActiveRegion(null);
    setFilterOnlyThisRegion(false);
    navigate('/peta', { replace: true });
  };

  // Auto-pan map jika diarahkan dari tombol "Pantau Wilayah Saya Sekarang" / CTA di LandingPage (hanya jika tanpa ?wilayah=)
  useEffect(() => {
    if (location.state?.userCoords && !activeRegion) {
      setMapCenter(location.state.userCoords);
      // flyToUser: zoom sangat dekat ke lokasi user (zoom 15)
      // tanpa flyToUser: zoom sedang (zoom 10, perilaku lama)
      setMapZoom(location.state?.flyToUser ? 15 : 10);
    }
  }, [location.state, activeRegion]);

  // Pastikan posisi scroll selalu di atas (Peta Bencana) saat membuka /peta,
  // kecuali jika URL secara eksplisit meminta hash #tanya-ai
  useEffect(() => {
    if (location.hash === '#tanya-ai') {
      const el = document.getElementById('tanya-ai');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [location.pathname, location.hash]);

  // Geocoding search state
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState(null);
  const searchDebounceRef = useRef(null);

  // Horizontal scroll for filter chips
  const chipsScrollRef = useRef(null);
  const scrollChips = (offset) => {
    if (chipsScrollRef.current) {
      chipsScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };
  const handleChipsWheel = (e) => {
    if (chipsScrollRef.current) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        chipsScrollRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setIsSampleData(false);

    try {
      const [resTerkini, resDirasakan, resKarhutla] = await Promise.allSettled([
        fetch(BMKG_TERKINI_URL),
        fetch(BMKG_DIRASAKAN_URL),
        fetch('/api/karhutla'),
      ]);

      let formattedData = [];

      // Process BMKG Earthquakes
      if (
        resTerkini.status === 'fulfilled' &&
        resDirasakan.status === 'fulfilled' &&
        resTerkini.value.ok &&
        resDirasakan.value.ok
      ) {
        const parsedTerkini = await resTerkini.value.json();
        const parsedDirasakan = await resDirasakan.value.json();

        if (!parsedTerkini.error && !parsedDirasakan.error) {
          const listTerkini = parsedTerkini.Infogempa?.gempa || [];
          const listDirasakan = parsedDirasakan.Infogempa?.gempa || [];

          const allGempa = [...listTerkini, ...listDirasakan];
          const uniqueGempa = Array.from(new Set(allGempa.map(g => g.DateTime)))
            .map(time => allGempa.find(g => g.DateTime === time));

          formattedData = uniqueGempa.map((g, index) => {
            const coords = (g.Coordinates || '').split(',');
            const lat = parseFloat(coords[0]);
            const lng = parseFloat(coords[1]);

            // Logika level risiko terpusat
            const riskInfo = evaluateRisk({
              magnitude: g.Magnitude,
              depth: g.Kedalaman,
              potensi: g.Potensi,
              dirasakan: g.Dirasakan,
              type: 'Gempa Bumi'
            });

            // Format lokasi terpusat (arah mata angin, Title Case, mapping provinsi)
            const formattedLoc = formatLocation(g.Wilayah);

            return {
              id: `bmkg-${index}`,
              type: 'Gempa Bumi',
              location: formattedLoc,
              rawLocation: g.Wilayah || '',
              lat: isNaN(lat) ? -2.5 : lat,
              lng: isNaN(lng) ? 117.5 : lng,
              time: `${g.Tanggal} ${g.Jam}`,
              risk: riskInfo.level,
              riskLabel: riskInfo.label,
              magnitude: g.Magnitude,
              depth: g.Kedalaman,
              potensi: g.Potensi,
              step: riskInfo.level === 'danger'
                ? (riskInfo.reason.toLowerCase().includes('tsunami')
                    ? 'BAHAYA TSUNAMI: Segera evakuasi ke tempat tinggi (>20 m)! Jauhi pantai dan sungai.'
                    : 'BAHAYA TINGGI: Segera berlindung di bawah meja kokoh! Jauhi bangunan rapuh dan kaca.')
                : riskInfo.level === 'warning'
                ? 'WASPADA: Berlindung di bawah meja kuat. Jauhi perabot tinggi. Waspada gempa susulan.'
                : 'SIAGA: Tetap tenang dan pantau informasi resmi BMKG. Pastikan akses pintu terbuka.',
              isSample: false,
            };
          });
        }
      }

      // Process NASA FIRMS Karhutla Clusters
      let karhutlaData = [];
      if (resKarhutla.status === 'fulfilled' && resKarhutla.value.ok) {
        try {
          const khJson = await resKarhutla.value.json();
          setKarhutlaInfo({
            stale: khJson.stale || false,
            updatedAt: khJson.updated_at || null,
            totalPoints: khJson.total_titik || 0,
            notice: khJson.notice || null,
          });

          if (Array.isArray(khJson.events)) {
            karhutlaData = khJson.events.map((ev) => ({
              id: ev.id,
              type: 'Karhutla',
              location: ev.location || `${ev.wilayah?.kabupaten}, ${ev.wilayah?.provinsi}`,
              rawLocation: ev.location,
              lat: ev.lat,
              lng: ev.lon,
              time: ev.waktu,
              risk: ev.risk,
              riskLabel: ev.status,
              jumlah_titik: ev.jumlah_titik,
              frp_total: ev.frp_total,
              frp_max: ev.frp_max,
              radius_km: ev.radius_km || 5,
              wilayah: ev.wilayah,
              titik: ev.titik || [],
              satellite: ev.titik?.[0]?.satelit || 'VIIRS (NASA FIRMS)',
              confidence: ev.titik?.[0]?.confidence || 'Nominal / High',
              step: ev.risk === 'danger'
                ? 'BAHAYA TINGGI: Kualitas udara berbahaya akibat konsentrasi titik api pekat. Gunakan masker N95, tetap di dalam ruangan, dan segera hubungi BPBD / Manggala Agni jika api mendekati pemukiman.'
                : ev.risk === 'warning'
                ? 'WASPADA: Titik panas aktif terdeteksi di sekitar area. Tutup ventilasi rumah jika ada kabut asap, gunakan masker saat keluar, dan pantau arah angin.'
                : 'SIAGA: Titik panas terdeteksi satelit. Jangan membakar lahan atau sampah. Laporkan titik api ke aparat terdekat.',
              isSample: false,
            }));
          }
        } catch (khErr) {
          console.warn('[GeoAlert] Gagal membaca data Karhutla:', khErr);
        }
      }

      if (formattedData.length === 0 && karhutlaData.length === 0) {
        throw new Error('Gagal memuat data live bencana');
      }

      // Gabungkan event gempa bumi BMKG dan karhutla NASA FIRMS
      setData([...formattedData, ...karhutlaData, ...SAMPLE_DISASTERS]);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('[GeoAlert] Gagal mengambil data:', err.message);
      setError(`Gagal memuat data live: ${err.message}. Menampilkan contoh tampilan data.`);
      setData([
        { id: 's1', type: 'Gempa Bumi', location: formatLocation('Selatan Jawa Barat'), lat: -7.5, lng: 107.0, time: '(contoh data)', risk: 'danger', magnitude: '6.2', depth: '10 km', step: 'Berlindung di bawah meja kuat.', isSample: true },
        { id: 's4', type: 'Gempa Bumi', location: formatLocation('Palu, Sulawesi Tengah'), lat: -0.9, lng: 119.87, time: '(contoh data)', risk: 'standby', magnitude: '4.1', depth: '30 km', step: 'Tetap tenang.', isSample: true },
        ...SAMPLE_DISASTERS,
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
    if (risk === 'danger') {
      return (
        <span className="badge badge-danger" aria-label="Tingkat Risiko: Bahaya Tinggi">
          <AlertOctagon size={13} aria-hidden="true" />
          <span>Bahaya Tinggi</span>
        </span>
      );
    }
    if (risk === 'warning') {
      return (
        <span className="badge badge-warning" aria-label="Tingkat Risiko: Waspada">
          <AlertTriangle size={13} aria-hidden="true" />
          <span>Waspada</span>
        </span>
      );
    }
    return (
      <span className="badge badge-standby" aria-label="Tingkat Risiko: Siaga">
        <ShieldAlert size={13} aria-hidden="true" />
        <span>Siaga</span>
      </span>
    );
  };

  const getIcon = (type) => {
    if (type.includes('Karhutla')) return <Flame size={16} color="#EA580C" />;
    if (type.includes('Gempa')) return <Activity size={16} />;
    if (type.includes('Tsunami')) return <Waves size={16} />;
    if (type.includes('Banjir')) return <Droplets size={16} />;
    if (type.includes('Cuaca')) return <Wind size={16} />;
    if (type.includes('Longsor')) return <Mountain size={16} />;
    if (type.includes('Gunung Api') || type.includes('Erupsi')) return <Flame size={16} />;
    return <AlertTriangle size={16} />;
  };

  const filteredData = data.filter(item => {
    // Saring Karhutla: hanya tampilkan yang berisiko nyata (Waspada & Bahaya Tinggi) pada filter Semua
    // Jika user memilih kategori 'Karhutla' secara eksplisit, tampilkan seluruh kluster
    if (item.type === 'Karhutla' && item.risk === 'standby' && activeFilter !== 'Karhutla') {
      return false;
    }

    // Filter wilayah aktif jika toggle "Hanya wilayah ini" aktif
    if (activeRegion && filterOnlyThisRegion) {
      if (!isCoordinateInRegion(item.lat, item.lng, activeRegion)) {
        return false;
      }
    }

    let matchesFilter = false;
    if (activeFilter === 'Semua') {
      matchesFilter = true;
    } else if (activeFilter === 'Karhutla') {
      matchesFilter = item.type === 'Karhutla';
    } else if (activeFilter === 'Tsunami') {
      // Hanya tampilkan jika bertipe Tsunami atau ada peringatan tsunami aktif (mengecualikan "Tidak berpotensi tsunami")
      matchesFilter = item.type.includes('Tsunami') || hasTsunamiThreat(item.potensi);
    } else if (activeFilter === 'Gempa') {
      matchesFilter = item.type.includes('Gempa');
    } else if (activeFilter === 'Gunung Api') {
      matchesFilter = item.type.includes('Gunung Api') || item.type.includes('Erupsi');
    } else {
      matchesFilter = item.type.includes(activeFilter);
    }
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
          @keyframes karhutla-flame-pulse {
            0%   { transform: scale(1); opacity: 0.7; }
            50%  { transform: scale(1.6); opacity: 0.25; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          @media (prefers-reduced-motion: reduce) {
            .karhutla-flame-divicon div { animation: none !important; }
          }
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>

        <div className="map-page-container">
          {/* Main Map Card */}
          <div className="map-main-card">
            {/* Floating Toolbar Overlay */}
            <div className="map-toolbar-floating">
              {/* Search bar dengan geocoding */}
              <div style={{ position: 'relative', flexShrink: 0, width: '240px', maxWidth: '280px' }}>
                <div className="search-bar-pill">
                  <Search size={17} color="var(--color-primary)" />
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

              {/* Filter chips pills with scroll navigation & mouse wheel */}
              <div className="filter-chips-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flex: 1 }}>
                <button
                  type="button"
                  className="chips-nav-arrow"
                  onClick={() => scrollChips(-140)}
                  title="Geser kategori ke kiri"
                  aria-label="Geser ke kiri"
                >
                  <ChevronLeft size={15} />
                </button>
                <div
                  className="filter-chips-pill"
                  ref={chipsScrollRef}
                  onWheel={handleChipsWheel}
                >
                  {['Semua', 'Gempa', 'Tsunami', 'Karhutla', 'Banjir', 'Longsor', 'Gunung Api'].map(chip => (
                    <button
                      key={chip}
                      className={`chip-pill ${activeFilter === chip ? 'active' : ''}`}
                      onClick={() => setActiveFilter(chip)}
                      aria-pressed={activeFilter === chip}
                    >
                      <span>{chip}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="chips-nav-arrow"
                  onClick={() => scrollChips(140)}
                  title="Geser kategori ke kanan"
                  aria-label="Geser ke kanan"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Floating Active Region Banner (Saat datang dari hero / parameter ?wilayah=) */}
            {activeRegion && (
              <div
                className="map-active-region-banner"
                role="status"
                aria-live="polite"
              >
                <div className="region-banner-info">
                  <span className="region-banner-pulse" aria-hidden="true" />
                  <MapPin size={15} color="#0E2A5C" aria-hidden="true" />
                  <span>
                    Wilayah: <strong>{activeRegion.name}</strong>
                  </span>
                  <span className="region-incident-count-pill">
                    {data.filter(item => isCoordinateInRegion(item.lat, item.lng, activeRegion)).length} Kejadian
                  </span>
                </div>
                <button
                  type="button"
                  className="region-banner-reset-btn"
                  onClick={handleResetToNational}
                  title="Kembalikan peta ke tampilan seluruh Indonesia"
                  aria-label="Lihat seluruh Indonesia dan hapus filter wilayah"
                >
                  <span>Lihat seluruh Indonesia</span>
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Satellite Disclaimer Banner */}
            {!satelliteNoticeDismissed && (
              <div
                className="map-firms-permanent-banner"
                style={{
                  position: 'absolute',
                  top: activeRegion ? '142px' : '95px',
                  left: '16px',
                  right: '16px',
                  maxWidth: '620px',
                  zIndex: 999,
                  background: 'rgba(255, 255, 255, 0.94)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(234, 88, 12, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  color: '#334155',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  pointerEvents: 'auto',
                }}
              >
                <Flame size={15} color="#EA580C" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, lineHeight: '1.4' }}>
                  <span>
                    <strong>Informasi Satelit:</strong> Titik panas = indikasi anomali suhu dari satelit, belum tentu kebakaran terkonfirmasi. Sumber: NASA FIRMS.
                  </span>
                  {karhutlaInfo.stale && karhutlaInfo.updatedAt && (
                    <span style={{ color: '#C0492B', fontWeight: 600, display: 'inline-block', marginLeft: '6px' }}>
                      • Data terakhir diperbarui: {karhutlaInfo.updatedAt}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSatelliteNoticeDismissed(true)}
                  title="Tutup informasi satelit"
                  aria-label="Tutup informasi satelit"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'color 0.2s, background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#0E2A5C';
                    e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Floating Notice Toast */}
            {!noticeDismissed && (hasSampleItems || error) && (
              <div
                className="map-notice-toast"
                style={{
                  top: activeRegion
                    ? (!satelliteNoticeDismissed ? '194px' : '142px')
                    : (!satelliteNoticeDismissed ? '146px' : '95px'),
                }}
              >
                <Info size={16} color="var(--color-standby)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  {error ? (
                    <span>{error}</span>
                  ) : (
                    <span>
                      Data simulasi multi-bahaya: <strong>contoh tampilan data</strong> — API resmi BNPB/PVMBG belum publik penuh.
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
                center={activeRegion ? activeRegion.center : INDONESIA_CENTER}
                zoom={activeRegion ? 6 : 5}
                style={{ height: '100%', width: '100%' }}
                maxBounds={INDONESIA_BOUNDS}
                maxBoundsViscosity={0.7}
                minZoom={4}
              >
                <MapFixResize />
                <MapViewController activeRegion={activeRegion} center={mapCenter} zoom={mapZoom} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {!loading && filteredData.map(item => {
                  const isKarhutla = item.type === 'Karhutla';
                  const circleColor = item.risk === 'danger' ? '#C0492B' : item.risk === 'warning' ? '#F57C00' : '#4A90D9';

                  return (
                    <React.Fragment key={item.id}>
                      {/* Lingkaran penanda daerah terdampak karhutla */}
                      {isKarhutla && (
                        <Circle
                          center={[item.lat, item.lng]}
                          radius={(item.radius_km || 5) * 1000}
                          pathOptions={{
                            color: circleColor,
                            fillColor: circleColor,
                            fillOpacity: 0.16,
                            weight: 1.5,
                            dashArray: '6, 6',
                          }}
                        />
                      )}

                      <Marker
                        position={[item.lat, item.lng]}
                        icon={
                          isKarhutla
                            ? createFlameMarkerIcon(item.risk, item.jumlah_titik)
                            : (item.type === 'Tsunami' || hasTsunamiThreat(item.potensi))
                            ? createTsunamiMarkerIcon(item.risk)
                            : createCustomIcon(item.risk)
                        }
                      >
                        <Popup
                          maxWidth={270}
                          minWidth={220}
                          autoPan={true}
                          autoPanPaddingTopLeft={[20, 115]}
                          autoPanPaddingBottomRight={[20, 20]}
                          className="custom-compact-popup"
                        >
                          <div style={{ minWidth: '220px', maxWidth: '260px', fontFamily: 'Inter, sans-serif' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', paddingRight: '14px' }}>
                              <strong style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.86rem', color: isKarhutla ? '#EA580C' : '#0E2A5C' }}>
                                {getIcon(item.type)} {isKarhutla ? 'Titik Panas Karhutla' : item.type}
                              </strong>
                              <div style={{ transform: 'scale(0.85)', transformOrigin: 'right center' }}>
                                {getRiskLabel(item.risk)}
                              </div>
                            </div>

                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.25, marginBottom: '2px' }}>
                              {item.location}
                            </div>

                            <div style={{ fontFamily: 'Fira Code, monospace', fontSize: '0.7rem', color: '#64748b', marginBottom: '5px' }}>
                              {item.time}
                            </div>

                            {isKarhutla ? (
                              <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '5px' }}>
                                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 6px', borderRadius: '6px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Titik Panas</div>
                                    <div style={{ fontFamily: 'Fira Code, monospace', fontWeight: '700', fontSize: '0.92rem', color: '#EA580C' }}>
                                      {item.jumlah_titik} Titik
                                    </div>
                                  </div>
                                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 6px', borderRadius: '6px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total FRP</div>
                                    <div style={{ fontFamily: 'Fira Code, monospace', fontWeight: '700', fontSize: '0.92rem', color: '#0E2A5C' }}>
                                      {item.frp_total} MW
                                    </div>
                                  </div>
                                </div>

                                <div style={{ fontSize: '0.68rem', color: '#475569', marginBottom: '5px', background: '#f1f5f9', padding: '3px 6px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>Satelit: <strong>{item.satellite || 'VIIRS'}</strong></span>
                                  <span>Radius: <strong>~{item.radius_km} km</strong></span>
                                </div>

                                <div style={{ fontSize: '0.72rem', padding: '5px 7px', background: 'rgba(234,88,12,0.06)', borderRadius: '6px', borderLeft: '3px solid #EA580C', lineHeight: '1.3', marginBottom: '6px' }}>
                                  <strong style={{ color: '#C0492B' }}>⚠️ Tindakan:</strong> {item.step}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setMitigationModal('karhutla')}
                                  style={{
                                    width: '100%',
                                    padding: '5px 8px',
                                    background: '#0E2A5C',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '5px',
                                  }}
                                >
                                  <Flame size={13} /> Panduan Mitigasi Karhutla
                                </button>
                              </>
                            ) : (
                              <>
                                {item.isSample && (
                                  <div style={{
                                    background: 'rgba(74,144,217,0.1)', borderRadius: '4px',
                                    padding: '2px 6px', fontSize: '0.65rem', color: '#4A90D9',
                                    marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '4px',
                                  }}>
                                    <Info size={10} /> contoh tampilan data
                                  </div>
                                )}
                                {(() => {
                                  const metrics = getDisasterMetrics(item);
                                  return (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '5px' }}>
                                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 6px', borderRadius: '6px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{metrics.label1}</div>
                                        <div style={{ fontFamily: 'Fira Code, monospace', fontWeight: '700', fontSize: '0.92rem', color: '#0E2A5C' }}>
                                          {metrics.value1}
                                        </div>
                                      </div>
                                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 6px', borderRadius: '6px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{metrics.label2}</div>
                                        <div style={{ fontFamily: 'Fira Code, monospace', fontWeight: '700', fontSize: '0.92rem', color: '#0E2A5C' }}>
                                          {metrics.value2}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                                <div style={{ fontSize: '0.72rem', padding: '5px 7px', background: 'rgba(192,73,43,0.06)', borderRadius: '6px', borderLeft: '3px solid #C0492B', lineHeight: '1.3' }}>
                                  <strong style={{ color: '#C0492B' }}>⚠️ Tindakan:</strong> {item.step}
                                </div>
                              </>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })}
              </MapContainer>

              {loading && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 1000,
                  background: 'rgba(247,242,234,0.85)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '16px', borderRadius: 'var(--radius-xl)'
                }}>
                  <RefreshCw size={32} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Memuat data real-time…</p>
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
                  onClick={() => {
                    setSidebarTab('map');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
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
                  {activeRegion && filterOnlyThisRegion
                    ? `${filteredData.length} di ${activeRegion.name}`
                    : `${filteredData.length} Bencana`}
                </span>
              </div>

              {/* Toggle "Hanya wilayah ini" saat datang dari hero */}
              {activeRegion && (
                <div className="sidebar-region-toggle-box">
                  <label className="sidebar-region-toggle-label">
                    <input
                      type="checkbox"
                      checked={filterOnlyThisRegion}
                      onChange={(e) => setFilterOnlyThisRegion(e.target.checked)}
                      className="sidebar-region-checkbox"
                    />
                    <span>Hanya wilayah {activeRegion.name}</span>
                  </label>
                  <span className="sidebar-region-count-note">
                    {data.filter(item => isCoordinateInRegion(item.lat, item.lng, activeRegion)).length} total
                  </span>
                </div>
              )}

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
                        {item.type === 'Karhutla' ? (
                          <span className="mono" style={{ color: '#EA580C', fontWeight: '700', background: 'rgba(234,88,12,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                            {item.jumlah_titik} Titik ({item.frp_total} MW)
                          </span>
                        ) : item.type === 'Gempa Bumi' && item.magnitude && item.magnitude !== '-' ? (
                          <span className="mono" style={{ color: 'var(--color-primary)', fontWeight: '700', background: 'rgba(14,42,92,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                            M {item.magnitude}
                          </span>
                        ) : item.magnitude && item.magnitude !== '-' ? (
                          <span className="mono" style={{ color: 'var(--color-primary)', fontWeight: '700', background: 'rgba(14,42,92,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                            {item.magnitude}
                          </span>
                        ) : null}
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
      <section id="tanya-ai" className="tanya-ai-section">
        <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '0 var(--spacing-4)', boxSizing: 'border-box' }}>
          <div className="ai-chat-full-card">
            <AIChat isFloating={false} />
          </div>
        </div>
      </section>

      {/* Modal Mitigasi Terintegrasi */}
      {mitigationModal && (
        <MitigationModal type={mitigationModal} onClose={() => setMitigationModal(null)} />
      )}
    </>
  );
}
