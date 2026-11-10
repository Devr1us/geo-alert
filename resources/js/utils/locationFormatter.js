/**
 * GeoAlert — Location Formatter Helper
 * 
 * Memformat nama lokasi mentah dari BMKG menjadi format yang rapi,
 * mudah dibaca masyarakat, Title Case, memisahkan arah mata angin gabungan,
 * serta menerjemahkan singkatan daerah/provinsi resmi.
 */

// Kamus mapping singkatan provinsi dan daerah BMKG
const PROVINCE_MAP = {
  'PAPUABRT': 'Papua Barat',
  'PAPUA-BRT': 'Papua Barat',
  'PAPUABARAT': 'Papua Barat',
  'PAPUABRTDY': 'Papua Barat Daya',
  'PAPUABDAYA': 'Papua Barat Daya',
  'PAPUA-BDY': 'Papua Barat Daya',
  'PAPUABARATDAYA': 'Papua Barat Daya',
  'PAPUA': 'Papua',
  'PAPUASLT': 'Papua Selatan',
  'PAPUATGH': 'Papua Tengah',
  'PAPUABDG': 'Papua Pegunungan',
  'SULUT': 'Sulawesi Utara',
  'SULTENG': 'Sulawesi Tengah',
  'SULSEL': 'Sulawesi Selatan',
  'SULTRA': 'Sulawesi Tenggara',
  'SULBAR': 'Sulawesi Barat',
  'GORONTALO': 'Gorontalo',
  'JABAR': 'Jawa Barat',
  'JATENG': 'Jawa Tengah',
  'JATIM': 'Jawa Timur',
  'BANTEN': 'Banten',
  'DKI': 'DKI Jakarta',
  'DKI-JAKARTA': 'DKI Jakarta',
  'JAKARTA': 'DKI Jakarta',
  'DIY': 'D.I. Yogyakarta',
  'DI-YOGYAKARTA': 'D.I. Yogyakarta',
  'YOGYAKARTA': 'D.I. Yogyakarta',
  'ACEH': 'Aceh',
  'NAD': 'Aceh',
  'SUMUT': 'Sumatera Utara',
  'SUMBAR': 'Sumatera Barat',
  'SUMSEL': 'Sumatera Selatan',
  'RIAU': 'Riau',
  'KEPRI': 'Kepulauan Riau',
  'KEP-RIAU': 'Kepulauan Riau',
  'JAMBI': 'Jambi',
  'BENGKULU': 'Bengkulu',
  'LAMPUNG': 'Lampung',
  'BABEL': 'Kep. Bangka Belitung',
  'BANGKA-BELITUNG': 'Kep. Bangka Belitung',
  'BALI': 'Bali',
  'NTB': 'Nusa Tenggara Barat',
  'NTT': 'Nusa Tenggara Timur',
  'KALBAR': 'Kalimantan Barat',
  'KALTENG': 'Kalimantan Tengah',
  'KALSEL': 'Kalimantan Selatan',
  'KALTIM': 'Kalimantan Timur',
  'KALTARA': 'Kalimantan Utara',
  'MALUT': 'Maluku Utara',
  'MALUKU': 'Maluku'
};

// Kamus penggantian arah mata angin gabungan
const WIND_DIRECTIONS = [
  { pattern: /\bBaratLaut\b/gi, replacement: 'Barat Laut' },
  { pattern: /\bBaratDaya\b/gi, replacement: 'Barat Daya' },
  { pattern: /\bTimurLaut\b/gi, replacement: 'Timur Laut' },
  { pattern: /\bTimurTenggara\b/gi, replacement: 'Timur Tenggara' },
  { pattern: /\bBaratTenggara\b/gi, replacement: 'Barat Tenggara' },
  { pattern: /\bSelatanDaya\b/gi, replacement: 'Selatan Daya' },
  { pattern: /\bTenggara\b/gi, replacement: 'Tenggara' }
];

