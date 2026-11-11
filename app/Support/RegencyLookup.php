<?php

namespace App\Support;

class RegencyLookup
{
    /**
     * Daftar koordinat pusat kabupaten/kota utama di Indonesia per provinsi
     */
    private static array $regencies = [
        // PAPUA & PAPUA SELATAN & PAPUA BARAT
        ['name' => 'Kab. Merauke', 'province' => 'Papua', 'lat' => -8.4991, 'lng' => 140.4011],
        ['name' => 'Kab. Mappi', 'province' => 'Papua', 'lat' => -6.5000, 'lng' => 139.3000],
        ['name' => 'Kab. Asmat', 'province' => 'Papua', 'lat' => -5.4000, 'lng' => 138.4000],
        ['name' => 'Kab. Boven Digoel', 'province' => 'Papua', 'lat' => -5.7500, 'lng' => 140.3000],
        ['name' => 'Kab. Jayapura', 'province' => 'Papua', 'lat' => -2.5915, 'lng' => 140.4578],
        ['name' => 'Kota Jayapura', 'province' => 'Papua', 'lat' => -2.5337, 'lng' => 140.7181],
        ['name' => 'Kab. Mimika', 'province' => 'Papua', 'lat' => -4.5467, 'lng' => 136.8837],
        ['name' => 'Kab. Nabire', 'province' => 'Papua', 'lat' => -3.3667, 'lng' => 135.4833],
        ['name' => 'Kab. Manokwari', 'province' => 'Papua Barat', 'lat' => -0.8615, 'lng' => 134.0620],
        ['name' => 'Kota Sorong', 'province' => 'Papua Barat', 'lat' => -0.8762, 'lng' => 131.2558],

        // RIAU & SUMATERA
        ['name' => 'Kab. Rokan Hilir', 'province' => 'Riau', 'lat' => 1.9667, 'lng' => 100.8167],
        ['name' => 'Kab. Bengkalis', 'province' => 'Riau', 'lat' => 1.4833, 'lng' => 102.1333],
        ['name' => 'Kab. Pelalawan', 'province' => 'Riau', 'lat' => 0.3500, 'lng' => 101.9000],
        ['name' => 'Kab. Siak', 'province' => 'Riau', 'lat' => 0.7972, 'lng' => 102.0489],
        ['name' => 'Kota Dumai', 'province' => 'Riau', 'lat' => 1.6667, 'lng' => 101.4500],
        ['name' => 'Kab. Indragiri Hilir', 'province' => 'Riau', 'lat' => -0.3333, 'lng' => 103.1667],
        ['name' => 'Kab. Indragiri Hulu', 'province' => 'Riau', 'lat' => -0.5500, 'lng' => 102.3167],
        ['name' => 'Kab. Kampar', 'province' => 'Riau', 'lat' => 0.3333, 'lng' => 101.0333],
        ['name' => 'Kota Pekanbaru', 'province' => 'Riau', 'lat' => 0.5071, 'lng' => 101.4478],

        // SUMATERA SELATAN & JAMBI
        ['name' => 'Kab. Ogan Komering Ilir', 'province' => 'Sumatera Selatan', 'lat' => -3.4000, 'lng' => 105.0000],
        ['name' => 'Kab. Banyuasin', 'province' => 'Sumatera Selatan', 'lat' => -2.8833, 'lng' => 104.3833],
        ['name' => 'Kab. Musi Banyuasin', 'province' => 'Sumatera Selatan', 'lat' => -2.8900, 'lng' => 103.8100],
        ['name' => 'Kab. Ogan Ilir', 'province' => 'Sumatera Selatan', 'lat' => -3.4333, 'lng' => 104.6500],
        ['name' => 'Kota Palembang', 'province' => 'Sumatera Selatan', 'lat' => -2.9761, 'lng' => 104.7754],
        ['name' => 'Kab. Muaro Jambi', 'province' => 'Jambi', 'lat' => -1.5333, 'lng' => 103.7833],
        ['name' => 'Kab. Tanjung Jabung Barat', 'province' => 'Jambi', 'lat' => -1.0500, 'lng' => 103.2000],
        ['name' => 'Kab. Tanjung Jabung Timur', 'province' => 'Jambi', 'lat' => -1.1500, 'lng' => 103.6167],
        ['name' => 'Kota Jambi', 'province' => 'Jambi', 'lat' => -1.6101, 'lng' => 103.6131],

        // KALIMANTAN BARAT
        ['name' => 'Kab. Kubu Raya', 'province' => 'Kalimantan Barat', 'lat' => -0.0167, 'lng' => 109.3333],
        ['name' => 'Kab. Ketapang', 'province' => 'Kalimantan Barat', 'lat' => -1.8500, 'lng' => 109.9833],
        ['name' => 'Kab. Sanggau', 'province' => 'Kalimantan Barat', 'lat' => 0.1167, 'lng' => 110.5833],
        ['name' => 'Kab. Sambas', 'province' => 'Kalimantan Barat', 'lat' => 1.3667, 'lng' => 109.3000],
        ['name' => 'Kab. Landak', 'province' => 'Kalimantan Barat', 'lat' => 0.4167, 'lng' => 109.7500],
        ['name' => 'Kab. Sintang', 'province' => 'Kalimantan Barat', 'lat' => 0.0667, 'lng' => 111.5000],
        ['name' => 'Kota Pontianak', 'province' => 'Kalimantan Barat', 'lat' => -0.0263, 'lng' => 109.3425],

        // KALIMANTAN TENGAH
        ['name' => 'Kab. Kotawaringin Barat', 'province' => 'Kalimantan Tengah', 'lat' => -2.4167, 'lng' => 111.7500],
        ['name' => 'Kab. Kotawaringin Timur', 'province' => 'Kalimantan Tengah', 'lat' => -2.0833, 'lng' => 112.7500],
        ['name' => 'Kab. Kapuas', 'province' => 'Kalimantan Tengah', 'lat' => -2.4833, 'lng' => 114.3833],
        ['name' => 'Kab. Pulang Pisau', 'province' => 'Kalimantan Tengah', 'lat' => -2.7500, 'lng' => 114.2500],
        ['name' => 'Kab. Katingan', 'province' => 'Kalimantan Tengah', 'lat' => -1.9000, 'lng' => 113.4000],
        ['name' => 'Kota Palangka Raya', 'province' => 'Kalimantan Tengah', 'lat' => -2.2077, 'lng' => 113.9165],

        // KALIMANTAN SELATAN & TIMUR & UTARA
        ['name' => 'Kab. Banjar', 'province' => 'Kalimantan Selatan', 'lat' => -3.3167, 'lng' => 114.9833],
        ['name' => 'Kab. Tanah Laut', 'province' => 'Kalimantan Selatan', 'lat' => -3.8833, 'lng' => 114.7500],
        ['name' => 'Kota Banjarmasin', 'province' => 'Kalimantan Selatan', 'lat' => -3.3167, 'lng' => 114.5900],
        ['name' => 'Kab. Kutai Kartanegara', 'province' => 'Kalimantan Timur', 'lat' => -0.4333, 'lng' => 117.0000],
        ['name' => 'Kab. Berau', 'province' => 'Kalimantan Timur', 'lat' => 2.0000, 'lng' => 117.3000],
        ['name' => 'Kota Samarinda', 'province' => 'Kalimantan Timur', 'lat' => -0.5022, 'lng' => 117.1536],
        ['name' => 'Kota Balikpapan', 'province' => 'Kalimantan Timur', 'lat' => -1.2379, 'lng' => 116.8289],
        ['name' => 'Kab. Bulungan', 'province' => 'Kalimantan Utara', 'lat' => 2.9000, 'lng' => 117.1000],

        // JAWA
        ['name' => 'Jakarta Pusat', 'province' => 'DKI Jakarta', 'lat' => -6.1805, 'lng' => 106.8284],
        ['name' => 'Kota Bandung', 'province' => 'Jawa Barat', 'lat' => -6.9175, 'lng' => 107.6191],
        ['name' => 'Kota Bogor', 'province' => 'Jawa Barat', 'lat' => -6.5971, 'lng' => 106.8060],
        ['name' => 'Kab. Garut', 'province' => 'Jawa Barat', 'lat' => -7.2279, 'lng' => 107.9087],
        ['name' => 'Kota Semarang', 'province' => 'Jawa Tengah', 'lat' => -6.9667, 'lng' => 110.4167],
        ['name' => 'Kota Surakarta', 'province' => 'Jawa Tengah', 'lat' => -7.5755, 'lng' => 110.8243],
        ['name' => 'Kota Yogyakarta', 'province' => 'D.I. Yogyakarta', 'lat' => -7.7956, 'lng' => 110.3695],
        ['name' => 'Kota Surabaya', 'province' => 'Jawa Timur', 'lat' => -7.2575, 'lng' => 112.7521],
        ['name' => 'Kab. Banyuwangi', 'province' => 'Jawa Timur', 'lat' => -8.2192, 'lng' => 114.3691],

        // BALI & NUSA TENGGARA
        ['name' => 'Kota Denpasar', 'province' => 'Bali', 'lat' => -8.6705, 'lng' => 115.2126],
        ['name' => 'Kota Mataram', 'province' => 'Nusa Tenggara Barat', 'lat' => -8.5833, 'lng' => 116.1167],
        ['name' => 'Kota Kupang', 'province' => 'Nusa Tenggara Timur', 'lat' => -10.1772, 'lng' => 123.6070],

        // SULAWESI & MALUKU
        ['name' => 'Kota Makassar', 'province' => 'Sulawesi Selatan', 'lat' => -5.1477, 'lng' => 119.4327],
        ['name' => 'Kota Manado', 'province' => 'Sulawesi Utara', 'lat' => 1.4748, 'lng' => 124.8428],
        ['name' => 'Kota Palu', 'province' => 'Sulawesi Tengah', 'lat' => -0.9003, 'lng' => 119.8779],
        ['name' => 'Kota Kendari', 'province' => 'Sulawesi Tenggara', 'lat' => -3.9985, 'lng' => 122.5126],
        ['name' => 'Kota Ambon', 'province' => 'Maluku', 'lat' => -3.6547, 'lng' => 128.1906],
        ['name' => 'Kota Ternate', 'province' => 'Maluku Utara', 'lat' => 0.7904, 'lng' => 127.3822],
    ];

    /**
     * Hitung jarak haversine (km)
     */
    public static function distanceKm(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // km
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }

    /**
     * Cari kabupaten terdekat dalam provinsi yang cocok
     */
    public static function findNearestRegency(float $lat, float $lon, ?string $province): string
    {
        $minDist = PHP_FLOAT_MAX;
        $bestName = null;

        // Filter kandidat yang provinsinya cocok terlebih dahulu
        $candidates = [];
        if ($province) {
            foreach (self::$regencies as $r) {
                if (stripos($r['province'], $province) !== false || stripos($province, $r['province']) !== false) {
                    $candidates[] = $r;
                }
            }
        }

        // Jika tidak ada kandidat provinsi, pakai semua
        if (empty($candidates)) {
            $candidates = self::$regencies;
        }

        foreach ($candidates as $c) {
            $d = self::distanceKm($lat, $lon, $c['lat'], $c['lng']);
            if ($d < $minDist) {
                $minDist = $d;
                $bestName = $c['name'];
            }
        }

        return $bestName ?? ($province ? "Wilayah {$province}" : sprintf('Koordinat %.2f, %.2f', $lat, $lon));
    }
}

