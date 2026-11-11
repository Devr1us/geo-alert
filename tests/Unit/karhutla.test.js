import { test, describe } from 'node:test';
import assert from 'node:assert';

// Haversine distance
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Status evaluator
function evaluateKarhutlaStatus(cluster) {
  const count = cluster.length;
  const maxFrp = Math.max(...cluster.map(p => p.frp));
  const hasHighConf = cluster.some(p => p.confidence === 'h' || p.confidence === 'high');
  const hasNominalConf = cluster.some(p => p.confidence === 'n' || p.confidence === 'nominal');

  if ((hasHighConf && maxFrp >= 30) || count >= 10) {
    return { status: 'Bahaya Tinggi', risk: 'danger' };
  }
  if (((hasHighConf || hasNominalConf) && maxFrp >= 10) || (count >= 3 && count <= 9)) {
    return { status: 'Waspada', risk: 'warning' };
  }
  return { status: 'Siaga', risk: 'standby' };
}

describe('Karhutla Status & Clustering Logic', () => {
  test('Status Bahaya Tinggi jika FRP >= 30 MW dan confidence high', () => {
    const cluster = [{ frp: 35, confidence: 'h' }];
    const res = evaluateKarhutlaStatus(cluster);
    assert.strictEqual(res.status, 'Bahaya Tinggi');
    assert.strictEqual(res.risk, 'danger');
  });

  test('Status Bahaya Tinggi jika cluster >= 10 titik panas', () => {
    const cluster = Array.from({ length: 12 }, () => ({ frp: 5, confidence: 'n' }));
    const res = evaluateKarhutlaStatus(cluster);
    assert.strictEqual(res.status, 'Bahaya Tinggi');
    assert.strictEqual(res.risk, 'danger');
  });

  test('Status Waspada jika cluster 3-9 titik atau FRP 10-30 MW', () => {
    const cluster1 = [{ frp: 15, confidence: 'n' }];
    assert.strictEqual(evaluateKarhutlaStatus(cluster1).status, 'Waspada');

    const cluster2 = [{ frp: 3, confidence: 'n' }, { frp: 2, confidence: 'n' }, { frp: 2, confidence: 'n' }];
    assert.strictEqual(evaluateKarhutlaStatus(cluster2).status, 'Waspada');
  });

  test('Status Siaga untuk titik tunggal kecil (< 10 MW)', () => {
    const cluster = [{ frp: 4.5, confidence: 'n' }];
    const res = evaluateKarhutlaStatus(cluster);
    assert.strictEqual(res.status, 'Siaga');
    assert.strictEqual(res.risk, 'standby');
  });

  test('Hitung jarak haversine akurat (Merauke ke Jayapura ~650km)', () => {
    const d = distanceKm(-8.4991, 140.4011, -2.5337, 140.7181);
    assert.ok(d > 600 && d < 700);
  });
});