/**
 * Mengubah string menjadi Title Case dengan aman
 * @param {string} str 
 * @returns {string}
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s|-|\/|\.)\S/g, (match) => match.toUpperCase());
}

/**
 * Format nama lokasi BMKG mentah
 * Contoh input:
 *  - "69 km BaratLaut KEBARMANOKWARI-PAPUABRT"
 *  - "128 km BaratDaya KAWASAN-SUMUT"
 *  - "Pusat gempa berada di darat 14 km BaratDaya KAB-BOGOR"
 *  - "102 km TimurLaut KEP-TALAUD-SULUT"
 * 
 * @param {string} raw - String lokasi mentah dari BMKG
 * @returns {string} - Lokasi yang terformat rapi
 */
export function formatLocation(raw) {
  if (!raw || typeof raw !== 'string') return '-';

  let cleaned = raw.trim();
  if (!cleaned) return '-';

  // 1. Pisahkan arah mata angin gabungan
  for (const { pattern, replacement } of WIND_DIRECTIONS) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  // 2. Cek apakah ada pola "X km [Arah] [WILAYAH]" atau "Pusat gempa ... [WILAYAH]"
  // Pola BMKG umum: "... [Jarak & Arah] [NAMA-WILAYAH]-[PROVINSI]"
  // Contoh: "69 km Barat Laut KEBARMANOKWARI-PAPUABRT"
  // Atau "KAB-BOGOR-JABAR", "KEP-TALAUD-SULUT"
  
  // Pisahkan bagian prefix (jarak/arah) dan wilayah jika ada
  // Cari pola jarak "X km [Arah]" di awal atau tengah
  const prefixRegex = /^(.*?\b\d+\s*km\s+(?:Barat\s+Laut|Barat\s+Daya|Timur\s+Laut|Tenggara|Barat|Timur|Selatan|Utara)\s+)(.+)$/i;
  const match = cleaned.match(prefixRegex);

  if (match) {
    const prefix = match[1];
    const regionPart = match[2].trim();
    const formattedRegion = formatRegionPart(regionPart);
    return `${prefix.trim()} ${formattedRegion}`;
  }

  // Jika tidak memiliki prefix jarak standar, periksa apakah ada tanda hubung "-"
  return formatRegionPart(cleaned);
}

/**
 * Memformat bagian nama wilayah/kabupaten/provinsi
 * @param {string} regionPart 
 * @returns {string}
 */
function formatRegionPart(regionPart) {
  if (!regionPart) return '';

  // Pecah berdasarkan tanda hubung '-'
  const tokens = regionPart.split('-');

  // Cek apakah token terakhir adalah singkatan provinsi di kamus
  let province = '';
  let workingTokens = [...tokens];

  if (tokens.length > 1) {
    const lastToken = tokens[tokens.length - 1].trim().toUpperCase();
    if (PROVINCE_MAP[lastToken]) {
      province = PROVINCE_MAP[lastToken];
      workingTokens.pop(); // Hapus token provinsi dari working list
    }
  }

  // Gabungkan dan format token wilayah tersisa
  let formattedMain = workingTokens
    .map((token, index) => {
      const upper = token.trim().toUpperCase();

      // Tangani prefix administratif umum
      if (upper === 'KAB' || upper === 'KABUPATEN') return 'Kab.';
      if (upper === 'KOTA') return 'Kota';
      if (upper === 'KEP' || upper === 'KEPULAUAN') return 'Kep.';

      // Title case biasa tanpa menebak
      return toTitleCase(token.trim());
    })
    .filter(Boolean)
    .join(' ');

  // Perbaiki jika masih ada "Kab. Bogor", "Kota Bima", dsb.
  // Jika token administratif menyatu misal "KAB-BOGOR" sudah ditangani oleh split('-');
  
  if (province) {
    // Jika nama wilayah utama berakhir sama dengan nama provinsi (misal: "Bengkulu, Bengkulu"),
    // tetap tampilkan koma agar jelas nama kota/kabupaten dan provinsinya.
    return `${formattedMain}, ${province}`;
  }

  return formattedMain || toTitleCase(regionPart);
}

export default {
  formatLocation,
  toTitleCase,
  PROVINCE_MAP,
};

