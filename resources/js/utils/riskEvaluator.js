/**
 * GeoAlert — Risk Level Evaluator
 * 
 * Modul terpusat untuk menentukan tingkat risiko bencana berdasarkan parameter ilmiah:
 * - Gempa Bumi: Magnitudo, Kedalaman (Dangkal/Menengah/Dalam), dan Potensi Tsunami / Skala Dirasakan (MMI).
 * - Bencana Lain: Kategori keparahan banjir, longsor, dan cuaca ekstrem.
 * 
 * Tiga Level Risiko Resmi GeoAlert:
 * 1. BAHAYA TINGGI (danger)
 *    - Dasar Ilmiah:
 *      * Gempa berpotensi tsunami (berdasarkan pemodelan TEWS BMKG).
 *      * Gempa besar (M >= 7.0) terlepas dari kedalaman.
 *      * Gempa dangkal (kedalaman <= 50 km) dengan M >= 6.0 (energi seismik belum teredam mantel bumi dan merusak struktur permukaan secara masif).
 *      * Getaran dirasakan skala MMI >= VI (kerusakan ringan-berat pada bangunan).
 * 
 * 2. WASPADA (warning)
 *    - Dasar Ilmiah:
 *      * Gempa dangkal (kedalaman <= 50 km) dengan magnitudo sedang (5.0 <= M < 6.0).
 *      * Gempa kedalaman menengah (50 km < kedalaman <= 300 km) dengan M >= 6.0.
 *      * Getaran gempa dirasakan skala MMI III - V (benda bergetar nyata, kepanikan ringan).
 *      * Bencana non-gempa dengan status peringatan sedang (angin kencang, genangan sedang).
 * 
 * 3. SIAGA (standby)
 *    - Dasar Ilmiah:
 *      * Gempa kecil (M < 5.0) yang umumnya hanya tercatat seismograf atau dirasakan lokal tanpa kerusakan.
 *      * Gempa dalam (kedalaman > 300 km) yang gelombangnya telah terdisipasi oleh mantel bumi sehingga tidak berbahaya bagi struktur permukaan.
 *      * Getaran sangat ringan (MMI I - II).
 */

export const RISK_LEVELS = {
  DANGER: 'danger',
  WARNING: 'warning',
  STANDBY: 'standby',
};

// Ambang batas yang dapat disesuaikan (konfigurasi terpusat)
export const RISK_THRESHOLDS = {
  // Gempa bumi
  MAGNITUDE_MAJOR: 7.0,          // M >= 7.0 selalu bahaya tinggi
  MAGNITUDE_STRONG: 6.0,         // M >= 6.0 dangkal = bahaya tinggi
  MAGNITUDE_MODERATE: 5.0,       // 5.0 <= M < 6.0 dangkal = waspada
  DEPTH_SHALLOW_KM: 50,          // Kedalaman <= 50 km dianggap dangkal
  DEPTH_DEEP_KM: 300,            // Kedalaman > 300 km dianggap gempa dalam (energi teredam)
};

/**
 * Ekstrak angka kedalaman (km) dari string BMKG (contoh: "10 km", "120 km", "15")
 * @param {string|number} depthInput 
 * @returns {number}
 */
export function parseDepth(depthInput) {
  if (typeof depthInput === 'number') return depthInput;
  if (!depthInput || typeof depthInput !== 'string') return 10; // Default dangkal jika tidak diketahui

  const match = depthInput.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 10;
}

/**
 * Ekstrak angka magnitudo dari string BMKG (contoh: "5.2", 6.1)
 * @param {string|number} magInput 
 * @returns {number}
 */
