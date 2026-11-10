<?php

namespace App\Support;

class RiskEvaluator
{
    public const LEVEL_DANGER  = 'danger';
    public const LEVEL_WARNING = 'warning';
    public const LEVEL_STANDBY = 'standby';

    public const THRESHOLD_MAGNITUDE_MAJOR    = 7.0;
    public const THRESHOLD_MAGNITUDE_STRONG   = 6.0;
    public const THRESHOLD_MAGNITUDE_MODERATE = 5.0;
    public const THRESHOLD_DEPTH_SHALLOW_KM   = 50;
    public const THRESHOLD_DEPTH_DEEP_KM      = 300;

    /**
     * Evaluasi tingkat risiko gempa bumi
     */
    public static function evaluate(array $data): array
    {
        $type       = $data['type'] ?? 'gempa';
        $magnitude  = self::parseMagnitude($data['magnitude'] ?? 0);
        $depthKm    = self::parseDepth($data['depth'] ?? $data['kedalaman'] ?? 10);
        $potensi    = $data['potensi'] ?? '';
        $dirasakan  = $data['dirasakan'] ?? '';

        $isEarthquake = str_contains(strtolower($type), 'gempa');
        if (!$isEarthquake) {
            return [
                'level'      => self::LEVEL_STANDBY,
                'label'      => 'Siaga',
                'color'      => '#4A90D9',
                'badge_class'=> 'badge-standby',
                'reason'     => 'Pemantauan berkala non-gempa',
            ];
        }

        $isTsunami = self::hasTsunamiThreat($potensi);

        $maxMmi = self::parseMaxMMI($dirasakan);

        // 1. Bahaya Tinggi
        if ($isTsunami) {
            return [
                'level'      => self::LEVEL_DANGER,
                'label'      => 'Bahaya Tinggi',
                'color'      => '#C0492B',
                'badge_class'=> 'badge-danger',
                'reason'     => 'Peringatan dini potensi tsunami dari BMKG',
            ];
        }

        if ($magnitude >= self::THRESHOLD_MAGNITUDE_MAJOR) {
            return [
                'level'      => self::LEVEL_DANGER,
                'label'      => 'Bahaya Tinggi',
                'color'      => '#C0492B',
                'badge_class'=> 'badge-danger',
                'reason'     => "Magnitudo mayor (M {$magnitude}) berpotensi destruktif",
            ];
        }

        if ($magnitude >= self::THRESHOLD_MAGNITUDE_STRONG && $depthKm <= self::THRESHOLD_DEPTH_SHALLOW_KM) {
            return [
                'level'      => self::LEVEL_DANGER,
                'label'      => 'Bahaya Tinggi',
                'color'      => '#C0492B',
                'badge_class'=> 'badge-danger',
                'reason'     => "Gempa kuat dangkal (M {$magnitude}, {$depthKm} km)",
            ];
        }

        if ($maxMmi >= 6) {
            return [
                'level'      => self::LEVEL_DANGER,
                'label'      => 'Bahaya Tinggi',
                'color'      => '#C0492B',
                'badge_class'=> 'badge-danger',
                'reason'     => "Getaran gempa dirasakan kuat (Skala MMI {$maxMmi}) berpotensi merusak bangunan",
            ];
        }

        // 2. Waspada
        if ($magnitude >= self::THRESHOLD_MAGNITUDE_STRONG && $depthKm <= self::THRESHOLD_DEPTH_DEEP_KM) {
            return [
                'level'      => self::LEVEL_WARNING,
                'label'      => 'Waspada',
                'color'      => '#F57C00',
                'badge_class'=> 'badge-warning',
                'reason'     => "Gempa kuat kedalaman menengah (M {$magnitude}, {$depthKm} km)",
            ];
        }

        if ($magnitude >= self::THRESHOLD_MAGNITUDE_MODERATE && $depthKm <= self::THRESHOLD_DEPTH_SHALLOW_KM) {
            return [
                'level'      => self::LEVEL_WARNING,
                'label'      => 'Waspada',
                'color'      => '#F57C00',
                'badge_class'=> 'badge-warning',
                'reason'     => "Gempa sedang dangkal (M {$magnitude}, {$depthKm} km)",
            ];
        }

        if ($maxMmi >= 3 && $maxMmi <= 5) {
            return [
                'level'      => self::LEVEL_WARNING,
                'label'      => 'Waspada',
                'color'      => '#F57C00',
                'badge_class'=> 'badge-warning',
                'reason'     => "Gempa dirasakan nyata di daratan (Skala MMI {$maxMmi})",
            ];
        }

        // 3. Siaga
        return [
            'level'      => self::LEVEL_STANDBY,
            'label'      => 'Siaga',
            'color'      => '#0E2A5C',
            'badge_class'=> 'badge-standby',
            'reason'     => $depthKm > self::THRESHOLD_DEPTH_DEEP_KM
                ? "Gempa dalam ({$depthKm} km), energi teredam"
                : ($maxMmi > 0 ? "Getaran ringan tercatat (Skala MMI {$maxMmi})" : "Getaran ringan tanpa ancaman struktural (M {$magnitude})"),
        ];
    }

    public static function parseMaxMMI(mixed $dirasakan): int
    {
        if (!is_string($dirasakan) || trim($dirasakan) === '') {
            return 0;
        }

        $mmiValues = [
            'xii' => 12, 'xi' => 11, 'x' => 10, 'ix' => 9, 'viii' => 8, 'vii' => 7,
            'vi' => 6, 'v' => 5, 'iv' => 4, 'iii' => 3, 'ii' => 2, 'i' => 1
        ];

        if (!preg_match_all('/\b(xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)\b/i', $dirasakan, $matches)) {
            return 0;
        }

        $max = 0;
        foreach ($matches[1] as $m) {
            $val = $mmiValues[strtolower($m)] ?? 0;
            if ($val > $max) {
                $max = $val;
            }
        }
        return $max;
    }

    public static function parseMagnitude(mixed $mag): float
    {
        if (is_numeric($mag)) {
            return (float) $mag;
        }
        if (is_string($mag) && preg_match('/(\d+(?:\.\d+)?)/', $mag, $m)) {
            return (float) $m[1];
        }
        return 0.0;
    }

    public static function parseDepth(mixed $depth): float
    {
        if (is_numeric($depth)) {
            return (float) $depth;
        }
        if (is_string($depth) && preg_match('/(\d+(?:\.\d+)?)/', $depth, $m)) {
            return (float) $m[1];
        }
        return 10.0;
    }

    public static function hasTsunamiThreat(?string $potensi): bool
    {
        if (!$potensi) return false;
        $lower = strtolower($potensi);
        if (str_contains($lower, 'tidak berpotensi')) return false;
        return str_contains($lower, 'tsunami');
    }
}

