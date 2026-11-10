import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRisk, parseDepth, parseMagnitude, hasTsunamiThreat, RISK_LEVELS } from '../../resources/js/utils/riskEvaluator.js';

test('RiskEvaluator — Parsing helper functions', () => {
  assert.equal(parseMagnitude('5.2'), 5.2);
  assert.equal(parseMagnitude(6.5), 6.5);
  assert.equal(parseDepth('10 km'), 10);
  assert.equal(parseDepth('150.5 km'), 150.5);
  assert.equal(hasTsunamiThreat('Tidak berpotensi tsunami'), false);
  assert.equal(hasTsunamiThreat('Berpotensi TSUNAMI untuk wilayah pesisir'), true);
  assert.equal(hasTsunamiThreat('Waspada ancaman tsunami'), true);
});

test('RiskEvaluator — Evaluasi Skenario Bahaya Tinggi', async (t) => {
  await t.test('Gempa dengan potensi tsunami adalah Bahaya Tinggi', () => {
    const res = evaluateRisk({
      magnitude: '5.4',
      depth: '10 km',
      potensi: 'Berpotensi tsunami',
    });
    assert.equal(res.level, RISK_LEVELS.DANGER);
    assert.equal(res.label, 'Bahaya Tinggi');
  });

  await t.test('Gempa magnitudo major (M >= 7.0) adalah Bahaya Tinggi', () => {
    const res = evaluateRisk({
      magnitude: '7.2',
      depth: '80 km',
      potensi: 'Tidak berpotensi tsunami',
    });
    assert.equal(res.level, RISK_LEVELS.DANGER);
    assert.equal(res.label, 'Bahaya Tinggi');
  });

  await t.test('Gempa kuat dangkal (M 6.2, depth 15 km) adalah Bahaya Tinggi', () => {
    const res = evaluateRisk({
      magnitude: '6.2',
      depth: '15 km',
      potensi: 'Tidak berpotensi tsunami',
    });
    assert.equal(res.level, RISK_LEVELS.DANGER);
    assert.equal(res.label, 'Bahaya Tinggi');
  });

  await t.test('Gempa dengan skala dirasakan MMI VI ke atas adalah Bahaya Tinggi', () => {
    const res = evaluateRisk({
      magnitude: '5.6',
      depth: '10 km',
      dirasakan: 'VI Cianjur, IV Sukabumi',
      potensi: 'Tidak berpotensi tsunami',
    });
    assert.equal(res.level, RISK_LEVELS.DANGER);
    assert.equal(res.label, 'Bahaya Tinggi');
  });
});

test('RiskEvaluator — Evaluasi Skenario Waspada', async (t) => {
  await t.test('Gempa sedang dangkal (M 5.3, depth 10 km) adalah Waspada', () => {
    const res = evaluateRisk({
      magnitude: '5.3',
      depth: '10 km',
      potensi: 'Tidak berpotensi tsunami',
    });
    assert.equal(res.level, RISK_LEVELS.WARNING);
    assert.equal(res.label, 'Waspada');
  });

  await t.test('Gempa kuat kedalaman menengah (M 6.3, depth 120 km) adalah Waspada', () => {
    const res = evaluateRisk({
      magnitude: '6.3',
      depth: '120 km',
      potensi: 'Tidak berpotensi tsunami',
    });
    assert.equal(res.level, RISK_LEVELS.WARNING);
    assert.equal(res.label, 'Waspada');
  });

  await t.test('Gempa M 4.8 dirasakan skala IV MMI adalah Waspada', () => {
    const res = evaluateRisk({
      magnitude: '4.8',
      depth: '10 km',
      dirasakan: 'IV Banda Aceh, III Sabang',
      potensi: 'Tidak berpotensi tsunami',
    });
    assert.equal(res.level, RISK_LEVELS.WARNING);
    assert.equal(res.label, 'Waspada');
  });
});

test('RiskEvaluator — Evaluasi Skenario Siaga', async (t) => {
  await t.test('Gempa kecil (M 3.8, depth 10 km) adalah Siaga', () => {
    const res = evaluateRisk({
      magnitude: '3.8',
      depth: '10 km',
      potensi: 'Tidak berpotensi tsunami',
    });
    assert.equal(res.level, RISK_LEVELS.STANDBY);
    assert.equal(res.label, 'Siaga');
  });

  await t.test('Gempa sangat dalam (M 5.8, depth 450 km) energi teredam adalah Siaga', () => {
    const res = evaluateRisk({
      magnitude: '5.8',
      depth: '450 km',
      potensi: 'Tidak berpotensi tsunami',
    });
    assert.equal(res.level, RISK_LEVELS.STANDBY);
    assert.equal(res.label, 'Siaga');
  });
});