export function parseMagnitude(magInput) {
  if (typeof magInput === 'number') return magInput;
  if (!magInput) return 0;
  const parsed = parseFloat(magInput);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Cek apakah string potensi mengindikasikan tsunami aktif
 * @param {string} potensi 
 * @returns {boolean}
 */
export function hasTsunamiThreat(potensi) {
  if (!potensi || typeof potensi !== 'string') return false;
  const lower = potensi.toLowerCase();
  // Jika mengandung kata "tsunami" dan TIDAK diawali kata "tidak berpotensi"
  if (lower.includes('tidak berpotensi tsunami')) return false;
  if (lower.includes('tidak berpotensi')) return false;
  return lower.includes('tsunami') || lower.includes('berpotensi tsunami');
}

/**
 * Evaluasi tingkat risiko gempa bumi berdasarkan parameter resmi BMKG
 * @param {Object} params
 * @param {string|number} params.magnitude - Nilai magnitudo gempa
 * @param {string|number} params.depth - Kedalaman pusat gempa
 * @param {string} [params.potensi] - Keterangan potensi tsunami
 * @param {string} [params.dirasakan] - Keterangan skala MMI dirasakan
 * @param {string} [params.type] - Jenis bencana (default 'gempa')
 * @returns {{ level: 'danger'|'warning'|'standby', label: string, color: string, textColor: string, badgeClass: string, reason: string }}
 */
export function evaluateRisk({ magnitude, depth, potensi, dirasakan, type = 'gempa' }) {
  // Jika bencana bukan gempa (misal banjir, longsor, cuaca sampel)
  const isEarthquake = !type || type.toLowerCase().includes('gempa');

  if (!isEarthquake) {
    // Normalisasi bencana sampel/non-gempa jika ada
    return {
      level: RISK_LEVELS.STANDBY,
      label: 'Siaga',
      color: '#4A90D9',
      textColor: '#FFFFFF',
      badgeClass: 'badge-standby',
      reason: 'Pemantauan berkala non-gempa'
    };
  }

  const mag = parseMagnitude(magnitude);
  const depthKm = parseDepth(depth);
  const isTsunami = hasTsunamiThreat(potensi);

  // 1. EVALUASI BAHAYA TINGGI
  if (isTsunami) {
    return {
      level: RISK_LEVELS.DANGER,
      label: 'Bahaya Tinggi',
      color: '#C0492B',
      textColor: '#FFFFFF',
      badgeClass: 'badge-danger',
      reason: 'Peringatan dini potensi tsunami dari BMKG'
    };
  }

  if (mag >= RISK_THRESHOLDS.MAGNITUDE_MAJOR) {
    return {
      level: RISK_LEVELS.DANGER,
      label: 'Bahaya Tinggi',
      color: '#C0492B',
      textColor: '#FFFFFF',
      badgeClass: 'badge-danger',
      reason: `Magnitudo mayor (M ${mag.toFixed(1)}) berpotensi destruktif`
    };
  }

  if (mag >= RISK_THRESHOLDS.MAGNITUDE_STRONG && depthKm <= RISK_THRESHOLDS.DEPTH_SHALLOW_KM) {
    return {
      level: RISK_LEVELS.DANGER,
      label: 'Bahaya Tinggi',
      color: '#C0492B',
      textColor: '#FFFFFF',
      badgeClass: 'badge-danger',
      reason: `Gempa kuat dangkal (M ${mag.toFixed(1)}, kedalaman ${depthKm} km)`
    };
  }

  // 2. EVALUASI WASPADA
  if (mag >= RISK_THRESHOLDS.MAGNITUDE_STRONG && depthKm <= RISK_THRESHOLDS.DEPTH_DEEP_KM) {
    // Gempa kuat (M >= 6.0) tetapi kedalaman menengah (50 - 300 km)
    return {
      level: RISK_LEVELS.WARNING,
      label: 'Waspada',
      color: '#F57C00',
      textColor: '#FFFFFF',
      badgeClass: 'badge-warning',
      reason: `Gempa kuat kedalaman menengah (M ${mag.toFixed(1)}, ${depthKm} km)`
    };
  }

  if (mag >= RISK_THRESHOLDS.MAGNITUDE_MODERATE && depthKm <= RISK_THRESHOLDS.DEPTH_SHALLOW_KM) {
    // Gempa sedang (5.0 <= M < 6.0) dangkal (<= 50 km)
    return {
      level: RISK_LEVELS.WARNING,
      label: 'Waspada',
      color: '#F57C00',
      textColor: '#FFFFFF',
      badgeClass: 'badge-warning',
      reason: `Gempa sedang dangkal (M ${mag.toFixed(1)}, ${depthKm} km)`
    };
  }

  // Jika dirasakan skala MMI III-V
  if (dirasakan && typeof dirasakan === 'string') {
    const dLower = dirasakan.toLowerCase();
    if (dLower.includes('v') || dLower.includes('iv') || dLower.includes('iii')) {
      return {
        level: RISK_LEVELS.WARNING,
        label: 'Waspada',
        color: '#F57C00',
        textColor: '#FFFFFF',
        badgeClass: 'badge-warning',
        reason: `Gempa dirasakan nyata di daratan (${dirasakan})`
      };
    }
  }

  // 3. EVALUASI SIAGA (Standby / Rendah)
  // Termasuk gempa M < 5.0, atau gempa dalam > 300 km
  return {
    level: RISK_LEVELS.STANDBY,
    label: 'Siaga',
    color: '#0E2A5C',
    textColor: '#FFFFFF',
    badgeClass: 'badge-standby',
    reason: depthKm > RISK_THRESHOLDS.DEPTH_DEEP_KM
      ? `Gempa dalam (${depthKm} km), energi teredam mantel bumi`
      : `Getaran ringan tanpa ancaman struktural (M ${mag.toFixed(1)})`
  };
}

export default {
  RISK_LEVELS,
  RISK_THRESHOLDS,
  parseDepth,
  parseMagnitude,
  hasTsunamiThreat,
  evaluateRisk,
};

