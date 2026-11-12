/**
 * karhutlaApi.js
 * Konfigurasi endpoint Karhutla dengan fallback untuk GitHub Pages.
 *
 * Di GitHub Pages tidak ada backend Laravel, sehingga /api/karhutla tidak tersedia.
 * Ketika VITE_KARHUTLA_USE_SAMPLE === 'true' (di-set di .env.ghpages),
 * fungsi fetchKarhutla() langsung mengembalikan data sampel edukatif tanpa fetch.
 */

import { evaluateRisk } from '../utils/riskEvaluator';

// Di-inject saat build: 'true' untuk GH Pages, undefined untuk Laravel dev/prod
const USE_SAMPLE = import.meta.env.VITE_KARHUTLA_USE_SAMPLE === 'true';

// ─── Sample data karhutla realistis (sama persis dengan getSampleKarhutlaData PHP) ────
const SAMPLE_KARHUTLA = {
  updated_at: 'Data Simulasi NASA FIRMS',
  stale: true,
  source: 'NASA FIRMS (VIIRS) — Data Simulasi',
  notice: 'Data karhutla live tidak tersedia di versi demo (GitHub Pages). Data di bawah adalah simulasi titik panas realistis untuk demonstrasi.',
  total_titik: 22,
  events: [
    {
      id: 'karhutla-sample-1',
      jenis: 'karhutla',
      type: 'Karhutla',
      status: 'Bahaya Tinggi',
      risk: 'danger',
      lat: 1.4821,
      lon: 101.8152,
      radius_km: 8.5,
      jumlah_titik: 12,
      frp_total: 148.6,
      frp_max: 45.2,
      waktu: 'Simulasi — Hari ini',
      wilayah: { provinsi: 'Riau', kabupaten: 'Kabupaten Bengkalis' },
      location: 'Kabupaten Bengkalis, Riau',
      is_sample: true,
      titik: [
        { lat: 1.482, lon: 101.815, confidence: 'high', frp: 45.2, satelit: 'VIIRS_NOAA20_NRT', waktu: 'Hari ini' },
        { lat: 1.485, lon: 101.818, confidence: 'high', frp: 38.0, satelit: 'VIIRS_SNPP_NRT', waktu: 'Hari ini' },
        { lat: 1.479, lon: 101.812, confidence: 'nominal', frp: 24.5, satelit: 'VIIRS_NOAA21_NRT', waktu: 'Hari ini' },
      ],
    },
    {
      id: 'karhutla-sample-2',
      jenis: 'karhutla',
      type: 'Karhutla',
      status: 'Waspada',
      risk: 'warning',
      lat: -1.8492,
      lon: 110.3251,
      radius_km: 6.2,
      jumlah_titik: 6,
      frp_total: 54.3,
      frp_max: 18.7,
      waktu: 'Simulasi — Hari ini',
      wilayah: { provinsi: 'Kalimantan Barat', kabupaten: 'Kabupaten Ketapang' },
      location: 'Kabupaten Ketapang, Kalimantan Barat',
      is_sample: true,
      titik: [
        { lat: -1.849, lon: 110.325, confidence: 'nominal', frp: 18.7, satelit: 'VIIRS_NOAA20_NRT', waktu: 'Hari ini' },
        { lat: -1.852, lon: 110.328, confidence: 'nominal', frp: 15.2, satelit: 'VIIRS_SNPP_NRT', waktu: 'Hari ini' },
      ],
    },
    {
      id: 'karhutla-sample-3',
      jenis: 'karhutla',
      type: 'Karhutla',
      status: 'Waspada',
      risk: 'warning',
      lat: -3.1256,
      lon: 104.7892,
      radius_km: 5.4,
      jumlah_titik: 4,
      frp_total: 32.1,
      frp_max: 14.5,
      waktu: 'Simulasi — Hari ini',
      wilayah: { provinsi: 'Sumatera Selatan', kabupaten: 'Kabupaten Ogan Komering Ilir' },
      location: 'Kabupaten Ogan Komering Ilir, Sumatera Selatan',
      is_sample: true,
      titik: [
        { lat: -3.125, lon: 104.789, confidence: 'nominal', frp: 14.5, satelit: 'VIIRS_NOAA21_NRT', waktu: 'Hari ini' },
      ],
    },
    {
      id: 'karhutla-sample-4',
      jenis: 'karhutla',
      type: 'Karhutla',
      status: 'Bahaya Tinggi',
      risk: 'danger',
      lat: -2.2167,
      lon: 113.9167,
      radius_km: 7.8,
      jumlah_titik: 15,
      frp_total: 189.4,
      frp_max: 62.1,
      waktu: 'Simulasi — Hari ini',
      wilayah: { provinsi: 'Kalimantan Tengah', kabupaten: 'Kabupaten Pulang Pisau' },
      location: 'Kabupaten Pulang Pisau, Kalimantan Tengah',
      is_sample: true,
      titik: [
        { lat: -2.217, lon: 113.917, confidence: 'high', frp: 62.1, satelit: 'VIIRS_NOAA20_NRT', waktu: 'Hari ini' },
        { lat: -2.221, lon: 113.920, confidence: 'high', frp: 55.8, satelit: 'VIIRS_SNPP_NRT', waktu: 'Hari ini' },
      ],
    },
  ],
};

/**
 * Fetch data karhutla.
 * - Jika USE_SAMPLE (GH Pages): kembalikan sample langsung (tidak ada fetch).
 * - Jika tidak (Laravel): fetch ke /api/karhutla seperti biasa.
 */
export async function fetchKarhutla() {
  if (USE_SAMPLE) {
    return SAMPLE_KARHUTLA;
  }
  const res = await fetch('/api/karhutla');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
