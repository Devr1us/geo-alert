<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Support\RegencyLookup;
use Carbon\Carbon;

class KarhutlaService
{
    private const CACHE_KEY = 'karhutla:events';
    private const CACHE_LAST_FETCH = 'karhutla:last_fetch_ts';
    private const CACHE_TTL_SECONDS = 1200; // 20 menit
    private const MIN_REFRESH_INTERVAL_SECONDS = 300; // 5 menit

    private const INDONESIA_BBOX = '95,-11,141,6';
    private const DAY_RANGE = 2;

    private ?array $geoJsonData = null;

    /**
     * Dapatkan data karhutla (dari cache atau fetch NASA FIRMS)
     */
    public function getKarhutlaData(bool $forceRefresh = false): array
    {
        $cached = Cache::get(self::CACHE_KEY);

        // Jika ada cache dan tidak forceRefresh, langsung kembalikan
        if ($cached && !$forceRefresh) {
            return $cached;
        }

        // Jika forceRefresh tapi belum lewat 5 menit sejak fetch terakhir, kembalikan cache
        $lastFetch = Cache::get(self::CACHE_LAST_FETCH);
        if ($cached && $forceRefresh && $lastFetch && (time() - $lastFetch < self::MIN_REFRESH_INTERVAL_SECONDS)) {
            return $cached;
        }

        // Coba fetch data baru dari NASA FIRMS
        try {
            $freshData = $this->fetchFromFirms();
            Cache::put(self::CACHE_KEY, $freshData, self::CACHE_TTL_SECONDS);
            Cache::put(self::CACHE_LAST_FETCH, time(), self::CACHE_TTL_SECONDS);
            return $freshData;
        } catch (\Throwable $e) {
            Log::warning('[KarhutlaService] Gagal fetch FIRMS: ' . $e->getMessage());

            // Error handling: jika ada cache sebelumnya, kembalikan dengan flag stale: true
            if ($cached) {
                $cached['stale'] = true;
                $cached['notice'] = 'Menggunakan data tersimpan (stale) karena API FIRMS sedang tidak dapat diakses.';
                return $cached;
            }

            // Jika sama sekali tidak ada cache
            return [
                'updated_at' => Carbon::now('Asia/Jakarta')->format('d M Y H:i:s \W\I\B'),
                'stale' => true,
                'source' => 'NASA FIRMS (VIIRS)',
                'total_titik' => 0,
                'events' => [],
                'error' => 'Gagal mengambil data dari NASA FIRMS: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Fetch langsung dari NASA FIRMS endpoint area CSV
     */
    private function fetchFromFirms(): array
    {
        $key = env('FIRMS_MAP_KEY');
        if (!$key || trim($key) === '') {
            throw new \RuntimeException('FIRMS_MAP_KEY belum disetel di file .env');
        }

        $sources = ['VIIRS_SNPP_NRT', 'VIIRS_NOAA20_NRT', 'VIIRS_NOAA21_NRT'];
        $rawPoints = [];

        foreach ($sources as $source) {
            $url = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/{$key}/{$source}/" . self::INDONESIA_BBOX . '/' . self::DAY_RANGE;

            try {
                $response = Http::timeout(15)
                    ->retry(2, 500)
                    ->withHeaders([
                        'User-Agent' => 'GeoAlert/1.0 (+https://geoalert.id)',
                    ])
                    ->get($url);

                if ($response->successful()) {
                    $body = trim($response->body());
                    $points = $this->parseCsv($body, $source);
                    $rawPoints = array_merge($rawPoints, $points);
                } else {
                    Log::info("[KarhutlaService] Source {$source} mengembalikan status " . $response->status());
                }
            } catch (\Throwable $err) {
                Log::warning("[KarhutlaService] Error mengambil {$source}: " . $err->getMessage());
            }
        }

        if (empty($rawPoints) && !Cache::has(self::CACHE_KEY)) {
            // Bisa jadi memang tidak ada titik panas aktif dalam 48 jam terakhir
            Log::info('[KarhutlaService] Tidak ada titik panas aktif terdeteksi.');
        }

        // 1. Deduplikasi
        $deduped = $this->deduplicatePoints($rawPoints);

        // 2. Filter (buang confidence low / frp < 1)
        $filtered = $this->filterPoints($deduped);

        // 3. Clustering (radius 10 km)
        $events = $this->clusterPoints($filtered);

        return [
            'updated_at' => Carbon::now('Asia/Jakarta')->format('d M Y H:i:s \W\I\B'),
            'stale' => false,
            'source' => 'NASA FIRMS (VIIRS)',
            'total_titik' => count($filtered),
            'events' => $events,
        ];
    }

    /**
     * Parse CSV dari FIRMS
     */
    public function parseCsv(string $csvContent, string $sourceSatellite): array
    {
        $lines = preg_split('/\r\n|\r|\n/', trim($csvContent));
        if (count($lines) <= 1) {
            return [];
        }

        $header = str_getcsv(array_shift($lines));
        $headerMap = array_flip($header);

        $points = [];
        foreach ($lines as $line) {
            if (empty(trim($line))) continue;
            $row = str_getcsv($line);
            if (count($row) < 5) continue;

            $lat = isset($headerMap['latitude']) ? (float)$row[$headerMap['latitude']] : null;
            $lon = isset($headerMap['longitude']) ? (float)$row[$headerMap['longitude']] : null;
            $date = isset($headerMap['acq_date']) ? trim($row[$headerMap['acq_date']]) : '';
            $time = isset($headerMap['acq_time']) ? trim($row[$headerMap['acq_time']]) : '';
            $confidence = isset($headerMap['confidence']) ? strtolower(trim($row[$headerMap['confidence']])) : 'n';
            $frp = isset($headerMap['frp']) ? (float)$row[$headerMap['frp']] : 0.0;
            $satellite = isset($headerMap['satellite']) ? trim($row[$headerMap['satellite']]) : $sourceSatellite;
            $daynight = isset($headerMap['daynight']) ? trim($row[$headerMap['daynight']]) : 'D';
            $brightTi4 = isset($headerMap['bright_ti4']) ? (float)$row[$headerMap['bright_ti4']] : null;

            if ($lat === null || $lon === null || empty($date)) {
                continue;
            }

            // Konversi waktu UTC ke WIB
            $timeWib = $this->utcToWib($date, $time);

            $points[] = [
                'lat' => $lat,
                'lon' => $lon,
                'acq_date' => $date,
                'acq_time' => $time,
                'time_wib' => $timeWib,
                'confidence' => $confidence,
                'frp' => $frp,
                'satellite' => $satellite,
                'daynight' => $daynight,
                'bright_ti4' => $brightTi4,
            ];
        }

        return $points;
    }

    /**
     * Konversi tanggal & jam UTC FIRMS ke format WIB
     */
    public function utcToWib(string $dateStr, string $timeStr): string
    {
        // timeStr format HHMM, misal "427" -> "04:27", "1350" -> "13:50"
        $padded = str_pad($timeStr, 4, '0', STR_PAD_LEFT);
        $hour = substr($padded, 0, 2);
        $min = substr($padded, 2, 2);

        try {
            $dtUtc = Carbon::createFromFormat('Y-m-d H:i', "{$dateStr} {$hour}:{$min}", 'UTC');
            $dtWib = $dtUtc->copy()->setTimezone('Asia/Jakarta');
            return $dtWib->format('d M Y H:i:s \W\I\B');
        } catch (\Throwable $e) {
            return "{$dateStr} {$hour}:{$min} WIB";
        }
    }

    /**
     * Hapus titik duplikat (jarak < 0.005 derajat dengan waktu sama)
     */
    public function deduplicatePoints(array $points): array
    {
        $unique = [];
        foreach ($points as $p) {
            $isDuplicate = false;
            foreach ($unique as $u) {
                if ($p['acq_date'] === $u['acq_date'] && $p['acq_time'] === $u['acq_time']) {
                    $dLat = abs($p['lat'] - $u['lat']);
                    $dLon = abs($p['lon'] - $u['lon']);
                    if ($dLat < 0.005 && $dLon < 0.005) {
                        $isDuplicate = true;
                        break;
                    }
                }
            }
            if (!$isDuplicate) {
                $unique[] = $p;
            }
        }
        return $unique;
    }

    /**
     * Filter: buang confidence 'low'/'l' dan frp < 1.0 MW
     */
    public function filterPoints(array $points): array
    {
        return array_values(array_filter($points, function ($p) {
            // Confidence low
            if ($p['confidence'] === 'low' || $p['confidence'] === 'l') {
                return false;
            }
            // FRP sangat kecil (< 1.0 MW)
            if ($p['frp'] < 1.0) {
                return false;
            }
            return true;
        }));
    }

    /**
     * Kelompokkan titik berjarak <= 10 km menjadi cluster kejadian karhutla
     */
    public function clusterPoints(array $points): array
    {
        if (empty($points)) {
            return [];
        }

        $visited = array_fill(0, count($points), false);
        $clusters = [];

        for ($i = 0; $i < count($points); $i++) {
            if ($visited[$i]) continue;

            $clusterPoints = [$points[$i]];
            $visited[$i] = true;

            // Kumpulkan semua titik dalam radius 10 km
            for ($j = $i + 1; $j < count($points); $j++) {
                if ($visited[$j]) continue;

                $dist = RegencyLookup::distanceKm(
                    $points[$i]['lat'], $points[$i]['lon'],
                    $points[$j]['lat'], $points[$j]['lon']
                );

                if ($dist <= 10.0) {
                    $clusterPoints[] = $points[$j];
                    $visited[$j] = true;
                }
            }

            $clusters[] = $clusterPoints;
        }

        // Format tiap cluster menjadi objek kejadian
        $events = [];
        $idCounter = 1;

        foreach ($clusters as $cPoints) {
            $count = count($cPoints);
            $sumLat = 0.0;
            $sumLon = 0.0;
            $totalFrp = 0.0;
            $maxFrp = 0.0;
            $hasHighConf = false;
            $hasNominalConf = false;
            $latestTime = $cPoints[0]['time_wib'];
            $maxRadiusKm = 5.0; // minimal 5 km

            $pointsFormatted = [];
            foreach ($cPoints as $pt) {
                $sumLat += $pt['lat'];
                $sumLon += $pt['lon'];
                $totalFrp += $pt['frp'];
                if ($pt['frp'] > $maxFrp) $maxFrp = $pt['frp'];
                if ($pt['confidence'] === 'high' || $pt['confidence'] === 'h') $hasHighConf = true;
                if ($pt['confidence'] === 'nominal' || $pt['confidence'] === 'n') $hasNominalConf = true;
                $latestTime = $pt['time_wib']; // Ambil waktu paling mutakhir

                $pointsFormatted[] = [
                    'lat' => $pt['lat'],
                    'lon' => $pt['lon'],
                    'confidence' => $pt['confidence'],
                    'frp' => round($pt['frp'], 2),
                    'satelit' => $pt['satellite'],
                    'waktu' => $pt['time_wib'],
                ];
            }

            $centerLat = $sumLat / $count;
            $centerLon = $sumLon / $count;

            // Hitung sebaran terjauh dari pusat untuk radius lingkaran
            foreach ($cPoints as $pt) {
                $d = RegencyLookup::distanceKm($centerLat, $centerLon, $pt['lat'], $pt['lon']);
                if ($d > $maxRadiusKm) {
                    $maxRadiusKm = $d;
                }
            }

            // Tentukan status risiko
            // - Bahaya Tinggi: confidence high DAN frp >= 30, ATAU cluster >= 10 titik
            // - Waspada: confidence nominal/high dengan frp 10-30, ATAU cluster 3-9 titik
            // - Siaga: sisanya
            if (($hasHighConf && $maxFrp >= 30.0) || $count >= 10) {
                $status = 'Bahaya Tinggi';
                $riskLevel = 'danger';
            } elseif ((($hasHighConf || $hasNominalConf) && $maxFrp >= 10.0) || ($count >= 3 && $count <= 9)) {
                $status = 'Waspada';
                $riskLevel = 'warning';
            } else {
                $status = 'Siaga';
                $riskLevel = 'standby';
            }

            // Saring: Hanya masukkan titik panas yang berisiko nyata karhutla (Waspada dan Bahaya Tinggi)
            // Titik panas biasa/tunggal berstatus Siaga diabaikan karena merupakan anomali termal minor/noise
            if ($riskLevel === 'standby') {
                continue;
            }

            // Cari nama wilayah (provinsi & kabupaten/kota)
            $wilayah = $this->determineRegion($centerLat, $centerLon);

            $events[] = [
                'id' => "karhutla-{$idCounter}",
                'jenis' => 'karhutla',
                'type' => 'Karhutla',
                'status' => $status,
                'risk' => $riskLevel,
                'lat' => round($centerLat, 5),
                'lon' => round($centerLon, 5),
                'radius_km' => round(max(5.0, $maxRadiusKm), 1),
                'jumlah_titik' => $count,
                'frp_total' => round($totalFrp, 1),
                'frp_max' => round($maxFrp, 1),
                'waktu' => $latestTime,
                'wilayah' => $wilayah,
                'location' => "{$wilayah['kabupaten']}, {$wilayah['provinsi']}",
                'titik' => $pointsFormatted,
            ];

            $idCounter++;
        }

        // Urutkan event berdasarkan FRP total atau jumlah titik menurun
        usort($events, function ($a, $b) {
            return $b['frp_total'] <=> $a['frp_total'];
        });

        return $events;
    }

    /**
     * Point in polygon menggunakan file GeoJSON provinsi batas administrasi
     */
    public function determineRegion(float $lat, float $lon): array
    {
        $province = $this->findProvincePointInPolygon($lon, $lat);

        if (!$province) {
            return [
                'provinsi' => 'Indonesia',
                'kabupaten' => sprintf('Koordinat %.2f, %.2f', $lat, $lon),
            ];
        }

        $kabupaten = RegencyLookup::findNearestRegency($lat, $lon, $province);

        return [
            'provinsi' => $province,
            'kabupaten' => $kabupaten,
        ];
    }

    /**
     * Point-in-polygon helper
     */
    private function findProvincePointInPolygon(float $lon, float $lat): ?string
    {
        if ($this->geoJsonData === null) {
            $path = storage_path('app/data/indonesia-provinsi.geojson');
            if (file_exists($path)) {
                $this->geoJsonData = json_decode(file_get_contents($path), true);
            } else {
                return null;
            }
        }

        if (!$this->geoJsonData || empty($this->geoJsonData['features'])) {
            return null;
        }

        foreach ($this->geoJsonData['features'] as $f) {
            $geom = $f['geometry'] ?? null;
            if (!$geom) continue;

            $state = $f['properties']['state'] ?? $f['properties']['Propinsi'] ?? $f['properties']['NAME_1'] ?? null;

            if ($geom['type'] === 'Polygon') {
                foreach ($geom['coordinates'] as $ring) {
                    if ($this->isPointInPoly([$lon, $lat], $ring)) {
                        return $state;
                    }
                }
            } elseif ($geom['type'] === 'MultiPolygon') {
                foreach ($geom['coordinates'] as $poly) {
                    foreach ($poly as $ring) {
                        if ($this->isPointInPoly([$lon, $lat], $ring)) {
                            return $state;
                        }
                    }
                }
            }
        }

        return null;
    }

    /**
     * Ray-casting algorithm
     */
    private function isPointInPoly(array $point, array $vs): bool
    {
        $x = $point[0];
        $y = $point[1];
        $inside = false;
        $count = count($vs);

        for ($i = 0, $j = $count - 1; $i < $count; $j = $i++) {
            $xi = $vs[$i][0];
            $yi = $vs[$i][1];
            $xj = $vs[$j][0];
            $yj = $vs[$j][1];

            $intersect = (($yi > $y) !== ($yj > $y)) &&
                ($x < ($xj - $xi) * ($y - $yi) / (($yj - $yi) ?: 0.0000000001) + $xi);
            if ($intersect) {
                $inside = !$inside;
            }
        }

        return $inside;
    }
}
