import test from 'node:test';
import assert from 'node:assert/strict';
import { formatLocation, toTitleCase } from '../../resources/js/utils/locationFormatter.js';

test('LocationFormatter — Mengubah Title Case dasar', () => {
  assert.equal(toTitleCase('JAKARTA UTARA'), 'Jakarta Utara');
  assert.equal(toTitleCase('cianjur'), 'Cianjur');
});

test('LocationFormatter — Minimal 10 Contoh Riil BMKG', async (t) => {
  // Contoh 1: Arah mata angin gabungan "BaratLaut" & singkatan "PAPUABRT"
  await t.test('1. 69 km BaratLaut KEBARMANOKWARI-PAPUABRT', () => {
    const raw = '69 km BaratLaut KEBARMANOKWARI-PAPUABRT';
    const result = formatLocation(raw);
    assert.equal(result, '69 km Barat Laut Kebarmanokwari, Papua Barat');
  });

  // Contoh 2: Arah mata angin gabungan "BaratDaya" & singkatan "SUMUT"
  await t.test('2. 128 km BaratDaya KAWASAN-SUMUT', () => {
    const raw = '128 km BaratDaya KAWASAN-SUMUT';
    const result = formatLocation(raw);
    assert.equal(result, '128 km Barat Daya Kawasan, Sumatera Utara');
  });

  // Contoh 3: Pusat gempa di darat & prefix "KAB-"
  await t.test('3. Pusat gempa berada di darat 14 km BaratDaya KAB-BOGOR', () => {
    const raw = 'Pusat gempa berada di darat 14 km BaratDaya KAB-BOGOR';
    const result = formatLocation(raw);
    assert.equal(result, 'Pusat gempa berada di darat 14 km Barat Daya Kab. Bogor');
  });

  // Contoh 4: Arah mata angin "Tenggara" & singkatan "JABAR"
  await t.test('4. 25 km Tenggara CIANJUR-JABAR', () => {
    const raw = '25 km Tenggara CIANJUR-JABAR';
    const result = formatLocation(raw);
    assert.equal(result, '25 km Tenggara Cianjur, Jawa Barat');
  });

  // Contoh 5: Arah mata angin gabungan "TimurLaut" & singkatan "PAPUA"
  await t.test('5. 10 km TimurLaut JAYAPURA-PAPUA', () => {
    const raw = '10 km TimurLaut JAYAPURA-PAPUA';
    const result = formatLocation(raw);
    assert.equal(result, '10 km Timur Laut Jayapura, Papua');
  });

  // Contoh 6: Wilayah DIY
  await t.test('6. 45 km BaratDaya BANTUL-DIY', () => {
    const raw = '45 km BaratDaya BANTUL-DIY';
    const result = formatLocation(raw);
    assert.equal(result, '45 km Barat Daya Bantul, D.I. Yogyakarta');
  });

  // Contoh 7: Prefix KAB-SUKABUMI tanpa provinsi
  await t.test('7. 82 km BaratDaya KAB-SUKABUMI', () => {
    const raw = '82 km BaratDaya KAB-SUKABUMI';
    const result = formatLocation(raw);
    assert.equal(result, '82 km Barat Daya Kab. Sukabumi');
  });

  // Contoh 8: Multi-kata wilayah & singkatan "SULTRA"
  await t.test('8. Pusat gempa berada di laut 55 km BaratDaya KONAWE-SULTRA', () => {
    const raw = 'Pusat gempa berada di laut 55 km BaratDaya KONAWE-SULTRA';
    const result = formatLocation(raw);
    assert.equal(result, 'Pusat gempa berada di laut 55 km Barat Daya Konawe, Sulawesi Tenggara');
  });

  // Contoh 9: Prefix KOTA-BIMA & singkatan "NTB"
  await t.test('9. 17 km BaratLaut KOTA-BIMA-NTB', () => {
    const raw = '17 km BaratLaut KOTA-BIMA-NTB';
    const result = formatLocation(raw);
    assert.equal(result, '17 km Barat Laut Kota Bima, Nusa Tenggara Barat');
  });

  // Contoh 10: Prefix KEP-TALAUD & singkatan "SULUT"
  await t.test('10. 102 km TimurLaut KEP-TALAUD-SULUT', () => {
    const raw = '102 km TimurLaut KEP-TALAUD-SULUT';
    const result = formatLocation(raw);
    assert.equal(result, '102 km Timur Laut Kep. Talaud, Sulawesi Utara');
  });

  // Contoh 11: Multi-kata LUWU-TIMUR & singkatan "SULSEL"
  await t.test('11. 29 km BaratLaut LUWU-TIMUR-SULSEL', () => {
    const raw = '29 km BaratLaut LUWU-TIMUR-SULSEL';
    const result = formatLocation(raw);
    assert.equal(result, '29 km Barat Laut Luwu Timur, Sulawesi Selatan');
  });

  // Contoh 12: Nama kota dan provinsi sama
  await t.test('12. 65 km BaratDaya BENGKULU-BENGKULU', () => {
    const raw = '65 km BaratDaya BENGKULU-BENGKULU';
    const result = formatLocation(raw);
    assert.equal(result, '65 km Barat Daya Bengkulu, Bengkulu');
  });
});

test('LocationFormatter — Fallback aman pada input tidak terduga', () => {
  assert.equal(formatLocation(''), '-');
  assert.equal(formatLocation(null), '-');
  assert.equal(formatLocation(undefined), '-');
  assert.equal(formatLocation('WILAYAH ACAP'), 'Wilayah Acap');
});

