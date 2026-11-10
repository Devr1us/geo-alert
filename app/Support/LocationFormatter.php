<?php

namespace App\Support;

class LocationFormatter
{
    /**
     * Kamus singkatan provinsi BMKG ke nama lengkap
     */
    public const PROVINCE_MAP = [
        'PAPUABRT'   => 'Papua Barat',
        'PAPUA-BRT'  => 'Papua Barat',
        'PAPUABARAT' => 'Papua Barat',
        'PAPUABRTDY' => 'Papua Barat Daya',
        'PAPUABDAYA' => 'Papua Barat Daya',
        'PAPUA-BDY'  => 'Papua Barat Daya',
        'PAPUABARATDAYA' => 'Papua Barat Daya',
        'PAPUA'      => 'Papua',
        'PAPUASLT'   => 'Papua Selatan',
        'PAPUATGH'   => 'Papua Tengah',
        'PAPUABDG'   => 'Papua Pegunungan',
        'SULUT'      => 'Sulawesi Utara',
        'SULTENG'    => 'Sulawesi Tengah',
        'SULSEL'     => 'Sulawesi Selatan',
        'SULTRA'     => 'Sulawesi Tenggara',
        'SULBAR'     => 'Sulawesi Barat',
        'GORONTALO'  => 'Gorontalo',
        'JABAR'      => 'Jawa Barat',
        'JATENG'     => 'Jawa Tengah',
        'JATIM'      => 'Jawa Timur',
        'BANTEN'     => 'Banten',
        'DKI'        => 'DKI Jakarta',
        'DKI-JAKARTA'=> 'DKI Jakarta',
        'JAKARTA'    => 'DKI Jakarta',
        'DIY'        => 'D.I. Yogyakarta',
        'DI-YOGYAKARTA' => 'D.I. Yogyakarta',
        'YOGYAKARTA' => 'D.I. Yogyakarta',
        'ACEH'       => 'Aceh',
        'NAD'        => 'Aceh',
        'SUMUT'      => 'Sumatera Utara',
        'SUMBAR'     => 'Sumatera Barat',
        'SUMSEL'     => 'Sumatera Selatan',
        'RIAU'       => 'Riau',
        'KEPRI'      => 'Kepulauan Riau',
        'KEP-RIAU'   => 'Kepulauan Riau',
        'JAMBI'      => 'Jambi',
        'BENGKULU'   => 'Bengkulu',
        'LAMPUNG'    => 'Lampung',
        'BABEL'      => 'Kep. Bangka Belitung',
        'BANGKA-BELITUNG' => 'Kep. Bangka Belitung',
        'BALI'       => 'Bali',
        'NTB'        => 'Nusa Tenggara Barat',
        'NTT'        => 'Nusa Tenggara Timur',
        'KALBAR'     => 'Kalimantan Barat',
        'KALTENG'    => 'Kalimantan Tengah',
        'KALSEL'     => 'Kalimantan Selatan',
        'KALTIM'     => 'Kalimantan Timur',
        'KALTARA'    => 'Kalimantan Utara',
        'MALUT'      => 'Maluku Utara',
        'MALUKU'     => 'Maluku',
    ];

    /**
     * Format lokasi mentah dari BMKG
     */
    public static function format(?string $raw): string
    {
        if (!$raw || trim($raw) === '') {
            return '-';
        }

        $cleaned = trim($raw);

        // 1. Pisahkan arah mata angin gabungan
        $windDirections = [
            '/\bBaratLaut\b/i'      => 'Barat Laut',
            '/\bBaratDaya\b/i'      => 'Barat Daya',
            '/\bTimurLaut\b/i'      => 'Timur Laut',
            '/\bTimurTenggara\b/i'  => 'Timur Tenggara',
            '/\bBaratTenggara\b/i'  => 'Barat Tenggara',
            '/\bSelatanDaya\b/i'    => 'Selatan Daya',
            '/\bTenggara\b/i'       => 'Tenggara',
        ];

        foreach ($windDirections as $pattern => $replacement) {
            $cleaned = preg_replace($pattern, $replacement, $cleaned);
        }

        // 2. Deteksi pola "X km [Arah] [WILAYAH]"
        $prefixRegex = '/^(.*?\b\d+\s*km\s+(?:Barat\s+Laut|Barat\s+Daya|Timur\s+Laut|Tenggara|Barat|Timur|Selatan|Utara)\s+)(.+)$/i';
        if (preg_match($prefixRegex, $cleaned, $matches)) {
            $prefix = trim($matches[1]);
            $region = self::formatRegionPart($matches[2]);
            return "{$prefix} {$region}";
        }

        return self::formatRegionPart($cleaned);
    }

    /**
     * Format bagian wilayah/daerah
     */
    private static function formatRegionPart(string $regionPart): string
    {
        $tokens = explode('-', trim($regionPart));
        $province = '';
        $workingTokens = $tokens;

        if (count($tokens) > 1) {
            $lastToken = strtoupper(trim(end($tokens)));
            if (isset(self::PROVINCE_MAP[$lastToken])) {
                $province = self::PROVINCE_MAP[$lastToken];
                array_pop($workingTokens);
            }
        }

        $formattedMain = [];
        foreach ($workingTokens as $token) {
            $upper = strtoupper(trim($token));
            if ($upper === 'KAB' || $upper === 'KABUPATEN') {
                $formattedMain[] = 'Kab.';
            } elseif ($upper === 'KOTA') {
                $formattedMain[] = 'Kota';
            } elseif ($upper === 'KEP' || $upper === 'KEPULAUAN') {
                $formattedMain[] = 'Kep.';
            } else {
                $formattedMain[] = self::toTitleCase($token);
            }
        }

        $mainText = trim(implode(' ', array_filter($formattedMain)));

        if ($province !== '') {
            return $mainText !== '' ? "{$mainText}, {$province}" : $province;
        }

        return $mainText !== '' ? $mainText : self::toTitleCase($regionPart);
    }

    /**
     * Konversi string ke Title Case
     */
    public static function toTitleCase(string $str): string
    {
        return mb_convert_case(mb_strtolower(trim($str)), MB_CASE_TITLE, 'UTF-8');
    }
}

